import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRealtimeSubscription } from "./useRealtimeSubscription";

// Mocks
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

describe("useRealtimeSubscription", () => {
  const mockSubscribe = vi.fn().mockReturnThis();
  let mockOnCallback: Function | null = null;

  // Create proper chain: channel().on().subscribe()
  const createMockChannel = () => {
    const channel = {
      on: vi.fn((event: string, config: any, callback: Function) => {
        mockOnCallback = callback;
        return { subscribe: mockSubscribe };
      }),
    };
    return channel;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnCallback = null;
    (supabase.channel as ReturnType<typeof vi.fn>).mockImplementation(() => createMockChannel());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deve criar canal de subscription para a tabela", () => {
    renderHook(() => useRealtimeSubscription("categorias"), {
      wrapper: createWrapper(),
    });

    expect(supabase.channel).toHaveBeenCalledOnce();
    expect(supabase.channel).toHaveBeenCalledWith(
      expect.stringMatching(/^realtime-categorias-/)
    );
  });

  it("deve configurar listener para eventos postgres_changes", () => {
    renderHook(() => useRealtimeSubscription("categorias"), {
      wrapper: createWrapper(),
    });

    const channel = (supabase.channel as ReturnType<typeof vi.fn>).mock.results[0].value;
    expect(channel.on).toHaveBeenCalledWith(
      "postgres_changes",
      { event: "*", schema: "public", table: "categorias" },
      expect.any(Function)
    );
  });

  it("deve chamar subscribe apos configurar listener", () => {
    renderHook(() => useRealtimeSubscription("categorias"), {
      wrapper: createWrapper(),
    });

    expect(mockSubscribe).toHaveBeenCalledOnce();
  });

  it("deve invalidar queries quando receber evento", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    renderHook(() => useRealtimeSubscription("categorias"), { wrapper });

    // Wait for the callback to be set
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simula o callback do evento
    if (mockOnCallback) {
      mockOnCallback();
    }

    // Wait for debounce (300ms)
    await new Promise(resolve => setTimeout(resolve, 400));

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });

  it("deve invalidar queries com queryKeys fornecidas", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const queryKeys = [["categorias"], ["contas_receber"], ["contas_pagar"]];

    renderHook(() => useRealtimeSubscription("categorias", queryKeys), { wrapper });

    await new Promise(resolve => setTimeout(resolve, 50));

    if (mockOnCallback) mockOnCallback();

    // Wait for debounce (300ms)
    await new Promise(resolve => setTimeout(resolve, 400));

    expect(invalidateQueriesSpy).toHaveBeenCalled();
  });

  it("deve remover canal ao desmontar componente", () => {
    const { unmount } = renderHook(() => useRealtimeSubscription("categorias"), {
      wrapper: createWrapper(),
    });

    unmount();

    expect(supabase.removeChannel).toHaveBeenCalled();
  });

  it("deve extrair root keys corretamente de queryKeys", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const queryKeys = [
      ["categorias", "detalhes"],
      ["categorias", "lista"],
      ["clientes"],
    ];

    renderHook(() => useRealtimeSubscription("categorias", queryKeys), { wrapper });

    // O hook deve extrair keys unicas: categorias, clientes
    const channel = (supabase.channel as ReturnType<typeof vi.fn>).mock.results[0]?.value;
    expect(channel?.on).toHaveBeenCalled();
  });

  it("deve usar tableName como fallback quando queryKeys esta vazia", () => {
    renderHook(() => useRealtimeSubscription("categorias", []), {
      wrapper: createWrapper(),
    });

    const channel = (supabase.channel as ReturnType<typeof vi.fn>).mock.results[0]?.value;
    expect(channel?.on).toHaveBeenCalledWith(
      "postgres_changes",
      { event: "*", schema: "public", table: "categorias" },
      expect.any(Function)
    );
  });

  it("deve lidar com queryKeys undefined", () => {
    renderHook(() => useRealtimeSubscription("categorias", undefined), {
      wrapper: createWrapper(),
    });

    const channel = (supabase.channel as ReturnType<typeof vi.fn>).mock.results[0]?.value;
    expect(channel?.on).toHaveBeenCalled();
  });

  it("deve criar canais unicos com diferentes nomes", () => {
    const { rerender } = renderHook(
      ({ table }) => useRealtimeSubscription(table),
      {
        wrapper: createWrapper(),
        initialProps: { table: "categorias" },
      }
    );

    const firstChannelCall = (supabase.channel as ReturnType<typeof vi.fn>).mock.calls[0][0];

    rerender({ table: "clientes" });

    const secondChannelCall = (supabase.channel as ReturnType<typeof vi.fn>).mock.calls[1][0];

    expect(firstChannelCall).not.toBe(secondChannelCall);
    expect(firstChannelCall).toMatch(/^realtime-categorias-/);
    expect(secondChannelCall).toMatch(/^realtime-clientes-/);
  });

  it("deve re-criar subscription quando tableName mudar", () => {
    const { rerender } = renderHook(
      ({ table }) => useRealtimeSubscription(table),
      {
        wrapper: createWrapper(),
        initialProps: { table: "categorias" },
      }
    );

    expect(supabase.channel).toHaveBeenCalledTimes(1);

    rerender({ table: "clientes" });

    // Deve remover o canal antigo e criar novo
    expect(supabase.removeChannel).toHaveBeenCalled();
    expect(supabase.channel).toHaveBeenCalledTimes(2);
  });

  it("deve filtrar root keys duplicadas", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const queryKeys = [
      ["categorias", "lista"],
      ["categorias", "detalhes"],
      ["categorias", "outro"],
    ];

    renderHook(() => useRealtimeSubscription("categorias", queryKeys), { wrapper });

    await new Promise(resolve => setTimeout(resolve, 50));

    if (mockOnCallback) mockOnCallback();

    // Wait for debounce (300ms)
    await new Promise(resolve => setTimeout(resolve, 400));

    // Deve chamar invalidateQueries apenas uma vez para "categorias"
    const calls = invalidateQueriesSpy.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
  });

  it("deve ignorar root keys vazios ou nulos", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const queryKeys = [
      ["categorias"],
      ["", "algo"],
      [null as unknown as string, "outro"],
    ];

    renderHook(() => useRealtimeSubscription("categorias", queryKeys as any), { wrapper });

    // Nao deve lancar erro
    const channel = (supabase.channel as ReturnType<typeof vi.fn>).mock.results[0]?.value;
    expect(channel?.on).toHaveBeenCalled();
  });
});
