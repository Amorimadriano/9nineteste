export interface OFXTransaction {
  fitid: string;
  date: string; // YYYY-MM-DD
  amount: number;
  description: string;
  type: "entrada" | "saida";
}

function parseOFXDate(raw: string): string {
  // OFX dates: YYYYMMDDHHMMSS[offset:TZ] or YYYYMMDD
  // Remove timezone bracket info e.g. [-3:BRT] or [-03:EST]
  const cleaned = raw.replace(/\[.*?\]/g, "").trim();

  // Extract only the date portion (first 8 digits)
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 8) return "";

  const y = parseInt(digits.substring(0, 4), 10);
  const m = parseInt(digits.substring(4, 6), 10);
  const d = parseInt(digits.substring(6, 8), 10);

  // Validate ranges
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return "";

  // Use UTC to avoid timezone shifts
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return "";

  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

function getTagValue(block: string, tag: string): string {
  // OFX uses <TAG>value without closing tags (SGML style)
  const regex = new RegExp(`<${tag}>([^<\\r\\n]+)`, "i");
  const match = block.match(regex);
  return match ? match[1].trim() : "";
}

export function parseOFX(content: string): OFXTransaction[] {
  const transactions: OFXTransaction[] = [];

  // Split by <STMTTRN> blocks
  const parts = content.split(/<STMTTRN>/i);
  parts.shift(); // remove header

  for (const part of parts) {
    const block = part.split(/<\/STMTTRN>/i)[0] || part;

    const fitid = getTagValue(block, "FITID");
    const dtPosted = getTagValue(block, "DTPOSTED");
    const trnAmt = getTagValue(block, "TRNAMT");
    const name = getTagValue(block, "NAME") || getTagValue(block, "MEMO") || "Sem descrição";

    if (!dtPosted || !trnAmt) continue;

    // Handle both formats:
    // - Brazilian: 1.234,56 -> remove dots, replace comma with dot
    // - American: 150.50 -> keep as is
    let normalizedValue: string;
    if (trnAmt.includes(",")) {
      // Brazilian format: remove thousand separators (.) and convert decimal (,)
      normalizedValue = trnAmt.replace(/\./g, "").replace(",", ".");
    } else {
      // American format: keep as is
      normalizedValue = trnAmt;
    }
    const amount = parseFloat(normalizedValue);

    transactions.push({
      fitid: fitid || `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: parseOFXDate(dtPosted),
      amount: Math.abs(amount),
      description: name,
      type: amount >= 0 ? "entrada" : "saida",
    });
  }

  return transactions;
}
