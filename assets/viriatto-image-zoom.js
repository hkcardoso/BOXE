if (!customElements.get('viriatto-image-zoom')) {
  customElements.define('viriatto-image-zoom', class extends HTMLElement {
    connectedCallback() {
      this.image = this.querySelector('img');
      this.button = this.querySelector('.vzoom-toggle');
      if (!this.image || !this.button || this.controller) return;
      this.controller = new AbortController();
      const options = { signal: this.controller.signal };
      this.originalSizes = this.image.getAttribute('sizes');
      this.button.addEventListener('click', (event) => {
        if (this.dragged) { this.dragged = false; return; }
        const zoomed = !this.hasAttribute('data-zoomed');
        this.setZoom(zoomed);
        if (zoomed) this.move(event.detail ? event : undefined);
      }, options);
      this.button.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && this.hasAttribute('data-zoomed')) {
          event.preventDefault();
          this.setZoom(false);
        }
      }, options);
      this.button.addEventListener('pointerdown', (event) => {
        this.dragged = false;
        this.pointerStart = { x: event.clientX, y: event.clientY };
        if (event.pointerType !== 'mouse' && this.hasAttribute('data-zoomed')) this.button.setPointerCapture(event.pointerId);
      }, options);
      this.button.addEventListener('pointermove', (event) => {
        if (!this.hasAttribute('data-zoomed')) return;
        if (event.pointerType !== 'mouse') {
          if (!this.button.hasPointerCapture(event.pointerId)) return;
          if (this.pointerStart && Math.hypot(event.clientX - this.pointerStart.x, event.clientY - this.pointerStart.y) > 8) this.dragged = true;
        }
        this.move(event);
      }, options);
      this.gallery = this.closest('media-gallery');
      if (this.gallery) {
        this.gallery.addEventListener('click', (event) => {
          if (event.target.closest('.thumbnail, [data-target]')) this.setZoom(false);
        }, options);
        this.gallery.addEventListener('slideChanged', () => this.setZoom(false), options);
      }
      const slide = this.closest('.product__media-item');
      if (slide) {
        this.observer = new MutationObserver(() => {
          if (!slide.classList.contains('is-active')) this.setZoom(false);
        });
        this.observer.observe(slide, { attributes: true, attributeFilter: ['class'] });
      }
    }
    setZoom(zoomed) {
      this.toggleAttribute('data-zoomed', zoomed);
      this.button.setAttribute('aria-pressed', String(zoomed));
      this.button.setAttribute('aria-label', zoomed ? this.button.dataset.zoomOut : this.button.dataset.zoomIn);
      if (zoomed) this.image.sizes = `${Math.ceil(this.getBoundingClientRect().width * 2.2)}px`;
      else {
        if (this.originalSizes === null) this.image.removeAttribute('sizes');
        else this.image.setAttribute('sizes', this.originalSizes);
        this.style.removeProperty('--zoom-x');
        this.style.removeProperty('--zoom-y');
      }
    }
    move(event) {
      const bounds = this.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const x = event ? (event.clientX - bounds.left) / bounds.width * 100 : 50;
      const y = event ? (event.clientY - bounds.top) / bounds.height * 100 : 50;
      this.style.setProperty('--zoom-x', `${Math.max(0, Math.min(100, x))}%`);
      this.style.setProperty('--zoom-y', `${Math.max(0, Math.min(100, y))}%`);
    }
    disconnectedCallback() {
      this.controller?.abort();
      this.controller = undefined;
      this.observer?.disconnect();
    }
  });
}
