# azrulcode.com — Cyberpunk edition

Personal portfolio for **Azrul Yeop**. Vanilla **HTML + CSS + JavaScript** —
no framework, no build step. Cyberpunk 2077 theme with a draggable real-world
globe and a holographic portrait.

> 🆕 New to the code? Read **[GUIDE.md](GUIDE.md)** — a beginner-friendly tour
> of every concept used here, in the order you should read the files, with
> links to MDN docs.

## Features

- **Cyberpunk 2077 theme** — neon yellow/cyan/red palette, scanlines, vignette,
  glitching title, and angular "notched" HUD panels. An accent-colour picker
  recolours the whole site (saved in your browser).
- **Real-world globe** — actual continents plotted as glowing dots (data baked
  from [Natural Earth](https://www.naturalearthdata.com/)). **Drag to rotate on
  both axes**: left/right spins it, up/down tilts it. Animated "net-trace" arcs
  fly between cities. Toggle to a flat map view.
- **Holographic portrait** — `profile.png` is rendered as a floating hologram:
  brightness becomes glowing see-through colour, with an RGB colour-split,
  scanlines, a sweeping light band, flicker, a projector glow, and a hover
  float that subtly tracks your mouse.
- **Typewriter intro, scroll reveals, animated skill meters.**

## Project structure

```
index.html            # page structure; loads src/main.js
style.css             # the entire cyberpunk theme
profile.png           # default portrait photo
CNAME                 # custom domain for GitHub Pages
src/
  main.js             # entry point — wires everything together (read this first)
  data.js             # all editable content (skills, projects, phrases)
  ascii.js            # the AZRUL text-art banner
  typewriter.js       # typing/deleting effect
  animations.js       # scroll-reveal + skill meters
  globe.js            # the draggable 3D world globe
  world-data.js       # baked land coordinates used by the globe
  holo-portrait.js    # the holographic photo portrait
GUIDE.md              # beginner reading guide + MDN links
```

## Run it locally

No build step — just serve the folder over HTTP (opening the file directly
won't work because ES modules need a real server):

- **VS Code:** *Live Server* extension → right-click `index.html` → "Open with Live Server".
- **Node:** `npm run dev`
- **Python:** `python -m http.server` then open http://localhost:8000

## Editing your content

Everything you'd want to change lives in **[`src/data.js`](src/data.js)**:

- **Skills** — edit the `skills` array (`name` + `level` percentage).
- **Projects** — edit the `projects` array (`name`, `desc`, `tags`, `url`, `status`).
- **Phrases** — edit the `phrases` array (the typewriter lines).

To change your photo, replace `profile.png` with a **square** image. Keep it
small (≈500×500, under ~300 KB) so the hologram appears instantly — a large
photo works but takes a couple of seconds to load. A photo with a dark or plain
background looks the most "holographic" (the subject floats; bright areas glow).

## Deploying to GitHub Pages

The workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
auto-deploys on every push to `main` — it simply copies the static files and
publishes them (no build).

**One-time setup:** GitHub repo → **Settings → Pages → Build and deployment**,
set source to **GitHub Actions**.

## Credits

- Globe land data: [Natural Earth](https://www.naturalearthdata.com/) (public domain).

© 2026 Azrul Yeop. All rights reserved.
