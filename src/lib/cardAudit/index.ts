/**
 * Biblioteca de Auditoria de Cartões - 9nine Business Control Card
 * Cálculo de Reforma Tributária (IBS/CBS) e Split Payment - EC 132/2023
 */

export interface AliquotaReforma {
  ano: number;
  aliquota_cbs: number;
  aliquota_ibs: number;
  observacao?: string;
}

export interface SplitPaymentInput {
  valor_bruto: number;
  taxa_mdr: number;
  aliquota_cbs: number;
  aliquota_ibs: number;
}

export interface SplitPaymentResult {
  valor_bruto: number;
  valor_mdr: number;
  valor_cbs: number;
  valor_ibs: number;
  total_tributos: number;
  valor_liquido_empresa: number;
}

/**
 * Calcula a decomposição do Split Payment.
 * No regime IBS/CBS, a parcela de tributos é retida na liquidação
 * e enviada diretamente ao fisco pela adquirente.
 */
export function calcularSplitPayment(input: SplitPaymentInput): SplitPaymentResult {
  const { valor_bruto, taxa_mdr, aliquota_cbs, aliquota_ibs } = input;
  const valor_mdr = round2(valor_bruto * taxa_mdr);
  const valor_cbs = round2(valor_bruto * aliquota_cbs);
  const valor_ibs = round2(valor_bruto * aliquota_ibs);
  const total_tributos = round2(valor_cbs + valor_ibs);
  const valor_liquido_empresa = round2(valor_bruto - valor_mdr - total_tributos);

  return {
    valor_bruto: round2(valor_bruto),
    valor_mdr,
    valor_cbs,
    valor_ibs,
    total_tributos,
    valor_liquido_empresa,
  };
}

function round2(v: number) {
  return Math.round(v * 100) / 100;
}

export const ADQUIRENTES = [
  { id: "cielo", nome: "Cielo" },
  { id: "rede", nome: "Rede" },
  { id: "stone", nome: "Stone" },
  { id: "getnet", nome: "GetNet" },
  { id: "pagseguro", nome: "PagSeguro" },
  { id: "safrapay", nome: "SafraPay" },
  { id: "outras", nome: "Outras" },
] as const;

export const TIPOS_TRANSACAO = [
  { id: "credito_a_vista", nome: "Crédito à Vista" },
  { id: "credito_parcelado", nome: "Crédito Parcelado" },
  { id: "debito", nome: "Débito" },
  { id: "pix", nome: "Pix" },
  { id: "voucher", nome: "Voucher" },
] as const;

/**
 * Parser simples de CSV de extrato de adquirente.
 * Detecta colunas: data, nsu, valor_bruto, taxa, valor_liquido, bandeira, parcelas.
 */
export function parseExtratoCSV(csvText: string): Array<Record<string, string>> {
  const lines = csvText.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(sep).map((h) => normalizeHeader(h));
  return lines.slice(1).map((line) => {
    const cols = line.split(sep);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = (cols[i] || "").trim()));
    return row;
  });
}

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Mapeia headers conhecidos para campos canônicos.
 */
export function mapearLinhaExtrato(row: Record<string, string>) {
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const found = Object.keys(row).find((rk) => rk.includes(k));
      if (found && row[found]) return row[found];
    }
    return "";
  };

  const parseNumber = (v: string) =>
    parseFloat(v.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "")) || 0;

  const parseDate = (v: string) => {
    const m = v.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    const iso = v.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    return null;
  };

  return {
    data_venda: parseDate(get("data_venda", "data_da_venda", "dt_venda", "data")),
    data_prevista_recebimento: parseDate(
      get("data_prevista", "previsao", "data_pagamento", "dt_pagamento")
    ),
    nsu: get("nsu", "nsu_host", "nsu_cv"),
    autorizacao: get("autorizacao", "codigo_autorizacao"),
    bandeira: get("bandeira", "marca").toLowerCase() || null,
    valor_bruto: parseNumber(get("valor_bruto", "vlr_bruto", "valor_venda", "valor")),
    taxa_mdr: parseNumber(get("taxa", "taxa_mdr", "percentual")) / 100,
    valor_taxa: parseNumber(get("valor_taxa", "vlr_taxa", "desconto")),
    valor_liquido: parseNumber(get("valor_liquido", "vlr_liquido", "liquido")),
    parcelas: parseInt(get("parcelas", "qtd_parcelas") || "1", 10),
    parcela_atual: parseInt(get("parcela_atual", "parcela") || "1", 10),
    tipo_transacao: detectarTipo(get("tipo", "produto", "modalidade")),
  };
}

function detectarTipo(v: string): string {
  const s = v.toLowerCase();
  if (s.includes("parc")) return "credito_parcelado";
  if (s.includes("deb")) return "debito";
  if (s.includes("pix")) return "pix";
  if (s.includes("voucher") || s.includes("vale")) return "voucher";
  return "credito_a_vista";
}

export const VERSAO = "2.0.0";

// Re-export parsers avançados
export { parseOFX, ofxToCardTransactions, type OFXTransaction, type OFXStatement, type OFXParsedResult } from "./ofxParser";
export { parseExtratoAvancado, detectAdquirente, type ParsedRow, type ParseResult, type ColumnMapping } from "./excelParser";
export { generateReportHTML, printReport, downloadReportHTML, type ReportData } from "./reportGenerator";
