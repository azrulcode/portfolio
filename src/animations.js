/* ============================================================
   animations.js — "reveal on scroll" + the skill bars filling up

   Both effects share one trick: we want something to happen the
   moment an element scrolls INTO view. The old way was to listen to
   every scroll event and do math. The modern, efficient way is
   IntersectionObserver — the browser watches the elements for us and
   tells us when they enter the screen.

   JS CONCEPTS USED HERE:
   - IntersectionObserver → "tell me when this element is on screen"
                            https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
   - querySelectorAll()   → find ALL elements matching a CSS selector
                            https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll
   - classList.add()      → add a CSS class (here, to trigger an animation)
                            https://developer.mozilla.org/en-US/docs/Web/API/Element/classList
   - forEach()            → run a function once per item in a list
                            https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
   - arrow function ()=>{}→ a short way to write a function
                            https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions
   ============================================================ */

// Fade/slide each `.reveal` section in as it scrolls into view.
export function initScrollReveal() {
  // A NodeList of every element with class="reveal".
  const elements = document.querySelectorAll('.reveal');

  // Edge case: if the tab is hidden (e.g. opened in the background),
  // scrolling never happens, so just reveal everything immediately.
  if (document.hidden) {
    elements.forEach((element) => element.classList.add('visible'));
    return;
  }

  // The observer calls this function whenever a watched element's
  // visibility changes. `entries` is the list of elements that changed.
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // It's on screen now → add the class that plays the animation…
          entry.target.classList.add('visible');
          // …and stop watching it (the reveal only needs to happen once).
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,                 // fire when ~12% of it is visible
      rootMargin: '0px 0px -8% 0px',   // trigger a little before it's fully in
    }
  );

  // Start watching every reveal element.
  elements.forEach((element) => observer.observe(element));
}

// Animate the segmented skill meters: light up their little segments
// one by one when the meter scrolls into view.
export function initSkillMeters() {
  const meters = document.querySelectorAll('.meter');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return; // skip ones not yet on screen

        const meter = entry.target;

        // We stored "how many segments to fill" in a data-* attribute in
        // the HTML (data-filled="8"). dataset reads it back as a string,
        // so Number(...) converts "8" → 8.
        const filledCount = Number(meter.dataset.filled || '0');

        // Each <i> is one segment. Light up the first `filledCount` of them,
        // staggered slightly so they cascade left-to-right.
        const segments = meter.querySelectorAll('i');
        segments.forEach((segment, index) => {
          if (index < filledCount) {
            setTimeout(() => segment.classList.add('on'), index * 55);
          }
        });

        observer.unobserve(meter); // animate each meter only once
      });
    },
    { threshold: 0.5 } // wait until half the meter is visible
  );

  meters.forEach((meter) => observer.observe(meter));
}
