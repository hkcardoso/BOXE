(() => {
  let controller;
  let sequence = 0;
  let transition;
  const main = () => document.getElementById('MainContent');
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const key = el => el.querySelector('a[href*="/products/"]')?.getAttribute('href')?.split('?')[0];
  const positions = root => new Map([...root.querySelectorAll('#product-grid > li, .boxeup-shelf-item:not([hidden])')].map(el => [key(el), el.getBoundingClientRect()]));
  function reveal(root, before = new Map()) {
    if (!root || reduced()) return;
    [...root.querySelectorAll('#product-grid > li, .boxeup-shelf-item:not([hidden])')].forEach((el, i) => {
      if (!el.animate) return;
      el.getAnimations().forEach(a => a.cancel());
      const old = before.get(key(el));
      const now = el.getBoundingClientRect();
      if (now.top > innerHeight + 100 || now.bottom < 0) return;
      const frames = old ? [{transform: `translate(${old.left-now.left}px, ${old.top-now.top}px)`}, {transform:'none'}] : [{opacity:0,transform:'translateY(18px) scale(.98)'},{opacity:1,transform:'none'}];
      el.animate(frames, {duration:380, delay:old ? 0 : Math.min(i,7)*35, easing:'cubic-bezier(.2,.75,.25,1)',fill:'backwards'});
    });
  }
  window.boxeupGridMotion = {positions, reveal};
  function setupShelves(root = document) {
    root.querySelectorAll('[data-boxeup-shelf]').forEach(shelf => {
      if (shelf.dataset.ready) return;
      shelf.dataset.ready = 'true';
      const filters = shelf.querySelector('.boxeup-shelf-filters');
      if (!filters) return;
      const cards = [...shelf.querySelectorAll('.boxeup-shelf-item')];
      const matches = (card, filter) => filter === 'all' || card.dataset.shelfTags.split(',').includes(filter);
      filters.hidden = false;
      filters.querySelectorAll('button').forEach(button => {button.hidden = !cards.some(card => matches(card,button.dataset.shelfFilter));});
      filters.addEventListener('click', event => {
        const button = event.target.closest('[data-shelf-filter]');
        if (!button) return;
        const before = positions(shelf);
        cards.forEach(card => {card.hidden = !matches(card, button.dataset.shelfFilter);});
        filters.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed',String(b === button)));
        reveal(shelf,before);
        const status = shelf.querySelector('[data-shelf-status]');
        status.textContent = `${cards.filter(c => !c.hidden).length} ${status.dataset.label}`;
      });
    });
  }
  setupShelves();
  document.addEventListener('shopify:section:load', e => setupShelves(e.target));
  async function navigate(url, push = true) {
    const target = new URL(url, location.href);
    const root = main();
    if (target.origin !== location.origin || !root) return;
    const preview = new URL(location.href).searchParams.get('preview_theme_id');
    if (preview) target.searchParams.set('preview_theme_id', preview);
    controller?.abort();
    transition?.skipTransition();
    controller = new AbortController();
    const current = ++sequence;
    if (typeof FacetFiltersForm !== 'undefined') FacetFiltersForm.requestVersion = (FacetFiltersForm.requestVersion || 0) + 1;
    root.setAttribute('aria-busy', 'true');
    const message = root.querySelector('.boxeup-catalog-message');
    if (message) message.textContent = message.dataset.loading;
    try {
      const response = await fetch(target.href, {signal:controller.signal});
      if (!response.ok) throw new Error('Request failed');
      const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
      const next = doc.querySelector('collection-component');
      const existing = root.querySelector('collection-component');
      if (!next?.querySelector('#ProductGridContainer') || !existing) throw new Error('Missing collection');
      if (current !== sequence) return;
      const before = positions(root);
      const scrollY = window.scrollY;
      const focused = document.activeElement;
      const focusId = focused?.id;
      const apply = () => {
        if (current !== sequence) return;
        if (push) {
          history.replaceState({...history.state, boxeupCatalog:true}, '', location.href);
          history.pushState({boxeupCatalog:true}, '', target.href);
        }
        existing.replaceWith(next);
        for (const selector of ['.collection-hero__title','.collection-hero__description','.boxeup-breadcrumb']) {
          const old = root.querySelector(selector);
          const fresh = doc.querySelector(selector);
          if (old && fresh) old.innerHTML = fresh.innerHTML;
        }
        root.querySelectorAll('[data-boxeup-catalog]').forEach(link => {
          const selected = new URL(link.href).pathname === target.pathname;
          if (selected) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');
        });
        document.title = doc.title;
        const canonical = document.querySelector('link[rel=canonical]');
        if (canonical) canonical.href = target.origin + target.pathname;
        if (typeof FacetFiltersForm !== 'undefined') {
          FacetFiltersForm.searchParamsInitial = target.search.slice(1);
          FacetFiltersForm.searchParamsPrev = target.search.slice(1);
          FacetFiltersForm.filterData = [];
        }
        root.querySelectorAll('.scroll-trigger').forEach(el => {
          // The fetched collection is inserted without a full page reload.
          // Reveal any tiles left offscreen by Dawn's scroll animation state.
          el.classList.remove('scroll-trigger--offscreen');
          el.classList.add('scroll-trigger--cancel');
        });
        window.scrollTo({top:scrollY,behavior:'instant'});
        if (focused?.isConnected) focused.focus({preventScroll:true});
        else if (focusId && document.getElementById(focusId)) document.getElementById(focusId).focus({preventScroll:true});
        else if (focused?.closest('.pagination')) {const grid = document.getElementById('ProductGridContainer');grid.tabIndex = -1;grid.focus({preventScroll:true});}
        if (message) message.textContent = message.dataset.loaded;
      };
      if (document.startViewTransition && !reduced()) {
        transition = document.startViewTransition(apply);
        await transition.updateCallbackDone;
        await transition.finished.catch(() => {});
      } else {
        apply();
        reveal(root,before);
      }
    } catch (error) {
      if (error.name === 'AbortError' || current !== sequence) return;
      if (message) message.textContent = message.dataset.error;
    } finally {
      if (current === sequence) root.removeAttribute('aria-busy');
    }
  }
  window.boxeupCancelNavigation = () => { controller?.abort(); transition?.skipTransition(); sequence++; main()?.removeAttribute('aria-busy'); };
  window.boxeupNavigate = navigate;
  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-boxeup-catalog], .pagination a');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !main()?.querySelector('#ProductGridContainer')) return;
    event.preventDefault();
    navigate(link.href);
  });
  window.addEventListener('popstate', event => {
    if (event.state?.boxeupCatalog && main()?.dataset.template === 'collection') navigate(location.href,false);
  });
})();
