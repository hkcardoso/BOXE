/* Native horizontal scrolling keeps every logo clickable and swipeable. */
if (!customElements.get('viriatto-brand-marquee')) {
  customElements.define('viriatto-brand-marquee', class extends HTMLElement {
    connectedCallback() {
      if (this.initialized) return;
      this.initialized = true;
      this.controller = new AbortController();
      const signal = this.controller.signal;
      this.original = this.querySelector('[data-brand-original]');
      if (!this.original) return;

      const clone = () => {
        const copy = this.original.cloneNode(true);
        copy.removeAttribute('data-brand-original');
        copy.setAttribute('aria-hidden', 'true');
        copy.querySelectorAll('a').forEach(a => { a.tabIndex = -1; });
        return copy;
      };
      this.before = clone();
      this.insertBefore(this.before, this.original);
      this.after = [clone(), clone()];
      this.after.forEach(group => this.appendChild(group));

      let period = 0;
      let inView = true;
      let hovered = false;
      let focused = false;
      let touchActive = false;
      let dragging = false;
      let dragged = false;
      let pointerStart = 0;
      let scrollStart = 0;
      let pauseUntil = 0;
      let lastFrame = 0;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
      const speed = Number(this.dataset.speed) || 28;

      const measure = () => {
        period = this.original.offsetLeft - this.before.offsetLeft;
        if (!(period > 0)) {
          period = this.original.getBoundingClientRect().width +
            parseFloat(getComputedStyle(this).columnGap || '0');
        }
        if (period > 0) this.scrollLeft = period;
      };
      const normalize = () => {
        if (!(period > 0)) return;
        let value = this.scrollLeft;
        while (value < period) value += period;
        while (value >= period * 2) value -= period;
        if (Math.abs(value - this.scrollLeft) > .5) this.scrollLeft = value;
      };
      const animate = now => {
        const elapsed = lastFrame ? Math.min(60, now - lastFrame) : 16;
        lastFrame = now;
        if (!reduced.matches && inView && !document.hidden &&
            !hovered && !focused && !touchActive && !dragging &&
            now >= pauseUntil && period > 0) {
          normalize();
          let next = this.scrollLeft + speed * elapsed / 1000;
          if (next >= period * 2) next -= period;
          this.scrollLeft = next;
        }
        this.frame = requestAnimationFrame(animate);
      };
      this.addEventListener('pointerenter', event => {
        if (event.pointerType === 'mouse') hovered = true;
      }, {signal});
      this.addEventListener('pointerleave', event => {
        if (event.pointerType === 'mouse') hovered = false;
      }, {signal});
      this.addEventListener('focusin', () => { focused = true; }, {signal});
      this.addEventListener('focusout', event => {
        if (!this.contains(event.relatedTarget)) focused = false;
      }, {signal});
      this.addEventListener('pointerdown', event => {
        if (event.pointerType !== 'mouse') {
          touchActive = true;
          pauseUntil = performance.now() + 1600;
          return;
        }
        if (event.button !== 0) return;
        dragging = true;
        dragged = false;
        pointerStart = event.clientX;
        scrollStart = this.scrollLeft;
      }, {signal});
      window.addEventListener('pointermove', event => {
        if (!dragging || event.pointerType !== 'mouse') return;
        const distance = event.clientX - pointerStart;
        if (Math.abs(distance) < 6 && !dragged) return;
        dragged = true;
        this.classList.add('is-dragging');
        this.scrollLeft = scrollStart - distance;
        if (event.cancelable) event.preventDefault();
      }, {signal, passive:false});
      const endPointer = event => {
        if (event.pointerType !== 'mouse') {
          touchActive = false;
          pauseUntil = performance.now() + 1700;
        } else if (dragging) {
          dragging = false;
          this.classList.remove('is-dragging');
          pauseUntil = performance.now() + 450;
        }
      };
      window.addEventListener('pointerup', endPointer, {signal});
      window.addEventListener('pointercancel', endPointer, {signal});
      this.addEventListener('click', event => {
        if (dragged) {
          event.preventDefault();
          event.stopPropagation();
          dragged = false;
        }
      }, {signal, capture:true});
      if ('ResizeObserver' in window) {
        this.resizeObserver = new ResizeObserver(measure);
        this.resizeObserver.observe(this);
      }
      if ('IntersectionObserver' in window) {
        this.intersectionObserver = new IntersectionObserver(entries => {
          inView = entries[0]?.isIntersecting ?? false;
        }, {threshold:0});
        this.intersectionObserver.observe(this);
      }
      measure();
      this.frame = requestAnimationFrame(animate);
    }
    disconnectedCallback() {
      this.controller?.abort();
      cancelAnimationFrame(this.frame);
      this.resizeObserver?.disconnect();
      this.intersectionObserver?.disconnect();
      this.before?.remove();
      this.after?.forEach(group => group.remove());
      this.classList.remove('is-dragging');
      this.initialized = false;
    }
  });
}
