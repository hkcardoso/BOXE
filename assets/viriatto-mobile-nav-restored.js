/* VIRIATTO | Touch navigation restored from BOXEUP mobile version. */
(() => {
  document.addEventListener('click', event => {
    const toggle = event.target.closest('[data-bx-nav-toggle]');
    if (!toggle) return;
    const parent = toggle.closest('.boxeup-nav-modalities');
    if (!parent) return;
    const expanded = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(expanded));
    parent.classList.toggle('bx-nav-expanded', expanded);
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const nav = event.target.closest('.bx-mobile-shared-nav');
    const expanded = nav?.querySelector('.bx-nav-expanded');
    if (!expanded) return;
    event.stopPropagation();
    const toggle = expanded.querySelector('[data-bx-nav-toggle]');
    toggle?.setAttribute('aria-expanded', 'false');
    expanded.classList.remove('bx-nav-expanded');
    toggle?.focus();
  }, true);
})();
