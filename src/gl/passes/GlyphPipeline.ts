/**
 * ADAI glyph pipeline (original technique, see research spec §5):
 *   1. the scene renders into an HDR target with alpha (transparent background);
 *   2. a reduction pass averages every glyph cell (4×4 taps) into a tiny grid texture, so glyph choice is
 *      stable instead of flickering on a single centre sample;
 *   3. the composite draws the clean render, swaps in typographic glyphs where the reveal mask is on
 *      (pointer lens, story sweeps, pose glyph amount), adds an ambient glyph aura in the section hue,
 *      a soft halo and a contact shadow, then tone maps to the screen.
 *
 * Two resolutions. The composite (and so every glyph) is drawn at the screen's own pixel density, on a
 * cell grid of whole device pixels with a pixel-exact glyph atlas, so glyphs are as sharp as the screen
 * allows. The 3D scene renders into its own target at `sceneDpr`, which may be lower and is the only
 * thing the frame-time watchdog in World.ts ever reduces. Both passes address cells in normalised screen
 * space, so the glyph grid stays locked to the 3D render underneath at any combination of the two.
 */
import * as THREE from 'three';
import { drawGlyphAtlas, type GlyphAtlas } from './glyphAtlas';

const fullscreenVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export interface GlyphParams {
  revealRadius: number;
  debug: number;
  glyphAmount: number;
  aura: number;
  sweep: number;
  hue: THREE.Color;
  mascotScreen: THREE.Vector2;
  mascotRadius: number;
  shadow: number;
  shadowScreen: THREE.Vector2;
  pointer: THREE.Vector2;
  time: number;
  motion: boolean;
}

export class GlyphPipeline {
  sceneRT: THREE.WebGLRenderTarget;
  cellRT: THREE.WebGLRenderTarget;
  /** Per-cell noise, computed once per cell instead of once per pixel (r: lens dither, g: aura field, b: glyph jitter). */
  noiseRT: THREE.WebGLRenderTarget;
  atlas: GlyphAtlas | null = null;
  private quad: THREE.Mesh;
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private reduceMat: THREE.ShaderMaterial;
  private noiseMat: THREE.ShaderMaterial;
  private compositeMat: THREE.ShaderMaterial;
  private grid = new THREE.Vector2(1, 1);
  /** Output (canvas) size in device pixels. */
  private size = new THREE.Vector2(1, 1);
  private css = new THREE.Vector2(1, 1);
  /** Glyph cell edge in output device pixels (a whole number). */
  cellPx = 12;
  outDpr = 1;
  sceneDpr = 1;

  constructor(private renderer: THREE.WebGLRenderer) {
    const opts = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, depthBuffer: true, samples: 0 } as const;
    this.sceneRT = new THREE.WebGLRenderTarget(1, 1, opts);
    this.cellRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, depthBuffer: false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    this.noiseRT = this.cellRT.clone();

    // The animated noise and the per-cell hash depend only on the cell and the time, so they are worked out
    // once per cell here (a ~14 000-texel pass) rather than for each of the ~360 pixels of a cell on a 2× screen.
    this.noiseMat = new THREE.ShaderMaterial({
      uniforms: { uGrid: { value: this.grid }, uTime: { value: 0 } },
      vertexShader: fullscreenVert,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform vec2 uGrid; uniform float uTime; varying vec2 vUv;
        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p) {
          vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
        }
        void main() {
          vec2 cellId = floor(vUv * uGrid);
          float n = noise(cellId * 0.18 + vec2(uTime * 0.25, -uTime * 0.15));
          float field = noise(cellId * 0.11 + vec2(0.0, uTime * 0.35)) * 0.75 + noise(cellId * 0.37 - uTime * 0.2) * 0.25;
          gl_FragColor = vec4(n, field, hash(cellId), 1.0);
        }
      `,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });

    // Reduction: one texel per glyph cell. Taps are placed on the composite's cell grid (output pixels)
    // and converted to normalised coordinates, so they land exactly where the composite draws the cell,
    // whatever the scene target's own resolution.
    // rgb = average colour of the covered taps (unpremultiplied), a = MAX coverage of the 16 taps, so a cell
    // that touches the silhouette anywhere counts as part of it (a one-cell silhouette dilation at most).
    this.reduceMat = new THREE.ShaderMaterial({
      uniforms: { tScene: { value: this.sceneRT.texture }, uGrid: { value: this.grid }, uRes: { value: this.size }, uCellPx: { value: 12 } },
      vertexShader: fullscreenVert,
      fragmentShader: /* glsl */ `
        uniform sampler2D tScene; uniform vec2 uGrid, uRes; uniform float uCellPx; varying vec2 vUv;
        void main() {
          vec2 cell = floor(vUv * uGrid);
          vec3 rgb = vec3(0.0); float sumA = 0.0; float maxA = 0.0;
          for (int y = 0; y < 4; y++) for (int x = 0; x < 4; x++) {
            vec2 px = (cell + (vec2(float(x), float(y)) + 0.5) / 4.0) * uCellPx;
            vec4 t = texture2D(tScene, min(px, uRes - 0.5) / uRes);
            rgb += t.rgb; sumA += t.a; maxA = max(maxA, t.a);
          }
          gl_FragColor = vec4(rgb / max(sumA, 1e-4), maxA);
        }
      `,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });

    this.compositeMat = new THREE.ShaderMaterial({
      uniforms: {
        tScene: { value: this.sceneRT.texture },
        tCells: { value: this.cellRT.texture },
        tNoise: { value: this.noiseRT.texture },
        tAtlas: { value: null },
        uCount: { value: 1 },
        uRes: { value: this.size },
        uGrid: { value: this.grid },
        uCellPx: { value: 12 },
        uPointer: { value: new THREE.Vector2(-10, -10) },
        uRevealRadius: { value: 0 },
        uDebug: { value: 0 },
        uGlyphAmount: { value: 0 },
        uAura: { value: 1 },
        uSweep: { value: -1 },
        uHue: { value: new THREE.Color() },
        uMascot: { value: new THREE.Vector2(0.7, 0.5) },
        uMascotRadius: { value: 0.3 },
        uShadowAmount: { value: 1 },
        uShadow: { value: new THREE.Vector2(0.7, 0.2) },
        uTime: { value: 0 },
      },
      vertexShader: fullscreenVert,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D tScene, tCells, tNoise, tAtlas;
        uniform float uShadowAmount, uCount, uCellPx, uRevealRadius, uDebug, uGlyphAmount, uAura, uSweep, uMascotRadius, uTime;
        uniform vec2 uRes, uGrid, uPointer, uMascot, uShadow;
        uniform vec3 uHue;

        // The atlas holds every glyph at exactly uCellPx × uCellPx texels: read the one texel under this pixel.
        float glyph(float index, vec2 pin) {
          int c = int(uCellPx);
          return texelFetch(tAtlas, ivec2(int(index) * c + int(pin.x), int(pin.y)), 0).r;
        }

        void main() {
          vec2 frag = gl_FragCoord.xy;
          vec2 uv = frag / uRes;
          float aspect = uRes.x / uRes.y;

          // Everything this pass draws (Auri, the aura ring, the halo, the contact shadow) lies within 2.4
          // mascot radii of Auri's centre (the halo is below 1/255 there); beyond that the output is fully
          // transparent, so skip the work.
          vec2 dm = (uv - uMascot) * vec2(aspect, 1.0);
          float r = length(dm) / max(uMascotRadius, 1e-3);
          if (r > 2.4) { gl_FragColor = vec4(0.0); return; }

          vec4 scene = texture2D(tScene, uv);
          vec2 cellId = floor(frag / uCellPx);
          vec2 pin = frag - cellId * uCellPx;                     // pixel position inside the cell
          vec2 cellCentre = (cellId + 0.5) * uCellPx / uRes;     // same grid as the reduction
          vec2 cellUv = (cellId + 0.5) / uGrid;
          vec4 cell = texture2D(tCells, cellUv);
          vec4 cn = texture2D(tNoise, cellUv);                    // per-cell noise (see noiseMat)
          vec4 col = vec4(0.0);
          // Where neither the 3D pixel nor its cell touches Auri, the glyph/3D mix below is exactly zero.
          if (scene.a > 0.0 || cell.a > 0.0) {
          float n = cn.r;

          // --- Lens mask, decided per cell (a cell is either glyph or 3D, never a blend of both).
          // A small circle that follows the cursor (the original interaction): full glyphs in its core,
          // a dithered cell-by-cell edge towards its rim, normal 3D outside it.
          float dist = length((cellCentre - uPointer) * vec2(aspect, 1.0));
          float lens = uRevealRadius > 1e-4 ? 1.0 - smoothstep(uRevealRadius * 0.45, uRevealRadius, dist) : 0.0;
          float sweepBand = uSweep < -0.5 ? 0.0 : 1.0 - smoothstep(0.0, 0.18, abs(cellCentre.y - uSweep));
          float m = clamp(lens + uGlyphAmount + sweepBand, 0.0, 1.5);
          float mask = step(0.5, smoothstep(0.42, 0.58, m * 0.92 + (n - 0.5) * 0.45));
          // Inside the lens core every cell must be glyphs: the debug view paints any 3D pixel there magenta.
          float core = step(dist, uRevealRadius * 0.4) * step(1e-4, uRevealRadius);

          // --- Glyphs, drawn wherever the rendered silhouette touches the cell (alpha-derived mask)
          vec3 cellCol = cell.rgb;
          float lum = dot(cellCol, vec3(0.2126, 0.7152, 0.0722));
          float level = clamp(pow(lum * 1.15, 0.75), 0.0, 1.0);
          float idx = floor(level * (uCount - 1.0) + (cn.b - 0.5) * 0.6 + 0.5);
          idx = clamp(idx, 1.0, uCount - 1.0);
          float cover = smoothstep(0.01, 0.25, cell.a);
          float g = glyph(idx, pin) * cover;
          vec3 gCol = mix(uHue, cellCol * 1.3 + uHue * 0.15, 0.55) * (0.8 + 0.9 * level);
          vec4 glyphOut = vec4(gCol * g, g);

          // Inside the mask the 3D pixels are replaced outright (no ghost, no coverage gate), so no
          // sliver of the model can show through, even where the taps missed thin geometry.
          col = mix(scene, glyphOut, mask);
          if (uDebug > 0.5 && scene.a > 0.02 && mask < 0.5 && core > 0.5) { gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0); return; }
          }

          // --- Ambient glyph aura in the section hue, only where the mascot is not
          // (a glyph needs auraLum >= 0.08, which the ring factor alone rules out further out)
          float ring = exp(-pow((r - 0.92) / 0.32, 2.0));
          if (ring * uAura >= 0.08) {
          float auraLum = smoothstep(0.35, 1.0, cn.g) * ring * uAura;
          float aIdx = clamp(floor(auraLum * 10.0) + 1.0, 1.0, 10.0);
          float ag = glyph(aIdx, pin) * step(0.08, auraLum);
          float auraA = ag * (0.18 + 0.3 * auraLum) * (1.0 - cell.a);
          col.rgb += uHue * auraA * (1.0 - col.a);
          col.a += auraA * (1.0 - col.a);
          }

          // --- Soft halo behind and contact shadow below
          float halo = exp(-pow(r / 1.35, 2.0)) * 0.14 * uAura;
          col.rgb += uHue * halo * (1.0 - col.a);
          col.a += halo * 0.6 * (1.0 - col.a);
          vec2 ds = (uv - uShadow) * vec2(aspect, 1.0) / vec2(uMascotRadius * 0.85, uMascotRadius * 0.16);
          float shadow = exp(-dot(ds, ds) * 1.6) * 0.55 * uShadowAmount;
          col.a += shadow * (1.0 - col.a);

          gl_FragColor = col;
          // tone map the HDR colour (premultiplied: unpremultiply, map, premultiply)
          vec3 c = gl_FragColor.rgb / max(gl_FragColor.a, 1e-4);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          gl_FragColor.rgb *= gl_FragColor.a;
        }
      `,
      // Every canvas pixel is written (transparent ones included), so no clear and no blending are needed:
      // the result is identical to blending over a cleared canvas.
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending,
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

  /**
   * Sizes both passes. `outDpr` is the canvas pixel density (glyphs); `sceneDpr` the 3D target's.
   * The glyph cell is rounded to whole device pixels, and the atlas is redrawn only when that changes.
   */
  setSize(cssW: number, cssH: number, outDpr: number, sceneDpr: number, cellCss: number) {
    this.css.set(cssW, cssH);
    this.outDpr = outDpr;
    const w = Math.max(1, Math.round(cssW * outDpr));
    const h = Math.max(1, Math.round(cssH * outDpr));
    this.size.set(w, h);
    this.cellPx = Math.max(6, Math.round(cellCss * outDpr));
    this.grid.set(Math.ceil(w / this.cellPx), Math.ceil(h / this.cellPx));
    this.cellRT.setSize(this.grid.x, this.grid.y);
    this.noiseRT.setSize(this.grid.x, this.grid.y);
    this.compositeMat.uniforms.uCellPx.value = this.cellPx;
    this.reduceMat.uniforms.uCellPx.value = this.cellPx;
    if (this.atlas?.cell !== this.cellPx) {
      this.atlas?.texture.dispose();
      this.atlas = drawGlyphAtlas(this.cellPx);
      this.compositeMat.uniforms.tAtlas.value = this.atlas.texture;
      this.compositeMat.uniforms.uCount.value = this.atlas.count;
    }
    this.setSceneDpr(sceneDpr);
  }

  /** Changes only the 3D target's resolution (the watchdog's lever); glyphs are unaffected. */
  setSceneDpr(sceneDpr: number) {
    this.sceneDpr = sceneDpr;
    this.sceneRT.setSize(Math.max(1, Math.round(this.css.x * sceneDpr)), Math.max(1, Math.round(this.css.y * sceneDpr)));
  }

  /** Compiles both passes' shaders off the main thread (where supported) before the first frame. */
  compile() {
    const r = this.renderer;
    const prev = r.getRenderTarget();
    r.setRenderTarget(this.cellRT); // the reduction's program depends on its target (linear, no tone mapping)
    const reduce = r.compileAsync(new THREE.Mesh(this.quad.geometry, this.reduceMat), this.camera);
    const noise = r.compileAsync(new THREE.Mesh(this.quad.geometry, this.noiseMat), this.camera);
    r.setRenderTarget(null);
    const composite = r.compileAsync(new THREE.Mesh(this.quad.geometry, this.compositeMat), this.camera);
    r.setRenderTarget(prev);
    return Promise.all([reduce, noise, composite]);
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

    this.noiseMat.uniforms.uTime.value = p.motion ? p.time : 0;
    this.quad.material = this.noiseMat;
    r.setRenderTarget(this.noiseRT);
    r.render(this.quad, this.camera);

    const u = this.compositeMat.uniforms;
    u.uPointer.value.copy(p.pointer);
    u.uRevealRadius.value = p.revealRadius;
    u.uDebug.value = p.debug;
    u.uGlyphAmount.value = p.glyphAmount;
    u.uAura.value = p.aura;
    u.uSweep.value = p.sweep;
    (u.uHue.value as THREE.Color).copy(p.hue);
    u.uMascot.value.copy(p.mascotScreen);
    u.uMascotRadius.value = p.mascotRadius;
    u.uShadowAmount.value = p.shadow;
    u.uShadow.value.copy(p.shadowScreen);
    this.quad.material = this.compositeMat;
    r.setRenderTarget(null);
    r.render(this.quad, this.camera);
  }

  dispose() {
    this.sceneRT.dispose();
    this.cellRT.dispose();
    this.noiseRT.dispose();
    this.noiseMat.dispose();
    this.atlas?.texture.dispose();
    this.reduceMat.dispose();
    this.compositeMat.dispose();
    (this.quad.geometry as THREE.BufferGeometry).dispose();
  }
}
