import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { inter, poppins, SectionBadge, SectionTitle, StepItem, MockWindow, HighlightBox } from "../tutorial-scenes/shared";

export const ImportOFXScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const uploadProgress = interpolate(frame, [70, 110], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const uploadDone = frame > 115;

  return (
    <AbsoluteFill style={{ padding: "60px 100px" }}>
      <SectionBadge icon="📄" label="Passo 2 — Importação OFX" />
      <SectionTitle text="Importar Extrato Bancário" />

      <div style={{ display: "flex", gap: 50 }}>
        <div style={{ flex: 1 }}>
          <StepItem number={1} title="Acesse Conciliação Bancária" description="No menu, clique em 'Conciliação Bancária'" delay={15} />
          <StepItem number={2} title="Selecione o banco" description="Escolha a conta bancária que deseja conciliar" delay={25} />
          <StepItem number={3} title="Importe o arquivo OFX" description="Baixe o extrato OFX no site do seu banco e faça upload" delay={35} />
          <StepItem number={4} title="Aguarde o processamento" description="O sistema lê e importa todas as transações automaticamente" delay={45} />

          <div style={{ marginTop: 16 }}>
            <HighlightBox color="#22c55e" delay={60}>
              <div style={{ fontFamily: inter, fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                💡 Dica: Arquivo OFX
              </div>
              <div style={{ fontFamily: poppins, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                O OFX é o formato padrão dos bancos. Acesse o internet banking e exporte o extrato no formato OFX/OFC.
              </div>
            </HighlightBox>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <MockWindow title="Conciliação Bancária — Importar OFX" delay={20}>
            {/* Bank selector */}
            <div style={{
              background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px 14px",
              fontFamily: inter, fontSize: 14, color: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(59,130,246,0.3)", marginBottom: 20,
            }}>
              🏦 Banco do Brasil — Conta Corrente
            </div>

            {/* Upload area */}
            <div style={{
              border: `2px dashed ${uploadDone ? "rgba(34,197,94,0.5)" : "rgba(59,130,246,0.3)"}`,
              borderRadius: 12, padding: "30px", textAlign: "center", marginBottom: 20,
              background: uploadDone ? "rgba(34,197,94,0.05)" : "transparent",
            }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{uploadDone ? "✅" : "📄"}</div>
              <div style={{ fontFamily: inter, fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
                {uploadDone ? "extrato_abril_2025.ofx" : "Arraste o arquivo OFX aqui"}
              </div>
              {!uploadDone && (
                <div style={{ fontFamily: poppins, fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                  ou clique para selecionar
                </div>
              )}
            </div>

            {/* Progress bar */}
            {frame > 65 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: poppins, fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
                  {uploadDone ? "✅ 47 transações importadas" : `Importando... ${Math.round(uploadProgress)}%`}
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.1)" }}>
                  <div style={{
                    height: "100%", borderRadius: 3, width: `${uploadProgress}%`,
                    background: uploadDone ? "linear-gradient(90deg, #22c55e, #16a34a)" : "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                  }} />
                </div>
              </div>
            )}

            {/* Imported transactions preview */}
            {uploadDone && [
              { desc: "TED Recebida - Cliente ABC", valor: "+ R$ 8.500,00", tipo: "credito" },
              { desc: "Pagamento Boleto Energia", valor: "- R$ 890,00", tipo: "debito" },
              { desc: "PIX Enviado - Fornecedor XY", valor: "- R$ 3.200,00", tipo: "debito" },
            ].map((tx, i) => {
              const s = spring({ frame: frame - 120 - i * 8, fps, config: { damping: 14 } });
              return (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", padding: "8px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  opacity: interpolate(s, [0, 1], [0, 1]),
                }}>
                  <div style={{ fontFamily: inter, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{tx.desc}</div>
                  <div style={{
                    fontFamily: inter, fontSize: 13, fontWeight: 600,
                    color: tx.tipo === "credito" ? "#22c55e" : "#ef4444",
                  }}>
                    {tx.valor}
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
