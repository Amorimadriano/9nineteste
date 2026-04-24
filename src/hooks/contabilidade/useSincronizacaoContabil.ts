import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "../use-toast";

export interface PeriodoConfig {
  inicio: string;
  fim: string;
}

export interface ProgressoSincronizacao {
  total: number;
  processados: number;
  percentual: number;
}

export interface DetalheErro {
  registroId: string;
  tipo: string;
  erro: string;
  dados?: Record<string, any>;
}

export interface ResultadoSincronizacao {
  success: boolean;
  total: number;
  exportados: number;
  erros: number;
  detalhesErros: DetalheErro[];
  mensagem: string;
}

export interface ResultadoConciliacao {
  success: boolean;
  totalProcessado: number;
  conciliados: number;
  pendentes: number;
  sugeridosManual: number;
  mensagem: string;
}

export interface ResultadoImportacao {
  success: boolean;
  total: number;
  importados: number;
  duplicados: number;
  erros: number;
  conciliadosAuto: number;
  detalhesErros: DetalheErro[];
  mensagem: string;
}

export type TipoExportacao = "contas_pagar" | "contas_receber" | "caixa" | "todos";
export type StatusSincronizacao = "idle" | "exportando" | "importando" | "conciliando" | "completo" | "erro";

/**
 * Hook para sincronização de dados contábeis com ERP
 *
 * @example
 * ```typescript
 * const { exportarContasPagar, importarLancamentos, progresso, status } = useSincronizacaoContabil();
 *
 * // Exportar contas a pagar
 * const resultado = await exportarContasPagar('config-123', {
 *   inicio: '2024-04-01',
 *   fim: '2024-04-30'
 * });
 * ```
 */
export function useSincronizacaoContabil() {
  const [status, setStatus] = useState<StatusSincronizacao>("idle");
  const [progresso, setProgresso] = useState<ProgressoSincronizacao>({
    total: 0,
    processados: 0,
    percentual: 0,
  });
  const [erros, setErros] = useState<DetalheErro[]>([]);
  const [ultimoResultado, setUltimoResultado] = useState<
    ResultadoSincronizacao | ResultadoImportacao | ResultadoConciliacao | null
  >(null);
  const { toast } = useToast();

  /**
   * Exporta contas a pagar para o ERP
   */
  const exportarContasPagar = useCallback(
    async (configId: string, periodo: PeriodoConfig): Promise<ResultadoSincronizacao> => {
      setStatus("exportando");
      setErros([]);

      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          throw new Error("Usuário não autenticado");
        }

        const { data: resultado, error } = await supabase.functions.invoke(
          "sync-contabilidade",
          {
            body: {
              action: "exportar",
              tipo: "contas_pagar",
              configId,
              userId: user.user.id,
              periodo,
            },
          }
        );

        if (error) {
          throw new Error(error.message);
        }

        setProgresso({
          total: resultado.total,
          processados: resultado.exportados,
          percentual: 100,
        });
        setErros(resultado.detalhesErros || []);

        const result: ResultadoSincronizacao = {
          success: true,
          total: resultado.total,
          exportados: resultado.exportados,
          erros: resultado.erros,
          detalhesErros: resultado.detalhesErros || [],
          mensagem: resultado.mensagem || `Exportados ${resultado.exportados} de ${resultado.total} registros`,
        };

        setUltimoResultado(result);

        toast({
          title: "Exportação Concluída",
          description: `${resultado.exportados} contas a pagar exportadas${resultado.erros > 0 ? `, ${resultado.erros} erros` : ""}`,
          variant: resultado.erros > 0 ? "default" : "default",
        });

        return result;
      } catch (err: any) {
        const result: ResultadoSincronizacao = {
          success: false,
          total: 0,
          exportados: 0,
          erros: 1,
          detalhesErros: [{ registroId: "", tipo: "geral", erro: err.message }],
          mensagem: err.message || "Erro na exportação",
        };

        setUltimoResultado(result);
        setStatus("erro");

        toast({
          title: "Erro na Exportação",
          description: err.message,
          variant: "destructive",
        });

        return result;
      } finally {
        setStatus("completo");
      }
    },
    [toast]
  );

  /**
   * Exporta contas a receber para o ERP
   */
  const exportarContasReceber = useCallback(
    async (configId: string, periodo: PeriodoConfig): Promise<ResultadoSincronizacao> => {
      setStatus("exportando");
      setErros([]);

      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          throw new Error("Usuário não autenticado");
        }

        const { data: resultado, error } = await supabase.functions.invoke(
          "sync-contabilidade",
          {
            body: {
              action: "exportar",
              tipo: "contas_receber",
              configId,
              userId: user.user.id,
              periodo,
            },
          }
        );

        if (error) {
          throw new Error(error.message);
        }

        setProgresso({
          total: resultado.total,
          processados: resultado.exportados,
          percentual: 100,
        });
        setErros(resultado.detalhesErros || []);

        const result: ResultadoSincronizacao = {
          success: true,
          total: resultado.total,
          exportados: resultado.exportados,
          erros: resultado.erros,
          detalhesErros: resultado.detalhesErros || [],
          mensagem: resultado.mensagem || `Exportados ${resultado.exportados} de ${resultado.total} registros`,
        };

        setUltimoResultado(result);

        toast({
          title: "Exportação Concluída",
          description: `${resultado.exportados} contas a receber exportadas${resultado.erros > 0 ? `, ${resultado.erros} erros` : ""}`,
        });

        return result;
      } catch (err: any) {
        const result: ResultadoSincronizacao = {
          success: false,
          total: 0,
          exportados: 0,
          erros: 1,
          detalhesErros: [{ registroId: "", tipo: "geral", erro: err.message }],
          mensagem: err.message || "Erro na exportação",
        };

        setUltimoResultado(result);
        setStatus("erro");

        toast({
          title: "Erro na Exportação",
          description: err.message,
          variant: "destructive",
        });

        return result;
      } finally {
        setStatus("completo");
      }
    },
    [toast]
  );

  /**
   * Exporta lançamentos de caixa para o ERP
   */
  const exportarCaixa = useCallback(
    async (configId: string, periodo: PeriodoConfig): Promise<ResultadoSincronizacao> => {
      setStatus("exportando");
      setErros([]);

      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          throw new Error("Usuário não autenticado");
        }

        const { data: resultado, error } = await supabase.functions.invoke(
          "sync-contabilidade",
          {
            body: {
              action: "exportar",
              tipo: "caixa",
              configId,
              userId: user.user.id,
              periodo,
            },
          }
        );

        if (error) {
          throw new Error(error.message);
        }

        setProgresso({
          total: resultado.total,
          processados: resultado.exportados,
          percentual: 100,
        });
        setErros(resultado.detalhesErros || []);

        const result: ResultadoSincronizacao = {
          success: true,
          total: resultado.total,
          exportados: resultado.exportados,
          erros: resultado.erros,
          detalhesErros: resultado.detalhesErros || [],
          mensagem: resultado.mensagem || `Exportados ${resultado.exportados} de ${resultado.total} registros`,
        };

        setUltimoResultado(result);

        toast({
          title: "Exportação Concluída",
          description: `${resultado.exportados} lançamentos de caixa exportados${resultado.erros > 0 ? `, ${resultado.erros} erros` : ""}`,
        });

        return result;
      } catch (err: any) {
        const result: ResultadoSincronizacao = {
          success: false,
          total: 0,
          exportados: 0,
          erros: 1,
          detalhesErros: [{ registroId: "", tipo: "geral", erro: err.message }],
          mensagem: err.message || "Erro na exportação",
        };

        setUltimoResultado(result);
        setStatus("erro");

        toast({
          title: "Erro na Exportação",
          description: err.message,
          variant: "destructive",
        });

        return result;
      } finally {
        setStatus("completo");
      }
    },
    [toast]
  );

  /**
   * Importa lançamentos do ERP
   */
  const importarLancamentos = useCallback(
    async (configId: string, periodo: PeriodoConfig): Promise<ResultadoImportacao> => {
      setStatus("importando");
      setErros([]);

      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          throw new Error("Usuário não autenticado");
        }

        const { data: resultado, error } = await supabase.functions.invoke(
          "sync-contabilidade",
          {
            body: {
              action: "importar",
              configId,
              userId: user.user.id,
              periodo,
            },
          }
        );

        if (error) {
          throw new Error(error.message);
        }

        setProgresso({
          total: resultado.total,
          processados: resultado.importados,
          percentual: 100,
        });
        setErros(resultado.detalhesErros || []);

        const result: ResultadoImportacao = {
          success: true,
          total: resultado.total,
          importados: resultado.importados,
          duplicados: resultado.duplicados,
          erros: resultado.erros,
          conciliadosAuto: resultado.conciliadosAuto,
          detalhesErros: resultado.detalhesErros || [],
          mensagem: resultado.mensagem || `Importados ${resultado.importados} de ${resultado.total} registros`,
        };

        setUltimoResultado(result);

        toast({
          title: "Importação Concluída",
          description: `${resultado.importados} lançamentos importados, ${resultado.conciliadosAuto} conciliados automaticamente`,
        });

        return result;
      } catch (err: any) {
        const result: ResultadoImportacao = {
          success: false,
          total: 0,
          importados: 0,
          duplicados: 0,
          erros: 1,
          conciliadosAuto: 0,
          detalhesErros: [{ registroId: "", tipo: "geral", erro: err.message }],
          mensagem: err.message || "Erro na importação",
        };

        setUltimoResultado(result);
        setStatus("erro");

        toast({
          title: "Erro na Importação",
          description: err.message,
          variant: "destructive",
        });

        return result;
      } finally {
        setStatus("completo");
      }
    },
    [toast]
  );

  /**
   * Tenta conciliar automaticamente lançamentos importados
   */
  const conciliarAutomaticamente = useCallback(
    async (configId: string): Promise<ResultadoConciliacao> => {
      setStatus("conciliando");

      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          throw new Error("Usuário não autenticado");
        }

        const { data: resultado, error } = await supabase.functions.invoke(
          "sync-contabilidade",
          {
            body: {
              action: "conciliar",
              configId,
              userId: user.user.id,
            },
          }
        );

        if (error) {
          throw new Error(error.message);
        }

        const result: ResultadoConciliacao = {
          success: true,
          totalProcessado: resultado.totalProcessado,
          conciliados: resultado.conciliados,
          pendentes: resultado.pendentes,
          sugeridosManual: resultado.sugeridosManual,
          mensagem: resultado.mensagem || `Conciliados ${resultado.conciliados} de ${resultado.totalProcessado} registros`,
        };

        setUltimoResultado(result);

        toast({
          title: "Conciliação Concluída",
          description: `${resultado.conciliados} conciliados, ${resultado.sugeridosManual} sugeridos para revisão manual`,
        });

        return result;
      } catch (err: any) {
        const result: ResultadoConciliacao = {
          success: false,
          totalProcessado: 0,
          conciliados: 0,
          pendentes: 0,
          sugeridosManual: 0,
          mensagem: err.message || "Erro na conciliação",
        };

        setUltimoResultado(result);
        setStatus("erro");

        toast({
          title: "Erro na Conciliação",
          description: err.message,
          variant: "destructive",
        });

        return result;
      } finally {
        setStatus("completo");
      }
    },
    [toast]
  );

  /**
   * Executa sincronização completa (exportar + importar + conciliar)
   */
  const sincronizacaoCompleta = useCallback(
    async (
      configId: string,
      periodo: PeriodoConfig,
      opcoes?: {
        exportarCP?: boolean;
        exportarCR?: boolean;
        exportarCaixa?: boolean;
        importar?: boolean;
        conciliar?: boolean;
      }
    ): Promise<{
      exportacaoCP?: ResultadoSincronizacao;
      exportacaoCR?: ResultadoSincronizacao;
      exportacaoCaixa?: ResultadoSincronizacao;
      importacao?: ResultadoImportacao;
      conciliacao?: ResultadoConciliacao;
    }> => {
      const resultados: any = {};

      if (opcoes?.exportarCP !== false) {
        resultados.exportacaoCP = await exportarContasPagar(configId, periodo);
      }

      if (opcoes?.exportarCR !== false) {
        resultados.exportacaoCR = await exportarContasReceber(configId, periodo);
      }

      if (opcoes?.exportarCaixa !== false) {
        resultados.exportacaoCaixa = await exportarCaixa(configId, periodo);
      }

      if (opcoes?.importar !== false) {
        resultados.importacao = await importarLancamentos(configId, periodo);
      }

      if (opcoes?.conciliar !== false) {
        resultados.conciliacao = await conciliarAutomaticamente(configId);
      }

      return resultados;
    },
    [exportarContasPagar, exportarContasReceber, exportarCaixa, importarLancamentos, conciliarAutomaticamente]
  );

  /**
   * Reprocessa apenas os registros com erro
   */
  const reprocessarErros = useCallback(
    async (configId: string, tipo: TipoExportacao): Promise<ResultadoSincronizacao> => {
      setStatus("exportando");
      setErros([]);

      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          throw new Error("Usuário não autenticado");
        }

        const { data: resultado, error } = await supabase.functions.invoke(
          "sync-contabilidade",
          {
            body: {
              action: "reprocessar",
              tipo,
              configId,
              userId: user.user.id,
            },
          }
        );

        if (error) {
          throw new Error(error.message);
        }

        const result: ResultadoSincronizacao = {
          success: true,
          total: resultado.total,
          exportados: resultado.exportados,
          erros: resultado.erros,
          detalhesErros: resultado.detalhesErros || [],
          mensagem: resultado.mensagem || `Reprocessados ${resultado.exportados} de ${resultado.total} registros`,
        };

        setUltimoResultado(result);
        setErros(resultado.detalhesErros || []);

        toast({
          title: "Reprocessamento Concluído",
          description: `${resultado.exportados} registros reprocessados${resultado.erros > 0 ? `, ${resultado.erros} ainda com erro` : ""}`,
        });

        return result;
      } catch (err: any) {
        const result: ResultadoSincronizacao = {
          success: false,
          total: 0,
          exportados: 0,
          erros: 1,
          detalhesErros: [{ registroId: "", tipo: "geral", erro: err.message }],
          mensagem: err.message || "Erro no reprocessamento",
        };

        setUltimoResultado(result);
        setStatus("erro");

        toast({
          title: "Erro no Reprocessamento",
          description: err.message,
          variant: "destructive",
        });

        return result;
      } finally {
        setStatus("completo");
      }
    },
    [toast]
  );

  const resetar = useCallback(() => {
    setStatus("idle");
    setProgresso({ total: 0, processados: 0, percentual: 0 });
    setErros([]);
    setUltimoResultado(null);
  }, []);

  return {
    status,
    progresso,
    erros,
    ultimoResultado,
    exportarContasPagar,
    exportarContasReceber,
    exportarCaixa,
    importarLancamentos,
    conciliarAutomaticamente,
    sincronizacaoCompleta,
    reprocessarErros,
    resetar,
  };
}
