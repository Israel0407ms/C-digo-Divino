// Remove o fundo de uma foto e devolve PNG com canal alpha — o insumo do
// efeito "saindo do card" descrito na skill criar-site.
//
// Uso: node engine/media/recortar-fundo.mjs <entrada|pasta> <pasta-destino> [--margem=N]
//
// Roda 100% local (ONNX + modelo isnet). A primeira execução baixa o modelo
// (~40 MB) e fica em cache; as seguintes são offline.
//
// Depois de recortar, imprime a caixa útil de cada imagem: quanto do quadro o
// objeto realmente ocupa. Serve para calibrar o transbordo do card sem chutar.

import { readFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, resolve, basename, extname, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";

// ORDEM IMPORTA (Windows): o onnxruntime que vem dentro do @imgly carrega DLLs
// que impedem o libvips de abrir depois — o sharp passa a falhar com
// ERR_DLOPEN_FAILED. Inicializando o sharp primeiro, os dois convivem.
// Por isso o import do @imgly é dinâmico e vem depois desta chamada.
await sharp({ create: { width: 8, height: 8, channels: 3, background: "#000" } }).png().toBuffer();
const { removeBackground } = await import("@imgly/background-removal-node");

// O pacote procura os pesos do modelo a partir do cwd. Como este script é
// chamado da raiz do projeto, apontamos o publicPath para o dist do próprio
// pacote — assim funciona de qualquer diretório, e offline.
const distImgly =
  pathToFileURL(
    join(dirname(fileURLToPath(import.meta.url)), "node_modules", "@imgly", "background-removal-node", "dist") + "/"
  ).href;

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith("--"));
const [entrada, destino] = args.filter((a) => !a.startsWith("--"));

if (!entrada || !destino) {
  console.error("Uso: node recortar-fundo.mjs <entrada|pasta> <pasta-destino> [--margem=N]");
  process.exit(1);
}

const margem = Number((flags.find((f) => f.startsWith("--margem=")) || "--margem=12").split("=")[1]);

// Corte de alpha. O modelo costuma deixar restos semitransparentes do fundo
// (cartazes, bandeiras, reflexos) que aparecem como fantasma sobre o card.
// Tudo abaixo deste alpha vira 0; acima, vira opaco. 0 desliga a limpeza.
const limpeza = Number((flags.find((f) => f.startsWith("--limpar=")) || "--limpar=0").split("=")[1]);

// Zera o que estiver abaixo do corte e reforça o que está acima, mantendo uma
// faixa estreita de meio-tom para a borda não ficar serrilhada.
const limparAlpha = async (buf, corte) => {
  const img = sharp(buf).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const faixa = 26;
  for (let i = 3; i < data.length; i += info.channels) {
    const a = data[i];
    if (a < corte) data[i] = 0;
    else if (a < corte + faixa) data[i] = Math.round(((a - corte) / faixa) * 255);
    else data[i] = 255;
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .png()
    .toBuffer();
};

const dir = resolve(destino);
mkdirSync(dir, { recursive: true });

const alvo = resolve(entrada);
const arquivos = statSync(alvo).isDirectory()
  ? readdirSync(alvo)
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .map((f) => join(alvo, f))
  : [alvo];

if (!arquivos.length) {
  console.error("Nenhuma imagem encontrada em " + alvo);
  process.exit(1);
}

// Caixa que contém tudo com alpha acima do limiar — mede o objeto, não a tela.
const caixaUtil = async (buf, limiar = 12) => {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  let x0 = w, y0 = h, x1 = -1, y1 = -1, visiveis = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * c + 3] > limiar) {
        visiveis++;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  return { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1, cobertura: visiveis / (w * h) };
};

console.log(`Recortando ${arquivos.length} imagem(ns)…`);

for (const arquivo of arquivos) {
  const nome = basename(arquivo, extname(arquivo));
  try {
    // Normaliza para PNG antes de entregar: o detector de formato do pacote
    // não reconhece WebP e devolve "Unsupported format". O Blob leva o mime
    // explícito porque um Buffer cru também cai nessa checagem.
    const entradaPng = await sharp(readFileSync(arquivo)).png().toBuffer();
    const blob = await removeBackground(new Blob([entradaPng], { type: "image/png" }), {
      publicPath: distImgly,
      output: { format: "image/png" },
    });
    let recortado = Buffer.from(await blob.arrayBuffer());
    if (limpeza > 0) recortado = await limparAlpha(recortado, limpeza);

    const caixa = await caixaUtil(recortado);
    if (!caixa) {
      console.log(`  ✗ ${nome}: nada sobrou depois do recorte — use a foto original`);
      continue;
    }

    // apara o vazio ao redor e devolve uma margem pequena, para o objeto
    // encostar na borda do PNG (é isso que faz o transbordo funcionar)
    const meta = await sharp(recortado).metadata();
    const esq = Math.max(0, caixa.x0 - margem);
    const topo = Math.max(0, caixa.y0 - margem);
    const larg = Math.min(meta.width - esq, caixa.w + margem * 2);
    const alt = Math.min(meta.height - topo, caixa.h + margem * 2);

    const saida = join(dir, `${nome}.png`);
    await sharp(recortado)
      .extract({ left: esq, top: topo, width: larg, height: alt })
      .png({ compressionLevel: 9 })
      .toFile(saida);

    const kb = Math.round(statSync(saida).size / 1024);
    console.log(
      `  ✓ ${nome}: ${larg}x${alt} · objeto ocupa ${(caixa.cobertura * 100).toFixed(0)}% do quadro original · ${kb} KB`
    );
  } catch (erro) {
    console.log(`  ✗ ${nome}: ${erro.message}`);
  }
}

console.log(`\nPNGs com alpha em ${dir}`);
console.log("Confira cada recorte antes de usar: cabelo, toga e vidro costumam sair rasgados.");
