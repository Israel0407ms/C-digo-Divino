// Servidor local do SITES STUDIO AAR — zero dependências.
// Serve a interface (app/ui), a API de pedidos/configuração (app/data)
// e os sites gerados (projects/<slug>/site) para preview.

import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, extname, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const UI = join(ROOT, "app", "ui");
const DATA = join(ROOT, "app", "data");
const PROJECTS = join(ROOT, "projects");
// a porta vem do ambiente quando o preview atribui uma; 4517 é só o padrão
const PORT = Number(process.env.PORT) || 4517;

mkdirSync(DATA, { recursive: true });

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

const readJson = (file, fallback) => {
  try {
    return JSON.parse(readFileSync(join(DATA, file), "utf8"));
  } catch {
    return fallback;
  }
};
const writeJson = (file, value) =>
  writeFileSync(join(DATA, file), JSON.stringify(value, null, 2), "utf8");

const listProjects = () => {
  if (!existsSync(PROJECTS)) return [];
  return readdirSync(PROJECTS)
    .filter((name) => {
      try {
        return statSync(join(PROJECTS, name)).isDirectory();
      } catch {
        return false;
      }
    })
    .map((slug) => ({
      slug,
      hasSite: existsSync(join(PROJECTS, slug, "site", "index.html")),
      hasVideo: existsSync(join(PROJECTS, slug, "video", "promo.mp4")),
      hasBriefing: existsSync(join(PROJECTS, slug, "briefing.md")),
    }));
};

const body = (req) =>
  new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch {
        resolve({});
      }
    });
  });

const send = (res, status, payload, type = "application/json; charset=utf-8") => {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(type.startsWith("application/json") ? JSON.stringify(payload) : payload);
};

const serveFile = (res, base, rel) => {
  const path = normalize(join(base, rel));
  if (!path.startsWith(normalize(base))) return send(res, 403, { erro: "caminho inválido" });
  if (!existsSync(path) || statSync(path).isDirectory()) {
    const index = join(path, "index.html");
    if (existsSync(index)) return serveFile(res, base, join(rel, "index.html"));
    return send(res, 404, { erro: "não encontrado" });
  }
  res.writeHead(200, { "Content-Type": MIME[extname(path).toLowerCase()] || "application/octet-stream" });
  res.end(readFileSync(path));
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = decodeURIComponent(url.pathname);

  // --- API ---
  if (path === "/api/state" && req.method === "GET") {
    const config = readJson("config.json", {});
    return send(res, 200, {
      config: {
        temChaveElevenLabs: Boolean(config.elevenLabsApiKey),
        elevenLabsVoiceId: config.elevenLabsVoiceId || "",
      },
      pedidos: readJson("pedidos.json", []),
      projetos: listProjects(),
    });
  }

  if (path === "/api/config" && req.method === "POST") {
    const { elevenLabsApiKey, elevenLabsVoiceId } = await body(req);
    const config = readJson("config.json", {});

    // Testa a chave na hora: é melhor a pessoa descobrir agora do que
    // no meio da geração do primeiro vídeo.
    if (typeof elevenLabsApiKey === "string" && elevenLabsApiKey.trim()) {
      const chave = elevenLabsApiKey.trim();
      try {
        const teste = await fetch("https://api.elevenlabs.io/v1/user", {
          headers: { "xi-api-key": chave },
          signal: AbortSignal.timeout(15000),
        });
        if (teste.status === 401) {
          return send(res, 200, {
            ok: false,
            erro: "Essa chave não foi aceita pela ElevenLabs. Confira se copiou ela inteira, sem espaços.",
          });
        }
        if (!teste.ok) {
          return send(res, 200, {
            ok: false,
            erro: `A ElevenLabs respondeu com erro ${teste.status}. Tente de novo em alguns instantes.`,
          });
        }
      } catch {
        return send(res, 200, {
          ok: false,
          erro: "Não consegui falar com a ElevenLabs. Verifique sua conexão com a internet.",
        });
      }
      config.elevenLabsApiKey = chave;
    }

    if (typeof elevenLabsVoiceId === "string") {
      config.elevenLabsVoiceId = elevenLabsVoiceId.trim();
    }
    writeJson("config.json", config);
    return send(res, 200, { ok: true });
  }

  // Lista as vozes PT-BR da conta, para a pessoa escolher sem sair do app
  if (path === "/api/vozes" && req.method === "GET") {
    const config = readJson("config.json", {});
    if (!config.elevenLabsApiKey) return send(res, 200, { vozes: [] });
    try {
      const r = await fetch("https://api.elevenlabs.io/v1/voices", {
        headers: { "xi-api-key": config.elevenLabsApiKey },
        signal: AbortSignal.timeout(15000),
      });
      if (!r.ok) return send(res, 200, { vozes: [] });
      const dados = await r.json();
      const vozes = (dados.voices || [])
        .filter((v) => (v.labels?.language || "").startsWith("pt"))
        .map((v) => ({ id: v.voice_id, nome: v.name }));
      return send(res, 200, { vozes });
    } catch {
      return send(res, 200, { vozes: [] });
    }
  }

  if (path === "/api/pedido" && req.method === "POST") {
    const { instagram, observacoes, comVideo, formatoVideo } = await body(req);
    if (!instagram || !String(instagram).trim()) {
      return send(res, 400, { erro: "Informe a URL ou @ do Instagram." });
    }
    const pedidos = readJson("pedidos.json", []);
    pedidos.push({
      id: `p${pedidos.length + 1}-${Math.random().toString(36).slice(2, 8)}`,
      instagram: String(instagram).trim(),
      observacoes: String(observacoes || "").trim(),
      comVideo: comVideo !== false,
      formatoVideo: formatoVideo === "vertical" ? "vertical" : "horizontal",
      status: "pendente",
      criadoEm: new Date().toISOString(),
    });
    writeJson("pedidos.json", pedidos);
    return send(res, 200, { ok: true });
  }

  if (path === "/api/pedido/remover" && req.method === "POST") {
    const { id } = await body(req);
    writeJson("pedidos.json", readJson("pedidos.json", []).filter((p) => p.id !== id));
    return send(res, 200, { ok: true });
  }

  // --- Sites gerados (preview) ---
  if (path.startsWith("/projects/")) {
    return serveFile(res, PROJECTS, path.slice("/projects/".length));
  }

  // --- Interface ---
  return serveFile(res, UI, path === "/" ? "index.html" : path);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`SITES STUDIO AAR rodando em http://localhost:${PORT}`);
});
