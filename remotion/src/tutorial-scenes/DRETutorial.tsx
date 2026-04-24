import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { inter, poppins, SectionBadge, SectionTitle, StepItem, MockWindow } from "./shared";

export const DRETutorial = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rows = [
    { label: "Receita Bruta", valor: "R$ 85.420", bold: true, cor: "#22c55e" },
    { label: "(-) Custos Diretos", valor: "R$ 18.200", bold: false, cor: "#ef4444" },
    { label: "= Lucro Bruto", valor: "R$ 67.220", bold: true, cor: "#3b82f6" },
    { label: "(-) Despesas Operacionais", valor: "R$ 23.980", bold: false, cor: "#ef4444" },
    { label: "= Lucro Operacional", valor: "R$ 43.240", bold: true, cor: "#22c55e" },
    { label: "(-) Impostos e Taxas", valor: "R$ 8.650", bold: false, cor: "#ef4444" },
    { label: "= Lucro Líquido", valor: "R$ 34.590", bold: true, cor: "#22c55e" },
  ];

  return (
    <AbsoluteFill style={{ padding: "60px 100px" }}>
      <SectionBadge icon="📋" label="Passo 10 — DRE Gerencial" />
      <SectionTitle text="Demonstrativo de Resultados" />

      <div style={{ display: "flex", gap: 50 }}>
        <div style={{ flex: 1 }}>
          <StepItem number={1} title="Acesse o DRE" description="No menu, clique em 'DRE Gerencial'" delay={15} />
          <StepItem number={2} title="Selecione o período" description="Escolha mês ou intervalo para análise" delay={25} />
          <StepItem number={3} title="Analise os resultados" description="Veja receitas, custos e lucro de forma estruturada" delay={35} />
          <StepItem number={4} title="Exporte em PDF" description="Gere relatórios para apresentação e análise" delay={45} />
        </div>

        <div style={{ flex: 1 }}>
          <MockWindow title="DRE — Abril 2025" delay={20}>
            {rows.map((row, i) => {
              const s = spring({ frame: frame - 30 - i * 7, fps, config: { damping: 14 } });
              return (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", padding: "10px 0",
                  borderBottom: row.bold ? "2px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.05)",
                  opacity: interpolate(s, [0, 1], [0, 1]),
                }}>
                  <div style={{
                    fontFamily: inter, fontSize: 13, color: "rgba(255,255,255,0.8)",
                    fontWeight: row.bold ? 700 : 400,
                  }}>{row.label}</div>
                  <div style={{
                    fontFamily: inter, fontSize: 14, fontWeight: row.bold ? 700 : 600, color: row.cor,
                  }}>{row.valor}</div>
                </div>
              );
            })}
          </MockWindow>
        </div>
      </div>
    </AbsoluteFill>
  );
};
