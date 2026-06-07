/**
 * ASCII Portrait
 * Technique adapted from gazijarin.com (Gazi Jarin) — github.com/gazijarin/Gazi-V2
 * Ported to vanilla TypeScript for this project.
 */

interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  char: string;
  baseAlpha: number;
  currentAlpha: number;
  delay: number;
  shimmer: number;
}

const CHARS = ' .:-=+*#%@'.split('');

function getPortraitSize(): number {
  const w = window.innerWidth;
  if (w <= 480) return Math.min(180, w - 40);
  if (w <= 768) return 220;
  return 280;
}

function hexToRgb(hex: string): string {
  const clean = hex.trim().replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function sampleImage(
  img: HTMLImageElement,
  size: number,
): Array<{ x: number; y: number; char: string; alpha: number }> {
  const offscreen = document.createElement('canvas');
  offscreen.width = size;
  offscreen.height = size;
  const ctx = offscreen.getContext('2d')!;

  const scale = 0.8;
  const aspect = img.width / img.height;
  let dh = size * scale;
  let dw = dh * aspect;
  if (dw > size * scale) { dw = size * scale; dh = dw / aspect; }
  ctx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh);

  const { data } = ctx.getImageData(0, 0, size, size);
  const fontSize = size <= 220 ? 5 : 7;
  const colGap = fontSize * 0.7;
  const rowGap = fontSize * 1.1;
  const out: Array<{ x: number; y: number; char: string; alpha: number }> = [];

  for (let y = 0; y < size; y += rowGap) {
    for (let x = 0; x < size; x += colGap) {
      const i = (Math.floor(y) * size + Math.floor(x)) * 4;
      if (data[i + 3] > 128) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / (3 * 255);
        out.push({
          x: +x.toFixed(1),
          y: +y.toFixed(1),
          char: CHARS[Math.floor(brightness * (CHARS.length - 1))],
          alpha: +(0.4 + brightness * 0.6).toFixed(2),
        });
      }
    }
  }
  return out;
}

function makeParticles(
  raw: ReturnType<typeof sampleImage>,
): Particle[] {
  return raw.map(p => ({
    x: p.x + (Math.random() - 0.5) * 400,
    y: p.y + (Math.random() - 0.5) * 400,
    targetX: p.x,
    targetY: p.y,
    vx: 0, vy: 0,
    char: p.char,
    baseAlpha: p.alpha,
    currentAlpha: 0,
    delay: Math.random() * 0.4,
    shimmer: Math.random() * Math.PI * 2,
  }));
}

export function initAsciiPortrait(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')!;
  let size = getPortraitSize();
  let particles: Particle[] = [];
  let startTime = 0;
  let dataReady = false;
  let animId = 0;

  const mouse = { x: -1000, y: -1000, active: false };
  const mouseTarget = { x: -1000, y: -1000 };

  // Track accent color across theme switches
  let accentRgb = '0, 255, 136';
  const syncAccent = () => {
    const hex = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent').trim();
    if (hex) accentRgb = hexToRgb(hex);
  };
  syncAccent();
  new MutationObserver(syncAccent).observe(document.body, {
    attributes: true,
    attributeFilter: ['class'],
  });

  const resize = (s: number) => {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = s * dpr;
    canvas.height = s * dpr;
    canvas.style.width = `${s}px`;
    canvas.style.height = `${s}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const drawPlaceholder = () => {
    const s = size;
    ctx.clearRect(0, 0, s, s);
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lines = [
      '[ add public/profile.png',
      '  to show your portrait ]',
    ];
    ctx.fillStyle = `rgba(${accentRgb}, 0.25)`;
    lines.forEach((line, i) => ctx.fillText(line, s / 2, s / 2 + i * 14 - 7));
  };

  const load = (s: number) => {
    dataReady = false;
    resize(s);
    const img = new Image();
    img.src = '/profile.png';
    img.onload = () => {
      particles = makeParticles(sampleImage(img, s));
      dataReady = true;
      startTime = performance.now();
    };
    img.onerror = () => {
      // show placeholder hint on canvas
      drawPlaceholder();
    };
  };

  const draw = () => {
    animId = requestAnimationFrame(draw);
    if (!dataReady) return;

    ctx.clearRect(0, 0, size, size);
    if (!particles.length) return;

    const elapsed = (performance.now() - startTime) / 1000;
    mouse.x += (mouseTarget.x - mouse.x) * 0.15;
    mouse.y += (mouseTarget.y - mouse.y) * 0.15;

    const fontSize = size <= 220 ? 5 : 7;
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const p of particles) {
      const pt = elapsed - p.delay;
      if (pt < 0) continue;

      const fade = 1 - Math.pow(1 - Math.min(pt / 1.5, 1), 2);
      const isActive = mouse.active || pt < 3.0;
      const shimmer = isActive ? Math.sin(elapsed * 2 + p.shimmer) * 0.1 : 0;
      p.currentAlpha = Math.max(0, p.baseAlpha * fade + shimmer);

      const easedMove = 1 - Math.pow(1 - Math.min(pt / 2.5, 1), 3);

      if (mouse.active) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = size * 0.2;
        if (dist < maxDist && dist > 0) {
          const force = (1 - dist / maxDist) * 4;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }

      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      p.vx += dx * (0.01 + easedMove * 0.08);
      p.vy += dy * (0.01 + easedMove * 0.08);

      if (isActive) {
        p.vx += Math.sin(elapsed * 0.5 + p.targetY * 0.1) * 0.15;
        p.vy += Math.cos(elapsed * 0.5 + p.targetX * 0.1) * 0.15;
        p.vx *= 0.92;
        p.vy *= 0.92;
      } else {
        p.vx *= 0.85;
        p.vy *= 0.85;
        if (pt > 4 && Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
          p.x = p.targetX; p.y = p.targetY; p.vx = 0; p.vy = 0;
        }
      }

      p.x += p.vx;
      p.y += p.vy;

      ctx.fillStyle = `rgba(${accentRgb}, ${p.currentAlpha})`;
      ctx.fillText(p.char, p.x, p.y);
    }
  };

  // Events
  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mouseTarget.x = e.clientX - r.left;
    mouseTarget.y = e.clientY - r.top;
    mouse.active = true;
  });
  canvas.addEventListener('mouseleave', () => {
    mouse.active = false;
    mouseTarget.x = -1000;
    mouseTarget.y = -1000;
  });
  canvas.addEventListener('touchmove', e => {
    const r = canvas.getBoundingClientRect();
    const t = e.touches[0];
    mouseTarget.x = t.clientX - r.left;
    mouseTarget.y = t.clientY - r.top;
    mouse.active = true;
    if (e.cancelable) e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchend', () => { mouse.active = false; });

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const next = getPortraitSize();
      if (next !== size) {
        size = next;
        cancelAnimationFrame(animId);
        load(size);
        draw();
      }
    }, 200);
  });

  load(size);
  draw();
}
