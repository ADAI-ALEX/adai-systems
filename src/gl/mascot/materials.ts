/**
 * Auri's materials. No texture downloads: everything is procedural.
 *  - plush: warm ivory with a velvety sheen and a fine fibre normal computed per pixel (two octaves of value
 *    noise with analytic derivatives). The fibre fades out as it approaches pixel size, so it never shimmers
 *    and small renders fall back to a clean soft sheen;
 *  - shell: the plush, plus the display's rolled lip and groove, shaded per pixel from the face SDF;
 *  - velvet: deep navy plush with a lavender sheen (collar, cuffs);
 *  - ear housing and cap: soft dark indigo, satin; ear ring, antenna ball and chest emblem: the accent lights.
 */
import * as THREE from 'three';
import { FACE } from './shapes';

export type MascotMaterials = ReturnType<typeof createMaterials>;

export const IVORY = '#f4efea';
export const NAVY = '#1e1d43';

const NOISE = /* glsl */ `
  float aHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  // value noise with analytic derivatives (Inigo Quilez): returns (value, d/dx, d/dy, d/dz)
  vec4 aNoised(vec3 x) {
    vec3 i = floor(x), w = fract(x);
    vec3 u = w * w * (3.0 - 2.0 * w), du = 6.0 * w * (1.0 - w);
    float a = aHash(i), b = aHash(i + vec3(1,0,0)), c = aHash(i + vec3(0,1,0)), d = aHash(i + vec3(1,1,0));
    float e = aHash(i + vec3(0,0,1)), f = aHash(i + vec3(1,0,1)), g = aHash(i + vec3(0,1,1)), h = aHash(i + vec3(1,1,1));
    float k0 = a, k1 = b - a, k2 = c - a, k3 = e - a, k4 = a - b - c + d, k5 = a - c - e + g, k6 = a - b - e + f, k7 = -a + b + c - d + e - f - g + h;
    return vec4(k0 + k1*u.x + k2*u.y + k3*u.z + k4*u.x*u.y + k5*u.y*u.z + k6*u.z*u.x + k7*u.x*u.y*u.z,
      du * vec3(k1 + k4*u.y + k6*u.z + k7*u.y*u.z, k2 + k5*u.z + k4*u.x + k7*u.z*u.x, k3 + k6*u.x + k5*u.y + k7*u.x*u.y));
  }
`;

const FACE_SDF = /* glsl */ `
  float aFaceSdf(vec2 p) {
    vec2 q = abs(p - vec2(${FACE.cx.toFixed(4)}, ${FACE.cy.toFixed(4)})) - vec2(${FACE.hw.toFixed(4)}, ${FACE.hh.toFixed(4)}) + ${FACE.r.toFixed(4)};
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - ${FACE.r.toFixed(4)};
  }
`;

interface PlushOptions { scale?: number; amount?: number; tone?: number; face?: boolean; rim?: number }

/** Shared by every plush material: the accent-tinted rim glow (updated per frame with the hue). */
export const rimUniforms = { uRimColor: { value: new THREE.Color('#7c6cff') }, uRimStrength: { value: 1 } };

/**
 * Adds the fibre (and optionally the display lip) to a MeshPhysicalMaterial. Works with morph targets: the
 * fibre is anchored to the deformed object-space position.
 */
function plushify(mat: THREE.MeshPhysicalMaterial, { scale = 90, amount = 0.5, tone = 0.09, face = false, rim = 0.32 }: PlushOptions = {}) {
  // The fibre settings are uniforms, so every plush material without the face (body, arms, collar, cuffs,
  // antenna collar) shares one shader program; only the shell (face lip) and the hands (morphs) differ.
  const fibre = { uFibre: { value: new THREE.Vector4(scale, amount / 6, tone, rim) } };
  mat.customProgramCacheKey = () => (face ? 'auri-plush-face' : 'auri-plush');
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, rimUniforms, fibre);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vObjPos;')
      .replace('#include <project_vertex>', 'vObjPos = transformed;\n#include <project_vertex>');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vObjPos;\nuniform mat3 normalMatrix;\nuniform vec3 uRimColor;\nuniform float uRimStrength;\nuniform vec4 uFibre;\n${NOISE}\n${face ? FACE_SDF : ''}`)
      .replace('#include <emissivemap_fragment>', /* glsl */ `#include <emissivemap_fragment>
        {
          // soft back-scatter at the silhouette, tinted by the accent: the glowing plush edge of the reference
          float fr = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
          totalEmissiveRadiance += uRimColor * pow(fr, 2.6) * uFibre.w * uRimStrength * (0.75 + 0.25 * -normal.x);
        }`)
      .replace('#include <normal_fragment_maps>', /* glsl */ `
        #include <normal_fragment_maps>
        {
          vec3 fp = vObjPos * uFibre.x;
          // fade the fibre as one noise cell approaches a pixel: no shimmer, a clean sheen when small
          float foot = length(fwidth(fp));
          float fade = 1.0 - smoothstep(0.45, 1.5, foot);
          vec4 n1 = aNoised(fp);
          vec4 n2 = aNoised(fp * 2.37 + 11.3);
          vec3 g = n1.yzw + 0.6 * n2.yzw * (1.0 - smoothstep(0.15, 0.5, foot));
          normal = normalize(normal - normalMatrix * g * uFibre.y * fade);
          diffuseColor.rgb *= 1.0 + ((n1.x + 0.6 * n2.x) / 1.6 - 0.5) * uFibre.z * (0.4 + 0.6 * fade);
          ${face ? /* glsl */ `
          // the display's rolled lip and groove, shaded per pixel from the same profile the geometry uses
          if (vObjPos.z > 0.0) {
            vec2 p = vObjPos.xy;
            float s = aFaceSdf(p);
            float e = 0.0025;
            vec2 grad = normalize(vec2(aFaceSdf(p + vec2(e, 0.0)) - aFaceSdf(p - vec2(e, 0.0)), aFaceSdf(p + vec2(0.0, e)) - aFaceSdf(p - vec2(0.0, e))) + 1e-6);
            float t = clamp((s + 0.075) / 0.11, 0.0, 1.0);
            float dRecess = ${FACE.depth.toFixed(4)} * 6.0 * t * (1.0 - t) / 0.11;
            float lz = (s - 0.05) / 0.045;
            float dLip = -0.014 * 2.0 * lz / 0.045 * exp(-lz * lz);
            float slope = (dRecess + dLip) * smoothstep(0.05, 0.4, vObjPos.z);
            normal = normalize(normal - normalMatrix * vec3(grad * slope, 0.0) * 0.9);
            // the groove where the glass meets the plush is softly occluded
            float groove = 1.0 - smoothstep(-0.06, 0.03, s);
            diffuseColor.rgb *= 1.0 - 0.45 * groove;
          }` : ''}
        }
      `);
  };
  return mat;
}

/** Physical emissive light (ear rings, antenna ball): brightness is driven per frame. */
function light(color: THREE.Color, intensity: number, base = '#16163a') {
  // Same feature set as the ear housing and the antenna ball, so they all share one shader program.
  return new THREE.MeshPhysicalMaterial({ color: new THREE.Color(base), emissive: color.clone(), emissiveIntensity: intensity, roughness: 0.35, clearcoat: 0.3, clearcoatRoughness: 0.3 });
}

/**
 * Additive halo for the lights (no bloom pass needed): faint, and it keeps the lights' colour saturated.
 * Premultiplied, so colour and alpha accumulate together: the glyph composite un-premultiplies the HDR target,
 * and a plain additive sprite (alpha written as a²) would blow up into bright rings towards its faint edge.
 */
function halo(color: THREE.Color, map: THREE.Texture | null, opacity: number) {
  return new THREE.SpriteMaterial({ map, color: color.clone(), transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, premultipliedAlpha: true });
}

export function createMaterials(hue: THREE.Color, glowMap: THREE.Texture | null = null) {
  const plush = plushify(new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(IVORY),
    vertexColors: true,
    roughness: 0.9,
    metalness: 0,
    sheen: 1,
    sheenColor: new THREE.Color('#ffffff'),
    sheenRoughness: 0.42,
    envMapIntensity: 0.9,
  }));

  const shell = plushify(plush.clone(), { face: true });

  // Hands: same plush, a little finer (they're smaller), and they use morph targets.
  const hands = plushify(plush.clone(), { scale: 130, amount: 0.42 });

  const velvet = plushify(new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(NAVY),
    vertexColors: true,
    roughness: 0.92,
    sheen: 1,
    sheenColor: new THREE.Color('#7f78e6'),
    sheenRoughness: 0.45,
    envMapIntensity: 0.6,
  }), { scale: 110, amount: 0.5, tone: 0.14, rim: 0.5 });

  const earHousing = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#1c1b45'),
    roughness: 0.5,
    clearcoat: 0.5,
    clearcoatRoughness: 0.4,
    envMapIntensity: 0.7,
  });
  const earCap = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#171637'),
    roughness: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.18,
    envMapIntensity: 1,
  });
  const earRing = light(hue, 1.5);
  const ballHalo = halo(hue, glowMap, 0.55);
  const earHalo = halo(hue, glowMap, 0.28);

  const metal = new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#b9b7c9'), metalness: 0.85, roughness: 0.32, envMapIntensity: 1.1 });

  // The antenna ball: glossy and lit from within; it brightens and pulses with the expression.
  const ball = new THREE.MeshPhysicalMaterial({
    color: hue.clone().multiplyScalar(0.6),
    emissive: hue.clone(),
    emissiveIntensity: 0.9,
    roughness: 0.16,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.2,
  });

  // Chest plate: glossy ink tile; the speech-bubble emblem (with its three dots) is drawn on it by shader.
  const emblemUniforms = { uEmblemHue: { value: hue.clone() }, uEmblemGlow: { value: 1 } };
  const plate = new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#121230'), roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1 });
  plate.customProgramCacheKey = () => 'auri-plate';
  plate.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, emblemUniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vPlate;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPlate = position.xy;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', /* glsl */ `#include <common>
        varying vec2 vPlate; uniform vec3 uEmblemHue; uniform float uEmblemGlow;
        float eBox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
        float eSeg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)); }`)
      .replace('#include <emissivemap_fragment>', /* glsl */ `#include <emissivemap_fragment>
        {
          vec2 p = vPlate - vec2(0.004, 0.016);
          float d = eBox(p, vec2(0.104, 0.074), 0.064);
          // the tail, at the lower left, like the ADAI bubble
          d = min(d, eSeg(p, vec2(-0.055, -0.05), vec2(-0.082, -0.1)) - 0.019);
          float aa = fwidth(d) * 1.2;
          float bubble = 1.0 - smoothstep(-aa, aa, d);
          float dots = 0.0;
          for (int i = 0; i < 3; i++) { float dd = length(p - vec2(-0.042 + float(i) * 0.042, 0.0)) - 0.0145; dots = max(dots, 1.0 - smoothstep(-aa, aa, dd)); }
          float halo = exp(-max(d, 0.0) * 45.0) * 0.5;
          vec3 core = mix(uEmblemHue, vec3(1.0), 0.55);
          totalEmissiveRadiance += (core * bubble * (1.0 - dots * 0.92) * 2.2 + uEmblemHue * halo * (1.0 - bubble)) * uEmblemGlow;
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.9), bubble * (1.0 - dots) * 0.4);
        }`);
  };

  plush.name = 'plush'; shell.name = 'shell'; hands.name = 'hands'; velvet.name = 'velvet';
  earHousing.name = 'ear_housing'; earCap.name = 'ear_cap'; earRing.name = 'glow'; metal.name = 'metal'; ball.name = 'glow_ball'; plate.name = 'core';
  return { plush, shell, hands, velvet, earHousing, earCap, earRing, metal, ball, plate, ballHalo, earHalo, emblemUniforms };
}
