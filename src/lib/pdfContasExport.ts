import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const COLORS = {
  primary: [30, 58, 95] as [number, number, number],
  accent: [41, 128, 185] as [number, number, number],
  success: [39, 174, 96] as [number, number, number],
  danger: [192, 57, 43] as [number, number, number],
  warning: [243, 156, 18] as [number, number, number],
  lightBg: [248, 249, 250] as [number, number, number],
  kpiBg: [240, 244, 248] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  text: [44, 62, 80] as [number, number, number],
  mutedText: [127, 140, 141] as [number, number, number],
  border: [220, 224, 228] as [number, number, number],
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

export function addHeader(doc: jsPDF, title: string, empresa: any): number {
  const pw = doc.internal.pageSize.getWidth();
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pw, 4, "F");

  let y = 16;
  const empresaNome = empresa?.nome_fantasia || empresa?.razao_social || "9Nine Business Control";
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text(empresaNome.toUpperCase(), pw / 2, y, { align: "center" });
  y += 6;

  const details: string[] = [];
  if (empresa?.cnpj) details.push(`CNPJ: ${empresa.cnpj}`);
  if (empresa?.telefone) details.push(`Tel: ${empresa.telefone}`);
  if (empresa?.email) details.push(empresa.email);
  if (details.length > 0) {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.mutedText);
    doc.text(details.join("  |  "), pw / 2, y, { align: "center" });
    y += 5;
  }

  if (empresa?.endereco) {
    const addr = [empresa.endereco, empresa.numero, empresa.bairro, empresa.cidade, empresa.estado, empresa.cep].filter(Boolean).join(", ");
    doc.setFontSize(7);
    doc.text(addr, pw / 2, y, { align: "center" });
    y += 5;
  }

  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(14, y, pw - 14, y);
  y += 8;

  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(14, y - 4, pw - 28, 10, 2, 2, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);
  doc.text(title.toUpperCase(), pw / 2, y + 3, { align: "center" });
  y += 12;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.mutedText);
  doc.text(`Emitido em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, pw - 14, y, { align: "right" });
  y += 8;

  return y;
}

export function addFooter(doc: jsPDF, empresa: any) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, ph - 4, pw, 4, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.mutedText);
    doc.text(`Página ${i} de ${pageCount}`, pw / 2, ph - 7, { align: "center" });
    doc.text("9Nine Business Control", 14, ph - 7);
    const empresaNome = empresa?.nome_fantasia || empresa?.razao_social || "";
    if (empresaNome) doc.text(empresaNome, pw - 14, ph - 7, { align: "right" });
  }
}

function drawKpiBox(doc: jsPDF, x: number, y: number, w: number, h: number, label: string, value: string, color: [number, number, number]) {
  doc.setFillColor(...COLORS.kpiBg);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 2, 2, "FD");
  doc.setFillColor(...color);
  doc.roundedRect(x, y, 3, h, 2, 0, "F");
  doc.rect(x + 1.5, y, 1.5, h, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.mutedText);
  doc.text(label, x + 7, y + 6);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...color);
  doc.text(value, x + 7, y + 14);
}

export function drawKpiRow(doc: jsPDF, y: number, kpis: { label: string; value: string; color: [number, number, number] }[]): number {
  const pw = doc.internal.pageSize.getWidth();
  const margin = 14;
  const gap = 4;
  const cols = kpis.length;
  const boxW = (pw - margin * 2 - gap * (cols - 1)) / cols;
  const boxH = 18;
  kpis.forEach((kpi, i) => {
    drawKpiBox(doc, margin + i * (boxW + gap), y, boxW, boxH, kpi.label, kpi.value, kpi.color);
  });
  return y + boxH + 6;
}

export const tableTheme = (color: [number, number, number]) => ({
  styles: {
    fontSize: 7.5,
    cellPadding: 3,
    lineColor: COLORS.border,
    lineWidth: 0.2,
    textColor: COLORS.text,
  },
  headStyles: {
    fillColor: color,
    textColor: COLORS.white,
    fontStyle: "bold" as const,
    fontSize: 7.5,
    halign: "left" as const,
  },
  alternateRowStyles: {
    fillColor: [248, 249, 252] as [number, number, number],
  },
  footStyles: {
    fillColor: [230, 234, 240] as [number, number, number],
    textColor: COLORS.primary,
    fontStyle: "bold" as const,
    fontSize: 8,
  },
  margin: { left: 14, right: 14 },
});

interface ExportContasPagarOptions {
  contas: any[];
  fornecedores: any[];
  categorias: any[];
  empresa: any;
  formaLabel: (v: string) => string;
}

export function exportContasPagarPDF({ contas, fornecedores, categorias, empresa, formaLabel }: ExportContasPagarOptions) {
  const doc = new jsPDF({ orientation: "landscape" });
  let y = addHeader(doc, "Relatório de Contas a Pagar", empresa);

  const fornMap = Object.fromEntries(fornecedores.map((f: any) => [f.id, f.nome]));
  const catMap = Object.fromEntries(categorias.map((c: any) => [c.id, c.nome]));

  const total = contas.reduce((s: number, c: any) => s + Number(c.valor), 0);
  const pendentes = contas.filter((c: any) => c.status === "pendente");
  const pagos = contas.filter((c: any) => c.status === "pago");
  const vencidos = contas.filter((c: any) => c.status === "vencido");
  const totalPendente = pendentes.reduce((s: number, c: any) => s + Number(c.valor), 0);
  const totalPago = pagos.reduce((s: number, c: any) => s + Number(c.valor), 0);
  const totalVencido = vencidos.reduce((s: number, c: any) => s + Number(c.valor), 0);

  y = drawKpiRow(doc, y, [
    { label: "Total Geral", value: fmt(total), color: COLORS.primary },
    { label: "Pendentes", value: fmt(totalPendente), color: COLORS.warning },
    { label: "Pagos", value: fmt(totalPago), color: COLORS.success },
    { label: "Vencidos", value: fmt(totalVencido), color: COLORS.danger },
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Descrição", "Fornecedor", "Categoria", "Valor", "Vencimento", "Quitação", "Forma Pgto", "Status"]],
    body: contas.map((c: any) => {
      const isAntecipado = c.status === "pago" && c.data_pagamento && c.data_vencimento && c.data_pagamento < c.data_vencimento;
      return [
        c.descricao,
        fornMap[c.fornecedor_id] || "—",
        catMap[c.categoria_id] || "—",
        fmt(Number(c.valor)),
        fmtDate(c.data_vencimento),
        c.data_pagamento ? fmtDate(c.data_pagamento) + (isAntecipado ? " ★" : "") : "—",
        c.forma_pagamento ? formaLabel(c.forma_pagamento) : "—",
        isAntecipado ? "PAGO (ANTECIPADO)" : c.status.toUpperCase(),
      ];
    }),
    foot: [["TOTAL", "", "", fmt(total), "", "", "", `${contas.length} registros`]],
    ...tableTheme(COLORS.danger),
    columnStyles: {
      3: { halign: "right" as const },
    },
    didParseCell: (data: any) => {
      if (data.section === "body" && data.column.index === 7) {
        const status = data.cell.raw?.toString().toLowerCase();
        if (status?.includes("antecipado")) {
          data.cell.styles.textColor = [41, 128, 185];
          data.cell.styles.fontStyle = "bold";
        } else if (status === "pago") data.cell.styles.textColor = COLORS.success;
        else if (status === "vencido") data.cell.styles.textColor = COLORS.danger;
        else if (status === "pendente") data.cell.styles.textColor = COLORS.warning;
      }
      if (data.section === "body" && data.column.index === 5) {
        const val = data.cell.raw?.toString();
        if (val?.includes("★")) {
          data.cell.styles.textColor = [41, 128, 185];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  addFooter(doc, empresa);
  doc.save(`contas-a-pagar-${new Date().toISOString().split("T")[0]}.pdf`);
}

interface ExportContasReceberOptions {
  contas: any[];
  clientes: any[];
  categorias: any[];
  empresa: any;
  formaLabel: (v: string) => string;
}

export function exportContasReceberPDF({ contas, clientes, categorias, empresa, formaLabel }: ExportContasReceberOptions) {
  const doc = new jsPDF({ orientation: "landscape" });
  let y = addHeader(doc, "Relatório de Contas a Receber", empresa);

  const cliMap = Object.fromEntries(clientes.map((c: any) => [c.id, c.nome]));
  const catMap = Object.fromEntries(categorias.map((c: any) => [c.id, c.nome]));

  const total = contas.reduce((s: number, c: any) => s + Number(c.valor), 0);
  const pendentes = contas.filter((c: any) => c.status === "pendente");
  const recebidos = contas.filter((c: any) => c.status === "recebido");
  const vencidos = contas.filter((c: any) => c.status === "vencido");
  const totalPendente = pendentes.reduce((s: number, c: any) => s + Number(c.valor), 0);
  const totalRecebido = recebidos.reduce((s: number, c: any) => s + Number(c.valor), 0);
  const totalVencido = vencidos.reduce((s: number, c: any) => s + Number(c.valor), 0);

  y = drawKpiRow(doc, y, [
    { label: "Total Geral", value: fmt(total), color: COLORS.primary },
    { label: "Pendentes", value: fmt(totalPendente), color: COLORS.warning },
    { label: "Recebidos", value: fmt(totalRecebido), color: COLORS.success },
    { label: "Vencidos", value: fmt(totalVencido), color: COLORS.danger },
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Descrição", "Cliente", "Categoria", "Valor", "Vencimento", "Recebimento", "Forma Receb.", "Status"]],
    body: contas.map((c: any) => {
      const isAntecipado = c.status === "recebido" && c.data_recebimento && c.data_vencimento && c.data_recebimento < c.data_vencimento;
      return [
        c.descricao,
        cliMap[c.cliente_id] || "—",
        catMap[c.categoria_id] || "—",
        fmt(Number(c.valor)),
        fmtDate(c.data_vencimento),
        c.data_recebimento ? fmtDate(c.data_recebimento) + (isAntecipado ? " ★" : "") : "—",
        c.forma_pagamento ? formaLabel(c.forma_pagamento) : "—",
        isAntecipado ? "RECEBIDO (ANTECIPADO)" : c.status.toUpperCase(),
      ];
    }),
    foot: [["TOTAL", "", "", fmt(total), "", "", "", `${contas.length} registros`]],
    ...tableTheme(COLORS.success),
    columnStyles: {
      3: { halign: "right" as const },
    },
    didParseCell: (data: any) => {
      if (data.section === "body" && data.column.index === 7) {
        const status = data.cell.raw?.toString().toLowerCase();
        if (status?.includes("antecipado")) {
          data.cell.styles.textColor = [41, 128, 185];
          data.cell.styles.fontStyle = "bold";
        } else if (status === "recebido") data.cell.styles.textColor = COLORS.success;
        else if (status === "vencido") data.cell.styles.textColor = COLORS.danger;
        else if (status === "pendente") data.cell.styles.textColor = COLORS.warning;
      }
      if (data.section === "body" && data.column.index === 5) {
        const val = data.cell.raw?.toString();
        if (val?.includes("★")) {
          data.cell.styles.textColor = [41, 128, 185];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  addFooter(doc, empresa);
  doc.save(`contas-a-receber-${new Date().toISOString().split("T")[0]}.pdf`);
}

interface DRERow {
  label: string;
  bold?: boolean;
  indent?: boolean;
  type: "header" | "item" | "subtotal" | "percentual";
  values: (string | number)[];
  total: string;
  av: string;
  sign?: "+" | "-" | "=";
}

interface ExportDREOptions {
  rows: DRERow[];
  empresa: any;
  ano: number;
}

export function exportDREPDF({ rows, empresa, ano }: ExportDREOptions) {
  const doc = new jsPDF({ orientation: "landscape" });
  let y = addHeader(doc, `DRE Gerencial — ${ano}`, empresa);

  const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  // KPIs from rows
  const receitaRow = rows.find(r => r.label.includes("Receita Bruta"));
  const lucroRow = rows.find(r => r.label.includes("Lucro Líquido") && !r.label.includes("%"));
  const margemRow = rows.find(r => r.label.includes("Margem de Contribuição") && !r.label.includes("%"));
  const pctMargemRow = rows.find(r => r.label.includes("% Margem Líquida"));

  y = drawKpiRow(doc, y, [
    { label: "Receita Bruta", value: receitaRow?.total || "R$ 0,00", color: COLORS.accent },
    { label: "Margem Contribuição", value: margemRow?.total || "R$ 0,00", color: COLORS.success },
    { label: "Lucro Líquido", value: lucroRow?.total || "R$ 0,00", color: COLORS.primary },
    { label: "Margem Líquida", value: pctMargemRow?.total || "0%", color: COLORS.warning },
  ]);

  const head = [["Descrição", ...MESES, String(ano), "AV%"]];

  const body = rows.map(r => {
    const prefix = r.indent ? "    " : "";
    return [
      prefix + r.label,
      ...r.values.map(v => typeof v === "number" ? fmt(v) : String(v)),
      r.total,
      r.av,
    ];
  });

  autoTable(doc, {
    startY: y,
    head,
    body,
    ...tableTheme(COLORS.primary),
    columnStyles: {
      0: { cellWidth: 55 },
      ...Object.fromEntries(MESES.map((_, i) => [i + 1, { halign: "right" as const, cellWidth: 16 }])),
      13: { halign: "right" as const, fontStyle: "bold" as const, cellWidth: 20 },
      14: { halign: "right" as const, cellWidth: 14 },
    },
    styles: {
      fontSize: 6,
      cellPadding: 2,
      lineColor: COLORS.border,
      lineWidth: 0.2,
      textColor: COLORS.text,
    },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: "bold" as const,
      fontSize: 6,
    },
    didParseCell: (data: any) => {
      if (data.section !== "body") return;
      const row = rows[data.row.index];
      if (!row) return;
      if (row.bold) {
        data.cell.styles.fontStyle = "bold";
      }
      if (row.type === "subtotal" && row.sign === "=") {
        data.cell.styles.fillColor = [230, 234, 240];
      }
      if (row.label.includes("Lucro Líquido") && !row.label.includes("%")) {
        data.cell.styles.fillColor = [220, 230, 245];
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = COLORS.primary;
      }
      if (row.sign === "-" && data.column.index === 0) {
        data.cell.styles.textColor = COLORS.danger;
      }
      if (row.type === "percentual") {
        data.cell.styles.textColor = COLORS.mutedText;
        data.cell.styles.fontStyle = "italic";
      }
    },
  });

  addFooter(doc, empresa);
  doc.save(`dre-gerencial-${ano}-${new Date().toISOString().split("T")[0]}.pdf`);
}
