/* ============================================================
   holo-portrait.js — a true HOLOGRAM of the photo

   This is NOT ASCII art. We take the real photo (profile.png) and
   render it like a sci-fi hologram projection:
     - it "floats" (gentle up/down hover),
     - dark areas become see-through so the subject glows in mid-air
       (luminance keying),
     - the colour is split into cyan/magenta/accent ghosts (the classic
       "chromatic aberration" glitch),
     - horizontal scanlines + a slow light band sweep across it,
     - it flickers and occasionally jitters sideways,
     - a soft glow sits at the base, like a projector beam.

   There is no upload/drop here — it always shows profile.png (with a
   simple drawn fallback if that image is missing).

   HOW THE COLOUR/TRANSPARENCY TRICK WORKS:
   We read the photo's pixels once and build three pre-coloured "layers"
   (cyan, magenta, accent). In each layer every pixel keeps the photo's
   brightness as its OPACITY — so bright parts of the face are solid and
   dark parts fade to nothing. Drawing the three layers slightly offset,
   with additive blending, mixes them into glowing holographic colour.

   JS / BROWSER CONCEPTS USED HERE:
   - Canvas 2D + getImageData/createImageData → read & build pixels
     https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/getImageData
   - globalCompositeOperation 'lighter' → additive "light" blending
     https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation
   - requestAnimationFrame → the animation loop
     https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
   - Math.sin / Math.random → float, flicker, glitch
     https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math
   ============================================================ */

// The fixed hologram "ghost" colours (cyan + magenta) used for the split.
const GHOST_CYAN = [0, 229, 255];
const GHOST_MAGENTA = [255, 45, 120];

// Turn "#00e5ff" into [0, 229, 255]. Used for the accent (main) colour.
function hexToRgbArray(hex) {
  const clean = hex.trim().replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

// A simple drawn "bust" used only if profile.png can't be loaded.
function createFallback(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const c = canvas.getContext('2d');
  c.fillStyle = '#000';
  c.fillRect(0, 0, size, size);
  const cx = size * 0.5;
  const shoulders = c.createRadialGradient(cx, size * 0.92, size * 0.1, cx, size * 0.95, size * 0.55);
  shoulders.addColorStop(0, '#dcdcdc');
  shoulders.addColorStop(1, '#202020');
  c.fillStyle = shoulders;
  c.beginPath();
  c.moveTo(size * 0.12, size);
  c.bezierCurveTo(size * 0.16, size * 0.74, size * 0.34, size * 0.66, cx, size * 0.66);
  c.bezierCurveTo(size * 0.66, size * 0.66, size * 0.84, size * 0.74, size * 0.88, size);
  c.closePath();
  c.fill();
  c.fillStyle = '#9a9a9a';
  c.fillRect(cx - size * 0.07, size * 0.55, size * 0.14, size * 0.16);
  const head = c.createRadialGradient(cx - size * 0.06, size * 0.32, size * 0.04, cx, size * 0.38, size * 0.3);
  head.addColorStop(0, '#f0f0f0');
  head.addColorStop(0.6, '#9a9a9a');
  head.addColorStop(1, '#1c1c1c');
  c.fillStyle = head;
  c.beginPath();
  c.ellipse(cx, size * 0.38, size * 0.185, size * 0.235, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#3a3a3a';
  c.beginPath();
  c.ellipse(cx, size * 0.3, size * 0.2, size * 0.16, 0, Math.PI, Math.PI * 2);
  c.fill();
  return canvas;
}

export function initHoloPortrait(canvas, options = {}) {
  const ctx = canvas.getContext('2d');
  const cssSize = options.size || 320;

  // We draw at the device's real pixel resolution for crispness, then let
  // CSS shrink the canvas to cssSize on screen. `S` is that pixel size.
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  const S = Math.round(cssSize * ratio);
  canvas.width = S;
  canvas.height = S;
  canvas.style.width = cssSize + 'px';
  canvas.style.height = cssSize + 'px';

  let accentRgb = hexToRgbArray(options.accent || '#00e5ff');

  // Filled in once the photo loads:
  let sourcePixels = null;   // the photo's raw pixels (ImageData)
  let layers = null;         // { accent, cyan, magenta } pre-coloured canvases
  let isReady = false;
  let startTime = 0;
  let running = false;       // is the animation loop active? (paused off-screen)
  // When true, render ONE calm static frame instead of animating.
  const reduceMotion = options.reduceMotion || false;

  // A little parallax so the hologram subtly "tracks" the mouse.
  const parallax = { x: 0, y: 0, targetX: 0, targetY: 0 };

  // Draw the image centred and scaled to ~92% of the square, then read its
  // pixels so we can build the coloured layers from its brightness.
  function readSourcePixels(image) {
    const temp = document.createElement('canvas');
    temp.width = S;
    temp.height = S;
    const tctx = temp.getContext('2d', { willReadFrequently: true });

    const imageWidth = image.width || S;
    const imageHeight = image.height || S;
    const scale = 0.92;
    const aspect = imageWidth / imageHeight;
    let drawHeight = S * scale;
    let drawWidth = drawHeight * aspect;
    if (drawWidth > S * scale) {
      drawWidth = S * scale;
      drawHeight = drawWidth / aspect;
    }
    tctx.drawImage(image, (S - drawWidth) / 2, (S - drawHeight) / 2, drawWidth, drawHeight);
    return tctx.getImageData(0, 0, S, S);
  }

  // Build one solid-colour layer where each pixel's OPACITY = the photo's
  // brightness at that spot. Bright photo areas → solid colour; dark areas →
  // transparent. That's what makes the subject "float".
  function buildTintLayer(tintRgb) {
    const layer = document.createElement('canvas');
    layer.width = S;
    layer.height = S;
    const lctx = layer.getContext('2d');
    const out = lctx.createImageData(S, S);

    const src = sourcePixels.data;
    const dst = out.data;
    for (let i = 0; i < src.length; i += 4) {
      // brightness 0..1 from the photo's red/green/blue.
      const brightness = (src[i] + src[i + 1] + src[i + 2]) / 765;
      // Boost slightly + a gentle curve so mid-tones read well.
      let opacity = Math.pow(brightness, 1.05) * 1.25;
      if (opacity > 1) opacity = 1;
      // Respect the photo's own transparency, if any.
      if (src[i + 3] < 12) opacity = 0;

      dst[i] = tintRgb[0];
      dst[i + 1] = tintRgb[1];
      dst[i + 2] = tintRgb[2];
      dst[i + 3] = opacity * 255;
    }
    lctx.putImageData(out, 0, 0);
    return layer;
  }

  function rebuildLayers() {
    if (!sourcePixels) return;
    layers = {
      accent: buildTintLayer(accentRgb),
      cyan: buildTintLayer(GHOST_CYAN),
      magenta: buildTintLayer(GHOST_MAGENTA),
    };
  }

  function loadFromImage(image) {
    sourcePixels = readSourcePixels(image);
    rebuildLayers();
    isReady = true;
    startTime = performance.now();
    if (reduceMotion) renderStatic(); // show it immediately; no loop needed
  }

  function loadProfile() {
    const image = new Image();
    image.onload = () => loadFromImage(image);
    image.onerror = () => loadFromImage(createFallback(S));
    image.src = '/profile.png';
  }

  // Draw one ANIMATED frame (float, flicker, glitch, sweep, parallax…).
  function renderAnimated() {
    ctx.clearRect(0, 0, S, S);
    const elapsed = (performance.now() - startTime) / 1000;

    // Ease the parallax toward the mouse target (smooth, laggy follow).
    parallax.x += (parallax.targetX - parallax.x) * 0.08;
    parallax.y += (parallax.targetY - parallax.y) * 0.08;

    // Hover float + occasional sideways glitch jump.
    const floatY = Math.sin(elapsed * 1.2) * S * 0.012;
    const glitchX = Math.random() < 0.05 ? (Math.random() - 0.5) * S * 0.02 : 0;
    // Overall flicker: mostly bright, with rare dips (unstable projection).
    const flicker = 0.78 + 0.18 * Math.abs(Math.sin(elapsed * 11)) - (Math.random() < 0.04 ? 0.22 : 0);
    // How far the cyan/magenta ghosts separate (breathes over time).
    const split = (1.4 + 0.9 * Math.sin(elapsed * 3)) * ratio;

    const baseX = glitchX + parallax.x;
    const baseY = floatY + parallax.y;

    // ── Additive coloured layers (the hologram itself) ──
    ctx.globalCompositeOperation = 'lighter';

    ctx.globalAlpha = flicker * 0.55;
    ctx.drawImage(layers.cyan, baseX - split, baseY);

    ctx.globalAlpha = flicker * 0.55;
    ctx.drawImage(layers.magenta, baseX + split, baseY);

    ctx.globalAlpha = flicker;
    ctx.drawImage(layers.accent, baseX, baseY);

    // A moving bright band that sweeps down the figure.
    const bandY = (elapsed * 60 * ratio) % (S + 60 * ratio) - 30 * ratio;
    const band = ctx.createLinearGradient(0, bandY - 16 * ratio, 0, bandY + 16 * ratio);
    band.addColorStop(0, `rgba(${GHOST_CYAN.join(',')}, 0)`);
    band.addColorStop(0.5, `rgba(${GHOST_CYAN.join(',')}, 0.12)`);
    band.addColorStop(1, `rgba(${GHOST_CYAN.join(',')}, 0)`);
    ctx.globalAlpha = 1;
    ctx.fillStyle = band;
    ctx.fillRect(0, bandY - 16 * ratio, S, 32 * ratio);

    // A soft projector glow at the base.
    const glow = ctx.createRadialGradient(S / 2, S * 0.99, S * 0.02, S / 2, S * 0.99, S * 0.5);
    glow.addColorStop(0, `rgba(${GHOST_CYAN.join(',')}, 0.18)`);
    glow.addColorStop(1, `rgba(${GHOST_CYAN.join(',')}, 0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, S * 0.55, S, S * 0.45);

    // ── Scanlines on top (normal blending = they darken the gaps) ──
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    const lineGap = Math.max(2, Math.round(3 * ratio));
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    for (let y = 0; y < S; y += lineGap) {
      ctx.fillRect(0, y, S, Math.max(1, Math.round(ratio)));
    }
  }

  // Draw one STATIC frame: a calm hologram with no motion. Used when the
  // visitor's OS asks for reduced motion.
  function renderStatic() {
    if (!isReady) return;
    ctx.clearRect(0, 0, S, S);
    const split = 1.2 * ratio;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.5; ctx.drawImage(layers.cyan, -split, 0);
    ctx.globalAlpha = 0.5; ctx.drawImage(layers.magenta, split, 0);
    ctx.globalAlpha = 1;   ctx.drawImage(layers.accent, 0, 0);

    const glow = ctx.createRadialGradient(S / 2, S * 0.99, S * 0.02, S / 2, S * 0.99, S * 0.5);
    glow.addColorStop(0, `rgba(${GHOST_CYAN.join(',')}, 0.18)`);
    glow.addColorStop(1, `rgba(${GHOST_CYAN.join(',')}, 0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, S * 0.55, S, S * 0.45);

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    const lineGap = Math.max(2, Math.round(3 * ratio));
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    for (let y = 0; y < S; y += lineGap) ctx.fillRect(0, y, S, Math.max(1, Math.round(ratio)));
  }

  // The animation loop. It only keeps going while `running` is true, so
  // main.js can pause it when the portrait scrolls off-screen or the tab is
  // hidden (saves CPU/battery). Under reduced motion we never loop.
  function loop() {
    if (!running) return;
    if (isReady) renderAnimated();
    requestAnimationFrame(loop);
  }
  function start() {
    if (reduceMotion) { renderStatic(); return; } // one calm frame, no loop
    if (!running) { running = true; requestAnimationFrame(loop); }
  }
  function stop() {
    running = false;
  }

  // ── Mouse parallax (purely decorative) ──
  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    // -1..1 across the canvas → a few pixels of shift.
    const nx = (event.clientX - rect.left) / rect.width - 0.5;
    const ny = (event.clientY - rect.top) / rect.height - 0.5;
    parallax.targetX = nx * 10 * ratio;
    parallax.targetY = ny * 8 * ratio;
  });
  canvas.addEventListener('mouseleave', () => {
    parallax.targetX = 0;
    parallax.targetY = 0;
  });

  loadProfile();
  start();

  // Control object handed back to main.js.
  // start()/stop() let main.js pause rendering when off-screen.
  return {
    start,
    stop,
    setAccent(hex) {
      accentRgb = hexToRgbArray(hex);
      rebuildLayers(); // recolour the main layer to match the new accent
      if (reduceMotion) renderStatic(); // refresh the static frame
    },
  };
}
