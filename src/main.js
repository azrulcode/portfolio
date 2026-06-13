/* ============================================================
   main.js — the "entry point". The HTML loads ONLY this file; this
   file then imports and wires up everything else.

   Read this file FIRST. It's the table of contents for the whole app:
   each little section below sets up one feature and hands off the
   details to another module.

   JS / BROWSER CONCEPTS USED HERE:
   - import            → pull in code/values from other files
                         https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import
   - document.querySelector → find ONE element by a CSS selector
                         https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector
   - createElement / innerHTML → build HTML from data in JS
                         https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement
   - addEventListener  → run code in response to clicks, drops, etc.
                         https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
   - template literals `...${value}...` → slot values into strings
                         https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
   - localStorage      → remember the chosen accent colour between visits
                         https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
   - setInterval       → run code repeatedly on a timer (the uptime clock)
                         https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval
   ============================================================ */

import { NAME_ASCII } from './ascii.js';
import { Typewriter } from './typewriter.js';
import { initHoloPortrait } from './holo-portrait.js';
import { createGlobe } from './globe.js';
import { initScrollReveal, initSkillMeters } from './animations.js';
import { phrases, skills, projects } from './data.js';

// A tiny shortcut so we can write find('#thing') instead of the long
// document.querySelector('#thing') every time.
function find(selector) {
  return document.querySelector(selector);
}

// Convert a hex colour like "#fcee0a" into an "r, g, b" string ("252, 238, 10").
// The canvases need numbers to build rgba() colours.
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

// The cyberpunk-yellow default if the visitor hasn't picked an accent before.
const DEFAULT_ACCENT = '#fcee0a';

// Does the visitor's OS ask for less motion? (Accessibility setting.)
// If so we tell the globe + hologram to hold still.
// https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── 1. ASCII name + typewriter line ──────────────────────── */
const asciiElement = find('#ascii-art');
asciiElement.textContent = NAME_ASCII;
asciiElement.setAttribute('data-text', NAME_ASCII); // used by the CSS glitch effect

new Typewriter(find('#typewriter'), phrases).start();

/* ── 2. Skills (built from the `skills` array in data.js) ──── */
const skillsGrid = find('#skills-grid');
for (const skill of skills) {
  // level is 0–100; we show 10 segments, so divide by 10 and round.
  const filledSegments = Math.round(skill.level / 10);

  const row = document.createElement('div');
  row.className = 'skill-row';

  // Build 10 empty segments; animations.js lights up the filled ones on scroll.
  const segments = Array.from({ length: 10 }, () => '<i></i>').join('');

  row.innerHTML = `
    <div class="skill-top">
      <span class="skill-name">${skill.name}</span>
      <span class="skill-pct">${skill.level}%</span>
    </div>
    <div class="meter" data-filled="${filledSegments}">${segments}</div>`;

  skillsGrid.appendChild(row);
}

/* ── 3. Projects (built from the `projects` array in data.js) ─ */
const projectsGrid = find('#projects-grid');
for (const project of projects) {
  const isLive = project.status === 'live';
  const isBuilding = project.status === 'building';

  // Each card is a clickable link (<a>) that opens the repo in a new tab.
  const card = document.createElement('a');
  card.className = 'project-card';
  card.href = project.url;
  card.target = '_blank';
  card.rel = 'noopener';

  // .map(...).join('') turns the tags array into one string of <span>s.
  const tagsHtml = project.tags
    .map((tag) => `<span class="project-tag">${tag}</span>`)
    .join('');

  card.innerHTML = `
    <div class="project-head">
      <span class="project-name">${project.name}</span>
      <span class="badge${isLive ? ' badge--live' : ''}">${isBuilding ? '<i></i>' : ''}${project.status}</span>
    </div>
    <p class="project-desc">${project.desc}</p>
    <div class="project-foot">
      <div class="project-tags">${tagsHtml}</div>
      <span class="project-link">cd ></span>
    </div>`;

  projectsGrid.appendChild(card);
}

/* ── 4. Holographic portrait ───────────────────────────────── */
// Renders profile.png as a floating hologram. Smaller on phones (cheaper).
const portraitSize = window.innerWidth <= 560 ? 260 : 340;
const portrait = initHoloPortrait(find('#holo-portrait'), { size: portraitSize, reduceMotion });

/* ── 5. The world globe / monitor ──────────────────────────── */
const teleRoute = find('#tele-route');
const teleLatency = find('#tele-latency');

const savedAccent = localStorage.getItem('accent') || DEFAULT_ACCENT;

const globe = createGlobe(find('#globe'), {
  accent: hexToRgb(savedAccent),
  mode: 'globe',
  reduceMotion,
  // Every time a new arc spawns, update the little telemetry readout.
  onArc: (route, latencyMs) => {
    teleRoute.textContent = route;
    teleLatency.textContent = String(latencyMs);
  },
});
globe.start();

// The globe/map toggle buttons in the monitor's title bar.
const monModes = find('#mon-modes');
monModes.querySelectorAll('button').forEach((button) => {
  button.addEventListener('click', () => {
    // Mark just the clicked button as "on".
    monModes.querySelectorAll('button').forEach((b) => b.classList.remove('on'));
    button.classList.add('on');
    globe.setMode(button.dataset.mode);
  });
});

// ── Pause heavy canvas animations when they can't be seen ──
// Both the globe and the hologram run animation loops. There's no point
// burning CPU/battery drawing them while they're scrolled off-screen or the
// browser tab is in the background. This watches each canvas and stops/starts
// its loop accordingly.
function pauseWhenHidden(element, handle) {
  let onScreen = true;
  const update = () => {
    if (onScreen && !document.hidden) handle.start();
    else handle.stop();
  };
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      onScreen = entries[0].isIntersecting;
      update();
    }, { threshold: 0.01 }).observe(element);
  }
  // Also pause when the whole tab is hidden (switched away / minimised).
  document.addEventListener('visibilitychange', update);
}
pauseWhenHidden(find('#globe'), globe);
pauseWhenHidden(find('#holo-portrait'), portrait);

// The uptime clock: update the HH:MM:SS readout once per second.
const teleUptime = find('#tele-uptime');
function twoDigits(n) {
  return String(n).padStart(2, '0');
}
setInterval(() => {
  const now = new Date();
  teleUptime.textContent =
    `${twoDigits(now.getHours())}:${twoDigits(now.getMinutes())}:${twoDigits(now.getSeconds())}`;
}, 1000);

/* ── 6. Accent colour picker ───────────────────────────────── */
const accentDots = find('#accent-dots');

// Apply an accent everywhere: CSS variables (for the whole page) + both
// canvases (globe + portrait), and optionally remember the choice.
function applyAccent(hex, shouldPersist = true) {
  // These two CSS variables drive every accent-coloured thing in style.css.
  document.documentElement.style.setProperty('--accent', hex);
  document.documentElement.style.setProperty('--accent-rgb', hexToRgb(hex));

  globe.setAccent(hexToRgb(hex));
  portrait.setAccent(hex);

  // Mark the matching dot as selected.
  accentDots.querySelectorAll('.accent-dot').forEach((dot) => {
    dot.classList.toggle('on', dot.dataset.accent === hex);
  });

  if (shouldPersist) {
    try { localStorage.setItem('accent', hex); } catch { /* storage blocked */ }
  }
}

accentDots.querySelectorAll('.accent-dot').forEach((dot) => {
  dot.addEventListener('click', () => applyAccent(dot.dataset.accent));
});

// Apply the saved (or default) accent on first load. We pass `false` so we
// don't re-save what we just read.
applyAccent(savedAccent, false);

/* ── 7. Scroll animations ──────────────────────────────────── */
initScrollReveal();
initSkillMeters();
