(() => {
  const wrap = (value, duration) => ((value % duration) + duration) % duration;

  const init = () => document.querySelectorAll('.vh-brands__viewport').forEach(viewport => {
    if (viewport.dataset.touchReady) return;
    viewport.dataset.touchReady = 'true';

    const track = viewport.querySelector('.vh-brands__track');
    if (!track) return;

    let gesture = null;
    let inertiaFrame = 0;
    let resumeTimer = 0;
    let blockClick = false;

    const cancelMotion = () => {
      cancelAnimationFrame(inertiaFrame);
      clearTimeout(resumeTimer);
      inertiaFrame = 0;
    };

    const resume = (animation, delay = 80) => {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        if (!gesture) animation.play();
      }, delay);
    };

    const advance = (animation, pixels, width, duration) => {
      animation.currentTime = wrap(Number(animation.currentTime || 0) + pixels / width * duration, duration);
    };

    viewport.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' || !event.isPrimary) return;

      const animation = track.getAnimations()[0];
      if (!animation) return; // Reduced-motion mode uses native scrolling.

      cancelMotion();
      blockClick = false;
      animation.pause();

      gesture = {
        id: event.pointerId,
        animation,
        width: track.firstElementChild?.getBoundingClientRect().width || 0,
        duration: Number(animation.effect?.getTiming().duration) || 0,
        startX: event.clientX,
        startTime: Number(animation.currentTime || 0),
        dragged: false,
        samples: [{ x: event.clientX, t: event.timeStamp }]
      };
    }, { passive: true });

    window.addEventListener('pointermove', event => {
      const current = gesture;
      if (!current || event.pointerId !== current.id) return;
      const distance = current.startX - event.clientX;
      if (!current.dragged && Math.abs(distance) > 8) current.dragged = true;
      if (!current.dragged || !current.width || !current.duration) return;

      current.animation.currentTime = wrap(current.startTime + distance / current.width * current.duration, current.duration);
      current.samples.push({ x: event.clientX, t: event.timeStamp });
      while (current.samples.length > 2 && current.samples[0].t < event.timeStamp - 95) {
        current.samples.shift();
      }
    }, { passive: true });

    const release = (event, cancelled = false) => {
      const current = gesture;
      if (!current || event.pointerId !== current.id) return;
      gesture = null;

      if (cancelled || !current.dragged || !current.width || !current.duration) {
        resume(current.animation);
        return;
      }

      blockClick = true;
      current.samples.push({ x: event.clientX, t: event.timeStamp });
      while (current.samples.length > 2 && current.samples[0].t < event.timeStamp - 95) {
        current.samples.shift();
      }

      const first = current.samples[0];
      const last = current.samples[current.samples.length - 1];
      const elapsed = Math.max(1, last.t - first.t);
      let velocity = Math.max(-2.3, Math.min(2.3, (first.x - last.x) / elapsed)); // px/ms

      if (Math.abs(velocity) < 0.065) {
        resume(current.animation);
        return;
      }

      let lastFrame = null;
      let totalTime = 0;
      const coast = now => {
        if (lastFrame === null) lastFrame = now;
        const dt = Math.min(40, Math.max(0, now - lastFrame));
        lastFrame = now;
        totalTime += dt;

        // Exponential friction keeps the release speed continuous, then eases out.
        advance(current.animation, velocity * 330 * (1 - Math.exp(-dt / 330)), current.width, current.duration);
        velocity *= Math.exp(-dt / 330);

        if (Math.abs(velocity) >= 0.065 && totalTime < 1400) {
          inertiaFrame = requestAnimationFrame(coast);
        } else {
          inertiaFrame = 0;
          resume(current.animation);
        }
      };
      inertiaFrame = requestAnimationFrame(coast);
    };

    window.addEventListener('pointerup', event => release(event));
    window.addEventListener('pointercancel', event => release(event, true));

    viewport.addEventListener('click', event => {
      if (!blockClick) return;
      event.preventDefault();
      event.stopPropagation();
      blockClick = false;
    }, true);
  });

  init();
  document.addEventListener('shopify:section:load', init);
})();
