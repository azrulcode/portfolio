/* ============================================================
   globe.ts — dotted rotating globe + flat monitor map
   ============================================================ */

export interface City {
  n: string;
  city: string;
  lat: number;
  lng: number;
  home?: boolean;
  hub?: boolean;
}

export interface GlobeOptions {
  accent?: string;
  mode?: GlobeMode;
  onArc?: (route: string, ms: number) => void;
}

export type GlobeMode = 'globe' | 'map' | 'off';

export interface GlobeHandle {
  start(): void;
  stop(): void;
  setAccent(rgb: string): void;
  setMode(m: GlobeMode): void;
  cities: City[];
}

interface Vec3 { x: number; y: number; z: number; }
interface CityVec extends City { v: Vec3; }
interface Arc { a: Vec3; b: Vec3; from: City; to: City; t0: number; dur: number; primary: boolean; }

export const CITIES: City[] = [
  { n: 'KUL', city: 'Kuala Lumpur', lat: 3.14,   lng: 101.69, home: true },
  { n: 'SIN', city: 'Singapore',    lat: 1.35,   lng: 103.82 },
  { n: 'SFO', city: 'San Francisco',lat: 37.77,  lng: -122.42, hub: true },
  { n: 'JFK', city: 'New York',     lat: 40.71,  lng: -74.01,  hub: true },
  { n: 'SEA', city: 'Seattle',      lat: 47.61,  lng: -122.33 },
  { n: 'AUS', city: 'Austin',       lat: 30.27,  lng: -97.74 },
  { n: 'LAX', city: 'Los Angeles',  lat: 34.05,  lng: -118.24 },
  { n: 'LHR', city: 'London',       lat: 51.51,  lng: -0.13 },
  { n: 'BER', city: 'Berlin',       lat: 52.52,  lng: 13.40 },
  { n: 'CDG', city: 'Paris',        lat: 48.86,  lng: 2.35 },
  { n: 'AMS', city: 'Amsterdam',    lat: 52.37,  lng: 4.90 },
  { n: 'HND', city: 'Tokyo',        lat: 35.68,  lng: 139.65 },
  { n: 'ICN', city: 'Seoul',        lat: 37.57,  lng: 126.98 },
  { n: 'HKG', city: 'Hong Kong',    lat: 22.32,  lng: 114.17 },
  { n: 'PVG', city: 'Shanghai',     lat: 31.23,  lng: 121.47 },
  { n: 'SYD', city: 'Sydney',       lat: -33.87, lng: 151.21 },
  { n: 'DXB', city: 'Dubai',        lat: 25.20,  lng: 55.27 },
  { n: 'BOM', city: 'Mumbai',       lat: 19.08,  lng: 72.88 },
  { n: 'BLR', city: 'Bangalore',    lat: 12.97,  lng: 77.59 },
  { n: 'BKK', city: 'Bangkok',      lat: 13.76,  lng: 100.50 },
  { n: 'CGK', city: 'Jakarta',      lat: -6.21,  lng: 106.85 },
  { n: 'IST', city: 'Istanbul',     lat: 41.01,  lng: 28.98 },
  { n: 'GRU', city: 'São Paulo',    lat: -23.55, lng: -46.63 },
  { n: 'YYZ', city: 'Toronto',      lat: 43.65,  lng: -79.38 },
  { n: 'LOS', city: 'Lagos',        lat: 6.52,   lng: 3.38 },
  { n: 'NBO', city: 'Nairobi',      lat: -1.29,  lng: 36.82 },
];

const D2R = Math.PI / 180;

function vec(lat: number, lng: number): Vec3 {
  const a = lat * D2R, b = lng * D2R;
  return { x: Math.cos(a) * Math.sin(b), y: Math.sin(a), z: Math.cos(a) * Math.cos(b) };
}
function slerp(a: Vec3, b: Vec3, t: number): Vec3 {
  let dot = a.x * b.x + a.y * b.y + a.z * b.z;
  dot = Math.max(-1, Math.min(1, dot));
  const om = Math.acos(dot);
  if (om < 1e-4) return { ...a };
  const s = Math.sin(om);
  const w1 = Math.sin((1 - t) * om) / s, w2 = Math.sin(t * om) / s;
  return { x: a.x * w1 + b.x * w2, y: a.y * w1 + b.y * w2, z: a.z * w1 + b.z * w2 };
}

export function createGlobe(canvas: HTMLCanvasElement, opts: GlobeOptions = {}): GlobeHandle {
  const ctx = canvas.getContext('2d')!;
  let W = 0, H = 0, dpr = 1, R = 0, cx = 0, cy = 0;
  let accent = opts.accent || '0, 255, 136';
  let mode: GlobeMode = opts.mode || 'globe';
  const onArc = opts.onArc || (() => {});

  let rot = -1.4;
  const spin = 0.0022;
  const tilt = -0.34;
  let dragV = 0;
  let dragging = false, lastX = 0;

  const grid: Vec3[] = [];
  for (let lat = -82; lat <= 82; lat += 7) {
    const r = Math.cos(lat * D2R);
    const count = Math.max(6, Math.round(58 * r));
    for (let i = 0; i < count; i++) {
      const lng = -180 + (360 * i) / count;
      grid.push(vec(lat, lng));
    }
  }
  const cityVecs: CityVec[] = CITIES.map((c) => ({ ...c, v: vec(c.lat, c.lng) }));

  const arcs: Arc[] = [];
  const home = cityVecs.find((c) => c.home);
  const hubs = cityVecs.filter((c) => c.hub);
  function spawnArc(a: CityVec, b: CityVec, primary: boolean): void {
    const dur = 2600 + Math.random() * 1400;
    arcs.push({ a: a.v, b: b.v, from: a, to: b, t0: performance.now(), dur, primary });
    onArc(a.n + '→' + b.n, Math.round(120 + Math.random() * 240));
  }
  let lastSpawn = 0, primaryIdx = 0;
  function maybeSpawn(now: number): void {
    if (now - lastSpawn < 1500) return;
    lastSpawn = now;
    if (Math.random() < 0.5 && home) {
      const dst = hubs[primaryIdx % hubs.length]; primaryIdx++;
      spawnArc(home, dst, true);
    } else {
      const a = cityVecs[(Math.random() * cityVecs.length) | 0];
      const b = cityVecs[(Math.random() * cityVecs.length) | 0];
      if (a !== b) spawnArc(a, b, false);
    }
  }

  function rotatePt(p: Vec3): Vec3 {
    const cosR = Math.cos(rot), sinR = Math.sin(rot);
    const x = p.x * cosR + p.z * sinR;
    const z = -p.x * sinR + p.z * cosR;
    const y = p.y;
    const cosT = Math.cos(tilt), sinT = Math.sin(tilt);
    const ny = y * cosT - z * sinT;
    const nz = y * sinT + z * cosT;
    return { x, y: ny, z: nz };
  }
  function project(p: Vec3) {
    const r = rotatePt(p);
    return { x: cx + r.x * R, y: cy - r.y * R, z: r.z, front: r.z > 0 };
  }

  function resize(): void {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = rect.width; H = rect.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W / 2; cy = H / 2;
    R = Math.min(W, H) * 0.40;
  }

  const rgba = (a: number) => `rgba(${accent},${a})`;

  function drawGlobe(now: number): void {
    ctx.clearRect(0, 0, W, H);
    const grd = ctx.createRadialGradient(cx, cy - R * 0.2, R * 0.1, cx, cy, R);
    grd.addColorStop(0, rgba(0.05)); grd.addColorStop(1, rgba(0.0));
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

    for (const p of grid) {
      const pr = project(p);
      const depth = (pr.z + 1) / 2;
      const a = pr.front ? 0.12 + depth * 0.5 : 0.05;
      const size = pr.front ? 0.7 + depth * 1.0 : 0.6;
      ctx.fillStyle = rgba(a);
      ctx.beginPath(); ctx.arc(pr.x, pr.y, size, 0, Math.PI * 2); ctx.fill();
    }

    ctx.strokeStyle = rgba(0.18); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();

    for (let i = arcs.length - 1; i >= 0; i--) {
      const arc = arcs[i];
      const prog = (now - arc.t0) / arc.dur;
      if (prog > 1.25) { arcs.splice(i, 1); continue; }
      const head = Math.min(1, prog);
      const fade = prog > 1 ? 1 - (prog - 1) / 0.25 : 1;
      const steps = 48;
      ctx.lineWidth = arc.primary ? 1.6 : 1;
      ctx.beginPath();
      let started = false;
      for (let s = 0; s <= steps; s++) {
        const t = (s / steps) * head;
        const sp = slerp(arc.a, arc.b, t);
        const lift = 1 + 0.18 * Math.sin(Math.PI * (t / Math.max(head, 0.001)));
        const pr = project({ x: sp.x * lift, y: sp.y * lift, z: sp.z * lift });
        if (!pr.front) { started = false; continue; }
        if (!started) { ctx.moveTo(pr.x, pr.y); started = true; }
        else ctx.lineTo(pr.x, pr.y);
      }
      ctx.strokeStyle = rgba((arc.primary ? 0.85 : 0.5) * fade);
      ctx.stroke();
      const m = 1 + 0.18 * Math.sin(Math.PI * head);
      const sp = slerp(arc.a, arc.b, head);
      const hp = project({ x: sp.x * m, y: sp.y * m, z: sp.z * m });
      if (hp.front && prog <= 1) {
        ctx.fillStyle = rgba(0.95 * fade);
        ctx.shadowColor = rgba(0.8); ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(hp.x, hp.y, arc.primary ? 2.4 : 1.8, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    ctx.font = '600 9px JetBrains Mono, monospace';
    ctx.textBaseline = 'middle';
    for (const c of cityVecs) {
      const pr = project(c.v);
      if (!pr.front) continue;
      const depth = (pr.z + 1) / 2;
      const pulse = c.home ? (0.6 + 0.4 * Math.sin(now / 380)) : 1;
      const big = !!(c.home || c.hub);
      ctx.fillStyle = rgba((big ? 0.9 : 0.45) * (0.6 + depth * 0.4) * pulse);
      if (big) { ctx.shadowColor = rgba(0.7); ctx.shadowBlur = c.home ? 12 : 7; }
      ctx.beginPath(); ctx.arc(pr.x, pr.y, big ? 2.6 : 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      if (c.home) {
        const rr = 5 + (now / 16 % 60) / 60 * 10;
        ctx.strokeStyle = rgba(0.5 * (1 - (now / 16 % 60) / 60));
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(pr.x, pr.y, rr, 0, Math.PI * 2); ctx.stroke();
      }
      if (big && depth > 0.55) {
        ctx.textAlign = 'left';
        ctx.fillStyle = rgba(0.7);
        ctx.fillText(c.n, pr.x + 6, pr.y - 0.5);
      }
    }
  }

  function ll2xy(lat: number, lng: number, pad: number) {
    return {
      x: pad + ((lng + 180) / 360) * (W - pad * 2),
      y: pad + ((90 - lat) / 180) * (H - pad * 2),
    };
  }

  function drawMap(now: number): void {
    ctx.clearRect(0, 0, W, H);
    const pad = 18;
    for (let y = pad; y <= H - pad; y += 13) {
      for (let x = pad; x <= W - pad; x += 13) {
        ctx.fillStyle = rgba(0.07);
        ctx.beginPath(); ctx.arc(x, y, 0.7, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.strokeStyle = rgba(0.08); ctx.lineWidth = 1;
    for (let lng = -150; lng <= 150; lng += 30) {
      const a = ll2xy(0, lng, pad);
      ctx.beginPath(); ctx.moveTo(a.x, pad); ctx.lineTo(a.x, H - pad); ctx.stroke();
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      const a = ll2xy(lat, 0, pad);
      ctx.beginPath(); ctx.moveTo(pad, a.y); ctx.lineTo(W - pad, a.y); ctx.stroke();
    }
    const sy = pad + ((now / 22) % (H - pad * 2));
    const sg = ctx.createLinearGradient(0, sy - 30, 0, sy + 30);
    sg.addColorStop(0, rgba(0)); sg.addColorStop(0.5, rgba(0.14)); sg.addColorStop(1, rgba(0));
    ctx.fillStyle = sg; ctx.fillRect(pad, sy - 30, W - pad * 2, 60);
    ctx.strokeStyle = rgba(0.35); ctx.beginPath(); ctx.moveTo(pad, sy); ctx.lineTo(W - pad, sy); ctx.stroke();

    for (let i = arcs.length - 1; i >= 0; i--) {
      const arc = arcs[i];
      const prog = (now - arc.t0) / arc.dur;
      if (prog > 1.25) { arcs.splice(i, 1); continue; }
      const head = Math.min(1, prog);
      const fade = prog > 1 ? 1 - (prog - 1) / 0.25 : 1;
      const A = ll2xy(arc.from.lat, arc.from.lng, pad);
      const B = ll2xy(arc.to.lat, arc.to.lng, pad);
      const mx = (A.x + B.x) / 2, my = Math.min(A.y, B.y) - Math.abs(A.x - B.x) * 0.18 - 14;
      ctx.lineWidth = arc.primary ? 1.6 : 1;
      ctx.strokeStyle = rgba((arc.primary ? 0.8 : 0.45) * fade);
      ctx.beginPath(); ctx.moveTo(A.x, A.y);
      for (let s = 1; s <= 32; s++) {
        const t = (s / 32) * head;
        const xx = (1 - t) * (1 - t) * A.x + 2 * (1 - t) * t * mx + t * t * B.x;
        const yy = (1 - t) * (1 - t) * A.y + 2 * (1 - t) * t * my + t * t * B.y;
        ctx.lineTo(xx, yy);
      }
      ctx.stroke();
      const t = head;
      const hx = (1 - t) * (1 - t) * A.x + 2 * (1 - t) * t * mx + t * t * B.x;
      const hy = (1 - t) * (1 - t) * A.y + 2 * (1 - t) * t * my + t * t * B.y;
      if (prog <= 1) {
        ctx.fillStyle = rgba(0.95 * fade); ctx.shadowColor = rgba(0.8); ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(hx, hy, arc.primary ? 2.4 : 1.8, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      }
    }

    ctx.font = '600 9px JetBrains Mono, monospace'; ctx.textBaseline = 'middle';
    for (const c of cityVecs) {
      const p = ll2xy(c.lat, c.lng, pad);
      const big = !!(c.home || c.hub);
      if (big) {
        const ph = (now / 14 + (c.home ? 0 : 30)) % 70 / 70;
        ctx.strokeStyle = rgba(0.4 * (1 - ph)); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3 + ph * 12, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = rgba(big ? 0.9 : 0.4);
      if (big) { ctx.shadowColor = rgba(0.7); ctx.shadowBlur = c.home ? 11 : 6; }
      ctx.beginPath(); ctx.arc(p.x, p.y, big ? 2.4 : 1.3, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      if (big) { ctx.textAlign = 'left'; ctx.fillStyle = rgba(0.6); ctx.fillText(c.n, p.x + 5, p.y - 0.5); }
    }
  }

  let raf = 0, running = false;
  function frame(): void {
    if (!running) return;
    const now = performance.now();
    if (!dragging) { rot += spin + dragV; dragV *= 0.94; }
    maybeSpawn(now);
    if (mode === 'globe') drawGlobe(now);
    else if (mode === 'map') drawMap(now);
    raf = requestAnimationFrame(frame);
  }

  function clientX(e: MouseEvent | TouchEvent): number {
    return 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
  }
  function onDown(e: MouseEvent | TouchEvent): void { dragging = true; lastX = clientX(e); }
  function onMove(e: MouseEvent | TouchEvent): void {
    if (!dragging) return;
    const x = clientX(e); const dx = x - lastX; lastX = x;
    rot += dx * 0.006; dragV = dx * 0.0006;
    if ('touches' in e && e.cancelable) e.preventDefault();
  }
  function onUp(): void { dragging = false; }
  canvas.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  canvas.addEventListener('touchstart', onDown, { passive: true });
  canvas.addEventListener('touchmove', onMove, { passive: false });
  canvas.addEventListener('touchend', onUp);

  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);
  resize();

  return {
    start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } },
    stop() { running = false; cancelAnimationFrame(raf); ctx.clearRect(0, 0, W, H); },
    setAccent(rgb: string) { accent = rgb; },
    setMode(m: GlobeMode) {
      mode = m;
      if (m === 'off') { running = false; cancelAnimationFrame(raf); ctx.clearRect(0, 0, W, H); }
      else if (!running) { running = true; raf = requestAnimationFrame(frame); }
    },
    cities: CITIES,
  };
}
