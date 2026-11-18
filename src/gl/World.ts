/**
 * The WebGL world: one renderer on one fixed canvas, one mascot, one glyph pipeline.
 *
 * Choreography is layout-driven. Each page section can contain an empty box marked
 * `data-mascot-anchor` with `data-pose`; Auri is framed into the most central visible box and glides to the
 * next one as the visitor scrolls, changing pose, expression, gesture and hue on arrival. This keeps the
 * story responsive for free (the boxes are ordinary CSS) and keeps scroll fully native: nothing hijacks it.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ProceduralMascot } from './mascot/ProceduralMascot';
import type { MascotRig } from './mascot/rig';
import { getPose, type Pose } from './mascot/poses';
import type { ExpressionName, GestureName, HueName } from './mascot/rig';
import { GlyphPipeline } from './passes/GlyphPipeline';
import { loadGlyphFont } from './passes/glyphAtlas';
import { motionAllowed } from '@/scripts/motion';
import { AURI_ACCENTS, DEFAULT_HUE } from './mascot/palette';

const HUES: Record<HueName, string> = AURI_ACCENTS;
const hueOf = (name: string | undefined) => new THREE.Color(HUES[(name as HueName)] ?? HUES[DEFAULT_HUE]);
const MASCOT_HEIGHT = 3.1; // rig units, from just under the hovering body (y ≈ -0.02) to the top of the antenna ball (y ≈ 3.07)
const MASCOT_CENTER_Y = 1.5;
/** Glyph lens radius = clamp(frame height / viewport height × SCALE, MIN, MAX), in viewport heights.
 *  Midway between the 0.24/0.06/0.165 lens and the 0.12/0.03/0.0825 one: 0.75 × the former, 1.5 × the
 *  latter, i.e. 0.5625 × the original (0.32, 0.08, 0.22). */
const LENS_SCALE = 0.18, LENS_MIN = 0.045, LENS_MAX = 0.12375;
/** Glyph cell edge in CSS pixels (rounded to whole device pixels by the pipeline). */
const cellCss = (w: number) => (w < 700 ? 8 : 9.5);
/** 3D scene resolution: the starting cap (as before) and the watchdog's lowest step. */
const SCENE_DPR_FINE = 1.5, SCENE_DPR_COARSE = 1.25, SCENE_DPR_FLOOR = 1;
/** Let the browser breathe between heavy start-up steps, so no single task blocks input for long. */
const yieldToMain = () => new Promise<void>((r) => setTimeout(r, 0));
const damp = (a: number, b: number, l: number, dt: number) => a + (b - a) * (1 - Math.exp(-l * dt));
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
const easeInBack = (x: number) => { const c = 1.70158; x = clamp(x, 0, 1); return (c + 1) * x * x * x - c * x * x; };
const easeOutBack = (x: number) => { const c = 1.9; x = clamp(x, 0, 1); return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

/**
 * Pick the mascot implementation from /mascot/manifest.json. An authored GLB is used when the manifest
 * says so and it loads; anything else falls back to the procedural Auri, so the site never breaks.
 */
async function loadMascot(coarse: boolean, manifestPromise?: Promise<MascotManifest | null>): Promise<MascotRig> {
  try {
    const manifest = await (manifestPromise ?? fetchMascotManifest());
    if (manifest?.renderer === 'gltf' && manifest.src) {
      const { GltfMascot } = await import('./mascot/GltfMascot');
      return await GltfMascot.load(manifest as Parameters<typeof GltfMascot.load>[0]);
    }
  } catch (err) {
    console.warn('[adai] authored mascot unavailable, using the procedural one', err);
  }
  return ProceduralMascot.create({ detail: coarse ? 0.6 : 0.85 });
}

type MascotManifest = { renderer?: string; src?: string } & Record<string, unknown>;
export const fetchMascotManifest = (): Promise<MascotManifest | null> =>
  fetch('/mascot/manifest.json', { cache: 'force-cache' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
/** Work started by the loader while the WebGL chunk downloads, so init never waits on the network. */
export interface Prefetch { manifest?: Promise<MascotManifest | null>; font?: Promise<unknown> }

export type MascotCommand = { pose?: string; expression?: ExpressionName; hold?: number; gesture?: GestureName; hue?: HueName };

interface Anchor { el: HTMLElement; pose: Pose; poseName: string; facing: 1 | -1; hue: HueName }

export class World {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(26, 1, 0.1, 60);
  private mascot!: MascotRig;
  private pipeline!: GlyphPipeline;
  private clock = { elapsedTime: 0, last: performance.now(), getDelta() { const n = performance.now(); const d = (n - this.last) / 1000; this.last = n; this.elapsedTime += d; return d; } };
  private rimLight = new THREE.PointLight('#8f82ff', 30, 14, 1.4);
  private key = new THREE.DirectionalLight('#fff6f0', 4.6);
  /** A cool violet light from behind, like the glow around Auri in the reference. */
  private backLight = new THREE.DirectionalLight('#6e5cff', 4.2);
  private anchors: Anchor[] = [];
  private active: Anchor | null = null;
  private frame = { cx: 0, cy: 0, h: 0, init: false };
  private pointer = { x: -1, y: -1, nx: 0, ny: 0, last: -100, speed: 0, inside: false, touched: false };
  private startleUntil = 0;
  private reactTarget: { x: number; y: number; until: number } | null = null;
  private hue = new THREE.Color(HUES[DEFAULT_HUE]);
  private poseGlyph = 0;
  private poseAura = 0.8;
  private sweep = { t: -1, start: 0 };
  private transition = { at: -10, teleport: false, jumped: true };
  private entranceAt = -1;
  private lastInput = performance.now() / 1000;
  private bounds = new THREE.Box3();
  private projected = new THREE.Vector3();
  private reveal = 0;
  private revealOrigin = new THREE.Vector2(-1, -1);
  private revealPulseUntil = -1;
  /** A touch gesture that started on Auri: it drives the lens instead of scrolling the page until it ends. */
  private drag: { id: number; el: HTMLElement } | null = null;
  /** ?glyphdebug paints any 3D pixel left uncovered at full glyph activation magenta (for tests). */
  private glyphDebug = new URLSearchParams(location.search).has('glyphdebug');
  private asleep = false;
  private wasNear = false;
  private hover = { over: false, nextCheck: 0, cooldown: 0 };
  private turn = 0;
  /** Canvas (glyph) pixel density: the screen's own, never lowered by the watchdog. */
  private outDpr = 1;
  /** Lowered from 3 to 2 only as a last resort (3D already at its floor and frames still slow). */
  private outDprCap = 3;
  /** 3D scene pixel density: starts at the cap, the watchdog may step it down to SCENE_DPR_FLOOR and back. */
  private sceneDpr = SCENE_DPR_FINE;
  private sceneDprCap = SCENE_DPR_FINE;
  private perf = { samples: [] as number[], holdUntil: 0, refresh: 1000 / 60, lastStep: null as null | { from: number; median: number } };
  private viewport = { w: 0, h: 0, dpr: 0 };
  /** True while no mascot area is in view and Auri has faded out: frames skip all GPU work. */
  private offscreen = false;
  private stats = { rendered: 0, skipped: 0 };
  private running = false;
  private dirty = true;
  private visible = 0;
  private raf = 0;
  private motion = motionAllowed();
  /** ?poster renders Auri alone on transparency, for the static fallback image. */
  private posterMode = new URLSearchParams(location.search).has('poster');
  /** ?lab: deterministic stepping for character sheets and visual tests (see `lab()`). */
  private labMode = new URLSearchParams(location.search).has('lab');
  private labLook: { x: number; y: number } | null = null;
  private raycaster = new THREE.Raycaster();
  private ro: ResizeObserver;
  private disposers: (() => void)[] = [];

  constructor(private stage: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance', premultipliedAlpha: true });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.setClearColor(0x000000, 0);
    stage.appendChild(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    this.renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.stop(); document.documentElement.classList.add('gl-fallback'); });
    this.ro = new ResizeObserver(() => this.resize());
  }

  async init(prefetch: Prefetch = {}) {
    const fontReady = prefetch.font ?? loadGlyphFont(); // the glyph atlas needs it; overlaps with the character build
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.scene.environmentIntensity = 0.38;
    performance.mark('adai:gl-environment');
    await yieldToMain();

    const key = this.key;
    key.position.set(-3.5, 5, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.radius = 6;
    key.shadow.bias = -0.0015;
    key.shadow.normalBias = 0.02;
    const sc = key.shadow.camera as THREE.OrthographicCamera;
    sc.left = -2.2; sc.right = 2.2; sc.top = 2.2; sc.bottom = -2.2; sc.near = 0.5; sc.far = 20;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    const fill = new THREE.HemisphereLight('#dcdcff', '#4a36a0', 0.42);
    this.rimLight.position.set(2.5, 3.2, -2.5);
    this.backLight.position.set(-5, 1.5, -3.5);
    this.scene.add(key, key.target, fill, this.rimLight, this.backLight);

    const coarse = matchMedia('(pointer: coarse)').matches;
    this.mascot = await loadMascot(coarse, prefetch.manifest);
    performance.mark('adai:gl-mascot');
    await yieldToMain();
    this.scene.add(this.mascot.object);
    // Stills (?poster) are exported with transparency: the faint additive light halos only look right over the
    // page, so they are left out of exported images.
    if (this.posterMode) this.mascot.object.traverse((o) => { if (o.name.endsWith('_halo')) o.visible = false; });
    this.camera.position.set(0, 0, 11);
    this.camera.lookAt(0, 0, 0);

    await fontReady;
    performance.mark('adai:gl-atlas');
    await yieldToMain();
    this.pipeline = new GlyphPipeline(this.renderer);
    this.sceneDprCap = coarse ? SCENE_DPR_COARSE : SCENE_DPR_FINE;
    this.sceneDpr = Math.min(window.devicePixelRatio || 1, this.sceneDprCap);

    this.collectAnchors();
    this.bindEvents();
    this.resize(); // also draws the glyph atlas at the screen's cell size
    this.ro.observe(document.documentElement);
    // Compile every shader (the character and both glyph passes) before the first visible frame, off the
    // main thread where the driver supports it, so the first frame is not one long blocking task.
    await yieldToMain();
    await Promise.all([this.renderer.compileAsync(this.scene, this.camera), this.pipeline.compile()]);
    performance.mark('adai:gl-compiled');
    this.update(0.016, true);
    performance.mark('adai:gl-first-frame');
    this.entranceAt = this.clock.elapsedTime;
    this.stage.classList.add('is-ready');
    document.documentElement.classList.add('gl-ready');
    this.start();
  }

  /* ---------------------------------------------------------------- anchors & story */
  collectAnchors() {
    this.anchors = [...document.querySelectorAll<HTMLElement>('[data-mascot-anchor]')].map((el) => {
      const poseName = el.dataset.pose || this.stage.dataset.pose || 'idle';
      const pose = getPose(poseName);
      return {
        el,
        poseName,
        pose,
        facing: (el.dataset.facing === '1' ? 1 : -1) as 1 | -1,
        hue: (el.dataset.hue as HueName) || pose.hue || (this.stage.dataset.hue as HueName) || DEFAULT_HUE,
      };
    });
  }

  private pickAnchor(): Anchor | null {
    const H = innerHeight;
    let best: Anchor | null = null;
    let bestScore = Infinity;
    for (const a of this.anchors) {
      const r = a.el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) continue; // hidden at this breakpoint
      const visible = Math.min(r.bottom, H) - Math.max(r.top, 0);
      if (visible < Math.min(r.height, H) * 0.18) continue;
      const score = Math.abs((r.top + r.bottom) / 2 - H * 0.5);
      if (score < bestScore) { bestScore = score; best = a; }
    }
    return best;
  }

  private applyPose(a: Anchor, first: boolean) {
    const p = a.pose;
    this.mascot.setBaseExpression(p.expression);
    this.mascot.setFacing(a.facing);
    this.mascot.setHue(hueOf(a.hue));
    this.poseGlyph = p.glyph ?? 0;
    this.poseAura = p.aura ?? 0.7;
    if (this.motion) {
      if (p.gesture) setTimeout(() => this.mascot.gesture(p.gesture!), first ? 900 : 350);
      if (!first) this.sweep = { t: 0, start: this.clock.elapsedTime };
    }
    this.dirty = true;
  }

  command(cmd: MascotCommand) {
    if (cmd.pose) {
      const pose = getPose(cmd.pose);
      this.mascot.setBaseExpression(pose.expression);
      if (pose.gesture && this.motion) this.mascot.gesture(pose.gesture);
      if (pose.hue) this.mascot.setHue(hueOf(pose.hue));
    }
    if (cmd.expression) this.mascot.setExpression(cmd.expression, cmd.hold ?? 1.4);
    if (cmd.gesture && this.motion) this.mascot.gesture(cmd.gesture);
    if (cmd.hue) this.mascot.setHue(hueOf(cmd.hue));
    this.dirty = true;
  }

  /* ---------------------------------------------------------------- events */
  private bindEvents() {
    const on = <K extends keyof WindowEventMap>(t: K, f: (e: WindowEventMap[K]) => void, o?: AddEventListenerOptions) => {
      window.addEventListener(t, f as EventListener, o);
      this.disposers.push(() => window.removeEventListener(t, f as EventListener, o));
    };
    on('pointermove', (e) => {
      const now = performance.now() / 1000;
      const dx = e.clientX - this.pointer.x, dy = e.clientY - this.pointer.y;
      const dt = Math.max(now - this.pointer.last, 1 / 240);
      if (this.pointer.x >= 0) this.pointer.speed = Math.hypot(dx, dy) / dt / innerWidth;
      this.pointer.x = e.clientX; this.pointer.y = e.clientY; this.pointer.last = now;
      this.pointer.touched = e.pointerType !== 'mouse';
      this.wake();
      const near = this.isNearMascot(e.clientX, e.clientY, 1.4);
      if (near && !this.wasNear && this.pointer.speed < 4.5) this.mascot.react('notice');
      this.wasNear = near;
      // Resting the cursor on Auri itself earns a brief happy look, at most once every 9 s (hit test throttled).
      if (near && e.pointerType === 'mouse' && now > this.hover.nextCheck) {
        this.hover.nextCheck = now + 0.12;
        const over = this.pointer.speed < 1.5 && this.hitTest(e.clientX, e.clientY);
        if (over && !this.hover.over && now > this.hover.cooldown) { this.mascot.react('hover'); this.hover.cooldown = now + 9; }
        this.hover.over = over;
      } else if (!near) this.hover.over = false;
      // A fast swipe near Auri startles it once, not on every pointer event of the swipe.
      if (this.pointer.speed > 4.5 && now > this.startleUntil && this.isNearMascot(e.clientX, e.clientY, 1.6)) {
        this.mascot.react('startle');
        this.startleUntil = now + 1.2;
      }
      this.dirty = true;
    }, { passive: true });
    on('pointerdown', (e) => {
      const t = e.target as HTMLElement;
      if (t.closest('a, button, input, textarea, select, label, summary, [role="button"]')) return;
      if (this.hitTest(e.clientX, e.clientY)) {
        this.mascot.react('poke');
        if (e.pointerType !== 'mouse') {
          this.pointer.x = e.clientX; this.pointer.y = e.clientY; this.revealPulseUntil = this.clock.elapsedTime + 1.6;
          // A finger that lands on Auri keeps driving the lens wherever it moves, until it lifts.
          const anchor = t.closest<HTMLElement>('[data-mascot-anchor]');
          if (anchor && this.canDrag()) {
            this.drag = { id: e.pointerId, el: anchor };
            try { anchor.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
          }
        }
        this.dirty = true;
      }
    }, { passive: true });
    const release = (e: PointerEvent) => this.endDrag(e.pointerId);
    on('pointerup', release, { passive: true });
    on('pointercancel', release, { passive: true });
    // Touch scrolling is decided when the finger lands, so it is cancelled there, and only for a touch that
    // starts on Auri's rendered silhouette inside a mascot area. Everywhere else (and on the empty parts of a
    // mascot area) the page scrolls exactly as before. The listener is non-passive only on the mascot areas.
    document.querySelectorAll<HTMLElement>('[data-mascot-anchor]').forEach((el) => {
      const touchStart = (e: TouchEvent) => {
        if (e.touches.length !== 1 || !e.cancelable || !this.canDrag()) return;
        const p = e.touches[0];
        if (this.hitTest(p.clientX, p.clientY)) e.preventDefault();
      };
      const lost = (e: PointerEvent) => this.endDrag(e.pointerId);
      el.addEventListener('touchstart', touchStart, { passive: false });
      el.addEventListener('lostpointercapture', lost);
      this.disposers.push(() => { el.removeEventListener('touchstart', touchStart); el.removeEventListener('lostpointercapture', lost); });
    });
    on('scroll', () => { this.dirty = true; this.wake(); }, { passive: true });
    on('keydown', () => this.wake());
    on('adai:motion', (e) => { this.motion = e.detail.allowed; this.dirty = true; if (this.motion) this.start(); });
    on('adai:mascot', (e) => this.command(e.detail));
    const vis = () => { if (document.hidden) this.stop(); else this.start(); };
    // Moved to a screen with another pixel ratio (or zoomed): redraw the canvas and glyph atlas to match,
    // then watch for the next change from the new ratio.
    const watchDpr = () => {
      const media = matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
      const change = () => { this.resize(); watchDpr(); };
      media.addEventListener('change', change, { once: true });
      this.disposers.push(() => media.removeEventListener('change', change));
    };
    watchDpr();
    document.addEventListener('visibilitychange', vis);
    this.disposers.push(() => document.removeEventListener('visibilitychange', vis));
    // Calls to action make Auri look and light up.
    document.querySelectorAll<HTMLElement>('[data-mascot-react]').forEach((el) => {
      const enter = () => {
        const r = el.getBoundingClientRect();
        this.reactTarget = { x: r.left + r.width / 2, y: r.top + r.height / 2, until: performance.now() / 1000 + 1.6 };
        this.mascot.setExpression((el.dataset.mascotReact as ExpressionName) || 'excited', 1.4);
        this.dirty = true;
      };
      el.addEventListener('pointerenter', enter);
      el.addEventListener('focus', enter);
    });
  }

  /** Finger interaction with Auri only exists while the lens is animated (not with reduced motion). */
  private canDrag() { return this.motion && !this.posterMode; }

  /** Ends a touch drag (lift, cancel or lost capture); the lens lingers briefly, then closes. */
  private endDrag(id: number) {
    if (!this.drag || this.drag.id !== id) return;
    const { el } = this.drag;
    this.drag = null;
    try { if (el.hasPointerCapture(id)) el.releasePointerCapture(id); } catch { /* already released */ }
    this.revealPulseUntil = Math.max(this.revealPulseUntil, this.clock.elapsedTime + 0.35);
    this.dirty = true;
  }

  /** Any input wakes Auri up; a long quiet spell makes Auri doze off (motion permitting). */
  private wake() {
    this.lastInput = performance.now() / 1000;
    if (this.asleep) {
      this.asleep = false;
      if (this.active) this.mascot.setBaseExpression(this.active.pose.expression);
      this.mascot.react('startle');
    }
  }

  private checkSleep() {
    if (!this.motion || this.asleep || this.posterMode || this.labMode) return;
    if (performance.now() / 1000 - this.lastInput > 28) {
      this.asleep = true;
      this.mascot.setBaseExpression('sleepy');
    }
  }

  private screenOfHead() {
    const s = this.frame.h / MASCOT_HEIGHT;
    return { x: this.frame.cx, y: this.frame.cy - (this.mascot.headCenter.y - MASCOT_CENTER_Y) * s };
  }

  private isNearMascot(x: number, y: number, k: number) {
    const head = this.screenOfHead();
    return Math.hypot(x - head.x, y - head.y) < this.frame.h * 0.4 * k;
  }

  private hitTest(x: number, y: number) {
    const ndc = new THREE.Vector2((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    return this.raycaster.intersectObjects(this.mascot.pickables, false).length > 0;
  }

  /* ---------------------------------------------------------------- frame */
  /**
   * Glyphs are drawn at the screen's pixel density (up to 3×, or 2× on very large canvases), so the
   * canvas maps 1:1 to device pixels and nothing is stretched. The 3D scene keeps its own, lower density.
   */
  resize() {
    const w = innerWidth, h = innerHeight, native = window.devicePixelRatio || 1;
    if (w === this.viewport.w && h === this.viewport.h && native === this.viewport.dpr) return; // nothing changed
    this.viewport = { w, h, dpr: native };
    this.outDpr = Math.min(native <= 2 ? native : w * h * native * native <= 6e6 ? Math.min(native, 3) : 2, Math.max(2, this.outDprCap));
    this.sceneDpr = Math.min(this.sceneDpr, native, this.sceneDprCap);
    this.renderer.setPixelRatio(this.outDpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.pipeline.setSize(w, h, this.outDpr, this.sceneDpr, cellCss(w));
    this.holdPerformance();
    this.dirty = true;
  }

  private setSceneDpr(dpr: number) {
    this.sceneDpr = dpr;
    this.pipeline.setSceneDpr(dpr);
    this.holdPerformance();
    this.dirty = true;
  }

  /** Returns false when the frame skipped all rendering (Auri is out of view). */
  private update(dt: number, force = false): boolean {
    const W = innerWidth, H = innerHeight;
    const now = this.clock.elapsedTime;
    const anchor = this.pickAnchor();
    if (anchor !== this.active) {
      const first = !this.active;
      // Coming back after being out of view (e.g. a fast scroll to a lower section): appear in place at
      // the new spot straight away instead of gliding in from wherever Auri was last seen.
      if (anchor && !this.active && this.visible < 0.05) this.frame.init = false;
      if (anchor && this.active && this.motion) {
        // Long jumps pop out and back in at the new spot (never sweep across text); short hops glide.
        const r = anchor.el.getBoundingClientRect();
        const dist = Math.hypot((r.left + r.right) / 2 - this.frame.cx, (r.top + r.bottom) / 2 - this.frame.cy);
        this.transition = { at: now, teleport: dist > H * 0.32, jumped: false };
      }
      this.active = anchor;
      if (anchor) this.applyPose(anchor, first);
    }
    this.visible = damp(this.visible, anchor ? 1 : 0, this.motion ? 5 : 1000, dt);
    const opacity = this.visible < 0.02 ? '0' : this.visible.toFixed(3); // below 2 % Auri is invisible anyway
    if (this.stage.style.opacity !== opacity) this.stage.style.opacity = opacity;
    // No mascot area in view and Auri has faded out: skip the character, shadow and glyph passes entirely.
    // Anchors are still checked every frame from live layout, so Auri reappears on the very next frame.
    this.offscreen = !anchor && opacity === '0' && !force;
    if (this.offscreen) { this.stats.skipped++; this.debugInfo(); return false; }
    this.stats.rendered++;

    // Frame target: Auri stays glued to its anchor box (CSS sticky boxes give the 'parked' effect).
    let pop = 1;
    if (anchor) {
      const r = anchor.el.getBoundingClientRect();
      const targetH = Math.min(r.height, r.width * 1.25, H * 0.86) * 0.97;
      const cy = (r.top + r.bottom) / 2;
      const cx = (r.left + r.right) / 2;
      const since = now - this.transition.at;
      const t = this.transition;
      if (!this.frame.init || force || !this.motion) {
        this.frame = { cx, cy, h: targetH, init: true };
      } else if (t.teleport && since < 0.62) {
        if (since < 0.2) pop = 1 - easeInBack(since / 0.2);
        else {
          if (!t.jumped) t.jumped = true;
          pop = easeOutBack((since - 0.2) / 0.42);
          this.frame.cx = cx; this.frame.cy = cy; this.frame.h = targetH;
        }
      } else {
        const lambda = since < 0.9 ? 6 : 24; // glide on arrival, then track the box closely
        this.frame.cx = damp(this.frame.cx, cx, lambda, dt);
        this.frame.cy = damp(this.frame.cy, cy, lambda, dt);
        this.frame.h = damp(this.frame.h, targetH, lambda * 0.8, dt);
      }
      this.turn = damp(this.turn, (anchor.pose.turn ?? 0) * -anchor.facing, this.motion ? 3 : 1000, dt);
    }

    // Place the rig so its visual centre lands on the frame centre.
    const visibleH = 2 * this.camera.position.z * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const wpp = visibleH / H;
    // Entrance: the first appearance settles in (slight rise and scale) while the canvas fades in.
    const ent = this.entranceAt < 0 || !this.motion ? 1 : clamp((now - this.entranceAt) / 0.9, 0, 1);
    const entEase = 1 - Math.pow(1 - ent, 3);
    pop *= 0.94 + 0.06 * entEase;
    const scale = ((this.frame.h * wpp) / MASCOT_HEIGHT) * Math.max(pop, 0.001);
    const obj = this.mascot.object;
    obj.scale.setScalar(scale);
    obj.position.set((this.frame.cx - W / 2) * wpp, (H / 2 - this.frame.cy) * wpp - MASCOT_CENTER_Y * scale - (1 - entEase) * 0.04 * this.frame.h * wpp, 0);
    obj.rotation.y = this.turn;
    const centre = new THREE.Vector3(obj.position.x, obj.position.y + MASCOT_CENTER_Y * scale, 0);
    this.key.target.position.copy(centre);
    this.key.position.copy(centre).add(new THREE.Vector3(-3.5, 5, 6).multiplyScalar(Math.max(scale, 0.2)));
    const sc = this.key.shadow.camera as THREE.OrthographicCamera;
    const ext = 1.8 * scale;
    if (Math.abs(sc.right - ext) > 1e-3) { sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.far = 40 * Math.max(scale, 0.2); sc.updateProjectionMatrix(); }

    // Look target: pointer, a call to action being hovered, or nothing (idle wander).
    const head = this.screenOfHead();
    const secs = performance.now() / 1000;
    let lx = 0, ly = 0, attention = 0;
    if (this.reactTarget && secs < this.reactTarget.until) {
      lx = (this.reactTarget.x - head.x) / (W * 0.35); ly = (head.y - this.reactTarget.y) / (H * 0.35); attention = 1;
    } else if (this.pointer.x >= 0) {
      lx = (this.pointer.x - head.x) / (W * 0.35); ly = (head.y - this.pointer.y) / (H * 0.4);
      attention = clamp(1 - (secs - this.pointer.last - 2.5) / 2, 0, 1);
    }
    const idle = anchor?.pose.idleLook;
    if (idle && attention < 1) { lx = lx * attention + idle.x * (1 - attention) * 0.6; ly = ly * attention + idle.y * (1 - attention) * 0.6; }
    if (this.labLook) { lx = this.labLook.x; ly = this.labLook.y; attention = 1; }
    this.checkSleep();
    this.mascot.update({ dt, time: now, look: { x: clamp(lx, -1, 1), y: clamp(ly, -1, 1) }, attention: Math.max(attention, idle ? 0.6 : 0), motion: this.motion });

    this.hue.copy(this.mascot.currentHue);
    this.rimLight.color.copy(this.hue);
    this.rimLight.position.x = 2.5 + clamp(lx, -1, 1) * -1.5;

    // Story sweep: a band of glyphs runs down Auri on arrival at a new pose.
    let sweep = -1;
    if (this.sweep.t >= 0) {
      const k = (now - this.sweep.start) / 0.9;
      if (k > 1) this.sweep.t = -1; else sweep = 1 - k * 1.3 + 0.15;
    }

    const reveal = this.updateReveal(dt, W, H);
    this.pipeline.render(this.scene, this.camera, {
      pointer: new THREE.Vector2(this.revealOrigin.x / W, 1 - this.revealOrigin.y / H),
      revealRadius: reveal.radius,
      debug: this.glyphDebug ? 1 : 0,
      glyphAmount: this.poseGlyph,
      aura: this.posterMode ? 0 : this.poseAura,
      sweep,
      hue: this.hue,
      mascotScreen: new THREE.Vector2(this.frame.cx / W, 1 - this.frame.cy / H),
      mascotRadius: (this.frame.h / H) * 0.5,
      shadow: this.posterMode ? 0 : 1,
      shadowScreen: new THREE.Vector2(this.frame.cx / W, 1 - (this.frame.cy + this.frame.h * 0.49) / H),
      time: now,
      motion: this.motion,
    });
    this.debugInfo();
    return true;
  }

  private mascotTopPx() {
    this.bounds.setFromObject(this.mascot.boundsTarget ?? this.mascot.object);
    const v = this.projected.set((this.bounds.min.x + this.bounds.max.x) / 2, this.bounds.max.y, (this.bounds.min.z + this.bounds.max.z) / 2).project(this.camera);
    return (-v.y * 0.5 + 0.5) * innerHeight;
  }

  /** Test hook (only with ?glyphdebug): rendering state, for the progressive-rendering and quality tests. */
  private debugInfo() {
    if (!this.glyphDebug) return;
    const p = this.pipeline, m = this.renderer.info.memory;
    (window as unknown as { __adaiRender: object }).__adaiRender = {
      outDpr: this.outDpr, sceneDpr: this.sceneDpr, cellPx: p.cellPx, cellCss: p.cellPx / this.outDpr, atlasCell: p.atlas?.cell ?? 0,
      canvas: [this.renderer.domElement.width, this.renderer.domElement.height], scene: [p.sceneRT.width, p.sceneRT.height],
      rendered: this.stats.rendered, skipped: this.stats.skipped, offscreen: this.offscreen, anchor: this.active?.poseName ?? null,
      geometries: m.geometries, textures: m.textures, programs: this.renderer.info.programs?.length ?? 0,
      // Auri's highest point on screen (CSS px) and how far above its resting frame that is, for the jump tests
      mascotTop: this.mascotTopPx(), frameTop: this.frame.cy - this.frame.h / 2,
      mascot: this.mascot.debugState?.() ?? null,
    };
  }

  /**
   * The glyph lens: a small circle that follows the cursor (or a finger dragging across Auri).
   * Inside it Auri is drawn as glyphs, outside it in 3D. It glides after the cursor and grows/shrinks
   * smoothly on enter/leave. Coverage inside the circle is exact (cell grid shared with the reduction pass,
   * silhouette-derived coverage, per-cell switching), so no 3D shows through within it.
   */
  private updateReveal(dt: number, W: number, H: number) {
    const px = this.pointer.x, py = this.pointer.y;
    const now = this.clock.elapsedTime;
    // Near = within reach of the head (original rule) or anywhere over Auri's projected bounds.
    let over = false;
    if (px >= 0) {
      this.bounds.setFromObject(this.mascot.boundsTarget ?? this.mascot.object);
      const b = this.bounds, v = this.projected;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (let i = 0; i < 8; i++) {
        v.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).project(this.camera);
        const sx = (v.x * 0.5 + 0.5) * W, sy = (-v.y * 0.5 + 0.5) * H;
        minX = Math.min(minX, sx); maxX = Math.max(maxX, sx); minY = Math.min(minY, sy); maxY = Math.max(maxY, sy);
      }
      over = px > minX && px < maxX && py > minY && py < maxY;
    }
    const near = px >= 0 && (this.drag !== null || ((this.isNearMascot(px, py, 1.25) || over) && !this.pointer.touched));
    const active = this.motion && !this.posterMode && (near || now < this.revealPulseUntil);
    this.reveal = clamp(this.reveal + (active ? dt / 0.22 : -dt / 0.3), 0, 1);
    if (px >= 0) {
      if (this.revealOrigin.x < 0) this.revealOrigin.set(px, py);
      this.revealOrigin.x = damp(this.revealOrigin.x, px, 18, dt);
      this.revealOrigin.y = damp(this.revealOrigin.y, py, 18, dt);
    }
    // Lens radius as a fraction of viewport height: 0.18 × frame, clamped to 0.045–0.12375.
    const base = clamp((this.frame.h / H) * LENS_SCALE, LENS_MIN, LENS_MAX);
    const e = 1 - Math.pow(1 - this.reveal, 3);
    const radius = this.reveal > 0 ? base * e : 0;
    // Test hook (only with ?glyphdebug): the live lens state, so tests can check size and touch behaviour.
    if (this.glyphDebug) (window as unknown as { __adaiLens: object }).__adaiLens = { radius, frame: this.frame.h / H, viewportH: H, dragging: this.drag !== null, x: this.revealOrigin.x, y: this.revealOrigin.y };
    return { radius };
  }

  private loop = () => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.loop);
    const raw = this.clock.getDelta();
    const dt = Math.min(raw, 1 / 30);
    if (!this.motion && !this.dirty) return; // reduced motion: render on demand only
    const wasOffscreen = this.offscreen;
    const rendered = this.update(dt);
    this.dirty = false;
    if (rendered && wasOffscreen) this.holdPerformance(); // back in view: measure afresh
    else if (rendered) this.trackPerformance(raw);
  };

  /** Ignore frame times for a moment (start, resize, a resolution step), so one-off hitches don't count. */
  private holdPerformance(ms = 2500) {
    this.perf.samples.length = 0;
    this.perf.holdUntil = Math.max(this.perf.holdUntil, performance.now() + ms);
  }

  /**
   * Frame-time watchdog. It only ever changes the 3D scene's resolution, never the glyphs, and it uses
   * medians over two-second windows, so a few slow frames (a scroll hitch, an image decode) don't count:
   *  - step down (0.25, not below 1×) only when most frames miss the display's refresh;
   *  - if a step down didn't make frames faster, the cost is elsewhere (another tab, the page): undo it
   *    and leave the resolution alone for 20 s;
   *  - step back up as soon as frames are smooth again;
   *  - last resort, for 3× phone screens only: if the 3D is already at its floor and frames are still slow,
   *    glyphs drop from 3× to 2× (still sharper than the 1.25× they used to get) for the rest of the visit.
   */
  private trackPerformance(rawDt: number) {
    const now = performance.now();
    if (!this.motion || now < this.perf.holdUntil) return;
    const s = this.perf.samples;
    s.push(rawDt * 1000);
    if (s.length < 120) return;
    const sorted = [...s].sort((a, b) => a - b);
    s.length = 0;
    const median = sorted[60];
    // the display's refresh interval: the fastest frames seen so far (never assumed slower than 60 Hz)
    this.perf.refresh = Math.min(this.perf.refresh, Math.max(sorted[6], 1000 / 240));
    const slow = median > Math.max(this.perf.refresh * 1.6, 20);
    const smooth = median < this.perf.refresh * 1.25;
    const step = this.perf.lastStep;
    this.perf.lastStep = null;
    if (step && !smooth && median > step.median * 0.85) {
      this.setSceneDpr(step.from);
      this.holdPerformance(20000);
    } else if (slow && this.sceneDpr > SCENE_DPR_FLOOR) {
      this.perf.lastStep = { from: this.sceneDpr, median };
      this.setSceneDpr(Math.max(SCENE_DPR_FLOOR, this.sceneDpr - 0.25));
    } else if (slow && this.outDpr > 2) {
      this.outDprCap = 2;
      this.viewport.dpr = 0; // force the resize
      this.resize();
    } else if (smooth && this.sceneDpr < Math.min(window.devicePixelRatio || 1, this.sceneDprCap)) {
      this.setSceneDpr(Math.min(this.sceneDprCap, this.sceneDpr + 0.25));
    }
  }

  start() {
    if (this.running || document.hidden) return;
    this.running = true;
    this.clock.getDelta();
    this.holdPerformance();
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /**
   * ?lab only: a deterministic stepping API for character sheets and visual tests. The render loop is paused
   * and time advances only through `step`, so a gesture can be captured at an exact moment.
   */
  lab() {
    if (!this.labMode) return null;
    const m = this.mascot as MascotRig & { lab?: boolean };
    m.lab = true;
    return {
      pause: () => { this.stop(); },
      resume: () => { this.start(); },
      step: (seconds: number) => {
        const n = Math.max(1, Math.round(seconds * 60));
        for (let i = 0; i < n; i++) { this.clock.elapsedTime += 1 / 60; this.update(1 / 60, true); }
      },
      set: (o: { expression?: ExpressionName; gesture?: GestureName; hue?: HueName; turn?: number; look?: { x: number; y: number } | null; facing?: 1 | -1 }) => {
        if (o.expression) { this.mascot.setBaseExpression(o.expression); this.mascot.setExpression(o.expression, 0); }
        if (o.facing) this.mascot.setFacing(o.facing);
        if (o.gesture) this.mascot.gesture(o.gesture);
        if (o.hue) this.mascot.setHue(hueOf(o.hue));
        if (o.turn !== undefined && this.active) this.active.pose = { ...this.active.pose, turn: o.turn };
        if (o.look !== undefined) this.labLook = o.look;
        this.pointer.x = -1; this.pointer.y = -1;
      },
    };
  }

  /** Exports the current mascot (geometry and node names, no shaders) as a binary glTF, base64-encoded. */
  async exportGlb(): Promise<string> {
    const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
    const clone = this.mascot.object.clone(true);
    clone.position.set(0, 0, 0); clone.rotation.set(0, 0, 0); clone.scale.setScalar(1);
    // Sprites (emotes, light halos) are effects, not geometry: glTF has no equivalent.
    const sprites: THREE.Object3D[] = [];
    clone.traverse((o) => { if ((o as THREE.Sprite).isSprite) sprites.push(o); });
    sprites.forEach((o) => o.removeFromParent());
    clone.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const src = m.material as THREE.MeshStandardMaterial;
      // Plain PBR stand-ins so the file opens cleanly in Blender; the real look is the web shader.
      m.material = new THREE.MeshStandardMaterial({ name: src.name || 'silicone', color: (src.color ?? new THREE.Color('#e4d9c6')).clone(), roughness: src.roughness ?? 0.5, emissive: (src.emissive ?? new THREE.Color(0)).clone() });
    });
    const buffer = (await new GLTFExporter().parseAsync(clone, { binary: true })) as ArrayBuffer;
    let bin = ''; const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }

  dispose() {
    this.stop();
    this.ro.disconnect();
    this.disposers.forEach((d) => d());
    this.mascot.dispose();
    this.pipeline.dispose();
    this.renderer.dispose();
  }
}
