# BM Tools

Everyday developer utilities - fast, private, 100% client-side. Hosted at
[rahmanmizanur-bm.github.io/mra-bm-tools](https://rahmanmizanur-bm.github.io/mra-bm-tools/).

Nothing you type leaves the browser: no backend, no sign-up, no tracking.

## Flagship tool: Lorem Ipsum / Text Generator

- **Units:** paragraphs, sentences, words, lists, bytes
- **Word sets:** Classic Latin, Cicero (full Latin), Hipster, Bacon, or your own custom words
- **Length:** short / medium / long / mixed
- **Output:** Plain, HTML (with `<p>`, headers, `<b>`/`<i>`, links, lists, blockquote, code toggles), or Markdown
- **Extras:** start with "Lorem ipsum…", live word/sentence/char stats, copy, download (`.txt`/`.html`/`.md`)

## Stack

Astro 5 (static output) · React 19 islands · Tailwind CSS v4 · TypeScript. Light theme by
default with a persisted dark toggle.

## Develop

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # static output → dist/
npm run preview   # serve the production build
```

## Add a tool

1. Add an entry to `src/lib/tools-registry.ts` (`status: "ready"` when shipping).
2. Build the React island under `src/components/tools/`.
3. Import it in `src/pages/tools/[slug].astro` and add one conditional render line.

## Deploy

Push to `main`. `.github/workflows/deploy.yml` builds and publishes to GitHub Pages.
Enable Pages → Source: **GitHub Actions** in repo settings once.
