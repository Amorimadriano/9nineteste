import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { inter, poppins, SectionBadge, SectionTitle, StepItem, MockWindow, HighlightBox } from "./shared";

export const ConciliacaoTutorial = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ padding: "60px 100px" }}>
      <SectionBadge icon="🏦" label="Passo 5 — Conciliação Bancária" />
      <SectionTitle text="Importação e Conciliação" />

      <div style={{ display: "flex", gap: 40 }}>
        <div style={{ flex: 1 }}>
          <StepItem number={1} title="Cadastre seu banco" description="Vá em Bancos & Cartões e adicione sua conta" delay={15} />
          <StepItem number={2} title="Importe o extrato OFX" description="Faça upload do arquivo OFX do seu banco" delay={25} />
          <StepItem number={3} title="Concilie automaticamente" description="O sistema compara lançamentos e sugere correspondências" delay={35} />
          <StepItem number={4} title="Revise e confirme" description="Valide cada item e marque como conciliado" delay={45} />

          <div style={{ marginTop: 20 }}>
            <HighlightBox color="#8b5cf6" delay={60} pulse>
              <div style={{ fontFamily: inter, fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                💳 Cartões de Crédito
              </div>
              <div style={{ fontFamily: poppins, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                Importe faturas em PDF para conciliar gastos de cartão
              </div>
            </HighlightBox>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <MockWindow title="Conciliação Bancária" delay={20}>
            {/* OFX upload area */}
            <div style={{
              border: "2px dashed rgba(59,130,246,0.3)", borderRadius: 12,
              padding: "24px", textAlign: "center", marginBottom: 20,
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
              <div style={{ fontFamily: inter, fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
                Arraste o arquivo OFX aqui
              </div>
              <div style={{ fontFamily: poppins, fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                ou clique para selecionar
              </div>
            </div>

            {/* Match items */}
            {[
              { ext: "Pagto TED 001", int: "Aluguel Escritório", valor: "R$ 3.500", match: true },
              { ext: "Débito Automático", int: "Energia Elétrica", valor: "R$ 890", match: true },
              { ext: "PIX Recebido", int: "—", valor: "R$ 5.200", match: false },
            ].map((item, i) => {
              const s = spring({ frame: frame - 50 - i * 10, fps, config: { damping: 14 } });
              return (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
                  opacity: interpolate(s, [0, 1], [0, 1]),
                }}>
                  <div>
                    <div style={{ fontFamily: inter, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{item.ext}</div>
                    <div style={{ fontFamily: poppins, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>→ {item.int}</div>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ fontFamily: inter, fontSize: 13, fontWeight: 600, color: "#3b82f6" }}>{item.valor}</div>
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%",
                      background: item.match ? "#22c55e" : "rgba(255,255,255,0.1)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, color: "#fff",
                    }}>
                      {item.match ? "✓" : "?"}
                    </div>
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
