import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useGlobalFinancialRealtime } from "./useGlobalFinancialRealtime";

// Mock do supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

import { supabase } from "@/integrations/supabase/client";
import React from "react";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useGlobalFinancialRealtime", () => {
  const mockOn = vi.fn();
  const mockSubscribe = vi.fn();
  let mockChannel: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock channel that supports: channel.on().on().subscribe()
    // on() returns the channel (for chaining multiple on calls)
    mockOn.mockImplementation(() => mockChannel);
    mockChannel = {
      on: mockOn,
      subscribe: mockSubscribe,
    };
    (supabase.channel as ReturnType<typeof vi.fn>).mockReturnValue(mockChannel);
  });

  it("deve criar subscriptions para todas as tabelas financeiras", () => {
    renderHook(() => useGlobalFinancialRealtime(), {
      wrapper: createWrapper(),
    });

    // Should create one channel
    expect(supabase.channel).toHaveBeenCalledOnce();

    // Should call on() for each table (6 tables)
    expect(mockOn).toHaveBeenCalledTimes(6);

    // Get all table names from calls
    const tables = mockOn.mock.calls.map((call) => call[1]?.table);
    expect(tables).toContain("bancos_cartoes");
    expect(tables).toContain("categorias");
    expect(tables).toContain("contas_pagar");
    expect(tables).toContain("contas_receber");
    expect(tables).toContain("extrato_bancario");
    expect(tables).toContain("lancamentos_caixa");
  });

  it("deve retornar undefined (hook nao retorna valor)", () => {
    const { result } = renderHook(() => useGlobalFinancialRealtime(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeUndefined();
  });

  it("deve chamar subscribe no canal", () => {
    renderHook(() => useGlobalFinancialRealtime(), {
      wrapper: createWrapper(),
    });

    expect(mockSubscribe).toHaveBeenCalledOnce();
  });
});
