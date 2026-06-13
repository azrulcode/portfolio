/* ============================================================
   globe.js — the rotating dotted world globe (and a flat map mode)

   This is the most advanced file in the project. Don't worry if the
   math isn't obvious on a first read — skim the comments to get the
   shape of it, and come back once you're comfortable with the rest.

   WHAT IT DOES:
   - Plots REAL continents as glowing dots (coordinates come from
     world-data.js, which was generated from Natural Earth map data).
   - Spins on its own, and you can DRAG it: left/right spins it
     (yaw), up/down tilts it (pitch).
   - Fires little "network arcs" between cities for the cyberpunk
     net-trace vibe.
   - Can also switch to a flat 2D map ("map" mode).

   JS / BROWSER CONCEPTS USED HERE:
   - Canvas 2D drawing      → https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
   - requestAnimationFrame  → run a function ~60×/sec to animate smoothly
                              https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
   - Math (sin/cos)         → used to convert globe coordinates to a screen
                              https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math
   - mouse & touch events   → for dragging
                              https://developer.mozilla.org/en-US/docs/Web/API/Element/mousedown_event
   - ResizeObserver         → redraw at the right size when the box resizes
                              https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
   - closures               → createGlobe() returns functions that still
                              "remember" the variables inside it
                              https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures

   THE CORE IDEA (3D on a 2D screen):
   Every place on Earth is a point on a sphere. We store each as a 3D
   vector (x, y, z). To draw the globe we: (1) rotate those vectors by
   the current yaw/pitch, then (2) "project" them by simply using x and
   y for the screen position and using z to decide if the point is on
   the FRONT of the globe (facing us) or the BACK (hidden).
   ============================================================ */

import { LAND } from './world-data.js';

// The cities that light up and trade "network arcs".
// lat = north/south, lng = east/west. home/hub flag a few special ones.
export const CITIES = [
  { code: 'KUL', city: 'Kuala Lumpur', lat: 3.14,   lng: 101.69, home: true },
  { code: 'SIN', city: 'Singapore',    lat: 1.35,   lng: 103.82 },
  { code: 'SFO', city: 'San Francisco', lat: 37.77, lng: -122.42, hub: true },
  { code: 'JFK', city: 'New York',     lat: 40.71,  lng: -74.01,  hub: true },
  { code: 'SEA', city: 'Seattle',      lat: 47.61,  lng: -122.33 },
  { code: 'AUS', city: 'Austin',       lat: 30.27,  lng: -97.74 },
  { code: 'LAX', city: 'Los Angeles',  lat: 34.05,  lng: -118.24 },
  { code: 'LHR', city: 'London',       lat: 51.51,  lng: -0.13 },
  { code: 'BER', city: 'Berlin',       lat: 52.52,  lng: 13.40 },
  { code: 'CDG', city: 'Paris',        lat: 48.86,  lng: 2.35 },
  { code: 'AMS', city: 'Amsterdam',    lat: 52.37,  lng: 4.90 },
  { code: 'HND', city: 'Tokyo',        lat: 35.68,  lng: 139.65 },
  { code: 'ICN', city: 'Seoul',        lat: 37.57,  lng: 126.98 },
  { code: 'HKG', city: 'Hong Kong',    lat: 22.32,  lng: 114.17 },
  { code: 'PVG', city: 'Shanghai',     lat: 31.23,  lng: 121.47 },
  { code: 'SYD', city: 'Sydney',       lat: -33.87, lng: 151.21 },
  { code: 'DXB', city: 'Dubai',        lat: 25.20,  lng: 55.27 },
  { code: 'BOM', city: 'Mumbai',       lat: 19.08,  lng: 72.88 },
  { code: 'BLR', city: 'Bangalore',    lat: 12.97,  lng: 77.59 },
  { code: 'BKK', city: 'Bangkok',      lat: 13.76,  lng: 100.50 },
  { code: 'CGK', city: 'Jakarta',      lat: -6.21,  lng: 106.85 },
  { code: 'IST', city: 'Istanbul',     lat: 41.01,  lng: 28.98 },
  { code: 'GRU', city: 'Sao Paulo',    lat: -23.55, lng: -46.63 },
  { code: 'YYZ', city: 'Toronto',      lat: 43.65,  lng: -79.38 },
  { code: 'LOS', city: 'Lagos',        lat: 6.52,   lng: 3.38 },
  { code: 'NBO', city: 'Nairobi',      lat: -1.29,  lng: 36.82 },
];

// Degrees → radians. Math.sin/cos expect radians, but humans think in
// degrees, so we multiply by this to convert.
const DEG_TO_RAD = Math.PI / 180;

// Turn a latitude/longitude into a 3D point on a unit sphere (radius 1).
function latLngToVector(lat, lng) {
  const latRad = lat * DEG_TO_RAD;
  const lngRad = lng * DEG_TO_RAD;
  return {
    x: Math.cos(latRad) * Math.sin(lngRad),
    y: Math.sin(latRad),
    z: Math.cos(latRad) * Math.cos(lngRad),
  };
}

// "Slerp" = spherical interpolation: find a point fraction `t` (0→1) of
// the way along the SHORTEST curved path over the sphere's surface from
// a to b. That curved path is what makes the network arcs look like real
// flight routes instead of straight lines cutting through the planet.
function slerp(a, b, t) {
  // dot product tells us the angle between the two directions.
  let dot = a.x * b.x + a.y * b.y + a.z * b.z;
  dot = Math.max(-1, Math.min(1, dot)); // clamp to avoid tiny rounding errors
  const angle = Math.acos(dot);
  if (angle < 0.0001) return { ...a }; // basically the same point
  const sinAngle = Math.sin(angle);
  const weightA = Math.sin((1 - t) * angle) / sinAngle;
  const weightB = Math.sin(t * angle) / sinAngle;
  return {
    x: a.x * weightA + b.x * weightB,
    y: a.y * weightA + b.y * weightB,
    z: a.z * weightA + b.z * weightB,
  };
}

/*
  createGlobe() builds one globe attached to a <canvas> and returns a
  small "remote control" object (start, stop, setAccent, setMode).

  This is the "factory function" pattern: everything inside stays
  private, and we only hand back the buttons we want the outside world
  to press.
*/
export function createGlobe(canvas, options = {}) {
  const ctx = canvas.getContext('2d'); // the 2D drawing toolkit for this canvas

  // ── Size / layout (filled in by resize()) ──
  let width = 0;
  let height = 0;
  let devicePixelRatio = 1;
  let radius = 0;        // globe radius in pixels
  let centerX = 0;
  let centerY = 0;

  // ── Look & behaviour ──
  let accent = options.accent || '252, 238, 10'; // an "r, g, b" string (cyberpunk yellow)
  let mode = options.mode || 'globe';            // 'globe' | 'map' | 'off'
  const onArc = options.onArc || function () {}; // called when a new arc spawns
  // When true (the visitor asked their OS to reduce motion), we stop the
  // autonomous movement — no auto-spin, no flying arcs, no pulsing — but
  // dragging still works.
  const reduceMotion = options.reduceMotion || false;

  // ── Rotation state ──
  // yaw   = left/right spin (around the vertical axis)
  // pitch = up/down tilt    (around the horizontal axis)
  let yaw = -1.4;
  let pitch = -0.32;
  const autoSpinSpeed = 0.0022; // how fast it spins by itself each frame
  let yawVelocity = 0;          // leftover "throw" speed after a drag (yaw)
  let pitchVelocity = 0;        // leftover "throw" speed after a drag (pitch)

  // ── Dragging state ──
  let isDragging = false;
  let lastPointerX = 0;
  let lastPointerY = 0;

  // Pre-convert every land coordinate to a 3D vector ONCE, up front.
  // (Doing this every frame would be wasteful — 2,877 points × 60fps.)
  const landVectors = LAND.map((point) => latLngToVector(point.lat, point.lng));

  // Same for the cities: keep the original info plus its 3D vector.
  const cityVectors = CITIES.map((city) => ({
    ...city,
    vector: latLngToVector(city.lat, city.lng),
  }));

  // ── Network arcs (the animated traces between cities) ──
  const arcs = [];
  const homeCity = cityVectors.find((c) => c.home);
  const hubCities = cityVectors.filter((c) => c.hub);

  function spawnArc(from, to, isPrimary) {
    const duration = 2600 + Math.random() * 1400; // ms the arc takes to draw
    arcs.push({
      from,
      to,
      startTime: performance.now(),
      duration,
      isPrimary,
    });
    // Report the route + a fake latency number to the telemetry panel.
    const fakeLatencyMs = Math.round(120 + Math.random() * 240);
    onArc(from.code + '>' + to.code, fakeLatencyMs);
  }

  let lastSpawnTime = 0;
  let nextHubIndex = 0;
  function maybeSpawnArc(now) {
    if (now - lastSpawnTime < 1500) return; // at most one new arc per 1.5s
    lastSpawnTime = now;

    // Half the time, fire from "home" (KUL) to a hub city for a hero route…
    if (Math.random() < 0.5 && homeCity) {
      const destination = hubCities[nextHubIndex % hubCities.length];
      nextHubIndex = nextHubIndex + 1;
      spawnArc(homeCity, destination, true);
    } else {
      // …otherwise pick two random cities.
      const a = cityVectors[Math.floor(Math.random() * cityVectors.length)];
      const b = cityVectors[Math.floor(Math.random() * cityVectors.length)];
      if (a !== b) spawnArc(a, b, false);
    }
  }

  // Rotate a 3D point by the current yaw, then pitch.
  // (Two rotations applied in order. This is the heart of the 3D effect.)
  function rotatePoint(p) {
    // --- yaw: spin around the vertical (Y) axis ---
    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);
    const x1 = p.x * cosYaw + p.z * sinYaw;
    const z1 = -p.x * sinYaw + p.z * cosYaw;
    const y1 = p.y;

    // --- pitch: tip forward/back around the horizontal (X) axis ---
    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);
    const y2 = y1 * cosPitch - z1 * sinPitch;
    const z2 = y1 * sinPitch + z1 * cosPitch;

    return { x: x1, y: y2, z: z2 };
  }

  // Turn a rotated 3D point into a 2D screen position.
  // We "look down the z axis", so x→horizontal, y→vertical (flipped, because
  // screen y grows downward), and z tells us front (z>0) vs back (z<0).
  function project(p) {
    const r = rotatePoint(p);
    return {
      x: centerX + r.x * radius,
      y: centerY - r.y * radius,
      z: r.z,
      isFront: r.z > 0,
    };
  }

  // Recompute sizes whenever the canvas box changes size.
  function resize() {
    const rect = canvas.getBoundingClientRect();
    // On high-DPI ("retina") screens we draw extra pixels so it stays sharp.
    devicePixelRatio = Math.min(2, window.devicePixelRatio || 1);
    width = rect.width;
    height = rect.height;
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    centerX = width / 2;
    centerY = height / 2;
    radius = Math.min(width, height) * 0.4;
  }

  // Tiny helper: build an "rgba(r,g,b, alpha)" colour string from the accent.
  function accentColor(alpha) {
    return `rgba(${accent},${alpha})`;
  }

  // ── Draw one frame of the 3D globe ──
  function drawGlobe(now) {
    ctx.clearRect(0, 0, width, height);

    // A soft glow disc behind the globe.
    const glow = ctx.createRadialGradient(
      centerX, centerY - radius * 0.2, radius * 0.1,
      centerX, centerY, radius
    );
    glow.addColorStop(0, accentColor(0.06));
    glow.addColorStop(1, accentColor(0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // The continents: one dot per land coordinate.
    for (const vector of landVectors) {
      const point = project(vector);
      // depth goes 0 (far back) → 1 (closest to us); used to fade + size dots.
      const depth = (point.z + 1) / 2;
      const alpha = point.isFront ? 0.18 + depth * 0.55 : 0.05;
      const size = point.isFront ? 0.8 + depth * 1.1 : 0.6;
      ctx.fillStyle = accentColor(alpha);
      ctx.beginPath();
      ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // A thin ring around the globe's edge (its silhouette).
    ctx.strokeStyle = accentColor(0.2);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    drawArcsOnGlobe(now);
    drawCitiesOnGlobe(now);
  }

  function drawArcsOnGlobe(now) {
    // Loop BACKWARDS so we can safely splice (remove) finished arcs mid-loop.
    for (let i = arcs.length - 1; i >= 0; i--) {
      const arc = arcs[i];
      const progress = (now - arc.startTime) / arc.duration;
      if (progress > 1.25) {
        arcs.splice(i, 1); // it's done + faded; drop it
        continue;
      }
      const head = Math.min(1, progress); // how far the leading dot has travelled
      const fade = progress > 1 ? 1 - (progress - 1) / 0.25 : 1;

      const steps = 48;
      ctx.lineWidth = arc.isPrimary ? 1.6 : 1;
      ctx.beginPath();
      let penIsDown = false;
      for (let s = 0; s <= steps; s++) {
        const t = (s / steps) * head;
        const onSphere = slerp(arc.from.vector, arc.to.vector, t);
        // Lift the arc slightly off the surface so it bows outward.
        const lift = 1 + 0.18 * Math.sin(Math.PI * (t / Math.max(head, 0.001)));
        const point = project({
          x: onSphere.x * lift,
          y: onSphere.y * lift,
          z: onSphere.z * lift,
        });
        // Skip the part of the arc on the far side of the globe.
        if (!point.isFront) { penIsDown = false; continue; }
        if (!penIsDown) { ctx.moveTo(point.x, point.y); penIsDown = true; }
        else ctx.lineTo(point.x, point.y);
      }
      ctx.strokeStyle = accentColor((arc.isPrimary ? 0.85 : 0.5) * fade);
      ctx.stroke();

      // The glowing dot at the head of the arc.
      const lift = 1 + 0.18 * Math.sin(Math.PI * head);
      const headPos = slerp(arc.from.vector, arc.to.vector, head);
      const headPoint = project({
        x: headPos.x * lift, y: headPos.y * lift, z: headPos.z * lift,
      });
      if (headPoint.isFront && progress <= 1) {
        ctx.fillStyle = accentColor(0.95 * fade);
        ctx.shadowColor = accentColor(0.8);
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(headPoint.x, headPoint.y, arc.isPrimary ? 2.4 : 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset, or it would bleed into later drawing
      }
    }
  }

  function drawCitiesOnGlobe(now) {
    ctx.font = '600 9px JetBrains Mono, monospace';
    ctx.textBaseline = 'middle';
    for (const city of cityVectors) {
      const point = project(city.vector);
      if (!point.isFront) continue; // hidden on the far side
      const depth = (point.z + 1) / 2;
      const pulse = (city.home && !reduceMotion) ? 0.6 + 0.4 * Math.sin(now / 380) : 1;
      const isBig = Boolean(city.home || city.hub);

      ctx.fillStyle = accentColor((isBig ? 0.9 : 0.45) * (0.6 + depth * 0.4) * pulse);
      if (isBig) {
        ctx.shadowColor = accentColor(0.7);
        ctx.shadowBlur = city.home ? 12 : 7;
      }
      ctx.beginPath();
      ctx.arc(point.x, point.y, isBig ? 2.6 : 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // An expanding "radar ping" ring around home.
      if (city.home && !reduceMotion) {
        const phase = (now / 16 % 60) / 60; // 0 → 1 repeating
        ctx.strokeStyle = accentColor(0.5 * (1 - phase));
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5 + phase * 10, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Show the airport code label for important, clearly-visible cities.
      if (isBig && depth > 0.55) {
        ctx.textAlign = 'left';
        ctx.fillStyle = accentColor(0.7);
        ctx.fillText(city.code, point.x + 6, point.y - 0.5);
      }
    }
  }

  // ── Flat 2D map mode (an "equirectangular" projection) ──
  // Convert lat/lng straight to x/y in the box. Simple but distorts the poles.
  function latLngToScreen(lat, lng, pad) {
    return {
      x: pad + ((lng + 180) / 360) * (width - pad * 2),
      y: pad + ((90 - lat) / 180) * (height - pad * 2),
    };
  }

  function drawMap(now) {
    ctx.clearRect(0, 0, width, height);
    const pad = 18;

    // Continents as dots, same land data, flattened out.
    for (const point of LAND) {
      const screen = latLngToScreen(point.lat, point.lng, pad);
      ctx.fillStyle = accentColor(0.35);
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }

    // Faint latitude/longitude grid lines.
    ctx.strokeStyle = accentColor(0.08);
    ctx.lineWidth = 1;
    for (let lng = -150; lng <= 150; lng += 30) {
      const top = latLngToScreen(0, lng, pad);
      ctx.beginPath();
      ctx.moveTo(top.x, pad);
      ctx.lineTo(top.x, height - pad);
      ctx.stroke();
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      const left = latLngToScreen(lat, 0, pad);
      ctx.beginPath();
      ctx.moveTo(pad, left.y);
      ctx.lineTo(width - pad, left.y);
      ctx.stroke();
    }

    // A scanning bar that sweeps top→bottom (very "radar console").
    // Skipped under reduced motion.
    if (!reduceMotion) {
      const scanY = pad + ((now / 22) % (height - pad * 2));
      const scanGradient = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
      scanGradient.addColorStop(0, accentColor(0));
      scanGradient.addColorStop(0.5, accentColor(0.14));
      scanGradient.addColorStop(1, accentColor(0));
      ctx.fillStyle = scanGradient;
      ctx.fillRect(pad, scanY - 30, width - pad * 2, 60);
      ctx.strokeStyle = accentColor(0.35);
      ctx.beginPath();
      ctx.moveTo(pad, scanY);
      ctx.lineTo(width - pad, scanY);
      ctx.stroke();
    }

    // Arcs as curved (quadratic) lines between the two flat city positions.
    for (let i = arcs.length - 1; i >= 0; i--) {
      const arc = arcs[i];
      const progress = (now - arc.startTime) / arc.duration;
      if (progress > 1.25) { arcs.splice(i, 1); continue; }
      const head = Math.min(1, progress);
      const fade = progress > 1 ? 1 - (progress - 1) / 0.25 : 1;
      const A = latLngToScreen(arc.from.lat, arc.from.lng, pad);
      const B = latLngToScreen(arc.to.lat, arc.to.lng, pad);
      // A control point above the midpoint makes the line arch upward.
      const controlX = (A.x + B.x) / 2;
      const controlY = Math.min(A.y, B.y) - Math.abs(A.x - B.x) * 0.18 - 14;

      ctx.lineWidth = arc.isPrimary ? 1.6 : 1;
      ctx.strokeStyle = accentColor((arc.isPrimary ? 0.8 : 0.45) * fade);
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      for (let s = 1; s <= 32; s++) {
        const t = (s / 32) * head;
        // Quadratic Bézier formula for a point at fraction t.
        const x = (1 - t) * (1 - t) * A.x + 2 * (1 - t) * t * controlX + t * t * B.x;
        const y = (1 - t) * (1 - t) * A.y + 2 * (1 - t) * t * controlY + t * t * B.y;
        ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (progress <= 1) {
        const t = head;
        const x = (1 - t) * (1 - t) * A.x + 2 * (1 - t) * t * controlX + t * t * B.x;
        const y = (1 - t) * (1 - t) * A.y + 2 * (1 - t) * t * controlY + t * t * B.y;
        ctx.fillStyle = accentColor(0.95 * fade);
        ctx.shadowColor = accentColor(0.8);
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(x, y, arc.isPrimary ? 2.4 : 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // City dots + expanding pings + labels.
    ctx.font = '600 9px JetBrains Mono, monospace';
    ctx.textBaseline = 'middle';
    for (const city of cityVectors) {
      const screen = latLngToScreen(city.lat, city.lng, pad);
      const isBig = Boolean(city.home || city.hub);
      if (isBig && !reduceMotion) {
        const phase = ((now / 14 + (city.home ? 0 : 30)) % 70) / 70;
        ctx.strokeStyle = accentColor(0.4 * (1 - phase));
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, 3 + phase * 12, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = accentColor(isBig ? 0.9 : 0.4);
      if (isBig) { ctx.shadowColor = accentColor(0.7); ctx.shadowBlur = city.home ? 11 : 6; }
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, isBig ? 2.4 : 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      if (isBig) {
        ctx.textAlign = 'left';
        ctx.fillStyle = accentColor(0.6);
        ctx.fillText(city.code, screen.x + 5, screen.y - 0.5);
      }
    }
  }

  // ── The animation loop ──
  let animationId = 0;
  let isRunning = false;
  function frame() {
    if (!isRunning) return;
    const now = performance.now();

    // While you're NOT dragging, keep spinning + glide to a stop (inertia).
    // Skipped entirely under reduced motion (the globe only moves when dragged).
    if (!isDragging && !reduceMotion) {
      yaw = yaw + autoSpinSpeed + yawVelocity;
      pitch = pitch + pitchVelocity;
      yawVelocity = yawVelocity * 0.94;   // friction
      pitchVelocity = pitchVelocity * 0.9;
      pitch = clampPitch(pitch);
    }

    if (!reduceMotion) maybeSpawnArc(now);
    if (mode === 'globe') drawGlobe(now);
    else if (mode === 'map') drawMap(now);

    // Ask the browser to call frame() again before the next repaint.
    animationId = requestAnimationFrame(frame);
  }

  // Keep the up/down tilt within a sensible range so the globe can't flip
  // upside-down and disorient you.
  function clampPitch(value) {
    const limit = 1.3;
    return Math.max(-limit, Math.min(limit, value));
  }

  // ── Dragging (works for both mouse and touch) ──
  function getPointer(event) {
    // Touch events keep their coordinates in a `touches` list; mouse events
    // have them directly. This returns {x, y} for either kind.
    if (event.touches && event.touches.length > 0) {
      return { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
    return { x: event.clientX, y: event.clientY };
  }

  function onPointerDown(event) {
    isDragging = true;
    const pointer = getPointer(event);
    lastPointerX = pointer.x;
    lastPointerY = pointer.y;
  }

  function onPointerMove(event) {
    if (!isDragging) return;
    const pointer = getPointer(event);
    const deltaX = pointer.x - lastPointerX; // moved right (+) / left (−)
    const deltaY = pointer.y - lastPointerY; // moved down (+) / up (−)
    lastPointerX = pointer.x;
    lastPointerY = pointer.y;

    // Horizontal drag → yaw (spin). Vertical drag → pitch (tilt).
    yaw = yaw + deltaX * 0.006;
    pitch = clampPitch(pitch + deltaY * 0.006);

    // Remember the speed so the globe keeps gliding after release.
    yawVelocity = deltaX * 0.0006;
    pitchVelocity = deltaY * 0.0006;

    // On touch, stop the page from scrolling while you drag the globe.
    if (event.touches && event.cancelable) event.preventDefault();
  }

  function onPointerUp() {
    isDragging = false;
  }

  canvas.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);
  canvas.addEventListener('touchstart', onPointerDown, { passive: true });
  canvas.addEventListener('touchmove', onPointerMove, { passive: false });
  canvas.addEventListener('touchend', onPointerUp);

  // Watch the canvas box; recompute sizes when it changes.
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(resize).observe(canvas);
  } else {
    window.addEventListener('resize', resize);
  }
  resize();

  // The "remote control" we hand back to main.js.
  return {
    start() {
      if (!isRunning) {
        isRunning = true;
        animationId = requestAnimationFrame(frame);
      }
    },
    stop() {
      isRunning = false;
      cancelAnimationFrame(animationId);
      ctx.clearRect(0, 0, width, height);
    },
    setAccent(rgb) {
      accent = rgb;
    },
    setMode(newMode) {
      mode = newMode;
      if (newMode === 'off') {
        isRunning = false;
        cancelAnimationFrame(animationId);
        ctx.clearRect(0, 0, width, height);
      } else if (!isRunning) {
        isRunning = true;
        animationId = requestAnimationFrame(frame);
      }
    },
    cities: CITIES,
  };
}
