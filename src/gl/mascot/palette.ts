import type { HueName } from './rig';

/**
 * Auri's accent colours. Only the lights change between variants (antenna, ear rings, chest emblem, the glow in
 * the eyes, the rim light and the glyph tint); the ivory plush and the black face stay the same, so it is always
 * recognisably the same character.
 *  - signature: Auri's own lavender, the default look (homepage hero, Meet Auri);
 *  - studio, agents, automation, products (apps), research: the kinds of work.
 */
export const AURI_ACCENTS: Record<HueName, string> = {
  signature: '#8f82ff',
  studio: '#ffa63f',
  agents: '#4fdd7e',
  automation: '#2fdbe6',
  products: '#ff6e68',
  research: '#b47dff',
};

export const DEFAULT_HUE: HueName = 'signature';

export const hueNames = Object.keys(AURI_ACCENTS) as HueName[];
