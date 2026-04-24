import { supabase } from "@/integrations/supabase/client";

// Bypass typing for tables not present in generated types
const db: any = supabase;
import { toast } from "@/hooks/use-toast";

/** Intervalo de sincronização em milissegundos (5 minutos) */
const SYNC_INTERVAL = 5 * 60 * 1000;

/** Dias antes da expiração para alertar */
const CERTIFICATE_ALERT_DAYS = 30;

/** Interface de estado do scheduler */
interface SchedulerState {
  intervalId: NodeJS.Timeout | null;
  ultimaExecucao: Date | null;
  emExecucao: boolean;
}

/** Estado interno do scheduler */
const state: SchedulerState = {
  intervalId: null,
  ultimaExecucao: null,
  emExecucao: false,
};

/** Nota Fiscal de Serviço (simplificada para o scheduler) */
interface NotaFiscalScheduler {
  id: string;
  user_id: string;
  numero_nota?: string | null;
  status: string;
  data_emissao: string;
  data_autorizacao?: string | null;
  codigo_verificacao?: string | null;
  link_nfse?: string | null;
  certificado_id?: string | null;
  mensagem_erro?: string | null;
  link_pdf?: string | null;
  link_xml?: string | null;
}

/** Certificado digital */
interface CertificadoDigital {
  id: string;
  user_id: string;
  nome: string;
  data_validade: string;
  ativo: boolean;
}

/**
 * Verifica se um rascunho expirou (30 dias)
 */
function rascunhoExpirou(dataEmissao: string): boolean {
  const data = new Date(dataEmissao);
  const hoje = new Date();
  const diffDias = Math.floor(
    (hoje.getTime() - data.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diffDias > 30;
}

/**
 * Calcula dias restantes para expiração do certificado
 */
function diasParaExpirar(dataValidade: string): number {
  const validade = new Date(dataValidade);
  const hoje = new Date();
  const diffDias = Math.floor(
    (validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diffDias;
}

/**
 * Sincroniza notas pendentes em lote
 * Consulta todas as notas com status 'enviando' e atualiza seus status
 */
export async function sincronizarNotasPendentes(): Promise<{
  sincronizadas: number;
  erros: number;
}> {
  if (state.emExecucao) {
    console.log("Sincronização já em andamento...");
    return { sincronizadas: 0, erros: 0 };
  }

  state.emExecucao = true;

  try {
    // Buscar todas as notas em estado 'enviando'
    const { data: notasPendentes, error } = await db
      .from("notas_fiscais_servico")
      .select("*")
      .eq("status", "enviando")
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar notas pendentes: ${error.message}`);
    }

    if (!notasPendentes || notasPendentes.length === 0) {
      return { sincronizadas: 0, erros: 0 };
    }

    let sincronizadas = 0;
    let erros = 0;

    // Processar em lotes de 10
    const loteSize = 10;
    for (let i = 0; i < notasPendentes.length; i += loteSize) {
      const lote = notasPendentes.slice(i, i + loteSize);

      await Promise.all(
        lote.map(async (nota: NotaFiscalScheduler) => {
          try {
            // Chamar Edge Function para consultar status na prefeitura
            const { data: result, error: functionError } =
              await supabase.functions.invoke("sync-nfse", {
                body: {
                  action: "consultar",
                  notaId: nota.id,
                },
              });

            if (functionError) {
              console.warn(`Erro ao sincronizar nota ${nota.id}:`, functionError);
              erros++;
              return;
            }

            if (result?.nota) {
              const notaAtualizada = result.nota as NotaFiscalScheduler;

              // Se mudou de status, atualizar localmente
              if (notaAtualizada.status !== nota.status) {
                await db
                  .from("notas_fiscais_servico")
                  .update({
                    status: notaAtualizada.status,
                    numero_nota: notaAtualizada.numero_nota,
                    data_autorizacao: notaAtualizada.data_autorizacao,
                    codigo_verificacao: notaAtualizada.codigo_verificacao,
                    link_nfse: notaAtualizada.link_nfse,
                    link_pdf: notaAtualizada.link_pdf,
                    link_xml: notaAtualizada.link_xml,
                    mensagem_erro: notaAtualizada.mensagem_erro,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", nota.id);

                sincronizadas++;

                // Notificar mudança de status
                if (notaAtualizada.status === "autorizada") {
                  toast({
                    title: "Nota Autorizada",
                    description: `Nota ${notaAtualizada.numero_nota} foi autorizada pela prefeitura.`,
                  });
                } else if (notaAtualizada.status === "rejeitada") {
                  toast({
                    title: "Nota Rejeitada",
                    description:
                      notaAtualizada.mensagem_erro ||
                      `Nota ${notaAtualizada.numero_nota || nota.id} foi rejeitada.`,
                    variant: "destructive",
                  });
                }
              }
            }
          } catch (err) {
            console.warn(`Erro ao processar nota ${nota.id}:`, err);
            erros++;
          }
        })
      );

      // Pequeno delay entre lotes para não sobrecarregar
      if (i + loteSize < notasPendentes.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    state.ultimaExecucao = new Date();

    return { sincronizadas, erros };
  } catch (err: any) {
    console.error("Erro na sincronização:", err);
    return { sincronizadas: 0, erros: 1 };
  } finally {
    state.emExecucao = false;
  }
}

/**
 * Limpa rascunhos expirados (mais de 30 dias)
 */
export async function limparRascunhosExpirados(): Promise<number> {
  try {
    const { data: rascunhos, error } = await db
      .from("notas_fiscais_servico")
      .select("id, data_emissao")
      .eq("status", "rascunho");

    if (error) {
      throw new Error(error.message);
    }

    const expirados =
      rascunhos?.filter((r: NotaFiscalScheduler) =>
        rascunhoExpirou(r.data_emissao)
      ) || [];

    if (expirados.length === 0) {
      return 0;
    }

    // Deletar rascunhos expirados
    const ids = expirados.map((r) => r.id);
    const { error: deleteError } = await db
      .from("notas_fiscais_servico")
      .delete()
      .in("id", ids);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    console.log(`${expirados.length} rascunhos expirados removidos`);
    return expirados.length;
  } catch (err) {
    console.error("Erro ao limpar rascunhos:", err);
    return 0;
  }
}

/**
 * Verifica certificados próximos da expiração
 * Retora lista de certificados que expiram em menos de 30 dias
 */
export async function verificarCertificadosExpirando(): Promise<
  CertificadoDigital[]
> {
  try {
    const { data: certificados, error } = await (supabase as any)
      .from("certificados_nfse")
      .select("*")
      .eq("ativo", true);

    if (error) {
      throw new Error(error.message);
    }

    const expirando =
      (certificados as any[])?.filter((cert: any) => {
        const dias = diasParaExpirar(cert.data_validade);
        return dias <= CERTIFICATE_ALERT_DAYS;
      }) || [];

    return expirando as CertificadoDigital[];
  } catch (err) {
    console.error("Erro ao verificar certificados:", err);
    return [];
  }
}

/**
 * Renova certificados próximos da expiração
 * Notifica usuários sobre certificados que precisam ser renovados
 */
export async function renovarCertificados(): Promise<void> {
  const expirando = await verificarCertificadosExpirando();

  for (const cert of expirando) {
    const dias = diasParaExpirar(cert.data_validade);

    if (dias <= 0) {
      // Certificado expirado
      toast({
        title: "Certificado Expirado",
        description: `O certificado ${cert.nome} expirou. Renove imediatamente para emitir notas.`,
        variant: "destructive",
      });

      // Atualizar status do certificado
      await supabase
        .from("certificados_nfse")
        .update({ ativo: false })
        .eq("id", cert.id);
    } else if (dias <= 7) {
      // Crítico - menos de 7 dias
      toast({
        title: "Certificado Expirando",
        description: `O certificado ${cert.nome} expira em ${dias} dias. Renove urgentemente!`,
        variant: "destructive",
      });
    } else if (dias <= 30) {
      // Alerta - menos de 30 dias
      toast({
        title: "Certificado Próximo da Expiração",
        description: `O certificado ${cert.nome} expira em ${dias} dias. Planeje a renovação.`,
      });
    }
  }
}

/**
 * Inicia o agendador automático
 * Executa sincronização a cada 5 minutos
 */
export function iniciarScheduler(): void {
  if (state.intervalId) {
    console.log("Scheduler já está rodando");
    return;
  }

  // Executar imediatamente na primeira vez
  sincronizarNotasPendentes().then((result) => {
    if (result.sincronizadas > 0) {
      console.log(`${result.sincronizadas} notas sincronizadas`);
    }
  });

  // Limpar rascunhos expirados
  limparRascunhosExpirados();

  // Verificar certificados
  renovarCertificados();

  // Agendar execuções periódicas
  state.intervalId = setInterval(async () => {
    // Sincronizar notas pendentes
    const result = await sincronizarNotasPendentes();
    if (result.sincronizadas > 0) {
      console.log(
        `[${new Date().toISOString()}] ${result.sincronizadas} notas sincronizadas`
      );
    }

    // A cada 6 ciclos (30 minutos), verificar rascunhos e certificados
    if (
      state.ultimaExecucao &&
      state.ultimaExecucao.getMinutes() % 30 === 0
    ) {
      await limparRascunhosExpirados();
      await renovarCertificados();
    }
  }, SYNC_INTERVAL);

  console.log("Scheduler de NFS-e iniciado");
}

/**
 * Para o agendador
 */
export function pararScheduler(): void {
  if (state.intervalId) {
    clearInterval(state.intervalId);
    state.intervalId = null;
    console.log("Scheduler de NFS-e parado");
  }
}

/**
 * Verifica se o scheduler está rodando
 */
export function isSchedulerRunning(): boolean {
  return state.intervalId !== null;
}

/**
 * Retorna informações do estado atual do scheduler
 */
export function getSchedulerStatus(): {
  rodando: boolean;
  ultimaExecucao: Date | null;
  emExecucao: boolean;
} {
  return {
    rodando: state.intervalId !== null,
    ultimaExecucao: state.ultimaExecucao,
    emExecucao: state.emExecucao,
  };
}

/**
 * Força uma sincronização imediata
 */
export async function forcarSincronizacao(): Promise<{
  sincronizadas: number;
  erros: number;
}> {
  return sincronizarNotasPendentes();
}
