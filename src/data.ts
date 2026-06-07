export interface Skill {
  name: string;
  level: number;
}

export interface Project {
  name: string;
  desc: string;
  tags: string[];
  url: string;
  status: 'live' | 'upcoming';
}

export const skills: Skill[] = [
  { name: 'TypeScript', level: 40 },
  { name: 'JavaScript', level: 80 },
  { name: 'Git',        level: 70 },
  { name: 'Docker',     level: 60 },
  { name: 'HTML / CSS', level: 85 },
  { name: 'Claude Code', level: 65 },
];

export const projects: Project[] = [
  {
    name: 'ETN Gallery',
    desc: 'Maybe soon...',
    tags: ['TypeScript', 'Node.js'],
    url: 'https://github.com/azrulcode',
    status: 'upcoming',
  },
  {
    name: 'ETN-Chat',
    desc: 'Lambat lagi.',
    tags: ['Go', 'React'],
    url: 'https://github.com/azrulcode',
    status: 'upcoming',
  },
  {
    name: 'ETN-Social',
    desc: 'Early stages. Will be live here when ready.',
    tags: ['TypeScript', 'Go'],
    url: 'https://github.com/azrulcode',
    status: 'upcoming',
  },
];
