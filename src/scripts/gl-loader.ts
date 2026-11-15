/**
 * Boots the WebGL world only when it can run well. The page is complete without it:
 * every heading, link and CTA is DOM, and the stage shows a poster when WebGL is unavailable.
 */
function webgl2Available(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
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
  if (document.readyState === 'complete') idle ? idle(start, { timeout: 1200 }) : setTimeout(start, 200);
  else addEventListener('load', () => (idle ? idle(start, { timeout: 1200 }) : setTimeout(start, 200)), { once: true });
}
