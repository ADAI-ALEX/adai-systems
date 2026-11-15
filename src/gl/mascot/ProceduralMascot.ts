/**
 * Adi, built procedurally. Implements `MascotRig`, so it can be swapped for an authored GLB later.
 *
 * Motion model (all frame-rate independent):
 *  - gaze leads: eyes (fast) → head (medium) → body (slow), with clamps;
 *  - breathing and a slow weight shift give life when nothing happens;
 *  - the sprout and the hands are damped springs, so every move has follow-through;
 *  - gestures are short keyframed targets for the hands, layered over the springs;
 *  - expressions are parameter sets blended over ~0.15 s; transient reactions override them briefly.
 */
import * as THREE from 'three';
import { bodyGeometry, bulbGeometry, coreGeometry, earGeometry, handGeometry, headGeometry, SPROUT_LENGTH, sproutStalkGeometry, visorGeometry } from './shapes';
import { createMaterials } from './materials';
import { createFaceMaterial } from './faceMaterial';
import { expressions, lerpExpression } from './expressions';
import type { ExpressionName, ExpressionState, GestureName, MascotRig, RigInput } from './rig';

const damp = (current: number, target: number, lambda: number, dt: number) => current + (target - current) * (1 - Math.exp(-lambda * dt));
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

class Spring3 {
  pos = new THREE.Vector3();
  vel = new THREE.Vector3();
  constructor(public k = 70, public c = 11) {}
  step(target: THREE.Vector3, dt: number) {
    const steps = Math.ceil(dt / (1 / 120));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const ax = (target.x - this.pos.x) * this.k - this.vel.x * this.c;
      const ay = (target.y - this.pos.y) * this.k - this.vel.y * this.c;
      const az = (target.z - this.pos.z) * this.k - this.vel.z * this.c;
      this.vel.x += ax * h; this.vel.y += ay * h; this.vel.z += az * h;
      this.pos.x += this.vel.x * h; this.pos.y += this.vel.y * h; this.pos.z += this.vel.z * h;
    }
    return this.pos;
  }
}

const HAND_REST_L = new THREE.Vector3(-0.86, 0.6, 0.28);
const HAND_REST_R = new THREE.Vector3(0.86, 0.62, 0.28);
const GESTURE_DURATION: Record<GestureName, number> = { none: 0, wave: 2.0, point: 1.8, think: 3.2, cheer: 1.6, present: 2.2, shrug: 1.6, nod: 1.1, hold: 0 };

export class ProceduralMascot implements MascotRig {
  readonly object = new THREE.Group();
  readonly pickables: THREE.Object3D[] = [];
  readonly headCenter = new THREE.Vector3(0, 1.64, 0);

  private bounce = new THREE.Group();
  private bodyPivot = new THREE.Group();
  private neck = new THREE.Group();
  private head = new THREE.Group();
  private sprout = new THREE.Group();
  private bulb: THREE.Mesh;
  private handL = new THREE.Group();
  private handR = new THREE.Group();
  private mats: ReturnType<typeof createMaterials>;
  private face: ReturnType<typeof createFaceMaterial>;
  private stalkUniforms = { uBend: { value: new THREE.Vector2() } };
  private hue = new THREE.Color('#eceae4');
  private hueTarget = new THREE.Color('#eceae4');

  // State
  private expr: ExpressionState = { ...expressions.neutral };
  private baseExpr: ExpressionName = 'neutral';
  private overrideExpr: ExpressionName | null = null;
  private overrideUntil = 0;
  private gestureName: GestureName = 'none';
  private gestureStart = 0;
  private facing: 1 | -1 = -1;
  private lookHead = new THREE.Vector2();
  private lookEyes = new THREE.Vector2();
  private lookBody = 0;
  private saccade = new THREE.Vector2();
  private nextSaccade = 0;
  private nextBlink = 1.2;
  private blinkStart = -10;
  private doubleBlink = false;
  private springL = new Spring3(62, 10);
  private springR = new Spring3(62, 10);
  private sproutSpring = new Spring3(85, 6.5);
  private jump = { y: 0, v: 0 };
  private squash = { s: 0, v: 0 };
  private lastHeadYaw = 0;
  private lastHeadPitch = 0;
  private time = 0;

  constructor(opts: { detail?: number } = {}) {
    const detail = opts.detail ?? 1;
    this.mats = createMaterials(this.hue);
    this.face = createFaceMaterial();

    const body = new THREE.Mesh(bodyGeometry(detail), this.mats.plush);
    body.position.y = 0.62;
    const core = new THREE.Mesh(coreGeometry(), this.mats.core);
    core.position.set(0.06, 0.66, 0.5);
    core.rotation.set(-0.15, 0.1, 0);
    this.bodyPivot.add(body, core);

    this.neck.position.y = 1.08;
    this.head.position.y = 0.56;
    const headMesh = new THREE.Mesh(headGeometry(detail), this.mats.silicone);
    const visor = new THREE.Mesh(visorGeometry(detail), this.face.material);
    visor.renderOrder = 2;
    const earL = new THREE.Mesh(earGeometry(1), this.mats.cushion);
    earL.position.set(-0.98, 0.02, -0.06);
    earL.rotation.z = 0.08;
    const earR = new THREE.Mesh(earGeometry(1.12), this.mats.cushion);
    earR.position.set(0.99, 0.06, -0.08);
    earR.rotation.z = -0.16;
    this.head.add(headMesh, visor, earL, earR);

    // Sprout: off-centre on the crown, leaning outwards. The stalk bends in the vertex shader.
    const stalkMat = this.mats.silicone.clone();
    stalkMat.onBeforeCompile = (shader) => {
      shader.uniforms.uBend = this.stalkUniforms.uBend;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform vec2 uBend;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>\nfloat sproutT = clamp(transformed.y / ${SPROUT_LENGTH.toFixed(3)}, 0.0, 1.0);\ntransformed.xz += uBend * sproutT * sproutT;`);
    };
    const stalk = new THREE.Mesh(sproutStalkGeometry(), stalkMat);
    this.bulb = new THREE.Mesh(bulbGeometry(), this.mats.glow);
    this.sprout.position.set(0.34, 0.74, -0.02);
    this.sprout.rotation.set(-0.08, 0, -0.38);
    this.sprout.add(stalk, this.bulb);
    this.head.add(this.sprout);
    this.neck.add(this.head);

    const handMeshL = new THREE.Mesh(handGeometry(-1, detail), this.mats.silicone);
    const handMeshR = new THREE.Mesh(handGeometry(1, detail), this.mats.silicone);
    this.handL.add(handMeshL);
    this.handR.add(handMeshR);
    this.springL.pos.copy(HAND_REST_L);
    this.springR.pos.copy(HAND_REST_R);
    this.sproutSpring.pos.set(0, 0, 0);

    this.bounce.add(this.bodyPivot, this.neck, this.handL, this.handR);
    this.object.add(this.bounce);
    this.object.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });
    this.pickables.push(headMesh, visor, body, handMeshL, handMeshR);
  }

  setHue(color: THREE.Color) { this.hueTarget.copy(color); }
  setFacing(side: 1 | -1) { this.facing = side; }

  setBaseExpression(name: ExpressionName) { this.baseExpr = name; }

  setExpression(name: ExpressionName, hold = 1.2) {
    this.overrideExpr = name;
    this.overrideUntil = this.time + hold;
  }

  gesture(name: GestureName) {
    if (name === 'none' || name === 'hold') return;
    this.gestureName = name;
    this.gestureStart = this.time;
    if (name === 'cheer') this.kick(2.6);
    if (name === 'wave') this.setExpression('happy', 1.8);
  }

  react(name: 'poke' | 'startle' | 'notice') {
    if (name === 'poke') {
      this.setExpression('surprised', 0.35);
      setTimeout(() => this.setExpression('happy', 1.4), 350);
      this.kick(3.2);
      this.squash.v -= 4;
      this.sproutSpring.vel.x += rand(-3, 3);
      this.sproutSpring.vel.z += 2;
    } else if (name === 'startle') {
      this.setExpression('surprised', 0.7);
      this.kick(1.6);
    } else {
      this.setExpression('curious', 1.1);
    }
  }

  private kick(v: number) { this.jump.v += v; }

  /** Hand targets for the active gesture (rig-local), or null when it has ended. */
  private gestureTargets(t: number, outL: THREE.Vector3, outR: THREE.Vector3): boolean {
    const name = this.gestureName;
    const dur = GESTURE_DURATION[name];
    if (name === 'none' || t > dur) { this.gestureName = 'none'; return false; }
    const k = t / dur;
    const env = Math.sin(Math.PI * Math.min(k * 1.25, 1)) ; // rise and settle
    const s = this.facing; // side the content is on
    switch (name) {
      case 'wave': {
        const a = easeInOut(Math.min(k * 3, 1)) * (k > 0.85 ? 1 - (k - 0.85) / 0.15 : 1);
        outR.set(0.98 + Math.sin(t * 9) * 0.13 * a, 0.62 + 1.0 * a, 0.36);
        return true;
      }
      case 'point':
      case 'present': {
        const hand = s < 0 ? outL : outR;
        hand.set(s * (1.22 + 0.06 * Math.sin(t * 3)), name === 'point' ? 1.12 : 0.86, 0.55);
        hand.lerp(s < 0 ? HAND_REST_L : HAND_REST_R, 1 - env);
        return true;
      }
      case 'think': {
        outR.set(0.32, 0.98 + 0.02 * Math.sin(t * 2), 0.82).lerp(HAND_REST_R, 1 - env);
        return true;
      }
      case 'cheer': {
        const a = env;
        outL.set(-0.78, 0.62 + 1.25 * a + Math.sin(t * 14) * 0.05 * a, 0.2);
        outR.set(0.78, 0.62 + 1.25 * a + Math.cos(t * 14) * 0.05 * a, 0.2);
        return true;
      }
      case 'shrug': {
        outL.set(-1.08, 0.82 + 0.28 * env, 0.42);
        outR.set(1.08, 0.82 + 0.28 * env, 0.42);
        return true;
      }
      case 'nod':
        return true;
      default:
        return false;
    }
  }

  update({ dt, time, look, attention, motion }: RigInput) {
    this.time = time;
    const step = motion ? dt : 1; // without motion, everything snaps to its rest target

    // Expression target: transient override, else base.
    if (this.overrideExpr && time > this.overrideUntil) this.overrideExpr = null;
    const targetExpr = expressions[this.overrideExpr ?? this.baseExpr];
    lerpExpression(this.expr, targetExpr, motion ? 1 - Math.exp(-dt * 11) : 1);
    const e = this.expr;

    // Gaze: pointer (attention) blended with the expression's own bias and small saccades.
    if (motion && time > this.nextSaccade) {
      this.saccade.set(rand(-0.25, 0.25), rand(-0.15, 0.15)).multiplyScalar(1 - attention * 0.7);
      this.nextSaccade = time + rand(0.9, 2.8);
    }
    const lx = clamp(look.x * attention + e.gazeX * (1 - attention * 0.6) + (motion ? this.saccade.x : 0), -1, 1);
    const ly = clamp(look.y * attention + e.gazeY * (1 - attention * 0.6) + (motion ? this.saccade.y : 0), -1, 1);
    const ex = motion ? lx : 0, ey = motion ? ly : 0;
    this.lookEyes.x = damp(this.lookEyes.x, ex, 16, step);
    this.lookEyes.y = damp(this.lookEyes.y, ey, 16, step);
    this.lookHead.x = damp(this.lookHead.x, ex, 5.5, step);
    this.lookHead.y = damp(this.lookHead.y, ey, 5.5, step);
    this.lookBody = damp(this.lookBody, ex, 2.2, step);

    // Head
    const idleT = motion ? time : 0;
    const nodT = this.gestureName === 'nod' ? time - this.gestureStart : -1;
    const nod = nodT >= 0 && nodT < GESTURE_DURATION.nod ? Math.sin(nodT * 17) * 0.13 * (1 - nodT / GESTURE_DURATION.nod) : 0;
    this.head.rotation.y = this.lookHead.x * 0.55;
    this.head.rotation.x = -this.lookHead.y * 0.34 + nod + Math.sin(idleT * 0.9) * 0.015;
    this.head.rotation.z = e.tilt + Math.sin(idleT * 0.6 + 1.3) * 0.025 - this.lookHead.x * 0.06;
    this.neck.rotation.y = this.lookHead.x * 0.12;
    this.bodyPivot.rotation.y = this.lookBody * 0.14;
    this.bodyPivot.rotation.z = Math.sin(idleT * 0.7) * 0.015;

    // Breathing, jump and squash
    const breath = Math.sin(idleT * 1.7) * 0.012 * e.energy;
    if (motion) {
      this.jump.v -= 22 * dt; // gravity
      this.jump.y += this.jump.v * dt;
      if (this.jump.y < 0) { if (this.jump.v < -1.5) this.squash.v -= this.jump.v * 1.6; this.jump.y = 0; this.jump.v = 0; }
      this.squash.v += (-this.squash.s * 140 - this.squash.v * 11) * dt;
      this.squash.s += this.squash.v * dt;
    } else { this.jump.y = 0; this.squash.s = 0; }
    const hop = e.energy > 1.3 && motion ? Math.max(0, Math.sin(time * 6.5)) * 0.04 * (e.energy - 1.3) : 0;
    this.bounce.position.y = this.jump.y + hop + breath;
    const sq = clamp(this.squash.s, -0.12, 0.12);
    this.bounce.scale.set(1 + sq * 0.5, 1 - sq + breath * 0.6, 1 + sq * 0.5);

    // Sprout follow-through: driven by head angular velocity and vertical motion.
    const yawVel = (this.head.rotation.y - this.lastHeadYaw) / Math.max(dt, 1e-3);
    const pitchVel = (this.head.rotation.x - this.lastHeadPitch) / Math.max(dt, 1e-3);
    this.lastHeadYaw = this.head.rotation.y;
    this.lastHeadPitch = this.head.rotation.x;
    const sway = new THREE.Vector3(Math.sin(idleT * 1.3) * 0.03 - yawVel * 0.06, 0, Math.cos(idleT * 1.1) * 0.02 + pitchVel * 0.05 - this.jump.v * 0.02);
    const sp = motion ? this.sproutSpring.step(sway, dt) : this.sproutSpring.pos.set(0, 0, 0);
    this.stalkUniforms.uBend.value.set(clamp(sp.x, -0.25, 0.25), clamp(sp.z, -0.25, 0.25));
    this.bulb.position.set(this.stalkUniforms.uBend.value.x, SPROUT_LENGTH + 0.07, this.stalkUniforms.uBend.value.y);
    const pulse = 1 + e.think * (0.5 + 0.5 * Math.sin(time * 6));
    this.mats.glow.emissiveIntensity = 1.6 * pulse;

    // Hands
    const tL = new THREE.Vector3().copy(HAND_REST_L), tR = new THREE.Vector3().copy(HAND_REST_R);
    tL.y += Math.sin(idleT * 1.6 + 0.4) * 0.035; tR.y += Math.sin(idleT * 1.6 + 1.9) * 0.035;
    tL.x -= this.lookBody * 0.05; tR.x -= this.lookBody * 0.05;
    if (motion) this.gestureTargets(time - this.gestureStart, tL, tR);
    const pL = motion ? this.springL.step(tL, dt) : this.springL.pos.copy(tL);
    const pR = motion ? this.springR.step(tR, dt) : this.springR.pos.copy(tR);
    this.handL.position.copy(pL);
    this.handR.position.copy(pR);
    this.handL.rotation.set(0.2, 0.3, 0.35 + (pL.y - HAND_REST_L.y) * 0.9);
    this.handR.rotation.set(0.2, -0.3, -0.35 - (pR.y - HAND_REST_R.y) * 0.9);

    // Blink
    if (motion && time > this.nextBlink) {
      this.blinkStart = time;
      this.doubleBlink = Math.random() < 0.18;
      this.nextBlink = time + (this.doubleBlink ? 0.32 : rand(2.2, 5.6));
    }
    const bt = (time - this.blinkStart) / 0.16;
    const blink = bt >= 0 && bt <= 1 ? Math.sin(Math.PI * bt) : 0;
    const open = 1 - blink * 0.95;

    // Face uniforms
    this.hue.lerp(this.hueTarget, motion ? 1 - Math.exp(-dt * 4) : 1);
    const u = this.face.uniforms;
    u.uEyeL.value.set(e.openL * open, e.scaleL, e.lidAngle, e.lidLevel);
    u.uEyeR.value.set(e.openR * open, e.scaleR, e.lidAngle, e.lidLevel);
    u.uHappy.value = e.happy;
    u.uTalk.value = e.talk;
    u.uThink.value = e.think;
    u.uBlush.value = e.blush;
    u.uGaze.value.set(this.lookEyes.x - this.lookHead.x * 0.5, this.lookEyes.y - this.lookHead.y * 0.5);
    u.uTime.value = time;
    u.uHue.value.copy(this.hue);
    this.mats.glow.emissive.copy(this.hue);
    this.mats.core.emissive.copy(this.hue);
  }

  get currentHue() { return this.hue; }

  dispose() {
    this.object.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) m.geometry.dispose();
    });
    Object.values(this.mats).forEach((m) => {
      if (Array.isArray(m)) m.forEach((t) => (t as THREE.Texture).dispose());
      else (m as THREE.Material).dispose();
    });
    this.face.material.dispose();
  }
}
