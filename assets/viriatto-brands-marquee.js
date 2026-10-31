/* The CSS animation works without this script. JavaScript only enables manual dragging. */
(() => {
  const init = rail => {
    if (rail.dataset.brandReady) return;
    rail.dataset.brandReady = 'true';
    const controller = new AbortController();
    const signal = controller.signal;
    let dragging = false;
    let moved = false;
    let startX = 0;
    let initialScroll = 0;
    let resumeTimer;

    const pause = () => {
      window.clearTimeout(resumeTimer);
      rail.classList.add('is-interacting');
    };
    const resume = (delay = 1400) => {
      window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => {
        if (!dragging && !rail.matches(':focus-within')) rail.classList.remove('is-interacting');
      }, delay);
    };
    rail.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse') {pause(); return;}
      if (event.button !== 0) return;
      dragging = true;
      moved = false;
      startX = event.clientX;
      initialScroll = rail.scrollLeft;
      pause();
    }, {signal});
    window.addEventListener('pointermove', event => {
      if (!dragging || event.pointerType !== 'mouse') return;
      const distance = event.clientX - startX;
      if (Math.abs(distance) < 6 && !moved) return;
      moved = true;
      rail.classList.add('is-dragging');
      rail.scrollLeft = initialScroll - distance;
      if (event.cancelable) event.preventDefault();
    }, {signal,passive:false});
    const release = event => {
      if (event.pointerType === 'mouse') {
        if (!dragging) return;
        dragging = false;
        rail.classList.remove('is-dragging');
        resume(600);
      } else resume(1700);
    };
    window.addEventListener('pointerup', release, {signal});
    window.addEventListener('pointercancel', release, {signal});
    rail.addEventListener('touchstart', pause, {signal,passive:true});
    rail.addEventListener('touchend', () => resume(1800), {signal,passive:true});
    rail.addEventListener('touchcancel', () => resume(700), {signal,passive:true});
    rail.addEventListener('click', event => {
      if (!moved) return;
      event.preventDefault();
      event.stopPropagation();
      moved = false;
    }, {signal,capture:true});
    rail.addEventListener('focusout', () => resume(300), {signal});
    window.addEventListener('pagehide', () => {
      window.clearTimeout(resumeTimer);
      controller.abort();
    }, {signal,once:true});
  };
  const run = () => document.querySelectorAll('[data-viriatto-brand-rail]').forEach(init);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',run,{once:true});
  else run();
  document.addEventListener('shopify:section:load', run);
})();
