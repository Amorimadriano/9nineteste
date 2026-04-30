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

// Edge function: gera parecer executivo da simulação IBS/CBS + Split Payment (geração local)

function gerarParecerLocal(dados: any): string {
  const {
    empresa,
    setor,
    regimeAtual,
    faturamentoMensal,
    faturamentoAnual,
    cargaAtual,
    aliquotaAtual,
    cargaNova,
    variacao,
    impactoSplit,
    capitalGiroAnual,
    prazoRecebimento,
  } = dados;

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const variacaoAbs = Math.abs(variacao);
  const ehAumento = variacao > 0;

  // Bloco 1: Diagnóstico
  const diagnostico = `📊 Diagnóstico
A empresa ${empresa || "Não informado"}, do setor de ${setor}, encontra-se no regime ${regimeAtual === "simples" ? "Simples Nacional" : regimeAtual === "presumido" ? "Lucro Presumido" : "Lucro Real"}. Com faturamento mensal de ${fmt(faturamentoMensal)}, a carga tributária atual estimada é de ${fmt(cargaAtual)} (${aliquotaAtual}%). Sob a Reforma Tributária (IBS + CBS), a carga passaria a ${fmt(cargaNova)} (26,5%), representando uma ${ehAumento ? "elevação" : "redução"} de ${variacaoAbs.toFixed(2)}% na carga.`;

  // Bloco 2: Riscos
  let riscos = `⚠️ Riscos
`;
  if (ehAumento) {
    riscos += `A transição eleva a carga tributária em ${variacaoAbs.toFixed(2)}%, reduzindo margem líquida. `;
  } else {
    riscos += `A carga tributária diminui, mas atenção: a base de cálculo pode mudar com novas regras de substituição tributária. `;
  }
  riscos += `O Split Payment retém ${fmt(impactoSplit)}/mês no caixa, comprometendo capital de giro. Em 12 meses, isso acumula ${fmt(capitalGiroAnual)} retidos antes da compensação/comércio exterior. Com prazo médio de recebimento de ${prazoRecebimento} dias, o ciclo de conversão de caixa ficará ainda mais pressionado.`;

  // Bloco 3: Oportunidades
  let oportunidades = `💡 Oportunidades
`;
  if (!ehAumento) {
    oportunidades += `A carga tributária projetada é menor, o que pode liberar recursos para reinvestimento. `;
  }
  oportunidades += `O Split Payment elimina a necessidade de recolhimento posterior de PIS/COFINS/ICMS/ISS, simplificando obrigações acessórias. Empresas com baixo prazo de recebimento (ex: Pix/Débito) sofrerão menor impacto de caixa. Além disso, créditos de IBS/CBS poderão ser utilizados em cadeia produtiva.`;

  // Bloco 4: Recomendações
  let recomendacoes = `🎯 Recomendações Práticas
`;
  if (prazoRecebimento > 30) {
    recomendacoes += `1. Negocie antecipação de recebíveis ou Pix crédito para reduzir o prazo de ${prazoRecebimento} dias.\n`;
  }
  recomendacoes += `${prazoRecebimento > 30 ? "2" : "1"}. Mapeie o estoque de créditos tributários atuais para utilização na transição.\n`;
  recomendacoes += `${prazoRecebimento > 30 ? "3" : "2"}. Simule cenários de faturamento sazonal para prever picos de retenção.\n`;
  recomendacoes += `${prazoRecebimento > 30 ? "4" : "3"}. Consulte um contador especialista em Reforma Tributária para validar o cenário específico.`;

  return [diagnostico, riscos, oportunidades, recomendacoes].join("\n\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    const corsHeaders = getCorsHeaders(req);
  return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dados } = await req.json();
    if (!dados) throw new Error("Dados da simulação ausentes");

    const parecer = gerarParecerLocal(dados);

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
