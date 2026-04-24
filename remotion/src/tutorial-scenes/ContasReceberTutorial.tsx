import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { inter, poppins, SectionBadge, SectionTitle, StepItem, MockWindow } from "./shared";

const TableRow = ({ desc, valor, status, delay }: { desc: string; valor: string; status: string; delay: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 14 } });
  const statusColor = status === "Recebido" ? "#22c55e" : status === "Atrasado" ? "#ef4444" : "#f59e0b";
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
      opacity: interpolate(s, [0, 1], [0, 1]),
    }}>
      <div style={{ fontFamily: inter, fontSize: 14, color: "rgba(255,255,255,0.8)" }}>{desc}</div>
      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        <div style={{ fontFamily: inter, fontSize: 14, fontWeight: 600, color: "#22c55e" }}>{valor}</div>
        <div style={{ fontFamily: poppins, fontSize: 11, fontWeight: 600, color: statusColor, background: `${statusColor}18`, padding: "4px 12px", borderRadius: 20 }}>{status}</div>
      </div>
    </div>
  );
};

export const ContasReceberTutorial = () => {
  return (
    <AbsoluteFill style={{ padding: "60px 100px" }}>
      <SectionBadge icon="💰" label="Passo 4 — Contas a Receber" />
      <SectionTitle text="Gestão de Receitas" />

      <div style={{ display: "flex", gap: 40 }}>
        <div style={{ flex: 1 }}>
          <StepItem number={1} title="Cadastre a receita" description="Informe descrição, valor, vencimento e cliente" delay={15} />
          <StepItem number={2} title="Vincule o cliente" description="Selecione ou cadastre um novo cliente" delay={25} />
          <StepItem number={3} title="Acompanhe o status" description="Visualize receitas pendentes, recebidas e atrasadas" delay={35} />
          <StepItem number={4} title="Confirme recebimento" description="Marque como recebido ao confirmar entrada" delay={45} />
        </div>

        <div style={{ flex: 1 }}>
          <MockWindow title="Contas a Receber" delay={20}>
            <div style={{ fontFamily: poppins, fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>
              Receitas do mês
            </div>
            <TableRow desc="Cliente ABC Ltda" valor="R$ 25.000,00" status="Recebido" delay={30} />
            <TableRow desc="Consultoria DEF" valor="R$ 8.500,00" status="Pendente" delay={38} />
            <TableRow desc="Projeto GHI" valor="R$ 15.200,00" status="Pendente" delay={46} />
            <TableRow desc="Serviço JKL" valor="R$ 4.800,00" status="Atrasado" delay={54} />
          </MockWindow>
        </div>
      </div>
    </AbsoluteFill>
  );
};
