import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";
import { useQueryClient } from "@tanstack/react-query";

// Bypass typing for tables not present in generated types
const db: any = supabase;

export interface RealtimeTransaction {
  id: string;
  descricao: string;
  valor: number;
  tipo: "entrada" | "saida";
  dataTransacao: string;
  bancoNome: string;
}

export interface UseOpenBankingRealtimeOptions {
  /** ID específico da integração para escutar (opcional) */
  integracaoId?: string;
  /** Callback quando novas transações chegam */
  onNewTransactions?: (transactions: RealtimeTransaction[]) => void;
  /** Habilitar notificações toast */
  enableNotifications?: boolean;
}

/**
 * Hook para escuta em tempo real de transações Open Banking
 *
 * Escuta por:
 * - Webhooks do banco (quando disponível)
 * - Novas transações inseridas via sincronização
 * - Atualizações de status de conciliação
 *
 * @example
 * ```typescript
 * // Uso básico - escuta todas as integrações
 * useOpenBankingRealtime();
 *
 * // Com callback personalizado
 * useOpenBankingRealtime({
 *   onNewTransactions: (txs) => {
 *     console.log("Novas transações:", txs);
 *   }
 * });
 *
 * // Escuta integração específica
 * useOpenBankingRealtime({
 *   integracaoId: "uuid-da-integracao"
 * });
 * ```
 */
export function useOpenBankingRealtime(
  options: UseOpenBankingRealtimeOptions = {}
) {
  const {
    integracaoId,
    onNewTransactions,
    enableNotifications = true,
  } = options;

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [novasTransacoes, setNovasTransacoes] = useState<RealtimeTransaction[]>([]);

  // Debounce para notificações
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTransactionsRef = useRef<RealtimeTransaction[]>([]);

  const showNotification = useCallback(
    (transactions: RealtimeTransaction[]) => {
      if (!enableNotifications || transactions.length === 0) return;

      const total = transactions.length;
      const totalValor = transactions.reduce((sum, t) => sum + t.valor, 0);
      const entradas = transactions.filter((t) => t.tipo === "entrada");
      const saidas = transactions.filter((t) => t.tipo === "saida");

      let description = `${total} nova${total > 1 ? "s" : ""} transação${total > 1 ? "ões" : ""}`;
      if (entradas.length > 0 && saidas.length > 0) {
        description += ` (${entradas.length} entrada(s), ${saidas.length} saída(s))`;
      }

      toast({
        title: "Transações Recebidas",
        description,
        duration: 5000,
      });
    },
    [enableNotifications, toast]
  );

  const processNewTransactions = useCallback(
    (transactions: RealtimeTransaction[]) => {
      // Adicionar à lista de pendentes
      pendingTransactionsRef.current.push(...transactions);

      // Limpar timeout anterior
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }

      // Agregar notificações em 2 segundos
      notificationTimeoutRef.current = setTimeout(() => {
        const transactionsToNotify = [...pendingTransactionsRef.current];
        pendingTransactionsRef.current = [];

        // Atualizar estado
        setNovasTransacoes((prev) => [...prev, ...transactionsToNotify]);

        // Chamar callback
        onNewTransactions?.(transactionsToNotify);

        // Mostrar notificação
        showNotification(transactionsToNotify);

        // Invalidar queries
        queryClient.invalidateQueries({ queryKey: ["open_banking_extratos"] });
        queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });
      }, 2000);
    },
    [onNewTransactions, showNotification, queryClient]
  );

  useEffect(() => {
    // Criar canal com filtro se houver integracaoId
    const channelName = integracaoId
      ? `open-banking-${integracaoId}`
      : `open-banking-all-${Math.random().toString(36).slice(2)}`;

    const channel = supabase
      .channel(channelName)
      // Escutar novas transações
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "open_banking_extratos",
          filter: integracaoId ? `integracao_id=eq.${integracaoId}` : undefined,
        },
        (payload) => {
          const newTransaction: RealtimeTransaction = {
            id: payload.new.id,
            descricao: payload.new.descricao,
            valor: payload.new.valor,
            tipo: payload.new.tipo,
            dataTransacao: payload.new.data_transacao,
            bancoNome: payload.new.banco_nome || "Banco",
          };
          processNewTransactions([newTransaction]);
        }
      )
      // Escutar atualizações de conciliação
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "open_banking_extratos",
          filter: integracaoId ? `integracao_id=eq.${integracaoId}` : undefined,
        },
        (payload) => {
          // Se foi conciliado, invalidar queries
          if (payload.new.status_conciliacao !== payload.old.status_conciliacao) {
            queryClient.invalidateQueries({
              queryKey: ["open_banking_extratos"],
            });
          }
        }
      )
      // Escutar webhooks recebidos
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "open_banking_webhook_log",
        },
        (payload) => {
          // Quando um webhook é recebido, disparar sincronização
          if (payload.new.processado === false) {
            // Marcar como processado
            db
              .from("open_banking_webhook_log")
              .update({ processado: true })
              .eq("id", payload.new.id)
              .then(() => {
                queryClient.invalidateQueries({
                  queryKey: ["open_banking_extratos"],
                });
              });
          }
        }
      )
      .subscribe((status) => {
        console.log(`Open Banking Realtime status: ${status}`);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, [integracaoId, processNewTransactions, queryClient]);

  /**
   * Limpar lista de novas transações
   */
  const limparNovasTransacoes = useCallback(() => {
    setNovasTransacoes([]);
    pendingTransactionsRef.current = [];
  }, []);

  return {
    novasTransacoes,
    limparNovasTransacoes,
  };
}

/**
 * Hook de conveniência para usar com notificações automáticas
 *
 * @example
 * ```typescript
 * // Apenas notificações, sem callback
 * useOpenBankingNotifications();
 * ```
 */
export function useOpenBankingNotifications(
  integracaoId?: string,
  options?: { enableSound?: boolean }
) {
  const { enableSound = false } = options || {};

  useOpenBankingRealtime({
    integracaoId,
    enableNotifications: true,
    onNewTransactions: (transactions) => {
      if (enableSound && transactions.length > 0) {
        // Tocar som de notificação (se implementado)
        const audio = new Audio("/notification-sound.mp3");
        audio.play().catch(() => {
          // Ignorar erros de autoplay
        });
      }
    },
  });
}
