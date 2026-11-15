import { MASCOT } from './mascot';

export const nav = [
  { href: '/work', label: 'Work' },
  { href: '/services', label: 'Services' },
  { href: '/process', label: 'How it works' },
  { href: '/studio', label: 'Studio' },
] as const;

export const footerNav = [
  { href: '/work', label: 'All work' },
  { href: '/services', label: 'Services' },
  { href: '/process', label: 'How it works' },
  { href: '/research', label: 'Research' },
  { href: '/studio', label: 'Studio' },
  { href: '/start', label: 'Start a project' },
  { href: '/contact', label: 'Contact' },
  { href: MASCOT.path, label: `Meet ${MASCOT.name}` },
] as const;
