/**
 * Configurações da API de NFS-e da Prefeitura de São Paulo (GINFES)
 * Layout ABRASF 2.04
 */

export const NFSeConfig = {
  // URLs da API
  urls: {
    homologacao: 'https://homologacao.ginfes.com.br',
    producao: 'https://producao.ginfes.com.br',
  },

  // Ambiente atual (pode ser sobrescrito via variável de ambiente)
  // IMPORTANTE: Para emissão em produção, VITE_NFSE_AMBIENTE DEVE ser definido como "producao"
  get ambiente(): 'homologacao' | 'producao' {
    try {
      const env = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_NFSE_AMBIENTE) as 'homologacao' | 'producao' | undefined;
      if (env && (env === 'homologacao' || env === 'producao')) return env;
      // Se não configurado, assume homologacao mas emite aviso
      console.warn('[NFS-e] VITE_NFSE_AMBIENTE não configurado. Usando "homologacao". Para emissão real, configure VITE_NFSE_AMBIENTE=producao');
      return 'homologacao';
    } catch {
      return 'homologacao';
    }
  },

  // Retorna a URL base conforme ambiente
  get baseUrl(): string {
    return this.urls[this.ambiente];
  },

  // Versão do layout ABRASF
  versaoLayout: '2.04',

  // Namespaces SOAP utilizados
  namespaces: {
    soap: 'http://www.w3.org/2003/05/soap-envelope',
    soap12: 'http://www.w3.org/2003/05/soap-envelope',
    xsi: 'http://www.w3.org/2001/XMLSchema-instance',
    xsd: 'http://www.w3.org/2001/XMLSchema',
    nfse: 'http://www.ginfes.com.br/tipos',
    nfseServico: 'http://www.ginfes.com.br/servico_enviar_lote_rps_envio',
    nfseConsulta: 'http://www.ginfes.com.br/servico_consultar_nfse_rps_envio',
    nfseCancelamento: 'http://www.ginfes.com.br/servico_cancelar_nfse_envio',
    nfseConsultaLote: 'http://www.ginfes.com.br/servico_consultar_lote_rps_envio',
    dsig: 'http://www.w3.org/2000/09/xmldsig#',
    cabecalho: 'http://www.ginfes.com.br/cabecalho_v03.xsd',
  },

  // Content-Type header para requisições SOAP
  contentType: 'application/soap+xml; charset=utf-8',

  // Actions SOAP para cada operação (formato GINFES v03)
  soapActions: {
    enviarLoteRps: 'RecepcionarLoteRpsV3',
    consultarNfsePorRps: 'ConsultarNfseRpsV3',
    consultarNfse: 'ConsultarNfseV3',
    consultarLoteRps: 'ConsultarLoteRpsV3',
    cancelarNfse: 'CancelarNfseV3',
  },

  // Endpoints específicos
  endpoints: {
    envioSincrono: '/ServiceGinfesImpl',
    envioLote: '/ServiceGinfesImpl',
    consultaRps: '/ServiceGinfesImpl',
    consultaNfse: '/ServiceGinfesImpl',
    consultaLote: '/ServiceGinfesImpl',
    cancelamento: '/ServiceGinfesImpl',
  },

  // Códigos de natureza de operação
  naturezaOperacao: {
    TRIBUTACAO_MUNICIPIO: 1,
    TRIBUTACAO_FORA_MUNICIPIO: 2,
    ISENCAO: 3,
    IMUNE: 4,
    EXIGIBILIDADE_SUSPENSA_JUDICIAL: 5,
    EXIGIBILIDADE_SUSPENSA_ADMINISTRATIVA: 6,
  } as const,

  // Tipos de RPS
  tiposRps: {
    RECIBO_PROVISORIO_SERVICOS: 'RPS',
    NOTA_FISCAL_CONVENIO: 'NFConjugada',
    CUPOM: 'Cupom',
  } as const,

  // Status de retorno
  statusRetorno: {
    SUCESSO: 'Sucesso',
    ERRO: 'Erro',
    AVISO: 'Aviso',
  } as const,

  // Timeout padrão para requisições (ms)
  timeout: 30000,
} as const;

// Tipos exportados
export type NaturezaOperacao = typeof NFSeConfig.naturezaOperacao[keyof typeof NFSeConfig.naturezaOperacao];
export type TipoRps = typeof NFSeConfig.tiposRps[keyof typeof NFSeConfig.tiposRps];
export type StatusRetorno = typeof NFSeConfig.statusRetorno[keyof typeof NFSeConfig.statusRetorno];

export default NFSeConfig;
