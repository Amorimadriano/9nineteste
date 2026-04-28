import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCnpjLookup } from "./useCnpjLookup";

// Mock do useToast
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe("useCnpjLookup", () => {
  const mockSetForm = vi.fn();
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  describe("cleanCnpj", () => {
    it("deve remover caracteres nao numericos do CNPJ", () => {
      const { result } = renderHook(() => useCnpjLookup(mockSetForm));

      expect(result.current.cleanCnpj("12.345.678/0001-90")).toBe("12345678000190");
      expect(result.current.cleanCnpj("12345678000190")).toBe("12345678000190");
      expect(result.current.cleanCnpj("ABC123DEF")).toBe("123");
      expect(result.current.cleanCnpj("")).toBe("");
    });
  });

  describe("lookup", () => {
    it("nao deve fazer fetch quando CNPJ tem menos de 14 digitos", async () => {
      const { result } = renderHook(() => useCnpjLookup(mockSetForm));

      await act(async () => {
        await result.current.lookup("123456");
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
      expect(mockToast).toHaveBeenCalledWith({
        title: "CNPJ inválido",
        description: "Digite um CNPJ válido com 14 dígitos.",
        variant: "destructive",
      });
    });

    it("deve buscar dados do CNPJ e preencher formulario com sucesso", async () => {
      const mockData = {
        razao_social: "EMPRESA TESTE LTDA",
        nome_fantasia: "EMPRESA FANTASIA",
        email: "contato@empresa.com",
        ddd_telefone_1: "1112345678",
        cep: "01001000",
        logradouro: "RUA TESTE",
        numero: "123",
        complemento: "SALA 1",
        bairro: "CENTRO",
        municipio: "SAO PAULO",
        uf: "SP",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const { result } = renderHook(() => useCnpjLookup(mockSetForm));

      await act(async () => {
        await result.current.lookup("12.345.678/0001-90");
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://brasilapi.com.br/api/cnpj/v1/12345678000190",
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );

      expect(mockSetForm).toHaveBeenCalledWith(expect.any(Function));

      const setFormCall = mockSetForm.mock.calls[0][0];
      const prev = {
        nome: "",
        razao_social: "",
        nome_fantasia: "",
        email: "",
        telefone: "",
        cep: "",
        endereco: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
      };
      const newState = setFormCall(prev);

      expect(newState.nome).toBe("EMPRESA TESTE LTDA");
      expect(newState.razao_social).toBe("EMPRESA TESTE LTDA");
      expect(newState.nome_fantasia).toBe("EMPRESA FANTASIA");
      expect(newState.email).toBe("contato@empresa.com");
      expect(newState.telefone).toBe("(11) 1234-5678");
      expect(newState.cep).toBe("01001000");
      expect(newState.endereco).toBe("RUA TESTE");
      expect(newState.numero).toBe("123");
      expect(newState.complemento).toBe("SALA 1");
      expect(newState.bairro).toBe("CENTRO");
      expect(newState.cidade).toBe("SAO PAULO");
      expect(newState.estado).toBe("SP");

      expect(mockToast).toHaveBeenCalledWith({
        title: "Dados preenchidos!",
        description: expect.stringContaining("12.345.678/0001-90"),
      });
    });

    it("deve usar nome_fantasia quando razao_social nao existir", async () => {
      const mockData = {
        nome_fantasia: "EMPRESA FANTASIA",
        email: "",
        ddd_telefone_1: "",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const { result } = renderHook(() => useCnpjLookup(mockSetForm));

      await act(async () => {
        await result.current.lookup("12345678000190");
      });

      const setFormCall = mockSetForm.mock.calls[0][0];
      const prev = { nome: "ANTIGO", razao_social: "ANTIGO RS", email: "", telefone: "" };
      const newState = setFormCall(prev);

      // Nome não deve mudar porque não há razao_social
      expect(newState.nome).toBe("ANTIGO");
      expect(newState.nome_fantasia).toBe("EMPRESA FANTASIA");
    });

    it("deve manter valores anteriores quando dados da API estao vazios", async () => {
      const mockData = {
        razao_social: "",
        nome_fantasia: "",
        email: "",
        ddd_telefone_1: "",
        logradouro: "",
        numero: "",
        municipio: "",
        uf: "",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const { result } = renderHook(() => useCnpjLookup(mockSetForm));

      await act(async () => {
        await result.current.lookup("12345678000190");
      });

      const setFormCall = mockSetForm.mock.calls[0][0];
      const prev = {
        nome: "NOME ANTIGO",
        email: "email@antigo.com",
        telefone: "11999999999",
        endereco: "ENDERECO ANTIGO",
        cidade: "CIDADE ANTIGA",
        estado: "RJ",
      };
      const newState = setFormCall(prev);

      expect(newState.nome).toBe("NOME ANTIGO");
      expect(newState.email).toBe("email@antigo.com");
      expect(newState.telefone).toBe("11999999999");
      expect(newState.endereco).toBe("ENDERECO ANTIGO");
      expect(newState.cidade).toBe("CIDADE ANTIGA");
      expect(newState.estado).toBe("RJ");
    });

    it("deve formatar telefone corretamente com DDD", async () => {
      const mockData = {
        razao_social: "EMPRESA",
        ddd_telefone_1: "11987654321",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const { result } = renderHook(() => useCnpjLookup(mockSetForm));

      await act(async () => {
        await result.current.lookup("12345678000190");
      });

      const setFormCall = mockSetForm.mock.calls[0][0];
      const prev = { nome: "", email: "", telefone: "", endereco: "", cidade: "", estado: "" };
      const newState = setFormCall(prev);

      expect(newState.telefone).toBe("(11) 98765-4321");
    });

    it("deve retornar telefone vazio quando DDD nao existir", async () => {
      const mockData = {
        razao_social: "EMPRESA",
        ddd_telefone_1: "",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const { result } = renderHook(() => useCnpjLookup(mockSetForm));

      await act(async () => {
        await result.current.lookup("12345678000190");
      });

      const setFormCall = mockSetForm.mock.calls[0][0];
      const prev = { nome: "", email: "", telefone: "11999999999", endereco: "", cidade: "", estado: "" };
      const newState = setFormCall(prev);

      expect(newState.telefone).toBe("11999999999");
    });

    it("deve lidar com erro 404 na API", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const { result } = renderHook(() => useCnpjLookup(mockSetForm));

      await act(async () => {
        await result.current.lookup("12345678000190");
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Erro na consulta",
        description: "CNPJ não encontrado na base da Receita Federal.",
        variant: "destructive",
      });
      expect(result.current.loading).toBe(false);
    });

    it("deve lidar com erro 429 na API", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
      });

      const { result } = renderHook(() => useCnpjLookup(mockSetForm));

      await act(async () => {
        await result.current.lookup("12345678000190");
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Erro na consulta",
        description: "Muitas consultas em pouco tempo. Aguarde um momento.",
        variant: "destructive",
      });
    });

    it("deve definir loading como true durante a busca", async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ razao_social: "TESTE" }),
                }),
              100
            )
          )
      );

      const { result } = renderHook(() => useCnpjLookup(mockSetForm));

      expect(result.current.loading).toBe(false);

      act(() => {
        result.current.lookup("12345678000190");
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => expect(result.current.loading).toBe(false));
    });

    it("deve lidar com excecao no fetch", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useCnpjLookup(mockSetForm));

      await act(async () => {
        await result.current.lookup("12345678000190");
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Erro na consulta",
        description: "Network error",
        variant: "destructive",
      });
      expect(result.current.loading).toBe(false);
    });

    it("deve aplicar mapeamento personalizado de campos", async () => {
      const mockData = {
        razao_social: "EMPRESA MAP",
        email: "map@test.com",
        ddd_telefone_1: "1122223333",
        municipio: "CAMPINAS",
        uf: "SP",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const customMapping = {
        nome: "companyName",
        email: "companyEmail",
        telefone: "companyPhone",
        cidade: "companyCity",
        estado: "companyState",
      };

      const { result } = renderHook(() =>
        useCnpjLookup(mockSetForm, customMapping)
      );

      await act(async () => {
        await result.current.lookup("12345678000190");
      });

      const setFormCall = mockSetForm.mock.calls[0][0];
      const prev = {
        companyName: "",
        companyEmail: "",
        companyPhone: "",
        companyCity: "",
        companyState: "",
      };
      const newState = setFormCall(prev);

      expect(newState.companyName).toBe("EMPRESA MAP");
      expect(newState.companyEmail).toBe("map@test.com");
      expect(newState.companyPhone).toBe("(11) 2222-3333");
      expect(newState.companyCity).toBe("CAMPINAS");
      expect(newState.companyState).toBe("SP");
    });
  });
});
