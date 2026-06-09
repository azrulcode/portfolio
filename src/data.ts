export interface Skill {
  name: string;
  level: number;
}

export interface Project {
  name: string;
  desc: string;
  tags: string[];
  url: string;
  status: 'live' | 'building' | 'planned';
}

export const phrases: string[] = [
  'I do code.',
  'I read what AI writes.',
  'Kuala Lumpur → USA.',
  'I build in public.',
];

export const skills: Skill[] = [
  { name: 'JavaScript',  level: 80 },
  { name: 'HTML / CSS',  level: 85 },
  { name: 'TypeScript',  level: 40 },
  { name: 'Git',         level: 70 },
  { name: 'Docker',      level: 60 },
  { name: 'Claude Code', level: 65 },
];

export const projects: Project[] = [
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
