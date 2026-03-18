import axios from 'axios';

const API_KEY = 'sk-9bc15eae614948599919b836a7f44c67';
const API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

async function callQwen(systemPrompt, userContent) {
  const response = await axios.post(
    API_URL,
    {
      model: 'qwen-plus',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );
  return response.data.choices[0].message.content;
}

// AI Chat endpoint
export async function aiChat(req, res) {
  try {
    const { prompt, resource } = req.body;

    let systemPrompt =
      'You are a helpful study assistant for a university student. Answer concisely and clearly in the context of academic learning resources.';

    let userContent = prompt;
    if (resource) {
      userContent = `Context - Resource: "${resource.title}" (${resource.type}, Course: ${resource.course})\nContent: ${resource.content}\n\nUser question: ${prompt}`;
    }

    const reply = await callQwen(systemPrompt, userContent);
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

    const systemPrompt =
      'You are a study assistant. Provide a clear, structured summary of the given academic resource. Include key takeaways and study suggestions.';

    const userContent = `Please summarize this resource:\nTitle: ${title}\nType: ${type}\nCourse: ${course}\nTags: ${(tags || []).join(', ')}\nContent: ${content}`;

    const summary = await callQwen(systemPrompt, userContent);
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
