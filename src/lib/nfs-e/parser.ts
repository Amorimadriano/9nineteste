/**
 * Parser de respostas XML da API de NFS-e
 * Extrai dados das respostas SOAP da GINFES
 */

import { NFSeConfig, StatusRetorno } from './config';

// Tipos para respostas parseadas
export interface RespostaEmissao {
  sucesso: boolean;
  protocolo?: string;
  numeroNfse?: string;
  codigoVerificacao?: string;
  dataEmissao?: Date;
  linkPdf?: string;
  linkXml?: string;
  mensagens: MensagemRetorno[];
}

export interface RespostaConsulta {
  sucesso: boolean;
  nfse?: NfseDetalhada;
  mensagens: MensagemRetorno[];
}

export interface RespostaConsultaLote {
  sucesso: boolean;
  situacao: 'EM_PROCESSAMENTO' | 'PROCESSADO_COM_ERRO' | 'PROCESSADO_COM_SUCESSO';
  protocolo: string;
  nfseGeradas?: NfseDetalhada[];
  nfseComErro?: NfseErro[];
  mensagens: MensagemRetorno[];
}

export interface RespostaCancelamento {
  sucesso: boolean;
  dataHoraCancelamento?: Date;
  mensagens: MensagemRetorno[];
}

export interface MensagemRetorno {
  codigo: string;
  mensagem: string;
  correcao?: string;
  tipo: 'Sucesso' | 'Erro' | 'Aviso';
}

export interface NfseDetalhada {
  numero: string;
  codigoVerificacao: string;
  dataEmissao: Date;
  identificacaoRps?: {
    numero: string;
    serie: string;
    tipo: string;
  };
  naturezaOperacao: number;
  optanteSimplesNacional: boolean;
  prestador: {
    cnpj: string;
    inscricaoMunicipal: string;
    razaoSocial: string;
  };
  tomador: {
    cpfCnpj: string;
    razaoSocial: string;
    endereco: {
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      codigoMunicipio: string;
      uf: string;
      cep: string;
    };
  };
  servico: {
    valores: {
      valorServicos: number;
      valorDeducoes?: number;
      valorPis?: number;
      valorCofins?: number;
      valorInss?: number;
      valorIr?: number;
      valorCsll?: number;
      issRetido: boolean;
      valorIss?: number;
      aliquota?: number;
      valorLiquidoNfse?: number;
    };
    itemListaServico: string;
    codigoCnae?: string;
    discriminacao: string;
    codigoMunicipio: string;
  };
  valorCredito?: number;
  linkPdf?: string;
  linkXml?: string;
}

export interface NfseErro {
  identificacaoRps: {
    numero: string;
    serie: string;
    tipo: string;
  };
  erros: MensagemRetorno[];
}

/**
 * Parseia um XML simples extraindo valores entre tags
 */
function extrairValor(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Extrai múltiplas ocorrências de uma tag
 */
function extrairValoresMultiplos(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'gi');
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    matches.push(match[1].trim());
  }
  return matches;
}

/**
 * Extrai conteúdo de uma tag XML (incluindo tags aninhadas)
 */
function extrairConteudoTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\s\S]*?)</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Extrai múltiplos blocos de uma tag
 */
function extrairBlocos(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>[\s\S]*?</${tag}>`, 'gi');
  return xml.match(regex) || [];
}

/**
 * Converte string para número tratando formato brasileiro
 */
function parseNumero(valor: string | null): number {
  if (!valor) return 0;
  // Remove separadores de milhar e substitui vírgula por ponto
  const limpo = valor.replace(/\./g, '').replace(',', '.');
  return parseFloat(limpo) || 0;
}

/**
 * Parseia mensagens de retorno da GINFES
 */
function parsearMensagens(xml: string): MensagemRetorno[] {
  const mensagens: MensagemRetorno[] = [];

  // Tenta extrair de MensagemRetorno (formato lista)
  const blocosMensagem = extrairBlocos(xml, 'MensagemRetorno');

  if (blocosMensagem.length > 0) {
    blocosMensagem.forEach(bloco => {
      const codigo = extrairValor(bloco, 'Codigo') || extrairValor(bloco, 'codigo') || '';
      const mensagem = extrairValor(bloco, 'Mensagem') || extrairValor(bloco, 'mensagem') || '';
      const correcao = extrairValor(bloco, 'Correcao') || extrairValor(bloco, 'correcao') || undefined;
      const tipo = (extrairValor(bloco, 'Tipo') || extrairValor(bloco, 'tipo') || 'Erro') as MensagemRetorno['tipo'];

      if (codigo || mensagem) {
        mensagens.push({ codigo, mensagem, correcao, tipo });
      }
    });
  }

  // Tenta extrair de listaErros (formato alternativo)
  const listaErros = extrairConteudoTag(xml, 'listaErros') || extrairConteudoTag(xml, 'ListaErros');
  if (listaErros && mensagens.length === 0) {
    const erros = extrairValoresMultiplos(listaErros, 'erro');
    erros.forEach(erro => {
      mensagens.push({
        codigo: 'ERRO',
        mensagem: erro,
        tipo: 'Erro',
      });
    });
  }

  return mensagens;
}

/**
 * Parseia resposta de emissão de NFS-e
 */
export function parsearRespostaEmissao(xml: string): RespostaEmissao {
  const mensagens = parsearMensagens(xml);
  const temErro = mensagens.some(m => m.tipo === 'Erro');

  // Tenta extrair dados de sucesso
  const protocolo = extrairValor(xml, 'Protocolo') || extrairValor(xml, 'protocolo') || undefined;
  const numeroNfse = extrairValor(xml, 'Numero') || extrairValor(xml, 'numero') || undefined;
  const codigoVerificacao = extrairValor(xml, 'CodigoVerificacao') ||
    extrairValor(xml, 'codigoVerificacao') ||
    extrairValor(xml, 'CodigoVerificacao') || undefined;

  const dataEmissaoStr = extrairValor(xml, 'DataEmissao') || extrairValor(xml, 'dataEmissao');
  const dataEmissao = dataEmissaoStr ? new Date(dataEmissaoStr) : undefined;

  // Links para download (quando disponíveis)
  const linkPdf = extrairValor(xml, 'LinkPDF') || extrairValor(xml, 'linkPdf') || undefined;
  const linkXml = extrairValor(xml, 'LinkXML') || extrairValor(xml, 'linkXml') || undefined;

  const sucesso = !temErro && !!(protocolo || numeroNfse);

  return {
    sucesso,
    protocolo,
    numeroNfse,
    codigoVerificacao,
    dataEmissao,
    linkPdf,
    linkXml,
    mensagens,
  };
}

/**
 * Parseia resposta de consulta de NFS-e
 */
export function parsearRespostaConsulta(xml: string): RespostaConsulta {
  const mensagens = parsearMensagens(xml);
  const compNfse = extrairConteudoTag(xml, 'CompNfse') || extrairConteudoTag(xml, 'compNfse');

  if (!compNfse) {
    return {
      sucesso: false,
      mensagens: mensagens.length > 0 ? mensagens : [{
        codigo: 'NOT_FOUND',
        mensagem: 'NFS-e não encontrada',
        tipo: 'Erro'
      }],
    };
  }

  const nfse = extrairConteudoTag(compNfse, 'Nfse') || compNfse;
  const infNfse = extrairConteudoTag(nfse, 'InfNfse') || nfse;

  // Parse identificação RPS
  const identificacaoRpsXml = extrairConteudoTag(infNfse, 'IdentificacaoRps');
  const identificacaoRps = identificacaoRpsXml ? {
    numero: extrairValor(identificacaoRpsXml, 'Numero') || '',
    serie: extrairValor(identificacaoRpsXml, 'Serie') || '',
    tipo: extrairValor(identificacaoRpsXml, 'Tipo') || '',
  } : undefined;

  // Parse prestador
  const prestadorXml = extrairConteudoTag(infNfse, 'PrestadorServico') || extrairConteudoTag(infNfse, 'Prestador');
  const prestador = prestadorXml ? {
    cnpj: extrairValor(prestadorXml, 'Cnpj') || extrairValor(prestadorXml, 'cnpj') || '',
    inscricaoMunicipal: extrairValor(prestadorXml, 'InscricaoMunicipal') ||
      extrairValor(prestadorXml, 'inscricaoMunicipal') || '',
    razaoSocial: extrairValor(prestadorXml, 'RazaoSocial') ||
      extrairValor(prestadorXml, 'razaoSocial') || '',
  } : { cnpj: '', inscricaoMunicipal: '', razaoSocial: '' };

  // Parse tomador
  const tomadorXml = extrairConteudoTag(infNfse, 'TomadorServico') || extrairConteudoTag(infNfse, 'Tomador');
  const enderecoTomadorXml = tomadorXml ? extrairConteudoTag(tomadorXml, 'Endereco') : null;

  const tomador = tomadorXml ? {
    cpfCnpj: extrairValor(tomadorXml, 'Cnpj') ||
      extrairValor(tomadorXml, 'cnpj') ||
      extrairValor(tomadorXml, 'Cpf') ||
      extrairValor(tomadorXml, 'cpf') || '',
    razaoSocial: extrairValor(tomadorXml, 'RazaoSocial') ||
      extrairValor(tomadorXml, 'razaoSocial') || '',
    endereco: enderecoTomadorXml ? {
      logradouro: extrairValor(enderecoTomadorXml, 'Endereco') || '',
      numero: extrairValor(enderecoTomadorXml, 'Numero') || '',
      complemento: extrairValor(enderecoTomadorXml, 'Complemento') || undefined,
      bairro: extrairValor(enderecoTomadorXml, 'Bairro') || '',
      codigoMunicipio: extrairValor(enderecoTomadorXml, 'CodigoMunicipio') || '',
      uf: extrairValor(enderecoTomadorXml, 'Uf') || '',
      cep: extrairValor(enderecoTomadorXml, 'Cep') || '',
    } : { logradouro: '', numero: '', bairro: '', codigoMunicipio: '', uf: '', cep: '' },
  } : { cpfCnpj: '', razaoSocial: '', endereco: { logradouro: '', numero: '', bairro: '', codigoMunicipio: '', uf: '', cep: '' } };

  // Parse serviço
  const servicoXml = extrairConteudoTag(infNfse, 'Servico');
  const valoresXml = servicoXml ? extrairConteudoTag(servicoXml, 'Valores') : null;

  const servico = servicoXml ? {
    valores: valoresXml ? {
      valorServicos: parseNumero(extrairValor(valoresXml, 'ValorServicos')),
      valorDeducoes: parseNumero(extrairValor(valoresXml, 'ValorDeducoes')) || undefined,
      valorPis: parseNumero(extrairValor(valoresXml, 'ValorPis')) || undefined,
      valorCofins: parseNumero(extrairValor(valoresXml, 'ValorCofins')) || undefined,
      valorInss: parseNumero(extrairValor(valoresXml, 'ValorInss')) || undefined,
      valorIr: parseNumero(extrairValor(valoresXml, 'ValorIr')) || undefined,
      valorCsll: parseNumero(extrairValor(valoresXml, 'ValorCsll')) || undefined,
      issRetido: extrairValor(valoresXml, 'IssRetido') === '1' ||
        extrairValor(valoresXml, 'issRetido') === 'true',
      valorIss: parseNumero(extrairValor(valoresXml, 'ValorIss')) || undefined,
      aliquota: parseNumero(extrairValor(valoresXml, 'Aliquota')) || undefined,
      valorLiquidoNfse: parseNumero(extrairValor(valoresXml, 'ValorLiquidoNfse')) || undefined,
    } : { valorServicos: 0, issRetido: false },
    itemListaServico: extrairValor(servicoXml, 'ItemListaServico') || '',
    codigoCnae: extrairValor(servicoXml, 'CodigoCnae') || undefined,
    discriminacao: extrairValor(servicoXml, 'Discriminacao') || '',
    codigoMunicipio: extrairValor(servicoXml, 'CodigoMunicipio') || '',
  } : { valores: { valorServicos: 0, issRetido: false }, itemListaServico: '', discriminacao: '', codigoMunicipio: '' };

  const naturezaOp = parseInt(extrairValor(infNfse, 'NaturezaOperacao') || '1');
  const optanteSimples = extrairValor(infNfse, 'OptanteSimplesNacional') === '1' || false;

  return {
    sucesso: true,
    nfse: {
      numero: extrairValor(infNfse, 'Numero') || '',
      codigoVerificacao: extrairValor(infNfse, 'CodigoVerificacao') ||
        extrairValor(infNfse, 'CodigoVerificacao') || '',
      dataEmissao: new Date(extrairValor(infNfse, 'DataEmissao') || new Date()),
      identificacaoRps,
      naturezaOperacao: naturezaOp,
      optanteSimplesNacional: optanteSimples,
      prestador,
      tomador: tomador as any,
      servico: servico as any,
      valorCredito: parseNumero(extrairValor(infNfse, 'ValorCredito')) || undefined,
    },
    mensagens,
  };
}

/**
 * Parseia resposta de consulta de lote RPS
 */
export function parsearRespostaConsultaLote(xml: string): RespostaConsultaLote {
  const mensagens = parsearMensagens(xml);
  const protocolo = extrairValor(xml, 'Protocolo') || extrairValor(xml, 'protocolo') || '';

  const situacaoStr = extrairValor(xml, 'Situacao') || extrairValor(xml, 'situacao') || '4';
  const situacaoMap: Record<string, RespostaConsultaLote['situacao']> = {
    '1': 'EM_PROCESSAMENTO',
    '2': 'PROCESSADO_COM_ERRO',
    '3': 'PROCESSADO_COM_SUCESSO',
    '4': 'EM_PROCESSAMENTO',
  };
  const situacao = situacaoMap[situacaoStr] || 'EM_PROCESSAMENTO';

  const sucesso = situacao === 'PROCESSADO_COM_SUCESSO';

  // Parse NFSe geradas
  const nfseGeradas: NfseDetalhada[] = [];
  const nfsesXml = extrairBlocos(xml, 'CompNfse');
  nfsesXml.forEach(nfseXml => {
    const parsed = parsearRespostaConsulta(nfseXml);
    if (parsed.nfse) {
      nfseGeradas.push(parsed.nfse);
    }
  });

  // Parse NFSe com erro
  const nfseComErro: NfseErro[] = [];
  const errosXml = extrairBlocos(xml, 'Erro');
  errosXml.forEach(erroXml => {
    const rps = extrairConteudoTag(erroXml, 'IdentificacaoRps');
    if (rps) {
      nfseComErro.push({
        identificacaoRps: {
          numero: extrairValor(rps, 'Numero') || '',
          serie: extrairValor(rps, 'Serie') || '',
          tipo: extrairValor(rps, 'Tipo') || '',
        },
        erros: parsearMensagens(erroXml),
      });
    }
  });

  return {
    sucesso,
    situacao,
    protocolo,
    nfseGeradas: nfseGeradas.length > 0 ? nfseGeradas : undefined,
    nfseComErro: nfseComErro.length > 0 ? nfseComErro : undefined,
    mensagens,
  };
}

/**
 * Parseia resposta de cancelamento de NFS-e
 */
export function parsearRespostaCancelamento(xml: string): RespostaCancelamento {
  const mensagens = parsearMensagens(xml);
  const confirmacao = extrairConteudoTag(xml, 'ConfirmacaoCancelamento') ||
    extrairConteudoTag(xml, 'confirmacao');

  const sucesso = extrairValor(confirmacao || xml, 'Sucesso') === 'true' ||
    !mensagens.some(m => m.tipo === 'Erro');

  const dataHoraStr = extrairValor(confirmacao || xml, 'DataHoraCancelamento') ||
    extrairValor(confirmacao || xml, 'dataHora');
  const dataHoraCancelamento = dataHoraStr ? new Date(dataHoraStr) : undefined;

  return {
    sucesso,
    dataHoraCancelamento,
    mensagens,
  };
}

/**
 * Extrai erros de uma resposta SOAP (uso genérico)
 */
export function parsearErros(xml: string): MensagemRetorno[] {
  return parsearMensagens(xml);
}

/**
 * Verifica se a resposta contém erro de autenticação
 */
export function verificarErroAutenticacao(xml: string): boolean {
  const mensagens = parsearMensagens(xml);
  const codigosAuth = ['E10', 'E11', 'E12', 'E13', 'E14', 'E15', 'E16', 'E17'];
  return mensagens.some(m => codigosAuth.includes(m.codigo) ||
    m.mensagem.toLowerCase().includes('autenticação') ||
    m.mensagem.toLowerCase().includes('assinatura') ||
    m.mensagem.toLowerCase().includes('certificado'));
}

/**
 * Extrai código de erro específico da GINFES
 */
export function extrairCodigoErroGinfes(xml: string): string | null {
  const mensagens = parsearMensagens(xml);
  if (mensagens.length > 0) {
    return mensagens[0].codigo;
  }
  return null;
}

/**
 * Traduz código de erro da GINFES para mensagem amigável
 */
export function traduzirErroGinfes(codigo: string): string {
  const erros: Record<string, string> = {
    'E1': 'Erro na estrutura do XML',
    'E2': 'Erro de validação do schema XSD',
    'E3': 'CNPJ do prestador não informado ou inválido',
    'E4': 'Inscrição Municipal do prestador não informada',
    'E5': 'Lote já processado',
    'E6': 'Erro no certificado digital',
    'E7': 'Assinatura digital inválida',
    'E8': 'Data de emissão inválida',
    'E9': 'Número do RPS já existe',
    'E10': 'Erro de autenticação',
    'E11': 'Certificado vencido',
    'E12': 'Certificado não encontrado',
    'E13': 'Senha do certificado incorreta',
    'E14': 'Erro ao processar certificado',
    'E15': 'CNPJ do certificado não corresponde ao CNPJ do emitente',
    'E16': 'Erro na assinatura do XML',
    'E17': 'Assinatura não encontrada',
    'E18': 'Valor dos serviços inválido',
    'E19': 'Item da lista de serviços inválido',
    'E20': 'Discriminação do serviço não informada',
    'E21': 'Código do município inválido',
    'E22': 'Natureza da operação inválida',
    'E23': 'Erro nos dados do tomador',
    'E24': 'Tomador não informado',
    'E25': 'Endereço do tomador incompleto',
    'E26': 'Optante pelo Simples Nacional inválido',
    'E27': 'Incentivador Cultural inválido',
    'E28': 'Regime Especial de Tributação inválido',
    'E29': 'Código CNAE inválido',
    'E30': 'Código de tributação do município inválido',
    'E31': 'Exigibilidade ISS inválida',
    'E32': 'Valor das deduções inválido',
    'E33': 'Alíquota do ISS inválida',
    'E34': 'Valor do ISS inválido',
    'E35': 'Valor do PIS inválido',
    'E36': 'Valor do COFINS inválido',
    'E37': 'Valor do INSS inválido',
    'E38': 'Valor do IR inválido',
    'E39': 'Valor do CSLL inválido',
    'E40': 'Outras retenções inválidas',
    'E41': 'Desconto incondicionado inválido',
    'E42': 'Desconto condicionado inválido',
    'E43': 'ISS Retido inválido',
    'E44': 'Responsável pela retenção inválido',
    'E45': 'Código de cancelamento inválido',
    'E46': 'NFS-e não encontrada para cancelamento',
    'E47': 'NFS-e já cancelada',
    'E48': 'Prazo para cancelamento expirado',
    'E49': 'Protocolo não encontrado',
    'E50': 'Erro interno do servidor',
    'E51': 'Serviço temporariamente indisponível',
    'E52': 'Timeout na requisição',
    'E53': 'Limite de requisições excedido',
    'E54': 'IP não autorizado',
    'E55': 'Usuário não autorizado',
    'E56': 'Erro ao gerar PDF',
    'E57': 'Erro ao gerar XML',
    'E58': 'Link de download expirado',
    'E59': 'Arquivo não encontrado',
    'E60': 'Erro desconhecido',
  };

  return erros[codigo] || `Erro ${codigo}: Consulte a documentação da GINFES`;
}
