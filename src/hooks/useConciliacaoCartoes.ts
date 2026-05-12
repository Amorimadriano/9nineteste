/**
 * Hook de Conciliação de Cartões
 * Gerencia estado e operações de conciliação de cartões
 * @agente-financeiro
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type {
  TransacaoCartao,
  SugestaoMatchCartao,
  CandidatoConciliacao,
  FiltrosTransacaoCartao,
  ResumoConciliacaoCartao,
} from '@/types/cartoes';
import { calcularScoreMatch, formatarMoeda, CONFIG_BANDEIRAS } from '@/lib/cartoes';

// Bypass typing for tables not present in generated types
const db: any = supabase;

interface UseConciliacaoCartoesProps {
  empresaId: string;
  filtros?: FiltrosTransacaoCartao;
}

interface UseConciliacaoCartoesReturn {
  // Dados
  transacoes: TransacaoCartao[];
  transacoesFiltradas: TransacaoCartao[];
  sugestoes: Record<string, SugestaoMatchCartao[]>;
  resumo: ResumoConciliacaoCartao;

  // Estado
  isLoading: boolean;
  isProcessing: boolean;
  selectedIds: string[];

  // Ações
  setSelectedIds: (ids: string[]) => void;
  conciliarAutomatico: () => Promise<number>;
  conciliarManual: (transacaoId: string, candidatoId: string, candidatoTipo: string) => Promise<void>;
  desconciliar: (transacaoId: string) => Promise<void>;
  buscarSugestoes: (transacaoId: string) => Promise<SugestaoMatchCartao[]>;
  importarTransacoes: (transacoes: Partial<TransacaoCartao>[]) => Promise<void>;
  excluirTransacao: (transacaoId: string) => Promise<void>;

  // Helpers
  getTransacaoById: (id: string) => TransacaoCartao | undefined;
  calcularScore: (transacao: TransacaoCartao, candidato: CandidatoConciliacao) => { score: number; motivo: string };
}

export function useConciliacaoCartoes({
  empresaId,
  filtros = {},
}: UseConciliacaoCartoesProps): UseConciliacaoCartoesReturn {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Query para buscar transações
  const { data: transacoes = [], isLoading } = useQuery({
    queryKey: ['transacoes_cartao', empresaId, filtros],
    queryFn: async () => {
      let query = db
        .from('transacoes_cartao')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('data_transacao', { ascending: false });

      if (filtros.bandeira && filtros.bandeira !== 'todos') {
        query = query.eq('bandeira', filtros.bandeira);
      }

      if (filtros.status && filtros.status !== 'todos') {
        query = query.eq('status', filtros.status);
      }

      if (filtros.data_inicio) {
        query = query.gte('data_transacao', filtros.data_inicio);
      }

      if (filtros.data_fim) {
        query = query.lte('data_transacao', filtros.data_fim);
      }

      if (filtros.valor_minimo) {
        query = query.gte('valor_liquido', filtros.valor_minimo);
      }

      if (filtros.valor_maximo) {
        query = query.lte('valor_liquido', filtros.valor_maximo);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TransacaoCartao[];
    },
    enabled: !!empresaId,
  });

  // Aplicar filtro de busca em memória
  const transacoesFiltradas = useMemo(() => {
    if (!filtros.busca) return transacoes;

    const termo = filtros.busca.toLowerCase();
    return transacoes.filter((t) => {
      const matchDescricao = t.linha_extrato?.toLowerCase().includes(termo);
      const matchCartao = t.numero_cartao_mascara?.includes(termo);
      const matchValor = t.valor_bruto.toString().includes(termo);
      const matchNsu = t.nsu?.toLowerCase().includes(termo);
      return matchDescricao || matchCartao || matchValor || matchNsu;
    });
  }, [transacoes, filtros.busca]);

  // Calcular resumo
  const resumo = useMemo(() => {
    const total = transacoes.length;
    const conciliados = transacoes.filter((t) => t.status === 'conciliado').length;
    const pendentes = transacoes.filter((t) => t.status === 'pendente').length;
    const divergentes = transacoes.filter((t) => t.status === 'divergente').length;
    const chargebacks = transacoes.filter((t) => t.status === 'chargeback').length;

    const valorBrutoTotal = transacoes.reduce((s, t) => s + t.valor_bruto, 0);
    const valorTaxasTotal = transacoes.reduce((s, t) => s + t.valor_taxa, 0);
    const valorLiquidoTotal = transacoes.reduce((s, t) => s + t.valor_liquido, 0);

    return {
      total_transacoes: total,
      total_conciliados: conciliados,
      total_pendentes: pendentes,
      total_divergentes: divergentes,
      total_chargebacks: chargebacks,
      valor_bruto_total: valorBrutoTotal,
      valor_taxas_total: valorTaxasTotal,
      valor_liquido_total: valorLiquidoTotal,
      taxa_sucesso: total > 0 ? (conciliados / total) * 100 : 0,
    };
  }, [transacoes]);

  // Sugestões de match (mock - em produção viria da API)
  const sugestoes = useMemo(() => {
    const sugs: Record<string, SugestaoMatchCartao[]> = {};

    transacoes
      .filter((t) => t.status === 'pendente')
      .forEach((t) => {
        // Gerar sugestões mock baseadas no valor
        sugs[t.id] = [
          {
            transacao_id: t.id,
            candidato_id: `cand-${t.id}-1`,
            candidato_tipo: 'conta_receber',
            score: Math.floor(Math.random() * 30) + 70, // 70-100
            motivo: 'Valor e data próximos',
          },
          {
            transacao_id: t.id,
            candidato_id: `cand-${t.id}-2`,
            candidato_tipo: 'lancamento',
            score: Math.floor(Math.random() * 20) + 50, // 50-70
            motivo: 'Data próxima',
          },
        ];
      });

    return sugs;
  }, [transacoes]);

  // Mutation: Conciliar manualmente
  const conciliarMutation = useMutation({
    mutationFn: async ({
      transacaoId,
      candidatoId,
      candidatoTipo,
    }: {
      transacaoId: string;
      candidatoId: string;
      candidatoTipo: string;
    }) => {
      const { error } = await db
        .from('transacoes_cartao')
        .update({
          status: 'conciliado',
          conciliado_com: candidatoId,
          conciliado_tipo: candidatoTipo,
          conciliado_em: new Date().toISOString(),
          score_conciliacao: 100,
        })
        .eq('id', transacaoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes_cartao'] });
      toast({
        title: 'Conciliação realizada',
        description: 'Transação conciliada com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro na conciliação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Desconciliar
  const desconciliarMutation = useMutation({
    mutationFn: async (transacaoId: string) => {
      const { error } = await db
        .from('transacoes_cartao')
        .update({
          status: 'pendente',
          conciliado_com: null,
          conciliado_tipo: null,
          conciliado_em: null,
          score_conciliacao: null,
        })
        .eq('id', transacaoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes_cartao'] });
      toast({
        title: 'Desconciliação realizada',
        description: 'Transação desconciliada com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Importar transações
  const importarMutation = useMutation({
    mutationFn: async (novasTransacoes: Partial<TransacaoCartao>[]) => {
      const userResp = await supabase.auth.getUser();
      const userId = userResp.data.user?.id;
      const transacoesComEmpresa = novasTransacoes.map((t) => ({
        ...t,
        empresa_id: empresaId,
        user_id: userId,
      }));

      const { error } = await db
        .from('transacoes_cartao')
        .insert(transacoesComEmpresa);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes_cartao'] });
      toast({
        title: 'Importação concluída',
        description: 'Transações importadas com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro na importação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Excluir transação
  const excluirMutation = useMutation({
    mutationFn: async (transacaoId: string) => {
      const { error } = await db
        .from('transacoes_cartao')
        .delete()
        .eq('id', transacaoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes_cartao'] });
      toast({
        title: 'Transação excluída',
        description: 'A transação foi removida com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Actions
  const conciliarAutomatico = useCallback(async (): Promise<number> => {
    setIsProcessing(true);
    let conciliados = 0;

    try {
      // Buscar transações pendentes com score > 80
      const pendentes = transacoes.filter((t) => t.status === 'pendente');

      for (const transacao of pendentes) {
        const sugs = sugestoes[transacao.id];
        if (sugs && sugs[0]?.score >= 80) {
          await conciliarMutation.mutateAsync({
            transacaoId: transacao.id,
            candidatoId: sugs[0].candidato_id,
            candidatoTipo: sugs[0].candidato_tipo,
          });
          conciliados++;
        }
      }

      toast({
        title: 'Conciliação automática concluída',
        description: `${conciliados} transações conciliadas automaticamente`,
      });
    } finally {
      setIsProcessing(false);
    }

    return conciliados;
  }, [transacoes, sugestoes, conciliarMutation, toast]);

  const conciliarManual = useCallback(
    async (transacaoId: string, candidatoId: string, candidatoTipo: string) => {
      await conciliarMutation.mutateAsync({ transacaoId, candidatoId, candidatoTipo });
    },
    [conciliarMutation]
  );

  const desconciliar = useCallback(
    async (transacaoId: string) => {
      await desconciliarMutation.mutateAsync(transacaoId);
    },
    [desconciliarMutation]
  );

  const importarTransacoes = useCallback(
    async (novasTransacoes: Partial<TransacaoCartao>[]) => {
      await importarMutation.mutateAsync(novasTransacoes);
    },
    [importarMutation]
  );

  const excluirTransacao = useCallback(
    async (transacaoId: string) => {
      await excluirMutation.mutateAsync(transacaoId);
    },
    [excluirMutation]
  );

  const buscarSugestoes = useCallback(
    async (transacaoId: string): Promise<SugestaoMatchCartao[]> => {
      // Em produção, chamar RPC do Supabase
      return sugestoes[transacaoId] || [];
    },
    [sugestoes]
  );

  const getTransacaoById = useCallback(
    (id: string) => transacoes.find((t) => t.id === id),
    [transacoes]
  );

  const calcularScore = useCallback(
    (transacao: TransacaoCartao, candidato: CandidatoConciliacao) => {
      return calcularScoreMatch(
        {
          valor_liquido: transacao.valor_liquido,
          data_pagamento: transacao.data_pagamento || transacao.data_transacao,
          bandeira: transacao.bandeira,
          nsu: transacao.nsu,
        },
        candidato
      );
    },
    []
  );

  return {
    transacoes,
    transacoesFiltradas,
    sugestoes,
    resumo,
    isLoading,
    isProcessing,
    selectedIds,
    setSelectedIds,
    conciliarAutomatico,
    conciliarManual,
    desconciliar,
    buscarSugestoes,
    importarTransacoes,
    excluirTransacao,
    getTransacaoById,
    calcularScore,
  };
}
