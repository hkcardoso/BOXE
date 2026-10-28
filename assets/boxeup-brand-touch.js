(() => {
  const init = () => document.querySelectorAll('.vh-brands__viewport').forEach(viewport => {
    if (viewport.dataset.touchReady) return;
    viewport.dataset.touchReady = 'true';
    const track = viewport.querySelector('.vh-brands__track');
    let gesture, resume, dragged = false;
    viewport.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse') return;
      clearTimeout(resume);
      dragged = false;
      const animation = track.getAnimations()[0];
      if (!animation) return;
      animation.pause();
      gesture = { x: event.clientX, time: Number(animation.currentTime || 0), animation };
    });
    viewport.addEventListener('pointermove', event => {
      if (!gesture) return;
      const delta = gesture.x - event.clientX;
      if (Math.abs(delta) > 8) dragged = true;
      if (!dragged) return;
      const width = track.firstElementChild.getBoundingClientRect().width;
      const duration = Number(gesture.animation.effect.getTiming().duration);
      if (width && duration) gesture.animation.currentTime = ((gesture.time + delta / width * duration) % duration + duration) % duration;
    });
    const release = () => {
      if (!gesture) return;
      const animation = gesture.animation;
      gesture = null;
      resume = setTimeout(() => animation.play(), 1000);
    };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    viewport.addEventListener('click', event => {
      if (!dragged) return;
      event.preventDefault();
      event.stopPropagation();
      dragged = false;
    }, true);
  });
  init();
  document.addEventListener('shopify:section:load', init);
})();
