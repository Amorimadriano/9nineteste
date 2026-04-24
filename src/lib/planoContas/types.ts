/**
 * Tipos para Sistema de Plano de Contas
 * Estrutura hierárquica contábil brasileira (CFC)
 */

export interface PlanoConta {
  id: string;
  user_id: string;
  empresa_id?: string | null;
  codigo_conta: string;
  codigo_pai?: string | null;
  nivel: number;
  tipo_conta: 'sintetica' | 'analitica';
  natureza: 'ativa' | 'passiva' | 'receita' | 'despesa' | 'compensacao';
  descricao: string;
  descricao_reduzida?: string | null;
  ativo: boolean;
  permite_lancamento: boolean;
  categoria_financeira_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MapeamentoContabil {
  id: string;
  user_id: string;
  empresa_id?: string | null;
  categoria_id: string;
  categoria_nome?: string;
  tipo_lancamento: 'despesa' | 'receita' | 'transferencia';
  plano_conta_id: string;
  plano_conta_codigo?: string;
  plano_conta_descricao?: string;
  historico_padrao?: string | null;
  centro_custo?: string | null;
  regra_condicional?: MapeamentoRegra | null;
  ativo: boolean;
  automatico: boolean;
  created_at: string;
  updated_at: string;
}

export interface MapeamentoRegra {
  valor_min?: number;
  valor_max?: number;
  apenas_dias_uteis?: boolean;
  exceto_feriados?: boolean;
  horario_limite?: string;
  data_vencimento_dias?: number;
}

export interface ArvorePlanoConta extends PlanoConta {
  children: ArvorePlanoConta[];
  total_filhos?: number;
}

export interface PlanoContasFiltros {
  natureza?: PlanoConta['natureza'] | 'todas';
  tipo?: PlanoConta['tipo_conta'] | 'todos';
  ativo?: boolean | 'todos';
  permite_lancamento?: boolean | 'todos';
  busca?: string;
}

export interface MapeamentoSugestao {
  plano_conta_id: string;
  codigo_conta: string;
  descricao: string;
  historico_padrao?: string;
  centro_custo?: string;
  confianca: number; // 0-100
}

export const NATUREZAS_PLANO_CONTAS = [
  { value: 'ativa', label: 'Ativo', cor: '#10b981' },
  { value: 'passiva', label: 'Passivo', cor: '#f59e0b' },
  { value: 'receita', label: 'Receita', cor: '#3b82f6' },
  { value: 'despesa', label: 'Despesa', cor: '#ef4444' },
  { value: 'compensacao', label: 'Compensação', cor: '#6b7280' },
] as const;

export const TIPOS_CONTA = [
  { value: 'sintetica', label: 'Sintética (Agrupadora)', icone: 'folder' },
  { value: 'analitica', label: 'Analítica (Lançamentos)', icone: 'file' },
] as const;

// Estrutura padrão de códigos (níveis hierárquicos)
export const ESTRUTURA_CODIGOS = {
  ativo: { inicio: '1', nome: 'Ativo' },
  passivo: { inicio: '2', nome: 'Passivo' },
  receita: { inicio: '3', nome: 'Receita' },
  despesa: { inicio: '4', nome: 'Despesa' },
  compensacao: { inicio: '9', nome: 'Compensação' },
} as const;

// Níveis de hierarquia
export const NIVEIS_HIERARQUIA = [
  { nivel: 1, digitos: 1, exemplo: '1', nome: 'Grupo' },
  { nivel: 2, digitos: 3, exemplo: '1.1', nome: 'Subgrupo' },
  { nivel: 3, digitos: 5, exemplo: '1.1.01', nome: 'Elemento' },
  { nivel: 4, digitos: 9, exemplo: '1.1.01.0001', nome: 'Conta' },
] as const;

export function validarCodigoConta(codigo: string): boolean {
  // Formato: X.XX.XXX.XXXX (nívels 1-4)
  const regex = /^\d(\.\d{2})?(\.\d{3})?(\.\d{4})?$/;
  return regex.test(codigo);
}

export function extrairNivel(codigo: string): number {
  const partes = codigo.split('.');
  return partes.length;
}

export function extrairCodigoPai(codigo: string): string | null {
  const partes = codigo.split('.');
  if (partes.length <= 1) return null;
  return partes.slice(0, -1).join('.');
}

export function gerarProximoCodigo(codigoPai: string, ultimoFilho: string | null): string {
  if (!ultimoFilho) {
    // Primeiro filho
    const nivel = codigoPai.split('.').length + 1;
    if (nivel === 2) return `${codigoPai}.01`;
    if (nivel === 3) return `${codigoPai}.01`;
    if (nivel === 4) return `${codigoPai}.0001`;
    return codigoPai;
  }

  const partes = ultimoFilho.split('.');
  const ultimo = partes[partes.length - 1];
  const proximo = (parseInt(ultimo, 10) + 1).toString().padStart(ultimo.length, '0');
  partes[partes.length - 1] = proximo;
  return partes.join('.');
}

export function formatarCodigoConta(codigo: string): string {
  return codigo;
}

export function obterNaturezaPorCodigo(codigo: string): PlanoConta['natureza'] {
  const primeiro = codigo.charAt(0);
  switch (primeiro) {
    case '1': return 'ativa';
    case '2': return 'passiva';
    case '3': return 'receita';
    case '4': return 'despesa';
    case '9': return 'compensacao';
    default: return 'despesa';
  }
}

export const PLANOS_PADRAO_CFC = {
  // ATIVO CIRCULANTE
  '1.1.01.0001': { descricao: 'Caixa Geral', tipo: 'analitica', natureza: 'ativa' },
  '1.1.01.0002': { descricao: 'Bancos Conta Movimento', tipo: 'analitica', natureza: 'ativa' },
  '1.1.02.0001': { descricao: 'Clientes', tipo: 'analitica', natureza: 'ativa' },
  '1.1.02.0002': { descricao: 'Duplicatas a Receber', tipo: 'analitica', natureza: 'ativa' },
  '1.1.03.0001': { descricao: 'Mercadorias para Revenda', tipo: 'analitica', natureza: 'ativa' },
  '1.1.04.0001': { descricao: 'Despesas Antecipadas', tipo: 'analitica', natureza: 'ativa' },

  // ATIVO NÃO CIRCULANTE
  '1.2.01.0001': { descricao: 'Contas a Receber LP', tipo: 'analitica', natureza: 'ativa' },
  '1.2.03.0001': { descricao: 'Participações Societárias', tipo: 'analitica', natureza: 'ativa' },
  '1.2.04.0001': { descricao: 'Móveis e Utensílios', tipo: 'analitica', natureza: 'ativa' },
  '1.2.04.0002': { descricao: 'Máquinas e Equipamentos', tipo: 'analitica', natureza: 'ativa' },
  '1.2.04.0003': { descricao: 'Veículos', tipo: 'analitica', natureza: 'ativa' },

  // PASSIVO CIRCULANTE
  '2.1.01.0001': { descricao: 'Fornecedores Nacionais', tipo: 'analitica', natureza: 'passiva' },
  '2.1.01.0002': { descricao: 'Fornecedores Estrangeiros', tipo: 'analitica', natureza: 'passiva' },
  '2.1.02.0001': { descricao: 'Empréstimos Bancários', tipo: 'analitica', natureza: 'passiva' },
  '2.1.03.0001': { descricao: 'Impostos a Pagar', tipo: 'analitica', natureza: 'passiva' },
  '2.1.03.0002': { descricao: 'ISS a Recolher', tipo: 'analitica', natureza: 'passiva' },
  '2.1.03.0003': { descricao: 'ICMS a Recolher', tipo: 'analitica', natureza: 'passiva' },
  '2.1.03.0004': { descricao: 'IRRF a Recolher', tipo: 'analitica', natureza: 'passiva' },
  '2.1.03.0005': { descricao: 'INSS a Recolher', tipo: 'analitica', natureza: 'passiva' },
  '2.1.03.0006': { descricao: 'FGTS a Recolher', tipo: 'analitica', natureza: 'passiva' },
  '2.1.04.0001': { descricao: 'Salários a Pagar', tipo: 'analitica', natureza: 'passiva' },
  '2.1.04.0002': { descricao: 'Férias a Pagar', tipo: 'analitica', natureza: 'passiva' },
  '2.1.04.0003': { descricao: '13º Salário a Pagar', tipo: 'analitica', natureza: 'passiva' },

  // RECEITAS
  '3.1.01.0001': { descricao: 'Vendas à Vista', tipo: 'analitica', natureza: 'receita' },
  '3.1.01.0002': { descricao: 'Vendas a Prazo', tipo: 'analitica', natureza: 'receita' },
  '3.1.02.0001': { descricao: 'Serviços de Consultoria', tipo: 'analitica', natureza: 'receita' },
  '3.1.02.0002': { descricao: 'Serviços de BPO Financeiro', tipo: 'analitica', natureza: 'receita' },
  '3.1.02.0003': { descricao: 'Serviços Contábeis', tipo: 'analitica', natureza: 'receita' },
  '3.2.01.0001': { descricao: 'Juros Ativos', tipo: 'analitica', natureza: 'receita' },
  '3.2.01.0002': { descricao: 'Descontos Obtidos', tipo: 'analitica', natureza: 'receita' },

  // DESPESAS
  '4.1.01.0001': { descricao: 'Salários e Ordenados', tipo: 'analitica', natureza: 'despesa' },
  '4.1.01.0002': { descricao: 'Encargos Sociais', tipo: 'analitica', natureza: 'despesa' },
  '4.1.01.0003': { descricao: 'FGTS', tipo: 'analitica', natureza: 'despesa' },
  '4.1.01.0004': { descricao: 'Benefícios (VR, VT, etc)', tipo: 'analitica', natureza: 'despesa' },
  '4.1.02.0001': { descricao: 'Aluguel', tipo: 'analitica', natureza: 'despesa' },
  '4.1.02.0002': { descricao: 'Condomínio', tipo: 'analitica', natureza: 'despesa' },
  '4.1.02.0003': { descricao: 'Energia Elétrica', tipo: 'analitica', natureza: 'despesa' },
  '4.1.02.0004': { descricao: 'Água e Esgoto', tipo: 'analitica', natureza: 'despesa' },
  '4.1.02.0005': { descricao: 'Telefone e Internet', tipo: 'analitica', natureza: 'despesa' },
  '4.1.02.0006': { descricao: 'Material de Escritório', tipo: 'analitica', natureza: 'despesa' },
  '4.1.02.0007': { descricao: 'Manutenção e Conservação', tipo: 'analitica', natureza: 'despesa' },
  '4.1.02.0008': { descricao: 'Contador/Advogado', tipo: 'analitica', natureza: 'despesa' },
  '4.1.03.0001': { descricao: 'Publicidade e Propaganda', tipo: 'analitica', natureza: 'despesa' },
  '4.1.03.0002': { descricao: 'Marketing Digital', tipo: 'analitica', natureza: 'despesa' },
  '4.1.04.0001': { descricao: 'Juros Passivos', tipo: 'analitica', natureza: 'despesa' },
  '4.1.04.0002': { descricao: 'Descontos Concedidos', tipo: 'analitica', natureza: 'despesa' },
  '4.1.04.0003': { descricao: 'Tarifas Bancárias', tipo: 'analitica', natureza: 'despesa' },
  '4.1.05.0001': { descricao: 'ISS', tipo: 'analitica', natureza: 'despesa' },
  '4.1.05.0002': { descricao: 'IPTU', tipo: 'analitica', natureza: 'despesa' },
  '4.1.05.0003': { descricao: 'Taxas Municipais', tipo: 'analitica', natureza: 'despesa' },
  '4.2.01.0001': { descricao: 'Perdas Diversas', tipo: 'analitica', natureza: 'despesa' },

  // COMPENSAÇÃO
  '9.1.01.0001': { descricao: 'Cheques Emitidos', tipo: 'analitica', natureza: 'compensacao' },
} as const;
