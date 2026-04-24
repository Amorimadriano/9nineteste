/**
 * Módulo de NFS-e (Nota Fiscal de Serviço Eletrônica)
 * Nine BPO Financeiro
 */

// Scheduler
export {
  sincronizarNotasPendentes,
  limparRascunhosExpirados,
  verificarCertificadosExpirando,
  renovarCertificados,
  iniciarScheduler,
  pararScheduler,
  isSchedulerRunning,
  getSchedulerStatus,
  forcarSincronizacao,
} from "./scheduler";

// Notifications
export {
  notificarErro,
  notificarSucesso,
  notificarCertificadoExpirando,
  notificarMudancaStatus,
  notificarPodeCancelar,
  notificarRascunhoExpirado,
  solicitarPermissaoNotificacoes,
  notificarDownloadConcluido,
  notificarErroConexao,
  notificarLimiteAtingido,
  notificarCancelamentoSucesso,
  notificarCancelamentoErro,
  type TipoNotificacao,
  type NotificacaoConfig,
} from "./notifications";

// GINFES API - Integração Prefeitura SP
export { NFSeClientSP, nfseClientSP } from './client';
export { NFSeConfig } from './config';
export {
  carregarCertificadoDigital,
  extrairInfoCertificado,
  criarHeaderSOAP,
  assinarXML,
  assinarRps,
  assinarLote,
  assinarCancelamento,
  gerarIdRps,
  gerarIdLote,
  validarValidadeCertificado,
  formatarCnpjNfse,
  formatarInscricaoMunicipal,
  prepararXmlParaAssinatura,
  templatesAssinatura,
} from './auth';
export {
  AssinaturaDigitalService,
  criarAssinaturaService,
  certificadoEstaValido,
  diasAteExpiracao,
} from './assinatura';
export {
  construirRps,
  construirLoteRps,
  construirPedidoConsulta,
  construirPedidoConsultaLote,
  construirPedidoCancelamento,
  validarDadosNota,
} from './xmlBuilder';
export {
  parsearRespostaEmissao,
  parsearRespostaConsulta,
  parsearRespostaConsultaLote,
  parsearRespostaCancelamento,
  parsearErros,
  traduzirErroGinfes,
  verificarErroAutenticacao,
} from './parser';

// Tipos GINFES
export type { NFSeClientConfig } from './client';
export type {
  RespostaEmissao,
  RespostaConsulta,
  RespostaConsultaLote,
  RespostaCancelamento,
} from './parser';
export type {
  CertificadoDigital,
  CertificadoInfo,
  EmitenteNfse,
  AssinaturaService,
} from './auth';
export type {
  DadosNotaFiscal,
  ValoresServico,
  EnderecoTomador,
  Tomador,
  Servico,
  IdentificacaoRps,
} from './xmlBuilder';
export type {
  MensagemRetorno,
  NfseDetalhada,
  NfseErro,
} from './parser';
export type {
  NaturezaOperacao,
  TipoRps,
  StatusRetorno,
} from './config';

// Versão e informações
export const NFS_E_VERSION = '1.0.0';
export const NFS_E_PROVEDOR = {
  nome: 'GINFES',
  cidade: 'São Paulo',
  estado: 'SP',
  layout: 'ABRASF 2.04',
};