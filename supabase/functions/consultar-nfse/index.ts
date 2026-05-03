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

// --- node-forge ---
let forgeCache: any = null;
async function getForge() {
  if (forgeCache) return forgeCache;
  const m = await import("https://esm.sh/node-forge@1.3.1");
  forgeCache = m.default?.util ? m.default : m.util ? m : (m as any).default?.default?.util ? (m as any).default.default : m;
  (globalThis as any).forge = forgeCache;
  return forgeCache;
}

interface CertificadoDigital {
  cnpj: string;
  inscricaoMunicipal: string;
  certPem: string;
  keyPem: string;
}

async function carregarCertificado(pfxBase64: string, senha: string): Promise<CertificadoDigital> {
  const forge = await getForge();
  const pfxDer = forge.util.decode64(pfxBase64);
  const p12Asn1 = forge.asn1.fromDer(pfxDer);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, senha);

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  let certPem = "", keyPem = "", cnpj = "";

  if (certBags[forge.pki.oids.certBag]) {
    const cert = certBags[forge.pki.oids.certBag]![0];
    certPem = forge.pki.certificateToPem(cert.cert!);
    const subject = cert.cert!.subject;
    const icpCnpj = subject.attributes.find((a: any) => a.oid === "2.16.76.1.3.3");
    if (icpCnpj) {
      const d = icpCnpj.value.replace(/\D/g, "");
      if (d.length >= 14) cnpj = d.substring(d.length - 14);
    }
    if (!cnpj) {
      const ou = subject.attributes.find((a: any) => a.oid === "2.5.4.11" && /CNPJ/i.test(a.value));
      if (ou) {
        const m = ou.value.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
        if (m) cnpj = m[0].replace(/\D/g, "");
      }
    }
    if (!cnpj) {
      const cn = subject.attributes.find((a: any) => a.shortName === "CN");
      if (cn) {
        const m = cn.value.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
        if (m) cnpj = m[0].replace(/\D/g, "");
      }
    }
  }

  const keyBagsShrouded = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  if (keyBagsShrouded[forge.pki.oids.pkcs8ShroudedKeyBag]?.length > 0) {
    keyPem = forge.pki.privateKeyToPem(keyBagsShrouded[forge.pki.oids.pkcs8ShroudedKeyBag]![0].key!);
  } else {
    const keyBagsShorthand = p12.getBags({ bagType: forge.pki.oids.pkcs8ShorthandKeyBag });
    if (keyBagsShorthand[forge.pki.oids.pkcs8ShorthandKeyBag]?.length > 0) {
      keyPem = forge.pki.privateKeyToPem(keyBagsShorthand[forge.pki.oids.pkcs8ShorthandKeyBag]![0].key!);
    } else {
      const keyBagsPlain = p12.getBags({ bagType: forge.pki.oids.keyBag });
      if (keyBagsPlain[forge.pki.oids.keyBag]?.length > 0) {
        keyPem = forge.pki.privateKeyToPem(keyBagsPlain[forge.pki.oids.keyBag]![0].key!);
      }
    }
  }

  if (!certPem || !keyPem) throw new Error("Nao foi possivel extrair certificado ou chave do PFX");
  return { cnpj, inscricaoMunicipal: "", certPem, keyPem };
}

// --- XML builders (API Paulistana) ---

function xmlPedidoConsultaNFe(cnpj: string, numeroNFe: string, inscricaoMunicipal?: string): string {
  const im = inscricaoMunicipal || "";
  return `<PedidoConsultaNFe xmlns="http://www.prefeitura.sp.gov.br/nfe" Id="Lote1">
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
    <NumeroNFe>${numeroNFe}</NumeroNFe>
  </Detalhe>
</PedidoConsultaNFe>`;
}

function xmlPedidoConsultaNFePeriodo(
  cnpj: string,
  inscricaoMunicipal: string,
  dataInicio: string,
  dataFim: string,
  cnpjTomador?: string,
  cpfTomador?: string
): string {
  let detalhe = `
    <CPFCNPJPrestador>
      <CNPJ>${cnpj}</CNPJ>
    </CPFCNPJPrestador>
    <InscricaoPrestador>${inscricaoMunicipal}</InscricaoPrestador>
    <dtInicio>${dataInicio}</dtInicio>
    <dtFim>${dataFim}</dtFim>`;
  if (cnpjTomador) {
    detalhe += `
    <CPFCNPJTomador>
      <CNPJ>${cnpjTomador}</CNPJ>
    </CPFCNPJTomador>`;
  } else if (cpfTomador) {
    detalhe += `
    <CPFCNPJTomador>
      <CPF>${cpfTomador}</CPF>
    </CPFCNPJTomador>`;
  }
  return `<PedidoConsultaNFe xmlns="http://www.prefeitura.sp.gov.br/nfe" Id="Lote1">
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

// --- Envelope SOAP 1.1 API Paulistana ---

function criarEnvelopeSOAP11Paulistana(operacao: string, xmlAssinado: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Header/>
  <soapenv:Body>
    <${operacao}Request xmlns="http://www.prefeitura.sp.gov.br/nfe">
      <VersaoSchema>1</VersaoSchema>
      <MensagemXML><![CDATA[
${xmlAssinado}
      ]]></MensagemXML>
    </${operacao}Request>
  </soapenv:Body>
</soapenv:Envelope>`;
}

// --- Assinatura digital XMLDSig (SHA-256) ---

function canonicalizeXml(xml: string): string {
  let result = xml;
  result = result.replace(/<\?xml[^?]*\?>\s*/g, "");
  result = result.replace(/<\?[^?]*\?>\s*/g, "");
  result = result.replace(/<(\w+)([^>]*)\/>/g, (_match: string, tagName: string, attrs: string) => {
    if (attrs.trim()) return `<${tagName}${attrs}></${tagName}>`;
    return `<${tagName}></${tagName}>`;
  });
  result = result.replace(/>\s+</g, "><");
  result = result.replace(/\s+=\s+/g, "=");
  result = result.replace(/\n\s+/g, "\n");
  result = result.trim();
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

function getElementName(xml: string, id: string): string {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`<(\\w+)[^>]*Id="${escapedId}"`, "i");
  const match = xml.match(regex);
  return match ? match[1] : "Pedido";
}

function assinarXmlSHA1(xml: string, certificado: CertificadoDigital, idReferencia: string): string {
  const forge = (globalThis as any).forge;
  if (!forge) throw new Error("node-forge nao disponivel");

  try {
    const privateKey = forge.pki.privateKeyFromPem(certificado.keyPem);
    const certificate = forge.pki.certificateFromPem(certificado.certPem);
    const referencedXml = extractElementById(xml, idReferencia);
    if (!referencedXml) throw new Error(`Elemento Id="${idReferencia}" nao encontrado`);

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
    if (insertionPoint === -1) throw new Error(`Tag de fechamento </${elementName}> nao encontrada`);

    return xml.substring(0, insertionPoint) + signatureBlock + xml.substring(insertionPoint);
  } catch (error) {
    throw new Error(`Erro na assinatura digital: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// --- Envio SOAP ---

const PAULISTANA_URL = "https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx";

async function enviarRequisicaoSOAP(
  soapEnvelope: string,
  soapAction: string,
  certificado?: { certPem: string; keyPem: string }
): Promise<string> {
  const ambiente = getAmbiente();

  if (ambiente === "homologacao") {
    const response = await fetch(PAULISTANA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": `"${soapAction}"`,
      },
      body: soapEnvelope,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro HTTP ${response.status}: ${text.substring(0, 500)}`);
    }
    return await response.text();
  }

  // Producao: via proxy mTLS
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
      ambiente,
    }),
  });
  if (!proxyResponse.ok) {
    const text = await proxyResponse.text();
    throw new Error(`Erro proxy mTLS (${proxyResponse.status}): ${text.substring(0, 500)}`);
  }
  return await proxyResponse.text();
}

function getAmbiente(): "homologacao" | "producao" {
  return (Deno.env.get("NFSE_AMBIENTE") || "homologacao") as "homologacao" | "producao";
}

// --- Parser de resposta Paulistana ---

function parsearErrosPaulistana(xml: string): Array<{ codigo: string; mensagem: string; tipo: string }> {
  const erros: Array<{ codigo: string; mensagem: string; tipo: string }> = [];
  const ERROS_PAULISTANA: Record<string, string> = {
    "1001": "CNPJ do remetente invalido",
    "1002": "Inscricao Municipal invalida",
    "1003": "Numero da NFS-e invalido",
    "1004": "NFS-e nao encontrada",
    "1005": "Certificado invalido",
    "1006": "Assinatura invalida",
    "1007": "XML mal formatado",
    "1008": "Erro interno",
    "1009": "Requisicao mal formada",
    "1010": "Periodo de consulta invalido",
    "1011": "Limite de registros excedido",
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

function extrairXmlInterno(soapXml: string): string {
  // Tenta extrair CDATA dentro de <MensagemXML> ou <return>
  const cdataMatch = soapXml.match(/<(?:MensagemXML|return)[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/(?:MensagemXML|return)>/i);
  if (cdataMatch) return cdataMatch[1];
  // Tenta extrair conteudo XML escapado
  if (soapXml.includes("&lt;")) {
    return soapXml.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
  }
  // Remove namespaces SOAP para facilitar parsing
  return soapXml.replace(/<\/?[a-zA-Z0-9_]+:/g, m => (m.startsWith("</") ? "</" : "<"));
}

function parsearRespostaConsultaPaulistana(xml: string) {
  try {
    const innerXml = extrairXmlInterno(xml);
    const cleanXml = innerXml.replace(/<\/?[a-zA-Z0-9_]+:/g, m => (m.startsWith("</") ? "</" : "<"));

    const erros = parsearErrosPaulistana(cleanXml);
    const sucessoMatch = cleanXml.match(/<Sucesso>([^<]+)<\/Sucesso>/i);
    const sucesso = sucessoMatch?.[1]?.toLowerCase() === "true";

    if (!sucesso && erros.length > 0) {
      return { sucesso: false, xmlRetorno: xml, mensagens: erros };
    }

    const nfeMatch = cleanXml.match(/<NFe>([\s\S]*?)<\/NFe>/i);
    const nfe = nfeMatch ? nfeMatch[1] : cleanXml;

    const chaveNfeMatch = nfe.match(/<ChaveNFe>([\s\S]*?)<\/ChaveNFe>/i);
    const chaveNfe = chaveNfeMatch ? chaveNfeMatch[1] : "";

    const numeroNfeMatch = chaveNfe.match(/<NumeroNFe>([^<]+)<\/NumeroNFe>/i) || nfe.match(/<NumeroNFe>([^<]+)<\/NumeroNFe>/i);
    const codigoVerificacaoMatch = chaveNfe.match(/<CodigoVerificacao>([^<]+)<\/CodigoVerificacao>/i) || nfe.match(/<CodigoVerificacao>([^<]+)<\/CodigoVerificacao>/i);
    const inscricaoPrestadorMatch = chaveNfe.match(/<InscricaoPrestador>([^<]+)<\/InscricaoPrestador>/i);

    const dataEmissaoMatch = nfe.match(/<DataEmissaoNFe>([^<]+)<\/DataEmissaoNFe>/i) || nfe.match(/<DataEmissao>([^<]+)<\/DataEmissao>/i);
    const numeroRpsMatch = nfe.match(/<NumeroRPS>([^<]+)<\/NumeroRPS>/i) || nfe.match(/<NumeroRps>([^<]+)<\/NumeroRps>/i);
    const serieRpsMatch = nfe.match(/<SerieRPS>([^<]+)<\/SerieRPS>/i) || nfe.match(/<SerieRps>([^<]+)<\/SerieRps>/i);
    const statusNfeMatch = nfe.match(/<StatusNFe>([^<]+)<\/StatusNFe>/i);
    let status = "autorizada";
    const statusNfe = statusNfeMatch?.[1];
    if (statusNfe === "C") status = "cancelada";
    else if (statusNfe === "E") status = "cancelada";

    const valorServicosMatch = nfe.match(/<ValorServicos>([^<]+)<\/ValorServicos>/i);
    const valorDeducoesMatch = nfe.match(/<ValorDeducoes>([^<]+)<\/ValorDeducoes>/i);
    const valorIssMatch = nfe.match(/<ValorISS>([^<]+)<\/ValorISS>/i) || nfe.match(/<ValorIss>([^<]+)<\/ValorIss>/i);
    const baseCalculoMatch = nfe.match(/<BaseCalculo>([^<]+)<\/BaseCalculo>/i);
    const aliquotaMatch = nfe.match(/<AliquotaServicos>([^<]+)<\/AliquotaServicos>/i) || nfe.match(/<Aliquota>([^<]+)<\/Aliquota>/i);
    const issRetidoMatch = nfe.match(/<ISSRetido>([^<]+)<\/ISSRetido>/i);
    const issRetido = issRetidoMatch?.[1]?.toLowerCase() === "true" || issRetidoMatch?.[1] === "1";

    const tomadorRazaoMatch = nfe.match(/<RazaoSocialTomador>([^<]+)<\/RazaoSocialTomador>/i);
    const tomadorCnpjMatch = nfe.match(/<CPFCNPJTomador>[\s\S]*?<CNPJ>([^<]+)<\/CNPJ>/i) || nfe.match(/<CnpjTomador>([^<]+)<\/CnpjTomador>/i);
    const tomadorCpfMatch = nfe.match(/<CPFCNPJTomador>[\s\S]*?<CPF>([^<]+)<\/CPF>/i);

    const prestadorCnpjMatch = nfe.match(/<CPFCNPJPrestador>[\s\S]*?<CNPJ>([^<]+)<\/CNPJ>/i) || cleanXml.match(/<CNPJ>([^<]+)<\/CNPJ>/i);
    const prestadorIMMatch = inscricaoPrestadorMatch || nfe.match(/<InscricaoPrestador>([^<]+)<\/InscricaoPrestador>/i);

    const discriminacaoMatch = nfe.match(/<Discriminacao>([^<]+)<\/Discriminacao>/i);
    const codigoServicoMatch = nfe.match(/<CodigoServico>([^<]+)<\/CodigoServico>/i);

    const numeroLoteMatch = cleanXml.match(/<NumeroLote>([^<]+)<\/NumeroLote>/i);

    return {
      sucesso: sucesso || !!numeroNfeMatch,
      numeroNfse: numeroNfeMatch?.[1],
      numeroRps: numeroRpsMatch?.[1],
      serieRps: serieRpsMatch?.[1],
      numeroLote: numeroLoteMatch?.[1],
      codigoVerificacao: codigoVerificacaoMatch?.[1],
      dataEmissao: dataEmissaoMatch?.[1],
      status,
      valorServicos: valorServicosMatch?.[1],
      valorDeducoes: valorDeducoesMatch?.[1],
      valorIss: valorIssMatch?.[1],
      baseCalculo: baseCalculoMatch?.[1],
      aliquotaIss: aliquotaMatch?.[1],
      issRetido,
      tomador: { razaoSocial: tomadorRazaoMatch?.[1] || "", cnpjCpf: tomadorCnpjMatch?.[1] || tomadorCpfMatch?.[1] || "" },
      prestador: { cnpj: prestadorCnpjMatch?.[1] || "", inscricaoMunicipal: prestadorIMMatch?.[1] || "" },
      discriminacao: discriminacaoMatch?.[1],
      itemListaServico: codigoServicoMatch?.[1],
      xmlRetorno: xml,
      mensagens: erros.length > 0 ? erros : sucesso || numeroNfeMatch ? [{ codigo: "0000", mensagem: "Consulta realizada com sucesso", tipo: "Sucesso" }] : [{ codigo: "WARN", mensagem: "Resposta sem dados de NFSe", tipo: "Aviso" }],
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

// --- Handler ---
serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing authorization" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseAuth = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let certDigital: CertificadoDigital | null = null;
    let numeroNFe = body.numeroNFe || body.numeroNfse || "";
    let numeroRps = body.numeroRps || "";
    let cnpj = body.cnpj || "";
    let im = body.inscricaoMunicipal || "";
    let operacao = body.operacao || "ConsultaNFe";
    let notaId: string | undefined = body.notaId;

    if (notaId) {
      const { data: nota, error: notaError } = await supabase.from("notas_fiscais_servico").select("*").eq("id", notaId).eq("user_id", user.id).single();
      if (notaError || !nota) throw new Error("Nota nao encontrada");
      numeroNFe = nota.numero_nota || nota.numero_rps || "";
      numeroRps = nota.numero_rps || "";
      // Dados do prestador da propria nota (fallback se nao houver certificado)
      cnpj = nota.cnpj_prestador || nota.cnpj || "";
      im = nota.inscricao_municipal || nota.inscricao_municipal_prestador || "";

      if (nota.certificado_id) {
        const { data: cert, error: certError } = await supabase.from("certificados_nfse").select("*").eq("id", nota.certificado_id).single();
        if (!certError && cert && cert.arquivo_pfx) {
          certDigital = await carregarCertificado(cert.arquivo_pfx, cert.senha || "");
          certDigital.inscricaoMunicipal = cert.inscricao_municipal || "";
          certDigital.cnpj = cert.cnpj || certDigital.cnpj || "";
          // Sobrescreve com dados do certificado se existirem
          if (certDigital.cnpj) cnpj = certDigital.cnpj;
          if (certDigital.inscricaoMunicipal) im = certDigital.inscricaoMunicipal;
        } else if (certError) {
          console.log("[consultar-nfse] Certificado", nota.certificado_id, "nao encontrado, usando dados da nota");
        }
      }
    } else if (body.certificadoId) {
      const { data: cert, error: certError } = await supabase.from("certificados_nfse").select("*").eq("id", body.certificadoId).single();
      if (certError || !cert || !cert.arquivo_pfx) throw new Error("Certificado nao encontrado");
      certDigital = await carregarCertificado(cert.arquivo_pfx, cert.senha || "");
      certDigital.inscricaoMunicipal = cert.inscricao_municipal || "";
      certDigital.cnpj = cert.cnpj || certDigital.cnpj || "";
      cnpj = certDigital.cnpj;
      im = certDigital.inscricaoMunicipal;
    } else {
      cnpj = body.cnpj || "";
      im = body.inscricaoMunicipal || "";
    }

    const ambiente = getAmbiente();

    // Homologacao
    if (ambiente === "homologacao" && body.modo !== "real") {
      return new Response(JSON.stringify({
        sucesso: true,
        numeroNfse: numeroNFe || "99999",
        numeroRps: numeroRps || "12345",
        codigoVerificacao: "HOM-VERIF-12345",
        dataEmissao: new Date().toISOString(),
        status: "autorizada",
        valorServicos: "0",
        mensagens: [{ codigo: "H001", mensagem: "Homologacao mock - API Paulistana", tipo: "Sucesso" }],
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Validar dados obrigatorios
    const numeroConsulta = numeroNFe || numeroRps || body.numero || body.numeroNfse || "";
    const camposFaltantes = [];
    if (!cnpj) camposFaltantes.push("CNPJ do prestador");
    if (!im) camposFaltantes.push("Inscricao Municipal do prestador");
    if (!numeroConsulta) camposFaltantes.push("Numero da NFSe ou RPS");

    if (camposFaltantes.length > 0) {
      console.log("[consultar-nfse] Dados faltantes:", camposFaltantes, "| notaId:", notaId, "| cnpj:", cnpj, "| im:", im, "| numero:", numeroConsulta);
      throw new Error(`Dados obrigatorios faltantes: ${camposFaltantes.join(", ")}. Verifique se a nota foi emitida corretamente.`);
    }

    if (!certDigital && ambiente === "producao") {
      throw new Error("Certificado digital obrigatorio em producao");
    }

    // Montar XML de consulta
    let xmlDados = "";
    if (operacao === "ConsultaNFe") {
      xmlDados = xmlPedidoConsultaNFe(cnpj, numeroConsulta, im);
    } else if (operacao === "ConsultaNFePeriodo") {
      xmlDados = xmlPedidoConsultaNFePeriodo(cnpj, im, body.dataInicio, body.dataFim, body.cnpjTomador, body.cpfTomador);
    } else {
      throw new Error("Operacao nao suportada: " + operacao);
    }

    // Assinar XML (SHA-1)
    let xmlAssinado = xmlDados;
    if (certDigital && ambiente === "producao") {
      xmlAssinado = assinarXmlSHA1(xmlDados, certDigital, "Lote1");
      console.log("[consultar-nfse] XML assinado (primeiros 1000 chars):", xmlAssinado.substring(0, 1000));
    }

    // Construir envelope SOAP 1.1 Paulistana
    const soapEnvelope = criarEnvelopeSOAP11Paulistana(operacao, xmlAssinado);
    const soapAction = "http://www.prefeitura.sp.gov.br/nfe/" + operacao;

    console.log(`[consultar-nfse] Operacao: ${operacao} | Ambiente: ${ambiente} | Provider: paulistana`);
    console.log("[consultar-nfse] Envelope SOAP (primeiros 500 chars):", soapEnvelope.substring(0, 500));

    // Enviar requisicao
    let soapResponse: string;
    try {
      soapResponse = await retry(() => enviarRequisicaoSOAP(soapEnvelope, soapAction, certDigital || undefined));
    } catch (err: any) {
      console.error("[consultar-nfse] Erro ao enviar SOAP:", err.message);

      let analiseIA = null;
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
              { role: "system", content: "Voce e um especialista em integracao SOAP API Paulistana (Prefeitura de SP). Analise o erro e sugira: 1) Causa provavel, 2) Acao corretiva. Retorne APENAS JSON { erroProvavel: string, acaoSugerida: string }." },
              { role: "user", content: `Erro: ${err.message}\n\nOperacao: ${operacao}\nAmbiente: ${ambiente}\nURL: ${PAULISTANA_URL}` },
            ],
            temperature: 0.1,
          }),
        });
        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          try {
            analiseIA = JSON.parse(content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim());
          } catch { /* ignora */ }
        }
      } catch { /* ignora */ }

      return new Response(JSON.stringify({
        sucesso: false,
        mensagens: [{ codigo: "SOAP_ERROR", mensagem: err.message, tipo: "Erro" }],
        analiseIA,
        xmlEnvio: xmlDados,
        xmlBruto: soapEnvelope.substring(0, 3000),
      }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log("[consultar-nfse] Resposta (primeiros 500 chars):", soapResponse.substring(0, 500));

    const resultado = parsearRespostaConsultaPaulistana(soapResponse);
    const resultadoFinal = {
      ...resultado,
      xmlEnvio: xmlDados,
      xmlBruto: soapResponse.substring(0, 8000),
      operacaoUsada: operacao,
      formatoUsado: "SOAP11_PAULISTANA",
      provider: "paulistana",
    };

    if (!resultado.sucesso) {
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
              { role: "system", content: "Voce e um especialista em parsing XML API Paulistana (Prefeitura de SP). Analise a resposta e sugira: 1) Erro provavel, 2) Acao corretiva. Retorne APENAS JSON { erroProvavel: string, acaoSugerida: string }." },
              { role: "user", content: `Resposta:\n${soapResponse.substring(0, 3000)}` },
            ],
            temperature: 0.1,
          }),
        });
        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          try {
            (resultadoFinal as any).analiseIA = JSON.parse(content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim());
          } catch { /* ignora */ }
        }
      } catch { /* ignora */ }
    }

    // Atualizar banco se veio de notaId
    if (notaId && resultado.sucesso) {
      const updateData: any = { updated_at: new Date().toISOString() };
      if (resultado.numeroNfse) updateData.numero_nota = resultado.numeroNfse;
      if (resultado.codigoVerificacao) updateData.codigo_verificacao = resultado.codigoVerificacao;
      if (resultado.dataEmissao) updateData.data_autorizacao = resultado.dataEmissao;
      if (resultado.status) updateData.status = resultado.status === "substituida" ? "cancelada" : resultado.status;
      await supabase.from("notas_fiscais_servico").update(updateData).eq("id", notaId).eq("user_id", user.id);
    }

    return new Response(JSON.stringify(resultadoFinal), { status: resultado.sucesso ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("[consultar-nfse] Erro geral:", err);
    return new Response(JSON.stringify({ sucesso: false, mensagens: [{ codigo: "ERROR", mensagem: (err as Error).message, tipo: "Erro" }] }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
