/**
 * Client NFS-e - GINFES v03 Adapter
 * Implementação unificada com protocolo SOAP 1.2 e namespaces GINFES v03.
 * Mantém compatibilidade de API com NFSeClient (emitir/consultar/cancelar).
 */

import type {
  NFSeEmissaoData,
  NFSeResposta,
  NFSeConsultaData,
  NFSeCancelamentoData,
  NFSeCancelamentoResposta,
  CertificadoDigital,
  NFSeConfiguracao,
} from "../../types/nfse";
import { NFSeConfig } from "../nfs-e/config";

interface NFSeClientConfig {
  urlHomologacao: string;
  urlProducao: string;
  ambiente: "homologacao" | "producao";
  versao: string;
  timeoutMs: number;
  retryAttempts: number;
}

function mapConfig(src: NFSeClientConfig | NFSeConfiguracao): NFSeClientConfig {
  if ("urlHomologacao" in src) return src as NFSeClientConfig;
  return {
    urlHomologacao: src.urlHomologacao || NFSeConfig.urls.homologacao + "/ServiceGinfesImpl",
    urlProducao: src.urlProducao || NFSeConfig.urls.producao + "/ServiceGinfesImpl",
    ambiente: src.ambiente,
    versao: src.versao || NFSeConfig.versaoLayout,
    timeoutMs: src.timeoutMs || NFSeConfig.timeout,
    retryAttempts: src.retryAttempts || 3,
  };
}

function escapeXml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatCnpj(cnpj: string): string {
  return (cnpj || "").replace(/\D/g, "");
}

function formatCpf(cpf: string): string {
  return (cpf || "").replace(/\D/g, "");
}

function formatValor(v: number | undefined): string {
  return (v ?? 0).toFixed(2);
}

function buildCabecalhoGinfes(): string {
  return `<cabecalho xmlns="http://www.ginfes.com.br/cabecalho_v03.xsd" versao="3"><versaoDados>3</versaoDados></cabecalho>`;
}

function buildEnvelope(soapAction: string, dadosXml: string, ambiente?: "homologacao" | "producao"): string {
  const cabecalho = buildCabecalhoGinfes();
  // GINFES: produção usa namespace http://producao.ginfes.com.br, homologação usa http://www.ginfes.com.br/
  const namespace = ambiente === "producao" ? "http://producao.ginfes.com.br" : "http://www.ginfes.com.br/";
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap12:Body>
    <${soapAction} xmlns="${namespace}">
      <arg0>${cabecalho}</arg0>
      <arg1><![CDATA[${dadosXml}]]></arg1>
    </${soapAction}>
  </soap12:Body>
</soap12:Envelope>`;
}

function buildLoteRpsXml(data: NFSeEmissaoData): string {
  const p = data.prestador;
  const t = data.tomador;
  const s = data.servico;
  const rpsId = `R${formatCnpj(p.cnpj)}${String(data.numero).padStart(15, "0")}`;
  const loteId = `LOTE${formatCnpj(p.cnpj)}${Date.now()}`;

  const valores = `<Valores>
  <ValorServicos>${formatValor(s.valorServicos)}</ValorServicos>
  <ValorDeducoes>${formatValor(s.valorDeducoes)}</ValorDeducoes>
  <ValorPis>${formatValor(s.valorPis)}</ValorPis>
  <ValorCofins>${formatValor(s.valorCofins)}</ValorCofins>
  <ValorInss>${formatValor(s.valorInss)}</ValorInss>
  <ValorIr>${formatValor(s.valorIr)}</ValorIr>
  <ValorCsll>${formatValor(s.valorCsll)}</ValorCsll>
  <IssRetido>${s.issRetido}</IssRetido>
  <ValorIss>${formatValor(s.valorIss)}</ValorIss>
  <ValorIssRetido>${formatValor(s.valorIssRetido)}</ValorIssRetido>
  <OutrasRetencoes>${formatValor(s.outrasRetencoes)}</OutrasRetencoes>
  <BaseCalculo>${formatValor(s.baseCalculo)}</BaseCalculo>
  <Aliquota>${s.aliquota.toFixed(4)}</Aliquota>
  <ValorLiquidoNfse>${formatValor(s.valorLiquidoNfse)}</ValorLiquidoNfse>
  <ValorDescontoIncondicionado>${formatValor(s.valorDescontoIncondicionado)}</ValorDescontoIncondicionado>
  <ValorDescontoCondicionado>${formatValor(s.valorDescontoCondicionado)}</ValorDescontoCondicionado>
</Valores>`;

  const rps = `  <Rps>
    <InfRps Id="${rpsId}">
      <IdentificacaoRps>
        <Numero>${data.numero}</Numero>
        <Serie>${escapeXml(data.serie)}</Serie>
        <Tipo>${data.tipo}</Tipo>
      </IdentificacaoRps>
      <DataEmissao>${data.dataEmissao}</DataEmissao>
      <NaturezaOperacao>${data.naturezaOperacao}</NaturezaOperacao>
      <OptanteSimplesNacional>${data.optanteSimplesNacional}</OptanteSimplesNacional>
      <IncentivadorCultural>${data.incentivadorCultural}</IncentivadorCultural>
      <Status>${data.status}</Status>
      <Servico>
        ${valores}
        <ItemListaServico>${escapeXml(s.itemListaServico)}</ItemListaServico>
        ${s.codigoCnae ? `<CodigoCnae>${escapeXml(s.codigoCnae)}</CodigoCnae>` : ""}
        ${s.codigoTributacaoMunicipio ? `<CodigoTributacaoMunicipio>${escapeXml(s.codigoTributacaoMunicipio)}</CodigoTributacaoMunicipio>` : ""}
        <Discriminacao>${escapeXml(s.discriminacao)}</Discriminacao>
        <CodigoMunicipio>${s.codigoMunicipio}</CodigoMunicipio>
        <ExigibilidadeISS>${s.exigibilidadeISS}</ExigibilidadeISS>
        ${s.municipioIncidencia ? `<MunicipioIncidencia>${s.municipioIncidencia}</MunicipioIncidencia>` : ""}
      </Servico>
      <Prestador>
        <Cnpj>${formatCnpj(p.cnpj)}</Cnpj>
        <InscricaoMunicipal>${escapeXml(p.inscricaoMunicipal)}</InscricaoMunicipal>
      </Prestador>
      <Tomador>
        <IdentificacaoTomador>
          <CpfCnpj>
            ${t.cnpj ? `<Cnpj>${formatCnpj(t.cnpj)}</Cnpj>` : ""}
            ${t.cpf ? `<Cpf>${formatCpf(t.cpf)}</Cpf>` : ""}
          </CpfCnpj>
          ${t.inscricaoMunicipal ? `<InscricaoMunicipal>${escapeXml(t.inscricaoMunicipal)}</InscricaoMunicipal>` : ""}
        </IdentificacaoTomador>
        <RazaoSocial>${escapeXml(t.razaoSocial)}</RazaoSocial>
        <Endereco>
          <Endereco>${escapeXml(t.endereco.logradouro)}</Endereco>
          <Numero>${escapeXml(t.endereco.numero || "")}</Numero>
          ${t.endereco.complemento ? `<Complemento>${escapeXml(t.endereco.complemento)}</Complemento>` : ""}
          <Bairro>${escapeXml(t.endereco.bairro || "")}</Bairro>
          <CodigoMunicipio>${t.endereco.codigoMunicipio || ""}</CodigoMunicipio>
          <Uf>${t.endereco.uf || ""}</Uf>
          <Cep>${(t.endereco.cep || "").replace(/\D/g, "")}</Cep>
        </Endereco>
      </Tomador>
    </InfRps>
  </Rps>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<EnviarLoteRpsEnvio xmlns="http://www.ginfes.com.br/servico_enviar_lote_rps_envio_v03.xsd">
  <LoteRps Id="${loteId}">
    <NumeroLote>1</NumeroLote>
    <Cnpj>${formatCnpj(p.cnpj)}</Cnpj>
    <InscricaoMunicipal>${escapeXml(p.inscricaoMunicipal)}</InscricaoMunicipal>
    <QuantidadeRps>1</QuantidadeRps>
    <ListaRps>
${rps}
    </ListaRps>
  </LoteRps>
</EnviarLoteRpsEnvio>`;
}

function buildConsultaXml(data: NFSeConsultaData): string {
  if (data.cnpjTomador || data.cpfTomador) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<ConsultarNfseServicoPrestadoEnvio xmlns="http://www.ginfes.com.br/servico_consultar_nfse_servico_prestado_envio_v03.xsd">
  <Prestador>
    ${data.cnpjPrestador ? `<Cnpj>${formatCnpj(data.cnpjPrestador)}</Cnpj>` : ""}
    ${data.inscricaoMunicipalPrestador ? `<InscricaoMunicipal>${escapeXml(data.inscricaoMunicipalPrestador)}</InscricaoMunicipal>` : ""}
  </Prestador>
  <Tomador>
    <CpfCnpj>
      ${data.cnpjTomador ? `<Cnpj>${formatCnpj(data.cnpjTomador)}</Cnpj>` : ""}
      ${data.cpfTomador ? `<Cpf>${formatCpf(data.cpfTomador)}</Cpf>` : ""}
    </CpfCnpj>
  </Tomador>
  ${data.dataInicio ? `<Periodo><DataInicial>${data.dataInicio}</DataInicial><DataFinal>${data.dataFim || data.dataInicio}</DataFinal></Periodo>` : ""}
</ConsultarNfseServicoPrestadoEnvio>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<ConsultarNfseRpsEnvio xmlns="http://www.ginfes.com.br/servico_consultar_nfse_rps_envio_v03.xsd">
  <IdentificacaoRps>
    ${data.numero ? `<Numero>${data.numero}</Numero>` : ""}
    ${data.serie ? `<Serie>${escapeXml(data.serie)}</Serie>` : ""}
    ${data.tipo ? `<Tipo>${data.tipo}</Tipo>` : ""}
  </IdentificacaoRps>
  <Prestador>
    ${data.cnpjPrestador ? `<Cnpj>${formatCnpj(data.cnpjPrestador)}</Cnpj>` : ""}
    ${data.inscricaoMunicipalPrestador ? `<InscricaoMunicipal>${escapeXml(data.inscricaoMunicipalPrestador)}</InscricaoMunicipal>` : ""}
  </Prestador>
</ConsultarNfseRpsEnvio>`;
}

function buildCancelamentoXml(data: NFSeCancelamentoData): string {
  const pedidoId = `CANC${data.numero}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<CancelarNfseEnvio xmlns="http://www.ginfes.com.br/servico_cancelar_nfse_envio_v03.xsd">
  <Pedido Id="${pedidoId}">
    <InfPedidoCancelamento>
      <IdentificacaoNfse>
        <Numero>${data.numero}</Numero>
        <Cnpj>${formatCnpj(data.cnpjPrestador)}</Cnpj>
        <InscricaoMunicipal>${escapeXml(data.inscricaoMunicipalPrestador)}</InscricaoMunicipal>
        <CodigoMunicipio>${data.codigoMunicipio}</CodigoMunicipio>
      </IdentificacaoNfse>
      <CodigoCancelamento>${data.codigoCancelamento}</CodigoCancelamento>
      ${data.motivoCancelamento ? `<MotivoCancelamento>${escapeXml(data.motivoCancelamento)}</MotivoCancelamento>` : ""}
    </InfPedidoCancelamento>
  </Pedido>
</CancelarNfseEnvio>`;
}

function extractValue(xml: string, tag: string): string | undefined {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : undefined;
}

function extractBlock(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function parseMessages(xml: string): Array<{ codigo: string; mensagem: string; tipo: "Sucesso" | "Erro" | "Aviso" }> {
  const msgs: Array<{ codigo: string; mensagem: string; tipo: "Sucesso" | "Erro" | "Aviso" }> = [];
  const blocks = [...xml.matchAll(/<MensagemRetorno[^>]*>([\s\S]*?)<\/MensagemRetorno>/gi)];
  if (blocks.length === 0) {
    const codigos = [...xml.matchAll(/<Codigo[^>]*>([^<]*)<\/Codigo>/gi)].map(m => m[1]);
    const mensagens = [...xml.matchAll(/<Mensagem[^>]*>([^<]*)<\/Mensagem>/gi)].map(m => m[1]);
    for (let i = 0; i < Math.max(codigos.length, mensagens.length); i++) {
      msgs.push({ codigo: codigos[i] || "ERR", mensagem: mensagens[i] || "Erro desconhecido", tipo: "Erro" });
    }
    return msgs;
  }
  for (const [, block] of blocks) {
    const codigo = extractValue(block, "Codigo") || "";
    const mensagem = extractValue(block, "Mensagem") || "";
    const correcao = extractValue(block, "Correcao");
    const tipo: any = extractValue(block, "Tipo") || "Erro";
    msgs.push({ codigo, mensagem: correcao ? `${mensagem} (${correcao})` : mensagem, tipo });
  }
  return msgs;
}

function parseNfseResponse(xml: string): NFSeResposta {
  const msgs = parseMessages(xml);
  const hasError = msgs.some(m => m.tipo === "Erro");

  let workXml = xml;
  const cdata = xml.match(/<return[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/return>/i);
  if (cdata) workXml = cdata[1];

  const cleanXml = workXml.replace(/<\/?[a-zA-Z0-9_]+:/g, m => (m.startsWith("</") ? "</" : "<"));

  const compNfse = extractBlock(cleanXml, "CompNfse") || extractBlock(cleanXml, "ListaNfse");
  const nfseBlock = compNfse ? (extractBlock(compNfse, "Nfse") || compNfse) : cleanXml;
  const infNfse = extractBlock(nfseBlock, "InfNfse") || nfseBlock;

  const numero = extractValue(infNfse, "NumeroNfse") || extractValue(infNfse, "Numero");
  const codigoVerificacao = extractValue(infNfse, "CodigoVerificacao");
  const dataEmissao = extractValue(infNfse, "DataEmissaoNfse") || extractValue(infNfse, "DataEmissao");
  const protocolo = extractValue(cleanXml, "Protocolo");

  const valoresBlock = extractBlock(infNfse, "ValoresNfse") || extractBlock(infNfse, "Valores");

  const sucesso = !hasError && !!(numero || protocolo);

  return {
    sucesso,
    numero,
    codigoVerificacao,
    dataEmissao,
    protocolo,
    mensagens: msgs.length > 0 ? msgs : sucesso ? [{ codigo: "0000", mensagem: "Operação realizada com sucesso", tipo: "Sucesso" }] : undefined,
    valores: valoresBlock
      ? {
          valorServicos: parseFloat((extractValue(valoresBlock, "ValorServicos") || "0").replace(",", ".")),
          valorDeducoes: parseFloat((extractValue(valoresBlock, "ValorDeducoes") || "0").replace(",", ".")),
          valorPis: parseFloat((extractValue(valoresBlock, "ValorPis") || "0").replace(",", ".")),
          valorCofins: parseFloat((extractValue(valoresBlock, "ValorCofins") || "0").replace(",", ".")),
          valorInss: parseFloat((extractValue(valoresBlock, "ValorInss") || "0").replace(",", ".")),
          valorIr: parseFloat((extractValue(valoresBlock, "ValorIr") || "0").replace(",", ".")),
          valorCsll: parseFloat((extractValue(valoresBlock, "ValorCsll") || "0").replace(",", ".")),
          valorIss: parseFloat((extractValue(valoresBlock, "ValorIss") || "0").replace(",", ".")),
          valorIssRetido: parseFloat((extractValue(valoresBlock, "ValorIssRetido") || "0").replace(",", ".")),
          outrasRetencoes: parseFloat((extractValue(valoresBlock, "OutrasRetencoes") || "0").replace(",", ".")),
          baseCalculo: parseFloat((extractValue(valoresBlock, "BaseCalculo") || "0").replace(",", ".")),
          aliquota: parseFloat((extractValue(valoresBlock, "Aliquota") || "0").replace(",", ".")),
          valorLiquidoNfse: parseFloat((extractValue(valoresBlock, "ValorLiquidoNfse") || "0").replace(",", ".")),
        }
      : undefined,
  };
}

function parseConsultaResponse(xml: string): NFSeResposta {
  const base = parseNfseResponse(xml);
  const cleanXml = xml.replace(/<\/?[a-zA-Z0-9_]+:/g, m => (m.startsWith("</") ? "</" : "<"));
  const dataCancelamento = extractValue(cleanXml, "DataCancelamento");
  const nfseSubstituida = extractValue(cleanXml, "NfseSubstituida");
  const status = dataCancelamento ? "CANCELADA" : nfseSubstituida === "1" ? "SUBSTITUIDA" : "NORMAL";
  return { ...base, status };
}

function parseCancelamentoResponse(xml: string): NFSeCancelamentoResposta {
  const msgs = parseMessages(xml);
  const hasError = msgs.some(m => m.tipo === "Erro");
  const confirmacao = extractBlock(xml, "Confirmacao");
  const sucesso = !hasError && (extractValue(confirmacao || xml, "Sucesso") === "true" || extractValue(confirmacao || xml, "sucesso") === "true");
  const dataHora = extractValue(confirmacao || xml, "DataHoraCancelamento");
  return {
    sucesso,
    dataHoraCancelamento: dataHora,
    mensagens: msgs.length > 0 ? msgs : sucesso ? [{ codigo: "0000", mensagem: "Cancelamento confirmado", tipo: "Sucesso" }] : undefined,
  };
}

export class NFSeClient {
  private config: NFSeClientConfig;

  constructor(config: NFSeClientConfig | NFSeConfiguracao) {
    this.config = mapConfig(config);
  }

  private get url(): string {
    return this.config.ambiente === "producao" ? this.config.urlProducao : this.config.urlHomologacao;
  }

  private async request(soapAction: string, dadosXml: string): Promise<string> {
    const envelope = buildEnvelope(soapAction, dadosXml, this.config.ambiente);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/soap+xml; charset=utf-8",
          "SOAPAction": `"${soapAction}"`,
        },
        body: envelope,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const text = await response.text();
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${text.substring(0, 500)}`);
      if (!text || text.trim().length === 0) throw new Error("Resposta vazia do servidor");
      return text;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("timeout");
      }
      throw error;
    }
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const msg = lastError.message;
        if (msg === "timeout" || msg.includes("400") || msg.includes("401") || msg.includes("403") || msg.includes("404") || lastError instanceof TypeError) {
          throw lastError;
        }
        if (attempt < this.config.retryAttempts - 1) {
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
        }
      }
    }
    throw new Error(`máximo de tentativas atingido: ${lastError?.message}`);
  }

  private validarCertificado(certificado: CertificadoDigital): void {
    if (!certificado.ativo) throw new Error("Certificado digital está inativo");
    if (new Date(certificado.validadeFim) < new Date()) throw new Error("Certificado digital expirado");
  }

  async emitir(
    data: NFSeEmissaoData,
    certificado: CertificadoDigital
  ): Promise<NFSeResposta & { xmlEnvio?: string; xmlRetorno?: string }> {
    if (data.servico.valorServicos <= 0) throw new Error("Valor dos serviços deve ser maior que zero");
    this.validarCertificado(certificado);

    const xmlEnvio = buildLoteRpsXml(data);

    return this.withRetry(async () => {
      const xmlRetorno = await this.request("RecepcionarLoteRps", xmlEnvio);
      return { ...parseNfseResponse(xmlRetorno), xmlEnvio, xmlRetorno };
    });
  }

  async consultar(data: NFSeConsultaData): Promise<NFSeResposta> {
    const xmlConsulta = buildConsultaXml(data);
    const action = data.cnpjTomador || data.cpfTomador ? "ConsultarNfseServicoPrestado" : "ConsultarNfseRps";
    const xmlRetorno = await this.request(action, xmlConsulta);
    return parseConsultaResponse(xmlRetorno);
  }

  async cancelar(
    data: NFSeCancelamentoData,
    certificado: CertificadoDigital
  ): Promise<NFSeCancelamentoResposta> {
    this.validarCertificado(certificado);
    const xmlCancelamento = buildCancelamentoXml(data);
    return this.withRetry(async () => {
      const xmlRetorno = await this.request("CancelarNfse", xmlCancelamento);
      return parseCancelamentoResponse(xmlRetorno);
    });
  }
}
