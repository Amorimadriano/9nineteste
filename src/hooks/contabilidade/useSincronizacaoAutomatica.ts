import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// Bypass typing for tables not present in generated types
const db: any = supabase;
import { useToast } from "../use-toast";

export interface ConfiguracaoAgendamento {
  id: string;
  ativo: boolean;
  frequencia: "diario" | "semanal" | "mensal" | "manual";
  horario: string; // HH:mm
  diaSemana?: number; // 0-6 (domingo a sábado) para semanal
  diaMes?: number; // 1-31 para mensal
  ultimaExecucao?: string;
  proximaExecucao?: string;
}

export interface StatusAgendamento {
  configId: string;
  status: "agendado" | "executando" | "concluido" | "erro";
  ultimaExecucao?: string;
  resultado?: {
    success: boolean;
    mensagem: string;
    totalProcessado?: number;
  };
}

export interface NotificacaoSync {
  tipo: "sucesso" | "erro" | "info";
  titulo: string;
  mensagem: string;
  timestamp: string;
}

/**
 * Hook para gerenciar sincronização automática baseada em configuração
 *
 * @example
 * ```typescript
 * const { executarSync, proximaExecucao, notificacoes } = useSincronizacaoAutomatica();
 *
 * // Verificar agendamento
 * useEffect(() => {
 *   verificarAgendamento('config-123');
 * }, []);
 *
 * // Executar sync em background
 * await executarSync('config-123');
 * ```
 */
export function useSincronizacaoAutomatica() {
  const [agendamentos, setAgendamentos] = useState<Record<string, StatusAgendamento>>({});
  const [notificacoes, setNotificacoes] = useState<NotificacaoSync[]>([]);
  const [executando, setExecutando] = useState<Record<string, boolean>>({});
  const [proximaExecucao, setProximaExecucao] = useState<Record<string, Date | null>>({});
  const intervalRefs = useRef<Record<string, NodeJS.Timeout>>({});
  const { toast } = useToast();

  /**
   * Busca configuração de agendamento do banco
   */
  const buscarConfiguracao = useCallback(
    async (configId: string): Promise<ConfiguracaoAgendamento | null> => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return null;

        const client: any = supabase;
        const { data, error } = await client
          .from("contabilidade_integracoes")
          .select("sync_config")
          .eq("id", configId)
          .eq("user_id", user.user.id)
          .single();

        if (error || !data?.sync_config) return null;

        return {
          id: configId,
          ...data.sync_config,
        };
      } catch {
        return null;
      }
    },
    []
  );

  /**
   * Salva configuração de agendamento
   */
  const salvarConfiguracao = useCallback(
    async (configId: string, config: Partial<ConfiguracaoAgendamento>): Promise<boolean> => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          throw new Error("Usuário não autenticado");
        }

        const client: any = supabase;
        const { error } = await client
          .from("contabilidade_integracoes")
          .update({
            sync_config: config,
            updated_at: new Date().toISOString(),
          })
          .eq("id", configId)
          .eq("user_id", user.user.id);

        if (error) throw error;

        // Recalcular próxima execução
        calcularProximaExecucao(configId, config as ConfiguracaoAgendamento);

        toast({
          title: "Configuração Salva",
          description: "Agendamento de sincronização atualizado.",
        });

        return true;
      } catch (err: any) {
        toast({
          title: "Erro ao Salvar",
          description: err.message,
          variant: "destructive",
        });
        return false;
      }
    },
    [toast]
  );

  /**
   * Calcula a próxima execução baseada na configuração
   */
  const calcularProximaExecucao = useCallback(
    (configId: string, config: ConfiguracaoAgendamento): Date | null => {
      if (!config.ativo || config.frequencia === "manual") {
        setProximaExecucao((prev) => ({ ...prev, [configId]: null }));
        return null;
      }

      const agora = new Date();
      const [horas, minutos] = config.horario.split(":").map(Number);
      let proxima = new Date(agora);
      proxima.setHours(horas, minutos, 0, 0);

      // Se já passou do horário hoje, começar amanhã
      if (proxima <= agora) {
        proxima.setDate(proxima.getDate() + 1);
      }

      switch (config.frequencia) {
        case "diario":
          // Já está configurado para amanhã se passou do horário
          break;

        case "semanal":
          // Ajustar para o dia da semana configurado
          const diaSemana = config.diaSemana ?? 1; // Segunda por padrão
          const diasAte = (diaSemana - proxima.getDay() + 7) % 7;
          if (diasAte > 0) {
            proxima.setDate(proxima.getDate() + diasAte);
          }
          break;

        case "mensal":
          // Ajustar para o dia do mês configurado
          const diaMes = config.diaMes ?? 1;
          if (proxima.getDate() > diaMes) {
            // Ir para próximo mês
            proxima.setMonth(proxima.getMonth() + 1);
          }
          proxima.setDate(diaMes);
          break;
      }

      setProximaExecucao((prev) => ({ ...prev, [configId]: proxima }));
      return proxima;
    },
    []
  );

  /**
   * Executa sincronização em background
   */
  const executarSync = useCallback(
    async (configId: string): Promise<boolean> => {
      if (executando[configId]) {
        console.log(`Sync já em execução para config ${configId}`);
        return false;
      }

      setExecutando((prev) => ({ ...prev, [configId]: true }));
      setAgendamentos((prev) => ({
        ...prev,
        [configId]: {
          configId,
          status: "executando",
          ultimaExecucao: new Date().toISOString(),
        },
      }));

      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          throw new Error("Usuário não autenticado");
        }

        // Calcular período (últimos 30 dias por padrão)
        const fim = new Date().toISOString().split("T")[0];
        const inicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];

        // Executar sincronização completa via Edge Function
        const { data: resultado, error } = await supabase.functions.invoke(
          "sync-contabilidade",
          {
            body: {
              action: "completo",
              configId,
              userId: user.user.id,
              periodo: { inicio, fim },
              agendado: true,
            },
          }
        );

        if (error) throw error;

        // Atualizar status
        setAgendamentos((prev) => ({
          ...prev,
          [configId]: {
            configId,
            status: resultado.success ? "concluido" : "erro",
            ultimaExecucao: new Date().toISOString(),
            resultado: {
              success: resultado.success,
              mensagem: resultado.mensagem,
              totalProcessado: resultado.total,
            },
          },
        }));

        // Adicionar notificação
        const novaNotificacao: NotificacaoSync = {
          tipo: resultado.success ? "sucesso" : "erro",
          titulo: resultado.success
            ? "Sincronização Automática Concluída"
            : "Erro na Sincronização Automática",
          mensagem: resultado.mensagem,
          timestamp: new Date().toISOString(),
        };

        setNotificacoes((prev) => [novaNotificacao, ...prev].slice(0, 50));

        // Mostrar toast se estiver em foreground
        if (resultado.success) {
          toast({
            title: "Sincronização Automática",
            description: resultado.mensagem,
          });
        } else {
          toast({
            title: "Erro na Sincronização Automática",
            description: resultado.mensagem,
            variant: "destructive",
          });
        }

        // Registrar log
        await (supabase as unknown as any).from("contabilidade_sync_logs").insert({
          config_id: configId,
          user_id: user.user.id,
          tipo: "automatica",
          status: resultado.success ? "sucesso" : "erro",
          mensagem: resultado.mensagem,
          detalhes: resultado,
        });

        return resultado.success;
      } catch (err: any) {
        const mensagem = err.message || "Erro desconhecido na sincronização";

        setAgendamentos((prev) => ({
          ...prev,
          [configId]: {
            configId,
            status: "erro",
            ultimaExecucao: new Date().toISOString(),
            resultado: {
              success: false,
              mensagem,
            },
          },
        }));

        const novaNotificacao: NotificacaoSync = {
          tipo: "erro",
          titulo: "Erro na Sincronização Automática",
          mensagem,
          timestamp: new Date().toISOString(),
        };

        setNotificacoes((prev) => [novaNotificacao, ...prev].slice(0, 50));

        toast({
          title: "Erro na Sincronização Automática",
          description: mensagem,
          variant: "destructive",
        });

        return false;
      } finally {
        setExecutando((prev) => ({ ...prev, [configId]: false }));

        // Recalcular próxima execução
        const config = await buscarConfiguracao(configId);
        if (config) {
          calcularProximaExecucao(configId, config);
        }
      }
    },
    [executando, toast, buscarConfiguracao, calcularProximaExecucao]
  );

  /**
   * Verifica se é hora de executar o sync
   */
  const verificarAgendamento = useCallback(
    async (configId: string) => {
      const config = await buscarConfiguracao(configId);
      if (!config || !config.ativo || config.frequencia === "manual") {
        return;
      }

      const proxima = calcularProximaExecucao(configId, config);
      if (!proxima) return;

      const agora = new Date();
      const diffMinutos = Math.abs(
        (agora.getTime() - proxima.getTime()) / (1000 * 60)
      );

      // Se está dentro de 1 minuto do horário agendado
      if (diffMinutos <= 1) {
        await executarSync(configId);
      }
    },
    [buscarConfiguracao, calcularProximaExecucao, executarSync]
  );

  /**
   * Inicia monitoramento de agendamento
   */
  const iniciarMonitoramento = useCallback(
    (configId: string) => {
      // Limpar intervalo anterior se existir
      if (intervalRefs.current[configId]) {
        clearInterval(intervalRefs.current[configId]);
      }

      // Verificar a cada minuto
      intervalRefs.current[configId] = setInterval(() => {
        verificarAgendamento(configId);
      }, 60000);

      // Verificar imediatamente
      verificarAgendamento(configId);
    },
    [verificarAgendamento]
  );

  /**
   * Para monitoramento de agendamento
   */
  const pararMonitoramento = useCallback((configId: string) => {
    if (intervalRefs.current[configId]) {
      clearInterval(intervalRefs.current[configId]);
      delete intervalRefs.current[configId];
    }
  }, []);

  /**
   * Limpa notificações
   */
  const limparNotificacoes = useCallback(() => {
    setNotificacoes([]);
  }, []);

  /**
   * Marca notificação como lida
   */
  const marcarNotificacaoLida = useCallback((index: number) => {
    setNotificacoes((prev) =>
      prev.map((n, i) => (i === index ? { ...n, lida: true } : n))
    );
  }, []);

  // Limpar intervalos ao desmontar
  useEffect(() => {
    return () => {
      Object.values(intervalRefs.current).forEach((interval) => {
        clearInterval(interval);
      });
    };
  }, []);

  return {
    agendamentos,
    notificacoes,
    executando,
    proximaExecucao,
    buscarConfiguracao,
    salvarConfiguracao,
    executarSync,
    verificarAgendamento,
    iniciarMonitoramento,
    pararMonitoramento,
    limparNotificacoes,
    marcarNotificacaoLida,
    calcularProximaExecucao,
  };
}

/**
 * Hook para verificar sincronização em background ao iniciar
 */
export function useBackgroundSyncCheck() {
  const { verificarAgendamento } = useSincronizacaoAutomatica();

  useEffect(() => {
    // Verificar todas as configs ativas ao carregar
    const verificarTodos = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const client: any = supabase;
      const { data: configs } = await client
        .from("contabilidade_integracoes")
        .select("id, sync_config")
        .eq("user_id", user.user.id)
        .eq("ativo", true);

      for (const config of (configs as any[]) || []) {
        if (config.sync_config?.ativo) {
          await verificarAgendamento(config.id);
        }
      }
    };

    verificarTodos();

    // Verificar a cada 5 minutos
    const interval = setInterval(verificarTodos, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [verificarAgendamento]);
}
