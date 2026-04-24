/**
 * Parser de arquivos OFX (Open Financial Exchange)
 * Usado para importar extratos bancários que contêm
 * recebimentos de cartão de crédito.
 */

export interface OFXTransaction {
  TRNTYPE: string;
  DTPOSTED: string;
  TRNAMT: string;
  FITID: string;
  NAME: string;
  MEMO?: string;
  REFNUM?: string;
}

export interface OFXStatement {
  BANKID: string;
  ACCTID: string;
  ACCTTYPE: string;
  transactions: OFXTransaction[];
  balance?: {
    BALAMT: string;
    DTASOF: string;
  };
}

export interface OFXParsedResult {
  statements: OFXStatement[];
  signonDate: string;
  institution: string;
}

/**
 * Converte data OFX (formato: YYYYMMDDHHMMSS ou YYYYMMDD) para ISO
 */
function parseOFXDate(raw: string): string | null {
  const cleaned = raw.replace(/\[.*?\]/g, "").replace(/[:\-]/g, "");
  const m = cleaned.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

/**
 * Extrai valor de uma tag SGML OFX.
 * Formato: <TAG>valor
 */
function getTagValue(block: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}>([^<\\r\\n]+)`, "i");
  const match = block.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Extrai todas as ocorrências de uma tag SGML OFX.
 */
function getTagValues(block: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}>([^<\\r\\n]+)`, "gi");
  const results: string[] = [];
  let match;
  while ((match = regex.exec(block)) !== null) {
    results.push(match[1].trim());
  }
  return results;
}

/**
 * Extrai blocos entre tags de abertura e fechamento SGML.
 */
function extractBlocks(text: string, openTag: string): string[] {
  const blocks: string[] = [];
  const closeTag = openTag.replace(/</, "</");
  const regex = new RegExp(`${openTag}([\\s\\S]*?)${closeTag}`, "gi");
  let match;
  while ((match = regex.exec(text)) !== null) {
    blocks.push(match[1]);
  }
  return blocks;
}

/**
 * Parse principal de arquivo OFX.
 * Suporta formatos SGML (OFX v1) e XML (OFX v2).
 */
export function parseOFX(ofxText: string): OFXParsedResult {
  const text = ofxText.replace(/\r/g, "").trim();

  // Detectar formato XML vs SGML
  if (text.includes("<?xml") || text.includes("<OFX>")) {
    return parseOFXXml(text);
  }
  return parseOFXSgml(text);
}

/**
 * Parser para OFX v1 (SGML)
 */
function parseOFXSgml(text: string): OFXParsedResult {
  const signonDate = getTagValue(text, "DTSERVER") || "";
  const institution = getTagValue(text, "ORG") || "";

  const stmtBlocks = extractBlocks(text, "<STMTRS>");
  const statements: OFXStatement[] = stmtBlocks.map((block) => {
    const bankId = getTagValue(block, "BANKID") || "";
    const acctId = getTagValue(block, "ACCTID") || "";
    const acctType = getTagValue(block, "ACCTTYPE") || "";

    const trnBlocks = extractBlocks(block, "<STMTTRN>");
    const transactions: OFXTransaction[] = trnBlocks.map((trn) => ({
      TRNTYPE: getTagValue(trn, "TRNTYPE") || "",
      DTPOSTED: getTagValue(trn, "DTPOSTED") || "",
      TRNAMT: getTagValue(trn, "TRNAMT") || "0",
      FITID: getTagValue(trn, "FITID") || "",
      NAME: getTagValue(trn, "NAME") || "",
      MEMO: getTagValue(trn, "MEMO") || undefined,
      REFNUM: getTagValue(trn, "REFNUM") || undefined,
    }));

    const balAmt = getTagValue(block, "BALAMT");
    const balDate = getTagValue(block, "DTASOF");

    return {
      BANKID: bankId,
      ACCTID: acctId,
      ACCTTYPE: acctType,
      transactions,
      balance: balAmt ? { BALAMT: balAmt, DTASOF: balDate || "" } : undefined,
    };
  });

  return { statements, signonDate, institution };
}

/**
 * Parser para OFX v2 (XML)
 */
function parseOFXXml(text: string): OFXParsedResult {
  // Strip XML declaration
  const stripped = text.replace(/<\?xml[^?]*\?>/g, "").trim();

  const signonDate = getTagValue(stripped, "DTSERVER") || "";
  const institution = getTagValue(stripped, "ORG") || "";

  const stmtBlocks = extractBlocks(stripped, "<STMTRS>");
  const statements: OFXStatement[] = stmtBlocks.map((block) => {
    const bankId = getTagValue(block, "BANKID") || "";
    const acctId = getTagValue(block, "ACCTID") || "";
    const acctType = getTagValue(block, "ACCTTYPE") || "";

    const trnBlocks = extractBlocks(block, "<STMTTRN>");
    const transactions: OFXTransaction[] = trnBlocks.map((trn) => ({
      TRNTYPE: getTagValue(trn, "TRNTYPE") || "",
      DTPOSTED: getTagValue(trn, "DTPOSTED") || "",
      TRNAMT: getTagValue(trn, "TRNAMT") || "0",
      FITID: getTagValue(trn, "FITID") || "",
      NAME: getTagValue(trn, "NAME") || "",
      MEMO: getTagValue(trn, "MEMO") || undefined,
      REFNUM: getTagValue(trn, "REFNUM") || undefined,
    }));

    const balAmt = getTagValue(block, "BALAMT");
    const balDate = getTagValue(block, "DTASOF");

    return {
      BANKID: bankId,
      ACCTID: acctId,
      ACCTTYPE: acctType,
      transactions,
      balance: balAmt ? { BALAMT: balAmt, DTASOF: balDate || "" } : undefined,
    };
  });

  return { statements, signonDate, institution };
}

/**
 * Converte transações OFX para o formato canônico do Card Audit.
 * Mapeia recebimentos de cartão (créditos) com detecção de NSU.
 */
export function ofxToCardTransactions(
  ofx: OFXParsedResult,
  adquirente: string
): Array<{
  data_venda: string | null;
  data_prevista_recebimento: string | null;
  nsu: string | null;
  valor_bruto: number;
  valor_liquido: number;
  valor_taxa: number;
  taxa_mdr: number;
  bandeira: string | null;
  tipo_transacao: string;
  observacoes: string | null;
}> {
  const results: Array<{
    data_venda: string | null;
    data_prevista_recebimento: string | null;
    nsu: string | null;
    valor_bruto: number;
    valor_liquido: number;
    valor_taxa: number;
    taxa_mdr: number;
    bandeira: string | null;
    tipo_transacao: string;
    observacoes: string | null;
  }> = [];

  for (const stmt of ofx.statements) {
    for (const trn of stmt.transactions) {
      // Apenas recebimentos (créditos)
      const valor = parseFloat(trn.TRNAMT);
      if (isNaN(valor) || valor <= 0) continue;

      // Tentar detectar NSU no memo ou referência
      const nsu = trn.REFNUM || extractNSU(trn.MEMO || trn.NAME) || trn.FITID;

      // Detectar bandeira pelo memo
      const bandeira = detectBandeira(trn.MEMO || trn.NAME);

      // Para OFX, o valor líquido é o que caiu na conta
      // O valor bruto precisa ser inferido (sem MDR no extrato bancário)
      const valorLiquido = round2(valor);
      const valorTaxa = 0; // OFX bancário não tem MDR explícito
      const valorBruto = valorLiquido; // Será ajustado na auditoria

      results.push({
        data_venda: parseOFXDate(trn.DTPOSTED),
        data_prevista_recebimento: null,
        nsu: nsu || null,
        valor_bruto: valorBruto,
        valor_liquido: valorLiquido,
        valor_taxa: valorTaxa,
        taxa_mdr: 0,
        bandeira,
        tipo_transacao: detectTipoOFX(trn.MEMO || trn.NAME),
        observacoes: trn.MEMO || trn.NAME || null,
      });
    }
  }

  return results;
}

function extractNSU(text: string): string | null {
  const m = text.match(/NSU[:\s]*(\d{6,20})/i);
  if (m) return m[1];
  const m2 = text.match(/(\d{10,20})/);
  return m2 ? m2[1] : null;
}

function detectBandeira(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes("visa")) return "visa";
  if (lower.includes("master")) return "mastercard";
  if (lower.includes("elo")) return "elo";
  if (lower.includes("amex") || lower.includes("american")) return "amex";
  if (lower.includes("hipercard")) return "hipercard";
  if (lower.includes("diners")) return "diners";
  return null;
}

function detectTipoOFX(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("parcelad") || lower.includes("parc")) return "credito_parcelado";
  if (lower.includes("debito") || lower.includes("débito") || lower.includes("deb")) return "debito";
  return "credito_a_vista";
}

function round2(v: number) {
  return Math.round(v * 100) / 100;
}