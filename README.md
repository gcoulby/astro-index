# AstroIndex

Access the App (best from mobile) - https://gcoulby.github.io/astro-index/

A digital codex for the AstroPrisma tabletop RPG.

AstroIndex is a companion app for navigating the AstroPrisma rulebook. It
does not ship with, contain, or distribute any of the book's content.
Instead, you bring your own legally-owned PDF (single-page edition), and
AstroIndex extracts a searchable page index from it entirely in your
browser. Nothing is uploaded anywhere.

## Why this exists

The AstroPrisma PDF is genuinely well built, cross-referenced with clickable
page links throughout. But flipping through a physical copy of the book at
the table doesn't get any of that. AstroIndex closes that gap: point it at
your own copy of the PDF once, and get fast page lookup, a link map between
pages, and full-text search, all usable while playing from the physical
book.

## What it does

- **BYOB (Bring Your Own Book)**: import your own AstroPrisma PDF locally.
  Nothing is bundled with the app and nothing is sent to a server.
- **Page index**: jump straight to any page by number.
- **Page links**: see which pages a given page links to, and which pages
  link back to it, the same cross-referencing the PDF already has, made
  usable from a physical copy.
- **Fuzzy search**: search rulebook content by keyword and jump straight
  to the relevant page.

## What it deliberately doesn't do

- It doesn't display or export full page text anywhere. Search results
  show short snippets only.
- It doesn't extract or store any external/URL links from the PDF (dice
  roller shortcuts, etc.), only internal page-to-page references.
- It doesn't require an account, a server, or a network connection once
  your book is imported.

This isn't a way to read the book without owning it. It's a navigation
layer on top of a copy you already have.

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- pdf.js for in-browser PDF extraction
- Fuse.js for fuzzy search
- IndexedDB for local, persistent storage of your extracted index

## Getting started

```bash
pnpm install
pnpm run dev
```

Open the app, and on first launch you'll be prompted to import your own
AstroPrisma PDF (single-page edition). Extraction runs once and is cached
locally in your browser (IndexedDB), so you won't need to re-import it on
future visits, unless you clear your browser's site data.

To produce a production build locally:

```bash
pnpm run build
```

## Installing as an app

AstroIndex is a installable web app (PWA), so it can run full-screen from
your home screen or app list without a browser address bar, and keeps
working offline once your book has been imported.

**iOS / iPadOS (Safari)**
1. Open the app in Safari.
2. Tap the Share icon, then **Add to Home Screen**.
3. Confirm the name and tap **Add**.

**Android (Chrome)**
1. Open the app in Chrome.
2. Tap the ⋮ menu, then **Add to Home screen** (or use the **Install app**
   banner if it appears).
3. Confirm to add.

**Desktop (Chrome / Edge)**
1. Open the app.
2. Click the install icon in the address bar (or ⋮ menu → **Install
   AstroIndex...**).
3. Confirm to install.

**Desktop (Firefox / Safari)**
Firefox and desktop Safari don't support installing PWAs from the
address bar. Use the browser as normal, or bookmark the page for quick
access.

## Screens

1. **Splash** — landing screen.
2. **File Uploader** — import your own PDF (BYOB).
3. **Page Number Search** — scrollable, searchable list of every indexed
   page.
4. **Page Links** — tap a page to see what it links to and what links to
   it.
5. **Fuzzy Search** — keyword search across the whole book, ranked by
   relevance.

## Deployment

Pushes to `main` build the app and deploy it to GitHub Pages automatically
via [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)
(no commits to the repo, just a build artifact published to Pages). It can
also be triggered manually from the Actions tab. Live at
https://gcoulby.github.io/astro-index/.

## A note on legality and permission

AstroIndex is built with respect for ASTROPRISMA's own IP. It's a fan-made
navigation tool, not a redistribution of the book's content, no book text
is bundled, cached server-side, or shared between users. If you're the rights
holder and have any concerns about this project, please reach out.

## Licence

MIT
