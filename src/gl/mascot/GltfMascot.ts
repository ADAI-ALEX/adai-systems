/**
 * Drop-in rig for an authored Auri (Blender → GLB). Implements the same `MascotRig` contract as the
 * procedural character, so swapping is a manifest change. See docs/MASCOT.md, "GLB contract".
 *
 * Expected in the GLB (names are case-sensitive; anything missing degrades gracefully):
 *   nodes:   head (look-at pivot), body, hand_L, hand_R, sprout (optional)
 *   meshes:  visor  → its material is replaced by Auri's procedural face shader when `faceShader` is true
 *   morphs:  blink_L, blink_R, smile, surprise, squint, think (on any mesh)
 *   clips:   idle_loop, wave, point, think, cheer, present, shrug, nod
 *   materials named `glow` / `core` take the section hue as emissive.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { applyFace, createFaceMaterial } from './faceMaterial';
import { cloneExpression, expressions, lerpExpression } from './expressions';
import type { ExpressionName, ExpressionState, GestureName, MascotRig, RigInput } from './rig';

const damp = (a: number, b: number, l: number, dt: number) => a + (b - a) * (1 - Math.exp(-l * dt));

export interface GltfManifest { src: string; faceShader?: boolean; headCenterY?: number }

export class GltfMascot implements MascotRig {
  readonly object = new THREE.Group();
  readonly pickables: THREE.Object3D[] = [];
  readonly headCenter = new THREE.Vector3(0, 1.78, 0);
  private head?: THREE.Object3D;
  private headRest = new THREE.Euler();
  private mixer?: THREE.AnimationMixer;
  private clips = new Map<string, THREE.AnimationAction>();
  private morphMeshes: THREE.Mesh[] = [];
  private glowMats: THREE.MeshStandardMaterial[] = [];
  private face?: ReturnType<typeof createFaceMaterial>;
  private hue = new THREE.Color('#8f82ff');
  private hueTarget = new THREE.Color('#8f82ff');
  private expr: ExpressionState = cloneExpression(expressions.neutral);
  private base: ExpressionName = 'neutral';
  private override: ExpressionName | null = null;
  private overrideUntil = 0;
  private look = new THREE.Vector2();
  private time = 0;
  private nextBlink = 1.5;
  private blinkAt = -10;

  static async load(m: GltfManifest) {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(m.src);
    return new GltfMascot(gltf, m);
  }

  private constructor(gltf: { scene: THREE.Group; animations: THREE.AnimationClip[] }, m: GltfManifest) {
    this.object.add(gltf.scene);
    if (m.headCenterY) this.headCenter.y = m.headCenterY;
    gltf.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (o.name === 'head') { this.head = o; this.headRest.copy(o.rotation); }
      if (mesh.isMesh) {
        mesh.castShadow = mesh.receiveShadow = true;
        this.pickables.push(mesh);
        if (mesh.morphTargetDictionary) this.morphMeshes.push(mesh);
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat && (mat.name === 'glow' || mat.name === 'core')) this.glowMats.push(mat);
        if (o.name === 'visor' && m.faceShader !== false) {
          this.face = createFaceMaterial();
          mesh.material = this.face.material;
        }
      }
    });
    if (gltf.animations.length) {
      this.mixer = new THREE.AnimationMixer(gltf.scene);
      for (const clip of gltf.animations) this.clips.set(clip.name, this.mixer.clipAction(clip));
      const idle = this.clips.get('idle_loop');
      idle?.play();
    }
  }

  setHue(c: THREE.Color) { this.hueTarget.copy(c); }
  setFacing() { /* authored gestures already have a side */ }
  setBaseExpression(n: ExpressionName) { this.base = n; }
  setExpression(n: ExpressionName, hold = 1.2) { this.override = n; this.overrideUntil = this.time + hold; }
  get currentHue() { return this.hue; }

  gesture(name: GestureName) {
    const action = this.clips.get(name);
    if (!action) return;
    action.reset().setLoop(THREE.LoopOnce, 1).fadeIn(0.2).play();
    action.clampWhenFinished = false;
  }

  react(name: 'poke' | 'startle' | 'notice' | 'hover') {
    this.setExpression(name === 'notice' ? 'curious' : name === 'hover' ? 'happy' : 'surprised', 0.6);
  }

  private morph(name: string, value: number) {
    for (const m of this.morphMeshes) {
      const i = m.morphTargetDictionary![name];
      if (i !== undefined) m.morphTargetInfluences![i] = value;
    }
  }

  update({ dt, time, look, attention, motion }: RigInput) {
    this.time = time;
    if (this.override && time > this.overrideUntil) this.override = null;
    lerpExpression(this.expr, expressions[this.override ?? this.base], motion ? 1 - Math.exp(-dt * 11) : 1);
    const e = this.expr;
    this.look.x = damp(this.look.x, motion ? look.x * attention + e.gazeX : 0, 5.5, motion ? dt : 1);
    this.look.y = damp(this.look.y, motion ? look.y * attention + e.gazeY : 0, 5.5, motion ? dt : 1);
    if (this.head) {
      this.head.rotation.set(this.headRest.x - this.look.y * 0.34, this.headRest.y + this.look.x * 0.55, this.headRest.z + e.tilt);
    }
    if (motion && time > this.nextBlink) { this.blinkAt = time; this.nextBlink = time + 2 + Math.random() * 3.5; }
    const bt = (time - this.blinkAt) / 0.16;
    const blink = bt >= 0 && bt <= 1 ? Math.sin(Math.PI * bt) : 0;
    this.morph('blink_L', Math.max(blink, 1 - Math.min(e.eyeL.open, 1)));
    this.morph('blink_R', Math.max(blink, 1 - Math.min(e.eyeR.open, 1)));
    this.morph('smile', e.eyeL.arc);
    this.morph('surprise', e.eyeL.ring);
    this.morph('squint', e.eyeL.lidLevel);
    this.morph('think', e.eyeL.line);
    this.hue.lerp(this.hueTarget, motion ? 1 - Math.exp(-dt * 4) : 1);
    for (const m of this.glowMats) m.emissive.copy(this.hue);
    if (this.face) applyFace(this.face, e, blink, { x: this.look.x * 0.5, y: this.look.y * 0.5 }, time, this.hue, e.glow);
    if (motion) this.mixer?.update(dt);
  }

  dispose() {
    this.mixer?.stopAllAction();
    this.object.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) m.geometry.dispose(); });
  }
}
