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

Right now the terminal chat falls back to keyword pattern matching. If you want real LLM responses, here's the path. A production-ready worker is included in this repo at [`worker/chat-worker.js`](./worker/chat-worker.js) — it includes CORS handling, input validation, prompt caching, error masking, and a system prompt about Ben.

### Cloudflare Worker (recommended — free tier)

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Hello World** template
2. Open the editor, delete the default code, paste the entire contents of `worker/chat-worker.js`
3. Click **Save & Deploy**
4. **Settings** → **Variables and Secrets** → **Add** → Type: **Secret**
   - Name: `ANTHROPIC_API_KEY`
   - Value: your Anthropic API key from [console.anthropic.com](https://console.anthropic.com)
5. Copy the Worker URL (e.g. `https://your-worker.YOUR-SUBDOMAIN.workers.dev`)
6. In `index.html`, search for `const CHAT_ENDPOINT = '';` and paste the URL
7. **Important:** in `worker/chat-worker.js`, edit the `ALLOWED_ORIGINS` array to include only your real site domain — leaving `'*'` lets any site call (and bill) your worker
8. Commit and push. Done.

**Cost:** Cloudflare Workers free tier = 100k requests/day. Anthropic Haiku 4.5 = $1 per 1M input tokens, $5 per 1M output tokens. Prompt caching (already wired up) cuts input cost ~90% after the first request in each 5-minute window. Realistic monthly cost for a portfolio: $0–$5.

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
