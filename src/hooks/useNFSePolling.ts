import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// Bypass typing for tables not present in generated types
const db: any = supabase;
import { toast } from "@/hooks/use-toast";
import type { NotaFiscal, NFSeStatus } from "./useNFSeSync";

/** Configurações do polling */
const POLLING_INTERVAL = 30000; // 30 segundos
const MAX_RETRIES = 60; // Máximo de 30 minutos de polling

/** Interface de retorno do hook */
export interface UseNFSePollingReturn {
  /** Notas em polling atualmente */
  notasEmPolling: string[];
  /** Inicia polling para uma nota */
  iniciarPolling: (notaId: string) => void;
  /** Para o polling de uma nota */
  pararPolling: (notaId: string) => void;
  /** Para todos os pollings */
  pararTodos: () => void;
  /** Verifica se uma nota está em polling */
  isPolling: (notaId: string) => boolean;
}

/** Estado interno de polling para cada nota */
interface PollingState {
  intervalId: NodeJS.Timeout;
  retryCount: number;
  ultimoStatus: NFSeStatus;
}

/**
 * Hook para polling automático de status de NFS-e
 * Consulta a prefeitura a cada 30s até a nota ser autorizada ou rejeitada
 */
export function useNFSePolling(): UseNFSePollingReturn {
  const [notasEmPolling, setNotasEmPolling] = useState<string[]>([]);
  const pollingRefs = useRef<Map<string, PollingState>>(new Map());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Inicializar som de notificação
  useEffect(() => {
    try {
      audioRef.current = new Audio(
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUBFLrc7J9eBQ1yv+XKdS0GLY7Z89JlIgs8kNTz1WUeBjiS1/LQZSAFOpDU89FmHgY3kNTz0WUeBTiO1fPTZiEGOIvU89JmHwU2itTzxGUhBjiL0/PDZSAFNYnT88RlIAU2iNTzwGUhBjiG0/PAZSAFNYbS88BlIAU1gtPzu2UgBTSBz/O6ZSAFM4DM87tlIAUzf8vzvGUgBTJ+yvO5ZSAFMX7H87hlIAUufsbzsGUgBSx+v/OvZSAFLHy4869lIAUrfLfzrmUgBSp7t/OtZSAFKne386xlIAUodrfzqWUgBSh1t/OmZSAFKHW486VlIAUldbPzpmUgBSN0t/OlZSAFIXO486JlIAUfc7fznmUgBRxzufOeZSAFHHO4855lIAUcc7fznmUgBRRxt/OdZSAFFGG385xlIAUUYrfzmWUgBRRyt/OYZSAFEXC385ZlIAUQcrfzlGUgBQ9ut/OQZSAFDGq484BlIAUMarfzfWUgBQpir/N5ZSAFCGKr83VlIAUF4qrzc2UgBPHmKrzcWUgBPHGKrzZWSgBMcYqvNlZKAE"
      );
    } catch {
      // Audio não suportado
    }
  }, []);

  /**
   * Toca som de notificação
   */
  const tocarNotificacao = useCallback(() => {
    try {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {
          // Ignorar erros de autoplay
        });
      }
    } catch {
      // Ignorar erros
    }
  }, []);

  /**
   * Consulta status atual da nota
   */
  const consultarStatus = useCallback(async (notaId: string): Promise<NotaFiscal | null> => {
    try {
      const { data, error } = await db
        .from("notas_fiscais_servico")
        .select("*")
        .eq("id", notaId)
        .single();

      if (error || !data) {
        return null;
      }

      return data as NotaFiscal;
    } catch {
      return null;
    }
  }, []);

  /**
   * Processa mudança de status
   */
  const processarMudancaStatus = useCallback(
    (nota: NotaFiscal, novoStatus: NFSeStatus) => {
      if (novoStatus === "autorizada") {
        tocarNotificacao();
        toast({
          title: "Nota Autorizada!",
          description: `Nota ${nota.numero_nota || nota.id.slice(0, 8)} foi autorizada pela prefeitura.`,
          variant: "default",
        });

        // Fazer download automático
        if (nota.link_pdf || nota.link_xml) {
          setTimeout(() => {
            baixarDocumentos(nota);
          }, 1000);
        }
      } else if (novoStatus === "rejeitada") {
        tocarNotificacao();
        toast({
          title: "Nota Rejeitada",
          description:
            nota.mensagem_erro ||
            `Nota ${nota.numero_nota || nota.id.slice(0, 8)} foi rejeitada. Verifique os dados.`,
          variant: "destructive",
        });
      } else if (novoStatus === "erro") {
        tocarNotificacao();
        toast({
          title: "Erro na Emissão",
          description:
            nota.mensagem_erro || "Ocorreu um erro ao processar a nota fiscal.",
          variant: "destructive",
        });
      }
    },
    [tocarNotificacao]
  );

  /**
   * Baixa documentos da nota
   */
  const baixarDocumentos = async (nota: NotaFiscal) => {
    if (nota.link_pdf) {
      try {
        const response = await fetch(nota.link_pdf);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `NFSe_${nota.numero_nota}_${nota.cliente_nome}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
      } catch (e) {
        console.warn("Erro ao baixar PDF:", e);
      }
    }

    if (nota.link_xml) {
      try {
        const response = await fetch(nota.link_xml);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `NFSe_${nota.numero_nota}_${nota.cliente_nome}.xml`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
      } catch (e) {
        console.warn("Erro ao baixar XML:", e);
      }
    }
  };

  /**
   * Função de polling para uma nota
   */
  const executarPolling = useCallback(
    async (notaId: string) => {
      const state = pollingRefs.current.get(notaId);
      if (!state) return;

      // Incrementar contador de retries
      state.retryCount++;

      // Verificar limite de retries
      if (state.retryCount > MAX_RETRIES) {
        console.warn(`Polling excedeu limite de tentativas para nota ${notaId}`);
        pararPolling(notaId);
        toast({
          title: "Timeout",
          description:
            "Não foi possível confirmar o status da nota. Tente novamente mais tarde.",
          variant: "destructive",
        });
        return;
      }

      try {
        // Chamar Edge Function para consultar prefeitura
        const { data: result, error } = await supabase.functions.invoke(
          "sync-nfse",
          {
            body: {
              action: "consultar",
              notaId,
            },
          }
        );

        if (error) {
          console.warn("Erro na consulta:", error);
          return; // Continuar tentando
        }

        if (result?.nota) {
          const nota = result.nota as NotaFiscal;

          // Se mudou de status, processar
          if (nota.status !== state.ultimoStatus) {
            state.ultimoStatus = nota.status;
            processarMudancaStatus(nota, nota.status);

            // Se chegou em estado final, parar polling
            if (["autorizada", "rejeitada", "cancelada", "erro"].includes(nota.status)) {
              pararPolling(notaId);
            }
          }
        }
      } catch (err) {
        console.warn("Erro no polling:", err);
        // Continuar tentando
      }
    },
    [processarMudancaStatus]
  );

  /**
   * Inicia polling para uma nota
   */
  const iniciarPolling = useCallback(
    (notaId: string) => {
      // Verificar se já está em polling
      if (pollingRefs.current.has(notaId)) {
        return;
      }

      // Adicionar à lista de notas em polling
      setNotasEmPolling((prev) => [...prev, notaId]);

      // Buscar status inicial
      consultarStatus(notaId).then((nota) => {
        if (nota) {
          // Se já está em estado final, não iniciar polling
          if (["autorizada", "rejeitada", "cancelada", "erro"].includes(nota.status)) {
            setNotasEmPolling((prev) => prev.filter((id) => id !== notaId));
            return;
          }

          // Criar estado de polling
          const state: PollingState = {
            intervalId: setInterval(() => {
              executarPolling(notaId);
            }, POLLING_INTERVAL),
            retryCount: 0,
            ultimoStatus: nota.status,
          };

          pollingRefs.current.set(notaId, state);

          // Executar imediatamente a primeira vez
          executarPolling(notaId);
        } else {
          // Nota não encontrada, remover da lista
          setNotasEmPolling((prev) => prev.filter((id) => id !== notaId));
        }
      });
    },
    [consultarStatus, executarPolling]
  );

  /**
   * Para o polling de uma nota
   */
  const pararPolling = useCallback((notaId: string) => {
    const state = pollingRefs.current.get(notaId);
    if (state) {
      clearInterval(state.intervalId);
      pollingRefs.current.delete(notaId);
    }
    setNotasEmPolling((prev) => prev.filter((id) => id !== notaId));
  }, []);

  /**
   * Para todos os pollings
   */
  const pararTodos = useCallback(() => {
    pollingRefs.current.forEach((state) => {
      clearInterval(state.intervalId);
    });
    pollingRefs.current.clear();
    setNotasEmPolling([]);
  }, []);

  /**
   * Verifica se uma nota está em polling
   */
  const isPolling = useCallback(
    (notaId: string) => {
      return pollingRefs.current.has(notaId);
    },
    []
  );

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      pararTodos();
    };
  }, [pararTodos]);

  return {
    notasEmPolling,
    iniciarPolling,
    pararPolling,
    pararTodos,
    isPolling,
  };
}
