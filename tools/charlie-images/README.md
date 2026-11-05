# VIRIATTO — Robô de imagens Charlie

Deteta artigos Charlie no Shopify com a etiqueta **foto-por-adicionar** e sem imagens; procura correspondência única na loja oficial da Charlie; aplica um fundo de estúdio escuro, mantendo o produto original sem o redesenhar; e publica no Shopify apenas se o artigo estiver inequivocamente identificado.

**Não altera imagens existentes, stock, preços ou tema.** Não utiliza o catálogo de preços confidencial como fonte pública.

## Segredos necessários (GitHub > Settings > Secrets and variables > Actions)

- SHOPIFY_SHOP: domínio *.myshopify.com da loja.
- SHOPIFY_CLIENT_ID e SHOPIFY_CLIENT_SECRET: credenciais da app criada no Shopify Dev Dashboard (modo recomendado desde 2026). O robô obtém e renova os tokens de acesso automaticamente.
- SHOPIFY_ADMIN_ACCESS_TOKEN: alternativa para uma app legacy que ainda tenha token estático.
- A app deve ter as permissões read_products, write_products, read_files e write_files.
- OPENAI_API_KEY: opcional. Gera apenas o fundo do estúdio com o modelo de imagem OpenAI; sem chave, fundo cinzento local.

Não colocar segredos no código nem em ficheiros públicos.

## Executar

A cada alteração aos ficheiros do robô na branch **boxeup-shopify-sync**, o GitHub Actions executa uma verificação em modo scan. Caso configures a variável de repositório CHARLIE_IMAGE_MODE para prepare ou publish, a execução após o push usa esse modo.

O botão Run workflow do GitHub só fica disponível se o workflow estiver registado também na branch predefinida, o que não fazemos para preservar a main. Para executar pontualmente, podes usar o script Python no teu computador/servidor, com os segredos nas variáveis de ambiente.

- **scan**: só identifica fontes e cria o relatório.
- **prepare**: descarrega a foto oficial, remove o fundo e cria JPG quadrado de 1024×1024. Recolhe os ficheiros no artefacto charlie-images-report.
- **publish**: publica apenas fotografias com correspondência única e resolução mínima de 500 píxeis, e valida a associação Shopify.

O relatório inclui os artigos saltados e respetivos motivos. Nomes genéricos ou fotografias sem correspondência ficam pendentes de revisão.

**Limitação de execução automática:** o GitHub Actions só executa agendamentos na branch predefinida (main). Como a main não pode ser alterada, esta branch reage a novos commits, mas não a novos produtos Shopify por si só. Para procurar novos artigos todos os dias, é preciso um agendador externo ou uma tarefa recorrente do ChatGPT com acesso ao Shopify. O processo de GitHub precisa dos segredos acima para ser executado.

A extração do produto usa rembg/u2netp. A geração com OpenAI serve unicamente para o cenário, de modo a preservar logos, costuras e detalhes reais dos produtos.
