/**
 * Hook de Conciliação Inteligente
 * Algoritmos avançados de matching automático entre extrato e lançamentos
 *
 * @agente-financeiro responsável pelas regras de matching
 * @agente-analytics responsável pelos scores e rankings
 */

import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface MatchSugestao {
  extratoId: string;
  extratoDescricao: string;
  extratoValor: number;
  extratoData: string;
  tipo: "entrada" | "saida";
  sugestoes: Array<{
    id: string;
    tipo: "lancamento" | "conta_receber" | "conta_pagar";
    descricao: string;
    valor: number;
    data: string;
    score: number;
    motivo: string;
  }>;
}

export interface ConciliacaoStats {
  totalExtrato: number;
  conciliados: number;
  pendentes: number;
  sugestoesPendentes: number;
  taxaMatchAutomatico: number;
  tempoMedioConciliacao: number;
  divergenciasValor: number;
  semVinculo: number;
}

interface UseConciliacaoInteligenteReturn {
  sugestoes: MatchSugestao[];
  stats: ConciliacaoStats;
  conciliarAutomatico: () => Promise<number>;
  conciliarEmLote: (matches: Array<{ extratoId: string; itemId: string; tipo: string }>) => Promise<number>;
  recusarSugestao: (extratoId: string) => void;
  isLoading: boolean;
  progresso: number;
}

export function useConciliacaoInteligente(
  extrato: any[],
  lancamentos: any[],
  contasReceber: any[],
  contasPagar: any[]
): UseConciliacaoInteligenteReturn {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [recusados, setRecusados] = useState<Set<string>>(new Set());

  // Algoritmo de matching inteligente
  const calcularScore = useCallback(
    (
      extrato: any,
      candidato: { id: string; descricao: string; valor: number; data: string; tipo: string }
    ): { score: number; motivo: string } => {
      let score = 0;
      const motivos: string[] = [];

      // Match exato de valor (peso 40%)
      if (Math.abs(Number(extrato.valor) - candidato.valor) < 0.01) {
        score += 40;
        motivos.push("valor exato");
      } else if (Math.abs(Number(extrato.valor) - candidato.valor) < 1.0) {
        score += 25;
        motivos.push("valor aproximado");
      }

      // Match de data (peso 30%) - tolera até 3 dias
      const dataExtrato = new Date(extrato.data_transacao);
      const dataCandidato = new Date(candidato.data);
      const diffDias = Math.abs(
        Math.floor((dataExtrato.getTime() - dataCandidato.getTime()) / (1000 * 60 * 60 * 24))
      );

      if (diffDias === 0) {
        score += 30;
        motivos.push("mesma data");
      } else if (diffDias <= 1) {
        score += 20;
        motivos.push("1 dia diferença");
      } else if (diffDias <= 3) {
        score += 10;
        motivos.push(`${diffDias} dias diferença`);
      }

      // Similaridade de descrição (peso 20%)
      const descExtrato = extrato.descricao.toLowerCase().replace(/[^\w\s]/g, "");
      const descCandidato = candidato.descricao.toLowerCase().replace(/[^\w\s]/g, "");

      if (descExtrato === descCandidato) {
        score += 20;
        motivos.push("descrição idêntica");
      } else {
        const palavrasExtrato = new Set(descExtrato.split(/\s+/));
        const palavrasCandidato = descCandidato.split(/\s+/);
        const comuns = palavrasCandidato.filter((p) => palavrasExtrato.has(p)).length;
        const similaridade = comuns / Math.max(palavrasExtrato.size, palavrasCandidato.length);

        if (similaridade > 0.7) {
          score += 15;
          motivos.push("descrição muito similar");
        } else if (similaridade > 0.4) {
          score += 8;
          motivos.push("descrição similar");
        }
      }

      // Tipo match (peso 10%)
      if (extrato.tipo === candidato.tipo) {
        score += 10;
        motivos.push("tipo compatível");
      }

      return { score, motivo: motivos.join(", ") };
    },
    []
  );

  // Gerar sugestões inteligentes
  const sugestoes = useMemo((): MatchSugestao[] => {
    const itemsNaoConciliados = extrato.filter(
      (e) => !e.conciliado && !recusados.has(e.id)
    );

    const todosCandidatos = [
      ...lancamentos.map((l) => ({
        id: l.id,
        tipo: "lancamento" as const,
        descricao: l.descricao,
        valor: Number(l.valor),
        data: l.data_lancamento,
        tipoValor: l.tipo,
      })),
      ...contasReceber
        .filter((c) => c.status === "pendente" || c.status === "vencido")
        .map((c) => ({
          id: c.id,
          tipo: "conta_receber" as const,
          descricao: c.descricao,
          valor: Number(c.valor),
          data: c.data_vencimento,
          tipoValor: "entrada" as const,
        })),
      ...contasPagar
        .filter((c) => c.status === "pendente" || c.status === "vencido")
        .map((c) => ({
          id: c.id,
          tipo: "conta_pagar" as const,
          descricao: c.descricao,
          valor: Number(c.valor),
          data: c.data_vencimento,
          tipoValor: "saida" as const,
        })),
    ];

    return itemsNaoConciliados
      .map((extratoItem) => {
        const candidatosScored = todosCandidatos
          .filter((c) => c.tipoValor === extratoItem.tipo)
          .map((c) => {
            const { score, motivo } = calcularScore(extratoItem, c);
            return {
              id: c.id,
              tipo: c.tipo,
              descricao: c.descricao,
              valor: c.valor,
              data: c.data,
              score,
              motivo,
            };
          })
          .filter((c) => c.score >= 50) // Mínimo de confiança
          .sort((a, b) => b.score - a.score)
          .slice(0, 5); // Top 5 sugestões

        return {
          extratoId: extratoItem.id,
          extratoDescricao: extratoItem.descricao,
          extratoValor: Number(extratoItem.valor),
          extratoData: extratoItem.data_transacao,
          tipo: extratoItem.tipo,
          sugestoes: candidatosScored,
        };
      })
      .filter((s) => s.sugestoes.length > 0);
  }, [extrato, lancamentos, contasReceber, contasPagar, calcularScore, recusados]);

  // Calcular estatísticas
  const stats = useMemo((): ConciliacaoStats => {
    const total = extrato.length;
    const conciliados = extrato.filter((e) => e.conciliado).length;
    const pendentes = total - conciliados;
    const sugestoesPendentes = sugestoes.length;

    return {
      totalExtrato: total,
      conciliados,
      pendentes,
      sugestoesPendentes,
      taxaMatchAutomatico: total > 0 ? Math.round((conciliados / total) * 100) : 0,
      tempoMedioConciliacao: 0,
      divergenciasValor: 0,
      semVinculo: pendentes - sugestoesPendentes,
    };
  }, [extrato, sugestoes]);

  // Conciliação automática (score > 80)
  const conciliarAutomatico = useCallback(async (): Promise<number> => {
    setIsLoading(true);
    setProgresso(0);

    const matchesAutomaticos = sugestoes.filter(
      (s) => s.sugestoes.length > 0 && s.sugestoes[0].score >= 80
    );

    let conciliados = 0;
    const total = matchesAutomaticos.length;

    for (let i = 0; i < matchesAutomaticos.length; i++) {
      const sugestao = matchesAutomaticos[i];
      const melhorMatch = sugestao.sugestoes[0];

      const updateData: any = { conciliado: true };
      if (melhorMatch.tipo === "lancamento") {
        updateData.lancamento_id = melhorMatch.id;
      } else if (melhorMatch.tipo === "conta_receber") {
        updateData.conta_receber_id = melhorMatch.id;
      } else if (melhorMatch.tipo === "conta_pagar") {
        updateData.conta_pagar_id = melhorMatch.id;
      }

      const { error } = await (supabase.from("extrato_bancario") as any)
        .update(updateData)
        .eq("id", sugestao.extratoId);

      if (!error) {
        conciliados++;
      }

      setProgresso(Math.round(((i + 1) / total) * 100));
    }

    setIsLoading(false);
    queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });

    toast({
      title: "Conciliação automática concluída",
      description: `${conciliados} de ${total} transações conciliadas automaticamente`,
    });

    return conciliados;
  }, [sugestoes, queryClient, toast]);

  // Conciliação em lote
  const conciliarEmLote = useCallback(
    async (
      matches: Array<{ extratoId: string; itemId: string; tipo: string }>
    ): Promise<number> => {
      setIsLoading(true);
      setProgresso(0);

      let conciliados = 0;
      const total = matches.length;

      // Processar em batches de 10 para evitar sobrecarga
      const batchSize = 10;
      for (let i = 0; i < matches.length; i += batchSize) {
        const batch = matches.slice(i, i + batchSize);

        const promises = batch.map(async (match) => {
          const updateData: any = { conciliado: true };
          if (match.tipo === "lancamento") {
            updateData.lancamento_id = match.itemId;
          } else if (match.tipo === "conta_receber") {
            updateData.conta_receber_id = match.itemId;
          } else if (match.tipo === "conta_pagar") {
            updateData.conta_pagar_id = match.itemId;
          }

          const { error } = await (supabase.from("extrato_bancario") as any)
            .update(updateData)
            .eq("id", match.extratoId);

          return !error;
        });

        const results = await Promise.all(promises);
        conciliados += results.filter(Boolean).length;

        setProgresso(Math.round(((i + batch.length) / total) * 100));
      }

      setIsLoading(false);
      queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });

      toast({
        title: "Conciliação em lote concluída",
        description: `${conciliados} de ${total} transações conciliadas`,
      });

      return conciliados;
    },
    [queryClient, toast]
  );

  // Recusar sugestão
  const recusarSugestao = useCallback((extratoId: string) => {
    setRecusados((prev) => new Set(prev).add(extratoId));
    toast({
      title: "Sugestão recusada",
      description: "Item não será mais sugerido nesta sessão",
    });
  }, [toast]);

  return {
    sugestoes,
    stats,
    conciliarAutomatico,
    conciliarEmLote,
    recusarSugestao,
    isLoading,
    progresso,
  };
}
