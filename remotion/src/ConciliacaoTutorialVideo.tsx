import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { ConciliacaoIntro } from "./conciliacao-tutorial/ConciliacaoIntro";
import { BancoCadastro } from "./conciliacao-tutorial/BancoCadastro";
import { ImportOFXScene } from "./conciliacao-tutorial/ImportOFXScene";
import { ConciliacaoProcesso } from "./conciliacao-tutorial/ConciliacaoProcesso";
import { CartaoImportScene } from "./conciliacao-tutorial/CartaoImportScene";
import { CartaoConciliacao } from "./conciliacao-tutorial/CartaoConciliacao";
import { ConciliacaoOutro } from "./conciliacao-tutorial/ConciliacaoOutro";
import { PersistentBackground } from "./components/PersistentBackground";

const TRANSITION_DURATION = 18;
const timing = springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION_DURATION });

// Scene durations
// Intro: 150, BancoCadastro: 210, ImportOFX: 240, Processo: 240, CartaoImport: 240, CartaoConciliacao: 220, Outro: 160
// Total: 1460 - (6 * 18) = 1460 - 108 = 1352 frames (~45s)

export const ConciliacaoTutorialVideo = () => {
  return (
    <AbsoluteFill>
      <PersistentBackground />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={150}>
          <ConciliacaoIntro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={210}>
          <BancoCadastro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-left" })} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={240}>
          <ImportOFXScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={240}>
          <ConciliacaoProcesso />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={240}>
          <CartaoImportScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-left" })} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={220}>
          <CartaoConciliacao />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={160}>
          <ConciliacaoOutro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
