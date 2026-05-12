/**
 * Hook para gerenciamento do Plano de Contas com automação inteligente
 * Integra com categorias financeiras e sugere mapeamentos automáticos
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { PlanoConta, MapeamentoContabil, MapeamentoSugestao } from "@/lib/planoContas/types";

const db: any = supabase;

const PLANO_CONTAS_QUERY_KEY = "plano_contas";
const MAPEAMENTOS_QUERY_KEY = "mapeamento_contabil";

export interface UsePlanoContasOptions {
  empresaId?: string | null;
  ativo?: boolean;
  natureza?: string;
  permiteLancamento?: boolean;
}

export function usePlanoContas(options: UsePlanoContasOptions = {}) {
  const { empresaId, ativo, natureza, permiteLancamento } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const planoContasQuery = useQuery({
    queryKey: [PLANO_CONTAS_QUERY_KEY, { empresaId, ativo, natureza, permiteLancamento }],
    queryFn: async () => {
      let query = db.from("plano_contas").select("*").order("codigo_conta");

      if (empresaId) query = query.eq("empresa_id", empresaId);
      if (ativo !== undefined) query = query.eq("ativo", ativo);
      if (natureza) query = query.eq("natureza", natureza);
      if (permiteLancamento !== undefined) query = query.eq("permite_lancamento", permiteLancamento);

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown) as PlanoConta[];
    },
  });

  const mapeamentosQuery = useQuery({
    queryKey: [MAPEAMENTOS_QUERY_KEY, { empresaId }],
    queryFn: async () => {
      let query = db
        .from("mapeamento_contabil")
        .select("*, categorias(nome), plano_contas(codigo_conta, descricao)");

      if (empresaId) query = query.eq("empresa_id", empresaId);

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown) as (MapeamentoContabil & {
        categorias?: { nome: string };
        plano_contas?: { codigo_conta: string; descricao: string };
      })[];
    },
  });

  const createConta = useMutation({
    mutationFn: async (conta: Omit<PlanoConta, "id" | "created_at" | "updated_at" | "user_id">) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      if (conta.tipo_conta === "sintetica" && conta.permite_lancamento) {
        conta.permite_lancamento = false;
      }

      const { data, error } = await db
        .from("plano_contas")
        .insert({ ...conta, user_id: user.user.id })
        .select()
        .single();

      if (error) throw error;
      return (data as unknown) as PlanoConta;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PLANO_CONTAS_QUERY_KEY] });
      toast({ title: "Conta criada com sucesso!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
    },
  });

  const updateConta = useMutation({
    mutationFn: async ({ id, ...conta }: Partial<PlanoConta> & { id: string }) => {
      const { data, error } = await db
        .from("plano_contas")
        .update(conta)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return (data as unknown) as PlanoConta;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PLANO_CONTAS_QUERY_KEY] });
      toast({ title: "Conta atualizada com sucesso!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar conta", description: error.message, variant: "destructive" });
    },
  });

  const deleteConta = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("plano_contas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PLANO_CONTAS_QUERY_KEY] });
      toast({ title: "Conta removida com sucesso!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao remover conta", description: error.message, variant: "destructive" });
    },
  });

  const criarPlanoPadrao = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      const { data, error } = await db.rpc("criar_plano_contas_padrao", {
        p_user_id: user.user.id,
        p_empresa_id: empresaId,
      });

      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: [PLANO_CONTAS_QUERY_KEY] });
      toast({ title: "Plano de contas padrão criado!", description: `${count} contas foram adicionadas.` });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar plano padrão", description: error.message, variant: "destructive" });
    },
  });

  const createMapeamento = useMutation({
    mutationFn: async (
      mapeamento: Omit<MapeamentoContabil, "id" | "created_at" | "updated_at" | "user_id">
    ) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      const { data, error } = await db
        .from("mapeamento_contabil")
        .insert({ ...mapeamento, user_id: user.user.id })
        .select()
        .single();

      if (error) throw error;
      return (data as unknown) as MapeamentoContabil;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MAPEAMENTOS_QUERY_KEY] });
      toast({ title: "Mapeamento criado com sucesso!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar mapeamento", description: error.message, variant: "destructive" });
    },
  });

  const updateMapeamento = useMutation({
    mutationFn: async ({ id, ...mapeamento }: Partial<MapeamentoContabil> & { id: string }) => {
      const { data, error } = await db
        .from("mapeamento_contabil")
        .update(mapeamento)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return (data as unknown) as MapeamentoContabil;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MAPEAMENTOS_QUERY_KEY] });
      toast({ title: "Mapeamento atualizado com sucesso!" });
    },
  });

  const deleteMapeamento = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("mapeamento_contabil").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MAPEAMENTOS_QUERY_KEY] });
      toast({ title: "Mapeamento removido com sucesso!" });
    },
  });

  const sugerirConta = async (
    categoriaId: string,
    tipoLancamento: "receita" | "despesa" | "transferencia"
  ): Promise<MapeamentoSugestao | null> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data, error } = await db.rpc("sugerir_conta_contabil", {
        p_user_id: user.user.id,
        p_empresa_id: empresaId,
        p_categoria_id: categoriaId,
        p_tipo_lancamento: tipoLancamento,
      });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const sugestao = data[0];
      return {
        plano_conta_id: sugestao.plano_conta_id,
        codigo_conta: sugestao.codigo_conta,
        descricao: sugestao.descricao,
        historico_padrao: sugestao.historico_padrao,
        centro_custo: sugestao.centro_custo,
        confianca: sugestao.confianca,
      };
    } catch (error) {
      console.error("Erro ao sugerir conta:", error);
      return null;
    }
  };

  const buscarContaPorCodigo = async (codigo: string): Promise<PlanoConta[]> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await db.rpc("buscar_conta_plano", {
        p_user_id: user.user.id,
        p_empresa_id: empresaId,
        p_codigo: codigo,
      });

      if (error) throw error;
      return data as PlanoConta[];
    } catch (error) {
      console.error("Erro ao buscar conta:", error);
      return [];
    }
  };

  const contas = planoContasQuery.data || [];
  const contasAnaliticas = contas.filter((c) => c.tipo_conta === "analitica" && c.permite_lancamento);
  const contasSinteticas = contas.filter((c) => c.tipo_conta === "sintetica");
  const contasPorNatureza = {
    ativa: contas.filter((c) => c.natureza === "ativa"),
    passiva: contas.filter((c) => c.natureza === "passiva"),
    receita: contas.filter((c) => c.natureza === "receita"),
    despesa: contas.filter((c) => c.natureza === "despesa"),
    compensacao: contas.filter((c) => c.natureza === "compensacao"),
  };

  const estatisticas = {
    total: contas.length,
    sinteticas: contasSinteticas.length,
    analiticas: contasAnaliticas.length,
    ativas: contas.filter((c) => c.ativo).length,
    comLancamento: contas.filter((c) => c.permite_lancamento).length,
    mapeamentos: mapeamentosQuery.data?.length || 0,
  };

  return {
    contas,
    contasAnaliticas,
    contasSinteticas,
    contasPorNatureza,
    mapeamentos: mapeamentosQuery.data || [],
    estatisticas,
    isLoading: planoContasQuery.isLoading || mapeamentosQuery.isLoading,
    isError: planoContasQuery.isError || mapeamentosQuery.isError,
    createConta,
    updateConta,
    deleteConta,
    criarPlanoPadrao,
    createMapeamento,
    updateMapeamento,
    deleteMapeamento,
    sugerirConta,
    buscarContaPorCodigo,
    refetch: () => {
      planoContasQuery.refetch();
      mapeamentosQuery.refetch();
    },
  };
}

export default usePlanoContas;
