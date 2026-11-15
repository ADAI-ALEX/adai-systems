/**
 * Procedural sculpting for Adi. Every body part is a high-resolution sphere whose radius is reshaped per
 * direction (superellipsoids plus soft bulges), which keeps the forms rounded, organic and seamless.
 * All units: mascot is ~2.3 units tall, origin at the floor between the feet of the body.
 */
import * as THREE from 'three';

type V3 = { x: number; y: number; z: number };

const superRadius = (d: V3, a: number, b: number, c: number, p: number) =>
  1 / Math.pow(Math.pow(Math.abs(d.x / a), p) + Math.pow(Math.abs(d.y / b), p) + Math.pow(Math.abs(d.z / c), p), 1 / p);

const smooth = (e0: number, e1: number, x: number) => {
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

/* ---------------- Head: a soft speech bubble with a tail nub at the lower left ---------------- */
export const HEAD = { a: 1.0, b: 0.84, c: 0.8, p: 3.1 };
const TAIL_DIR = norm(-0.62, -0.66, 0.42);
const CROWN_DIR = norm(0.45, 0.85, 0.05);

export function headRadius(d: V3) {
  let r = superRadius(d, HEAD.a, HEAD.b, HEAD.c, HEAD.p);
  r += bulge(d, TAIL_DIR, 0.2, 26); // the bubble tail, the core of the ADAI identity
  r += bulge(d, CROWN_DIR, 0.035, 6); // a slightly fuller top right: subtle asymmetry
  r -= bulge(d, norm(0, 0, 1), 0.035, 10); // a gentle face plane for the visor to sit in
  return r;
}

export function headGeometry(detail = 1) {
  const geo = new THREE.SphereGeometry(1, Math.round(150 * detail), Math.round(110 * detail));
  return sculpt(geo, headRadius);
}

/** The visor is sampled from the same surface as the head and lifted by a hair, so it hugs it exactly. */
export function visorGeometry(detail = 1) {
  const geo = new THREE.SphereGeometry(1, Math.round(120 * detail), Math.round(90 * detail), Math.PI * 0.12, Math.PI * 0.76, Math.PI * 0.16, Math.PI * 0.7);
  // three.js places phi = PI/2 at +Z, so this window (0.12..0.88 PI) is already centred on the face.
  return sculpt(geo, (d) => headRadius(d) * 1.0025);
}

/* ---------------- Body: a soft plush pebble that narrows into the head ---------------- */
export function bodyGeometry(detail = 1) {
  const geo = new THREE.SphereGeometry(1, Math.round(110 * detail), Math.round(80 * detail));
  return sculpt(
    geo,
    (d) => superRadius(d, 0.66, 0.7, 0.58, 2.35) + bulge(d, norm(0.15, -0.2, 1), 0.05, 4),
    (p) => {
      const t = smooth(-0.1, 0.65, p.y);
      const s = 1 - 0.22 * t + 0.08 * smooth(0.2, -0.7, p.y);
      p.x *= s;
      p.z *= s;
    },
  );
}

/* ---------------- Hands: rounded mittens with a soft thumb ---------------- */
export function handGeometry(side: 1 | -1, detail = 1) {
  const geo = new THREE.SphereGeometry(1, Math.round(48 * detail), Math.round(36 * detail));
  const thumb = norm(-0.55 * side, 0.55, 0.6);
  return sculpt(geo, (d) => superRadius(d, 0.2, 0.24, 0.15, 2.4) + bulge(d, thumb, 0.07, 18));
}

/* ---------------- Ear cushions: soft discs, deliberately unequal ---------------- */
export function earGeometry(scale = 1) {
  const geo = new THREE.SphereGeometry(1, 48, 36);
  return sculpt(geo, (d) => superRadius(d, 0.13 * scale, 0.26 * scale, 0.26 * scale, 2.6));
}

/* ---------------- Sprout: a tapered stalk and a soft bulb ---------------- */
export const SPROUT_LENGTH = 0.46;
export function sproutStalkGeometry() {
  const geo = new THREE.CylinderGeometry(0.022, 0.05, SPROUT_LENGTH, 20, 24, false);
  geo.translate(0, SPROUT_LENGTH / 2, 0);
  return geo;
}

export function bulbGeometry() {
  const geo = new THREE.SphereGeometry(1, 40, 30);
  return sculpt(geo, (d) => superRadius(d, 0.1, 0.12, 0.1, 2.2));
}

/** Core light on the chest: a smooth lens. */
export function coreGeometry() {
  const geo = new THREE.SphereGeometry(1, 40, 30);
  return sculpt(geo, (d) => superRadius(d, 0.13, 0.13, 0.05, 2.0));
}
