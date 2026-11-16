/**
 * The ADAI glyph ramp, rendered at runtime into a one-row atlas from the self-hosted IBM Plex Mono
 * (SIL OFL). The densest glyph is the ADAI face mark itself, so a fully lit cell is the brand.
 *
 * The atlas is drawn at the exact device-pixel size of a glyph cell on screen, and the composite reads it
 * texel for texel (texelFetch). Each glyph is therefore rasterised once by the browser's own text
 * renderer at its final size, with no resampling, instead of being shrunk from a large bitmap (which
 * aliased) and then stretched by the canvas scaling (which blurred). It is redrawn when the cell size
 * changes (window resize across the mobile breakpoint, or a different screen pixel ratio).
 */
import * as THREE from 'three';

export const GLYPH_RAMP = [' ', '·', '.', ':', '-', '~', '+', '=', '*', 'o', 'x', '%', '#', '@', 'MARK'];

const MARK_PATHS = [
  'M123.22,0A123.22,123.22,0,1,0,246.46,123.22,123.21,123.21,0,0,0,123.22,0Zm82.92,159.84a52.3,52.3,0,0,1-37.22,15.42h-45.6a37,37,0,0,0-26.14,10.81L77.51,205.74v-5.85a30.44,30.44,0,0,0-19.34-28.3A52.64,52.64,0,0,1,77.51,70h91.41a52.62,52.62,0,0,1,37.22,89.83Z',
  'M101.28,123.22A20.7,20.7,0,1,1,80.6,102.54,20.7,20.7,0,0,1,101.28,123.22Z',
  'M186.54,123.22a20.69,20.69,0,1,1-20.68-20.68A20.69,20.69,0,0,1,186.54,123.22Z',
];
const FONT = '"IBM Plex Mono", ui-monospace, monospace';

export interface GlyphAtlas { texture: THREE.CanvasTexture; count: number; cell: number }

/** Waits for the glyph font (the request is usually already in flight, see gl-loader.ts). */
export async function loadGlyphFont() {
  try { await document.fonts.load(`500 32px "IBM Plex Mono"`); } catch { /* falls back to monospace */ }
}

/** Draws the ramp with `cell` × `cell` device pixels per glyph (an integer). */
export function drawGlyphAtlas(cell: number): GlyphAtlas {
  const n = GLYPH_RAMP.length;
  const canvas = document.createElement('canvas');
  canvas.width = cell * n;
  canvas.height = cell;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Same proportions as before (glyph height ≈ 0.86 of the cell, mark ≈ 0.78 of it).
  ctx.font = `500 ${Math.max(6, Math.round(cell * 0.86))}px ${FONT}`;
  // On 1× screens a cell is only ~10 px: a hairline stroke keeps strokes and the mark's ring from greying out.
  const embolden = cell < 14 ? Math.min(0.6, cell * 0.045) : 0;
  ctx.strokeStyle = '#fff';
  ctx.lineJoin = 'round';
  GLYPH_RAMP.forEach((g, i) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(i * cell, 0, cell, cell); // every glyph stays inside its own cell: no bleeding into neighbours
    ctx.clip();
    const cx = i * cell + cell / 2;
    if (g === 'MARK') {
      const s = (cell * 0.78) / 246.46;
      ctx.translate(cx - (246.46 * s) / 2, cell / 2 - (246.46 * s) / 2);
      ctx.scale(s, s);
      MARK_PATHS.forEach((d) => ctx.fill(new Path2D(d)));
    } else if (g !== ' ') {
      ctx.fillText(g, cx, cell / 2 + cell * 0.04);
      if (embolden) { ctx.lineWidth = embolden; ctx.strokeText(g, cx, cell / 2 + cell * 0.04); }
    }
    ctx.restore();
    // Small cells: steepen the mark's anti-aliased edges, so its ring, bubble and eyes stay distinct.
    if (g === 'MARK' && embolden) {
      const img = ctx.getImageData(i * cell, 0, cell, cell), d = img.data;
      for (let k = 0; k < d.length; k += 4) {
        const t = Math.min(1, Math.max(0, (d[k] / 255 - 0.22) / 0.46));
        d[k] = d[k + 1] = d[k + 2] = Math.round(255 * t * t * (3 - 2 * t));
      }
      ctx.putImageData(img, i * cell, 0);
    }
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return { texture, count: n, cell };
}
