/* Optional mobile appearance experiment: dark is the default. */
(() => {
  const key = 'viriatto-mobile-appearance';
  const root = document.documentElement;
  const read = () => {
    try { return localStorage.getItem(key) === 'light' ? 'light' : 'dark'; }
    catch (_) { return 'dark'; }
  };
  const apply = mode => {
    if (mode === 'light') root.setAttribute('data-viri-mobile-theme', 'light');
    else root.removeAttribute('data-viri-mobile-theme');
    document.querySelectorAll('[data-viri-theme-toggle]').forEach(button => {
      const light = mode === 'light';
      button.setAttribute('aria-pressed', String(light));
      button.setAttribute('aria-label',light ? button.dataset.enableDark : button.dataset.enableLight);
      const label = button.querySelector('[data-viri-theme-label]');
      if (label) label.textContent = light ? button.dataset.labelDark : button.dataset.labelLight;
    });
  };
  const set = mode => {
    apply(mode);
    try { localStorage.setItem(key, mode); } catch (_) {}
  };
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-viri-theme-toggle]');
    if (!button) return;
    set(root.getAttribute('data-viri-mobile-theme') === 'light' ? 'dark' : 'light');
  });
  window.addEventListener('storage', event => {
    if (event.key === key) apply(read());
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => apply(read()), {once:true});
  else apply(read());
})();
