/* VIRIATTO mobile navigation: accessible, measured-height accordion.
   Keeps full links and follows Shopify's existing drawer open/close logic. */
(() => {
  if (window.__viriMobileNavMotion) return;
  window.__viriMobileNavMotion = true;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 989px)');
  const controls = new Map();

  const dropdownFor = button => document.getElementById(button.getAttribute('aria-controls'));
  const setExpanded = (button, expand) => {
    const panel = dropdownFor(button);
    const parent = button.closest('.boxeup-nav-modalities');
    if (!panel || !parent) return;

    if (expand) {
      parent.classList.add('bx-nav-expanded');
      button.setAttribute('aria-expanded', 'true');
      panel.removeAttribute('aria-hidden');
      panel.inert = false;
      panel.style.height = '0px';
      if (reduced.matches) {
        panel.style.height = 'auto';
      } else {
        requestAnimationFrame(() => {
          if (button.getAttribute('aria-expanded') === 'true') {
            panel.style.height = panel.scrollHeight + 'px';
          }
        });
      }
    } else {
      // Start from the rendered height, including panels previously set to auto.
      const height = panel.getBoundingClientRect().height;
      panel.style.height = height + 'px';
      panel.offsetHeight;
      parent.classList.remove('bx-nav-expanded');
      button.setAttribute('aria-expanded', 'false');
      panel.inert = true;
      panel.setAttribute('aria-hidden', 'true');
      if (reduced.matches) panel.style.height = '0px';
      else requestAnimationFrame(() => { panel.style.height = '0px'; });
    }
  };

  const initialize = () => {
    document.querySelectorAll('.bx-mobile-shared-nav').forEach(nav => {
      if (nav.dataset.viriNavMotionReady) return;
      nav.dataset.viriNavMotionReady = 'true';
      nav.querySelectorAll('[data-bx-nav-toggle]').forEach(button => {
        const panel = dropdownFor(button);
        if (!panel) return;
        panel.style.height = '0px';
        panel.inert = true;
        panel.setAttribute('aria-hidden', 'true');
        button.setAttribute('aria-expanded', 'false');
        controls.set(button, panel);
        panel.addEventListener('transitionend', event => {
          if (event.target !== panel || event.propertyName !== 'height') return;
          if (button.getAttribute('aria-expanded') === 'true') panel.style.height = 'auto';
        });
      });
      nav.classList.add('viri-nav-motion-ready');
    });
  };

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-bx-nav-toggle]');
    if (!button || !mobile.matches || !button.closest('.bx-mobile-shared-nav')) return;
    event.preventDefault();
    const opening = button.getAttribute('aria-expanded') !== 'true';
    if (opening) {
      // One submenu at a time keeps the mobile menu tidy.
      controls.forEach((_panel, other) => {
        if (other !== button && other.getAttribute('aria-expanded') === 'true') {
          setExpanded(other, false);
        }
      });
    }
    setExpanded(button, opening);
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const nav = event.target.closest('.bx-mobile-shared-nav');
    const button = Array.from(nav?.querySelectorAll('[data-bx-nav-toggle]') || [])
      .find(item => item.getAttribute('aria-expanded') === 'true');
    if (!button) return;
    event.stopPropagation();
    setExpanded(button, false);
    button.focus();
  }, true);

  const resetOnDrawerClose = () => {
    const details = document.getElementById('Details-menu-drawer-container');
    if (!details) return;
    new MutationObserver(() => {
      if (details.hasAttribute('open')) return;
      controls.forEach((panel, button) => {
        panel.style.height = '0px';
        panel.setAttribute('aria-hidden', 'true');
        panel.inert = true;
        button.setAttribute('aria-expanded', 'false');
        button.closest('.boxeup-nav-modalities')?.classList.remove('bx-nav-expanded');
      });
    }).observe(details, {attributes:true,attributeFilter:['open']});
  };

  const start = () => {
    initialize();
    resetOnDrawerClose();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
  document.addEventListener('shopify:section:load', initialize);
})();
