import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useToast } from "@/hooks/use-toast";
import { useMemo, useCallback } from "react";

/**
 * Nomes das tabelas disponíveis no sistema
 * @typedef {string} TableName
 */
type TableName = "categorias" | "clientes" | "fornecedores" | "contas_receber" | "contas_pagar" | "lancamentos_caixa" | "bancos_cartoes" | "extrato_bancario" | "metas_orcamentarias" | "fechamentos_mensais" | "cobranca_historico";

/**
 * Tabelas relacionadas para invalidação em cascata
 * Quando uma tabela é modificada, todas essas são invalidadas
 * para manter consistência entre dados relacionados
 * @constant
 */
const RELATED_TABLES: TableName[] = [
  "contas_pagar",
  "contas_receber",
  "lancamentos_caixa",
  "categorias",
  "bancos_cartoes",
  "metas_orcamentarias",
  "fechamentos_mensais",
  "extrato_bancario",
];

/**
 * Configuração de cache por tipo de tabela
 * Tabelas com dados que mudam frequentemente têm cache mais curto
 * @constant
 */
const TABLE_CACHE_CONFIG: Record<TableName, { staleTime: number; gcTime: number }> = {
  // Dados que mudam frequentemente - cache curto (30s stale, 2min gc)
  contas_receber: { staleTime: 1000 * 30, gcTime: 1000 * 60 * 2 },
  contas_pagar: { staleTime: 1000 * 30, gcTime: 1000 * 60 * 2 },
  lancamentos_caixa: { staleTime: 1000 * 30, gcTime: 1000 * 60 * 2 },
  extrato_bancario: { staleTime: 1000 * 30, gcTime: 1000 * 60 * 2 },

  // Dados que mudam menos frequentemente - cache médio (2min stale, 10min gc)
  clientes: { staleTime: 1000 * 60 * 2, gcTime: 1000 * 60 * 10 },
  fornecedores: { staleTime: 1000 * 60 * 2, gcTime: 1000 * 60 * 10 },
  bancos_cartoes: { staleTime: 1000 * 60 * 2, gcTime: 1000 * 60 * 10 },

  // Dados que raramente mudam - cache longo (5min stale, 30min gc)
  categorias: { staleTime: 1000 * 60 * 5, gcTime: 1000 * 60 * 30 },
  metas_orcamentarias: { staleTime: 1000 * 60 * 2, gcTime: 1000 * 60 * 10 },
  fechamentos_mensais: { staleTime: 1000 * 60 * 5, gcTime: 1000 * 60 * 30 },
  cobranca_historico: { staleTime: 1000 * 60 * 2, gcTime: 1000 * 60 * 10 },
};

/**
 * Invalida queries de tabelas específicas de forma otimizada
 * Usa batching para evitar múltiplas re-renderizações
 */
function invalidateTables(queryClient: ReturnType<typeof useQueryClient>, tables: TableName[]) {
  const uniqueTables = Array.from(new Set(tables));

  // Agendar invalidações para o próximo tick (batching)
  setTimeout(() => {
    uniqueTables.forEach((tableName) => {
      queryClient.invalidateQueries({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === tableName,
      });
    });
  }, 0);
}

function normalizeTableRows(table: TableName, data: any[]) {
  if (table !== "lancamentos_caixa") {
    return data;
  }

  return data.filter((row) => row?.conta_pagar_id || row?.conta_receber_id);
}

/**
 * Hook para consulta otimizada de tabelas Supabase
 *
 * Realiza queries na tabela especificada com cache otimizado por tipo de tabela.
 * Configura automaticamente staleTime e gcTime baseado na frequência de alteração
 * esperada dos dados.
 *
 * @param table - Nome da tabela a consultar
 * @param options - Opções de query opcionais
 * @param options.select - Campos a selecionar (default: "*")
 * @param options.orderBy - Campo para ordenação (default: "created_at")
 * @param options.ascending - Ordem ascendente (default: false)
 * @returns Objeto useQuery do TanStack Query com dados e estados
 *
 * @example
 * ```typescript
 * // Query básica
 * const { data: categorias, isLoading } = useTableQuery("categorias");
 *
 * // Query com seleção de campos e ordenação
 * const { data: clientes } = useTableQuery("clientes", {
 *   select: "id, nome, email",
 *   orderBy: "nome",
 *   ascending: true
 * });
 * ```
 *
 * @see {@link https://tanstack.com/query/latest/docs/framework/react/reference/useQuery}
 */
export function useTableQuery(table: TableName, options?: { select?: string; orderBy?: string; ascending?: boolean }) {
  const { user } = useAuth();
  const { empresaSelecionada } = useEmpresa();

  // Memoizar configurações de cache baseado na tabela
  const cacheConfig = useMemo(() => TABLE_CACHE_CONFIG[table] || {
    staleTime: 1000 * 60,     // 1 minuto default
    gcTime: 1000 * 60 * 5,    // 5 minutos default
  }, [table]);

  return useQuery({
    queryKey: [table, user?.id, empresaSelecionada?.id, options?.select, options?.orderBy],
    queryFn: useCallback(async () => {
      let query = (supabase.from(table) as any).select(options?.select || "*");
      if (empresaSelecionada?.id) {
        query = query.eq("empresa_id", empresaSelecionada.id);
      }
      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? false });
      } else {
        query = query.order("created_at", { ascending: false });
      }
      const { data, error } = await query;
      if (error) throw error;
      return normalizeTableRows(table, data ?? []);
    }, [table, options?.select, options?.orderBy, options?.ascending, empresaSelecionada?.id]),
    enabled: !!user,
    // Usar configurações de cache específicas por tabela
    staleTime: cacheConfig.staleTime,
    gcTime: cacheConfig.gcTime,
    // Não refetch automaticamente no mount se dados estiverem frescos
    refetchOnMount: true,
    // Retry com backoff exponencial
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

/**
 * Hook para mutações (INSERT, UPDATE, DELETE) em tabelas Supabase
 *
 * Fornece três mutations pré-configuradas: insert, update e remove.
 * Automaticamente invalida o cache das tabelas relacionadas após cada operação.
 * Exibe toast de sucesso ou erro.
 *
 * @param table - Nome da tabela para as operações
 * @returns Objeto com tr mutations: insert, update, remove
 *
 * @example
 * ```typescript
 * const { insert, update, remove } = useTableMutation("categorias");
 *
 * // Criar registro
 * insert.mutate({ nome: "Nova Categoria", tipo: "despesa" });
 *
 * // Atualizar registro
 * update.mutate({ id: "uuid", nome: "Categoria Atualizada" });
 *
 * // Remover registro
 * remove.mutate("uuid");
 * ```
 *
 * @see {@link https://tanstack.com/query/latest/docs/framework/react/reference/useMutation}
 */
export function useTableMutation(table: TableName) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { empresaSelecionada } = useEmpresa();
  const { toast } = useToast();

  // Memoizar função de invalidação para evitar re-criação
  const invalidateRelatedData = useCallback(() => {
    invalidateTables(queryClient, [table, ...RELATED_TABLES]);
  }, [queryClient, table]);

  // Memoizar handlers de sucesso/erro
  const handleSuccess = useCallback((action: string) => {
    invalidateRelatedData();
    toast({ title: `Registro ${action} com sucesso!` });
  }, [invalidateRelatedData, toast]);

  const handleError = useCallback((action: string, error: any) => {
    toast({
      title: `Erro ao ${action}`,
      description: error.message,
      variant: "destructive",
    });
  }, [toast]);

  const insert = useMutation({
    mutationFn: useCallback(async (values: Record<string, any>) => {
      const payload: Record<string, any> = { ...values, user_id: user!.id };
      if (empresaSelecionada?.id) {
        payload.empresa_id = empresaSelecionada.id;
      }
      const { data, error } = await (supabase.from(table) as any)
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    }, [table, user, empresaSelecionada?.id]),
    onSuccess: () => handleSuccess("criado"),
    onError: (error: any) => handleError("criar", error),
  });

  const update = useMutation({
    mutationFn: useCallback(async ({ id, ...values }: Record<string, any>) => {
      const { data, error } = await (supabase.from(table) as any)
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }, [table]),
    onSuccess: () => handleSuccess("atualizado"),
    onError: (error: any) => handleError("atualizar", error),
  });

  const remove = useMutation({
    mutationFn: useCallback(async (id: string) => {
      const { error } = await (supabase.from(table) as any).delete().eq("id", id);
      if (error) throw error;
    }, [table]),
    onSuccess: () => handleSuccess("excluído"),
    onError: (error: any) => handleError("excluir", error),
  });

  // Retornar objeto memoizado para evitar re-renders desnecessários em componentes
  return useMemo(() => ({
    insert,
    update,
    remove,
  }), [insert, update, remove]);
}
