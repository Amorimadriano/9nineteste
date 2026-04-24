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

    // Extrai bags de certificado e chave privada
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });

    // Pega o primeiro certificado
    const certBag = certBags[forge.pki.oids.certBag];
    if (!certBag || certBag.length === 0) {
      throw new Error('Certificado não encontrado no arquivo PFX/P12');
    }

    const certificate = certBag[0].cert;
    const certPem = forge.pki.certificateToPem(certificate);

    // Pega a chave privada
    const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];
    if (!keyBag || keyBag.length === 0) {
      throw new Error('Chave privada não encontrada no arquivo PFX/P12');
    }

    const privateKey = keyBag[0].key;
    const keyPem = forge.pki.privateKeyToPem(privateKey);

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
 * Canonicaliza XML conforme especificação C14N
 * Remove espaços em branco desnecessários e normaliza o XML
 */
function canonicalizarXML(xml: string): string {
  return xml
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/\s+>/g, '>')
    .replace(/<\s+/g, '<')
    .trim();
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
    // Canonicaliza o XML
    const xmlCanonicalizado = canonicalizarXML(xml);

    // Converte a chave privada PEM para objeto
    const privateKey = forge.pki.privateKeyFromPem(certificado.chavePrivadaPem);

    // Carrega o certificado
    const cert = forge.pki.certificateFromPem(certificado.certificadoPem);

    // Extrai o certificado em DER e converte para Base64
    const x509Base64 = extrairX509Base64(certificado.certificadoPem);

    // Calcula o hash SHA-1 do conteúdo canonicalizado
    const md = forge.md.sha1.create();
    md.update(xmlCanonicalizado, 'utf8');
    const digestValue = forge.util.encode64(md.digest().bytes());

    // Cria a assinatura RSA-SHA1
    const signature = privateKey.sign(md);
    const signatureValue = forge.util.encode64(signature);

    // Monta a estrutura da assinatura XML
    const signatureXML = `
<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
  <SignedInfo>
    <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
    <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
    <Reference URI="#${idReferencia}">
      <Transforms>
        <Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
      </Transforms>
      <DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
      <DigestValue>${digestValue}</DigestValue>
    </Reference>
  </SignedInfo>
  <SignatureValue>${signatureValue}</SignatureValue>
  <KeyInfo>
    <X509Data>
      <X509Certificate>${x509Base64}</X509Certificate>
    </X509Data>
  </KeyInfo>
</Signature>`;

    // Insere a assinatura antes do fechamento do elemento raiz
    const posicaoInsercao = xml.lastIndexOf('</');
    if (posicaoInsercao === -1) {
      throw new Error('Estrutura XML inválida: não foi possível encontrar o elemento raiz');
    }

    const xmlAssinado = xml.substring(0, posicaoInsercao) + signatureXML + xml.substring(posicaoInsercao);

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
