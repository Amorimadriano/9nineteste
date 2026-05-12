/**
 * Hooks do Nine BPO Financeiro
 */

export { useOpenBankingSync, type SyncStats, type SyncResult } from "./useOpenBankingSync";
export {
  useOpenBankingRealtime,
  useOpenBankingNotifications,
  type RealtimeTransaction,
  type UseOpenBankingRealtimeOptions,
} from "./useOpenBankingRealtime";

// NFS-e Hooks
export {
  useNFSeSync,
  type NFSeStatus,
  type NotaFiscal,
  type StatusConsultaResult,
} from "./useNFSeSync";
export {
  useNFSePolling,
  type UseNFSePollingReturn,
} from "./useNFSePolling";

// Contabilidade Hooks
export {
  useSincronizacaoContabil,
  type PeriodoConfig,
  type ProgressoSincronizacao,
  type DetalheErro,
  type ResultadoSincronizacao,
  type ResultadoConciliacao,
  type ResultadoImportacao,
  type TipoExportacao,
  type StatusSincronizacao,
} from "./contabilidade/useSincronizacaoContabil";

export {
  useSincronizacaoAutomatica,
  useBackgroundSyncCheck,
  type ConfiguracaoAgendamento,
  type StatusAgendamento,
  type NotificacaoSync,
} from "./contabilidade/useSincronizacaoAutomatica";
