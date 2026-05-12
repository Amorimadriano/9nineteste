import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  syncContaPagarExtrato,
  syncContaReceberExtrato,
  removeContaPagarExtrato,
  removeContaReceberExtrato,
} from "./extratoSync";

// Mock do supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "@/integrations/supabase/client";

describe("extratoSync", () => {
  const mockUserId = "user-123";
  const mockContaId = "conta-456";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("syncContaPagarExtrato", () => {
    it("deve retornar true quando status nao eh pago", async () => {
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        }),
      });

      const result = await syncContaPagarExtrato(mockUserId, mockContaId, {
        descricao: "Teste",
        valor: 100,
        data_vencimento: "2024-01-15",
        status: "pendente",
      });

      expect(result).toBe(true);
    });

    it("deve retornar true quando cria extrato", async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ insert: mockInsert });

      const result = await syncContaPagarExtrato(mockUserId, mockContaId, {
        descricao: "Conta Teste",
        valor: 150.5,
        data_vencimento: "2024-01-15",
        status: "pago",
        data_pagamento: "2024-01-10",
      });

      expect(result).toBe(true);
    });
  });

  describe("syncContaReceberExtrato", () => {
    it("deve retornar true quando status nao eh recebido", async () => {
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        }),
      });

      const result = await syncContaReceberExtrato(mockUserId, mockContaId, {
        descricao: "Teste",
        valor: 100,
        data_vencimento: "2024-01-15",
        status: "pendente",
      });

      expect(result).toBe(true);
    });

    it("deve retornar true quando cria extrato", async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ insert: mockInsert });

      const result = await syncContaReceberExtrato(mockUserId, mockContaId, {
        descricao: "Recebimento Teste",
        valor: 200,
        data_vencimento: "2024-01-15",
        status: "recebido",
        data_recebimento: "2024-01-20",
      });

      expect(result).toBe(true);
    });
  });

  describe("removeContaPagarExtrato", () => {
    it("deve executar sem erro", async () => {
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        }),
      });

      await expect(removeContaPagarExtrato(mockContaId)).resolves.not.toThrow();
    });
  });

  describe("removeContaReceberExtrato", () => {
    it("deve executar sem erro", async () => {
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        }),
      });

      await expect(removeContaReceberExtrato(mockContaId)).resolves.not.toThrow();
    });
  });
});
