import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCnpjLookup } from "./useCnpjLookup";

// Mock do toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from "sonner";

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
    });

    it("deve buscar dados do CNPJ e preencher formulario com sucesso", async () => {
      const mockData = {
        razao_social: "EMPRESA TESTE LTDA",
        nome_fantasia: "EMPRESA FANTASIA",
        email: "contato@empresa.com",
        ddd_telefone_1: "1112345678",
        logradouro: "RUA TESTE",
        numero: "123",
        complemento: "SALA 1",
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
        "https://brasilapi.com.br/api/cnpj/v1/12345678000190"
      );

      expect(mockSetForm).toHaveBeenCalledWith(expect.any(Function));

      const setFormCall = mockSetForm.mock.calls[0][0];
      const prev = { nome: "", email: "", telefone: "", endereco: "", cidade: "", estado: "" };
      const newState = setFormCall(prev);

      expect(newState.nome).toBe("EMPRESA TESTE LTDA");
      expect(newState.email).toBe("contato@empresa.com");
      expect(newState.telefone).toBe("(11) 12345678");
      expect(newState.endereco).toBe("RUA TESTE, 123, SALA 1");
      expect(newState.cidade).toBe("SAO PAULO");
      expect(newState.estado).toBe("SP");

      expect(toast.success).toHaveBeenCalledWith("Dados do CNPJ preenchidos automaticamente!");
    });

    it("deve usar nome_fantasia quando razao_social nao existir", async () => {
      const mockData = {
        nome_fantasia: "EMPRESA FANTASIA",
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
      const prev = { nome: "ANTIGO", email: "", telefone: "", endereco: "", cidade: "", estado: "" };
      const newState = setFormCall(prev);

      expect(newState.nome).toBe("EMPRESA FANTASIA");
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
        ddd_telefone_1: "1198765432",
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

      expect(newState.telefone).toBe("(11) 98765432");
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

    it("deve lidar com erro na API", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const { result } = renderHook(() => useCnpjLookup(mockSetForm));

      await act(async () => {
        await result.current.lookup("12345678000190");
      });

      expect(toast.error).toHaveBeenCalledWith(
        "Não foi possível consultar o CNPJ. Verifique o número digitado."
      );
      expect(result.current.loading).toBe(false);
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

      expect(toast.error).toHaveBeenCalledWith(
        "Não foi possível consultar o CNPJ. Verifique o número digitado."
      );
      expect(result.current.loading).toBe(false);
    });
  });
});
