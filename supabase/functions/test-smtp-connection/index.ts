import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.16";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const provider = body.provider || "smtp";

    // ---- Resend API (HTTP-based, works on Deno Deploy) ----
    if (provider === "resend") {
      const apiKey = body.resendApiKey;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "API Key do Resend é obrigatória" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Testing Resend API connection...");

      const response = await fetch("https://api.resend.com/email", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "9Nine Business Control <onboarding@resend.dev>",
          to: "delivered@resend.dev",
          subject: "Teste de Configuração - 9Nine Business Control",
          text: "Este é um e-mail de teste da configuração Resend.\n\nSe você recebeu este e-mail, sua configuração está funcionando corretamente!",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.name || `Resend API error: ${response.status}`);
      }

      const result = await response.json();
      console.log("Resend test successful:", result.id);

      return new Response(
        JSON.stringify({ success: true, message: "API Resend configurada corretamente! E-mail de teste enviado.", id: result.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---- SMTP direto (requer self-hosted Supabase ou portas liberadas) ----
    const { host, porta, email, senhaEmail } = body;
    if (!email || !senhaEmail || !host) {
      return new Response(
        JSON.stringify({ error: "Host, e-mail e senha são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const port = parseInt(porta) || 587;
    const secure = port === 465;

    console.log(`Testing SMTP connection: ${host}:${port}`);

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
      await transporter.verify();
      console.log("SMTP connection test successful");

      await transporter.sendMail({
        from: email,
        to: email,
        subject: "Teste de Configuração - 9Nine Business Control",
        text: "Este é um e-mail de teste da configuração SMTP.\n\nSe você recebeu este e-mail, sua configuração está funcionando corretamente!",
      });

      transporter.close();

      return new Response(
        JSON.stringify({ success: true, message: "Conexão SMTP estabelecida com sucesso! Verifique sua caixa de entrada." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (smtpErr: any) {
      transporter.close();

      const msg = smtpErr.message || String(smtpErr);
      if (msg.includes("ECONNREFUSED") || msg.includes("connect") || msg.includes("ETIMEDOUT")) {
        throw new Error(
          `Não foi possível conectar ao servidor SMTP ${host}:${port}. ` +
          `Se o Supabase é hospedado (Deno Deploy), portas SMTP podem estar bloqueadas. ` +
          `Use a API do Resend como alternativa.`
        );
      }
      if (msg.includes("EAUTH") || msg.includes("Invalid login") || msg.includes("Authentication")) {
        throw new Error("Falha na autenticação SMTP. Verifique e-mail e senha (use App Password para Gmail).");
      }
      throw smtpErr;
    }
  } catch (err) {
    console.error("SMTP/Resend Error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});