import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { inter, poppins, SectionBadge, SectionTitle, StepItem, MockWindow } from "./shared";

export const EmpresaTutorial = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ padding: "60px 100px" }}>
      <SectionBadge icon="🏢" label="Passo 2 — Dados da Empresa" />
      <SectionTitle text="Cadastro da Empresa" />

      <div style={{ display: "flex", gap: 50 }}>
        <div style={{ flex: 1 }}>
          <StepItem number={1} title="Acesse 'Empresa'" description="No menu lateral, clique em Empresa" delay={15} />
          <StepItem number={2} title="Preencha os dados fiscais" description="Razão social, CNPJ, inscrição estadual e municipal" delay={25} />
          <StepItem number={3} title="Adicione endereço" description="CEP, cidade, estado, bairro e complemento" delay={35} />
          <StepItem number={4} title="Upload do logotipo" description="Envie o logo da empresa para personalizar relatórios" delay={45} />
        </div>

        <div style={{ flex: 1 }}>
          <MockWindow title="Empresa — Dados Cadastrais" delay={20}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Razão Social", value: "Empresa Exemplo Ltda" },
                { label: "Nome Fantasia", value: "Empresa Exemplo" },
                { label: "CNPJ", value: "12.345.678/0001-90" },
                { label: "E-mail", value: "contato@empresa.com" },
                { label: "Telefone", value: "(11) 99999-0000" },
              ].map((field, i) => {
                const s = spring({ frame: frame - 28 - i * 7, fps, config: { damping: 14 } });
                return (
                  <div key={i} style={{ opacity: interpolate(s, [0, 1], [0, 1]) }}>
                    <div style={{ fontFamily: poppins, fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>{field.label}</div>
                    <div style={{
                      background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "9px 14px",
                      fontFamily: inter, fontSize: 13, color: "rgba(255,255,255,0.8)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}>{field.value}</div>
                  </div>
                );
              })}

              {/* Logo placeholder */}
              {(() => {
                const s = spring({ frame: frame - 70, fps, config: { damping: 14 } });
                return (
                  <div style={{
                    border: "2px dashed rgba(59,130,246,0.3)", borderRadius: 12, padding: "16px",
                    textAlign: "center", opacity: interpolate(s, [0, 1], [0, 1]),
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>🖼️</div>
                    <div style={{ fontFamily: poppins, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                      Clique para enviar o logotipo
                    </div>
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
