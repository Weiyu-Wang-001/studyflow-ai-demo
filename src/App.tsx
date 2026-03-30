import React, { useMemo, useState, useCallback } from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { Resource, ChatMessage, PageName, SortMode } from './types';
import { initialResources, quickPrompts } from './data/resources';
import { chatWithAI, summarizeResource, uploadFile } from './utils/api';
import TopBar from './components/TopBar';
import HeroSection from './components/HeroSection';
import StatsGrid from './components/StatsGrid';
import ResourceLibrary from './components/ResourceLibrary';
import InsightColumn from './components/InsightColumn';
import DetailDrawer from './components/DetailDrawer';
import AIAssistant from './components/AIAssistant';
import AuthPage from './components/AuthPage';

interface AuthUser {
  id: string;
  username: string;
  nickname: string;
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
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All Areas');
  const [sortMode, setSortMode] = useState<SortMode>('Recent');
  const [activePage, setActivePage] = useState<PageName>('Dashboard');
  const [selectedResource, setSelectedResource] = useState<Resource>(initialResources[0]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
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

  const toggleFavorite = useCallback(
    (id: string) => {
      setResources((prev) => prev.map((item) => (item.id === id ? { ...item, favorite: !item.favorite } : item)));
      if (selectedResource?.id === id) {
        setSelectedResource((prev) => ({ ...prev, favorite: !prev.favorite }));
      }
    },
    [selectedResource]
  );

  const openDetail = useCallback((item: Resource) => {
    setSelectedResource(item);
    setDetailOpen(true);
    setHistory((prev) => [item.title, ...prev.filter((entry) => entry !== item.title)].slice(0, 5));
  }, []);

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
      const summary = await summarizeResource(selectedResource);
      setMessages((prev) => [...prev, { role: 'assistant', text: summary }]);
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

  const handleLoginSuccess = useCallback((u: AuthUser) => {
    setUser(u);
    localStorage.setItem('studyflow_user', JSON.stringify(u));
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('studyflow_user');
  }, []);

  const handleUpload = useCallback(
    async (file: File) => {
      const uploaded = await uploadFile({
        file,
        ownerId: user.id,
      });

      setResources((prev) => [uploaded, ...prev]);
      setSelectedResource(uploaded);
    },
    [user.id]
  );

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
          onUploadFile={handleUpload}
        />

        {/* Main Content */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
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
        </Box>
      </Box>

      {/* Detail Drawer */}
      <DetailDrawer
        open={detailOpen}
        resource={selectedResource}
        onClose={() => setDetailOpen(false)}
        onSummarize={handleSummarize}
        onOpenAssistant={() => setAssistantOpen(true)}
      />

      {/* AI Assistant */}
      <AIAssistant
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        messages={messages}
        quickPrompts={quickPrompts}
        onSendPrompt={sendPrompt}
        loading={aiLoading}
      />
    </ThemeProvider>
  );
};

export default App;
