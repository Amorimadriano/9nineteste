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
    const smtpConfig = await req.json();

    if (!smtpConfig?.email || !smtpConfig?.senha) {
      return new Response(
        JSON.stringify({ error: "Email e senha são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Testing email configuration: ${smtpConfig.email}`);

    // Use senha field (Resend API Key sent from frontend)
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || smtpConfig.senha;

    if (resendApiKey) {
      // Verify API key by attempting to send a test email
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: smtpConfig.email,
          to: [smtpConfig.email], // Send to self for testing
          subject: "Teste de Configuração - 9Nine Business Control",
          html: `<p>Este é um e-mail de teste da configuração SMTP.</p>
                 <p>Se você recebeu este e-mail, sua configuração está funcionando corretamente!</p>`,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`Resend API error: ${error}`);
        throw new Error(`Erro na API Resend: ${error}`);
      }

      const result = await response.json();
      console.log(`Test email sent: ${result.id}`);

      return new Response(
        JSON.stringify({ success: true, message: "E-mail de teste enviado com sucesso! Verifique sua caixa de entrada.", messageId: result.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If no Resend API key, just validate the email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(smtpConfig.email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Formato de e-mail inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Configuração salva! Para testar o envio real, configure a variável RESEND_API_KEY." }),
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