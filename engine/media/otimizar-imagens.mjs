// Converte as fotos baixadas para WebP otimizado (site rápido).
// Uso: node otimizar-imagens.mjs <pasta> [larguraMax]
//
// Gera <nome>.webp ao lado do original e APAGA o arquivo original
// (o .webp é o que o site referencia). Imagens já pequenas são apenas
// convertidas, sem ampliar.

import { readdirSync, statSync, unlinkSync } from "node:fs";
import { join, extname, basename, resolve } from "node:path";
import sharp from "sharp";

const [, , pasta, larguraArg] = process.argv;
if (!pasta) {
  console.error("Uso: node otimizar-imagens.mjs <pasta> [larguraMax]");
  process.exit(1);
}

const dir = resolve(pasta);
const larguraMax = Number(larguraArg) || 1200;
const entradas = readdirSync(dir).filter((f) => /\.(png|jpe?g)$/i.test(f));

let antes = 0;
let depois = 0;

for (const arquivo of entradas) {
  const origem = join(dir, arquivo);
  const destino = join(dir, basename(arquivo, extname(arquivo)) + ".webp");
  const tamanhoOriginal = statSync(origem).size;
  try {
    const img = sharp(origem);
    const meta = await img.metadata();
    const redimensionar = meta.width > larguraMax;
    await img
      .resize(redimensionar ? { width: larguraMax, withoutEnlargement: true } : undefined)
      .webp({ quality: 82, effort: 5 })
      .toFile(destino);
    const novoTamanho = statSync(destino).size;
    antes += tamanhoOriginal;
    depois += novoTamanho;
    unlinkSync(origem);
    console.log(
      `  ${basename(destino)}: ${Math.round(tamanhoOriginal / 1024)} KB → ${Math.round(novoTamanho / 1024)} KB` +
        (redimensionar ? ` (redimensionada para ${larguraMax}px)` : "")
    );
  } catch (e) {
    console.log(`  ✗ ${arquivo}: ${e.message}`);
  }
}

console.log(
  `\nTotal: ${Math.round(antes / 1024)} KB → ${Math.round(depois / 1024)} KB ` +
    `(${antes ? Math.round((1 - depois / antes) * 100) : 0}% menor)`
);
