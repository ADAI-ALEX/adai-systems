/**
 * Boots the WebGL world only when it can run well. The page is complete without it:
 * every heading, link and CTA is DOM, and the stage shows a poster when WebGL is unavailable.
 */
/** WebGL2 on real hardware only: software rasterisers (SwiftShader, llvmpipe) get the poster instead. */
function webgl2Available(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    if (!gl) return false;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer);
  } catch { return false; }
}

export function bootWhenReady() {
  const stage = document.querySelector<HTMLElement>('[data-gl-stage]');
  if (!stage) return;
  const params = new URLSearchParams(location.search);
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (params.has('nowebgl') || conn?.saveData || !webgl2Available()) {
    document.documentElement.classList.add('gl-fallback');
    return;
  }
  const start = () => import('@/gl/boot').then((m) => m.boot(stage)).catch((err) => {
    console.warn('[adai] WebGL failed, using the poster', err);
    document.documentElement.classList.add('gl-fallback');
  });
  // Let the page paint and become interactive first; the DOM headline is the LCP element.
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: object) => void }).requestIdleCallback;
  const go = () => (idle ? idle(start, { timeout: 2000 }) : setTimeout(start, 300));
  if (document.readyState === 'complete') go();
  else addEventListener('load', go, { once: true });
}
