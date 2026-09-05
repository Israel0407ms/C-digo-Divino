// Efeitos sonoros e trilhas via ElevenLabs Sound Generation.
// Uso: node sfx.mjs "<prompt em inglês>" <saida.mp3> [duracaoSegundos] [loop]
// Ex.:  node sfx.mjs "cartoon whoosh transition" whoosh.mp3 1
//       node sfx.mjs "upbeat funk ad music, no vocals" trilha.mp3 22 loop
// Env/config: mesma chave do narrate.mjs (app/data/config.json ou ELEVENLABS_API_KEY)

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const [, , prompt, output, duracao, loopFlag] = process.argv;
if (!prompt || !output) {
  console.error('Uso: node sfx.mjs "<prompt>" <saida.mp3> [duracaoSegundos] [loop]');
  process.exit(1);
}

let config = {};
try {
  const configPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "data", "config.json");
  config = JSON.parse(readFileSync(configPath, "utf8").replace(new RegExp("^\\uFEFF"), ""));
} catch {}

const apiKey = process.env.ELEVENLABS_API_KEY || config.elevenLabsApiKey;
if (!apiKey) {
  console.error("Chave ElevenLabs não configurada.");
  process.exit(1);
}

const body = { text: prompt, prompt_influence: 0.4 };
if (duracao) body.duration_seconds = Number(duracao);
if (loopFlag === "loop") body.loop = true;

const res = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
  method: "POST",
  headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

if (!res.ok) {
  console.error(`ElevenLabs respondeu ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const buf = Buffer.from(await res.arrayBuffer());
const outPath = resolve(output);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, buf);
console.log(`OK: ${outPath} (${(buf.length / 1024).toFixed(0)} KB)`);
