const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://9ninebusinesscontrol.com.br",
  "https://www.9ninebusinesscontrol.com.br",
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

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const cnpj = (body.cnpj || "").replace(/\D/g, "");

    if (cnpj.length !== 14) {
      return new Response(
        JSON.stringify({ error: "CNPJ inválido. Envie 14 dígitos." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Tenta Brasil API primeiro
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      if (response.ok) {
        const data = await response.json();
        return new Response(
          JSON.stringify({ fonte: "brasilapi", data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch {}

    // Fallback: ReceitaWS
    try {
      const response = await fetch(`https://receitaws.com.br/v1/cnpj/${cnpj}`, {
        headers: { Accept: "application/json" },
      });
      if (response.ok) {
        const raw = await response.json();
        if (raw.status !== "ERROR") {
          const data = {
            razao_social: raw.nome || "",
            nome_fantasia: raw.fantasia || "",
            email: raw.email || "",
            ddd_telefone_1: raw.telefone || "",
            logradouro: raw.logradouro || "",
            numero: raw.numero || "",
            complemento: raw.complemento || "",
            bairro: raw.bairro || "",
            municipio: raw.municipio || "",
            uf: raw.uf || "",
            cep: raw.cep || "",
          };
          return new Response(
            JSON.stringify({ fonte: "receitaws", data }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    } catch {}

    return new Response(
      JSON.stringify({ error: "CNPJ não encontrado em nenhuma fonte" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});