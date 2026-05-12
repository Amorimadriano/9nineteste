import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { inter, poppins, SectionBadge, SectionTitle, StepItem, MockWindow, HighlightBox } from "../tutorial-scenes/shared";

export const CartaoImportScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const csvLoaded = frame > 90;

  return (
    <AbsoluteFill style={{ padding: "60px 100px" }}>
      <SectionBadge icon="💳" label="Passo 4 — Cartão de Crédito" />
      <SectionTitle text="Importar Fatura do Cartão" />

      <div style={{ display: "flex", gap: 50 }}>
        <div style={{ flex: 1 }}>
          <StepItem number={1} title="Acesse Conciliação de Cartão" description="No menu, clique em 'Conciliação Cartão'" delay={15} />
          <StepItem number={2} title="Selecione o cartão" description="Escolha o cartão de crédito cadastrado" delay={25} />
          <StepItem number={3} title="Importe o CSV/Excel" description="Baixe a fatura do cartão no formato CSV e faça upload" delay={35} />
          <StepItem number={4} title="Mapeie as colunas" description="O sistema identifica data, descrição e valor automaticamente" delay={45} />

          <div style={{ marginTop: 16 }}>
            <HighlightBox color="#f59e0b" delay={55}>
              <div style={{ fontFamily: inter, fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                📊 Formatos aceitos
              </div>
              <div style={{ fontFamily: poppins, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                CSV e Excel (.xlsx) — Baixe a fatura no site da operadora do cartão
              </div>
            </HighlightBox>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <MockWindow title="Conciliação Cartão — Importar CSV" delay={20}>
            {/* Card selector */}
            <div style={{
              background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px 14px",
              fontFamily: inter, fontSize: 14, color: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(139,92,246,0.3)", marginBottom: 16,
            }}>
              💳 Visa Empresarial — Final 4532
            </div>

            {/* Upload area */}
            <div style={{
              border: `2px dashed ${csvLoaded ? "rgba(34,197,94,0.5)" : "rgba(139,92,246,0.3)"}`,
              borderRadius: 12, padding: "24px", textAlign: "center", marginBottom: 16,
              background: csvLoaded ? "rgba(34,197,94,0.05)" : "transparent",
            }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>{csvLoaded ? "✅" : "📊"}</div>
              <div style={{ fontFamily: inter, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                {csvLoaded ? "fatura_visa_abril.csv" : "Arraste o CSV ou Excel aqui"}
              </div>
            </div>

            {/* CSV preview table */}
            {csvLoaded && (() => {
              const rows = [
                { data: "05/04/2025", desc: "AMAZON BR", valor: "R$ 189,90", parcela: "1/3" },
                { data: "08/04/2025", desc: "UBER *TRIP", valor: "R$ 32,50", parcela: "—" },
                { data: "12/04/2025", desc: "GOOGLE *CLOUD", valor: "R$ 450,00", parcela: "—" },
                { data: "15/04/2025", desc: "RESTAURANTE SALA", valor: "R$ 87,40", parcela: "—" },
              ];
              return (
                <div>
                  {/* Table header */}
                  <div style={{
                    display: "flex", gap: 8, padding: "8px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    fontFamily: poppins, fontSize: 11, color: "rgba(255,255,255,0.4)",
                    textTransform: "uppercase", letterSpacing: 1,
                  }}>
                    <div style={{ width: 90 }}>Data</div>
                    <div style={{ flex: 1 }}>Descrição</div>
                    <div style={{ width: 50, textAlign: "center" }}>Parc.</div>
                    <div style={{ width: 90, textAlign: "right" }}>Valor</div>
                  </div>
                  {rows.map((row, i) => {
                    const s = spring({ frame: frame - 95 - i * 8, fps, config: { damping: 14 } });
                    return (
                      <div key={i} style={{
                        display: "flex", gap: 8, padding: "8px 0",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        opacity: interpolate(s, [0, 1], [0, 1]),
                      }}>
                        <div style={{ width: 90, fontFamily: poppins, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{row.data}</div>
                        <div style={{ flex: 1, fontFamily: inter, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{row.desc}</div>
                        <div style={{ width: 50, textAlign: "center", fontFamily: poppins, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{row.parcela}</div>
                        <div style={{ width: 90, textAlign: "right", fontFamily: inter, fontSize: 13, fontWeight: 600, color: "#ef4444" }}>{row.valor}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </MockWindow>
        </div>
      </div>
    </AbsoluteFill>
  );
};
