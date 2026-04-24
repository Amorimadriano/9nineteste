// CNAB 240 Utility functions

export function padRight(str: string, len: number, char = " "): string {
  return (str || "").substring(0, len).padEnd(len, char);
}

export function padLeft(str: string, len: number, char = "0"): string {
  return (str || "").substring(0, len).padStart(len, char);
}

export function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear().toString();
  return `${d}${m}${y}`;
}

export function formatHora(date: Date): string {
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  const s = date.getSeconds().toString().padStart(2, "0");
  return `${h}${m}${s}`;
}

export function parseDate(str: string): Date {
  if (!str || str.trim().length < 8) return new Date();
  const d = parseInt(str.substring(0, 2));
  const m = parseInt(str.substring(2, 4)) - 1;
  const y = parseInt(str.substring(4, 8));
  return new Date(y, m, d);
}

export function formatValue(value: number, decimals = 2): string {
  return Math.round(value * Math.pow(10, decimals)).toString();
}

export function parseValue(str: string, decimals = 2): number {
  return parseInt(str || "0") / Math.pow(10, decimals);
}

export function onlyNumbers(str: string): string {
  return (str || "").replace(/\D/g, "");
}

/**
 * Extrai conta e dígito verificador de uma string no formato "12345-0" ou "123450"
 * Retorna { conta: "12345", dv: "0" }
 * Se digitoConta for informado explicitamente, usa ele; remove DV do final da conta se corresponder
 */
export function extrairContaEDV(contaStr: string, digitoConta?: string): { conta: string; dv: string } {
  const limpo = onlyNumbers(contaStr || "");

  // Se digitoConta foi informado explicitamente
  if (digitoConta && digitoConta.trim()) {
    const dvLimpo = onlyNumbers(digitoConta);
    // Remove o DV do final da conta APENAS se ele corresponder ao DV informado
    if (limpo.length > dvLimpo.length && limpo.endsWith(dvLimpo)) {
      return { conta: limpo.slice(0, -dvLimpo.length), dv: dvLimpo };
    }
    return { conta: limpo, dv: dvLimpo };
  }

  // Tenta extrair DV do final (assume que o último dígito é o DV)
  if (limpo.length > 1) {
    return { conta: limpo.slice(0, -1), dv: limpo.slice(-1) };
  }

  return { conta: limpo, dv: "" };
}

export function generateSequencialLote(): string {
  return "0001";
}
