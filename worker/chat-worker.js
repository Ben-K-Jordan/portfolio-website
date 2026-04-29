/**
 * Cloudflare Worker — chat backend for the portfolio site's terminal chat.
 *
 * Deploy (5 minutes, no build step needed):
 *   1. Cloudflare Dashboard → Workers & Pages → Create → Hello World template
 *   2. Open the editor, delete the default code, paste this entire file
 *   3. Save & Deploy
 *   4. Settings → Variables and Secrets → Add → Type: Secret
 *      Name: ANTHROPIC_API_KEY   Value: sk-ant-...   (from console.anthropic.com)
 *   5. Copy the Worker URL (e.g. https://your-worker.YOUR-SUBDOMAIN.workers.dev)
 *   6. In ../index.html search for `const CHAT_ENDPOINT = '';` and paste the URL
 *
 * Tighten ALLOWED_ORIGINS below to your real domain before going public.
 *
 * Realistic monthly cost for a portfolio: $0–$5.
 *   - Cloudflare Workers free tier: 100k requests/day
 *   - Anthropic Haiku 4.5: $1 / 1M input tokens, $5 / 1M output tokens
 *   - Prompt caching on the system prompt cuts input cost ~90% after request 1
 */

const MODEL = 'claude-haiku-4-5-20251001';

// Caps — tune for your traffic / cost tolerance.
const MAX_TOKENS = 600;          // response length cap (input is bounded by MAX_MESSAGE_LENGTH × MAX_MESSAGES)
const MAX_MESSAGES = 20;         // conversation length cap per request
const MAX_MESSAGE_LENGTH = 4000; // single-message length cap, in chars

// Lock CORS to your real domain in production.
// '*' is fine for development but lets any site call (and bill) your Worker.
const ALLOWED_ORIGINS = [
  'https://ben-k-jordan.github.io',
  'http://localhost:8000',  // for local dev: `python -m http.server 8000`
];

const SYSTEM_PROMPT = `You are an AI assistant on Benjamin Jordan's portfolio site.

About Ben:
- Cornell '28 (Dyson School, top 10% of class)
- Founder in Residence at Ventura (YC W26) — built and scaled to $1M+ in contracts
- Incoming PM intern on watsonx.ai @ IBM (summer 2026)
- AI Product Manager & Founder, based in Wellsville, NY

Site sections you can point visitors to:
- /work — case studies (Ventura, Hillside Trends, Flikr, Study-Bot)
- /writing — essays and tear-downs
- /timeline — full CV
- /contact — how to reach him

Style:
- Concise. Two or three sentences max unless the user specifically asks for detail.
- Direct and helpful. Skip preamble like "Great question!"
- If asked something you don't know about Ben specifically, say so honestly and point to the relevant page or to email him.
- Don't invent projects, dates, employers, numbers, or quotes.
- Stay on topic — you're an assistant for this portfolio, not a general-purpose chatbot.`;

function pickAllowedOrigin(origin) {
  if (ALLOWED_ORIGINS.includes('*')) return '*';
  if (origin && ALLOWED_ORIGINS.includes(origin)) return origin;
  return ALLOWED_ORIGINS[0]; // safe default — request will be blocked client-side by browser
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': pickAllowedOrigin(origin),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function jsonResponse(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  });
}

function validateMessages(messages) {
  if (!Array.isArray(messages)) return 'messages must be an array';
  if (messages.length === 0) return 'messages must not be empty';
  if (messages.length > MAX_MESSAGES) return `messages must contain at most ${MAX_MESSAGES} entries`;

  for (const m of messages) {
    if (!m || typeof m !== 'object') return 'each message must be an object';
    if (m.role !== 'user' && m.role !== 'assistant') return 'each message must have role "user" or "assistant"';
    if (typeof m.content !== 'string') return 'each message must have string content';
    if (m.content.trim().length === 0) return 'messages must not be empty strings';
    if (m.content.length > MAX_MESSAGE_LENGTH) return `each message must be ≤ ${MAX_MESSAGE_LENGTH} chars`;
  }
  if (messages[0].role !== 'user') return 'first message must be from user';
  return null;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'method not allowed' }, 405, origin);
    }

    if (!env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY secret is not set');
      return jsonResponse({ error: 'server misconfigured' }, 500, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'invalid JSON body' }, 400, origin);
    }
    const validationError = validateMessages(body.messages);
    if (validationError) {
      return jsonResponse({ error: validationError }, 400, origin);
    }

    // Call Anthropic. The system prompt is sent as a single text block with
    // cache_control: ephemeral, so the same prefix is reused across requests
    // (~90% input cost reduction after the first request in each 5-min window).
    let upstream;
    try {
      upstream = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: [
            { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
          ],
          messages: body.messages,
        }),
      });
    } catch (err) {
      console.error('upstream fetch threw', err);
      return jsonResponse({ error: 'upstream unavailable' }, 502, origin);
    }

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error(`anthropic ${upstream.status}: ${errText}`);
      // Don't leak upstream error shapes to the client.
      const safeStatus = upstream.status === 429 ? 429 : 502;
      const safeMessage = upstream.status === 429 ? 'rate limited, please retry shortly' : 'upstream error';
      return jsonResponse({ error: safeMessage }, safeStatus, origin);
    }

    const data = await upstream.json();
    const reply = (data.content || []).find((b) => b.type === 'text')?.text;
    if (!reply) {
      console.error('anthropic returned no text block', data);
      return jsonResponse({ error: 'no reply text' }, 502, origin);
    }
    return jsonResponse({ reply }, 200, origin);
  },
};
