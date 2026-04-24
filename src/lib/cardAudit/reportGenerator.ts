/**
 * Gerador de Relatórios PDF para o 9nine Business Control Card.
 * Usa jsPDF para gerar relatórios consolidados com logotipo e dados da empresa.
 *
 * Dependência: jspdf (instalar via bun add jspdf)
 */

import type { AliquotaReforma, SplitPaymentResult } from "./index";

export interface ReportData {
  empresa: {
    nome_fantasia: string;
    razao_social: string;
    cnpj: string;
    logo_url?: string;
  };
  periodo: {
    inicio: string;
    fim: string;
  };
  resumo: {
    totalBruto: number;
    totalLiquido: number;
    totalTaxas: number;
    totalTransacoes: number;
    pendentes: number;
    conferidas: number;
    divergentes: number;
    chargebacks: number;
  };
  porAdquirente: Array<{
    adquirente: string;
    total: number;
    bruto: number;
    liquido: number;
    taxas: number;
    taxaPercentual: number;
  }>;
  porBandeira: Array<{
    bandeira: string;
    total: number;
    bruto: number;
    liquido: number;
  }>;
  split?: {
    aliquotaAno: number;
    cbs: number;
    ibs: number;
    liquidoProjetado: number;
  };
  tipoRelatorio: "mensal" | "por_adquirente" | "divergencias" | "split_payment";
}

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (d: string) => {
  try {
    return new Date(d + "T12:00:00").toLocaleDateString("pt-BR");
  } catch {
    return d;
  }
};

/**
 * Gera o conteúdo HTML do relatório, pronto para conversão em PDF.
 * Usa window.print() ou html2canvas + jsPDF para produção.
 */
export function generateReportHTML(data: ReportData): string {
  const { empresa, periodo, resumo, porAdquirente, porBandeira, split, tipoRelatorio } = data;

  const titleByTipo: Record<string, string> = {
    mensal: "Relatório Mensal de Recebíveis",
    por_adquirente: "Relatório por Adquirente",
    divergencias: "Relatório de Divergências",
    split_payment: "Relatório de Projeção Split Payment",
  };

  const title = titleByTipo[tipoRelatorio] || "Relatório de Recebíveis";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${title} — ${empresa.nome_fantasia}</title>
<style>
  @page { size: A4; margin: 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', Arial, sans-serif; color: #1a1a2e; font-size: 12px; line-height: 1.5; }
  .header { display: flex; align-items: center; gap: 16px; padding-bottom: 16px; border-bottom: 3px solid hsl(217, 72%, 42%); margin-bottom: 20px; }
  .logo { width: 60px; height: 60px; border-radius: 8px; object-fit: contain; }
  .logo-placeholder { width: 60px; height: 60px; border-radius: 8px; background: hsl(217, 72%, 42%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; }
  .header-info h1 { font-size: 18px; color: hsl(217, 72%, 42%); font-family: 'DM Sans', sans-serif; }
  .header-info p { font-size: 11px; color: #6b7280; }
  .subtitle { font-size: 14px; font-weight: 600; color: hsl(220, 30%, 12%); margin-bottom: 12px; }
  .period { font-size: 11px; color: #6b7280; margin-bottom: 20px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 24px; }
  .kpi { padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; text-align: center; }
  .kpi .label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
  .kpi .value { font-size: 16px; font-weight: 700; margin-top: 4px; }
  .kpi .value.blue { color: hsl(217, 72%, 42%); }
  .kpi .value.green { color: hsl(160, 60%, 42%); }
  .kpi .value.red { color: hsl(0, 72%, 51%); }
  .kpi .value.amber { color: hsl(35, 85%, 55%); }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background: hsl(217, 72%, 42%); color: white; font-size: 10px; text-transform: uppercase; padding: 8px 10px; text-align: left; }
  td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
  tr:nth-child(even) td { background: #f9fafb; }
  .text-right { text-align: right; }
  .highlight { background: hsl(217, 72%, 42%, 0.08) !important; }
  .split-section { padding: 16px; border: 2px solid hsl(160, 60%, 42%); border-radius: 8px; margin-bottom: 20px; }
  .split-section h3 { color: hsl(160, 60%, 42%); margin-bottom: 8px; }
  .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 9px; color: #9ca3af; display: flex; justify-content: space-between; }
</style>
</head>
<body>
  <div class="header">
    ${empresa.logo_url
      ? `<img class="logo" src="${empresa.logo_url}" alt="${empresa.nome_fantasia}">`
      : `<div class="logo-placeholder">9N</div>`
    }
    <div class="header-info">
      <h1>${empresa.nome_fantasia}</h1>
      <p>${empresa.razao_social} — CNPJ: ${empresa.cnpj}</p>
      <p>9nine Business Control Card</p>
    </div>
  </div>

  <div class="subtitle">${title}</div>
  <div class="period">Período: ${fmtDate(periodo.inicio)} a ${fmtDate(periodo.fim)}</div>

  <div class="kpi-grid">
    <div class="kpi">
      <div class="label">Total Bruto</div>
      <div class="value blue">${fmtBRL(resumo.totalBruto)}</div>
    </div>
    <div class="kpi">
      <div class="label">Taxas (MDR)</div>
      <div class="value red">${fmtBRL(resumo.totalTaxas)}</div>
    </div>
    <div class="kpi">
      <div class="label">Líquido</div>
      <div class="value green">${fmtBRL(resumo.totalLiquido)}</div>
    </div>
    <div class="kpi">
      <div class="label">Transações</div>
      <div class="value blue">${resumo.totalTransacoes}</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi">
      <div class="label">Pendentes</div>
      <div class="value amber">${resumo.pendentes}</div>
    </div>
    <div class="kpi">
      <div class="label">Conferidas</div>
      <div class="value green">${resumo.conferidas}</div>
    </div>
    <div class="kpi">
      <div class="label">Divergentes</div>
      <div class="value red">${resumo.divergentes}</div>
    </div>
    <div class="kpi">
      <div class="label">Chargebacks</div>
      <div class="value red">${resumo.chargebacks}</div>
    </div>
  </div>

  ${porAdquirente.length > 0 ? `
  <div class="subtitle">Breakdown por Adquirente</div>
  <table>
    <thead>
      <tr>
        <th>Adquirente</th>
        <th class="text-right">Transações</th>
        <th class="text-right">Bruto</th>
        <th class="text-right">Taxas</th>
        <th class="text-right">Líquido</th>
        <th class="text-right">MDR %</th>
      </tr>
    </thead>
    <tbody>
      ${porAdquirente.map((a) => `
      <tr>
        <td style="text-transform:capitalize">${a.adquirente}</td>
        <td class="text-right">${a.total}</td>
        <td class="text-right">${fmtBRL(a.bruto)}</td>
        <td class="text-right" style="color:hsl(0,72%,51%)">${fmtBRL(a.taxas)}</td>
        <td class="text-right" style="font-weight:600">${fmtBRL(a.liquido)}</td>
        <td class="text-right">${a.taxaPercentual.toFixed(2)}%</td>
      </tr>
      `).join("")}
    </tbody>
  </table>
  ` : ""}

  ${porBandeira.length > 0 ? `
  <div class="subtitle">Breakdown por Bandeira</div>
  <table>
    <thead>
      <tr>
        <th>Bandeira</th>
        <th class="text-right">Transações</th>
        <th class="text-right">Bruto</th>
        <th class="text-right">Líquido</th>
      </tr>
    </thead>
    <tbody>
      ${porBandeira.map((b) => `
      <tr>
        <td style="text-transform:capitalize">${b.bandeira}</td>
        <td class="text-right">${b.total}</td>
        <td class="text-right">${fmtBRL(b.bruto)}</td>
        <td class="text-right" style="font-weight:600">${fmtBRL(b.liquido)}</td>
      </tr>
      `).join("")}
    </tbody>
  </table>
  ` : ""}

  ${split ? `
  <div class="split-section">
    <h3>Projeção Split Payment — IBS/CBS (EC 132/2023)</h3>
    <p style="font-size:11px; margin-bottom:8px;">Alíquotas vigentes em ${split.aliquotaAno}</p>
    <div class="kpi-grid">
      <div class="kpi">
        <div class="label">CBS Retido</div>
        <div class="value red">${fmtBRL(split.cbs)}</div>
      </div>
      <div class="kpi">
        <div class="label">IBS Retido</div>
        <div class="value red">${fmtBRL(split.ibs)}</div>
      </div>
      <div class="kpi">
        <div class="label">Líquido para Empresa</div>
        <div class="value green">${fmtBRL(split.liquidoProjetado)}</div>
      </div>
      <div class="kpi">
        <div class="label">Ano Referência</div>
        <div class="value blue">${split.aliquotaAno}</div>
      </div>
    </div>
  </div>
  ` : ""}

  <div class="footer">
    <span>Gerado por 9nine Business Control Card em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</span>
    <span>Página 1 de 1</span>
  </div>
</body>
</html>`;
}

/**
 * Abre o relatório em nova janela para impressão/salvar como PDF.
 * Usa window.print() nativo — sem dependências externas.
 */
export function printReport(data: ReportData): void {
  const html = generateReportHTML(data);
  const win = window.open("", "_blank");
  if (!win) {
    throw new Error("Bloqueador de pop-up impediu a abertura do relatório.");
  }
  win.document.write(html);
  win.document.close();
  // Aguardar carregamento e disparar impressão
  win.onload = () => {
    win.print();
  };
}

/**
 * Baixa o relatório como arquivo HTML (pode ser convertido a PDF pelo navegador).
 */
export function downloadReportHTML(data: ReportData, filename?: string): void {
  const html = generateReportHTML(data);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `relatorio-card-audit-${data.periodo.inicio}-${data.periodo.fim}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}