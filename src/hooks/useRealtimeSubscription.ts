import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Debounce helper para batching de invalidações
function useDebouncedInvalidate() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keysToInvalidateRef = useRef<Set<string>>(new Set());
  const queryClientRef = useRef<ReturnType<typeof useQueryClient> | null>(null);

  const invalidate = useCallback((keys: string[], queryClient: ReturnType<typeof useQueryClient>) => {
    // Armazenar queryClient e keys
    queryClientRef.current = queryClient;
    keys.forEach(key => keysToInvalidateRef.current.add(key));

    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Agendar invalidação com debounce de 300ms
    timeoutRef.current = setTimeout(() => {
      if (queryClientRef.current) {
        keysToInvalidateRef.current.forEach((rootKey) => {
          queryClientRef.current?.invalidateQueries({
            predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === rootKey,
          });
        });
        // Limpar keys após invalidação
        keysToInvalidateRef.current.clear();
      }
    }, 300);
  }, []);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return invalidate;
}

/**
 * Hook para subscrição em tempo real do Supabase com debounce otimizado
 *
 * Escuta alterações em uma tabela do Supabase via Realtime e invalida
 * automaticamente as queries do TanStack Query quando ocorrem mudanças.
 * Usa debounce de 300ms para agrupar múltiplos eventos e evitar re-renders excessivos.
 *
 * @param tableName - Nome da tabela a ser monitorada
 * @param queryKeys - Array de query keys a serem invalidadas (opcional)
 *                    Se não fornecido, invalida apenas a tabela monitorada
 *
 * @example
 * ```typescript
 * // Uso básico
 * useRealtimeSubscription("categorias");
 *
 * // Com múltiplas query keys
 * useRealtimeSubscription("contas_pagar", [
 *   ["contas_pagar"],
 *   ["extrato_bancario"],
 *   ["lancamentos_caixa"]
 * ]);
 * ```
 *
 * @see {@link https://supabase.com/docs/guides/realtime}
 */
export function useRealtimeSubscription(tableName: string, queryKeys?: string[][]) {
  const queryClient = useQueryClient();
  const debouncedInvalidate = useDebouncedInvalidate();

  // Memoizar rootKeys para evitar re-calculo
  const rootKeys = useCallback(() => {
    return Array.from(
      new Set(
        (queryKeys?.length ? queryKeys : [[tableName]])
          .map((key) => key[0])
          .filter((key): key is string => Boolean(key))
      )
    );
  }, [queryKeys, tableName]);

  const rootKeySignature = rootKeys().join("|");

  useEffect(() => {
    const keysToInvalidate = rootKeySignature ? rootKeySignature.split("|") : [tableName];

    const channel = supabase
      .channel(`realtime-${tableName}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: tableName },
        () => {
          // Usar debounce para agrupar invalidações
          debouncedInvalidate(keysToInvalidate, queryClient);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, rootKeySignature, tableName, debouncedInvalidate]);
}
