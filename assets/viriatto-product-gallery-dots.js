/* Product-photo pagination for mobile. Uses the existing media-gallery API:
   never replaces or resizes the main photo, zoom or original thumbnails. */
(() => {
  if (window.__viriProductGalleryDots) return;
  window.__viriProductGalleryDots = true;

  const mobile = window.matchMedia('(max-width: 749px)');
  const mounted = new Map();
  const lang = (document.documentElement.lang || 'pt').slice(0, 2);
  const description = lang === 'en' ? 'Photo' : lang === 'es' ? 'Foto' : 'Fotografia';
  const galleryLabel = lang === 'en' ? 'Product photo navigation'
    : lang === 'es' ? 'Navegación de fotos del producto'
    : 'Navegação das fotografias do produto';

  function mount(gallery) {
    if (!mobile.matches || mounted.has(gallery)) return;
    const viewer = gallery.querySelector('slider-component[id^="GalleryViewer-"]');
    const list = viewer && viewer.querySelector('.product__media-list');
    if (!viewer || !list) return;

    const dots = document.createElement('div');
    dots.className = 'viri-gallery-dots';
    dots.setAttribute('role', 'group');
    dots.setAttribute('aria-label', galleryLabel);

    const ctrl = new AbortController();
    let items = [];
    let activeId = null;
    let refreshFrame = 0;
    let disposed = false;
    const signal = ctrl.signal;

    const mediaItems = () => Array.from(list.querySelectorAll(':scope > li[data-media-id]'));
    const setActive = id => {
      if (!id || !items.some(item => item.dataset.mediaId === id)) return;
      activeId = id;
      dots.querySelectorAll('button[data-media-id]').forEach(button => {
        const selected = button.dataset.mediaId === id;
        if (selected) button.setAttribute('aria-current', 'true');
        else button.removeAttribute('aria-current');
      });
      // Keep the current indicator visible for products with many photos.
      const current = Array.from(dots.children).find(button => button.dataset.mediaId === id);
      if (current && dots.scrollWidth > dots.clientWidth) {
        const start = current.offsetLeft - dots.offsetLeft;
        const target = start - (dots.clientWidth - current.offsetWidth) / 2;
        dots.scrollLeft = Math.max(0, target);
      }
    };

    const updateFromMedia = () => {
      const active = list.querySelector(':scope > li.is-active[data-media-id]');
      setActive(active?.dataset.mediaId || activeId || items[0]?.dataset.mediaId);
    };

    const rebuild = () => {
      const next = mediaItems();
      if (next.length === items.length &&
          next.every((item, index) => item.dataset.mediaId === items[index]?.dataset.mediaId)) {
        updateFromMedia();
        return;
      }
      items = next;
      const nodes = items.map((item, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'viri-gallery-dot';
        button.dataset.mediaId = item.dataset.mediaId;
        button.setAttribute('aria-label', description + ' ' + (index + 1) + ' / ' + items.length);
        return button;
      });
      dots.replaceChildren(...nodes);
      dots.hidden = items.length < 2;
      setActive(items.find(item => item.classList.contains('is-active'))?.dataset.mediaId ||
        (items.some(item => item.dataset.mediaId === activeId) ? activeId : items[0]?.dataset.mediaId));
    };

    const scheduleRefresh = () => {
      if (refreshFrame) return;
      refreshFrame = requestAnimationFrame(() => {
        refreshFrame = 0;
        rebuild();
      });
    };

    dots.addEventListener('click', event => {
      const button = event.target.closest('button[data-media-id]');
      if (!button) return;
      const id = button.dataset.mediaId;
      if (!items.some(item => item.dataset.mediaId === id)) return;
      setActive(id);
      gallery.setActiveMedia?.(id, false);
    }, {signal});

    // Shopify's slider fires this for swipes; clicking native thumbnails changes
    // is-active, and changing a variant can add or reorder media items.
    viewer.addEventListener('slideChanged', event => {
      setActive(event.detail?.currentElement?.dataset.mediaId);
    }, {signal});
    const observer = new MutationObserver(records => {
      // Ignore class changes inside media (zoom/spinner): they are not slide changes.
      if (records.some(record =>
        (record.type === 'childList' && record.target === list) ||
        (record.type === 'attributes' && record.target.matches?.('li[data-media-id]'))
      )) scheduleRefresh();
    });
    observer.observe(list, {childList:true, subtree:true, attributes:true, attributeFilter:['class']});

    viewer.appendChild(dots);
    rebuild();
    const dispose = () => {
      if (disposed) return;
      disposed = true;
      observer.disconnect();
      ctrl.abort();
      cancelAnimationFrame(refreshFrame);
      dots.remove();
      mounted.delete(gallery);
    };
    mounted.set(gallery, dispose);
  }

  const scan = () => {
    if (!mobile.matches) {
      Array.from(mounted.values()).forEach(dispose => dispose());
      return;
    }
    for (const [gallery, dispose] of mounted) {
      if (!gallery.isConnected) dispose();
    }
    document.querySelectorAll('#MainContent[data-template="product"] media-gallery').forEach(mount);
  };

  const start = () => {
    scan();
    mobile.addEventListener('change', scan);
    document.addEventListener('shopify:section:load', scan);
    window.addEventListener('pageshow', scan);
    window.addEventListener('pagehide', () => {
      Array.from(mounted.values()).forEach(dispose => dispose());
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
