# benjamin jordan — portfolio

A single-file personal portfolio site. CRT/terminal aesthetic. Built as one self-contained `index.html` (~8,600 lines) with no build step, no npm, no framework, no backend.

[live site →](#) <!-- TODO: replace with deployed URL -->

---

## what's in here

```
.
├── index.html          # the entire site (HTML + CSS + JS)
├── resume.pdf          # TODO: drop your resume PDF here
├── README.md           # this file
├── DEPLOY.md           # step-by-step deploy instructions
├── LICENSE
└── .gitignore
```

That's it. There is no build step. Open `index.html` in a browser locally, or push to a static host and you're done.

## what powers what

| Feature | How it works | Needs setup? |
|---|---|---|
| Fonts | Google Fonts CDN (Doto, VT323, JetBrains Mono, Fraunces) | No |
| GitHub commit feed | Public GitHub Events API | No (just have public commits) |
| Chat assistant | Keyword pattern matching (in-page) | No (optional LLM upgrade — see below) |
| Project case studies | Hash-routed overlays (`#/projects/...`) | No |
| Writing sub-pages | Hash-routed overlays (`#/writing`, `#/thinking`, etc.) | No |
| Settings panel | localStorage-backed, accessibility toggles | No |
| Resume button | Links to `RESUME_URL` constant | **Yes — see config** |
| Press cards | 5 cards link to `#` placeholders | **Yes — see config** |

## config — things to fill in

Open `index.html` and search for these:

### `RESUME_URL`
Search for: `const RESUME_URL = '#';`
Change to: `const RESUME_URL = './resume.pdf';` (after dropping `resume.pdf` in this folder)

### Press card URLs
Search for: `<a class="press-item" href="#"`
There are 5 of these. Replace each `#` with the real article URL. If a piece doesn't have a real URL, delete the card entirely.

### Chat backend (optional)
Search for: `const CHAT_ENDPOINT = '';`
Leave empty for the keyword-fallback (works fine). If you set up a Worker/Lambda that proxies to Anthropic's or OpenAI's API, put the URL here.

### Demo videos (optional)
Search for: `const DEMO_VIDEOS = {`
Fill in hosted `.mp4` URLs if you have them. Empty entries just don't render.

## deploy

See `DEPLOY.md` for step-by-step instructions. TL;DR: GitHub Pages works out of the box.

## tech notes

- **No build step.** This is a single file. No webpack, no vite, no transpilation.
- **No tracking.** No Google Analytics, no Plausible, no anything. Add at your own discretion.
- **No backend** — except the optional chat endpoint.
- **localStorage** is used for the settings panel state (key: `bj_settings_v1`).
- **Hash routing** — all sub-pages use `#/path` URLs so this stays a static site. Browser back/forward work.
- Honors `prefers-reduced-motion` automatically.

## adding new content

### A new project case study
1. In `index.html`, find the `<!-- ============ PROJECT CASE STUDIES (full pages) ============ -->` block. Each project is an `<article class="project-detail" id="detail-XXX">`.
2. Copy an existing one and update the content.
3. Add the slug to the `VALID` array in the routing JS (search for `const VALID = [`).
4. Add a card on the home page in the `<section id="work">` block.

### A new writing piece
1. Add a new `<article class="project-detail writing-detail" id="detail-XXX">` overlay near the existing writing pages.
2. Add the route to `WRITING_ROUTES` and `WRITING_LOADER_LABELS` in the routing JS.
3. Add a teaser card in `#detail-writing` (the writing index overlay).

## license

MIT. See `LICENSE`.

---

*Built with care, caffeine, and an unreasonable amount of CSS in Wellsville, NY.*
