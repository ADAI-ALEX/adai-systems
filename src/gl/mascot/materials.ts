/**
 * Soft materials for Adi, generated procedurally (no texture downloads):
 *  - silicone: satin, slightly glossy, warm cream, with a faint hand-sculpted micro surface;
 *  - plush: matte, high sheen fibre look for the body;
 *  - cushion: a slightly deeper tone for the ear pads;
 *  - glow: emissive hue for the sprout bulb and the chest core.
 */
import * as THREE from 'three';

export type MascotMaterials = ReturnType<typeof createMaterials>;

/** Auri's signature accent: a deep, slightly electric indigo, used sparingly (antenna tip, ear cushions). */
export const AURI_ACCENT = '#5a63f0';

/**
 * Smooth, sculpted materials. No grain or bump textures: the surface reads as soft silicone through its
 * lighting (satin sheen, a very light clearcoat) and a gentle warm-to-cool colour variation baked into
 * the vertex colours, rather than through micro-texture.
 */
export function createMaterials(hue: THREE.Color) {
  const silicone = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#f1ebe0'),
    vertexColors: true,
    roughness: 0.52,
    metalness: 0,
    sheen: 0.35,
    sheenColor: new THREE.Color('#fff1de'),
    sheenRoughness: 0.6,
    clearcoat: 0.16,
    clearcoatRoughness: 0.55,
    envMapIntensity: 0.85,
  });

  // The body: soft-touch matte, a warmer oat than the head. Restrained contrast, same family.
  const plush = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#ddd0bc'),
    vertexColors: true,
    roughness: 0.82,
    sheen: 0.7,
    sheenColor: new THREE.Color('#fff4e4'),
    sheenRoughness: 0.45,
    envMapIntensity: 0.55,
  });

  // Ear cushions: matte indigo felt, the quiet half of the accent.
  const cushion = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#3d4380'),
    roughness: 0.88,
    sheen: 1,
    sheenColor: new THREE.Color('#9aa3ff'),
    sheenRoughness: 0.5,
  });

  // Antenna tip: glossy indigo with a soft inner glow; it lights up in the section hue when Auri thinks.
  const glow = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(AURI_ACCENT),
    emissive: hue.clone(),
    emissiveIntensity: 0.15,
    roughness: 0.28,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    sheen: 0.4,
    sheenColor: new THREE.Color('#c3c8ff'),
  });

  // Chest emblem (the speech bubble): ink glass lit from inside in the section hue.
  const core = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#0d1015'),
    emissive: hue.clone(),
    emissiveIntensity: 1.5,
    roughness: 0.15,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  });

  silicone.name = 'silicone'; plush.name = 'plush'; cushion.name = 'cushion'; glow.name = 'glow'; core.name = 'core';
  return { silicone, plush, cushion, glow, core, textures: [] as THREE.Texture[] };
}

/**
 * Bakes a soft colour variation into a sculpted part: a little warmer and deeper toward the underside
 * (as if softly occluded), a little cooler and brighter on top. Gives "material depth" without texture.
 */
export function bakeWarmth(geo: THREE.BufferGeometry, strength = 1) {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  const colors = new Float32Array(pos.count * 3);
  const top = new THREE.Color('#ffffff'), under = new THREE.Color('#e9d6c2'), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getY(i) - bb.min.y) / Math.max(bb.max.y - bb.min.y, 1e-4);
    const k = Math.pow(1 - t, 1.6) * strength;
    c.copy(top).lerp(under, k);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}
