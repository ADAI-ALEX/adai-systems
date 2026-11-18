/**
 * Emotes: small luminous symbols that pop up beside Auri's head when an expression starts (a question mark for
 * curious, "!!" for surprised, rising dots for thinking, sparkles for proud, "z z" for sleepy...), following the
 * reference sheet. They are drawn once into a small canvas atlas with vector paths (no fonts, no downloads) and
 * shown on a handful of pooled sprites. They are restrained on purpose: a short pop, a gentle float, a fade.
 */
import * as THREE from 'three';
import type { EmoteName } from './rig';

type Symbol = 'question' | 'bang' | 'dot' | 'dash' | 'star' | 'bubble' | 'z';
const SYMBOLS: Symbol[] = ['question', 'bang', 'dot', 'dash', 'star', 'bubble', 'z'];
const CELL = 128;

function drawAtlas(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = CELL * SYMBOLS.length; c.height = CELL;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineCap = 'round'; g.lineJoin = 'round';
  SYMBOLS.forEach((s, i) => {
    g.save();
    g.translate(i * CELL + CELL / 2, CELL / 2);
    switch (s) {
      case 'question':
        g.lineWidth = 15;
        g.beginPath(); g.arc(0, -16, 22, Math.PI * 1.05, Math.PI * 2.25); g.quadraticCurveTo(2, 4, 0, 18); g.stroke();
        g.beginPath(); g.arc(0, 42, 9, 0, Math.PI * 2); g.fill();
        break;
      case 'bang':
        g.lineWidth = 16;
        g.beginPath(); g.moveTo(0, -42); g.lineTo(0, 14); g.stroke();
        g.beginPath(); g.arc(0, 40, 9.5, 0, Math.PI * 2); g.fill();
        break;
      case 'dot':
        g.beginPath(); g.arc(0, 0, 30, 0, Math.PI * 2); g.fill();
        break;
      case 'dash':
        g.lineWidth = 18; g.beginPath(); g.moveTo(0, -34); g.lineTo(0, 34); g.stroke();
        break;
      case 'star': {
        g.beginPath();
        for (let k = 0; k < 8; k++) { const r = k % 2 ? 11 : 50, a = (k / 8) * Math.PI * 2 - Math.PI / 2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        g.closePath(); g.fill();
        break;
      }
      case 'bubble': {
        const w = 52, h = 36, r = 24;
        g.beginPath();
        g.moveTo(-w + r, -h); g.lineTo(w - r, -h); g.quadraticCurveTo(w, -h, w, -h + r); g.lineTo(w, h - r); g.quadraticCurveTo(w, h, w - r, h);
        g.lineTo(-18, h); g.lineTo(-38, h + 20); g.lineTo(-34, h); g.lineTo(-w + r, h); g.quadraticCurveTo(-w, h, -w, h - r); g.lineTo(-w, -h + r); g.quadraticCurveTo(-w, -h, -w + r, -h);
        g.fill();
        g.globalCompositeOperation = 'destination-out';
        for (let k = -1; k <= 1; k++) { g.beginPath(); g.arc(k * 22, 0, 8, 0, Math.PI * 2); g.fill(); }
        break;
      }
      case 'z':
        g.lineWidth = 14;
        g.beginPath(); g.moveTo(-26, -28); g.lineTo(26, -28); g.lineTo(-26, 28); g.lineTo(26, 28); g.stroke();
        break;
    }
    g.restore();
  });
  return c;
}

interface Item { symbol: Symbol; x: number; y: number; size: number; delay: number; rot?: number; color?: 'hue' | 'gold'; float?: number; drift?: number }

/** Layouts, in head-relative units (x outward from the head side, y up from the head's top-right). */
const EMOTES: Record<Exclude<EmoteName, 'none'>, { items: Item[]; life: number; loop?: number }> = {
  sparks: { life: 1.8, items: [
    { symbol: 'dash', x: 0.06, y: 0.12, size: 0.13, delay: 0, rot: 0.9 },
    { symbol: 'dash', x: 0.2, y: 0.32, size: 0.13, delay: 0.05, rot: 0.35 },
    { symbol: 'dash', x: 0.0, y: -0.12, size: 0.12, delay: 0.1, rot: 1.45 },
  ] },
  question: { life: 2.4, items: [{ symbol: 'question', x: 0.12, y: 0.24, size: 0.36, delay: 0, rot: -0.12, float: 0.06 }] },
  bang: { life: 1.6, items: [
    { symbol: 'bang', x: 0.04, y: 0.26, size: 0.3, delay: 0, rot: -0.18 },
    { symbol: 'bang', x: 0.22, y: 0.2, size: 0.27, delay: 0.06, rot: 0.2 },
  ] },
  dots: { life: 2.6, loop: 3.6, items: [
    { symbol: 'dot', x: -0.02, y: 0.06, size: 0.07, delay: 0, float: 0.03 },
    { symbol: 'dot', x: 0.11, y: 0.2, size: 0.09, delay: 0.25, float: 0.03 },
    { symbol: 'dot', x: 0.27, y: 0.36, size: 0.12, delay: 0.5, float: 0.03 },
  ] },
  speech: { life: 2.6, loop: 4.5, items: [{ symbol: 'bubble', x: 0.16, y: 0.24, size: 0.34, delay: 0, float: 0.03 }] },
  burst: { life: 1.7, items: [
    { symbol: 'dash', x: -0.04, y: 0.3, size: 0.13, delay: 0, rot: 0.25, color: 'gold' },
    { symbol: 'dash', x: 0.2, y: 0.18, size: 0.13, delay: 0.04, rot: 1.0, color: 'gold' },
    { symbol: 'star', x: 0.26, y: -0.12, size: 0.12, delay: 0.08, color: 'gold' },
    { symbol: 'dash', x: -0.3, y: 0.38, size: 0.12, delay: 0.1, rot: -0.35, color: 'gold' },
  ] },
  sparkle: { life: 2.2, items: [
    { symbol: 'star', x: 0.12, y: 0.22, size: 0.2, delay: 0, color: 'gold', float: 0.02 },
    { symbol: 'star', x: 0.3, y: 0.0, size: 0.11, delay: 0.15, color: 'gold' },
  ] },
  zzz: { life: 3.2, loop: 3.4, items: [
    { symbol: 'z', x: 0.0, y: 0.08, size: 0.13, delay: 0, rot: -0.1, float: 0.18, drift: 0.05 },
    { symbol: 'z', x: 0.14, y: 0.24, size: 0.17, delay: 0.5, rot: 0.05, float: 0.18, drift: 0.05 },
    { symbol: 'z', x: 0.3, y: 0.42, size: 0.21, delay: 1.0, rot: -0.05, float: 0.18, drift: 0.05 },
  ] },
};

const POOL = 4;
const WHITE = new THREE.Color('#ffffff');
const GOLD = new THREE.Color('#ffd27a').multiplyScalar(1.5);

export class Emotes {
  readonly group = new THREE.Group();
  private texture: THREE.CanvasTexture;
  private sprites: THREE.Sprite[] = [];
  private current: EmoteName = 'none';
  private start = -10;
  private side = 1;
  private hueColor = new THREE.Color();

  constructor() {
    this.texture = new THREE.CanvasTexture(drawAtlas());
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 4;
    for (let i = 0; i < POOL; i++) {
      const map = this.texture.clone();
      map.repeat.set(1 / SYMBOLS.length, 1);
      const mat = new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, opacity: 0 });
      const s = new THREE.Sprite(mat);
      s.name = `emote_${i}`;
      // Kept visible at zero size and opacity so its shader is compiled with everything else at start-up.
      s.scale.setScalar(1e-4);
      s.renderOrder = 5;
      this.sprites.push(s);
      this.group.add(s);
    }
    this.group.name = 'emotes';
  }

  show(name: EmoteName, time: number, side: 1 | -1) {
    this.current = name;
    this.start = time;
    this.side = side;
  }

  clear() { this.current = 'none'; }

  /** `anchor` is the head's top corner in rig space, `hue` the accent. */
  update(time: number, anchor: THREE.Vector3, hue: THREE.Color, motion: boolean) {
    this.hueColor.copy(hue).lerp(WHITE, 0.25).multiplyScalar(1.6);
    // Reduced motion: no symbols at all (they would otherwise sit there, frozen, for as long as the mood lasts).
    const def = this.current === 'none' || !motion ? null : EMOTES[this.current];
    let t = time - this.start;
    if (def?.loop) t %= def.loop; // repeats while the expression lasts (loop >= life)
    for (let i = 0; i < this.sprites.length; i++) {
      const s = this.sprites[i];
      const mat = s.material as THREE.SpriteMaterial;
      const it = def?.items[i];
      // Hidden sprites draw nothing; the first stays in the scene (invisible, tiny) so the atlas is on the GPU from the start.
      s.visible = true;
      if (!def || !it) { mat.opacity = 0; s.scale.setScalar(1e-4); s.visible = i === 0; continue; }
      const lt = t - it.delay;
      const life = def.life - it.delay;
      if (lt < 0 || lt > life) { mat.opacity = 0; s.scale.setScalar(1e-4); s.visible = i === 0; continue; }
      // pop in with a little overshoot, hold, fade and shrink out
      const inK = Math.min(lt / 0.28, 1);
      const pop = inK < 1 ? 1 + Math.sin(inK * Math.PI) * 0.25 - (1 - inK) * (1 - inK) : 1;
      const outK = Math.min(Math.max((life - lt) / 0.45, 0), 1);
      const scale = it.size * Math.max(pop, 0.001) * (0.7 + 0.3 * outK);
      mat.opacity = Math.min(inK * 1.6, 1) * outK;
      mat.rotation = (it.rot ?? 0) * this.side * -1 + Math.sin(time * 2.2 + i) * 0.04;
      mat.color.copy(it.color === 'gold' ? GOLD : this.hueColor);
      mat.map!.offset.set(SYMBOLS.indexOf(it.symbol) / SYMBOLS.length, 0);
      const rise = (it.float ?? 0.02) * Math.min(lt / life, 1) * 2;
      s.scale.setScalar(scale);
      s.position.set(anchor.x + it.x * this.side + (it.drift ?? 0) * Math.sin(lt * 2.5) * this.side, anchor.y + it.y + rise, anchor.z + 0.1);
    }
  }

  dispose() {
    this.texture.dispose();
    for (const s of this.sprites) { (s.material as THREE.SpriteMaterial).map?.dispose(); s.material.dispose(); }
  }
}
