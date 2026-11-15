import { apply, motionAllowed, setMotionOff } from './motion';

apply();

/* Header: solid after scrolling, hides on scroll down, returns on scroll up. */
const header = document.querySelector<HTMLElement>('[data-header]');
let lastY = window.scrollY;
const onScroll = () => {
  const y = window.scrollY;
  header?.classList.toggle('is-scrolled', y > 24);
  const menuOpen = header?.querySelector('[data-menu-btn]')?.getAttribute('aria-expanded') === 'true';
  if (!menuOpen) header?.classList.toggle('is-hidden', y > 400 && y > lastY + 4);
  if (y < lastY - 4) header?.classList.remove('is-hidden');
  lastY = y;
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* Mobile menu */
const menuBtn = document.querySelector<HTMLButtonElement>('[data-menu-btn]');
const menu = document.querySelector<HTMLElement>('[data-menu]');
const setMenu = (open: boolean) => {
  if (!menuBtn || !menu) return;
  menuBtn.setAttribute('aria-expanded', String(open));
  menu.hidden = !open;
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) menu.querySelector<HTMLElement>('a')?.focus();
};
menuBtn?.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menuBtn?.getAttribute('aria-expanded') === 'true') { setMenu(false); menuBtn.focus(); }
});

/* Motion toggle */
const toggle = document.querySelector<HTMLButtonElement>('[data-motion-toggle]');
const syncToggle = () => toggle?.setAttribute('aria-pressed', String(!motionAllowed()));
toggle?.addEventListener('click', () => { setMotionOff(motionAllowed()); syncToggle(); });
window.addEventListener('adai:motion', syncToggle);
syncToggle();

/* Scroll reveals */
const io = new IntersectionObserver((entries) => {
  for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

/* Smooth scrolling: only with a fine pointer and motion allowed. Native scrolling otherwise. */
type LenisLike = { destroy(): void; resize(): void };
let lenis: LenisLike | null = null;
async function syncLenis() {
  const want = motionAllowed() && matchMedia('(pointer: fine)').matches && !document.body.classList.contains('no-smooth');
  if (want && !lenis) {
    const { default: Lenis } = await import('lenis');
    lenis = new Lenis({ autoRaf: true, lerp: 0.12, wheelMultiplier: 0.95, anchors: { offset: -80 } }) as unknown as LenisLike;
    (window as unknown as { __lenis?: LenisLike }).__lenis = lenis;
  } else if (!want && lenis) {
    lenis.destroy(); lenis = null;
    (window as unknown as { __lenis?: LenisLike }).__lenis = undefined;
  }
}
syncLenis();
window.addEventListener('adai:motion', syncLenis);
