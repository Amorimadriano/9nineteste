import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, nome, assunto, mensagemExtra, smtpConfig } = await req.json();

    if (!to || !assunto) {
      return new Response(
        JSON.stringify({ error: "Destinatário e assunto são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = buildEmailHtml(nome || "Cliente", mensagemExtra || "");

    console.log(`Sending marketing email to: ${to}, subject: ${assunto}`);

    if (!smtpConfig?.email || !smtpConfig?.senha) {
      return new Response(
        JSON.stringify({ error: "Credenciais SMTP não fornecidas." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Resend API to send email (free tier: 100 emails/day)
    // Get API key from environment or use provided credentials
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || smtpConfig.resendApiKey;

    if (resendApiKey) {
      // Send via Resend API
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: smtpConfig.email,
          to: [to],
          subject: assunto,
          html: html,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`Resend API error: ${error}`);
        throw new Error(`Resend API error: ${error}`);
      }

      const result = await response.json();
      console.log(`Email sent via Resend: ${result.id}`);

      return new Response(
        JSON.stringify({ success: true, message: `E-mail enviado para ${to}`, messageId: result.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback: Log email (for development/testing)
    console.log(`[DEV MODE] Email to: ${to}, subject: ${assunto}`);
    console.log(`[DEV MODE] From: ${smtpConfig.email}`);
    console.log(`[DEV MODE] HTML length: ${html.length} chars`);

    return new Response(
      JSON.stringify({ success: true, message: `E-mail logged (dev mode) for ${to}` }),
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

function buildEmailHtml(nome: string, mensagemExtra: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
<tr><td style="background:linear-gradient(135deg,#1e40af 0%,#3b82f6 50%,#60a5fa 100%);padding:40px 32px;text-align:center">
  <h1 style="color:#ffffff;font-size:28px;margin:0;font-weight:800">9Nine Business Control</h1>
  <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:8px 0 0">Gestão Financeira Inteligente</p>
</td></tr>
<tr><td style="padding:32px">
  <p style="color:#1e293b;font-size:16px;margin:0 0 16px">Olá <strong>${nome}</strong>,</p>
  <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px">Você já conhece o <strong>9Nine Business Control</strong>? Nossa plataforma foi desenvolvida para simplificar e automatizar toda a gestão financeira da sua empresa.</p>
  ${mensagemExtra ? `<p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px;padding:16px;background:#f0f9ff;border-left:4px solid #3b82f6;border-radius:4px">${mensagemExtra}</p>` : ""}
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0">
    <tr><td style="padding:12px 16px;background:#f8fafc;border-radius:8px"><p style="margin:0;color:#1e40af;font-weight:700;font-size:14px">📊 Dashboard Inteligente</p><p style="margin:4px 0 0;color:#64748b;font-size:13px">KPIs financeiros em tempo real</p></td></tr>
    <tr><td style="height:8px"></td></tr>
    <tr><td style="padding:12px 16px;background:#f8fafc;border-radius:8px"><p style="margin:0;color:#1e40af;font-weight:700;font-size:14px">💰 Contas a Pagar e Receber</p><p style="margin:4px 0 0;color:#64748b;font-size:13px">Controle completo de fluxo de caixa</p></td></tr>
    <tr><td style="height:8px"></td></tr>
    <tr><td style="padding:12px 16px;background:#f8fafc;border-radius:8px"><p style="margin:0;color:#1e40af;font-weight:700;font-size:14px">🏦 Conciliação Bancária Automática</p><p style="margin:4px 0 0;color:#64748b;font-size:13px">Importação OFX e matching inteligente</p></td></tr>
    <tr><td style="height:8px"></td></tr>
    <tr><td style="padding:12px 16px;background:#f8fafc;border-radius:8px"><p style="margin:0;color:#1e40af;font-weight:700;font-size:14px">📈 DRE e Relatórios Gerenciais</p><p style="margin:4px 0 0;color:#64748b;font-size:13px">Análises com parecer de IA integrado</p></td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:16px 0">
    <a href="https://9ninebusinesscontrol.com.br/Site" style="display:inline-block;background:linear-gradient(135deg,#1e40af,#3b82f6);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:8px">Teste Grátis por 5 Dias →</a>
  </td></tr></table>
  <p style="color:#94a3b8;font-size:12px;text-align:center;margin:24px 0 0">Sem compromisso. Cancele quando quiser.</p>
</td></tr>
<tr><td style="background:#f8fafc;padding:24px 32px;text-align:center;border-top:1px solid #e2e8f0">
  <p style="color:#64748b;font-size:12px;margin:0">9Nine Business Control — Gestão Financeira Inteligente</p>
  <p style="color:#94a3b8;font-size:11px;margin:8px 0 0">contato@9ninebusinesscontrol.com.br | WhatsApp (11) 96001-2210</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}