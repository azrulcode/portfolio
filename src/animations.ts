/* ============================================================
   animations.ts — scroll reveal + segmented skill meters
   ============================================================ */

export function initScrollReveal(): void {
  const els = document.querySelectorAll<HTMLElement>('.reveal');
  const revealAll = () => els.forEach((el) => el.classList.add('visible'));
  if (document.hidden) { revealAll(); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  els.forEach((el) => io.observe(el));
}

export function initSkillMeters(): void {
  const meters = document.querySelectorAll<HTMLElement>('.meter');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const meter = e.target as HTMLElement;
      const filled = Number(meter.dataset.filled || '0');
      meter.querySelectorAll<HTMLElement>('i').forEach((seg, idx) => {
        if (idx < filled) setTimeout(() => seg.classList.add('on'), idx * 55);
      });
      io.unobserve(meter);
    });
  }, { threshold: 0.5 });
  meters.forEach((m) => io.observe(m));
}
