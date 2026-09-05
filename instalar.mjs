// Instalador do SITES STUDIO AAR.
//
// No Windows, prefira clicar duas vezes em INSTALAR.bat — ele instala o
// Node.js automaticamente se faltar. Este arquivo é a etapa seguinte.
//
// Uso direto: node instalar.mjs

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = dirname(fileURLToPath(import.meta.url));
const linha = () => console.log("  " + "-".repeat(46));
const ok = (t) => console.log(`  [ok]   ${t}`);
const erro = (t) => console.log(`  [erro] ${t}`);
const info = (t) => console.log(`         ${t}`);

console.log("");
linha();
console.log("   SITES STUDIO AAR — preparando o app");
linha();
console.log("");

let falhou = false;

/* -------------------- 1. Node -------------------- */
const versaoNode = Number(process.versions.node.split(".")[0]);
if (versaoNode < 20) {
  erro(`Node.js ${process.versions.node} é antigo demais.`);
  info("Este app precisa da versão 20 ou mais nova.");
  info("Baixe em https://nodejs.org (botão da esquerda, LTS),");
  info("instale e rode este instalador de novo.");
  process.exit(1);
}
ok(`Node.js ${process.versions.node}`);

/* -------------------- 2. Internet -------------------- */
process.stdout.write("  ...    verificando conexão com a internet\r");
try {
  await fetch("https://registry.npmjs.org/-/ping", { signal: AbortSignal.timeout(12000) });
  ok("Conexão com a internet                        ");
} catch {
  erro("Sem conexão com a internet.                   ");
  info("O app precisa baixar componentes na primeira instalação.");
  info("Conecte-se e rode o instalador de novo.");
  process.exit(1);
}

/* -------------------- 3. Componentes -------------------- */
const motores = [
  { nome: "motor de vídeo", pasta: join(RAIZ, "engine", "video"), pesado: true },
  { nome: "motor de imagens", pasta: join(RAIZ, "engine", "media"), pesado: false },
];

for (const m of motores) {
  if (existsSync(join(m.pasta, "node_modules"))) {
    ok(`${m.nome} (já estava instalado)`);
    continue;
  }
  console.log("");
  info(`Baixando o ${m.nome}...`);
  if (m.pesado) info("Esta parte é a mais demorada. Pode levar alguns minutos.");
  console.log("");
  try {
    execSync("npm install --no-fund --no-audit --loglevel=error", { cwd: m.pasta, stdio: "inherit" });
    ok(`${m.nome} instalado`);
  } catch {
    erro(`Não consegui instalar o ${m.nome}.`);
    info("Causas comuns: internet instável ou antivírus bloqueando.");
    info("Tente rodar o instalador de novo. Se insistir, envie");
    info("uma foto desta tela para o suporte.");
    falhou = true;
  }
}

/* -------------------- 4. Pastas de trabalho -------------------- */
console.log("");
["projects", join("app", "data"), join("engine", "video", "public")].forEach((p) => {
  const caminho = join(RAIZ, p);
  if (!existsSync(caminho)) mkdirSync(caminho, { recursive: true });
});
const config = join(RAIZ, "app", "data", "config.json");
if (!existsSync(config)) writeFileSync(config, JSON.stringify({}, null, 2), "utf8");
ok("Pastas de trabalho prontas");

/* -------------------- 5. Teste real -------------------- */
process.stdout.write("  ...    testando o app\r");
let testeOk = true;
try {
  const sharp = join(RAIZ, "engine", "media", "node_modules", "sharp");
  if (!existsSync(sharp)) throw new Error("sharp");
  const recorte = join(RAIZ, "engine", "media", "node_modules", "@imgly", "background-removal-node");
  if (!existsSync(recorte)) throw new Error("recorte de fundo");
  const remotion = join(RAIZ, "engine", "video", "node_modules", "remotion");
  if (!existsSync(remotion)) throw new Error("remotion");
  ok("Teste do app: tudo no lugar                    ");
} catch (e) {
  erro(`Teste do app: falta o componente "${e.message}"   `);
  info("Rode o instalador novamente.");
  testeOk = false;
  falhou = true;
}

/* -------------------- 6. Resultado -------------------- */
console.log("");
linha();
if (falhou || !testeOk) {
  console.log("   INSTALAÇÃO INCOMPLETA");
  linha();
  console.log("");
  console.log("   Rode o instalador de novo. Se o erro repetir,");
  console.log("   envie uma foto desta tela para o suporte.");
  console.log("");
  process.exit(1);
}

console.log("   PRONTO! O app está instalado.");
linha();
console.log(`
   O QUE FAZER AGORA:

   1) Abra o app
      Windows: clique duas vezes em ABRIR-STUDIO.bat
      Outros:  node app/server.mjs
      A tela abre em http://localhost:4517

   2) Configure a narração dos vídeos
      Crie uma conta em https://elevenlabs.io
      Vá em Profile -> API Keys e copie a chave
      Cole na aba "Configurações" do app e salve
      (o app testa a chave na hora e avisa se estiver certa)

   3) Gere seu primeiro site
      No app, registre um pedido com o Instagram do cliente
      Depois abra esta pasta no Claude Code e diga:
      "roda o pedido"

   Dúvidas? Leia o COMECE-AQUI.txt
`);
