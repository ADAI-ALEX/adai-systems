import type { Aspect } from '@/content/projects';

/** Hex values for WebGL (CSS uses the tokens). One hue per kind of work, never decoration. */
export const hueHex: Record<Aspect | 'studio', string> = {
  agents: '#f2b560',
  automation: '#5cd6c4',
  products: '#ff7d61',
  research: '#8db3ff',
  studio: '#eceae4',
};

export const aspectLabel: Record<Aspect, string> = {
  agents: 'AI agents',
  automation: 'Automation',
  products: 'Apps and products',
  research: 'Research',
};
