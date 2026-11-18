import type { ExpressionName, GestureName, HueName } from './rig';

/**
 * Story poses. A page section names a pose with `data-mascot-section="<pose>"`; the world blends Auri
 * to it: expression, a one-shot gesture on arrival, the hue of the work being shown and glyph styling.
 */
export interface Pose {
  expression: ExpressionName;
  gesture?: GestureName;
  hue?: HueName;
  /** Where to look when the pointer is idle (normalised view space). */
  idleLook?: { x: number; y: number };
  /** 0..1: how much of Auri is drawn as glyphs (independent of the pointer lens). */
  glyph?: number;
  /** Strength of the ambient glyph aura around Auri. */
  aura?: number;
  /** Yaw offset of the whole body in radians (turn toward the content). */
  turn?: number;
}

export const poses: Record<string, Pose> = {
  idle: { expression: 'neutral', aura: 0.7 },
  hero: { expression: 'happy', gesture: 'wave', hue: 'signature', aura: 1, idleLook: { x: -0.2, y: 0.05 } },
  services: { expression: 'curious', gesture: 'present', hue: 'signature', aura: 0.6, turn: -0.25 },
  agents: { expression: 'talking', gesture: 'present', hue: 'agents', aura: 0.6, turn: 0.3, idleLook: { x: -0.6, y: 0 } },
  automation: { expression: 'focused', gesture: 'think', hue: 'automation', aura: 0.6, turn: -0.3, idleLook: { x: 0.6, y: -0.1 } },
  products: { expression: 'proud', gesture: 'point', hue: 'products', aura: 0.6, turn: 0.3, idleLook: { x: -0.6, y: 0 } },
  research: { expression: 'thinking', gesture: 'think', hue: 'research', glyph: 0.55, aura: 0.9, turn: -0.25, idleLook: { x: 0.5, y: 0.5 } },
  work: { expression: 'excited', gesture: 'cheer', hue: 'signature', aura: 0.5 },
  process: { expression: 'focused', gesture: 'nod', hue: 'signature', aura: 0.5, turn: 0.2 },
  cta: { expression: 'excited', gesture: 'wave', hue: 'signature', aura: 1 },
  brief: { expression: 'curious', hue: 'signature', aura: 0.5 },
  briefReady: { expression: 'excited', gesture: 'cheer', hue: 'signature', aura: 1 },
  lost: { expression: 'confused', gesture: 'shrug', hue: 'signature', glyph: 0.25, aura: 0.6 },
  curious: { expression: 'curious', hue: 'research', aura: 0.8 },
  intro: { expression: 'happy', gesture: 'wave', hue: 'signature', aura: 0.8 },
  sleepy: { expression: 'sleepy', hue: 'signature', aura: 0.3 },
};

export function getPose(name: string | undefined): Pose {
  return (name && poses[name]) || poses.idle;
}
