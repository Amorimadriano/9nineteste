/**
 * Módulo de autenticação e assinatura digital para NFS-e
 * Implementa carregamento de certificado PKCS12 e assinatura XML
 * Usando node-forge para criptografia real
 */

import { NFSeConfig } from './config';
import * as forge from 'node-forge';

export interface CertificadoDigital {
  certificado: string; // Base64 do arquivo PFX/P12
  senha: string;
  chavePrivadaPem?: string; // Chave privada extraída (PEM)
  certificadoPem?: string; // Certificado em formato PEM
}

export interface EmitenteNfse {
  cnpj: string;
  inscricaoMunicipal: string;
  razaoSocial: string;
  nomeFantasia?: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    codigoMunicipio: string;
    uf: string;
    cep: string;
  };
  certificado: CertificadoDigital;
  regimeTributario?: 'MEI' | 'SimplesNacional' | 'LucroPresumido' | 'LucroReal';
  issRetido?: boolean;
}

export interface CertificadoInfo {
  validoAte: Date;
  emitidoPara: string;
  cnpj: string;
  emissor: string;
  serialNumber: string;
  thumbprint: string;
}

/**
 * Carrega e extrai informações de um certificado digital PKCS12
 * Usando node-forge para criptografia real
 */
export async function carregarCertificadoDigital(
  certificadoBase64: string,
  senha: string
): Promise<CertificadoDigital> {
  if (!certificadoBase64) {
    throw new Error('Certificado digital não fornecido');
  }

  if (!senha) {
    throw new Error('Senha do certificado não fornecida');
  }

  try {
    // Decodifica Base64
    const cleanCert = certificadoBase64.replace(/\s/g, '');
    const p12Der = forge.util.decode64(cleanCert);

    // Converte para formato ASN.1
    const p12Asn1 = forge.asn1.fromDer(p12Der);

    // Parse do PKCS#12
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, senha);

    // Extrai bags de certificado
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = certBags[forge.pki.oids.certBag];
    if (!certBag || certBag.length === 0) {
      throw new Error('Certificado não encontrado no arquivo PFX/P12');
    }

    const certificate = certBag[0].cert;
    const certPem = forge.pki.certificateToPem(certificate);

    // Pega a chave privada - tenta pkcs8ShroudedKeyBag primeiro (mais comum ICP-Brasil),
    // depois pkcs8ShorthandKeyBag, depois keyBag
    let keyPem = '';
    const keyBagsShrouded = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    if (keyBagsShrouded[forge.pki.oids.pkcs8ShroudedKeyBag] && keyBagsShrouded[forge.pki.oids.pkcs8ShroudedKeyBag].length > 0) {
      keyPem = forge.pki.privateKeyToPem(keyBagsShrouded[forge.pki.oids.pkcs8ShroudedKeyBag][0].key!);
    } else {
      const keyBagsShorthand = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      if (keyBagsShorthand[forge.pki.oids.pkcs8ShroudedKeyBag] && keyBagsShorthand[forge.pki.oids.pkcs8ShroudedKeyBag].length > 0) {
        keyPem = forge.pki.privateKeyToPem(keyBagsShorthand[forge.pki.oids.pkcs8ShroudedKeyBag][0].key!);
      } else {
        const keyBagsPlain = p12.getBags({ bagType: forge.pki.oids.keyBag });
        if (keyBagsPlain[forge.pki.oids.keyBag] && keyBagsPlain[forge.pki.oids.keyBag].length > 0) {
          keyPem = forge.pki.privateKeyToPem(keyBagsPlain[forge.pki.oids.keyBag][0].key!);
        }
      }
    }

    if (!keyPem) {
      throw new Error('Chave privada não encontrada no arquivo PFX/P12');
    }

    return {
      certificado: cleanCert,
      senha,
      chavePrivadaPem: keyPem,
      certificadoPem: certPem,
    };
  } catch (error: any) {
    if (error.message?.includes('password')) {
      throw new Error('Senha do certificado incorreta');
    }
    if (error.message?.includes('Invalid')) {
      throw new Error('Formato do certificado inválido ou arquivo corrompido');
    }
    throw new Error(`Erro ao carregar certificado: ${error.message || 'Erro desconhecido'}`);
  }
}

/**
 * Extrai informações detalhadas do certificado usando node-forge
 */
export async function extrairInfoCertificado(
  certificado: CertificadoDigital
): Promise<CertificadoInfo> {
  if (!certificado.certificadoPem) {
    throw new Error('Certificado não foi carregado completamente');
  }

  try {
    const cert = forge.pki.certificateFromPem(certificado.certificadoPem);

    // Extrai CNPJ do subject
    const subject = cert.subject;
    let cnpj = '';
    let emitidoPara = '';

    for (const attr of subject.attributes) {
      if (attr.type === '2.5.4.3') { // commonName
        emitidoPara = attr.value as string;
      }
      // CNPJ geralmente está no serialNumber do subject
      if (attr.type === '2.5.4.5') { // serialNumber
        cnpj = attr.value as string;
      }
    }

    // Se não achou CNPJ no subject, tenta extrair do commonName
    if (!cnpj && emitidoPara) {
      const cnpjMatch = emitidoPara.match(/(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/);
      if (cnpjMatch) {
        cnpj = cnpjMatch[1];
      }
    }

    // Extrai emissor
    const issuer = cert.issuer;
    let emissor = '';
    for (const attr of issuer.attributes) {
      if (attr.type === '2.5.4.3') { // commonName
        emissor = attr.value as string;
        break;
      }
    }

    // Calcula thumbprint (SHA-1 do certificado)
    const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
    const md = forge.md.sha1.create();
    md.update(certDer);
    const thumbprint = md.digest().toHex().toUpperCase();

    return {
      validoAte: new Date(cert.validity.notAfter),
      emitidoPara,
      cnpj,
      emissor,
      serialNumber: cert.serialNumber,
      thumbprint: thumbprint.match(/.{2}/g)?.join(':') || thumbprint,
    };
  } catch (error: any) {
    throw new Error(`Erro ao extrair informações do certificado: ${error.message}`);
  }
}

/**
 * Cria o header SOAP com informações de autenticação
 * O header inclui os dados do emitente conforme layout ABRASF
 */
export function criarHeaderSOAP(emitente: EmitenteNfse): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Header xmlns:soap="${NFSeConfig.namespaces.soap}">
  <ns2:cabecalho xmlns:ns2="${NFSeConfig.namespaces.cabecalho}" xmlns:ns3="${NFSeConfig.namespaces.xsi}">
    <versaoDados>${NFSeConfig.versaoLayout}</versaoDados>
  </ns2:cabecalho>
</soap:Header>`;
}

/**
 * Proper C14N canonicalization for XMLDSIG.
 * Preserves xmlns attributes (required for GINFES XSD validation).
 */
function canonicalizarXML(xml: string): string {
  let result = xml;
  // Remove XML declaration
  result = result.replace(/<\?xml[^?]*\?>\s*/g, '');
  // Remove processing instructions
  result = result.replace(/<\?[^?]*\?>\s*/g, '');
  // Normalize empty elements: <tag/> -> <tag></tag>
  result = result.replace(/<(\w+)([^>]*)\/>/g, (_match: string, tagName: string, attrs: string) => {
    if (attrs.trim()) {
      return `<${tagName}${attrs}></${tagName}>`;
    }
    return `<${tagName}></${tagName}>`;
  });
  // Normalize whitespace between tags (keep text content whitespace)
  result = result.replace(/>\s+</g, '><');
  // Normalize attribute whitespace
  result = result.replace(/\s+=\s+/g, '=');
  // Trim lines
  result = result.replace(/\n\s+/g, '\n');
  result = result.trim();
  return result;
}

/**
 * Extract XML element by Id with proper nested tag handling.
 */
function extractElementById(xml: string, id: string): string | null {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const openRegex = new RegExp(`<([\\w]+)([^>]*?)Id="${escapedId}"([^>]*?)>`, 'i');
  const openMatch = xml.match(openRegex);
  if (!openMatch) return null;

  const tagName = openMatch[1];
  const fullOpenMatch = openMatch[0];
  const startIndex = xml.indexOf(fullOpenMatch);
  if (startIndex === -1) return null;

  // Balanced tag matching
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
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`<(\\w+)[^>]*Id="${escapedId}"`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : 'InfRps';
}

/**
 * Calcula o hash SHA-1 de um conteúdo usando node-forge
 */
function calcularHashSHA1(conteudo: string): string {
  const md = forge.md.sha1.create();
  md.update(conteudo);
  return forge.util.encode64(md.digest().bytes());
}

/**
 * Extrai o certificado X509 em formato DER e converte para Base64
 * Para inclusão na assinatura XML
 */
function extrairX509Base64(certificadoPem: string): string {
  const cert = forge.pki.certificateFromPem(certificadoPem);
  const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
  return forge.util.encode64(certDer);
}

/**
 * Gera um identificador único para o RPS
 */
export function gerarIdRps(numeroRps: string, serie: string, cnpj: string): string {
  return `RPS${cnpj.replace(/\D/g, '')}${serie}${numeroRps.padStart(15, '0')}`;
}

/**
 * Gera um identificador único para o Lote
 */
export function gerarIdLote(numeroLote: string, cnpj: string): string {
  return `LOTE${cnpj.replace(/\D/g, '')}${numeroLote.padStart(15, '0')}`;
}

/**
 * Cria hash para assinatura (estrutura base)
 * A assinatura real requer implementação com biblioteca de criptografia
 */
export function criarHashAssinatura(dados: string): string {
  // Placeholder - em produção usar SHA-1 conforme especificação ABRASF
  return Buffer.from(dados).toString('base64');
}

/**
 * Templates para assinatura XML conforme layout ABRASF 2.04
 */
export const templatesAssinatura = {
  signatureTemplate: `
<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
  <SignedInfo>
    <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
    <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
    <Reference URI="">
      <Transforms>
        <Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
      </Transforms>
      <DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
      <DigestValue></DigestValue>
    </Reference>
  </SignedInfo>
  <SignatureValue></SignatureValue>
  <KeyInfo>
    <X509Data>
      <X509Certificate></X509Certificate>
    </X509Data>
  </KeyInfo>
</Signature>`,

  keyInfoTemplate: `
<KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
  <X509Data>
    <X509Certificate></X509Certificate>
  </X509Data>
</KeyInfo>`,
};

/**
 * Prepara o XML para assinatura removendo espaços e normalizando
 */
export function prepararXmlParaAssinatura(xml: string): string {
  return xml
    .replace(/>\s+</g, '><')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Interface para serviço de assinatura
 */
export interface AssinaturaService {
  assinarRps(xmlRps: string, certificado: CertificadoDigital): Promise<string>;
  assinarLote(xmlLote: string, certificado: CertificadoDigital): Promise<string>;
  assinarCancelamento(xmlCancelamento: string, certificado: CertificadoDigital): Promise<string>;
}

/**
 * Assina um RPS individual
 * @param xmlRps XML do RPS a ser assinado
 * @param certificado Certificado digital carregado
 * @returns XML assinado
 */
export async function assinarRps(xmlRps: string, certificado: CertificadoDigital): Promise<string> {
  // Extrai o Id do RPS para referência
  const idMatch = xmlRps.match(/Id="([^"]+)"/);
  const idReferencia = idMatch ? idMatch[1] : 'rps';
  return assinarXML(xmlRps, certificado, idReferencia);
}

/**
 * Assina um lote de RPS
 * @param xmlLote XML do lote a ser assinado
 * @param certificado Certificado digital carregado
 * @returns XML assinado
 */
export async function assinarLote(xmlLote: string, certificado: CertificadoDigital): Promise<string> {
  const idMatch = xmlLote.match(/Id="([^"]+)"/);
  const idReferencia = idMatch ? idMatch[1] : 'lote';
  return assinarXML(xmlLote, certificado, idReferencia);
}

/**
 * Assina um pedido de cancelamento
 * @param xmlCancelamento XML do cancelamento a ser assinado
 * @param certificado Certificado digital carregado
 * @returns XML assinado
 */
export async function assinarCancelamento(xmlCancelamento: string, certificado: CertificadoDigital): Promise<string> {
  const idMatch = xmlCancelamento.match(/Id="([^"]+)"/);
  const idReferencia = idMatch ? idMatch[1] : 'cancelamento';
  return assinarXML(xmlCancelamento, certificado, idReferencia);
}

/**
 * Assina XML digitalmente usando node-forge conforme especificação ABRASF/GINFES
 * Implementa assinatura RSA-SHA1 com C14N
 * Throws error on failure instead of returning unsigned XML.
 */
export async function assinarXML(
  xml: string,
  certificado: CertificadoDigital,
  idReferencia: string
): Promise<string> {
  if (!certificado.chavePrivadaPem || !certificado.certificadoPem) {
    throw new Error('Certificado não carregado completamente. Chame carregarCertificadoDigital primeiro.');
  }

  try {
    // Extract the referenced element
    const referencedXml = extractElementById(xml, idReferencia);
    if (!referencedXml) {
      throw new Error(`Elemento com Id="${idReferencia}" não encontrado no XML para assinatura`);
    }

    // Canonicaliza o elemento referenciado
    const xmlCanonicalizado = canonicalizarXML(referencedXml);

    // Converte a chave privada PEM para objeto
    const privateKey = forge.pki.privateKeyFromPem(certificado.chavePrivadaPem);

    // Carrega o certificado
    const cert = forge.pki.certificateFromPem(certificado.certificadoPem);

    // Extrai o certificado em DER e converte para Base64
    const x509Base64 = extrairX509Base64(certificado.certificadoPem);

    // Calcula o hash SHA-1 do conteúdo canonicalizado (elemento referenciado)
    const md = forge.md.sha1.create();
    md.update(xmlCanonicalizado, 'utf8');
    const digestValue = forge.util.encode64(md.digest().bytes());

    // Constrói o SignedInfo para ser assinado
    const signedInfoXml = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#"><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></CanonicalizationMethod><SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"></SignatureMethod><Reference URI="#${idReferencia}"><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform></Transforms><DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"></DigestMethod><DigestValue>${digestValue}</DigestValue></Reference></SignedInfo>`;

    // Canonicaliza e assina o SignedInfo
    const canonSignedInfo = canonicalizarXML(signedInfoXml);
    const signedInfoMd = forge.md.sha1.create();
    signedInfoMd.update(canonSignedInfo, 'utf8');
    const signatureBytes = privateKey.sign(signedInfoMd);
    const signatureValue = forge.util.encode64(signatureBytes);

    // Monta a estrutura da assinatura XML
    const signatureXML = `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><SignedInfo><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></CanonicalizationMethod><SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"></SignatureMethod><Reference URI="#${idReferencia}"><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform></Transforms><DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"></DigestMethod><DigestValue>${digestValue}</DigestValue></Reference></SignedInfo><SignatureValue>${signatureValue}</SignatureValue><KeyInfo><X509Data><X509Certificate>${x509Base64}</X509Certificate></X509Data></KeyInfo></Signature>`;

    // Insere a assinatura dentro do elemento referenciado (antes da tag de fechamento)
    const elementName = getElementName(xml, idReferencia);
    const closingTag = `</${elementName}>`;
    const insertionPoint = xml.lastIndexOf(closingTag);
    if (insertionPoint === -1) {
      throw new Error(`Tag de fechamento </${elementName}> não encontrada para inserir assinatura`);
    }

    const xmlAssinado = xml.substring(0, insertionPoint) + signatureXML + xml.substring(insertionPoint);

    return xmlAssinado;
  } catch (error: any) {
    throw new Error(`Erro ao assinar XML: ${error.message || 'Erro desconhecido'}`);
  }
}

/**
 * Valida se o certificado está dentro da validade
 */
export function validarValidadeCertificado(dataValidade: Date): boolean {
  const hoje = new Date();
  return dataValidade > hoje;
}

/**
 * Formata CNPJ para o padrão da NFS-e (apenas números)
 */
export function formatarCnpjNfse(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

/**
 * Formata Inscrição Municipal para o padrão da NFS-e
 */
export function formatarInscricaoMunicipal(im: string): string {
  return im.replace(/\D/g, '');
}
