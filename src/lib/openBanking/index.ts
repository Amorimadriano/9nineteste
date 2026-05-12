/**
 * Módulo de Integração Open Banking - Nine BPO Financeiro
 * Task #23 - Agente Financeiro & DevOps
 *
 * @module openBanking
 */

// Configurações
export {
  BANCOS,
  OPEN_BANKING_CONFIG,
  SCOPES_OBRIGATORIOS,
  SCOPES_OPCIONAIS,
  HEADERS_PADRAO,
  RATE_LIMITS,
  ERROS_OPEN_BANKING,
  BANCOS_DISPONIVEIS,
  obterConfigBanco,
  obterApiUrl,
  obterClientId,
} from './config';

export type {
  ConfigBanco,
  ConfigOpenBanking,
  Ambiente,
  BancoCodigo,
} from './config';

// Autenticação
export {
  criarPKCEChallenge,
  iniciarFluxoConsentimento,
  trocarCodePorToken,
  refreshAccessToken,
  revogarToken,
  isTokenExpirado,
  calcularExpiracao,
  isBancoConfigurado,
  getRedirectUri,
  limparDadosAuth,
} from './auth';

export type {
  PKCEChallenge,
  TokenResponse,
  ConsentimentoState,
  IntegracaoOpenBanking,
} from './auth';

// API Client
export {
  OpenBankingClient,
  criarOpenBankingClient,
  isIntegracaoAtiva,
} from './apiClient';

export type {
  ContaOpenBanking,
  SaldoOpenBanking,
  TransacaoOpenBanking,
  ExtratoOpenBanking,
  FaturaCartaoOpenBanking,
  ApiError,
  ApiResponse,
} from './apiClient';

// Parser
export {
  OpenBankingParser,
  criarParser,
  parseMultiplosBancos,
} from './parser';

export type {
  ContaNineBPO,
  TransacaoNineBPO,
  ExtratoNineBPO,
  FaturaCartaoNineBPO,
} from './parser';

// Matching e Conciliação
export {
  matchingAutomatico,
  sugerirMatchesManuais,
} from './matching';

export type {
  MatchingOptions,
  MatchingResult,
} from './matching';

// Agendador de Sincronização
export {
  inicializarAgendador,
  obterConfiguracao,
  salvarConfiguracao,
  sincronizarAgora,
  verificarToken,
  obterLogsSincronizacao,
  useOpenBankingScheduler,
} from './scheduler';

export type {
  SchedulerConfig,
  TokenStatus,
} from './scheduler';
