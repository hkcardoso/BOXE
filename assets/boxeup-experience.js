(() => {
  const root = document.getElementById('BxExperience');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = 'true';
  const parse = (node, fallback) => { try { return JSON.parse(node?.textContent || ''); } catch { return fallback; } };
  const labels = parse(root.querySelector('[data-bx-translations]'), {});
  const t = key => labels[key] || key;
  let products = [];
  let catalogueRequest;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const money = cents => new Intl.NumberFormat(root.dataset.locale || 'pt-PT', { style: 'currency', currency: root.dataset.currency || 'EUR' }).format(cents / 100);
  const price = item => (item.varies ? t('from') + ' ' : '') + money(item.price);
  const make = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const productLink = item => {
    const link = make('a', t('view'), 'bx-text-button');
    link.href = item.url;
    return link;
  };
  let lastOpener;
  function openDialog(id, opener) {
    const dialog = document.getElementById(id);
    if (!dialog || typeof dialog.showModal !== 'function') return;
    document.querySelectorAll('#BxExperience dialog[open]').forEach(node => node.close());
    lastOpener = opener;
    dialog.showModal();
    if (id === 'BxGuide') loadCatalogue().catch(() => {});
    document.documentElement.classList.add('bx-dialog-open');
  }
  root.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('close', () => {
      if (!root.querySelector('dialog[open]')) document.documentElement.classList.remove('bx-dialog-open');
      if (lastOpener?.isConnected) lastOpener.focus({ preventScroll: true });
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  });
  document.addEventListener('click', event => {
    const open = event.target.closest('[data-bx-open]');
    if (open) { event.preventDefault(); openDialog(open.dataset.bxOpen, open); return; }
    const close = event.target.closest('[data-bx-close]');
    if (close) { close.closest('dialog')?.close(); return; }

  });
  async function loadCatalogue() {
    if (catalogueRequest) return catalogueRequest;
    const status = root.querySelector('[data-bx-guide-status]');
    status.textContent = t('catalog_loading');
    const results = root.querySelector('[data-bx-guide-results]');
    results.setAttribute('aria-busy', 'true');
    catalogueRequest = (async () => {
      const loaded = [];
      let next = new URL(root.dataset.root || '/', location.origin);
      const visited = new Set();
      while (next) {
        next.searchParams.set('section_id', 'boxeup-guide-catalog');
        if (visited.has(next.href)) throw new Error('Catalogue pagination loop');
        visited.add(next.href);
        const response = await fetch(next.href, { credentials: 'same-origin' });
        if (!response.ok) throw new Error('Catalogue response failed');
        const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
        const payload = parse(doc.querySelector('[data-bx-guide-page]'), null);
        if (!payload || !Array.isArray(payload.products)) throw new Error('Catalogue data missing');
        loaded.push(...payload.products);
        next = payload.next ? new URL(payload.next, location.origin) : null;
        if (next && next.origin !== location.origin) throw new Error('Invalid catalogue origin');
      }
      products = [...new Map(loaded.map(item => [item.id, item])).values()];
      const usage = root.querySelector('[data-bx-usage-field]');
      if (usage) usage.hidden = !products.some(item => item.usage?.length);
      status.textContent = '';
      return products;
    })().catch(error => {
      catalogueRequest = undefined;
      status.textContent = t('catalog_load_error');
      throw error;
    }).finally(() => results.removeAttribute('aria-busy'));
    return catalogueRequest;
  }
  async function showMatches() {
    try { await loadCatalogue(); } catch { return; }
    const form = document.getElementById('BxGuideForm');
    const discipline = form.elements.discipline.value;
    const equipment = form.elements.equipment.value;
    const usage = form.elements.usage.value;
    const budget = form.elements.budget.value === '' ? Infinity : Number(form.elements.budget.value) * 100;
    const matches = products.filter(item => {
      const usageMatches = usage === 'all' || item.usage?.includes(usage);
      return item.price <= budget && usageMatches && (discipline === 'all' || item.collections.includes(discipline)) && (equipment === 'all' || item.collections.includes(equipment));
    });
    const results = root.querySelector('[data-bx-guide-results]'); results.replaceChildren();
    root.querySelector('[data-bx-guide-status]').textContent = matches.length ? `${t('matches')} (${matches.length})` : t('no_matches');
    matches.slice(0, 12).forEach(item => {
      const article = make('article', undefined, 'bx-guide-result');
      const link = make('a'); link.href = item.url;
      if (item.image) { const image = make('img'); image.src = item.image; image.alt = ''; image.width = 180; image.height = 180; image.loading = 'lazy'; link.append(image); }
      link.append(make('h3', item.title)); article.append(link, make('p', price(item)), make('small', t(item.available ? 'available' : 'unavailable')), productLink(item)); results.append(article);
    });
  }
  document.getElementById('BxGuideForm')?.addEventListener('submit', event => { event.preventDefault(); showMatches(); });
  const filterButton = root.querySelector('[data-bx-mobile-filters]');
  let filterObserver;
  function setupMobileFilters() {
    if (!filterButton) return;
    filterObserver?.disconnect();
    const grid = document.getElementById('ProductGridContainer');
    const trigger = document.querySelector('.mobile-facets__disclosure > summary');
    if (!grid || !trigger) { filterButton.hidden = true; return; }
    filterObserver = new IntersectionObserver(entries => {
      filterButton.hidden = !entries[0].isIntersecting;
    }, { threshold: 0 });
    filterObserver.observe(grid);
  }
  filterButton?.addEventListener('click', () => {
    document.querySelector('.mobile-facets__disclosure > summary')?.click();
  });
  document.addEventListener('boxeup:catalog-updated', setupMobileFilters);
  setupMobileFilters();
  const supports = new WeakSet();
  function initSupport(support) {
    if (supports.has(support)) return;
    supports.add(support);
    const info = support.closest('product-info');
    if (!info) return;
    const variants = parse(support.querySelector('[data-bx-variants]'), []);
    const sticky = info.closest('quick-add-modal') ? null : root.querySelector('[data-bx-sticky]');
    const getButton = () => document.getElementById(`ProductSubmitButton-${support.dataset.sectionId}`);
    function sync() {
      const form = document.getElementById(support.dataset.formId);
      const input = form?.querySelector('[name="id"]');
      const variant = variants.find(item => String(item.id) === input?.value);
      const button = getButton();
      const pending = !!button?.disabled && !!variant?.available && !input?.disabled;
      const stock = support.querySelector('[data-bx-stock]');
      const stockText = pending ? t('variant_pending') : t(!variant?.available ? 'unavailable' : variant.backorder ? 'backorder' : 'available');
      if (stock.textContent.trim() !== stockText) stock.textContent = stockText;
      stock.dataset.state = pending ? 'pending' : !variant?.available ? 'sold-out' : variant.backorder ? 'backorder' : 'available';
      const restock = support.querySelector('[data-bx-restock]');
      if (restock) restock.hidden = pending || !!variant?.available || !variant;
      const request = support.querySelector('[data-bx-restock-body]');
      if (request && variant) {
        const value = `${t('request_body')}: ${support.dataset.productTitle} — ${variant.title} (${location.origin}${support.dataset.productUrl}?variant=${variant.id})`;
        if (request.value !== value) request.value = value;
      }
      if (sticky) {
        const priceNode = sticky.querySelector('[data-bx-sticky-price]');
        const variantNode = sticky.querySelector('[data-bx-sticky-variant]');
        priceNode.textContent = variant ? money(variant.price) : '';
        variantNode.textContent = variant?.title === 'Default Title' ? '' : variant?.title || '';
        const submit = sticky.querySelector('[data-bx-sticky-submit]');
        submit.disabled = !button || button.disabled || button.getAttribute('aria-disabled') === 'true';
        submit.textContent = !variant?.available ? t('unavailable') : t('add');
      }
    }
    let queued = false;
    const observer = new MutationObserver(mutations => {
      if (queued || mutations.every(m => m.target.nodeType === 1 && m.target.closest('[data-bx-support]'))) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; if (support.isConnected) sync(); else observer.disconnect(); });
    });
    observer.observe(info, { subtree: true, childList: true, attributes: true, attributeFilter: ['disabled', 'aria-disabled', 'value'] });
    info.addEventListener('change', sync);
    if (sticky) {
      const button = getButton();
      let passed = false;
      let nativeVisible = true;
      if (button) new IntersectionObserver(entries => {
        const entry = entries[0]; nativeVisible = entry.isIntersecting; passed = entry.boundingClientRect.bottom < 0;
        sticky.hidden = nativeVisible || !passed;
      }).observe(button);
      sticky.querySelector('[data-bx-sticky-submit]').addEventListener('click', () => {
        const current = getButton();
        if (current && !current.disabled && current.getAttribute('aria-disabled') !== 'true') current.click();
      });
    }
    sync();
  }
  document.querySelectorAll('[data-bx-support]').forEach(initSupport);
  document.addEventListener('product-info:loaded', event => {
    event.target.querySelectorAll('[data-bx-support]').forEach(initSupport);
  });
  new MutationObserver(mutations => {
    mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
      if (node.nodeType !== 1) return;
      if (node.matches('[data-bx-support]')) initSupport(node);
      node.querySelectorAll('[data-bx-support]').forEach(initSupport);
    }));
  }).observe(document.getElementById('MainContent'), { childList: true, subtree: true });
  document.querySelectorAll('[data-bx-video]').forEach(button => {
    const video = button.closest('.bxv2-hero')?.querySelector('video');
    if (!video) { button.hidden = true; return; }
    const update = () => {
      button.setAttribute('aria-label', t(video.paused ? 'play' : 'pause'));
      button.querySelector('span').textContent = video.paused ? '▷' : 'Ⅱ';
    };
    const saveData = navigator.connection?.saveData;
    if (reduced.matches || saveData) video.pause();
    else video.play().catch(() => {});
    let resumeVideo = false;
    new IntersectionObserver(entries => {
      const visible = entries[0].isIntersecting;
      if (!visible) { resumeVideo = !video.paused; video.pause(); }
      else if (resumeVideo && !reduced.matches && !saveData) { resumeVideo = false; video.play().catch(() => {}); }
    }, { threshold: .1 }).observe(video);
    button.addEventListener('click', () => { if (video.paused) video.play().catch(() => {}); else video.pause(); });
    video.addEventListener('play', update); video.addEventListener('pause', update); update();
  });
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const node = entry.target; reveal.unobserve(node);
      if (!reduced.matches && node.getBoundingClientRect().top > 50) node.animate([{ opacity: .3, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.2,.75,.25,1)' });
    });
  }, { threshold: .12 });
  document.querySelectorAll('.bxv2-heading,.bx-choice-section,.bx-about__mission-copy,.bx-about__community-copy').forEach(node => reveal.observe(node));
  document.querySelectorAll('.boxeup-nav-modalities').forEach(menu => {
    menu.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      menu.dataset.bxMenuClosed = '';
      menu.querySelector('a')?.focus();
    });
    const reset = () => delete menu.dataset.bxMenuClosed;
    menu.addEventListener('pointerleave', reset);
    menu.addEventListener('focusout', event => { if (!menu.contains(event.relatedTarget)) reset(); });
  });
  let headerFrame;
  const syncHeader = () => {
    document.body.classList.toggle('bx-scrolled', window.scrollY > 48);
    headerFrame = undefined;
  };
  window.addEventListener('scroll', () => {
    if (!headerFrame) headerFrame = requestAnimationFrame(syncHeader);
  }, { passive: true });
  syncHeader();
  function polishCards(scope = document) {
    scope.querySelectorAll('.bxv2-product__image,.product-card-wrapper .card__inner').forEach(image => {
      if (image.querySelector('.bx-card-cta')) return;
      const card = image.closest('.bxv2-product,.product-card-wrapper');
      if (!card?.querySelector('a[href*="/products/"]')) return;
      const label = make('span', t('view'), 'bx-card-cta');
      label.setAttribute('aria-hidden', 'true');
      image.append(label);
    });
  }
  polishCards();
  document.addEventListener('boxeup:catalog-updated', () => polishCards());
  document.addEventListener('shopify:section:load', event => polishCards(event.target));
  document.addEventListener('toggle', event => {
    const details = event.target;
    if (!details.matches?.('.bx-faq-item,.product__accordion details') || !details.open || reduced.matches) return;
    const answer = details.querySelector('.bx-faq-answer,.accordion__content');
    answer?.animate([{ opacity: .3, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'ease-out' });
  }, true);
  document.addEventListener('boxeup:cart-added', () => {
    const drawer = document.querySelector('cart-drawer');
    const header = drawer?.querySelector('.drawer__header');
    if (!header) return;
    let notice = drawer.querySelector('.bx-cart-feedback');
    if (!notice) {
      notice = make('p', t('cart_added'), 'bx-cart-feedback');
      notice.setAttribute('role', 'status');
      header.after(notice);
    }
    if (!reduced.matches) {
      notice.animate([{ opacity: 0, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' }], { duration: 220 });
      document.querySelector('#cart-icon-bubble')?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 280 });
    }
  });
  const syncKeyboard = () => {
    const inputFocused = document.activeElement?.matches('input,textarea,select,[contenteditable="true"]');
    const keyboard = window.visualViewport && window.innerHeight - window.visualViewport.height > 150;
    document.body.classList.toggle('bx-keyboard-open', !!inputFocused && !!keyboard);
  };
  window.visualViewport?.addEventListener('resize', syncKeyboard, { passive: true });
  document.addEventListener('focusin', syncKeyboard);
  document.addEventListener('focusout', () => requestAnimationFrame(syncKeyboard));
  const contactSubject = document.getElementById('BoxeupContactSubject');
  if (contactSubject) {
    const params = new URLSearchParams(location.search);
    const subject = params.get('assunto');
    const product = params.get('produto');
    if ([...contactSubject.options].some(option => option.value === subject)) contactSubject.value = subject;
    const message = document.querySelector('.boxeup-contact textarea');
    if (product && message && !message.value.trim()) message.value = `${t('product_question')} ${product}`;
  }
  const openBrands = () => {
    if (location.hash !== '#BxBrands') return;
    const brands = document.getElementById('BxBrands');
    if (brands) brands.open = true;
  };
  openBrands();
  window.addEventListener('hashchange', openBrands);
  document.addEventListener('boxeup:catalog-updated', openBrands);
})();

(() => {
  document.addEventListener('click', event => {
    const toggle = event.target.closest('[data-bx-nav-toggle]');
    if (!toggle) return;
    const expanded = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.closest('.boxeup-nav-modalities').classList.toggle('bx-nav-expanded', expanded);
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const nav = event.target.closest('.bx-mobile-shared-nav');
    const expanded = nav?.querySelector('.bx-nav-expanded');
    if (!expanded) return;
    event.stopPropagation();
    const toggle = expanded.querySelector('[data-bx-nav-toggle]');
    toggle.setAttribute('aria-expanded', 'false');
    expanded.classList.remove('bx-nav-expanded');
    toggle.focus();
  }, true);
})();
