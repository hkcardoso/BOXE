/* Cores identificadas nas fotografias da tarifa Charlie 2026–2027.
   Indicam opções de catálogo, não stock confirmado por cor ou peso. */
(() => {
  const colorsById = {
    0: ["Preto/Dourado","Branco/Preto","Verde/Dourado","Vermelho/Branco","Preto/Branco","Azul/Branco","Vermelho/Amarelo"],
    1: ["Cinzento/Branco","Preto/Branco","Vermelho/Branco","Branco/Preto"],
    2: ["Azul-escuro (sem faixa)","Vermelho (sem faixa)","Azul-escuro/Branco (com faixa)","Vermelho/Branco (com faixa)"],
    3: ["Preto","Branco"],
    4: ["Verde/Vermelho"],
    5: ["Preto/Dourado"],
    6: ["Preto/Branco","Azul/Preto","Branco/Preto","Vermelho/Preto","Amarelo/Preto"],
    7: ["Azul","Rosa","Preto","Branco","Vermelho","Castanho/Dourado"],
    8: ["Azul-claro","Verde-militar","Preto","Vermelho/Laranja","Cinzento-escuro","Verde-lima","Roxo","Bordeaux"],
    9: ["Verde/Vermelho"],
    10: ["Preto/Vermelho"],
    11: ["Preto/Branco"],
    12: ["Amarelo","Vermelho","Rosa","Preto","Branco","Azul"],
    13: ["Preto/Vermelho","Preto/Rosa","Preto/Amarelo","Preto/Azul","Preto/Branco"],
    14: ["Vermelho/Cinzento","Branco/Cinzento","Preto","Azul/Preto"],
    15: ["Preto","Vermelho","Azul-escuro"],
    16: ["Preto","Vermelho","Azul"],
    17: ["Vermelho","Azul","Branco","Preto"],
    18: ["Vermelho","Branco","Preto"],
    19: ["Preto"],
    20: ["Preto"],
    21: ["Bordeaux","Verde-lima","Roxo","Branco","Preto","Laranja","Azul-claro","Azul-escuro","Verde-militar","Cinzento-escuro"],
    22: ["Amarelo","Branco","Rosa","Azul","Vermelho","Preto","Verde/Branco/Laranja"],
    23: ["Branco","Preto","Rosa","Vermelho"],
    24: ["Preto","Vermelho"],
    25: ["Preto/Cinzento","Preto/Branco"],
    26: ["Preto"],
    27: ["Vermelho/Preto"],
    28: ["Azul","Vermelho","Preto"],
    29: ["Vermelho/Branco","Azul/Branco","Preto/Cinzento","Branco/Preto","Preto/Dourado"],
    30: ["Preto"],
    31: ["Preto/Vermelho"],
    32: ["Preto/Verde"],
    33: ["Roxo","Laranja","Cinzento-escuro","Verde-lima","Cinzento","Vermelho","Verde-militar","Azul-escuro","Branco"],
    34: ["Vermelho","Azul","Preto"],
    35: ["Azul/Vermelho","Branco/Vermelho/Azul","Vermelho/Azul","Branco/Vermelho","Vermelho/Branco","Amarelo/Vermelho","Branco/Verde/Vermelho","Verde/Amarelo/Vermelho","Azul/Branco/Amarelo","Verde/Branco"],
    36: ["Verde","Vermelho","Transparente","Preto","Azul"],
    37: ["Preto","Verde","Transparente","Azul"],
    38: ["Laranja","Preto","Rosa","Azul","Amarelo"],
    39: ["Verde","Preto","Branco","Amarelo","Azul"],
    40: ["Branco/Azul","Preto/Azul","Branco/Preto","Preto/Cinzento","Branco/Verde","Preto/Verde"],
    41: ["Preto","Branco/Laranja"],
    42: ["Preto"],
    43: ["Branco","Preto"],
    44: ["Rosa","Preto"],
    45: ["Azul-escuro"],
    46: ["Branco","Preto","Preto/Branco"],
    47: ["Azul-escuro/Branco/Vermelho"],
    48: ["Vermelho","Preto","Branco"],
    49: ["Preto"],
    50: ["Preto/Branco"],
    51: ["Branco","Azul","Cinzento/Preto","Preto/Amarelo","Preto","Vermelho"],
    52: ["Branco/Amarelo","Verde-lima","Laranja","Rosa","Cinzento/Preto","Preto/Amarelo","Verde-escuro","Amarelo","Preto","Vermelho","Branco","Roxo","Azul","Verde/Branco","Preto/Dourado"],
    53: ["Preto/Vermelho","Preto/Amarelo","Preto/Azul","Preto/Branco"],
    54: ["Preto"],
    55: ["Preto"],
    56: ["Azul/Vermelho"],
    57: ["Preto/Azul","Preto/Vermelho"],
    58: ["Azul","Preto","Vermelho","Rosa"],
    59: ["Cinzento-escuro","Azul","Vermelho","Preto","Azul-escuro","Laranja"],
    64: ["Verde","Vermelho","Prateado","Azul","Amarelo"],
    65: ["Vermelho","Preto","Branco","Azul"],
    88: ["Preto","Vermelho","Azul-claro"],
    100: ["Amarelo/Azul","Vermelho/Azul"],
    112: ["Vermelho/Branco","Preto/Branco"],
    113: ["Vermelho/Branco","Branco/Preto","Preto/Branco","Amarelo/Preto"],
    114: ["Verde-escuro/Branco","Vermelho/Branco"],
    122: ["Vermelho","Preto"],
    133: ["Azul","Branco","Preto","Vermelho"],
    134: ["Azul","Rosa","Preto","Vermelho"],
    135: ["Azul","Rosa","Preto","Vermelho"],
    136: ["Preto","Azul","Laranja","Azul-claro"],
    137: ["Azul","Vermelho","Preto"],
    138: ["Vermelho/Azul (reversível)"],
    139: ["Vermelho","Azul-escuro"],
    142: ["Azul-claro","Preto","Vermelho","Rosa","Verde","Amarelo"],
    143: ["Branco/Preto","Azul","Amarelo","Castanho/Preto","Vermelho","Verde","Rosa"],
    144: ["Preto/Amarelo","Preto/Azul","Preto/Vermelho/Branco","Preto/Verde","Preto/Vermelho","Preto/Rosa"],
    145: ["Laranja/Preto","Verde-lima/Preto"],
    146: ["Branco/Dourado","Preto/Dourado","Vermelho","Azul"],
    147: ["Preto","Branco"],
    148: ["Vermelho/Preto","Branco/Cinzento","Preto","Azul"],
    149: ["Branco/Preto","Preto/Branco"],
    154: ["Preto/Dourado","Azul","Vermelho","Rosa"],
    155: ["Preto"],
    156: ["Vermelho/Preto","Azul/Preto","Branco/Preto"],
    157: ["Rosa/Preto","Azul/Preto","Preto/Vermelho","Preto/Rosa"],
    158: ["Azul","Preto","Vermelho","Azul-escuro","Rosa","Camuflado"],
    159: ["Azul","Preto","Vermelho","Amarelo","Rosa","Camuflado","Branco"],
    171: ["Rosa","Vermelho","Preto","Branco","Azul"],
    172: ["Azul","Preto","Branco","Vermelho"],
    173: ["Vermelho","Azul","Preto"],
    174: ["Vermelho/Azul (reversível)"],
    175: ["Vermelho","Azul"],
    178: ["Preto","Vermelho","Azul"],
    180: ["Azul","Rosa","Branco","Vermelho","Preto"],
    181: ["Bordeaux","Vermelho","Cinzento","Azul","Preto"],
    183: ["Azul","Vermelho","Cinzento"],
    184: ["Branco","Azul","Vermelho","Preto"],
    185: ["Branco","Azul","Vermelho","Preto"],
    186: ["Azul-escuro","Vermelho","Preto"],
    187: ["Azul","Vermelho","Preto"]
  };
  // Correspondência dos artigos que não usam o ID do catálogo no URL.
  const named = {
    "charlie-bat-x-luvas-de-treino":7,
    "charlie-danger-luvas-profissionais":0,
    "charlie-no-remorse-luvas-de-competicao":1,
    "charlie-amateur-sniper-luvas-de-competicao":2,
    "charlie-tijuana-luvas-com-cordoes":3,
    "charlie-new-mex-cordoes-luvas-com-cordoes":4,
    "charlie-retro-luvas-de-boxe":5,
    "charlie-gel-luvas-de-boxe":6,
    "charlie-m-luvas-de-boxe":8,
    "charlie-new-mex-velcro-luvas-de-boxe":9,
    "charlie-aircool-luvas-de-boxe":10,
    "charlie-bat-z-luvas-de-boxe":11,
    "charlie-outlaw-luvas-de-boxe":12,
    "charlie-kaos-luvas-de-boxe":13,
    "charlie-blast-luvas-de-boxe":14,
    "charlie-belial-capacetes-de-boxe":15,
    "charlie-sniper-capacetes-de-boxe":16,
    "charlie-satan-capacetes-de-boxe":17,
    "charlie-leviatan-capacetes-de-boxe":18,
    "charlie-gel-capacetes-de-boxe":19,
    "charlie-poseidon-capacetes-de-boxe":20,
    "charlie-barra-m-capacetes-de-boxe":21,
    "charlie-barra-h-capacetes-de-boxe":22,
    "charlie-monk-luvas-de-mma":23,
    "charlie-raider-luvas-de-mma":24,
    "charlie-mma-gel-sparring-y-profesional-luvas-de-mma":25,
    "charlie-mma-sparring-y-profesional-luvas-de-mma":26,
    "charlie-mma-jupiter-luvas-de-mma":27,
    "charlie-botin-ful-fast-foot-protecoes":28,
    "charlie-espinillera-blast-y-gold-caneleiras":29,
    "charlie-espinillera-gel-super-proteccion-cierre-de-hebilla-y-velcro-talla-l-caneleiras":30,
    "charlie-espinillera-shocker-mma-caneleiras":31,
    "charlie-espinillera-meguro-tf-caneleiras":32,
    "charlie-espinillera-m-caneleiras":33,
    "charlie-espinillera-tubular-caneleiras":34,
    "charlie-bucal-hervible-tricolor-boqueiras":35,
    "charlie-bucal-hervible-simples-boqueiras":36,
    "charlie-bucal-hervible-doble-boqueiras":37,
    "charlie-guantes-kid-2026":134
  };
  const swatches = {
    "preto":"#17191c","branco":"#f6f6f2","cinzento":"#92979e",
    "cinzento-escuro":"#4d535b","azul":"#1764c9","azul-escuro":"#182d5a",
    "azul-claro":"#64c7e8","vermelho":"#d51c31","rosa":"#ef92b9",
    "verde":"#16844b","verde-escuro":"#1c583f","verde-militar":"#68754b",
    "verde-lima":"#b9ec2a","amarelo":"#f4ce24","dourado":"#c5a34b",
    "laranja":"#ee6228","roxo":"#8241b2","bordeaux":"#80253a",
    "castanho":"#81513a","prateado":"#d1d6dc","transparente":"#f7f8f9",
    "camuflado":"#687354"
  };
  function colorBackground(label) {
    const parts = label.replace(/\s*\(.*?\)/g, "").split("/").map(s => s.trim().toLowerCase());
    const shades = parts.map(p => swatches[p] || "#cccccc");
    if (shades.length === 1) return shades[0];
    const step = 100 / shades.length;
    return "linear-gradient(110deg," + shades.map((v, i) => v + " " + (i * step) + "%," + v + " " + ((i + 1) * step) + "%").join(",") + ")";
  }
  // Cada cor ativa a respetiva fotografia já existente na galeria Shopify.
  // Para outros produtos Charlie, basta associar aqui os nomes dos ficheiros.
  const mediaFilesByColor = {
    34: {
      "Vermelho": "charlie_protecoes_vermelhas",
      "Azul": "charlie_protecoes_azuis",
      "Preto": "charlie_protecoes_pretas"
    }
  };

  function activateColorMedia(root, productId, color) {
    const filename = mediaFilesByColor[productId]?.[color];
    if (!filename) return;

    const gallery = root.closest(".product")?.querySelector("media-gallery");
    if (!gallery || typeof gallery.setActiveMedia !== "function") return;

    const slides = gallery.querySelectorAll(".product__media-list > .product__media-item[data-media-id]");
    const target = Array.from(slides).find(slide => {
      return Array.from(slide.querySelectorAll("img")).some(image => {
        const sources = [
          image.getAttribute("src"),
          image.getAttribute("srcset"),
          image.currentSrc,
          image.alt
        ];
        return sources.some(source => typeof source === "string" && source.includes(filename));
      });
    });

    if (target) gallery.setActiveMedia(target.dataset.mediaId, false);
  }

  function init(root) {
    if (root.dataset.vtColorReady) return;
    root.dataset.vtColorReady = "1";
    const handle = root.dataset.charlieHandle || "";
    const match = handle.match(/^charlie-catalogo-2026-(\d{1,3})(?:-|$)/);
    const productId = Object.prototype.hasOwnProperty.call(named, handle) ? named[handle] : (match ? Number(match[1]) : -1);
    const colors = colorsById[productId];
    if (!colors || !colors.length) return;
    const form = root.closest("form");
    const choices = root.querySelector("[data-vt-color-choices]");
    const current = root.querySelector("[data-vt-color-current]");
    const error = root.querySelector("[data-vt-color-error]");
    if (!form || !choices || !current) return;
    const groupName = "properties[Cor]";
    colors.forEach((name, index) => {
      const input = document.createElement("input");
      const inputId = "vt-charlie-" + root.dataset.sectionId + "-" + index;
      input.type = "radio";
      input.id = inputId;
      input.name = groupName;
      input.value = name;
      input.required = colors.length > 1;
      if (colors.length === 1) input.checked = true;
      input.className = "vt-charlie-colors__input";
      const label = document.createElement("label");
      label.htmlFor = inputId;
      label.className = "vt-charlie-colors__option";
      label.title = name;
      const circle = document.createElement("span");
      circle.className = "vt-charlie-colors__swatch";
      circle.style.background = colorBackground(name);
      circle.setAttribute("aria-hidden", "true");
      const text = document.createElement("span");
      text.className = "vt-charlie-colors__name";
      text.textContent = name;
      label.append(circle, text);
      choices.append(input, label);
      input.addEventListener("change", () => {
        current.textContent = name;
        activateColorMedia(root, productId, name);
        if (error) error.hidden = true;
      });
    });
    current.textContent = colors.length === 1 ? colors[0] : "Seleciona uma cor";
    root.hidden = false;
    // Shopify apresenta o pagamento expresso antes de validar propriedades personalizadas.
    // Para evitar encomendas sem cor, estas compras usam o carrinho normal.
    if (colors.length > 1) form.classList.add("vt-charlie-require-color");
    form.addEventListener("submit", event => {
      if (root.querySelector('input[name="properties[Cor]"]:checked')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (error) error.hidden = false;
      root.querySelector('input[name="properties[Cor]"]')?.focus();
    }, true);
  }
  function scan() {
    document.querySelectorAll("[data-vt-charlie-colors]").forEach(init);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scan, { once: true });
  } else {
    scan();
  }
  document.addEventListener("shopify:section:load", scan);
})();