import axios from 'axios';
import { Resource } from '../types';

const API_BASE = '/api';

export interface UploadPayload {
  file: File;
  ownerId?: string;
  title?: string;
  course?: string;
  description?: string;
  tags?: string[] | string;
}

export interface GoogleDriveImportPayload {
  folderId: string;
  accessToken: string;
  ownerId?: string;
  course?: string;
  description?: string;
  tags?: string[] | string;
}

type UploadOptions = { title?: string; course?: string; description?: string; tags?: string; ownerId?: string };

function getAuthHeaders() {
  try {
    const raw = localStorage.getItem('studyflow_user');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed?.token) return {};
    return { Authorization: `Bearer ${parsed.token}` };
  } catch (e) {
    console.warn('[API] getAuthHeaders error:', e);
    return {};
  }
}

function normalizeTags(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags.map((t) => String(t).trim()).filter(Boolean);
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeResource(resource: any): Resource {
  return {
    ...resource,
    tags: normalizeTags(resource?.tags),
    favorite: Boolean(resource?.favorite),
    progress: Number(resource?.progress || 0),
    updatedAt: resource?.updatedAt || new Date().toISOString(),
  } as Resource;
}

function normalizeResources(resources: any): Resource[] {
  return Array.isArray(resources) ? resources.map(normalizeResource) : [];
}

// AI 对话接口
export async function chatWithAI(
  prompt: string,
  resource?: Resource | null
): Promise<string> {
  try {
    const response = await axios.post(
      `${API_BASE}/ai/chat`,
      {
        prompt,
        resource: resource ? { title: resource.title, content: resource.content, type: resource.type, course: resource.course } : null,
      },
      { headers: getAuthHeaders() }
    );
    return response.data.reply;
  } catch (error) {
    console.error('AI chat error:', error);
    return fallbackAI(prompt, resource);
  }
}

// AI 总结接口
export async function summarizeResource(resource: Resource): Promise<string> {
  try {
    const response = await axios.post(
      `${API_BASE}/ai/summarize`,
      {
        title: resource.title,
        content: resource.content,
        type: resource.type,
        course: resource.course,
        tags: resource.tags,
      },
      { headers: getAuthHeaders() }
    );
    return response.data.summary;
  } catch (error) {
    console.error('AI summarize error:', error);
    return fallbackAI('Summarize the selected resource', resource);
  }
}

// 后端不可用时的本地 fallback
function fallbackAI(prompt: string, resource?: Resource | null): string {
  const lower = prompt.toLowerCase();

  if (lower.includes('find') || lower.includes('best demo')) {
    return 'For demo purposes, the strongest materials are those with high progress and clear presentation structure. They show problem context, interaction flow, and UI-first framing.';
  }

  if (lower.includes('usable') || lower.includes('ui')) {
    return 'The interface improves usability with a strong visual hierarchy, unified search, persistent navigation, scan-friendly cards, a contextual detail drawer, and AI actions attached to meaningful resource states.';
  }

  if (lower.includes('unified search')) {
    return 'Unified search normalizes different file types into one searchable model. Users search by topic, keyword, tag, or course without worrying about raw file formats.';
  }

  if (lower.includes('summary') || lower.includes('summarize')) {
    if (!resource) return 'This product centralizes academic resources, reduces navigation friction, and adds AI where it improves usability.';
    return `Summary of ${resource.title}: ${resource.content} The main takeaway is that users can find and understand information in one workflow.`;
  }

  if (resource) {
    return `Based on ${resource.title}: ${resource.content}`;
  }

  return 'This is a UI-first learning dashboard combining searchable resources, clean layout, and AI-powered assistance for summarization and Q&A.';
}

// uploadFile: accept either UploadPayload object or (file, opts)
export async function uploadFile(payload: UploadPayload): Promise<Resource>;
export async function uploadFile(file: File, opts?: UploadOptions): Promise<Resource>;
export async function uploadFile(arg1: any, arg2?: any): Promise<Resource> {
  let file: File;
  let opts: UploadOptions | undefined;
  if (arg1 && arg1.file instanceof File) {
    file = arg1.file;
    opts = {
      title: arg1.title,
      course: arg1.course,
      description: arg1.description,
      tags: Array.isArray(arg1.tags) ? (arg1.tags as string[]).join(',') : (arg1.tags as string | undefined),
      ownerId: arg1.ownerId,
    };
  } else {
    file = arg1 as File;
    opts = arg2 as UploadOptions | undefined;
  }

  const fd = new FormData();
  fd.append('file', file);
  if (opts?.ownerId) fd.append('ownerId', opts.ownerId);
  if (opts?.title) fd.append('title', opts.title);
  if (opts?.course) fd.append('course', opts.course);
  if (opts?.description) fd.append('description', opts.description);
  if (opts?.tags) fd.append('tags', opts.tags);

  const response = await axios.post(`${API_BASE}/files/upload`, fd, {
    headers: { ...getAuthHeaders() },
  });

  return normalizeResource(response.data.resource);
}

export async function importGoogleDriveFolder(payload: GoogleDriveImportPayload): Promise<Resource[]> {
  const response = await axios.post(
    `${API_BASE}/google-drive/import`,
    {
      folderId: payload.folderId,
      accessToken: payload.accessToken,
      ownerId: payload.ownerId,
      course: payload.course,
      description: payload.description,
      tags: payload.tags,
    },
    { headers: getAuthHeaders() }
  );

  return normalizeResources(response.data.resources);
}

// Fetch persisted resources (optionally by owner)
export async function fetchResources(ownerId?: string) {
  try {
    const url = ownerId ? `${API_BASE}/files/resources?ownerId=${encodeURIComponent(ownerId)}` : `${API_BASE}/files/resources`;
    const headers = getAuthHeaders();
    const response = await axios.get(url, { headers });
    const resources = Array.isArray(response.data.resources) ? response.data.resources : [];
    return resources.map(normalizeResource);
  } catch (error) {
    console.error('Fetch resources error:', error);
    return [] as Resource[];
  }
}

// Set favorite on a resource (ownerId required for owner-protected resources)
export async function setResourceFavorite(resourceId: string, favorite: boolean, ownerId?: string) {
  try {
    const response = await axios.post(`${API_BASE}/resources/${encodeURIComponent(resourceId)}/favorite`, {
      ownerId,
      favorite,
    }, { headers: getAuthHeaders() });
    return normalizeResource(response.data.resource);
  } catch (error) {
    console.error('Set favorite error:', error);
    throw error;
  }
}

export async function setResourceProgress(resourceId: string, progress: number) {
  try {
    const response = await axios.post(`${API_BASE}/resources/${encodeURIComponent(resourceId)}/progress`, {
      progress,
    }, { headers: getAuthHeaders() });
    return normalizeResource(response.data.resource);
  } catch (error) {
    console.error('Set progress error:', error);
    throw error;
  }
}

export async function deleteResource(resourceId: string) {
  try {
    const response = await axios.delete(`${API_BASE}/resources/${encodeURIComponent(resourceId)}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Delete resource error:', error);
    throw error;
  }
}
