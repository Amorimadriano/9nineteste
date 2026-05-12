/**
 * Tipos para Conciliação de Cartões
 * @agente-supabase
 */

export type BandeiraCartao =
  | 'visa'
  | 'mastercard'
  | 'elo'
  | 'amex'
  | 'hipercard'
  | 'diners'
  | 'discover'
  | 'jcb'
  | 'outros';

export type StatusTransacaoCartao =
  | 'pendente'
  | 'conciliado'
  | 'divergente'
  | 'chargeback'
  | 'cancelado';

export type TipoTransacaoCartao =
  | 'credito'
  | 'debito'
  | 'parcelado';

export interface TransacaoCartao {
  id: string;
  empresa_id: string;
  user_id?: string;

  // Dados da transação
  data_transacao: string;
  data_pagamento?: string;
  bandeira: BandeiraCartao;

  // Valores
  valor_bruto: number;
  taxa_percentual: number;
  valor_taxa: number;
  valor_liquido: number;

  // Dados do cartão (mascarados)
  numero_cartao_mascara?: string;
  nsu?: string;
  codigo_autorizacao?: string;

  // Tipo e parcelamento
  tipo_transacao: TipoTransacaoCartao;
  numero_parcelas: number;
  parcela_atual: number;

  // Conciliação
  status: StatusTransacaoCartao;
  conciliado_com?: string;
  conciliado_tipo?: 'conta_receber' | 'lancamento';
  conciliado_em?: string;
  score_conciliacao?: number;

  // Dados brutos
  linha_extrato?: string;
  arquivo_origem?: string;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface ConfiguracoesCartao {
  id: string;
  empresa_id: string;
  user_id?: string;

  // Taxas por bandeira
  taxa_visa: number;
  taxa_mastercard: number;
  taxa_elo: number;
  taxa_amex: number;
  taxa_hipercard: number;
  taxa_outros: number;

  // Prazos de recebimento
  prazo_credito_dias: number;
  prazo_debito_dias: number;
  prazo_parcelado_dias: number;

  // Critérios de conciliação
  criterios_conciliacao: CriteriosConciliacaoCartao;

  created_at: string;
  updated_at: string;
}

export interface CriteriosConciliacaoCartao {
  tolerancia_valor: number;
  tolerancia_dias: number;
  peso_valor: number;
  peso_data: number;
  peso_bandeira: number;
  peso_nsu: number;
}

export interface SugestaoMatchCartao {
  transacao_id: string;
  candidato_id: string;
  candidato_tipo: 'conta_receber' | 'lancamento';
  score: number;
  motivo: string;
}

export interface CandidatoConciliacao {
  id: string;
  tipo: 'conta_receber' | 'lancamento';
  descricao: string;
  valor: number;
  data: string;
  score?: number;
}

export interface ResumoConciliacaoCartao {
  total_transacoes: number;
  total_conciliados: number;
  total_pendentes: number;
  total_divergentes: number;
  total_chargebacks: number;
  valor_bruto_total: number;
  valor_taxas_total: number;
  valor_liquido_total: number;
  taxa_sucesso: number;
}

export interface EstatisticasCartao {
  total_transacoes: number;
  conciliados: number;
  pendentes: number;
  divergentes: number;
  chargebacks: number;
  taxa_conciliacao: number;
  valor_bruto_total: number;
  valor_taxas_total: number;
  valor_liquido_total: number;
  por_bandeira: Array<{
    bandeira: BandeiraCartao;
    total: number;
    conciliados: number;
    valor_total: number;
  }>;
}

export interface FiltrosTransacaoCartao {
  bandeira?: BandeiraCartao | 'todos';
  status?: StatusTransacaoCartao | 'todos';
  data_inicio?: string;
  data_fim?: string;
  valor_minimo?: number;
  valor_maximo?: number;
  busca?: string;
}

// Tipos para parser de extrato
export interface ParsedTransacaoCartao {
  data_transacao: string;
  data_pagamento: string;
  bandeira: BandeiraCartao;
  valor_bruto: number;
  nsu?: string;
  codigo_autorizacao?: string;
  numero_cartao_mascara?: string;
  descricao?: string;
  tipo_transacao?: TipoTransacaoCartao;
  numero_parcelas?: number;
  parcela_atual?: number;
}

// Tipos para analytics
export interface MetricasPorBandeira {
  bandeira: BandeiraCartao;
  total_transacoes: number;
  valor_total: number;
  valor_liquido: number;
  taxa_media: number;
  taxa_conciliacao: number;
  cor: string;
}

export interface MetricasDiariasCartao {
  data: string;
  total_transacoes: number;
  valor_total: number;
  valor_conciliado: number;
  valor_pendente: number;
  taxa_conciliacao: number;
}

export interface DivergenciaCartao {
  id: string;
  data: string;
  bandeira: BandeiraCartao;
  valor_esperado: number;
  valor_real: number;
  diferenca: number;
  percentual_diferenca: number;
  descricao: string;
}

export interface DadosRelatorioCartao {
  transacoes: TransacaoCartao[];
  metricas: ResumoConciliacaoCartao;
  por_bandeira: MetricasPorBandeira[];
  tendencias: MetricasDiariasCartao[];
  divergencias: DivergenciaCartao[];
  periodo: {
    inicio: string;
    fim: string;
  };
}
