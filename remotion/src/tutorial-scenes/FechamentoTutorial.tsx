import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { inter, poppins, SectionBadge, SectionTitle, StepItem, MockWindow } from "./shared";

export const FechamentoTutorial = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ padding: "60px 100px" }}>
      <SectionBadge icon="📅" label="Passo 12 — Fechamento Mensal" />
      <SectionTitle text="Fechamento de Mês" />

      <div style={{ display: "flex", gap: 50 }}>
        <div style={{ flex: 1 }}>
          <StepItem number={1} title="Revise pendências" description="Verifique contas em aberto antes de fechar" delay={15} />
          <StepItem number={2} title="Confira o saldo" description="Compare saldo contábil com saldo bancário" delay={25} />
          <StepItem number={3} title="Feche o mês" description="Clique em 'Fechar Mês' para consolidar" delay={35} />
          <StepItem number={4} title="Gere o relatório" description="Exporte o resumo mensal em PDF" delay={45} />
        </div>

        <div style={{ flex: 1 }}>
          <MockWindow title="Fechamento — Março 2025" delay={20}>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Receita", valor: "R$ 85.420", cor: "#22c55e" },
                { label: "Despesa", valor: "R$ 42.180", cor: "#ef4444" },
                { label: "Lucro", valor: "R$ 43.240", cor: "#3b82f6" },
              ].map((c, i) => {
                const s = spring({ frame: frame - 30 - i * 6, fps, config: { damping: 14 } });
                return (
                  <div key={i} style={{
                    flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px",
                    border: "1px solid rgba(255,255,255,0.08)", textAlign: "center",
                    opacity: interpolate(s, [0, 1], [0, 1]),
                  }}>
                    <div style={{ fontFamily: poppins, fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{c.label}</div>
                    <div style={{ fontFamily: inter, fontSize: 16, fontWeight: 700, color: c.cor, marginTop: 4 }}>{c.valor}</div>
                  </div>
                );
              })}
            </div>

            {/* Checklist */}
            {[
              { text: "Todas as contas a pagar registradas", ok: true },
              { text: "Contas a receber conferidas", ok: true },
              { text: "Conciliação bancária realizada", ok: true },
              { text: "Pendências resolvidas", ok: false },
            ].map((item, i) => {
              const s = spring({ frame: frame - 55 - i * 8, fps, config: { damping: 14 } });
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                  opacity: interpolate(s, [0, 1], [0, 1]),
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                    background: item.ok ? "#22c55e" : "rgba(255,255,255,0.1)", fontSize: 11, color: "#fff",
                  }}>{item.ok ? "✓" : ""}</div>
                  <div style={{ fontFamily: inter, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{item.text}</div>
                </div>
              );
            })}

            {/* Close button */}
            {(() => {
              const s = spring({ frame: frame - 90, fps, config: { damping: 12 } });
              return (
                <div style={{
                  marginTop: 12, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  borderRadius: 10, padding: "10px 0", textAlign: "center",
                  fontFamily: inter, fontSize: 14, fontWeight: 700, color: "#fff",
                  transform: `scale(${interpolate(s, [0, 1], [0.9, 1])})`,
                }}>
                  📅 Fechar Mês
                </div>
              );
            })()}
          </MockWindow>
        </div>
      </div>
    </AbsoluteFill>
  );
};
