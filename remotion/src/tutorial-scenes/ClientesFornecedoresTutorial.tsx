import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { inter, poppins, SectionBadge, SectionTitle, StepItem, MockWindow } from "./shared";

export const ClientesFornecedoresTutorial = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ padding: "60px 100px" }}>
      <SectionBadge icon="👥" label="Passo 5 — Cadastros" />
      <SectionTitle text="Clientes e Fornecedores" />

      <div style={{ display: "flex", gap: 50 }}>
        <div style={{ flex: 1 }}>
          <StepItem number={1} title="Cadastre clientes" description="Nome, documento, telefone, e-mail e endereço" delay={15} />
          <StepItem number={2} title="Cadastre fornecedores" description="Mesmos dados — vincule a contas a pagar" delay={25} />
          <StepItem number={3} title="Busca por CNPJ" description="Preencha o CNPJ e os dados são buscados automaticamente" delay={35} />
          <StepItem number={4} title="Ative/Desative" description="Controle quais cadastros estão ativos" delay={45} />
        </div>

        <div style={{ flex: 1 }}>
          <MockWindow title="Clientes — Lista" delay={20}>
            {[
              { nome: "Tech Solutions Ltda", doc: "12.345.678/0001-90", status: "Ativo" },
              { nome: "Maria Silva ME", doc: "98.765.432/0001-10", status: "Ativo" },
              { nome: "Comércio ABC", doc: "45.678.901/0001-23", status: "Inativo" },
            ].map((item, i) => {
              const s = spring({ frame: frame - 35 - i * 10, fps, config: { damping: 14 } });
              return (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
                  opacity: interpolate(s, [0, 1], [0, 1]),
                }}>
                  <div>
                    <div style={{ fontFamily: inter, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{item.nome}</div>
                    <div style={{ fontFamily: poppins, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{item.doc}</div>
                  </div>
                  <div style={{
                    fontFamily: poppins, fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 20,
                    color: item.status === "Ativo" ? "#22c55e" : "#ef4444",
                    background: item.status === "Ativo" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                  }}>{item.status}</div>
                </div>
              );
            })}

            {/* Add button */}
            {(() => {
              const s = spring({ frame: frame - 70, fps, config: { damping: 12 } });
              return (
                <div style={{
                  marginTop: 14, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  borderRadius: 10, padding: "10px 0", textAlign: "center",
                  fontFamily: inter, fontSize: 14, fontWeight: 700, color: "#fff",
                  transform: `scale(${interpolate(s, [0, 1], [0.9, 1])})`,
                }}>
                  + Novo Cliente
                </div>
              );
            })()}
          </MockWindow>
        </div>
      </div>
    </AbsoluteFill>
  );
};
