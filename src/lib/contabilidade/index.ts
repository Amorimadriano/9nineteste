/**
 * Módulo de Contabilidade - Processadores e Utilitários
 * Sincronização bidirecional com ERPs
 */

// Exportador
export {
  validarSaldos,
  buscarConfiguracao,
  aplicarMapeamento,
  transformarParaERP,
  buscarContasPagar,
  buscarContasReceber,
  buscarLancamentosCaixa,
  validarDados,
  enviarParaERP,
  registrarExportacao,
  verificarExportacaoExistente,
  processarExportacaoLote,
  reprocessarErros,
  type PeriodoExportacao,
  type ConfigExportacao,
  type ResultadoProcessamento,
  type DetalheErro,
  type DadoExportacao,
} from "./processadorExportacao";

// Importador
export {
  criarBackup,
  buscarLancamentosERP,
  verificarDuplicidade,
  aplicarMapeamentoReverso,
  criarLancamentoImportado,
  tentarConciliacaoAutomatica as tentarConciliacaoImportacao,
  processarImportacao,
  buscarLancamentosPendentesRevisao,
  vincularLancamentoManual,
  ignorarLancamento,
  type PeriodoImportacao,
  type ConfigImportacao,
  type ResultadoImportacao as ResultadoImportacaoProcessador,
  type LancamentoERP,
} from "./processadorImportacao";

// Conciliador
export {
  calcularScore,
  buscarCandidatos,
  tentarConciliacaoAutomatica,
  conciliarTodosPendentes,
  gerarRelatorioDivergencias,
  exportarRelatorioCSV,
  atualizarCriterios,
  buscarCriterios,
  type CriterioConciliacao,
  type SugestaoMatch,
  type ResultadoConciliacao as ResultadoConciliacaoProcessador,
  type RelatorioDivergencias,
  type DivergenciaValor,
  type DivergenciaData,
  type NaoEncontrado,
} from "./conciliador";
