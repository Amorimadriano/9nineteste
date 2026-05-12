import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { inter, poppins, SectionBadge, SectionTitle, StepItem, MockWindow } from "./shared";

export const LoginScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ padding: "60px 100px" }}>
      <SectionBadge icon="🔐" label="Passo 1 — Acesso ao Sistema" />
      <SectionTitle text="Login e Cadastro" />

      <div style={{ display: "flex", gap: 50 }}>
        {/* Left: Steps */}
        <div style={{ flex: 1 }}>
          <StepItem number={1} title="Acesse o sistema" description="Entre pelo endereço do 9Nine Control no navegador" delay={15} />
          <StepItem number={2} title="Crie sua conta" description="Preencha e-mail e senha para se cadastrar" delay={25} />
          <StepItem number={3} title="Confirme o e-mail" description="Verifique sua caixa de entrada e confirme" delay={35} />
          <StepItem number={4} title="Faça login" description="Use suas credenciais para acessar o painel" delay={45} />
        </div>

        {/* Right: Mock login form */}
        <div style={{ flex: 1 }}>
          <MockWindow title="9Nine Control — Login" delay={20}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ fontFamily: poppins, fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>E-mail</div>
                <div style={{
                  background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "12px 16px",
                  fontFamily: inter, fontSize: 15, color: "rgba(255,255,255,0.3)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}>
                  usuario@empresa.com
                </div>
              </div>
              <div>
                <div style={{ fontFamily: poppins, fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>Senha</div>
                <div style={{
                  background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "12px 16px",
                  fontFamily: inter, fontSize: 15, color: "rgba(255,255,255,0.3)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}>
                  ••••••••
                </div>
              </div>
              {/* Button */}
              {(() => {
                const btnS = spring({ frame: frame - 55, fps, config: { damping: 12 } });
                const btnScale = interpolate(btnS, [0, 1], [0.9, 1]);
                const btnGlow = 0.3 + Math.sin(frame * 0.08) * 0.1;
                return (
                  <div style={{
                    marginTop: 8, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                    borderRadius: 10, padding: "14px 0", textAlign: "center",
                    fontFamily: inter, fontSize: 16, fontWeight: 700, color: "#fff",
                    transform: `scale(${btnScale})`,
                    boxShadow: `0 4px 20px rgba(59,130,246,${btnGlow})`,
                  }}>
                    Entrar
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
