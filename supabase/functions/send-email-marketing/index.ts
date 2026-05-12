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
import nodemailer from "npm:nodemailer@6.9.16";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const provider = body.provider || "smtp";
    const to = body.to;
    const subject = body.assunto || "E-mail Marketing - 9Nine Business Control";
    const htmlContent = body.html || buildSimpleHtml(body.nome || "Cliente", body.mensagemExtra || "");

    if (!to) {
      return new Response(
        JSON.stringify({ error: "Destinatário (to) é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---- Resend API (HTTP-based, works on Deno Deploy) ----
    if (provider === "resend") {
      const apiKey = body.resendApiKey;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "API Key do Resend é obrigatória" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const response = await fetch("https://api.resend.com/email", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "9Nine Business Control <onboarding@resend.dev>",
          to,
          subject,
          html: htmlContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.name || `Resend API error: ${response.status}`);
      }

      const result = await response.json();
      console.log("Email sent via Resend:", result.id);

      return new Response(
        JSON.stringify({ success: true, message: "E-mail enviado com sucesso via Resend!", id: result.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---- SMTP direto ----
    const { host, porta, email, senhaEmail } = body;
    if (!email || !senhaEmail || !host) {
      return new Response(
        JSON.stringify({ error: "Host, e-mail e senha são obrigatórios para envio SMTP" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const port = parseInt(porta) || 587;
    const secure = port === 465;

    console.log(`Sending email via SMTP: ${host}:${port} to ${to}`);

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: email,
        pass: senhaEmail,
      },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    try {
      await transporter.sendMail({
        from: email,
        to,
        subject,
        html: htmlContent,
        text: htmlContent.replace(/<[^>]*>/g, ""),
      });

      transporter.close();
      console.log("Email sent successfully via SMTP");

      return new Response(
        JSON.stringify({ success: true, message: "E-mail enviado com sucesso!" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (smtpErr: any) {
      transporter.close();
      const msg = smtpErr.message || String(smtpErr);
      if (msg.includes("ECONNREFUSED") || msg.includes("connect") || msg.includes("ETIMEDOUT")) {
        throw new Error(
          `Não foi possível conectar ao servidor SMTP ${host}:${port}. ` +
          `Portas SMTP podem estar bloqueadas no ambiente hospedado. Use Resend como alternativa.`
        );
      }
      if (msg.includes("EAUTH") || msg.includes("Invalid login") || msg.includes("Authentication")) {
        throw new Error("Falha na autenticação SMTP. Verifique e-mail e senha.");
      }
      throw smtpErr;
    }
  } catch (err) {
    console.error("Email Error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildSimpleHtml(nome: string, mensagemExtra: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
<tr><td style="background:linear-gradient(135deg,#1e40af 0%,#3b82f6 50%,#60a5fa 100%);padding:40px 32px;text-align:center">
  <h1 style="color:#ffffff;font-size:28px;margin:0;font-weight:800;letter-spacing:-0.5px">9Nine Business Control</h1>
  <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:8px 0 0;font-weight:400">Gestão Financeira Inteligente</p>
</td></tr>
<tr><td style="padding:32px">
  <p style="color:#1e293b;font-size:16px;margin:0 0 16px">Olá <strong>${nome}</strong>,</p>
  <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px">
    Você já conhece o <strong>9Nine Business Control</strong>? Nossa plataforma foi desenvolvida para simplificar e automatizar toda a gestão financeira da sua empresa.
  </p>
  ${mensagemExtra ? `<p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px;padding:16px;background:#f0f9ff;border-left:4px solid #3b82f6;border-radius:4px">${mensagemExtra}</p>` : ""}
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0">
    <tr><td style="padding:12px 16px;background:#f8fafc;border-radius:8px">
      <p style="margin:0;color:#1e40af;font-weight:700;font-size:14px">Dashboard Inteligente — KPIs financeiros em tempo real</p>
    </td></tr>
    <tr><td style="height:8px"></td></tr>
    <tr><td style="padding:12px 16px;background:#f8fafc;border-radius:8px">
      <p style="margin:0;color:#1e40af;font-weight:700;font-size:14px">Contas a Pagar e Receber — Controle completo de fluxo de caixa</p>
    </td></tr>
    <tr><td style="height:8px"></td></tr>
    <tr><td style="padding:12px 16px;background:#f8fafc;border-radius:8px">
      <p style="margin:0;color:#1e40af;font-weight:700;font-size:14px">Conciliação Bancária Automática — Importação OFX e matching inteligente</p>
    </td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:16px 0">
      <a href="https://9ninebusinesscontrol.com.br/Site" style="display:inline-block;background:linear-gradient(135deg,#1e40af,#3b82f6);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:8px">Teste Grátis por 5 Dias →</a>
    </td></tr>
  </table>
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