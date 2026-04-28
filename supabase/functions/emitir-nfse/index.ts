import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ============================================
// INLINED: NFS-e GINFES Client Module
// ABRASF 2.04 / GINFES São Paulo
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

interface DadosNota {
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

const ABRASF_NAMESPACES = {
  tip: "http://www.ginfes.com.br/tipos_v03.xsd",
  cab: "http://www.ginfes.com.br/cabecalho_v03.xsd",
  servicoEnviar: "http://www.ginfes.com.br/servico_enviar_lote_rps_envio_v03.xsd",
  servicoCancelar: "http://www.ginfes.com.br/servico_cancelar_nfse_envio_v03.xsd",
  servicoConsultar: "http://www.ginfes.com.br/servico_consultar_nfse_rps_envio_v03.xsd",
};

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

/**
 * Proper C14N canonicalization for XMLDSIG.
 * Preserves xmlns attributes (required for GINFES XSD validation).
 */
function canonicalizeXml(xml: string): string {
  let result = xml;
  // Remove XML declaration
  result = result.replace(/<\?xml[^?]*\?>\s*/g, "");
  // Remove processing instructions
  result = result.replace(/<\?[^?]*\?>\s*/g, "");
  // Normalize empty elements
  result = result.replace(/<(\w+)([^>]*)\/>/g, (_match: string, tagName: string, attrs: string) => {
    if (attrs.trim()) {
      return `<${tagName}${attrs}></${tagName}>`;
    }
    return `<${tagName}></${tagName}>`;
  });
  // Normalize whitespace between tags
  result = result.replace(/>\s+</g, "><");
  // Normalize attribute whitespace
  result = result.replace(/\s+=\s+/g, "=");
  // Trim
  result = result.replace(/\n\s+/g, "\n");
  result = result.trim();
  return result;
}

/**
 * Extract XML element by Id with proper nested tag handling.
 */
function extractElementById(xml: string, id: string): string | null {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const openRegex = new RegExp(`<([\\w]+)([^>]*?)Id="${escapedId}"([^>]*?)>`, "i");
  const openMatch = xml.match(openRegex);
  if (!openMatch) return null;

  const tagName = openMatch[1];
  // Combine attrs from groups 2 and 3
  const fullOpenMatch = openMatch[0];
  const startIndex = xml.indexOf(fullOpenMatch);
  if (startIndex === -1) return null;

  // Use balanced tag matching
  let depth = 0;
  let pos = startIndex;

  while (pos < xml.length) {
    const nextOpen = xml.indexOf(`<${tagName}`, pos + 1);
    const nextClose = xml.indexOf(`</${tagName}>`, pos + 1);

    if (nextClose === -1) break;

    // Check if the nextOpen is actually a self-closing tag
    if (nextOpen !== -1 && nextOpen < nextClose) {
      // Verify it's not self-closing
      const tagEnd = xml.indexOf(">", nextOpen);
      if (tagEnd !== -1 && xml.substring(tagEnd - 1, tagEnd) === "/") {
        // Self-closing, skip it
        pos = tagEnd + 1;
        continue;
      }
    }

    depth++;
    if (nextOpen === -1 || nextOpen > nextClose) {
      // No more nested opens, found the matching close
      return xml.substring(startIndex, nextClose + `</${tagName}>`.length);
    }

    // There's nesting, find the matching close for all opens
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
  return match ? match[1] : "InfRps";
}

/**
 * Format date for GINFES: yyyy-MM-ddTHH:mm:ss (no milliseconds, no Z)
 */
function formatarDataNfse(data: string | Date): string {
  const d = typeof data === "string" ? new Date(data) : data;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

async function carregarCertificado(pfxBase64: string, senha: string): Promise<CertificadoDigital> {
  let forge: any;
  try {
    const forgeModule = await import("https://esm.sh/node-forge@1.3.1");
    forge = forgeModule.default?.util ? forgeModule.default
      : forgeModule.util ? forgeModule
      : (forgeModule as any).default?.default?.util ? (forgeModule as any).default.default
      : forgeModule;
    if (!forge?.util || !forge?.pki || !forge?.pkcs12) {
      throw new Error(`node-forge carregado sem módulos esperados. Chaves disponíveis: ${Object.keys(forge || {}).join(", ")}`);
    }
    console.log("emitir-nfse: node-forge carregado com sucesso, has util:", !!forge.util, "has pki:", !!forge.pki, "has pkcs12:", !!forge.pkcs12);
  } catch (importErr: any) {
    console.error("emitir-nfse: falha ao importar node-forge:", importErr?.message || importErr);
    throw new Error(`Falha ao importar módulo de criptografia (node-forge): ${importErr?.message || String(importErr)}. Tente novamente em alguns segundos.`);
  }
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

    // Log all subject attributes for debugging
    console.log("emitir-nfse: subject attributes:", subject.attributes.map((a: any) => ({
      oid: a.oid, shortName: a.shortName || "(none)", value: a.value?.substring(0, 80)
    })));

    for (const attr of subject.attributes) {
      if (attr.shortName === "CN") razaoSocial = attr.value;
    }

    // ICP-Brasil: CNPJ está no OID 2.16.76.4.3.3 (pessoa jurídica)
    const icpCnpjAttr = subject.attributes.find((a: any) => a.oid === "2.16.76.4.3.3");
    if (icpCnpjAttr) {
      const raw = icpCnpjAttr.value;
      // Valor pode ser string direta, hex-encoded, ou DER-encoded
      const digits = raw.replace(/\D/g, "");
      if (digits.length >= 14) {
        cnpj = digits.substring(digits.length - 14);
      }
    }

    // Fallback: procurar CNPJ em OU (Organizational Unit) - comum em certificados ICP-Brasil
    if (!cnpj) {
      const ouAttr = subject.attributes.find((a: any) =>
        a.oid === "2.5.4.11" && /CNPJ/i.test(a.value)
      );
      if (ouAttr) {
        const cnpjMatch = ouAttr.value.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
        if (cnpjMatch) cnpj = cnpjMatch[0].replace(/\D/g, "");
      }
    }

    // Fallback: procurar CNPJ no CN (Common Name)
    if (!cnpj) {
      const cnAttr = subject.attributes.find((a: any) => a.shortName === "CN");
      if (cnAttr) {
        const cnpjMatch = cnAttr.value.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
        if (cnpjMatch) cnpj = cnpjMatch[0].replace(/\D/g, "");
      }
    }

    // Fallback: procurar CNPJ em serialNumber (OID 2.5.4.5)
    if (!cnpj) {
      const serialAttr = subject.attributes.find((a: any) => a.oid === "2.5.4.5");
      if (serialAttr) {
        const digits = serialAttr.value.replace(/\D/g, "");
        if (digits.length >= 14) {
          cnpj = digits.substring(digits.length - 14);
        }
      }
    }

    // Fallback: buscar 14 dígitos consecutivos em qualquer atributo do subject
    if (!cnpj) {
      for (const attr of subject.attributes) {
        const digits = (attr.value || "").replace(/\D/g, "");
        if (digits.length >= 14) {
          cnpj = digits.substring(digits.length - 14);
          break;
        }
      }
    }

    // Fallback: buscar em extensions (subjectAltName)
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

  // Try pkcs8ShroudedKeyBag first (most common for ICP-Brasil certificates)
  const keyBagsShrouded = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  if (keyBagsShrouded[forge.pki.oids.pkcs8ShroudedKeyBag] && keyBagsShrouded[forge.pki.oids.pkcs8ShroudedKeyBag]!.length > 0) {
    const key = keyBagsShrouded[forge.pki.oids.pkcs8ShroudedKeyBag]![0];
    keyPem = forge.pki.privateKeyToPem(key.key!);
  } else {
    // Fallback to pkcs8ShorthandKeyBag
    const keyBagsShorthand = p12.getBags({ bagType: forge.pki.oids.pkcs8ShorthandKeyBag });
    if (keyBagsShorthand[forge.pki.oids.pkcs8ShorthandKeyBag] && keyBagsShorthand[forge.pki.oids.pkcs8ShorthandKeyBag]!.length > 0) {
      const key = keyBagsShorthand[forge.pki.oids.pkcs8ShorthandKeyBag]![0];
      keyPem = forge.pki.privateKeyToPem(key.key!);
    } else {
      // Fallback to keyBag
      const keyBags2 = p12.getBags({ bagType: forge.pki.oids.keyBag });
      if (keyBags2[forge.pki.oids.keyBag]) {
        const key = keyBags2[forge.pki.oids.keyBag]![0];
        keyPem = forge.pki.privateKeyToPem(key.key!);
      }
    }
  }

  if (!certPem || !keyPem) {
    throw new Error("Não foi possível extrair certificado ou chave privada do arquivo PFX");
  }

  return { pfxBase64, senha, cnpj, inscricaoMunicipal: "", razaoSocial, certPem, keyPem, validoAte };
}

function construirXmlRps(dados: DadosNota): string {
  const rpsId = `R${dados.emitente.cnpj}${dados.identificacaoRps.numero}`;
  const valorServicos = dados.servico.valores.valorServicos.toFixed(2);
  const valorIss = dados.servico.valores.valorIss.toFixed(2);
  const issRetido = dados.servico.issRetido ? "1" : "2";
  const optanteSimples = dados.optanteSimplesNacional ? "1" : "2";
  const incentivoFiscal = dados.incentivoFiscal ? "1" : "2";
  const cnae = dados.servico.codigoCnae || dados.servico.cnae;
  const baseCalculo = (dados.servico.valores.valorServicos - dados.servico.valores.valorDeducoes).toFixed(2);
  const dataEmissaoFormatada = formatarDataNfse(dados.dataEmissao);

  // Tomador CodigoMunicipio: use cidade field (IBGE code)
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

function construirXmlLoteRps(dados: DadosNota, xmlRps: string, _certificado: CertificadoDigital): { xml: string; loteId: string } {
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

/**
 * Signs XML using XMLDSIG. Throws error on failure instead of returning unsigned XML.
 * Inserts Signature inside the referenced element (before its closing tag).
 */
function assinarXml(xml: string, certificado: CertificadoDigital, idReferencia: string): string {
  const forge = (globalThis as any).forge;
  if (!forge) {
    throw new Error("node-forge não está disponível para assinatura XML. A emissão em produção requer assinatura digital.");
  }
  try {
    const privateKey = forge.pki.privateKeyFromPem(certificado.keyPem);
    const certificate = forge.pki.certificateFromPem(certificado.certPem);
    const referencedXml = extractElementById(xml, idReferencia);
    if (!referencedXml) {
      throw new Error(`Elemento com Id="${idReferencia}" não encontrado no XML para assinatura`);
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

    // Insert signature inside the referenced element (before its closing tag)
    const elementName = getElementName(xml, idReferencia);
    const closingTag = `</${elementName}>`;
    const insertionPoint = xml.lastIndexOf(closingTag);
    if (insertionPoint === -1) {
      throw new Error(`Tag de fechamento </${elementName}> não encontrada`);
    }

    return xml.substring(0, insertionPoint) + signatureBlock + xml.substring(insertionPoint);
  } catch (error) {
    throw new Error(`Erro na assinatura digital: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Signs both individual RPS elements and the LoteRps element.
 * ABRASF 2.04/GINFES v03 requires each InfRps AND LoteRps to have Signatures.
 */
function assinarLoteCompleto(xmlLote: string, certificado: CertificadoDigital): string {
  let xml = xmlLote;

  // 1. Sign each InfRps individually
  const infRpsRegex = /Id="(R[^"]+)"/g;
  let match;
  while ((match = infRpsRegex.exec(xml)) !== null) {
    const rpsId = match[1];
    xml = assinarXml(xml, certificado, rpsId);
  }

  // 2. Sign the LoteRps
  const loteMatch = xml.match(/Id="(LOTE[^"]+)"/);
  if (loteMatch) {
    xml = assinarXml(xml, certificado, loteMatch[1]);
  }

  return xml;
}

function criarEnvelopeSOAPGinfes(soapAction: string, cabecalhoXml: string, dadosXml: string, ambiente?: string): string {
  // GINFES exige namespace diferente por ambiente:
  // Produção: http://producao.ginfes.com.br
  // Homologação: http://homologacao.ginfes.com.br
  const ginfesNs = ambiente === "producao"
    ? "http://producao.ginfes.com.br"
    : "http://homologacao.ginfes.com.br";

  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <${soapAction} xmlns="${ginfesNs}">
      <arg0>${cabecalhoXml}</arg0>
      <arg1><![CDATA[${dadosXml}]]></arg1>
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

  // Homologação: sem mTLS (GINFES não exige certificado cliente)
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

  // Produção: usar proxy mTLS (Supabase Edge Functions não suportam mTLS nativo)
  if (!certificado) {
    throw new Error("Certificado digital é obrigatório para emissão em produção.");
  }

  const proxyUrl = Deno.env.get("MTLS_PROXY_URL");
  const proxyApiKey = Deno.env.get("MTLS_PROXY_API_KEY") || "";

  if (!proxyUrl) {
    throw new Error(
      "Variável MTLS_PROXY_URL não configurada. " +
      "A emissão em produção requer um proxy mTLS. " +
      "Configure a URL do proxy (ex: https://seu-proxy.railway.app) nas variáveis de ambiente do Supabase."
    );
  }

  console.log("emitir-nfse: enviando via proxy mTLS para", proxyUrl);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (proxyApiKey) {
    headers["X-API-Key"] = proxyApiKey;
  }

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
    E1: "CNPJ do prestador inválido", E2: "Inscrição Municipal do prestador inválida",
    E3: "RPS já informado", E4: "Número do RPS inválido", E5: "Data de emissão posterior à data atual",
    E6: "CNPJ do tomador inválido", E7: "CPF do tomador inválido",
    E8: "Item da lista de serviços inválido", E9: "Código CNAE inválido",
    E10: "Código de tributação inválido", E11: "Alíquota do ISS inválida",
    E28: "Certificado digital inválido", E29: "Assinatura digital inválida",
    E30: "Arquivo XML mal formatado", E50: "Erro interno do servidor",
    E60: "Requisição mal formada",
  };
  const mensagemRegex = /<Mensagem[^>]*>([^<]+)<\/Mensagem>/gi;
  const codigoRegex = /<Codigo[^>]*>([^<]+)<\/Codigo>/gi;
  const mensagens = [...xml.matchAll(mensagemRegex)].map(m => m[1]);
  const codigos = [...xml.matchAll(codigoRegex)].map(m => m[1]);
  for (let i = 0; i < Math.max(mensagens.length, codigos.length); i++) {
    erros.push({
      codigo: codigos[i] || "ERR_UNKNOWN",
      mensagem: ERROS_GINFES[codigos[i] || ""] || mensagens[i] || "Erro desconhecido",
      tipo: "Erro",
    });
  }
  const faultMatch = xml.match(/<faultstring>([^<]+)<\/faultstring>/i);
  if (faultMatch && erros.length === 0) {
    erros.push({ codigo: "SOAP_FAULT", mensagem: faultMatch[1], tipo: "Erro" });
  }
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
      linkNfse: numeroMatch?.[1] ? `https://${getAmbiente()}.ginfes.com.br/visualizar/${numeroMatch[1]}` : undefined,
      xmlRetorno: xml,
      mensagens: [{ codigo: "0000", mensagem: "Nota fiscal emitida com sucesso", tipo: "Sucesso" }],
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
    const certificadoId = body.certificadoId;

    console.log("emitir-nfse: notaId=", notaId, "certificadoId=", certificadoId);

    if (!notaId || !certificadoId) {
      return new Response(
        JSON.stringify({ error: "notaId e certificadoId são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: certificado, error: certError } = await supabase
      .from("certificados_nfse")
      .select("*")
      .eq("id", certificadoId)
      .eq("user_id", user.id)
      .single();

    if (certError) {
      console.error("emitir-nfse: erro ao buscar certificado:", certError);
      throw new Error(`Erro ao buscar certificado: ${certError.message}`);
    }
    if (!certificado) {
      throw new Error("Certificado não encontrado ou não pertence ao usuário");
    }

    if (!certificado.arquivo_pfx) {
      throw new Error("Certificado não possui arquivo PFX. Faça upload novamente.");
    }

    let certDigital;
    try {
      certDigital = await carregarCertificado(certificado.arquivo_pfx, certificado.senha || "");
      certDigital.inscricaoMunicipal = certificado.inscricao_municipal || "";
      // Usa CNPJ do banco se disponível, senão mantém o extraído do certificado
      certDigital.cnpj = certificado.cnpj || certDigital.cnpj || "";
      console.log("emitir-nfse: certificado carregado, CNPJ=", certDigital.cnpj, "IM=", certDigital.inscricaoMunicipal);
    } catch (certErr: any) {
      console.error("emitir-nfse: erro ao carregar certificado:", certErr?.message || certErr);
      throw new Error(`Erro no certificado digital: ${certErr?.message || String(certErr)}`);
    }

    if (!certDigital.cnpj) {
      throw new Error("CNPJ não encontrado no certificado digital. Verifique se o certificado está correto.");
    }
    if (!certDigital.inscricaoMunicipal) {
      console.warn("emitir-nfse: Inscrição Municipal não configurada no certificado. A emissão em produção pode falhar.");
    }

    await supabase
      .from("notas_fiscais_servico")
      .update({ status: "enviando" })
      .eq("id", notaId)
      .eq("user_id", user.id);

    const { data: nota, error: notaError } = await supabase
      .from("notas_fiscais_servico")
      .select("*")
      .eq("id", notaId)
      .eq("user_id", user.id)
      .single();

    if (notaError) {
      console.error("emitir-nfse: erro ao buscar nota:", notaError);
      throw new Error(`Erro ao buscar nota: ${notaError.message}`);
    }
    if (!nota) {
      throw new Error("Nota fiscal não encontrada");
    }

    console.log("emitir-nfse: nota encontrada, status=", nota.status, "valor_servico=", nota.valor_servico, "cliente_cnpj_cpf=", nota.cliente_cnpj_cpf, "servico_descricao=", nota.servico_descricao);

    // Format dataEmissao properly (remove milliseconds and Z)
    const dataEmissaoOriginal = nota.data_emissao || new Date().toISOString();
    const dataEmissaoFormatada = formatarDataNfse(dataEmissaoOriginal);

    const dadosNota: DadosNota = {
      identificacaoRps: {
        numero: nota.numero_rps || nota.numero_nota || gerarNumeroRps(),
        serie: nota.serie || "1",
        tipo: nota.tipo_rps || "RPS",
      },
      dataEmissao: dataEmissaoFormatada,
      competencia: nota.data_competencia || new Date().toISOString().split("T")[0],
      naturezaOperacao: nota.natureza_operacao || 1,
      regimeTributario: nota.regime_tributario || 1,
      optanteSimplesNacional: nota.regime_tributario === 1,
      incentivoFiscal: false,
      emitente: {
        cnpj: certDigital.cnpj,
        inscricaoMunicipal: certDigital.inscricaoMunicipal,
        razaoSocial: certificado.razao_social || certDigital.razaoSocial || "",
        endereco: {
          logradouro: (certificado.endereco && typeof certificado.endereco === "object" && certificado.endereco !== null ? certificado.endereco.logradouro : (certificado.logradouro || "")) || "",
          numero: certificado.numero || certificado.endereco_numero || "",
          bairro: certificado.bairro || (certificado.endereco && typeof certificado.endereco === "object" && certificado.endereco !== null ? certificado.endereco.bairro : "") || "",
          codigoMunicipio: certificado.codigo_municipio || (certificado.endereco && typeof certificado.endereco === "object" && certificado.endereco !== null ? certificado.endereco.codigoMunicipio : "") || "3550308",
          uf: certificado.uf || (certificado.endereco && typeof certificado.endereco === "object" && certificado.endereco !== null ? certificado.endereco.uf : "") || "SP",
          cep: certificado.cep || (certificado.endereco && typeof certificado.endereco === "object" && certificado.endereco !== null ? certificado.endereco.cep : "") || "",
        },
      },
      tomador: {
        tipoDocumento: nota.cliente_tipo_documento || "CNPJ",
        cnpjCpf: nota.cliente_cnpj_cpf || "",
        razaoSocial: nota.cliente_razao_social || nota.cliente_nome || "",
        nomeFantasia: nota.cliente_nome_fantasia || "",
        email: nota.cliente_email || "",
        telefone: nota.cliente_telefone || "",
        endereco: {
          logradouro: nota.cliente_endereco || "",
          numero: nota.cliente_numero || "",
          complemento: nota.cliente_complemento || "",
          bairro: nota.cliente_bairro || "",
          cidade: nota.cliente_cidade || "",
          uf: nota.cliente_estado || "",
          cep: nota.cliente_cep || "",
        },
      },
      servico: {
        descricao: nota.servico_descricao || "",
        codigo: nota.servico_codigo || nota.servico_item_lista_servico || "",
        cnae: nota.servico_cnae || nota.cnae || "",
        codigoTributacao: nota.servico_codigo_tributacao || nota.codigo_tributacao || "",
        discriminacao: nota.servico_discriminacao || "",
        itemListaServico: nota.servico_item_lista_servico || "",
        valores: {
          valorServicos: parseFloat(nota.valor_servico) || 0,
          valorDeducoes: parseFloat(nota.valor_deducoes) || 0,
          valorPis: parseFloat(nota.retencao_pis) || 0,
          valorCofins: parseFloat(nota.retencao_cofins) || 0,
          valorInss: parseFloat(nota.retencao_inss) || 0,
          valorIr: parseFloat(nota.retencao_ir) || 0,
          valorCsll: parseFloat(nota.retencao_csll) || 0,
          valorIss: parseFloat(nota.valor_iss) || 0,
          valorLiquido: parseFloat(nota.valor_liquido) || 0,
        },
        aliquotaIss: parseFloat(nota.aliquota_iss) || 0.05,
        issRetido: nota.iss_retido || false,
      },
    };

    console.log("Emitindo NFS-e:", dadosNota.identificacaoRps.numero, "Ambiente:", Deno.env.get("NFSE_AMBIENTE") || "homologacao");
    console.log("emitir-nfse: dadosNota tomador=", dadosNota.tomador.razaoSocial, "cnpjCpf=", dadosNota.tomador.cnpjCpf, "valorServicos=", dadosNota.servico.valores.valorServicos);

    const ambiente = Deno.env.get("NFSE_AMBIENTE") || "homologacao";
    let resultado;

    if (ambiente === "homologacao") {
      resultado = emitirHomologacao(dadosNota);
    } else {
      resultado = await emitirProducao(dadosNota, certDigital);
    }

    const updateData: any = {
      status: resultado.sucesso ? "autorizada" : "rejeitada",
      xml_envio: (resultado as any).xmlEnvio || null,
      xml_retorno: resultado.xmlRetorno || null,
      link_pdf: (resultado as any).linkPdf || null,
      link_xml: (resultado as any).linkXml || null,
      numero_nota: resultado.numeroNfse || nota.numero_nota,
      protocolo: resultado.protocolo || null,
      codigo_verificacao: resultado.codigoVerificacao || null,
      link_nfse: (resultado as any).linkNfse || null,
      data_autorizacao: resultado.sucesso ? new Date().toISOString() : null,
      mensagem_erro: resultado.sucesso ? null : resultado.mensagens?.map((m: any) => m.mensagem).join("; "),
    };

    await supabase
      .from("notas_fiscais_servico")
      .update(updateData)
      .eq("id", notaId)
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify(resultado),
      { status: resultado.sucesso ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Erro ao emitir NFS-e:", err);

    if (notaId) {
      try {
        const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        const updateResult = await supabase
          .from("notas_fiscais_servico")
          .update({ status: "erro", mensagem_erro: (err as Error).message })
          .eq("id", notaId);
        if (updateResult.error) {
          console.error("Falha ao atualizar status de erro no banco:", updateResult.error.message);
        }
      } catch (dbErr) {
        console.error("Falha ao conectar ao banco para atualizar status de erro:", dbErr);
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

function gerarNumeroRps(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `${timestamp}${random}`;
}

function emitirHomologacao(dadosNota: DadosNota) {
  console.log("Ambiente de homologação - retornando resposta simulada");
  return {
    sucesso: true,
    numeroNfse: dadosNota.identificacaoRps.numero,
    protocolo: `PROT${Date.now()}`,
    codigoVerificacao: `HOM${Date.now().toString(36).toUpperCase()}`,
    linkNfse: `https://homologacao.ginfes.com.br/visualizar/${dadosNota.identificacaoRps.numero}`,
    xmlEnvio: "<homologacao>simulado</homologacao>",
    xmlRetorno: "<Compl>true</Compl>",
    mensagens: [{
      codigo: "AA001",
      mensagem: "RPS processado com sucesso - ambiente de homologação",
      tipo: "Sucesso",
    }],
  };
}

async function emitirProducao(dadosNota: DadosNota, certDigital: CertificadoDigital) {
  // ABRASF 2.04/GINFES v03: Each InfRps AND LoteRps must be signed
  const xmlRps = construirXmlRps(dadosNota);
  const { xml: xmlLote, loteId } = construirXmlLoteRps(dadosNota, xmlRps, certDigital);
  // Sign both individual RPS and the LoteRps
  const signedLote = assinarLoteCompleto(xmlLote, certDigital);

  // Envelope SOAP no formato GINFES v03: arg0=cabecalho, arg1=dados
  const cabecalho = criarCabecalhoGinfes();
  const soapEnvelope = criarEnvelopeSOAPGinfes("RecepcionarLoteRpsV3", cabecalho, signedLote, "producao");

  console.log("=== NFS-e Emissão Produção ===");
  console.log("CNPJ:", dadosNota.emitente.cnpj);
  console.log("IM:", dadosNota.emitente.inscricaoMunicipal);
  console.log("RPS:", dadosNota.identificacaoRps.numero);
  console.log("LoteId:", loteId);
  console.log("Ambiente:", Deno.env.get("NFSE_AMBIENTE") || "homologacao");

  const soapResponse = await enviarRequisicaoSOAP(soapEnvelope, {
    certPem: certDigital.certPem,
    keyPem: certDigital.keyPem,
  });
  console.log("Resposta GINFES (primeiros 500 chars):", soapResponse.substring(0, 500));

  const resultado = parsearRespostaEmissao(soapResponse);
  return { ...resultado, xmlEnvio: signedLote };
}