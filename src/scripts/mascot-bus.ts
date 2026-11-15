import type { MascotCommand } from '@/gl/World';
/** Page code talks to Adi through a DOM event, so pages never import WebGL code. */
export const mascot = (detail: MascotCommand) => window.dispatchEvent(new CustomEvent('adai:mascot', { detail }));
