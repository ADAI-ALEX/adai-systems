import type { EmoteName, ExpressionName, ExpressionState, EyeState } from './rig';

const eye = (o: Partial<EyeState> = {}): EyeState => ({
  dot: 0, ring: 0, arc: 0, line: 0, moon: 0, chevron: 0, open: 1, size: 1, lidAngle: 0, lidLevel: 0, dx: 0, dy: 0, ...o,
});

const base = (o: Partial<ExpressionState> = {}): ExpressionState => ({
  eyeL: eye({ dot: 1 }), eyeR: eye({ dot: 1 }),
  talk: 0, blush: 0, gazeX: 0, gazeY: 0, tilt: 0, pitch: 0, lean: 0, perk: 0, glow: 1, pulse: 0, energy: 1, ...o,
});

/**
 * Eleven expressions, following the eye language of the reference sheet. Each changes the eye design itself,
 * plus head, posture, antenna and light, so they read as different moods rather than tweaks of one face.
 */
export const expressions: Record<ExpressionName, ExpressionState> = {
  // Calm: soft filled ovals, relaxed antenna.
  neutral: base(),
  // Warm smiling eyes (∩), a little lift and bounce.
  happy: base({ eyeL: eye({ arc: 1, size: 1.08 }), eyeR: eye({ arc: 1, size: 1.08 }), blush: 0.5, tilt: 0.06, pitch: 0.04, perk: 0.4, glow: 1.1, energy: 1.25 }),
  // Attentive crescents glancing to the side, a clear head tilt, antenna leaning in.
  curious: base({ eyeL: eye({ moon: 1, size: 1.05 }), eyeR: eye({ moon: 1, size: 1.12 }), gazeX: 0.25, gazeY: 0.05, tilt: -0.17, lean: -0.03, perk: 0.55, energy: 1.05 }),
  // Tall open rings, head pulled back, antenna straight up.
  surprised: base({ eyeL: eye({ ring: 1, size: 1.12, open: 1.12 }), eyeR: eye({ ring: 1, size: 1.12, open: 1.12 }), pitch: 0.1, lean: 0.07, perk: 1, glow: 1.25, energy: 1.35 }),
  // Closed, relaxed ‿ eyes looking inward, head tipped up and to the side, antenna pulsing.
  thinking: base({ eyeL: eye({ line: 1, dy: 0.02 }), eyeR: eye({ line: 1, dy: 0.02 }), gazeX: 0.3, gazeY: 0.35, tilt: 0.12, pitch: 0.08, perk: 0.15, pulse: 1, energy: 0.6 }),
  // Narrowed, determined eyes with angled lids; a slight forward lean.
  focused: base({ eyeL: eye({ dot: 1, size: 1.22, open: 0.9, lidAngle: 0.42, lidLevel: 0.42, dy: -0.02 }), eyeR: eye({ dot: 1, size: 1.22, open: 0.9, lidAngle: 0.42, lidLevel: 0.42, dy: -0.02 }), pitch: -0.05, lean: -0.05, perk: 0.3, glow: 1.15, energy: 0.75 }),
  // Friendly smiling eyes and a moving mouth; ear lights pulse with the voice.
  talking: base({ eyeL: eye({ arc: 1 }), eyeR: eye({ arc: 1 }), talk: 1, tilt: 0.03, perk: 0.3, energy: 1.1 }),
  // Squeezed > < eyes, bright lights, big bounce.
  excited: base({ eyeL: eye({ chevron: 1, size: 1.06 }), eyeR: eye({ chevron: 1, size: 1.06 }), blush: 0.8, pitch: 0.06, lean: 0.04, perk: 1, glow: 1.35, energy: 1.75 }),
  // Asymmetric: one squinting arc, one small crescent; head cocked, antenna bent.
  confused: base({ eyeL: eye({ arc: 1, size: 0.98, dy: 0.02 }), eyeR: eye({ moon: 1, size: 0.8, dy: -0.01, lidAngle: -0.35, lidLevel: 0.2 }), gazeY: -0.1, tilt: 0.2, lean: 0, perk: -0.35, energy: 0.65 }),
  // Content smiling eyes, chin up, chest out.
  proud: base({ eyeL: eye({ arc: 1, size: 1.02 }), eyeR: eye({ arc: 1, size: 1.02 }), blush: 0.3, pitch: 0.12, lean: 0.08, perk: 0.7, glow: 1.15, energy: 0.9 }),
  // Heavy, low ‿ eyes, drooping head and antenna, dim slow lights.
  sleepy: base({ eyeL: eye({ line: 1, size: 1.04, dy: -0.07 }), eyeR: eye({ line: 1, size: 1.04, dy: -0.07 }), tilt: 0.14, pitch: -0.14, lean: -0.06, perk: -0.9, glow: 0.6, pulse: 0.5, energy: 0.35 }),
};

/** The little symbol each expression shows beside the head when it starts (as in the reference sheet). */
export const expressionEmote: Record<ExpressionName, EmoteName> = {
  neutral: 'none', happy: 'sparks', curious: 'question', surprised: 'bang', thinking: 'dots', focused: 'none',
  talking: 'speech', excited: 'burst', confused: 'question', proud: 'sparkle', sleepy: 'zzz',
};

/** Resting arm pose that goes with each expression (gestures take priority over it). */
export type ArmPose = 'rest' | 'chin' | 'chest' | 'fists' | 'talk' | 'cheeks' | 'scratch' | 'hips' | 'droop' | 'open';
export const expressionArms: Record<ExpressionName, ArmPose> = {
  neutral: 'rest', happy: 'open', curious: 'chin', surprised: 'chest', thinking: 'chin', focused: 'fists',
  talking: 'talk', excited: 'cheeks', confused: 'scratch', proud: 'hips', sleepy: 'droop',
};

const eyeKeys = Object.keys(eye()) as (keyof EyeState)[];
const scalarKeys = (Object.keys(base()) as (keyof ExpressionState)[]).filter((k) => k !== 'eyeL' && k !== 'eyeR') as Exclude<keyof ExpressionState, 'eyeL' | 'eyeR'>[];

export function cloneExpression(e: ExpressionState): ExpressionState {
  return { ...e, eyeL: { ...e.eyeL }, eyeR: { ...e.eyeR } };
}

export function lerpExpression(out: ExpressionState, target: ExpressionState, k: number) {
  for (const key of scalarKeys) out[key] += (target[key] - out[key]) * k;
  for (const key of eyeKeys) {
    out.eyeL[key] += (target.eyeL[key] - out.eyeL[key]) * k;
    out.eyeR[key] += (target.eyeR[key] - out.eyeR[key]) * k;
  }
}
