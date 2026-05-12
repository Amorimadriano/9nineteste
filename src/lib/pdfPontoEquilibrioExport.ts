import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { COLORS, addHeader, addFooter } from "./pdfContasExport";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPct = (v: number) => `${v.toFixed(2)}%`;
const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

interface PontoEquilibrioDados {
  receitaTotal: number;
  custosVariaveis: number;
  custosFixos: number;
  margemContribuicao: number;
  margemContribuicaoPct: number;
  pontoEquilibrio: number;
  faturamentoAtual: number;
  percentualAtingido: number;
  folga: number;
  detalheMensal: {
    mes: string;
    receita: number;
    custoVariavel: number;
    custoFixo: number;
    mc: number;
    pe: number;
    atingido: boolean;
  }[];
  topCustosFixos: { nome: string; valor: number }[];
  topCustosVariaveis: { nome: string; valor: number }[];
}

export function exportPontoEquilibrioPdf(dados: PontoEquilibrioDados, anoSel: number, empresa: any) {
  const doc = new jsPDF("portrait", "mm", "a4");
  const pw = doc.internal.pageSize.getWidth();

  let y = addHeader(doc, `Ponto de Equilíbrio — ${anoSel}`, empresa);

  // KPI cards
  const kpis = [
    { label: "Receita Total", value: fmt(dados.receitaTotal), color: COLORS.success },
    { label: "Custos Fixos", value: fmt(dados.custosFixos), color: COLORS.danger },
    { label: "Custos Variáveis", value: fmt(dados.custosVariaveis), color: COLORS.warning },
    { label: "Margem Contribuição", value: fmtPct(dados.margemContribuicaoPct), color: COLORS.accent },
    { label: "Ponto de Equilíbrio", value: fmt(dados.pontoEquilibrio), color: COLORS.primary },
    { label: "% Atingido", value: fmtPct(dados.percentualAtingido), color: dados.percentualAtingido >= 100 ? COLORS.success : COLORS.danger },
  ];

  const cardW = (pw - 28 - 10) / 3;
  kpis.forEach((kpi, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = 14 + col * (cardW + 5);
    const cy = y + row * 18;
    doc.setFillColor(...COLORS.kpiBg);
    doc.roundedRect(cx, cy, cardW, 15, 2, 2, "F");
    doc.setFillColor(...kpi.color);
    doc.rect(cx, cy, 1.5, 15, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.mutedText);
    doc.text(kpi.label, cx + 5, cy + 5);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.text);
    doc.text(kpi.value, cx + 5, cy + 12);
  });
  y += 40;

  // --- Explicativo geral ---
  doc.setFillColor(...COLORS.lightBg);
  doc.roundedRect(14, y, pw - 28, 36, 2, 2, "F");
  doc.setFillColor(...COLORS.primary);
  doc.rect(14, y, 1.5, 36, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("O que e o Ponto de Equilibrio?", 19, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.text);
  const explicativo = [
    "O Ponto de Equilibrio representa o faturamento minimo necessario para cobrir todos os custos da empresa (fixos e variaveis),",
    "sem gerar lucro nem prejuizo. Quando a receita ultrapassa esse valor, a empresa comeca a gerar lucro. Quando fica abaixo,",
    "opera com prejuizo. A Margem de Contribuicao e o percentual da receita que sobra apos deduzir os custos variaveis, ou seja,",
    "quanto cada real de venda contribui para pagar os custos fixos e gerar lucro.",
  ];
  explicativo.forEach((line, i) => {
    doc.text(line, 19, y + 12 + i * 4);
  });
  y += 40;

  // Diagnóstico automático
  const diagnostico = dados.percentualAtingido >= 120
    ? "A empresa opera com folga confortavel acima do Ponto de Equilibrio, indicando saude financeira solida e margem de seguranca."
    : dados.percentualAtingido >= 100
    ? "A empresa atingiu o Ponto de Equilibrio, porem com margem estreita. Recomenda-se monitorar os custos para ampliar a folga."
    : dados.percentualAtingido >= 70
    ? "ATENCAO: A empresa esta proximo do Ponto de Equilibrio mas ainda abaixo. E necessario aumentar receitas ou reduzir custos."
    : "ALERTA: A empresa opera significativamente abaixo do Ponto de Equilibrio, gerando prejuizo. Acoes urgentes sao necessarias.";

  const diagColor = dados.percentualAtingido >= 100 ? COLORS.success : dados.percentualAtingido >= 70 ? COLORS.warning : COLORS.danger;
  doc.setFillColor(...diagColor);
  doc.roundedRect(14, y, pw - 28, 12, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);
  doc.text("Diagnostico: ", 18, y + 5);
  doc.setFont("helvetica", "normal");
  doc.text(diagnostico, 42, y + 5, { maxWidth: pw - 64 });
  y += 16;

  // Folga/Excedente
  const folgaColor = dados.folga >= 0 ? COLORS.success : COLORS.danger;
  doc.setFillColor(...folgaColor);
  doc.roundedRect(14, y, pw - 28, 10, 2, 2, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);
  const folgaText = dados.folga >= 0
    ? `Faturamento acima do Ponto de Equilibrio: ${fmt(dados.folga)}`
    : `Faturamento abaixo do Ponto de Equilibrio: ${fmt(Math.abs(dados.folga))}`;
  doc.text(folgaText, pw / 2, y + 7, { align: "center" });
  y += 16;

  // Monthly table
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("Análise Mensal", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Mês", "Receita", "C. Variável", "C. Fixo", "Margem Contr.", "Pt. Equilíbrio", "Status"]],
    body: dados.detalheMensal.map(m => [
      m.mes,
      fmt(m.receita),
      fmt(m.custoVariavel),
      fmt(m.custoFixo),
      fmt(m.mc),
      fmt(m.pe),
      m.atingido ? "✓ Atingido" : "✗ Abaixo",
    ]),
    theme: "grid",
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: "bold", fontSize: 7 },
    bodyStyles: { fontSize: 7, textColor: COLORS.text },
    alternateRowStyles: { fillColor: COLORS.lightBg },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Top custos fixos
  if (dados.topCustosFixos.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.primary);
    doc.text("Top Custos Fixos", 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Categoria", "Valor"]],
      body: dados.topCustosFixos.map(c => [c.nome, fmt(c.valor)]),
      theme: "grid",
      headStyles: { fillColor: COLORS.danger, textColor: COLORS.white, fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: COLORS.text },
      margin: { left: 14, right: pw / 2 + 5 },
    });
  }

  // --- Glossário explicativo ---
  y = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : y + 10;
  if (y > 230) { doc.addPage(); y = 20; }

  doc.setFillColor(...COLORS.lightBg);
  doc.roundedRect(14, y, pw - 28, 48, 2, 2, "F");
  doc.setFillColor(...COLORS.accent);
  doc.rect(14, y, 1.5, 48, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("Glossario de Termos", 19, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.text);
  const termos = [
    "Receita Total: Soma de todos os valores recebidos (contas a receber com status 'recebido') no periodo.",
    "Custos Variaveis: Despesas que variam conforme o volume de vendas (ex: CMV, CSP, impostos sobre vendas, comissoes, fretes).",
    "Custos Fixos: Despesas que permanecem constantes independente do faturamento (ex: aluguel, salarios, contabilidade).",
    "Margem de Contribuicao: Percentual da receita que sobra apos pagar os custos variaveis. Formula: (Receita - Custos Variaveis) / Receita.",
    "Ponto de Equilibrio: Faturamento minimo para cobrir todos os custos. Formula: Custos Fixos / Margem de Contribuicao (%).",
    "Folga/Excedente: Diferenca entre o faturamento real e o Ponto de Equilibrio. Valores positivos indicam lucro potencial.",
    "Status 'Atingido': O faturamento do mes superou o Ponto de Equilibrio, cobrindo todos os custos.",
    "Status 'Abaixo': O faturamento do mes nao foi suficiente para cobrir todos os custos, gerando prejuizo.",
  ];
  termos.forEach((t, i) => {
    doc.setFont("helvetica", "bold");
    doc.text("• ", 19, y + 12 + i * 4.5);
    const [titulo, ...resto] = t.split(": ");
    doc.text(`${titulo}: `, 22, y + 12 + i * 4.5);
    const tituloW = doc.getTextWidth(`${titulo}: `);
    doc.setFont("helvetica", "normal");
    doc.text(resto.join(": "), 22 + tituloW, y + 12 + i * 4.5, { maxWidth: pw - 50 });
  });

  addFooter(doc, empresa);
  doc.save(`ponto-equilibrio-${anoSel}.pdf`);
}
