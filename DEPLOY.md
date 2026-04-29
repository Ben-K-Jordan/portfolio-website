# deploy

This site is a single static `index.html` file. Deployment options below — pick one.

## option 1: GitHub Pages (recommended) — 5 minutes

The simplest path. Free forever. Works with custom domains.

### steps

1. **Create a new public repo on GitHub.** Name it exactly `Ben-K-Jordan.github.io` (this naming convention tells GitHub to treat it as a "user site").

2. **Push this folder to that repo:**
   ```bash
   cd /path/to/this/folder
   git init
   git add .
   git commit -m "initial portfolio"
   git branch -M main
   git remote add origin https://github.com/Ben-K-Jordan/Ben-K-Jordan.github.io.git
   git push -u origin main
   ```

3. **Enable GitHub Pages:**
   - Go to your repo on github.com
   - Click `Settings` → `Pages` (in the left sidebar)
   - Under "Source", select `Deploy from a branch`
   - Branch: `main`, folder: `/ (root)`
   - Click Save

4. **Wait ~1 minute.** Site goes live at `https://Ben-K-Jordan.github.io`.

### custom domain (optional)

If you've bought a domain (e.g. `benjordan.com`):

1. Add a file named `CNAME` (no extension) to the root of this repo with one line:
   ```
   benjordan.com
   ```
2. Commit and push.
3. At your domain registrar (Namecheap, Cloudflare, etc.), add these DNS records:
   ```
   Type    Host    Value
   A       @       185.199.108.153
   A       @       185.199.109.153
   A       @       185.199.110.153
   A       @       185.199.111.153
   CNAME   www     Ben-K-Jordan.github.io
   ```
4. In GitHub repo Settings → Pages, enter your custom domain and check "Enforce HTTPS".
5. Wait up to ~24 hours for DNS propagation. Usually faster.

---

## option 2: Cloudflare Pages — 10 minutes

Slightly faster CDN than GitHub Pages, and you can add Workers later if you ever want a real LLM chat backend.

1. Push to a GitHub repo (any name)
2. Go to https://pages.cloudflare.com
3. Sign in → Create application → Connect to Git → pick the repo
4. Build command: leave blank
5. Build output directory: leave as `/`
6. Click Deploy
7. Live at `<project-name>.pages.dev` in ~30 seconds

Custom domain in Cloudflare Pages: Settings → Custom domains → Add. Free SSL automatic.

---

## option 3: Vercel / Netlify — 5 minutes

Same idea. Drag-and-drop deploy:
- **Vercel:** Drag `index.html` onto https://vercel.com/new
- **Netlify:** Drag the folder onto https://app.netlify.com/drop

---

## before you ship — checklist

- [ ] Put your `resume.pdf` in this folder
- [ ] Update `RESUME_URL` in `index.html` (search for `const RESUME_URL`)
- [ ] Replace the 5 press card `href="#"` placeholders with real article URLs (or delete cards)
- [ ] Test on mobile (open in your phone's browser via the deployed URL)
- [ ] Run a Lighthouse audit (Chrome DevTools → Lighthouse) — target 90+ on accessibility and performance
- [ ] Click through every link to make sure nothing's broken

---

## adding the LLM chat backend (optional)

Right now the terminal chat falls back to keyword pattern matching. If you want real LLM responses, here's the path:

### Cloudflare Worker (recommended — free tier)

1. In your Cloudflare Pages project, go to Settings → Functions → Add Worker
2. Use this template (replace with your Anthropic API key, set as a secret named `ANTHROPIC_API_KEY`):

```js
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { messages } = await request.json();

    // Add a system prompt with context about Ben
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: `You are an AI assistant on Ben Jordan's portfolio site.
                 Be concise, helpful, and professional. Ben is a Cornell '28 student,
                 incoming PM intern at IBM watsonx.ai, former Founder in Residence at
                 Ventura (YC W26). Answer questions visitors might have about his work.`,
        messages: messages,
      }),
    });

    const data = await r.json();
    const reply = data.content?.[0]?.text || 'sorry, something went wrong.';

    return new Response(JSON.stringify({ reply }), {
      headers: { 'content-type': 'application/json' },
    });
  },
};
```

3. Deploy the Worker, get its URL (e.g. `https://chat.your-subdomain.workers.dev`)
4. In `index.html`, set `const CHAT_ENDPOINT = 'https://chat.your-subdomain.workers.dev';`
5. Push the change. Done.

**Cost:** Cloudflare Workers free tier = 100k requests/day. Anthropic API for Claude Haiku is fractions of a cent per chat. Realistic monthly cost for a portfolio: $0–$5.

---

## troubleshooting

**Fonts aren't loading.**
Google Fonts CDN can be blocked in some networks (corporate firewalls, certain countries). Site falls back to system monospace — still readable but loses the Doto / Fraunces character. Not much you can do here without self-hosting fonts.

**GitHub commit feed is empty.**
Either you have no recent public commits, or the `Ben-K-Jordan` username is wrong. Check `const GH_USERNAME = 'Ben-K-Jordan';` in `index.html`. The feed hides itself silently on failure (this is intentional).

**Settings don't persist across browsers.**
That's expected — they're saved to `localStorage`, which is per-browser per-device. Each visitor has their own settings.

**Hash routes don't work after deploy.**
They should — but if you're using Apache/Nginx with a strict config, make sure they're not rewriting `#/...` URLs. GitHub Pages and Cloudflare Pages handle this correctly out of the box.
