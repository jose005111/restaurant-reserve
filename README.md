# Restaurant Reserve

Frontend React do SaaS de pedidos por QR code. Guia de implementação: [docs/plano.md](docs/plano.md).

## Desenvolvimento e validação

```sh
npm install
npm run gen:api
npm run dev
npm run build
npm run lint
npm test
```

`gen:api` usa o contrato versionado em `../restaurant-reserve-api/docs/openapi.json` e gera `src/types/api.d.ts`. `src/types/api.ts` expõe aliases dos DTOs gerados e constantes usadas pela UI. Nunca editar o ficheiro gerado. O Swagger em execução está em `/api/docs`, com JSON em `/api/docs-json`.

## Identidade do restaurante

O onboarding agrupa logótipo, logótipo escuro, favicon, banner e imagem de entrada no passo **Marca**; cores, tema, fonte e raio em **Cores**; rodapé e redes sociais em **Contactos**. Apenas logótipo e título são necessários para concluir. Os outros campos são opcionais.

Seleccionar um ficheiro cria apenas uma pré-visualização local. **Guardar imagem** envia o ficheiro pelo endpoint específico da API; **Remover** elimina imediatamente a imagem guardada. Estas operações são independentes dos dados do formulário e não concluem o onboarding. Uma selecção por guardar é descartada ao mudar de passo. JPEG, PNG e WebP até 2 MB são aceites em todos os assets.

Os textos, contactos, cores, tema e fonte só são guardados ao clicar em **Concluir e entrar no painel**. Continuar, Voltar e Enter nos campos não guardam dados. As cores e a fonte têm pré-visualização local; as fontes listadas não são descarregadas, pelo que dependem da disponibilidade no dispositivo. A limpeza da fonte restaura a predefinida.

Os testes cobrem avanço para Contactos sem submissão, Enter/submissão implícita, validação dos contactos, fonte, assets opcionais e confirmação/cancelamento de uploads.

## Menu e consulta pública (Fase 3)

O perfil ADMIN gere o catálogo nos submenus `/app/menu/categories` (Categorias) e `/app/menu/products` (Produtos); `/app/menu` encaminha para Categorias. Produtos incluem comida, bebidas e consumíveis. As listas usam tabelas com filtros e paginação do servidor (página, limite, pesquisa, estado e categoria). Alterar filtros ou eliminar registos reinicia na primeira página. Os preços editam-se em cêntimos inteiros. Categorias inactivas e pratos indisponíveis mantêm-se no painel e são filtrados pela API na consulta pública. A remoção usa confirmação; conflitos de limites ou relações são apresentados pela mensagem da API.

As imagens suportam texto alternativo, principal, reordenação e remoção. Os limites de upload são definidos pela API. A principal aparece primeiro, independentemente da ordem das restantes imagens.

`/m/$token` apresenta o menu em telemóvel, com pesquisa e filtro de categoria. O token de mesa mostra a mesa fixa; o genérico permite escolher uma mesa activa para a consulta. A escolha fica guardada por token; o envio exige uma mesa activa e conduz ao acompanhamento público. A vista aplica branding, tema, título e favicon e restaura o estado ao sair. Pedidos públicos não enviam o JWT do staff.

A API permite a ADMIN e COUNTER alterar disponibilidade, mas a listagem de pratos é exclusiva de ADMIN; por isso não há página de gestão para COUNTER nesta fase. O service/hook de disponibilidade suporta a operação contratada para o futuro balcão.

As listas do catálogo não mostram imagens. O botão de detalhes (olho) carrega o produto por ID e apresenta os dados completos e a galeria com gestão das imagens. As acções têm ícone, tooltip e nome acessível; os diálogos preservam o foco. O selector de categorias percorre todas as páginas de 100 registos e inclui categorias inactivas. Os preços do painel são indicados na moeda do restaurante e em cêntimos, sem assumir uma moeda que o contrato de staff não disponibiliza.

## Pedidos públicos (Fase 4)

O menu `/m/$token` permite adicionar produtos a um carrinho mobile, ajustar quantidades e notas e indicar pessoas e nota geral. Os carrinhos persistem em localStorage separados por token. Links TABLE fixam a mesa; links GENERIC exigem seleccionar uma mesa activa. O valor apresentado antes do envio é estimado com o menu actual; os preços e o total confirmados vêm exclusivamente da API.

A submissão guarda previamente um snapshot e uma chave de idempotência. Cliques repetidos ficam bloqueados e uma tentativa após erro de rede envia exactamente o mesmo payload/chave, mesmo depois de recarregar a página. Enquanto o resultado é incerto, o carrinho fica bloqueado para impedir alterações que possam criar um segundo pedido. Uma rejeição HTTP definitiva, sem erro incerto anterior, permite corrigir o carrinho. Se o QR for rodado durante uma tentativa incerta, confirma o pedido com a equipa antes de criar outro.

Depois do envio, `/orders/$publicCode` mostra snapshots, mesa, pessoas, notas, total confirmado e estado. Consulta automaticamente a cada 15 segundos enquanto activo e permite actualização manual. O cancelamento exige confirmação e só aparece em PENDING; conflitos são conciliados com nova consulta. O último código fica guardado junto do carrinho para permitir retomar o acompanhamento.

## Balcão (Fase 5)

`/app/orders` está disponível a ADMIN e COUNTER. Mostra a fila paginada, filtros por estado, data e mesa visível na página, e detalhes dos produtos e notas. O staff aceita com tempo estimado, rejeita com motivo ou avança o pedido até à entrega; pode cancelar pedidos aceites ou em preparação. Erros de transição da API são mostrados no painel.

## Tempo real (Fase 6)

O balcão usa SSE com JWT em `/api/orders/stream`; o acompanhamento público usa `EventSource` em `/api/public/orders/:publicCode/stream`. Ao receber um evento, ambos consultam novamente o detalhe pela API. Na reconexão fazem nova consulta; quando o stream está desligado, a consulta periódica de 15 segundos serve de alternativa. O stream público fecha quando o pedido chega a um estado final. O botão de actualização manual continua disponível.

## Relatórios (Fase 7)

`/app/reports` está disponível apenas a ADMIN. Mostra pedidos recebidos, vendas por dia e até dez produtos mais vendidos. O período por defeito são os últimos sete dias em Africa/Luanda; pode ser alterado até ao máximo de 31 dias. Pendentes, rejeitados e cancelados contam como pedidos recebidos, mas não entram nas vendas. Os valores são apresentados na moeda devolvida pela API.
