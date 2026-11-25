(() => {
  const init = root => root.querySelectorAll('.viri-values-marquee').forEach(strip => {
    const button = strip.querySelector('.viri-values-marquee__pause');
    if (!button || button.dataset.ready) return;
    button.dataset.ready = 'true';
    button.hidden = false;
    const lang = document.documentElement.lang.slice(0, 2);
    const labels = lang === 'en' ? ['Pause animation','Resume animation'] :
      lang === 'es' ? ['Pausar animación','Reanudar animación'] : ['Pausar animação','Retomar animação'];
    button.addEventListener('click', () => {
      const paused = strip.classList.toggle('is-paused');
      button.setAttribute('aria-pressed', String(paused));
      button.setAttribute('aria-label', labels[paused ? 1 : 0]);
      button.firstElementChild.textContent = paused ? '▶' : 'Ⅱ';
    });
  });
  init(document);
  document.addEventListener('shopify:section:load', event => init(event.target));
})();
