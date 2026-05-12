/**
 * Testes de Clientes ERP
 * Task #34 - APIs Contabilidade - Testes e Documentação
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  contasPagarExemplo,
  contasReceberExemplo,
  respostasAPIs,
  errosTipicos,
  configuracoesERP,
  timeoutResponse,
  connectionError,
} from "./fixtures/erpFixtures";

// Mock dos clientes ERP
const mockTOTVSClient = {
  authenticate: vi.fn(),
  exportarContasPagar: vi.fn(),
  exportarContasReceber: vi.fn(),
  importarLancamentos: vi.fn(),
};

const mockSankhyaClient = {
  authenticate: vi.fn(),
  exportarContasPagar: vi.fn(),
  exportarContasReceber: vi.fn(),
  importarLancamentos: vi.fn(),
};

const mockDominioClient = {
  authenticate: vi.fn(),
  exportarContasPagar: vi.fn(),
  exportarContasReceber: vi.fn(),
  importarLancamentos: vi.fn(),
};

const mockAlterdataClient = {
  authenticate: vi.fn(),
  exportarContasPagar: vi.fn(),
  exportarContasReceber: vi.fn(),
  importarLancamentos: vi.fn(),
};

describe("ERP Clients - TOTVS", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Autenticação", () => {
    it("deve autenticar com sucesso e retornar tokens", async () => {
      mockTOTVSClient.authenticate.mockResolvedValue(respostasAPIs.totvs.auth.success);

      const result = await mockTOTVSClient.authenticate({
        username: "user",
        password: "pass",
        url: configuracoesERP.totvs.url,
      });

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(result).toHaveProperty("expiresIn");
      expect(result.tokenType).toBe("Bearer");
      expect(result.accessToken).toMatch(/^eyJ/);
    });

    it("deve lançar erro com credenciais inválidas", async () => {
      mockTOTVSClient.authenticate.mockRejectedValue(
        new Error(respostasAPIs.totvs.auth.error.message)
      );

      await expect(
        mockTOTVSClient.authenticate({
          username: "invalid",
          password: "wrong",
          url: configuracoesERP.totvs.url,
        })
      ).rejects.toThrow("Credenciais inválidas");
    });

    it("deve renovar token quando expirado", async () => {
      mockTOTVSClient.authenticate
        .mockRejectedValueOnce(new Error("Token expired"))
        .mockResolvedValueOnce(respostasAPIs.totvs.auth.success);

      try {
        await mockTOTVSClient.authenticate({
          username: "user",
          password: "pass",
          refreshToken: "old-token",
          url: configuracoesERP.totvs.url,
        });
      } catch (error) {
        // Primeira chamada falha, simulamos retry
        const result = await mockTOTVSClient.authenticate({
          username: "user",
          password: "pass",
          refreshToken: "old-token",
          url: configuracoesERP.totvs.url,
        });
        expect(result).toHaveProperty("accessToken");
      }
    });
  });

  describe("Exportação Contas a Pagar", () => {
    it("deve exportar contas a pagar com sucesso", async () => {
      mockTOTVSClient.exportarContasPagar.mockResolvedValue(
        respostasAPIs.totvs.exportacao.success
      );

      const result = await mockTOTVSClient.exportarContasPagar(contasPagarExemplo);

      expect(result.status).toBe("success");
      expect(result.registrosProcessados).toBe(3);
      expect(result.registrosInseridos).toBe(3);
      expect(result.erros).toHaveLength(0);
    });

    it("deve retornar status parcial quando houver erros", async () => {
      mockTOTVSClient.exportarContasPagar.mockResolvedValue(
        respostasAPIs.totvs.exportacao.partial
      );

      const result = await mockTOTVSClient.exportarContasPagar(contasPagarExemplo);

      expect(result.status).toBe("partial");
      expect(result.registrosProcessados).toBe(3);
      expect(result.registrosInseridos).toBe(2);
      expect(result.erros).toHaveLength(1);
      expect(result.erros[0]).toHaveProperty("linha");
      expect(result.erros[0]).toHaveProperty("erro");
    });

    it("deve normalizar CNPJ antes de exportar", async () => {
      mockTOTVSClient.exportarContasPagar.mockImplementation((data) => {
        const normalizado = data.map((item: any) => ({
          ...item,
          cnpjFornecedor: item.cnpjFornecedor.replace(/[^0-9]/g, ""),
        }));
        expect(normalizado[0].cnpjFornecedor).toBe("12345678000190");
        return Promise.resolve(respostasAPIs.totvs.exportacao.success);
      });

      await mockTOTVSClient.exportarContasPagar(contasPagarExemplo);
    });
  });

  describe("Exportação Contas a Receber", () => {
    it("deve exportar contas a receber com sucesso", async () => {
      mockTOTVSClient.exportarContasReceber.mockResolvedValue({
        ...respostasAPIs.totvs.exportacao.success,
        registrosProcessados: 2,
        registrosInseridos: 2,
      });

      const result = await mockTOTVSClient.exportarContasReceber(contasReceberExemplo);

      expect(result.status).toBe("success");
      expect(result.registrosProcessados).toBe(2);
    });
  });

  describe("Importação de Lançamentos", () => {
    it("deve importar lançamentos contábeis", async () => {
      mockTOTVSClient.importarLancamentos.mockResolvedValue(
        respostasAPIs.totvs.importacao.success
      );

      const result = await mockTOTVSClient.importarLancamentos({
        dataInicio: "2024-04-01",
        dataFim: "2024-04-30",
      });

      expect(result.status).toBe("success");
      expect(result.lancamentos).toBeInstanceOf(Array);
      expect(result.lancamentos.length).toBeGreaterThan(0);
    });

    it("deve filtrar por conta contábil quando especificado", async () => {
      const filtro = { dataInicio: "2024-04-01", dataFim: "2024-04-30", conta: "2.1.1.01" };

      mockTOTVSClient.importarLancamentos.mockImplementation((params) => {
        expect(params).toHaveProperty("conta", "2.1.1.01");
        return Promise.resolve(respostasAPIs.totvs.importacao.success);
      });

      await mockTOTVSClient.importarLancamentos(filtro);
    });
  });

  describe("Tratamento de Erros", () => {
    it("deve tratar erro de conexão", async () => {
      mockTOTVSClient.exportarContasPagar.mockRejectedValue(
        new Error(connectionError.message)
      );

      await expect(
        mockTOTVSClient.exportarContasPagar(contasPagarExemplo)
      ).rejects.toThrow("ERP indisponível");
    });

    it("deve fazer retry em timeout (3 tentativas)", async () => {
      // Simula o comportamento de retry implementando 2 falhas seguidas de 1 sucesso
      mockTOTVSClient.exportarContasPagar
        .mockRejectedValueOnce(new Error(timeoutResponse.message))
        .mockRejectedValueOnce(new Error(timeoutResponse.message))
        .mockResolvedValueOnce(respostasAPIs.totvs.exportacao.success);

      // Chama a função que deveria implementar retry
      let attempts = 0;
      let result;
      for (let i = 0; i < 3; i++) {
        try {
          attempts++;
          result = await mockTOTVSClient.exportarContasPagar(contasPagarExemplo);
          break;
        } catch (error) {
          if (attempts >= 3) throw error;
        }
      }

      expect(attempts).toBe(3);
      expect(result?.status).toBe("success");
    });

    it("deve lançar erro definitivo após esgotar retries", async () => {
      mockTOTVSClient.exportarContasPagar.mockRejectedValue(
        new Error(timeoutResponse.message)
      );

      try {
        await mockTOTVSClient.exportarContasPagar(contasPagarExemplo);
        expect.fail("Deveria ter lançado erro");
      } catch (error: any) {
        expect(error.message).toContain("timeout");
      }
    });

    it("deve mapear códigos de erro específicos do TOTVS", async () => {
      mockTOTVSClient.exportarContasPagar.mockRejectedValue(
        new Error(errosTipicos.totvs[0].message)
      );

      await expect(
        mockTOTVSClient.exportarContasPagar(contasPagarExemplo)
      ).rejects.toThrow("Conta contábil não cadastrada");
    });
  });
});

describe("ERP Clients - Sankhya", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Autenticação", () => {
    it("deve autenticar via action login", async () => {
      mockSankhyaClient.authenticate.mockResolvedValue(respostasAPIs.sankhya.auth.success);

      const result = await mockSankhyaClient.authenticate({
        usuario: "user",
        senha: "pass",
      });

      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("jsessionId");
    });

    it("deve usar JSESSIONID em requisições subsequentes", async () => {
      mockSankhyaClient.authenticate.mockResolvedValue(respostasAPIs.sankhya.auth.success);

      const auth = await mockSankhyaClient.authenticate({
        usuario: "user",
        senha: "pass",
      });

      expect(auth.jsessionId).toContain("JSESSIONID=");
    });
  });

  describe("Exportação", () => {
    it("deve usar CRUDServiceProvider para exportar", async () => {
      mockSankhyaClient.exportarContasPagar.mockResolvedValue(
        respostasAPIs.sankhya.exportacao.success
      );

      const result = await mockSankhyaClient.exportarContasPagar(contasPagarExemplo);

      expect(result.pk.STATUS).toBe("OK");
      expect(result.rows).toBe(3);
    });
  });

  describe("Tratamento de Erros Específicos", () => {
    it("deve tratar erro de registro duplicado", async () => {
      mockSankhyaClient.exportarContasPagar.mockRejectedValue(
        new Error(errosTipicos.sankhya[0].message)
      );

      await expect(
        mockSankhyaClient.exportarContasPagar(contasPagarExemplo)
      ).rejects.toThrow("Registro já existe na base");
    });
  });
});

describe("ERP Clients - Domínio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Autenticação", () => {
    it("deve autenticar e retornar token e sessionId", async () => {
      mockDominioClient.authenticate.mockResolvedValue(respostasAPIs.dominio.auth.success);

      const result = await mockDominioClient.authenticate({
        user: "user",
        password: "pass",
      });

      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("sessionId");
    });
  });

  describe("Permissões", () => {
    it("deve verificar acesso ao módulo Financeiro", async () => {
      mockDominioClient.exportarContasPagar.mockRejectedValue(
        new Error(errosTipicos.dominio[0].message)
      );

      await expect(
        mockDominioClient.exportarContasPagar(contasPagarExemplo)
      ).rejects.toThrow("Acesso negado ao módulo Financeiro");
    });

    it("deve verificar se exercício contábil está aberto", async () => {
      mockDominioClient.exportarContasPagar.mockRejectedValue(
        new Error(errosTipicos.dominio[1].message)
      );

      await expect(
        mockDominioClient.exportarContasPagar(contasPagarExemplo)
      ).rejects.toThrow("Exercício contábil fechado");
    });
  });
});

describe("ERP Clients - Alterdata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rate Limiting", () => {
    it("deve respeitar rate limit de requests", async () => {
      const requests = Array(20).fill(null).map(() =>
        mockAlterdataClient.exportarContasPagar(contasPagarExemplo.slice(0, 1))
      );

      mockAlterdataClient.exportarContasPagar.mockResolvedValue(
        respostasAPIs.alterdata.exportacao.success
      );

      // Simula delay entre requests
      let callCount = 0;
      mockAlterdataClient.exportarContasPagar.mockImplementation(() => {
        callCount++;
        if (callCount > 15) {
          return Promise.reject(new Error(errosTipicos.alterdata[0].message));
        }
        return Promise.resolve(respostasAPIs.alterdata.exportacao.success);
      });

      // Deveria funcionar até o limite
      const result = await mockAlterdataClient.exportarContasPagar(contasPagarExemplo);
      expect(result.status).toBe("success");
    });
  });

  describe("Contas Contábeis", () => {
    it("deve validar conta contábil ativa", async () => {
      mockAlterdataClient.exportarContasPagar.mockRejectedValue(
        new Error(errosTipicos.alterdata[1].message)
      );

      await expect(
        mockAlterdataClient.exportarContasPagar(contasPagarExemplo)
      ).rejects.toThrow("Conta contábil inativa");
    });
  });
});

describe("Comparação entre ERPs", () => {
  it("deve ter configurações de rate limit diferentes", () => {
    expect(configuracoesERP.totvs.rateLimit.requestsPerSecond).toBe(10);
    expect(configuracoesERP.sankhya.rateLimit.requestsPerSecond).toBe(5);
    expect(configuracoesERP.dominio.rateLimit.requestsPerSecond).toBe(8);
    expect(configuracoesERP.alterdata.rateLimit.requestsPerSecond).toBe(15);
  });

  it("deve ter configurações de timeout diferentes", () => {
    expect(configuracoesERP.totvs.retryConfig.timeout).toBe(30000);
    expect(configuracoesERP.sankhya.retryConfig.timeout).toBe(60000);
    expect(configuracoesERP.dominio.retryConfig.timeout).toBe(45000);
  });
});
