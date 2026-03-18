import axios from 'axios';
import { Resource } from '../types';

const API_BASE = '/api';

// AI 对话接口
export async function chatWithAI(
  prompt: string,
  resource?: Resource | null
): Promise<string> {
  try {
    const response = await axios.post(`${API_BASE}/ai/chat`, {
      prompt,
      resource: resource
        ? { title: resource.title, content: resource.content, type: resource.type, course: resource.course }
        : null,
    });
    return response.data.reply;
  } catch (error) {
    console.error('AI chat error:', error);
    return fallbackAI(prompt, resource);
  }
}

// AI 总结接口
export async function summarizeResource(resource: Resource): Promise<string> {
  try {
    const response = await axios.post(`${API_BASE}/ai/summarize`, {
      title: resource.title,
      content: resource.content,
      type: resource.type,
      course: resource.course,
      tags: resource.tags,
    });
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
