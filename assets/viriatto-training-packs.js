if (!customElements.get('viriatto-training-packs')) {
  customElements.define('viriatto-training-packs', class extends HTMLElement {
    connectedCallback() {
      if (this.initialized) return;
      this.initialized = true;
      this.controller = new AbortController();
      const signal = this.controller.signal;
      const root = window.Shopify?.routes?.root || '/';
      const money = value => new Intl.NumberFormat(document.documentElement.lang || 'pt-PT', {style:'currency', currency:this.dataset.currency || 'EUR'}).format(value / 100);
      this.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => {
        const dialog = document.getElementById(button.dataset.open);
        dialog.showModal();
        dialog.addEventListener('close', () => button.focus(), {once:true});
      }, {signal}));
      this.querySelectorAll('dialog').forEach(dialog => {
        dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close(), {signal});
        dialog.addEventListener('click', event => {
          if (event.target !== dialog) return;
          const box = dialog.getBoundingClientRect();
          if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
        }, {signal});
        const form = dialog.querySelector('form');
        const variants = JSON.parse(form.querySelector('[data-variants]').textContent);
        const selects = [...form.querySelectorAll('[data-option]')];
        const submit = form.querySelector('[type=submit]');
        const status = form.querySelector('[role=status]');
        let busy = false;
        const current = () => variants.find(v => v.options.every((value,i) => value === selects[i].value));
        const update = () => {
          const variant = current();
          form.elements.id.value = variant?.id || '';
          form.querySelector('[data-price]').textContent = variant ? money(variant.price) : '—';
          submit.disabled = busy || !variant?.available;
          submit.textContent = busy ? this.dataset.adding : variant?.available ? this.dataset.add : this.dataset.unavailable;
        };
        selects.forEach(select => select.addEventListener('change', () => {status.textContent='';update();}, {signal}));
        update();
        form.addEventListener('submit', async event => {
          event.preventDefault();
          if (busy || !current()?.available) return;
          busy=true;status.textContent='';update();
          selects.forEach(select => select.disabled=true);
          try {
            const response = await fetch(root+'cart/add.js', {method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({items:[{id:Number(form.elements.id.value),quantity:1}]})});
            const result = await response.json();
            if (!response.ok || result.status) throw new Error(result.description || this.dataset.error);
            status.textContent=this.dataset.added;
            form.querySelector('.vp__cart').hidden=false;
            document.dispatchEvent(new CustomEvent('bx:cart:refresh'));
            if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') publish(PUB_SUB_EVENTS.cartUpdate, {source:'viriatto-packs'});
          } catch (error) {status.textContent=error.message || this.dataset.error;}
          finally {busy=false;selects.forEach(select => select.disabled=false);update();}
        }, {signal});
      });
      const video=this.querySelector('video');
      const toggle=this.querySelector('.vp__video-toggle');
      const reduced=matchMedia('(prefers-reduced-motion: reduce)');
      let manualPause=reduced.matches || !!navigator.connection?.saveData;
      const load=()=>{if (!video.src) {video.src=video.dataset.src;video.load();}};
      const play=()=>{load();video.play().catch(()=>{});};
      toggle.hidden=false;
      const updateToggle=()=>{toggle.textContent=video.paused?'▶':'Ⅱ';toggle.setAttribute('aria-label',video.paused?toggle.dataset.play:toggle.dataset.pause);};
      video.addEventListener('play',updateToggle,{signal});video.addEventListener('pause',updateToggle,{signal});
      toggle.addEventListener('click',()=>{if(video.paused){manualPause=false;play();}else{manualPause=true;video.pause();}}, {signal});
      this.observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting&&!manualPause)play();else video.pause();}}, {threshold:.15});
      this.observer.observe(video);
      document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();}, {signal});
    }
    disconnectedCallback(){this.controller?.abort();this.observer?.disconnect();this.querySelector('video')?.pause();this.initialized=false;}
  });
}
