import { NAME_ASCII } from './ascii';
import { Typewriter } from './typewriter';
import { initAsciiPortrait } from './ascii-portrait';
import { initScrollReveal, initSkillBars } from './animations';
import { skills, projects } from './data';
import './style.css';

// ASCII name
const asciiEl = document.getElementById('ascii-art')!;
asciiEl.textContent = NAME_ASCII;

// Typewriter
const twEl = document.getElementById('typewriter')!;
new Typewriter(twEl, [
  'I do code.',
  'I build things.',
  'I learn every day.',
]).start();

// Theme toggle
const toggleBtn = document.getElementById('theme-toggle') as HTMLButtonElement;
const applyTheme = (light: boolean) => {
  document.body.classList.toggle('light', light);
  toggleBtn.textContent = light ? '[ dark ]' : '[ light ]';
};
applyTheme(localStorage.getItem('theme') === 'light');
toggleBtn.addEventListener('click', () => {
  const next = !document.body.classList.contains('light');
  applyTheme(next);
  localStorage.setItem('theme', next ? 'light' : 'dark');
});

// Skills
const skillsGrid = document.getElementById('skills-grid')!;
for (const { name, level } of skills) {
  const row = document.createElement('div');
  row.className = 'skill-row';
  row.innerHTML = `
    <span class="skill-name">${name}</span>
    <div class="skill-bar-track">
      <div class="skill-bar-fill" data-width="${level}"></div>
    </div>
    <span class="skill-percent">${level}%</span>
  `;
  skillsGrid.appendChild(row);
}

// Projects
const projectsGrid = document.getElementById('projects-grid')!;
for (const { name, desc, tags, status } of projects) {
  const isUpcoming = status === 'upcoming';
  const card = document.createElement('div');
  card.className = 'project-card' + (isUpcoming ? ' project-card--upcoming' : '');
  card.innerHTML = `
    <div class="project-card-header">
      <span class="project-name">${name}</span>
      ${isUpcoming ? '<span class="project-badge">upcoming</span>' : ''}
    </div>
    <p class="project-desc">${desc}</p>
    <div class="project-tags">
      ${tags.map((t) => `<span class="project-tag">${t}</span>`).join('')}
    </div>
  `;
  projectsGrid.appendChild(card);
}

// ASCII portrait
initAsciiPortrait(document.getElementById('ascii-portrait') as HTMLCanvasElement);

// Animations
initScrollReveal();
initSkillBars();
