/**
 * Motion preference: the OS setting, or the on-page toggle (kept for this tab only in sessionStorage,
 * as disclosed on /privacy). Everything animated asks `motionAllowed()` and listens for `adai:motion`.
 */
const KEY = 'adai-motion-off';
const mq = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

function sessionOff(): boolean {
  try { return sessionStorage.getItem(KEY) === '1'; } catch { return false; }
}

export function motionAllowed(): boolean {
  return !(mq?.matches ?? false) && !sessionOff();
}

export function setMotionOff(off: boolean) {
  try { off ? sessionStorage.setItem(KEY, '1') : sessionStorage.removeItem(KEY); } catch { /* storage unavailable */ }
  apply();
}

export function apply() {
  const allowed = motionAllowed();
  document.documentElement.classList.toggle('motion-off', !allowed);
  window.dispatchEvent(new CustomEvent('adai:motion', { detail: { allowed } }));
}

mq?.addEventListener('change', apply);
