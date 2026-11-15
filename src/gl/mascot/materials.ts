/**
 * Soft materials for Adi, generated procedurally (no texture downloads):
 *  - silicone: satin, slightly glossy, warm cream, with a faint hand-sculpted micro surface;
 *  - plush: matte, high sheen fibre look for the body;
 *  - cushion: a slightly deeper tone for the ear pads;
 *  - glow: emissive hue for the sprout bulb and the chest core.
 */
import * as THREE from 'three';

function hash(x: number, y: number, seed: number) {
  const s = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return s - Math.floor(s);
}

function valueNoise(x: number, y: number, seed: number, period: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const w = (n: number) => ((n % period) + period) % period;
  const a = hash(w(xi), w(yi), seed), b = hash(w(xi + 1), w(yi), seed);
  const c = hash(w(xi), w(yi + 1), seed), d = hash(w(xi + 1), w(yi + 1), seed);
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** A tileable normal map from fractal value noise. `fibre` stretches it into soft directional strands. */
function normalMap(size: number, seed: number, scale: number, strength: number, fibre = 0) {
  const height = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let h = 0, amp = 1, freq = scale;
      for (let o = 0; o < 4; o++) {
        const period = Math.round(freq);
        const fx = (x / size) * period, fy = (y / size) * period * (1 + fibre * 6);
        h += valueNoise(fx, fy, seed + o, period) * amp;
        amp *= 0.5; freq *= 2;
      }
      height[y * size + x] = h;
    }
  }
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const l = height[y * size + ((x - 1 + size) % size)], r = height[y * size + ((x + 1) % size)];
      const u = height[((y - 1 + size) % size) * size + x], d = height[((y + 1) % size) * size + x];
      const nx = (l - r) * strength, ny = (u - d) * strength, nz = 1;
      const len = Math.hypot(nx, ny, nz);
      const i = (y * size + x) * 4;
      data[i] = ((nx / len) * 0.5 + 0.5) * 255;
      data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      data[i + 2] = ((nz / len) * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

export type MascotMaterials = ReturnType<typeof createMaterials>;

export function createMaterials(hue: THREE.Color) {
  const siliconeNormal = normalMap(256, 3, 8, 2.2);
  siliconeNormal.repeat.set(3, 2);
  const plushNormal = normalMap(256, 11, 32, 3.0, 0.5);
  plushNormal.repeat.set(4, 3);

  const silicone = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#e4d9c6'),
    roughness: 0.42,
    metalness: 0,
    sheen: 0.55,
    sheenColor: new THREE.Color('#ffe6c9'),
    sheenRoughness: 0.55,
    clearcoat: 0.32,
    clearcoatRoughness: 0.38,
    normalMap: siliconeNormal,
    normalScale: new THREE.Vector2(0.18, 0.18),
    envMapIntensity: 0.9,
  });

  const plush = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#d9cfbf'),
    roughness: 0.92,
    sheen: 1,
    sheenColor: new THREE.Color('#fff2df'),
    sheenRoughness: 0.42,
    normalMap: plushNormal,
    normalScale: new THREE.Vector2(0.22, 0.22),
    envMapIntensity: 0.6,
  });

  const cushion = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#c9b9a1'),
    roughness: 0.7,
    sheen: 0.8,
    sheenColor: new THREE.Color('#ffe9cf'),
    sheenRoughness: 0.5,
    normalMap: plushNormal,
    normalScale: new THREE.Vector2(0.35, 0.35),
  });

  const glow = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#1a1510'),
    emissive: hue.clone(),
    emissiveIntensity: 2.2,
    roughness: 0.25,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
  });

  const core = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#0d1015'),
    emissive: hue.clone(),
    emissiveIntensity: 1.6,
    roughness: 0.15,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  });

  return { silicone, plush, cushion, glow, core, textures: [siliconeNormal, plushNormal] };
}
