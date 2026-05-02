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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================
// API Paulistana - Cancelamento NFS-e
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

/**
 * Proper C14N canonicalization for XMLDSIG.
 */
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

/**
 * Extract XML element by Id with proper nested tag handling.
 */
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
  return match ? match[1] : "PedidoCancelamentoNFe";
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
    const cnAttr = subject.attributes.find((a: any) =>
      a.oid === "2.5.4.5" || a.oid === "2.16.840.1.113730.4.1" || a.oid === "0.9.2342.19200300.100.1.1" || a.shortName === "CN"
    );
    if (cnAttr) {
      const cnpjMatch = cnAttr.value.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
      if (cnpjMatch) cnpj = cnpjMatch[0].replace(/\D/g, "");
    }
  }

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
    throw new Error("Não foi possível extrair certificado ou chave privada do arquivo PFX");
  }

  return { pfxBase64, senha, cnpj, inscricaoMunicipal: "", razaoSocial, certPem, keyPem, validoAte };
}

function construirXmlCancelamentoPaulistana(
  numeroNfse: string,
  codigoVerificacao: string,
  inscricaoPrestador: string,
  motivoCancelamento: string
): string {
  const pedidoId = `CANC${numeroNfse}`;
  return `<PedidoCancelamentoNFe xmlns="http://www.prefeitura.sp.gov.br/nfe" Id="${pedidoId}">
  <Cabecalho Versao="1">
    <CPFCNPJRemetente>
      <CNPJ>${inscricaoPrestador}</CNPJ>
    </CPFCNPJRemetente>
    <transacao>true</transacao>
  </Cabecalho>
  <Detalhe>
    <ChaveNFe>
      <InscricaoPrestador>${inscricaoPrestador}</InscricaoPrestador>
      <NumeroNFe>${numeroNfse}</NumeroNFe>
      <CodigoVerificacao>${codigoVerificacao}</CodigoVerificacao>
    </ChaveNFe>
    <MotivoCancelamento>${motivoCancelamento}</MotivoCancelamento>
  </Detalhe>
</PedidoCancelamentoNFe>`;
}

/**
 * Signs XML using XMLDSig SHA-256. Throws error on failure instead of returning unsigned XML.
 */
function assinarXmlSHA256(xml: string, certificado: CertificadoDigital, idReferencia: string): string {
  const forge = (globalThis as any).forge;
  if (!forge) {
    throw new Error("node-forge não está disponível para assinatura XML. Cancelamento em produção requer assinatura digital.");
  }
  try {
    const privateKey = forge.pki.privateKeyFromPem(certificado.keyPem);
    const certificate = forge.pki.certificateFromPem(certificado.certPem);
    const referencedXml = extractElementById(xml, idReferencia);
    if (!referencedXml) {
      throw new Error(`Elemento com Id="${idReferencia}" não encontrado no XML para assinatura`);
    }
    const canonReferenced = canonicalizeXml(referencedXml);
    const digest = forge.md.sha256.create();
    digest.update(canonReferenced, "utf8");
    const digestBase64 = forge.util.encode64(digest.digest().bytes());

    const signedInfoXml = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#"><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></CanonicalizationMethod><SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha256"></SignatureMethod><Reference URI="#${idReferencia}"><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform></Transforms><DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha256"></DigestMethod><DigestValue>${digestBase64}</DigestValue></Reference></SignedInfo>`;

    const canonSignedInfo = canonicalizeXml(signedInfoXml);
    const signatureMd = forge.md.sha256.create();
    signatureMd.update(canonSignedInfo, "utf8");
    const signatureBytes = privateKey.sign(signatureMd);
    const signatureBase64 = forge.util.encode64(signatureBytes);
    const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(certificate)).getBytes();
    const certBase64 = forge.util.encode64(certDer);

    const signatureBlock = `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><SignedInfo><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></CanonicalizationMethod><SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha256"></SignatureMethod><Reference URI="#${idReferencia}"><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform></Transforms><DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha256"></DigestMethod><DigestValue>${digestBase64}</DigestValue></Reference></SignedInfo><SignatureValue>${signatureBase64}</SignatureValue><KeyInfo><X509Data><X509Certificate>${certBase64}</X509Certificate></X509Data></KeyInfo></Signature>`;

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

function criarEnvelopeSOAP11Paulistana(operacao: string, xmlAssinado: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Header/>
  <soapenv:Body>
    <${operacao} xmlns="http://www.prefeitura.sp.gov.br/nfe">
      <MensagemXML><![CDATA[
${xmlAssinado}
      ]]></MensagemXML>
    </${operacao}>
  </soapenv:Body>
</soapenv:Envelope>`;
}

function getAmbiente(): "homologacao" | "producao" {
  return (Deno.env.get("NFSE_AMBIENTE") || "homologacao") as "homologacao" | "producao";
}

const PAULISTANA_URL = "https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx";

async function enviarRequisicaoSOAP(
  soapEnvelope: string,
  soapAction: string,
  certificado?: { certPem: string; keyPem: string },
): Promise<string> {
  const env = getAmbiente();
  const baseHeaders: Record<string, string> = {
    "Content-Type": "text/xml; charset=utf-8",
    "SOAPAction": `"${soapAction}"`,
  };

  if (env === "homologacao") {
    const response = await fetch(PAULISTANA_URL, {
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

  if (!certificado) {
    throw new Error("Certificado digital é obrigatório para cancelamento em produção.");
  }

  const proxyUrl = (Deno.env.get("MTLS_PROXY_URL") || "").replace(/\/+$/g, "");
  const proxyApiKey = Deno.env.get("MTLS_PROXY_API_KEY") || "";

  if (!proxyUrl) {
    throw new Error(
      "Variável MTLS_PROXY_URL não configurada. " +
      "O cancelamento em produção requer um proxy mTLS."
    );
  }

  console.log("cancelar-nfse: enviando via proxy mTLS para", proxyUrl);

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
      ambiente: env,
    }),
  });

  if (!proxyResponse.ok) {
    const text = await proxyResponse.text();
    throw new Error(`Erro proxy mTLS (${proxyResponse.status}): ${text.substring(0, 500)}`);
  }

  return await proxyResponse.text();
}

function parsearErrosPaulistana(xml: string): Array<{ codigo: string; mensagem: string; tipo: string }> {
  const erros: Array<{ codigo: string; mensagem: string; tipo: string }> = [];
  const ERROS_PAULISTANA: Record<string, string> = {
    "1001": "CNPJ do remetente inválido",
    "1002": "Inscrição Municipal inválida",
    "1003": "NFS-e não encontrada",
    "1004": "Código de verificação inválido",
    "1005": "Motivo de cancelamento inválido",
    "1006": "Prazo de cancelamento excedido",
    "1007": "NFS-e já cancelada",
    "1008": "Certificado digital inválido",
    "1009": "Assinatura digital inválida",
    "1010": "XML mal formatado",
    "1011": "Erro interno",
    "1012": "Requisição mal formada",
    "1013": "Não é permitido cancelar NFS-e substituída",
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

/**
 * Analisa erro de cancelamento via Orquestrador Multi-LLM
 */
async function analisarErroCancelamentoComIA(
  xmlRetorno: string,
  motivo: string,
  authHeader: string
): Promise<{ explicacao: string; acaoSugerida: string } | null> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) return null;

    const res = await fetch(`${supabaseUrl}/functions/v1/ai-orchestrator`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        taskType: "reasoning",
        messages: [
          {
            role: "system",
            content:
              "Você é um especialista em NFS-e API Paulistana (Prefeitura de SP) e legislação tributária. Analise o erro de cancelamento e forneça explicação clara + ação sugerida. Retorne APENAS um JSON válido com: { explicacao: string, acaoSugerida: string }.",
          },
          {
            role: "user",
            content: `Motivo informado para cancelamento: "${motivo}"\n\nXML de resposta da prefeitura:\n${xmlRetorno.substring(0, 3000)}`,
          },
        ],
        temperature: 0.2,
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || data.content || "";
    const clean = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

function parsearRespostaCancelamento(xml: string) {
  try {
    let workXml = xml;
    const cdataMatch = xml.match(/<(?:MensagemXML|return)[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/(?:MensagemXML|return)>/i);
    if (cdataMatch) workXml = cdataMatch[1];
    if (!cdataMatch && workXml.includes("&lt;")) {
      workXml = workXml.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
    }
    const cleanXml = workXml.replace(/<\/?[a-zA-Z0-9_]+:/g, m => (m.startsWith("</") ? "</" : "<"));

    const sucessoMatch = cleanXml.match(/<Sucesso>([^<]+)<\/Sucesso>/i);
    const sucesso = sucessoMatch?.[1]?.toLowerCase() === "true";
    const erros = parsearErrosPaulistana(cleanXml);

    if (sucesso || erros.length === 0) {
      return { sucesso: true, xmlRetorno: xml, mensagens: [{ codigo: "0000", mensagem: "Cancelamento realizado com sucesso", tipo: "Sucesso" }] };
    }
    return { sucesso: false, xmlRetorno: xml, mensagens: erros.length > 0 ? erros : [{ codigo: "ERR_CANCEL", mensagem: "Erro desconhecido no cancelamento", tipo: "Erro" }] };
  } catch (error) {
    return { sucesso: false, xmlRetorno: xml, mensagens: [{ codigo: "ERR_PARSE", mensagem: `Erro ao processar resposta: ${(error as Error).message}`, tipo: "Erro" }] };
  }
}

// ============================================
// Handler
// ============================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    const corsHeaders = getCorsHeaders(req);
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
    certDigital.cnpj = certificado.cnpj || certDigital.cnpj || "";

    console.log(`Cancelando NFS-e número: ${nota.numero_nota || nota.numero_rps}`);

    const ambiente = Deno.env.get("NFSE_AMBIENTE") || "homologacao";
    let resultado;

    if (ambiente === "homologacao") {
      resultado = cancelarHomologacao(nota, certificado, motivoCancelamento);
    } else {
      resultado = await cancelarProducao(nota, certDigital, motivoCancelamento);
    }

    // Se falhou, enriquece com análise de IA via orquestrador
    if (!resultado.sucesso && resultado.xmlRetorno) {
      const analiseIA = await analisarErroCancelamentoComIA(resultado.xmlRetorno, motivoCancelamento, authHeader);
      if (analiseIA) {
        (resultado as any).analiseIA = analiseIA;
      }
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
      if ((resultado as any).analiseIA) {
        updateData.mensagem_erro += ` | IA: ${(resultado as any).analiseIA.acaoSugerida}`;
      }
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

function cancelarHomologacao(nota: any, certificado: any, motivoCancelamento: string) {
  console.log("Ambiente de homologação - retornando cancelamento simulado (Paulistana)");
  const xmlEnvio = construirXmlCancelamentoPaulistana(
    nota.numero_nota || nota.numero_rps || "",
    nota.codigo_verificacao || "",
    certificado.inscricao_municipal || "",
    motivoCancelamento
  );
  return {
    sucesso: true,
    xmlEnvio,
    xmlRetorno: "<Cancelamento>true</Cancelamento>",
    mensagens: [{
      codigo: "E001",
      mensagem: "Cancelamento processado com sucesso - ambiente de homologação (Paulistana)",
      tipo: "Sucesso",
    }],
  };
}

async function cancelarProducao(nota: any, certDigital: CertificadoDigital, motivoCancelamento: string) {
  const numeroNfse = nota.numero_nota || nota.numero_rps || "";
  const codigoVerificacao = nota.codigo_verificacao || "";
  const inscricaoMunicipal = certDigital.inscricaoMunicipal || "";

  if (!numeroNfse || !codigoVerificacao) {
    throw new Error("Nota fiscal não possui número da NFSe ou código de verificação necessários para cancelamento na API Paulistana.");
  }

  const xmlCancelamento = construirXmlCancelamentoPaulistana(numeroNfse, codigoVerificacao, inscricaoMunicipal, motivoCancelamento);
  const pedidoId = `CANC${numeroNfse}`;
  const signedXml = assinarXmlSHA256(xmlCancelamento, certDigital, pedidoId);

  const operacao = "CancelamentoNFe";
  const soapEnvelope = criarEnvelopeSOAP11Paulistana(operacao, signedXml);
  const soapAction = `http://www.prefeitura.sp.gov.br/nfe/${operacao}`;

  console.log("=== NFS-e Cancelamento Produção (Paulistana) ===");
  console.log("NFS-e:", numeroNfse, "Inscricao:", inscricaoMunicipal);

  const soapResponse = await enviarRequisicaoSOAP(soapEnvelope, soapAction, {
    certPem: certDigital.certPem,
    keyPem: certDigital.keyPem,
  });
  console.log("Resposta Paulistana Cancelamento:", soapResponse.substring(0, 500));
  const resultado = parsearRespostaCancelamento(soapResponse);
  return { ...resultado, xmlEnvio: signedXml };
}
