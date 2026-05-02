import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://9ninebusinesscontrol.com.br",
  "https://www.9ninebusinesscontrol.com.br",
  "https://9nineteste.9ninebusinesscontrol.com.br",
  "https://ninebpofinanceiro.lovable.app",
  "https://ninebpofinanceiro.vercel.app",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// --- node-forge Cache ---
let forgeCache: any = null;
async function getForge() {
  if (forgeCache) return forgeCache;
  const forgeModule = await import("https://esm.sh/node-forge@1.3.1");
  forgeCache = forgeModule.default?.util ? forgeModule.default
    : forgeModule.util ? forgeModule
    : (forgeModule as any).default?.default?.util ? (forgeModule as any).default.default
    : forgeModule;
  (globalThis as any).forge = forgeCache;
  return forgeCache;
}

interface CertificadoDigital {
  pfxBase64: string; senha: string; cnpj: string; inscricaoMunicipal: string;
  razaoSocial: string; certPem: string; keyPem: string; validoAte: Date;
}

async function carregarCertificado(pfxBase64: string, senha: string): Promise<CertificadoDigital> {
  const forge = await getForge();
  const pfxDer = forge.util.decode64(pfxBase64);
  const p12Asn1 = forge.asn1.fromDer(pfxDer);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, senha);

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  let certPem = "", keyPem = "", cnpj = "", razaoSocial = "", validoAte = new Date();

  if (certBags[forge.pki.oids.certBag]) {
    const cert = certBags[forge.pki.oids.certBag]![0];
    certPem = forge.pki.certificateToPem(cert.cert!);
    validoAte = cert.cert!.validity.notAfter;
    const subject = cert.cert!.subject;
    for (const attr of subject.attributes) {
      if (attr.shortName === "CN") razaoSocial = attr.value;
    }
    const icpCnpjAttr = subject.attributes.find((a: any) => a.oid === "2.16.76.4.3.3");
    if (icpCnpjAttr) {
      const digits = icpCnpjAttr.value.replace(/\D/g, "");
      if (digits.length >= 14) cnpj = digits.substring(digits.length - 14);
    }
    if (!cnpj) {
      const ouAttr = subject.attributes.find((a: any) => a.oid === "2.5.4.11" && /CNPJ/i.test(a.value));
      if (ouAttr) {
        const cnpjMatch = ouAttr.value.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
        if (cnpjMatch) cnpj = cnpjMatch[0].replace(/\D/g, "");
      }
    }
    if (!cnpj) {
      const cnAttr = subject.attributes.find((a: any) => a.shortName === "CN");
      if (cnAttr) {
        const cnpjMatch = cnAttr.value.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
        if (cnpjMatch) cnpj = cnpjMatch[0].replace(/\D/g, "");
      }
    }
  }

  const keyBagsShrouded = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  if (keyBagsShrouded[forge.pki.oids.pkcs8ShroudedKeyBag] && keyBagsShrouded[forge.pki.oids.pkcs8ShroudedKeyBag]!.length > 0) {
    keyPem = forge.pki.privateKeyToPem(keyBagsShrouded[forge.pki.oids.pkcs8ShroudedKeyBag]![0].key!);
  } else {
    const keyBagsShorthand = p12.getBags({ bagType: forge.pki.oids.pkcs8ShorthandKeyBag });
    if (keyBagsShorthand[forge.pki.oids.pkcs8ShorthandKeyBag] && keyBagsShorthand[forge.pki.oids.pkcs8ShorthandKeyBag]!.length > 0) {
      keyPem = forge.pki.privateKeyToPem(keyBagsShorthand[forge.pki.oids.pkcs8ShorthandKeyBag]![0].key!);
    } else {
      const keyBagsPlain = p12.getBags({ bagType: forge.pki.oids.keyBag });
      if (keyBagsPlain[forge.pki.oids.keyBag] && keyBagsPlain[forge.pki.oids.keyBag]!.length > 0) {
        keyPem = forge.pki.privateKeyToPem(keyBagsPlain[forge.pki.oids.keyBag]![0].key!);
      }
    }
  }

  if (!certPem || !keyPem) throw new Error("Nao foi possivel extrair certificado ou chave privada do PFX");
  return { pfxBase64, senha, cnpj, inscricaoMunicipal: "", razaoSocial, certPem, keyPem, validoAte };
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function formatarDataNfse(data: string | Date): string {
  const d = typeof data === "string" ? new Date(data) : data;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatarDataHoraNfse(data: string | Date): string {
  const d = typeof data === "string" ? new Date(data) : data;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// --- Paulistana RPS Hash Signature ---

function formatarValorAssinatura(valor: number): string {
  const v = Math.round(valor * 100).toString();
  return v.padStart(15, "0");
}

function gerarAssinaturaRpsPaulistana(
  inscricaoPrestador: string,
  serieRps: string,
  numeroRps: string,
  dataEmissao: string, // YYYY-MM-DD
  tributacaoRps: string, // T/F/A...
  statusRps: string, // N/C...
  issRetido: boolean,
  valorServicos: number,
  valorDeducoes: number,
  codigoServico: string,
  indicadorCpfCnpj: string, // 1=CPF, 2=CNPJ, 3=NaoInformado
  cpfCnpjTomador: string,
  certificado: CertificadoDigital
): string {
  const forge = (globalThis as any).forge;
  if (!forge) throw new Error("node-forge nao disponivel");

  const signatureString =
    inscricaoPrestador.padStart(8, "0") +
    (serieRps || "1").padEnd(5, " ") +
    numeroRps.padStart(12, "0") +
    dataEmissao.replace(/-/g, "") +
    tributacaoRps +
    statusRps +
    (issRetido ? "S" : "N") +
    formatarValorAssinatura(valorServicos) +
    formatarValorAssinatura(valorDeducoes) +
    codigoServico.replace(/\D/g, "").padStart(5, "0") +
    indicadorCpfCnpj +
    cpfCnpjTomador.replace(/\D/g, "").padStart(14, "0");

  const privateKey = forge.pki.privateKeyFromPem(certificado.keyPem);
  const md = forge.md.sha1.create();
  md.update(signatureString, "utf8");
  const signatureBytes = privateKey.sign(md);
  return forge.util.encode64(signatureBytes);
}

// --- XML builders (API Paulistana) ---

function construirXmlRpsPaulistana(dados: any, certificado: CertificadoDigital): { xml: string; rpsId: string } {
  const rpsId = `rps${dados.identificacaoRps.numero}`;
  const dataEmissao = formatarDataNfse(dados.dataEmissao);
  const serieRps = dados.identificacaoRps.serie || "1";
  const numeroRps = dados.identificacaoRps.numero;
  const inscricaoPrestador = certificado.inscricaoMunicipal || dados.emitente.inscricaoMunicipal || "00000000";
  const tributacaoRps = dados.tributacaoRps || "T"; // T=TRIBUTADA_MUNICIPIO
  const statusRps = "N"; // N=NORMAL
  const issRetido = !!dados.servico.issRetido;
  const valorServicos = parseFloat(dados.servico.valores.valorServicos) || 0;
  const valorDeducoes = parseFloat(dados.servico.valores.valorDeducoes) || 0;
  const codigoServico = dados.servico.itemListaServico || dados.servico.codigo || "";

  const tomadorCnpjCpf = (dados.tomador.cnpjCpf || "").replace(/\D/g, "");
  const indicadorCpfCnpj = dados.tomador.tipoDocumento === "CPF" ? "1" : tomadorCnpjCpf ? "2" : "3";

  const assinatura = gerarAssinaturaRpsPaulistana(
    inscricaoPrestador, serieRps, numeroRps, dataEmissao,
    tributacaoRps, statusRps, issRetido, valorServicos, valorDeducoes,
    codigoServico, indicadorCpfCnpj, tomadorCnpjCpf, certificado
  );

  const valorServicosStr = valorServicos.toFixed(2);
  const valorDeducoesStr = valorDeducoes.toFixed(2);
  const valorPisStr = (parseFloat(dados.servico.valores.valorPis) || 0).toFixed(2);
  const valorCofinsStr = (parseFloat(dados.servico.valores.valorCofins) || 0).toFixed(2);
  const valorInssStr = (parseFloat(dados.servico.valores.valorInss) || 0).toFixed(2);
  const valorIrStr = (parseFloat(dados.servico.valores.valorIr) || 0).toFixed(2);
  const valorCsllStr = (parseFloat(dados.servico.valores.valorCsll) || 0).toFixed(2);
  const aliquotaStr = (parseFloat(dados.servico.aliquotaIss) || 0.05).toFixed(4);

  let xml = `<RPS Id="${rpsId}">
    <Assinatura>${assinatura}</Assinatura>
    <ChaveRPS>
      <InscricaoPrestador>${inscricaoPrestador}</InscricaoPrestador>
      <SerieRPS>${serieRps}</SerieRPS>
      <NumeroRPS>${numeroRps}</NumeroRPS>
    </ChaveRPS>
    <TipoRPS>RPS</TipoRPS>
    <DataEmissao>${dataEmissao}</DataEmissao>
    <StatusRPS>${statusRps}</StatusRPS>
    <TributacaoRPS>${tributacaoRps}</TributacaoRPS>
    <ValorServicos>${valorServicosStr}</ValorServicos>
    <ValorDeducoes>${valorDeducoesStr}</ValorDeducoes>
    <ValorPIS>${valorPisStr}</ValorPIS>
    <ValorCOFINS>${valorCofinsStr}</ValorCOFINS>
    <ValorINSS>${valorInssStr}</ValorINSS>
    <ValorIR>${valorIrStr}</ValorIR>
    <ValorCSLL>${valorCsllStr}</ValorCSLL>
    <CodigoServico>${codigoServico}</CodigoServico>
    <AliquotaServicos>${aliquotaStr}</AliquotaServicos>
    <ISSRetido>${issRetido ? "true" : "false"}</ISSRetido>`;

  if (dados.tomador.cnpjCpf) {
    xml += `
    <CPFCNPJTomador>
      <${dados.tomador.tipoDocumento === "CPF" ? "CPF" : "CNPJ"}>${dados.tomador.cnpjCpf}</${dados.tomador.tipoDocumento === "CPF" ? "CPF" : "CNPJ"}>
    </CPFCNPJTomador>`;
  }

  if (dados.tomador.razaoSocial) {
    xml += `
    <RazaoSocialTomador>${escapeXml(dados.tomador.razaoSocial)}</RazaoSocialTomador>`;
  }

  if (dados.tomador.endereco?.logradouro) {
    xml += `
    <EnderecoTomador>
      <Logradouro>${escapeXml(dados.tomador.endereco.logradouro)}</Logradouro>
      <NumeroEndereco>${escapeXml(dados.tomador.endereco.numero || "S/N")}</NumeroEndereco>
      ${dados.tomador.endereco.complemento ? `<ComplementoEndereco>${escapeXml(dados.tomador.endereco.complemento)}</ComplementoEndereco>` : ""}
      <Bairro>${escapeXml(dados.tomador.endereco.bairro || "")}</Bairro>
      <Cidade>${escapeXml(dados.tomador.endereco.cidade || "")}</Cidade>
      <UF>${dados.tomador.endereco.uf || "SP"}</UF>
      <CEP>${(dados.tomador.endereco.cep || "").replace(/\D/g, "")}</CEP>
    </EnderecoTomador>`;
  }

  if (dados.tomador.email) {
    xml += `
    <EmailTomador>${escapeXml(dados.tomador.email)}</EmailTomador>`;
  }

  xml += `
    <Discriminacao>${escapeXml(dados.servico.descricao || dados.servico.discriminacao || "")}</Discriminacao>
  </RPS>`;

  return { xml, rpsId };
}

function construirXmlLotePaulistana(dados: any, xmlRps: string): { xml: string; loteId: string } {
  const numeroLote = Date.now().toString();
  const loteId = `LOTE${numeroLote}`;
  const dataInicio = formatarDataNfse(dados.dataEmissao);
  const valorServicos = (parseFloat(dados.servico.valores.valorServicos) || 0).toFixed(2);
  const valorDeducoes = (parseFloat(dados.servico.valores.valorDeducoes) || 0).toFixed(2);

  const xml = `<PedidoEnvioLoteRPS xmlns="http://www.prefeitura.sp.gov.br/nfe" Id="${loteId}">
  <Cabecalho Versao="1">
    <CPFCNPJRemetente>
      <CNPJ>${dados.emitente.cnpj}</CNPJ>
    </CPFCNPJRemetente>
    <transacao>true</transacao>
    <dtInicio>${dataInicio}</dtInicio>
    <dtFim>${dataInicio}</dtFim>
    <QtdRPS>1</QtdRPS>
    <ValorTotalServicos>${valorServicos}</ValorTotalServicos>
    <ValorTotalDeducoes>${valorDeducoes}</ValorTotalDeducoes>
  </Cabecalho>
  ${xmlRps}
</PedidoEnvioLoteRPS>`;

  return { xml, loteId };
}

// --- XML-DSig SHA-256 ---

function canonicalizeXml(xml: string): string {
  let result = xml;
  result = result.replace(/<\?xml[^?]*\?>\s*/g, "");
  result = result.replace(/<\?[^?]*\?>\s*/g, "");
  result = result.replace(/<(\w+)([^>]*)\/>/g, (_m: string, tag: string, attrs: string) => attrs.trim() ? `<${tag}${attrs}></${tag}>` : `<${tag}></${tag}>`);
  result = result.replace(/>\s+</g, "><");
  result = result.replace(/\s+=\s+/g, "=");
  result = result.replace(/\n\s+/g, "\n").trim();
  return result;
}

function extractElementById(xml: string, id: string): string | null {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const openRegex = new RegExp(`<([\\w]+)([^>]*?)Id="${escapedId}"([^>]*?)>`, "i");
  const openMatch = xml.match(openRegex);
  if (!openMatch) return null;
  const tagName = openMatch[1];
  const fullOpenMatch = openMatch[0];
  const startIndex = xml.indexOf(fullOpenMatch);
  if (startIndex === -1) return null;
  let depth = 0, pos = startIndex;
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
      if (innerOpen !== -1 && innerOpen < innerClose) depth++;
      else depth--;
      if (depth === 0) { searchPos = innerClose + `</${tagName}>`.length; break; }
      searchPos = innerClose + `</${tagName}>`.length;
    }
    return xml.substring(startIndex, searchPos);
  }
  return null;
}

function getElementName(xml: string, id: string): string {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`<(\\w+)[^>]*Id="${escapedId}"`, "i");
  const match = xml.match(regex);
  return match ? match[1] : "PedidoEnvioLoteRPS";
}

function assinarXmlSHA256(xml: string, certificado: CertificadoDigital, idReferencia: string): string {
  const forge = (globalThis as any).forge;
  if (!forge) throw new Error("node-forge nao disponivel");
  const privateKey = forge.pki.privateKeyFromPem(certificado.keyPem);
  const certificate = forge.pki.certificateFromPem(certificado.certPem);
  const referencedXml = extractElementById(xml, idReferencia);
  if (!referencedXml) throw new Error(`Elemento Id="${idReferencia}" nao encontrado`);
  const canonReferenced = canonicalizeXml(referencedXml);
  const digest = forge.md.sha256.create();
  digest.update(canonReferenced, "utf8");
  const digestBase64 = forge.util.encode64(digest.digest().bytes());

  const signedInfoXml = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#"><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></CanonicalizationMethod><SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha256"></SignatureMethod><Reference URI="#${idReferencia}"><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform></Transforms><DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha256"></DigestMethod><DigestValue>${digestBase64}</DigestValue></Reference></SignedInfo>`;

  const canonSignedInfo = canonicalizeXml(signedInfoXml);
  const signatureMd = forge.md.sha256.create();
  signatureMd.update(canonSignedInfo, "utf8");
  const signatureBytes = privateKey.sign(signatureMd);
  const signatureBase64 = forge.util.encode64(signatureBytes);
  const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(certificate)).getBytes();
  const certBase64 = forge.util.encode64(certDer);

  const signatureBlock = `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><SignedInfo><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></CanonicalizationMethod><SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha256"></SignatureMethod><Reference URI="#${idReferencia}"><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform></Transforms><DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha256"></DigestMethod><DigestValue>${digestBase64}</DigestValue></Reference></SignedInfo><SignatureValue>${signatureBase64}</SignatureValue><KeyInfo><X509Data><X509Certificate>${certBase64}</X509Certificate></X509Data></KeyInfo></Signature>`;

  const elementName = getElementName(xml, idReferencia);
  const closingTag = `</${elementName}>`;
  const insertionPoint = xml.lastIndexOf(closingTag);
  if (insertionPoint === -1) throw new Error(`Tag fechamento </${elementName}> nao encontrada`);
  return xml.substring(0, insertionPoint) + signatureBlock + xml.substring(insertionPoint);
}

// --- SOAP Paulistana ---

function criarEnvelopeSOAP11Paulistana(operacao: string, xmlAssinado: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Header/>
  <soapenv:Body>
    <${operacao} xmlns="http://www.prefeitura.sp.gov.br/nfe">
      <MensagemXML><![CDATA[
${xmlAssinado}
      ]]></MensagemXML>
    </${operacao}>
  </soapenv:Body>
</soapenv:Envelope>`;
}

function getAmbiente(): "homologacao" | "producao" {
  return (Deno.env.get("NFSE_AMBIENTE") || "homologacao") as "homologacao" | "producao";
}

const PAULISTANA_URL = "https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx";

async function enviarRequisicaoSOAP(
  soapEnvelope: string,
  soapAction: string,
  certificado?: { certPem: string; keyPem: string }
): Promise<string> {
  const env = getAmbiente();
  const baseHeaders: Record<string, string> = {
    "Content-Type": "text/xml; charset=utf-8",
    "SOAPAction": `"${soapAction}"`,
  };

  if (env === "homologacao") {
    const response = await fetch(PAULISTANA_URL, {
      method: "POST",
      headers: baseHeaders,
      body: soapEnvelope,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro HTTP ${response.status}: ${text.substring(0, 500)}`);
    }
    return await response.text();
  }

  if (!certificado) throw new Error("Certificado obrigatorio em producao");
  const proxyUrl = (Deno.env.get("MTLS_PROXY_URL") || "").replace(/\/+$/g, "");
  if (!proxyUrl) throw new Error("MTLS_PROXY_URL nao configurada");
  const proxyApiKey = Deno.env.get("MTLS_PROXY_API_KEY") || "";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (proxyApiKey) headers["X-API-Key"] = proxyApiKey;

  const proxyResponse = await fetch(`${proxyUrl}/proxy-nfse`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      soapEnvelope,
      soapAction,
      certPem: certificado.certPem,
      keyPem: certificado.keyPem,
      provider: "paulistana",
      ambiente: env,
    }),
  });
  if (!proxyResponse.ok) {
    const text = await proxyResponse.text();
    throw new Error(`Erro proxy mTLS (${proxyResponse.status}): ${text.substring(0, 500)}`);
  }
  return await proxyResponse.text();
}

function parsearErrosPaulistana(xml: string): Array<{ codigo: string; mensagem: string; tipo: string }> {
  const erros: Array<{ codigo: string; mensagem: string; tipo: string }> = [];
  const ERROS_PAULISTANA: Record<string, string> = {
    "1001": "CNPJ do remetente invalido",
    "1002": "Inscricao Municipal invalida",
    "1003": "RPS ja informado",
    "1004": "Serie invalida",
    "1005": "Tipo invalido",
    "1006": "Data de emissao invalida",
    "1007": "Natureza da operacao invalida",
    "1008": "Valor dos servicos invalido",
    "1009": "Assinatura do RPS invalida",
    "1010": "Certificado invalido",
    "1011": "Assinatura XML invalida",
    "1012": "XML mal formatado",
    "1013": "Erro interno",
    "1014": "Requisicao mal formada",
    "1015": "Lote ja processado",
    "1016": "Quantidade de RPS invalida",
    "1017": "Valor total dos servicos invalido",
    "1018": "Codigo de servico invalido",
    "1019": "Aliquota invalida",
    "1020": "Tomador nao informado",
    "1021": "CNPJ/CPF do tomador invalido",
    "1022": "Municipio do prestador invalido",
  };
  const mensagens = [...xml.matchAll(/<Alerta[^>]*>([\s\S]*?)<\/Alerta>/gi)].map(m => m[1].replace(/<[^>]+>/g, "").trim());
  const codigos = [...xml.matchAll(/<Codigo[^>]*>([^<]+)<\/Codigo>/gi)].map(m => m[1]);
  for (let i = 0; i < Math.max(mensagens.length, codigos.length); i++) {
    erros.push({ codigo: codigos[i] || "ERR_UNKNOWN", mensagem: ERROS_PAULISTANA[codigos[i] || ""] || mensagens[i] || "Erro desconhecido", tipo: "Erro" });
  }
  const faultMatch = xml.match(/<faultstring>([^<]+)<\/faultstring>/i);
  if (faultMatch && erros.length === 0) erros.push({ codigo: "SOAP_FAULT", mensagem: faultMatch[1], tipo: "Erro" });
  return erros;
}

function parsearRespostaEmissaoPaulistana(xml: string) {
  try {
    // Extrai XML interno do CDATA ou do envelope SOAP
    let workXml = xml;
    const cdataMatch = xml.match(/<(?:MensagemXML|return)[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/(?:MensagemXML|return)>/i);
    if (cdataMatch) workXml = cdataMatch[1];
    if (!cdataMatch && workXml.includes("&lt;")) {
      workXml = workXml.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
    }
    const cleanXml = workXml.replace(/<\/?[a-zA-Z0-9_]+:/g, m => (m.startsWith("</") ? "</" : "<"));

    const erros = parsearErrosPaulistana(cleanXml);
    const sucessoMatch = cleanXml.match(/<Sucesso>([^<]+)<\/Sucesso>/i);
    const sucesso = sucessoMatch?.[1]?.toLowerCase() === "true";

    if (!sucesso && erros.length > 0) {
      return { sucesso: false, xmlRetorno: xml, mensagens: erros };
    }

    const chaveLoteMatch = cleanXml.match(/<ChaveLoteRPS>([\s\S]*?)<\/ChaveLoteRPS>/i);
    const chaveLote = chaveLoteMatch ? chaveLoteMatch[1] : "";
    const numeroLoteMatch = chaveLote.match(/<NumeroLote>([^<]+)<\/NumeroLote>/i) || cleanXml.match(/<NumeroLote>([^<]+)<\/NumeroLote>/i);
    const dataEnvioMatch = cleanXml.match(/<DataEnvioLote>([^<]+)<\/DataEnvioLote>/i);
    const numeroNfseMatch = cleanXml.match(/<NumeroNfseGeradas>([^<]+)<\/NumeroNfseGeradas>/i);

    // Tenta extrair numero NFSe da resposta de consulta vinculada
    const nfseMatch = cleanXml.match(/<NFe>[\s\S]*?<NumeroNFe>([^<]+)<\/NumeroNFe>/i);
    const codigoVerificacaoMatch = cleanXml.match(/<CodigoVerificacao>([^<]+)<\/CodigoVerificacao>/i);

    return {
      sucesso: sucesso || !!numeroLoteMatch,
      numeroNfse: nfseMatch?.[1] || numeroNfseMatch?.[1],
      numeroLote: numeroLoteMatch?.[1],
      protocolo: numeroLoteMatch?.[1],
      codigoVerificacao: codigoVerificacaoMatch?.[1],
      dataEnvio: dataEnvioMatch?.[1],
      linkNfse: numeroLoteMatch?.[1] ? `https://nfe.prefeitura.sp.gov.br/${nfseMatch?.[1] || ""}` : undefined,
      xmlRetorno: xml,
      mensagens: erros.length > 0 ? erros : [{ codigo: "0000", mensagem: "Lote enviado com sucesso", tipo: "Sucesso" }],
    };
  } catch (error) {
    return { sucesso: false, xmlRetorno: xml, mensagens: [{ codigo: "ERR_PARSE", mensagem: `Erro: ${(error as Error).message}`, tipo: "Erro" }] };
  }
}

async function retry<T>(fn: () => Promise<T>, options = { tentativas: 3, delay: 1000, fator: 2 }): Promise<T> {
  let tentativa = 0;
  let erro: any;
  while (tentativa < options.tentativas) {
    try {
      return await fn();
    } catch (err: any) {
      erro = err;
      const isTemp = err.message?.includes("timeout") || err.message?.includes("500") || err.message?.includes("503") || err.message?.includes("FETCH");
      if (!isTemp) throw err;
      const wait = options.delay * Math.pow(options.fator, tentativa);
      await new Promise(r => setTimeout(r, wait));
      tentativa++;
    }
  }
  throw erro;
}

// --- Main handler ---
serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  let notaId: string | undefined;
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing authorization" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseAuth = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    notaId = body.notaId;
    const certificadoId = body.certificadoId;
    if (!notaId || !certificadoId) return new Response(JSON.stringify({ error: "notaId e certificadoId obrigatorios" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: certificado, error: certError } = await supabase.from("certificados_nfse").select("*").eq("id", certificadoId).eq("user_id", user.id).single();
    if (certError || !certificado) throw new Error("Certificado nao encontrado");
    if (!certificado.arquivo_pfx) throw new Error("Certificado sem arquivo PFX");

    const certDigital = await carregarCertificado(certificado.arquivo_pfx, certificado.senha || "");
    certDigital.inscricaoMunicipal = certificado.inscricao_municipal || "";
    certDigital.cnpj = certificado.cnpj || certDigital.cnpj || "";
    if (!certDigital.cnpj) throw new Error("CNPJ nao encontrado no certificado");

    await supabase.from("notas_fiscais_servico").update({ status: "enviando" }).eq("id", notaId).eq("user_id", user.id);
    const { data: nota, error: notaError } = await supabase.from("notas_fiscais_servico").select("*").eq("id", notaId).eq("user_id", user.id).single();
    if (notaError || !nota) throw new Error("Nota nao encontrada");

    const dadosNota = {
      identificacaoRps: { numero: nota.numero_rps || nota.numero_nota || gerarNumeroRps(), serie: nota.serie || "1", tipo: nota.tipo_rps || "RPS" },
      dataEmissao: nota.data_emissao || new Date().toISOString(),
      competencia: nota.data_competencia || new Date().toISOString().split("T")[0],
      naturezaOperacao: nota.natureza_operacao || 1,
      regimeTributario: nota.regime_tributario || 1,
      optanteSimplesNacional: nota.regime_tributario === 1,
      incentivoFiscal: false,
      tributacaoRps: nota.tributacao_rps || "T",
      emitente: {
        cnpj: certDigital.cnpj,
        inscricaoMunicipal: certDigital.inscricaoMunicipal,
        razaoSocial: certificado.razao_social || certDigital.razaoSocial || "",
        endereco: { logradouro: certificado.logradouro || "", numero: certificado.numero || "", bairro: certificado.bairro || "", codigoMunicipio: certificado.codigo_municipio || "3550308", uf: certificado.uf || "SP", cep: certificado.cep || "" },
      },
      tomador: {
        tipoDocumento: nota.cliente_tipo_documento || "CNPJ",
        cnpjCpf: nota.cliente_cnpj_cpf || "",
        razaoSocial: nota.cliente_razao_social || nota.cliente_nome || "",
        nomeFantasia: nota.cliente_nome_fantasia || "",
        email: nota.cliente_email || "",
        telefone: nota.cliente_telefone || "",
        endereco: { logradouro: nota.cliente_endereco || "", numero: nota.cliente_numero || "", complemento: nota.cliente_complemento || "", bairro: nota.cliente_bairro || "", cidade: nota.cliente_cidade || "", uf: nota.cliente_estado || "", cep: nota.cliente_cep || "" },
      },
      servico: {
        descricao: nota.servico_descricao || "",
        codigo: nota.servico_codigo || nota.servico_item_lista_servico || "",
        codigoCnae: nota.servico_cnae || nota.cnae || "",
        codigoTributacao: nota.servico_codigo_tributacao || nota.codigo_tributacao || "",
        discriminacao: nota.servico_discriminacao || "",
        itemListaServico: nota.servico_item_lista_servico || "",
        valores: {
          valorServicos: parseFloat(nota.valor_servico) || 0, valorDeducoes: parseFloat(nota.valor_deducoes) || 0,
          valorPis: parseFloat(nota.retencao_pis) || 0, valorCofins: parseFloat(nota.retencao_cofins) || 0,
          valorInss: parseFloat(nota.retencao_inss) || 0, valorIr: parseFloat(nota.retencao_ir) || 0,
          valorCsll: parseFloat(nota.retencao_csll) || 0, valorIss: parseFloat(nota.valor_iss) || 0,
          valorLiquido: parseFloat(nota.valor_liquido) || 0,
        },
        aliquotaIss: parseFloat(nota.aliquota_iss) || 0.05,
        issRetido: nota.iss_retido || false,
      },
    };

    // --- Pré-validação com IA via ai-orchestrator ---
    let preValidacaoIA = null;
    try {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY") || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskType: "code",
          messages: [
            { role: "system", content: "Você é um validador de XML NFSe Paulistana (Prefeitura de SP). Analise o JSON da nota e retorne um JSON com { valido: boolean, problemas: string[], sugestoes: string[] }. Retorne SOMENTE o JSON." },
            { role: "user", content: JSON.stringify(dadosNota, null, 2) },
          ],
          temperature: 0.1,
        }),
      });
      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || "";
        try {
          preValidacaoIA = JSON.parse(content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim());
        } catch { /* ignora erro de parse */ }
      }
    } catch (e) {
      console.log("[emitir-nfse] Pré-validação IA indisponível:", e);
    }

    const ambiente = getAmbiente();
    let resultado;
    if (ambiente === "homologacao") {
      resultado = {
        sucesso: true,
        numeroNfse: dadosNota.identificacaoRps.numero,
        numeroLote: `HOM${Date.now()}`,
        protocolo: `PROT${Date.now()}`,
        codigoVerificacao: `HOM${Date.now().toString(36).toUpperCase()}`,
        linkNfse: `https://nfe.prefeitura.sp.gov.br/${dadosNota.identificacaoRps.numero}`,
        xmlEnvio: "<homologacao>simulado</homologacao>",
        xmlRetorno: "<Compl>true</Compl>",
        mensagens: [{ codigo: "AA001", mensagem: "RPS processado - ambiente de homologacao (Paulistana)", tipo: "Sucesso" }],
      };
    } else {
      const { xml: xmlRps, rpsId } = construirXmlRpsPaulistana(dadosNota, certDigital);
      console.log(`[emitir-nfse] RPS ${rpsId} construido`);

      const { xml: xmlLote, loteId } = construirXmlLotePaulistana(dadosNota, xmlRps);
      console.log(`[emitir-nfse] Lote ${loteId} construido`);

      // Assina o lote com XML-DSig SHA-256
      const signedLote = assinarXmlSHA256(xmlLote, certDigital, loteId);
      console.log("[emitir-nfse] Lote assinado com XML-DSig SHA-256");

      const operacao = "EnvioLoteRPS";
      const soapEnvelope = criarEnvelopeSOAP11Paulistana(operacao, signedLote);
      const soapAction = `http://www.prefeitura.sp.gov.br/nfe/${operacao}`;

      console.log(`[emitir-nfse] Enviando para ${PAULISTANA_URL} action=${soapAction}`);
      const soapResponse = await retry(() => enviarRequisicaoSOAP(soapEnvelope, soapAction, { certPem: certDigital.certPem, keyPem: certDigital.keyPem }));
      resultado = { ...parsearRespostaEmissaoPaulistana(soapResponse), xmlEnvio: signedLote };
    }

    const updateData: any = {
      status: resultado.sucesso ? "autorizada" : "rejeitada",
      xml_envio: (resultado as any).xmlEnvio || null,
      xml_retorno: resultado.xmlRetorno || null,
      numero_nota: resultado.numeroNfse || nota.numero_nota,
      protocolo: resultado.protocolo || null,
      codigo_verificacao: resultado.codigoVerificacao || null,
      link_nfse: (resultado as any).linkNfse || null,
      data_autorizacao: resultado.sucesso ? new Date().toISOString() : null,
      mensagem_erro: resultado.sucesso ? null : resultado.mensagens?.map((m: any) => m.mensagem).join("; "),
      cnpj_prestador: certDigital.cnpj || nota.cnpj_prestador || "",
      inscricao_municipal: certDigital.inscricaoMunicipal || nota.inscricao_municipal || "",
    };
    await supabase.from("notas_fiscais_servico").update(updateData).eq("id", notaId).eq("user_id", user.id);

    return new Response(JSON.stringify({ ...resultado, preValidacaoIA }), { status: resultado.sucesso ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Erro ao emitir NFS-e:", err);
    if (notaId) {
      try {
        const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        await supabase.from("notas_fiscais_servico").update({ status: "erro", mensagem_erro: (err as Error).message }).eq("id", notaId);
      } catch (dbErr) { console.error("Falha ao atualizar status de erro:", dbErr); }
    }
    return new Response(JSON.stringify({ sucesso: false, mensagens: [{ codigo: "ERROR", mensagem: (err as Error).message, tipo: "Erro" }] }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

function gerarNumeroRps(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `${timestamp}${random}`;
}
