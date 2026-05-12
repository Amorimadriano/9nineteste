import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { inter, poppins, SectionBadge, SectionTitle, StepItem, MockWindow, HighlightBox } from "../tutorial-scenes/shared";

export const CartaoConciliacao = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const items = [
    { desc: "AMAZON BR (1/3)", conta: "Compras Escritório", valor: "R$ 189,90", ok: true },
    { desc: "UBER *TRIP", conta: "Transporte", valor: "R$ 32,50", ok: true },
    { desc: "GOOGLE *CLOUD", conta: "Licenças Software", valor: "R$ 450,00", ok: false },
    { desc: "RESTAURANTE SALA", conta: "Alimentação", valor: "R$ 87,40", ok: false },
  ];

  return (
    <AbsoluteFill style={{ padding: "60px 100px" }}>
      <SectionBadge icon="🔗" label="Passo 5 — Vincular Lançamentos" />
      <SectionTitle text="Conciliar Cartão de Crédito" />

      <div style={{ display: "flex", gap: 50 }}>
        <div style={{ flex: 1 }}>
          <StepItem number={1} title="Revise os lançamentos" description="Cada gasto importado aparece na lista para revisão" delay={15} />
          <StepItem number={2} title="Vincule a contas a pagar" description="Associe cada transação a uma conta a pagar existente" delay={25} />
          <StepItem number={3} title="Categorize os gastos" description="Atribua categorias para melhor controle financeiro" delay={35} />
          <StepItem number={4} title="Confirme a conciliação" description="Marque como conciliado para finalizar" delay={45} />

          <div style={{ marginTop: 16 }}>
            <HighlightBox color="#8b5cf6" delay={55} pulse>
              <div style={{ fontFamily: inter, fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                📋 Parcelas
              </div>
              <div style={{ fontFamily: poppins, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                Compras parceladas são identificadas automaticamente e controladas individualmente
              </div>
            </HighlightBox>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <MockWindow title="Conciliação Cartão — Vincular" delay={20}>
            {/* Items */}
            {items.map((item, i) => {
              const s = spring({ frame: frame - 30 - i * 12, fps, config: { damping: 14 } });
              return (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 16px",
                  marginBottom: 10, border: `1px solid ${item.ok ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.06)"}`,
                  opacity: interpolate(s, [0, 1], [0, 1]),
                  transform: `translateY(${interpolate(s, [0, 1], [15, 0])}px)`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontFamily: inter, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
                        {item.desc}
                      </div>
                      <div style={{
                        fontFamily: poppins, fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2,
                        display: "flex", alignItems: "center", gap: 6,
                      }}>
                        <span style={{ color: "#8b5cf6" }}>📁</span> {item.conta}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ fontFamily: inter, fontSize: 13, fontWeight: 600, color: "#ef4444" }}>
                        {item.valor}
                      </div>
                      <div style={{
                        width: 22, height: 22, borderRadius: 6,
                        background: item.ok ? "#22c55e" : "rgba(255,255,255,0.1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, color: "#fff",
                      }}>
                        {item.ok ? "✓" : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Total */}
            {(() => {
              const totalS = spring({ frame: frame - 85, fps, config: { damping: 18 } });
              return (
                <div style={{
                  marginTop: 12, display: "flex", justifyContent: "space-between",
                  padding: "12px 16px", background: "rgba(139,92,246,0.1)", borderRadius: 10,
                  border: "1px solid rgba(139,92,246,0.2)",
                  opacity: interpolate(totalS, [0, 1], [0, 1]),
                }}>
                  <div style={{ fontFamily: inter, fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
                    Total da Fatura
                  </div>
                  <div style={{ fontFamily: inter, fontSize: 16, fontWeight: 700, color: "#8b5cf6" }}>
                    R$ 759,80
                  </div>
                </div>
              );
            })()}
          </MockWindow>
        </div>
      </div>
    </AbsoluteFill>
  );
};
