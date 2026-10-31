/* VIRIATTO mobile appearance preview; never blocks native drawer navigation. */
(() => {
  const KEY = 'viriatto-mobile-appearance';
  const root = document.documentElement;
  const read = () => {
    try { return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'; }
    catch (_) { return 'dark'; }
  };
  const apply = mode => {
    const isLight = mode === 'light';
    if (isLight) root.setAttribute('data-viri-mobile-theme', 'light');
    else root.removeAttribute('data-viri-mobile-theme');
    document.querySelectorAll('[data-viri-theme-toggle]').forEach(button => {
      button.setAttribute('aria-pressed', String(isLight));
      button.setAttribute('aria-label', isLight ? button.dataset.enableDark : button.dataset.enableLight);
      const label = button.querySelector('[data-viri-theme-label]');
      if (label) label.textContent = isLight ? button.dataset.labelDark : button.dataset.labelLight;
    });
  };
  const set = mode => {
    apply(mode);
    try { localStorage.setItem(KEY, mode); } catch (_) {}
  };
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-viri-theme-toggle]');
    if (!button) return;
    event.preventDefault();
    // Excluded from MenuDrawer's generic close-handler in global.js.
    set(root.getAttribute('data-viri-mobile-theme') === 'light' ? 'dark' : 'light');
  });
  const resetStaleDrawer = () => {
    // Safari back/forward cache can restore an open drawer and a locked body.
    const drawer = document.querySelector('header-drawer');
    const details = drawer?.querySelector('#Details-menu-drawer-container');
    if (details) {
      details.removeAttribute('open');
      details.classList.remove('menu-opening');
      details.querySelector('summary')?.setAttribute('aria-expanded', 'false');
      details.querySelectorAll('details[open]').forEach(el => el.removeAttribute('open'));
      document.querySelector('.section-header')?.classList.remove('menu-open');
      document.body.classList.remove('overflow-hidden-tablet','overflow-hidden-mobile');
      document.querySelector('.menu-drawer')?.classList.remove('country-selector-open');
    }
  };
  window.addEventListener('pageshow', event => {
    apply(read());
    if (event.persisted) resetStaleDrawer();
  });
  window.addEventListener('storage', event => {
    if (event.key === KEY) apply(read());
  });
  document.addEventListener('shopify:section:load', () => apply(read()));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => apply(read()), {once:true});
  else apply(read());
})();
