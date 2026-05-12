import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { inter, poppins, SectionBadge, SectionTitle, StepItem, MockWindow } from "./shared";

export const AuditoriaTutorial = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ padding: "60px 100px" }}>
      <SectionBadge icon="🔍" label="Passo 13 — Auditoria" />
      <SectionTitle text="Auditoria do Sistema" />

      <div style={{ display: "flex", gap: 50 }}>
        <div style={{ flex: 1 }}>
          <StepItem number={1} title="Acompanhe as ações" description="Todas as operações dos usuários são registradas" delay={15} />
          <StepItem number={2} title="Filtre por tipo" description="Busque por criação, edição ou exclusão de registros" delay={25} />
          <StepItem number={3} title="Auditoria de Recebíveis" description="Acompanhe recebimentos e identifique pendências" delay={35} />
          <StepItem number={4} title="Rastreie alterações" description="Veja dados anteriores e posteriores de cada edição" delay={45} />
        </div>

        <div style={{ flex: 1 }}>
          <MockWindow title="Auditoria — Logs do Sistema" delay={20}>
            {[
              { user: "admin@empresa.com", action: "Criou", target: "Conta a Pagar #1045", time: "14:32", cor: "#22c55e" },
              { user: "admin@empresa.com", action: "Editou", target: "Fornecedor XYZ", time: "14:15", cor: "#f59e0b" },
              { user: "maria@empresa.com", action: "Excluiu", target: "Categoria antiga", time: "13:50", cor: "#ef4444" },
              { user: "admin@empresa.com", action: "Pagou", target: "Conta #1023", time: "12:30", cor: "#3b82f6" },
            ].map((log, i) => {
              const s = spring({ frame: frame - 35 - i * 10, fps, config: { damping: 14 } });
              return (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
                  opacity: interpolate(s, [0, 1], [0, 1]),
                }}>
                  <div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <div style={{
                        fontFamily: poppins, fontSize: 10, fontWeight: 600, color: log.cor,
                        background: `${log.cor}18`, padding: "2px 8px", borderRadius: 10,
                      }}>{log.action}</div>
                      <div style={{ fontFamily: inter, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{log.target}</div>
                    </div>
                    <div style={{ fontFamily: poppins, fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{log.user}</div>
                  </div>
                  <div style={{ fontFamily: poppins, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{log.time}</div>
                </div>
              );
            })}
          </MockWindow>
        </div>
      </div>
    </AbsoluteFill>
  );
};
