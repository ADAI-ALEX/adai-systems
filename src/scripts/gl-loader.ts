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
  // The WebGL chunk is already downloading: a build step adds a low-priority modulepreload for it at the
  // end of <body> on every page with a mascot (see astro.config.mjs). Import it straight after first paint, and
  // meanwhile fetch the two small things initialisation would otherwise wait on: the mascot manifest and
  // the glyph font (the atlas is drawn with it).
  performance.mark('adai:gl-start');
  let modulePromise: Promise<typeof import('@/gl/boot')> | null = null;
  const fetchModule = () => (modulePromise ??= import('@/gl/boot'));
  requestAnimationFrame(() => setTimeout(fetchModule, 0));
  const prefetch = {
    manifest: fetch('/mascot/manifest.json', { cache: 'force-cache' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    font: document.fonts.load('500 32px "IBM Plex Mono"').catch(() => null),
  };
  // Initialise once the page has loaded and the main thread is idle: the headline and the rest of the
  // page are on screen from the first paint, so nothing ever waits on WebGL.
  const start = () => fetchModule().then((m) => m.boot(stage, prefetch)).catch((err) => {
    console.warn('[adai] WebGL failed, using the poster', err);
    document.documentElement.classList.add('gl-fallback');
  });
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: object) => void }).requestIdleCallback;
  const go = () => (idle ? idle(start, { timeout: 500 }) : setTimeout(start, 50));
  if (document.readyState === 'complete') go();
  else addEventListener('load', go, { once: true });
}
