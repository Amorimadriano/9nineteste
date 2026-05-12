import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { inter, poppins, SectionBadge, SectionTitle, StepItem, MockWindow } from "./shared";

export const RelatoriosTutorial = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ padding: "60px 100px" }}>
      <SectionBadge icon="📄" label="Passo 6 — Relatórios" />
      <SectionTitle text="Geração de Relatórios" />

      <div style={{ display: "flex", gap: 40 }}>
        <div style={{ flex: 1 }}>
          <StepItem number={1} title="Escolha o relatório" description="DRE, Fluxo de Caixa ou Planejamento Orçamentário" delay={15} />
          <StepItem number={2} title="Selecione o período" description="Defina mês, trimestre ou ano para análise" delay={25} />
          <StepItem number={3} title="Visualize os dados" description="Gráficos e tabelas com seus números reais" delay={35} />
          <StepItem number={4} title="Exporte em PDF" description="Baixe relatórios prontos para apresentação" delay={45} />
        </div>

        <div style={{ flex: 1 }}>
          <MockWindow title="Relatório DRE" delay={20}>
            {/* DRE mockup */}
            {[
              { label: "Receita Bruta", value: "R$ 85.420,00", color: "#22c55e", indent: 0 },
              { label: "(-) Custos Diretos", value: "R$ 28.140,00", color: "#ef4444", indent: 1 },
              { label: "= Lucro Bruto", value: "R$ 57.280,00", color: "#3b82f6", indent: 0 },
              { label: "(-) Despesas Operacionais", value: "R$ 14.040,00", color: "#ef4444", indent: 1 },
              { label: "= Resultado Operacional", value: "R$ 43.240,00", color: "#22c55e", indent: 0 },
            ].map((item, i) => {
              const s = spring({ frame: frame - 30 - i * 8, fps, config: { damping: 14 } });
              const isBold = item.indent === 0;
              return (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", padding: "10px 0",
                  paddingLeft: item.indent * 20,
                  borderBottom: isBold ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.04)",
                  opacity: interpolate(s, [0, 1], [0, 1]),
                }}>
                  <div style={{ fontFamily: inter, fontSize: 14, fontWeight: isBold ? 700 : 400, color: isBold ? "#fff" : "rgba(255,255,255,0.6)" }}>{item.label}</div>
                  <div style={{ fontFamily: inter, fontSize: 14, fontWeight: 700, color: item.color }}>{item.value}</div>
                </div>
              );
            })}

            {/* Export button */}
            {(() => {
              const s = spring({ frame: frame - 80, fps, config: { damping: 12 } });
              return (
                <div style={{
                  marginTop: 20, background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  borderRadius: 8, padding: "10px 0", textAlign: "center",
                  fontFamily: inter, fontSize: 13, fontWeight: 600, color: "#fff",
                  opacity: interpolate(s, [0, 1], [0, 1]),
                  transform: `scale(${interpolate(s, [0, 1], [0.9, 1])})`,
                }}>
                  📥 Exportar PDF
                </div>
              );
            })()}
          </MockWindow>
        </div>
      </div>
    </AbsoluteFill>
  );
};
