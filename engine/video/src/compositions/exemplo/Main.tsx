import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Composição de EXEMPLO — serve de referência de estilo para as composições
// geradas por projeto. Cada projeto ganha a sua própria pasta em
// src/compositions/<slug>/ com cores, textos e cenas do briefing do cliente.

const brand = {
  bg: "#1a1226",
  accent: "#ff7a59",
  text: "#fff7f0",
};

const Cena: React.FC<{ titulo: string; sub?: string }> = ({ titulo, sub }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14 } });
  const y = interpolate(enter, [0, 1], [80, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: brand.bg,
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      <div
        style={{
          transform: `translateY(${y}px)`,
          opacity: enter,
          textAlign: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h1 style={{ color: brand.text, fontSize: 96, lineHeight: 1.1, margin: 0 }}>
          {titulo}
        </h1>
        {sub ? (
          <p style={{ color: brand.accent, fontSize: 48, marginTop: 32 }}>{sub}</p>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

export const Main: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: brand.bg }}>
      {/* <Audio src={staticFile("<slug>/narracao.mp3")} /> — habilitar por projeto */}
      <Sequence durationInFrames={4 * fps}>
        <Cena titulo="SITES STUDIO" sub="motor de vídeo funcionando" />
      </Sequence>
      <Sequence from={4 * fps}>
        <Cena titulo="Pronto para o primeiro cliente" sub="/criar-site @perfil" />
      </Sequence>
    </AbsoluteFill>
  );
};
