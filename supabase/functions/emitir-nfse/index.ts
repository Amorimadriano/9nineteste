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

function getAmbiente(): "homologacao" | "producao" {
  return (Deno.env.get("NFSE_AMBIENTE") || "homologacao") as "homologacao" | "producao";
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function canonicalizeXml(xml: string): string {
  return xml.replace(/>\s+</g, "><").replace(/\s+xmlns[^"]*"[^"]*"/g, "").replace(/\s+/g, " ").trim();
}

function extractElementById(xml: string, id: string): string | null {
  const regex = new RegExp(`(<\\w+[^>]*Id="${id}"[^>]*>[\\s\\S]*?<\\/\\w+>)`, "i");
  const match = xml.match(regex);
  return match ? match[1] : null;
}

function getElementName(xml: string, id: string): string {
  const regex = new RegExp(`<(\\w+)[^>]*Id="${id}"`, "i");
  const match = xml.match(regex);
  return match ? match[1] : "InfRps";
}

async function carregarCertificado(pfxBase64: string, senha: string): Promise<CertificadoDigital> {
  const forge = await import("https://esm.sh/node-forge@1.3.1/dist/forge.js");
  (globalThis as any).forge = forge;
  const pfxDer = forge.util.decode64(pfxBase64);
  const p12Asn1 = forge.asn1.fromDer(pfxDer);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, senha);

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShorthandKeyBag });

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
    const cnAttr = subject.attributes.find((a: any) =>
      a.oid === "2.16.840.1.113730.4.1" || a.oid === "0.9.2342.19200300.100.1.1" || a.shortName === "CN"
    );
    if (cnAttr) {
      const cnpjMatch = cnAttr.value.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
      if (cnpjMatch) cnpj = cnpjMatch[0].replace(/\D/g, "");
    }
  }

  if (keyBags[forge.pki.oids.pkcs8ShorthandKeyBag]) {
    const key = keyBags[forge.pki.oids.pkcs8ShorthandKeyBag]![0];
    keyPem = forge.pki.privateKeyToPem(key.key!);
  } else {
    const keyBags2 = p12.getBags({ bagType: forge.pki.oids.keyBag });
    if (keyBags2[forge.pki.oids.keyBag]) {
      const key = keyBags2[forge.pki.oids.keyBag]![0];
      keyPem = forge.pki.privateKeyToPem(key.key!);
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

  return `<InfRps Id="${rpsId}">
      <IdentificacaoRps>
        <Numero>${dados.identificacaoRps.numero}</Numero>
        <Serie>${dados.identificacaoRps.serie}</Serie>
        <Tipo>${dados.identificacaoRps.tipo}</Tipo>
      </IdentificacaoRps>
      <DataEmissao>${dados.dataEmissao}</DataEmissao>
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
          <CodigoMunicipio>${dados.tomador.endereco.cidade || ""}</CodigoMunicipio>
          <Uf>${dados.tomador.endereco.uf}</Uf>
          <Cep>${dados.tomador.endereco.cep}</Cep>
        </Endereco>` : ""}
        ${dados.tomador.email ? `<Contato><Email>${dados.tomador.email}</Email>${dados.tomador.telefone ? `<Telefone>${dados.tomador.telefone}</Telefone>` : ""}</Contato>` : ""}
      </Tomador>
    </InfRps>`;
}

function construirXmlLoteRps(dados: DadosNota, xmlRps: string, _certificado: CertificadoDigital): string {
  const numeroLote = Date.now().toString();
  const loteId = `LOTE${numeroLote}`;
  return `<EnviarLoteRpsEnvio xmlns="${ABRASF_NAMESPACES.servicoEnviar}">
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
}

function assinarXml(xml: string, certificado: CertificadoDigital, idReferencia: string): string {
  const forge = (globalThis as any).forge;
  if (!forge) {
    console.warn("node-forge not available for XML signing");
    return xml;
  }
  try {
    const privateKey = forge.pki.privateKeyFromPem(certificado.keyPem);
    const certificate = forge.pki.certificateFromPem(certificado.certPem);
    const referencedXml = extractElementById(xml, idReferencia);
    if (!referencedXml) {
      console.warn(`Element with Id="${idReferencia}" not found, skipping signature`);
      return xml;
    }
    const canonReferenced = canonicalizeXml(referencedXml);
    const digest = forge.md.sha1.create();
    digest.update(canonReferenced);
    const digestBase64 = forge.util.encode64(digest.digest().bytes());

    const signedInfoXml = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
      <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
      <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
      <Reference URI="#${idReferencia}">
        <Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/></Transforms>
        <DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
        <DigestValue>${digestBase64}</DigestValue>
      </Reference>
    </SignedInfo>`;

    const canonSignedInfo = canonicalizeXml(signedInfoXml);
    const signatureMd = forge.md.sha1.create();
    signatureMd.update(canonSignedInfo);
    const signatureBytes = privateKey.sign(signatureMd);
    const signatureBase64 = forge.util.encode64(signatureBytes);

    const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(certificate)).getBytes();
    const certBase64 = forge.util.encode64(certDer);

    const signatureBlock = `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
      <SignedInfo>
        <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
        <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
        <Reference URI="#${idReferencia}">
          <Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/></Transforms>
          <DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
          <DigestValue>${digestBase64}</DigestValue>
        </Reference>
      </SignedInfo>
      <SignatureValue>${signatureBase64}</SignatureValue>
      <KeyInfo>
        <X509Data>
          <X509Certificate>${certBase64}</X509Certificate>
        </X509Data>
      </KeyInfo>
    </Signature>`;

    return xml.replace(
      `</${getElementName(xml, idReferencia)}>`,
      `${signatureBlock}</${getElementName(xml, idReferencia)}>`
    );
  } catch (error) {
    console.error("Error signing XML:", error);
    return xml;
  }
}

function criarEnvelopeSOAP(_soapAction: string, xmlBody: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"
                  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap12:Header>
    <ns2:cabecalho xmlns:ns2="http://www.ginfes.com.br/cabecalho_v03.xsd" versao="3">
      <versaoDados>4</versaoDados>
    </ns2:cabecalho>
  </soap12:Header>
  <soap12:Body>
    ${xmlBody}
  </soap12:Body>
</soap12:Envelope>`;
}

async function enviarRequisicaoSOAP(soapEnvelope: string): Promise<string> {
  const config = {
    homologacao: { url: "https://homologacao.ginfes.com.br/ServiceGinfesImpl" },
    producao: { url: "https://producao.ginfes.com.br/ServiceGinfesImpl" },
  };
  const env = getAmbiente();

  const response = await fetch(config[env].url, {
    method: "POST",
    headers: {
      "Content-Type": "application/soap+xml; charset=utf-8",
      "SOAPAction": "",
    },
    body: soapEnvelope,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro HTTP ${response.status}: ${text.substring(0, 500)}`);
  }
  return await response.text();
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

    if (certError || !certificado) {
      throw new Error("Certificado não encontrado ou não pertence ao usuário");
    }

    if (!certificado.arquivo_pfx) {
      throw new Error("Certificado não possui arquivo PFX. Faça upload novamente.");
    }

    const certDigital = await carregarCertificado(certificado.arquivo_pfx, certificado.senha || "");
    certDigital.inscricaoMunicipal = certificado.inscricao_municipal || "";
    certDigital.cnpj = certificado.cnpj || "";

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

    if (notaError || !nota) {
      throw new Error("Nota fiscal não encontrada");
    }

    const dadosNota: DadosNota = {
      identificacaoRps: {
        numero: nota.numero_rps || nota.numero_nota || gerarNumeroRps(),
        serie: nota.serie || "1",
        tipo: nota.tipo_rps || "RPS",
      },
      dataEmissao: nota.data_emissao || new Date().toISOString(),
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
          logradouro: certificado.endereco?.logradouro || "",
          numero: certificado.numero || "",
          bairro: certificado.bairro || "",
          codigoMunicipio: certificado.codigo_municipio || "3550308",
          uf: certificado.uf || "SP",
          cep: certificado.cep || "",
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

    console.log("Emitindo NFS-e:", dadosNota.identificacaoRps.numero);

    const ambiente = Deno.env.get("NFSE_AMBIENTE") || "homologacao";
    let resultado;

    if (ambiente === "homologacao") {
      resultado = emitirHomologacao(dadosNota);
    } else {
      resultado = await emitirProducao(dadosNota, certDigital);
    }

    const updateData: any = {
      status: resultado.sucesso ? "autorizada" : "rejeitada",
      xml_envio: resultado.xmlEnvio || null,
      xml_retorno: resultado.xmlRetorno || null,
      link_pdf: resultado.linkPdf || null,
      link_xml: resultado.linkXml || null,
      numero_nota: resultado.numeroNfse || nota.numero_nota,
      protocolo: resultado.protocolo || null,
      codigo_verificacao: resultado.codigoVerificacao || null,
      link_nfse: resultado.linkNfse || null,
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
        await supabase
          .from("notas_fiscais_servico")
          .update({ status: "erro", mensagem_erro: (err as Error).message })
          .eq("id", notaId);
      } catch {}
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
  const xmlRps = construirXmlRps(dadosNota);
  const rpsId = `R${dadosNota.emitente.cnpj}${dadosNota.identificacaoRps.numero}`;
  const signedRps = assinarXml(`<Rps xmlns="${ABRASF_NAMESPACES.tip}">${xmlRps}</Rps>`, certDigital, rpsId);
  const xmlLote = construirXmlLoteRps(dadosNota, signedRps, certDigital);
  const loteId = `LOTE${Date.now()}`;
  const signedLote = assinarXml(xmlLote, certDigital, loteId);
  const soapEnvelope = criarEnvelopeSOAP("RecepcionarLoteRpsV3", signedLote);
  const soapResponse = await enviarRequisicaoSOAP(soapEnvelope);
  return parsearRespostaEmissao(soapResponse);
}
