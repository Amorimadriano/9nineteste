import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { inter, poppins, SectionBadge, SectionTitle, StepItem, MockWindow } from "./shared";

const TableRow = ({ desc, valor, status, delay }: { desc: string; valor: string; status: string; delay: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 14 } });
  const statusColor = status === "Pago" ? "#22c55e" : status === "Vencido" ? "#ef4444" : "#f59e0b";
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
      opacity: interpolate(s, [0, 1], [0, 1]),
    }}>
      <div style={{ fontFamily: inter, fontSize: 14, color: "rgba(255,255,255,0.8)" }}>{desc}</div>
      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        <div style={{ fontFamily: inter, fontSize: 14, fontWeight: 600, color: "#ef4444" }}>{valor}</div>
        <div style={{
          fontFamily: poppins, fontSize: 11, fontWeight: 600, color: statusColor,
          background: `${statusColor}18`, padding: "4px 12px", borderRadius: 20,
        }}>
          {status}
        </div>
      </div>
    </div>
  );
};

export const ContasPagarTutorial = () => {
  return (
    <AbsoluteFill style={{ padding: "60px 100px" }}>
      <SectionBadge icon="💸" label="Passo 3 — Contas a Pagar" />
      <SectionTitle text="Cadastro de Despesas" />

      <div style={{ display: "flex", gap: 40 }}>
        <div style={{ flex: 1 }}>
          <StepItem number={1} title="Clique em 'Nova Conta'" description="Abra o formulário de cadastro de despesa" delay={15} />
          <StepItem number={2} title="Preencha os dados" description="Descrição, valor, vencimento, categoria e fornecedor" delay={25} />
          <StepItem number={3} title="Defina recorrência" description="Marque como recorrente se for uma despesa fixa" delay={35} />
          <StepItem number={4} title="Anexe comprovantes" description="Faça upload de boletos e notas fiscais" delay={45} />
          <StepItem number={5} title="Registre pagamento" description="Marque como pago quando realizar o pagamento" delay={55} />
        </div>

        <div style={{ flex: 1 }}>
          <MockWindow title="Contas a Pagar" delay={20}>
            <div style={{ fontFamily: poppins, fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>
              Últimas contas cadastradas
            </div>
            <TableRow desc="Aluguel Escritório" valor="R$ 3.500,00" status="Pago" delay={30} />
            <TableRow desc="Energia Elétrica" valor="R$ 890,00" status="Pendente" delay={38} />
            <TableRow desc="Internet Fibra" valor="R$ 299,90" status="Pendente" delay={46} />
            <TableRow desc="Fornecedor XYZ" valor="R$ 12.400,00" status="Vencido" delay={54} />
            <TableRow desc="Software ERP" valor="R$ 1.200,00" status="Pago" delay={62} />
          </MockWindow>
        </div>
      </div>
    </AbsoluteFill>
  );
};
