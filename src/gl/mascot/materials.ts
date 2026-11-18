/**
 * Auri's materials. No texture downloads: everything is procedural.
 *  - shell: smooth, satin ivory "soft-touch plastic" with a light clearcoat, like the reference character.
 *    There is deliberately no grain, fibre or bump: any micro-texture reads as leather at website sizes;
 *  - the head shell adds the display's rolled lip and groove, shaded per pixel from the face SDF;
 *  - velvet: smooth deep navy with a soft lavender sheen (collar, cuffs);
 *  - ear housing and cap: soft dark indigo, satin; ear ring, antenna ball and chest emblem: the accent lights.
 * Every shell material carries an accent-tinted fresnel rim, the glowing edge of the reference.
 */
import * as THREE from 'three';
import { FACE } from './shapes';

export type MascotMaterials = ReturnType<typeof createMaterials>;

export const IVORY = '#f4efea';
export const NAVY = '#1e1d43';

const FACE_SDF = /* glsl */ `
  float aFaceSdf(vec2 p) {
    vec2 q = abs(p - vec2(${FACE.cx.toFixed(4)}, ${FACE.cy.toFixed(4)})) - vec2(${FACE.hw.toFixed(4)}, ${FACE.hh.toFixed(4)}) + ${FACE.r.toFixed(4)};
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - ${FACE.r.toFixed(4)};
  }
`;

interface ShellOptions { face?: boolean; rim?: number }

/** Shared by every shell material: the accent-tinted rim glow (updated per frame with the hue). */
export const rimUniforms = { uRimColor: { value: new THREE.Color('#7c6cff') }, uRimStrength: { value: 1 } };

/**
 * Adds the accent rim (and, for the head, the display lip) to a MeshPhysicalMaterial. Materials without the face
 * share one shader program; only the head shell (face lip) and the hands (morph targets) differ.
 */
function shell(mat: THREE.MeshPhysicalMaterial, { face = false, rim = 0.3 }: ShellOptions = {}) {
  const own = { uRim: { value: rim } };
  mat.customProgramCacheKey = () => (face ? 'auri-shell-face' : 'auri-shell');
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, rimUniforms, own);
    if (face) {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vObjPos;')
        .replace('#include <project_vertex>', 'vObjPos = transformed;\n#include <project_vertex>');
    }
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform vec3 uRimColor;\nuniform float uRimStrength;\nuniform float uRim;\n${face ? `varying vec3 vObjPos;\nuniform mat3 normalMatrix;\n${FACE_SDF}` : ''}`)
      .replace('#include <emissivemap_fragment>', /* glsl */ `#include <emissivemap_fragment>
        {
          // soft back-scatter at the silhouette, tinted by the accent: the glowing edge of the reference
          float fr = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
          totalEmissiveRadiance += uRimColor * pow(fr, 2.8) * uRim * uRimStrength * (0.75 + 0.25 * -normal.x);
        }`);
    if (face) {
      shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', /* glsl */ `
        #include <normal_fragment_maps>
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
          // the groove where the glass meets the shell is softly occluded
          float groove = 1.0 - smoothstep(-0.06, 0.03, s);
          diffuseColor.rgb *= 1.0 - 0.45 * groove;
        }
      `);
    }
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
  // Smooth satin ivory: soft-touch plastic with a light, slightly blurred clearcoat. No grain at all.
  const plush = shell(new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(IVORY),
    vertexColors: true,
    roughness: 0.42,
    metalness: 0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.28,
    sheen: 0.25,
    sheenColor: new THREE.Color('#ffffff'),
    sheenRoughness: 0.5,
    envMapIntensity: 0.85,
  }));

  const head = shell(plush.clone(), { face: true });

  // Hands: the same ivory (a separate program only because they use morph targets).
  const hands = shell(plush.clone());

  // Collar and cuffs: smooth deep navy with a soft lavender sheen (the same program as the ivory shell).
  const velvet = shell(new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(NAVY),
    vertexColors: true,
    roughness: 0.55,
    metalness: 0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.28,
    sheen: 0.25,
    sheenColor: new THREE.Color('#7f78e6'),
    sheenRoughness: 0.5,
    envMapIntensity: 0.6,
  }), { rim: 0.45 });

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
  // Kept dark and only faintly reflective: a strong clearcoat mirrored the bright top of the environment whenever
  // Auri leaned back (cheer, nod, shrug, wave) and fogged the tile over the emblem.
  const plate = new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#05050f'), roughness: 0.4, clearcoat: 0.15, clearcoatRoughness: 0.4, envMapIntensity: 0.15, specularIntensity: 0.3 });
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
          float halo = exp(-max(d, 0.0) * 80.0) * 0.32; // a tight glow: the tile around the bubble stays ink
          vec3 core = mix(uEmblemHue, vec3(1.0), 0.55);
          totalEmissiveRadiance += (core * bubble * (1.0 - dots * 0.95) * 2.6 + uEmblemHue * halo * (1.0 - bubble)) * uEmblemGlow;
          // the dots and the tile around the bubble stay ink-dark under any light, so the icon always reads
          diffuseColor.rgb *= 1.0 - bubble * 0.6;
        }`);
  };

  plush.name = 'plush'; head.name = 'shell'; hands.name = 'hands'; velvet.name = 'velvet';
  earHousing.name = 'ear_housing'; earCap.name = 'ear_cap'; earRing.name = 'glow'; metal.name = 'metal'; ball.name = 'glow_ball'; plate.name = 'core';
  return { plush, shell: head, hands, velvet, earHousing, earCap, earRing, metal, ball, plate, ballHalo, earHalo, emblemUniforms };
}
