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

// --- node-forge ---
let forgeCache: any = null;
async function getForge() {
  if (forgeCache) return forgeCache;
  const m = await import("https://esm.sh/node-forge@1.3.1");
  forgeCache = m.default?.util ? m.default : m.util ? m : (m as any).default?.default?.util ? (m as any).default.default : m;
  (globalThis as any).forge = forgeCache;
  return forgeCache;
}

interface CertificadoDigital {
  cnpj: string;
  inscricaoMunicipal: string;
  certPem: string;
  keyPem: string;
}

async function carregarCertificado(pfxBase64: string, senha: string): Promise<CertificadoDigital> {
  const forge = await getForge();
  const pfxDer = forge.util.decode64(pfxBase64);
  const p12Asn1 = forge.asn1.fromDer(pfxDer);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, senha);

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  let certPem = "", keyPem = "", cnpj = "";

  if (certBags[forge.pki.oids.certBag]) {
    const cert = certBags[forge.pki.oids.certBag]![0];
    certPem = forge.pki.certificateToPem(cert.cert!);
    const subject = cert.cert!.subject;
    const icpCnpj = subject.attributes.find((a: any) => a.oid === "2.16.76.1.3.3");
    if (icpCnpj) {
      const d = icpCnpj.value.replace(/\D/g, "");
      if (d.length >= 14) cnpj = d.substring(d.length - 14);
    }
    if (!cnpj) {
      const ou = subject.attributes.find((a: any) => a.oid === "2.5.4.11" && /CNPJ/i.test(a.value));
      if (ou) {
        const m = ou.value.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
        if (m) cnpj = m[0].replace(/\D/g, "");
      }
    }
    if (!cnpj) {
      const cn = subject.attributes.find((a: any) => a.shortName === "CN");
      if (cn) {
        const m = cn.value.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
        if (m) cnpj = m[0].replace(/\D/g, "");
      }
    }
  }

  const keyBagsShrouded = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  if (keyBagsShrouded[forge.pki.oids.pkcs8ShroudedKeyBag]?.length > 0) {
    keyPem = forge.pki.privateKeyToPem(keyBagsShrouded[forge.pki.oids.pkcs8ShroudedKeyBag]![0].key!);
  } else {
    const keyBagsShorthand = p12.getBags({ bagType: forge.pki.oids.pkcs8ShorthandKeyBag });
    if (keyBagsShorthand[forge.pki.oids.pkcs8ShorthandKeyBag]?.length > 0) {
      keyPem = forge.pki.privateKeyToPem(keyBagsShorthand[forge.pki.oids.pkcs8ShorthandKeyBag]![0].key!);
    } else {
      const keyBagsPlain = p12.getBags({ bagType: forge.pki.oids.keyBag });
      if (keyBagsPlain[forge.pki.oids.keyBag]?.length > 0) {
        keyPem = forge.pki.privateKeyToPem(keyBagsPlain[forge.pki.oids.keyBag]![0].key!);
      }
    }
  }

  if (!certPem || !keyPem) throw new Error("Nao foi possivel extrair certificado ou chave do PFX");
  return { cnpj, inscricaoMunicipal: "", certPem, keyPem };
}

// --- XML builders ---
function xmlConsultaRps(numeroRps: string, serie: string, tipo: string, cnpj: string, im: string): string {
  const tipoCodigo = tipo === "RPS" || tipo === "1" ? "1" : tipo === "2" ? "2" : tipo === "3" ? "3" : "1";
  return `<ConsultarNfseRpsEnvio xmlns="http://www.ginfes.com.br/servico_consultar_nfse_rps_envio_v03.xsd">
<IdentificacaoRps>
<Numero>${numeroRps}</Numero>
<Serie>${serie}</Serie>
<Tipo>${tipoCodigo}</Tipo>
</IdentificacaoRps>
<Prestador>
<Cnpj>${cnpj}</Cnpj>
<InscricaoMunicipal>${im}</InscricaoMunicipal>
</Prestador>
</ConsultarNfseRpsEnvio>`;
}

function xmlConsultaServicoPrestado(cnpj: string, im: string, dataInicio?: string, dataFim?: string, cnpjTomador?: string, cpfTomador?: string): string {
  let xml = `<ConsultarNfseServicoPrestadoEnvio xmlns="http://www.ginfes.com.br/servico_consultar_nfse_servico_prestado_envio_v03.xsd">
<Prestador>
<Cnpj>${cnpj}</Cnpj>
<InscricaoMunicipal>${im}</InscricaoMunicipal>
</Prestador>`;
  if (cnpjTomador || cpfTomador) {
    xml += `\n<Tomador>\n<CpfCnpj>`;
    if (cnpjTomador) xml += `\n<Cnpj>${cnpjTomador}</Cnpj>`;
    if (cpfTomador) xml += `\n<Cpf>${cpfTomador}</Cpf>`;
    xml += `\n</CpfCnpj>\n</Tomador>`;
  }
  if (dataInicio) {
    xml += `\n<Periodo>\n<DataInicial>${dataInicio}</DataInicial>\n<DataFinal>${dataFim || dataInicio}</DataFinal>\n</Periodo>`;
  }
  xml += `\n</ConsultarNfseServicoPrestadoEnvio>`;
  return xml;
}

function criarCabecalhoGinfes(): string {
  return `<cabecalho xmlns="http://www.ginfes.com.br/cabecalho_v03.xsd" versao="3"><versaoDados>3</versaoDados></cabecalho>`;
}

function criarEnvelopeSOAPGinfes(soapAction: string, cabecalhoXml: string, dadosXml: string, ambiente?: string): string {
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

function criarEnvelopeSOAPGinfesSemArg0(soapAction: string, dadosXml: string, ambiente?: string): string {
  const namespace = ambiente === "producao" ? "http://producao.ginfes.com.br" : "http://www.ginfes.com.br/";
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <${soapAction} xmlns="${namespace}">
      <arg1 xmlns="">${dadosXml}</arg1>
    </${soapAction}>
  </soap:Body>
</soap:Envelope>`;
}

function criarEnvelopeSOAPGinfesArg0Vazio(soapAction: string, dadosXml: string, ambiente?: string): string {
  const namespace = ambiente === "producao" ? "http://producao.ginfes.com.br" : "http://www.ginfes.com.br/";
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <${soapAction} xmlns="${namespace}">
      <arg0 xmlns=""></cabecalho></arg0>
      <arg1 xmlns="">${dadosXml}</arg1>
    </${soapAction}>
  </soap:Body>
</soap:Envelope>`;
}

function criarEnvelopeSOAPGinfesCabecalhoDentro(soapAction: string, cabecalhoXml: string, dadosXml: string, ambiente?: string): string {
  const namespace = ambiente === "producao" ? "http://producao.ginfes.com.br" : "http://www.ginfes.com.br/";
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <${soapAction} xmlns="${namespace}">
      <arg0 xmlns=""></cabecalho></arg0>
      <arg1 xmlns="">${cabecalhoXml}${dadosXml}</arg1>
    </${soapAction}>
  </soap:Body>
</soap:Envelope>`;
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

function parsearRespostaConsulta(xml: string) {
  try {
    let workXml = xml;
    const cdataMatch = xml.match(/<return[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/return>/i);
    if (cdataMatch) workXml = cdataMatch[1];
    if (!cdataMatch && workXml.includes("&lt;")) {
      workXml = workXml.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
    }
    const cleanXml = workXml.replace(/<\/?[a-zA-Z0-9_]+:/g, m => (m.startsWith("</") ? "</" : "<"));

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

    const sucesso = !!numeroNfse || cleanXml.includes("<CompNfse");

    return {
      sucesso,
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
      mensagens: erros.length > 0 ? erros : sucesso ? [{ codigo: "0000", mensagem: "Consulta realizada com sucesso", tipo: "Sucesso" }] : undefined,
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

// --- Handler ---
serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing authorization" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseAuth = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let certDigital: CertificadoDigital | null = null;
    let numeroRps = body.numeroRps || "";
    let serie = body.serie || "1";
    let tipo = body.tipo || "RPS";
    let cnpj = body.cnpj || "";
    let im = body.inscricaoMunicipal || "";
    let operacao = body.operacao || "ConsultarNfsePorRpsV3";
    let notaId: string | undefined = body.notaId;

    if (notaId) {
      const { data: nota, error: notaError } = await supabase.from("notas_fiscais_servico").select("*").eq("id", notaId).eq("user_id", user.id).single();
      if (notaError || !nota) throw new Error("Nota nao encontrada");
      numeroRps = nota.numero_rps || nota.numero_nota || "";
      serie = nota.serie || "1";
      tipo = nota.tipo_rps || "RPS";

      if (nota.certificado_id) {
        const { data: cert, error: certError } = await supabase.from("certificados_nfse").select("*").eq("id", nota.certificado_id).single();
        if (!certError && cert && cert.arquivo_pfx) {
          certDigital = await carregarCertificado(cert.arquivo_pfx, cert.senha || "");
          certDigital.inscricaoMunicipal = cert.inscricao_municipal || "";
          certDigital.cnpj = cert.cnpj || certDigital.cnpj || "";
          cnpj = certDigital.cnpj;
          im = certDigital.inscricaoMunicipal;
        }
      }
    } else if (body.certificadoId) {
      const { data: cert, error: certError } = await supabase.from("certificados_nfse").select("*").eq("id", body.certificadoId).single();
      if (certError || !cert || !cert.arquivo_pfx) throw new Error("Certificado nao encontrado");
      certDigital = await carregarCertificado(cert.arquivo_pfx, cert.senha || "");
      certDigital.inscricaoMunicipal = cert.inscricao_municipal || "";
      certDigital.cnpj = cert.cnpj || certDigital.cnpj || "";
      cnpj = certDigital.cnpj;
      im = certDigital.inscricaoMunicipal;
    } else {
      cnpj = body.cnpj || "";
      im = body.inscricaoMunicipal || "";
    }

    const ambiente = getAmbiente();

    // Homologacao
    if (ambiente === "homologacao" && body.modo !== "real") {
      return new Response(JSON.stringify({
        sucesso: true,
        numeroNfse: numeroRps || "99999",
        codigoVerificacao: "HOM-VERIF-12345",
        dataEmissao: new Date().toISOString(),
        status: "autorizada",
        valorServicos: "0",
        mensagens: [{ codigo: "H001", mensagem: "Homologacao mock", tipo: "Sucesso" }],
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!certDigital && (!cnpj || !im)) {
      throw new Error("CNPJ e Inscricao Municipal sao obrigatorios para consulta");
    }

    // Construir XML
    const cabecalho = criarCabecalhoGinfes();
    let dados = "";
    if (operacao === "ConsultarNfseServicoPrestadoV3") {
      dados = xmlConsultaServicoPrestado(cnpj, im, body.dataInicio, body.dataFim, body.cnpjTomador, body.cpfTomador);
    } else {
      dados = xmlConsultaRps(numeroRps, serie, tipo, cnpj, im);
      operacao = "ConsultarNfsePorRpsV3";
    }

    // Tentativas com diferentes operacoes e formatos
    const tentativas: any[] = [];
    let resultado: any = null;

    // A lista de operacoes pode variar. Vamos tentar as mais comuns
    const operacoes = [operacao, "ConsultarNfsePorRps", "ConsultarNfseRps", "ConsultarNfsePorRpsV3"];
    const uniqueOps = [...new Set(operacoes)];

    // Formatos de envelope para testar
    const formatos = [
      { nome: "padrao", fn: (op: string) => criarEnvelopeSOAPGinfes(op, cabecalho, dados, ambiente) },
      { nome: "sem_arg0", fn: (op: string) => criarEnvelopeSOAPGinfesSemArg0(op, dados, ambiente) },
      { nome: "arg0_vazio", fn: (op: string) => criarEnvelopeSOAPGinfesArg0Vazio(op, dados, ambiente) },
      { nome: "cabecalho_dentro_arg1", fn: (op: string) => criarEnvelopeSOAPGinfesCabecalhoDentro(op, cabecalho, dados, ambiente) },
    ];

    for (const op of uniqueOps) {
      for (const formato of formatos) {
        const envelope = formato.fn(op);
        console.log(`[consultar-nfse] Tentando operacao: ${op} | formato: ${formato.nome}`);
        console.log(`[consultar-nfse] Envelope:\n${envelope}`);

        try {
          const soapResponse = await retry(() => enviarRequisicaoSOAP(envelope, op, certDigital || undefined));
          console.log(`[consultar-nfse] Resposta (${op}/${formato.nome}):\n${soapResponse.substring(0, 2000)}`);

          tentativas.push({ operacao: op, formato: formato.nome, envelope: envelope.substring(0, 500), response: soapResponse.substring(0, 500) });

          const parsed = parsearRespostaConsulta(soapResponse);
          if (parsed.sucesso) {
            resultado = { ...parsed, xmlEnvio: dados, xmlBruto: soapResponse.substring(0, 8000), operacaoUsada: op, formatoUsado: formato.nome };
            break;
          }

          // Se nao for erro de operacao nao encontrada, usar esse resultado
          const isOpError = soapResponse.includes("Endpoint does not contain operation") ||
            soapResponse.includes("Cannot find child element");
          if (!isOpError) {
            resultado = { ...parsed, xmlEnvio: dados, xmlBruto: soapResponse.substring(0, 8000), operacaoUsada: op, formatoUsado: formato.nome };
            break;
          }
        } catch (err: any) {
          console.error(`[consultar-nfse] Erro operacao ${op} formato ${formato.nome}:`, err.message);
          tentativas.push({ operacao: op, formato: formato.nome, erro: err.message });
        }
      }
      if (resultado) break;
    }

    if (!resultado) {
      resultado = {
        sucesso: false,
        mensagens: [{ codigo: "ALL_FAILED", mensagem: "Nenhuma operacao funcionou", tipo: "Erro" }],
        tentativas,
        xmlEnvio: dados,
      };
    }

    // Atualizar banco se veio de notaId
    if (notaId && resultado.sucesso) {
      const updateData: any = { updated_at: new Date().toISOString() };
      if (resultado.numeroNfse) updateData.numero_nota = resultado.numeroNfse;
      if (resultado.codigoVerificacao) updateData.codigo_verificacao = resultado.codigoVerificacao;
      if (resultado.dataAutorizacao) updateData.data_autorizacao = resultado.dataAutorizacao;
      if (resultado.linkPdf) updateData.link_pdf = resultado.linkPdf;
      if (resultado.linkXml) updateData.link_xml = resultado.linkXml;
      if (resultado.linkNfse) updateData.link_nfse = resultado.linkNfse;
      if (resultado.status) updateData.status = resultado.status === "substituida" ? "cancelada" : resultado.status;
      await supabase.from("notas_fiscais_servico").update(updateData).eq("id", notaId).eq("user_id", user.id);
    }

    return new Response(JSON.stringify(resultado), { status: resultado.sucesso ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("[consultar-nfse] Erro geral:", err);
    return new Response(JSON.stringify({ sucesso: false, mensagens: [{ codigo: "ERROR", mensagem: (err as Error).message, tipo: "Erro" }] }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
