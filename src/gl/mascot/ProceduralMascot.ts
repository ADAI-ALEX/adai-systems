/**
 * Auri, built procedurally. Implements `MascotRig`, so it can be swapped for an authored GLB later.
 *
 * Hierarchy:  root ─┬─ bounce (hover, hop, squash) ── bodyPivot (lean, sway, turn)
 *                   │      ├─ body, collar, chest plate, arms (Bézier tubes), hands (posable mittens + cuffs)
 *                   │      └─ neck ── head (look, tilt, nod) ── shell, display glass, ear modules, antenna
 *                   └─ emotes (symbols beside the head; not part of the bounds)
 *
 * Animation is layered so the layers never fight over a transform:
 *  - face: the expression owns the eyes, mouth and lights; blinks and gaze are added on top;
 *  - head: gaze (yaw/pitch) + expression (tilt/pitch) + gesture additive (nod, think) + idle drift, summed;
 *  - arms: gesture > reaction > the expression's resting arm pose > rest, blended by envelopes, then springs;
 *  - body: hover and breathing + expression lean + gesture/reaction hops;
 *  - antenna: a damped spring driven by head motion and hops, biased by the expression's perk.
 * So Auri can look curious while pointing, or happy while waving.
 */
import * as THREE from 'three';
import {
  ANTENNA, ArmTube, antennaBallGeometry, antennaBaseGeometry, antennaStalkGeometry, bakeWarmth, bodyGeometry, collarGeometry,
  cuffGeometry, earCapGeometry, earHousingGeometry, earRingGeometry, glassGeometry, glowTexture, HAND_MORPHS, handGeometry, headGeometry, headRadius, LAYOUT, plateGeometry,
} from './shapes';
import { createMaterials, rimUniforms } from './materials';
import { applyFace, createFaceMaterial } from './faceMaterial';
import { cloneExpression, expressionArms, expressionEmote, expressions, lerpExpression, type ArmPose } from './expressions';
import { Emotes } from './emotes';
import type { ExpressionName, ExpressionState, GestureName, MascotRig, RigInput } from './rig';

const damp = (current: number, target: number, lambda: number, dt: number) => current + (target - current) * (1 - Math.exp(-lambda * dt));
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const smoothstep = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

class Spring3 {
  pos = new THREE.Vector3();
  vel = new THREE.Vector3();
  constructor(public k = 70, public c = 11) {}
  step(target: THREE.Vector3, dt: number) {
    const steps = Math.ceil(dt / (1 / 120));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      this.vel.x += ((target.x - this.pos.x) * this.k - this.vel.x * this.c) * h;
      this.vel.y += ((target.y - this.pos.y) * this.k - this.vel.y * this.c) * h;
      this.vel.z += ((target.z - this.pos.z) * this.k - this.vel.z * this.c) * h;
      this.pos.addScaledVector(this.vel, h);
    }
    return this.pos;
  }
}

/** Strongest hop (the poke) and the highest Auri may ever rise, in rig units (Auri is 3 units tall). */
const MAX_KICK = 2.8, MAX_JUMP = 0.36;
const BODY_Y = LAYOUT.bodyY;
/** The mittens are drawn big, like the reference: chunky, soft, expressive. */
const HAND_SCALE = 1.45;
/**
 * The arm's length along its curve, shoulder to wrist (rig units). It never changes: a near hand bends the arm,
 * a far one straightens it, and no target may be farther than the arm can reach (so arms never stretch).
 */
const ARM_LENGTH = 1.0;
const MAX_REACH = ARM_LENGTH * 0.96;
const GESTURE_DURATION: Record<GestureName, number> = { none: 0, wave: 2.2, point: 2.0, think: 3.2, cheer: 1.7, present: 2.3, shrug: 1.8, nod: 1.3, hold: 0 };
/** The expression a gesture suggests, used only when nobody has asked for a particular expression. */
const GESTURE_MOOD: Partial<Record<GestureName, ExpressionName>> = { wave: 'happy', cheer: 'excited', shrug: 'confused', think: 'thinking', nod: 'happy', present: 'happy' };

/* ------------------------------------------------------------------ hand poses */
/** A hand target, authored for a hand on the +x side and mirrored for the other one, in rig space. */
interface HandPose { pos: [number, number, number]; fingers: [number, number, number]; palm: [number, number, number]; fist?: number; point?: number; spread?: number; elbow?: [number, number, number] }

/** Resting arm poses: R is the +x hand, L (if given) the -x hand, both authored as if on the +x side. */
const ARM_POSES: Record<ArmPose, { R: HandPose; L?: HandPose }> = {
  rest: { R: { pos: [0.86, 0.28, 0.22], fingers: [0.3, -1, 0.2], palm: [-1, 0, 0.25], elbow: [-0.14, -0.32, -0.04] } },
  open: { R: { pos: [0.84, 0.66, 0.34], fingers: [0.5, -0.45, 0.6], palm: [-0.35, 0.35, 1], spread: 0.35 } },
  chin: {
    R: { pos: [0.3, 0.97, 0.94], fingers: [-0.3, 0.62, 0.62], palm: [-0.15, 0.6, -0.8], point: 0.55, fist: 0.35, elbow: [0.1, -0.15, 0.2] },
    L: { pos: [0.62, 0.66, 0.5], fingers: [-0.6, 0.15, 0.6], palm: [0, 1, 0], fist: 0.25 },
  },
  chest: { R: { pos: [0.6, 0.84, 0.8], fingers: [-0.05, 0.7, 0.7], palm: [-0.25, -0.5, 1], spread: 1 } },
  fists: { R: { pos: [0.72, 0.7, 0.5], fingers: [-0.45, 0.35, 0.85], palm: [-0.8, -0.3, 0], fist: 1, elbow: [0.2, -0.05, 0] } },
  talk: {
    R: { pos: [0.66, 0.86, 0.6], fingers: [-0.1, 0.35, 1], palm: [-0.25, 1, 0], spread: 0.3 },
    L: { pos: [0.86, 0.28, 0.22], fingers: [0.3, -1, 0.2], palm: [-1, 0, 0.25], elbow: [-0.14, -0.32, -0.04] },
  },
  cheeks: { R: { pos: [1.02, 1.16, 0.68], fingers: [0.08, 1, 0.25], palm: [-0.7, 0, 1], fist: 0.9, elbow: [0.15, -0.1, 0] } },
  scratch: {
    R: { pos: [1.06, 1.08, 0.64], fingers: [-0.15, 1, 0.15], palm: [-1, 0, 0.3], point: 0.65, fist: 0.2 },
    L: { pos: [0.9, 0.78, 0.38], fingers: [0.9, 0.25, 0.35], palm: [0, 1, 0.15], spread: 0.3 },
  },
  hips: { R: { pos: [0.68, 0.5, 0.2], fingers: [-1, -0.2, 0.1], palm: [0, 0.1, -1], fist: 0.9, elbow: [0.22, 0.05, -0.08] } },
  droop: { R: { pos: [0.8, 0.22, 0.24], fingers: [0.18, -1, 0.15], palm: [-1, 0, 0], elbow: [-0.14, -0.32, -0.04] } },
};

/** Gesture key poses for the lead hand (on the content side) and the other one. */
const GESTURE_POSES: Partial<Record<GestureName, { lead: HandPose; other?: HandPose; both?: boolean }>> = {
  wave: { lead: { pos: [1.14, 1.2, 0.5], fingers: [0.3, 1, 0.12], palm: [0.1, 0, 1], spread: 0.8, elbow: [0.12, -0.2, 0] }, other: ARM_POSES.open.R },
  point: { lead: { pos: [0.98, 1.1, 0.66], fingers: [0.85, 0.3, 0.6], palm: [0, -1, 0.3], point: 1, elbow: [0.08, -0.12, 0] }, other: ARM_POSES.rest.R },
  think: { lead: ARM_POSES.chin.R, other: ARM_POSES.chin.L },
  cheer: { lead: { pos: [1.14, 1.26, 0.46], fingers: [0.35, 1, 0.1], palm: [0, 0.1, 1], spread: 1, elbow: [0.15, -0.15, 0] }, both: true },
  present: { lead: { pos: [0.95, 0.88, 0.72], fingers: [0.85, 0.2, 0.65], palm: [-0.1, 1, 0.2], spread: 0.35, elbow: [0.05, -0.12, 0] }, other: ARM_POSES.open.R },
  shrug: { lead: { pos: [1.08, 1.02, 0.44], fingers: [1, 0.35, 0.3], palm: [0, 1, 0.25], spread: 0.55, elbow: [0, -0.2, 0] }, both: true },
};

type Reaction = 'bounce' | 'giggle' | 'waveBack' | 'wiggle';

interface HandRig {
  side: 1 | -1;
  group: THREE.Group;
  mesh: THREE.Mesh;
  arm: ArmTube;
  armMesh: THREE.Mesh;
  spring: Spring3;
  quat: THREE.Quaternion;
  morph: { fist: number; point: number; spread: number };
  elbow: THREE.Vector3;
  /** The arm's current length along its curve (for tests: it should stay ARM_LENGTH). */
  armLength: number;
}

const PLATE_Y = 0.1;
/** The body surface's z at the front centre line, at height y (body space). */
function frontOf(geo: THREE.BufferGeometry, y: number) {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  let z = 0;
  for (let i = 0; i < pos.count; i++) if (Math.abs(pos.getX(i)) < 0.06 && Math.abs(pos.getY(i) - y) < 0.05) z = Math.max(z, pos.getZ(i));
  return z;
}

/** Every geometry Auri needs, built once. `buildGeometry` can yield between parts so no single task is long. */
type Geometry = Awaited<ReturnType<typeof buildGeometry>>;
async function buildGeometry(detail: number, pause: () => Promise<void> = async () => {}) {
  const head = bakeWarmth(headGeometry(detail), 0.75);
  const glass = glassGeometry(detail);
  await pause();
  const body = bodyGeometry(detail);
  bakeWarmth(body, 0.9);
  const collar = bakeWarmth(collarGeometry(), 0.5, '#9a96b8');
  const plate = plateGeometry();
  const ear = { housing: earHousingGeometry(), ring: earRingGeometry(), cap: earCapGeometry() };
  const antenna = { base: antennaBaseGeometry(), stalk: antennaStalkGeometry(), ball: antennaBallGeometry() };
  await pause();
  const hand = handGeometry(detail);
  const cuff = bakeWarmth(cuffGeometry(), 0.3, '#b0acc8');
  return { head, glass, body, collar, plate, ear, antenna, hand, cuff };
}

function buildGeometrySync(detail: number): Geometry {
  const head = bakeWarmth(headGeometry(detail), 0.75);
  const body = bodyGeometry(detail);
  bakeWarmth(body, 0.9);
  return {
    head, glass: glassGeometry(detail), body, collar: bakeWarmth(collarGeometry(), 0.5, '#9a96b8'), plate: plateGeometry(),
    ear: { housing: earHousingGeometry(), ring: earRingGeometry(), cap: earCapGeometry() },
    antenna: { base: antennaBaseGeometry(), stalk: antennaStalkGeometry(), ball: antennaBallGeometry() },
    hand: handGeometry(detail), cuff: bakeWarmth(cuffGeometry(), 0.3, '#b0acc8'),
  };
}

const tmpV = new THREE.Vector3(), tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), tmpC = new THREE.Vector3(), tmpD = new THREE.Vector3(), tmpE = new THREE.Vector3();
const qx = new THREE.Vector3(), qy = new THREE.Vector3(), qz = new THREE.Vector3();
const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion();
const handOut = { pos: new THREE.Vector3(), quat: new THREE.Quaternion(), morph: { fist: 0, point: 0, spread: 0 }, elbow: new THREE.Vector3() };
const NAVY_HOUSING = new THREE.Color('#25245a');
const SHEEN_BASE = new THREE.Color('#7f78e6');
const RIM_BASE = new THREE.Color('#6e5cff');

export class ProceduralMascot implements MascotRig {
  readonly object = new THREE.Group();
  readonly pickables: THREE.Object3D[] = [];
  readonly headCenter = new THREE.Vector3(0, LAYOUT.neckY + LAYOUT.headUp, 0);
  get boundsTarget() { return this.bounce; }

  private bounce = new THREE.Group();
  private bodyPivot = new THREE.Group();
  private neck = new THREE.Group();
  private head = new THREE.Group();
  private antenna = new THREE.Group();
  private ball: THREE.Mesh;
  private ballHalo: THREE.Sprite;
  private glowMap: THREE.Texture;
  private hands: HandRig[] = [];
  private mats: ReturnType<typeof createMaterials>;
  private face: ReturnType<typeof createFaceMaterial>;
  private emotes = new Emotes();
  private stalkUniforms = { uBend: { value: new THREE.Vector2() } };
  private hue = new THREE.Color('#8f82ff');
  private hueTarget = new THREE.Color('#8f82ff');

  // State
  private expr: ExpressionState = cloneExpression(expressions.neutral);
  private baseExpr: ExpressionName = 'neutral';
  private overrideExpr: ExpressionName | null = null;
  private overrideUntil = 0;
  private overrideExplicit = false;
  private shownExpr: ExpressionName | null = null;
  private armPose: ArmPose = 'rest';
  private armBlend = new Map<ArmPose, number>([['rest', 1]]);
  private gestureName: GestureName = 'none';
  private gestureStart = 0;
  private gestureSide: 1 | -1 = 1;
  private lastReaction: Reaction | null = null;
  private facing: 1 | -1 = -1;
  private lookHead = new THREE.Vector2();
  private lookEyes = new THREE.Vector2();
  private lookBody = 0;
  private saccade = new THREE.Vector2();
  private nextSaccade = 0;
  private nextBlink = 1.2;
  private blinkStart = -10;
  private doubleBlink = false;
  private nextIdle = 18;
  private idle: { kind: 'glance' | 'twitch' | 'smile'; start: number; dir: number } | null = null;
  private antennaSpring = new Spring3(80, 6);
  private jump = { y: 0, v: 0 };
  private squash = { s: 0, v: 0 };
  private wiggle = 0;
  private lastHeadYaw = 0;
  private lastHeadPitch = 0;
  private lastBounceY = 0;
  private time = 0;
  /** Where the hands or arms last came closest to the head (debug only). */
  private clearanceWhere = '';
  /** Deterministic mode for renders (character sheets, tests): no random blinks, saccades or idle behaviours. */
  lab = false;

  /** Builds Auri in a few short tasks (yielding to the browser between the head, the body and the hands). */
  static async create(opts: { detail?: number } = {}) {
    const geometry = await buildGeometry(opts.detail ?? 1, () => new Promise((r) => setTimeout(r, 0)));
    return new ProceduralMascot({ ...opts, geometry });
  }

  constructor(opts: { detail?: number; geometry?: Geometry } = {}) {
    const detail = opts.detail ?? 1;
    const geo = opts.geometry ?? buildGeometrySync(detail);
    this.glowMap = glowTexture();
    this.mats = createMaterials(this.hue, this.glowMap);
    this.face = createFaceMaterial();
    const m = this.mats;

    /* body */
    this.bodyPivot.position.y = BODY_Y;
    const bodyGeo = geo.body;
    const body = new THREE.Mesh(bodyGeo, m.plush);
    const collar = new THREE.Mesh(geo.collar, m.velvet);
    collar.position.set(0, 0.42, 0.0);
    collar.rotation.x = 0.08;
    const plate = new THREE.Mesh(geo.plate, m.plate);
    plate.scale.setScalar(1.1);
    {
      // sits on the chest, following its slope, never inside it
      const zt = frontOf(bodyGeo, PLATE_Y + 0.12), zc = frontOf(bodyGeo, PLATE_Y), zb = frontOf(bodyGeo, PLATE_Y - 0.12);
      plate.position.set(0, PLATE_Y, Math.max(zc, (zt + zb) / 2) + 0.012);
      plate.rotation.x = -Math.atan2(zb - zt, 0.24);
    }
    this.bodyPivot.add(body, collar, plate);

    /* head */
    this.neck.position.y = LAYOUT.neckY - BODY_Y;
    this.head.position.y = LAYOUT.headUp;
    const shell = new THREE.Mesh(geo.head, m.shell);
    const glass = new THREE.Mesh(geo.glass, this.face.material);
    glass.renderOrder = 2;
    this.head.add(shell, glass);
    const ears: THREE.Object3D[] = [];
    for (const side of [-1, 1] as const) {
      const ear = new THREE.Group();
      ear.position.set(side * LAYOUT.ear.x, LAYOUT.ear.y, LAYOUT.ear.z);
      const housing = new THREE.Mesh(geo.ear.housing, m.earHousing);
      const ring = new THREE.Mesh(geo.ear.ring, m.earRing);
      ring.position.x = side * 0.1;
      const cap = new THREE.Mesh(geo.ear.cap, m.earCap);
      cap.position.x = side * 0.12;
      const earGlow = new THREE.Sprite(m.earHalo);
      earGlow.position.x = side * 0.2;
      earGlow.scale.set(0.95, 0.95, 1);
      earGlow.name = 'ear_halo';
      ear.add(housing, ring, cap, earGlow);
      ear.name = side < 0 ? 'ear_L' : 'ear_R';
      ears.push(ear);
      this.head.add(ear);
    }

    /* antenna: plush collar, a thin metal stalk that bends in the vertex shader, a glowing ball */
    const stalkMat = m.metal.clone();
    stalkMat.onBeforeCompile = (shader) => {
      shader.uniforms.uBend = this.stalkUniforms.uBend;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform vec2 uBend;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>\nfloat stalkT = clamp(transformed.y / ${ANTENNA.stalk.toFixed(3)}, 0.0, 1.0);\ntransformed.xz += uBend * stalkT * stalkT;`);
    };
    stalkMat.customProgramCacheKey = () => 'auri-stalk';
    const base = new THREE.Mesh(geo.antenna.base, m.plush);
    const stalk = new THREE.Mesh(geo.antenna.stalk, stalkMat);
    stalk.position.y = 0.02;
    this.ball = new THREE.Mesh(geo.antenna.ball, m.ball);
    this.antenna.position.set(LAYOUT.antenna.x, LAYOUT.antenna.y, LAYOUT.antenna.z);
    this.antenna.rotation.set(-0.05, 0, LAYOUT.antenna.lean);
    this.ballHalo = new THREE.Sprite(m.ballHalo);
    this.ballHalo.scale.setScalar(ANTENNA.ball * 5);
    this.ballHalo.name = 'sprout_halo';
    this.antenna.add(base, stalk, this.ball, this.ballHalo);
    this.head.add(this.antenna);
    this.neck.add(this.head);
    this.bodyPivot.add(this.neck);

    /* arms and hands */
    const handGeo = geo.hand;
    const cuffGeo = geo.cuff;
    for (const side of [1, -1] as const) {
      const group = new THREE.Group();
      const mesh = new THREE.Mesh(handGeo, m.hands);
      mesh.scale.x = side; // the other hand is the same mitten, mirrored
      mesh.morphTargetInfluences = [0, 0, 0];
      const cuff = new THREE.Mesh(cuffGeo, m.velvet);
      group.add(mesh, cuff);
      group.scale.setScalar(HAND_SCALE);
      const arm = new ArmTube();
      const armMesh = new THREE.Mesh(arm.geometry, m.plush);
      armMesh.frustumCulled = false;
      const rest = this.mirror(ARM_POSES.rest.R, side);
      const spring = new Spring3(95, 13);
      spring.pos.set(rest.pos[0], rest.pos[1] - BODY_Y, rest.pos[2]);
      const quat = this.handQuat(rest, new THREE.Quaternion());
      group.position.copy(spring.pos); group.quaternion.copy(quat);
      group.name = side > 0 ? 'hand_R' : 'hand_L'; mesh.name = `${group.name}_mesh`; cuff.name = `${group.name}_cuff`; armMesh.name = side > 0 ? 'arm_R' : 'arm_L';
      this.bodyPivot.add(group, armMesh);
      this.hands.push({ side, group, mesh, arm, armMesh, spring, quat, morph: { fist: 0, point: 0, spread: 0 }, elbow: new THREE.Vector3(), armLength: 0 });
      this.pickables.push(mesh, armMesh);
    }
    this.updateArms();

    // Names follow the GLB contract in docs/MASCOT.md, so the exported blockout is ready for Blender.
    this.object.name = 'Auri_root'; this.bounce.name = 'bounce'; this.bodyPivot.name = 'body_pivot';
    body.name = 'body'; collar.name = 'collar'; plate.name = 'core'; this.neck.name = 'neck'; this.head.name = 'head';
    shell.name = 'head_shell'; glass.name = 'visor';
    this.antenna.name = 'sprout'; stalk.name = 'sprout_stalk'; this.ball.name = 'sprout_bulb'; base.name = 'sprout_base';
    this.bounce.add(this.bodyPivot);
    this.object.add(this.bounce, this.emotes.group);
    // Only the big forms cast shadows (one depth program, few shadow draws); everything receives them.
    const casters = new Set<THREE.Object3D>([shell, body, collar, ...this.hands.map((h) => h.armMesh), ...ears.map((e) => e.children[0])]);
    this.bounce.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) { o.castShadow = casters.has(o); o.receiveShadow = true; }
    });
    this.pickables.push(shell, glass, body, collar);
  }

  /* ------------------------------------------------------------------ public API */
  setHue(color: THREE.Color) { this.hueTarget.copy(color); }
  setFacing(side: 1 | -1) { this.facing = side; }
  setBaseExpression(name: ExpressionName) { this.baseExpr = name; }

  setExpression(name: ExpressionName, hold = 1.2) {
    this.overrideExpr = name;
    this.overrideUntil = this.time + hold;
    this.overrideExplicit = hold >= 2; // long holds come from people (Meet Auri controls, the demos)
  }

  /** A transient mood that never overrides an expression someone asked for. */
  private suggest(name: ExpressionName, hold: number) {
    if (this.overrideExpr && this.overrideExplicit && this.time < this.overrideUntil) return;
    this.overrideExpr = name;
    this.overrideUntil = this.time + hold;
    this.overrideExplicit = false;
  }

  gesture(name: GestureName) {
    if (name === 'none' || name === 'hold') return;
    this.gestureName = name;
    this.gestureStart = this.time;
    this.gestureSide = this.facing;
    if (name === 'cheer') this.kick(2.4);
    const mood = GESTURE_MOOD[name];
    if (mood) this.suggest(mood, GESTURE_DURATION[name] * 0.9);
  }

  react(name: 'poke' | 'startle' | 'notice' | 'hover') {
    if (name === 'poke') {
      // A small set of playful responses, never the same one twice in a row.
      const options: Reaction[] = ['bounce', 'giggle', 'waveBack', 'wiggle'].filter((r) => r !== this.lastReaction && (r !== 'waveBack' || this.gestureName === 'none')) as Reaction[];
      const pick = options[Math.floor(Math.random() * options.length)] ?? 'bounce';
      this.lastReaction = pick;
      this.antennaSpring.vel.x += rand(-3, 3);
      this.antennaSpring.vel.z += 2.5;
      if (pick === 'bounce') {
        this.suggest('surprised', 0.35);
        setTimeout(() => this.suggest('happy', 1.4), 350);
        this.kick(2.8);
        this.squash.v -= 4;
      } else if (pick === 'giggle') {
        this.suggest('excited', 1.3);
        this.squash.v -= 3;
        this.kick(1.4);
      } else if (pick === 'waveBack') {
        this.suggest('happy', 1.8);
        this.gestureName = 'wave'; this.gestureStart = this.time; this.gestureSide = this.facing;
      } else {
        this.suggest('happy', 1.2);
        this.wiggle = 1;
      }
    } else if (name === 'startle') {
      this.suggest('surprised', 0.7);
      this.kick(1.6);
      this.antennaSpring.vel.z -= 2;
    } else if (name === 'hover') {
      this.suggest('happy', 1.3);
      this.antennaSpring.vel.x += rand(-1.5, 1.5);
    } else {
      this.suggest('curious', 1.1);
      this.antennaSpring.vel.z += 1;
    }
  }

  /**
   * A hop. Only from the ground and never additive: a burst of reactions (a fast cursor fires dozens of
   * pointer events) used to stack up velocity and launch Auri off screen.
   */
  private kick(v: number) {
    if (this.jump.y > 0.02 || this.jump.v > 0) return;
    this.jump.v = Math.min(v, MAX_KICK);
  }

  /* ------------------------------------------------------------------ pose helpers */
  private mirror(p: HandPose, side: number): HandPose {
    return {
      ...p,
      pos: [p.pos[0] * side, p.pos[1], p.pos[2]],
      fingers: [p.fingers[0] * side, p.fingers[1], p.fingers[2]],
      palm: [p.palm[0] * side, p.palm[1], p.palm[2]],
      elbow: p.elbow ? [p.elbow[0] * side, p.elbow[1], p.elbow[2]] : undefined,
    };
  }

  /** Orientation from "fingers point this way, palm faces that way". */
  private handQuat(p: HandPose, out: THREE.Quaternion) {
    const y = qy.set(p.fingers[0], p.fingers[1], p.fingers[2]).normalize();
    const z = qz.set(p.palm[0], p.palm[1], p.palm[2]);
    z.addScaledVector(y, -z.dot(y));
    if (z.lengthSq() < 1e-6) z.set(0, 0, 1);
    z.normalize();
    const x = qx.crossVectors(y, z).normalize();
    tmpM.makeBasis(x, y, z);
    return out.setFromRotationMatrix(tmpM);
  }

  /** The hand target for one side from the expression's arm pose (already blended) and the gesture. */
  private handTarget(h: HandRig, t: number, outPos: THREE.Vector3, outQuat: THREE.Quaternion, outMorph: { fist: number; point: number; spread: number }, outElbow: THREE.Vector3) {
    // 1. expression arm pose (blended over poses as the expression changes)
    outPos.set(0, 0, 0); outElbow.set(0, 0, 0); outMorph.fist = outMorph.point = outMorph.spread = 0;
    let wsum = 0, first = true;
    for (const [pose, w] of this.armBlend) {
      if (w < 1e-3) continue;
      const def = ARM_POSES[pose];
      const p = h.side > 0 ? def.R : this.mirror(def.L ?? def.R, -1);
      const pp = this.animateArm(pose, p, h.side, t);
      outPos.x += pp.pos[0] * w; outPos.y += pp.pos[1] * w; outPos.z += pp.pos[2] * w;
      if (pp.elbow) outElbow.add(tmpV.set(pp.elbow[0], pp.elbow[1], pp.elbow[2]).multiplyScalar(w));
      outMorph.fist += (pp.fist ?? 0) * w; outMorph.point += (pp.point ?? 0) * w; outMorph.spread += (pp.spread ?? 0) * w;
      this.handQuat(pp, tmpQ);
      if (first) { outQuat.copy(tmpQ); first = false; } else outQuat.slerp(tmpQ, w / (wsum + w));
      wsum += w;
    }
    if (wsum > 0) { outPos.divideScalar(wsum); outElbow.divideScalar(wsum); outMorph.fist /= wsum; outMorph.point /= wsum; outMorph.spread /= wsum; }

    // 2. gesture, by envelope (rise, hold, settle)
    const g = this.gestureName;
    const def = GESTURE_POSES[g];
    if (def) {
      const dur = GESTURE_DURATION[g];
      const k = (t - this.gestureStart) / dur;
      const env = smoothstep(0, 0.16, k) * (1 - smoothstep(0.78, 1, k));
      const lead = h.side === this.gestureSide || !!def.both;
      let p = lead ? def.lead : def.other;
      if (p) {
        // when the "other" pose comes from the arm library it is authored for +x
        p = this.mirror(p, h.side);
        p = this.animateGesture(g, p, h.side, t - this.gestureStart, lead);
        this.handQuat(p, tmpQ);
        outQuat.slerp(tmpQ, env);
        outPos.lerp(tmpV.set(p.pos[0], p.pos[1], p.pos[2]), env);
        outElbow.lerp(tmpV.set(p.elbow?.[0] ?? 0, p.elbow?.[1] ?? 0, p.elbow?.[2] ?? 0), env);
        outMorph.fist += ((p.fist ?? 0) - outMorph.fist) * env;
        outMorph.point += ((p.point ?? 0) - outMorph.point) * env;
        outMorph.spread += ((p.spread ?? 0) - outMorph.spread) * env;
      }
    }
    outPos.y -= BODY_Y;
  }

  /** Small living motion on top of the resting arm poses. */
  private animateArm(pose: ArmPose, p: HandPose, side: number, t: number): HandPose {
    if (this.lab) return p;
    if (pose === 'talk' && side > 0) {
      const beat = Math.sin(t * 5.2) * 0.5 + Math.sin(t * 3.1 + 1) * 0.5;
      return { ...p, pos: [p.pos[0] + beat * 0.04, p.pos[1] + Math.abs(beat) * 0.07, p.pos[2]], fingers: [p.fingers[0] + beat * 0.2, p.fingers[1], p.fingers[2]] };
    }
    if (pose === 'cheeks') {
      const b = Math.abs(Math.sin(t * 7 + (side > 0 ? 0 : 1.2))) * 0.05;
      return { ...p, pos: [p.pos[0], p.pos[1] + b, p.pos[2]] };
    }
    return p;
  }

  private animateGesture(g: GestureName, p: HandPose, side: number, gt: number, lead: boolean): HandPose {
    if (g === 'wave' && lead) {
      const w = Math.sin(gt * 9.5) * smoothstep(0.25, 0.45, gt);
      return { ...p, pos: [p.pos[0] + w * 0.07 * side, p.pos[1] + Math.abs(w) * 0.03, p.pos[2]], fingers: [p.fingers[0] + w * 0.55 * side, p.fingers[1], p.fingers[2]] };
    }
    if (g === 'cheer') {
      const w = Math.sin(gt * 13 + (side > 0 ? 0 : 1.4));
      return { ...p, pos: [p.pos[0], p.pos[1] + w * 0.05, p.pos[2]], fingers: [p.fingers[0] + w * 0.15 * side, p.fingers[1], p.fingers[2]] };
    }
    if (g === 'point' && lead) {
      const w = Math.sin(gt * 5) * 0.025 * smoothstep(0.3, 0.5, gt);
      return { ...p, pos: [p.pos[0] + w * side, p.pos[1], p.pos[2]] };
    }
    if (g === 'present' && lead) {
      const w = smoothstep(0.1, 0.6, gt);
      return { ...p, pos: [p.pos[0] - (1 - w) * 0.25 * side, p.pos[1], p.pos[2] - (1 - w) * 0.15] };
    }
    return p;
  }

  /** The shoulder for a hand at height `wristY` (raised arms lift it a little), in body space. */
  private shoulderOf(side: number, wristY: number, out: THREE.Vector3) {
    return out.set(LAYOUT.shoulder.x * side, LAYOUT.shoulder.y - BODY_Y + 0.06 * smoothstep(0.3, 1.0, wristY), LAYOUT.shoulder.z);
  }

  /** Pulls a wrist position back within the arm's reach of its shoulder. */
  private clampReach(side: number, wrist: THREE.Vector3) {
    const sh = this.shoulderOf(side, wrist.y, tmpE);
    const d = wrist.distanceTo(sh);
    if (d > MAX_REACH) wrist.sub(sh).multiplyScalar(MAX_REACH / d).add(sh);
    return wrist;
  }

  /**
   * Shapes each arm as a Bézier from shoulder to wrist whose length is always ARM_LENGTH: the control handles are
   * solved (a short bisection) so a near hand bends the arm outwards like an elbow and a far hand straightens it.
   */
  private updateArms() {
    for (const h of this.hands) {
      const wrist = h.group.position;
      const shoulder = this.shoulderOf(h.side, wrist.y, tmpA);
      const out = tmpB.set(h.side * 0.95, -0.32, -0.02).normalize(); // elbows go out to the side, never forward across the face
      const fingers = tmpV.set(0, 1, 0).applyQuaternion(h.group.quaternion);
      const p1 = tmpC, p2 = tmpD;
      const shape = (k: number) => {
        // the bend lives at the elbow, out to the side; the forearm only leans into the wrist a little
        p1.copy(shoulder).addScaledVector(out, k).addScaledVector(h.elbow, Math.min(k / 0.35, 1.5));
        p2.copy(wrist).addScaledVector(fingers, -Math.min(k * 0.9, 0.28)).addScaledVector(out, k * 0.45);
        return ArmTube.length(shoulder, p1, p2, wrist);
      };
      let lo = 0.04, hi = 1.4;
      if (shape(lo) >= ARM_LENGTH) hi = lo;
      else for (let i = 0; i < 9; i++) { const mid = (lo + hi) / 2; if (shape(mid) < ARM_LENGTH) lo = mid; else hi = mid; }
      h.armLength = shape(hi);
      h.arm.update(shoulder, p1, p2, wrist);
    }
  }

  /* ------------------------------------------------------------------ frame */
  update({ dt, time, look, attention, motion }: RigInput) {
    this.time = time;
    const step = motion ? dt : 1; // without motion, everything snaps to its rest target
    const live = motion && !this.lab;

    // --- expression: transient override, else base
    if (this.overrideExpr && time > this.overrideUntil) { this.overrideExpr = null; this.overrideExplicit = false; }
    const name = this.overrideExpr ?? this.baseExpr;
    const target = expressions[name];
    lerpExpression(this.expr, target, motion ? 1 - Math.exp(-dt * 10) : 1);
    const e = this.expr;
    if (name !== this.shownExpr) {
      this.shownExpr = name;
      this.emotes.show(expressionEmote[name], time, (this.facing > 0 ? -1 : 1));
    }
    // resting arms follow the expression, cross-faded
    const pose = expressionArms[name];
    if (pose !== this.armPose) { this.armPose = pose; if (!this.armBlend.has(pose)) this.armBlend.set(pose, 0); }
    for (const [k, w] of this.armBlend) {
      const nw = damp(w, k === pose ? 1 : 0, 6, step);
      if (nw < 1e-3 && k !== pose) this.armBlend.delete(k); else this.armBlend.set(k, nw);
    }

    // --- idle behaviours: rare, small, and only when nothing else is going on
    if (live && !this.idle && time > this.nextIdle && this.gestureName === 'none' && !this.overrideExpr && attention < 0.5) {
      const kinds = ['glance', 'twitch', 'smile'] as const;
      this.idle = { kind: kinds[Math.floor(Math.random() * kinds.length)], start: time, dir: Math.random() < 0.5 ? -1 : 1 };
      if (this.idle.kind === 'smile') this.suggest('happy', 1.4);
      if (this.idle.kind === 'twitch') { this.antennaSpring.vel.x += this.idle.dir * 2.2; }
    }
    if (this.idle && time - this.idle.start > 2.2) { this.idle = null; this.nextIdle = time + rand(14, 26); }
    const glance = this.idle?.kind === 'glance' ? Math.sin(Math.PI * clamp((time - this.idle.start) / 2.2, 0, 1)) * this.idle.dir : 0;

    // --- gaze: pointer (attention) blended with the expression's own bias and small saccades
    if (live && time > this.nextSaccade) {
      this.saccade.set(rand(-0.22, 0.22), rand(-0.12, 0.12)).multiplyScalar(1 - attention * 0.7);
      this.nextSaccade = time + rand(0.9, 2.8);
    }
    const gestureT = time - this.gestureStart;
    const gDur = GESTURE_DURATION[this.gestureName];
    if (this.gestureName !== 'none' && gestureT > gDur) this.gestureName = 'none';
    const gk = this.gestureName === 'none' ? 0 : smoothstep(0, 0.16, gestureT / gDur) * (1 - smoothstep(0.78, 1, gestureT / gDur));
    let gx = 0, gy = 0;
    if (this.gestureName === 'point' || this.gestureName === 'present') { gx = this.gestureSide * 0.55 * gk; gy = 0.05 * gk; }
    if (this.gestureName === 'think') { gx = 0.25 * gk; gy = 0.45 * gk; }
    const lx = clamp(look.x * attention + e.gazeX * (1 - attention * 0.6) + gx + glance * 0.7 + (live ? this.saccade.x : 0), -1, 1);
    const ly = clamp(look.y * attention + e.gazeY * (1 - attention * 0.6) + gy + (live ? this.saccade.y : 0), -1, 1);
    const ex = motion ? lx : 0, ey = motion ? ly : 0;
    this.lookEyes.x = damp(this.lookEyes.x, ex, 18, step);
    this.lookEyes.y = damp(this.lookEyes.y, ey, 18, step);
    this.lookHead.x = damp(this.lookHead.x, ex, 5, step);
    this.lookHead.y = damp(this.lookHead.y, ey, 5, step);
    this.lookBody = damp(this.lookBody, ex, 2, step);

    // --- head: gaze + expression + gesture additive + idle drift
    const idleT = motion ? time : 0;
    let nod = 0, gRoll = 0, gPitch = 0;
    if (this.gestureName === 'nod') {
      const k = gestureT / gDur;
      nod = -Math.sin(gestureT * 11) * 0.17 * (1 - k) * smoothstep(0, 0.08, k);
    }
    if (this.gestureName === 'shrug') { gRoll = 0.14 * gk * this.gestureSide; gPitch = 0.04 * gk; }
    if (this.gestureName === 'think') { gRoll = -0.06 * gk; gPitch = 0.06 * gk; }
    if (this.gestureName === 'cheer') gPitch = 0.1 * gk;
    if (this.gestureName === 'wave') gRoll = -0.06 * gk * this.gestureSide;
    const wig = this.wiggle > 0 ? Math.sin((1 - this.wiggle) * 30) * this.wiggle : 0;
    this.wiggle = Math.max(0, this.wiggle - step * 1.4);
    // With both arms up (cheer) or a hand beside the head (wave, shrug), Auri looks ahead rather than turning its
    // face into its own raised hand.
    const armsUp = this.gestureName === 'cheer' || this.gestureName === 'wave' || this.gestureName === 'shrug' ? gk : 0;
    this.head.rotation.y = this.lookHead.x * 0.5 * (1 - 0.8 * armsUp) + wig * 0.12;
    this.head.rotation.x = -this.lookHead.y * 0.3 - e.pitch - gPitch + nod + Math.sin(idleT * 0.9) * 0.012;
    this.head.rotation.z = e.tilt * (1 - gk * 0.5) + gRoll + Math.sin(idleT * 0.6 + 1.3) * 0.02 - this.lookHead.x * 0.07 * (1 - armsUp) + wig * 0.1;
    this.neck.rotation.y = this.lookHead.x * 0.1;
    this.bodyPivot.rotation.y = this.lookBody * 0.16 + (this.gestureName === 'present' ? this.gestureSide * 0.12 * gk : 0) + wig * 0.15;
    this.bodyPivot.rotation.x = -e.lean + (this.gestureName === 'nod' ? nod * 0.25 : 0);
    this.bodyPivot.rotation.z = Math.sin(idleT * 0.7) * 0.02 * e.energy;

    // --- hover, hop and squash (Auri floats: no feet, a slow bob)
    const float = motion ? Math.sin(time * 1.55) * 0.045 * Math.sqrt(e.energy) : 0;
    const breath = motion ? Math.sin(time * 1.9) * 0.008 : 0;
    if (motion) {
      this.jump.v -= 22 * dt;
      this.jump.y += this.jump.v * dt;
      if (this.jump.y > MAX_JUMP) { this.jump.y = MAX_JUMP; this.jump.v = Math.min(this.jump.v, 0); } // backstop
      if (this.jump.y < 0) { if (this.jump.v < -1.5) this.squash.v -= this.jump.v * 1.4; this.jump.y = 0; this.jump.v = 0; }
      this.squash.v += (-this.squash.s * 140 - this.squash.v * 11) * dt;
      this.squash.s += this.squash.v * dt;
    } else { this.jump.y = 0; this.squash.s = 0; this.squash.v = 0; this.jump.v = 0; }
    const hop = e.energy > 1.3 && motion ? Math.max(0, Math.sin(time * 6.5)) * 0.045 * (e.energy - 1.3) : 0;
    const shrugLift = this.gestureName === 'shrug' ? Math.sin(Math.PI * clamp(gestureT / gDur, 0, 1)) * 0.03 : 0;
    this.bounce.position.y = this.jump.y + hop + float + shrugLift;
    // squash freely, stretch a little: the top of the antenna must stay close to the frame (no 'launch')
    const sq = clamp(this.squash.s, -0.07, 0.12);
    this.bounce.scale.set(1 + sq * 0.5 - breath * 0.3, 1 - sq + breath, 1 + sq * 0.5 - breath * 0.3);
    const vy = (this.bounce.position.y - this.lastBounceY) / Math.max(dt, 1e-3);
    this.lastBounceY = this.bounce.position.y;

    // --- antenna: spring follow-through + expression perk
    const yawVel = (this.head.rotation.y - this.lastHeadYaw) / Math.max(dt, 1e-3);
    const pitchVel = (this.head.rotation.x - this.lastHeadPitch) / Math.max(dt, 1e-3);
    this.lastHeadYaw = this.head.rotation.y;
    this.lastHeadPitch = this.head.rotation.x;
    const excitedBuzz = e.perk > 0.9 && motion ? Math.sin(time * 38) * 0.012 * e.energy : 0;
    const sway = tmpV.set(
      (motion ? Math.sin(time * 1.3) * 0.025 : 0) - yawVel * 0.05 + excitedBuzz,
      0,
      (motion ? Math.cos(time * 1.1) * 0.015 : 0) + pitchVel * 0.04 - vy * 0.035 + Math.max(0, -e.perk) * 0.1,
    );
    const sp = live ? this.antennaSpring.step(sway, dt) : this.antennaSpring.pos.copy(sway);
    this.stalkUniforms.uBend.value.set(clamp(sp.x, -0.2, 0.2), clamp(sp.z, -0.2, 0.2));
    this.antenna.rotation.z = LAYOUT.antenna.lean + e.perk * 0.17 - Math.max(0, -e.perk) * 0.25;
    this.antenna.rotation.x = -0.05 + Math.max(0, -e.perk) * 0.35;
    this.ball.position.set(this.stalkUniforms.uBend.value.x, ANTENNA.stalk + 0.02 + ANTENNA.ball * 0.82, this.stalkUniforms.uBend.value.y);
    this.ballHalo.position.copy(this.ball.position);

    // --- hands and arms
    for (const h of this.hands) {
      const { pos: tp, quat: tq, morph: tm, elbow: el } = handOut;
      this.handTarget(h, time, tp, tq, tm, el);
      // the shrug and present gestures also breathe a little; the idle hands drift
      tp.y += motion ? Math.sin(time * 1.6 + (h.side > 0 ? 0.4 : 1.9)) * 0.025 : 0;
      tp.x -= this.lookBody * 0.04;
      this.clampReach(h.side, tp); // targets and shoulders are both in body space
      const pos = motion ? h.spring.step(tp, dt) : h.spring.pos.copy(tp);
      h.group.position.copy(pos);
      this.clampReach(h.side, h.group.position); // the spring's overshoot is clamped too
      h.quat.slerp(tq, motion ? 1 - Math.exp(-dt * 11) : 1);
      h.group.quaternion.copy(h.quat);
      h.morph.fist = damp(h.morph.fist, tm.fist, 12, step);
      h.morph.point = damp(h.morph.point, tm.point, 12, step);
      h.morph.spread = damp(h.morph.spread, tm.spread, 12, step);
      const inf = h.mesh.morphTargetInfluences!;
      inf[HAND_MORPHS.fist] = clamp(h.morph.fist, 0, 1);
      inf[HAND_MORPHS.point] = clamp(h.morph.point, 0, 1);
      inf[HAND_MORPHS.spread] = clamp(h.morph.spread * (1 - h.morph.fist), 0, 1);
      h.elbow.lerp(el, motion ? 1 - Math.exp(-dt * 10) : 1);
    }
    this.updateArms();

    // --- blink
    if (live && time > this.nextBlink) {
      this.blinkStart = time;
      this.doubleBlink = Math.random() < 0.18;
      this.nextBlink = time + (this.doubleBlink ? 0.32 : rand(2.4, 5.8)) / Math.max(0.6, Math.min(e.energy, 1.3));
    }
    const bt = (time - this.blinkStart) / 0.15;
    const blink = bt >= 0 && bt <= 1 ? Math.sin(Math.PI * bt) : 0;

    // --- lights and face
    this.hue.lerp(this.hueTarget, motion ? 1 - Math.exp(-dt * 4) : 1);
    const pulse = motion ? e.pulse * (0.5 + 0.5 * Math.sin(time * (e.energy < 0.5 ? 1.6 : 6))) : 0;
    const voice = motion ? e.talk * (0.5 + 0.5 * Math.sin(time * 15)) : 0;
    const m = this.mats;
    m.ball.emissive.copy(this.hue);
    m.ball.color.copy(this.hue).multiplyScalar(0.6);
    m.ball.emissiveIntensity = 0.9 * e.glow * (1 + pulse * 1.1);
    m.ballHalo.color.copy(this.hue);
    m.ballHalo.opacity = 0.5 * Math.min(e.glow, 1.3) * (1 + pulse * 0.8);
    m.earRing.emissive.copy(this.hue);
    m.earRing.emissiveIntensity = 1.5 * e.glow * (1 + voice * 0.6);
    m.earHalo.color.copy(this.hue);
    m.earHalo.opacity = 0.26 * Math.min(e.glow, 1.3) * (1 + voice * 0.8);
    m.earHousing.color.copy(NAVY_HOUSING).lerp(this.hue, 0.1);
    m.velvet.sheenColor.copy(SHEEN_BASE).lerp(this.hue, 0.5);
    rimUniforms.uRimColor.value.copy(RIM_BASE).lerp(this.hue, 0.65);
    rimUniforms.uRimStrength.value = 0.85 + 0.15 * e.glow;
    m.emblemUniforms.uEmblemHue.value.copy(this.hue);
    m.emblemUniforms.uEmblemGlow.value = e.glow * (1 + voice * 0.25);
    applyFace(this.face, e, blink, { x: this.lookEyes.x - this.lookHead.x * 0.5, y: this.lookEyes.y - this.lookHead.y * 0.5 }, time, this.hue, Math.min(e.glow, 1.15));

    // --- emotes, beside the head (on the side away from the page content)
    const side = this.facing > 0 ? -1 : 1;
    this.emotes.update(time, tmpB.set(side * 0.98, LAYOUT.neckY + LAYOUT.headUp + 0.62 + this.bounce.position.y, 0.15), this.hue, motion);
  }

  get currentHue() { return this.hue; }

  /** For tests (via ?glyphdebug): what Auri is doing right now. */
  debugState() {
    let meshes = 0, triangles = 0, casters = 0, sprites = 0;
    this.object.traverse((o) => {
      const m = o as THREE.Mesh;
      if ((o as THREE.Sprite).isSprite) { if (o.visible) sprites++; return; }
      if (!m.isMesh) return;
      meshes++; if (m.castShadow) casters++;
      triangles += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3;
    });
    return {
      expression: this.shownExpr, base: this.baseExpr, gesture: this.gestureName, hue: `#${this.hueTarget.getHexString()}`, arms: this.armPose,
      meshes, triangles: Math.round(triangles), casters, sprites,
      armLength: ARM_LENGTH, armLengths: this.hands.map((h) => +h.armLength.toFixed(4)), headClearance: +this.headClearance().toFixed(3), clearanceWhere: this.clearanceWhere,
    };
  }

  /**
   * How close the hands and arms come to the inside of the head: the smallest |p| / headRadius(direction) over
   * sampled hand points and every arm vertex, in head space (below 1 means inside the head shell).
   */
  private headClearance() {
    this.object.updateMatrixWorld(true);
    const p = new THREE.Vector3();
    let min = Infinity;
    let where = '';
    const test = (v: THREE.Vector3, label = '') => {
      this.head.worldToLocal(v);
      const l = v.length();
      if (l < 1e-6) return;
      const r = l / headRadius({ x: v.x / l, y: v.y / l, z: v.z / l });
      if (r < min) { min = r; where = `${label} ${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`; }
    };
    const handPoints: [number, number, number][] = [[0, 0.11, 0], [-0.07, 0.29, 0.02], [0, 0.32, 0.02], [0.07, 0.27, 0.02], [-0.17, 0.15, 0.05], [0.12, 0.1, 0]];
    for (const h of this.hands) {
      handPoints.forEach(([x, y, z], i) => test(h.mesh.localToWorld(p.set(x, y, z)), `hand${h.side}:${i}`));
      // the outer 55 % of the arm (its root emerges from under the head and collar by design)
      const pos = h.arm.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = Math.floor(pos.count * 0.45); i < pos.count; i++) test(h.armMesh.localToWorld(p.fromBufferAttribute(pos, i)), `arm${h.side}:${Math.floor(i / 17)}`);
    }
    this.clearanceWhere = where;
    return min;
  }

  dispose() {
    this.object.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) mesh.geometry.dispose();
    });
    for (const v of Object.values(this.mats)) if ((v as THREE.Material).isMaterial) (v as THREE.Material).dispose();
    this.face.material.dispose();
    this.emotes.dispose();
    this.glowMap.dispose();
  }
}
