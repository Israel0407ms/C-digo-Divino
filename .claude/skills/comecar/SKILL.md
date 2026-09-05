---
name: comecar
description: Prepara o app na primeira vez e conduz o usuário até o primeiro site. Use quando a pessoa abrir o projeto pela primeira vez, disser oi/começar/ajuda, ou quando faltar alguma coisa para o pipeline rodar (dependências não instaladas, chave da ElevenLabs ausente).
---

# Começar

O usuário provavelmente é leigo. **Ele não deve precisar rodar comando nenhum, abrir terminal nem editar arquivo.** Você faz tudo; ele só conversa.

Fale de forma simples e curta, sem jargão técnico. Nada de "npm", "dependências", "API" — diga "preparar o app", "conta da narração".

## 1. Veja o que falta (sem perguntar nada)

Verifique em silêncio:

| O quê | Como checar |
|---|---|
| Node instalado | `node --version` |
| App preparado | existe `engine/video/node_modules` e `engine/media/node_modules`? |
| Chave da narração | `app/data/config.json` tem `elevenLabsApiKey`? |

## 2. Se faltar o Node

Só nesse caso o usuário precisa fazer algo, porque não dá para instalar sem permissão dele. Diga assim:

> Preciso instalar um componente na sua máquina (o Node.js, gratuito) para o app funcionar. Posso instalar agora?

Com o "sim": `winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements --silent`
Se o winget não existir ou falhar, mande o link https://nodejs.org e diga para baixar o botão da esquerda (LTS) e avisar quando terminar.

Depois de instalar, use `"C:\Program Files\nodejs\node.exe"` (ou reabra o terminal) até a sessão enxergar o `node`.

## 3. Prepare o app

Se faltarem as pastas de componentes, rode você mesmo, avisando que vai demorar alguns minutos:

```
npm install --no-fund --no-audit --loglevel=error
```

em `engine/video` e em `engine/media`. Crie também `projects/`, `app/data/` e `engine/video/public/` se não existirem.

Enquanto instala, aproveite para já perguntar o Instagram do cliente — assim o tempo de espera rende.

## 4. Chave da narração (só quando for preciso)

**Não peça a chave logo de cara.** Ela só é necessária para o vídeo. Se ainda não existir, peça no momento de gerar o vídeo, assim:

> Para o vídeo ter narração, preciso de uma chave da ElevenLabs (é gratuito para começar):
> 1. Entre em https://elevenlabs.io e crie uma conta
> 2. Clique na sua foto (canto superior direito) → API Keys
> 3. Copie a chave e cole aqui na conversa
>
> Se preferir, posso entregar o site sem vídeo agora e a gente faz o vídeo depois.

Recebida a chave, **você mesmo salva** em `app/data/config.json` (campo `elevenLabsApiKey`) e confirma que funciona chamando `https://api.elevenlabs.io/v1/user`. Nunca mande o usuário editar arquivo.

## 5. Abra o painel — é onde ele vai trabalhar

Assim que o app estiver preparado, **abra o painel sem esperar ele pedir**:

```
preview_start  name: studio
```

Ele abre numa aba do navegador **dentro do próprio Claude Code**, ao lado da conversa. Diga isso a ele:

> Abri o painel aqui do lado. É por ali que você usa o app: cola o Instagram do cliente, clica em Registrar pedido, e me avisa "roda o pedido". Os sites prontos ficam listados nele também.

## 6. Faça o site

Quando ele registrar o pedido e avisar, execute a skill `criar-site` (sem argumento — ela pega o pedido pendente). Ao terminar, marque o pedido como `concluido` em `app/data/pedidos.json` para ele aparecer pronto na tela.

## 7. Ao terminar

Mostre o site no navegador e diga, em linguagem simples:
- onde o site ficou salvo (`projects/<slug>/site/`);
- que ele pode pedir qualquer ajuste em conversa ("muda a cor", "troca a voz do vídeo", "tira essa seção");
- que para criar outro é só mandar outro Instagram.

## O painel é o produto

Não trate o painel como opcional. Ele é o que transforma isto em um app aos olhos do usuário: sem ele, a pessoa fica achando que só está conversando com um assistente. Mantenha o painel aberto durante o uso.

Se mesmo assim ela preferir mandar o Instagram direto no chat, atenda normalmente — mas deixe o painel aberto para ela ver os projetos ficando prontos.
