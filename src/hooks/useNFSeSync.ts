import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Bypass typing for tables not present in generated types
const db: any = supabase;
import { toast } from "@/hooks/use-toast";

/** Status possíveis de uma NFS-e */
export type NFSeStatus =
  | "rascunho"
  | "enviando"
  | "autorizada"
  | "rejeitada"
  | "cancelada"
  | "erro";

/** Interface da Nota Fiscal de Serviço */
export interface NotaFiscal {
  id: string;
  user_id: string;
  numero_nota?: string | null;
  serie?: string | null;
  status: NFSeStatus;
  cliente_id: string | null;
  cliente_nome: string;
  cliente_cnpj_cpf?: string | null;
  cliente_endereco?: string | null;
  cliente_email?: string | null;
  servico_descricao: string;
  servico_codigo: string;
  valor_servico: number;
  valor_iss: number;
  aliquota_iss: number;
  data_emissao: string;
  data_competencia: string;
  data_autorizacao?: string | null;
  codigo_verificacao?: string | null;
  link_nfse?: string | null;
  link_pdf?: string | null;
  link_xml?: string | null;
  mensagem_erro?: string | null;
  certificado_id?: string | null;
  created_at: string;
  updated_at: string;
}

/** Retorno da consulta de status */
export interface StatusConsultaResult {
  success: boolean;
  status?: NFSeStatus;
  numeroNota?: string;
  codigoVerificacao?: string;
  linkPDF?: string;
  linkXML?: string;
  mensagemErro?: string;
  dataAutorizacao?: string;
}

/** Hook para sincronização de status de NFS-e */
export function useNFSeSync() {
  const [status, setStatus] = useState<NFSeStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Consulta o status de uma nota fiscal na prefeitura
   */
  const consultarStatusNota = useCallback(
    async (notaId: string): Promise<StatusConsultaResult> => {
      setLoading(true);
      setError(null);

      try {
        // Buscar dados da nota
        const { data: nota, error: notaError } = await db
          .from("notas_fiscais_servico")
          .select("*, certificados_nfse(*)")
          .eq("id", notaId)
          .single();

        if (notaError || !nota) {
          throw new Error("Nota fiscal não encontrada");
        }

        // Chamar Edge Function para consultar prefeitura
        const { data: result, error: functionError } = await supabase.functions.invoke(
          "consultar-nfse",
          {
            body: {
              action: "consultarStatus",
              notaId,
              certificadoId: nota.certificado_id,
              numeroNota: nota.numero_nota,
            },
          }
        );

        if (functionError) {
          throw new Error(functionError.message);
        }

        setStatus(result.status || nota.status);

        return {
          success: true,
          status: result.status,
          numeroNota: result.numeroNota,
          codigoVerificacao: result.codigoVerificacao,
          linkPDF: result.linkPDF,
          linkXML: result.linkXML,
          mensagemErro: result.mensagemErro,
          dataAutorizacao: result.dataAutorizacao,
        };
      } catch (err: any) {
        const msg = err.message || "Erro ao consultar status da nota";
        setError(msg);
        return {
          success: false,
          mensagemErro: msg,
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Atualiza os dados locais de uma nota pendente
   */
  const atualizarNotaPendente = useCallback(
    async (nota: Partial<NotaFiscal> & { id: string }): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const updateData: Partial<NotaFiscal> = {
          updated_at: new Date().toISOString(),
        };

        // Atualizar campos se fornecidos
        if (nota.status) updateData.status = nota.status;
        if (nota.numero_nota) updateData.numero_nota = nota.numero_nota;
        if (nota.codigo_verificacao) updateData.codigo_verificacao = nota.codigo_verificacao;
        if (nota.data_autorizacao) updateData.data_autorizacao = nota.data_autorizacao;
        if (nota.link_nfse) updateData.link_nfse = nota.link_nfse;
        if (nota.link_pdf) updateData.link_pdf = nota.link_pdf;
        if (nota.link_xml) updateData.link_xml = nota.link_xml;
        if (nota.mensagem_erro !== undefined) updateData.mensagem_erro = nota.mensagem_erro;

        const { error: updateError } = await db
          .from("notas_fiscais_servico")
          .update(updateData)
          .eq("id", nota.id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        // Se foi autorizada, fazer download automático
        if (nota.status === "autorizada") {
          await baixarPDFeXML(nota.id);
        }

        setStatus(nota.status || null);
        return true;
      } catch (err: any) {
        const msg = err.message || "Erro ao atualizar nota";
        setError(msg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Faz o download automático de PDF e XML após autorização
   */
  const baixarPDFeXML = useCallback(async (notaId: string): Promise<boolean> => {
    try {
      const { data: nota, error: notaError } = await db
        .from("notas_fiscais_servico")
        .select("numero_nota, link_pdf, link_xml, cliente_nome")
        .eq("id", notaId)
        .single();

      if (notaError || !nota) {
        throw new Error("Nota não encontrada");
      }

      // Download do PDF se disponível
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

      // Download do XML se disponível
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

      return true;
    } catch (err: any) {
      console.error("Erro ao baixar documentos:", err);
      return false;
    }
  }, []);

  /**
   * Verifica se uma nota pode ser cancelada (mesmo dia - regra SP)
   */
  const podeCancelar = useCallback((nota: NotaFiscal): boolean => {
    if (nota.status !== "autorizada" || !nota.data_autorizacao) {
      return false;
    }

    const dataAutorizacao = new Date(nota.data_autorizacao);
    const hoje = new Date();

    // Verificar se é o mesmo dia
    return (
      dataAutorizacao.getDate() === hoje.getDate() &&
      dataAutorizacao.getMonth() === hoje.getMonth() &&
      dataAutorizacao.getFullYear() === hoje.getFullYear()
    );
  }, []);

  /**
   * Cancela uma nota fiscal (se possível)
   */
  const cancelarNota = useCallback(
    async (notaId: string, motivo: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        // Buscar dados da nota
        const { data: nota, error: notaError } = await db
          .from("notas_fiscais_servico")
          .select("*")
          .eq("id", notaId)
          .single();

        if (notaError || !nota) {
          throw new Error("Nota não encontrada");
        }

        if (!podeCancelar(nota)) {
          throw new Error(
            "Nota não pode ser cancelada. Só é permitido cancelar no mesmo dia da autorização (regra São Paulo)."
          );
        }

        // Chamar Edge Function para cancelar
        const { error: functionError } = await supabase.functions.invoke(
          "consultar-nfse",
          {
            body: {
              action: "cancelar",
              notaId,
              numeroNota: nota.numero_nota,
              codigoVerificacao: nota.codigo_verificacao,
              motivo,
            },
          }
        );

        if (functionError) {
          throw new Error(functionError.message);
        }

        // Atualizar status local
        await db
          .from("notas_fiscais_servico")
          .update({
            status: "cancelada",
            updated_at: new Date().toISOString(),
          })
          .eq("id", notaId);

        setStatus("cancelada");
        toast({
          title: "Nota cancelada",
          description: `Nota ${nota.numero_nota} foi cancelada com sucesso.`,
        });

        return true;
      } catch (err: any) {
        const msg = err.message || "Erro ao cancelar nota";
        setError(msg);
        toast({
          title: "Erro ao cancelar",
          description: msg,
          variant: "destructive",
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [podeCancelar]
  );

  /**
   * Lista notas pendentes de sincronização
   */
  const listarNotasPendentes = useCallback(async (): Promise<NotaFiscal[]> => {
    try {
      const { data, error: queryError } = await db
        .from("notas_fiscais_servico")
        .select("*")
        .in("status", ["enviando", "rascunho"])
        .order("created_at", { ascending: false });

      if (queryError) {
        throw new Error(queryError.message);
      }

      return (data as NotaFiscal[]) || [];
    } catch (err: any) {
      console.error("Erro ao listar notas pendentes:", err);
      return [];
    }
  }, []);

  return {
    status,
    loading,
    error,
    consultarStatusNota,
    atualizarNotaPendente,
    baixarPDFeXML,
    podeCancelar,
    cancelarNota,
    listarNotasPendentes,
  };
}
