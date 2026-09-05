# Painel remoto (Claude Code web/cloud)

Quando esta sessão roda num ambiente sem `preview_start`/navegador integrado
(Claude Code remoto/web), o painel do SITES STUDIO AAR não é o servidor local
em `app/server.mjs` — é esta página publicada como Artifact, com banco de
dados próprio para os pedidos e os projetos entregues:

**URL**: https://claude.ai/code/artifact/671e8362-d709-4bff-b490-44e9c0f46ee9

Antes de publicar um novo painel, confira se este link ainda funciona
(`Artifact` com `action: "read"`). Só publique de novo se ele tiver sumido
de fato — republicar sem necessidade cria uma segunda página e espalha os
pedidos entre duas fontes.

Coleções do banco desse painel:

- `pedidos` — um documento por pedido: `instagram`, `observacoes`, `comVideo`,
  `formatoVideo`, `status` (`pendente` | `em_andamento` | `concluido`),
  `criadoEm`.
- `projetos` — um documento por site entregue: `slug`, `instagram`,
  `siteUrl` (link do site publicado), `videoNota`, `atualizadoEm`.

A chave da ElevenLabs **não** fica aqui — nem como dado no banco (é segredo)
nem como campo na página (ela não tem permissão para chamar a API da
ElevenLabs). Isso continua sendo pedido e salvo em conversa, como descrito
na skill `comecar`.
