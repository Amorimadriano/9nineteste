import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { inter, poppins, SectionBadge, SectionTitle, StepItem, MockWindow, HighlightBox } from "../tutorial-scenes/shared";

export const ConciliacaoProcesso = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const matchItems = [
    { extrato: "TED Recebida - ABC", lancamento: "Fatura #1024 — Cliente ABC", valor: "R$ 8.500", status: "matched" },
    { extrato: "Pagto Boleto Energia", lancamento: "Conta Energia — Maio/25", valor: "R$ 890", status: "matched" },
    { extrato: "PIX Enviado - Forn XY", lancamento: "Compra Materiais #302", valor: "R$ 3.200", status: "pending" },
    { extrato: "Débito Automático", lancamento: "—", valor: "R$ 450", status: "unmatched" },
  ];

  return (
    <AbsoluteFill style={{ padding: "60px 100px" }}>
      <SectionBadge icon="✅" label="Passo 3 — Conciliar" />
      <SectionTitle text="Processo de Conciliação" />

      <div style={{ display: "flex", gap: 50 }}>
        <div style={{ flex: 1 }}>
          <StepItem number={1} title="Revise as correspondências" description="O sistema sugere automaticamente os lançamentos que batem com o extrato" delay={15} />
          <StepItem number={2} title="Vincule manualmente" description="Para itens sem correspondência, vincule a uma conta a pagar ou receber" delay={25} />
          <StepItem number={3} title="Confirme a conciliação" description="Marque cada item como conciliado após verificar" delay={35} />
          <StepItem number={4} title="Crie lançamentos novos" description="Itens sem correspondência podem gerar novos lançamentos" delay={45} />

          <div style={{ marginTop: 16 }}>
            <HighlightBox color="#3b82f6" delay={55} pulse>
              <div style={{ fontFamily: inter, fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                🔄 Conciliação Automática
              </div>
              <div style={{ fontFamily: poppins, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                Lançamentos com mesmo valor e data próxima são vinculados automaticamente
              </div>
            </HighlightBox>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <MockWindow title="Conciliação Bancária — Vincular" delay={20}>
            {/* Header */}
            <div style={{
              display: "flex", justifyContent: "space-between", marginBottom: 16,
              fontFamily: poppins, fontSize: 12, color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase", letterSpacing: 1,
            }}>
              <span>Extrato → Lançamento</span>
              <span>Valor</span>
            </div>

            {/* Match rows */}
            {matchItems.map((item, i) => {
              const s = spring({ frame: frame - 35 - i * 12, fps, config: { damping: 14 } });
              const statusColor = item.status === "matched" ? "#22c55e" : item.status === "pending" ? "#f59e0b" : "#ef4444";
              const statusIcon = item.status === "matched" ? "✓" : item.status === "pending" ? "…" : "✕";

              return (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
                  opacity: interpolate(s, [0, 1], [0, 1]),
                  transform: `translateX(${interpolate(s, [0, 1], [20, 0])}px)`,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: inter, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{item.extrato}</div>
                    <div style={{
                      fontFamily: poppins, fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2,
                      display: "flex", alignItems: "center", gap: 4,
                    }}>
                      <span style={{ color: statusColor }}>→</span> {item.lancamento}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ fontFamily: inter, fontSize: 13, fontWeight: 600, color: "#3b82f6" }}>{item.valor}</div>
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%",
                      background: statusColor, display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, color: "#fff", fontWeight: 700,
                    }}>
                      {statusIcon}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Summary bar */}
            {(() => {
              const sumS = spring({ frame: frame - 90, fps, config: { damping: 18 } });
              return (
                <div style={{
                  marginTop: 16, display: "flex", gap: 12,
                  opacity: interpolate(sumS, [0, 1], [0, 1]),
                }}>
                  {[
                    { label: "Conciliados", count: 2, color: "#22c55e" },
                    { label: "Pendentes", count: 1, color: "#f59e0b" },
                    { label: "Sem vínculo", count: 1, color: "#ef4444" },
                  ].map((s, i) => (
                    <div key={i} style={{
                      flex: 1, background: `${s.color}15`, borderRadius: 8, padding: "8px 12px",
                      border: `1px solid ${s.color}30`, textAlign: "center",
                    }}>
                      <div style={{ fontFamily: inter, fontSize: 18, fontWeight: 700, color: s.color }}>{s.count}</div>
                      <div style={{ fontFamily: poppins, fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </MockWindow>
        </div>
      </div>
    </AbsoluteFill>
  );
};
