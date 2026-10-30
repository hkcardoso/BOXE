if (!customElements.get('viriatto-training-video')) {
  customElements.define('viriatto-training-video', class extends HTMLElement {
    connectedCallback() {
      if (this.initialized) return;
      this.initialized = true;
      this.controller = new AbortController();
      const signal = this.controller.signal;
      const video = this.querySelector('video');
      const toggle = this.querySelector('[data-video-toggle]');
      if (!video || !toggle) return;
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let manuallyPaused = reducedMotion || Boolean(navigator.connection?.saveData);
      let inView = false;
      const update = () => {
        toggle.textContent = video.paused ? '▶' : 'Ⅱ';
        toggle.setAttribute('aria-label', video.paused ? this.dataset.play : this.dataset.pause);
      };
      const play = () => {
        if (!video.src) { video.src = video.dataset.src; video.load(); }
        const result = video.play();
        if (result && typeof result.catch === 'function') result.catch(() => { update(); });
      };
      toggle.hidden = false;
      video.addEventListener('play', update, {signal});
      video.addEventListener('pause', update, {signal});
      toggle.addEventListener('click', () => {
        if (video.paused) { manuallyPaused = false; play(); }
        else { manuallyPaused = true; video.pause(); }
      }, {signal});
      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver(entries => {
          for (const entry of entries) {
            inView = entry.isIntersecting;
            if (inView && !manuallyPaused && !document.hidden) play();
            else video.pause();
          }
        }, {threshold: .12});
        this.observer.observe(video);
      } else {
        inView = true;
        if (!manuallyPaused) play();
      }
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) video.pause();
        else if (inView && !manuallyPaused) play();
      }, {signal});
      update();
    }
    disconnectedCallback() {
      this.controller?.abort();
      this.observer?.disconnect();
      this.querySelector('video')?.pause();
      this.initialized = false;
    }
  });
}
