/**
 * Parser para converter dados do Open Banking para formato Nine BPO
 * Task #23 - Agente Financeiro & DevOps
 */

import type {
  ContaOpenBanking,
  TransacaoOpenBanking,
  ExtratoOpenBanking,
  FaturaCartaoOpenBanking,
} from './apiClient';
import type { BancoCodigo } from './config';

// Interfaces do formato Nine BPO
export interface ContaNineBPO {
  id: string;
  bancoCodigo: BancoCodigo;
  bancoNome: string;
  numeroConta: string;
  tipo: 'corrente' | 'poupanca' | 'investimento';
  moeda: string;
  status: 'ativa' | 'inativa' | 'fechada';
  dataAbertura: Date;
  saldoDisponivel: number;
  saldoBloqueado: number;
}

export interface TransacaoNineBPO {
  id: string;
  contaId: string;
  bancoCodigo: BancoCodigo;
  tipo: 'entrada' | 'saida' | 'estorno' | 'ajuste';
  status: 'confirmada' | 'pendente' | 'cancelada';
  valor: number;
  moeda: string;
  data: Date;
  dataEfetiva?: Date;
  descricao: string;
  informacaoComplementar?: string;

  // Dados de contraparte
  nomeCedente?: string;
  documentoCedente?: string;
  nomeSacado?: string;
  documentoSacado?: string;

  // Categorização
  categoria?: string;
  subcategoria?: string;
  tags: string[];

  // Metadados
  rawData: unknown;
}

export interface ExtratoNineBPO {
  contaId: string;
  periodoInicio: Date;
  periodoFim: Date;
  transacoes: TransacaoNineBPO[];
  totalEntradas: number;
  totalSaidas: number;
  saldoInicial: number;
  saldoFinal: number;
  quantidadeTransacoes: number;
}

export interface FaturaCartaoNineBPO {
  id: string;
  contaId: string;
  bancoCodigo: BancoCodigo;
  dataVencimento: Date;
  valorTotal: number;
  valorMinimo: number;
  moeda: string;
  status: 'aberta' | 'fechada' | 'atrasada';
  transacoes: TransacaoNineBPO[];
}

// Map de códigos para nomes de bancos
const NOMES_BANCOS: Record<BancoCodigo, string> = {
  '341': 'Itaú',
  '237': 'Bradesco',
  '033': 'Santander',
  '001': 'Banco do Brasil',
  '260': 'Nubank',
  '077': 'Inter',
};

// Mapeamento de tipos de conta
const MAPEAMENTO_TIPO_CONTA: Record<string, ContaNineBPO['tipo']> = {
  'CACC': 'corrente',
  'SVGS': 'poupanca',
  'INVS': 'investimento',
  'CurrentAccount': 'corrente',
  'SavingsAccount': 'poupanca',
  'InvestmentAccount': 'investimento',
};

/**
 * Parser principal para dados Open Banking
 */
export class OpenBankingParser {
  private bancoCodigo: BancoCodigo;

  constructor(bancoCodigo: BancoCodigo) {
    this.bancoCodigo = bancoCodigo;
  }

  /**
   * Converte dados de conta do Open Banking para formato Nine BPO
   */
  parseConta(conta: ContaOpenBanking): ContaNineBPO {
    return {
      id: conta.accountId,
      bancoCodigo: this.bancoCodigo,
      bancoNome: NOMES_BANCOS[this.bancoCodigo],
      numeroConta: conta.accountId,
      tipo: MAPEAMENTO_TIPO_CONTA[conta.accountType] || 'corrente',
      moeda: conta.currency || 'BRL',
      status: this.parseStatusConta(conta.status),
      dataAbertura: new Date(conta.openingDate),
      saldoDisponivel: 0, // Deve ser obtido separadamente
      saldoBloqueado: 0, // Deve ser obtido separadamente
    };
  }

  /**
   * Converte status de conta
   */
  private parseStatusConta(status: string): ContaNineBPO['status'] {
    const map: Record<string, ContaNineBPO['status']> = {
      'Active': 'ativa',
      'Inactive': 'inativa',
      'Closed': 'fechada',
    };
    return map[status] || 'inativa';
  }

  /**
   * Converte uma transação do Open Banking para formato Nine BPO
   */
  parseTransacao(
    transacao: TransacaoOpenBanking,
    contaId: string
  ): TransacaoNineBPO {
    const tipo = this.identificarTipoTransacao(transacao);
    const { nomeCedente, documentoCedente, nomeSacado, documentoSacado } =
      this.extrairDadosCedenteSacado(transacao);

    return {
      id: transacao.transactionId,
      contaId: contaId,
      bancoCodigo: this.bancoCodigo,
      tipo,
      status: this.parseStatusTransacao(transacao.status),
      valor: Math.abs(transacao.amount),
      moeda: transacao.currency || 'BRL',
      data: new Date(transacao.bookingDate),
      dataEfetiva: transacao.valueDate ? new Date(transacao.valueDate) : undefined,
      descricao: this.normalizarDescricao(transacao.transactionInformation || ''),
      informacaoComplementar: transacao.remittanceInformation,
      nomeCedente,
      documentoCedente,
      nomeSacado,
      documentoSacado,
      categoria: this.categorizarTransacao(transacao),
      subcategoria: this.subcategorizarTransacao(transacao),
      tags: this.gerarTags(transacao),
      rawData: transacao,
    };
  }

  /**
   * Identifica se é entrada ou saída baseado nos campos do Open Banking
   */
  private identificarTipoTransacao(
    transacao: TransacaoOpenBanking
  ): TransacaoNineBPO['tipo'] {
    // Prioridade para creditDebitIndicator
    if (transacao.creditDebitIndicator) {
      return transacao.creditDebitIndicator === 'CREDIT' ? 'entrada' : 'saida';
    }

    // Fallback para transactionType
    if (transacao.transactionType) {
      return transacao.transactionType === 'CREDIT' ? 'entrada' : 'saida';
    }

    // Fallback por valor
    return transacao.amount >= 0 ? 'entrada' : 'saida';
  }

  /**
   * Extrai dados de cedente e sacado da transação
   */
  private extrairDadosCedenteSacado(transacao: TransacaoOpenBanking): {
    nomeCedente?: string;
    documentoCedente?: string;
    nomeSacado?: string;
    documentoSacado?: string;
  } {
    const tipo = this.identificarTipoTransacao(transacao);

    if (tipo === 'entrada') {
      return {
        nomeSacado: transacao.debtorName,
        nomeCedente: undefined, // A conta é a cedente
      };
    } else {
      return {
        nomeCedente: transacao.creditorName,
        nomeSacado: undefined, // A conta é o sacado
      };
    }
  }

  /**
   * Converte status de transação
   */
  private parseStatusTransacao(
    status: string
  ): TransacaoNineBPO['status'] {
    const map: Record<string, TransacaoNineBPO['status']> = {
      'BOOKED': 'confirmada',
      'PENDING': 'pendente',
      'CANCELLED': 'cancelada',
    };
    return map[status] || 'pendente';
  }

  /**
   * Normaliza a descrição da transação
   */
  private normalizarDescricao(descricao: string): string {
    if (!descricao) return 'Sem descrição';

    return descricao
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-\/\.]/g, '')
      .substring(0, 255);
  }

  /**
   * Categoriza a transação baseada em palavras-chave
   */
  private categorizarTransacao(transacao: TransacaoOpenBanking): string {
    const desc = (transacao.transactionInformation || '').toLowerCase();
    const info = (transacao.remittanceInformation || '').toLowerCase();
    const textoCompleto = `${desc} ${info}`;

    const categorias: { keywords: string[]; categoria: string }[] = [
      { keywords: ['salario', 'pagamento', 'folha'], categoria: 'receita' },
      { keywords: ['fornecedor', 'imposto', 'taxa'], categoria: 'despesa_operacional' },
      { keywords: ['aluguel', 'condominio', 'iptu'], categoria: 'despesa_fixa' },
      { keywords: ['transferencia', 'ted', 'doc', 'pix'], categoria: 'transferencia' },
      { keywords: ['tarifa', 'juros', 'iof'], categoria: 'encargo' },
      { keywords: ['estorno', 'estornado', 'devolucao'], categoria: 'estorno' },
      { keywords: ['investimento', 'aplicacao', 'resgate'], categoria: 'investimento' },
    ];

    for (const { keywords, categoria } of categorias) {
      if (keywords.some(k => textoCompleto.includes(k))) {
        return categoria;
      }
    }

    return 'outros';
  }

  /**
   * Subcategoriza a transação
   */
  private subcategorizarTransacao(transacao: TransacaoOpenBanking): string | undefined {
    const categoria = this.categorizarTransacao(transacao);
    const desc = (transacao.transactionInformation || '').toLowerCase();

    const subcategorias: Record<string, { keywords: string[]; sub: string }[]> = {
      receita: [
        { keywords: ['salario'], sub: 'salario' },
        { keywords: ['bonus'], sub: 'bonus' },
        { keywords: ['freelance', 'pj'], sub: 'prestacao_servico' },
      ],
      despesa_operacional: [
        { keywords: ['fornecedor'], sub: 'fornecedor' },
        { keywords: ['imposto', 'ir', 'pis', 'cofins'], sub: 'imposto' },
        { keywords: ['energia', 'luz'], sub: 'energia' },
        { keywords: ['agua'], sub: 'agua' },
        { keywords: ['internet', 'telefone'], sub: 'telecom' },
      ],
      transferencia: [
        { keywords: ['ted'], sub: 'ted' },
        { keywords: ['doc'], sub: 'doc' },
        { keywords: ['pix'], sub: 'pix' },
      ],
    };

    const subs = subcategorias[categoria] || [];
    for (const { keywords, sub } of subs) {
      if (keywords.some(k => desc.includes(k))) {
        return sub;
      }
    }

    return undefined;
  }

  /**
   * Gera tags automáticas para a transação
   */
  private gerarTags(transacao: TransacaoOpenBanking): string[] {
    const tags: string[] = [];
    const desc = (transacao.transactionInformation || '').toLowerCase();

    // Tags por tipo
    if (transacao.creditDebitIndicator === 'CREDIT') {
      tags.push('entrada');
    } else {
      tags.push('saida');
    }

    // Tags por status
    if (transacao.status === 'PENDING') {
      tags.push('pendente');
    }

    // Tags por palavras-chave
    const palavrasChave: { termo: string; tag: string }[] = [
      { termo: 'recorrente', tag: 'recorrente' },
      { termo: 'automatico', tag: 'automatico' },
      { termo: 'estorno', tag: 'estorno' },
      { termo: 'tarifa', tag: 'tarifa_bancaria' },
      { termo: 'juros', tag: 'juros' },
      { termo: 'multa', tag: 'multa' },
      { termo: 'salario', tag: 'folha' },
      { termo: 'imposto', tag: 'tributo' },
    ];

    for (const { termo, tag } of palavrasChave) {
      if (desc.includes(termo)) {
        tags.push(tag);
      }
    }

    // Tag por banco
    tags.push(`banco-${this.bancoCodigo}`);

    return [...new Set(tags)]; // Remove duplicatas
  }

  /**
   * Converte extrato completo
   */
  parseExtrato(extrato: ExtratoOpenBanking): ExtratoNineBPO {
    const transacoes = extrato.transactions.map(t =>
      this.parseTransacao(t, extrato.accountId)
    );

    const entradas = transacoes
      .filter(t => t.tipo === 'entrada' && t.status === 'confirmada')
      .reduce((sum, t) => sum + t.valor, 0);

    const saidas = transacoes
      .filter(t => t.tipo === 'saida' && t.status === 'confirmada')
      .reduce((sum, t) => sum + t.valor, 0);

    return {
      contaId: extrato.accountId,
      periodoInicio: new Date(extrato.startDate),
      periodoFim: new Date(extrato.endDate),
      transacoes,
      totalEntradas: entradas,
      totalSaidas: saidas,
      saldoInicial: 0, // Calculado externamente
      saldoFinal: 0, // Calculado externamente
      quantidadeTransacoes: transacoes.length,
    };
  }

  /**
   * Converte fatura de cartão
   */
  parseFaturaCartao(fatura: FaturaCartaoOpenBanking): FaturaCartaoNineBPO {
    const transacoes = fatura.transactions.map(t =>
      this.parseTransacao(t, fatura.accountId)
    );

    return {
      id: fatura.invoiceId,
      contaId: fatura.accountId,
      bancoCodigo: this.bancoCodigo,
      dataVencimento: new Date(fatura.dueDate),
      valorTotal: fatura.totalAmount,
      valorMinimo: fatura.minimumPayment,
      moeda: fatura.currency || 'BRL',
      status: this.parseStatusFatura(fatura.status),
      transacoes,
    };
  }

  /**
   * Converte status de fatura
   */
  private parseStatusFatura(
    status: string
  ): FaturaCartaoNineBPO['status'] {
    const map: Record<string, FaturaCartaoNineBPO['status']> = {
      'OPEN': 'aberta',
      'CLOSED': 'fechada',
      'OVERDUE': 'atrasada',
    };
    return map[status] || 'aberta';
  }

  /**
   * Agrupa transações por categoria
   */
  agruparPorCategoria(
    transacoes: TransacaoNineBPO[]
  ): Record<string, TransacaoNineBPO[]> {
    return transacoes.reduce((acc, t) => {
      const cat = t.categoria || 'sem_categoria';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(t);
      return acc;
    }, {} as Record<string, TransacaoNineBPO[]>);
  }

  /**
   * Agrupa transações por mês
   */
  agruparPorMes(
    transacoes: TransacaoNineBPO[]
  ): Record<string, TransacaoNineBPO[]> {
    return transacoes.reduce((acc, t) => {
      const mes = t.data.toISOString().slice(0, 7); // YYYY-MM
      if (!acc[mes]) acc[mes] = [];
      acc[mes].push(t);
      return acc;
    }, {} as Record<string, TransacaoNineBPO[]>);
  }

  /**
   * Calcula totais por período
   */
  calcularTotais(transacoes: TransacaoNineBPO[]): {
    entradas: number;
    saidas: number;
    saldo: number;
  } {
    const entradas = transacoes
      .filter(t => t.tipo === 'entrada' && t.status === 'confirmada')
      .reduce((sum, t) => sum + t.valor, 0);

    const saidas = transacoes
      .filter(t => t.tipo === 'saida' && t.status === 'confirmada')
      .reduce((sum, t) => sum + t.valor, 0);

    return {
      entradas,
      saidas,
      saldo: entradas - saidas,
    };
  }
}

/**
 * Factory para criar parser
 */
export function criarParser(bancoCodigo: BancoCodigo): OpenBankingParser {
  return new OpenBankingParser(bancoCodigo);
}

/**
 * Parser unificado para múltiplos bancos
 * Normaliza dados de diferentes fontes
 */
export function parseMultiplosBancos<T>(
  dados: { bancoCodigo: BancoCodigo; data: T }[],
  parseFn: (parser: OpenBankingParser, data: T) => unknown
): unknown[] {
  return dados.map(({ bancoCodigo, data }) => {
    const parser = criarParser(bancoCodigo);
    return parseFn(parser, data);
  });
}
