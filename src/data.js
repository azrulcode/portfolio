/* ============================================================
   data.js — all the text content of the site lives here

   WHY THIS FILE EXISTS:
   Keeping content (words, numbers) separate from the code that
   *displays* it is a very common, very good habit. When Azrul wants
   to add a project, he edits THIS file only — he never has to touch
   the drawing/animation code.

   JS CONCEPTS USED HERE:
   - export            → makes these values usable from other files
                         https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export
   - const             → a value that won't be reassigned
                         https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const
   - arrays  [ ... ]   → an ordered list of things
                         https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
   - objects { ... }   → a labelled bag of values (key: value)
                         https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects
   ============================================================ */

// The phrases the typewriter cycles through, one after another.
// This is an array of strings.
export const phrases = [
  'I do code.',
  'I read what AI writes.',
  'Kuala Lumpur > USA.',
  'I build in public.',
];

// Each skill is an object with a name and a level (0–100).
// `skills` is an array of those objects.
export const skills = [
  { name: 'JavaScript',  level: 10 },
  { name: 'HTML / CSS',  level: 10 },
  { name: 'TypeScript',  level: 0 },
  { name: 'Git',         level: 30 },
  { name: 'Docker',      level: 0 },
  { name: 'Claude Code', level: 10 },
];

// Each project is an object. `status` is one of: 'live', 'building', 'planned'.
// `tags` is itself an array of strings, so this is "an array inside an object
// inside an array" — nesting like this is normal and fine.
export const projects = [
  {
    name: 'ETN-Social',
    desc: 'A social layer for the ETN world. Early stages — wiring up the core feed and identity model first.',
    tags: ['TypeScript', 'Go'],
    url: 'https://github.com/azrulcode',
    status: 'building',
  },
  {
    name: 'ETN-Chat',
    desc: 'Real-time chat for the same ecosystem. Lambat lagi — but the foundations are being laid.',
    tags: ['Go', 'React'],
    url: 'https://github.com/azrulcode',
    status: 'building',
  },
  {
    name: 'ETN Gallery',
    desc: 'A visual archive / gallery. Maybe soon — sketching the shape of it in the open.',
    tags: ['TypeScript', 'Node.js'],
    url: 'https://github.com/azrulcode',
    status: 'planned',
  },
];
