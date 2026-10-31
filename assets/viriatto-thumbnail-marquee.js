/* VIRIATTO mobile product thumbnails: independent marquee, original Shopify
   thumbnail controls stay untouched for variants, selection and zoom. */
(() => {
  if (window.__viriattoThumbnailMarquee) return;
  window.__viriattoThumbnailMarquee = true;
  const mobile = window.matchMedia('(max-width: 749px)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const instances = new Map();
  const speed = 12; // pixels per second
  const lang = (document.documentElement.lang || 'pt').slice(0, 2);
  const label = lang === 'en' ? 'Product photos' : lang === 'es' ? 'Fotos del producto' : 'Fotografias do produto';

  function mount(gallery) {
    if (!mobile.matches || instances.has(gallery)) return;
    const nativeSlider = gallery.querySelector('slider-component[id^="GalleryThumbnails-"]');
    if (!nativeSlider || getComputedStyle(nativeSlider).display === 'none') return;
    const source = Array.from(nativeSlider.querySelectorAll('.thumbnail-list > li[data-target]'))
      .filter(item => item.querySelector('button.thumbnail'));
    if (source.length < 2) return;

    const rail = document.createElement('div');
    rail.className = 'viri-thumb-rail';
    rail.setAttribute('role', 'region');
    rail.setAttribute('aria-label', label);
    rail.setAttribute('tabindex', '0');
    const track = document.createElement('div');
    track.className = 'viri-thumb-rail__track';
    rail.appendChild(track);
    const sets = [[], [], []];
    const originals = source.map(item => ({
      item,
      target: item.dataset.target,
      button: item.querySelector('button.thumbnail')
    }));
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    let observer;
    let resizeObserver;
    let visibilityObserver;
    let frame;
    let previousFrame = 0;
    let period = 0;
    let visible = true;
    let hovering = false;
    let pressed = false;
    let dragging = false;
    let moved = false;
    let initialX = 0;
    let initialScroll = 0;
    let pauseUntil = 0;
    let disposed = false;

    const pause = (ms = 2600) => { pauseUntil = performance.now() + ms; };
    for (let round = 0; round < 3; round++) {
      originals.forEach(({target, button}, index) => {
        const item = document.createElement('div');
        item.className = 'viri-thumb-rail__item';
        item.dataset.viriTarget = target;
        const view = button.cloneNode(true);
        view.className = 'viri-thumb-rail__button';
        view.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
        view.removeAttribute('aria-describedby');
        view.removeAttribute('aria-current');
        view.removeAttribute('style');
        view.type = 'button';
        // Only the centre copy is exposed to keyboard and assistive technology.
        if (round !== 1) {
          item.setAttribute('aria-hidden', 'true');
          view.tabIndex = -1;
        } else {
          view.tabIndex = 0;
        }
        view.querySelectorAll('img').forEach(img => {
          img.removeAttribute('id');
          img.loading = 'eager';
          img.decoding = 'async';
        });
        view.addEventListener('click', () => {
          pause(3600);
          const original = originals[index].button;
          if (original.isConnected) original.click();
        }, {signal});
        item.appendChild(view);
        track.appendChild(item);
        sets[round].push(item);
      });
    }

    function syncSelection() {
      const selected = new Set(originals
        .filter(entry => entry.button.hasAttribute('aria-current'))
        .map(entry => entry.target));
      track.querySelectorAll('.viri-thumb-rail__item').forEach(item => {
        item.querySelector('button')?.classList.toggle('is-current', selected.has(item.dataset.viriTarget));
      });
    }
    observer = new MutationObserver(syncSelection);
    originals.forEach(({button}) => observer.observe(button, {attributes:true, attributeFilter:['aria-current']}));
    syncSelection();

    nativeSlider.after(rail);
    const measure = () => {
      const width = rail.clientWidth;
      if (!width || !rail.isConnected) return;
      rail.style.setProperty('--viri-thumb-width', Math.max(52, (width - 16) / 3) + 'px');
      const newPeriod = sets[1][0].offsetLeft - sets[0][0].offsetLeft;
      if (newPeriod <= 0) return;
      const offset = period ? (rail.scrollLeft - period) * newPeriod / period : 0;
      period = newPeriod;
      rail.scrollLeft = period + offset;
    };
    gallery.classList.add('viri-thumb-rail--ready');
    measure();
    requestAnimationFrame(measure);

    rail.addEventListener('pointerenter', e => {
      if (e.pointerType === 'mouse') hovering = true;
    }, {signal});
    rail.addEventListener('pointerleave', e => {
      if (e.pointerType === 'mouse') hovering = false;
    }, {signal});
    rail.addEventListener('pointerdown', e => {
      pause(2500);
      pressed = true;
      if (e.pointerType === 'mouse' && e.button === 0) {
        dragging = true;
        moved = false;
        initialX = e.clientX;
        initialScroll = rail.scrollLeft;
      }
    }, {signal});
    rail.addEventListener('pointermove', e => {
      if (!dragging || e.pointerType !== 'mouse') return;
      const shift = e.clientX - initialX;
      if (Math.abs(shift) < 6 && !moved) return;
      moved = true;
      rail.classList.add('is-dragging');
      rail.scrollLeft = initialScroll - shift;
      if (e.cancelable) e.preventDefault();
    }, {signal, passive:false});
    const release = () => {
      if (!pressed) return;
      pressed = false;
      dragging = false;
      rail.classList.remove('is-dragging');
      pause(2600);
    };
    window.addEventListener('pointerup', release, {signal});
    window.addEventListener('pointercancel', release, {signal});
    rail.addEventListener('touchstart', () => {pressed = true;pause(2500);}, {signal, passive:true});
    rail.addEventListener('touchend', release, {signal, passive:true});
    rail.addEventListener('touchcancel', release, {signal, passive:true});
    rail.addEventListener('wheel', () => pause(2800), {signal, passive:true});
    rail.addEventListener('focusin', () => pause(2400), {signal});
    rail.addEventListener('click', e => {
      if (!moved) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      moved = false;
      pause(2600);
    }, {signal, capture:true});

    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(rail);
    }
    if ('IntersectionObserver' in window) {
      visibilityObserver = new IntersectionObserver(entries => {
        visible = entries[0]?.isIntersecting ?? false;
      }, {threshold:0});
      visibilityObserver.observe(rail);
    }

    const tick = now => {
      if (disposed) return;
      if (!gallery.isConnected || !mobile.matches) {
        dispose();
        return;
      }
      const dt = previousFrame ? Math.min(60, now - previousFrame) : 16;
      previousFrame = now;
      const keyboardFocus = rail.contains(document.activeElement) &&
        document.activeElement.matches(':focus-visible');
      if (period > 0 && !reduced.matches && !document.hidden &&
          visible && !hovering && !pressed && !keyboardFocus && now >= pauseUntil) {
        let next = rail.scrollLeft + speed * dt / 1000;
        if (next >= 2 * period) next -= period;
        else if (next < period) next += period;
        rail.scrollLeft = next;
      }
      frame = requestAnimationFrame(tick);
    };
    const dispose = () => {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      resizeObserver?.disconnect();
      visibilityObserver?.disconnect();
      ctrl.abort();
      gallery.classList.remove('viri-thumb-rail--ready');
      rail.remove();
      instances.delete(gallery);
    };
    instances.set(gallery, dispose);
    frame = requestAnimationFrame(tick);
  }

  const scan = () => {
    if (!mobile.matches) {
      instances.forEach(dispose => dispose());
      return;
    }
    document.querySelectorAll('#MainContent[data-template="product"] media-gallery')
      .forEach(gallery => mount(gallery));
  };
  const start = () => {
    scan();
    mobile.addEventListener('change', scan);
    document.addEventListener('shopify:section:load', scan);
    window.addEventListener('pageshow', scan);
    const root = document.querySelector('#MainContent[data-template="product"]');
    if (root) {
      let queued = false;
      const watch = new MutationObserver(() => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {queued = false;scan();});
      });
      watch.observe(root, {childList:true,subtree:true});
      window.addEventListener('pagehide', () => watch.disconnect(), {once:true});
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
