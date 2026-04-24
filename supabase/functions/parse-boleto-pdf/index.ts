import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `Você é um especialista em analisar boletos bancários brasileiros.
Extraia as informações do boleto e retorne APENAS um JSON com os campos:
- "descricao": descrição/nome do beneficiário ou finalidade do boleto
- "valor": valor numérico (sem símbolo, ex: 150.00)
- "data_vencimento": formato "YYYY-MM-DD"
- "documento": número do documento/nosso número (string)
- "beneficiario": nome do beneficiário/cedente
- "codigo_barras": linha digitável completa (string)
- "banco": nome do banco emissor

Se um campo não for encontrado, use null.

Para linhas digitáveis de boleto bancário (47 dígitos sem espaços/pontos):
- Posições 6-9: fator de vencimento (dias desde 07/10/1997)
- Posições 10-19: valor (últimos 2 dígitos são centavos)

Retorne SOMENTE o JSON, sem markdown, sem explicações.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, barcode, pdfBase64 } = await req.json();

    if (!text && !barcode && !pdfBase64) {
      return new Response(JSON.stringify({ error: "Envie o texto do PDF, o código de barras ou o PDF em base64" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    let messages: any[];
    let model = "google/gemini-3-flash-preview";

    if (pdfBase64) {
      // Use Gemini with vision for PDF files
      model = "google/gemini-2.5-flash";
      messages = [
        {
          role: "user",
          content: [
            { type: "text", text: systemPrompt + "\n\nAnalise este documento PDF de boleto e extraia todas as informações:" },
            {
              type: "file",
              file: {
                filename: "boleto.pdf",
                file_data: `data:application/pdf;base64,${pdfBase64}`,
              },
            },
          ],
        },
      ];
    } else {
      const input = barcode
        ? `Linha digitável / código de barras do boleto: ${barcode}`
        : `Texto extraído do PDF do boleto:\n${text!.substring(0, 15000)}`;

      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: input },
      ];
    }

    console.log("Calling AI with model:", model, "pdfBase64:", !!pdfBase64, "barcode:", !!barcode, "text:", !!text);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "{}";
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    console.log("AI response content:", content.substring(0, 500));

    const boleto = JSON.parse(content);

    return new Response(JSON.stringify({ boleto }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
