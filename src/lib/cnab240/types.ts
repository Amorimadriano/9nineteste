// CNAB 240 Types

export const BANCOS_CNAB: Record<string, string> = {
  "077": "BANCO INTER SA",
  "341": "BANCO ITAU SA",
  "001": "BANCO DO BRASIL SA",
  "237": "BANCO BRADESCO SA",
  "104": "CAIXA ECONOMICA FEDERAL",
  "033": "BANCO SANTANDER SA",
  "260": "NU PAGAMENTOS SA",
  "756": "BANCO SICOOB SA",
  "748": "BANCO SICREDI SA",
  "422": "BANCO SAFRA SA",
  "212": "BANCO ORIGINAL SA",
  "336": "BANCO C6 SA",
  "290": "PAGSEGURO INTERNET SA",
  "380": "PICPAY SERVICOS SA",
  "403": "CORA SCD SA",
  "197": "STONE PAGAMENTOS SA",
};

export interface CnabEmpresa {
  razaoSocial: string;
  cnpj: string;
  agencia: string;
  conta: string;
  digitoConta?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  codigoBanco?: string;
  nomeBanco?: string;
}

export interface CnabBoleto {
  nossoNumero: string;
  dataVencimento: Date;
  valor: number;
  sacadoNome: string;
  sacadoDocumento: string;
  sacadoEndereco?: string;
  sacadoCidade?: string;
  sacadoEstado?: string;
  sacadoCep?: string;
  descricao?: string;
  contaReceberId?: string;
}

export interface CnabPagamento {
  favorecidoNome: string;
  favorecidoDocumento: string;
  favorecidoEndereco?: string;
  favorecidoNumero?: string;
  favorecidoComplemento?: string;
  favorecidoBairro?: string;
  favorecidoCidade?: string;
  favorecidoEstado?: string;
  favorecidoCep?: string;
  favorecidoIspb?: string;
  bancoDestino: string;
  agenciaDestino: string;
  contaDestino: string;
  digitoContaDestino?: string;
  valor: number;
  dataVencimento: Date;
  descricao?: string;
  contaPagarId?: string;
  finalidadeTed?: string; // Código finalidade TED (220-224): 00004=Salários, 00005=Fornecedores, 00010=Crédito em Conta
}

export interface CnabRetornoItem {
  nossoNumero: string;
  valorPago: number;
  dataPagamento: Date;
  dataCredito: Date;
  ocorrencia: string;
  codigoOcorrencia: string;
  valorTarifa: number;
}

// Segmento J - Pagamento de Cobranças (Boleto)
export interface CnabPagamentoBoleto {
  codigoBarras: string;          // 44 posições - código de barras do boleto
  nomeBeneficiario: string;      // 30 posições
  dataVencimento: Date;
  valorNominal: number;
  valorDescontoAbatimento?: number;
  valorMoraMulta?: number;
  dataPagamento: Date;
  valorPagamento: number;
  numeroDocumentoEmpresa?: string; // 20 posições
  nossoNumero?: string;            // 20 posições
}

// Segmento J-52 - Dados do Pagador/Beneficiário
export interface CnabJ52Info {
  tipoInscricaoPagador: "1" | "2"; // 1=CPF, 2=CNPJ
  documentoPagador: string;
  nomePagador: string;
  tipoInscricaoBeneficiario: "1" | "2";
  documentoBeneficiario: string;
  nomeBeneficiario: string;
  numeroDocumento?: string;
}

// Segmento O - Pagamento de Convênios/Tributos
export interface CnabPagamentoConvenio {
  codigoBarras: string;      // 44 posições
  nomeConcessionaria: string; // 30 posições
  dataVencimento: Date;
  dataPagamento: Date;
  valorPagamento: number;
  seuNumero?: string;         // 20 posições
  nossoNumero?: string;       // 20 posições
}

// Tipos de serviço CNAB240 (Nota 02)
export const TIPOS_SERVICO_CNAB: Record<string, string> = {
  "01": "Cobrança",
  "03": "Boleto de Pagamento Eletrônico",
  "04": "Conciliação Bancária",
  "05": "Débitos",
  "20": "Pagamento Fornecedor",
  "22": "Pagamento de Contas, Tributos e Impostos",
  "30": "Pagamento Salários",
  "98": "Pagamentos Diversos",
};

// Formas de lançamento
export const FORMAS_LANCAMENTO_CNAB: Record<string, string> = {
  "01": "Crédito em Conta Corrente",
  "03": "TED",
  "41": "TED",
  "45": "Transferência via Pix",
  "30": "Pagamentos do próprio banco",
  "31": "Pagamentos de outros bancos",
  "47": "Pagamento de cobrança com QRCode",
  "11": "Contas e Tributos",
  "80": "Tributos municipais ISS-LCP 157 próprio Banco",
  "81": "Tributos municipais ISS-LCP 157 outros Bancos",
};

export type CnabTipo = "remessa_cobranca" | "retorno_cobranca" | "remessa_pagamento";
