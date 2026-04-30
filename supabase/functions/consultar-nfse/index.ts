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

function construirXmlConsultaRps(
  numeroRps: string,
  serie: string,
  tipo: string,
  cnpj: string,
  inscricaoMunicipal: string
): string {

  const tipoCodigo =
    tipo === "RPS" || tipo === "1" ? "1" :
    tipo === "RPS-M" || tipo === "2" ? "2" :
    tipo === "3" ? "3" : "1";

  return `<?xml version="1.0" encoding="UTF-8"?>
<ConsultarNfseRpsEnvio xmlns="http://www.ginfes.com.br/servico_consultar_nfse_rps_envio_v03.xsd">
  <IdentificacaoRps>
    <Numero>${numeroRps}</Numero>
    <Serie>${serie}</Serie>
    <Tipo>${tipoCodigo}</Tipo>
  </IdentificacaoRps>
  <Prestador>
    <Cnpj>${cnpj}</Cnpj>
    <InscricaoMunicipal>${inscricaoMunicipal}</InscricaoMunicipal>
  </Prestador>
</ConsultarNfseRpsEnvio>`;
}

function criarEnvelopeSOAPGinfes(soapAction: string, cabecalhoXml: string, dadosXml: string, ambiente?: string): string {
  const ginfesNs = ambiente === "producao" ? "http://producao.ginfes.com.br" : "http://homologacao.ginfes.com.br";
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <ns1:${soapAction} xmlns:ns1="${ginfesNs}">
      <arg0><![CDATA[${cabecalhoXml}]]></arg0>
      <arg1><![CDATA[${dadosXml}]]></arg1>
    </ns1:${soapAction}>
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

async function enviarRequisicaoSOAP(soapEnvelope: string, certificado?: { certPem: string; keyPem: string }): Promise<string> {
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
  if (!certificado) throw new Error("Certificado obrigatorio em producao");
  const proxyUrl = Deno.env.get("MTLS_PROXY_URL");
  if (!proxyUrl) throw new Error("MTLS_PROXY_URL nao configurada");
  const proxyApiKey = Deno.env.get("MTLS_PROXY_API_KEY") || "";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (proxyApiKey) headers["X-API-Key"] = proxyApiKey;
  const proxyResponse = await fetch(`${proxyUrl}/proxy-ginfes`, {
    method: "POST",
    headers,
    body: JSON.stringify({ soapEnvelope, certPem: certificado.certPem, keyPem: certificado.keyPem, ambiente: env }),
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

function decodeHtmlEntities(str: string): string {
  return str.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}

function parsearRespostaConsulta(xml: string) {
  try {
    let workXml = xml;
    let returnContent: string | null = null;

    const cdataMatch = xml.match(/<return[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/return>/i);
    if (cdataMatch) returnContent = cdataMatch[1];

    if (!returnContent) {
      const escapedMatch = xml.match(/<return[^>]*>([\s\S]*?)<\/return>/i);
      if (escapedMatch) {
        let content = escapedMatch[1].trim();
        content = decodeHtmlEntities(content);
        if (content.length > 10) returnContent = content;
      }
    }

    if (!returnContent) {
      const anyCdata = xml.match(/<!\[CDATA\[([\s\S]*?)\]\]>/i);
      if (anyCdata) returnContent = anyCdata[1];
    }

    if (returnContent && returnContent.length > 10) workXml = returnContent;

    const cleanXml = workXml.replace(/<\/?[a-zA-Z0-9_]+:/g, (match) => match.startsWith("</") ? "</" : "<");

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

    return {
      sucesso: true,
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
      mensagens: [{ codigo: "0000", mensagem: "Consulta realizada com sucesso", tipo: "Sucesso" }],
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
    if (!notaId) return new Response(JSON.stringify({ error: "notaId obrigatorio" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: nota, error: notaError } = await supabase.from("notas_fiscais_servico").select("*").eq("id", notaId).eq("user_id", user.id).single();
    if (notaError || !nota) throw new Error("Nota nao encontrada");
    if (!nota.certificado_id) throw new Error("Certificado nao vinculado");

    const { data: certificado, error: certError } = await supabase.from("certificados_nfse").select("*").eq("id", nota.certificado_id).single();
    if (certError || !certificado) throw new Error("Certificado nao encontrado");
    if (!certificado.arquivo_pfx) throw new Error("Certificado sem arquivo PFX");

    const certDigital = await carregarCertificado(certificado.arquivo_pfx, certificado.senha || "");
    certDigital.inscricaoMunicipal = certificado.inscricao_municipal || "";
    certDigital.cnpj = certificado.cnpj || certDigital.cnpj || "";

    const ambiente = getAmbiente();
    let resultado;
    if (ambiente === "homologacao") {
      resultado = {
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
        tomador: { razaoSocial: nota.cliente_razao_social || nota.cliente_nome || "", cnpjCpf: nota.cliente_cnpj_cpf || "" },
        prestador: { cnpj: certificado.cnpj || "", inscricaoMunicipal: certificado.inscricao_municipal || "" },
        linkPdf: nota.link_pdf || undefined,
        linkXml: nota.link_xml || undefined,
        linkNfse: nota.link_nfse || undefined,
        discriminacao: nota.servico_descricao || "",
        itemListaServico: nota.servico_item_lista_servico || "",
        xmlRetorno: "<Consulta>true</Consulta>",
        xmlBruto: "<Consulta>true</Consulta>",
        mensagens: [{ codigo: "E001", mensagem: "Consulta realizada com sucesso - ambiente de homologacao", tipo: "Sucesso" }],
      };
    } else {
      const numeroRps = nota.numero_rps || nota.numero_nota || "";
      const xmlConsulta = construirXmlConsultaRps(numeroRps, nota.serie || "1", nota.tipo_rps || "RPS", certDigital.cnpj, certDigital.inscricaoMunicipal);
      const cabecalho = criarCabecalhoGinfes();
      const soapEnvelope = criarEnvelopeSOAPGinfes("ConsultarNfsePorRpsV3", cabecalho, xmlConsulta, "producao");
      const soapResponse = await retry(() => enviarRequisicaoSOAP(soapEnvelope, { certPem: certDigital.certPem, keyPem: certDigital.keyPem }));
      resultado = { ...parsearRespostaConsulta(soapResponse), xmlEnvio: xmlConsulta, xmlBruto: soapResponse.substring(0, 8000) };
    }

    if (resultado.sucesso) {
      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      if (resultado.numeroNfse) updateData.numero_nota = resultado.numeroNfse;
      if (resultado.codigoVerificacao) updateData.codigo_verificacao = resultado.codigoVerificacao;
      if (resultado.dataAutorizacao) updateData.data_autorizacao = resultado.dataAutorizacao;
      if (resultado.linkPdf) updateData.link_pdf = resultado.linkPdf;
      if (resultado.linkXml) updateData.link_xml = resultado.linkXml;
      if (resultado.linkNfse) updateData.link_nfse = resultado.linkNfse;
      if (resultado.xmlRetorno) updateData.xml_retorno = resultado.xmlRetorno;
      if (resultado.status) updateData.status = resultado.status === "substituida" ? "cancelada" : resultado.status;
      await supabase.from("notas_fiscais_servico").update(updateData).eq("id", notaId).eq("user_id", user.id);
    }

    return new Response(JSON.stringify(resultado), { status: resultado.sucesso ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Erro ao consultar NFS-e:", err);
    if (notaId) {
      try {
        const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        await supabase.from("notas_fiscais_servico").update({ status: "erro", mensagem_erro: (err as Error).message }).eq("id", notaId);
      } catch (dbErr) { console.error("Falha ao atualizar status de erro:", dbErr); }
    }
    return new Response(JSON.stringify({ sucesso: false, mensagens: [{ codigo: "ERROR", mensagem: (err as Error).message, tipo: "Erro" }] }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
