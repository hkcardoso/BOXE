# VIRIATTO — Robô de imagens Charlie

Deteta artigos Charlie no Shopify com a etiqueta **foto-por-adicionar** e sem imagens; procura correspondência única na loja oficial da Charlie; aplica um fundo de estúdio escuro, mantendo o produto original sem o redesenhar; e publica no Shopify apenas se o artigo estiver inequivocamente identificado.

**Não altera imagens existentes, stock, preços ou tema.** Não utiliza o catálogo de preços confidencial como fonte pública.

## Segredos necessários (GitHub > Settings > Secrets and variables > Actions)

- SHOPIFY_SHOP: domínio *.myshopify.com da loja.
- SHOPIFY_ADMIN_ACCESS_TOKEN: token privado da Shopify Admin API com permissões read_products, write_products, read_files e write_files.
- OPENAI_API_KEY: opcional. Gera apenas o fundo do estúdio com o modelo de imagem OpenAI; sem chave, fundo cinzento local.

Não colocar segredos no código nem em ficheiros públicos.

## Executar

GitHub > Actions > **Charlie product images** > **Run workflow**, selecionar a branch **boxeup-shopify-sync**.

- **scan**: só identifica fontes e cria o relatório.
- **prepare**: descarrega a foto oficial, remove o fundo e cria JPG quadrado de 1024×1024. Recolhe os ficheiros no artefacto charlie-images-report.
- **publish**: publica apenas fotografias com correspondência única e resolução mínima de 500 píxeis, e valida a associação Shopify.

O relatório inclui os artigos saltados e respetivos motivos. Nomes genéricos ou fotografias sem correspondência ficam pendentes de revisão.

**Limitação de execução automática:** GitHub Actions só executa workflows agendados a partir da branch predefinida (main). Esta implementação não toca na main; por isso, até existir agendador externo, a execução nesta branch é manual. Também requer que os segredos sejam configurados para funcionar.

A extração do produto usa rembg/u2netp. A geração com OpenAI serve unicamente para o cenário, de modo a preservar logos, costuras e detalhes reais dos produtos.
