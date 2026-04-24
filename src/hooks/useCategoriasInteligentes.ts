/**
 * Hook para gerenciamento inteligente de categorias com automação contábil
 * Sugere automaticamente contas do plano de contas baseado no nome da categoria
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Bypass typing for tables not present in generated types
const db: any = supabase;
import { useToast } from "@/hooks/use-toast";
import {
  PLANOS_PADRAO_CFC,
  obterNaturezaPorCodigo,
} from "@/lib/planoContas/types";
import type { PlanoConta } from "@/lib/planoContas/types";

export interface Categoria {
  id: string;
  user_id: string;
  nome: string;
  tipo: "receita" | "despesa";
  descricao: string | null;
  ativo: boolean;
  plano_conta_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoriaComPlano extends Categoria {
  plano_conta?: PlanoConta | null;
  sugestaoAutomatica?: {
    codigo: string;
    descricao: string;
    natureza: string;
  } | null;
}

export interface SugestaoMapeamento {
  categoriaId: string;
  categoriaNome: string;
  tipo: "receita" | "despesa";
  contaSugerida: {
    codigo: string;
    descricao: string;
    natureza: string;
  } | null;
  confianca: number;
}

const CATEGORIAS_QUERY_KEY = "categorias";

export function useCategoriasInteligentes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query para categorias com join no plano de contas
  const categoriasQuery = useQuery({
    queryKey: [CATEGORIAS_QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("categorias")
        .select("*, plano_contas(*)")
        .eq("ativo", true)
        .order("tipo", { ascending: false })
        .order("nome");

      if (error) throw error;
      return data as unknown as (Categoria & { plano_contas?: PlanoConta })[];
    },
  });

  // Query para plano de contas (para sugestões)
  const planoContasQuery = useQuery({
    queryKey: ["plano_contas_analitico"],
    queryFn: async () => {
      const { data, error } = await db
        .from("plano_contas")
        .select("*")
        .eq("tipo_conta", "analitica")
        .eq("ativo", true)
        .order("codigo_conta");

      if (error) throw error;
      return data as unknown as PlanoConta[];
    },
  });

  // Mutation para criar categoria com vinculação automática
  const createCategoria = useMutation({
    mutationFn: async (categoria: {
      nome: string;
      tipo: "receita" | "despesa";
      descricao?: string;
      plano_conta_id?: string | null;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      // Buscar sugestão automática se não informado plano_conta_id
      let planoContaId = categoria.plano_conta_id;
      if (!planoContaId) {
        const sugestao = buscarSugestaoPorNome(categoria.nome, categoria.tipo);
        if (sugestao) {
          const conta = await encontrarOuCriarConta(sugestao, user.user.id);
          if (conta) planoContaId = conta.id;
        }
      }

      const { data, error } = await (supabase as any)
        .from("categorias")
        .insert({
          ...categoria,
          user_id: user.user.id,
          plano_conta_id: planoContaId,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Categoria;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIAS_QUERY_KEY] });
      toast({ title: "Categoria criada com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar categoria
  const updateCategoria = useMutation({
    mutationFn: async ({
      id,
      ...categoria
    }: Partial<Categoria> & { id: string }) => {
      const { data, error } = await db
        .from("categorias")
        .update(categoria)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Categoria;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIAS_QUERY_KEY] });
      toast({ title: "Categoria atualizada com sucesso!" });
    },
  });

  // Mutation para deletar categoria
  const deleteCategoria = useMutation({
    mutationFn: async (id: string) => {
      // Verificar se há lançamentos vinculados
      const { data: lancamentos } = await supabase
        .from("lancamentos_caixa")
        .select("id")
        .eq("categoria_id", id)
        .limit(1);

      if (lancamentos && lancamentos.length > 0) {
        throw new Error(
          "Não é possível excluir: existem lançamentos vinculados a esta categoria"
        );
      }

      const { error } = await supabase.from("categorias").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIAS_QUERY_KEY] });
      toast({ title: "Categoria removida com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para vincular categoria a conta contábil
  const vincularConta = useMutation({
    mutationFn: async ({
      categoriaId,
      planoContaId,
    }: {
      categoriaId: string;
      planoContaId: string;
    }) => {
      const { data, error } = await (supabase as any)
        .from("categorias")
        .update({ plano_conta_id: planoContaId })
        .eq("id", categoriaId)
        .select()
        .single();

      if (error) throw error;
      return data as Categoria;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIAS_QUERY_KEY] });
      toast({ title: "Vinculação realizada com sucesso!" });
    },
  });

  // Função para buscar sugestão baseada no nome da categoria
  const buscarSugestaoPorNome = (
    nome: string,
    tipo: "receita" | "despesa"
  ): { codigo: string; descricao: string; natureza: string } | null => {
    const nomeLower = nome.toLowerCase();
    const planos = Object.entries(PLANOS_PADRAO_CFC);

    // Mapeamento de palavras-chave para códigos
    const keywordMap: Record<string, string[]> = {
      receita: ["3"],
      venda: ["3.1.01"],
      servico: ["3.1.02"],
      consultoria: ["3.1.02.0001"],
      "bpo financeiro": ["3.1.02.0002"],
      contabil: ["3.1.02.0003"],
      juros: ["3.2.01.0001"],
      desconto: ["3.2.01.0002"],
      salario: ["4.1.01.0001"],
      ordenado: ["4.1.01.0001"],
      encargo: ["4.1.01.0002"],
      fgts: ["4.1.01.0003", "2.1.03.0006"],
      beneficio: ["4.1.01.0004"],
      aluguel: ["4.1.02.0001"],
      condominio: ["4.1.02.0002"],
      energia: ["4.1.02.0003"],
      luz: ["4.1.02.0003"],
      agua: ["4.1.02.0004"],
      esgoto: ["4.1.02.0004"],
      telefone: ["4.1.02.0005"],
      internet: ["4.1.02.0005"],
      escritorio: ["4.1.02.0006"],
      material: ["4.1.02.0006"],
      manutencao: ["4.1.02.0007"],
      conservacao: ["4.1.02.0007"],
      contador: ["4.1.02.0008"],
      advogado: ["4.1.02.0008"],
      publicidade: ["4.1.03.0001"],
      propaganda: ["4.1.03.0001"],
      marketing: ["4.1.03.0002"],
      tarifa: ["4.1.04.0003"],
      bancaria: ["4.1.04.0003"],
      iss: ["4.1.05.0001", "2.1.03.0002"],
      iptu: ["4.1.05.0002"],
      taxa: ["4.1.05.0003"],
    };

    // Procurar por palavras-chave no nome
    for (const [keyword, codigos] of Object.entries(keywordMap)) {
      if (nomeLower.includes(keyword)) {
        const codigo = codigos[0];
        const plano = PLANOS_PADRAO_CFC[codigo as keyof typeof PLANOS_PADRAO_CFC];
        if (plano) {
          // Verifica se a natureza corresponde ao tipo
          const naturezaEsperada = tipo === "receita" ? "receita" : "despesa";
          if (plano.natureza === naturezaEsperada) {
            return {
              codigo,
              descricao: plano.descricao,
              natureza: plano.natureza,
            };
          }
        }
      }
    }

    // Fallback: retorna conta genérica baseada no tipo
    if (tipo === "receita") {
      return {
        codigo: "3.1.02.0001",
        descricao: "Serviços de Consultoria",
        natureza: "receita",
      };
    }

    return {
      codigo: "4.1.02.0006",
      descricao: "Material de Escritório",
      natureza: "despesa",
    };
  };

  // Função auxiliar para encontrar ou criar conta no plano de contas
  const encontrarOuCriarConta = async (
    sugestao: { codigo: string; descricao: string; natureza: string },
    userId: string
  ): Promise<PlanoConta | null> => {
    // Tentar encontrar conta existente
    const { data: existente } = await db
      .from("plano_contas")
      .select("*")
      .eq("codigo_conta", sugestao.codigo)
      .eq("user_id", userId)
      .single();

    if (existente) return existente as PlanoConta;

    // Criar conta se não existir
    const codigoPai = sugestao.codigo.split(".").slice(0, -1).join(".");
    const nivel = sugestao.codigo.split(".").length;

    const { data: novaConta, error } = await db
      .from("plano_contas")
      .insert({
        user_id: userId,
        codigo_conta: sugestao.codigo,
        codigo_pai: codigoPai || null,
        nivel,
        tipo_conta: "analitica",
        natureza: sugestao.natureza,
        descricao: sugestao.descricao,
        descricao_reduzida: sugestao.descricao.substring(0, 20),
        ativo: true,
        permite_lancamento: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar conta:", error);
      return null;
    }

    return novaConta as PlanoConta;
  };

  // Função para gerar sugestões de mapeamento para todas as categorias
  const gerarSugestoesMapeamento = (): SugestaoMapeamento[] => {
    const categorias = categoriasQuery.data || [];
    const sugestoes: SugestaoMapeamento[] = [];

    for (const categoria of categorias) {
      const sugestao = buscarSugestaoPorNome(categoria.nome, categoria.tipo);
      sugestoes.push({
        categoriaId: categoria.id,
        categoriaNome: categoria.nome,
        tipo: categoria.tipo,
        contaSugerida: sugestao,
        confianca: sugestao ? 80 : 0,
      });
    }

    return sugestoes;
  };

  // Função para aplicar mapeamentos sugeridos automaticamente (usando RPC)
  const aplicarMapeamentosAutomaticos = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return 0;

    // Buscar empresa do usuário
    const { data: empresa } = await supabase
      .from("empresa")
      .select("id")
      .eq("user_id", user.user.id)
      .maybeSingle();

    // Chamar função de sincronização do banco
    const { data, error } = await supabase.rpc("sincronizar_categorias_plano_contas" as any, {
      p_user_id: user.user.id,
      p_empresa_id: empresa?.id || null,
    });

    if (error) {
      toast({
        title: "Erro na sincronização",
        description: error.message,
        variant: "destructive",
      });
      return 0;
    }

    const count = data?.length || 0;

    queryClient.invalidateQueries({ queryKey: [CATEGORIAS_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: ["plano_contas_analitico"] });

    toast({
      title: "Sincronização concluída!",
      description: `${count} categorias vinculadas automaticamente ao plano de contas.`,
    });

    return count;
  };

  // Função para verificar e criar plano de contas padrão
  const verificarCriarPlanoPadrao = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return 0;

    const { data: empresa } = await supabase
      .from("empresa")
      .select("id")
      .eq("user_id", user.user.id)
      .maybeSingle();

    const { data, error } = await supabase.rpc("verificar_ou_criar_plano_padrao" as any, {
      p_user_id: user.user.id,
      p_empresa_id: empresa?.id || null,
    });

    if (error) {
      console.error("Erro ao criar plano padrão:", error);
      return 0;
    }

    if ((data as any) > 0) {
      queryClient.invalidateQueries({ queryKey: ["plano_contas_analitico"] });
      toast({
        title: "Plano de contas criado!",
        description: `${data} contas do plano padrão CFC foram criadas.`,
      });
    }

    return data || 0;
  };

  // Helpers para filtros
  const categoriasReceita = (categoriasQuery.data || []).filter(
    (c) => c.tipo === "receita"
  );
  const categoriasDespesa = (categoriasQuery.data || []).filter(
    (c) => c.tipo === "despesa"
  );
  const categoriasVinculadas = (categoriasQuery.data || []).filter(
    (c) => c.plano_conta_id
  );
  const categoriasNaoVinculadas = (categoriasQuery.data || []).filter(
    (c) => !c.plano_conta_id
  );

  return {
    // Dados
    categorias: categoriasQuery.data || [],
    categoriasReceita,
    categoriasDespesa,
    categoriasVinculadas,
    categoriasNaoVinculadas,
    planoContas: planoContasQuery.data || [],

    // Loading states
    isLoading: categoriasQuery.isLoading || planoContasQuery.isLoading,
    isError: categoriasQuery.isError || planoContasQuery.isError,

    // Mutations
    createCategoria,
    updateCategoria,
    deleteCategoria,
    vincularConta,

    // Funções auxiliares
    buscarSugestaoPorNome,
    gerarSugestoesMapeamento,
    aplicarMapeamentosAutomaticos,
    verificarCriarPlanoPadrao,

    // Refetch
    refetch: () => {
      categoriasQuery.refetch();
      planoContasQuery.refetch();
    },
  };
}

export default useCategoriasInteligentes;
