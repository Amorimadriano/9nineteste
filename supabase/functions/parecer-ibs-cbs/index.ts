// Edge function: gera parecer executivo da simulação IBS/CBS + Split Payment
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dados } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY ausente");

    const systemPrompt = `Você é um consultor tributário sênior especializado na Reforma Tributária brasileira (EC 132/2023, LC 214/2025). Analise o impacto do IBS, CBS e Split Payment nas finanças da empresa. Responda em português, em linguagem executiva, com no máximo 350 palavras. Estruture em 4 blocos curtos com emojis: 📊 Diagnóstico, ⚠️ Riscos, 💡 Oportunidades, 🎯 Recomendações Práticas. Seja direto e use números do contexto.`;

    const userPrompt = `Analise esta simulação:
- Empresa: ${dados.empresa || "Não informado"}
- Setor: ${dados.setor}
- Regime atual: ${dados.regimeAtual}
- Faturamento mensal: R$ ${dados.faturamentoMensal?.toLocaleString("pt-BR")}
- Faturamento anual projetado: R$ ${dados.faturamentoAnual?.toLocaleString("pt-BR")}
- Carga tributária ATUAL (PIS+COFINS+ICMS+ISS): R$ ${dados.cargaAtual?.toLocaleString("pt-BR")} (${dados.aliquotaAtual}%)
- Carga tributária NOVA (IBS+CBS 26,5%): R$ ${dados.cargaNova?.toLocaleString("pt-BR")}
- Variação: ${dados.variacao > 0 ? "+" : ""}${dados.variacao?.toFixed(2)}%
- Impacto Split Payment no caixa (retenção imediata): R$ ${dados.impactoSplit?.toLocaleString("pt-BR")}/mês
- Capital de giro perdido (12 meses): R$ ${dados.capitalGiroAnual?.toLocaleString("pt-BR")}
- Prazo médio de recebimento atual: ${dados.prazoRecebimento} dias

Gere o parecer executivo agora.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Tente novamente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (resp.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Contate o administrador." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const txt = await resp.text();
      console.error("AI error:", resp.status, txt);
      return new Response(JSON.stringify({ error: "Erro ao gerar parecer" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const parecer = data.choices?.[0]?.message?.content || "Parecer indisponível.";

    return new Response(JSON.stringify({ parecer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parecer-ibs-cbs:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
