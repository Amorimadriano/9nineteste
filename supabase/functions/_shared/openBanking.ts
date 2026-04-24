/**
 * Utilitários compartilhados para Open Banking
 */

// URLs das APIs Open Banking (produção)
export const OPEN_BANKING_URLS: Record<string, string> = {
  // Banco do Brasil
  "001": "https://api.bb.com.br/open-banking",
  // Bradesco
  "237": "https://api.bradesco.com/open-banking",
  // Itaú
  "341": "https://api.itau.com.br/open-banking",
  // Santander
  "033": "https://openbanking.santander.com.br",
  // Caixa
  "104": "https://openbanking.caixa.gov.br",
  // Nubank (exemplo)
  "260": "https://api.nubank.com.br/open-banking",
  // Inter
  "077": "https://api.inter.co/open-banking",
  // Sicoob
  "756": "https://api.sicoob.com.br/open-banking",
};

// URLs de sandbox para testes
export const OPEN_BANKING_SANDBOX_URLS: Record<string, string> = {
  "001": "https://api.sandbox.bb.com.br/open-banking",
  "237": "https://api-sandbox.bradesco.com/open-banking",
  "341": "https://api.itau.com.br/sandbox/open-banking",
  "033": "https://openbanking-sandbox.santander.com.br",
  "104": "https://openbanking-sandbox.caixa.gov.br",
  "260": "https://api-sandbox.nubank.com.br/open-banking",
  "077": "https://api-sandbox.inter.co/open-banking",
  "756": "https://api-sandbox.sicoob.com.br/open-banking",
};

// Rate limits por banco (requisições por minuto)
export const RATE_LIMITS: Record<string, number> = {
  "001": 60, // BB: 60 req/min
  "237": 60, // Bradesco: 60 req/min
  "341": 100, // Itaú: 100 req/min
  "033": 60, // Santander: 60 req/min
  "104": 60, // Caixa: 60 req/min
  "260": 120, // Nubank: 120 req/min
  "077": 100, // Inter: 100 req/min
  "756": 60, // Sicoob: 60 req/min
};

/**
 * Obtém a URL base da API Open Banking para um banco
 */
export function getOpenBankingUrl(bancoCodigo: string, sandbox = false): string {
  const urls = sandbox ? OPEN_BANKING_SANDBOX_URLS : OPEN_BANKING_URLS;
  return urls[bancoCodigo] || "";
}

/**
 * Simula chamada à API do banco (para desenvolvimento)
 * Em produção, substituir por chamadas reais
 */
export async function fetchBankTransactions(
  bancoCodigo: string,
  accessToken: string,
  dataInicio: string,
  dataFim: string,
  sandbox = false
): Promise<Array<{
  transacao_id: string;
  data: string;
  valor: number;
  tipo: "CREDIT" | "DEBIT";
  descricao: string;
  informacao_complementar?: string;
}>> {
  // TODO: Implementar chamada real à API do banco
  // Por enquanto, simula transações para testes

  if (sandbox) {
    // Gerar transações simuladas
    const transacoes = [];
    const numTransacoes = Math.floor(Math.random() * 10) + 5;

    for (let i = 0; i < numTransacoes; i++) {
      const data = new Date(dataInicio);
      data.setDate(data.getDate() + Math.floor(Math.random() * 30));

      transacoes.push({
        transacao_id: `TXN-${Date.now()}-${i}`,
        data: data.toISOString().split("T")[0],
        valor: Math.round((Math.random() * 1000 + 50) * 100) / 100,
        tipo: (Math.random() > 0.5 ? "CREDIT" : "DEBIT") as "CREDIT" | "DEBIT",
        descricao: `Transação simulada ${i + 1}`,
        informacao_complementar: `Complemento ${i + 1}`,
      });
    }

    // Simular delay de rede
    await new Promise((resolve) => setTimeout(resolve, 500));

    return transacoes;
  }

  // Em produção, fazer chamada real à API
  const baseUrl = getOpenBankingUrl(bancoCodigo, false);
  if (!baseUrl) {
    throw new Error(`Banco ${bancoCodigo} não suportado`);
  }

  // TODO: Implementar chamada real à API Open Banking
  throw new Error("Integração real com banco não implementada");
}

/**
 * Verifica rate limit antes de fazer requisição
 */
export async function checkRateLimit(
  bancoCodigo: string,
  kv: any
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const limit = RATE_LIMITS[bancoCodigo] || 60;
  const key = `rate_limit:${bancoCodigo}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minuto

  // Buscar contador atual
  const current = (await kv.get(key)) || { count: 0, windowStart: now };

  // Resetar se janela expirou
  if (now - current.windowStart > windowMs) {
    current.count = 0;
    current.windowStart = now;
  }

  // Verificar se pode prosseguir
  if (current.count >= limit) {
    const retryAfter = Math.ceil((current.windowStart + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Incrementar contador
  current.count++;
  await kv.set(key, current, { ttl: 60 });

  return { allowed: true };
}

/**
 * Valida se a resposta da API contém dados válidos
 */
export function validateTransactionData(
  data: any
): { valid: boolean; error?: string } {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Resposta inválida da API" };
  }

  if (!data.transacao_id || typeof data.transacao_id !== "string") {
    return { valid: false, error: "transacao_id ausente ou inválido" };
  }

  if (!data.data || typeof data.data !== "string") {
    return { valid: false, error: "data ausente ou inválida" };
  }

  if (typeof data.valor !== "number" || data.valor < 0) {
    return { valid: false, error: "valor ausente ou inválido" };
  }

  if (!data.tipo || !["CREDIT", "DEBIT"].includes(data.tipo)) {
    return { valid: false, error: "tipo ausente ou inválido" };
  }

  return { valid: true };
}

/**
 * Formata valor monetário para o padrão brasileiro
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Calcula hash único para uma transação
 */
export function generateTransactionHash(
  transacaoId: string,
  data: string,
  valor: number
): string {
  const str = `${transacaoId}|${data}|${valor.toFixed(2)}`;
  return btoa(str).replace(/[^a-zA-Z0-9]/g, "").substring(0, 32);
}
