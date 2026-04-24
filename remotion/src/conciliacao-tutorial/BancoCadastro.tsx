import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { inter, poppins, SectionBadge, SectionTitle, StepItem, MockWindow } from "../tutorial-scenes/shared";

export const BancoCadastro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ padding: "60px 100px" }}>
      <SectionBadge icon="🏦" label="Passo 1 — Preparação" />
      <SectionTitle text="Cadastrar Banco ou Conta" />

      <div style={{ display: "flex", gap: 50 }}>
        <div style={{ flex: 1 }}>
          <StepItem number={1} title="Acesse Bancos & Cartões" description="No menu lateral, clique em 'Bancos & Cartões'" delay={15} />
          <StepItem number={2} title="Adicione uma conta" description="Clique em 'Nova Conta' e selecione o tipo: Conta Corrente, Poupança, etc." delay={25} />
          <StepItem number={3} title="Preencha os dados" description="Informe banco, agência, conta e saldo inicial" delay={35} />
          <StepItem number={4} title="Salve a conta" description="Clique em Salvar — a conta aparecerá na lista" delay={45} />
        </div>

        <div style={{ flex: 1 }}>
          <MockWindow title="Bancos & Cartões — Nova Conta" delay={20}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Tipo", value: "Conta Corrente" },
                { label: "Banco", value: "Banco do Brasil" },
                { label: "Agência", value: "1234-5" },
                { label: "Conta", value: "00012345-6" },
                { label: "Saldo Inicial", value: "R$ 15.000,00" },
              ].map((field, i) => {
                const s = spring({ frame: frame - 30 - i * 8, fps, config: { damping: 14 } });
                return (
                  <div key={i} style={{ opacity: interpolate(s, [0, 1], [0, 1]) }}>
                    <div style={{ fontFamily: poppins, fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>
                      {field.label}
                    </div>
                    <div style={{
                      background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px 14px",
                      fontFamily: inter, fontSize: 14, color: "rgba(255,255,255,0.8)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}>
                      {field.value}
                    </div>
                  </div>
                );
              })}

              {/* Save button */}
              {(() => {
                const btnS = spring({ frame: frame - 80, fps, config: { damping: 12 } });
                const glow = 0.3 + Math.sin(frame * 0.08) * 0.1;
                return (
                  <div style={{
                    marginTop: 8, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                    borderRadius: 10, padding: "12px 0", textAlign: "center",
                    fontFamily: inter, fontSize: 15, fontWeight: 700, color: "#fff",
                    transform: `scale(${interpolate(btnS, [0, 1], [0.9, 1])})`,
                    boxShadow: `0 4px 20px rgba(59,130,246,${glow})`,
                  }}>
                    💾 Salvar Conta
                  </div>
                );
              })()}
            </div>
          </MockWindow>
        </div>
      </div>
    </AbsoluteFill>
  );
};
