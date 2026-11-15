/**
 * ADAI glyph pipeline (original technique, see research spec §5):
 *   1. the scene renders into an HDR target with alpha (transparent background);
 *   2. a reduction pass averages every glyph cell (4×4 taps) into a tiny grid texture, so glyph choice is
 *      stable instead of flickering on a single centre sample;
 *   3. the composite draws the clean render, swaps in typographic glyphs where the reveal mask is on
 *      (pointer lens, story sweeps, pose glyph amount), adds an ambient glyph aura in the section hue,
 *      a soft halo and a contact shadow, then tone maps to the screen.
 */
import * as THREE from 'three';

const fullscreenVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export interface GlyphParams {
  cellCss: number;
  lensRadius: number;
  lensAmount: number;
  glyphAmount: number;
  aura: number;
  sweep: number;
  hue: THREE.Color;
  mascotScreen: THREE.Vector2;
  mascotRadius: number;
  shadowScreen: THREE.Vector2;
  pointer: THREE.Vector2;
  time: number;
  motion: boolean;
}

export class GlyphPipeline {
  sceneRT: THREE.WebGLRenderTarget;
  cellRT: THREE.WebGLRenderTarget;
  private quad: THREE.Mesh;
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private reduceMat: THREE.ShaderMaterial;
  private compositeMat: THREE.ShaderMaterial;
  private grid = new THREE.Vector2(1, 1);
  private size = new THREE.Vector2(1, 1);
  private cellPx = 12;

  constructor(private renderer: THREE.WebGLRenderer, atlas: { texture: THREE.Texture; count: number }) {
    const opts = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, depthBuffer: true, samples: 0 } as const;
    this.sceneRT = new THREE.WebGLRenderTarget(1, 1, opts);
    this.cellRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, depthBuffer: false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });

    this.reduceMat = new THREE.ShaderMaterial({
      uniforms: { tScene: { value: this.sceneRT.texture }, uGrid: { value: this.grid } },
      vertexShader: fullscreenVert,
      fragmentShader: /* glsl */ `
        uniform sampler2D tScene; uniform vec2 uGrid; varying vec2 vUv;
        void main() {
          vec2 cell = floor(vUv * uGrid);
          vec4 acc = vec4(0.0);
          for (int y = 0; y < 4; y++) for (int x = 0; x < 4; x++) {
            vec2 uv = (cell + (vec2(float(x), float(y)) + 0.5) / 4.0) / uGrid;
            acc += texture2D(tScene, uv);
          }
          gl_FragColor = acc / 16.0;
        }
      `,
      depthTest: false,
      depthWrite: false,
    });

    this.compositeMat = new THREE.ShaderMaterial({
      uniforms: {
        tScene: { value: this.sceneRT.texture },
        tCells: { value: this.cellRT.texture },
        tAtlas: { value: atlas.texture },
        uCount: { value: atlas.count },
        uRes: { value: this.size },
        uGrid: { value: this.grid },
        uCellPx: { value: 12 },
        uPointer: { value: new THREE.Vector2(-10, -10) },
        uLensRadius: { value: 0.16 },
        uLensAmount: { value: 1 },
        uGlyphAmount: { value: 0 },
        uAura: { value: 1 },
        uSweep: { value: -1 },
        uHue: { value: new THREE.Color() },
        uMascot: { value: new THREE.Vector2(0.7, 0.5) },
        uMascotRadius: { value: 0.3 },
        uShadow: { value: new THREE.Vector2(0.7, 0.2) },
        uTime: { value: 0 },
      },
      vertexShader: fullscreenVert,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D tScene, tCells, tAtlas;
        uniform float uCount, uCellPx, uLensRadius, uLensAmount, uGlyphAmount, uAura, uSweep, uMascotRadius, uTime;
        uniform vec2 uRes, uGrid, uPointer, uMascot, uShadow;
        uniform vec3 uHue;

        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p) {
          vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
        }
        float glyph(float index, vec2 local) {
          // sample with a 1px inset so neighbouring atlas cells never bleed
          vec2 l = clamp(local, 0.06, 0.94);
          return texture2D(tAtlas, vec2((index + l.x) / uCount, l.y)).r;
        }

        void main() {
          vec2 frag = gl_FragCoord.xy;
          vec2 uv = frag / uRes;
          float aspect = uRes.x / uRes.y;
          vec4 scene = texture2D(tScene, uv);

          vec2 cellId = floor(frag / uCellPx);
          vec2 local = fract(frag / uCellPx);
          vec2 cellUv = (cellId + 0.5) / uGrid;
          vec4 cell = texture2D(tCells, cellUv);
          float n = noise(cellId * 0.18 + vec2(uTime * 0.25, -uTime * 0.15));

          // --- Reveal mask (per cell, with a dithered edge so it dissolves cell by cell)
          vec2 dp = (cellUv - uPointer) * vec2(aspect, 1.0);
          float lens = (1.0 - smoothstep(uLensRadius * 0.45, uLensRadius, length(dp))) * uLensAmount;
          float sweepBand = uSweep < -0.5 ? 0.0 : 1.0 - smoothstep(0.0, 0.18, abs(cellUv.y - uSweep));
          float m = clamp(lens + uGlyphAmount + sweepBand, 0.0, 1.5);
          float mask = smoothstep(0.42, 0.58, m * 0.92 + (n - 0.5) * 0.45);

          // --- Glyphs for the mascot
          vec3 cellCol = cell.rgb / max(cell.a, 1e-3);
          float lum = dot(cellCol, vec3(0.2126, 0.7152, 0.0722));
          float level = clamp(pow(lum * 1.15, 0.75), 0.0, 1.0);
          float idx = floor(level * (uCount - 1.0) + (hash(cellId) - 0.5) * 0.6 + 0.5);
          idx = clamp(idx, 1.0, uCount - 1.0);
          float g = glyph(idx, local) * step(0.08, cell.a);
          vec3 gCol = mix(uHue, cellCol * 1.25 + uHue * 0.15, 0.55) * (0.65 + 0.75 * level);
          vec4 glyphOut = vec4(gCol * g, g) * cell.a;

          vec4 col = mix(scene, glyphOut, mask * step(0.02, cell.a));
          // a faint ghost of the solid form stays under the glyphs so the silhouette never breaks
          col += scene * mask * 0.12;

          // --- Ambient glyph aura in the section hue, only where the mascot is not
          vec2 dm = (uv - uMascot) * vec2(aspect, 1.0);
          float r = length(dm) / max(uMascotRadius, 1e-3);
          float field = noise(cellId * 0.11 + vec2(0.0, uTime * 0.35)) * 0.75 + noise(cellId * 0.37 - uTime * 0.2) * 0.25;
          float ring = exp(-pow((r - 0.92) / 0.32, 2.0));
          float auraLum = smoothstep(0.35, 1.0, field) * ring * uAura;
          float aIdx = clamp(floor(auraLum * 10.0) + 1.0, 1.0, 10.0);
          float ag = glyph(aIdx, local) * step(0.08, auraLum);
          float auraA = ag * (0.18 + 0.3 * auraLum) * (1.0 - cell.a);
          col.rgb += uHue * auraA * (1.0 - col.a);
          col.a += auraA * (1.0 - col.a);

          // --- Soft halo behind and contact shadow below
          float halo = exp(-pow(r / 1.35, 2.0)) * 0.14 * uAura;
          col.rgb += uHue * halo * (1.0 - col.a);
          col.a += halo * 0.6 * (1.0 - col.a);
          vec2 ds = (uv - uShadow) * vec2(aspect, 1.0) / vec2(uMascotRadius * 0.85, uMascotRadius * 0.16);
          float shadow = exp(-dot(ds, ds) * 1.6) * 0.55;
          col.a += shadow * (1.0 - col.a);

          gl_FragColor = col;
          // tone map the HDR colour (premultiplied: unpremultiply, map, premultiply)
          vec3 c = gl_FragColor.rgb / max(gl_FragColor.a, 1e-4);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          gl_FragColor.rgb *= gl_FragColor.a;
        }
      `,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      premultipliedAlpha: true,
      toneMapped: true,
    });
    // the includes operate on gl_FragColor.rgb; route our unpremultiplied colour through them
    this.compositeMat.fragmentShader = this.compositeMat.fragmentShader.replace(
      '#include <tonemapping_fragment>',
      'gl_FragColor.rgb = c;\n          #include <tonemapping_fragment>',
    );

    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.reduceMat);
    this.quad.frustumCulled = false;
  }

  setSize(cssW: number, cssH: number, dpr: number, cellCss: number) {
    const w = Math.max(1, Math.round(cssW * dpr));
    const h = Math.max(1, Math.round(cssH * dpr));
    this.size.set(w, h);
    this.sceneRT.setSize(w, h);
    this.cellPx = Math.max(6, cellCss * dpr);
    this.grid.set(Math.ceil(w / this.cellPx), Math.ceil(h / this.cellPx));
    this.cellRT.setSize(this.grid.x, this.grid.y);
    this.compositeMat.uniforms.uCellPx.value = this.cellPx;
  }

  render(scene: THREE.Scene, camera: THREE.Camera, p: GlyphParams) {
    const r = this.renderer;
    r.setRenderTarget(this.sceneRT);
    r.setClearColor(0x000000, 0);
    r.clear(true, true, false);
    r.render(scene, camera);

    this.quad.material = this.reduceMat;
    r.setRenderTarget(this.cellRT);
    r.render(this.quad, this.camera);

    const u = this.compositeMat.uniforms;
    u.uPointer.value.copy(p.pointer);
    u.uLensRadius.value = p.lensRadius;
    u.uLensAmount.value = p.lensAmount;
    u.uGlyphAmount.value = p.glyphAmount;
    u.uAura.value = p.aura;
    u.uSweep.value = p.sweep;
    (u.uHue.value as THREE.Color).copy(p.hue);
    u.uMascot.value.copy(p.mascotScreen);
    u.uMascotRadius.value = p.mascotRadius;
    u.uShadow.value.copy(p.shadowScreen);
    u.uTime.value = p.motion ? p.time : 0;
    this.quad.material = this.compositeMat;
    r.setRenderTarget(null);
    r.setClearColor(0x000000, 0);
    r.clear(true, false, false);
    r.render(this.quad, this.camera);
  }

  dispose() {
    this.sceneRT.dispose();
    this.cellRT.dispose();
    this.reduceMat.dispose();
    this.compositeMat.dispose();
    (this.quad.geometry as THREE.BufferGeometry).dispose();
  }
}
