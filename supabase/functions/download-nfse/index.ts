import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const NFEIO_BASE_URL = "https://api.nfe.io/v1";

function getNfeioHeaders(apiKey: string): Record<string, string> {
  return {
    "Authorization": apiKey,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowed = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://9ninebusinesscontrol.com.br",
    "https://www.9ninebusinesscontrol.com.br",
    "https://9nineteste.9ninebusinesscontrol.com.br",
    "https://ninebpofinanceiro.lovable.app",
    "https://ninebpofinanceiro.vercel.app",
    "https://9businesscontrol.pages.dev",
  ];
  const corsOrigin = allowed.includes(origin) ? origin : allowed[0];
  return {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseAuth = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { notaId, tipo } = body;
    if (!notaId || !tipo || !["pdf", "xml"].includes(tipo)) {
      return new Response(JSON.stringify({ error: "notaId e tipo (pdf|xml) obrigatorios" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: nota, error: notaError } = await supabase
      .from("notas_fiscais_servico")
      .select("nfeio_id, numero_nota, cliente_nome")
      .eq("id", notaId)
      .eq("user_id", user.id)
      .single();

    if (notaError || !nota) {
      return new Response(JSON.stringify({ error: "Nota nao encontrada" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!nota.nfeio_id) {
      return new Response(JSON.stringify({ error: "Nota sem ID NFE.io" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const apiKey = Deno.env.get("NFEIO_API_KEY") || "";
    const companyId = Deno.env.get("NFEIO_COMPANY_ID") || "";
    if (!apiKey || !companyId) {
      return new Response(JSON.stringify({ error: "NFE.io nao configurado" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const url = `${NFEIO_BASE_URL}/companies/${companyId}/serviceinvoices/${nota.nfeio_id}/${tipo}`;
    console.log(`[download-nfse] Baixando ${tipo}:`, url);

    const res = await fetch(url, {
      method: "GET",
      headers: getNfeioHeaders(apiKey),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[download-nfse] Erro ${res.status}:`, errText);
      return new Response(JSON.stringify({ error: `Erro ao baixar ${tipo}: HTTP ${res.status}` }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const contentType = res.headers.get("content-type") || (tipo === "pdf" ? "application/pdf" : "application/xml");
    const arrayBuffer = await res.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    const fileName = `NFSe_${nota.numero_nota || nota.nfeio_id}_${nota.cliente_nome || "nota"}.${tipo}`;

    return new Response(
      JSON.stringify({
        sucesso: true,
        tipo,
        fileName,
        contentType,
        base64,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[download-nfse] Erro:", err);
    return new Response(
      JSON.stringify({ sucesso: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
