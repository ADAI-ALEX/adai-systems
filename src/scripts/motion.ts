/**
 * Motion preference: follows the operating system's "reduce motion" setting. Everything animated asks
 * `motionAllowed()` and listens for `adai:motion`, so a change in system settings applies live.
 */
const mq = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

export function motionAllowed(): boolean {
  return !(mq?.matches ?? false);
}

export function apply() {
  const allowed = motionAllowed();
  document.documentElement.classList.toggle('motion-off', !allowed);
  window.dispatchEvent(new CustomEvent('adai:motion', { detail: { allowed } }));
}

mq?.addEventListener('change', apply);
