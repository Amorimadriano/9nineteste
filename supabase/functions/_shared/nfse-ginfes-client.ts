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
    inscricaoMunicipal?: string;
    endereco: { logradouro: string; numero: string; complemento: string; bairro: string; cidade: string; uf: string; cep: string };
  };
  servico: {
    descricao: string;
    codigo: string;
    codigoCnae?: string;
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
  dataEmissao?: string;
  valorServicos?: string;
  valorIss?: string;
  baseCalculo?: string;
  aliquotaIss?: string;
  issRetido?: boolean;
  tomador?: { razaoSocial: string; cnpjCpf: string };
  prestador?: { cnpj: string; inscricaoMunicipal: string };
  linkPdf?: string;
  linkXml?: string;
  linkNfse?: string;
  discriminacao?: string;
  itemListaServico?: string;
  xmlRetorno?: string;
  xmlEnvio?: string;
  xmlBruto?: string;
  mensagens: Array<{ codigo: string; mensagem: string; tipo: string }>;
}

// --- CORS ---
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://9ninebusinesscontrol.com.br",
  "https://www.9ninebusinesscontrol.com.br",
  "https://9nineteste.9ninebusinesscontrol.com.br",
  "https://ninebpofinanceiro.lovable.app",
  "https://ninebpofinanceiro.vercel.app",
];

export function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// --- GINFES Config ---
const GINFES_CONFIG = {
  homologacao: {
    url: "https://homologacao.ginfes.com.br/ServiceGinfesImpl",
    soapActionBase: "http://homologacao.ginfes.com.br",
  },
  producao: {
    url: "https://producao.ginfes.com.br/ServiceGinfesImpl",
    soapActionBase: "http://producao.ginfes.com.br",
  },
};

const ABRASF_NAMESPACES = {
  tip: "http://www.ginfes.com.br/tipos_v03.xsd",
  cab: "http://www.ginfes.com.br/cabecalho_v03.xsd",
  servicoEnviar: "http://www.ginfes.com.br/servico_enviar_lote_rps_envio_v03.xsd",
  servicoCancelar: "http://www.ginfes.com.br/servico_cancelar_nfse_envio_v03.xsd",
  servicoConsultar: "http://www.ginfes.com.br/servico_consultar_nfse_rps_envio_v03.xsd",
};

export function getAmbiente(): "homologacao" | "producao" {
  return (Deno.env.get("NFSE_AMBIENTE") || "homologacao") as "homologacao" | "producao";
}

// --- node-forge Cache (CRITICAL PERFORMANCE FIX) ---
let forgeCache: any = null;

export async function getForge() {
  if (forgeCache) return forgeCache;
  const forgeModule = await import("https://esm.sh/node-forge@1.3.1");
  forgeCache = forgeModule.default?.util ? forgeModule.default
    : forgeModule.util ? forgeModule
    : (forgeModule as any).default?.default?.util ? (forgeModule as any).default.default
    : forgeModule;
  (globalThis as any).forge = forgeCache;
  return forgeCache;
}

// --- Certificate Loading (SAFE CNPJ EXTRACTION) ---
export async function carregarCertificado(pfxBase64: string, senha: string): Promise<CertificadoDigital> {
  const forge = await getForge();

  const pfxDer = forge.util.decode64(pfxBase64);
  const p12Asn1 = forge.asn1.fromDer(pfxDer);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, senha);

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });

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

    // ICP-Brasil: CNPJ está no OID 2.16.76.4.3.3 (pessoa jurídica)
    const icpCnpjAttr = subject.attributes.find((a: any) => a.oid === "2.16.76.4.3.3");
    if (icpCnpjAttr) {
      const digits = icpCnpjAttr.value.replace(/\D/g, "");
      if (digits.length >= 14) {
        cnpj = digits.substring(digits.length - 14);
      }
    }

    // Fallback controlado: OU com "CNPJ"
    if (!cnpj) {
      const ouAttr = subject.attributes.find((a: any) =>
        a.oid === "2.5.4.11" && /CNPJ/i.test(a.value)
      );
      if (ouAttr) {
        const cnpjMatch = ouAttr.value.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
        if (cnpjMatch) cnpj = cnpjMatch[0].replace(/\D/g, "");
      }
    }

    // Último fallback: CN com padrão CNPJ
    if (!cnpj) {
      const cnAttr = subject.attributes.find((a: any) => a.shortName === "CN");
      if (cnAttr) {
        const cnpjMatch = cnAttr.value.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
        if (cnpjMatch) cnpj = cnpjMatch[0].replace(/\D/g, "");
      }
    }
  }

  // Extrair chave privada (tenta pkcs8ShroudedKeyBag primeiro)
  const keyBagsShrouded = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  if (keyBagsShrouded[forge.pki.oids.pkcs8ShroudedKeyBag] && keyBagsShrouded[forge.pki.oids.pkcs8ShroudedKeyBag]!.length > 0) {
    const key = keyBagsShrouded[forge.pki.oids.pkcs8ShroudedKeyBag]![0];
    keyPem = forge.pki.privateKeyToPem(key.key!);
  } else {
    const keyBagsShorthand = p12.getBags({ bagType: forge.pki.oids.pkcs8ShorthandKeyBag });
    if (keyBagsShorthand[forge.pki.oids.pkcs8ShorthandKeyBag] && keyBagsShorthand[forge.pki.oids.pkcs8ShorthandKeyBag]!.length > 0) {
      const key = keyBagsShorthand[forge.pki.oids.pkcs8ShorthandKeyBag]![0];
      keyPem = forge.pki.privateKeyToPem(key.key!);
    } else {
      const keyBagsPlain = p12.getBags({ bagType: forge.pki.oids.keyBag });
      if (keyBagsPlain[forge.pki.oids.keyBag] && keyBagsPlain[forge.pki.oids.keyBag]!.length > 0) {
        const key = keyBagsPlain[forge.pki.oids.keyBag]![0];
        keyPem = forge.pki.privateKeyToPem(key.key!);
      }
    }
  }

  if (!certPem || !keyPem) {
    throw new Error("Nao foi possivel extrair certificado ou chave privada do arquivo PFX");
  }

  return { pfxBase64, senha, cnpj, inscricaoMunicipal: "", razaoSocial, certPem, keyPem, validoAte };
}

// --- Canonicalization (C14N) ---
export function canonicalizeXml(xml: string): string {
  let result = xml;
  result = result.replace(/<\?xml[^?]*\?>\s*/g, "");
  result = result.replace(/<\?[^?]*\?>\s*/g, "");
  result = result.replace(/<(\w+)([^>]*)\/>/g, (_match: string, tagName: string, attrs: string) => {
    if (attrs.trim()) {
      return `<${tagName}${attrs}></${tagName}>`;
    }
    return `<${tagName}></${tagName}>`;
  });
  result = result.replace(/>\s+</g, "><");
  result = result.replace(/\s+=\s+/g, "=");
  result = result.replace(/\n\s+/g, "\n");
  result = result.trim();
  return result;
}

// --- XML Element Extraction ---
export function extractElementById(xml: string, id: string): string | null {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const openRegex = new RegExp(`<([\\w]+)([^>]*?)Id="${escapedId}"([^>]*?)>`, "i");
  const openMatch = xml.match(openRegex);
  if (!openMatch) return null;

  const tagName = openMatch[1];
  const fullOpenMatch = openMatch[0];
  const startIndex = xml.indexOf(fullOpenMatch);
  if (startIndex === -1) return null;

  let depth = 0;
  let pos = startIndex;

  while (pos < xml.length) {
    const nextOpen = xml.indexOf(`<${tagName}`, pos + 1);
    const nextClose = xml.indexOf(`</${tagName}>`, pos + 1);

    if (nextClose === -1) break;

    depth++;
    if (nextOpen === -1 || nextOpen > nextClose) {
      return xml.substring(startIndex, nextClose + `</${tagName}>`.length);
    }

    let searchPos = nextClose + `</${tagName}>`.length;
    while (depth > 0 && searchPos < xml.length) {
      const innerOpen = xml.indexOf(`<${tagName}`, searchPos);
      const innerClose = xml.indexOf(`</${tagName}>`, searchPos);
      if (innerClose === -1) break;
      if (innerOpen !== -1 && innerOpen < innerClose) {
        depth++;
      } else {
        depth--;
      }
      if (depth === 0) {
        searchPos = innerClose + `</${tagName}>`.length;
        break;
      }
      searchPos = innerClose + `</${tagName}>`.length;
    }
    return xml.substring(startIndex, searchPos);
  }

  return null;
}

export function getElementName(xml: string, id: string): string {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`<(\\w+)[^>]*Id="${escapedId}"`, "i");
  const match = xml.match(regex);
  return match ? match[1] : "InfRps";
}

// --- XML Builders ---
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function formatarDataNfse(data: string | Date): string {
  const d = typeof data === "string" ? new Date(data) : data;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function construirXmlRps(dados: DadosNota): string {
  const rpsId = `R${dados.emitente.cnpj}${dados.identificacaoRps.numero}`;
  const valorServicos = dados.servico.valores.valorServicos.toFixed(2);
  const valorIss = dados.servico.valores.valorIss.toFixed(2);
  const issRetido = dados.servico.issRetido ? "1" : "2";
  const optanteSimples = dados.optanteSimplesNacional ? "1" : "2";
  const incentivoFiscal = dados.incentivoFiscal ? "1" : "2";
  const cnae = dados.servico.codigoCnae || dados.servico.cnae;
  const baseCalculo = (dados.servico.valores.valorServicos - dados.servico.valores.valorDeducoes).toFixed(2);
  const dataEmissaoFormatada = formatarDataNfse(dados.dataEmissao);
  const tomadorCodigoMunicipio = dados.tomador.endereco.cidade || dados.emitente.endereco.codigoMunicipio;

  return `<InfRps Id="${rpsId}">
      <IdentificacaoRps>
        <Numero>${dados.identificacaoRps.numero}</Numero>
        <Serie>${dados.identificacaoRps.serie}</Serie>
        <Tipo>${dados.identificacaoRps.tipo}</Tipo>
      </IdentificacaoRps>
      <DataEmissao>${dataEmissaoFormatada}</DataEmissao>
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
          <BaseCalculo>${baseCalculo}</BaseCalculo>
          <Aliquota>${dados.servico.aliquotaIss.toFixed(4)}</Aliquota>
          <ValorLiquido>${dados.servico.valores.valorLiquido.toFixed(2)}</ValorLiquido>
        </Valores>
        <ItemListaServico>${dados.servico.itemListaServico}</ItemListaServico>
        ${cnae ? `<CodigoCnae>${cnae}</CodigoCnae>` : ""}
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
          ${dados.tomador.tipoDocumento === "CNPJ" && dados.tomador.inscricaoMunicipal ? `<InscricaoMunicipal>${dados.tomador.inscricaoMunicipal}</InscricaoMunicipal>` : ""}
        </IdentificacaoTomador>
        <RazaoSocial>${escapeXml(dados.tomador.razaoSocial)}</RazaoSocial>
        ${dados.tomador.endereco.logradouro ? `
        <Endereco>
          <Logradouro>${escapeXml(dados.tomador.endereco.logradouro)}</Logradouro>
          <Numero>${dados.tomador.endereco.numero}</Numero>
          ${dados.tomador.endereco.complemento ? `<Complemento>${escapeXml(dados.tomador.endereco.complemento)}</Complemento>` : ""}
          <Bairro>${escapeXml(dados.tomador.endereco.bairro)}</Bairro>
          <CodigoMunicipio>${tomadorCodigoMunicipio}</CodigoMunicipio>
          <Uf>${dados.tomador.endereco.uf}</Uf>
          <Cep>${dados.tomador.endereco.cep}</Cep>
        </Endereco>` : ""}
        ${dados.tomador.email ? `<Contato><Email>${dados.tomador.email}</Email>${dados.tomador.telefone ? `<Telefone>${dados.tomador.telefone}</Telefone>` : ""}</Contato>` : ""}
      </Tomador>
    </InfRps>`;
}

export function construirXmlLoteRps(dados: DadosNota, xmlRps: string): { xml: string; loteId: string } {
  const numeroLote = Date.now().toString();
  const loteId = `LOTE${numeroLote}`;
  const xml = `<EnviarLoteRpsEnvio xmlns="${ABRASF_NAMESPACES.servicoEnviar}">
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
  return { xml, loteId };
}

export function construirXmlConsultaRps(numeroRps: string, serie: string, tipo: string, cnpj: string, inscricaoMunicipal: string): string {
  const tipoCodigo = tipo === "RPS" || tipo === "1" ? "1" : tipo === "RPS-M" || tipo === "2" ? "2" : tipo === "Cupom" || tipo === "3" ? "3" : "1";
  return `<ConsultarNfseRpsEnvio>
  <IdentificacaoRps>
    <Numero>${numeroRps}</Numero>
    <Serie>${serie}</Serie>
    <Tipo>${tipoCodigo}</Tipo>
  </IdentificacaoRps>
  <Prestador>
    <Cnpj>${cnpj}</Cnpj>
    <InscricaoMunicipal>${inscricaoMunicipal}</InscricaoMunicipal>
  </Prestador>
</ConsultarNfseRpsEnvio>`;
}

// --- XML Signing ---
export function assinarXml(xml: string, certificado: CertificadoDigital, idReferencia: string): string {
  const forge = (globalThis as any).forge;
  if (!forge) {
    throw new Error("node-forge nao esta disponivel para assinatura XML.");
  }
  try {
    const privateKey = forge.pki.privateKeyFromPem(certificado.keyPem);
    const certificate = forge.pki.certificateFromPem(certificado.certPem);
    const referencedXml = extractElementById(xml, idReferencia);
    if (!referencedXml) {
      throw new Error(`Elemento com Id="${idReferencia}" nao encontrado no XML para assinatura`);
    }
    const canonReferenced = canonicalizeXml(referencedXml);
    const digest = forge.md.sha1.create();
    digest.update(canonReferenced, "utf8");
    const digestBase64 = forge.util.encode64(digest.digest().bytes());

    const signedInfoXml = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#"><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></CanonicalizationMethod><SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"></SignatureMethod><Reference URI="#${idReferencia}"><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform></Transforms><DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"></DigestMethod><DigestValue>${digestBase64}</DigestValue></Reference></SignedInfo>`;

    const canonSignedInfo = canonicalizeXml(signedInfoXml);
    const signatureMd = forge.md.sha1.create();
    signatureMd.update(canonSignedInfo, "utf8");
    const signatureBytes = privateKey.sign(signatureMd);
    const signatureBase64 = forge.util.encode64(signatureBytes);
    const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(certificate)).getBytes();
    const certBase64 = forge.util.encode64(certDer);

    const signatureBlock = `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><SignedInfo><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></CanonicalizationMethod><SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"></SignatureMethod><Reference URI="#${idReferencia}"><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform></Transforms><DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"></DigestMethod><DigestValue>${digestBase64}</DigestValue></Reference></SignedInfo><SignatureValue>${signatureBase64}</SignatureValue><KeyInfo><X509Data><X509Certificate>${certBase64}</X509Certificate></X509Data></KeyInfo></Signature>`;

    const elementName = getElementName(xml, idReferencia);
    const closingTag = `</${elementName}>`;
    const insertionPoint = xml.lastIndexOf(closingTag);
    if (insertionPoint === -1) {
      throw new Error(`Tag de fechamento </${elementName}> nao encontrada`);
    }

    return xml.substring(0, insertionPoint) + signatureBlock + xml.substring(insertionPoint);
  } catch (error) {
    throw new Error(`Erro na assinatura digital: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function assinarLoteCompleto(xmlLote: string, certificado: CertificadoDigital): string {
  let xml = xmlLote;

  const infRpsRegex = /Id="(R[^"]+)"/g;
  let match;
  while ((match = infRpsRegex.exec(xml)) !== null) {
    const rpsId = match[1];
    xml = assinarXml(xml, certificado, rpsId);
  }

  const loteMatch = xml.match(/Id="(LOTE[^"]+)"/);
  if (loteMatch) {
    xml = assinarXml(xml, certificado, loteMatch[1]);
  }

  return xml;
}

// --- SOAP Envelopes ---
export function criarEnvelopeSOAPGinfes(soapAction: string, cabecalhoXml: string, dadosXml: string, ambiente?: string): string {
  const ginfesNs = ambiente === "producao"
    ? "http://producao.ginfes.com.br"
    : "http://homologacao.ginfes.com.br";

  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <${soapAction} xmlns="${ginfesNs}">
      <arg0 xmlns=""><![CDATA[${cabecalhoXml}]]></arg0>
      <arg1 xmlns=""><![CDATA[${dadosXml}]]></arg1>
    </${soapAction}>
  </soap:Body>
</soap:Envelope>`;
}

export function criarCabecalhoGinfes(): string {
  return `<cabecalho xmlns="http://www.ginfes.com.br/cabecalho_v03.xsd" versao="3"><versaoDados>3</versaoDados></cabecalho>`;
}

// --- SOAP Client ---
export async function enviarRequisicaoSOAP(
  soapEnvelope: string,
  certificado?: { certPem: string; keyPem: string },
): Promise<string> {
  const env = getAmbiente();

  if (env === "homologacao") {
    const response = await fetch(GINFES_CONFIG[env].url, {
      method: "POST",
      headers: { "Content-Type": "text/xml; charset=utf-8", "SOAPAction": "" },
      body: soapEnvelope,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro HTTP ${response.status}: ${text.substring(0, 500)}`);
    }
    return await response.text();
  }

  if (!certificado) {
    throw new Error("Certificado digital e obrigatorio para requisicao em producao.");
  }

  const proxyUrl = Deno.env.get("MTLS_PROXY_URL");
  const proxyApiKey = Deno.env.get("MTLS_PROXY_API_KEY") || "";

  if (!proxyUrl) {
    throw new Error(
      "Variavel MTLS_PROXY_URL nao configurada. " +
      "A requisicao em producao requer um proxy mTLS."
    );
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (proxyApiKey) headers["X-API-Key"] = proxyApiKey;

  const proxyResponse = await fetch(`${proxyUrl}/proxy-ginfes`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      soapEnvelope,
      certPem: certificado.certPem,
      keyPem: certificado.keyPem,
      ambiente: env,
    }),
  });

  if (!proxyResponse.ok) {
    const text = await proxyResponse.text();
    throw new Error(`Erro proxy mTLS (${proxyResponse.status}): ${text.substring(0, 500)}`);
  }

  return await proxyResponse.text();
}

// --- Response Parsers ---
const ERROS_GINFES: Record<string, string> = {
  E1: "CNPJ do prestador invalido", E2: "Inscricao Municipal do prestador invalida",
  E3: "RPS ja informado", E4: "Numero do RPS invalido", E5: "Data de emissao posterior a data atual",
  E6: "CNPJ do tomador invalido", E7: "CPF do tomador invalido",
  E8: "Item da lista de servicos invalido", E9: "Codigo CNAE invalido",
  E10: "Codigo de tributacao invalido", E11: "Aliquota do ISS invalida",
  E28: "Certificado digital invalido", E29: "Assinatura digital invalida",
  E30: "Arquivo XML mal formatado", E31: "Acesso negado", E32: "Prazo de cancelamento excedido",
  E50: "Erro interno do servidor", E60: "Requisicao mal formada",
};

export function parsearErros(xml: string): Array<{ codigo: string; mensagem: string; tipo: string }> {
  const erros: Array<{ codigo: string; mensagem: string; tipo: string }> = [];
  const mensagens = [...xml.matchAll(/<Mensagem[^>]*>([^<]+)<\/Mensagem>/gi)].map(m => m[1]);
  const codigos = [...xml.matchAll(/<Codigo[^>]*>([^<]+)<\/Codigo>/gi)].map(m => m[1]);
  for (let i = 0; i < Math.max(mensagens.length, codigos.length); i++) {
    erros.push({
      codigo: codigos[i] || "ERR_UNKNOWN",
      mensagem: ERROS_GINFES[codigos[i] || ""] || mensagens[i] || "Erro desconhecido",
      tipo: "Erro",
    });
  }
  const faultMatch = xml.match(/<faultstring>([^<]+)<\/faultstring>/i);
  if (faultMatch && erros.length === 0) erros.push({ codigo: "SOAP_FAULT", mensagem: faultMatch[1], tipo: "Erro" });
  return erros;
}

export function parsearRespostaEmissao(xml: string): RespostaEmissao {
  try {
    const numeroMatch = xml.match(/<NumeroNfse>([^<]+)<\/NumeroNfse>/);
    const codigoVerificacaoMatch = xml.match(/<CodigoVerificacao>([^<]+)<\/CodigoVerificacao>/);
    const protocoloMatch = xml.match(/<Protocolo>([^<]+)<\/Protocolo>/) || xml.match(/<NumeroProtocolo>([^<]+)<\/NumeroProtocolo>/);
    const mensagensErro = parsearErros(xml);
    if (mensagensErro.length > 0 && !numeroMatch) {
      return { sucesso: false, xmlRetorno: xml, mensagens: mensagensErro };
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
    return { sucesso: false, xmlRetorno: xml, mensagens: [{ codigo: "ERR_PARSE", mensagem: `Erro ao processar resposta: ${(error as Error).message}`, tipo: "Erro" }] };
  }
}

export function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

export function parsearRespostaConsulta(xml: string): RespostaConsulta {
  try {
    let workXml = xml;
    let returnContent: string | null = null;

    // Pattern 1: CDATA in <return>
    const cdataMatch = xml.match(/<return[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/return>/i);
    if (cdataMatch) returnContent = cdataMatch[1];

    // Pattern 2: HTML-escaped
    if (!returnContent) {
      const escapedMatch = xml.match(/<return[^>]*>([\s\S]*?)<\/return>/i);
      if (escapedMatch) {
        let content = escapedMatch[1].trim();
        content = decodeHtmlEntities(content);
        if (content.length > 10) returnContent = content;
      }
    }

    // Pattern 3: Any CDATA
    if (!returnContent) {
      const anyCdata = xml.match(/<!\[CDATA\[([\s\S]*?)\]\]>/i);
      if (anyCdata) returnContent = anyCdata[1];
    }

    if (returnContent && returnContent.length > 10) {
      workXml = returnContent;
    }

    // Strip namespaces
    const cleanXml = workXml.replace(/<\/?[a-zA-Z0-9_]+:/g, (match) => {
      return match.startsWith("</") ? "</" : "<";
    });

    const erros = parsearErros(cleanXml);
    if (erros.length > 0 && !cleanXml.includes("<CompNfse") && !cleanXml.includes("<InfNfse") && !cleanXml.includes("<Numero")) {
      return { sucesso: false, xmlRetorno: xml, mensagens: erros };
    }

    const infNfseMatch = cleanXml.match(/<InfNfse[^>]*>([\s\S]*?)<\/InfNfse>/i);
    const infNfse = infNfseMatch ? infNfseMatch[1] : cleanXml;

    // NumeroNfse first, fallback to first <Numero> before IdentificacaoRps
    const numeroNfseMatch = infNfse.match(/<NumeroNfse>([^<]+)<\/NumeroNfse>/i);
    let numeroNfse: string | undefined;
    if (numeroNfseMatch) {
      numeroNfse = numeroNfseMatch[1];
    } else {
      const beforeRps = infNfse.split(/<IdentificacaoRps/i)[0];
      const numeroMatch = beforeRps.match(/<Numero>([^<]+)<\/Numero>/i);
      numeroNfse = numeroMatch?.[1];
    }

    const codigoVerificacaoMatch = infNfse.match(/<CodigoVerificacao>([^<]+)<\/CodigoVerificacao>/i);
    const dataEmissaoMatch = infNfse.match(/<DataEmissaoNfse>([^<]+)<\/DataEmissaoNfse>/i) || infNfse.match(/<DataEmissao>([^<]+)<\/DataEmissao>/i);
    const dataAutorizacaoMatch = infNfse.match(/<DataAutorizacao>([^<]+)<\/DataAutorizacao>/i) || infNfse.match(/<DataEmissaoNfse>([^<]+)<\/DataEmissaoNfse>/i);
    const situacaoMatch = infNfse.match(/<SituacaoNfse>([^<]+)<\/SituacaoNfse>/i) || infNfse.match(/<Situacao>([^<]+)<\/Situacao>/i);
    const situacao = situacaoMatch?.[1];
    let status: string;
    if (situacao === "2") status = "cancelada";
    else if (situacao === "3") status = "substituida";
    else status = "autorizada";

    const valorServicosMatch = infNfse.match(/<ValorServicos>([^<]+)<\/ValorServicos>/i);
    const valorIssMatch = infNfse.match(/<ValorIss>([^<]+)<\/ValorIss>/i);
    const baseCalculoMatch = infNfse.match(/<BaseCalculo>([^<]+)<\/BaseCalculo>/i);
    const aliquotaMatch = infNfse.match(/<Aliquota>([^<]+)<\/Aliquota>/i);
    const issRetidoMatch = infNfse.match(/<IssRetido>([^<]+)<\/IssRetido>/i);
    const issRetido = issRetidoMatch?.[1] === "1" || issRetidoMatch?.[1]?.toLowerCase() === "sim" || issRetidoMatch?.[1]?.toLowerCase() === "true";

    const tomadorRazaoMatch = cleanXml.match(/<TomadorServico>[\s\S]*?<RazaoSocial>([^<]+)<\/RazaoSocial>/i)
      || cleanXml.match(/<Tomador>[\s\S]*?<RazaoSocial>([^<]+)<\/RazaoSocial>/i);
    const tomadorCnpjMatch = cleanXml.match(/<TomadorServico>[\s\S]*?<Cnpj>([^<]+)<\/Cnpj>/i)
      || cleanXml.match(/<Tomador>[\s\S]*?<Cnpj>([^<]+)<\/Cnpj>/i);
    const tomadorCpfMatch = cleanXml.match(/<TomadorServico>[\s\S]*?<Cpf>([^<]+)<\/Cpf>/i)
      || cleanXml.match(/<Tomador>[\s\S]*?<Cpf>([^<]+)<\/Cpf>/i);

    const prestadorCnpjMatch = cleanXml.match(/<PrestadorServico>[\s\S]*?<Cnpj>([^<]+)<\/Cnpj>/i)
      || cleanXml.match(/<Prestador>[\s\S]*?<Cnpj>([^<]+)<\/Cnpj>/i);
    const prestadorIMMatch = cleanXml.match(/<PrestadorServico>[\s\S]*?<InscricaoMunicipal>([^<]+)<\/InscricaoMunicipal>/i)
      || cleanXml.match(/<Prestador>[\s\S]*?<InscricaoMunicipal>([^<]+)<\/InscricaoMunicipal>/i);

    let linkNfse = (cleanXml.match(/<LinkNfse>([^<]+)<\/LinkNfse>/i) || cleanXml.match(/<linkNfse>([^<]+)<\/linkNfse>/i))?.[1];
    if (!linkNfse && numeroNfse && codigoVerificacaoMatch?.[1]) {
      const ambiente = getAmbiente();
      const baseUrl = ambiente === "producao" ? "https://producao.ginfes.com.br" : "https://homologacao.ginfes.com.br";
      linkNfse = `${baseUrl}/VisualizarNfse?num=${numeroNfse}&cod=${codigoVerificacaoMatch[1]}`;
    }

    const discriminacaoMatch = cleanXml.match(/<Discriminacao>([^<]+)<\/Discriminacao>/i);
    const itemListaServicoMatch = cleanXml.match(/<ItemListaServico>([^<]+)<\/ItemListaServico>/i);

    return {
      sucesso: true,
      numeroNfse,
      codigoVerificacao: codigoVerificacaoMatch?.[1],
      dataEmissao: dataEmissaoMatch?.[1],
      dataAutorizacao: dataAutorizacaoMatch?.[1],
      status,
      valorServicos: valorServicosMatch?.[1],
      valorIss: valorIssMatch?.[1],
      baseCalculo: baseCalculoMatch?.[1],
      aliquotaIss: aliquotaMatch?.[1],
      issRetido,
      tomador: {
        razaoSocial: tomadorRazaoMatch?.[1] || "",
        cnpjCpf: tomadorCnpjMatch?.[1] || tomadorCpfMatch?.[1] || "",
      },
      prestador: {
        cnpj: prestadorCnpjMatch?.[1] || "",
        inscricaoMunicipal: prestadorIMMatch?.[1] || "",
      },
      linkPdf: (cleanXml.match(/<LinkPdf>([^<]+)<\/LinkPdf>/i) || cleanXml.match(/<linkPdf>([^<]+)<\/linkPdf>/i))?.[1],
      linkXml: (cleanXml.match(/<LinkXml>([^<]+)<\/LinkXml>/i) || cleanXml.match(/<linkXml>([^<]+)<\/linkXml>/i))?.[1],
      linkNfse,
      discriminacao: discriminacaoMatch?.[1],
      itemListaServico: itemListaServicoMatch?.[1],
      xmlRetorno: xml,
      mensagens: [{ codigo: "0000", mensagem: "Consulta realizada com sucesso", tipo: "Sucesso" }],
    };
  } catch (error) {
    return { sucesso: false, xmlRetorno: xml, mensagens: [{ codigo: "ERR_PARSE", mensagem: `Erro ao processar resposta: ${(error as Error).message}`, tipo: "Erro" }] };
  }
}

// --- Retry Utility ---
export async function retry<T>(
  fn: () => Promise<T>,
  options = { tentativas: 3, delay: 1000, fator: 2 }
): Promise<T> {
  let tentativa = 0;
  let erro: any;

  while (tentativa < options.tentativas) {
    try {
      return await fn();
    } catch (err: any) {
      erro = err;
      const isErroTemporario =
        err.message?.includes("timeout") ||
        err.message?.includes("ECONNRESET") ||
        err.message?.includes("500") ||
        err.message?.includes("503") ||
        err.message?.includes("FETCH_ERROR") ||
        err.message?.includes("network");

      if (!isErroTemporario) throw err;

      const wait = options.delay * Math.pow(options.fator, tentativa);
      console.log(`Retry ${tentativa + 1}/${options.tentativas} em ${wait}ms: ${err.message}`);
      await new Promise(r => setTimeout(r, wait));
      tentativa++;
    }
  }

  throw erro;
}
