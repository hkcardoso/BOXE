/* BOXEUP: hover cart preview + cart page interactions */
(() => {
  const onReady = fn => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded',fn,{once:true}) : fn();
  onReady(() => {
    const root = window.Shopify?.routes?.root || '/';
    const hover = document.querySelector('[data-bx-cart-hover]');
    const page = document.querySelector('[data-bx-cart-page]');
    const cartUrl = hover?.dataset.bxJsonUrl || root + 'cart.js';
    const changeUrl = hover?.dataset.bxChangeUrl || root + 'cart/change.js';
    const currency = hover?.dataset.bxCurrency || window.Shopify?.currency?.active || 'EUR';
    const locale = hover?.dataset.bxLocale || document.documentElement.lang || 'pt-PT';
    const money = amount => {
      try { return new Intl.NumberFormat(locale,{style:'currency',currency}).format((Number(amount)||0)/100); }
      catch { return ((Number(amount)||0)/100).toFixed(2)+' '+currency; }
    };
    const fetchCart = async () => {
      const r = await fetch(cartUrl,{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});
      if (!r.ok) throw Error('Cart unavailable');
      return r.json();
    };
    const changeCart = async data => {
      const r = await fetch(changeUrl,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(data)});
      const json = await r.json();
      if (!r.ok || json.status) throw Error(json.description || json.message || 'Cart update failed');
      return json;
    };
    if (hover) {
      const icon = hover.querySelector('#cart-icon-bubble');
      const panel = hover.querySelector('[data-bx-cart-preview]');
      const items = hover.querySelector('[data-bx-cart-items]');
      const count = hover.querySelector('[data-bx-cart-count]');
      const total = hover.querySelector('[data-bx-cart-total]');
      const status = hover.querySelector('[data-bx-cart-status]');
      const emptyLabel = hover.querySelector('[data-bx-cart-empty]')?.textContent || '';
      const error = hover.dataset.bxError || 'Erro ao atualizar o carrinho';
      const label = hover.dataset.bxItems || 'artigos';
      let timer, busy = false;
      const btn = (text,fn,cls) => {
        const b = document.createElement('button'); b.type = 'button';b.className = cls;b.textContent = text;b.addEventListener('click',fn);return b;
      };
      const refreshCount = cart => {
        let bubble = icon.querySelector('.cart-count-bubble');
        if (!cart.item_count) { bubble?.remove(); return; }
        if (!bubble) { bubble = document.createElement('div');bubble.className = 'cart-count-bubble';icon.append(bubble); }
        bubble.replaceChildren();
        const num = document.createElement('span');num.setAttribute('aria-hidden','true');num.textContent = cart.item_count < 100 ? String(cart.item_count) : '99+';
        const sr = document.createElement('span');sr.className = 'visually-hidden';sr.textContent = cart.item_count+' '+label;
        bubble.append(num,sr);
      };
      const render = cart => {
        items.replaceChildren();
        count.textContent = cart.item_count+' '+label;
        total.textContent = money(cart.total_price);
        hover.classList.toggle('bx-cart-hover--empty',!cart.item_count);
        refreshCount(cart);
        if (!cart.items?.length) {
          const p = document.createElement('p');p.className = 'bx-cart-preview__empty';p.textContent = emptyLabel;items.append(p);return;
        }
        for (const item of cart.items.slice(0,4)) {
          const row = document.createElement('div');row.className = 'bx-cart-preview__item';
          const photo = document.createElement('a');photo.className = 'bx-cart-preview__photo';photo.href = item.url || '#';
          if (item.image || item.featured_image?.url) {
            const img = document.createElement('img');img.src = item.image || item.featured_image.url;img.alt = item.product_title || '';img.loading = 'lazy';photo.append(img);
          }
          const detail = document.createElement('div');detail.className = 'bx-cart-preview__detail';
          const name = document.createElement('a');name.className = 'bx-cart-preview__name';name.href = item.url || '#';name.textContent = item.product_title || item.title;
          const variant = document.createElement('small');variant.className = 'bx-cart-preview__variant';variant.textContent = item.variant_title === 'Default Title' ? '' : (item.variant_title || '');
          const controls = document.createElement('div');controls.className = 'bx-cart-preview__controls';
          const qty = document.createElement('div');qty.className = 'bx-cart-preview__qty';
          const update = async n => {
            if (busy) return;busy = true;hover.classList.add('bx-cart-hover--busy');
            try {const updated = await changeCart({id:item.key,quantity:n});render(updated);status.textContent = updated.item_count+' '+label;}
            catch {status.textContent = error;window.alert(error);}
            finally {busy=false;hover.classList.remove('bx-cart-hover--busy');}
          };
          const minus = btn('−',()=>update(item.quantity-1),'bx-cart-preview__qty-button');minus.disabled = item.quantity<=1;
          const plus = btn('+',()=>update(item.quantity+1),'bx-cart-preview__qty-button');
          const quantity = document.createElement('span');quantity.textContent = String(item.quantity);
          qty.append(minus,quantity,plus);
          const remove = btn('×',()=>update(0),'bx-cart-preview__remove');remove.setAttribute('aria-label',hover.dataset.bxRemove || 'Remover');
          const price = document.createElement('strong');price.className = 'bx-cart-preview__price';price.textContent = money(item.final_line_price);
          controls.append(qty,remove,price);detail.append(name,variant,controls);row.append(photo,detail);items.append(row);
        }
        if (cart.items.length>4) {const more = document.createElement('p');more.className='bx-cart-preview__additional';more.textContent='+'+(cart.items.length-4)+' '+label;items.append(more);}
      };
      const open = () => {
        if (!window.matchMedia('(min-width:990px) and (hover:hover)').matches) return;
        clearTimeout(timer);hover.classList.add('bx-cart-hover--open');panel.setAttribute('aria-hidden','false');
        fetchCart().then(render).catch(()=>{status.textContent=error;});
      };
      const close = () => {
        timer=setTimeout(()=>{if (hover.contains(document.activeElement))return;hover.classList.remove('bx-cart-hover--open');panel.setAttribute('aria-hidden','true');},160);
      };
      hover.addEventListener('mouseenter',open);hover.addEventListener('mouseleave',close);
      hover.addEventListener('focusin',open);hover.addEventListener('focusout',close);
      hover.addEventListener('keydown',e=>{if(e.key==='Escape'){hover.classList.remove('bx-cart-hover--open');panel.setAttribute('aria-hidden','true');icon.focus();}});
      document.addEventListener('bx:cart:refresh',()=>fetchCart().then(render).catch(()=>{}));
    }
    if(page) {
      let busy=false;
      page.addEventListener('click',async e=>{
        const control=e.target.closest('[data-bx-cart-delta],[data-bx-cart-remove]');
        if(!control || busy)return;
        const item=control.closest('[data-bx-cart-line]');if(!item)return;
        e.preventDefault();busy=true;page.classList.add('bx-cart-page--busy');
        const quantity=control.hasAttribute('data-bx-cart-remove')?0:Math.max(0,Number(item.dataset.bxCartQuantity)+Number(control.dataset.bxCartDelta));
        try {await changeCart({line:Number(item.dataset.bxCartLine),quantity});location.reload();}
        catch {busy=false;page.classList.remove('bx-cart-page--busy');window.alert(page.dataset.bxError || 'Erro ao atualizar o carrinho');}
      });
      const discount=page.querySelector('[data-bx-discount-form]');
      discount?.addEventListener('submit',e=>{
        e.preventDefault();const input=discount.querySelector('input');const code=input.value.trim();if(!code){input.focus();return;}
        location.assign(root+'discount/'+encodeURIComponent(code)+'?redirect='+encodeURIComponent(page.dataset.bxCartUrl || root+'cart'));
      });
    }
  });
})();