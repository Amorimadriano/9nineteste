/**
 * Utilitários para Conciliação de Cartões
 * @agente-financeiro
 */

import type { BandeiraCartao, TipoTransacaoCartao, ParsedTransacaoCartao } from '@/types/cartoes';

// Configurações de bandeiras
export const CONFIG_BANDEIRAS: Record<BandeiraCartao, {
  label: string;
  cor: string;
  taxaPadrao: number;
  prazoCredito: number;
  prazoDebito: number;
  bins: string[];
}> = {
  visa: {
    label: 'Visa',
    cor: '#1A1F71',
    taxaPadrao: 0.0199,
    prazoCredito: 30,
    prazoDebito: 1,
    bins: ['4'],
  },
  mastercard: {
    label: 'Mastercard',
    cor: '#EB001B',
    taxaPadrao: 0.0199,
    prazoCredito: 30,
    prazoDebito: 1,
    bins: ['51', '52', '53', '54', '55', '22', '23', '24', '25', '26', '27'],
  },
  elo: {
    label: 'Elo',
    cor: '#00A4E0',
    taxaPadrao: 0.0229,
    prazoCredito: 32,
    prazoDebito: 1,
    bins: ['6362', '4389', '5041', '5090', '4576', '4011', '5067'],
  },
  amex: {
    label: 'American Express',
    cor: '#006FCF',
    taxaPadrao: 0.0299,
    prazoCredito: 32,
    prazoDebito: 2,
    bins: ['34', '37'],
  },
  hipercard: {
    label: 'Hipercard',
    cor: '#D14009',
    taxaPadrao: 0.0250,
    prazoCredito: 30,
    prazoDebito: 1,
    bins: ['38', '60'],
  },
  diners: {
    label: 'Diners Club',
    cor: '#004E94',
    taxaPadrao: 0.0299,
    prazoCredito: 30,
    prazoDebito: 2,
    bins: ['30', '36', '38'],
  },
  discover: {
    label: 'Discover',
    cor: '#FF6000',
    taxaPadrao: 0.0299,
    prazoCredito: 32,
    prazoDebito: 2,
    bins: ['6011', '65', '644', '645', '646', '647', '648', '649'],
  },
  jcb: {
    label: 'JCB',
    cor: '#0E4C96',
    taxaPadrao: 0.0299,
    prazoCredito: 32,
    prazoDebito: 2,
    bins: ['35'],
  },
  outros: {
    label: 'Outros',
    cor: '#6B7280',
    taxaPadrao: 0.0250,
    prazoCredito: 30,
    prazoDebito: 1,
    bins: [],
  },
};

/**
 * Detecta a bandeira do cartão pelo BIN (6 primeiros dígitos)
 */
export function detectarBandeira(numeroCartao: string): BandeiraCartao {
  const bin = numeroCartao.replace(/\D/g, '').substring(0, 6);

  for (const [bandeira, config] of Object.entries(CONFIG_BANDEIRAS)) {
    for (const prefixo of config.bins) {
      if (bin.startsWith(prefixo)) {
        return bandeira as BandeiraCartao;
      }
    }
  }

  return 'outros';
}

/**
 * Formata o número do cartão com máscara (**** 1234)
 */
export function formatarNumeroCartao(numeroCartao: string): string {
  const limpo = numeroCartao.replace(/\D/g, '');
  if (limpo.length < 4) return limpo;
  return `**** ${limpo.slice(-4)}`;
}

/**
 * Retorna apenas os últimos 4 dígitos do cartão
 */
export function getMascaraCartao(numeroCartao: string): string {
  return numeroCartao.replace(/\D/g, '').slice(-4);
}

/**
 * Calcula a data de pagamento baseada na bandeira e tipo
 */
export function calcularDataPagamento(
  dataTransacao: string | Date,
  bandeira: BandeiraCartao,
  tipo: TipoTransacaoCartao = 'credito',
  parcelaAtual: number = 1
): string {
  const config = CONFIG_BANDEIRAS[bandeira];
  const data = new Date(dataTransacao);

  let dias = 0;
  if (tipo === 'debito') {
    dias = config.prazoDebito;
  } else if (tipo === 'parcelado') {
    // Para parcelado, cada parcela tem 30 dias de diferença
    dias = config.prazoCredito + ((parcelaAtual - 1) * 30);
  } else {
    dias = config.prazoCredito;
  }

  data.setDate(data.getDate() + dias);
  return data.toISOString().split('T')[0];
}

/**
 * Calcula o valor líquido aplicando a taxa
 */
export function calcularValorLiquido(
  valorBruto: number,
  taxaPercentual: number
): { valorLiquido: number; valorTaxa: number } {
  const valorTaxa = valorBruto * (taxaPercentual / 100);
  const valorLiquido = valorBruto - valorTaxa;
  return { valorLiquido, valorTaxa };
}

/**
 * Obtém a taxa padrão para uma bandeira
 */
export function getTaxaPadrao(bandeira: BandeiraCartao): number {
  return CONFIG_BANDEIRAS[bandeira]?.taxaPadrao || 0.025;
}

/**
 * Valida um NSU (Número Sequencial Único)
 */
export function validarNSU(nsu: string): boolean {
  // NSU geralmente tem entre 6 e 12 dígitos
  const nsuLimpo = nsu.replace(/\D/g, '');
  return nsuLimpo.length >= 6 && nsuLimpo.length <= 20;
}

/**
 * Valida um código de autorização
 */
export function validarCodigoAutorizacao(codigo: string): boolean {
  // Código de autorização geralmente tem 6 dígitos
  const codigoLimpo = codigo.replace(/\D/g, '');
  return codigoLimpo.length >= 4 && codigoLimpo.length <= 10;
}

/**
 * Detecta se uma transação é chargeback
 * Chargebacks geralmente têm valores negativos ou palavras-chave específicas
 */
export function detectarChargeback(
  valor: number,
  descricao?: string,
  nsuReferencia?: string
): boolean {
  // Valor negativo indica estorno/chargeback
  if (valor < 0) return true;

  // Palavras-chave comuns em chargebacks
  const palavrasChargeback = [
    'chargeback',
    'estorno',
    'contestação',
    'disputa',
    'reversão',
    'contested',
    'dispute',
    'reversal',
    'charge back',
  ];

  if (descricao) {
    const descLower = descricao.toLowerCase();
    for (const palavra of palavrasChargeback) {
      if (descLower.includes(palavra)) return true;
    }
  }

  // Se tem NSU de referência, provavelmente é chargeback
  if (nsuReferencia && nsuReferencia.length > 0) return true;

  return false;
}

/**
 * Calcula o score de matching entre duas transações
 * Peso: valor 50%, data 30%, bandeira 10%, NSU 10%
 */
export function calcularScoreMatch(
  transacao: {
    valor_liquido: number;
    data_pagamento: string;
    bandeira: BandeiraCartao;
    nsu?: string;
  },
  candidato: {
    valor: number;
    data: string;
    tipo: string;
  },
  toleranciaValor: number = 0.50,
  toleranciaDias: number = 2
): { score: number; motivo: string } {
  let score = 0;
  const motivos: string[] = [];

  // Score por valor líquido (50%)
  const diffValor = Math.abs(transacao.valor_liquido - candidato.valor);
  if (diffValor < toleranciaValor) {
    score += 50;
    motivos.push('valor exato');
  } else if (diffValor < toleranciaValor * 2) {
    score += 30;
    motivos.push('valor aproximado');
  } else if (diffValor < toleranciaValor * 5) {
    score += 10;
    motivos.push('valor próximo');
  }

  // Score por data (30%)
  const dataTransacao = new Date(transacao.data_pagamento);
  const dataCandidato = new Date(candidato.data);
  const diffDias = Math.abs(
    Math.floor((dataTransacao.getTime() - dataCandidato.getTime()) / (1000 * 60 * 60 * 24))
  );

  if (diffDias === 0) {
    score += 30;
    motivos.push('mesma data');
  } else if (diffDias <= 1) {
    score += 20;
    motivos.push('1 dia diferença');
  } else if (diffDias <= toleranciaDias) {
    score += 10;
    motivos.push(`${diffDias} dias diferença`);
  }

  // Score por tipo compatível (10%)
  // Transações de cartão sempre são receitas
  if (candidato.tipo === 'conta_receber' || candidato.tipo === 'receita') {
    score += 10;
    motivos.push('tipo compatível');
  }

  // Score por NSU (10%) - bônus se houver match de NSU
  // Implementação futura quando tiver NSU nos candidatos

  return { score, motivo: motivos.join(', ') };
}

/**
 * Formata valor monetário para exibição
 */
export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Formata data para exibição
 */
export function formatarData(data: string | Date): string {
  const d = new Date(data);
  return d.toLocaleDateString('pt-BR');
}

/**
 * Converte um arquivo CSV/array em transações parseadas
 * Função auxiliar para parsers
 */
export function normalizarCabecalho(cabecalho: string): string {
  return cabecalho
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Detecta o tipo de transação (crédito/débito) pela descrição ou valor
 */
export function detectarTipoTransacao(
  descricao?: string,
  numeroParcelas: number = 1
): TipoTransacaoCartao {
  if (numeroParcelas > 1) return 'parcelado';

  if (descricao) {
    const desc = descricao.toLowerCase();
    if (desc.includes('debito') || desc.includes('débito') || desc.includes('debit')) {
      return 'debito';
    }
    if (desc.includes('parcela') || desc.includes('installment')) {
      return 'parcelado';
    }
  }

  return 'credito';
}

/**
 * Gera um ID único para transações importadas
 */
export function gerarIdTransacao(prefixo: string = 'txc'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `${prefixo}_${timestamp}_${random}`;
}

/**
 * Valida se uma transação parseada está completa
 */
export function validarTransacaoParseada(
  transacao: Partial<ParsedTransacaoCartao>
): { valido: boolean; erros: string[] } {
  const erros: string[] = [];

  if (!transacao.data_transacao) {
    erros.push('Data da transação é obrigatória');
  }

  if (!transacao.bandeira) {
    erros.push('Bandeira é obrigatória');
  }

  if (transacao.valor_bruto === undefined || transacao.valor_bruto <= 0) {
    erros.push('Valor bruto deve ser maior que zero');
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}
