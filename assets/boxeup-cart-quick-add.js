/* BOXEUP: Simple-variant featured products open the native Shopify cart drawer.
   Products with multiple variants still lead to their full product page. */
(() => {
  document.addEventListener('submit', async (event) => {
    const form = event.target.closest('form[data-boxeup-quick-add="true"]');
    if (!form) return;
    const drawer = document.querySelector('cart-drawer');
    if (!drawer) return; // Native form fallback when drawer mode is disabled.
    event.preventDefault();
    const button = form.querySelector('[type="submit"]');
    if (button?.disabled) return;
    if (button) button.disabled = true;
    try {
      const formData = new FormData(form);
      formData.set('sections', drawer.getSectionsToRender().map((section) => section.id).join(','));
      formData.set('sections_url', window.location.pathname);
      const request = fetchConfig('javascript');
      request.headers['X-Requested-With'] = 'XMLHttpRequest';
      delete request.headers['Content-Type'];
      request.body = formData;
      const response = await fetch(routes.cart_add_url, request);
      const cart = await response.json();
      if (!response.ok || cart.status || !cart.sections) {
        throw new Error(cart.description || cart.message || 'Não foi possível adicionar o artigo.');
      }
      drawer.setActiveElement(button);
      drawer.renderContents(cart);
    } catch (error) {
      const label = form.querySelector('[data-boxeup-quick-add-status]');
      if (label) label.textContent = error.message;
      else window.alert(error.message || 'Não foi possível atualizar o carrinho.');
    } finally {
      if (button) button.disabled = false;
    }
  });
})();
