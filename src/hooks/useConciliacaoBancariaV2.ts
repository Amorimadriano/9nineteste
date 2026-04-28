import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface ExtratoItem {
  id: string;
  data_transacao: string;
  descricao: string;
  valor: number;
  tipo: "entrada" | "saida";
  conciliado: boolean;
  origem: "ofx" | "sistema" | "manual";
  status_conciliacao?: string;
  conta_pagar_id?: string | null;
  conta_receber_id?: string | null;
  lancamento_id?: string | null;
  banco_cartao_id?: string | null;
}

export interface MatchResult {
  extrato: ExtratoItem;
  candidato: ExtratoItem | null;
  matchType: "green" | "red";
  diffDias: number;
}

export function useConciliacaoBancariaV2(
  extrato: ExtratoItem[],
  espelhos: ExtratoItem[]
) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const ofxItems = useMemo(
    () => extrato.filter((e) => e.origem === "ofx" || e.origem === "manual"),
    [extrato]
  );

  const pendingEspelhos = useMemo(
    () => espelhos.filter((e) => !e.conciliado && e.origem === "sistema"),
    [espelhos]
  );

  const matches = useMemo((): MatchResult[] => {
    return ofxItems.map((ofx) => {
      const candidatos = pendingEspelhos
        .filter((esp) => {
          if (esp.tipo !== ofx.tipo) return false;
          if (Math.abs(Number(esp.valor) - Number(ofx.valor)) >= 0.01) return false;

          const dOfx = new Date(ofx.data_transacao).getTime();
          const dEsp = new Date(esp.data_transacao).getTime();
          const diffDias = Math.abs(
            Math.floor((dOfx - dEsp) / (1000 * 60 * 60 * 24))
          );
          if (diffDias > 2) return false;

          return true;
        })
        .sort((a, b) => {
          const dOfx = new Date(ofx.data_transacao).getTime();
          const dA = Math.abs(
            new Date(a.data_transacao).getTime() - dOfx
          );
          const dB = Math.abs(
            new Date(b.data_transacao).getTime() - dOfx
          );
          return dA - dB;
        });

      const melhor = candidatos[0] ?? null;
      const diffDias = melhor
        ? Math.abs(
            Math.floor(
              (new Date(ofx.data_transacao).getTime() -
                new Date(melhor.data_transacao).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : -1;

      return {
        extrato: ofx,
        candidato: melhor,
        matchType: melhor ? "green" : "red",
        diffDias,
      };
    });
  }, [ofxItems, pendingEspelhos]);

  const confirmarMatch = useCallback(
    async (ofxId: string, candidatoId: string) => {
      setIsLoading(true);
      const { error } = await (supabase.from("extrato_bancario") as any)
        .update({
          conciliado: true,
          status_conciliacao: "conciliado",
          lancamento_id: candidatoId,
        })
        .eq("id", ofxId);

      if (error) {
        toast({
          title: "Erro ao conciliar",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Conciliação confirmada com sucesso!" });
        queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });
      }
      setIsLoading(false);
    },
    [queryClient, toast]
  );

  const criarLancamentoAjuste = useCallback(
    async (
      ofxId: string,
      dados: {
        descricao: string;
        valor: number;
        data: string;
        tipo: "entrada" | "saida";
        categoria_id?: string;
      }
    ) => {
      setIsLoading(true);

      // 1. Cria lançamento em lancamentos_caixa
      const { data: lancamento, error: errLanc } = await (supabase
        .from("lancamentos_caixa") as any)
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          descricao: dados.descricao,
          valor: dados.valor,
          data_lancamento: dados.data,
          tipo: dados.tipo,
          categoria_id: dados.categoria_id ?? null,
          observacoes: "Criado via conciliação bancária",
        })
        .select()
        .single();

      if (errLanc || !lancamento) {
        toast({
          title: "Erro ao criar lançamento",
          description: errLanc?.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return false;
      }

      // 2. Atualiza extrato como conciliado
      const { error: errExt } = await (supabase
        .from("extrato_bancario") as any)
        .update({
          conciliado: true,
          status_conciliacao: "conciliado",
          lancamento_id: lancamento.id,
        })
        .eq("id", ofxId);

      if (errExt) {
        toast({
          title: "Erro ao atualizar extrato",
          description: errExt.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return false;
      }

      toast({ title: "Lançamento de ajuste criado e conciliado!" });
      queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });
      queryClient.invalidateQueries({ queryKey: ["lancamentos_caixa"] });
      setIsLoading(false);
      return true;
    },
    [queryClient, toast]
  );

  const stats = useMemo(() => {
    const green = matches.filter((m) => m.matchType === "green").length;
    const red = matches.filter((m) => m.matchType === "red").length;
    return { total: matches.length, green, red };
  }, [matches]);

  return {
    matches,
    stats,
    confirmarMatch,
    criarLancamentoAjuste,
    isLoading,
  };
}
