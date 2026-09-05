---
name: criar-site
description: Pipeline completo - analisa um perfil de Instagram, pesquisa referências do nicho e gera um site ultra-personalizado com vídeo promocional narrado. Use quando o usuário passar uma URL de Instagram e pedir um site, ou invocar /criar-site.
---

# Criar Site a partir de um Instagram

Argumento esperado: URL ou @handle do Instagram. **Se não veio argumento** (ou o usuário disse "roda o pedido"), busque o pedido pendente mais antigo:

- **Painel local** (`app/data/pedidos.json` existe e tem entradas): pegue o item com `status: "pendente"` mais antigo.
- **Painel remoto** (publicado como Artifact — URL em `app/painel-remoto.md`): leia a coleção `pedidos` dessa URL (`action: "read_db"`, `db_op: "query"`, filtrando `status == "pendente"`) e pegue o mais antigo por `criadoEm`.

Em ambos os casos use `instagram`, `observacoes` (incorpore no briefing e no site), `comVideo` (se `false`, pule a etapa de vídeo) e `formatoVideo` (horizontal = 1920x1080, vertical = 1080x1920). Se não houver pedido pendente nem argumento, pergunte a URL ou mande o usuário abrir o painel (skill `comecar`, etapa 5).

Ao concluir a entrega, marque o pedido como `concluido` no mesmo lugar de onde ele veio — `app/data/pedidos.json` no painel local, ou `write_db` (`update`) no documento da coleção `pedidos` no painel remoto — e registre o resultado na coleção `projetos` do painel remoto (`slug`, `instagram`, `siteUrl`, `videoNota`, `atualizadoEm`), para ele aparecer em "Projetos entregues".

Defina `slug` = handle em kebab-case (minúsculas, `.`/`_` viram `-`). Toda a saída vai em `projects/<slug>/`.

## Etapa 1 — Vasculhar o Instagram

Use o navegador integrado (tools `mcp__Claude_Browser__*`):

1. `preview_start` com a URL do perfil. Se aparecer tela de login, peça ao usuário para logar na aba do navegador com a conta dele e avise que você continua depois que ele confirmar. Nunca preencha credenciais.
2. Com o perfil aberto, colete via `get_page_text` + screenshots:
   - Nome, bio completa, número de seguidores, categoria do perfil.
   - Os 9–12 posts mais recentes: abra cada um, leia legenda e comentários fixados. Screenshots dos posts servem para extrair a identidade visual (cores dominantes, estética das fotos).
   - Destaques (highlights) com nomes tipo "Preços", "Depoimentos", "Antes/Depois" — abra os mais informativos.
3. **Clique no link da bio.** Se for agregador (Linktree, Beacons, bio.link), abra CADA link listado e leia as páginas de destino: loja, cardápio, WhatsApp (anote o número do wa.me), formulário, outra rede.
4. Anote provas sociais: depoimentos em destaques, prints de clientes, avaliações, contagem de seguidores.

## Etapa 2 — Briefing

Escreva `projects/<slug>/briefing.md` com estas seções (todas obrigatórias):

- **Produto/serviço** — o que vende, exatamente, com preços se encontrados.
- **Nicho e público** — quem compra e por quê.
- **Tom de voz** — formal/informal, emojis, gírias? Espelhe o tom das legendas.
- **Identidade visual** — 3–5 cores em hex extraídas dos posts/foto de perfil, estilo (minimalista, vibrante, rústico, luxo...), tipografia sugerida.
- **Diferenciais e provas sociais** — o que separa esse perfil dos concorrentes.
- **CTA principal** — pra onde o site deve empurrar (WhatsApp, loja, agendamento).
- **Contatos** — WhatsApp, endereço, horários, tudo que foi encontrado.

## Etapa 3 — 5 referências do nicho

Use WebSearch (carregue via ToolSearch se necessário) para achar 5 sites reais e bem-feitos do mesmo nicho (ex.: "melhores sites confeitaria artesanal", "landing page personal trainer exemplo"). Para cada um, visite com WebFetch ou o navegador e registre em `projects/<slug>/referencias.md`:

- URL e nicho.
- Estrutura de seções (hero → prova social → oferta → FAQ → CTA...).
- Ângulo da copy: qual dor/desejo o hero ataca, como constroem urgência/confiança.
- 1 ideia concreta que vale adaptar (adaptar ≠ copiar; texto final é sempre original).

## Etapa 3b — Fotos reais (OBRIGATÓRIO)

**Site com emoji no lugar de foto tem cara de gerado por IA e derruba o valor do trabalho.** Todo produto/serviço em destaque precisa de foto real. Busque nesta ordem:

1. **Cardápio/catálogo digital do cliente** — se o Linktree levava a Anota AI, Goomer, iFood, loja virtual etc., é a melhor fonte: tem uma foto por produto, já identificada. Extraia com o navegador:
   ```js
   [...document.querySelectorAll('img')].filter(i => i.naturalWidth > 150)
     .map(i => ({alt: i.alt, src: i.currentSrc || i.src, w: i.naturalWidth}))
   ```
2. **Site oficial da marca/franquia** — costuma ter fotos profissionais em alta resolução (600–1600px). Prefira estas para o hero.
3. **Posts do Instagram do cliente** — fotos autênticas do negócio (1080px), boas para galeria e ambiente.
4. **Banco de imagens livre** (Pexels/Unsplash) — SOMENTE para ambiente, textura ou fundo. Nunca apresente foto de banco como se fosse o produto do cliente.

Monte `projects/<slug>/imagens.json` (`[{"nome":"...","url":"..."}]`) e rode:

```
node engine/media/baixar-imagens.mjs projects/<slug>/imagens.json projects/<slug>/site/assets/fotos
node engine/media/otimizar-imagens.mjs projects/<slug>/site/assets/fotos 1200
```

O primeiro baixa e avisa quais imagens são pequenas demais para destaque (< 400px); o segundo converte tudo para WebP (reduz ~90% do peso). Use `alt` descritivo em todas e `loading="lazy"` fora da primeira dobra.

### Nada de emoji no site

**Emoji é a marca registrada de site gerado por IA.** Não use em lugar nenhum: nem em botões, nem em títulos, nem em rótulos de card, nem em `og:title`. Substitua por:

- **Ícone SVG inline** quando o ícone comunica algo (relógio, localização, entrega, WhatsApp, telefone): traço de 2px, `currentColor` para herdar a cor do texto, `width: 1.15em`.
- **Elemento CSS** para status (um ponto verde pulsante em vez de 🟢).
- **Nada** quando era só decoração. Um rótulo "o procurado" lê melhor que "⭐ o procurado".

Ao terminar o site, varra os arquivos por emoji para não sobrar nenhum:
```
rg "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}\x{2B00}-\x{2BFF}\x{FE0F}]" projects/<slug>/site
```
Símbolos tipográficos (★, →, ·) não são emoji e podem ficar.

### Fotos com fundo transparente = efeito "saindo do card"

Verifique quais fotos têm canal alpha — sites oficiais de marca costumam servir PNG recortado:

```
node -e "const s=require('./engine/media/node_modules/sharp');const fs=require('fs');const d='projects/<slug>/site/assets/fotos';(async()=>{for(const f of fs.readdirSync(d)){const m=await s(d+'/'+f).metadata();console.log(f, m.width+'x'+m.height, m.hasAlpha?'ALPHA':'-')}})()"
```

**Se nenhuma tiver alpha, recorte você mesmo** — quase nunca o cliente entrega PNG pronto:

```
node engine/media/recortar-fundo.mjs projects/<slug>/site/assets/fotos projects/<slug>/fontes/recortes --limpar=170
```

Roda local (ONNX, sem chave nem internet depois do primeiro uso), aceita arquivo
ou pasta, apara o vazio ao redor e informa quanto do quadro o objeto ocupa.

- `--limpar=N` (0–255) zera o alpha residual. Sem isso sobram fantasmas de
  cartaz, bandeira e reflexo em volta do recorte. 170 é um bom ponto de partida.
- **Confira todos os recortes antes de usar** — monte uma folha de contato sobre
  fundo xadrez. A taxa de aproveitamento é baixa: pessoa de corpo inteiro contra
  fundo limpo sai perfeita; cena com duas pessoas, vidro, bandeira ou objeto
  colado no fundo sai rasgada. **Uma boa é melhor que cinco medianas.**
- Converta o aprovado para WebP preservando o alpha:
  `sharp(png).resize({height:1000}).webp({quality:88, alphaQuality:100})`.

Depois de recortar, monte o card em 3D com o produto transbordando:

- Card: `transform: perspective(1000px) rotateX(var(--rx)) rotateY(var(--ry))` — **a perspectiva vai no próprio card**, não no container da grade; no container o ponto de fuga fica longe e o produto é arremessado para fora da posição.
- Palco colorido curto (~130px) no topo do card + produto em `position: absolute` com `translateZ(45px)`, saindo por cima da borda. Nada de `overflow: hidden` no card.
- **Reserve o espaço do transbordo**: `gap` entre linhas maior que o transbordo (~100px) e `padding-top` na grade — senão o produto cobre o preço do card de cima. Limite com `max-height` no produto para o transbordo não crescer no mobile.
- Sombra de contato (elipse com `radial-gradient`) sob o produto + `filter: drop-shadow` na imagem: é o que vende a sensação de volume.
- Inclinação seguindo o mouse via `pointermove` atualizando `--rx`/`--ry` dentro de `requestAnimationFrame`; desative com `(prefers-reduced-motion: reduce)` e `(hover: none)`.
- Atenção: se houver animação de entrada por scroll, ela **não pode** escrever `transform` inline nesses cards — só `opacity`, senão apaga a inclinação.
- **Dê `width: 100%` ao palco.** Se todos os filhos dele são `position: absolute`, ele não tem conteúdo em fluxo e o `aspect-ratio` passa a resolver a partir da altura 0 — o bloco inteiro colapsa e some da página sem erro nenhum.
- **Meça o transbordo no navegador em vez de estimar**: `palco.top - figura.top` tem que ser menor que o `padding-top` reservado. Confira nas três larguras (mobile, ~800, ~1440) — o transbordo cresce junto com o palco.

Sem recorte transparente (arte promocional, foto com fundo), use um card "poster" — imagem contida sobre fundo escuro, sem breakout.

## Etapa 4 — Gerar o site

Crie `projects/<slug>/site/index.html` (+ `styles.css`, `script.js`, `assets/` se precisar). Requisitos:

- **Design do nicho**: use a paleta e o estilo do briefing. Um site de bolos artesanais não pode parecer um SaaS; um advogado não pode parecer uma hamburgueria.

### Hero com "fator uau"

O hero decide se o visitante fica. Ele precisa de **movimento com propósito**, não só uma foto parada. Receita que funciona:

1. **Fundo vivo** — `repeating-conic-gradient` de raios girando muito devagar (90s por volta) + vinheta e um brilho quente atrás do produto. Se houver vídeo promocional, use a mesma linguagem visual dele: o site e o vídeo viram um conjunto.
2. **Produto grande recortado** no centro/lateral, com flutuação contínua (`@keyframes` de 6s) e inclinação 3D seguindo o mouse.
3. **Satélites em parallax** — 4 a 6 elementos ao redor (fotos reais recortadas do próprio cliente + ingredientes/objetos do nicho desenhados em **SVG inline**), cada um com `data-prof` diferente. No `pointermove`, desloque cada um por `profundidade × força`: os "próximos" andam mais que os "distantes" e nasce a sensação de profundidade. Um wrapper faz o parallax, o filho faz a flutuação — senão os dois transforms brigam.
4. **Detalhe sensorial do nicho** — vapor subindo (comida quente), brilho passando (produto novo), partículas. Sutil e contínuo.
5. **Fita rolando (marquee)** — faixa diagonal com slogan e chamadas em loop infinito. Dá movimento constante e reforça a marca.
6. **Status ao vivo** — "aberto agora / fecha às X" ou contagem regressiva até abrir, calculada no relógio do visitante. Cria urgência real, não decorativa.

Cuidados obrigatórios:
- Desenhe objetos em **SVG, não em CSS puro**: formas orgânicas (uma rodela de tomate, uma folha) feitas com `border-radius`/`conic-gradient` viram manchas amorfas. SVG dá controle de contorno.
- **Centralize com grid, nunca com margem calculada em `vw`.** Um `margin-left: calc(50vw - Npx)` parece certo na sua tela e joga tudo para o lado em monitor grande. Use `display: grid; grid-template-columns: minmax(0,A) minmax(0,B); justify-content: center`.
- **A largura do produto mora no item do grid, não na imagem.** Uma `<img width:%>` dentro de um wrapper sem largura própria é referência circular — o navegador resolve jogando o produto para o canto do palco, e aí os satélites parecem "colados" nele. Defina `width` no wrapper e `width: 100%` na imagem.
- **Reserve a órbita**: se o produto ocupa X% do palco, cada satélite deve caber na folga `(100-X)/2`. Meça no navegador comparando os `getBoundingClientRect()` — sobreposição de satélite com o produto é o erro visual mais comum aqui. Em telas estreitas, esconda os satélites que não couberem.
- Teste em tela média (~800px): hero alto demais **empurra o título para fora da tela**. Reduza palco, produto e tipografia no breakpoint.
- Todo movimento dentro de `requestAnimationFrame`, só `transform`/`opacity`, e desligado em `prefers-reduced-motion` e `(hover: none)`.
- Mobile-first, responsivo, rápido (sem frameworks pesados; vanilla ou Tailwind via build local).
- Estrutura mínima: hero com promessa clara + seção de produto/serviço + prova social + seção "quem sou/sobre" + CTA repetido (botão flutuante de WhatsApp quando aplicável) + rodapé com contatos.
- **Topo enxuto no celular**: abaixo de ~820px, esconda a barra utilitária (horário/endereço) e o menu de navegação — deixe só a marca e o botão de ação principal. Essas informações já vivem na fita rolante e no rodapé. Avisos e novidades entram na fita rolante do hero, não em faixas estáticas que empurram o conteúdo para baixo.
- Copy original em PT-BR no tom do briefing, informada pelos ângulos das referências.
- SEO básico: title, meta description, og:tags, alt em imagens.
- Autocontido: funciona abrindo o index.html direto do disco.

### Detalhes que passam despercebidos e estragam a entrega

- **O vídeo precisa de capa (`poster`)**. Sem ela o player abre um retângulo branco vazio no meio do site. Gere um frame bonito do próprio vídeo com `npx remotion still <slug> capa.png --frame=N`, otimize para WebP e use `poster="..."` com `preload="none"`. Fixe `aspect-ratio: 16/9` e `max-width` no container, senão o player estica e descentraliza.
- **Faixa de números/estatísticas**: os blocos precisam de altura fixa no número e `min-height` na legenda, senão baselines diferentes deixam a faixa "embolada". Dê intervalo generoso (50px+) e separador vertical sutil. Nunca misture número grande com texto grande na mesma faixa, e mantenha todas as legendas com o mesmo número de linhas — uma que quebra em duas já desalinha a fileira inteira.
- **Seções de largura total vs. seções limitadas**: quando uma seção ocupa a tela toda (faixa colorida) e outra é limitada por `max-width`, as duas usam mecanismos diferentes de centralização e o conteúdo desalinha por alguns pixels — visível só em telas grandes. Padronize: a seção limitada leva `max-width` + `padding` nela mesma; a de largura total leva `padding-inline: 0` e passa `max-width` + `margin-inline: auto` + `padding-inline` **aos filhos**. Ao final, meça o `left` do conteúdo de todas as seções: tem que dar o mesmo número.
- **Cuidado com o atalho `margin`**: escrever `margin: 10px 0 20px` dentro de um contexto que centraliza com `margin-inline: auto` zera as laterais e joga o elemento para o canto. Use `margin: 10px auto 20px`.

## Etapa 5 — Vídeo promocional

Invoque a skill `gerar-video` passando o slug. Ela cuida de roteiro, narração, composição Remotion e render. Depois embuta o MP4 resultante numa seção do site (`<video controls poster=...>`).

Se `ELEVENLABS_API_KEY` não estiver configurada, avise o usuário e ofereça: (a) configurar a chave agora, ou (b) entregar o site sem vídeo e gerar depois.

## Etapa 6 — Entrega

1. **Com Browser pane** (Claude Code desktop/CLI): abra `projects/<slug>/site/index.html` direto para o usuário ver.
   **Sem Browser pane** (painel remoto): publique o próprio `index.html` do site como um Artifact autocontido (só a página, sem capacidades) e grave essa URL como `siteUrl` no documento do projeto na coleção `projetos` do painel. Se houver vídeo, mande o `promo.mp4` com `SendUserFile` para o usuário assistir.
2. Resuma: o que foi entendido do perfil, quais referências foram usadas, e o que foi gerado (caminhos dos arquivos e, no modo remoto, os links publicados).
3. Pergunte se quer ajustes — mudanças de copy, cor e seção são rápidas.
