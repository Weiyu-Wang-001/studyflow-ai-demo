import axios from 'axios';

const AI_PROVIDER = (process.env.AI_PROVIDER || 'openai').trim().toLowerCase();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.AI_API_KEY || null;
const OPENAI_API_URL = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.AI_API_KEY || null;
const CLAUDE_API_URL = process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/chat/completions';
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-3.5-sonic';

const TONGYI_API_KEY = process.env.TONGYI_API_KEY || process.env.AI_API_KEY || null;
const TONGYI_API_URL = process.env.TONGYI_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const TONGYI_MODEL = process.env.TONGYI_MODEL || 'qwen-plus';

const SYSTEM_PROMPT_CHAT =
  'You are a helpful study assistant for a university student. Answer concisely and clearly in the context of academic learning resources.';
const SYSTEM_PROMPT_SUMMARY =
  'You are a study assistant. Provide a clear, structured summary of the given academic resource. Include key takeaways and study suggestions.';

function getLlmConfig() {
  switch (AI_PROVIDER) {
    case 'claude':
    case 'anthropic':
      return {
        apiKey: CLAUDE_API_KEY,
        url: CLAUDE_API_URL,
        model: CLAUDE_MODEL,
        headers: {
          'x-api-key': CLAUDE_API_KEY || undefined,
          'Content-Type': 'application/json',
        },
        buildBody: (systemPrompt, userContent) => ({
          model: CLAUDE_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
        }),
      };
    case 'tongyi':
      return {
        apiKey: TONGYI_API_KEY,
        url: TONGYI_API_URL,
        model: TONGYI_MODEL,
        headers: {
          Authorization: TONGYI_API_KEY ? `Bearer ${TONGYI_API_KEY}` : undefined,
          'Content-Type': 'application/json',
        },
        buildBody: (systemPrompt, userContent) => ({
          model: TONGYI_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
        }),
      };
    case 'openai':
    default:
      return {
        apiKey: OPENAI_API_KEY,
        url: OPENAI_API_URL,
        model: OPENAI_MODEL,
        headers: {
          Authorization: OPENAI_API_KEY ? `Bearer ${OPENAI_API_KEY}` : undefined,
          'Content-Type': 'application/json',
        },
        buildBody: (systemPrompt, userContent) => ({
          model: OPENAI_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
        }),
      };
  }
}

function parseResponseContent(response) {
  if (!response?.data) return '';
  return (
    response.data?.choices?.[0]?.message?.content ||
    response.data?.completion ||
    response.data?.output_text ||
    response.data?.choices?.[0]?.text ||
    ''
  );
}

async function callLlm(systemPrompt, userContent) {
  const config = getLlmConfig();

  if (!config.apiKey) {
    console.warn(`Warning: no API key set for provider '${AI_PROVIDER}'. Falling back to local responses.`);
  }

  const response = await axios.post(
    config.url,
    config.buildBody(systemPrompt, userContent),
    {
      headers: config.headers,
      timeout: 30000,
    }
  );

  return parseResponseContent(response);
}

// AI Chat endpoint
export async function aiChat(req, res) {
  try {
    const { prompt, resource } = req.body;

    let userContent = prompt;
    if (resource) {
      userContent = `Context - Resource: "${resource.title}" (${resource.type}, Course: ${resource.course})\nContent: ${resource.content}\n\nUser question: ${prompt}`;
    }

    const reply = await callLlm(SYSTEM_PROMPT_CHAT, userContent);
    res.json({ reply });
  } catch (error) {
    console.error('AI Chat error:', error.message);
    res.status(500).json({ error: 'AI service unavailable', reply: getFallback(req.body.prompt, req.body.resource) });
  }
}

// AI Summarize endpoint
export async function aiSummarize(req, res) {
  try {
    const { title, content, type, course, tags } = req.body;

    const userContent = `Please summarize this resource:\nTitle: ${title}\nType: ${type}\nCourse: ${course}\nTags: ${(tags || []).join(', ')}\nContent: ${content}`;

    const summary = await callLlm(SYSTEM_PROMPT_SUMMARY, userContent);
    res.json({ summary });
  } catch (error) {
    console.error('AI Summarize error:', error.message);
    res.status(500).json({
      error: 'AI service unavailable',
      summary: `Summary of ${req.body.title}: ${req.body.content}. Key takeaway: users can find and understand information in one workflow.`,
    });
  }
}

function getFallback(prompt, resource) {
  const lower = (prompt || '').toLowerCase();
  if (lower.includes('find') || lower.includes('best demo')) {
    return 'The strongest materials are those with high progress and clear presentation structure, showing problem context, interaction flow, and UI-first framing.';
  }
  if (lower.includes('usable') || lower.includes('ui')) {
    return 'The interface improves usability with strong visual hierarchy, unified search, persistent navigation, scan-friendly cards, a contextual detail drawer, and AI actions attached to meaningful resource states.';
  }
  if (lower.includes('unified search')) {
    return 'Unified search normalizes different file types into one searchable model. Users search by topic, keyword, tag, or course without worrying about raw file formats.';
  }
  if (lower.includes('summary') || lower.includes('summarize')) {
    if (resource) return `Summary of ${resource.title}: ${resource.content}`;
    return 'This product centralizes academic resources, reduces navigation friction, and adds AI where it improves usability.';
  }
  if (resource) return `Based on ${resource.title}: ${resource.content}`;
  return 'This is a UI-first learning dashboard combining searchable resources, clean layout, and AI-powered assistance.';
}
