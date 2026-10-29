/* VIRIATTO — live Shopify catalogue search. Keeps normal /search submit as fallback. */
(function () {
  'use strict';
  var overlay = document.querySelector('[data-vs-search]');
  if (!overlay) return;
  var input = overlay.querySelector('[data-vs-input]');
  var initial = overlay.querySelector('[data-vs-initial]');
  var results = overlay.querySelector('[data-vs-results]');
  var grid = overlay.querySelector('[data-vs-grid]');
  var status = overlay.querySelector('[data-vs-status]');
  var empty = overlay.querySelector('[data-vs-empty]');
  var allLink = overlay.querySelector('[data-vs-all]');
  var clearButton = overlay.querySelector('[data-vs-clear]');
  var opener = null;
  var delay = 0;
  var activeRequest = null;
  var generation = 0;
  var suppressFocus = false;
  var locale = document.documentElement.lang || 'pt-PT';
  var money = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' });

  function text(node, value) { node.textContent = value == null ? '' : String(value); }
  function fullSearchUrl(query) {
    var url = new URL(overlay.dataset.searchRoute || '/search', window.location.origin);
    url.searchParams.set('q', query);
    url.searchParams.set('options[prefix]', 'last');
    return url.toString();
  }
  function showInitial() {
    window.clearTimeout(delay);
    if (activeRequest) activeRequest.abort();
    generation += 1;
    initial.hidden = false;
    results.hidden = true;
    text(status, '');
    clearButton.hidden = !input.value;
  }
  function openSearch(source) {
    var originInput = source && source.matches && source.matches('input[type=search]')
      ? source
      : source && source.querySelector ? source.querySelector('input[type=search]') : null;
    opener = originInput || source || document.activeElement;
    if (originInput) input.value = originInput.value || '';
    overlay.hidden = false;
    document.body.classList.add('vs-search-open');
    input.value.trim() ? runSearch(input.value) : showInitial();
    window.requestAnimationFrame(function () { input.focus({preventScroll: true}); });
  }
  function closeSearch() {
    if (overlay.hidden) return;
    overlay.hidden = true;
    document.body.classList.remove('vs-search-open');
    window.clearTimeout(delay);
    if (activeRequest) activeRequest.abort();
    generation += 1;
    var target = opener;
    if (target) {
      if (target.matches('input[type=search]')) target.value = input.value;
      suppressFocus = true;
      target.focus({preventScroll: true});
      window.setTimeout(function () { suppressFocus = false; }, 90);
    }
  }
  function normalizedMoney(value) {
    if (value == null || value === '') return '';
    var numeric = Number(value);
    if (!Number.isFinite(numeric)) return '';
    var amount = typeof value === 'string' && value.includes('.') ? numeric : numeric / 100;
    return money.format(amount);
  }
  function dom(tag, cls, value) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (value !== undefined) text(el, value);
    return el;
  }
  function renderProduct(product) {
    var link = dom('a', 'vs-search__card');
    var productUrl = product.url || (product.handle ? '/products/' + encodeURIComponent(product.handle) : '#');
    link.href = productUrl;
    link.setAttribute('aria-label', product.title || '');
    var picture = dom('span', 'vs-search__card-media');
    var media = product.featured_image || product.image || product.images && product.images[0];
    var mediaUrl = typeof media === 'string' ? media : media && (media.url || media.src);
    if (mediaUrl) {
      var image = document.createElement('img');
      image.src = mediaUrl;
      image.alt = product.title || '';
      image.loading = 'lazy';
      image.decoding = 'async';
      picture.appendChild(image);
    } else { picture.appendChild(dom('span', '', 'V')); }
    link.appendChild(picture);
    var body = dom('span', 'vs-search__card-body');
    body.appendChild(dom('span', 'vs-search__card-brand', product.vendor || 'VIRIATTO'));
    body.appendChild(dom('strong', 'vs-search__card-title', product.title || 'Produto'));
    var price = dom('span', 'vs-search__card-price');
    var priceText = normalizedMoney(product.price);
    if (priceText) {
      price.appendChild(document.createTextNode(priceText));
      var old = Number(product.compare_at_price_min || product.compare_at_price);
      if (old && old > Number(product.price)) {
        var previous = normalizedMoney(product.compare_at_price_min || product.compare_at_price);
        if (previous) price.appendChild(dom('del', '', previous));
      }
    }
    body.appendChild(price);
    link.appendChild(body);
    return link;
  }
  function renderProducts(products, query) {
    grid.replaceChildren();
    if (!Array.isArray(products)) products = [];
    products.forEach(function (item) { grid.appendChild(renderProduct(item)); });
    empty.hidden = products.length > 0;
    if (!products.length) text(empty, overlay.dataset.empty || '');
    text(status, products.length ? String(products.length) + (locale.startsWith('pt') ? ' produtos apresentados' : locale.startsWith('es') ? ' productos mostrados' : ' products shown') : '');
    allLink.href = fullSearchUrl(query);
  }
  function searchNow(raw) {
    var query = raw.trim();
    clearButton.hidden = !input.value;
    if (!query) { showInitial(); return; }
    initial.hidden = true;
    results.hidden = false;
    empty.hidden = true;
    grid.replaceChildren();
    allLink.href = fullSearchUrl(query);
    text(status, overlay.dataset.loading || '');
    if (activeRequest) activeRequest.abort();
    var version = ++generation;
    activeRequest = new AbortController();
    var route = overlay.dataset.suggestRoute || '/search/suggest';
    var url = new URL(route.endsWith('.json') ? route : route + '.json', window.location.origin);
    url.searchParams.set('q', query);
    url.searchParams.set('resources[type]', 'product');
    url.searchParams.set('resources[limit]', '10');
    url.searchParams.set('resources[options][unavailable_products]', 'show');
    url.searchParams.set('resources[options][fields]', 'title,product_type,variants.title,vendor,tag');
    fetch(url.toString(), {signal: activeRequest.signal, headers: {Accept:'application/json'}})
      .then(function (response) { if (!response.ok) throw new Error('HTTP '+response.status); return response.json(); })
      .then(function (data) {
        if (version !== generation || overlay.hidden) return;
        var group = data && data.resources && data.resources.results;
        renderProducts(group && group.products || [], query);
      })
      .catch(function (error) {
        if (error && error.name === 'AbortError') return;
        if (version !== generation || overlay.hidden) return;
        grid.replaceChildren();
        text(status, '');
        text(empty, overlay.dataset.error || '');
        empty.hidden = false;
      });
  }
  function runSearch(raw) {
    window.clearTimeout(delay);
    if (!raw.trim()) { showInitial(); return; }
    initial.hidden = true;
    results.hidden = false;
    clearButton.hidden = !input.value;
    allLink.href = fullSearchUrl(raw.trim());
    text(status, overlay.dataset.loading || '');
    delay = window.setTimeout(function () { searchNow(raw); }, 170);
  }
  document.addEventListener('focusin', function (event) {
    if (suppressFocus || !overlay.hidden) return;
    if (event.target.matches('[data-vs-home-input]')) openSearch(event.target);
  });
  document.addEventListener('submit', function (event) {
    var homepageForm = event.target.closest('form.vh-header-search[data-vs-open]');
    if (homepageForm) {
      event.preventDefault();
      if (overlay.hidden) openSearch(homepageForm);
    }
  });
  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-vs-open]');
    if (trigger) {
      event.preventDefault();
      if (overlay.hidden) openSearch(trigger);
      return;
    }
    if (event.target.closest('[data-vs-close]')) { event.preventDefault(); closeSearch(); return; }
    var chip = event.target.closest('[data-vs-chip]');
    if (chip) {
      event.preventDefault();
      input.value = chip.dataset.query || '';
      input.focus();
      runSearch(input.value);
    }
  });
  input.addEventListener('input', function () { runSearch(input.value); });
  input.addEventListener('search', function () { runSearch(input.value); });
  clearButton.addEventListener('click', function () {
    input.value = '';
    input.focus();
    showInitial();
  });
  document.addEventListener('keydown', function (event) {
    if (overlay.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); closeSearch(); return; }
    if (event.key !== 'Tab') return;
    var focusables = Array.from(overlay.querySelectorAll('button:not([hidden]),input:not([hidden]),a[href]')).filter(function (el) {
      return el.getClientRects().length && !el.disabled && !el.closest('[hidden]') && !el.hasAttribute('tabindex');
    });
    if (!focusables.length) return;
    var first = focusables[0], last = focusables[focusables.length-1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
})();