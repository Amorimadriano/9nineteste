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
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

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
  return match ? match[1] : "InfRps";
}

function construirXmlRps(dados: any): string {
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

function construirXmlLoteRps(dados: any, xmlRps: string): { xml: string; loteId: string } {
  const numeroLote = Date.now().toString();
  const loteId = `LOTE${numeroLote}`;
  const xml = `<EnviarLoteRpsEnvio xmlns="http://www.ginfes.com.br/servico_enviar_lote_rps_envio_v03.xsd">
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

function assinarXml(xml: string, certificado: CertificadoDigital, idReferencia: string): string {
  const forge = (globalThis as any).forge;
  if (!forge) throw new Error("node-forge nao disponivel");
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
  if (insertionPoint === -1) throw new Error(`Tag fechamento </${elementName}> nao encontrada`);
  return xml.substring(0, insertionPoint) + signatureBlock + xml.substring(insertionPoint);
}

function assinarLoteCompleto(xmlLote: string, certificado: CertificadoDigital): string {
  let xml = xmlLote;
  const infRpsRegex = /Id="(R[^"]+)"/g;
  let match;
  while ((match = infRpsRegex.exec(xml)) !== null) {
    xml = assinarXml(xml, certificado, match[1]);
  }
  const loteMatch = xml.match(/Id="(LOTE[^"]+)"/);
  if (loteMatch) xml = assinarXml(xml, certificado, loteMatch[1]);
  return xml;
}

function criarEnvelopeSOAPGinfes(soapAction: string, cabecalhoXml: string, dadosXml: string, ambiente?: string): string {
  // GINFES usa SOAP 1.1. arg0/arg1 devem ser unqualified (xmlns="") — schema usa elementFormDefault="unqualified"
  const namespace = ambiente === "producao" ? "http://producao.ginfes.com.br" : "http://www.ginfes.com.br/";
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <${soapAction} xmlns="${namespace}">
      <arg0 xmlns="">${cabecalhoXml}</arg0>
      <arg1 xmlns="">${dadosXml}</arg1>
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

async function enviarRequisicaoSOAP(soapEnvelope: string, soapAction: string, certificado?: { certPem: string; keyPem: string }): Promise<string> {
  const env = getAmbiente();
  const baseHeaders: Record<string, string> = {
    "Content-Type": "text/xml; charset=utf-8",
    "SOAPAction": `"${soapAction}"`,
  };
  if (env === "homologacao") {
    const response = await fetch(GINFES_URLS[env], {
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

function parsearErros(xml: string): Array<{ codigo: string; mensagem: string; tipo: string }> {
  const erros: Array<{ codigo: string; mensagem: string; tipo: string }> = [];
  const ERROS_GINFES: Record<string, string> = {
    E1: "CNPJ invalido", E2: "Inscricao Municipal invalida", E3: "RPS ja informado",
    E4: "Serie invalida", E5: "Tipo invalido", E6: "Data de emissao invalida",
    E7: "Natureza da operacao invalida", E8: "Regime especial de tributacao invalido",
    E9: "Optante pelo Simples Nacional invalido", E10: "Tomador nao informado",
    E11: "Cidade do tomador invalida", E12: "UF do tomador invalida",
    E13: "CEP do tomador invalido", E14: "Email do tomador invalido",
    E15: "Telefone do tomador invalido", E16: "Servico nao informado",
    E17: "Item da lista de servicos invalido", E18: "Codigo CNAE invalido",
    E19: "Codigo de tributacao invalido", E20: "Discriminacao do servico invalida",
    E21: "Valor dos servicos invalido", E22: "Valor das deducoes invalido",
    E23: "Base de calculo invalida", E24: "Aliquota ISS invalida",
    E25: "Valor do ISS invalido", E26: "NFS-e nao encontrada",
    E27: "NFS-e ja cancelada", E28: "Certificado invalido",
    E29: "Assinatura invalida", E30: "XML mal formatado",
    E31: "Lote ja processado", E32: "Quantidade de RPS invalida",
    E33: "RPS nao encontrado", E34: "Inscricao Municipal do prestador invalida",
    E35: "Razao Social do prestador invalida", E36: "Endereco do prestador invalido",
    E37: "Codigo do municipio do prestador invalido", E38: "Valor do PIS invalido",
    E39: "Valor do COFINS invalido", E40: "Valor do INSS invalido",
    E41: "Valor do IR invalido", E42: "Valor do CSLL invalido",
    E43: "ISS retido invalido", E44: "Valor do ISS retido invalido",
    E45: "Outras retencoes invalidas", E46: "Valor liquido invalido",
    E47: "Desconto incondicionado invalido", E48: "Desconto condicionado invalido",
    E49: "Responsavel pelo recolhimento invalido", E50: "Erro interno",
    E51: "Timeout na prefeitura", E52: "Prefeitura indisponivel",
    E53: "Limite de requisicoes excedido", E54: "IP bloqueado",
    E55: "Manutencao na prefeitura", E56: "Versao do schema invalida",
    E57: "Namespace invalido", E58: "Encoding invalido",
    E59: "Elemento obrigatorio ausente", E60: "Requisicao mal formada",
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

function parsearRespostaEmissao(xml: string) {
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
      mensagens: [{ codigo: "0000", mensagem: "Nota emitida com sucesso", tipo: "Sucesso" }],
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
      dataEmissao: formatarDataNfse(nota.data_emissao || new Date().toISOString()),
      competencia: nota.data_competencia || new Date().toISOString().split("T")[0],
      naturezaOperacao: nota.natureza_operacao || 1,
      regimeTributario: nota.regime_tributario || 1,
      optanteSimplesNacional: nota.regime_tributario === 1,
      incentivoFiscal: false,
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
            { role: "system", content: "Você é um validador de XML NFSe ABRASF 2.04. Analise o JSON da nota e retorne um JSON com { valido: boolean, problemas: string[], sugestoes: string[] }. Retorne SOMENTE o JSON." },
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
        protocolo: `PROT${Date.now()}`,
        codigoVerificacao: `HOM${Date.now().toString(36).toUpperCase()}`,
        linkNfse: `https://homologacao.ginfes.com.br/visualizar/${dadosNota.identificacaoRps.numero}`,
        xmlEnvio: "<homologacao>simulado</homologacao>",
        xmlRetorno: "<Compl>true</Compl>",
        mensagens: [{ codigo: "AA001", mensagem: "RPS processado - ambiente de homologacao", tipo: "Sucesso" }],
      };
    } else {
      const xmlRps = construirXmlRps(dadosNota);
      const { xml: xmlLote } = construirXmlLoteRps(dadosNota, xmlRps);
      const signedLote = assinarLoteCompleto(xmlLote, certDigital);
      const cabecalho = criarCabecalhoGinfes();
      const soapAction = "RecepcionarLoteRpsV3";
      const soapEnvelope = criarEnvelopeSOAPGinfes(soapAction, cabecalho, signedLote, "producao");
      const soapResponse = await retry(() => enviarRequisicaoSOAP(soapEnvelope, soapAction, { certPem: certDigital.certPem, keyPem: certDigital.keyPem }));
      resultado = { ...parsearRespostaEmissao(soapResponse), xmlEnvio: signedLote };
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
