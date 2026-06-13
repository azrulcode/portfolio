/* ============================================================
   ascii.js — the big "AZRUL" banner drawn with text characters

   JS CONCEPTS USED HERE:
   - template literal (the `backticks`) → a string that can span
     multiple lines, so the art keeps its shape
     https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
   - String.prototype.trim() → removes the blank line at the very
     start/end so the art lines up neatly
     https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trim
   ============================================================ */

// These box-drawing characters (█ ╗ ╝ …) come together to spell "AZRUL".
// Because it's inside backticks, every line-break is preserved exactly.
export const NAME_ASCII = `
 █████╗ ███████╗██████╗ ██╗   ██╗██╗
██╔══██╗╚══███╔╝██╔══██╗██║   ██║██║
███████║  ███╔╝ ██████╔╝██║   ██║██║
██╔══██║ ███╔╝  ██╔══██╗██║   ██║██║
██║  ██║███████╗██║  ██║╚██████╔╝███████╗
╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝`.trim();
