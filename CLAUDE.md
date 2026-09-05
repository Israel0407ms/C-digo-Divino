# SITES STUDIO AAR

Gerador de sites ultra-personalizados a partir de um perfil de Instagram, com vídeo motion narrado — rodando 100% dentro do Claude Code.

## O que este projeto é

Um "app" de Claude Code: o usuário manda a URL de um Instagram e o pipeline abaixo executa do início ao fim, entregando um site completo em `projects/<slug>/site/` com um vídeo promocional embutido.

## Regra número 1: o usuário só conversa

**Quem opera o app é você, não ele.** Ele pode ser leigo — não sabe usar terminal, não vai editar arquivo, não vai rodar comando. Se algo precisa ser instalado, configurado ou corrigido, **você faz**; só peça a ele o que é impossível fazer sozinho (autorizar uma instalação, fornecer a chave da ElevenLabs, logar no Instagram).

Na primeira mensagem de uma pasta recém-instalada — ou sempre que faltar algo para rodar — execute a skill `comecar`. Ela prepara tudo em conversa.

Fale simples: "preparar o app", "conta da narração". Nada de "npm install", "dependências", "endpoint".

## Pipeline (ordem obrigatória)

1. **Análise do Instagram** — abrir o perfil no navegador integrado (Browser pane), ler bio, posts recentes, destaques e o link da bio. Clicar no link da bio (Linktree, loja, WhatsApp etc.) e explorar as páginas de destino para entender o produto/serviço de verdade.
2. **Briefing** — consolidar tudo em `projects/<slug>/briefing.md`: produto, nicho, público, tom de voz, diferencial, cores da marca (extraídas dos posts), provas sociais encontradas, CTA principal.
3. **Referências** — pesquisar na web 5 sites reais do mesmo nicho, analisar estrutura e copy de cada um, salvar notas em `projects/<slug>/referencias.md`. As referências inspiram estrutura e argumentos de venda — nunca copiar texto ou design literalmente.
4. **Site** — gerar site estático em `projects/<slug>/site/` (index.html + assets). Design tem que ser adequado ao nicho (paleta, tipografia, densidade visual), mobile-first, com copy persuasiva original em PT-BR.
5. **Vídeo** — seguir a skill `gerar-video`: roteiro de narração → áudio via ElevenLabs (`engine/tts/narrate.mjs`) → composição Remotion nova em `engine/video/src/compositions/<slug>/` → renderizar MP4 → embutir no site.
6. **Entrega** — abrir o site no Browser pane para o usuário revisar. Listar o que foi gerado.

## Estrutura

```
.claude/skills/       Skills do pipeline (criar-site, gerar-video)
app/                  Interface local (server.mjs + ui/) — abre na aba do navegador
app/data/             Pedidos (pedidos.json) e configuração ElevenLabs (config.json) — NUNCA commitar
engine/tts/           Narração ElevenLabs com timestamps + efeitos sonoros
engine/media/         Download e otimização das fotos reais do cliente (WebP)
engine/video/         Projeto Remotion (uma composição por cliente)
projects/<slug>/      Saída: briefing, referências, site e vídeo de cada cliente
```

## O painel é o lugar de uso

**O usuário trabalha no painel, não no chat.** É ele que dá cara de app ao produto: é onde a pessoa registra os pedidos, salva a chave e vê os sites prontos.

- **Abra o painel sempre**, assim que o app estiver preparado: `preview_start` name `studio` (porta 4517). Não espere ele pedir.
- Quando ele disser "roda o pedido" (ou similar), pegue o pedido pendente de `app/data/pedidos.json` e execute `criar-site`.
- Ao terminar um projeto, marque o pedido como `concluido` no `pedidos.json` — é assim que ele aparece pronto na tela.
- Os sites ficam acessíveis no painel em `/projects/<slug>/site/`.

Se a pessoa preferir mandar o Instagram direto no chat, tudo bem — atenda. Mas o padrão que você apresenta e mantém aberto é o painel.

## Regras

- Slug do projeto = handle do Instagram em kebab-case (ex.: `@Doce.Mel_Bolos` → `doce-mel-bolos`).
- Nunca commitar chaves. `ELEVENLABS_API_KEY` vem de variável de ambiente (ver `.env.example`).
- Sites são estáticos e autocontidos — nada de CDN obrigatório para funcionar offline.
- **Fotos reais do cliente são obrigatórias** nos produtos/serviços em destaque (ver etapa 3b da skill `criar-site`).
- **Zero emoji nos sites** — ícone SVG inline, elemento CSS ou nada. Emoji entrega que o site foi gerado por IA.
- **O site também tem motion**, no ritmo do nicho: varejo pede movimento vibrante; saúde e jurídico pedem movimento lento e discreto. Sempre com `transform`/`opacity`, dentro de `requestAnimationFrame`, e desligado em `prefers-reduced-motion` e `(hover: none)`.
- **Antes de entregar, medir o alinhamento**: o `left` do conteúdo de todas as seções tem que dar o mesmo número. Diferenças de poucos pixels só aparecem em tela grande e passam despercebidas no preview.
- Copy sempre original. Referências servem para estrutura e ângulo de venda, não para texto.
- Se o Instagram bloquear ou pedir login, avisar o usuário para logar na aba do navegador e continuar — nunca tentar burlar bloqueio.
