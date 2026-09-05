---
name: gerar-video
description: Gera o vídeo promocional motion com narração para um projeto existente - roteiro, áudio ElevenLabs, composição Remotion e render de MP4. Use dentro do pipeline /criar-site ou quando o usuário pedir só o vídeo de um projeto.
---

# Gerar Vídeo Motion com Narração

Pré-requisito: `projects/<slug>/briefing.md` existe. Se não existir, rode antes a etapa de análise da skill `criar-site`.

## 1. Roteiro

Escreva `projects/<slug>/video/roteiro.md`: narração de **30 a 45 segundos** (75–110 palavras), em PT-BR, no tom do briefing. Estrutura: gancho (dor/desejo) → apresentação do produto → diferencial/prova → CTA falado. Frases curtas — é narração, não texto lido.

**FORMATO OBRIGATÓRIO**: o corpo do arquivo deve conter APENAS o texto que será falado. Qualquer metadado (duração, tom, observações) vai em linha de título `#` ou comentário HTML `<!-- -->` — tudo mais o TTS lê em voz alta.

## 2. Narração (ElevenLabs)

```
node engine/tts/narrate.mjs "projects/<slug>/video/roteiro.md" "projects/<slug>/video/narracao.mp3"
```

O script gera o `.mp3` **e** um `narracao.timing.json` com o tempo exato de cada palavra e frase, e imprime a tabela de marcações no terminal.

**Nunca estime os tempos das cenas pelo texto — use SEMPRE os números dessa tabela.** Estimar defasa o vídeo em 1–2 segundos e a sincronia se perde.

### Escolha a voz SEMPRE — o usuário não escolhe

**Nunca peça ao usuário para escolher a voz.** Ele não tem como julgar isso antes de ouvir, e a interface não oferece essa opção de propósito. Você escolhe, sempre, com base no nicho do briefing.

**1. Liste as vozes PT-BR da conta** (a chave está em `app/data/config.json`):

```
node -e "const c=JSON.parse(require('fs').readFileSync('app/data/config.json','utf8').replace(/^﻿/,''));fetch('https://api.elevenlabs.io/v1/voices',{headers:{'xi-api-key':c.elevenLabsApiKey}}).then(r=>r.json()).then(d=>d.voices.filter(v=>(v.labels?.language||'').startsWith('pt')).forEach(v=>console.log(v.voice_id,'|',v.name,'|',v.labels?.description||'')))"
```

**2. Escolha pelo nicho e pelo público**, usando o nome e a descrição da voz:

| Nicho | Perfil de voz | stability · style · speed |
|---|---|---|
| Food, varejo, delivery, academia, festas | jovem, animada, "social media" | 0.35 · 0.45 · 1.08 |
| Saúde, odontologia, psicologia, jurídico | adulta, calma, clara, acolhedora | 0.60 · 0.20 · 1.00 |
| Estética, moda, beleza | feminina, suave e elegante | 0.45 · 0.35 · 1.03 |
| Serviços técnicos, construção, automotivo | masculina, firme, confiável | 0.50 · 0.30 · 1.02 |
| Educação, infantil | didática, amigável, sem pressa | 0.55 · 0.30 · 1.00 |

Na dúvida entre duas vozes, prefira a mais neutra: voz muito marcante cansa em vídeo institucional.

**3. Gere passando tudo por ambiente**, sem alterar a configuração global do usuário:

```
ELEVENLABS_VOICE_ID=<id> ELEVENLABS_STABILITY=0.6 ELEVENLABS_STYLE=0.2 ELEVENLABS_SPEED=1.0 node engine/tts/narrate.mjs "projects/<slug>/video/roteiro.md" "projects/<slug>/video/narracao.mp3"
```

**4. Registre a escolha** no cabeçalho do `roteiro.md`, em comentário HTML: nome da voz, ID e os três valores. Sem isso não dá para regerar igual nem trocar com consciência depois.

**5. Ao entregar, diga qual voz usou e por quê**, em uma linha, e avise que dá para trocar. Exemplo: _"A narração usou a voz Ana Alice, calma e clara, por ser uma clínica. Se preferir outro tom, é só pedir."_

Se o usuário pedir para trocar, liste 2 ou 3 alternativas com uma característica de cada, deixe ele escolher e regere apenas a narração e o áudio — a composição e os cortes só precisam ser refeitos se a nova duração mudar.

Para pegar o tempo de uma palavra específica (nome de produto, cidade, horário — qualquer coisa que dispare uma animação):

```
node -e "const t=require('./projects/<slug>/video/narracao.timing.json'); t.palavras.forEach(p=>console.log(p.inicio.toFixed(2), p.texto))"
```

## 2b. Trilha e efeitos sonoros (ElevenLabs Sound Generation)

Gere com `node engine/tts/sfx.mjs "<prompt em inglês>" <saida.mp3> [duração] [loop]` em `projects/<slug>/video/sfx/`:

- **Trilha de fundo**: 22s com `loop`, prompt no clima do nicho (ex.: "upbeat funk ad music" para lanches, "soft acoustic corporate" para clínicas), sempre "no vocals, seamless loop".
- **Efeitos**: whoosh de transição (1s), 1–2 efeitos temáticos do nicho (chiado de chapa, tesoura, notificação etc.), pop para entradas de elementos.

Copie tudo para `engine/video/public/<slug>/` e mixe na composição com `<Audio>`:
- Trilha: `loop` + volume ~0.12–0.15 com fade in/out (função de frame com `interpolate`) — a narração manda, a trilha acompanha.
- Whoosh ~0.35 alguns frames antes de cada corte de cena; efeitos temáticos ~0.25–0.3; pops ~0.4 sincronizados com os springs.

## 3. Composição Remotion

Crie `engine/video/src/compositions/<slug>/Main.tsx` — uma composição NOVA por projeto, escrita sob medida:

- Use as cores e o estilo do briefing (importe nada de outros projetos).
**Regra de ouro do motion: ~70% animação gráfica, ~30% texto.** Texto grande e parado em tela é preguiça — cada cena precisa de algo se movendo que conte a história.

### Mesclar fotos reais com o motion

Vídeo 100% desenhado parece genérico; vídeo 100% foto parece slideshow. **Misture**, dividindo por função:

- **Foto real** onde o objetivo é dar desejo pelo produto: cena de gancho (foto em zoom lento), cada produto citado na narração, provocação final. Copie as fotos otimizadas para `engine/video/public/<slug>/` e use o `<Img>` do Remotion (não `<img>` — o render precisa esperar o carregamento).
- **Motion desenhado** onde a foto não consegue contar: produto se montando camada a camada, relógio girando, veículo de entrega cruzando a tela, mapa com radar, interface de celular.
- **Fotos no lugar de partículas**: elementos secundários (acompanhamentos, embalagens) subindo e girando ao fundo valem muito mais que emojis flutuando.
- **Foto sem recorte transparente** entra emoldurada em um cartão (fundo claro, borda, sombra, leve rotação) — vira um recurso visual em vez de um retângulo estranho sobre a cena.
- A foto entra com `spring()` e rotação inicial, e flutua suavemente: foto parada no meio de um vídeo animado quebra o ritmo.

- **Ritmo**: cenas de **1 a 3 segundos**, nunca mais. Um vídeo de 30s tem 10–14 cenas.
- **Objetos desenhados, não emoji como protagonista**: construa o produto/serviço com formas animadas (no caso de comida: o item se montando camada por camada; numa clínica: antes/depois deslizando; numa loja: produto girando). Emoji serve de apoio em partículas, nunca como o herói da cena — 🤠 no lugar de um hambúrguer fica ridículo.
  - **Formas retangulares e empilháveis** (camadas de um lanche, caixas, barras): `div` com `border-radius` resolve bem.
  - **Formas orgânicas ou de marca** (o arco de um logo, uma folha, uma rodela, ícones): **SVG inline**, sempre. Em CSS puro elas viram manchas amorfas. Com SVG dá para animar o traço se desenhando (`stroke-dasharray` + `stroke-dashoffset`), que é um dos efeitos de maior impacto e serve para recriar o logo do cliente na abertura e no fecho.
- **Ilustre cada afirmação da narração**: "entregamos em casa" → veículo atravessando a tela com linhas de velocidade; "aberto até 23h" → relógio com ponteiros girando; "aqui na cidade X" → pin de mapa com ondas de radar.
- **Fundo sempre vivo**: sunburst em `repeating-conic-gradient` girando lentamente, partículas subindo, linhas de velocidade.
- **Física**: `spring()` com damping 8–11 em tudo que entra; squash-and-stretch (`scaleX`/`scaleY` opostos) no impacto; flutuação com `Math.sin(frame / n)`.
- **Verifique antes do render completo**: `npx remotion still <slug> saida.png --frame=N` em 4–6 frames-chave e olhe as imagens. Erros de empilhamento e proporção só aparecem assim.
- Inclua o áudio: `<Audio src={staticFile("<slug>/narracao.mp3")} />` — copie o mp3 para `engine/video/public/<slug>/` antes.
- Duração = duração do áudio + 1s de respiro. FPS 30, **1920x1080 (horizontal — o vídeo vai embutido no site)**. Só gere vertical (1080x1920) se o usuário pedir explicitamente uma versão para stories/reels.
- **Sincronia é obrigatória**: os cortes de cena saem dos tempos de `narracao.timing.json`, e cada animação dentro da cena dispara na palavra correspondente (frame = `(tempoDaPalavra - inicioDaCena) * 30`). Efeitos sonoros também: o "ding" toca na palavra "WhatsApp", o "pop" no instante em que cada elemento cai. Deixe os tempos como comentário no código, para quem for ajustar depois.

Registre em `engine/video/src/Root.tsx`: importe o Main e adicione um `<Composition id="<slug>" ... />` com `durationInFrames` calculado.

## 4. Render

```
cd engine/video
npx remotion render <slug> ../../projects/<slug>/video/promo.mp4
```

Primeira execução baixa o Chrome headless do Remotion — é normal demorar. Se der erro de dependências, rode `npm install` em `engine/video` primeiro.

## 5. Verificação

Confira que o MP4 existe e tem tamanho plausível (> 500 KB). Abra no Browser pane ou mande via SendUserFile para o usuário assistir antes de embutir no site.
