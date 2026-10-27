(() => {
  const root = document.getElementById('BxExperience');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = 'true';
  const parse = (node, fallback) => { try { return JSON.parse(node?.textContent || ''); } catch { return fallback; } };
  const labels = parse(root.querySelector('[data-bx-translations]'), {});
  const t = key => labels[key] || key;
  const products = parse(root.querySelector('[data-bx-catalog]'), []);
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
  let toastTimer;
  function toast(message) {
    const node = root.querySelector('[data-bx-toast]');
    clearTimeout(toastTimer);
    node.textContent = message;
    node.hidden = false;
    toastTimer = setTimeout(() => { node.hidden = true; }, 4500);
  }
  let lastOpener;
  function openDialog(id, opener) {
    const dialog = document.getElementById(id);
    if (!dialog || typeof dialog.showModal !== 'function') return;
    if (id === 'BxCompare') {
      if (selected.length < 2) { toast(t('compare_min')); return; }
      renderComparison();
    }
    document.querySelectorAll('#BxExperience dialog[open]').forEach(node => node.close());
    lastOpener = opener;
    dialog.showModal();
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
  let selected = [];
  const validProduct = item => item && Number.isFinite(item.id) && Number.isFinite(item.price) && typeof item.title === 'string' && /^\/(?:[a-z]{2}(?:-[A-Za-z]{2})?\/)?products\//.test(item.url) && Array.isArray(item.options);
  try {
    const saved = JSON.parse(localStorage.getItem('boxeup.compare.v1') || '[]');
    if (Array.isArray(saved)) selected = saved.filter(validProduct).slice(0, 3);
  } catch {}
  selected = selected.map(item => products.find(product => product.id === item.id) || item);
  function syncButtons(scope = document) {
    scope.querySelectorAll('[data-bx-compare]').forEach(button => {
      button.setAttribute('aria-pressed', String(selected.some(item => String(item.id) === button.dataset.bxCompare)));
    });
  }
  function persist() {
    try { localStorage.setItem('boxeup.compare.v1', JSON.stringify(selected)); } catch {}
    renderTray();
  }
  function removeItem(id) {
    selected = selected.filter(item => String(item.id) !== String(id));
    persist();
    const dialog = document.getElementById('BxCompare');
    if (dialog.open) {
      if (selected.length < 2) dialog.close();
      else renderComparison();
    }
  }
  function renderTray() {
    const tray = root.querySelector('[data-bx-tray]');
    tray.hidden = !selected.length;
    root.querySelector('[data-bx-count]').textContent = `${selected.length}/3 ${t('compare_count')}`;
    const list = root.querySelector('[data-bx-tray-items]');
    list.replaceChildren();
    selected.forEach(item => {
      const button = make('button', item.title + ' ×');
      button.type = 'button';
      button.setAttribute('aria-label', `${t('remove')}: ${item.title}`);
      button.addEventListener('click', () => removeItem(item.id));
      list.append(button);
    });
    syncButtons();
  }
  function renderComparison() {
    const container = root.querySelector('[data-bx-compare-table]');
    const table = make('table', undefined, 'bx-compare-table');
    table.append(make('caption', t('compare_title'), 'visually-hidden'));
    const header = make('tr');
    const corner = make('th', t('gloves'));
    corner.scope = 'col'; header.append(corner);
    selected.forEach(item => {
      const cell = make('th'); cell.scope = 'col';
      if (item.image && /^https:\/\/cdn\.shopify\.com\//.test(item.image)) {
        const img = make('img'); img.src = item.image; img.alt = ''; img.width = 160; img.height = 160; img.loading = 'lazy'; cell.append(img);
      }
      cell.append(make('strong', item.title));
      const remove = make('button', t('remove'), 'bx-text-button'); remove.type = 'button';
      remove.addEventListener('click', () => removeItem(item.id)); cell.append(remove); header.append(cell);
    });
    const thead = make('thead'); thead.append(header); table.append(thead);
    const body = make('tbody');
    const rows = [
      ['price', price], ['brand', item => item.vendor], ['category', item => item.type],
      ['options', item => item.options.filter(option => option.name !== 'Title').map(option => `${option.name}: ${option.values.join(', ')}`).join('\n')],
      ['material', item => item.material], ['availability', item => t(item.available ? 'available' : 'unavailable')],
      ['details', item => item.description]
    ];
    rows.forEach(([key, getter]) => {
      const row = make('tr'); const label = make('th', t(key)); label.scope = 'row'; row.append(label);
      selected.forEach(item => row.append(make('td', getter(item) || t('not_specified')))); body.append(row);
    });
    const actions = make('tr'); actions.append(make('th', t('view')));
    selected.forEach(item => { const cell = make('td'); cell.append(productLink(item)); actions.append(cell); });
    body.append(actions); table.append(body); container.replaceChildren(table);
  }
  document.addEventListener('click', event => {
    const open = event.target.closest('[data-bx-open]');
    if (open) { event.preventDefault(); openDialog(open.dataset.bxOpen, open); return; }
    const close = event.target.closest('[data-bx-close]');
    if (close) { close.closest('dialog')?.close(); return; }
    if (event.target.closest('[data-bx-clear]')) { selected = []; persist(); return; }
    const compare = event.target.closest('[data-bx-compare]');
    if (compare) {
      const existing = selected.some(item => String(item.id) === compare.dataset.bxCompare);
      if (existing) { removeItem(compare.dataset.bxCompare); return; }
      if (selected.length === 3) { toast(t('compare_limit')); return; }
      const item = parse(compare.parentElement.querySelector('[data-bx-product]'), null);
      if (validProduct(item)) { selected.push(item); persist(); }
    }
  });
  function showMatches() {
    const form = document.getElementById('BxGuideForm');
    const discipline = form.elements.discipline.value;
    const equipment = form.elements.equipment.value;
    const usage = form.elements.usage.value;
    const budget = form.elements.budget.value === '' ? Infinity : Number(form.elements.budget.value) * 100;
    const matches = products.filter(item => {
      const description = (item.title + ' ' + item.description).toLowerCase();
      const usageMatches = usage === 'all' || (usage === 'sparring' ? description.includes('sparring') : /\bsaco\b|\bbag\b|\bpads?\b/.test(description));
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
  renderTray();
  document.addEventListener('boxeup:catalog-updated', () => syncButtons());
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
      if (node.matches('[data-bx-compare]') || node.querySelector('[data-bx-compare]')) syncButtons(node.parentElement || node);
    }));
  }).observe(document.getElementById('MainContent'), { childList: true, subtree: true });
  document.querySelectorAll('[data-bx-video]').forEach(button => {
    const video = button.closest('.bxv2-hero')?.querySelector('video');
    if (!video) { button.hidden = true; return; }
    const update = () => {
      button.setAttribute('aria-label', t(video.paused ? 'play' : 'pause'));
      button.querySelector('span').textContent = video.paused ? '▷' : 'Ⅱ';
    };
    if (reduced.matches) video.pause();
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
})();
