/**
 * The WebGL world: one renderer on one fixed canvas, one mascot, one glyph pipeline.
 *
 * Choreography is layout-driven. Each page section can contain an empty box marked
 * `data-mascot-anchor` with `data-pose`; Adi is framed into the most central visible box and glides to the
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
import { createGlyphAtlas } from './passes/glyphAtlas';
import { motionAllowed } from '@/scripts/motion';

const HUES: Record<HueName, string> = { agents: '#f2b560', automation: '#5cd6c4', products: '#ff7d61', research: '#8db3ff', studio: '#f3e6cf' };
const MASCOT_HEIGHT = 2.55; // rig units, floor to sprout tip
const MASCOT_CENTER_Y = 1.25;
const damp = (a: number, b: number, l: number, dt: number) => a + (b - a) * (1 - Math.exp(-l * dt));
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
const easeInBack = (x: number) => { const c = 1.70158; x = clamp(x, 0, 1); return (c + 1) * x * x * x - c * x * x; };
const easeOutBack = (x: number) => { const c = 1.9; x = clamp(x, 0, 1); return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

/**
 * Pick the mascot implementation from /mascot/manifest.json. An authored GLB is used when the manifest
 * says so and it loads; anything else falls back to the procedural Adi, so the site never breaks.
 */
async function loadMascot(coarse: boolean): Promise<MascotRig> {
  try {
    const res = await fetch('/mascot/manifest.json', { cache: 'force-cache' });
    const manifest = res.ok ? await res.json() : null;
    if (manifest?.renderer === 'gltf' && manifest.src) {
      const { GltfMascot } = await import('./mascot/GltfMascot');
      return await GltfMascot.load(manifest);
    }
  } catch (err) {
    console.warn('[adai] authored mascot unavailable, using the procedural one', err);
  }
  return new ProceduralMascot({ detail: coarse ? 0.6 : 1 });
}

export type MascotCommand = { pose?: string; expression?: ExpressionName; hold?: number; gesture?: GestureName; hue?: HueName };

interface Anchor { el: HTMLElement; pose: Pose; poseName: string; facing: 1 | -1; hue: HueName }

export class World {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(26, 1, 0.1, 60);
  private mascot!: MascotRig;
  private pipeline!: GlyphPipeline;
  private clock = { elapsedTime: 0, last: performance.now(), getDelta() { const n = performance.now(); const d = (n - this.last) / 1000; this.last = n; this.elapsedTime += d; return d; } };
  private rimLight = new THREE.PointLight('#f3e6cf', 30, 14, 1.4);
  private key = new THREE.DirectionalLight('#fff1dd', 3.4);
  private anchors: Anchor[] = [];
  private active: Anchor | null = null;
  private frame = { cx: 0, cy: 0, h: 0, init: false };
  private pointer = { x: -1, y: -1, nx: 0, ny: 0, last: -100, speed: 0, inside: false, touched: false };
  private reactTarget: { x: number; y: number; until: number } | null = null;
  private hue = new THREE.Color(HUES.studio);
  private poseGlyph = 0;
  private poseAura = 0.8;
  private sweep = { t: -1, start: 0 };
  private transition = { at: -10, teleport: false, jumped: true };
  private turn = 0;
  private dpr = 1.5;
  private dprCap = 1.5;
  private frameTimes: number[] = [];
  private running = false;
  private dirty = true;
  private visible = 0;
  private raf = 0;
  private motion = motionAllowed();
  /** ?poster renders Adi alone on transparency, for the static fallback image. */
  private posterMode = new URLSearchParams(location.search).has('poster');
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

  async init() {
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.scene.environmentIntensity = 0.5;

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
    const fill = new THREE.HemisphereLight('#c9d6ff', '#2a1d14', 0.3);
    this.rimLight.position.set(2.5, 3.2, -2.5);
    this.scene.add(key, key.target, fill, this.rimLight);

    const coarse = matchMedia('(pointer: coarse)').matches;
    this.mascot = await loadMascot(coarse);
    this.scene.add(this.mascot.object);
    this.camera.position.set(0, 0, 11);
    this.camera.lookAt(0, 0, 0);

    const atlas = await createGlyphAtlas(64);
    this.pipeline = new GlyphPipeline(this.renderer, atlas);
    this.dprCap = coarse ? 1.25 : 1.5;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.dprCap);

    this.collectAnchors();
    this.bindEvents();
    this.resize();
    this.ro.observe(document.documentElement);
    // compile shaders before the first visible frame
    this.renderer.compile(this.scene, this.camera);
    this.update(0.016, true);
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
        hue: (el.dataset.hue as HueName) || pose.hue || (this.stage.dataset.hue as HueName) || 'studio',
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
    this.mascot.setHue(new THREE.Color(HUES[a.hue]));
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
      if (pose.hue) this.mascot.setHue(new THREE.Color(HUES[pose.hue]));
    }
    if (cmd.expression) this.mascot.setExpression(cmd.expression, cmd.hold ?? 1.4);
    if (cmd.gesture && this.motion) this.mascot.gesture(cmd.gesture);
    if (cmd.hue) this.mascot.setHue(new THREE.Color(HUES[cmd.hue]));
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
      if (this.pointer.speed > 4.5 && this.isNearMascot(e.clientX, e.clientY, 1.6)) this.mascot.react('startle');
      this.dirty = true;
    }, { passive: true });
    on('pointerdown', (e) => {
      const t = e.target as HTMLElement;
      if (t.closest('a, button, input, textarea, select, label, summary, [role="button"]')) return;
      if (this.hitTest(e.clientX, e.clientY)) { this.mascot.react('poke'); this.dirty = true; }
    }, { passive: true });
    on('scroll', () => { this.dirty = true; }, { passive: true });
    on('adai:motion', (e) => { this.motion = e.detail.allowed; this.dirty = true; if (this.motion) this.start(); });
    on('adai:mascot', (e) => this.command(e.detail));
    const vis = () => { if (document.hidden) this.stop(); else this.start(); };
    document.addEventListener('visibilitychange', vis);
    this.disposers.push(() => document.removeEventListener('visibilitychange', vis));
    // Calls to action make Adi look and light up.
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
  resize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    const cell = w < 700 ? 8 : 9.5;
    this.pipeline.setSize(w, h, this.dpr, cell);
    this.dirty = true;
  }

  private update(dt: number, force = false) {
    const W = innerWidth, H = innerHeight;
    const now = this.clock.elapsedTime;
    const anchor = this.pickAnchor();
    if (anchor !== this.active) {
      const first = !this.active;
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
    this.stage.style.opacity = this.visible.toFixed(3);

    // Frame target: Adi stays glued to its anchor box (CSS sticky boxes give the 'parked' effect).
    let pop = 1;
    if (anchor) {
      const r = anchor.el.getBoundingClientRect();
      const targetH = Math.min(r.height, r.width * 1.1, H * 0.74) * 0.86;
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
    const scale = ((this.frame.h * wpp) / MASCOT_HEIGHT) * Math.max(pop, 0.001);
    const obj = this.mascot.object;
    obj.scale.setScalar(scale);
    obj.position.set((this.frame.cx - W / 2) * wpp, (H / 2 - this.frame.cy) * wpp - MASCOT_CENTER_Y * scale, 0);
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
    this.mascot.update({ dt, time: now, look: { x: clamp(lx, -1, 1), y: clamp(ly, -1, 1) }, attention: Math.max(attention, idle ? 0.6 : 0), motion: this.motion });

    this.hue.copy(this.mascot.currentHue);
    this.rimLight.color.copy(this.hue);
    this.rimLight.position.x = 2.5 + clamp(lx, -1, 1) * -1.5;

    // Story sweep: a band of glyphs runs down Adi on arrival at a new pose.
    let sweep = -1;
    if (this.sweep.t >= 0) {
      const k = (now - this.sweep.start) / 0.9;
      if (k > 1) this.sweep.t = -1; else sweep = 1 - k * 1.3 + 0.15;
    }

    const near = this.pointer.x >= 0 && this.isNearMascot(this.pointer.x, this.pointer.y, 1.25) && !this.pointer.touched;
    this.pipeline.render(this.scene, this.camera, {
      cellCss: 9,
      pointer: new THREE.Vector2(this.pointer.x / W, 1 - this.pointer.y / H),
      lensRadius: clamp((this.frame.h / H) * 0.32, 0.08, 0.22),
      lensAmount: this.motion && near && !this.posterMode ? 1 : 0,
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
  }

  private loop = () => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 1 / 30);
    if (!this.motion && !this.dirty) return; // reduced motion: render on demand only
    const t0 = performance.now();
    this.update(dt);
    this.dirty = false;
    this.trackPerformance(performance.now() - t0, dt);
  };

  private trackPerformance(_cpuMs: number, dt: number) {
    if (!this.motion) return;
    this.frameTimes.push(dt * 1000);
    if (this.frameTimes.length < 90) return;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.frameTimes.length = 0;
    if (avg > 26 && this.dpr > 0.85) { this.dpr = Math.max(0.85, this.dpr - 0.25); this.resize(); }
    else if (avg < 17.5 && this.dpr < Math.min(window.devicePixelRatio, this.dprCap)) { this.dpr = Math.min(this.dprCap, this.dpr + 0.25); this.resize(); }
  }

  start() {
    if (this.running || document.hidden) return;
    this.running = true;
    this.clock.getDelta();
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** Exports the current mascot (geometry and node names, no shaders) as a binary glTF, base64-encoded. */
  async exportGlb(): Promise<string> {
    const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
    const clone = this.mascot.object.clone(true);
    clone.position.set(0, 0, 0); clone.rotation.set(0, 0, 0); clone.scale.setScalar(1);
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
