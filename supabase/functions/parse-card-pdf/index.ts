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


const systemPrompt = `Você é um especialista em extrair transações de faturas de cartão de crédito e débito.
Analise o conteúdo e retorne APENAS um JSON array com as transações encontradas.

Cada transação deve ter:
- "date": data no formato "YYYY-MM-DD"
- "description": descrição da transação
- "amount": valor numérico positivo (sem símbolo de moeda)
- "type": "saida" para compras/débitos, "entrada" para estornos/créditos/pagamentos

Regras:
- Ignore cabeçalhos, rodapés, informações do cartão, limites, etc.
- Valores negativos ou estornos devem ser "entrada"
- Compras normais são "saida"
- Se o ano não estiver explícito na data, assuma o ano atual (${new Date().getFullYear()})
- Se não encontrar transações, retorne um array vazio []
- Retorne SOMENTE o JSON array, sem markdown, sem explicações`;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const text = body.text || "";
    const pdfBase64 = body.pdf_base64 || "";

    if (!text && !pdfBase64) {
      return new Response(JSON.stringify({ error: "Envie o texto extraído do PDF ou o PDF em base64" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    // Build messages based on input type
    let messages: any[];

    if (pdfBase64 && pdfBase64.length > 100) {
      // Use Gemini multimodal to process the PDF directly
      console.log("Processing PDF via multimodal, base64 length:", pdfBase64.length);
      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extraia todas as transações desta fatura de cartão de crédito/débito. Retorne apenas o JSON array.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:application/pdf;base64,${pdfBase64}`,
              },
            },
          ],
        },
      ];
    } else {
      // Use text-based extraction
      console.log("Processing card PDF text, length:", text.length);
      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Texto extraído da fatura de cartão:\n${text.substring(0, 30000)}` },
      ];
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos em Configurações > Workspace > Uso." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Handle 400 errors (invalid PDF, bad format, etc.)
      if (response.status === 400) {
        const isInvalidDoc = errText.includes("no pages") || errText.includes("INVALID_ARGUMENT") || errText.includes("Could not process");
        if (isInvalidDoc) {
          return new Response(JSON.stringify({
            transactions: [],
            error: "O arquivo PDF não pôde ser processado. Verifique se é uma fatura de cartão válida (não protegida ou corrompida) e tente novamente."
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "[]";
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    console.log("AI response:", content.substring(0, 500));

    let transactions: any[] = [];
    try {
      transactions = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response, trying regex:", content.substring(0, 500));
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          transactions = JSON.parse(match[0]);
        } catch {
          transactions = [];
        }
      } else {
        transactions = [];
      }
    }

    // Validate and clean transactions
    if (Array.isArray(transactions)) {
      transactions = transactions.filter((t: any) =>
        t && t.date && t.description && t.amount !== undefined
      ).map((t: any) => ({
        date: String(t.date),
        description: String(t.description),
        amount: Math.abs(Number(t.amount)),
        type: t.type === "entrada" ? "entrada" : "saida",
      }));
    } else {
      transactions = [];
    }

    return new Response(JSON.stringify({ transactions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
