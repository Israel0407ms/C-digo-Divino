// Baixa as fotos reais do cliente para dentro do projeto.
// Uso: node baixar-imagens.mjs <lista.json> <pasta-destino>
//
// lista.json: [{ "nome": "xerife", "url": "https://..." }, ...]
// Salva como <pasta-destino>/<nome>.<ext> e imprime um relatório com as
// dimensões de cada arquivo (para descartar imagens pequenas demais).
//
// Fontes típicas, em ordem de preferência:
//   1. Cardápio digital do cliente (Anota AI, Goomer, iFood...) — foto por produto
//   2. Posts do Instagram do próprio cliente
//   3. Banco de imagens do nicho (só para ambiente/textura, nunca como "o produto")

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const [, , listaPath, destino] = process.argv;
if (!listaPath || !destino) {
  console.error("Uso: node baixar-imagens.mjs <lista.json> <pasta-destino>");
  process.exit(1);
}

const lista = JSON.parse(readFileSync(listaPath, "utf8"));
const dir = resolve(destino);
mkdirSync(dir, { recursive: true });

// dimensões de PNG/JPEG/WebP lendo apenas o cabeçalho
const dimensoes = (buf) => {
  try {
    if (buf.slice(0, 8).toString("hex") === "89504e470d0a1a0a") {
      return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), tipo: "png" };
    }
    if (buf[0] === 0xff && buf[1] === 0xd8) {
      let i = 2;
      while (i < buf.length - 9) {
        if (buf[i] !== 0xff) { i++; continue; }
        const marcador = buf[i + 1];
        if (marcador >= 0xc0 && marcador <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marcador)) {
          return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7), tipo: "jpg" };
        }
        i += 2 + buf.readUInt16BE(i + 2);
      }
    }
    if (buf.slice(0, 4).toString() === "RIFF" && buf.slice(8, 12).toString() === "WEBP") {
      return { w: 0, h: 0, tipo: "webp" };
    }
  } catch {}
  return { w: 0, h: 0, tipo: "desconhecido" };
};

const extPorTipo = { png: "png", jpg: "jpg", webp: "webp", desconhecido: "jpg" };
const resultados = [];

for (const item of lista) {
  try {
    const res = await fetch(item.url, {
      headers: {
        // alguns CDNs recusam requisição sem user-agent de navegador
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
        Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
      },
    });
    if (!res.ok) {
      console.log(`  ✗ ${item.nome}: HTTP ${res.status}`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const d = dimensoes(buf);
    const arquivo = join(dir, `${item.nome}.${extPorTipo[d.tipo]}`);
    writeFileSync(arquivo, buf);
    resultados.push({ nome: item.nome, arquivo, ...d, kb: Math.round(buf.length / 1024) });
    console.log(`  ✓ ${item.nome}: ${d.w}x${d.h} ${d.tipo} (${Math.round(buf.length / 1024)} KB)`);
  } catch (e) {
    console.log(`  ✗ ${item.nome}: ${e.message}`);
  }
}

console.log(`\n${resultados.length}/${lista.length} imagens salvas em ${dir}`);
const pequenas = resultados.filter((r) => r.w && r.w < 400);
if (pequenas.length) {
  console.log(`Atenção — imagens pequenas (evite usar em hero/destaque): ${pequenas.map((p) => p.nome).join(", ")}`);
}
