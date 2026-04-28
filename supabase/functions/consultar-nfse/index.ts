import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ============================================
// INLINED: NFS-e GINFES Client Module (consulta)
// ============================================

interface CertificadoDigital {
  pfxBase64: string;
  senha: string;
  cnpj: string;
  inscricaoMunicipal: string;
  razaoSocial: string;
  certPem: string;
  keyPem: string;
  validoAte: Date;
}

const ABRASF_NAMESPACES = {
  servicoConsultar: "http://www.ginfes.com.br/servico_consultar_nfse_rps_envio_v03.xsd",
};

function canonicalizeXml(xml: string): string {
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

async function carregarCertificado(pfxBase64: string, senha: string): Promise<CertificadoDigital> {
  const forgeModule = await import("https://esm.sh/node-forge@1.3.1");
  const forge: any = forgeModule.default?.util ? forgeModule.default
    : forgeModule.util ? forgeModule
    : (forgeModule as any).default?.default?.util ? (forgeModule as any).default.default
    : forgeModule;
  (globalThis as any).forge = forge;

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

    // ICP-Brasil: CNPJ no OID 2.16.76.4.3.3
    const icpCnpjAttr = subject.attributes.find((a: any) => a.oid === "2.16.76.4.3.3");
    if (icpCnpjAttr) {
      const digits = icpCnpjAttr.value.replace(/\D/g, "");
      if (digits.length >= 14) {
        cnpj = digits.substring(digits.length - 14);
      }
    }

    // Fallback: CNPJ em OU
    if (!cnpj) {
      const ouAttr = subject.attributes.find((a: any) =>
        a.oid === "2.5.4.11" && /CNPJ/i.test(a.value)
      );
      if (ouAttr) {
        const cnpjMatch = ouAttr.value.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
        if (cnpjMatch) cnpj = cnpjMatch[0].replace(/\D/g, "");
      }
    }

    // Fallback: CNPJ no CN
    if (!cnpj) {
      const cnAttr = subject.attributes.find((a: any) => a.shortName === "CN");
      if (cnAttr) {
        const cnpjMatch = cnAttr.value.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
        if (cnpjMatch) cnpj = cnpjMatch[0].replace(/\D/g, "");
      }
    }

    // Fallback: serialNumber (OID 2.5.4.5)
    if (!cnpj) {
      const serialAttr = subject.attributes.find((a: any) => a.oid === "2.5.4.5");
      if (serialAttr) {
        const digits = serialAttr.value.replace(/\D/g, "");
        if (digits.length >= 14) {
          cnpj = digits.substring(digits.length - 14);
        }
      }
    }

    // Fallback: 14 digitos consecutivos em qualquer atributo
    if (!cnpj) {
      for (const attr of subject.attributes) {
        const digits = (attr.value || "").replace(/\D/g, "");
        if (digits.length >= 14) {
          cnpj = digits.substring(digits.length - 14);
          break;
        }
      }
    }

    // Fallback: subjectAltName
    if (!cnpj && cert.cert!.extensions) {
      for (const ext of cert.cert!.extensions) {
        if (ext.name === "subjectAltName" && (ext as any).altNames) {
          for (const altName of (ext as any).altNames) {
            if (altName.type === 6 && typeof altName.value === "string") {
              const match = altName.value.match(/(\d{14})/);
              if (match) { cnpj = match[1]; break; }
            }
          }
        }
        if (cnpj) break;
      }
    }
  }

  // Extrair chave privada
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
      const keyBags2 = p12.getBags({ bagType: forge.pki.oids.keyBag });
      if (keyBags2[forge.pki.oids.keyBag]) {
        const key = keyBags2[forge.pki.oids.keyBag]![0];
        keyPem = forge.pki.privateKeyToPem(key.key!);
      }
    }
  }

  if (!certPem || !keyPem) {
    throw new Error("Nao foi possivel extrair certificado ou chave privada do arquivo PFX");
  }

  return { pfxBase64, senha, cnpj, inscricaoMunicipal: "", razaoSocial, certPem, keyPem, validoAte };
}

/**
 * Constroi XML de consulta NFS-e por RPS (ABRASF 2.04 / GINFES v03)
 */
function construirXmlConsultaRps(numeroRps: string, serie: string, tipo: string, cnpj: string, inscricaoMunicipal: string): string {
  const consultaId = `CONSULTA${numeroRps}`;
  return `<ConsultarNfseRpsEnvio xmlns="${ABRASF_NAMESPACES.servicoConsultar}" Id="${consultaId}">
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

function assinarXml(xml: string, certificado: CertificadoDigital, idReferencia: string): string {
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

function criarEnvelopeSOAPGinfes(soapAction: string, cabecalhoXml: string, dadosXml: string, ambiente?: string): string {
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

function criarCabecalhoGinfes(): string {
  return `<cabecalho xmlns="http://www.ginfes.com.br/cabecalho_v03.xsd" versao="3"><versaoDados>3</versaoDados></cabecalho>`;
}

function getAmbiente(): "homologacao" | "producao" {
  return (Deno.env.get("NFSE_AMBIENTE") || "homologacao") as "homologacao" | "producao";
}

const GINFES_URLS = {
  homologacao: "https://homologacao.ginfes.com.br/ServiceGinfesImpl",
  producao: "https://producao.ginfes.com.br/ServiceGinfesImpl",
};

async function enviarRequisicaoSOAP(
  soapEnvelope: string,
  certificado?: { certPem: string; keyPem: string },
): Promise<string> {
  const env = getAmbiente();

  if (env === "homologacao") {
    const response = await fetch(GINFES_URLS[env], {
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
    throw new Error("Certificado digital e obrigatorio para consulta em producao.");
  }

  const proxyUrl = Deno.env.get("MTLS_PROXY_URL");
  const proxyApiKey = Deno.env.get("MTLS_PROXY_API_KEY") || "";

  if (!proxyUrl) {
    throw new Error(
      "Variavel MTLS_PROXY_URL nao configurada. " +
      "A consulta em producao requer um proxy mTLS. " +
      "Configure a URL do proxy nas variaveis de ambiente do Supabase."
    );
  }

  console.log("consultar-nfse: enviando via proxy mTLS para", proxyUrl);

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

function parsearErros(xml: string): Array<{ codigo: string; mensagem: string; tipo: string }> {
  const erros: Array<{ codigo: string; mensagem: string; tipo: string }> = [];
  const ERROS_GINFES: Record<string, string> = {
    E1: "CNPJ do prestador invalido", E2: "Inscricao Municipal do prestador invalida",
    E26: "NFS-e nao encontrada", E27: "Cancelamento nao permitido",
    E28: "Certificado digital invalido", E29: "Assinatura digital invalida",
    E30: "Arquivo XML mal formatado", E31: "Acesso negado", E32: "Prazo de cancelamento excedido",
    E50: "Erro interno do servidor", E60: "Requisicao mal formada",
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

/**
 * Parse GINFES ConsultaNfseRps response
 * Extracts NFS-e details from <CompNfse> element
 */
function parsearRespostaConsulta(xml: string) {
  try {
    // Strip XML namespaces to simplify regex parsing (e.g. <tip:Numero> -> <Numero>)
    const cleanXml = xml.replace(/<\/?[a-zA-Z0-9]+:/g, (match) => {
      // Remove namespace prefix from opening/closing tags: <ns2:Element> -> <Element>
      return match.startsWith("</") ? "</" : "<";
    });

    const erros = parsearErros(cleanXml);
    if (erros.length > 0 && !cleanXml.includes("<CompNfse") && !cleanXml.includes("<InfNfse") && !cleanXml.includes("<Numero")) {
      return { sucesso: false, xmlRetorno: xml, mensagens: erros };
    }

    // Extract InfNfse section (contains the NFS-e data)
    const infNfseMatch = cleanXml.match(/<InfNfse[^>]*>([\s\S]*?)<\/InfNfse>/i);
    const infNfse = infNfseMatch ? infNfseMatch[1] : cleanXml;

    // Extract NFS-e number - look inside InfNfse, NOT inside IdentificacaoRps
    // In ABRASF, <Numero> appears twice: first as NFS-e number, then as RPS number inside <IdentificacaoRps>
    // We want the FIRST <Numero> which is the NFS-e number
    const numeroNfseMatch = infNfse.match(/<NumeroNfse>([^<]+)<\/NumeroNfse>/i);
    let numeroNfse: string | undefined;
    if (numeroNfseMatch) {
      numeroNfse = numeroNfseMatch[1];
    } else {
      // Find <Numero> that is NOT inside <IdentificacaoRps>
      // Strategy: find all <Numero> matches, prefer the one before <IdentificacaoRps>
      const beforeRps = infNfse.split(/<IdentificacaoRps/i)[0];
      const numeroMatch = beforeRps.match(/<Numero>([^<]+)<\/Numero>/i);
      numeroNfse = numeroMatch?.[1];
    }

    // Extract verification code
    const codigoVerificacaoMatch = infNfse.match(/<CodigoVerificacao>([^<]+)<\/CodigoVerificacao>/i);
    const codigoVerificacao = codigoVerificacaoMatch?.[1];

    // Extract emission date
    const dataEmissaoMatch = infNfse.match(/<DataEmissaoNfse>([^<]+)<\/DataEmissaoNfse>/i)
      || infNfse.match(/<DataEmissao>([^<]+)<\/DataEmissao>/i);
    const dataEmissao = dataEmissaoMatch?.[1];

    // Extract authorization date
    const dataAutorizacaoMatch = infNfse.match(/<DataAutorizacao>([^<]+)<\/DataAutorizacao>/i)
      || infNfse.match(/<DataEmissaoNfse>([^<]+)<\/DataEmissaoNfse>/i);
    const dataAutorizacao = dataAutorizacaoMatch?.[1];

    // Extract situacao (1=Normal/Active, 2=Cancelled, 3=Substituted)
    const situacaoMatch = infNfse.match(/<SituacaoNfse>([^<]+)<\/SituacaoNfse>/i)
      || infNfse.match(/<Situacao>([^<]+)<\/Situacao>/i);
    const situacao = situacaoMatch?.[1];
    let status: string;
    if (situacao === "2") {
      status = "cancelada";
    } else if (situacao === "3") {
      status = "substituida";
    } else {
      status = "autorizada";
    }

    // Extract service value
    const valorServicosMatch = infNfse.match(/<ValorServicos>([^<]+)<\/ValorServicos>/i);
    const valorServicos = valorServicosMatch?.[1];

    // Extract ISS value
    const valorIssMatch = infNfse.match(/<ValorIss>([^<]+)<\/ValorIss>/i);
    const valorIss = valorIssMatch?.[1];

    // Extract base calculation
    const baseCalculoMatch = infNfse.match(/<BaseCalculo>([^<]+)<\/BaseCalculo>/i);
    const baseCalculo = baseCalculoMatch?.[1];

    // Extract ISS rate
    const aliquotaMatch = infNfse.match(/<Aliquota>([^<]+)<\/Aliquota>/i);
    const aliquotaIss = aliquotaMatch?.[1];

    // Extract ISS retained
    const issRetidoMatch = infNfse.match(/<IssRetido>([^<]+)<\/IssRetido>/i);
    const issRetido = issRetidoMatch?.[1] === "1" || issRetidoMatch?.[1]?.toLowerCase() === "sim" || issRetidoMatch?.[1]?.toLowerCase() === "true";

    // Extract tomador (service taker)
    let tomadorRazaoSocial = "";
    let tomadorCnpjCpf = "";
    const tomadorRazaoMatch = cleanXml.match(/<TomadorServico>[\s\S]*?<RazaoSocial>([^<]+)<\/RazaoSocial>/i)
      || cleanXml.match(/<Tomador>[\s\S]*?<RazaoSocial>([^<]+)<\/RazaoSocial>/i)
      || cleanXml.match(/<InfDeclaracaoPrestacaoServico>[\s\S]*?<Tomador>[\s\S]*?<RazaoSocial>([^<]+)<\/RazaoSocial>/i);
    if (tomadorRazaoMatch) tomadorRazaoSocial = tomadorRazaoMatch[1];

    const tomadorCnpjMatch = cleanXml.match(/<TomadorServico>[\s\S]*?<Cnpj>([^<]+)<\/Cnpj>/i)
      || cleanXml.match(/<Tomador>[\s\S]*?<Cnpj>([^<]+)<\/Cnpj>/i);
    const tomadorCpfMatch = cleanXml.match(/<TomadorServico>[\s\S]*?<Cpf>([^<]+)<\/Cpf>/i)
      || cleanXml.match(/<Tomador>[\s\S]*?<Cpf>([^<]+)<\/Cpf>/i);
    tomadorCnpjCpf = tomadorCnpjMatch?.[1] || tomadorCpfMatch?.[1] || "";

    // Extract prestador (service provider)
    let prestadorCnpj = "";
    let prestadorIM = "";
    const prestadorCnpjMatch = cleanXml.match(/<PrestadorServico>[\s\S]*?<Cnpj>([^<]+)<\/Cnpj>/i)
      || cleanXml.match(/<Prestador>[\s\S]*?<Cnpj>([^<]+)<\/Cnpj>/i);
    if (prestadorCnpjMatch) prestadorCnpj = prestadorCnpjMatch[1];

    const prestadorIMMatch = cleanXml.match(/<PrestadorServico>[\s\S]*?<InscricaoMunicipal>([^<]+)<\/InscricaoMunicipal>/i)
      || cleanXml.match(/<Prestador>[\s\S]*?<InscricaoMunicipal>([^<]+)<\/InscricaoMunicipal>/i);
    if (prestadorIMMatch) prestadorIM = prestadorIMMatch[1];

    // Extract links (PDF, XML, NFS-e page) if provided by municipality
    let linkPdf = (cleanXml.match(/<LinkPdf>([^<]+)<\/LinkPdf>/i) || cleanXml.match(/<linkPdf>([^<]+)<\/linkPdf>/i))?.[1];
    let linkXml = (cleanXml.match(/<LinkXml>([^<]+)<\/LinkXml>/i) || cleanXml.match(/<linkXml>([^<]+)<\/linkXml>/i))?.[1];
    let linkNfse = (cleanXml.match(/<LinkNfse>([^<]+)<\/LinkNfse>/i) || cleanXml.match(/<linkNfse>([^<]+)<\/linkNfse>/i))?.[1];

    // If no links provided by GINFES, construct them from numero + codigoVerificacao
    // São Paulo GINFES typically provides a visualizacao link
    if (!linkNfse && numeroNfse && codigoVerificacao) {
      const ambiente = Deno.env.get("NFSE_AMBIENTE") || "homologacao";
      const baseUrl = ambiente === "producao"
        ? "https://producao.ginfes.com.br"
        : "https://homologacao.ginfes.com.br";
      linkNfse = `${baseUrl}/VisualizarNfse?num=${numeroNfse}&cod=${codigoVerificacao}`;
    }

    // Extract service description/discrimination
    const discriminacaoMatch = cleanXml.match(/<Discriminacao>([^<]+)<\/Discriminacao>/i);
    const itemListaServicoMatch = cleanXml.match(/<ItemListaServico>([^<]+)<\/ItemListaServico>/i);

    console.log("consultar-nfse: parseado numeroNfse=", numeroNfse, "codigoVerificacao=", codigoVerificacao, "dataEmissao=", dataEmissao, "status=", status);

    return {
      sucesso: true,
      numeroNfse,
      codigoVerificacao,
      dataEmissao,
      dataAutorizacao,
      status,
      valorServicos,
      valorIss,
      baseCalculo,
      aliquotaIss,
      issRetido,
      tomador: {
        razaoSocial: tomadorRazaoSocial,
        cnpjCpf: tomadorCnpjCpf,
      },
      prestador: {
        cnpj: prestadorCnpj,
        inscricaoMunicipal: prestadorIM,
      },
      linkPdf,
      linkXml,
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

// ============================================
// END INLINED MODULE
// ============================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  let notaId: string | undefined;

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    notaId = body.notaId;

    if (!notaId) {
      return new Response(
        JSON.stringify({ error: "notaId e obrigatorio" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: nota, error: notaError } = await supabase
      .from("notas_fiscais_servico")
      .select("*")
      .eq("id", notaId)
      .eq("user_id", user.id)
      .single();

    if (notaError || !nota) {
      throw new Error("Nota fiscal nao encontrada");
    }

    if (!nota.certificado_id) {
      throw new Error("Certificado nao vinculado a nota fiscal");
    }

    const { data: certificado, error: certError } = await supabase
      .from("certificados_nfse")
      .select("*")
      .eq("id", nota.certificado_id)
      .single();

    if (certError || !certificado) {
      throw new Error("Certificado nao encontrado");
    }

    if (!certificado.arquivo_pfx) {
      throw new Error("Certificado nao possui arquivo PFX. Faca upload novamente.");
    }

    const certDigital = await carregarCertificado(certificado.arquivo_pfx, certificado.senha || "");
    certDigital.inscricaoMunicipal = certificado.inscricao_municipal || "";
    certDigital.cnpj = certificado.cnpj || certDigital.cnpj || "";

    console.log(`consultar-nfse: Consultando NFS-e RPS ${nota.numero_rps || nota.numero_nota}`);

    const ambiente = Deno.env.get("NFSE_AMBIENTE") || "homologacao";
    let resultado;

    if (ambiente === "homologacao") {
      resultado = consultarHomologacao(nota, certificado);
    } else {
      resultado = await consultarProducao(nota, certDigital);
    }

    // Update nota record with consulta data
    if (resultado.sucesso) {
      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      if (resultado.numeroNfse) updateData.numero_nota = resultado.numeroNfse;
      if (resultado.codigoVerificacao) updateData.codigo_verificacao = resultado.codigoVerificacao;
      if (resultado.dataAutorizacao) updateData.data_autorizacao = resultado.dataAutorizacao;
      if (resultado.linkPdf) updateData.link_pdf = resultado.linkPdf;
      if (resultado.linkXml) updateData.link_xml = resultado.linkXml;
      if (resultado.linkNfse) updateData.link_nfse = resultado.linkNfse;
      if (resultado.xmlRetorno) updateData.xml_retorno = resultado.xmlRetorno;
      // Map GINFES situacao to DB status (DB has CHECK constraint)
      if (resultado.status) {
        updateData.status = resultado.status === "substituida" ? "cancelada" : resultado.status;
      }

      await supabase
        .from("notas_fiscais_servico")
        .update(updateData)
        .eq("id", notaId)
        .eq("user_id", user.id);
    }

    return new Response(
      JSON.stringify(resultado),
      { status: resultado.sucesso ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Erro ao consultar NFS-e:", err);

    if (notaId) {
      try {
        const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        await supabase
          .from("notas_fiscais_servico")
          .update({ status: "erro", mensagem_erro: (err as Error).message })
          .eq("id", notaId);
      } catch (dbErr) {
        console.error("Falha ao atualizar status de erro no banco:", dbErr);
      }
    }

    return new Response(
      JSON.stringify({
        sucesso: false,
        mensagens: [{ codigo: "ERROR", mensagem: (err as Error).message, tipo: "Erro" }],
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function consultarHomologacao(nota: any, certificado: any) {
  console.log("Ambiente de homologacao - retornando consulta simulada");
  return {
    sucesso: true,
    numeroNfse: nota.numero_nota || nota.numero_rps || "99999",
    codigoVerificacao: nota.codigo_verificacao || "HOM-VERIF-12345",
    dataEmissao: nota.data_emissao || new Date().toISOString(),
    dataAutorizacao: nota.data_autorizacao || new Date().toISOString(),
    status: nota.status || "autorizada",
    valorServicos: nota.valor_servico?.toString() || "0",
    valorIss: nota.valor_iss?.toString() || "0",
    baseCalculo: nota.base_calculo?.toString() || "0",
    aliquotaIss: nota.aliquota_iss?.toString() || "0",
    issRetido: false,
    tomador: {
      razaoSocial: nota.cliente_razao_social || nota.cliente_nome || "",
      cnpjCpf: nota.cliente_cnpj_cpf || "",
    },
    prestador: {
      cnpj: certificado.cnpj || "",
      inscricaoMunicipal: certificado.inscricao_municipal || "",
    },
    linkPdf: nota.link_pdf || undefined,
    linkXml: nota.link_xml || undefined,
    linkNfse: nota.link_nfse || undefined,
    discriminacao: nota.servico_descricao || "",
    itemListaServico: nota.servico_item_lista_servico || "",
    xmlRetorno: "<Consulta>true</Consulta>",
    mensagens: [{
      codigo: "E001",
      mensagem: "Consulta realizada com sucesso - ambiente de homologacao",
      tipo: "Sucesso",
    }],
  };
}

async function consultarProducao(nota: any, certDigital: CertificadoDigital) {
  const numeroRps = nota.numero_rps || nota.numero_nota || "";
  const serie = nota.serie || "1";
  const tipo = nota.tipo_rps || "RPS";
  const cnpj = certDigital.cnpj;
  const inscricaoMunicipal = certDigital.inscricaoMunicipal;

  const xmlConsulta = construirXmlConsultaRps(numeroRps, serie, tipo, cnpj, inscricaoMunicipal);
  const consultaId = `CONSULTA${numeroRps}`;
  const signedXml = assinarXml(xmlConsulta, certDigital, consultaId);
  const cabecalho = criarCabecalhoGinfes();
  const soapEnvelope = criarEnvelopeSOAPGinfes("ConsultarNfsePorRpsV3", cabecalho, signedXml, "producao");

  console.log("=== NFS-e Consulta Producao ===");
  console.log("RPS:", numeroRps, "CNPJ:", cnpj, "IM:", inscricaoMunicipal);

  const soapResponse = await enviarRequisicaoSOAP(soapEnvelope, {
    certPem: certDigital.certPem,
    keyPem: certDigital.keyPem,
  });

  console.log("Resposta GINFES Consulta:", soapResponse.substring(0, 500));
  const resultado = parsearRespostaConsulta(soapResponse);
  return { ...resultado, xmlEnvio: signedXml };
}