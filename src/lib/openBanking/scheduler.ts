import { supabase } from "@/integrations/supabase/client";

// Bypass typing for tables not present in generated types
const db: any = supabase;

export interface SchedulerConfig {
  /** Horário da sincronização (formato 24h, padrão: "06:00") */
  horario: string;
  /** Dias da semana (0=Dom, 1=Seg, ..., 6=Sab) */
  diasSemana: number[];
  /** Habilitar sincronização automática */
  habilitado: boolean;
}

export interface TokenStatus {
  valido: boolean;
  expiraEm: string;
  diasRestantes: number;
}

const SCHEDULER_CONFIG_KEY = "open_banking_scheduler_config";
const DEFAULT_CONFIG: SchedulerConfig = {
  horario: "06:00",
  diasSemana: [1, 2, 3, 4, 5], // Seg-Sex
  habilitado: true,
};

/**
 * Agendador de sincronização automática de extratos Open Banking
 *
 * Gerencia:
 * - Configuração de horário de sincronização
 * - Verificação de tokens expirados
 * - Execução em background
 * - Logs de sincronização
 */

/**
 * Inicializa o agendador de sincronização
 * Deve ser chamado no início da aplicação
 */
export function inicializarAgendador(): void {
  if (typeof window === "undefined") return;

  // Verificar se há configuração salva
  const config = obterConfiguracao();

  if (config.habilitado) {
    agendarProximaSincronizacao(config);
  }

  // Ouvir mudanças de visibilidade para sincronizar quando usuário retorna
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      verificarSincronizacaoPendente();
    }
  });
}

/**
 * Agenda a próxima sincronização baseada na configuração
 */
function agendarProximaSincronizacao(config: SchedulerConfig): void {
  if (!config.habilitado) return;

  const agora = new Date();
  const [hora, minuto] = config.horario.split(":").map(Number);

  // Encontrar próximo dia válido
  let proximaData = new Date(agora);
  proximaData.setHours(hora, minuto, 0, 0);

  // Se já passou do horário hoje, começar amanhã
  if (proximaData <= agora) {
    proximaData.setDate(proximaData.getDate() + 1);
  }

  // Encontrar próximo dia da semana válido
  while (!config.diasSemana.includes(proximaData.getDay())) {
    proximaData.setDate(proximaData.getDate() + 1);
  }

  const delay = proximaData.getTime() - agora.getTime();

  // Agendar timeout
  setTimeout(async () => {
    await executarSincronizacaoAgendada();
    // Reagendar para próxima execução
    agendarProximaSincronizacao(config);
  }, delay);

  console.log(
    `[Open Banking Scheduler] Próxima sincronização agendada para: ${proximaData.toLocaleString()}`
  );
}

/**
 * Executa a sincronização agendada
 */
async function executarSincronizacaoAgendada(): Promise<void> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.log("[Open Banking Scheduler] Usuário não autenticado");
      return;
    }

    // Buscar integrações ativas
    const { data: integracoes, error } = await db
      .from("open_banking_integracoes")
      .select("*")
      .eq("user_id", user.user.id)
      .eq("consentimento_ativo", true);

    if (error || !integracoes || integracoes.length === 0) {
      console.log("[Open Banking Scheduler] Nenhuma integração ativa encontrada");
      return;
    }

    // Sincronizar cada integração
    for (const integracao of integracoes) {
      // Verificar token
      const tokenStatus = verificarToken(integracao.token_expira_em);

      if (!tokenStatus.valido) {
        console.log(
          `[Open Banking Scheduler] Token expirado para integração ${integracao.id}`
        );
        await registrarLogSincronizacao({
          integracaoId: integracao.id,
          userId: user.user.id,
          status: "erro",
          mensagem: "Token expirado",
          detalhes: { tokenStatus },
        });
        continue;
      }

      // Renovar token se estiver prestes a expirar (menos de 7 dias)
      if (tokenStatus.diasRestantes <= 7) {
        const renovado = await renovarTokenSeNecessario(integracao.id);
        if (!renovado) {
          console.log(
            `[Open Banking Scheduler] Falha ao renovar token para integração ${integracao.id}`
          );
          continue;
        }
      }

      // Executar sincronização via Edge Function
      try {
        const { data: syncData, error: syncError } =
          await supabase.functions.invoke("sync-open-banking", {
            body: {
              integracaoId: integracao.id,
              userId: user.user.id,
              agendado: true,
            },
          });

        await registrarLogSincronizacao({
          integracaoId: integracao.id,
          userId: user.user.id,
          status: syncError ? "erro" : "sucesso",
          mensagem: syncError?.message || "Sincronização concluída",
          detalhes: syncData || { error: syncError },
        });
      } catch (error: any) {
        await registrarLogSincronizacao({
          integracaoId: integracao.id,
          userId: user.user.id,
          status: "erro",
          mensagem: error.message,
          detalhes: { error },
        });
      }
    }
  } catch (error) {
    console.error("[Open Banking Scheduler] Erro na sincronização agendada:", error);
  }
}

/**
 * Verifica se há sincronização pendente (quando usuário retorna ao app)
 */
async function verificarSincronizacaoPendente(): Promise<void> {
  const ultimaSincronizacao = localStorage.getItem("open_banking_last_sync");
  const agora = new Date();

  // Se nunca sincronizou ou se passou mais de 1 hora
  if (
    !ultimaSincronizacao ||
    agora.getTime() - new Date(ultimaSincronizacao).getTime() > 60 * 60 * 1000
  ) {
    const config = obterConfiguracao();
    if (config.habilitado) {
      // Executar em background sem bloquear
      executarSincronizacaoAgendada().catch(console.error);
    }
  }
}

/**
 * Verifica status do token
 */
export function verificarToken(tokenExpiraEm: string): TokenStatus {
  const expiraEm = new Date(tokenExpiraEm);
  const agora = new Date();
  const diffMs = expiraEm.getTime() - agora.getTime();
  const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return {
    valido: diffMs > 0,
    expiraEm: tokenExpiraEm,
    diasRestantes: Math.max(0, diasRestantes),
  };
}

/**
 * Renova o token de acesso se necessário
 */
async function renovarTokenSeNecessario(integracaoId: string): Promise<boolean> {
  try {
    // Chamar Edge Function para renovação de token
    const { data, error } = await supabase.functions.invoke(
      "refresh-open-banking-token",
      {
        body: { integracaoId },
      }
    );

    if (error) {
      console.error("Erro ao renovar token:", error);
      return false;
    }

    return data?.success || false;
  } catch (error) {
    console.error("Erro ao renovar token:", error);
    return false;
  }
}

/**
 * Registra log de sincronização
 */
async function registrarLogSincronizacao({
  integracaoId,
  userId,
  status,
  mensagem,
  detalhes,
}: {
  integracaoId: string;
  userId: string;
  status: "sucesso" | "erro" | "aviso";
  mensagem: string;
  detalhes?: Record<string, any>;
}): Promise<void> {
  try {
    await (supabase as any).from("open_banking_sync_logs").insert({
      integracao_id: integracaoId,
      user_id: userId,
      status,
      mensagem,
      detalhes,
    });

    // Atualizar timestamp da última sincronização
    localStorage.setItem("open_banking_last_sync", new Date().toISOString());
  } catch (error) {
    console.error("Erro ao registrar log:", error);
  }
}

/**
 * Obtém configuração do agendador
 */
export function obterConfiguracao(): SchedulerConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;

  const salvo = localStorage.getItem(SCHEDULER_CONFIG_KEY);
  if (salvo) {
    return { ...DEFAULT_CONFIG, ...JSON.parse(salvo) };
  }
  return DEFAULT_CONFIG;
}

/**
 * Salva configuração do agendador
 */
export function salvarConfiguracao(config: Partial<SchedulerConfig>): void {
  if (typeof window === "undefined") return;

  const atual = obterConfiguracao();
  const novo = { ...atual, ...config };
  localStorage.setItem(SCHEDULER_CONFIG_KEY, JSON.stringify(novo));

  // Reagendar se necessário
  if (config.habilitado !== undefined || config.horario || config.diasSemana) {
    agendarProximaSincronizacao(novo);
  }
}

/**
 * Força sincronização imediata
 */
export async function sincronizarAgora(): Promise<{
  sucesso: boolean;
  mensagem: string;
}> {
  try {
    await executarSincronizacaoAgendada();
    return { sucesso: true, mensagem: "Sincronização concluída" };
  } catch (error: any) {
    return { sucesso: false, mensagem: error.message };
  }
}

/**
 * Obtém logs de sincronização recentes
 */
export async function obterLogsSincronizacao(
  limite: number = 50
): Promise<
  Array<{
    id: string;
    integracaoId: string;
    status: string;
    mensagem: string;
    detalhes: any;
    criadoEm: string;
  }>
> {
  const { data, error } = await (supabase as any)
    .from("open_banking_sync_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limite);

  if (error) {
    console.error("Erro ao buscar logs:", error);
    return [];
  }

  return (
    (data as any[])?.map((log: any) => ({
      id: log.id,
      integracaoId: log.integracao_id,
      status: log.status,
      mensagem: log.mensagem,
      detalhes: log.detalhes,
      criadoEm: log.created_at,
    })) || []
  );
}

/**
 * Hook para usar com React
 * Inicializa o agendador quando o componente monta
 */
export function useOpenBankingScheduler() {
  return {
    config: obterConfiguracao(),
    salvarConfiguracao,
    sincronizarAgora,
    verificarToken,
    obterLogsSincronizacao,
    inicializar: inicializarAgendador,
  };
}
