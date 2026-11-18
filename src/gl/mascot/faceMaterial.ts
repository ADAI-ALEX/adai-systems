/**
 * Auri's face: a glossy black display set into the head, with luminous eyes drawn as signed distance fields in
 * head-local units. Each eye is a weighted blend of six designed shapes (dot, ring, ∩ arc, ‿ line, crescent and
 * chevron) plus an angled lid cut, so every expression is a real eye design, transitions morph smoothly, and the
 * eyes stay razor sharp at any size (and still read when the glyph lens reduces them to a few cells).
 */
import * as THREE from 'three';
import { FACE } from './shapes';
import type { EyeState, ExpressionState } from './rig';

/** Eye home positions on the display (head units). */
export const EYE = { x: 0.31, y: 0.01, r: 0.165 };

export function createFaceMaterial() {
  const uniforms = {
    uLA: { value: new THREE.Vector4(1, 0, 0, 0) }, uLB: { value: new THREE.Vector4() }, uLC: { value: new THREE.Vector4(1, 1, 0, 0) },
    uRA: { value: new THREE.Vector4(1, 0, 0, 0) }, uRB: { value: new THREE.Vector4() }, uRC: { value: new THREE.Vector4(1, 1, 0, 0) },
    uGaze: { value: new THREE.Vector2() },
    uTalk: { value: 0 },
    uBlush: { value: 0 },
    uGlow: { value: 1 },
    uTime: { value: 0 },
    uHue: { value: new THREE.Color('#8f82ff') },
  };

  const f = (n: number) => n.toFixed(4);
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
      uniform vec4 uLA, uLB, uLC, uRA, uRB, uRC;
      uniform vec2 uGaze;
      uniform float uTalk, uBlush, uGlow, uTime;
      uniform vec3 uHue;

      float sdRoundBox(vec2 p, vec2 b, float r) {
        vec2 q = abs(p) - b + r;
        return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
      }
      float sdSegment(vec2 p, vec2 a, vec2 b) {
        vec2 pa = p - a, ba = b - a;
        return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
      }
      // arc of radius ra, half-aperture given by sc = (sin, cos), centred on +y, stroke half-width rb, round caps
      float sdArc(vec2 p, vec2 sc, float ra, float rb) {
        p.x = abs(p.x);
        return ((sc.y * p.x > sc.x * p.y) ? length(p - sc * ra) : abs(length(p) - ra)) - rb;
      }
      float sdEllipse(vec2 p, vec2 r) {
        // cheap, good-enough ellipse distance (scaled circle, corrected by the gradient length)
        float k0 = length(p / r), k1 = length(p / (r * r));
        return k0 * (k0 - 1.0) / max(k1, 1e-5);
      }

      float display(vec2 p) {
        return sdRoundBox(p - vec2(${f(FACE.cx)}, ${f(FACE.cy)}), vec2(${f(FACE.hw)}, ${f(FACE.hh)}), ${f(FACE.r)});
      }

      // A: (dot, ring, arc, line)  B: (moon, chevron, lidAngle, lidLevel)  C: (open, size, dx, dy)
      float eyeSdf(vec2 p, vec4 A, vec4 B, vec4 C, float side) {
        float R = ${f(EYE.r)} * C.y;
        vec2 q = p - vec2(C.z, C.w);
        float open = max(C.x, 0.07);
        vec2 s = vec2(q.x, q.y / open);
        float k = min(1.0, open);
        // the shape library
        float dDot  = sdEllipse(s, vec2(R * 0.66, R * 0.9));
        float dRing = abs(sdEllipse(s, vec2(R * 0.74, R * 0.98))) - R * 0.2;
        float dArc  = sdArc(s + vec2(0.0, R * 0.42), vec2(0.985, 0.17), R * 0.9, R * 0.21);   // ∩
        float dLine = sdArc(vec2(s.x, -s.y) + vec2(0.0, R * 0.95), vec2(0.8, 0.6), R * 1.15, R * 0.15 * (1.0 - 0.45 * smoothstep(0.0, R * 0.8, abs(s.x)))); // ‿
        float dMoon = max(length(s) - R * 0.92, -(length(s - vec2(-R * 0.36, R * 0.3)) - R * 0.8));
        // > for the left eye, < for the right: both point to the middle of the face
        float dChev = min(sdSegment(s, vec2(R * 0.55 * side, R * 0.62), vec2(-R * 0.5 * side, 0.0)),
                          sdSegment(s, vec2(-R * 0.5 * side, 0.0), vec2(R * 0.55 * side, -R * 0.62))) - R * 0.19;
        float w = A.x + A.y + A.z + A.w + B.x + B.y;
        float d = (A.x * dDot + A.y * dRing + A.z * dArc + A.w * dLine + B.x * dMoon + B.y * dChev) / max(w, 1e-4);
        d *= k;
        // upper-lid cut: positive angle lowers the inner corner (a determined, focused look)
        float a = -B.z * side;
        vec2 n = vec2(sin(a), cos(a));
        float lid = dot(q, n) - (1.0 - 2.0 * B.w) * R * 1.05;
        return max(d, lid);
      }

      void main() {
        vec2 p = vLocal.xy;
        float dv = display(p);
        float aa = fwidth(dv) * 1.2;
        float inside = 1.0 - smoothstep(-aa, aa, dv);
        if (inside < 0.002) discard;

        vec3 N = normalize(vNormalV);
        vec3 V = normalize(-vViewPos);
        float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);

        // --- glossy black glass: a deep blue-black, slightly lighter at the top
        vec3 col = mix(vec3(0.006, 0.006, 0.014), vec3(0.02, 0.021, 0.04), smoothstep(-0.5, 0.45, p.y - ${f(FACE.cy)}));
        // inner rim shadow: the glass sits below the plush lip
        col *= mix(0.35, 1.0, smoothstep(0.0, 0.09, -dv));
        // reflections: a broad soft window highlight at the upper left and a sharp key glint
        vec3 L = normalize(vec3(-0.45, 0.8, 0.55));
        float rl = max(dot(reflect(-L, N), V), 0.0);
        col += vec3(0.85, 0.86, 1.0) * (pow(rl, 40.0) * 0.32 + pow(rl, 8.0) * 0.05);
        col += fres * vec3(0.07, 0.07, 0.13);
        // a faint reflected rim of light just inside the top edge
        float topLip = smoothstep(0.1, 0.0, -dv) * smoothstep(0.0, 0.03, -dv) * smoothstep(-0.2, 0.3, p.y - ${f(FACE.cy)});
        col += vec3(0.25, 0.25, 0.4) * topLip * 0.25;

        // --- eyes
        vec2 gaze = uGaze * vec2(0.085, 0.06);
        float dL = eyeSdf(p - vec2(-${f(EYE.x)}, ${f(EYE.y + FACE.cy)}) - gaze, uLA, uLB, uLC, -1.0);
        float dR = eyeSdf(p - vec2(${f(EYE.x)}, ${f(EYE.y + FACE.cy)}) - gaze, uRA, uRB, uRC, 1.0);
        float d = min(dL, dR);
        float ea = max(fwidth(d) * 1.1, 1e-4);
        float eye = 1.0 - smoothstep(-ea, ea, d);
        vec3 eyeCore = mix(vec3(1.0, 0.99, 1.0), uHue, 0.06);
        vec3 eyeEdge = mix(vec3(1.0), uHue, 0.38);
        vec3 eyeCol = mix(eyeEdge, eyeCore, smoothstep(0.0, -0.035, d)) * (1.75 * uGlow);
        // the soft bloom of the eyes on the glass
        float halo = exp(-max(d, 0.0) * 30.0) * 0.32 + exp(-max(d, 0.0) * 9.0) * 0.045;
        col += uHue * halo * uGlow * (1.0 - eye);

        // --- talking: a small rounded mouth that opens and closes in syllables
        float syll = 0.5 + 0.5 * sin(uTime * 15.0) * (0.6 + 0.4 * sin(uTime * 4.3 + 1.0));
        float mh = mix(0.008, 0.06, syll) * uTalk;
        float mouth = sdRoundBox(p - vec2(gaze.x * 0.6, ${f(FACE.cy - 0.25)} + gaze.y * 0.5), vec2(0.075 + 0.015 * (1.0 - syll), mh + 0.016), 0.035 + mh * 0.5);
        float m = (1.0 - smoothstep(-ea, ea, mouth)) * smoothstep(0.02, 0.15, uTalk);
        col += uHue * exp(-max(mouth, 0.0) * 25.0) * 0.4 * uTalk * (1.0 - m);
        eye = max(eye, m);

        // --- blush: a faint warm glow under the eyes
        vec2 bp = vec2(abs(p.x) - 0.49, p.y - ${f(FACE.cy - 0.2)});
        col += mix(uHue, vec3(1.0, 0.45, 0.55), 0.6) * exp(-dot(bp * vec2(1.0, 1.9), bp * vec2(1.0, 1.9)) / 0.012) * uBlush * 0.09;

        col = mix(col, eyeCol, eye);
        gl_FragColor = vec4(col * inside, inside);
      }
    `,
  });
  material.premultipliedAlpha = true;
  return { material, uniforms };
}

export type FaceMaterial = ReturnType<typeof createFaceMaterial>;

function setEye(a: THREE.Vector4, b: THREE.Vector4, c: THREE.Vector4, e: EyeState, blink: number) {
  a.set(e.dot, e.ring, e.arc, e.line);
  b.set(e.moon, e.chevron, e.lidAngle, e.lidLevel);
  // a blink squashes open eyes; closed shapes (arcs, lines, chevrons) just dip a little
  const closedness = Math.min(1, e.arc + e.line + e.chevron);
  c.set(e.open * (1 - blink * 0.94 * (1 - closedness * 0.8)), e.size, e.dx, e.dy);
}

/** Writes an expression state (plus blink, gaze and hue) into the face uniforms. Shared by both rigs. */
export function applyFace(face: FaceMaterial, e: ExpressionState, blink: number, gaze: { x: number; y: number }, time: number, hue: THREE.Color, glow = 1) {
  const u = face.uniforms;
  setEye(u.uLA.value, u.uLB.value, u.uLC.value, e.eyeL, blink);
  setEye(u.uRA.value, u.uRB.value, u.uRC.value, e.eyeR, blink);
  u.uTalk.value = e.talk;
  u.uBlush.value = e.blush;
  u.uGaze.value.set(gaze.x, gaze.y);
  u.uTime.value = time;
  u.uGlow.value = glow;
  u.uHue.value.copy(hue);
}
