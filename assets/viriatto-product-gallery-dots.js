/* VIRIATTO / Product photo pagination.
   The moving capsule follows the actual gallery scroll, including finger drag.
   The Shopify media gallery, zoom, variants and normal controls remain untouched. */
(() => {
  if (window.__viriProductGalleryDots) return;
  window.__viriProductGalleryDots = true;

  const mobile = window.matchMedia('(max-width: 749px)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mounted = new Map();
  const locale = (document.documentElement.lang || 'pt').slice(0, 2);
  const name = locale === 'en' ? 'Photo' : locale === 'es' ? 'Foto' : 'Fotografia';
  const galleryLabel = locale === 'en' ? 'Product photo navigation'
    : locale === 'es' ? 'Navegación de fotos del producto'
    : 'Navegação das fotografias do produto';

  function mount(gallery) {
    if (!mobile.matches || mounted.has(gallery)) return;
    const viewer = gallery.querySelector('slider-component[id^="GalleryViewer-"]');
    const slider = viewer?.querySelector('.product__media-list');
    if (!slider) return;

    const dots = document.createElement('div');
    dots.className = 'viri-gallery-dots';
    dots.setAttribute('role', 'group');
    dots.setAttribute('aria-label', galleryLabel);

    const track = document.createElement('div');
    track.className = 'viri-gallery-dots__track';
    const indicator = document.createElement('span');
    indicator.className = 'viri-gallery-dots__indicator';
    indicator.setAttribute('aria-hidden', 'true');
    dots.appendChild(track);

    const ctrl = new AbortController();
    const signal = ctrl.signal;
    let items = [];
    let buttons = [];
    let activeId = '';
    let raf = 0;
    let idle = 0;
    let animatingTap = false;
    let tracking = false;
    let disposed = false;

    const getItems = () => Array.from(slider.querySelectorAll(':scope > li[data-media-id]'));
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    function setSelected(index) {
      const i = clamp(Math.round(index), 0, Math.max(0, items.length - 1));
      if (!items[i]) return;
      activeId = items[i].dataset.mediaId;
      buttons.forEach((button, n) => {
        if (n === i) button.setAttribute('aria-current', 'true');
        else button.removeAttribute('aria-current');
      });
    }

    function renderPosition(progress) {
      if (!buttons.length) return;
      const p = clamp(progress, 0, buttons.length - 1);
      const leftIndex = Math.floor(p);
      const rightIndex = Math.min(leftIndex + 1, buttons.length - 1);
      const fraction = p - leftIndex;
      const a = buttons[leftIndex];
      const b = buttons[rightIndex];
      if (!a || !b) return;

      const centerA = a.offsetLeft + a.offsetWidth / 2;
      const centerB = b.offsetLeft + b.offsetWidth / 2;
      // Resting active dot is 10px (larger than other 5px dots); only stretches to 24px during motion.
      const width = reduced.matches ? 10 : 10 + 14 * Math.sin(Math.PI * fraction);
      const center = centerA + (centerB - centerA) * fraction;
      indicator.style.width = width.toFixed(2) + 'px';
      indicator.style.transform = 'translate3d(' + (center - width / 2).toFixed(2) + 'px,-50%,0)';
    }

    function scrollProgress() {
      if (!items.length) return 0;
      const origin = items[0].offsetLeft;
      const position = slider.scrollLeft + origin;
      let i = 0;
      for (; i < items.length - 1; i++) {
        const left = items[i].offsetLeft;
        const right = items[i + 1].offsetLeft;
        if (position <= right || i === items.length - 2) {
          const size = Math.max(1, right - left);
          return clamp(i + (position - left) / size, 0, items.length - 1);
        }
      }
      return items.length - 1;
    }

    function followScroll() {
      raf = 0;
      const progress = scrollProgress();
      renderPosition(progress);
      setSelected(progress);
    }

    function scheduleScroll() {
      if (!raf) raf = requestAnimationFrame(followScroll);
    }

    function snapToItem(index, smooth = true) {
      if (!buttons[index]) return;
      dots.classList.toggle('viri-gallery-dots--tracking', !smooth || reduced.matches);
      renderPosition(index);
      setSelected(index);
    }

    function rebuild() {
      const next = getItems();
      const same = next.length === items.length && next.every((item, i) => item === items[i]);
      if (same) {
        if (!tracking && !animatingTap) {
          const index = items.findIndex(item => item.classList.contains('is-active'));
          if (index >= 0 && items[index].dataset.mediaId !== activeId) snapToItem(index);
        }
        return;
      }

      items = next;
      buttons = items.map((item, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'viri-gallery-dot';
        button.dataset.mediaId = item.dataset.mediaId;
        button.setAttribute('aria-label', name + ' ' + (index + 1) + ' / ' + items.length);
        return button;
      });
      track.replaceChildren(...buttons, indicator);
      dots.hidden = items.length < 2;

      // Initial placement must not animate in from the edge.
      dots.classList.add('viri-gallery-dots--tracking');
      const selected = items.findIndex(item => item.dataset.mediaId === activeId);
      const active = items.findIndex(item => item.classList.contains('is-active'));
      const initial = selected >= 0 ? selected : active >= 0 ? active : 0;
      requestAnimationFrame(() => {
        if (disposed) return;
        renderPosition(initial);
        setSelected(initial);
        requestAnimationFrame(() => {
          if (!disposed && !tracking) dots.classList.remove('viri-gallery-dots--tracking');
        });
      });
    }

    const finishScroll = () => {
      clearTimeout(idle);
      idle = setTimeout(() => {
        tracking = false;
        animatingTap = false;
        slider.classList.remove('viri-gallery-slide-smooth');
        // Once the image settles, return to a round dot at its final position.
        const settled = Math.round(scrollProgress());
        renderPosition(settled);
        setSelected(settled);
        dots.classList.remove('viri-gallery-dots--tracking');
      }, 140);
    };

    dots.addEventListener('click', event => {
      const button = event.target.closest('button[data-media-id]');
      if (!button) return;
      const index = buttons.indexOf(button);
      if (index < 0 || !items[index]) return;
      tracking = false;
      animatingTap = true;
      dots.classList.add('viri-gallery-dots--tracking');
      // Follow the gallery scroll instead of jumping the indicator ahead.
      if (!reduced.matches) slider.classList.add('viri-gallery-slide-smooth');
      gallery.setActiveMedia?.(items[index].dataset.mediaId, false);
      finishScroll();
    }, {signal});

    slider.addEventListener('touchstart', () => {
      animatingTap = false;
      tracking = true;
      dots.classList.add('viri-gallery-dots--tracking');
      clearTimeout(idle);
    }, {signal, passive:true});

    // Re-enable transitions when a touch/pointer ends without actual scrolling.
    slider.addEventListener('touchend', finishScroll, {signal,passive:true});
    slider.addEventListener('touchcancel', finishScroll, {signal,passive:true});
    slider.addEventListener('pointerup', finishScroll, {signal,passive:true});
    slider.addEventListener('pointercancel', finishScroll, {signal,passive:true});

    slider.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      animatingTap = false;
      tracking = true;
      dots.classList.add('viri-gallery-dots--tracking');
      clearTimeout(idle);
    }, {signal, passive:true});

    slider.addEventListener('scroll', () => {
      if (!animatingTap) {
        tracking = true;
        dots.classList.add('viri-gallery-dots--tracking');
      }
      scheduleScroll();
      finishScroll();
    }, {signal, passive:true});

    viewer.addEventListener('slideChanged', event => {
      const id = event.detail?.currentElement?.dataset.mediaId;
      const index = items.findIndex(item => item.dataset.mediaId === id);
      if (index >= 0) {
        setSelected(index);
        if (!tracking) snapToItem(index);
      }
    }, {signal});

    const observer = new MutationObserver(records => {
      if (records.some(record => record.type === 'childList' && record.target === slider)) {
        rebuild();
        return;
      }
      if (records.some(record => record.type === 'attributes' &&
          record.target.matches?.('li[data-media-id]')) && !tracking && !animatingTap) {
        rebuild();
      }
    });
    observer.observe(slider, {subtree:true,childList:true,attributes:true,attributeFilter:['class']});

    viewer.appendChild(dots);
    rebuild();

    const onResize = () => {
      if (disposed) return;
      // Position is geometry-based: recalculate after orientation/viewport changes.
      dots.classList.add('viri-gallery-dots--tracking');
      followScroll();
      requestAnimationFrame(() => {
        if (!disposed && !tracking) dots.classList.remove('viri-gallery-dots--tracking');
      });
    };
    window.addEventListener('resize', onResize, {signal,passive:true});

    function dispose() {
      if (disposed) return;
      disposed = true;
      ctrl.abort();
      observer.disconnect();
      clearTimeout(idle);
      cancelAnimationFrame(raf);
      dots.remove();
      mounted.delete(gallery);
    }
    mounted.set(gallery, dispose);
  }

  function scan() {
    if (!mobile.matches) {
      Array.from(mounted.values()).forEach(dispose => dispose());
      return;
    }
    for (const [gallery, dispose] of mounted) {
      if (!gallery.isConnected) dispose();
    }
    document.querySelectorAll('#MainContent[data-template="product"] media-gallery').forEach(mount);
  }
  function start() {
    scan();
    mobile.addEventListener('change', scan);
    document.addEventListener('shopify:section:load', scan);
    window.addEventListener('pageshow', scan);
    window.addEventListener('pagehide', () => {
      Array.from(mounted.values()).forEach(dispose => dispose());
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
