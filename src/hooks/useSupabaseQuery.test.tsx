import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTableQuery, useTableMutation } from "./useSupabaseQuery";

// Mocks
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: vi.fn(),
}));

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import React from "react";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useSupabaseQuery", () => {
  const mockUser = { id: "user-123", email: "test@example.com" };
  const mockToast = { toast: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: mockUser });
    (useToast as ReturnType<typeof vi.fn>).mockReturnValue(mockToast);
  });

  describe("useTableQuery", () => {
    it("deve retornar dados da tabela com sucesso", async () => {
      const mockData = [
        { id: "1", nome: "Teste 1", created_at: "2024-01-01" },
        { id: "2", nome: "Teste 2", created_at: "2024-01-02" },
      ];

      const mockOrder = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useTableQuery("categorias"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith("categorias");
    });

    it("deve aplicar opcoes de selecao corretamente", async () => {
      const mockData = [{ id: "1", nome: "Teste 1" }];

      const mockOrder = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      renderHook(
        () =>
          useTableQuery("categorias", {
            select: "id,nome",
            orderBy: "nome",
            ascending: true,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(mockSelect).toHaveBeenCalledWith("id,nome"));
    });

    it("deve normalizar lancamentos_caixa corretamente", async () => {
      const mockData = [
        { id: "1", conta_pagar_id: "cp1", valor: 100 },
        { id: "2", conta_receber_id: "cr1", valor: 200 },
        { id: "3", valor: 300 }, // sem conta_pagar_id ou conta_receber_id - deve ser filtrado
      ];

      const mockOrder = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useTableQuery("lancamentos_caixa"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Deve filtrar registros sem conta_pagar_id ou conta_receber_id
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data).toEqual([
        { id: "1", conta_pagar_id: "cp1", valor: 100 },
        { id: "2", conta_receber_id: "cr1", valor: 200 },
      ]);
    });

    it("deve retornar array vazio quando nao ha dados", async () => {
      const mockOrder = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useTableQuery("categorias"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });

    it("nao deve executar query quando usuario nao esta autenticado", async () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: null });

      const { result } = renderHook(() => useTableQuery("categorias"), {
        wrapper: createWrapper(),
      });

      // Aguarda um tick para garantir que o hook foi executado
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.isLoading).toBe(false);
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe("useTableMutation", () => {
    it("deve inserir registro com sucesso", async () => {
      const mockData = { id: "123", nome: "Nova Categoria" };
      const mockSingle = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
      });

      const { result } = renderHook(() => useTableMutation("categorias"), {
        wrapper: createWrapper(),
      });

      await result.current.insert.mutateAsync({ nome: "Nova Categoria" });

      expect(mockInsert).toHaveBeenCalledWith({
        nome: "Nova Categoria",
        user_id: "user-123",
      });
      expect(mockToast.toast).toHaveBeenCalledWith({
        title: "Registro criado com sucesso!",
      });
    });

    it("deve deletar registro com sucesso", async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        delete: mockDelete,
      });

      const { result } = renderHook(() => useTableMutation("categorias"), {
        wrapper: createWrapper(),
      });

      await result.current.remove.mutateAsync("123");

      expect(mockDelete).toHaveBeenCalled();
      expect(mockToast.toast).toHaveBeenCalledWith({
        title: "Registro excluído com sucesso!",
      });
    });

    it("deve lidar com erro na insercao", async () => {
      const mockError = { message: "Erro ao inserir" };
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: mockError });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
      });

      const { result } = renderHook(() => useTableMutation("categorias"), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.insert.mutateAsync({ nome: "Teste" })
      ).rejects.toBeDefined();

      expect(mockToast.toast).toHaveBeenCalledWith({
        title: "Erro ao criar",
        description: "Erro ao inserir",
        variant: "destructive",
      });
    });
  });
});
