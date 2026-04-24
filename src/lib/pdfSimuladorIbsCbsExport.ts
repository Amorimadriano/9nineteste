import jsPDF from "jspdf";
import { COLORS, addHeader, addFooter } from "./pdfContasExport";

interface SimulacaoDados {
  empresa: string;
  setor: string;
  regimeAtual: "simples" | "presumido" | "real";
  faturamentoMensal: number;
  faturamentoAnual: number;
  cargaAtual: number;
  aliquotaAtual: number;
  cargaNova: number;
  variacao: number;
  impactoSplit: number;
  capitalGiroAnual: number;
  prazoRecebimento: number;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const regimeLabels: Record<string, string> = {
  simples: "Simples Nacional",
  presumido: "Lucro Presumido",
  real: "Lucro Real",
};

function drawKpi(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  color: [number, number, number]
) {
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
  doc.text(label, x + 6, y + 5);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...color);
  doc.text(value, x + 6, y + 12);
}

export function exportarPdfSimuladorIbsCbs(
  dados: SimulacaoDados,
  parecer: string,
  empresa: any
) {
  const doc = new jsPDF("p", "mm", "a4");
  const pw = doc.internal.pageSize.getWidth();

  let y = addHeader(doc, "Simulação IBS/CBS + Split Payment", empresa);

  // Info da simulação
  doc.setFillColor(...COLORS.lightBg);
  doc.roundedRect(14, y, pw - 28, 24, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.text);

  const info = [
    `Empresa: ${dados.empresa || "Não informado"}`,
    `Setor: ${dados.setor}`,
    `Regime Atual: ${regimeLabels[dados.regimeAtual] || dados.regimeAtual}`,
    `Prazo Médio de Recebimento: ${dados.prazoRecebimento} dias`,
  ];

  info.forEach((line, i) => {
    const col = i < 2 ? 18 : pw / 2 + 4;
    const row = i % 2 === 0 ? y + 7 : y + 15;
    doc.text(line, col, row);
  });
  y += 30;

  // KPIs
  const kpiW = (pw - 28 - 8) / 3;
  drawKpi(doc, 14, y, kpiW, 18, "Faturamento Mensal", fmt(dados.faturamentoMensal), COLORS.accent);
  drawKpi(doc, 14 + kpiW + 4, y, kpiW, 18, "Faturamento Anual", fmt(dados.faturamentoAnual), COLORS.accent);
  drawKpi(doc, 14 + (kpiW + 4) * 2, y, kpiW, 18, "Prazo Recebimento", `${dados.prazoRecebimento} dias`, COLORS.primary);
  y += 24;

  // Comparação de carga tributária
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(14, y, pw - 28, 8, 2, 2, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);
  doc.text("COMPARATIVO DE CARGA TRIBUTÁRIA", pw / 2, y + 5.5, { align: "center" });
  y += 14;

  const halfW = (pw - 28 - 4) / 2;
  drawKpi(doc, 14, y, halfW, 20, `Carga Atual (${dados.aliquotaAtual}%)`, fmt(dados.cargaAtual), COLORS.accent);
  drawKpi(doc, 14 + halfW + 4, y, halfW, 20, "Carga Nova IBS/CBS (26,5%)", fmt(dados.cargaNova), dados.variacao > 0 ? COLORS.danger : COLORS.success);
  y += 26;

  // Variação
  const varColor = dados.variacao > 0 ? COLORS.danger : COLORS.success;
  doc.setFillColor(varColor[0], varColor[1], varColor[2]);
  doc.roundedRect(14, y, pw - 28, 14, 2, 2, "F");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);
  const varText = `Variação: ${dados.variacao > 0 ? "+" : ""}${dados.variacao.toFixed(2)}%  —  ${dados.variacao > 0 ? "AUMENTO" : "REDUÇÃO"} na carga tributária`;
  doc.text(varText, pw / 2, y + 9, { align: "center" });
  y += 20;

  // Split Payment
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(14, y, pw - 28, 8, 2, 2, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);
  doc.text("IMPACTO DO SPLIT PAYMENT NO FLUXO DE CAIXA", pw / 2, y + 5.5, { align: "center" });
  y += 14;

  drawKpi(doc, 14, y, halfW, 20, "Retenção Mensal Estimada", fmt(dados.impactoSplit), COLORS.warning);
  drawKpi(doc, 14 + halfW + 4, y, halfW, 20, "Capital de Giro Comprometido (12m)", fmt(dados.capitalGiroAnual), COLORS.danger);
  y += 26;

  // Parecer executivo
  if (parecer) {
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(14, y, pw - 28, 8, 2, 2, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.white);
    doc.text("PARECER EXECUTIVO (IA)", pw / 2, y + 5.5, { align: "center" });
    y += 14;

    // Limpar emojis e caracteres não suportados pelo Helvetica do jsPDF
    const emojiMap: Record<string, string> = {
      "\u{1F4CA}": "[Diagnostico]",
      "\u26A0\uFE0F": "[Riscos]",
      "\u26A0": "[Riscos]",
      "\u{1F4A1}": "[Oportunidades]",
      "\u{1F3AF}": "[Recomendacoes]",
      "\u{1F4B0}": "[Financeiro]",
      "\u{1F4C8}": "[Tendencia]",
      "\u{1F4C9}": "[Queda]",
      "\u2705": "[OK]",
      "\u274C": "[X]",
      "\u{1F680}": "[Acao]",
      "\u2022": "-",
    };
    let parecerLimpo = parecer;
    for (const [emoji, replacement] of Object.entries(emojiMap)) {
      parecerLimpo = parecerLimpo.split(emoji).join(replacement);
    }
    // Remove any remaining emojis/surrogate pairs
    parecerLimpo = parecerLimpo.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{200D}]/gu, "");

    // Processar o parecer em blocos (títulos vs texto)
    const blocos = parecerLimpo.split(/\n+/);
    const lineHeight = 4.2;
    const ph = doc.internal.pageSize.getHeight();

    for (const bloco of blocos) {
      const trimmed = bloco.trim();
      if (!trimmed) continue;

      const isTitulo = /^\[.+\]/.test(trimmed) || /^\*\*/.test(trimmed) || /^#{1,3}\s/.test(trimmed);

      if (y + lineHeight > ph - 20) {
        addFooter(doc, empresa);
        doc.addPage();
        y = 20;
      }

      if (isTitulo) {
        y += 2;
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.primary);
        const cleanTitle = trimmed.replace(/\*\*/g, "").replace(/^#{1,3}\s/, "");
        doc.text(cleanTitle, 16, y);
        y += lineHeight + 1;
      } else {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...COLORS.text);
        const cleanText = trimmed.replace(/\*\*/g, "").replace(/\*/g, "");
        const lines = doc.splitTextToSize(cleanText, pw - 36);
        for (const line of lines) {
          if (y + lineHeight > ph - 20) {
            addFooter(doc, empresa);
            doc.addPage();
            y = 20;
          }
          doc.text(line, 18, y);
          y += lineHeight;
        }
      }
    }
  }

  // Disclaimer
  y += 6;
  const ph = doc.internal.pageSize.getHeight();
  if (y + 20 > ph - 20) {
    addFooter(doc, empresa);
    doc.addPage();
    y = 20;
  }
  doc.setFillColor(240, 244, 255);
  doc.roundedRect(14, y, pw - 28, 14, 2, 2, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...COLORS.mutedText);
  doc.text(
    "Nota: Este relatório fornece estimativas baseadas em alíquotas médias da Reforma Tributária (EC 132/2023, LC 214/2025).",
    pw / 2, y + 5, { align: "center" }
  );
  doc.text(
    "Consulte um contador para análise detalhada do seu caso específico.",
    pw / 2, y + 10, { align: "center" }
  );

  addFooter(doc, empresa);

  doc.save(`Simulacao_IBS_CBS_${dados.empresa || "Empresa"}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
