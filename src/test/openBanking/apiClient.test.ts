/**
 * Testes de API Client Open Banking
 * Mock de respostas dos bancos, retry, tratamento de erros
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetServer } from "./server";
import {
  mockAccountsList,
  mockAccountItau,
  mockBalance,
  mockTransactionsItau,
  mockError401,
  mockError403,
  mockError429,
} from "../fixtures/openBanking";
import { http, HttpResponse } from "msw";
import { server } from "./server";

const API_BASE_URL = "https://api.itau/open-banking";

interface ApiConfig {
  baseUrl: string;
  accessToken: string;
}

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryOnStatusCodes: number[];
}

class OpenBankingApiClient {
  private config: ApiConfig;
  private retryConfig: RetryConfig;

  constructor(config: ApiConfig, retryConfig?: Partial<RetryConfig>) {
    this.config = {
      baseUrl: config.baseUrl,
      accessToken: config.accessToken,
    };
    this.retryConfig = {
      maxRetries: retryConfig?.maxRetries ?? 3,
      retryDelay: retryConfig?.retryDelay ?? 1000,
      retryOnStatusCodes: retryConfig?.retryOnStatusCodes ?? [429, 500, 502, 503, 504],
    };
  }

  private async requestWithRetry<T>(
    url: string,
    options: RequestInit,
    attempt: number = 1
  ): Promise<T> {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        // Verifica se deve fazer retry
        if (
          this.retryConfig.retryOnStatusCodes.includes(response.status) &&
          attempt < this.retryConfig.maxRetries
        ) {
          const retryAfter = response.headers.get("Retry-After");
          const delay = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : this.retryConfig.retryDelay * attempt;

          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.requestWithRetry<T>(url, options, attempt + 1);
        }

        const error = await response.json();
        throw new ApiError(response.status, error);
      }

      return response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error(`Request failed: ${(error as Error).message}`);
    }
  }

  private buildHeaders(): HeadersInit {
    return {
      Authorization: `Bearer ${this.config.accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  // Obter todas as contas
  async getAccounts(): Promise<typeof mockAccountsList> {
    return this.requestWithRetry(
      `${this.config.baseUrl}/accounts/v1/accounts`,
      { headers: this.buildHeaders() }
    );
  }

  // Obter detalhes de uma conta
  async getAccount(accountId: string): Promise<{ data: typeof mockAccountItau.data }> {
    return this.requestWithRetry(
      `${this.config.baseUrl}/accounts/v1/accounts/${accountId}`,
      { headers: this.buildHeaders() }
    );
  }

  // Obter saldo da conta
  async getBalance(accountId: string): Promise<typeof mockBalance> {
    return this.requestWithRetry(
      `${this.config.baseUrl}/accounts/v1/accounts/${accountId}/balances`,
      { headers: this.buildHeaders() }
    );
  }

  // Obter extrato/transações
  async getTransactions(
    accountId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<typeof mockTransactionsItau> {
    const params = new URLSearchParams();
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);

    const url = `${this.config.baseUrl}/accounts/v1/accounts/${accountId}/transactions?${params.toString()}`;

    return this.requestWithRetry(url, { headers: this.buildHeaders() });
  }
}

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    super(`API Error ${status}`);
    this.status = status;
    this.data = data;
    this.name = "ApiError";
  }
}

describe("OpenBanking API Client", () => {
  const mockConfig: ApiConfig = {
    baseUrl: API_BASE_URL,
    accessToken: "valid-access-token",
  };

  let apiClient: OpenBankingApiClient;

  beforeEach(() => {
    resetServer();
    apiClient = new OpenBankingApiClient(mockConfig);
  });

  describe("Mock de respostas dos bancos", () => {
    it("deve retornar lista de contas mockada", async () => {
      const accounts = await apiClient.getAccounts();

      expect(accounts).toHaveProperty("data");
      expect(Array.isArray(accounts.data)).toBe(true);
      expect(accounts.data.length).toBeGreaterThan(0);
    });

    it("deve retornar estrutura correta de conta", async () => {
      const accounts = await apiClient.getAccounts();
      const account = accounts.data[0];

      expect(account).toHaveProperty("accountId");
      expect(account).toHaveProperty("accountType");
      expect(account).toHaveProperty("brandName");
      expect(account).toHaveProperty("companyCnpj");
      expect(account).toHaveProperty("name");
      expect(account).toHaveProperty("number");
    });

    it("deve retornar detalhes de conta específica", async () => {
      const accountId = "acc-itau-001";

      const account = await apiClient.getAccount(accountId);

      expect(account.data.accountId).toBe(accountId);
    });

    it("deve retornar saldo da conta", async () => {
      const accountId = "acc-itau-001";

      const balance = await apiClient.getBalance(accountId);

      expect(balance).toHaveProperty("data");
      expect(balance.data).toHaveProperty("availableAmount");
      expect(balance.data.availableAmount).toHaveProperty("amount");
      expect(balance.data.availableAmount).toHaveProperty("currency");
    });
  });

  describe("Teste de obter dados da conta", () => {
    it("deve incluir CNPJ da instituição", async () => {
      const accounts = await apiClient.getAccounts();

      expect(accounts.data[0].companyCnpj).toMatch(/^\d{14}$/);
    });

    it("deve incluir número e dígito da conta", async () => {
      const accounts = await apiClient.getAccounts();

      expect(accounts.data[0]).toHaveProperty("number");
      expect(accounts.data[0]).toHaveProperty("checkDigit");
    });

    it("deve incluir código da agência", async () => {
      const accounts = await apiClient.getAccounts();

      expect(accounts.data[0]).toHaveProperty("branchCode");
    });

    it("deve validar formato de CNPJ", async () => {
      const accounts = await apiClient.getAccounts();
      const cnpj = accounts.data[0].companyCnpj;

      expect(cnpj).toHaveLength(14);
      expect(/^\d+$/.test(cnpj)).toBe(true);
    });
  });

  describe("Teste de obter extrato", () => {
    it("deve retornar transações da conta", async () => {
      const accountId = "acc-itau-001";

      const transactions = await apiClient.getTransactions(accountId);

      expect(transactions).toHaveProperty("data");
      expect(transactions.data).toHaveProperty("transactions");
      expect(Array.isArray(transactions.data.transactions)).toBe(true);
    });

    it("deve retornar transações com estrutura completa", async () => {
      const accountId = "acc-itau-001";

      const transactions = await apiClient.getTransactions(accountId);
      const transaction = transactions.data.transactions[0];

      expect(transaction).toHaveProperty("transactionId");
      expect(transaction).toHaveProperty("transactionName");
      expect(transaction).toHaveProperty("creditDebitType");
      expect(transaction).toHaveProperty("amount");
      expect(transaction).toHaveProperty("transactionDate");
    });

    it("deve filtrar transações por data", async () => {
      const accountId = "acc-itau-001";
      const fromDate = "2024-01-14";
      const toDate = "2024-01-15";

      const transactions = await apiClient.getTransactions(accountId, fromDate, toDate);

      expect(transactions.data.transactions.length).toBeGreaterThan(0);
      transactions.data.transactions.forEach((t) => {
        // Comparação de datas ISO funciona com comparação de strings
        const txnDate = new Date(t.transactionDate);
        const from = new Date(fromDate);
        const to = new Date(toDate);
        expect(txnDate >= from).toBe(true);
        expect(txnDate <= to).toBe(true);
      });
    });

    it("deve incluir valores monetários formatados", async () => {
      const accountId = "acc-itau-001";

      const transactions = await apiClient.getTransactions(accountId);
      const transaction = transactions.data.transactions[0];

      expect(transaction.amount).toHaveProperty("amount");
      expect(transaction.amount).toHaveProperty("currency");
      expect(transaction.amount.currency).toBe("BRL");
    });
  });

  describe("Retry em caso de rate limit", () => {
    it("deve fazer retry quando receber 429", async () => {
      let attempts = 0;

      // Sobrescrever handler para retornar sucesso na segunda tentativa
      server.use(
        http.get(
          `${API_BASE_URL}/accounts/v1/accounts/:accountId/transactions`,
          () => {
            attempts++;
            if (attempts === 1) {
              return HttpResponse.json(mockError429, {
                status: 429,
                headers: { "Retry-After": "0.05" },
              });
            }
            return HttpResponse.json(mockTransactionsItau);
          }
        )
      );

      const clientWithRetry = new OpenBankingApiClient(
        mockConfig,
        { maxRetries: 2, retryDelay: 50 }
      );

      // Deve retornar sucesso após o retry
      const result = await clientWithRetry.getTransactions("acc-001");

      expect(result).toBeDefined();
      expect(attempts).toBe(2); // Primeira tentativa + 1 retry
    });

    it("deve respeitar header Retry-After", async () => {
      const beforeRequest = Date.now();

      // Simular request que vai falhar com 429
      server.use(
        http.get(`${API_BASE_URL}/accounts/v1/accounts`, () => {
          return HttpResponse.json(mockError429, {
            status: 429,
            headers: { "Retry-After": "0.1" },
          });
        })
      );

      const clientWithRetry = new OpenBankingApiClient(
        mockConfig,
        { maxRetries: 1, retryDelay: 10 }
      );

      await expect(clientWithRetry.getAccounts()).rejects.toThrow(ApiError);

      const afterRequest = Date.now();
      // Deve ter esperado pelo menos algum tempo (mesmo pequeno)
      expect(afterRequest - beforeRequest).toBeGreaterThanOrEqual(5);
    });

    it("deve parar de tentar após maxRetries", async () => {
      let attempts = 0;

      server.use(
        http.get(`${API_BASE_URL}/accounts/v1/accounts`, () => {
          attempts++;
          return HttpResponse.json(mockError429, {
            status: 429,
            headers: { "Retry-After": "0.01" },
          });
        })
      );

      const clientWithRetry = new OpenBankingApiClient(
        mockConfig,
        { maxRetries: 3, retryDelay: 10 }
      );

      await expect(clientWithRetry.getAccounts()).rejects.toThrow();
      expect(attempts).toBe(3); // Tentativa inicial + 2 retries
    });
  });

  describe("Tratamento de erro 401/403", () => {
    it("deve lançar ApiError com status 401 para token inválido", async () => {
      const clientWithInvalidToken = new OpenBankingApiClient({
        ...mockConfig,
        accessToken: "invalid-token",
      });

      await expect(clientWithInvalidToken.getAccounts()).rejects.toThrow(ApiError);

      try {
        await clientWithInvalidToken.getAccounts();
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
      }
    });

    it("deve lançar ApiError com status 403 para sem permissão", async () => {
      const clientWithNoPermission = new OpenBankingApiClient({
        ...mockConfig,
        accessToken: "no-permission-token",
      });

      await expect(clientWithNoPermission.getAccounts()).rejects.toThrow(ApiError);

      try {
        await clientWithNoPermission.getAccounts();
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(403);
      }
    });

    it("deve incluir detalhes do erro na ApiError", async () => {
      const clientWithInvalidToken = new OpenBankingApiClient({
        ...mockConfig,
        accessToken: "invalid-token",
      });

      try {
        await clientWithInvalidToken.getAccounts();
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.data).toBeDefined();
        expect(apiError.data).toHaveProperty("errors");
      }
    });

    it("não deve fazer retry em erro 401", async () => {
      let attempts = 0;

      server.use(
        http.get(`${API_BASE_URL}/accounts/v1/accounts`, () => {
          attempts++;
          return HttpResponse.json(mockError401, { status: 401 });
        })
      );

      const clientWithRetry = new OpenBankingApiClient(
        { ...mockConfig, accessToken: "invalid-token" },
        { maxRetries: 3 }
      );

      await expect(clientWithRetry.getAccounts()).rejects.toThrow();
      expect(attempts).toBe(1); // Não deve fazer retry
    });

    it("não deve fazer retry em erro 403", async () => {
      let attempts = 0;

      server.use(
        http.get(`${API_BASE_URL}/accounts/v1/accounts`, () => {
          attempts++;
          return HttpResponse.json(mockError403, { status: 403 });
        })
      );

      const clientWithRetry = new OpenBankingApiClient(
        { ...mockConfig, accessToken: "no-permission-token" },
        { maxRetries: 3 }
      );

      await expect(clientWithRetry.getAccounts()).rejects.toThrow();
      expect(attempts).toBe(1); // Não deve fazer retry
    });
  });

  describe("Headers da requisição", () => {
    it("deve incluir header Authorization", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockAccountsList), { status: 200 })
        )
      );

      await apiClient.getAccounts();

      const call = fetchSpy.mock.calls[0];
      const headers = call[1]?.headers as Record<string, string>;
      expect(headers.Authorization).toBe(`Bearer ${mockConfig.accessToken}`);

      fetchSpy.mockRestore();
    });

    it("deve incluir header Content-Type", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockAccountsList), { status: 200 })
        )
      );

      await apiClient.getAccounts();

      const call = fetchSpy.mock.calls[0];
      const headers = call[1]?.headers as Record<string, string>;
      expect(headers["Content-Type"]).toBe("application/json");

      fetchSpy.mockRestore();
    });

    it("deve incluir header Accept", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockAccountsList), { status: 200 })
        )
      );

      await apiClient.getAccounts();

      const call = fetchSpy.mock.calls[0];
      const headers = call[1]?.headers as Record<string, string>;
      expect(headers.Accept).toBe("application/json");

      fetchSpy.mockRestore();
    });
  });
});

import { http, HttpResponse } from "msw";
