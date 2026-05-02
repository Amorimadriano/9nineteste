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

// --- XML builders (ABRASF v3) ---

function xmlConsultaPorRps(numeroRps: string, serie: string, tipo: string, cnpj: string, im: string): string {
  const tipoCodigo = tipo === "RPS" || tipo === "1" ? "1" : tipo === "2" ? "2" : tipo === "3" ? "3" : "1";
  return `<ConsultarNfseRpsEnvio xmlns="http://www.ginfes.com.br/servico_consultar_nfse_rps_envio_v03.xsd">
  <IdentificacaoRps>
    <Numero>${numeroRps}</Numero>
    <Serie>${serie}</Serie>
    <Tipo>${tipoCodigo}</Tipo>
  </IdentificacaoRps>
  <Prestador>
    <Cnpj>${cnpj}</Cnpj>
    <InscricaoMunicipal>${im}</InscricaoMunicipal>
  </Prestador>
</ConsultarNfseRpsEnvio>`;
}

function xmlConsultaServicoPrestado(cnpj: string, im: string, dataInicio?: string, dataFim?: string, cnpjTomador?: string, cpfTomador?: string): string {
  let xml = `<ConsultarNfseServicoPrestadoEnvio xmlns="http://www.ginfes.com.br/servico_consultar_nfse_servico_prestado_envio_v03.xsd">
  <Prestador>
    <Cnpj>${cnpj}</Cnpj>
    <InscricaoMunicipal>${im}</InscricaoMunicipal>
  </Prestador>`;
  if (cnpjTomador || cpfTomador) {
    xml += `\n  <Tomador>\n    <CpfCnpj>`;
    if (cnpjTomador) xml += `\n      <Cnpj>${cnpjTomador}</Cnpj>`;
    if (cpfTomador) xml += `\n      <Cpf>${cpfTomador}</Cpf>`;
    xml += `\n    </CpfCnpj>\n  </Tomador>`;
  }
  if (dataInicio) {
    xml += `\n  <Periodo>\n    <DataInicial>${dataInicio}</DataInicial>\n    <DataFinal>${dataFim || dataInicio}</DataFinal>\n  </Periodo>`;
  }
  xml += `\n</ConsultarNfseServicoPrestadoEnvio>`;
  return xml;
}

function criarCabecalhoGinfes(): string {
  return `<cabecalho xmlns="http://www.ginfes.com.br/cabecalho_v03.xsd" versao="3"><versaoDados>3</versaoDados></cabecalho>`;
}

// Envelope SOAP 1.1 padrao GINFES (exatamente como a documentacao)
function criarEnvelopeSOAP11(soapAction: string, xmlDados: string, xmlAssinado?: string): string {
  const xmlPayload = xmlAssinado || xmlDados;
  const cabecalho = criarCabecalhoGinfes();

  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <soapenv:Body>
    <${soapAction} xmlns="http://ws.opus.com.br">
      <arg0><![CDATA[${cabecalho}]]></arg0>
      <arg1><![CDATA[${xmlPayload}]]></arg1>
    </${soapAction}>
  </soapenv:Body>
</soapenv:Envelope>`;
}

// --- Assinatura digital XMLDSig ---

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

function assinarXml(xml: string, certificado: CertificadoDigital, idReferencia: string): string {
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

function getAmbiente(): "homologacao" | "producao" {
  return (Deno.env.get("NFSE_AMBIENTE") || "homologacao") as "homologacao" | "producao";
}

const GINFES_URLS = {
  homologacao: "https://homologacao.ginfes.com.br/ServiceGinfesImpl",
  producao: "https://producao.ginfes.com.br/ServiceGinfesImpl",
};

async function enviarRequisicaoSOAP(soapEnvelope: string, soapAction: string, certificado?: { certPem: string; keyPem: string }): Promise<string> {
  const env = getAmbiente();

  if (env === "homologacao") {
    const response = await fetch(GINFES_URLS[env], {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=UTF-8",
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
  const proxyUrl = Deno.env.get("MTLS_PROXY_URL");
  if (!proxyUrl) throw new Error("MTLS_PROXY_URL nao configurada");
  const proxyApiKey = Deno.env.get("MTLS_PROXY_API_KEY") || "";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (proxyApiKey) headers["X-API-Key"] = proxyApiKey;

  const proxyResponse = await fetch(`${proxyUrl}/proxy-ginfes`, {
    method: "POST",
    headers,
    body: JSON.stringify({ soapEnvelope, soapAction, certPem: certificado.certPem, keyPem: certificado.keyPem, ambiente: env }),
  });
  if (!proxyResponse.ok) {
    const text = await proxyResponse.text();
    throw new Error(`Erro proxy mTLS (${proxyResponse.status}): ${text.substring(0, 500)}`);
  }
  return await proxyResponse.text();
}

// --- Parser de resposta ---

function parsearErros(xml: string): Array<{ codigo: string; mensagem: string; tipo: string }> {
  const erros: Array<{ codigo: string; mensagem: string; tipo: string }> = [];
  const ERROS_GINFES: Record<string, string> = {
    E1: "CNPJ invalido", E2: "Inscricao Municipal invalida", E26: "NFS-e nao encontrada",
    E28: "Certificado invalido", E29: "Assinatura invalida", E30: "XML mal formatado",
    E50: "Erro interno", E60: "Requisicao mal formada",
  };
  const mensagens = [...xml.matchAll(/<Mensagem[^>]*>([^<]+)<\/Mensagem>/gi)].map(m => m[1]);
  const codigos = [...xml.matchAll(/<Codigo[^>]*>([^<]+)<\/Codigo>/gi)].map(m => m[1]);
  for (let i = 0; i < Math.max(mensagens.length, codigos.length); i++) {
    erros.push({ codigo: codigos[i] || "ERR_UNKNOWN", mensagem: ERROS_GINFES[codigos[i] || ""] || mensagens[i] || "Erro desconhecido", tipo: "Erro" });
  }
  const faultMatch = xml.match(/<faultstring>([^<]+)<\/faultstring>/i);
  if (faultMatch && erros.length === 0) erros.push({ codigo: "SOAP_FAULT", mensagem: faultMatch[1], tipo: "Erro" });
  return erros;
}

function parsearRespostaConsulta(xml: string) {
  try {
    let workXml = xml;
    const cdataMatch = xml.match(/<return[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/return>/i);
    if (cdataMatch) workXml = cdataMatch[1];
    if (!cdataMatch && workXml.includes("&lt;")) {
      workXml = workXml.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
    }
    const cleanXml = workXml.replace(/<\/?[a-zA-Z0-9_]+:/g, m => (m.startsWith("</") ? "</" : "<"));

    const erros = parsearErros(cleanXml);
    if (erros.length > 0 && !cleanXml.includes("<CompNfse") && !cleanXml.includes("<InfNfse") && !cleanXml.includes("<Numero")) {
      return { sucesso: false, xmlRetorno: xml, mensagens: erros };
    }

    const infNfseMatch = cleanXml.match(/<InfNfse[^>]*>([\s\S]*?)<\/InfNfse>/i);
    const infNfse = infNfseMatch ? infNfseMatch[1] : cleanXml;

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
    const issRetido = issRetidoMatch?.[1] === "1" || issRetidoMatch?.[1]?.toLowerCase() === "sim";

    const tomadorRazaoMatch = cleanXml.match(/<TomadorServico>[\s\S]*?<RazaoSocial>([^<]+)<\/RazaoSocial>/i) || cleanXml.match(/<Tomador>[\s\S]*?<RazaoSocial>([^<]+)<\/RazaoSocial>/i);
    const tomadorCnpjMatch = cleanXml.match(/<TomadorServico>[\s\S]*?<Cnpj>([^<]+)<\/Cnpj>/i) || cleanXml.match(/<Tomador>[\s\S]*?<Cnpj>([^<]+)<\/Cnpj>/i);
    const tomadorCpfMatch = cleanXml.match(/<TomadorServico>[\s\S]*?<Cpf>([^<]+)<\/Cpf>/i) || cleanXml.match(/<Tomador>[\s\S]*?<Cpf>([^<]+)<\/Cpf>/i);

    const prestadorCnpjMatch = cleanXml.match(/<PrestadorServico>[\s\S]*?<Cnpj>([^<]+)<\/Cnpj>/i) || cleanXml.match(/<Prestador>[\s\S]*?<Cnpj>([^<]+)<\/Cnpj>/i);
    const prestadorIMMatch = cleanXml.match(/<PrestadorServico>[\s\S]*?<InscricaoMunicipal>([^<]+)<\/InscricaoMunicipal>/i) || cleanXml.match(/<Prestador>[\s\S]*?<InscricaoMunicipal>([^<]+)<\/InscricaoMunicipal>/i);

    let linkNfse = (cleanXml.match(/<LinkNfse>([^<]+)<\/LinkNfse>/i) || cleanXml.match(/<linkNfse>([^<]+)<\/linkNfse>/i))?.[1];
    if (!linkNfse && numeroNfse && codigoVerificacaoMatch?.[1]) {
      const baseUrl = getAmbiente() === "producao" ? "https://producao.ginfes.com.br" : "https://homologacao.ginfes.com.br";
      linkNfse = `${baseUrl}/VisualizarNfse?num=${numeroNfse}&cod=${codigoVerificacaoMatch[1]}`;
    }

    const discriminacaoMatch = cleanXml.match(/<Discriminacao>([^<]+)<\/Discriminacao>/i);
    const itemListaServicoMatch = cleanXml.match(/<ItemListaServico>([^<]+)<\/ItemListaServico>/i);

    const sucesso = !!numeroNfse || cleanXml.includes("<CompNfse");

    return {
      sucesso,
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
      tomador: { razaoSocial: tomadorRazaoMatch?.[1] || "", cnpjCpf: tomadorCnpjMatch?.[1] || tomadorCpfMatch?.[1] || "" },
      prestador: { cnpj: prestadorCnpjMatch?.[1] || "", inscricaoMunicipal: prestadorIMMatch?.[1] || "" },
      linkPdf: (cleanXml.match(/<LinkPdf>([^<]+)<\/LinkPdf>/i) || cleanXml.match(/<linkPdf>([^<]+)<\/linkPdf>/i))?.[1],
      linkXml: (cleanXml.match(/<LinkXml>([^<]+)<\/LinkXml>/i) || cleanXml.match(/<linkXml>([^<]+)<\/linkXml>/i))?.[1],
      linkNfse,
      discriminacao: discriminacaoMatch?.[1],
      itemListaServico: itemListaServicoMatch?.[1],
      xmlRetorno: xml,
      mensagens: erros.length > 0 ? erros : sucesso ? [{ codigo: "0000", mensagem: "Consulta realizada com sucesso", tipo: "Sucesso" }] : undefined,
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
serve(async (req) => {
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
    let numeroRps = body.numeroRps || "";
    let serie = body.serie || "1";
    let tipo = body.tipo || "RPS";
    let cnpj = body.cnpj || "";
    let im = body.inscricaoMunicipal || "";
    let operacao = body.operacao || "ConsultarNfsePorRpsV3";
    let notaId: string | undefined = body.notaId;

    if (notaId) {
      const { data: nota, error: notaError } = await supabase.from("notas_fiscais_servico").select("*").eq("id", notaId).eq("user_id", user.id).single();
      if (notaError || !nota) throw new Error("Nota nao encontrada");
      numeroRps = nota.numero_rps || nota.numero_nota || "";
      serie = nota.serie || "1";
      tipo = nota.tipo_rps || "RPS";

      if (nota.certificado_id) {
        const { data: cert, error: certError } = await supabase.from("certificados_nfse").select("*").eq("id", nota.certificado_id).single();
        if (!certError && cert && cert.arquivo_pfx) {
          certDigital = await carregarCertificado(cert.arquivo_pfx, cert.senha || "");
          certDigital.inscricaoMunicipal = cert.inscricao_municipal || "";
          certDigital.cnpj = cert.cnpj || certDigital.cnpj || "";
          cnpj = certDigital.cnpj;
          im = certDigital.inscricaoMunicipal;
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
        numeroNfse: numeroRps || "99999",
        codigoVerificacao: "HOM-VERIF-12345",
        dataEmissao: new Date().toISOString(),
        status: "autorizada",
        valorServicos: "0",
        mensagens: [{ codigo: "H001", mensagem: "Homologacao mock", tipo: "Sucesso" }],
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!certDigital && (!cnpj || !im)) {
      throw new Error("CNPJ e Inscricao Municipal sao obrigatorios para consulta");
    }

    // Construir XML ABRASF
    let xmlDados = "";
    if (operacao === "ConsultarNfseServicoPrestadoV3") {
      xmlDados = xmlConsultaServicoPrestado(cnpj, im, body.dataInicio, body.dataFim, body.cnpjTomador, body.cpfTomador);
    } else {
      xmlDados = xmlConsultaPorRps(numeroRps, serie, tipo, cnpj, im);
      operacao = "ConsultarNfsePorRpsV3";
    }

    // Assinar XML (obrigatorio em producao, opcional em homologacao)
    let xmlAssinado = xmlDados;
    if (certDigital && ambiente === "producao") {
      const idRef = `RPS${numeroRps}`;
      xmlAssinado = assinarXml(xmlDados, certDigital, idRef);
    }

    // Construir envelope SOAP 1.1 padrao GINFES
    const soapEnvelope = criarEnvelopeSOAP11(operacao, xmlDados, xmlAssinado);

    console.log(`[consultar-nfse] Operacao: ${operacao} | Ambiente: ${ambiente}`);
    console.log("[consultar-nfse] Envelope SOAP (primeiros 500 chars):", soapEnvelope.substring(0, 500));

    // Enviar requisicao
    let soapResponse: string;
    try {
      soapResponse = await retry(() => enviarRequisicaoSOAP(soapEnvelope, operacao, certDigital || undefined));
    } catch (err: any) {
      console.error("[consultar-nfse] Erro ao enviar SOAP:", err.message);

      // Analise IA do erro via orquestrador
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
              { role: "system", content: "Voce e um especialista em integracao SOAP GINFES. Analise o erro e sugira: 1) Causa provavel, 2) Acao corretiva. Retorne APENAS JSON { erroProvavel: string, acaoSugerida: string }." },
              { role: "user", content: `Erro: ${err.message}\n\nOperacao: ${operacao}\nAmbiente: ${ambiente}` },
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

    const resultado = parsearRespostaConsulta(soapResponse);
    const resultadoFinal = {
      ...resultado,
      xmlEnvio: xmlDados,
      xmlBruto: soapResponse.substring(0, 8000),
      operacaoUsada: operacao,
      formatoUsado: "SOAP11_GINFES_PADRAO",
    };

    // Analise IA para erros ambiguos
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
              { role: "system", content: "Voce e um especialista em parsing XML GINFES. Analise a resposta e sugira: 1) Erro provavel, 2) Acao corretiva. Retorne APENAS JSON { erroProvavel: string, acaoSugerida: string }." },
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
      if (resultado.dataAutorizacao) updateData.data_autorizacao = resultado.dataAutorizacao;
      if (resultado.linkPdf) updateData.link_pdf = resultado.linkPdf;
      if (resultado.linkXml) updateData.link_xml = resultado.linkXml;
      if (resultado.linkNfse) updateData.link_nfse = resultado.linkNfse;
      if (resultado.status) updateData.status = resultado.status === "substituida" ? "cancelada" : resultado.status;
      await supabase.from("notas_fiscais_servico").update(updateData).eq("id", notaId).eq("user_id", user.id);
    }

    return new Response(JSON.stringify(resultadoFinal), { status: resultado.sucesso ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("[consultar-nfse] Erro geral:", err);
    return new Response(JSON.stringify({ sucesso: false, mensagens: [{ codigo: "ERROR", mensagem: (err as Error).message, tipo: "Erro" }] }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
