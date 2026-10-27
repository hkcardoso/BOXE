if (!customElements.get('quick-add-modal')) {
  customElements.define(
    'quick-add-modal',
    class QuickAddModal extends ModalDialog {
      constructor() {
        super();
        this.modalContent = this.querySelector('[id^="QuickAddInfo-"]');

        // Thumbnail selection is delegated so it survives variant changes.
        this.addEventListener('click', (event) => {
          const thumbnail = event.target.closest('[data-bxq-thumbnail]');
          if (!thumbnail) return;
          const gallery = thumbnail.closest('.bxq-gallery');
          const preview = gallery?.querySelector('.bxq-gallery__main img');
          if (!preview) return;
          preview.src = thumbnail.dataset.imageSrc;
          if (thumbnail.dataset.imageSrcset) preview.srcset = thumbnail.dataset.imageSrcset;
          else preview.removeAttribute('srcset');
          preview.alt = thumbnail.dataset.imageAlt || '';
          gallery.querySelectorAll('[data-bxq-thumbnail]').forEach((button) => {
            button.setAttribute('aria-pressed', String(button === thumbnail));
          });
        });

        this.addEventListener('product-info:loaded', ({ target }) => {
          target.addPreProcessCallback(this.preprocessHTML.bind(this));
        });
      }

      hide(preventFocus = false) {
        const cartNotification = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        if (cartNotification) cartNotification.setActiveElement(this.openedBy);
        this.modalContent.innerHTML = '';

        if (preventFocus) this.openedBy = null;
        super.hide();
      }

      show(opener) {
        opener.setAttribute('aria-disabled', true);
        opener.classList.add('loading');
        opener.querySelector('.loading__spinner').classList.remove('hidden');

        fetch(opener.getAttribute('data-product-url'))
          .then((response) => response.text())
          .then((responseText) => {
            const responseHTML = new DOMParser().parseFromString(responseText, 'text/html');
            const productElement = responseHTML.querySelector('product-info');

            this.preprocessHTML(productElement);
            HTMLUpdateUtility.setInnerHTML(this.modalContent, productElement.outerHTML);

            if (window.Shopify && Shopify.PaymentButton) {
              Shopify.PaymentButton.init();
            }
            if (window.ProductModel) window.ProductModel.loadShopifyXR();

            this.modalContent.querySelector('product-component')?.dispatchViewEvent?.();

            super.show(opener);
          })
          .finally(() => {
            opener.removeAttribute('aria-disabled');
            opener.classList.remove('loading');
            opener.querySelector('.loading__spinner').classList.add('hidden');
          });
      }

      preprocessHTML(productElement) {
        productElement.classList.forEach((classApplied) => {
          if (classApplied.startsWith('color-') || classApplied === 'gradient')
            this.modalContent.classList.add(classApplied);
        });
        this.preventDuplicatedIDs(productElement);
        this.removeDOMElements(productElement);
        this.removeGalleryListSemantic(productElement);
        this.updateImageSizes(productElement);
        this.preventVariantURLSwitching(productElement);
        this.prepareCompactProduct(productElement);
      }

      prepareCompactProduct(productElement) {
        if (!productElement) return;
        const product = productElement.querySelector('.product');
        const mediaWrapper = product?.querySelector('.product__media-wrapper');
        const info = product?.querySelector('.product__info-container');
        if (!product || !mediaWrapper || !info) return;

        product.classList.add('bxq-product');

        // Native media-gallery stays in the DOM (for Shopify variant/media handling)
        // but a smaller read-only preview and accessible thumbnail buttons are shown.
        const originals = [...mediaWrapper.querySelectorAll('.product__media-list .product__media-item img')];
        const images = [];
        const seen = new Set();
        originals.forEach((original) => {
          const src = original.getAttribute('src');
          const mediaId = original.closest('[data-media-id]')?.dataset.mediaId || src;
          if (!src || seen.has(mediaId) || images.length >= 6) return;
          seen.add(mediaId);
          images.push({
            src,
            srcset: original.getAttribute('srcset') || '',
            alt: original.getAttribute('alt') || ''
          });
        });

        if (images.length) {
          const gallery = document.createElement('div');
          gallery.className = 'bxq-gallery';
          const imageFrame = document.createElement('div');
          imageFrame.className = 'bxq-gallery__main';
          const main = document.createElement('img');
          main.src = images[0].src;
          if (images[0].srcset) main.srcset = images[0].srcset;
          main.alt = images[0].alt;
          main.loading = 'eager';
          imageFrame.appendChild(main);
          gallery.appendChild(imageFrame);

          if (images.length > 1) {
            const thumbs = document.createElement('div');
            thumbs.className = 'bxq-gallery__thumbs';
            thumbs.setAttribute('aria-label', document.documentElement.lang.startsWith('en') ? 'Product photos' : 'Fotografias do produto');
            images.forEach((image, index) => {
              const button = document.createElement('button');
              button.type = 'button';
              button.className = 'bxq-gallery__thumb';
              button.dataset.bxqThumbnail = '';
              button.dataset.imageSrc = image.src;
              button.dataset.imageSrcset = image.srcset;
              button.dataset.imageAlt = image.alt;
              button.setAttribute('aria-label', String(index + 1));
              button.setAttribute('aria-pressed', String(index === 0));
              const thumbnail = document.createElement('img');
              thumbnail.src = image.src;
              thumbnail.alt = '';
              thumbnail.loading = 'lazy';
              button.appendChild(thumbnail);
              thumbs.appendChild(button);
            });
            gallery.appendChild(thumbs);
          }
          mediaWrapper.prepend(gallery);
        }

        // Keep Shopify's native price/variant picker/quantity/product-form intact.
        // Hide the remaining full-page blocks only in the compact popup.
        [...info.children].forEach((child) => {
          const essential =
            child.matches('.product__text, .product__title, .bxp-product-intro, variant-selects, [id^="price-"], [id^="Quantity-Form"]') ||
            child.querySelector(':scope > product-form');
          if (!essential) child.classList.add('bxq-extra');
        });

        const details = document.createElement('a');
        details.className = 'bxq-details-link';
        details.href = productElement.dataset.url || '#';
        const locale = document.documentElement.lang.toLowerCase();
        details.textContent = locale.startsWith('es') ? 'Ver detalles del producto' :
          locale.startsWith('en') ? 'View full product details' : 'Ver todos os detalhes';
        info.appendChild(details);
      }

      preventVariantURLSwitching(productElement) {
        productElement.setAttribute('data-update-url', 'false');
      }

      removeDOMElements(productElement) {
        const pickupAvailability = productElement.querySelector('pickup-availability');
        if (pickupAvailability) pickupAvailability.remove();

        const productModal = productElement.querySelector('product-modal');
        if (productModal) productModal.remove();

        const modalDialog = productElement.querySelectorAll('modal-dialog');
        if (modalDialog) modalDialog.forEach((modal) => modal.remove());
      }

      preventDuplicatedIDs(productElement) {
        const sectionId = productElement.dataset.section;

        const oldId = sectionId;
        const newId = `quickadd-${sectionId}`;
        productElement.innerHTML = productElement.innerHTML.replaceAll(oldId, newId);
        Array.from(productElement.attributes).forEach((attribute) => {
          if (attribute.value.includes(oldId)) {
            productElement.setAttribute(attribute.name, attribute.value.replace(oldId, newId));
          }
        });

        productElement.dataset.originalSection = sectionId;
      }

      removeGalleryListSemantic(productElement) {
        const galleryList = productElement.querySelector('[id^="Slider-Gallery"]');
        if (!galleryList) return;

        galleryList.setAttribute('role', 'presentation');
        galleryList.querySelectorAll('[id^="Slide-"]').forEach((li) => li.setAttribute('role', 'presentation'));
      }

      updateImageSizes(productElement) {
        const product = productElement.querySelector('.product');
        const desktopColumns = product?.classList.contains('product--columns');
        if (!desktopColumns) return;

        const mediaImages = product.querySelectorAll('.product__media img');
        if (!mediaImages.length) return;

        let mediaImageSizes =
          '(min-width: 1000px) 715px, (min-width: 750px) calc((100vw - 11.5rem) / 2), calc(100vw - 4rem)';

        if (product.classList.contains('product--medium')) {
          mediaImageSizes = mediaImageSizes.replace('715px', '605px');
        } else if (product.classList.contains('product--small')) {
          mediaImageSizes = mediaImageSizes.replace('715px', '495px');
        }

        mediaImages.forEach((img) => img.setAttribute('sizes', mediaImageSizes));
      }
    }
  );
}
