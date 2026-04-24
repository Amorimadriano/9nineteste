import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

const db: any = supabase;

export interface SyncStats {
  novas: number;
  conciliadas: number;
  pendentes: number;
  totalProcessado: number;
}

export interface SyncResult {
  success: boolean;
  stats: SyncStats;
  message: string;
  error?: string;
}

export function useOpenBankingSync() {
  const [sincronizando, setSincronizando] = useState(false);
  const [ultimoResultado, setUltimoResultado] = useState<SyncResult | null>(null);
  const { toast } = useToast();

  const sincronizarExtrato = useCallback(
    async (integracaoId: string): Promise<SyncResult> => {
      setSincronizando(true);

      try {
        const { data: integracao, error: integracaoError } = await db
          .from("open_banking_integracoes")
          .select("*, banco: banco_id (*)")
          .eq("id", integracaoId)
          .eq("consentimento_ativo", true)
          .single();

        if (integracaoError || !integracao) {
          throw new Error("Integração não encontrada ou consentimento não está ativo");
        }

        const tokenExpirado = new Date(integracao.token_expira_em) < new Date();
        if (tokenExpirado) {
          throw new Error("Token de acesso expirado. É necessário renovar o consentimento.");
        }

        const { data: syncData, error: syncError } = await supabase.functions.invoke(
          "sync-open-banking",
          {
            body: {
              integracaoId,
              userId: integracao.user_id,
              bancoCodigo: integracao.banco?.codigo,
            },
          }
        );

        if (syncError) {
          throw new Error(syncError.message || "Erro na sincronização");
        }

        const result: SyncResult = {
          success: true,
          stats: syncData.stats || { novas: 0, conciliadas: 0, pendentes: 0, totalProcessado: 0 },
          message: syncData.message || "Sincronização concluída com sucesso",
        };

        setUltimoResultado(result);

        toast({
          title: "Sincronização Concluída",
          description: `${result.stats.novas} novas transações, ${result.stats.conciliadas} conciliadas automaticamente`,
        });

        await db.rpc("invalidate_queries", {
          table_names: ["open_banking_extratos", "extrato_bancario"],
        });

        return result;
      } catch (error: any) {
        const result: SyncResult = {
          success: false,
          stats: { novas: 0, conciliadas: 0, pendentes: 0, totalProcessado: 0 },
          message: error.message || "Erro desconhecido na sincronização",
          error: error.message,
        };

        setUltimoResultado(result);

        toast({
          title: "Erro na Sincronização",
          description: error.message,
          variant: "destructive",
        });

        return result;
      } finally {
        setSincronizando(false);
      }
    },
    [toast]
  );

  const sincronizarTodos = useCallback(async (): Promise<SyncResult[]> => {
    setSincronizando(true);
    const resultados: SyncResult[] = [];

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error("Usuário não autenticado");
      }

      const { data: integracoes, error } = await db
        .from("open_banking_integracoes")
        .select("id")
        .eq("user_id", user.user.id)
        .eq("consentimento_ativo", true);

      if (error) {
        throw new Error("Erro ao buscar integrações");
      }

      for (const integracao of (integracoes as any[]) || []) {
        const resultado = await sincronizarExtrato(integracao.id);
        resultados.push(resultado);
      }

      const totalNovas = resultados.reduce((sum, r) => sum + r.stats.novas, 0);
      const totalConciliadas = resultados.reduce((sum, r) => sum + r.stats.conciliadas, 0);

      toast({
        title: "Sincronização em Lote Concluída",
        description: `${totalNovas} novas transações em ${resultados.length} contas, ${totalConciliadas} conciliadas`,
      });

      return resultados;
    } catch (error: any) {
      toast({
        title: "Erro na Sincronização em Lote",
        description: error.message,
        variant: "destructive",
      });
      return resultados;
    } finally {
      setSincronizando(false);
    }
  }, [sincronizarExtrato, toast]);

  return {
    sincronizarExtrato,
    sincronizarTodos,
    sincronizando,
    ultimoResultado,
  };
}
