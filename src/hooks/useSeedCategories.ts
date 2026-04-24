import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Hook para seed de categorias padrão
 *
 * Executa uma RPC Supabase para criar categorias padrão quando o usuário
 * faz login pela primeira vez. Garante que só execute uma vez por sessão
 * usando useRef para controle.
 *
 * As categorias criadas incluem:
 * - Receitas Operacionais (1.x)
 * - Impostos e Deduções (2.x)
 * - Custos Variáveis (2.4, 2.5)
 * - Gastos com Pessoal (2.3)
 * - Gastos com Ocupação (3.3)
 * - Serviços de Terceiros (3.30, 3.31, 3.32)
 * - Marketing (3.1)
 * - Material de Escritório (3.311)
 * - Gastos Não Operacionais (3.4, 3.5, 4.x, 5.x)
 * - IR e CSLL (2.107, 2.108)
 *
 * @example
 * ```typescript
 * function App() {
 *   useSeedCategories(); // Executa automaticamente no mount
 *   return <AppLayout />;
 * }
 * ```
 *
 * @see {@link https://supabase.com/docs/guides/database/functions}
 */
export function useSeedCategories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const seeded = useRef(false);

  useEffect(() => {
    if (!user || seeded.current) return;
    seeded.current = true;

    (supabase.rpc as any)("seed_default_categories", { p_user_id: user.id }).then(({ error }: any) => {
      if (!error) {
        queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "categorias" });
      }
    });
  }, [user, queryClient]);
}
