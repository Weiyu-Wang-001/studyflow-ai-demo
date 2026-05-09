import axios from 'axios';

const AI_PROVIDER = (process.env.AI_PROVIDER || 'groq').trim().toLowerCase();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.AI_API_KEY || null;
const OPENAI_API_URL = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.AI_API_KEY || null;
const CLAUDE_API_URL = process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/chat/completions';
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-3.5-sonic';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || null;
const GEMINI_API_URL = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.AI_API_KEY || null;
const GROQ_API_URL = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const TONGYI_API_KEY = process.env.TONGYI_API_KEY || process.env.AI_API_KEY || null;
const TONGYI_API_URL = process.env.TONGYI_API_URL || 'https://dashscope.aliyuncs.com';
const TONGYI_MODEL = process.env.TONGYI_MODEL || 'qwen-turbo';
// optional comma-separated fallback models to try when primary is not available
const TONGYI_FALLBACK_MODELS = process.env.TONGYI_FALLBACK_MODELS
  ? process.env.TONGYI_FALLBACK_MODELS.split(',').map((s) => s.trim()).filter(Boolean)
  : [];
// optional: name of the auth header to use for Tongyi (e.g. 'Authorization' or 'x-api-key')
const TONGYI_AUTH_HEADER = process.env.TONGYI_AUTH_HEADER || 'Authorization';
// optional workspace headers (used by some DashScope setups)
const TONGYI_WORKSPACE_ID = process.env.TONGYI_WORKSPACE_ID || null;
const TONGYI_WORKSPACE_NAME = process.env.TONGYI_WORKSPACE_NAME || null;

const SYSTEM_PROMPT_CHAT =
  'You are a helpful study assistant for a university student. Answer concisely and clearly in the context of academic learning resources.';
const SYSTEM_PROMPT_SUMMARY =
  'You are a study assistant. Provide a clear, structured summary of the given academic resource. Include key takeaways and study suggestions.';

function getLlmConfig() {
  switch (AI_PROVIDER) {
    case 'groq':
      return {
        apiKey: GROQ_API_KEY,
        url: GROQ_API_URL,
        model: GROQ_MODEL,
        headers: {
          Authorization: GROQ_API_KEY ? `Bearer ${GROQ_API_KEY}` : undefined,
          'Content-Type': 'application/json',
        },
        buildBody: (systemPrompt, userContent) => ({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
        }),
      };
    case 'gemini':
    case 'google':
      return {
        apiKey: GEMINI_API_KEY,
        url: GEMINI_API_URL,
        model: GEMINI_MODEL,
        headers: {
          'Content-Type': 'application/json',
        },
        buildBody: (systemPrompt, userContent) => ({
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userContent}` }] },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
          },
        }),
      };
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
        headers: (() => {
          const h = { 'Content-Type': 'application/json' };
          if (TONGYI_AUTH_HEADER && TONGYI_API_KEY) {
            // If header is 'x-api-key' put the raw key; otherwise default to Bearer token
            if (TONGYI_AUTH_HEADER.toLowerCase() === 'x-api-key') {
              h['x-api-key'] = TONGYI_API_KEY;
            } else {
              h[TONGYI_AUTH_HEADER] = `Bearer ${TONGYI_API_KEY}`;
            }
          }
          if (TONGYI_WORKSPACE_ID) h['x-workspace-id'] = TONGYI_WORKSPACE_ID;
          if (TONGYI_WORKSPACE_NAME) h['x-workspace-name'] = TONGYI_WORKSPACE_NAME;
          return h;
        })(),
        buildBody: (systemPrompt, userContent, overrideModel) => ({
          model: overrideModel || TONGYI_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
        }),
        fallbackModels: TONGYI_FALLBACK_MODELS,
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
        buildBody: (systemPrompt, userContent, overrideModel) => ({
          model: overrideModel || OPENAI_MODEL,
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
    response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    response.data?.completion ||
    response.data?.output_text ||
    response.data?.choices?.[0]?.text ||
    ''
  );
}

function normalizeUrl(u) {
  if (!u) return u;
  // already http(s)
  if (/^https?:\/\//i.test(u)) return u;
  // convert ws/wss to http/https
  if (/^wss?:\/\//i.test(u)) return u.replace(/^wss:\/\//i, 'https://').replace(/^ws:\/\//i, 'http://');
  // no scheme — assume https
  return `https://${u}`;
}

async function callLlm(systemPrompt, userContent) {
  const config = getLlmConfig();

  if (!config.apiKey) {
    console.warn(`Warning: no API key set for provider '${AI_PROVIDER}'. Falling back to local responses.`);
  }
  const url = normalizeUrl(config.url);
  if (!url) {
    throw new Error(`Invalid or missing URL for provider '${AI_PROVIDER}'`);
  }

  let finalUrl = url;
  try {
    const parsed = new URL(url);
    const hasPath = parsed.pathname && parsed.pathname !== '/';
    if (!hasPath) {
      // No path - add the full endpoint
      let defaultPath = '';
      if (AI_PROVIDER === 'groq') {
        // Groq uses OpenAI-compatible endpoint, already has path in URL
        finalUrl = url;
      } else if (AI_PROVIDER === 'gemini' || AI_PROVIDER === 'google') {
        // Gemini uses a different URL structure: /v1beta/models/{model}:generateContent
        finalUrl = `${url}/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
      } else if (AI_PROVIDER === 'tongyi') {
        defaultPath = '/compatible-mode/v1/chat/completions';
        finalUrl = url.replace(/\/$/, '') + defaultPath;
      } else if (AI_PROVIDER === 'openai') {
        defaultPath = '/v1/chat/completions';
        finalUrl = url.replace(/\/$/, '') + defaultPath;
      } else if (AI_PROVIDER === 'claude' || AI_PROVIDER === 'anthropic') {
        defaultPath = '/v1/chat/completions';
        finalUrl = url.replace(/\/$/, '') + defaultPath;
      }
    } else if (AI_PROVIDER === 'gemini' || AI_PROVIDER === 'google') {
      // For Gemini with path, construct the full URL
      finalUrl = `${url}/${config.model}:generateContent?key=${config.apiKey}`;
    } else if (AI_PROVIDER === 'tongyi' && !parsed.pathname.includes('chat/completions')) {
      // Tongyi path exists but doesn't include chat/completions - append it
      finalUrl = url.replace(/\/$/, '') + '/chat/completions';
    }
  } catch (e) {
    // If URL constructor fails, keep original
    finalUrl = url;
  }

  try {
    const response = await axios.post(
      finalUrl,
      config.buildBody(systemPrompt, userContent),
      {
        headers: config.headers,
        timeout: 30000,
      }
    );

    return parseResponseContent(response);
  } catch (err) {
    // include response body and status when available for debugging 4xx/5xx
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.error(`LLM request failed (provider=${AI_PROVIDER}, url=${finalUrl}, status=${status}):`, err?.message || err);
    if (data) console.error('LLM response body:', data);
    // rethrow to let upstream handlers report 500 with helpful message
    throw err;
  }
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

    console.log('[aiSummarize] Received request - title:', title, 'type:', type, 'content length:', String(content || '').length);
    if (!content || String(content).trim().length === 0) {
      console.warn('[aiSummarize] WARNING: content is empty or missing!');
    }

    const userContent = `Please produce a concise summary and a short list of actionable suggestions for the following resource. Return the answer as JSON with two keys: \n- \"summary\": a short paragraph summarizing the content\n- \"suggestions\": an array of 3-6 short actionable suggestions (one sentence each)\n\nResource:\nTitle: ${title}\nType: ${type}\nCourse: ${course}\nTags: ${(tags || []).join(', ')}\nContent: ${content}`;

    const raw = await callLlm(SYSTEM_PROMPT_SUMMARY, userContent);

    // Try to parse JSON from the model. If the model returned plain text, attempt to extract JSON block.
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      // try to find JSON substring
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        try { parsed = JSON.parse(m[0]); } catch (e2) { parsed = null; }
      }
    }

    if (parsed && (parsed.summary || parsed.suggestions)) {
      return res.json({ summary: parsed.summary || '', suggestions: parsed.suggestions || [] });
    }

    // Fallback: if no JSON, send raw as summary and ask model to produce suggestions in a second call
    const fallbackSummary = raw;
    try {
      const suggestPrompt = `Based on the following summary, provide 4 concise actionable suggestions as a JSON array named \"suggestions\":\n\nSummary:\n${fallbackSummary}`;
      const suggestRaw = await callLlm(SYSTEM_PROMPT_SUMMARY, suggestPrompt);
      let suggestParsed = null;
      try { suggestParsed = JSON.parse(suggestRaw); } catch (e) {
        const mm = suggestRaw.match(/\[\s*[\s\S]*\]/);
        if (mm) {
          try { suggestParsed = JSON.parse(mm[0]); } catch (e2) { suggestParsed = null; }
        }
      }

      if (Array.isArray(suggestParsed)) {
        return res.json({ summary: fallbackSummary, suggestions: suggestParsed });
      }
    } catch (e) {
      // ignore
    }

    // final fallback
    res.json({ summary: fallbackSummary, suggestions: [] });
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
