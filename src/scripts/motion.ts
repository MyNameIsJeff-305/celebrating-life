/** Presentation only. Forms and analytics keep their normal page-load lifecycle. */
const root = document.documentElement;
const toggle = document.querySelector<HTMLButtonElement>('[data-motion-toggle]');
const label = toggle?.querySelector<HTMLElement>('[data-motion-label]');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const preferenceKey = 'celebrating-life-motion';
let savedPreference: string | null = null;
try { savedPreference = localStorage.getItem(preferenceKey); } catch { /* Storage can be blocked. */ }

function syncMotion() {
  const enabled = !reduced.matches && savedPreference !== 'off';
  root.dataset.motion = enabled ? 'on' : 'off';
  if (!toggle || !label) return;
  const text = reduced.matches ? toggle.dataset.reduced! : enabled ? toggle.dataset.pause! : toggle.dataset.resume!;
  label.textContent = text;
  toggle.setAttribute('aria-label', text);
  toggle.title = text;
  toggle.disabled = reduced.matches;
}
syncMotion();
if (toggle) toggle.hidden = false;
toggle?.addEventListener('click', () => {
  savedPreference = root.dataset.motion === 'on' ? 'off' : 'on';
  try { localStorage.setItem(preferenceKey, savedPreference); } catch { /* Keep the preference for this page. */ }
  syncMotion();
  scheduleProgress();
});
reduced.addEventListener('change', () => { syncMotion(); scheduleProgress(); });
function syncVisibility() { root.dataset.pageHidden = String(document.hidden); }
syncVisibility();
document.addEventListener('visibilitychange', syncVisibility);

// Never hide content to prepare an animation. Without JS/observer, it stays visible.
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      if (root.dataset.motion === 'on' && !entry.target.contains(document.activeElement)) {
        entry.target.classList.add('is-revealing');
        entry.target.addEventListener('animationend', () => entry.target.classList.remove('is-revealing'), { once: true });
      }
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.12 });
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach(element => {
    if (element.getBoundingClientRect().top >= window.innerHeight) observer.observe(element);
  });
}

const progress = document.querySelector<HTMLElement>('[data-scroll-progress]');
let scheduled = false;
function updateProgress() {
  scheduled = false;
  if (!progress) return;
  const distance = root.scrollHeight - window.innerHeight;
  const fraction = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
  progress.style.transform = `scaleX(${fraction})`;
}
function scheduleProgress() {
  if (scheduled || root.dataset.motion !== 'on') return;
  scheduled = true;
  requestAnimationFrame(updateProgress);
}
window.addEventListener('scroll', scheduleProgress, { passive: true });
window.addEventListener('resize', scheduleProgress);
window.addEventListener('load', scheduleProgress, { once: true });
updateProgress();
