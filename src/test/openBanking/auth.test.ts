/**
 * Testes de Autenticação Open Banking
 * Fluxos: consentimento, troca de code, refresh token, erros
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetServer } from "./server";
import {
  mockTokens,
  mockConsent,
  mockConsentAuthorized,
  mockConsentRejected,
} from "../fixtures/openBanking";

// Módulos a serem testados (implementação simulada)
// Em um cenário real, estes seriam importados do projeto
const API_BASE_URL = "https://api.itau/open-banking";

interface AuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authUrl: string;
  tokenUrl: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface ConsentResponse {
  data: {
    consentId: string;
    status: string;
    creationDateTime: string;
    statusUpdateDateTime: string;
    permissions: string[];
    expirationDateTime?: string;
    rejectionReason?: {
      code: string;
      detail: string;
    };
  };
}

class OpenBankingAuth {
  private config: AuthConfig;
  private tokens: TokenResponse | null = null;

  constructor(config: AuthConfig) {
    this.config = config;
  }

  // Inicia fluxo de consentimento
  buildConsentUrl(consentId: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: "code",
      scope: "openid accounts",
      redirect_uri: this.config.redirectUri,
      state,
      consent_id: consentId,
    });
    return `${this.config.authUrl}?${params.toString()}`;
  }

  // Troca code por token
  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    const response = await fetch(`${API_BASE_URL}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(
          `${this.config.clientId}:${this.config.clientSecret}`
        )}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || "Erro ao trocar code por token");
    }

    this.tokens = await response.json();
    return this.tokens;
  }

  // Refresh token
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const response = await fetch(`${API_BASE_URL}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(
          `${this.config.clientId}:${this.config.clientSecret}`
        )}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || "Erro ao atualizar token");
    }

    this.tokens = await response.json();
    return this.tokens;
  }

  // Verifica status do consentimento
  async checkConsentStatus(
    consentId: string,
    accessToken: string
  ): Promise<ConsentResponse> {
    const response = await fetch(
      `${API_BASE_URL}/consents/v1/consents/${consentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Erro ao verificar status do consentimento");
    }

    return response.json();
  }

  // Verifica se token está expirado
  isTokenExpired(expiresAt: number): boolean {
    return Date.now() >= expiresAt * 1000;
  }

  // Calcula data de expiração
  calculateExpiration(expiresIn: number): number {
    return Math.floor(Date.now() / 1000) + expiresIn;
  }
}

describe("OpenBanking Auth", () => {
  const mockConfig: AuthConfig = {
    clientId: "test-client-id",
    clientSecret: "test-client-secret",
    redirectUri: "http://localhost:3000/callback",
    authUrl: `${API_BASE_URL}/authorization`,
    tokenUrl: `${API_BASE_URL}/token`,
  };

  let auth: OpenBankingAuth;

  beforeEach(() => {
    resetServer();
    auth = new OpenBankingAuth(mockConfig);
  });

  describe("Iniciar fluxo de consentimento", () => {
    it("deve construir URL de consentimento corretamente", () => {
      const consentId = "consent-123-456";
      const state = "random-state-xyz";

      const url = auth.buildConsentUrl(consentId, state);

      expect(url).toContain(mockConfig.authUrl);
      expect(url).toContain(`client_id=${mockConfig.clientId}`);
      expect(url).toContain(`consent_id=${consentId}`);
      expect(url).toContain(`state=${state}`);
      expect(url).toContain(`redirect_uri=${encodeURIComponent(mockConfig.redirectUri)}`);
      expect(url).toContain("response_type=code");
    });

    it("deve incluir scope na URL de consentimento", () => {
      const url = auth.buildConsentUrl("consent-id", "state");
      expect(url).toContain("scope=");
    });

    it("deve gerar URLs diferentes para diferentes states", () => {
      const url1 = auth.buildConsentUrl("consent-1", "state-1");
      const url2 = auth.buildConsentUrl("consent-1", "state-2");

      expect(url1).not.toBe(url2);
      expect(url1).toContain("state=state-1");
      expect(url2).toContain("state=state-2");
    });
  });

  describe("Troca de code por token", () => {
    it("deve trocar código de autorização por token com sucesso", async () => {
      const code = "valid-auth-code";

      const tokens = await auth.exchangeCodeForToken(code);

      expect(tokens).toHaveProperty("access_token");
      expect(tokens).toHaveProperty("refresh_token");
      expect(tokens).toHaveProperty("token_type", "Bearer");
      expect(tokens).toHaveProperty("expires_in");
      expect(tokens).toHaveProperty("scope");
      expect(tokens.access_token).toBe(mockTokens.access_token);
    });

    it("deve incluir credenciais no header de autorização", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockTokens), { status: 200 })
        )
      );

      await auth.exchangeCodeForToken("valid-code");

      const call = fetchSpy.mock.calls[0];
      const headers = call[1]?.headers as Record<string, string>;
      expect(headers.Authorization).toContain("Basic");

      fetchSpy.mockRestore();
    });

    it("deve lançar erro para código inválido", async () => {
      const code = "invalid-code";

      await expect(auth.exchangeCodeForToken(code)).rejects.toThrow(
        "Código de autorização inválido"
      );
    });

    it("deve enviar grant_type correto", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockTokens), { status: 200 })
        )
      );

      await auth.exchangeCodeForToken("code");

      const call = fetchSpy.mock.calls[0];
      const body = call[1]?.body as URLSearchParams;
      expect(body.get("grant_type")).toBe("authorization_code");

      fetchSpy.mockRestore();
    });
  });

  describe("Refresh de token expirado", () => {
    it("deve atualizar token com sucesso usando refresh_token", async () => {
      const refreshToken = "valid-refresh-token";

      const tokens = await auth.refreshAccessToken(refreshToken);

      expect(tokens.access_token).toBe("new-access-token-xyz");
      expect(tokens.refresh_token).toBe("new-refresh-token-abc");
    });

    it("deve lançar erro quando refresh token expirou", async () => {
      const refreshToken = "expired-refresh-token";

      await expect(auth.refreshAccessToken(refreshToken)).rejects.toThrow(
        "Refresh token expirado"
      );
    });

    it("deve enviar grant_type refresh_token no body", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockTokens), { status: 200 })
        )
      );

      await auth.refreshAccessToken("token");

      const call = fetchSpy.mock.calls[0];
      const body = call[1]?.body as URLSearchParams;
      expect(body.get("grant_type")).toBe("refresh_token");
      expect(body.get("refresh_token")).toBe("token");

      fetchSpy.mockRestore();
    });
  });

  describe("Tratamento de erro de consentimento negado", () => {
    it("deve detectar consentimento rejeitado pelo usuário", async () => {
      const consentId = "consent-rejected";
      const accessToken = "valid-token";

      const response = await auth.checkConsentStatus(consentId, accessToken);

      expect(response.data.status).toBe("REJECTED");
      expect(response.data.rejectionReason).toBeDefined();
      expect(response.data.rejectionReason?.code).toBe("CUSTOMER_DENIED");
    });

    it("deve verificar status AUTHORISED de consentimento aprovado", async () => {
      const consentId = "consent-authorized";
      const accessToken = "valid-token";

      const response = await auth.checkConsentStatus(consentId, accessToken);

      expect(response.data.status).toBe("AUTHORISED");
      expect(response.data.rejectionReason).toBeUndefined();
    });

    it("deve identificar status AWAITING_AUTHORISATION", async () => {
      const consentId = "consent-pending";
      const accessToken = "valid-token";

      const response = await auth.checkConsentStatus(consentId, accessToken);

      expect(response.data.status).toBe("AWAITING_AUTHORISATION");
    });

    it("deve incluir data de expiração no consentimento", async () => {
      const consentId = "consent-authorized";
      const accessToken = "valid-token";

      const response = await auth.checkConsentStatus(consentId, accessToken);

      expect(response.data.expirationDateTime).toBeDefined();
    });
  });

  describe("Utilitários de token", () => {
    it("deve detectar token expirado corretamente", () => {
      const expiredTime = Math.floor(Date.now() / 1000) - 3600; // 1 hora atrás

      expect(auth.isTokenExpired(expiredTime)).toBe(true);
    });

    it("deve considerar token válido quando não expirou", () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hora no futuro

      expect(auth.isTokenExpired(futureTime)).toBe(false);
    });

    it("deve calcular expiração corretamente", () => {
      const expiresIn = 3600; // 1 hora
      const beforeCalc = Math.floor(Date.now() / 1000);

      const expiration = auth.calculateExpiration(expiresIn);

      const afterCalc = Math.floor(Date.now() / 1000);
      expect(expiration).toBeGreaterThanOrEqual(beforeCalc + expiresIn);
      expect(expiration).toBeLessThanOrEqual(afterCalc + expiresIn);
    });

    it("deve considerar token expirado exatamente no momento da expiração", () => {
      const currentTime = Math.floor(Date.now() / 1000);

      expect(auth.isTokenExpired(currentTime)).toBe(true);
    });
  });

  describe("Segurança", () => {
    it("não deve expor clientSecret na URL de consentimento", () => {
      const url = auth.buildConsentUrl("consent-id", "state");

      expect(url).not.toContain(mockConfig.clientSecret);
    });

    it("deve validar presença de state na URL", () => {
      const url = auth.buildConsentUrl("consent-id", "state-value");
      const params = new URL(url).searchParams;

      expect(params.get("state")).toBe("state-value");
      expect(params.get("state")).not.toBeNull();
    });
  });
});
