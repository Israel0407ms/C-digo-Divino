// Narração via ElevenLabs COM TIMESTAMPS.
// Uso: node narrate.mjs <roteiro.md | "texto direto"> <saida.mp3>
//
// Além do .mp3, grava <saida>.timing.json com o tempo exato (em segundos) de
// cada caractere, palavra e frase — é isso que sincroniza as cenas do vídeo.
// Ao final imprime a tabela de frases com início/fim: use esses números
// como marcações das cenas na composição Remotion.
//
// Config: ELEVENLABS_API_KEY / ELEVENLABS_VOICE_ID no ambiente, ou
// app/data/config.json (salvo pela interface).

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const [, , input, output] = process.argv;
if (!input || !output) {
  console.error('Uso: node narrate.mjs <roteiro.md | "texto"> <saida.mp3>');
  process.exit(1);
}

let config = {};
try {
  const configPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "data", "config.json");
  config = JSON.parse(readFileSync(configPath, "utf8").replace(new RegExp("^\\uFEFF"), ""));
} catch {}

const apiKey = process.env.ELEVENLABS_API_KEY || config.elevenLabsApiKey;
if (!apiKey) {
  console.error("Chave ElevenLabs não configurada. Salve na interface (aba Configurações) ou defina ELEVENLABS_API_KEY.");
  process.exit(1);
}

const voiceId = process.env.ELEVENLABS_VOICE_ID || config.elevenLabsVoiceId || "21m00Tcm4TlvDq8ikWAM";

const num = (valor, padrao) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : padrao;
};

// Regra do roteiro.md: SÓ o texto da narração é lido. Títulos (#), comentários
// HTML e linhas de metadado (chave: valor) são descartados.
let text = input;
if (existsSync(input)) {
  text = readFileSync(input, "utf8")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^#.*$/gm, "")
    .replace(/^[A-Za-zÀ-ú ]{1,30}(alvo|:).*[·|].*$/gm, "")
    .replace(/^\s*(Duração|Tom|Voz|Formato|Obs)\b.*$/gim, "")
    .replace(/[*_>`]/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

const res = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`,
  {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      // O tom muda com o nicho: uma hamburgueria pede voz enérgica e rápida;
      // uma clínica pede voz calma e clara. Ajuste por projeto com as variáveis
      // ELEVENLABS_STABILITY / _STYLE / _SPEED, sem mexer na config global.
      voice_settings: {
        stability: num(process.env.ELEVENLABS_STABILITY, config.voiceSettings?.stability ?? 0.35),
        similarity_boost: num(process.env.ELEVENLABS_SIMILARITY, config.voiceSettings?.similarity_boost ?? 0.8),
        style: num(process.env.ELEVENLABS_STYLE, config.voiceSettings?.style ?? 0.45),
        use_speaker_boost: true,
        speed: num(process.env.ELEVENLABS_SPEED, config.voiceSettings?.speed ?? 1.08),
      },
    }),
  }
);

if (!res.ok) {
  console.error(`ElevenLabs respondeu ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const data = await res.json();
const buf = Buffer.from(data.audio_base64, "base64");
const outPath = resolve(output);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, buf);

/* ------------------------- alinhamento -> palavras/frases ------------------------- */

const al = data.alignment || data.normalized_alignment;
const chars = al?.characters || [];
const ini = al?.character_start_times_seconds || [];
const fim = al?.character_end_times_seconds || [];

const palavras = [];
let atual = null;
chars.forEach((ch, i) => {
  if (/\s/.test(ch)) {
    if (atual) { palavras.push(atual); atual = null; }
    return;
  }
  if (!atual) atual = { texto: "", inicio: ini[i], fim: fim[i] };
  atual.texto += ch;
  atual.fim = fim[i];
});
if (atual) palavras.push(atual);

// frases: quebra em . ! ? … e também em : —
const frases = [];
let buffer = [];
palavras.forEach((p) => {
  buffer.push(p);
  if (/[.!?…:]$/.test(p.texto)) {
    frases.push({
      texto: buffer.map((b) => b.texto).join(" "),
      inicio: buffer[0].inicio,
      fim: buffer[buffer.length - 1].fim,
    });
    buffer = [];
  }
});
if (buffer.length) {
  frases.push({
    texto: buffer.map((b) => b.texto).join(" "),
    inicio: buffer[0].inicio,
    fim: buffer[buffer.length - 1].fim,
  });
}

const duracao = palavras.length ? palavras[palavras.length - 1].fim : buf.length / 16000;

writeFileSync(
  outPath.replace(/\.mp3$/i, "") + ".timing.json",
  JSON.stringify({ duracao, texto: text, frases, palavras }, null, 2),
  "utf8"
);

/* --------------------------------- relatório --------------------------------- */

console.log(`OK: ${outPath} (${(buf.length / 1024).toFixed(0)} KB)`);
console.log(`Duração REAL: ${duracao.toFixed(2)}s  ·  ${Math.ceil((duracao + 1) * 30)} frames @30fps\n`);
console.log("Marcações das cenas (use estes tempos na composição):");
frases.forEach((f) => {
  const t = (n) => n.toFixed(2).padStart(6);
  console.log(`  ${t(f.inicio)} → ${t(f.fim)}   ${f.texto}`);
});
