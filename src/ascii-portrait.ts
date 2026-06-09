/* ============================================================
   ascii-portrait.ts — particle ASCII portrait
   Technique adapted from gazijarin.com (Gazi Jarin).
   Renders a placeholder bust until a real photo is supplied —
   drop a square image on the frame (or use the file picker).
   The chosen image persists in localStorage.
   ============================================================ */

const CHARS = ' .:-=+*#%@'.split('');
const LS_KEY = 'azrul-portrait-img';

interface Raw { x: number; y: number; char: string; alpha: number; }
interface Particle {
  x: number; y: number; tx: number; ty: number; vx: number; vy: number;
  char: string; baseAlpha: number; alpha: number; delay: number; shimmer: number;
}

export interface PortraitOptions { accent?: string; size?: number; }
export interface PortraitHandle {
  setAccent(hex: string): void;
  setImageFile(file: File): void;
  reset(): void;
}

function hexToRgb(hex: string): string {
  const c = hex.trim().replace('#', '');
  return `${parseInt(c.slice(0, 2), 16)}, ${parseInt(c.slice(2, 4), 16)}, ${parseInt(c.slice(4, 6), 16)}`;
}

function placeholderCanvas(size: number): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = size; cv.height = size;
  const c = cv.getContext('2d')!;
  c.fillStyle = '#000'; c.fillRect(0, 0, size, size);
  const cxp = size * 0.5;
  const g1 = c.createRadialGradient(cxp, size * 0.92, size * 0.1, cxp, size * 0.95, size * 0.55);
  g1.addColorStop(0, '#cfcfcf'); g1.addColorStop(1, '#202020');
  c.fillStyle = g1;
  c.beginPath();
  c.moveTo(size * 0.12, size);
  c.bezierCurveTo(size * 0.16, size * 0.74, size * 0.34, size * 0.66, cxp, size * 0.66);
  c.bezierCurveTo(size * 0.66, size * 0.66, size * 0.84, size * 0.74, size * 0.88, size);
  c.closePath(); c.fill();
  c.fillStyle = '#8a8a8a';
  c.fillRect(cxp - size * 0.07, size * 0.55, size * 0.14, size * 0.16);
  const g2 = c.createRadialGradient(cxp - size * 0.06, size * 0.32, size * 0.04, cxp, size * 0.38, size * 0.30);
  g2.addColorStop(0, '#e8e8e8'); g2.addColorStop(0.6, '#9a9a9a'); g2.addColorStop(1, '#1c1c1c');
  c.fillStyle = g2;
  c.beginPath(); c.ellipse(cxp, size * 0.38, size * 0.185, size * 0.235, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#3a3a3a';
  c.beginPath(); c.ellipse(cxp, size * 0.30, size * 0.20, size * 0.16, 0, Math.PI, Math.PI * 2); c.fill();
  return cv;
}

function sample(img: CanvasImageSource, size: number): Raw[] {
  const off = document.createElement('canvas');
  off.width = size; off.height = size;
  const c = off.getContext('2d', { willReadFrequently: true })!;
  const iw = (img as HTMLImageElement).width || size;
  const ih = (img as HTMLImageElement).height || size;
  const scale = 0.84;
  const aspect = iw / ih;
  let dh = size * scale, dw = dh * aspect;
  if (dw > size * scale) { dw = size * scale; dh = dw / aspect; }
  c.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh);
  const { data } = c.getImageData(0, 0, size, size);
  const fontSize = size <= 220 ? 5 : 6;
  const colGap = fontSize * 0.72, rowGap = fontSize * 1.08;
  const out: Raw[] = [];
  for (let y = 0; y < size; y += rowGap) {
    for (let x = 0; x < size; x += colGap) {
      const i = (Math.floor(y) * size + Math.floor(x)) * 4;
      if (data[i + 3] > 110) {
        const b = (data[i] + data[i + 1] + data[i + 2]) / 765;
        if (b < 0.06) continue;
        out.push({
          x: +x.toFixed(1), y: +y.toFixed(1),
          char: CHARS[Math.floor(b * (CHARS.length - 1))],
          alpha: +(0.4 + b * 0.6).toFixed(2),
        });
      }
    }
  }
  return out;
}

function makeParticles(raw: Raw[]): Particle[] {
  return raw.map((p) => ({
    x: p.x + (Math.random() - 0.5) * 420, y: p.y + (Math.random() - 0.5) * 420,
    tx: p.x, ty: p.y, vx: 0, vy: 0, char: p.char,
    baseAlpha: p.alpha, alpha: 0, delay: Math.random() * 0.4, shimmer: Math.random() * Math.PI * 2,
  }));
}

export function initAsciiPortrait(canvas: HTMLCanvasElement, opts: PortraitOptions = {}): PortraitHandle {
  const ctx = canvas.getContext('2d')!;
  const size = opts.size || 260;
  let particles: Particle[] = [], startTime = 0, ready = false;
  const mouse = { x: -1000, y: -1000, active: false };
  const target = { x: -1000, y: -1000 };
  let accentRgb = hexToRgb(opts.accent || '#00ff88');

  function resize(s: number): void {
    const d = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = s * d; canvas.height = s * d;
    canvas.style.width = s + 'px'; canvas.style.height = s + 'px';
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  function loadFromImage(img: CanvasImageSource): void {
    resize(size);
    particles = makeParticles(sample(img, size));
    ready = true; startTime = performance.now();
  }
  function loadPlaceholder(): void {
    resize(size);
    particles = makeParticles(sample(placeholderCanvas(size), size));
    ready = true; startTime = performance.now();
  }
  function loadDataUrl(url: string, store: boolean): void {
    const img = new Image();
    img.onload = () => { loadFromImage(img); if (store) { try { localStorage.setItem(LS_KEY, url); } catch { /* ignore */ } } };
    img.onerror = () => loadPlaceholder();
    img.src = url;
  }
  function loadProfile(): void {
    const img = new Image();
    img.onload = () => loadFromImage(img);
    img.onerror = () => loadPlaceholder();
    img.src = '/profile.png';
  }

  function draw(): void {
    requestAnimationFrame(draw);
    if (!ready) return;
    ctx.clearRect(0, 0, size, size);
    const elapsed = (performance.now() - startTime) / 1000;
    mouse.x += (target.x - mouse.x) * 0.15;
    mouse.y += (target.y - mouse.y) * 0.15;
    const fontSize = size <= 220 ? 5 : 6;
    ctx.font = fontSize + 'px JetBrains Mono, monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const p of particles) {
      const pt = elapsed - p.delay;
      if (pt < 0) continue;
      const fade = 1 - Math.pow(1 - Math.min(pt / 1.5, 1), 2);
      const isActive = mouse.active || pt < 3.0;
      const shimmer = isActive ? Math.sin(elapsed * 2 + p.shimmer) * 0.1 : 0;
      p.alpha = Math.max(0, p.baseAlpha * fade + shimmer);
      const eMove = 1 - Math.pow(1 - Math.min(pt / 2.5, 1), 3);
      if (mouse.active) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy), maxD = size * 0.2;
        if (dist < maxD && dist > 0) { const f = (1 - dist / maxD) * 4; p.vx += (dx / dist) * f; p.vy += (dy / dist) * f; }
      }
      const dx = p.tx - p.x, dy = p.ty - p.y;
      p.vx += dx * (0.01 + eMove * 0.08); p.vy += dy * (0.01 + eMove * 0.08);
      if (isActive) {
        p.vx += Math.sin(elapsed * 0.5 + p.ty * 0.1) * 0.15;
        p.vy += Math.cos(elapsed * 0.5 + p.tx * 0.1) * 0.15;
        p.vx *= 0.92; p.vy *= 0.92;
      } else {
        p.vx *= 0.85; p.vy *= 0.85;
        if (pt > 4 && Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) { p.x = p.tx; p.y = p.ty; p.vx = 0; p.vy = 0; }
      }
      p.x += p.vx; p.y += p.vy;
      ctx.fillStyle = `rgba(${accentRgb},${p.alpha})`;
      ctx.fillText(p.char, p.x, p.y);
    }
  }

  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    target.x = e.clientX - r.left; target.y = e.clientY - r.top; mouse.active = true;
  });
  canvas.addEventListener('mouseleave', () => { mouse.active = false; target.x = -1000; target.y = -1000; });
  canvas.addEventListener('touchmove', (e) => {
    const r = canvas.getBoundingClientRect(); const t = e.touches[0];
    target.x = t.clientX - r.left; target.y = t.clientY - r.top; mouse.active = true;
    if (e.cancelable) e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchend', () => { mouse.active = false; });

  let stored: string | null = null;
  try { stored = localStorage.getItem(LS_KEY); } catch { /* ignore */ }
  if (stored) loadDataUrl(stored, false); else loadProfile();
  draw();

  return {
    setAccent(hex: string) { accentRgb = hexToRgb(hex); },
    setImageFile(file: File) {
      const reader = new FileReader();
      reader.onload = () => loadDataUrl(String(reader.result), true);
      reader.readAsDataURL(file);
    },
    reset() { try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ } loadPlaceholder(); },
  };
}
