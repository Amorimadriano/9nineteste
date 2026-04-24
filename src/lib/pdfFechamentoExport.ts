import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { COLORS, addHeader, addFooter, drawKpiRow } from "./pdfContasExport";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

interface FechamentoDados {
  receita: number;
  despesa: number;
  custosDiretos: number;
  despOp: number;
  lucroBruto: number;
  lucroLiquido: number;
  crPendentes: number;
  cpPendentes: number;
  crRecebido: number;
  cpPago: number;
  crVencidas: number;
  cpVencidas: number;
  saldoInicioMes: number;
  saldoFimMes: number;
  pieData: { name: string; value: number }[];
  comparativo: { mes: string; receitas: number; despesas: number; resultado: number }[];
  totalContas: number;
  contasRecebidas: number;
  contasPagas: number;
}

export function exportFechamentoPdf(
  dados: FechamentoDados,
  mesSel: number,
  anoSel: number,
  empresa: any,
  statusFechamento: string | null,
  observacoes: string | null,
) {
  const doc = new jsPDF("portrait", "mm", "a4");
  const pw = doc.internal.pageSize.getWidth();

  // Header
  let y = addHeader(doc, `Relatório de Fechamento — ${meses[mesSel - 1]} / ${anoSel}`, empresa);

  // Status badge
  const status = statusFechamento || "aberto";
  const statusLabel = status === "fechado" ? "FECHADO" : status === "reaberto" ? "REABERTO" : "ABERTO";
  const statusColor: [number, number, number] = status === "fechado" ? COLORS.success : status === "reaberto" ? COLORS.warning : COLORS.accent;
  doc.setFillColor(...statusColor);
  doc.roundedRect(14, y, 32, 7, 1.5, 1.5, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);
  doc.text(statusLabel, 30, y + 4.8, { align: "center" });
  y += 14;

  // KPIs — Row 1
  y = drawKpiRow(doc, y, [
    { label: "Saldo Início", value: fmt(dados.saldoInicioMes), color: COLORS.primary },
    { label: "Saldo Fim", value: fmt(dados.saldoFimMes), color: COLORS.primary },
    { label: "Receita Total", value: fmt(dados.receita), color: COLORS.success },
    { label: "Despesa Total", value: fmt(dados.despesa), color: COLORS.danger },
  ]);
  y += 4;

  // KPIs — Row 2
  y = drawKpiRow(doc, y, [
    { label: "Lucro Bruto", value: fmt(dados.lucroBruto), color: dados.lucroBruto >= 0 ? COLORS.success : COLORS.danger },
    { label: "Lucro Líquido", value: fmt(dados.lucroLiquido), color: dados.lucroLiquido >= 0 ? COLORS.success : COLORS.danger },
    { label: "A Receber Pendente", value: fmt(dados.crPendentes), color: COLORS.accent },
    { label: "A Pagar Pendente", value: fmt(dados.cpPendentes), color: COLORS.danger },
  ]);
  y += 10;

  // Resumo do Período
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(14, y, pw - 28, 8, 1.5, 1.5, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);
  doc.text("RESUMO DO PERÍODO", pw / 2, y + 5.5, { align: "center" });
  y += 12;

  const resumoData = [
    ["Custos Diretos (CMV)", fmt(dados.custosDiretos)],
    ["Despesas Operacionais", fmt(dados.despOp)],
    ["Contas Recebidas", `${dados.contasRecebidas} — ${fmt(dados.crRecebido)}`],
    ["Contas Pagas", `${dados.contasPagas} — ${fmt(dados.cpPago)}`],
    ["Contas a Receber Vencidas", String(dados.crVencidas)],
    ["Contas a Pagar Vencidas", String(dados.cpVencidas)],
    ["Margem Bruta", dados.receita > 0 ? `${((dados.lucroBruto / dados.receita) * 100).toFixed(1)}%` : "0,0%"],
    ["Margem Líquida", dados.receita > 0 ? `${((dados.lucroLiquido / dados.receita) * 100).toFixed(1)}%` : "0,0%"],
  ];

  autoTable(doc, {
    startY: y,
    head: [["Indicador", "Valor"]],
    body: resumoData,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 3, textColor: COLORS.text },
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: "bold" },
    alternateRowStyles: { fillColor: COLORS.lightBg },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Despesas por Categoria
  if (dados.pieData.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; }

    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(14, y, pw - 28, 8, 1.5, 1.5, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.white);
    doc.text("DESPESAS POR CATEGORIA", pw / 2, y + 5.5, { align: "center" });
    y += 12;

    const totalDesp = dados.pieData.reduce((s, d) => s + d.value, 0);
    const catData = dados.pieData.map(d => [
      d.name,
      fmt(d.value),
      totalDesp > 0 ? `${((d.value / totalDesp) * 100).toFixed(1)}%` : "0,0%",
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Categoria", "Valor", "% do Total"]],
      body: catData,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3, textColor: COLORS.text },
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: "bold" },
      alternateRowStyles: { fillColor: COLORS.lightBg },
      margin: { left: 14, right: 14 },
      foot: [["TOTAL", fmt(totalDesp), "100%"]],
      footStyles: { fillColor: COLORS.kpiBg, fontStyle: "bold", textColor: COLORS.primary },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Comparativo 3 Meses
  if (dados.comparativo.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }

    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(14, y, pw - 28, 8, 1.5, 1.5, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.white);
    doc.text("COMPARATIVO — ÚLTIMOS 3 MESES", pw / 2, y + 5.5, { align: "center" });
    y += 12;

    const compData = dados.comparativo.map(c => [
      c.mes,
      fmt(c.receitas),
      fmt(c.despesas),
      fmt(c.resultado),
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Mês", "Receitas", "Despesas", "Resultado"]],
      body: compData,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3, textColor: COLORS.text },
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: "bold" },
      alternateRowStyles: { fillColor: COLORS.lightBg },
      margin: { left: 14, right: 14 },
      didParseCell(data) {
        if (data.section === "body" && data.column.index === 3) {
          const val = dados.comparativo[data.row.index]?.resultado ?? 0;
          data.cell.styles.textColor = val >= 0 ? COLORS.success : COLORS.danger;
          data.cell.styles.fontStyle = "bold";
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Observações
  if (observacoes) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.primary);
    doc.text("Observações:", 14, y);
    y += 5;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.text);
    const lines = doc.splitTextToSize(observacoes, pw - 28);
    doc.text(lines, 14, y);
    y += lines.length * 4 + 6;
  }

  // Footer
  addFooter(doc, empresa);

  doc.save(`Fechamento_${meses[mesSel - 1]}_${anoSel}.pdf`);
}
