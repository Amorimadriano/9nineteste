import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ============================================
// INLINED: NFS-e GINFES Client Module (partial - cancelamento)
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
  servicoCancelar: "http://www.ginfes.com.br/servico_cancelar_nfse_envio_v03.xsd",
};

function getAmbiente(): "homologacao" | "producao" {
  return (Deno.env.get("NFSE_AMBIENTE") || "homologacao") as "homologacao" | "producao";
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
  return match ? match[1] : "Pedido";
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
    const cnAttr = subject.attributes.find((a: any) => a.shortName === "CN");
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

function construirXmlCancelamento(numeroNfse: string, cnpj: string, inscricaoMunicipal: string, codigoCancelamento: string): string {
  const pedidoId = `CANC${numeroNfse}`;
  return `<CancelarNfseEnvio xmlns="${ABRASF_NAMESPACES.servicoCancelar}">
  <Pedido Id="${pedidoId}">
    <InfPedidoCancelamento>
      <IdentificacaoNfse>
        <Numero>${numeroNfse}</Numero>
        <Cnpj>${cnpj}</Cnpj>
        <InscricaoMunicipal>${inscricaoMunicipal}</InscricaoMunicipal>
        <CodigoMunicipio>3550308</CodigoMunicipio>
      </IdentificacaoNfse>
      <CodigoCancelamento>${codigoCancelamento}</CodigoCancelamento>
    </InfPedidoCancelamento>
  </Pedido>
</CancelarNfseEnvio>`;
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
    if (!referencedXml) return xml;
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

    return xml.replace(`</${getElementName(xml, idReferencia)}>`, `${signatureBlock}</${getElementName(xml, idReferencia)}>`);
  } catch (error) {
    console.error("Error signing XML:", error);
    return xml;
  }
}

function criarEnvelopeSOAPGinfes(soapAction: string, cabecalhoXml: string, dadosXml: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"
                  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap12:Body>
    <${soapAction} xmlns="http://www.ginfes.com.br/">
      <arg0>${cabecalhoXml}</arg0>
      <arg1><![CDATA[${dadosXml}]]></arg1>
    </${soapAction}>
  </soap12:Body>
</soap12:Envelope>`;
}

function criarCabecalhoGinfes(): string {
  return `<cabecalho xmlns="http://www.ginfes.com.br/cabecalho_v03.xsd" versao="3"><versaoDados>3</versaoDados></cabecalho>`;
}

async function enviarRequisicaoSOAP(soapEnvelope: string): Promise<string> {
  const config = {
    homologacao: { url: "https://homologacao.ginfes.com.br/ServiceGinfesImpl" },
    producao: { url: "https://producao.ginfes.com.br/ServiceGinfesImpl" },
  };
  const env = getAmbiente();
  const response = await fetch(config[env].url, {
    method: "POST",
    headers: { "Content-Type": "application/soap+xml; charset=utf-8", "SOAPAction": "" },
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
    E26: "NFS-e não encontrada", E27: "Cancelamento não permitido",
    E28: "Certificado digital inválido", E29: "Assinatura digital inválida",
    E30: "Arquivo XML mal formatado", E31: "Acesso negado", E32: "Prazo de cancelamento excedido",
    E50: "Erro interno do servidor", E60: "Requisição mal formada",
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

function parsearRespostaCancelamento(xml: string) {
  try {
    const sucessoMatch = xml.match(/<Sucesso>true<\/Sucesso>/i);
    const mensagensErro = parsearErros(xml);
    if (sucessoMatch || mensagensErro.length === 0) {
      return { sucesso: true, xmlRetorno: xml, mensagens: [{ codigo: "0000", mensagem: "Cancelamento realizado com sucesso", tipo: "Sucesso" }] };
    }
    return { sucesso: false, xmlRetorno: xml, mensagens: mensagensErro.length > 0 ? mensagensErro : [{ codigo: "ERR_CANCEL", mensagem: "Erro desconhecido no cancelamento", tipo: "Erro" }] };
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
    const motivoCancelamento = body.motivoCancelamento || "E007";

    if (!notaId) {
      return new Response(
        JSON.stringify({ error: "notaId é obrigatório" }),
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
      throw new Error("Nota fiscal não encontrada");
    }

    if (nota.status !== "autorizada") {
      throw new Error(`Nota não pode ser cancelada. Status atual: ${nota.status}. Apenas notas autorizadas podem ser canceladas.`);
    }

    if (nota.data_autorizacao) {
      const dataAut = new Date(nota.data_autorizacao);
      const hoje = new Date();
      if (dataAut.toDateString() !== hoje.toDateString()) {
        throw new Error("Nota não pode ser cancelada. Só é permitido cancelar no mesmo dia da autorização (regra São Paulo).");
      }
    }

    if (!nota.certificado_id) {
      throw new Error("Certificado não vinculado à nota fiscal");
    }

    const { data: certificado, error: certError } = await supabase
      .from("certificados_nfse")
      .select("*")
      .eq("id", nota.certificado_id)
      .single();

    if (certError || !certificado) {
      throw new Error("Certificado não encontrado");
    }

    if (!certificado.arquivo_pfx) {
      throw new Error("Certificado não possui arquivo PFX. Faça upload novamente.");
    }

    const certDigital = await carregarCertificado(certificado.arquivo_pfx, certificado.senha || "");
    certDigital.inscricaoMunicipal = certificado.inscricao_municipal || "";
    certDigital.cnpj = certificado.cnpj || "";

    console.log(`Cancelando NFS-e número: ${nota.numero_nota || nota.numero_rps}`);

    const ambiente = Deno.env.get("NFSE_AMBIENTE") || "homologacao";
    let resultado;

    if (ambiente === "homologacao") {
      resultado = cancelarHomologacao(nota, certificado, motivoCancelamento);
    } else {
      resultado = await cancelarProducao(nota, certDigital, motivoCancelamento);
    }

    const updateData: any = {
      status: resultado.sucesso ? "cancelada" : "erro",
      motivo_cancelamento: motivoCancelamento,
    };

    if (resultado.xmlRetorno) {
      updateData.xml_retorno = resultado.xmlRetorno;
    }
    if (!resultado.sucesso) {
      updateData.mensagem_erro = resultado.mensagens?.map((m: any) => m.mensagem).join("; ");
    }

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
    console.error("Erro ao cancelar NFS-e:", err);

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

function cancelarHomologacao(nota: any, certificado: any, motivoCancelamento: string) {
  console.log("Ambiente de homologação - retornando cancelamento simulado");
  const xmlEnvio = construirXmlCancelamento(
    nota.numero_nota || nota.numero_rps || "",
    certificado.cnpj || "",
    certificado.inscricao_municipal || "",
    motivoCancelamento
  );
  return {
    sucesso: true,
    xmlEnvio,
    xmlRetorno: "<Cancelamento>true</Cancelamento>",
    mensagens: [{
      codigo: "E001",
      mensagem: "Cancelamento processado com sucesso - ambiente de homologação",
      tipo: "Sucesso",
    }],
  };
}

async function cancelarProducao(nota: any, certDigital: CertificadoDigital, motivoCancelamento: string) {
  const numeroNfse = nota.numero_nota || nota.numero_rps || "";
  const cnpj = certDigital.cnpj;
  const inscricaoMunicipal = certDigital.inscricaoMunicipal;
  const xmlCancelamento = construirXmlCancelamento(numeroNfse, cnpj, inscricaoMunicipal, motivoCancelamento);
  const pedidoId = `CANC${numeroNfse}`;
  const signedXml = assinarXml(xmlCancelamento, certDigital, pedidoId);
  const cabecalho = criarCabecalhoGinfes();
  const soapEnvelope = criarEnvelopeSOAPGinfes("CancelarNfseV3", cabecalho, signedXml);

  console.log("=== NFS-e Cancelamento Produção ===");
  console.log("NFS-e:", numeroNfse, "CNPJ:", cnpj);

  const soapResponse = await enviarRequisicaoSOAP(soapEnvelope);
  console.log("Resposta GINFES Cancelamento:", soapResponse.substring(0, 500));
  return parsearRespostaCancelamento(soapResponse);
}