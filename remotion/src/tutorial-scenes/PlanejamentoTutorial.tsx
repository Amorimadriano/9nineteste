import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { inter, poppins, SectionBadge, SectionTitle, StepItem, MockWindow, HighlightBox } from "./shared";

export const PlanejamentoTutorial = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ padding: "60px 100px" }}>
      <SectionBadge icon="📐" label="Passo 11 — Planejamento" />
      <SectionTitle text="Planejamento Orçamentário" />

      <div style={{ display: "flex", gap: 50 }}>
        <div style={{ flex: 1 }}>
          <StepItem number={1} title="Defina metas mensais" description="Estabeleça valores orçados por categoria" delay={15} />
          <StepItem number={2} title="Acompanhe a execução" description="Compare orçado vs realizado em tempo real" delay={25} />
          <StepItem number={3} title="Identifique desvios" description="O sistema destaca categorias fora do orçamento" delay={35} />
          <StepItem number={4} title="Ajuste previsões" description="Atualize metas conforme necessidade" delay={45} />
        </div>

        <div style={{ flex: 1 }}>
          <MockWindow title="Planejamento Orçamentário — 2025" delay={20}>
            {[
              { cat: "Folha de Pagamento", orcado: 25000, realizado: 24800 },
              { cat: "Aluguel", orcado: 3500, realizado: 3500 },
              { cat: "Marketing", orcado: 5000, realizado: 7200 },
              { cat: "Materiais", orcado: 2000, realizado: 1800 },
            ].map((item, i) => {
              const s = spring({ frame: frame - 30 - i * 10, fps, config: { damping: 14 } });
              const pct = (item.realizado / item.orcado) * 100;
              const over = pct > 100;
              return (
                <div key={i} style={{
                  marginBottom: 14, opacity: interpolate(s, [0, 1], [0, 1]),
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ fontFamily: inter, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{item.cat}</div>
                    <div style={{ fontFamily: poppins, fontSize: 11, color: over ? "#ef4444" : "#22c55e" }}>
                      {pct.toFixed(0)}%
                    </div>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.1)" }}>
                    <div style={{
                      height: "100%", borderRadius: 4, width: `${Math.min(pct, 100)}%`,
                      background: over ? "linear-gradient(90deg, #ef4444, #dc2626)" : "linear-gradient(90deg, #22c55e, #16a34a)",
                    }} />
                  </div>
                  <div style={{
                    display: "flex", justifyContent: "space-between", marginTop: 3,
                    fontFamily: poppins, fontSize: 10, color: "rgba(255,255,255,0.4)",
                  }}>
                    <span>Orçado: R$ {item.orcado.toLocaleString()}</span>
                    <span>Real: R$ {item.realizado.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </MockWindow>
        </div>
      </div>
    </AbsoluteFill>
  );
};
