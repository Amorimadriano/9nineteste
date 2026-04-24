/**
 * Biblioteca de Conciliação de Cartões
 * @agente-financeiro
 */

// Exportações principais
export * from './utils';

// Parsers de extrato
export { parseExtratoRede } from './parsers/parserRede';
export { parseExtratoCielo } from './parsers/parserCielo';
export { parseExtratoStone } from './parsers/parserStone';

// Tipos
export type {
  ParsedTransacaoCartao,
  CandidatoConciliacao,
  SugestaoMatchCartao,
} from '@/types/cartoes';

// Constantes
export const VERSAO_BIBLIOTECA = '1.0.0';

// Configurações padrão
export const DEFAULT_CONFIG = {
  toleranciaValor: 0.50,
  toleranciaDias: 2,
  scoreMinimoMatch: 60,
  scoreMatchAutomatico: 80,
};
