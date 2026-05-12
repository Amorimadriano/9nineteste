// CNAB 240 - Exportações principais
export * from "./types";
export {
  BANCOS_CNAB,
  TIPOS_SERVICO_CNAB,
  FORMAS_LANCAMENTO_CNAB,
} from "./types";

// Funções de geração de remessa
export { gerarRemessaCobranca } from "./remessaCobranca";
export {
  gerarRemessaPagamento,
  gerarRemessaBoleto,
  gerarRemessaConvenio,
} from "./remessaPagamento";

// Funções de parsing de retorno
export { parseRetornoCobranca } from "./retornoCobranca";
export type { RetornoParseResult } from "./retornoCobranca";

// Utilitários
export {
  padRight,
  padLeft,
  formatDate,
  formatHora,
  formatValue,
  parseDate,
  parseValue,
  onlyNumbers,
  generateSequencialLote,
  extrairContaEDV,
} from "./utils";
