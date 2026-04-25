// ============================================
// NFS-e GINFES Client - Deno Runtime Module
// ABRASF 2.04 / GINFES São Paulo
// ============================================

// --- Types ---
export interface CertificadoDigital {
  pfxBase64: string;
  senha: string;
  cnpj: string;
  inscricaoMunicipal: string;
  razaoSocial: string;
  certPem: string;
  keyPem: string;
  validoAte: Date;
}

export interface DadosNota {
  identificacaoRps: { numero: string; serie: string; tipo: string };
  dataEmissao: string;
  competencia: string;
  naturezaOperacao: number;
  regimeTributario: number;
  optanteSimplesNacional: boolean;
  incentivoFiscal: boolean;
  emitente: {
    cnpj: string;
    inscricaoMunicipal: string;
    razaoSocial: string;
    endereco: { logradouro: string; numero: string; bairro: string; codigoMunicipio: string; uf: string; cep: string };
  };
  tomador: {
    tipoDocumento: string;
    cnpjCpf: string;
    razaoSocial: string;
    nomeFantasia?: string;
    email?: string;
    telefone?: string;
    endereco: { logradouro: string; numero: string; complemento: string; bairro: string; cidade: string; uf: string; cep: string };
  };
  servico: {
    descricao: string;
    codigo: string;
    cnae?: string;
    codigoTributacao?: string;
    discriminacao?: string;
    itemListaServico: string;
    valores: { valorServicos: number; valorDeducoes: number; valorPis: number; valorCofins: number; valorInss: number; valorIr: number; valorCsll: number; valorIss: number; valorLiquido: number };
    aliquotaIss: number;
    issRetido: boolean;
  };
}

export interface RespostaEmissao {
  sucesso: boolean;
  numeroNfse?: string;
  protocolo?: string;
  codigoVerificacao?: string;
  linkNfse?: string;
  xmlEnvio?: string;
  xmlRetorno?: string;
  linkPdf?: string;
  linkXml?: string;
  mensagens: Array<{ codigo: string; mensagem: string; tipo: string }>;
}

export interface RespostaCancelamento {
  sucesso: boolean;
  xmlEnvio?: string;
  xmlRetorno?: string;
  mensagens: Array<{ codigo: string; mensagem: string; tipo: string }>;
}

export interface RespostaConsulta {
  sucesso: boolean;
  status?: string;
  numeroNfse?: string;
  codigoVerificacao?: string;
  dataAutorizacao?: string;
  xmlRetorno?: string;
  mensagens: Array<{ codigo: string; mensagem: string; tipo: string }>;
}

// --- GINFES Config ---
const GINFES_CONFIG = {
  homologacao: {
    url: "https://homologacao.ginfes.com.br/ServiceGinfesImpl",
    soapActionBase: "http://www.ginfes.com.br",
  },
  producao: {
    url: "https://producao.ginfes.com.br/ServiceGinfesImpl",
    soapActionBase: "http://www.ginfes.com.br",
  },
};

const ABRASF_NAMESPACES = {
  tip: "http://www.ginfes.com.br/tipos_v03.xsd",
  cab: "http://www.ginfes.com.br/cabecalho_v03.xsd",
  servicoEnviar: "http://www.ginfes.com.br/servico_enviar_lote_rps_envio_v03.xsd",
  servicoCancelar: "http://www.ginfes.com.br/servico_cancelar_nfse_envio_v03.xsd",
  servicoConsultar: "http://www.ginfes.com.br/servico_consultar_nfse_rps_envio_v03.xsd",
};

function getAmbiente(): "homologacao" | "producao" {
  return (Deno.env.get("NFSE_AMBIENTE") || "homologacao") as "homologacao" | "producao";
}

// --- Certificate Loading ---
export async function carregarCertificado(pfxBase64: string, senha: string): Promise<CertificadoDigital> {
  const forge = await import("https://esm.sh/node-forge@1.3.1/dist/forge.js");
  const pfxDer = forge.util.decode64(pfxBase64);
  const p12Asn1 = forge.asn1.fromDer(pfxDer);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, senha);

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShorthandKeyBag });

  let certPem = "";
  let keyPem = "";
  let cnpj = "";
  let razaoSocial = "";
  let validoAte = new Date();

  if (certBags[forge.pki.oids.certBag]) {
    const cert = certBags[forge.pki.oids.certBag]![0];
    certPem = forge.pki.certificateToPem(cert.cert!);
    validoAte = cert.cert!.validity.notAfter;
    const subject = cert.cert!.subject;
    for (const attr of subject.attributes) {
      if (attr.shortName === "CN") razaoSocial = attr.value;
    }
    // Extract CNPJ from subject alternative name or OID
    const cnAttr = subject.attributes.find((a: any) =>
      a.oid === "2.16.840.1.113730.4.1" || a.oid === "0.9.2342.19200300.100.1.1" || a.shortName === "CN"
    );
    if (cnAttr) {
      const cnpjMatch = cnAttr.value.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
      if (cnpjMatch) cnpj = cnpjMatch[0].replace(/\D/g, "");
    }
  }

  if (keyBags[forge.pki.oids.pkcs8ShorthandKeyBag]) {
    const key = keyBags[forge.pki.oids.pkcs8ShorthandKeyBag]![0];
    keyPem = forge.pki.privateKeyToPem(key.key!);
  } else {
    // Try pkcs1 key bag
    const keyBags2 = p12.getBags({ bagType: forge.pki.oids.keyBag });
    if (keyBags2[forge.pki.oids.keyBag]) {
      const key = keyBags2[forge.pki.oids.keyBag]![0];
      keyPem = forge.pki.privateKeyToPem(key.key!);
    }
  }

  if (!certPem || !keyPem) {
    throw new Error("Não foi possível extrair certificado ou chave privada do arquivo PFX");
  }

  return {
    pfxBase64,
    senha,
    cnpj,
    inscricaoMunicipal: "",
    razaoSocial,
    certPem,
    keyPem,
    validoAte,
  };
}

// --- XML Builders ---

export function construirXmlRps(dados: DadosNota): string {
  const rpsId = `R${dados.emitente.cnpj}${dados.identificacaoRps.numero}`;
  const valorServicos = dados.servico.valores.valorServicos.toFixed(2);
  const valorIss = dados.servico.valores.valorIss.toFixed(2);
  const issRetido = dados.servico.issRetido ? "1" : "2";
  const optanteSimples = dados.optanteSimplesNacional ? "1" : "2";
  const incentivoFiscal = dados.incentivoFiscal ? "1" : "2";

  return `<InfRps Id="${rpsId}">
      <IdentificacaoRps>
        <Numero>${dados.identificacaoRps.numero}</Numero>
        <Serie>${dados.identificacaoRps.serie}</Serie>
        <Tipo>${dados.identificacaoRps.tipo}</Tipo>
      </IdentificacaoRps>
      <DataEmissao>${dados.dataEmissao}</DataEmissao>
      <NaturezaOperacao>${dados.naturezaOperacao}</NaturezaOperacao>
      <RegimeEspecialTributacao>${dados.regimeTributario}</RegimeEspecialTributacao>
      <OptanteSimplesNacional>${optanteSimples}</OptanteSimplesNacional>
      <IncentivadorCultural>${incentivoFiscal}</IncentivadorCultural>
      <Status>1</Status>
      <Servico>
        <Valores>
          <ValorServicos>${valorServicos}</ValorServicos>
          <ValorDeducoes>${dados.servico.valores.valorDeducoes.toFixed(2)}</ValorDeducoes>
          <ValorPis>${dados.servico.valores.valorPis.toFixed(2)}</ValorPis>
          <ValorCofins>${dados.servico.valores.valorCofins.toFixed(2)}</ValorCofins>
          <ValorInss>${dados.servico.valores.valorInss.toFixed(2)}</ValorInss>
          <ValorIr>${dados.servico.valores.valorIr.toFixed(2)}</ValorIr>
          <ValorCsll>${dados.servico.valores.valorCsll.toFixed(2)}</ValorCsll>
          <IssRetido>${issRetido}</IssRetido>
          <ValorIss>${valorIss}</ValorIss>
          <Aliquota>${dados.servico.aliquotaIss.toFixed(4)}</Aliquota>
          <ValorLiquido>${dados.servico.valores.valorLiquido.toFixed(2)}</ValorLiquido>
        </Valores>
        <ItemListaServico>${dados.servico.itemListaServico}</ItemListaServico>
        ${dados.servico.codigoCnae ? `<CodigoCnae>${dados.servico.codigoCnae}</CodigoCnae>` : ""}
        ${dados.servico.codigoTributacao ? `<CodigoTributacaoMunicipio>${dados.servico.codigoTributacao}</CodigoTributacaoMunicipio>` : ""}
        <Discriminacao>${escapeXml(dados.servico.descricao || dados.servico.discriminacao || "")}</Discriminacao>
        <CodigoMunicipio>${dados.emitente.endereco.codigoMunicipio}</CodigoMunicipio>
      </Servico>
      <Prestador>
        <Cnpj>${dados.emitente.cnpj}</Cnpj>
        <InscricaoMunicipal>${dados.emitente.inscricaoMunicipal}</InscricaoMunicipal>
      </Prestador>
      <Tomador>
        <IdentificacaoTomador>
          <CpfCnpj>
            <${dados.tomador.tipoDocumento === "CNPJ" ? "Cnpj" : "Cpf"}>${dados.tomador.cnpjCpf}</${dados.tomador.tipoDocumento === "CNPJ" ? "Cnpj" : "Cpf"}>
          </CpfCnpj>
          ${dados.tomador.tipoDocumento === "CNPJ" ? `<InscricaoMunicipal>${dados.tomador.inscricaoMunicipal || ""}</InscricaoMunicipal>` : ""}
        </IdentificacaoTomador>
        <RazaoSocial>${escapeXml(dados.tomador.razaoSocial)}</RazaoSocial>
        ${dados.tomador.endereco.logradouro ? `
        <Endereco>
          <Logradouro>${escapeXml(dados.tomador.endereco.logradouro)}</Logradouro>
          <Numero>${dados.tomador.endereco.numero}</Numero>
          ${dados.tomador.endereco.complemento ? `<Complemento>${escapeXml(dados.tomador.endereco.complemento)}</Complemento>` : ""}
          <Bairro>${escapeXml(dados.tomador.endereco.bairro)}</Bairro>
          <CodigoMunicipio>${dados.tomador.endereco.cidade ? "" : ""}</CodigoMunicipio>
          <Uf>${dados.tomador.endereco.uf}</Uf>
          <Cep>${dados.tomador.endereco.cep}</Cep>
        </Endereco>` : ""}
        ${dados.tomador.email ? `<Contato><Email>${dados.tomador.email}</Email>${dados.tomador.telefone ? `<Telefone>${dados.tomador.telefone}</Telefone>` : ""}</Contato>` : ""}
      </Tomador>
    </InfRps>`;
}

export function construirXmlLoteRps(dados: DadosNota, xmlRps: string, certificado: CertificadoDigital): string {
  const numeroLote = Date.now().toString();
  const loteId = `LOTE${numeroLote}`;

  return `<EnviarLoteRpsEnvio xmlns="${ABRASF_NAMESPACES.servicoEnviar}">
  <LoteRps Id="${loteId}">
    <NumeroLote>${numeroLote}</NumeroLote>
    <Cnpj>${dados.emitente.cnpj}</Cnpj>
    <InscricaoMunicipal>${dados.emitente.inscricaoMunicipal}</InscricaoMunicipal>
    <QuantidadeRps>1</QuantidadeRps>
    <ListaRps>
      <Rps>
        ${xmlRps}
      </Rps>
    </ListaRps>
  </LoteRps>
</EnviarLoteRpsEnvio>`;
}

export function construirXmlCancelamento(numeroNfse: string, cnpj: string, inscricaoMunicipal: string, codigoCancelamento: string): string {
  const pedidoId = `CANC${numeroNfse}`;
  return `<CancelarNfseEnvio xmlns="${ABRASF_NAMESPACES.servicoCancelar}">
  <Pedido Id="${pedidoId}">
    <InfPedidoCancelamento>
      <IdentificacaoNfse>
        <Numero>${numeroNfse}</Numero>
        <Cnpj>${cnpj}</Cnpj>
        <InscricaoMunicipal>${inscricaoMunicipal}</InscricaoMunicipal>
        <CodigoMunicipio>3550308</CodigoMunicipio>
      </IdentificacaoNfse>
      <CodigoCancelamento>${codigoCancelamento}</CodigoCancelamento>
    </InfPedidoCancelamento>
  </Pedido>
</CancelarNfseEnvio>`;
}

export function construirXmlConsultaRps(numeroRps: string, serie: string, tipo: string, cnpj: string, inscricaoMunicipal: string): string {
  return `<ConsultarNfseRpsEnvio xmlns="${ABRASF_NAMESPACES.servicoConsultar}">
  <IdentificacaoRps>
    <Numero>${numeroRps}</Numero>
    <Serie>${serie}</Serie>
    <Tipo>${tipo}</Tipo>
  </IdentificacaoRps>
  <Prestador>
    <Cnpj>${cnpj}</Cnpj>
    <InscricaoMunicipal>${inscricaoMunicipal}</InscricaoMunicipal>
  </Prestador>
</ConsultarNfseRpsEnvio>`;
}

// --- XML Signing ---
export function assinarXml(xml: string, certificado: CertificadoDigital, idReferencia: string): string {
  // Simplified XMLDSig signing using RSA-SHA1
  // In production, this should use a proper XMLDSig library
  const forge = (() => {
    try { return (globalThis as any).forge; } catch { return null; }
  })();

  if (!forge) {
    // If forge is not available (shouldn't happen in edge functions that imported it),
    // return the XML without signature (for homologation mode)
    console.warn("node-forge not available for XML signing");
    return xml;
  }

  try {
    const privateKey = forge.pki.privateKeyFromPem(certificado.keyPem);
    const certificate = forge.pki.certificateFromPem(certificado.certPem);

    // Canonicalize the referenced element (simplified C14N)
    const referencedXml = extractElementById(xml, idReferencia);
    if (!referencedXml) {
      console.warn(`Element with Id="${idReferencia}" not found, skipping signature`);
      return xml;
    }

    const canonReferenced = canonicalizeXml(referencedXml);
    const digest = forge.md.sha1.create();
    digest.update(canonReferenced);
    const digestBase64 = forge.util.encode64(digest.digest().bytes());

    // Sign the SignedInfo element
    const signedInfoXml = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
      <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
      <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
      <Reference URI="#${idReferencia}">
        <Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/></Transforms>
        <DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
        <DigestValue>${digestBase64}</DigestValue>
      </Reference>
    </SignedInfo>`;

    const canonSignedInfo = canonicalizeXml(signedInfoXml);
    const signatureMd = forge.md.sha1.create();
    signatureMd.update(canonSignedInfo);
    const signatureBytes = privateKey.sign(signatureMd);
    const signatureBase64 = forge.util.encode64(signatureBytes);

    const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(certificate)).getBytes();
    const certBase64 = forge.util.encode64(certDer);

    const signatureBlock = `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
      <SignedInfo>
        <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
        <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
        <Reference URI="#${idReferencia}">
          <Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/></Transforms>
          <DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
          <DigestValue>${digestBase64}</DigestValue>
        </Reference>
      </SignedInfo>
      <SignatureValue>${signatureBase64}</SignatureValue>
      <KeyInfo>
        <X509Data>
          <X509Certificate>${certBase64}</X509Certificate>
        </X509Data>
      </KeyInfo>
    </Signature>`;

    // Insert signature after the referenced element
    return xml.replace(
      `</${getElementName(xml, idReferencia)}>`,
      `${signatureBlock}</${getElementName(xml, idReferencia)}>`
    );
  } catch (error) {
    console.error("Error signing XML:", error);
    return xml;
  }
}

// --- SOAP Envelope ---
export function criarEnvelopeSOAP(soapAction: string, xmlBody: string, cnpj: string, inscricaoMunicipal: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"
                  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap12:Header>
    <ns2:cabecalho xmlns:ns2="http://www.ginfes.com.br/cabecalho_v03.xsd" versao="3">
      <versaoDados>4</versaoDados>
    </ns2:cabecalho>
  </soap12:Header>
  <soap12:Body>
    ${xmlBody}
  </soap12:Body>
</soap12:Envelope>`;
}

// --- SOAP Client ---
export async function enviarRequisicaoSOAP(xmlBody: string): Promise<string> {
  const config = GINFES_CONFIG[getAmbiente()];
  const envelope = criarEnvelopeSOAP("", xmlBody, "", "");

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/soap+xml; charset=utf-8",
      "SOAPAction": "",
    },
    body: envelope,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro HTTP ${response.status}: ${text.substring(0, 500)}`);
  }

  return await response.text();
}

// --- Response Parsers ---

export function parsearRespostaEmissao(xml: string): RespostaEmissao {
  try {
    const numeroMatch = xml.match(/<NumeroNfse>([^<]+)<\/NumeroNfse>/);
    const codigoVerificacaoMatch = xml.match(/<CodigoVerificacao>([^<]+)<\/CodigoVerificacao>/);
    const dataEmissaoMatch = xml.match(/<DataEmissaoNfse>([^<]+)<\/DataEmissaoNfse>/);
    const protocoloMatch = xml.match(/<Protocolo>([^<]+)<\/Protocolo>/) || xml.match(/<NumeroProtocolo>([^<]+)<\/NumeroProtocolo>/);
    const mensagensErro = parsearErros(xml);

    if (mensagensErro.length > 0 && !numeroMatch) {
      return {
        sucesso: false,
        xmlRetorno: xml,
        mensagens: mensagensErro,
      };
    }

    return {
      sucesso: true,
      numeroNfse: numeroMatch?.[1],
      protocolo: protocoloMatch?.[1],
      codigoVerificacao: codigoVerificacaoMatch?.[1],
      linkNfse: numeroMatch?.[1] ? `https://${getAmbiente() === "homologacao" ? "homologacao" : "producao"}.ginfes.com.br/visualizar/${numeroMatch[1]}` : undefined,
      xmlRetorno: xml,
      mensagens: [{ codigo: "0000", mensagem: "Nota fiscal emitida com sucesso", tipo: "Sucesso" }],
    };
  } catch (error) {
    return {
      sucesso: false,
      xmlRetorno: xml,
      mensagens: [{ codigo: "ERR_PARSE", mensagem: `Erro ao processar resposta: ${(error as Error).message}`, tipo: "Erro" }],
    };
  }
}

export function parsearRespostaCancelamento(xml: string): RespostaCancelamento {
  try {
    const sucessoMatch = xml.match(/<Sucesso>true<\/Sucesso>/i);
    const mensagensErro = parsearErros(xml);

    if (sucessoMatch || mensagensErro.length === 0) {
      return {
        sucesso: true,
        xmlRetorno: xml,
        mensagens: [{ codigo: "0000", mensagem: "Cancelamento realizado com sucesso", tipo: "Sucesso" }],
      };
    }

    return {
      sucesso: false,
      xmlRetorno: xml,
      mensagens: mensagensErro.length > 0 ? mensagensErro : [{ codigo: "ERR_CANCEL", mensagem: "Erro desconhecido no cancelamento", tipo: "Erro" }],
    };
  } catch (error) {
    return {
      sucesso: false,
      xmlRetorno: xml,
      mensagens: [{ codigo: "ERR_PARSE", mensagem: `Erro ao processar resposta: ${(error as Error).message}`, tipo: "Erro" }],
    };
  }
}

export function parsearRespostaConsulta(xml: string): RespostaConsulta {
  try {
    const statusMatch = xml.match(/<SituacaoNfse>([^<]+)<\/SituacaoNfse>/) || xml.match(/<StatusNfse>([^<]+)<\/StatusNfse>/);
    const numeroMatch = xml.match(/<NumeroNfse>([^<]+)<\/NumeroNfse>/);
    const codigoVerificacaoMatch = xml.match(/<CodigoVerificacao>([^<]+)<\/CodigoVerificacao>/);
    const dataAutorizacaoMatch = xml.match(/<DataEmissaoNfse>([^<]+)<\/DataEmissaoNfse>/);
    const mensagensErro = parsearErros(xml);

    if (mensagensErro.length > 0 && !numeroMatch) {
      return {
        sucesso: false,
        xmlRetorno: xml,
        mensagens: mensagensErro,
      };
    }

    const statusMap: Record<string, string> = {
      "1": "autorizada",
      "2": "cancelada",
      "3": "substituida",
      "4": "rejeitada",
    };

    return {
      sucesso: true,
      status: statusMap[statusMatch?.[1] || ""] || statusMatch?.[1] || "desconhecido",
      numeroNfse: numeroMatch?.[1],
      codigoVerificacao: codigoVerificacaoMatch?.[1],
      dataAutorizacao: dataAutorizacaoMatch?.[1],
      xmlRetorno: xml,
      mensagens: [{ codigo: "0000", mensagem: "Consulta realizada com sucesso", tipo: "Sucesso" }],
    };
  } catch (error) {
    return {
      sucesso: false,
      xmlRetorno: xml,
      mensagens: [{ codigo: "ERR_PARSE", mensagem: `Erro ao processar resposta: ${(error as Error).message}`, tipo: "Erro" }],
    };
  }
}

// --- Error Translation ---
const ERROS_GINFES: Record<string, string> = {
  E1: "CNPJ do prestador inválido",
  E2: "Inscrição Municipal do prestador inválida",
  E3: "RPS já informado",
  E4: "Número do RPS inválido",
  E5: "Data de emissão posterior à data atual",
  E6: "CNPJ do tomador inválido",
  E7: "CPF do tomador inválido",
  E8: "Item da lista de serviços inválido",
  E9: "Código CNAE inválido",
  E10: "Código de tributação inválido",
  E11: "Alíquota do ISS inválida",
  E12: "Valor do ISS retido inválido",
  E13: "Valor dos serviços inválido",
  E14: "Valor das deduções inválido",
  E15: "Código do município inválido",
  E16: "Competência inválida",
  E17: "Natureza da operação inválida",
  E18: "Regime especial de tributação inválido",
  E19: "Optante pelo Simples Nacional inválido",
  E20: "Incentivador cultural inválido",
  E21: "Status do RPS inválido",
  E22: "Número do lote inválido",
  E23: "Quantidade de RPS excedeu o limite",
  E24: "Lote não encontrado",
  E25: "RPS não encontrado",
  E26: "NFS-e não encontrada",
  E27: "Cancelamento não permitido",
  E28: "Certificado digital inválido",
  E29: "Assinatura digital inválida",
  E30: "Arquivo XML mal formatado",
  E31: "Acesso negado",
  E32: "Prazo de cancelamento excedido",
  E40: "Erro de autenticação",
  E50: "Erro interno do servidor",
  E51: "Erro temporário - tente novamente",
  E52: "Serviço indisponível",
  E60: "Requisição mal formada",
};

export function traduzirErroGinfes(codigo: string): string {
  return ERROS_GINFES[codigo] || `Erro GINFES: ${codigo}`;
}

// --- Helper Functions ---

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function canonicalizeXml(xml: string): string {
  return xml
    .replace(/>\s+</g, "><")
    .replace(/\s+xmlns[^"]*"[^"]*"/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractElementById(xml: string, id: string): string | null {
  const regex = new RegExp(`(<\\w+[^>]*Id="${id}"[^>]*>[\\s\\S]*?<\\/\\w+>)`, "i");
  const match = xml.match(regex);
  return match ? match[1] : null;
}

function getElementName(xml: string, id: string): string {
  const regex = new RegExp(`<(\\w+)[^>]*Id="${id}"`, "i");
  const match = xml.match(regex);
  return match ? match[1] : "InfRps";
}

function parsearErros(xml: string): Array<{ codigo: string; mensagem: string; tipo: string }> {
  const erros: Array<{ codigo: string; mensagem: string; tipo: string }> = [];

  // Try ListaMensagemAlertaRetorno / ListaMensagemErro
  const mensagemRegex = /<Mensagem[^>]*>([^<]+)<\/Mensagem>/gi;
  const codigoRegex = /<Codigo[^>]*>([^<]+)<\/Codigo>/gi;
  const correcaoRegex = /<Correcao[^>]*>([^<]+)<\/Correcao>/gi;

  const mensagens = [...xml.matchAll(mensagemRegex)].map(m => m[1]);
  const codigos = [...xml.matchAll(codigoRegex)].map(m => m[1]);
  const correcoes = [...xml.matchAll(correcaoRegex)].map(m => m[1]);

  for (let i = 0; i < Math.max(mensagens.length, codigos.length); i++) {
    erros.push({
      codigo: codigos[i] || "ERR_UNKNOWN",
      mensagem: traduzirErroGinfes(codigos[i] || "") || mensagens[i] || "Erro desconhecido",
      tipo: "Erro",
    });
  }

  // Check for Fault
  const faultMatch = xml.match(/<faultstring>([^<]+)<\/faultstring>/i);
  if (faultMatch && erros.length === 0) {
    erros.push({ codigo: "SOAP_FAULT", mensagem: faultMatch[1], tipo: "Erro" });
  }

  return erros;
}