import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { inter, poppins, SectionBadge, SectionTitle, StepItem, MockWindow } from "./shared";

export const FluxoCaixaTutorial = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ padding: "60px 100px" }}>
      <SectionBadge icon="💰" label="Passo 9 — Fluxo de Caixa" />
      <SectionTitle text="Controle de Fluxo de Caixa" />

      <div style={{ display: "flex", gap: 50 }}>
        <div style={{ flex: 1 }}>
          <StepItem number={1} title="Visualize entradas e saídas" description="Veja todas as movimentações financeiras por período" delay={15} />
          <StepItem number={2} title="Filtre por data" description="Selecione o mês ou intervalo para análise" delay={25} />
          <StepItem number={3} title="Acompanhe o saldo" description="Saldo acumulado atualizado automaticamente" delay={35} />
          <StepItem number={4} title="Projete o futuro" description="Veja previsão com contas a vencer" delay={45} />
        </div>

        <div style={{ flex: 1 }}>
          <MockWindow title="Fluxo de Caixa — Abril 2025" delay={20}>
            {/* Summary cards */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Entradas", valor: "R$ 45.800", cor: "#22c55e" },
                { label: "Saídas", valor: "R$ 28.350", cor: "#ef4444" },
                { label: "Saldo", valor: "R$ 17.450", cor: "#3b82f6" },
              ].map((c, i) => {
                const s = spring({ frame: frame - 30 - i * 6, fps, config: { damping: 14 } });
                return (
                  <div key={i} style={{
                    flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 14px",
                    border: "1px solid rgba(255,255,255,0.08)", opacity: interpolate(s, [0, 1], [0, 1]),
                  }}>
                    <div style={{ fontFamily: poppins, fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{c.label}</div>
                    <div style={{ fontFamily: inter, fontSize: 16, fontWeight: 700, color: c.cor, marginTop: 4 }}>{c.valor}</div>
                  </div>
                );
              })}
            </div>

            {/* Chart bars */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100, marginBottom: 12 }}>
              {[
                { e: 60, s: 40 }, { e: 80, s: 50 }, { e: 45, s: 70 }, { e: 90, s: 35 },
                { e: 55, s: 45 }, { e: 75, s: 60 }, { e: 85, s: 30 },
              ].map((bar, i) => {
                const sp = spring({ frame: frame - 45 - i * 3, fps, config: { damping: 12 } });
                return (
                  <div key={i} style={{ display: "flex", gap: 2, flex: 1, alignItems: "flex-end" }}>
                    <div style={{
                      flex: 1, height: interpolate(sp, [0, 1], [0, bar.e]),
                      background: "#22c55e", borderRadius: "3px 3px 0 0", opacity: interpolate(sp, [0, 1], [0, 0.8]),
                    }} />
                    <div style={{
                      flex: 1, height: interpolate(sp, [0, 1], [0, bar.s]),
                      background: "#ef4444", borderRadius: "3px 3px 0 0", opacity: interpolate(sp, [0, 1], [0, 0.8]),
                    }} />
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              {[{ cor: "#22c55e", label: "Entradas" }, { cor: "#ef4444", label: "Saídas" }].map((l, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: l.cor }} />
                  <div style={{ fontFamily: poppins, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{l.label}</div>
                </div>
              ))}
            </div>
          </MockWindow>
        </div>
      </div>
    </AbsoluteFill>
  );
};
