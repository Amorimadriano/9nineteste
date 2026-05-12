import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Tabelas financeiras para subscrição em tempo real
 * Monitora alterações em todas as tabelas financeiras principais
 * @constant
 */
const FINANCIAL_TABLES = [
  "bancos_cartoes",
  "categorias",
  "contas_pagar",
  "contas_receber",
  "extrato_bancario",
  "lancamentos_caixa",
] as const;

/**
 * Query keys de todas as tabelas financeiras relacionadas
 * Usado para invalidação em cascata quando qualquer tabela muda
 * @constant
 */
const FINANCIAL_QUERY_KEYS = [
  ["bancos_cartoes"],
  ["categorias"],
  ["clientes"],
  ["contas_pagar"],
  ["contas_receber"],
  ["extrato_bancario"],
  ["fechamentos_mensais"],
  ["fornecedores"],
  ["lancamentos_caixa"],
  ["metas_orcamentarias"],
];

type FinancialTable = typeof FINANCIAL_TABLES[number];

/**
 * Hook otimizado para subscrição realtime de todas as tabelas financeiras
 *
 * Configura um único canal Supabase Realtime que escuta todas as tabelas
 * financeiras principais, reduzindo o número de conexões WebSocket.
 * Usa debounce para evitar múltiplas invalidações rápidas.
 *
 * @example
 * ```typescript
 * // Em um componente de layout ou dashboard
 * function App() {
 *   useGlobalFinancialRealtime();
 *   return <AppLayout />;
 * }
 * ```
 *
 * @see {@link https://supabase.com/docs/guides/realtime}
 */
export function useGlobalFinancialRealtime() {
  const queryClient = useQueryClient();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced invalidation para batching
  const invalidateFinancialQueries = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const uniqueKeys = new Set(FINANCIAL_QUERY_KEYS.map(key => key[0]));
      uniqueKeys.forEach((rootKey) => {
        if (rootKey) {
          queryClient.invalidateQueries({
            predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === rootKey,
          });
        }
      });
    }, 300); // Debounce de 300ms
  }, [queryClient]);

  useEffect(() => {
    // Criar um único canal para todas as tabelas financeiras
    const channelName = `financial-realtime-${Math.random().toString(36).slice(2)}`;
    const channel = supabase.channel(channelName);

    // Adicionar listeners para cada tabela
    FINANCIAL_TABLES.forEach((tableName) => {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: tableName },
        () => {
          invalidateFinancialQueries();
        }
      );
    });

    // Subscrever ao canal
    channel.subscribe();

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [invalidateFinancialQueries]);
}
