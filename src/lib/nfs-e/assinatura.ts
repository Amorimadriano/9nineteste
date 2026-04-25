/**
 * Módulo de assinatura digital para NFS-e
 * Implementação completa da assinatura XML conforme ABRASF 2.04
 */

import * as forge from 'node-forge';
import { CertificadoDigital, CertificadoInfo } from './auth';

/**
 * Classe de serviço para assinatura digital de documentos NFS-e
 * Implementa o padrão XML Signature (RSA-SHA1) conforme ABRASF
 */
export class AssinaturaDigitalService {
  private certificado: CertificadoDigital | null = null;

  constructor(certificado?: CertificadoDigital) {
    if (certificado) {
      this.certificado = certificado;
    }
  }

  /**
   * Define o certificado a ser usado para assinatura
   */
  setCertificado(certificado: CertificadoDigital): void {
    this.certificado = certificado;
  }

  /**
   * Verifica se um certificado está carregado
   */
  isReady(): boolean {
    return this.certificado !== null &&
           this.certificado.chavePrivadaPem !== undefined &&
           this.certificado.certificadoPem !== undefined;
  }

  /**
   * Assina um XML de RPS (Recibo Provisório de Serviços)
   * @param xmlRps XML do RPS sem assinatura
   * @returns XML assinado
   */
  async assinarRps(xmlRps: string): Promise<string> {
    if (!this.isReady()) {
      throw new Error('Certificado não configurado. Chame setCertificado primeiro.');
    }

    // Extrai o Id do RPS para referência na assinatura
    const idMatch = xmlRps.match(/Id="([^"]+)"/);
    const idReferencia = idMatch ? idMatch[1] : 'rps';

    return this.assinarXML(xmlRps, idReferencia);
  }

  /**
   * Assina um XML de lote de RPS
   * @param xmlLote XML do lote sem assinatura
   * @returns XML assinado
   */
  async assinarLote(xmlLote: string): Promise<string> {
    if (!this.isReady()) {
      throw new Error('Certificado não configurado. Chame setCertificado primeiro.');
    }

    const idMatch = xmlLote.match(/Id="([^"]+)"/);
    const idReferencia = idMatch ? idMatch[1] : 'lote';

    return this.assinarXML(xmlLote, idReferencia);
  }

  /**
   * Assina um XML de cancelamento de NFS-e
   * @param xmlCancelamento XML do pedido de cancelamento
   * @returns XML assinado
   */
  async assinarCancelamento(xmlCancelamento: string): Promise<string> {
    if (!this.isReady()) {
      throw new Error('Certificado não configurado. Chame setCertificado primeiro.');
    }

    const idMatch = xmlCancelamento.match(/Id="([^"]+)"/);
    const idReferencia = idMatch ? idMatch[1] : 'cancelamento';

    return this.assinarXML(xmlCancelamento, idReferencia);
  }

  /**
   * Assina um XML genérico
   * @param xml Conteúdo XML a ser assinado
   * @param idReferencia ID da referência URI na assinatura
   * @returns XML com a assinatura inserida
   */
  async assinarXML(xml: string, idReferencia: string): Promise<string> {
    if (!this.certificado || !this.certificado.chavePrivadaPem || !this.certificado.certificadoPem) {
      throw new Error('Certificado incompleto para assinatura');
    }

    try {
      // Extract the referenced element
      const referencedXml = this.extractElementById(xml, idReferencia);
      if (!referencedXml) {
        throw new Error(`Elemento com Id="${idReferencia}" não encontrado no XML para assinatura`);
      }

      // Canonicaliza o elemento referenciado (C14N preserving xmlns)
      const xmlCanonicalizado = this.canonicalizarXML(referencedXml);

      // Converte a chave privada PEM para objeto
      const privateKey = forge.pki.privateKeyFromPem(this.certificado.chavePrivadaPem);

      // Extrai o certificado em DER e converte para Base64
      const x509Base64 = this.extrairX509Base64(this.certificado.certificadoPem);

      // Calcula o hash SHA-1 do elemento referenciado canonicalizado
      const md = forge.md.sha1.create();
      md.update(xmlCanonicalizado, 'utf8');
      const digestValue = forge.util.encode64(md.digest().bytes());

      // Cria o conteúdo SignedInfo que será assinado
      const signedInfoCanonical = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#"><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></CanonicalizationMethod><SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"></SignatureMethod><Reference URI="#${idReferencia}"><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform></Transforms><DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"></DigestMethod><DigestValue>${digestValue}</DigestValue></Reference></SignedInfo>`;

      // Assina o SignedInfo canonicalizado
      const signedInfoMd = forge.md.sha1.create();
      signedInfoMd.update(this.canonicalizarXML(signedInfoCanonical), 'utf8');
      const signature = privateKey.sign(signedInfoMd);
      const signatureValue = forge.util.encode64(signature);

      // Monta a estrutura da assinatura XML
      const signatureXML = `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><SignedInfo><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></CanonicalizationMethod><SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"></SignatureMethod><Reference URI="#${idReferencia}"><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform></Transforms><DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"></DigestMethod><DigestValue>${digestValue}</DigestValue></Reference></SignedInfo><SignatureValue>${signatureValue}</SignatureValue><KeyInfo><X509Data><X509Certificate>${x509Base64}</X509Certificate></X509Data></KeyInfo></Signature>`;

      // Insere a assinatura dentro do elemento referenciado (antes da tag de fechamento)
      const elementName = this.getElementName(xml, idReferencia);
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
   * Verifica a assinatura de um XML
   * @param xmlAssinado XML com assinatura
   * @returns true se a assinatura é válida
   */
  async verificarAssinatura(xmlAssinado: string): Promise<boolean> {
    if (!this.certificado || !this.certificado.certificadoPem) {
      throw new Error('Certificado não configurado');
    }

    try {
      // Extrai a assinatura do XML
      const signatureMatch = xmlAssinado.match(/<Signature[^>]*>([\s\S]*?)<\/Signature>/);
      if (!signatureMatch) {
        throw new Error('Assinatura não encontrada no XML');
      }

      // Carrega o certificado para verificação
      const cert = forge.pki.certificateFromPem(this.certificado.certificadoPem);
      const publicKey = cert.publicKey as forge.pki.rsa.PublicKey;

      // Extrai o valor da assinatura
      const signatureValueMatch = xmlAssinado.match(/<SignatureValue>([^<]+)<\/SignatureValue>/);
      if (!signatureValueMatch) {
        throw new Error('Valor da assinatura não encontrado');
      }
      const signatureValue = forge.util.decode64(signatureValueMatch[1]);

      // Extrai o valor do digest
      const digestValueMatch = xmlAssinado.match(/<DigestValue>([^<]+)<\/DigestValue>/);
      if (!digestValueMatch) {
        throw new Error('Valor do digest não encontrado');
      }
      const digestValue = digestValueMatch[1];

      // Recalcula o hash do conteúdo
      const xmlCanonicalizado = this.canonicalizarXML(xmlAssinado);
      const md = forge.md.sha1.create();
      md.update(xmlCanonicalizado, 'utf8');
      const calculatedDigest = forge.util.encode64(md.digest().bytes());

      // Verifica se os digests coincidem
      if (calculatedDigest !== digestValue) {
        return false;
      }

      // Recria o SignedInfo para verificação
      const signedInfoMatch = xmlAssinado.match(/<SignedInfo[^>]*>([\s\S]*?)<\/SignedInfo>/);
      if (!signedInfoMatch) {
        return false;
      }

      const signedInfoCanonical = this.canonicalizarXML(signedInfoMatch[0]);
      const verifyMd = forge.md.sha1.create();
      verifyMd.update(signedInfoCanonical, 'utf8');

      // Verifica a assinatura RSA
      return publicKey.verify(verifyMd.digest().bytes(), signatureValue);
    } catch (error: any) {
      console.error('Erro na verificação da assinatura:', error);
      return false;
    }
  }

  /**
   * Proper C14N canonicalization for XMLDSIG.
   * Preserves xmlns attributes (required for GINFES XSD validation).
   */
  private canonicalizarXML(xml: string): string {
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
    // Normalize whitespace between tags
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
  private extractElementById(xml: string, id: string): string | null {
    const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const openRegex = new RegExp(`<([\\w]+)([^>]*?)Id="${escapedId}"([^>]*?)>`, 'i');
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

  private getElementName(xml: string, id: string): string {
    const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`<(\\w+)[^>]*Id="${escapedId}"`, 'i');
    const match = xml.match(regex);
    return match ? match[1] : 'InfRps';
  }

  /**
   * Extrai o certificado X509 em formato DER e converte para Base64
   */
  private extrairX509Base64(certificadoPem: string): string {
    const cert = forge.pki.certificateFromPem(certificadoPem);
    const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
    return forge.util.encode64(certDer);
  }
}

/**
 * Factory para criar instância do serviço de assinatura
 */
export function criarAssinaturaService(certificado?: CertificadoDigital): AssinaturaDigitalService {
  return new AssinaturaDigitalService(certificado);
}

/**
 * Valida se um certificado está dentro da validade
 * @param info Informações do certificado
 * @param diasAntecedencia Número de dias antes da expiração para considerar válido
 */
export function certificadoEstaValido(info: CertificadoInfo, diasAntecedencia: number = 0): boolean {
  const hoje = new Date();
  const dataLimite = new Date(info.validoAte);
  dataLimite.setDate(dataLimite.getDate() - diasAntecedencia);
  return hoje <= dataLimite;
}

/**
 * Calcula dias até a expiração do certificado
 */
export function diasAteExpiracao(info: CertificadoInfo): number {
  const hoje = new Date();
  const dataValidade = new Date(info.validoAte);
  const diffTime = dataValidade.getTime() - hoje.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
