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

interface CertDigital {
  cnpj: string;
  inscricaoMunicipal: string;
  certPem: string;
  keyPem: string;
}

async function carregarCertificado(pfxBase64: string, senha: string): Promise<CertDigital> {
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

function xmlCabecalho(): string {
  return `<cabecalho xmlns="http://www.ginfes.com.br/cabecalho_v03.xsd" versao="3"><versaoDados>3</versaoDados></cabecalho>`;
}

// --- Envelope factory ---
type EnvelopeVariant = "unqualified" | "qualified" | "cdata" | "escaped" | "raw";

function buildEnvelope(action: string, cabecalho: string, dados: string, ambiente: "homologacao" | "producao", variant: EnvelopeVariant): string {
  const ns = ambiente === "producao" ? "http://producao.ginfes.com.br" : "http://www.ginfes.com.br/";

  switch (variant) {
    case "qualified":
      return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <ns1:${action} xmlns:ns1="${ns}">
      <ns1:arg0>${cabecalho}</ns1:arg0>
      <ns1:arg1>${dados}</ns1:arg1>
    </ns1:${action}>
  </soap:Body>
</soap:Envelope>`;

    case "cdata":
      return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <${action} xmlns="${ns}">
      <arg0 xmlns=""><![CDATA[${cabecalho}]]></arg0>
      <arg1 xmlns=""><![CDATA[${dados}]]></arg1>
    </${action}>
  </soap:Body>
</soap:Envelope>`;

    case "escaped":
      return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <${action} xmlns="${ns}">
      <arg0 xmlns="">${cabecalho.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</arg0>
      <arg1 xmlns="">${dados.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</arg1>
    </${action}>
  </soap:Body>
</soap:Envelope>`;

    case "raw":
      return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${action} xmlns="${ns}">
      <arg0>${cabecalho}</arg0>
      <arg1>${dados}</arg1>
    </${action}>
  </soap:Body>
</soap:Envelope>`;

    case "unqualified":
    default:
      return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <${action} xmlns="${ns}">
      <arg0 xmlns="">${cabecalho}</arg0>
      <arg1 xmlns="">${dados}</arg1>
    </${action}>
  </soap:Body>
</soap:Envelope>`;
  }
}

// --- HTTP ---
function getAmbiente(): "homologacao" | "producao" {
  return (Deno.env.get("NFSE_AMBIENTE") || "homologacao") as "homologacao" | "producao";
}

const GINFES_URLS = {
  homologacao: "https://homologacao.ginfes.com.br/ServiceGinfesImpl",
  producao: "https://producao.ginfes.com.br/ServiceGinfesImpl",
};

async function sendSoap(
  envelope: string,
  action: string,
  cert?: { certPem: string; keyPem: string }
): Promise<{ status: number; body: string; headers: Record<string, string> }> {
  const env = getAmbiente();
  const headers: Record<string, string> = {
    "Content-Type": "text/xml; charset=utf-8",
    "SOAPAction": `"${action}"`,
  };

  if (env === "homologacao") {
    const res = await fetch(GINFES_URLS[env], { method: "POST", headers, body: envelope });
    const body = await res.text();
    return { status: res.status, body, headers: Object.fromEntries(res.headers.entries()) };
  }

  if (!cert) throw new Error("Certificado obrigatorio em producao");
  const proxyUrl = Deno.env.get("MTLS_PROXY_URL");
  if (!proxyUrl) throw new Error("MTLS_PROXY_URL nao configurada");
  const proxyApiKey = Deno.env.get("MTLS_PROXY_API_KEY") || "";
  const proxyHeaders: Record<string, string> = { "Content-Type": "application/json" };
  if (proxyApiKey) proxyHeaders["X-API-Key"] = proxyApiKey;

  const proxyRes = await fetch(`${proxyUrl}/proxy-ginfes`, {
    method: "POST",
    headers: proxyHeaders,
    body: JSON.stringify({ soapEnvelope: envelope, certPem: cert.certPem, keyPem: cert.keyPem, ambiente: env }),
  });
  const body = await proxyRes.text();
  return { status: proxyRes.status, body, headers: Object.fromEntries(proxyRes.headers.entries()) };
}

// --- Parser ---
function parseResposta(xml: string): any {
  let work = xml;

  // CDATA
  const cdata = xml.match(/<return[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/return>/i);
  if (cdata) work = cdata[1];

  // Escaped
  if (!cdata && work.includes("&lt;")) {
    work = work.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
  }

  // Remove namespaces
  const clean = work.replace(/<\/?[a-zA-Z0-9_]+:/g, m => (m.startsWith("</") ? "</" : "<"));

  // Erros
  const erros: Array<{ codigo: string; mensagem: string; tipo: string }> = [];
  const msgBlocks = [...clean.matchAll(/<MensagemRetorno[^>]*>([\s\S]*?)<\/MensagemRetorno>/gi)];
  for (const [, block] of msgBlocks) {
    const cod = block.match(/<Codigo[^>]*>([^<]+)<\/Codigo>/i)?.[1] || "";
    const msg = block.match(/<Mensagem[^>]*>([^<]+)<\/Mensagem>/i)?.[1] || "";
    const cor = block.match(/<Correcao[^>]*>([^<]+)<\/Correcao>/i)?.[1];
    erros.push({ codigo: cod || "ERR", mensagem: cor ? `${msg} (${cor})` : msg, tipo: "Erro" });
  }

  const fault = clean.match(/<faultstring>([^<]+)<\/faultstring>/i);
  if (fault && erros.length === 0) erros.push({ codigo: "SOAP_FAULT", mensagem: fault[1], tipo: "Erro" });

  const hasError = erros.some(e => e.tipo === "Erro") || clean.includes("<ListaMensagemRetorno>");

  // Valores
  const infNfse = clean.match(/<InfNfse[^>]*>([\s\S]*?)<\/InfNfse>/i)?.[1];
  const valores: Record<string, any> = {};
  if (infNfse) {
    const map: Record<string, string> = {
      NumeroNfse: "numeroNfse", CodigoVerificacao: "codigoVerificacao",
      DataEmissaoNfse: "dataEmissao", DataEmissao: "dataEmissao",
      ValorServicos: "valorServicos", ValorIss: "valorIss",
      BaseCalculo: "baseCalculo", Aliquota: "aliquotaIss",
    };
    for (const [tag, key] of Object.entries(map)) {
      const m = infNfse.match(new RegExp(`<${tag}>([^<]+)<\/${tag}>`, "i"));
      if (m) valores[key] = m[1];
    }
    const issRet = infNfse.match(/<IssRetido>([^<]+)<\/IssRetido>/i);
    valores.issRetido = issRet?.[1] === "1" || issRet?.[1]?.toLowerCase() === "sim";
  }

  const sucesso = !hasError && !!valores.numeroNfse;

  return {
    sucesso,
    ...valores,
    status: clean.match(/<DataCancelamento>/i) ? "cancelada" : clean.match(/<NfseSubstituida>1<\/NfseSubstituida>/i) ? "substituida" : "autorizada",
    mensagens: erros.length > 0 ? erros : sucesso ? [{ codigo: "0000", mensagem: "Consulta realizada com sucesso", tipo: "Sucesso" }] : undefined,
    xmlBruto: xml.substring(0, 8000),
  };
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

    // --- Modo diagnostico: retorna envelopes sem enviar ---
    if (body.modo === "diagnostico") {
      const cabecalho = xmlCabecalho();
      const dados = xmlConsultaRps(body.numeroRps || "1", body.serie || "1", body.tipo || "1", body.cnpj || "12345678000195", body.im || "123456");
      const action = body.operacao || "ConsultarNfsePorRpsV3";
      const ambiente = getAmbiente();
      const variants: EnvelopeVariant[] = ["unqualified", "qualified", "cdata", "escaped", "raw"];
      const envelopes = variants.map(v => ({ variant: v, envelope: buildEnvelope(action, cabecalho, dados, ambiente, v) }));
      return new Response(JSON.stringify({ modo: "diagnostico", action, ambiente, envelopes }, null, 2), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // --- Carrega nota ou parametros diretos ---
    let certDigital: CertDigital | null = null;
    let numeroRps = body.numeroRps || "";
    let serie = body.serie || "1";
    let tipo = body.tipo || "RPS";
    let cnpj = body.cnpj || "";
    let im = body.inscricaoMunicipal || "";
    let operacao = body.operacao || "ConsultarNfsePorRpsV3";

    if (body.notaId) {
      const { data: nota, error: notaError } = await supabase.from("notas_fiscais_servico").select("*").eq("id", body.notaId).eq("user_id", user.id).single();
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
        }
      }
      if (certDigital) {
        cnpj = certDigital.cnpj;
        im = certDigital.inscricaoMunicipal;
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

    // --- Homologacao: mock ---
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

    // --- Construir XML ---
    const cabecalho = xmlCabecalho();
    let dados = "";
    if (operacao === "ConsultarNfseServicoPrestadoV3") {
      dados = xmlConsultaServicoPrestado(cnpj, im, body.dataInicio, body.dataFim, body.cnpjTomador, body.cpfTomador);
    } else {
      dados = xmlConsultaRps(numeroRps, serie, tipo, cnpj, im);
      operacao = "ConsultarNfsePorRpsV3";
    }

    // --- Tentativa com multiplos formatos ---
    const variants: EnvelopeVariant[] = ["unqualified", "qualified", "cdata", "escaped", "raw"];
    const tentativas: any[] = [];
    let resultado: any = null;

    for (const variant of variants) {
      const envelope = buildEnvelope(operacao, cabecalho, dados, ambiente, variant);
      console.log(`[consultar-nfse] Tentando formato: ${variant}`);
      console.log(`[consultar-nfse] Envelope:\n${envelope}`);

      try {
        const { status, body: responseBody } = await sendSoap(envelope, operacao, certDigital || undefined);
        console.log(`[consultar-nfse] Resposta (${variant}) HTTP ${status}:\n${responseBody.substring(0, 2000)}`);

        tentativas.push({ variant, status, envelope: envelope.substring(0, 500), response: responseBody.substring(0, 500) });

        const parsed = parseResposta(responseBody);
        if (parsed.sucesso) {
          resultado = { ...parsed, xmlEnvio: dados, xmlBruto: responseBody.substring(0, 8000), formatoUsado: variant };
          break;
        }

        // Se nao for erro de parsing do envelope (ex: operation not found), parar
        const hasRealError = responseBody.includes("Endpoint does not contain operation") ||
          responseBody.includes("Cannot find child element");
        if (!hasRealError && !parsed.sucesso) {
          resultado = { ...parsed, xmlEnvio: dados, xmlBruto: responseBody.substring(0, 8000), formatoUsado: variant };
          break;
        }
      } catch (err: any) {
        console.error(`[consultar-nfse] Erro formato ${variant}:`, err.message);
        tentativas.push({ variant, erro: err.message });
      }
    }

    if (!resultado) {
      resultado = {
        sucesso: false,
        mensagens: [{ codigo: "ALL_FAILED", mensagem: "Nenhum formato de envelope funcionou", tipo: "Erro" }],
        tentativas,
        xmlEnvio: dados,
      };
    }

    return new Response(JSON.stringify(resultado), { status: resultado.sucesso ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("[consultar-nfse] Erro geral:", err);
    return new Response(JSON.stringify({ sucesso: false, mensagens: [{ codigo: "ERROR", mensagem: (err as Error).message, tipo: "Erro" }] }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
