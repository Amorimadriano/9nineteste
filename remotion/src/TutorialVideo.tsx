import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { TutorialIntro } from "./tutorial-scenes/TutorialIntro";
import { LoginScene } from "./tutorial-scenes/LoginScene";
import { DashboardTutorial } from "./tutorial-scenes/DashboardTutorial";
import { ContasPagarTutorial } from "./tutorial-scenes/ContasPagarTutorial";
import { ContasReceberTutorial } from "./tutorial-scenes/ContasReceberTutorial";
import { ConciliacaoTutorial } from "./tutorial-scenes/ConciliacaoTutorial";
import { RelatoriosTutorial } from "./tutorial-scenes/RelatoriosTutorial";
import { CategoriasTutorial } from "./tutorial-scenes/CategoriasTutorial";
import { TutorialOutro } from "./tutorial-scenes/TutorialOutro";
import { PersistentBackground } from "./components/PersistentBackground";

const TRANSITION_DURATION = 18;
const timing = springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION_DURATION });

export const TutorialVideo = () => {
  return (
    <AbsoluteFill>
      <PersistentBackground />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={150}>
          <TutorialIntro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={180}>
          <LoginScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-left" })} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={210}>
          <DashboardTutorial />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={210}>
          <ContasPagarTutorial />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={200}>
          <ContasReceberTutorial />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-left" })} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={210}>
          <ConciliacaoTutorial />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={190}>
          <RelatoriosTutorial />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={180}>
          <CategoriasTutorial />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={170}>
          <TutorialOutro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
