import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

const BASE_URL = "https://api.nfe.io/v1";

function getHeaders(apiKey: string): Record<string, string> {
  return {
    "Authorization": apiKey,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
}

async function emitirNFSe(companyId: string, payload: any, apiKey: string) {
  const url = `${BASE_URL}/companies/${companyId}/serviceinvoices`;
  const res = await fetch(url, {
    method: "POST",
    headers: getHeaders(apiKey),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

async function consultarNFSe(companyId: string, nfseId: string, apiKey: string) {
  const url = `${BASE_URL}/companies/${companyId}/serviceinvoices/${nfseId}`;
  const res = await fetch(url, {
    method: "GET",
    headers: getHeaders(apiKey),
  });
  return handleResponse(res);
}

async function cancelarNFSe(companyId: string, nfseId: string, apiKey: string) {
  const url = `${BASE_URL}/companies/${companyId}/serviceinvoices/${nfseId}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: getHeaders(apiKey),
  });
  return handleResponse(res);
}

async function listarNFSe(companyId: string, apiKey: string, options?: any) {
  const params = new URLSearchParams();
  if (options?.page) params.set("page", String(options.page));
  if (options?.pageSize) params.set("pageSize", String(options.pageSize));
  if (options?.status) params.set("status", options.status);

  const url = `${BASE_URL}/companies/${companyId}/serviceinvoices?${params.toString()}`;
  const res = await fetch(url, {
    method: "GET",
    headers: getHeaders(apiKey),
  });
  return handleResponse(res);
}

async function handleResponse(res: Response): Promise<any> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ code: "ERR_HTTP", message: `HTTP ${res.status}` }));
    throw new Error(`[${err.code}] ${err.message}`);
  }
  return res.json();
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("NFEIO_API_KEY") || "";
    const companyId = Deno.env.get("NFEIO_COMPANY_ID") || "";

    if (!apiKey) throw new Error("NFEIO_API_KEY nao configurada");
    if (!companyId) throw new Error("NFEIO_COMPANY_ID nao configurada");

    const body = await req.json();
    const action = body.action;

    let result;
    switch (action) {
      case "emitir": {
        const payload = body.payload || {};
        result = await emitirNFSe(companyId, payload, apiKey);
        break;
      }
      case "consultar": {
        const nfseId = body.nfseId || "";
        if (!nfseId) throw new Error("nfseId obrigatorio para consultar");
        result = await consultarNFSe(companyId, nfseId, apiKey);
        break;
      }
      case "cancelar": {
        const nfseId = body.nfseId || "";
        if (!nfseId) throw new Error("nfseId obrigatorio para cancelar");
        result = await cancelarNFSe(companyId, nfseId, apiKey);
        break;
      }
      case "listar": {
        result = await listarNFSe(companyId, apiKey, body.options);
        break;
      }
      default:
        throw new Error(`Acao nao suportada: ${action}`);
    }

    return new Response(JSON.stringify({ sucesso: true, data: result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[nfeio-proxy] Erro:", err);
    return new Response(
      JSON.stringify({ sucesso: false, mensagem: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
