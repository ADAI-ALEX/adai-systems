/**
 * Procedural sculpting for Auri. Every soft part is a high-resolution sphere whose radius is reshaped per
 * direction (superellipsoids plus soft directional bulges), so the forms stay rounded and seamless; the face
 * display is carved into the head as a real recess with a rolled lip.
 *
 * Units: Auri is about 3 units tall, from just below the body (y ≈ -0.08 with the hover) to the top of the
 * antenna ball (y ≈ 2.92). +Z faces the viewer.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

type V3 = { x: number; y: number; z: number };

const superRadius = (d: V3, a: number, b: number, c: number, p: number) =>
  1 / Math.pow(Math.pow(Math.abs(d.x / a), p) + Math.pow(Math.abs(d.y / b), p) + Math.pow(Math.abs(d.z / c), p), 1 / p);

export const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
  return t * t * (3 - 2 * t);
};

/** Directional bulge: adds `amount` around unit direction `dir`, with angular `sharpness`. */
const bulge = (d: V3, dir: V3, amount: number, sharpness: number) => {
  const dot = d.x * dir.x + d.y * dir.y + d.z * dir.z;
  return dot > 0 ? amount * Math.pow(dot, sharpness) : 0;
};

const norm = (x: number, y: number, z: number): V3 => {
  const l = Math.hypot(x, y, z);
  return { x: x / l, y: y / l, z: z / l };
};

function sculpt(geo: THREE.BufferGeometry, radius: (d: V3) => number, post?: (p: THREE.Vector3, d: V3) => void) {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const d = { x: v.x, y: v.y, z: v.z };
    v.multiplyScalar(radius(d));
    post?.(v, d);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

/* ------------------------------------------------------------------ layout (rig space) */
export const LAYOUT = {
  /** Neck pivot height (bounce space) and the head centre above it. Head centre ends up at y = 1.78. */
  neckY: 1.12,
  headUp: 0.66,
  bodyY: 0.55,
  shoulder: new THREE.Vector3(0.36, 0.86, 0.02),
  antenna: { x: 0.2, y: 0.82, z: -0.06, lean: -0.3 },
  ear: { x: 1.01, y: -0.06, z: -0.04 },
} as const;

/* ------------------------------------------------------------------ head */
/** A broad, soft capsule of a head: rounder dome on top, a slightly fuller jaw. */
export const HEAD = { a: 1.04, b: 0.86, c: 0.86 };

/** The face display, in head-local x/y: a very rounded rectangle, a touch below the head centre. */
export const FACE = { cx: 0, cy: -0.03, hw: 0.8, hh: 0.6, r: 0.5, depth: 0.06 };

export function faceSdf(x: number, y: number) {
  const qx = Math.abs(x - FACE.cx) - FACE.hw + FACE.r;
  const qy = Math.abs(y - FACE.cy) - FACE.hh + FACE.r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - FACE.r;
}

/** Recess profile of the display (how far the shell is pushed in, by face SDF) and the rolled lip around it. */
export const recessDepth = (s: number) => FACE.depth * (1 - smooth(-0.075, 0.035, s));
export const lipHeight = (s: number) => 0.014 * Math.exp(-(((s - 0.05) / 0.045) ** 2));

export function headRadius(d: V3) {
  const p = 2.3 + 0.55 * smooth(0.3, -0.8, d.y);
  let r = superRadius(d, HEAD.a, HEAD.b, HEAD.c, p);
  r -= bulge(d, { x: 0, y: 0, z: 1 }, 0.03, 5); // the front is a touch flatter where the display sits
  r += bulge(d, norm(0, 1, -0.25), 0.025, 4); // crown fullness
  return r;
}

/**
 * The head shell with the display carved in. Normals are taken from the smooth head before carving (the
 * crisp lip is shaded per pixel in materials.ts from the same face SDF), so the vertex resolution only has
 * to carry the overall shape.
 */
export function headGeometry(detail = 1) {
  const geo = new THREE.SphereGeometry(1, Math.round(176 * detail), Math.round(128 * detail));
  sculpt(geo, headRadius);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (z <= 0) continue;
    const s = faceSdf(x, y);
    const front = smooth(0.05, 0.4, z);
    pos.setZ(i, z + (lipHeight(s) - recessDepth(s)) * front);
  }
  return geo;
}

/** The black glass: sampled from the head surface, sunk into the recess and very slightly domed. */
export function glassGeometry(detail = 1) {
  const geo = new THREE.SphereGeometry(1, Math.round(80 * detail), Math.round(60 * detail), 0.4, Math.PI - 0.8, 0.42, Math.PI - 0.84);
  sculpt(geo, headRadius, (p) => {
    const s = faceSdf(p.x, p.y);
    p.z += -FACE.depth * 0.62 + 0.024 * smooth(0.0, -0.38, s);
  });
  return geo;
}

/* ------------------------------------------------------------------ ear modules */
/** The housing: a soft, deep puck. Its outer face carries the light ring and a domed cap. */
export function earHousingGeometry() {
  const geo = new THREE.SphereGeometry(1, 48, 40);
  return sculpt(geo, (d) => superRadius(d, 0.2, 0.37, 0.37, 2.6));
}
export function earRingGeometry() {
  const geo = new THREE.TorusGeometry(0.33, 0.032, 16, 80);
  geo.rotateY(Math.PI / 2);
  return geo;
}
export function earCapGeometry() {
  const geo = new THREE.SphereGeometry(1, 40, 32);
  return sculpt(geo, (d) => superRadius(d, 0.07, 0.25, 0.25, 2.3));
}

/* ------------------------------------------------------------------ antenna */
export const ANTENNA = { stalk: 0.2, ball: 0.14 };
export function antennaBaseGeometry() {
  const geo = new THREE.SphereGeometry(1, 28, 20);
  return sculpt(geo, (d) => superRadius(d, 0.1, 0.065, 0.1, 2.4));
}
export function antennaStalkGeometry() {
  const geo = new THREE.CylinderGeometry(0.027, 0.034, ANTENNA.stalk, 16, 20, false);
  geo.translate(0, ANTENNA.stalk / 2, 0);
  return geo;
}
export function antennaBallGeometry() {
  return new THREE.SphereGeometry(ANTENNA.ball, 48, 36);
}

/* ------------------------------------------------------------------ body */
/** A compact, rounded body: fullest at the chest, tucking in towards the neck and the rounded bottom. */
export function bodyGeometry(detail = 1) {
  const geo = new THREE.SphereGeometry(1, Math.round(96 * detail), Math.round(72 * detail));
  return sculpt(
    geo,
    (d) => superRadius(d, 0.54, 0.52, 0.47, 2.35) + bulge(d, norm(0, -0.15, 1), 0.03, 3),
    (p) => {
      const s = 1 - 0.12 * smooth(0.05, -0.54, p.y) - 0.22 * smooth(0.15, 0.54, p.y);
      p.x *= s;
      p.z *= s;
    },
  );
}

/** The navy collar that the head rests in: a plump, slightly flattened ring. */
export function collarGeometry() {
  const geo = new THREE.TorusGeometry(0.37, 0.15, 28, 72);
  geo.rotateX(Math.PI / 2);
  geo.scale(1, 0.8, 0.92);
  geo.computeVertexNormals();
  return geo;
}

/** The chest plate: a small rounded tile, bent to the body; the speech-bubble emblem is drawn on it by shader. */
export const PLATE = { w: 0.15, h: 0.125, r: 0.07 };
export function plateGeometry() {
  const { w, h, r } = PLATE;
  const s = new THREE.Shape();
  s.moveTo(-w + r, -h);
  s.lineTo(w - r, -h); s.quadraticCurveTo(w, -h, w, -h + r);
  s.lineTo(w, h - r); s.quadraticCurveTo(w, h, w - r, h);
  s.lineTo(-w + r, h); s.quadraticCurveTo(-w, h, -w, h - r);
  s.lineTo(-w, -h + r); s.quadraticCurveTo(-w, -h, -w + r, -h);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.014, bevelSize: 0.014, bevelSegments: 5, curveSegments: 14 });
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, pos.getZ(i) - (pos.getX(i) ** 2) * 1.5 - (pos.getY(i) ** 2) * 0.9);
  geo.computeVertexNormals();
  return geo;
}

/* ------------------------------------------------------------------ hands */
/**
 * A soft mitten hand with four chunky fingers and a thumb, for the hand at +x with the palm facing +z and the
 * fingers along +y (the left hand is the same mesh mirrored). One topology, three morph targets:
 * `fist`, `point` (index out), `spread` (fingers fanned wide). The fingers bend along their length.
 */
type FingerPose = { curl: number; fan: number };
interface HandPose { fingers: FingerPose[]; thumb: { curl: number; out: number } }

const FINGERS = [
  { x: -0.07, len: 0.07, r: 0.041 }, // index (thumb side)
  { x: -0.023, len: 0.08, r: 0.042 },
  { x: 0.024, len: 0.076, r: 0.041 },
  { x: 0.069, len: 0.058, r: 0.038 }, // little finger
];
const PALM_TOP = 0.19;

const HAND_POSES: Record<'open' | 'fist' | 'point' | 'spread', HandPose> = {
  open: { fingers: [{ curl: 0.3, fan: 0.1 }, { curl: 0.32, fan: 0.03 }, { curl: 0.34, fan: -0.04 }, { curl: 0.38, fan: -0.12 }], thumb: { curl: 0.2, out: 0.75 } },
  fist: { fingers: [{ curl: 2.5, fan: 0.02 }, { curl: 2.6, fan: 0 }, { curl: 2.6, fan: 0 }, { curl: 2.5, fan: -0.02 }], thumb: { curl: 1.1, out: 0.25 } },
  point: { fingers: [{ curl: 0.06, fan: 0.02 }, { curl: 2.6, fan: 0 }, { curl: 2.6, fan: 0 }, { curl: 2.5, fan: -0.02 }], thumb: { curl: 1.0, out: 0.3 } },
  spread: { fingers: [{ curl: 0.12, fan: 0.36 }, { curl: 0.1, fan: 0.12 }, { curl: 0.12, fan: -0.12 }, { curl: 0.16, fan: -0.38 }], thumb: { curl: 0.05, out: 1.15 } },
};

/** Bends a finger built along +y (base at y=0) toward +z (the palm side) by `angle` over its length. */
function bendFinger(geo: THREE.BufferGeometry, length: number, angle: number) {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  if (Math.abs(angle) < 1e-4) return;
  const R = length / angle;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const t = Math.min(Math.max(y / length, 0), 1);
    const phi = angle * t;
    const extra = Math.max(y - length, 0) - Math.min(y, 0); // caps continue straight beyond the bend
    const sgn = y < 0 ? -1 : 1;
    const ry = (R - z) * Math.sin(phi), rz = R - (R - z) * Math.cos(phi);
    // tangent direction at the bend end
    const ty = Math.cos(phi), tz = Math.sin(phi);
    pos.setXYZ(i, x, ry + ty * extra * sgn, rz + tz * extra * sgn);
  }
}

function handPoseGeometry(pose: HandPose, detail: number) {
  const parts: THREE.BufferGeometry[] = [];
  const seg = Math.max(8, Math.round(14 * detail));
  const palm = new THREE.SphereGeometry(1, Math.max(16, Math.round(30 * detail)), Math.max(12, Math.round(22 * detail)));
  sculpt(palm, (d) => superRadius(d, 0.128, 0.115, 0.082, 2.3) + bulge(d, norm(0, 0.2, -1), 0.012, 3));
  palm.translate(0, 0.11, 0);
  parts.push(palm);
  FINGERS.forEach((f, i) => {
    const p = pose.fingers[i];
    const total = f.len + f.r * 2;
    const g = new THREE.CapsuleGeometry(f.r, f.len, 5, seg, 6);
    g.translate(0, f.len / 2 + f.r * 0.6, 0);
    bendFinger(g, total, p.curl);
    g.rotateZ(p.fan);
    g.translate(f.x, PALM_TOP - 0.035, 0.008);
    g.computeVertexNormals();
    parts.push(g);
  });
  {
    const t = pose.thumb;
    const r = 0.04, len = 0.06;
    const g = new THREE.CapsuleGeometry(r, len, 5, seg, 6);
    g.translate(0, len / 2 + r * 0.5, 0);
    bendFinger(g, len + r * 2, t.curl);
    g.rotateZ(t.out); // swings out toward -x (the thumb side)
    g.rotateY(-0.35);
    g.translate(-0.095, 0.075, 0.022);
    g.computeVertexNormals();
    parts.push(g);
  }
  return mergeGeometries(parts, false)!;
}

export function handGeometry(detail = 1) {
  const base = bakeWarmth(handPoseGeometry(HAND_POSES.open, detail), 0.5);
  const targets = (['fist', 'point', 'spread'] as const).map((k) => handPoseGeometry(HAND_POSES[k], detail));
  base.morphAttributes.position = targets.map((t) => t.attributes.position as THREE.BufferAttribute);
  base.morphAttributes.normal = targets.map((t) => t.attributes.normal as THREE.BufferAttribute);
  base.computeBoundingSphere();
  return base;
}
export const HAND_MORPHS = { fist: 0, point: 1, spread: 2 } as const;

/** The navy cuff at the wrist (in hand space: around the y axis at the wrist). */
export function cuffGeometry() {
  const geo = new THREE.TorusGeometry(0.088, 0.042, 14, 36);
  geo.rotateX(Math.PI / 2);
  geo.scale(1, 1.15, 0.92);
  geo.translate(0, 0.012, 0);
  return geo;
}

/* ------------------------------------------------------------------ arms */
/**
 * A soft arm from the shoulder to the wrist: a tapered tube along a cubic Bézier, rebuilt on the CPU each
 * frame (about 270 vertices per arm), so the arm bends smoothly into any gesture without an elbow.
 */
export class ArmTube {
  readonly geometry = new THREE.BufferGeometry();
  private readonly rings: number;
  private readonly radial: number;
  private readonly p = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  private readonly tmp = { a: new THREE.Vector3(), t: new THREE.Vector3(), n: new THREE.Vector3(), b: new THREE.Vector3(), prevT: new THREE.Vector3() };

  constructor(rings = 18, radial = 16, private r0 = 0.13, private r1 = 0.098) {
    this.rings = rings; this.radial = radial;
    const count = (rings + 1) * (radial + 1);
    this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage));
    const uv = new Float32Array(count * 2);
    const idx: number[] = [];
    for (let i = 0; i <= rings; i++) for (let j = 0; j <= radial; j++) {
      uv[(i * (radial + 1) + j) * 2] = j / radial; uv[(i * (radial + 1) + j) * 2 + 1] = i / rings;
      if (i < rings && j < radial) {
        const a = i * (radial + 1) + j, b = a + radial + 1;
        idx.push(a, a + 1, b, b, a + 1, b + 1); // wound so the outside faces out
      }
    }
    this.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    // plush vertex colour: a touch deeper toward the shoulder, where the arm tucks into the body
    const col = new Float32Array(count * 3);
    for (let i = 0; i <= rings; i++) for (let j = 0; j <= radial; j++) {
      const k = (i * (radial + 1) + j) * 3, v = 0.88 + 0.12 * smooth(0, 0.5, i / rings);
      col[k] = v; col[k + 1] = v * 0.985; col[k + 2] = v;
    }
    this.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.geometry.setIndex(idx);
  }

  private bez(t: number, out: THREE.Vector3) {
    const [p0, p1, p2, p3] = this.p, u = 1 - t;
    return out.set(0, 0, 0).addScaledVector(p0, u * u * u).addScaledVector(p1, 3 * u * u * t).addScaledVector(p2, 3 * u * t * t).addScaledVector(p3, t * t * t);
  }
  private tangent(t: number, out: THREE.Vector3) {
    const [p0, p1, p2, p3] = this.p, u = 1 - t;
    const a = 3 * u * u, b = 6 * u * t, c = 3 * t * t;
    out.set(
      (p1.x - p0.x) * a + (p2.x - p1.x) * b + (p3.x - p2.x) * c,
      (p1.y - p0.y) * a + (p2.y - p1.y) * b + (p3.y - p2.y) * c,
      (p1.z - p0.z) * a + (p2.z - p1.z) * b + (p3.z - p2.z) * c,
    );
    return out.lengthSq() > 1e-10 ? out.normalize() : out.set(0, -1, 0);
  }

  update(p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3) {
    this.p[0].copy(p0); this.p[1].copy(p1); this.p[2].copy(p2); this.p[3].copy(p3);
    const pos = this.geometry.attributes.position as THREE.BufferAttribute;
    const nor = this.geometry.attributes.normal as THREE.BufferAttribute;
    const { a, t, n, b, prevT } = this.tmp;
    // initial normal: perpendicular to the first tangent (parallel transport keeps the tube from twisting)
    this.tangent(0, t);
    n.set(0, 0, 1).cross(t);
    if (n.lengthSq() < 1e-6) n.set(1, 0, 0).cross(t);
    n.normalize();
    prevT.copy(t);
    for (let i = 0; i <= this.rings; i++) {
      const s = i / this.rings;
      this.bez(s, a);
      this.tangent(s, t);
      // transport the normal from the previous tangent to this one
      const axis = b.crossVectors(prevT, t);
      const sin = axis.length();
      if (sin > 1e-6) { const ang = Math.atan2(sin, prevT.dot(t)); n.applyAxisAngle(axis.divideScalar(sin), ang); }
      prevT.copy(t);
      b.crossVectors(t, n).normalize();
      const radius = (this.r0 + (this.r1 - this.r0) * smooth(0, 1, s)) * (1 + 0.07 * Math.sin(Math.PI * s));
      for (let j = 0; j <= this.radial; j++) {
        const th = (j / this.radial) * Math.PI * 2;
        const cx = Math.cos(th), sy = Math.sin(th);
        const nx = n.x * cx + b.x * sy, ny = n.y * cx + b.y * sy, nz = n.z * cx + b.z * sy;
        const k = i * (this.radial + 1) + j;
        pos.setXYZ(k, a.x + nx * radius, a.y + ny * radius, a.z + nz * radius);
        nor.setXYZ(k, nx, ny, nz);
      }
    }
    pos.needsUpdate = true; nor.needsUpdate = true;
    this.geometry.computeBoundingSphere();
    this.geometry.computeBoundingBox();
  }
}

/** Soft colour variation baked into vertex colours: a little deeper towards the underside, as if occluded. */
export function bakeWarmth(geo: THREE.BufferGeometry, strength = 1, under = '#d9cdd6') {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  const colors = new Float32Array(pos.count * 3);
  const top = new THREE.Color('#ffffff'), low = new THREE.Color(under), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getY(i) - bb.min.y) / Math.max(bb.max.y - bb.min.y, 1e-4);
    c.copy(top).lerp(low, Math.pow(1 - t, 1.8) * strength);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

/** A soft round glow (radial gradient), drawn once; used for the light halos around the antenna ball and ear rings. */
export function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.45)');
  grad.addColorStop(0.6, 'rgba(255,255,255,0.1)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
