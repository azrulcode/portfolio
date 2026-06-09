/* ============================================================
   main.ts — Azrul Yeop portfolio
   ============================================================ */
import { NAME_ASCII } from './ascii';
import { Typewriter } from './typewriter';
import { initAsciiPortrait, type PortraitHandle } from './ascii-portrait';
import { createGlobe, type GlobeHandle, type GlobeMode } from './globe';
import { initScrollReveal, initSkillMeters } from './animations';
import { phrases, skills, projects } from './data';
import './style.css';

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

function hexToRgb(hex: string): string {
  const c = hex.replace('#', '');
  return `${parseInt(c.slice(0, 2), 16)}, ${parseInt(c.slice(2, 4), 16)}, ${parseInt(c.slice(4, 6), 16)}`;
}

/* ── ASCII name + typewriter ── */
$('#ascii-art').textContent = NAME_ASCII;
new Typewriter($('#typewriter'), phrases).start();

/* ── Skills ── */
const skillsGrid = $('#skills-grid');
for (const { name, level } of skills) {
  const filled = Math.round(level / 10);
  const row = document.createElement('div');
  row.className = 'skill-row';
  const segs = Array.from({ length: 10 }, () => '<i></i>').join('');
  row.innerHTML = `
    <div class="skill-top"><span class="skill-name">${name}</span><span class="skill-pct">${level}%</span></div>
    <div class="meter" data-filled="${filled}">${segs}</div>`;
  skillsGrid.appendChild(row);
}

/* ── Projects ── */
const projectsGrid = $('#projects-grid');
for (const p of projects) {
  const live = p.status === 'live';
  const card = document.createElement('a');
  card.className = 'project-card';
  card.href = p.url; card.target = '_blank'; card.rel = 'noopener';
  card.innerHTML = `
    <div class="project-head">
      <span class="project-name">${p.name}</span>
      <span class="badge${live ? ' badge--live' : ''}">${p.status === 'building' ? '<i></i>' : ''}${p.status}</span>
    </div>
    <p class="project-desc">${p.desc}</p>
    <div class="project-foot">
      <div class="project-tags">${p.tags.map((t) => `<span class="project-tag">${t}</span>`).join('')}</div>
      <span class="project-link">cd ↗</span>
    </div>`;
  projectsGrid.appendChild(card);
}

/* ── ASCII portrait + photo drop ── */
const portraitSize = window.innerWidth <= 560 ? 200 : 250;
const portrait: PortraitHandle = initAsciiPortrait($('#ascii-portrait') as HTMLCanvasElement, { size: portraitSize });

const frame = $('#portrait-frame');
frame.addEventListener('dragover', (e) => { e.preventDefault(); frame.classList.add('drag-over'); });
frame.addEventListener('dragleave', () => frame.classList.remove('drag-over'));
frame.addEventListener('drop', (e) => {
  e.preventDefault(); frame.classList.remove('drag-over');
  const f = e.dataTransfer?.files?.[0];
  if (f && f.type.startsWith('image/')) portrait.setImageFile(f);
});
const fileInput = $<HTMLInputElement>('#portrait-file');
$('#portrait-browse').addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => { const f = fileInput.files?.[0]; if (f) portrait.setImageFile(f); });

/* ── Globe / world monitor ── */
const teleRoute = $('#tele-route');
const teleLatency = $('#tele-latency');
const globe: GlobeHandle = createGlobe($('#globe') as HTMLCanvasElement, {
  accent: hexToRgb(localStorage.getItem('accent') || '#00ff88'),
  mode: 'globe',
  onArc: (route, ms) => { teleRoute.textContent = route; teleLatency.textContent = String(ms); },
});
globe.start();

// monitor mode toggle
const monModes = $('#mon-modes');
monModes.querySelectorAll<HTMLButtonElement>('button').forEach((btn) => {
  btn.addEventListener('click', () => {
    monModes.querySelectorAll('button').forEach((b) => b.classList.remove('on'));
    btn.classList.add('on');
    globe.setMode(btn.dataset.mode as GlobeMode);
  });
});

// uptime clock
const teleUptime = $('#tele-uptime');
const pad = (n: number) => String(n).padStart(2, '0');
setInterval(() => {
  const d = new Date();
  teleUptime.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}, 1000);

/* ── Accent color ── */
const accentDots = $('#accent-dots');
function applyAccent(hex: string, persist = true): void {
  document.documentElement.style.setProperty('--accent', hex);
  document.documentElement.style.setProperty('--accent-rgb', hexToRgb(hex));
  globe.setAccent(hexToRgb(hex));
  portrait.setAccent(hex);
  accentDots.querySelectorAll<HTMLButtonElement>('.accent-dot').forEach((d) =>
    d.classList.toggle('on', d.dataset.accent === hex));
  if (persist) { try { localStorage.setItem('accent', hex); } catch { /* ignore */ } }
}
accentDots.querySelectorAll<HTMLButtonElement>('.accent-dot').forEach((dot) =>
  dot.addEventListener('click', () => applyAccent(dot.dataset.accent!)));
applyAccent(localStorage.getItem('accent') || '#00ff88', false);

/* ── Theme ── */
const toggleBtn = $<HTMLButtonElement>('#theme-toggle');
function applyTheme(light: boolean): void {
  document.body.classList.toggle('light', light);
  toggleBtn.textContent = light ? '[ dark ]' : '[ light ]';
}
applyTheme(localStorage.getItem('theme') === 'light');
toggleBtn.addEventListener('click', () => {
  const next = !document.body.classList.contains('light');
  applyTheme(next);
  try { localStorage.setItem('theme', next ? 'light' : 'dark'); } catch { /* ignore */ }
});

/* ── Animations ── */
initScrollReveal();
initSkillMeters();
