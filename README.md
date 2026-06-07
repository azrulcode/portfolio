# azrulcode.com

Personal portfolio — built with Vite + TypeScript. Terminal/ASCII aesthetic with dark & light mode.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

## Getting started

```bash
# 1. Clone the repo
git clone https://github.com/azrulcode/portfolio.git
cd portfolio

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Adding your photo

Drop a square PNG of yourself at `public/profile.png`. The ASCII portrait in the About section will generate automatically from it — no extra steps needed.

## Available commands

| Command | What it does |
|---|---|
| `npm run dev` | Start local dev server with hot reload |
| `npm run build` | Type-check + build production files to `dist/` |
| `npm run preview` | Preview the production build locally |

## Updating your content

All site data lives in one file — [`src/data.ts`](src/data.ts):

- **Skills** — edit the `skills` array (name + percentage)
- **Projects** — edit the `projects` array (name, description, tags, URL, status)

## Deploying to GitHub Pages

This repo ships with a GitHub Actions workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) that auto-deploys on every push to `main`.

**One-time setup:**
1. Push this repo to `azrulcode.github.io` on GitHub
2. Go to **Settings → Pages**
3. Under *Build and deployment*, set source to **GitHub Actions**

Every push to `main` after that triggers a build and deploy automatically.

## License

© 2025 Azrul Yeop. All rights reserved.

ASCII portrait technique inspired by [gazijarin.com](https://gazijarin.com).
