/**
 * Cliente HTTP para APIs de Open Banking
 * Task #23 - Agente Financeiro & DevOps
 */

import {
  obterApiUrl,
  OPEN_BANKING_CONFIG,
  RATE_LIMITS,
  ERROS_OPEN_BANKING,
  type BancoCodigo,
} from './config';
import {
  refreshAccessToken,
  calcularExpiracao,
  isTokenExpirado,
  type IntegracaoOpenBanking,
} from './auth';

// Interfaces de dados do Open Banking
export interface ContaOpenBanking {
  accountId: string;
  currency: string;
  accountType: string;
  nickname?: string;
  status: 'Active' | 'Inactive' | 'Closed';
  openingDate: string;
}

export interface SaldoOpenBanking {
  accountId: string;
  amount: number;
  currency: string;
  type: ' disponível' | 'bloqueado' | 'total';
  timestamp: string;
}

export interface TransacaoOpenBanking {
  transactionId: string;
  accountId: string;
  transactionType: 'CREDIT' | 'DEBIT';
  creditDebitIndicator: 'CREDIT' | 'DEBIT';
  status: 'BOOKED' | 'PENDING' | 'CANCELLED';
  bookingDate: string;
  valueDate?: string;
  amount: number;
  currency: string;
  transactionInformation?: string;
  remittanceInformation?: string;
  creditorName?: string;
  debtorName?: string;
}

export interface ExtratoOpenBanking {
  accountId: string;
  startDate: string;
  endDate: string;
  transactions: TransacaoOpenBanking[];
  totalTransactions: number;
}

export interface FaturaCartaoOpenBanking {
  invoiceId: string;
  accountId: string;
  dueDate: string;
  currency: string;
  totalAmount: number;
  minimumPayment: number;
  status: 'OPEN' | 'CLOSED' | 'OVERDUE';
  transactions: TransacaoOpenBanking[];
}

export interface ApiError {
  code: string;
  message: string;
  details?: string;
  statusCode: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  success: boolean;
}

// Rate limiter simples
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  canMakeRequest(bancoCodigo: string, tipo: 'default' | 'extrato' = 'default'): boolean {
    const key = `${bancoCodigo}:${tipo}`;
    const limit = RATE_LIMITS[bancoCodigo as BancoCodigo]?.[tipo] || 60;
    const now = Date.now();
    const windowMs = 60000; // 1 minuto

    let requests = this.requests.get(key) || [];
    requests = requests.filter(ts => now - ts < windowMs);

    if (requests.length >= limit) {
      return false;
    }

    requests.push(now);
    this.requests.set(key, requests);
    return true;
  }

  getTimeUntilReset(bancoCodigo: string, tipo: 'default' | 'extrato' = 'default'): number {
    const key = `${bancoCodigo}:${tipo}`;
    const requests = this.requests.get(key) || [];
    if (requests.length === 0) return 0;

    const oldestRequest = Math.min(...requests);
    return Math.max(0, 60000 - (Date.now() - oldestRequest));
  }
}

const rateLimiter = new RateLimiter();

/**
 * Classe cliente para APIs de Open Banking
 */
export class OpenBankingClient {
  private integracao: IntegracaoOpenBanking;
  private bancoCodigo: BancoCodigo;

  constructor(integracao: IntegracaoOpenBanking) {
    this.integracao = integracao;
    this.bancoCodigo = integracao.bancoCodigo;
  }

  /**
   * Verifica e renova o token se necessário
   */
  private async ensureValidToken(): Promise<string> {
    if (isTokenExpirado(this.integracao)) {
      try {
        const newToken = await refreshAccessToken(this.integracao);
        this.integracao.accessToken = newToken.access_token;
        this.integracao.expiresAt = calcularExpiracao(newToken.expires_in);
        this.integracao.refreshToken = newToken.refresh_token || this.integracao.refreshToken;

        // Aqui você deve persistir a integração atualizada no banco
        console.log('Token renovado automaticamente');
      } catch (error) {
        throw new Error(`Falha ao renovar token: ${(error as Error).message}`);
      }
    }
    return this.integracao.accessToken;
  }

  /**
   * Faz uma requisição HTTP com retry e tratamento de erros
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    // Verificar rate limit
    const tipo = endpoint.includes('transactions') ? 'extrato' : 'default';
    if (!rateLimiter.canMakeRequest(this.bancoCodigo, tipo)) {
      const waitTime = rateLimiter.getTimeUntilReset(this.bancoCodigo, tipo);
      return {
        data: null,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Limite de requisições excedido. Aguarde ${Math.ceil(waitTime / 1000)} segundos.`,
          statusCode: 429,
        },
        success: false,
      };
    }

    const token = await this.ensureValidToken();
    const baseUrl = obterApiUrl(this.bancoCodigo);
    const url = `${baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Request-Id': crypto.randomUUID(),
      ...((options.headers as Record<string, string>) || {}),
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        OPEN_BANKING_CONFIG.timeoutMs
      );

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Tratamento de erros HTTP
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: ApiError = {
          code: errorData.code || `HTTP_${response.status}`,
          message: errorData.message || (ERROS_OPEN_BANKING as any)[response.status] || `Erro HTTP ${response.status}`,
          details: errorData.details,
          statusCode: response.status,
        };

        // Retry em caso de erros transitórios
        if (this.shouldRetry(response.status) && retryCount < OPEN_BANKING_CONFIG.maxRetries) {
          await this.delay(this.getRetryDelay(retryCount));
          return this.request(endpoint, options, retryCount + 1);
        }

        return { data: null, error, success: false };
      }

      const data = await response.json();
      return { data, error: null, success: true };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            data: null,
            error: {
              code: 'TIMEOUT',
              message: 'A requisição excedeu o tempo limite',
              statusCode: 408,
            },
            success: false,
          };
        }

        // Retry em caso de erros de rede
        if (retryCount < OPEN_BANKING_CONFIG.maxRetries) {
          await this.delay(this.getRetryDelay(retryCount));
          return this.request(endpoint, options, retryCount + 1);
        }

        return {
          data: null,
          error: {
            code: 'NETWORK_ERROR',
            message: error.message,
            statusCode: 0,
          },
          success: false,
        };
      }

      throw error;
    }
  }

  /**
   * Determina se deve fazer retry baseado no status HTTP
   */
  private shouldRetry(status: number): boolean {
    return status === 429 || status >= 500 || status === 408;
  }

  /**
   * Calcula o delay para retry com exponential backoff
   */
  private getRetryDelay(retryCount: number): number {
    const baseDelay = OPEN_BANKING_CONFIG.retryDelayMs;
    const exponentialDelay = baseDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 1000; // Jitter de até 1 segundo
    return Math.min(exponentialDelay + jitter, 30000); // Máximo 30 segundos
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============= MÉTODOS DA API =============

  /**
   * Obtém dados das contas do usuário
   */
  async obterDadosConta(): Promise<ApiResponse<ContaOpenBanking[]>> {
    return this.request<ContaOpenBanking[]>('/accounts');
  }

  /**
   * Obtém saldo de uma conta específica
   */
  async obterSaldo(accountId: string): Promise<ApiResponse<SaldoOpenBanking>> {
    return this.request<SaldoOpenBanking>(`/accounts/${accountId}/balances`);
  }

  /**
   * Obtém extrato de uma conta no período especificado
   */
  async obterExtrato(
    accountId: string,
    dataInicio: Date,
    dataFim: Date
  ): Promise<ApiResponse<ExtratoOpenBanking>> {
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    const params = new URLSearchParams({
      fromBookingDateTime: formatDate(dataInicio),
      toBookingDateTime: formatDate(dataFim),
    });

    return this.request<ExtratoOpenBanking>(
      `/accounts/${accountId}/transactions?${params.toString()}`
    );
  }

  /**
   * Obtém uma fatura de cartão específica
   */
  async obterFaturaCartao(faturaId: string): Promise<ApiResponse<FaturaCartaoOpenBanking>> {
    return this.request<FaturaCartaoOpenBanking>(`/credit-cards/invoices/${faturaId}`);
  }

  /**
   * Lista faturas de cartão de uma conta
   */
  async listarFaturasCartao(
    accountId: string,
    status?: 'OPEN' | 'CLOSED' | 'OVERDUE'
  ): Promise<ApiResponse<FaturaCartaoOpenBanking[]>> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);

    const queryString = params.toString();
    const endpoint = queryString
      ? `/credit-cards/accounts/${accountId}/invoices?${queryString}`
      : `/credit-cards/accounts/${accountId}/invoices`;

    return this.request<FaturaCartaoOpenBanking[]>(endpoint);
  }

  /**
   * Obtém detalhes de uma transação específica
   */
  async obterDetalhesTransacao(
    accountId: string,
    transactionId: string
  ): Promise<ApiResponse<TransacaoOpenBanking>> {
    return this.request<TransacaoOpenBanking>(
      `/accounts/${accountId}/transactions/${transactionId}`
    );
  }

  /**
   * Obtém informações da integração atual
   */
  getIntegracaoInfo(): Pick<
    IntegracaoOpenBanking,
    'id' | 'bancoCodigo' | 'status' | 'expiresAt'
  > {
    return {
      id: this.integracao.id,
      bancoCodigo: this.integracao.bancoCodigo,
      status: this.integracao.status,
      expiresAt: this.integracao.expiresAt,
    };
  }
}

/**
 * Factory para criar clientes Open Banking
 */
export function criarOpenBankingClient(
  integracao: IntegracaoOpenBanking
): OpenBankingClient {
  return new OpenBankingClient(integracao);
}

/**
 * Valida se a integração está ativa
 */
export function isIntegracaoAtiva(integracao: IntegracaoOpenBanking): boolean {
  return integracao.status === 'ativo' && !isTokenExpirado(integracao);
}
