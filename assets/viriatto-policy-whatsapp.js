/*
 * VIRIATTO — Replace the legacy, non-editable Shopify policy phone display
 * with the current WhatsApp contact on the public storefront.
 *
 * The original Shopify policy records require write_legal_policies permission.
 * This is a storefront-only enhancement, scoped to the two affected policy pages.
 */
(() => {
  const whatsAppUrl = 'https://wa.me/351910073534?s=p';
  const policyPattern = /\/policies\/(?:contact-information|legal-notice)\/?$/i;
  const outdatedNumber = /962[\s.\-]*554[\s.\-]*595/g;

  if (!policyPattern.test(window.location.pathname)) return;

  function applyPolicyContactLink() {
    const root = document.querySelector('.shopify-policy__body') || document.querySelector('#MainContent');
    if (!root) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const matchingNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      if (!outdatedNumber.test(node.nodeValue || '')) continue;
      outdatedNumber.lastIndex = 0;
      if (node.parentElement?.closest('a, script, style, textarea')) continue;
      matchingNodes.push(node);
    }

    for (const textNode of matchingNodes) {
      const original = textNode.nodeValue || '';
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      for (const match of original.matchAll(outdatedNumber)) {
        if (match.index > lastIndex) {
          fragment.appendChild(document.createTextNode(original.slice(lastIndex, match.index)));
        }
        const link = document.createElement('a');
        link.href = whatsAppUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = '+351 910 073 534';
        link.setAttribute('aria-label', 'Contactar a VIRIATTO pelo WhatsApp: +351 910 073 534');
        fragment.appendChild(link);
        lastIndex = match.index + match[0].length;
      }
      fragment.appendChild(document.createTextNode(original.slice(lastIndex)));
      textNode.parentNode?.replaceChild(fragment, textNode);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyPolicyContactLink, { once: true });
  } else {
    applyPolicyContactLink();
  }
})();
