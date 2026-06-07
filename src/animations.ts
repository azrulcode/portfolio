export function initScrollReveal(): void {
  const els = document.querySelectorAll<HTMLElement>('.reveal');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  els.forEach((el) => observer.observe(el));
}

export function initSkillBars(): void {
  const fills = document.querySelectorAll<HTMLElement>('.skill-bar-fill');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          setTimeout(() => {
            el.style.width = (el.dataset['width'] ?? '0') + '%';
          }, 150);
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );

  fills.forEach((el) => observer.observe(el));
}
