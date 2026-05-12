/**
 * Client NFS-e - API Paulistana Adapter
 * Implementação unificada com protocolo SOAP 1.1 e API Paulistana (Prefeitura de SP).
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

const NFSeConfig = {
  urls: {
    homologacao: "https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx",
    producao: "https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx",
  },
  versaoLayout: "1",
  timeout: 30000,
};

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
    urlHomologacao: src.urlHomologacao || NFSeConfig.urls.homologacao,
    urlProducao: src.urlProducao || NFSeConfig.urls.producao,
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

function buildCabecalhoPaulistana(): string {
  return `<cabecalho xmlns="http://www.prefeitura.sp.gov.br/nfe" versao="1"></cabecalho>`;
}

function buildEnvelope(operacao: string, dadosXml: string, _ambiente?: "homologacao" | "producao"): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <${operacao} xmlns="http://www.prefeitura.sp.gov.br/nfe">
      <MensagemXML><![CDATA[${dadosXml}]]></MensagemXML>
    </${operacao}>
  </soap:Body>
</soap:Envelope>`;
}

function buildLoteRpsXml(data: NFSeEmissaoData): string {
  const p = data.prestador;
  const t = data.tomador;
  const s = data.servico;
  const rpsId = `R${formatCnpj(p.cnpj)}${String(data.numero).padStart(12, "0")}`;
  const loteId = `LOTE${Date.now()}`;

  const rps = `<RPS Id="${rpsId}">
    <Assinatura>ASSINATURA_HASH_PLACEHOLDER</Assinatura>
    <ChaveRPS>
      <InscricaoPrestador>${escapeXml(p.inscricaoMunicipal)}</InscricaoPrestador>
      <SerieRPS>${escapeXml(data.serie)}</SerieRPS>
      <NumeroRPS>${data.numero}</NumeroRPS>
    </ChaveRPS>
    <TipoRPS>RPS</TipoRPS>
    <DataEmissao>${data.dataEmissao}</DataEmissao>
    <StatusRPS>N</StatusRPS>
    <TributacaoRPS>T</TributacaoRPS>
    <ValorServicos>${formatValor(s.valorServicos)}</ValorServicos>
    <ValorDeducoes>${formatValor(s.valorDeducoes)}</ValorDeducoes>
    <ValorPIS>${formatValor(s.valorPis)}</ValorPIS>
    <ValorCOFINS>${formatValor(s.valorCofins)}</ValorCOFINS>
    <ValorINSS>${formatValor(s.valorInss)}</ValorINSS>
    <ValorIR>${formatValor(s.valorIr)}</ValorIR>
    <ValorCSLL>${formatValor(s.valorCsll)}</ValorCSLL>
    <CodigoServico>${escapeXml(s.itemListaServico)}</CodigoServico>
    <AliquotaServicos>${s.aliquota.toFixed(4)}</AliquotaServicos>
    <ISSRetido>${s.issRetido === 1 ? "true" : "false"}</ISSRetido>
    <CPFCNPJTomador>
      ${t.cnpj ? `<CNPJ>${formatCnpj(t.cnpj)}</CNPJ>` : ""}
      ${t.cpf ? `<CPF>${formatCpf(t.cpf)}</CPF>` : ""}
    </CPFCNPJTomador>
    <RazaoSocialTomador>${escapeXml(t.razaoSocial)}</RazaoSocialTomador>
    <EnderecoTomador>
      <Logradouro>${escapeXml(t.endereco.logradouro)}</Logradouro>
      <NumeroEndereco>${escapeXml(t.endereco.numero || "S/N")}</NumeroEndereco>
      ${t.endereco.complemento ? `<ComplementoEndereco>${escapeXml(t.endereco.complemento)}</ComplementoEndereco>` : ""}
      <Bairro>${escapeXml(t.endereco.bairro || "")}</Bairro>
      <Cidade>${escapeXml(t.endereco.codigoMunicipio || "")}</Cidade>
      <UF>${t.endereco.uf || ""}</UF>
      <CEP>${(t.endereco.cep || "").replace(/\D/g, "")}</CEP>
    </EnderecoTomador>
    <Discriminacao>${escapeXml(s.discriminacao)}</Discriminacao>
  </RPS>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<PedidoEnvioLoteRPS xmlns="http://www.prefeitura.sp.gov.br/nfe" Id="${loteId}">
  <Cabecalho Versao="1">
    <CPFCNPJRemetente>
      <CNPJ>${formatCnpj(p.cnpj)}</CNPJ>
    </CPFCNPJRemetente>
    <transacao>true</transacao>
    <dtInicio>${data.dataEmissao}</dtInicio>
    <dtFim>${data.dataEmissao}</dtFim>
    <QtdRPS>1</QtdRPS>
    <ValorTotalServicos>${formatValor(s.valorServicos)}</ValorTotalServicos>
    <ValorTotalDeducoes>${formatValor(s.valorDeducoes)}</ValorTotalDeducoes>
  </Cabecalho>
  ${rps}
</PedidoEnvioLoteRPS>`;
}

function buildConsultaXml(data: NFSeConsultaData): string {
  const cnpj = formatCnpj(data.cnpjPrestador || "");
  const im = escapeXml(data.inscricaoMunicipalPrestador || "");

  if (data.cnpjTomador || data.cpfTomador || data.dataInicio) {
    let detalhe = `
    <CPFCNPJPrestador>
      <CNPJ>${cnpj}</CNPJ>
    </CPFCNPJPrestador>
    <InscricaoPrestador>${im}</InscricaoPrestador>`;
    if (data.dataInicio) detalhe += `
    <dtInicio>${data.dataInicio}</dtInicio>
    <dtFim>${data.dataFim || data.dataInicio}</dtFim>`;
    if (data.cnpjTomador) detalhe += `
    <CPFCNPJTomador>
      <CNPJ>${formatCnpj(data.cnpjTomador)}</CNPJ>
    </CPFCNPJTomador>`;
    if (data.cpfTomador) detalhe += `
    <CPFCNPJTomador>
      <CPF>${formatCpf(data.cpfTomador)}</CPF>
    </CPFCNPJTomador>`;
    return `<?xml version="1.0" encoding="UTF-8"?>
<PedidoConsultaNFe xmlns="http://www.prefeitura.sp.gov.br/nfe" Id="Lote1">
  <Cabecalho Versao="1">
    <CPFCNPJRemetente>
      <CNPJ>${cnpj}</CNPJ>
    </CPFCNPJRemetente>
    <transacao>true</transacao>
  </Cabecalho>
  <Detalhe>${detalhe}
  </Detalhe>
</PedidoConsultaNFe>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<PedidoConsultaNFe xmlns="http://www.prefeitura.sp.gov.br/nfe" Id="Lote1">
  <Cabecalho Versao="1">
    <CPFCNPJRemetente>
      <CNPJ>${cnpj}</CNPJ>
    </CPFCNPJRemetente>
    <transacao>true</transacao>
  </Cabecalho>
  <Detalhe>
    <CPFCNPJPrestador>
      <CNPJ>${cnpj}</CNPJ>
    </CPFCNPJPrestador>
    <InscricaoPrestador>${im}</InscricaoPrestador>
    <NumeroNFe>${data.numero || ""}</NumeroNFe>
  </Detalhe>
</PedidoConsultaNFe>`;
}

function buildCancelamentoXml(data: NFSeCancelamentoData): string {
  const pedidoId = `CANC${data.numero}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<PedidoCancelamentoNFe xmlns="http://www.prefeitura.sp.gov.br/nfe" Id="${pedidoId}">
  <Cabecalho Versao="1">
    <CPFCNPJRemetente>
      <CNPJ>${formatCnpj(data.cnpjPrestador)}</CNPJ>
    </CPFCNPJRemetente>
    <transacao>true</transacao>
  </Cabecalho>
  <Detalhe>
    <ChaveNFe>
      <InscricaoPrestador>${escapeXml(data.inscricaoMunicipalPrestador)}</InscricaoPrestador>
      <NumeroNFe>${data.numero}</NumeroNFe>
      <CodigoVerificacao>${data.codigoCancelamento}</CodigoVerificacao>
    </ChaveNFe>
    <MotivoCancelamento>${escapeXml(data.motivoCancelamento)}</MotivoCancelamento>
  </Detalhe>
</PedidoCancelamentoNFe>`;
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
    const codigos = [...xml.matchAll(/<Codigo(?:\s[^>]*)?>([^<]*)<\/Codigo>/gi)].map(m => m[1]);
    const mensagens = [...xml.matchAll(/<Mensagem(?:\s[^>]*)?>([^<]*)<\/Mensagem>/gi)].map(m => m[1]);
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

  const numero = extractValue(infNfse, "NumeroNfse") || extractValue(infNfse, "NumeroNFe") || extractValue(infNfse, "Numero");
  const codigoVerificacao = extractValue(infNfse, "CodigoVerificacao");
  const dataEmissao = extractValue(infNfse, "DataEmissaoNfse") || extractValue(infNfse, "DataEmissaoNFe") || extractValue(infNfse, "DataEmissao");
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

  private async request(operacao: string, dadosXml: string): Promise<string> {
    const envelope = buildEnvelope(operacao, dadosXml, this.config.ambiente);
    const soapAction = `http://www.prefeitura.sp.gov.br/nfe/${operacao}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
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
      const xmlRetorno = await this.request("EnvioLoteRPS", xmlEnvio);
      return { ...parseNfseResponse(xmlRetorno), xmlEnvio, xmlRetorno };
    });
  }

  async consultar(data: NFSeConsultaData): Promise<NFSeResposta> {
    const xmlConsulta = buildConsultaXml(data);
    const xmlRetorno = await this.request("ConsultaNFe", xmlConsulta);
    return parseConsultaResponse(xmlRetorno);
  }

  async cancelar(
    data: NFSeCancelamentoData,
    certificado: CertificadoDigital
  ): Promise<NFSeCancelamentoResposta> {
    this.validarCertificado(certificado);
    const xmlCancelamento = buildCancelamentoXml(data);
    return this.withRetry(async () => {
      const xmlRetorno = await this.request("CancelamentoNFe", xmlCancelamento);
      return parseCancelamentoResponse(xmlRetorno);
    });
  }
}
