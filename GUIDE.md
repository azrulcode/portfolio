# 📖 Reading Guide — for someone who just learned JavaScript

Welcome! This codebase is a personal portfolio website built with **plain
HTML, CSS, and JavaScript** — no React, no frameworks, no build tools. That
makes it a great codebase to *read* and learn from, because what you see is
exactly what runs in the browser.

This guide tells you **what JS concepts are in here**, **what order to read the
files in**, and **which MDN pages** to keep open while you do.

> 🧠 Golden rule: read in the order below. The files are arranged from
> "things you already understand" to "advanced graphics math". Don't start
> with `globe.js` — you'll scare yourself for no reason. 😄

---

## 1. How the site fits together (the 30-second mental model)

```
index.html   ──loads──▶  src/main.js  ──imports──▶  every other src/*.js file
   │                          │
   │                          ├─ data.js          (the words & numbers)
   │                          ├─ ascii.js         (the big AZRUL text art)
   │                          ├─ typewriter.js    (the typing effect)
   │                          ├─ animations.js    (reveal-on-scroll)
   │                          ├─ globe.js         (the 3D world globe)
   │                          ├─ world-data.js    (coordinates of all land)
   │                          └─ holo-portrait.js (the hologram face)
   │
style.css    ──▶  all the colours, layout, neon, scanlines, glitch
```

- **HTML** = the *structure* (the boxes and text).
- **CSS** = the *look* (colours, spacing, the cyberpunk theme).
- **JavaScript** = the *behaviour* (typing, scrolling, the spinning globe).

The browser loads **one** script, `main.js`. That file `import`s everything
else. So `main.js` is your table of contents.

---

## 2. The concepts/topics covered in this codebase

Here's everything you'll bump into, grouped by theme. Each links to MDN — the
official, trustworthy reference. ([MDN JavaScript home](https://developer.mozilla.org/en-US/docs/Web/JavaScript))

### Core language
| Concept | What it's for | MDN |
|---|---|---|
| `const` / `let` | Storing values (boxes you put things in) | [const](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const) · [let](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let) |
| Strings & template literals | Text, and slotting values into text with `` `${x}` `` | [Template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) |
| Arrays | Ordered lists (`skills`, `projects`, `phrases`) | [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) |
| Objects | Labelled bags of values (`{ name, level }`) | [Working with objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects) |
| Functions & arrow functions | Reusable blocks of code | [Functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions) · [Arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions) |
| `for…of` loops | Doing something for each item | [for...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of) |
| Array methods: `map`, `forEach`, `join`, `filter` | Transforming lists | [map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map) · [forEach](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach) |
| `class` & `this` | A blueprint for objects (the `Typewriter`) | [Classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes) · [this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this) |
| Modules (`import` / `export`) | Splitting code across files | [Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) |
| Conditionals & operators (`%`, `?.`, `&&`) | Decisions and safe access | [Remainder %](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder) · [Optional chaining ?.](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining) |

### Talking to the web page (the DOM)
| Concept | What it's for | MDN |
|---|---|---|
| `querySelector` / `querySelectorAll` | Finding elements | [querySelector](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector) |
| `createElement` / `innerHTML` / `appendChild` | Building HTML from data | [createElement](https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement) |
| `classList` & `dataset` | Toggling CSS classes, reading `data-*` attributes | [classList](https://developer.mozilla.org/en-US/docs/Web/API/Element/classList) · [dataset](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset) |
| `addEventListener` | Reacting to clicks, drags, mouse moves | [addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener) |

### Timing & animation
| Concept | What it's for | MDN |
|---|---|---|
| `setTimeout` / `setInterval` | Run code later / repeatedly (typewriter, clock) | [setTimeout](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout) · [setInterval](https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval) |
| `requestAnimationFrame` | Smooth ~60fps animation loops (globe, portrait) | [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) |
| `IntersectionObserver` | "Tell me when this scrolls into view" | [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) |

### Browser features
| Concept | What it's for | MDN |
|---|---|---|
| `localStorage` | Remember the chosen accent colour between visits | [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) |
| `ResizeObserver` | Redraw the canvas when its box resizes | [ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) |

### Graphics (the advanced stuff — `globe.js`, `holo-portrait.js`)
| Concept | What it's for | MDN |
|---|---|---|
| Canvas 2D | Drawing dots, lines, and text by code | [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) · [Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial) |
| `Math.sin` / `Math.cos` | Rotation, waves, pulsing | [Math](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math) |
| `getImageData` | Reading a photo's pixels to measure brightness | [getImageData](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/getImageData) |
| `globalCompositeOperation` | Additive "glowing light" blending (hologram) | [compositing](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation) |

---

## 3. The recommended reading order

### 🟢 Start here (you'll understand these immediately)
1. **`index.html`** — skim it top to bottom. Notice the empty containers like
   `<div id="skills-grid"></div>` — JavaScript fills those in later. Notice the
   single `<script type="module" src="./src/main.js">` at the bottom.
2. **`src/data.js`** — pure arrays and objects. This is the site's content.
   *Concepts: const, arrays, objects, export.*
3. **`src/ascii.js`** — one multi-line string. *Concepts: template literals.*

### 🟢 Then the "glue"
4. **`src/main.js`** — **the most important file to understand.** Read it
   slowly. It's split into 7 numbered sections, each setting up one feature.
   This is where data becomes HTML, and where clicks get wired up.
   *Concepts: import, querySelector, createElement, innerHTML, events, loops.*

### 🟡 Then small self-contained features
5. **`src/typewriter.js`** — a `class` that types and deletes text. Great
   first look at classes, `this`, and `setTimeout` scheduling itself.
6. **`src/animations.js`** — `IntersectionObserver` for scroll effects. Short
   and a very useful modern pattern to know.

### 🔴 Finally, the graphics (come back to these later — they use math!)
7. **`src/holo-portrait.js`** — renders `profile.png` as a floating hologram:
   it reads the photo's pixels and turns brightness into glowing, see-through,
   RGB-split colour. Read the comments; don't sweat the per-pixel maths on the
   first pass.
8. **`src/world-data.js`** — just data: 2,877 land coordinates. Skim it.
9. **`src/globe.js`** — the 3D world globe. The biggest, most advanced file.
   Read the long header comment first; it explains the "3D on a 2D screen"
   trick before any math appears.

> 💡 Tip: open the page in your browser, press **F12** to open DevTools, and
> add `console.log(...)` lines inside these files to watch values change. That
> is *the* fastest way to learn what code actually does.
> [Intro to DevTools](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Tools_and_setup/What_are_browser_developer_tools)

---

## 4. A few patterns you'll see repeatedly (worth recognising)

- **Factory function returning a "remote control".** `createGlobe(...)` and
  `initHoloPortrait(...)` set up a bunch of private variables, then `return`
  a small object with methods like `start()` and `setAccent()`. The outside
  world can only press those buttons — everything else stays private. This
  relies on [closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures).

- **Self-scheduling loops.** Instead of one giant loop, code calls itself
  again at the end (`setTimeout(() => this.tick(), …)` or
  `requestAnimationFrame(frame)`). This keeps the browser responsive.

- **Data → HTML.** In `main.js`, we loop over `skills` / `projects` and build
  HTML strings with template literals, then drop them into the page. Change
  `data.js` and the page changes — no HTML editing needed.

- **CSS variables driven by JS.** The accent colour lives in two CSS
  variables. JS just changes those variables and the whole site recolours.
  See `applyAccent()` in `main.js`.

---

## 5. Run it locally

There's no build step. You just need to serve the folder over HTTP (opening
`index.html` directly with `file://` won't work, because ES modules need a
real server).

Easiest options:
- **VS Code:** install the *Live Server* extension, right-click `index.html`
  → "Open with Live Server".
- **Node installed?** `npm run dev` (uses `npx serve`).
- **Python installed?** `python -m http.server` then open `http://localhost:8000`.

---

Happy reading — and when something is confusing, that's normal. Open the MDN
link, run it, log it, and it'll click. You've got this. 💛
