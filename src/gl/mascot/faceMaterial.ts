/**
 * Adi's face: a glossy ink visor shaped like the ADAI speech bubble, with two glowing eyes at the logo's
 * proportions. Everything is a signed distance field in head-local units, so expressions are parameters,
 * stay razor sharp at any size and read clearly when the glyph pass reduces them to a few cells.
 */
import * as THREE from 'three';

export type EyeParams = { open: number; scale: number; lidAngle: number; lidLevel: number };

export function createFaceMaterial() {
  const uniforms = {
    uEyeL: { value: new THREE.Vector4(1, 1, 0, 0) },
    uEyeR: { value: new THREE.Vector4(1, 1, 0, 0) },
    uHappy: { value: 0 },
    uGaze: { value: new THREE.Vector2() },
    uTalk: { value: 0 },
    uThink: { value: 0 },
    uBlush: { value: 0 },
    uGlow: { value: 1 },
    uTime: { value: 0 },
    uHue: { value: new THREE.Color('#f2b560') },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: true,
    vertexShader: /* glsl */ `
      varying vec3 vLocal;
      varying vec3 vNormalV;
      varying vec3 vViewPos;
      void main() {
        vLocal = position;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewPos = mv.xyz;
        vNormalV = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec3 vLocal;
      varying vec3 vNormalV;
      varying vec3 vViewPos;
      uniform vec4 uEyeL;
      uniform vec4 uEyeR;
      uniform float uHappy;
      uniform vec2 uGaze;
      uniform float uTalk;
      uniform float uThink;
      uniform float uBlush;
      uniform float uGlow;
      uniform float uTime;
      uniform vec3 uHue;

      float sdRoundBox(vec2 p, vec2 b, float r) {
        vec2 q = abs(p) - b + r;
        return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
      }
      float sdSegment(vec2 p, vec2 a, vec2 b) {
        vec2 pa = p - a, ba = b - a;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        return length(pa - ba * h);
      }
      float smin(float a, float b, float k) {
        float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
        return mix(b, a, h) - k * h * (1.0 - h);
      }
      // The visor: the rounded body of the ADAI speech bubble, centred on the face. (The bubble's tail now
      // lives on the chest emblem, so the face stays symmetrical and calm.)
      float visorSdf(vec2 p) {
        return sdRoundBox(p - vec2(0.0, 0.04), vec2(0.63, 0.41), 0.34);
      }
      float eyeSdf(vec2 p, vec2 c, vec4 e, float side) {
        float r = 0.165 * e.y;
        vec2 q = p - c;
        float open = max(e.x, 0.05);
        float dEll = (length(vec2(q.x, q.y / open)) - r) * min(1.0, open);
        // Smiling closed eye: a filled crescent (a disc minus a lower disc), so there is no hole.
        float dA = length(q - vec2(0.0, -r * 0.2)) - r * 0.95;
        float dB = length(q - vec2(0.0, -r * 0.62)) - r * 0.93;
        float ring = max(dA, -dB);
        float d = mix(dEll, ring, uHappy);
        float a = e.z * side;
        vec2 n = vec2(sin(a), cos(a));
        float lid = dot(q, n) - (1.0 - 2.0 * e.w) * r * 1.05;
        return max(d, lid);
      }

      void main() {
        vec2 p = vLocal.xy;
        float dv = visorSdf(p);
        float aa = fwidth(dv) * 1.2;
        float inside = 1.0 - smoothstep(-aa, aa, dv);
        if (inside < 0.002) discard;

        vec3 N = normalize(vNormalV);
        vec3 V = normalize(-vViewPos);
        float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);

        // Glossy ink glass
        vec3 col = mix(vec3(0.010, 0.013, 0.020), vec3(0.028, 0.034, 0.048), smoothstep(-0.5, 0.5, p.y));
        vec3 L = normalize(vec3(-0.5, 0.75, 0.6));
        float spec = pow(max(dot(reflect(-L, N), V), 0.0), 70.0);
        float broad = pow(max(dot(reflect(-L, N), V), 0.0), 8.0) * 0.08;
        col += vec3(1.0, 0.96, 0.9) * (spec * 1.4 + broad) + fres * vec3(0.10, 0.12, 0.16);
        // Lip where the glass meets the silicone
        float lip = 1.0 - smoothstep(0.0, 0.035, -dv);
        col += vec3(0.9, 0.85, 0.78) * lip * (0.12 + 0.25 * max(N.y, 0.0));

        // Eyes
        vec2 gaze = uGaze * vec2(0.075, 0.055);
        float dL = eyeSdf(p, vec2(-0.32, 0.05) + gaze, uEyeL, -1.0);
        float dR = eyeSdf(p, vec2(0.32, 0.05) + gaze, uEyeR, 1.0);
        float d = min(dL, dR);
        float eye = 1.0 - smoothstep(-aa, aa, d);
        vec3 eyeCore = mix(vec3(1.0, 0.96, 0.88), uHue, 0.22);
        vec3 eyeEdge = mix(eyeCore, uHue, 0.55);
        float depthIn = smoothstep(0.0, -0.12, d);
        vec3 eyeCol = mix(eyeEdge, eyeCore, depthIn) * (1.6 * uGlow);
        float halo = exp(-max(d, 0.0) * 26.0) * 0.38 * uGlow * (1.0 - 0.9 * uHappy);
        col += uHue * halo * 0.6;
        // Tiny specular catch-lights keep the eyes alive
        vec2 hl = vec2(-0.055, 0.07) * mix(uEyeL.y, uEyeR.y, step(0.0, p.x));
        float catchL = 1.0 - smoothstep(0.016, 0.03, length(p - (vec2(-0.32, 0.05) + gaze + hl)));
        float catchR = 1.0 - smoothstep(0.016, 0.03, length(p - (vec2(0.32, 0.05) + gaze + hl)));
        eyeCol += vec3(2.0) * (catchL + catchR) * (1.0 - uHappy) * step(0.35, min(uEyeL.x, uEyeR.x));
        col = mix(col, eyeCol, eye);

        // Talking: a soft voice waveform; thinking: the three typing dots of a chat bubble.
        float wave = 0.0;
        for (int i = 0; i < 7; i++) {
          float fi = float(i);
          float x = -0.15 + fi * 0.05;
          float h = 0.012 + uTalk * 0.05 * (0.5 + 0.5 * sin(uTime * 13.0 + fi * 1.7)) * (1.0 - abs(fi - 3.0) / 4.0);
          float bar = sdRoundBox(p - vec2(x, -0.2), vec2(0.012, h), 0.012);
          wave = max(wave, 1.0 - smoothstep(-aa, aa, bar));
        }
        col = mix(col, eyeCore * 1.3, wave * uTalk);
        float dots = 0.0;
        for (int i = 0; i < 3; i++) {
          float fi = float(i);
          float bounce = max(sin(uTime * 7.0 - fi * 0.9), 0.0) * 0.035;
          float dd = length(p - vec2(-0.08 + fi * 0.08, -0.2 + bounce)) - 0.028;
          dots = max(dots, 1.0 - smoothstep(-aa, aa, dd));
        }
        col = mix(col, eyeCore * 1.2, dots * uThink);

        // Blush
        float bl = exp(-pow(length((p - vec2(-0.46, -0.12)) * vec2(1.0, 1.8)) / 0.11, 2.0))
                 + exp(-pow(length((p - vec2(0.46, -0.12)) * vec2(1.0, 1.8)) / 0.11, 2.0));
        col += uHue * bl * uBlush * 0.35;

        gl_FragColor = vec4(col * inside, inside);
      }
    `,
  });
  material.premultipliedAlpha = true;
  return { material, uniforms };
}
