/**
 * Construtor de XML para NFS-e conforme layout ABRASF 2.04
 */

import { NFSeConfig, NaturezaOperacao, TipoRps } from './config';
import { EmitenteNfse, gerarIdRps, gerarIdLote, formatarCnpjNfse, formatarInscricaoMunicipal } from './auth';

// Tipos para estrutura da nota fiscal
export interface ValoresServico {
  valorServicos: number;
  valorDeducoes?: number;
  valorPis?: number;
  valorCofins?: number;
  valorInss?: number;
  valorIr?: number;
  valorCsll?: number;
  outrasRetencoes?: number;
  valorIss?: number;
  descontoIncondicionado?: number;
  descontoCondicionado?: number;
  valorLiquidoNfse?: number;
  issRetido?: boolean;
  aliquota?: number;
}

export interface EnderecoTomador {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  codigoMunicipio: string;
  uf: string;
  cep: string;
}

export interface Tomador {
  cpfCnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  inscricaoMunicipal?: string;
  inscricaoEstadual?: string;
  endereco: EnderecoTomador;
  telefone?: string;
  email?: string;
}

export interface Servico {
  valores: ValoresServico;
  itemListaServico: string; // Código do item da lista de serviços LC 116
  codigoCnae?: string;
  codigoTributacaoMunicipio?: string;
  discriminacao: string;
  codigoMunicipio: string;
  exigibilidadeISS?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  municipioIncidencia?: string;
}

export interface IdentificacaoRps {
  numero: string;
  serie: string;
  tipo: TipoRps;
}

export interface DadosNotaFiscal {
  identificacaoRps: IdentificacaoRps;
  dataEmissao: Date;
  naturezaOperacao: NaturezaOperacao;
  optanteSimplesNacional?: boolean;
  incentivadorCultural?: boolean;
  regimeEspecialTributacao?: 1 | 2 | 3 | 4 | 5 | 6;
  emitente: EmitenteNfse;
  tomador: Tomador;
  servico: Servico;
  intermediario?: {
    cpfCnpj: string;
    razaoSocial: string;
    inscricaoMunicipal?: string;
  };
  construcaoCivil?: {
    codigoObra?: string;
    art?: string;
  };
  condicaoPagamento?: string;
}

/**
 * Formata valor numérico para o padrão brasileiro (2 casas decimais)
 */
function formatarValor(valor: number | undefined): string {
  if (valor === undefined || valor === null) return '0.00';
  return valor.toFixed(2);
}

/**
 * Formata data para o padrão ISO
 */
function formatarData(data: Date): string {
  return data.toISOString().split('T')[0];
}

/**
 * Formata data e hora para o padrão ISO completo
 */
function formatarDataHora(data: Date): string {
  return data.toISOString();
}

/**
 * Constrói o XML do RPS (Recibo Provisório de Serviços)
 */
export function construirRps(nota: DadosNotaFiscal, idRps?: string): string {
  const { identificacaoRps, dataEmissao, naturezaOperacao, emitente, tomador, servico } = nota;

  const id = idRps || gerarIdRps(identificacaoRps.numero, identificacaoRps.serie, emitente.cnpj);
  const { valores } = servico;

  const xml = `  <Rps xmlns="${NFSeConfig.namespaces.nfse}">
    <InfRps Id="${id}">
      <IdentificacaoRps>
        <Numero>${identificacaoRps.numero}</Numero>
        <Serie>${identificacaoRps.serie}</Serie>
        <Tipo>${identificacaoRps.tipo}</Tipo>
      </IdentificacaoRps>
      <DataEmissao>${formatarDataHora(dataEmissao)}</DataEmissao>
      <NaturezaOperacao>${naturezaOperacao}</NaturezaOperacao>
      ${nota.optanteSimplesNacional !== undefined ? `<OptanteSimplesNacional>${nota.optanteSimplesNacional ? '1' : '2'}</OptanteSimplesNacional>` : ''}
      ${nota.incentivadorCultural !== undefined ? `<IncentivadorCultural>${nota.incentivadorCultural ? '1' : '2'}</IncentivadorCultural>` : ''}
      ${nota.regimeEspecialTributacao ? `<RegimeEspecialTributacao>${nota.regimeEspecialTributacao}</RegimeEspecialTributacao>` : ''}
      <Status>1</Status>
      ${nota.intermediario ? `
      <IntermediarioServico>
        <RazaoSocial>${nota.intermediario.razaoSocial}</RazaoSocial>
        <CpfCnpj>
          <Cnpj>${formatarCnpjNfse(nota.intermediario.cpfCnpj)}</Cnpj>
        </CpfCnpj>
        ${nota.intermediario.inscricaoMunicipal ? `<InscricaoMunicipal>${nota.intermediario.inscricaoMunicipal}</InscricaoMunicipal>` : ''}
      </IntermediarioServico>` : ''}
      ${nota.construcaoCivil ? `
      <ConstrucaoCivil>
        ${nota.construcaoCivil.codigoObra ? `<CodigoObra>${nota.construcaoCivil.codigoObra}</CodigoObra>` : ''}
        ${nota.construcaoCivil.art ? `<Art>${nota.construcaoCivil.art}</Art>` : ''}
      </ConstrucaoCivil>` : ''}
      <Servico>
        <Valores>
          <ValorServicos>${formatarValor(valores.valorServicos)}</ValorServicos>
          ${valores.valorDeducoes !== undefined ? `<ValorDeducoes>${formatarValor(valores.valorDeducoes)}</ValorDeducoes>` : ''}
          ${valores.valorPis !== undefined ? `<ValorPis>${formatarValor(valores.valorPis)}</ValorPis>` : ''}
          ${valores.valorCofins !== undefined ? `<ValorCofins>${formatarValor(valores.valorCofins)}</ValorCofins>` : ''}
          ${valores.valorInss !== undefined ? `<ValorInss>${formatarValor(valores.valorInss)}</ValorInss>` : ''}
          ${valores.valorIr !== undefined ? `<ValorIr>${formatarValor(valores.valorIr)}</ValorIr>` : ''}
          ${valores.valorCsll !== undefined ? `<ValorCsll>${formatarValor(valores.valorCsll)}</ValorCsll>` : ''}
          ${valores.outrasRetencoes !== undefined ? `<OutrasRetencoes>${formatarValor(valores.outrasRetencoes)}</OutrasRetencoes>` : ''}
          ${valores.valorIss !== undefined ? `<ValorIss>${formatarValor(valores.valorIss)}</ValorIss>` : ''}
          ${valores.descontoIncondicionado !== undefined ? `<DescontoIncondicionado>${formatarValor(valores.descontoIncondicionado)}</DescontoIncondicionado>` : ''}
          ${valores.descontoCondicionado !== undefined ? `<DescontoCondicionado>${formatarValor(valores.descontoCondicionado)}</DescontoCondicionado>` : ''}
          ${valores.issRetido !== undefined ? `<IssRetido>${valores.issRetido ? '1' : '2'}</IssRetido>` : '<IssRetido>2</IssRetido>'}
          ${valores.aliquota !== undefined ? `<Aliquota>${formatarValor(valores.aliquota)}</Aliquota>` : ''}
        </Valores>
        ${servico.itemListaServico ? `<ItemListaServico>${servico.itemListaServico}</ItemListaServico>` : ''}
        ${servico.codigoCnae ? `<CodigoCnae>${servico.codigoCnae}</CodigoCnae>` : ''}
        ${servico.codigoTributacaoMunicipio ? `<CodigoTributacaoMunicipio>${servico.codigoTributacaoMunicipio}</CodigoTributacaoMunicipio>` : ''}
        <Discriminacao>${servico.discriminacao.replace(/[<>]/g, '')}</Discriminacao>
        <CodigoMunicipio>${servico.codigoMunicipio}</CodigoMunicipio>
        ${servico.exigibilidadeISS ? `<ExigibilidadeISS>${servico.exigibilidadeISS}</ExigibilidadeISS>` : '<ExigibilidadeISS>1</ExigibilidadeISS>'}
        ${servico.municipioIncidencia ? `<MunicipioIncidencia>${servico.municipioIncidencia}</MunicipioIncidencia>` : ''}
      </Servico>
      <Prestador>
        <Cnpj>${formatarCnpjNfse(emitente.cnpj)}</Cnpj>
        <InscricaoMunicipal>${formatarInscricaoMunicipal(emitente.inscricaoMunicipal)}</InscricaoMunicipal>
      </Prestador>
      <Tomador>
        <IdentificacaoTomador>
          <CpfCnpj>
            ${tomador.cpfCnpj.length <= 11 ? `<Cpf>${tomador.cpfCnpj.replace(/\D/g, '')}</Cpf>` : `<Cnpj>${formatarCnpjNfse(tomador.cpfCnpj)}</Cnpj>`}
          </CpfCnpj>
          ${tomador.inscricaoMunicipal ? `<InscricaoMunicipal>${tomador.inscricaoMunicipal}</InscricaoMunicipal>` : ''}
          ${tomador.inscricaoEstadual ? `<InscricaoEstadual>${tomador.inscricaoEstadual}</InscricaoEstadual>` : ''}
        </IdentificacaoTomador>
        <RazaoSocial>${tomador.razaoSocial}</RazaoSocial>
        <Endereco>
          <Endereco>${tomador.endereco.logradouro}</Endereco>
          <Numero>${tomador.endereco.numero}</Numero>
          ${tomador.endereco.complemento ? `<Complemento>${tomador.endereco.complemento}</Complemento>` : ''}
          <Bairro>${tomador.endereco.bairro}</Bairro>
          <CodigoMunicipio>${tomador.endereco.codigoMunicipio}</CodigoMunicipio>
          <Uf>${tomador.endereco.uf}</Uf>
          <Cep>${tomador.endereco.cep.replace(/\D/g, '')}</Cep>
        </Endereco>
        ${tomador.telefone ? `<Telefone>${tomador.telefone.replace(/\D/g, '')}</Telefone>` : ''}
        ${tomador.email ? `<Email>${tomador.email}</Email>` : ''}
      </Tomador>
      ${nota.condicaoPagamento ? `<CondicaoPagamento>${nota.condicaoPagamento}</CondicaoPagamento>` : ''}
    </InfRps>
  </Rps>`;

  return xml;
}

/**
 * Constrói o XML de Lote de RPS para envio em batch
 */
export function construirLoteRps(
  notas: DadosNotaFiscal[],
  numeroLote: string,
  cnpj: string,
  inscricaoMunicipal: string,
  quantidadeRps?: number
): string {
  if (notas.length === 0) {
    throw new Error('Lote deve conter pelo menos um RPS');
  }

  const idLote = gerarIdLote(numeroLote, cnpj);
  const qtdRps = quantidadeRps || notas.length;

  const rpsElements = notas.map((nota, index) => {
    const idRps = gerarIdRps(
      nota.identificacaoRps.numero,
      nota.identificacaoRps.serie,
      cnpj
    );
    return construirRps(nota, `${idRps}_${index}`);
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<EnviarLoteRpsEnvio xmlns="${NFSeConfig.namespaces.nfseServico}">
  <LoteRps Id="${idLote}">
    <NumeroLote>${numeroLote}</NumeroLote>
    <Cnpj>${formatarCnpjNfse(cnpj)}</Cnpj>
    <InscricaoMunicipal>${formatarInscricaoMunicipal(inscricaoMunicipal)}</InscricaoMunicipal>
    <QuantidadeRps>${qtdRps}</QuantidadeRps>
    <ListaRps>
${rpsElements}
    </ListaRps>
  </LoteRps>
</EnviarLoteRpsEnvio>`;
}

/**
 * Constrói o XML de consulta de NFS-e por RPS
 */
export function construirPedidoConsulta(
  numeroRps: string,
  serieRps: string,
  tipoRps: TipoRps,
  cnpjPrestador: string,
  inscricaoMunicipal: string
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<ConsultarNfseRpsEnvio xmlns="${NFSeConfig.namespaces.nfseConsulta}">
  <IdentificacaoRps>
    <Numero>${numeroRps}</Numero>
    <Serie>${serieRps}</Serie>
    <Tipo>${tipoRps}</Tipo>
  </IdentificacaoRps>
  <Prestador>
    <Cnpj>${formatarCnpjNfse(cnpjPrestador)}</Cnpj>
    <InscricaoMunicipal>${formatarInscricaoMunicipal(inscricaoMunicipal)}</InscricaoMunicipal>
  </Prestador>
</ConsultarNfseRpsEnvio>`;
}

/**
 * Constrói o XML de consulta de NFS-e por período
 */
export function construirPedidoConsultaPeriodo(
  cnpjPrestador: string,
  inscricaoMunicipal: string,
  dataInicial: Date,
  dataFinal: Date,
  numeroNfse?: string,
  cnpjTomador?: string,
  imTomador?: string,
  cnpjIntermediario?: string,
  imIntermediario?: string
): string {
  let tomadorXml = '';
  if (cnpjTomador) {
    tomadorXml = `
  <Tomador>
    <CpfCnpj>
      ${cnpjTomador.length <= 11 ? `<Cpf>${cnpjTomador.replace(/\D/g, '')}</Cpf>` : `<Cnpj>${formatarCnpjNfse(cnpjTomador)}</Cnpj>`}
    </CpfCnpj>
    ${imTomador ? `<InscricaoMunicipal>${imTomador}</InscricaoMunicipal>` : ''}
  </Tomador>`;
  }

  let intermediarioXml = '';
  if (cnpjIntermediario) {
    intermediarioXml = `
  <IntermediarioServico>
    <RazaoSocial></RazaoSocial>
    <CpfCnpj>
      <Cnpj>${formatarCnpjNfse(cnpjIntermediario)}</Cnpj>
    </CpfCnpj>
    ${imIntermediario ? `<InscricaoMunicipal>${imIntermediario}</InscricaoMunicipal>` : ''}
  </IntermediarioServico>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<ConsultarNfseEnvio xmlns="${NFSeConfig.namespaces.nfse}">
  <Prestador>
    <Cnpj>${formatarCnpjNfse(cnpjPrestador)}</Cnpj>
    <InscricaoMunicipal>${formatarInscricaoMunicipal(inscricaoMunicipal)}</InscricaoMunicipal>
  </Prestador>
  ${numeroNfse ? `<NumeroNfse>${numeroNfse}</NumeroNfse>` : ''}
  <PeriodoEmissao>
    <DataInicial>${formatarData(dataInicial)}</DataInicial>
    <DataFinal>${formatarData(dataFinal)}</DataFinal>
  </PeriodoEmissao>${tomadorXml}${intermediarioXml}
</ConsultarNfseEnvio>`;
}

/**
 * Constrói o XML de consulta de lote RPS
 */
export function construirPedidoConsultaLote(
  protocolo: string,
  cnpjPrestador: string,
  inscricaoMunicipal: string
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<ConsultarLoteRpsEnvio xmlns="${NFSeConfig.namespaces.nfseConsultaLote}">
  <Prestador>
    <Cnpj>${formatarCnpjNfse(cnpjPrestador)}</Cnpj>
    <InscricaoMunicipal>${formatarInscricaoMunicipal(inscricaoMunicipal)}</InscricaoMunicipal>
  </Prestador>
  <Protocolo>${protocolo}</Protocolo>
</ConsultarLoteRpsEnvio>`;
}

/**
 * Constrói o XML de cancelamento de NFS-e
 */
export function construirPedidoCancelamento(
  numeroNfse: string,
  cnpjPrestador: string,
  inscricaoMunicipal: string,
  codigoCancelamento: string,
  motivoCancelamento?: string
): string {
  // Códigos de cancelamento:
  // E007 - Erro de preenchimento
  // E008 - Serviço não prestado
  // E009 - Duplicidade de nota
  // Outros conforme legislação municipal

  return `<?xml version="1.0" encoding="UTF-8"?>
<CancelarNfseEnvio xmlns="${NFSeConfig.namespaces.nfseCancelamento}">
  <Pedido>
    <InfPedidoCancelamento Id="CAN${numeroNfse}">
      <IdentificacaoNfse>
        <Numero>${numeroNfse}</Numero>
        <Cnpj>${formatarCnpjNfse(cnpjPrestador)}</Cnpj>
        <InscricaoMunicipal>${formatarInscricaoMunicipal(inscricaoMunicipal)}</InscricaoMunicipal>
        <CodigoMunicipio>3550308</CodigoMunicipio>
      </IdentificacaoNfse>
      <CodigoCancelamento>${codigoCancelamento}</CodigoCancelamento>
      ${motivoCancelamento ? `<MotivoCancelamento>${motivoCancelamento}</MotivoCancelamento>` : ''}
    </InfPedidoCancelamento>
  </Pedido>
</CancelarNfseEnvio>`;
}

/**
 * Valida os dados da nota fiscal antes de gerar o XML
 */
export function validarDadosNota(nota: DadosNotaFiscal): string[] {
  const erros: string[] = [];

  if (!nota.identificacaoRps.numero) {
    erros.push('Número do RPS é obrigatório');
  }
  if (!nota.identificacaoRps.serie) {
    erros.push('Série do RPS é obrigatória');
  }
  if (!nota.identificacaoRps.tipo) {
    erros.push('Tipo do RPS é obrigatório');
  }
  if (!nota.dataEmissao) {
    erros.push('Data de emissão é obrigatória');
  }
  if (!nota.naturezaOperacao) {
    erros.push('Natureza da operação é obrigatória');
  }
  if (!nota.emitente.cnpj) {
    erros.push('CNPJ do emitente é obrigatório');
  }
  if (!nota.emitente.inscricaoMunicipal) {
    erros.push('Inscrição municipal do emitente é obrigatória');
  }
  if (!nota.tomador.cpfCnpj) {
    erros.push('CPF/CNPJ do tomador é obrigatório');
  }
  if (!nota.tomador.razaoSocial) {
    erros.push('Razão social do tomador é obrigatória');
  }
  if (!nota.tomador.endereco.logradouro) {
    erros.push('Logradouro do tomador é obrigatório');
  }
  if (!nota.servico.valores.valorServicos || nota.servico.valores.valorServicos <= 0) {
    erros.push('Valor dos serviços deve ser maior que zero');
  }
  if (!nota.servico.itemListaServico) {
    erros.push('Código do item da lista de serviços é obrigatório');
  }
  if (!nota.servico.discriminacao) {
    erros.push('Discriminação do serviço é obrigatória');
  }
  if (!nota.servico.codigoMunicipio) {
    erros.push('Código do município é obrigatório');
  }

  return erros;
}
