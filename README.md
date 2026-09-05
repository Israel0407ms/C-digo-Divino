# SITES STUDIO AAR

**De um perfil de Instagram para um site profissional com vídeo narrado — em uma conversa.**

Você passa a URL do Instagram de um negócio. O app vasculha o perfil (bio, posts, destaques, link da bio e tudo que estiver linkado), entende o produto, pesquisa 5 referências reais do nicho, e entrega:

- Um **site estático ultra-personalizado**, com design adequado ao nicho e copy original em PT-BR.
- Um **vídeo promocional em motion graphics com narração profissional**, embutido no site.

As fotos reais do cliente são baixadas do próprio perfil e, quando a cena pede,
têm o **fundo removido localmente** — daí sai o efeito de produto ou pessoa
saindo do quadro em 3D, sem depender de site de recorte nem de assinatura.

Tudo roda localmente dentro do **Claude Code** — o motor de inteligência é a assinatura Claude do próprio usuário. Sem custo de API para o operador do app (exceto a narração).

## Requisitos

- [Claude Code](https://claude.com/claude-code) (desktop ou CLI) com assinatura ativa
- Node.js 20+
- Conta [ElevenLabs](https://elevenlabs.io) para a narração (plano inicial já basta)

## Instalação

1. Clone/copie esta pasta e abra-a no Claude Code.
2. Instale o motor de vídeo:
   ```
   cd engine/video
   npm install
   ```
3. Configure a narração: copie `.env.example` para definir `ELEVENLABS_API_KEY` (e opcionalmente `ELEVENLABS_VOICE_ID` com uma voz PT-BR da Voice Library).

## Uso

Na conversa do Claude Code:

```
/criar-site https://instagram.com/perfil-do-cliente
```

O pipeline roda de ponta a ponta e abre o site pronto no navegador integrado. A saída de cada cliente fica em `projects/<slug>/`:

```
projects/<slug>/
├── briefing.md        o que o app entendeu do negócio
├── referencias.md     análise das 5 referências do nicho
├── site/              o site pronto (index.html autocontido)
└── video/             roteiro, narração .mp3 e promo.mp4
```

Para gerar só o vídeo de um projeto existente: `/gerar-video <slug>`.

## Como funciona por dentro

| Peça | Papel |
|---|---|
| `.claude/skills/` | O "cérebro": skills que orquestram análise, pesquisa, geração de site e vídeo |
| `engine/video/` | Projeto Remotion — cada cliente ganha uma composição React sob medida |
| `engine/tts/` | Script Node de narração via ElevenLabs (zero dependências) |
| `engine/media/` | Baixa e otimiza as fotos reais do cliente e **remove o fundo** delas — é o recorte que permite o efeito 3D de produto saindo do card |
| `CLAUDE.md` | Regras do pipeline que o Claude segue em toda sessão |

O Instagram é lido pelo navegador integrado do Claude Code usando a sessão logada do próprio usuário — sem API, funciona com qualquer perfil público.

## Limites conhecidos

- Perfis privados exigem que a conta logada do usuário os siga.
- A primeira renderização de vídeo baixa o Chrome headless do Remotion (demora alguns minutos, só uma vez).
- A qualidade da narração depende da voz escolhida na ElevenLabs — escolha uma voz nativa PT-BR.

---

## Licença

Uso regido pela [Licença de Uso](LICENCA.md). Você pode usar e adaptar o app e vender livremente os sites e vídeos gerados; não pode redistribuir ou revender o software em si.
