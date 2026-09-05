import { Composition } from "remotion";
import { Main as Exemplo } from "./compositions/exemplo/Main";

// Uma <Composition> por projeto. id = slug do projeto.
// durationInFrames = (duração do áudio em segundos + 1) * fps.
// A skill gerar-video registra cada cliente novo aqui.
export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="exemplo"
        component={Exemplo}
        durationInFrames={10 * 30}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
