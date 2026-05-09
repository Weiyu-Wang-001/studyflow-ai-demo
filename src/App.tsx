import React, { useMemo, useState, useCallback } from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme, Dialog } from '@mui/material';
import { Resource, ChatMessage, PageName, SortMode } from './types';
import { quickPrompts } from './data/constants';
import { chatWithAI, summarizeResource, fetchResources, setResourceFavorite, setResourceProgress, uploadFile, deleteResource } from './utils/api';
import TopBar from './components/TopBar';
import UploadDialog from './components/UploadDialog';
import HeroSection from './components/HeroSection';
import StatsGrid from './components/StatsGrid';
import ResourceLibrary from './components/ResourceLibrary';
import InsightColumn from './components/InsightColumn';
import Analytics from './components/Analytics';
import DetailDrawer from './components/DetailDrawer';
import AIAssistant from './components/AIAssistant';
import AuthPage from './components/AuthPage';

interface AuthUser {
  id: string;
  username: string;
  nickname: string;
  token: string;
}

function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('studyflow_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const theme = createTheme({
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  palette: {
    primary: { main: '#295df4' },
  },
});

const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);
  const [resources, setResources] = useState<Resource[]>([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All Areas');
  const [sortMode, setSortMode] = useState<SortMode>('Recent');
  const [activePage, setActivePage] = useState<PageName>('Dashboard');
  const EMPTY_RESOURCE: Resource = {
    id: '',
    title: '',
    type: 'PDF',
    course: '',
    description: '',
    tags: [],
    updatedAt: '',
    favorite: false,
    status: '',
    progress: 0,
    tone: 'slate',
    content: '',
  };
  const [selectedResource, setSelectedResource] = useState<Resource>(EMPTY_RESOURCE);
  const [detailOpen, setDetailOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [history, setHistory] = useState<string[]>([
    'OpenFlow Lecture 4',
    'Final Demo Flow',
    'Project GitHub Repository',
  ]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Hi! I can summarize a resource, explain the UI choices, or help you pick the strongest demo materials.',
    },
  ]);
  const [aiLoading, setAiLoading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  // Filtered resources
  const filteredResources = useMemo(() => {
    const keyword = search.toLowerCase().trim();
    let next = resources.filter((item) => {
      const matchesType = selectedType === 'All' || item.type === selectedType;
      const matchesCategory = selectedCategory === 'All Areas' || item.course === selectedCategory;
      const searchable = [item.title, item.description, item.course, item.content, item.status, ...item.tags]
        .join(' ')
        .toLowerCase();
      const matchesSearch = searchable.includes(keyword);
      return matchesType && matchesCategory && matchesSearch;
    });

    if (sortMode === 'Favorites') next = [...next].sort((a, b) => Number(b.favorite) - Number(a.favorite));
    if (sortMode === 'A-Z') next = [...next].sort((a, b) => a.title.localeCompare(b.title));
    if (sortMode === 'Progress') next = [...next].sort((a, b) => b.progress - a.progress);

    return next;
  }, [resources, search, selectedType, selectedCategory, sortMode]);

  const favoriteResources = resources.filter((r) => r.favorite);
  const recentResources = filteredResources.slice(0, 3);
  const stats = {
    total: resources.length,
    favorites: favoriteResources.length,
    visible: filteredResources.length,
    avgProgress: Math.round(resources.reduce((sum, item) => sum + item.progress, 0) / resources.length),
  };

  // Dynamic categories derived from current resources
  const categoryOptions = React.useMemo(() => {
    const set = new Set<string>();
    resources.forEach((r) => { if (r.course) set.add(r.course); });
    return ['All Areas', ...Array.from(set)];
  }, [resources]);

  // Fetch public resources for unauthenticated users (initial seed)
  React.useEffect(() => {
    let mounted = true;
    async function loadPublic() {
      try {
        const res = await fetch('/api/resources/public');
        const data = await res.json();
        if (!mounted) return;
        if (data && data.success && Array.isArray(data.resources)) {
          const normalized = data.resources.map((r: any) => ({ ...r, tags: (r.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean) }));
          setResources(normalized);
          if (normalized.length > 0) setSelectedResource((prev) => prev.id ? prev : normalized[0]);
        }
      } catch (err) {
        // ignore, will rely on local seedless state
      }
    }
    loadPublic();
    return () => { mounted = false; };
  }, []);

  const toggleFavorite = useCallback(
    async (id: string) => {
      // optimistic update
      setResources((prev) => prev.map((item) => (item.id === id ? { ...item, favorite: !item.favorite } : item)));
      if (selectedResource?.id === id) {
        setSelectedResource((prev) => ({ ...prev, favorite: !prev.favorite }));
      }

      try {
        const res = await setResourceFavorite(id, !selectedResource?.favorite, user?.id);
        // synchronize with server response
        setResources((prev) => prev.map((item) => (item.id === res.id ? res : item)));
        if (selectedResource?.id === res.id) setSelectedResource(res);
      } catch (err) {
        console.error('Failed to persist favorite change', err);
        // revert optimistic change
        setResources((prev) => prev.map((item) => (item.id === id ? { ...item, favorite: !item.favorite } : item)));
        if (selectedResource?.id === id) {
          setSelectedResource((prev) => ({ ...prev, favorite: !prev.favorite }));
        }
      }
    },
    [selectedResource, user]
  );

  const AUTO_PROGRESS_INCREMENT = 5;
  const updateProgress = useCallback(
    async (id: string, progress: number) => {
      const clamped = Math.max(0, Math.min(100, Math.round(progress)));
      // optimistic UI update
      setResources((prev) => prev.map((r) => (r.id === id ? { ...r, progress: clamped } : r)));
      setSelectedResource((prev) => (prev?.id === id ? { ...prev, progress: clamped } : prev));
      try {
        const updated = await setResourceProgress(id, clamped);
        setResources((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        setSelectedResource((prev) => (prev?.id === updated.id ? updated : prev));
      } catch (e) {
        console.error('Failed to persist progress', e);
      }
    },
    []
  );

  const openDetail = useCallback((item: Resource) => {
    setSelectedResource(item);
    setDetailOpen(true);
    setHistory((prev) => [item.title, ...prev.filter((entry) => entry !== item.title)].slice(0, 5));
    // Auto-increase progress when a resource is opened/viewed.
    const next = Math.min(100, (Number(item.progress) || 0) + AUTO_PROGRESS_INCREMENT);
    updateProgress(item.id, next);
  }, [updateProgress]);

  const sendPrompt = useCallback(
    async (promptText: string) => {
      const prompt = promptText.trim();
      if (!prompt || aiLoading) return;

      setMessages((prev) => [...prev, { role: 'user', text: prompt }]);
      setAssistantOpen(true);
      setAiLoading(true);

      try {
        const reply = await chatWithAI(prompt, selectedResource);
        setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: 'Sorry, something went wrong. Please try again.' },
        ]);
      } finally {
        setAiLoading(false);
      }
    },
    [selectedResource, aiLoading]
  );

  const handleSummarize = useCallback(async () => {
    if (!selectedResource || aiLoading) return;

    setAssistantOpen(true);
    setMessages((prev) => [...prev, { role: 'user', text: `Summarize: ${selectedResource.title}` }]);
    setAiLoading(true);

    try {
      const result = await summarizeResource(selectedResource);
      // Show summary and suggestions in a single structured message
      setMessages((prev) => [...prev, {
        role: 'assistant',
        text: result.summary,
        summary: result.summary,
        suggestions: result.suggestions,
      }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setAiLoading(false);
    }
  }, [selectedResource, aiLoading]);

  const resetFilters = useCallback(() => {
    setSearch('');
    setSelectedType('All');
    setSelectedCategory('All Areas');
    setSortMode('Recent');
  }, []);

  const toggleSelectResource = useCallback((id: string) => {
    setSelectedResourceIds((prev) => (
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    ));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedResourceIds([]);
  }, []);

  const deletableSelectedCount = useMemo(
    () => resources.filter((resource) => selectedResourceIds.includes(resource.id) && resource.ownerId).length,
    [resources, selectedResourceIds]
  );

  const deleteSelected = useCallback(async () => {
    if (selectedResourceIds.length === 0 || deletingSelected) return;

    const deletable = resources.filter((resource) => selectedResourceIds.includes(resource.id) && resource.ownerId);
    const blocked = selectedResourceIds.length - deletable.length;

    if (deletable.length === 0) {
      setSelectedResourceIds([]);
      return;
    }

    setDeletingSelected(true);
    try {
      await Promise.all(deletable.map((resource) => deleteResource(resource.id)));
      const deletedIds = new Set(deletable.map((resource) => resource.id));
      setResources((prev) => prev.filter((resource) => !deletedIds.has(resource.id)));
      setSelectedResourceIds((prev) => prev.filter((id) => !deletedIds.has(id)));

      if (selectedResource?.id && deletedIds.has(selectedResource.id)) {
        const nextSelected = resources.find((resource) => !deletedIds.has(resource.id) && resource.ownerId) || null;
        if (nextSelected) {
          setSelectedResource(nextSelected);
        } else {
          setSelectedResource({
            id: '',
            title: '',
            type: 'PDF',
            course: '',
            description: '',
            tags: [],
            updatedAt: '',
            favorite: false,
            status: '',
            progress: 0,
            tone: 'slate',
            content: '',
          });
          setDetailOpen(false);
        }
      }

      if (blocked > 0) {
        console.warn(`Skipped ${blocked} seeded resource(s) because they cannot be deleted.`);
      }
    } finally {
      setDeletingSelected(false);
    }
  }, [deletingSelected, resources, selectedResource?.id, selectedResourceIds]);

  const handleLoginSuccess = useCallback((u: AuthUser) => {
    console.log('[App] Login success, setting user:', u.id);
    setUser(u);
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('studyflow_user');
  }, []);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!user?.id) {
        throw new Error('User is not available for upload');
      }
      const uploaded = await uploadFile({
        file,
        ownerId: user.id,
      });

      setResources((prev) => [uploaded, ...prev]);
      setSelectedResource(uploaded);
    },
    [user?.id]
  );
  // Fetch persisted resources for logged-in user and merge with local seed data
  React.useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user) return;
      try {
        const persisted = await fetchResources(user.id);
        if (!mounted || !persisted || persisted.length === 0) return;
        setResources((prev) => {
          const map = new Map<string, Resource>();
          // keep existing order from persisted first
          persisted.forEach((r: Resource) => map.set(r.id, r));
          prev.forEach((r) => {
            if (!map.has(r.id)) map.set(r.id, r);
          });
          return Array.from(map.values());
        });
      } catch (err) {
        console.error('Failed to fetch persisted resources', err);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [user]);

  // If not logged in, show auth page
  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          p: { xs: 1, md: 1.5 },
          width: '100%',
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
          background: `
            radial-gradient(circle at 0% 0%, rgba(101,163,255,0.2), transparent 35%),
            radial-gradient(circle at 100% 20%, rgba(129,140,248,0.16), transparent 28%),
            linear-gradient(180deg, #f4f7fb, #eef3fb)
          `,
        }}
      >
        {/* Top Bar */}
        <TopBar
          onOpenAssistant={() => setAssistantOpen(true)}
          userNickname={user.nickname}
          onLogout={handleLogout}
          onOpenUpload={() => setUploadOpen(true)}
          onOpenAnalytics={() => setAnalyticsOpen(true)}
        />

        {/* Main Content */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          {activePage === 'Analytics' ? (
            // Analytics View
            <Analytics resources={resources} />
          ) : (
            // Dashboard View
            <>
              <HeroSection
                selectedResource={selectedResource}
                onOpenAssistant={() => setAssistantOpen(true)}
                onOpenDetail={() => setDetailOpen(true)}
              />

              <StatsGrid {...stats} />

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', xl: 'minmax(0,1fr) 340px' },
                  gap: 2,
                  minWidth: 0,
                }}
              >
                <ResourceLibrary
                  activePage={activePage}
                  filteredResources={filteredResources}
                  search={search}
                  onSearchChange={setSearch}
                  selectedType={selectedType}
                  onTypeChange={setSelectedType}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  sortMode={sortMode}
                  onSortChange={setSortMode}
                  onToggleFavorite={toggleFavorite}
                  onOpenDetail={openDetail}
                  onResetFilters={resetFilters}
                  categoryOptions={categoryOptions}
                  selectedResourceIds={selectedResourceIds}
                  onToggleSelectResource={toggleSelectResource}
                  onClearSelection={clearSelection}
                  onDeleteSelected={deleteSelected}
                  deletingSelected={deletingSelected}
                  deletableSelectedCount={deletableSelectedCount}
                />

                <Box
                  sx={{
                    display: { xs: 'none', xl: 'block' },
                    position: 'sticky',
                    top: 22,
                    alignSelf: 'start',
                    maxHeight: 'calc(100vh - 44px)',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    pr: 0.5,
                    '&::-webkit-scrollbar': { width: 4 },
                    '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: 4 },
                  }}
                >
                  <InsightColumn
                    resources={resources}
                    favoriteResources={favoriteResources}
                    recentResources={recentResources}
                    onOpenDetail={openDetail}
                  />
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Box>

      {/* Detail Drawer */}
      <DetailDrawer
        open={detailOpen}
        resource={selectedResource}
        onClose={() => setDetailOpen(false)}
        onSummarize={handleSummarize}
        onOpenAssistant={() => setAssistantOpen(true)}
        onUpdateProgress={updateProgress}
      />

      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={(resource) => {
          // prepend uploaded resource
          setResources((prev) => [resource, ...prev]);
        }}
        ownerId={user.id}
      />

      {/* Analytics Modal */}
      <Dialog
        open={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '22px',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.75)',
            maxHeight: '90vh',
            overflowY: 'auto',
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: 3 },
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Analytics resources={resources} />
        </Box>
      </Dialog>

      {/* AI Assistant */}
      <AIAssistant
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        messages={messages}
        onSendPrompt={sendPrompt}
        loading={aiLoading}
      />
    </ThemeProvider>
  );
};

export default App;
