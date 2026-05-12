/**
 * Parser avançado de Excel/CSV para extratos de adquirentes.
 * Suporta detecção automática de layout por adquirente
 * e mapeamento flexível de colunas.
 */

export interface ParsedRow {
  data_venda: string | null;
  data_prevista_recebimento: string | null;
  data_recebimento: string | null;
  nsu: string | null;
  autorizacao: string | null;
  bandeira: string | null;
  tipo_transacao: string;
  parcelas: number;
  parcela_atual: number;
  valor_bruto: number;
  taxa_mdr: number;
  valor_taxa: number;
  valor_liquido: number;
}

export interface ParseResult {
  rows: ParsedRow[];
  errors: Array<{ line: number; message: string }>;
  detectedAdquirente: string | null;
  detectedLayout: string;
}

export interface ColumnMapping {
  data_venda: string[];
  data_prevista: string[];
  data_recebimento: string[];
  nsu: string[];
  autorizacao: string[];
  bandeira: string[];
  tipo: string[];
  parcelas: string[];
  parcela_atual: string[];
  valor_bruto: string[];
  taxa_mdr: string[];
  valor_taxa: string[];
  valor_liquido: string[];
}

// Layouts conhecidos por adquirente
const LAYOUTS: Record<string, ColumnMapping> = {
  cielo: {
    data_venda: ["data_venda", "data_da_venda", "dt_venda", "data_transacao", "data"],
    data_prevista: ["data_prevista", "data_credito", "previsao_pagamento", "dt_prevista"],
    data_recebimento: ["data_recebimento", "data_pagamento", "dt_pagamento", "data_liquidacao"],
    nsu: ["nsu", "nsu_host", "nsu_cv", "codigo_transacao"],
    autorizacao: ["autorizacao", "codigo_autorizacao", "num_autorizacao", "auth"],
    bandeira: ["bandeira", "marca", "produto", "tipo_cartao"],
    tipo: ["tipo", "produto", "modalidade", "tipo_transacao", "forma_pagamento"],
    parcelas: ["parcelas", "qtd_parcelas", "numero_parcelas", "qtde_parcelas"],
    parcela_atual: ["parcela_atual", "parcela", "num_parcela", "n_parcela"],
    valor_bruto: ["valor_bruto", "vlr_bruto", "valor_venda", "valor", "valor_total", "vl_total"],
    taxa_mdr: ["taxa", "taxa_mdr", "percentual", "tx_administracao", "taxa_desconto"],
    valor_taxa: ["valor_taxa", "vlr_taxa", "desconto", "vlr_desconto", "valor_desconto"],
    valor_liquido: ["valor_liquido", "vlr_liquido", "liquido", "valor_credito", "vl_liquido", "valor_a_receber"],
  },
  rede: {
    data_venda: ["data_venda", "data", "dt_venda", "data_transacao"],
    data_prevista: ["data_prevista", "previsao", "data_credito"],
    data_recebimento: ["data_pagamento", "data_recebimento", "dt_pagamento"],
    nsu: ["nsu", "nsu_host", "codigo_transacao", "cod_nsu"],
    autorizacao: ["autorizacao", "num_autorizacao", "auth_code"],
    bandeira: ["bandeira", "marca", "produto"],
    tipo: ["tipo", "modalidade", "forma_pagamento", "produto"],
    parcelas: ["parcelas", "qtd_parcelas", "qtde_parcelas"],
    parcela_atual: ["parcela", "num_parcela", "parcela_atual"],
    valor_bruto: ["valor_bruto", "valor_venda", "valor", "vlr_bruto"],
    taxa_mdr: ["taxa", "taxa_mdr", "percentual", "tx_desconto"],
    valor_taxa: ["valor_taxa", "desconto", "vlr_desconto", "vl_desconto"],
    valor_liquido: ["valor_liquido", "liquido", "valor_credito", "vlr_liquido", "valor_a_pagar"],
  },
  stone: {
    data_venda: ["data_venda", "data_criacao", "data_transacao", "data"],
    data_prevista: ["data_prevista", "expected_date", "previsao"],
    data_recebimento: ["data_recebimento", "data_liquidacao", "settled_at"],
    nsu: ["nsu", "id_transacao", "stone_id", "codigo_transacao"],
    autorizacao: ["autorizacao", "auth_code", "approval_code"],
    bandeira: ["bandeira", "brand", "card_brand", "marca"],
    tipo: ["tipo", "type", "payment_type", "produto"],
    parcelas: ["parcelas", "installments", "qtd_parcelas"],
    parcela_atual: ["parcela", "installment", "parcela_atual"],
    valor_bruto: ["valor_bruto", "amount", "gross_amount", "valor"],
    taxa_mdr: ["taxa", "fee_rate", "mdr", "percentual"],
    valor_taxa: ["valor_taxa", "fee_amount", "desconto", "stone_fee"],
    valor_liquido: ["valor_liquido", "net_amount", "liquido", "liquid_amount"],
  },
  getnet: {
    data_venda: ["data_venda", "data_transacao", "dt_venda", "data"],
    data_prevista: ["data_prevista", "previsao", "data_credito"],
    data_recebimento: ["data_recebimento", "data_pagamento"],
    nsu: ["nsu", "terminal_nsu", "codigo_transacao"],
    autorizacao: ["autorizacao", "authorization_code"],
    bandeira: ["bandeira", "marca", "card_brand"],
    tipo: ["tipo", "payment_type", "modalidade"],
    parcelas: ["parcelas", "installments"],
    parcela_atual: ["parcela", "installment_number"],
    valor_bruto: ["valor_bruto", "gross_amount", "valor_total"],
    taxa_mdr: ["taxa", "mdr", "fee_rate"],
    valor_taxa: ["valor_taxa", "fee_amount", "desconto"],
    valor_liquido: ["valor_liquido", "net_amount", "liquido"],
  },
  pagseguro: {
    data_venda: ["data_venda", "data_transacao", "date", "data"],
    data_prevista: ["data_prevista", "data_liberacao", "expected_release"],
    data_recebimento: ["data_recebimento", "data_liberada", "escrow_end"],
    nsu: ["nsu", "transaction_id", "codigo", "id_transacao"],
    autorizacao: ["autorizacao", "auth_code"],
    bandeira: ["bandeira", "brand", "marca"],
    tipo: ["tipo", "payment_method", "metodo"],
    parcelas: ["parcelas", "installment_count"],
    parcela_atual: ["parcela", "installment"],
    valor_bruto: ["valor_bruto", "gross_amount", "valor"],
    taxa_mdr: ["taxa", "fee_percent", "taxa_pagseguro"],
    valor_taxa: ["valor_taxa", "fee_amount", "tarifa"],
    valor_liquido: ["valor_liquido", "net_amount", "liquido"],
  },
  safrapay: {
    data_venda: ["data_venda", "data_transacao", "data"],
    data_prevista: ["data_prevista", "previsao"],
    data_recebimento: ["data_recebimento", "data_liquidacao"],
    nsu: ["nsu", "transaction_id", "codigo_transacao"],
    autorizacao: ["autorizacao", "auth_code"],
    bandeira: ["bandeira", "marca", "card_brand"],
    tipo: ["tipo", "payment_type", "modalidade"],
    parcelas: ["parcelas", "installments"],
    parcela_atual: ["parcela", "installment"],
    valor_bruto: ["valor_bruto", "amount", "valor"],
    taxa_mdr: ["taxa", "mdr", "fee_rate"],
    valor_taxa: ["valor_taxa", "fee_amount", "desconto"],
    valor_liquido: ["valor_liquido", "net_amount", "liquido"],
  },
};

/**
 * Detecta a adquirente baseado nos headers do arquivo.
 */
export function detectAdquirente(headers: string[]): { adquirente: string; confidence: number } {
  const normalized = headers.map((h) => normalizeHeader(h));
  let bestMatch = { adquirente: "outras", confidence: 0 };

  for (const [adquirente, mapping] of Object.entries(LAYOUTS)) {
    let matches = 0;
    let total = 0;

    for (const [, aliases] of Object.entries(mapping)) {
      total++;
      for (const alias of aliases) {
        if (normalized.some((h) => h.includes(alias) || alias.includes(h))) {
          matches++;
          break;
        }
      }
    }

    const confidence = matches / total;
    if (confidence > bestMatch.confidence) {
      bestMatch = { adquirente, confidence };
    }
  }

  return bestMatch;
}

/**
 * Parser principal para CSV/Excel exportado.
 * Auto-detecta separador, encoding e layout.
 */
export function parseExtratoAvancado(
  fileContent: string,
  adquirenteOverride?: string
): ParseResult {
  const lines = fileContent.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  const errors: Array<{ line: number; message: string }> = [];

  if (lines.length < 2) {
    return { rows: [], errors: [{ line: 0, message: "Arquivo vazio ou com menos de 2 linhas" }], detectedAdquirente: null, detectedLayout: "unknown" };
  }

  // Detectar separador
  const sep = detectSeparator(lines[0]);

  // Parsear headers
  const rawHeaders = lines[0].split(sep).map((h) => h.trim().replace(/^["']|["']$/g, ""));
  const normalizedHeaders = rawHeaders.map(normalizeHeader);

  // Detectar adquirente
  const detected = detectAdquirente(normalizedHeaders);
  const adquirente = adquirenteOverride || (detected.confidence > 0.3 ? detected.adquirente : "outras");

  // Obter mapeamento
  const mapping = LAYOUTS[adquirente] || LAYOUTS.cielo;

  // Mapear colunas
  const colMap = mapColumns(normalizedHeaders, mapping);

  // Parsear linhas
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const cols = line.split(sep).map((c) => c.trim().replace(/^["']|["']$/g, ""));

    try {
      const row = mapRow(cols, colMap, normalizedHeaders);
      if (row.data_venda && row.valor_bruto > 0) {
        rows.push(row);
      }
    } catch (e: any) {
      errors.push({ line: i + 1, message: e.message || "Erro de parsing" });
    }
  }

  return {
    rows,
    errors,
    detectedAdquirente: detected.adquirente,
    detectedLayout: adquirente,
  };
}

function detectSeparator(firstLine: string): string {
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;

  if (semicolons >= commas && semicolons >= tabs) return ";";
  if (tabs >= commas) return "\t";
  return ",";
}

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function mapColumns(
  headers: string[],
  mapping: ColumnMapping
): Record<string, number | null> {
  const result: Record<string, number | null> = {};

  for (const [field, aliases] of Object.entries(mapping)) {
    let colIndex: number | null = null;

    for (const alias of aliases) {
      const idx = headers.findIndex((h) => h === alias || h.includes(alias) || alias.includes(h));
      if (idx >= 0) {
        colIndex = idx;
        break;
      }
    }

    result[field] = colIndex;
  }

  return result;
}

function mapRow(
  cols: string[],
  colMap: Record<string, number | null>,
  _headers: string[]
): ParsedRow {
  const get = (field: string): string => {
    const idx = colMap[field];
    if (idx === null || idx === undefined) return "";
    return cols[idx] || "";
  };

  return {
    data_venda: parseDate(get("data_venda")),
    data_prevista_recebimento: parseDate(get("data_prevista")),
    data_recebimento: parseDate(get("data_recebimento")),
    nsu: get("nsu") || null,
    autorizacao: get("autorizacao") || null,
    bandeira: get("bandeira").toLowerCase() || null,
    tipo_transacao: detectTipo(get("tipo")),
    parcelas: parseInt(get("parcelas") || "1", 10) || 1,
    parcela_atual: parseInt(get("parcela_atual") || "1", 10) || 1,
    valor_bruto: parseNumber(get("valor_bruto")),
    taxa_mdr: parseNumber(get("taxa_mdr")) / 100,
    valor_taxa: parseNumber(get("valor_taxa")),
    valor_liquido: parseNumber(get("valor_liquido")),
  };
}

function parseDate(v: string): string | null {
  if (!v) return null;
  // DD/MM/YYYY
  const m1 = v.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
  if (m1) return `${m1[3]}-${m1[2]}-${m1[1]}`;
  // YYYY-MM-DD
  const m2 = v.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
  // MM/DD/YYYY (raro no Brasil)
  return null;
}

function parseNumber(v: string): number {
  if (!v) return 0;
  return parseFloat(v.replace(/\./g, "").replace(",", ".").replace(/[^\d.\-]/g, "")) || 0;
}

function detectTipo(v: string): string {
  const s = v.toLowerCase();
  if (s.includes("parc")) return "credito_parcelado";
  if (s.includes("deb")) return "debito";
  if (s.includes("pix")) return "pix";
  if (s.includes("voucher") || s.includes("vale")) return "voucher";
  return "credito_a_vista";
}