// Monta uma folha de contato com todas as imagens de uma pasta, numeradas.
// Serve para escolher e nomear as fotos de uma vez só, em vez de abrir uma a uma.
//
// Uso: node engine/media/folha-contato.mjs <pasta> <saida.jpg>
import sharp from "sharp";
import { readdirSync } from "node:fs";
const dir = process.argv[2], saida = process.argv[3];
const COL = 5, LADO = 300;
const arqs = readdirSync(dir).filter(f=>/\.(jpg|jpeg|png|webp)$/i.test(f)).sort();
const lin = Math.ceil(arqs.length / COL);
const tiles = [];
for (const [i, f] of arqs.entries()) {
  const buf = await sharp(`${dir}/${f}`).resize(LADO, LADO, {fit:"contain",background:"#111"}).toBuffer();
  tiles.push({ input: buf, left: (i % COL) * LADO, top: Math.floor(i / COL) * LADO });
  const rot = Buffer.from(`<svg width="${LADO}" height="26"><rect width="${LADO}" height="26" fill="rgba(0,0,0,.75)"/><text x="6" y="18" fill="#fff" font-size="15" font-family="monospace">${i+1}. ${f.replace(/\.[a-z]+$/,'').slice(0,30)}</text></svg>`);
  tiles.push({ input: rot, left: (i % COL) * LADO, top: Math.floor(i / COL) * LADO + LADO - 26 });
}
await sharp({create:{width:COL*LADO, height:lin*LADO, channels:3, background:"#111"}})
  .composite(tiles).jpeg({quality:76}).toFile(saida);
console.log(`folha: ${arqs.length} imagens`);
