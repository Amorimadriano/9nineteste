import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { inter, poppins, SectionBadge, SectionTitle, StepItem, MockWindow } from "./shared";

export const UsuariosConfigTutorial = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ padding: "60px 100px" }}>
      <SectionBadge icon="⚙️" label="Passo 14 — Configurações" />
      <SectionTitle text="Usuários e Configurações" />

      <div style={{ display: "flex", gap: 50 }}>
        <div style={{ flex: 1 }}>
          <StepItem number={1} title="Gerencie usuários" description="Convide novos usuários para acessar o sistema" delay={15} />
          <StepItem number={2} title="Defina permissões" description="Atribua roles: admin, moderador ou usuário" delay={25} />
          <StepItem number={3} title="Personalize o sistema" description="Ajuste preferências e configurações gerais" delay={35} />
          <StepItem number={4} title="Altere sua senha" description="Atualize credenciais de acesso na aba Configurações" delay={45} />
        </div>

        <div style={{ flex: 1 }}>
          <MockWindow title="Usuários da Conta" delay={20}>
            {[
              { nome: "Carlos Admin", email: "carlos@empresa.com", role: "Admin", cor: "#8b5cf6" },
              { nome: "Maria Financeiro", email: "maria@empresa.com", role: "Moderador", cor: "#3b82f6" },
              { nome: "João Assistente", email: "joao@empresa.com", role: "Usuário", cor: "#22c55e" },
            ].map((user, i) => {
              const s = spring({ frame: frame - 35 - i * 12, fps, config: { damping: 14 } });
              return (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
                  opacity: interpolate(s, [0, 1], [0, 1]),
                }}>
                  <div>
                    <div style={{ fontFamily: inter, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{user.nome}</div>
                    <div style={{ fontFamily: poppins, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{user.email}</div>
                  </div>
                  <div style={{
                    fontFamily: poppins, fontSize: 11, fontWeight: 600, color: user.cor,
                    background: `${user.cor}18`, padding: "4px 14px", borderRadius: 20,
                  }}>{user.role}</div>
                </div>
              );
            })}

            {/* Invite button */}
            {(() => {
              const s = spring({ frame: frame - 75, fps, config: { damping: 12 } });
              return (
                <div style={{
                  marginTop: 14, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  borderRadius: 10, padding: "10px 0", textAlign: "center",
                  fontFamily: inter, fontSize: 14, fontWeight: 700, color: "#fff",
                  transform: `scale(${interpolate(s, [0, 1], [0.9, 1])})`,
                }}>
                  + Convidar Usuário
                </div>
              );
            })()}
          </MockWindow>
        </div>
      </div>
    </AbsoluteFill>
  );
};
