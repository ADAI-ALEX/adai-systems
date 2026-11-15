/**
 * The ADAI glyph ramp, rendered at runtime into a one-row atlas from the self-hosted IBM Plex Mono
 * (SIL OFL). The densest glyph is the ADAI face mark itself, so a fully lit cell is the brand.
 */
import * as THREE from 'three';

export const GLYPH_RAMP = [' ', '·', '.', ':', '-', '~', '+', '=', '*', 'o', 'x', '%', '#', '@', 'MARK'];

const MARK_PATHS = [
  'M123.22,0A123.22,123.22,0,1,0,246.46,123.22,123.21,123.21,0,0,0,123.22,0Zm82.92,159.84a52.3,52.3,0,0,1-37.22,15.42h-45.6a37,37,0,0,0-26.14,10.81L77.51,205.74v-5.85a30.44,30.44,0,0,0-19.34-28.3A52.64,52.64,0,0,1,77.51,70h91.41a52.62,52.62,0,0,1,37.22,89.83Z',
  'M101.28,123.22A20.7,20.7,0,1,1,80.6,102.54,20.7,20.7,0,0,1,101.28,123.22Z',
  'M186.54,123.22a20.69,20.69,0,1,1-20.68-20.68A20.69,20.69,0,0,1,186.54,123.22Z',
];

export async function createGlyphAtlas(cell = 64) {
  const n = GLYPH_RAMP.length;
  const canvas = document.createElement('canvas');
  canvas.width = cell * n;
  canvas.height = cell;
  const ctx = canvas.getContext('2d')!;
  try { await document.fonts.load(`500 ${cell}px "IBM Plex Mono"`); } catch { /* falls back to monospace */ }
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `500 ${Math.round(cell * 0.86)}px "IBM Plex Mono", ui-monospace, monospace`;
  GLYPH_RAMP.forEach((g, i) => {
    const cx = i * cell + cell / 2;
    if (g === 'MARK') {
      ctx.save();
      const s = (cell * 0.78) / 246.46;
      ctx.translate(cx - (246.46 * s) / 2, cell / 2 - (246.46 * s) / 2);
      ctx.scale(s, s);
      MARK_PATHS.forEach((d) => ctx.fill(new Path2D(d)));
      ctx.restore();
    } else if (g !== ' ') {
      ctx.fillText(g, cx, cell / 2 + cell * 0.04);
    }
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return { texture: tex, count: n };
}
