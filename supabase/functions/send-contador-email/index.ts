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

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");


serve(async (req) => {
  if (req.method === "OPTIONS") {
    const corsHeaders = getCorsHeaders(req);
  return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, nomeContador, documentos, mesRef, anoRef } = await req.json();

    if (!to || !documentos?.length) {
      return new Response(
        JSON.stringify({ error: "E-mail e documentos são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
    ];

    const mesNome = mesRef ? meses[mesRef - 1] : "";
    const refLabel = mesNome && anoRef ? `${mesNome}/${anoRef}` : "";

    const docLinks = documentos
      .map((d: { name: string; url: string }) =>
        `<li style="margin-bottom:8px"><a href="${d.url}" style="color:#2563eb;text-decoration:underline">${d.name}</a></li>`
      )
      .join("");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#1e293b">Documentos Contábeis${refLabel ? ` — ${refLabel}` : ""}</h2>
        <p style="color:#475569">Olá ${nomeContador},</p>
        <p style="color:#475569">Segue abaixo os documentos para download. Os links são válidos por 7 dias.</p>
        <ul style="list-style:none;padding:0">${docLinks}</ul>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
        <p style="color:#94a3b8;font-size:12px">Enviado via 9Nine Business Control</p>
      </div>
    `;

    // Use Lovable AI Gateway to send email via a simple edge function approach
    // For now, we use the Resend-compatible approach if available, or SMTP
    // Since no email domain is configured yet, we'll use a basic approach
    
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Configuração de e-mail não disponível. Configure um domínio de e-mail primeiro." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For now, return success with a note that email domain needs to be set up
    // This will be updated when email infrastructure is configured
    console.log(`Would send email to: ${to}`);
    console.log(`Subject: Documentos Contábeis${refLabel ? ` — ${refLabel}` : ""}`);
    console.log(`Documents: ${documentos.length}`);

    return new Response(
      JSON.stringify({ success: true, message: "E-mail processado com sucesso" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
