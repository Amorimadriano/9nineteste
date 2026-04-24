import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { TutorialCompletoIntro } from "./tutorial-scenes/TutorialCompletoIntro";
import { LoginScene } from "./tutorial-scenes/LoginScene";
import { EmpresaTutorial } from "./tutorial-scenes/EmpresaTutorial";
import { DashboardTutorial } from "./tutorial-scenes/DashboardTutorial";
import { ContasPagarTutorial } from "./tutorial-scenes/ContasPagarTutorial";
import { ContasReceberTutorial } from "./tutorial-scenes/ContasReceberTutorial";
import { ClientesFornecedoresTutorial } from "./tutorial-scenes/ClientesFornecedoresTutorial";
import { BancosCartoesTutorial } from "./tutorial-scenes/BancosCartoesTutorial";
import { ConciliacaoTutorial } from "./tutorial-scenes/ConciliacaoTutorial";
import { CategoriasTutorial } from "./tutorial-scenes/CategoriasTutorial";
import { FluxoCaixaTutorial } from "./tutorial-scenes/FluxoCaixaTutorial";
import { DRETutorial } from "./tutorial-scenes/DRETutorial";
import { PlanejamentoTutorial } from "./tutorial-scenes/PlanejamentoTutorial";
import { FechamentoTutorial } from "./tutorial-scenes/FechamentoTutorial";
import { AuditoriaTutorial } from "./tutorial-scenes/AuditoriaTutorial";
import { RelatoriosTutorial } from "./tutorial-scenes/RelatoriosTutorial";
import { UsuariosConfigTutorial } from "./tutorial-scenes/UsuariosConfigTutorial";
import { TutorialCompletoOutro } from "./tutorial-scenes/TutorialCompletoOutro";
import { PersistentBackground } from "./components/PersistentBackground";

const T = 15; // transition duration
const timing = springTiming({ config: { damping: 200 }, durationInFrames: T });

// 18 scenes × ~180 avg = 3240 - (17 × 15) = 3240 - 255 = 2985 frames (~100s)

export const TutorialCompletoVideo = () => {
  return (
    <AbsoluteFill>
      <PersistentBackground />
      <TransitionSeries>
        {/* 1. Intro */}
        <TransitionSeries.Sequence durationInFrames={160}>
          <TutorialCompletoIntro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />

        {/* 2. Login */}
        <TransitionSeries.Sequence durationInFrames={170}>
          <LoginScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-left" })} timing={timing} />

        {/* 3. Empresa */}
        <TransitionSeries.Sequence durationInFrames={180}>
          <EmpresaTutorial />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={timing} />

        {/* 4. Dashboard */}
        <TransitionSeries.Sequence durationInFrames={190}>
          <DashboardTutorial />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />

        {/* 5. Contas a Pagar */}
        <TransitionSeries.Sequence durationInFrames={180}>
          <ContasPagarTutorial />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-left" })} timing={timing} />

        {/* 6. Contas a Receber */}
        <TransitionSeries.Sequence durationInFrames={170}>
          <ContasReceberTutorial />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={timing} />

        {/* 7. Clientes e Fornecedores */}
        <TransitionSeries.Sequence durationInFrames={180}>
          <ClientesFornecedoresTutorial />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />

        {/* 8. Bancos e Cartões */}
        <TransitionSeries.Sequence durationInFrames={170}>
          <BancosCartoesTutorial />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-left" })} timing={timing} />

        {/* 9. Conciliação Bancária */}
        <TransitionSeries.Sequence durationInFrames={190}>
          <ConciliacaoTutorial />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={timing} />

        {/* 10. Categorias */}
        <TransitionSeries.Sequence durationInFrames={160}>
          <CategoriasTutorial />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />

        {/* 11. Fluxo de Caixa */}
        <TransitionSeries.Sequence durationInFrames={180}>
          <FluxoCaixaTutorial />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-left" })} timing={timing} />

        {/* 12. DRE */}
        <TransitionSeries.Sequence durationInFrames={180}>
          <DRETutorial />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={timing} />

        {/* 13. Planejamento Orçamentário */}
        <TransitionSeries.Sequence durationInFrames={180}>
          <PlanejamentoTutorial />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />

        {/* 14. Fechamento */}
        <TransitionSeries.Sequence durationInFrames={190}>
          <FechamentoTutorial />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-left" })} timing={timing} />


        {/* 16. Relatórios */}
        <TransitionSeries.Sequence durationInFrames={170}>
          <RelatoriosTutorial />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />

        {/* 17. Usuários e Configurações */}
        <TransitionSeries.Sequence durationInFrames={170}>
          <UsuariosConfigTutorial />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />

        {/* 18. Outro */}
        <TransitionSeries.Sequence durationInFrames={180}>
          <TutorialCompletoOutro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
