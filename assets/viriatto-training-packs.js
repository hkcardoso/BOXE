if (!customElements.get('viriatto-charlie-pack')) {
  customElements.define('viriatto-charlie-pack', class extends HTMLElement {
    connectedCallback() {
      if (this.initialized) return;
      this.initialized = true;
      const form = this.querySelector('[data-pack-form]');
      if (!form) return;
      this.controller = new AbortController();
      const signal = this.controller.signal;
      const gloves = form.querySelector('[data-pack-gloves]');
      const garment = form.querySelector('[data-pack-garment]');
      const accessory = form.querySelector('[data-pack-accessory]');
      const button = form.querySelector('[data-pack-submit]');
      const status = form.querySelector('[data-pack-status]');
      const root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
      let busy = false;
      const selectedIsAvailable = select => Boolean(select && select.selectedOptions.length && select.selectedOptions[0].dataset.available === 'true');
      const available = () => selectedIsAvailable(gloves) && selectedIsAvailable(garment) && accessory.dataset.available === 'true';
      const update = () => {
        button.disabled = busy || !available();
        button.firstChild.textContent = busy ? this.dataset.adding + ' ' : available() ? this.dataset.add + ' ' : this.dataset.unavailable + ' ';
      };
      gloves.addEventListener('change', () => { status.textContent=''; update(); }, { signal });
      garment.addEventListener('change', () => { status.textContent=''; update(); }, { signal });
      update();
      form.addEventListener('submit', async event => {
        event.preventDefault();
        if (busy || !available()) return;
        busy = true;
        status.textContent = '';
        update();
        try {
          const items = [
            { id: Number(gloves.value), quantity: 1 },
            { id: Number(accessory.value), quantity: 1 },
            { id: Number(garment.value), quantity: 1 }
          ];
          if (items.some(item => !Number.isSafeInteger(item.id))) throw new Error(this.dataset.error);
          const response = await fetch(root + 'cart/add.js', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ items })
          });
          const result = await response.json();
          if (!response.ok || result.status) throw new Error(result.description || this.dataset.error);
          const redirect = root + 'cart';
          const discount = this.dataset.discountCode;
          window.location.assign(root + 'discount/' + encodeURIComponent(discount) + '?redirect=' + encodeURIComponent(redirect));
        } catch (error) {
          status.textContent = error.message || this.dataset.error;
          busy = false;
          update();
        }
      }, { signal });
    }
    disconnectedCallback() {
      if (this.controller) this.controller.abort();
      this.initialized = false;
    }
  });
}
