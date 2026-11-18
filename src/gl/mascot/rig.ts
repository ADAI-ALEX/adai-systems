/**
 * The mascot contract. The website talks to Auri only through `MascotRig`, so the procedural character can
 * be replaced by an authored GLB (see docs/MASCOT.md, "GLB contract") without touching scenes or the story.
 */
import type * as THREE from 'three';

export type ExpressionName =
  | 'neutral' | 'happy' | 'curious' | 'surprised' | 'thinking' | 'focused'
  | 'talking' | 'excited' | 'confused' | 'sleepy' | 'proud';

export type GestureName = 'none' | 'wave' | 'point' | 'think' | 'cheer' | 'present' | 'shrug' | 'nod' | 'hold';

/**
 * Accent variants. `signature` is Auri's own lavender (the default look); the other five are the kinds of work:
 * studio (amber), agents (green), automation (cyan), products / apps (coral), research (violet).
 */
export type HueName = 'signature' | 'agents' | 'automation' | 'products' | 'research' | 'studio';

/** Little symbols that pop up beside Auri's head to support an expression (see emotes.ts). */
export type EmoteName = 'none' | 'sparks' | 'question' | 'bang' | 'dots' | 'speech' | 'burst' | 'sparkle' | 'zzz';

/**
 * One eye. The first six numbers are weights of the eye-shape library in faceMaterial.ts (they are blended as
 * signed distance fields, so any mix is a clean shape and transitions morph smoothly):
 *   dot (filled oval), ring (O), arc (∩, a smiling eye), line (︶, a closed relaxed eye),
 *   moon (a crescent, a sideways look), chevron (> or <, squeezed shut with excitement).
 */
export interface EyeState {
  dot: number; ring: number; arc: number; line: number; moon: number; chevron: number;
  /** Vertical openness (blinks squash this), 0..1.3. */
  open: number;
  /** Size multiplier. */
  size: number;
  /** Upper-lid cut: tilt in radians (positive lowers the inner corner, a frown) and how far down it comes (0..1). */
  lidAngle: number; lidLevel: number;
  /** Offset from the eye's home position, in head units. */
  dx: number; dy: number;
}

export interface ExpressionState {
  eyeL: EyeState;
  eyeR: EyeState;
  /** 0..1: animated mouth on the display. */
  talk: number;
  blush: number;
  /** Bias added to the gaze when nothing else is looked at. */
  gazeX: number; gazeY: number;
  /** Head roll (radians, small) and pitch (positive looks up). */
  tilt: number; pitch: number;
  /** Whole-body lean: positive leans back (chest out), negative slumps forward. */
  lean: number;
  /** Antenna: +1 perked straight up, 0 relaxed, -1 drooping. */
  perk: number;
  /** Brightness of the accent lights (antenna, ear rings, emblem), 1 = normal. */
  glow: number;
  /** 0..1: the antenna light pulses (thinking; slowly when sleepy). */
  pulse: number;
  /** Body energy: float and bounce amplitude. */
  energy: number;
}

export interface RigInput {
  dt: number;
  time: number;
  /** Look target in normalised view space, -1..1 (x right, y up). */
  look: { x: number; y: number };
  /** 0..1, how strongly the look target should be followed (0 = idle wander). */
  attention: number;
  motion: boolean;
}

export interface MascotRig {
  readonly object: THREE.Object3D;
  /** The part of the object that counts for bounds (framing, lens trigger, tests): excludes emote symbols. */
  readonly boundsTarget?: THREE.Object3D;
  /** Meshes that count for pointer hits. */
  readonly pickables: THREE.Object3D[];
  /** Approximate head centre in rig-local space (for framing and the glyph lens). */
  readonly headCenter: THREE.Vector3;
  setExpression(name: ExpressionName, hold?: number): void;
  setBaseExpression(name: ExpressionName): void;
  gesture(name: GestureName): void;
  react(name: 'poke' | 'startle' | 'notice' | 'hover'): void;
  setHue(color: THREE.Color): void;
  /** Which side of Auri the page content is on (for pointing and presenting). */
  setFacing(side: 1 | -1): void;
  /** The current (blended) accent colour, used for lights and glyph tint. */
  readonly currentHue: THREE.Color;
  update(input: RigInput): void;
  /** Optional, for tests: a snapshot of the current state. */
  debugState?(): Record<string, unknown>;
  dispose(): void;
}
