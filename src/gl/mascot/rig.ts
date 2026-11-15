/**
 * The mascot contract. The website talks to Adi only through `MascotRig`, so the procedural character can
 * be replaced by an authored GLB (see docs/MASCOT.md, "GLB contract") without touching scenes or the story.
 */
import type * as THREE from 'three';

export type ExpressionName =
  | 'neutral' | 'happy' | 'curious' | 'surprised' | 'thinking' | 'focused'
  | 'talking' | 'excited' | 'confused' | 'sleepy' | 'proud';

export type GestureName = 'none' | 'wave' | 'point' | 'think' | 'cheer' | 'present' | 'shrug' | 'nod' | 'hold';

export type HueName = 'agents' | 'automation' | 'products' | 'research' | 'studio';

export interface ExpressionState {
  /** Eye openness 0 (shut) .. 1.3 (wide). Left / right. */
  openL: number; openR: number;
  /** Eye size multiplier. */
  scaleL: number; scaleR: number;
  /** Upper-lid tilt in radians (positive raises the outer corner) and how far it comes down (0..1). */
  lidAngle: number; lidLevel: number;
  /** 0..1 smile arcs. */
  happy: number;
  talk: number; think: number; blush: number;
  /** Bias added to the gaze when nothing else is looked at. */
  gazeX: number; gazeY: number;
  /** Head tilt (roll) in radians, small. */
  tilt: number;
  /** Body energy: bounce amplitude multiplier for idle. */
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
  /** Meshes that count for pointer hits. */
  readonly pickables: THREE.Object3D[];
  /** Approximate head centre in rig-local space (for framing and the glyph lens). */
  readonly headCenter: THREE.Vector3;
  setExpression(name: ExpressionName, hold?: number): void;
  setBaseExpression(name: ExpressionName): void;
  gesture(name: GestureName): void;
  react(name: 'poke' | 'startle' | 'notice'): void;
  setHue(color: THREE.Color): void;
  update(input: RigInput): void;
  dispose(): void;
}
