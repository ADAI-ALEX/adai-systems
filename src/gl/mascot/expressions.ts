import type { ExpressionName, ExpressionState } from './rig';

const base: ExpressionState = {
  openL: 1, openR: 1, scaleL: 1, scaleR: 1, lidAngle: 0, lidLevel: 0, happy: 0,
  talk: 0, think: 0, blush: 0, gazeX: 0, gazeY: 0, tilt: 0, energy: 1,
};

/** Each expression is a small, readable change: big shapes that survive the glyph pass. */
export const expressions: Record<ExpressionName, ExpressionState> = {
  neutral: { ...base },
  happy: { ...base, happy: 1, blush: 0.6, energy: 1.2, tilt: 0.05 },
  curious: { ...base, openL: 0.86, scaleL: 0.92, scaleR: 1.16, openR: 1.08, lidAngle: 0.12, lidLevel: 0.12, tilt: -0.12 },
  surprised: { ...base, openL: 1.22, openR: 1.22, scaleL: 1.18, scaleR: 1.18, energy: 1.4 },
  thinking: { ...base, openL: 0.72, openR: 0.8, lidLevel: 0.22, lidAngle: -0.08, think: 1, gazeX: 0.55, gazeY: 0.65, tilt: 0.08, energy: 0.6 },
  focused: { ...base, openL: 0.78, openR: 0.78, lidLevel: 0.3, lidAngle: -0.05, energy: 0.7 },
  talking: { ...base, talk: 1, happy: 0.15, energy: 1.1 },
  excited: { ...base, happy: 0.85, scaleL: 1.08, scaleR: 1.08, blush: 0.9, energy: 1.7, tilt: -0.06 },
  confused: { ...base, openL: 0.95, openR: 0.7, scaleL: 1.1, scaleR: 0.9, lidAngle: 0.35, lidLevel: 0.18, gazeY: -0.2, tilt: 0.16, energy: 0.6 },
  sleepy: { ...base, openL: 0.4, openR: 0.4, lidLevel: 0.45, energy: 0.35 },
  proud: { ...base, happy: 0.55, openL: 0.85, openR: 0.85, lidLevel: 0.15, blush: 0.4, tilt: 0.04, gazeY: 0.15 },
};

export const expressionKeys = Object.keys(base) as (keyof ExpressionState)[];

export function lerpExpression(out: ExpressionState, target: ExpressionState, k: number) {
  for (const key of expressionKeys) out[key] += (target[key] - out[key]) * k;
}
