import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { inter, poppins, SectionBadge, SectionTitle, StepItem, MockWindow } from "./shared";

export const BancosCartoesTutorial = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ padding: "60px 100px" }}>
      <SectionBadge icon="🏦" label="Passo 6 — Contas Bancárias" />
      <SectionTitle text="Bancos e Cartões" />

      <div style={{ display: "flex", gap: 50 }}>
        <div style={{ flex: 1 }}>
          <StepItem number={1} title="Cadastre contas bancárias" description="Conta corrente, poupança ou investimento" delay={15} />
          <StepItem number={2} title="Adicione cartões de crédito" description="Nome, bandeira e limite do cartão" delay={25} />
          <StepItem number={3} title="Informe saldo inicial" description="Defina o saldo para iniciar o controle" delay={35} />
          <StepItem number={4} title="Gerencie múltiplas contas" description="Tenha visão consolidada de todos os bancos" delay={45} />
        </div>

        <div style={{ flex: 1 }}>
          <MockWindow title="Bancos & Cartões" delay={20}>
            {[
              { icon: "🏦", nome: "Banco do Brasil - CC", saldo: "R$ 15.320,00", tipo: "Conta Corrente", cor: "#22c55e" },
              { icon: "🏦", nome: "Itaú - Poupança", saldo: "R$ 8.900,00", tipo: "Poupança", cor: "#3b82f6" },
              { icon: "💳", nome: "Visa Empresarial", saldo: "Limite: R$ 10.000", tipo: "Cartão de Crédito", cor: "#8b5cf6" },
            ].map((item, i) => {
              const s = spring({ frame: frame - 35 - i * 12, fps, config: { damping: 14 } });
              return (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "14px 18px",
                  marginBottom: 10, border: "1px solid rgba(255,255,255,0.08)",
                  opacity: interpolate(s, [0, 1], [0, 1]),
                  transform: `translateY(${interpolate(s, [0, 1], [15, 0])}px)`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{ fontSize: 22 }}>{item.icon}</div>
                      <div>
                        <div style={{ fontFamily: inter, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{item.nome}</div>
                        <div style={{ fontFamily: poppins, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{item.tipo}</div>
                      </div>
                    </div>
                    <div style={{ fontFamily: inter, fontSize: 14, fontWeight: 700, color: item.cor }}>{item.saldo}</div>
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
