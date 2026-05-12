/**
 * Tipos para integração NFS-e (Nota Fiscal de Serviços Eletrônica)
 * Seguindo o padrão ABRASF 2.04
 */

// ============ ENDEREÇO ============
export interface Endereco {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  codigoMunicipio: string;
  uf: string;
  cep: string;
}

// ============ CONTATO ============
export interface Contato {
  telefone: string;
  email: string;
}

// ============ PRESTADOR ============
export interface PrestadorServico {
  cnpj: string;
  inscricaoMunicipal: string;
  razaoSocial: string;
  nomeFantasia?: string;
  endereco: Endereco;
  contato: Contato;
}

// ============ TOMADOR ============
export interface TomadorServico {
  cnpj?: string;
  cpf?: string;
  inscricaoMunicipal?: string;
  razaoSocial: string;
  endereco: Endereco;
  contato: Contato;
}

// ============ SERVIÇO ============
export interface Servico {
  valorServicos: number;
  valorDeducoes: number;
  valorPis: number;
  valorCofins: number;
  valorInss: number;
  valorIr: number;
  valorCsll: number;
  issRetido: number; // 1 = Sim, 2 = Não
  valorIss: number;
  valorIssRetido: number;
  outrasRetencoes: number;
  baseCalculo: number;
  aliquota: number;
  valorLiquidoNfse: number;
  valorDescontoIncondicionado: number;
  valorDescontoCondicionado: number;
  itemListaServico: string;
  codigoCnae?: string;
  codigoTributacaoMunicipio: string;
  discriminacao: string;
  codigoMunicipio: string;
  exigibilidadeISS: number;
  municipioIncidencia?: string;
}

// ============ CONSTRUÇÃO CIVIL ============
export interface ConstrucaoCivil {
  codigoObra?: string;
  art: string;
}

// ============ INTERMEDIÁRIO ============
export interface IntermediarioServico {
  cnpj?: string;
  cpf?: string;
  inscricaoMunicipal?: string;
  razaoSocial: string;
}

// ============ CONDIÇÕES DE PAGAMENTO ============
export interface CondicoesPagamento {
  tipo: "A_VISTA" | "A_PRAZO" | "PARCELADO";
  prazo: number;
  parcelas: number;
}

// ============ DADOS DA NOTA FISCAL ============
export interface NFSeEmissaoData {
  numero: number;
  serie: string;
  tipo: string;
  naturezaOperacao: string;
  optanteSimplesNacional: number;
  incentivadorCultural: number;
  status: string;
  dataEmissao: string;
  competencia: string;
  prestador: PrestadorServico;
  tomador: TomadorServico;
  servico: Servico;
  construcaoCivil?: ConstrucaoCivil;
  intermediario?: IntermediarioServico;
  condicoesPagamento: CondicoesPagamento;
}

// ============ RESPOSTA DA PREFEITURA ============
export interface NFSeResposta {
  sucesso: boolean;
  numero?: string;
  codigoVerificacao?: string;
  dataEmissao?: string;
  linkImpressao?: string;
  protocolo?: string;
  mensagens?: MensagemRetorno[];
}

export interface MensagemRetorno {
  codigo: string;
  mensagem: string;
  correcao?: string;
}

// ============ CONSULTA ============
export interface NFSeConsultaData {
  numero?: string;
  serie?: string;
  tipo?: string;
  cnpjPrestador?: string;
  inscricaoMunicipalPrestador?: string;
  cnpjTomador?: string;
  cpfTomador?: string;
  dataInicio?: string;
  dataFim?: string;
  pagina?: number;
}

// ============ CANCELAMENTO ============
export interface NFSeCancelamentoData {
  numero: string;
  cnpjPrestador: string;
  inscricaoMunicipalPrestador: string;
  codigoMunicipio: string;
  codigoCancelamento: string;
  motivoCancelamento: string;
}

export interface NFSeCancelamentoResposta {
  sucesso: boolean;
  dataHoraCancelamento?: string;
  mensagens?: MensagemRetorno[];
}

// ============ CERTIFICADO DIGITAL ============
export interface CertificadoDigital {
  id: string;
  nome: string;
  cnpj: string;
  serialNumber: string;
  validadeInicio: string;
  validadeFim: string;
  arquivoPem: string;
  senha: string;
  ativo: boolean;
}

// ============ CONFIGURAÇÃO NFS-E ============
export interface NFSeConfiguracao {
  id: string;
  empresaId: string;
  certificadoId?: string;
  ambiente: "homologacao" | "producao";
  urlHomologacao?: string;
  urlProducao?: string;
  versao: string;
  serieRps: string;
  tipoRps: string;
  naturezaOperacao: string;
  optanteSimplesNacional: number;
  incentivadorCultural: number;
  codigoMunicipio: string;
  aliquotaPadrao: number;
  itemListaServicoPadrao?: string;
  codigoCnaePadrao?: string;
  timeoutMs: number;
  retryAttempts: number;
}

// ============ STATUS SINCRONIZAÇÃO ============
export interface NFSeSincronizacaoStatus {
  ultimaSincronizacao?: string;
  totalNotasEmitidas: number;
  totalNotasCanceladas: number;
  totalPendentes: number;
  totalErros: number;
  emSincronizacao: boolean;
}

// ============ NFSE NO BANCO DE DADOS ============
export interface NFSeDB {
  id: string;
  empresaId: string;
  numero?: string;
  serie: string;
  tipo: string;
  codigoVerificacao?: string;
  dataEmissao: string;
  competencia: string;
  status: "PENDENTE" | "EMITIDA" | "CANCELADA" | "ERRO";
  prestador: PrestadorServico;
  tomador: TomadorServico;
  servico: Servico;
  xmlEnvio?: string;
  xmlRetorno?: string;
  protocolo?: string;
  mensagemErro?: string;
  linkImpressao?: string;
  criadoEm: string;
  atualizadoEm: string;
}

// ============ RPS (Recibo Provisório de Serviços) ============
export interface RPS {
  numero: number;
  serie: string;
  tipo: string;
  dataEmissao: string;
  status: string;
  nfseId?: string;
}
