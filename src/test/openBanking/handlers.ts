/**
 * MSW Handlers para mockar APIs de Open Banking
 */
import { http, HttpResponse } from "msw";
import {
  mockTokens,
  mockConsent,
  mockConsentAuthorized,
  mockConsentRejected,
  mockAccountsList,
  mockAccountItau,
  mockBalance,
  mockTransactionsItau,
  mockError401,
  mockError403,
  mockError429,
} from "../fixtures/openBanking";

const API_BASE_URL = "https://api.itau/open-banking";

export const handlers = [
  // ==================== AUTH ====================
  // Token endpoint
  http.post(`${API_BASE_URL}/token`, async ({ request }) => {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const grantType = params.get("grant_type");
    const code = params.get("code");
    const refreshToken = params.get("refresh_token");

    // Simular troca de code por token
    if (grantType === "authorization_code" && code) {
      if (code === "invalid-code") {
        return HttpResponse.json(
          {
            error: "invalid_grant",
            error_description: "Código de autorização inválido",
          },
          { status: 400 }
        );
      }
      return HttpResponse.json(mockTokens);
    }

    // Simular refresh token
    if (grantType === "refresh_token" && refreshToken) {
      if (refreshToken === "expired-refresh-token") {
        return HttpResponse.json(
          {
            error: "invalid_grant",
            error_description: "Refresh token expirado",
          },
          { status: 400 }
        );
      }
      return HttpResponse.json({
        ...mockTokens,
        access_token: "new-access-token-xyz",
        refresh_token: "new-refresh-token-abc",
      });
    }

    return HttpResponse.json(
      { error: "invalid_request" },
      { status: 400 }
    );
  }),

  // ==================== CONSENTIMENTO ====================
  // Criar consentimento
  http.post(`${API_BASE_URL}/consents/v1/consents`, async ({ request }) => {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return HttpResponse.json(mockError401, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    if (token === "invalid-token") {
      return HttpResponse.json(mockError401, { status: 401 });
    }

    return HttpResponse.json(mockConsent);
  }),

  // Consultar consentimento
  http.get(
    `${API_BASE_URL}/consents/v1/consents/:consentId`,
    ({ params }) => {
      const { consentId } = params;

      if (consentId === "consent-rejected") {
        return HttpResponse.json(mockConsentRejected);
      }

      if (consentId === "consent-pending") {
        return HttpResponse.json(mockConsent);
      }

      return HttpResponse.json(mockConsentAuthorized);
    }
  ),

  // Delete consentimento
  http.delete(
    `${API_BASE_URL}/consents/v1/consents/:consentId`,
    ({ request }) => {
      const authHeader = request.headers.get("Authorization");

      if (!authHeader) {
        return HttpResponse.json(mockError401, { status: 401 });
      }

      return HttpResponse.json(
        { data: { status: "REVOKED" } },
        { status: 204 }
      );
    }
  ),

  // ==================== ACCOUNTS ====================
  // Listar contas
  http.get(`${API_BASE_URL}/accounts/v1/accounts`, ({ request }) => {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || authHeader === "Bearer invalid-token") {
      return HttpResponse.json(mockError401, { status: 401 });
    }

    if (authHeader === "Bearer no-permission-token") {
      return HttpResponse.json(mockError403, { status: 403 });
    }

    return HttpResponse.json(mockAccountsList);
  }),

  // Detalhes da conta
  http.get(
    `${API_BASE_URL}/accounts/v1/accounts/:accountId`,
    ({ params, request }) => {
      const { accountId } = params;
      const authHeader = request.headers.get("Authorization");

      if (!authHeader) {
        return HttpResponse.json(mockError401, { status: 401 });
      }

      return HttpResponse.json({
        data: { ...mockAccountItau.data, accountId },
      });
    }
  ),

  // Saldo da conta
  http.get(
    `${API_BASE_URL}/accounts/v1/accounts/:accountId/balances`,
    ({ request }) => {
      const authHeader = request.headers.get("Authorization");

      if (!authHeader) {
        return HttpResponse.json(mockError401, { status: 401 });
      }

      return HttpResponse.json(mockBalance);
    }
  ),

  // ==================== TRANSACTIONS ====================
  // Listar transações
  http.get(
    `${API_BASE_URL}/accounts/v1/accounts/:accountId/transactions`,
    ({ request }) => {
      const authHeader = request.headers.get("Authorization");
      const url = new URL(request.url);
      const fromDate = url.searchParams.get("fromDate");
      const toDate = url.searchParams.get("toDate");

      if (!authHeader) {
        return HttpResponse.json(mockError401, { status: 401 });
      }

      // Simular rate limit
      if (authHeader === "Bearer rate-limited-token") {
        return HttpResponse.json(mockError429, {
          status: 429,
          headers: { "Retry-After": "60" },
        });
      }

      // Retornar transações filtradas por data se fornecido
      let transactions = mockTransactionsItau.data.transactions;
      if (fromDate && toDate) {
        transactions = transactions.filter(
          (t) => t.transactionDate >= fromDate && t.transactionDate <= toDate
        );
      }

      return HttpResponse.json({ data: { transactions } });
    }
  ),

  // ==================== ERROR SCENARIOS ====================
  // Endpoint que sempre retorna 500
  http.get(`${API_BASE_URL}/error/500`, () => {
    return HttpResponse.json(
      {
        errors: [
          {
            code: "INTERNAL_ERROR",
            title: "Erro interno",
            detail: "Ocorreu um erro interno no servidor",
          },
        ],
      },
      { status: 500 }
    );
  }),

  // Endpoint que simula timeout
  http.get(`${API_BASE_URL}/error/timeout`, async () => {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return HttpResponse.json({});
  }),
];

// Handlers específicos para testes de erro
export const errorHandlers = [
  http.get(`${API_BASE_URL}/accounts/v1/accounts`, () => {
    return HttpResponse.json(mockError401, { status: 401 });
  }),
];

// Handlers específicos para rate limit
export const rateLimitHandlers = [
  http.get(
    `${API_BASE_URL}/accounts/v1/accounts/:accountId/transactions`,
    () => {
      return HttpResponse.json(mockError429, {
        status: 429,
        headers: { "Retry-After": "1" },
      });
    }
  ),
];
