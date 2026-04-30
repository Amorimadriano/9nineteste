/**
 * Geração local do Parecer Executivo de IBS/CBS
 * Sem dependência de IA externa — 100% algorítmico e baseado nas diretrizes tributárias
 */

export interface SimulacaoDados {
  empresa: string;
  setor: string;
  regimeAtual: "simples" | "presumido" | "real";
  faturamentoMensal: number;
  faturamentoAnual: number;
  cargaAtual: number;
  aliquotaAtual: number;
  cargaNova: number;
  variacao: number;
  impactoSplit: number;
  capitalGiroAnual: number;
  prazoRecebimento: number;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function gerarParecerExecutivo(dados: SimulacaoDados): string {
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

  const regimeLabel =
    regimeAtual === "simples"
      ? "Simples Nacional"
      : regimeAtual === "presumido"
      ? "Lucro Presumido"
      : "Lucro Real";

  const variacaoAbs = Math.abs(variacao);
  const ehAumento = variacao > 0;
  const cargaEfetivaAtual = (cargaAtual / faturamentoMensal) * 100;
  const cargaEfetivaNova = (cargaNova / faturamentoMensal) * 100;
  const diferencaEfetiva = cargaEfetivaNova - cargaEfetivaAtual;

  // ═══════════════════════════════════════════════════
  // 1. ANÁLISE COMPARATIVA
  // ═══════════════════════════════════════════════════
  const analiseComparativa = `
## 1. Análise Comparativa da Carga Tributária

**Regime atual:** ${regimeLabel} | **Setor:** ${setor}

| Indicador | Regime Atual | Novo Modelo (IBS + CBS) | Variação |
|---|---|---|---|
| **Alíquota Nominal** | ${aliquotaAtual.toFixed(1)}% | 26,5% | ${ehAumento ? "+" : ""}${(26.5 - aliquotaAtual).toFixed(1)} p.p. |
| **Carga Mensal** | ${fmt(cargaAtual)} | ${fmt(cargaNova)} | ${ehAumento ? "+" : ""}${fmt(cargaNova - cargaAtual)} |
| **Carga Anual** | ${fmt(cargaAtual * 12)} | ${fmt(cargaNova * 12)} | ${ehAumento ? "+" : ""}${fmt((cargaNova - cargaAtual) * 12)} |
| **Carga Efetiva / Faturamento** | ${cargaEfetivaAtual.toFixed(2)}% | ${cargaEfetivaNova.toFixed(2)}% | ${diferencaEfetiva > 0 ? "+" : ""}${diferencaEfetiva.toFixed(2)} p.p. |
| **Variação Percentual** | — | — | **${ehAumento ? "+" : ""}${variacao.toFixed(2)}%** |

A **carga tributária efetiva** sobre o faturamento passa de **${cargaEfetivaAtual.toFixed(2)}%** para **${cargaEfetivaNova.toFixed(2)}%**.
${
  ehAumento
    ? `Isso representa um **aumento real de ${variacaoAbs.toFixed(2)}%** na despesa tributária mensal.`
    : `Isso representa uma **redução real de ${variacaoAbs.toFixed(2)}%** na despesa tributária mensal.`
}
`;

  // ═══════════════════════════════════════════════════
  // 2. IMPACTO NO FLUXO DE CAIXA (SPLIT PAYMENT)
  // ═══════════════════════════════════════════════════
  const impactoCaixa = `
## 2. Impacto no Fluxo de Caixa — Split Payment

O mecanismo de **Split Payment** prevê a retenção do tributo no momento do recebimento da operação. Com base nos dados simulados:

- **Retenção mensal estimada:** ${fmt(impactoSplit)}
- **Capital de giro comprometido (12 meses):** ${fmt(capitalGiroAnual)}
- **Prazo médio de recebimento:** ${prazoRecebimento} dias

**Análise de liquidez:**
${
  prazoRecebimento > 45
    ? `Com um prazo de recebimento de **${prazoRecebimento} dias**, o impacto do Split Payment é **acentuado**. A empresa terá valores retidos por quase ${Math.ceil(prazoRecebimento / 30)} meses antes de possível compensação, pressionando severamente o capital de giro.`
    : prazoRecebimento > 30
    ? `Com um prazo de recebimento de **${prazoRecebimento} dias**, há uma pressão moderada sobre o caixa. A retenção ocorre antes da entrada efetiva do recurso, exigindo atenção na gestão de tesouraria.`
    : `Com um prazo de recebimento de **${prazoRecebimento} dias**, o impacto sobre o caixa é **mais suave**, especialmente se a empresa utiliza Pix ou Débito, onde a retenção é quase instantânea.`
}

${
  capitalGiroAnual > faturamentoAnual * 0.15
    ? `**Alerta:** O capital de giro comprometido (${fmt(capitalGiroAnual)}) representa mais de **15% do faturamento anual**. Recomenda-se linha de crédito ou antecipação de recebíveis.`
    : `O capital de giro comprometido está dentro de parâmetros administráveis, mas deve ser monitorado trimestralmente.`
}
`;

  // ═══════════════════════════════════════════════════
  // 3. CRÉDITO PLENO (NÃO-CUMULATIVIDADE)
  // ═══════════════════════════════════════════════════
  const creditoPleno = `
## 3. Crédito Pleno e Competitividade

A Reforma Tributária estabelece o **princípio da não-cumulatividade plena** (crédito de insumos em toda a cadeia). Para o setor de **${setor}**, os ganhos esperados são:

- **Apropriação de créditos de insumos:** Compras de matéria-prima, serviços e utilidades passam a gerar crédito tributário utilizável em operações subsequentes.
- **Eliminação do efeito cascata:** A carga tributária efetiva tende a se aproximar da alíquota nominal, reduzindo distorções entre cadeias curtas e longas.
- **Ganho competitivo:** Empresas com alta cadeia de fornecedores (ex: Indústria e Comércio) são **mais beneficiadas** do que empresas de Serviços, que tradicionalmente possuem menos insumos creditáveis.

${
  setor === "servicos"
    ? `⚠️ **Atenção para Serviços:** O setor de serviços historicamente possui baixa relação insumo/receita. A adequação tributária deve focar em identificar todos os serviços intermediários passíveis de crédito (ex: contabilidade, jurídico, tecnologia).`
    : setor === "industria"
    ? `✅ **Vantagem para Indústria:** O setor industrial possui alta densidade de insumos. A recuperação de créditos de matéria-prima, energia e frete pode **neutralizar parcialmente** o aumento da alíquota.`
    : `✅ **Vantagem para Comércio:** O comércio se beneficia da recuperação de créditos de aquisição de mercadorias para revenda, reduzindo a carga líquida efetiva.`
}
`;

  // ═══════════════════════════════════════════════════
  // 4. ALERTAS E RECOMENDAÇÕES
  // ═══════════════════════════════════════════════════
  let alertas = `## 4. Alertas e Recomendações Estratégicas\n\n`;

  if (variacaoAbs > 10) {
    alertas += `🚨 **ALERTA CRÍTICO:** A carga tributária aumenta **${variacaoAbs.toFixed(2)}%** sob o novo modelo. Isso excede o limiar de 10% e demanda ação imediata.\n\n**Ações sugeridas:**\n`;
    alertas += `1. **Revisão de precificação:** Avalie repasse parcial do aumento tributário aos preços de venda. Estudo de elasticidade recomendado.\n`;
    alertas += `2. **Estratégia de compras:** Antecipe aquisições de insumos antes da transição para maximizar créditos.\n`;
    alertas += `3. **Reengenharia tributária:** Avalie mudança de regime (ex: Simples → Real) se a carga efetiva for mais favorável no novo modelo.\n`;
    alertas += `4. **Linha de crédito:** Contrate antecipação de recebíveis ou capital de giro para cobrir o déficit de caixa do Split Payment.\n`;
  } else if (variacaoAbs > 5) {
    alertas += `⚠️ **ALERTA MODERADO:** A variação de ${variacaoAbs.toFixed(2)}% requer atenção, mas está dentro de banda administrável.\n\n**Ações sugeridas:**\n`;
    alertas += `1. **Monitoramento trimestral:** Acompanhe a carga efetiva real vs. projetada após a transição.\n`;
    alertas += `2. **Mapeamento de créditos:** Identifique todos os insumos passíveis de crédito para reduzir a carga líquida.\n`;
    alertas += `3. **Negociação com fornecedores:** Busque notas fiscais completas para aproveitamento de créditos.\n`;
  } else {
    alertas += `✅ **Cenário Estável:** A variação de ${variacaoAbs.toFixed(2)}% é marginal. O impacto deve ser absorvido pela operação sem grandes mudanças estruturais.\n\n**Ações sugeridas:**\n`;
    alertas += `1. **Manutenção:** Continue monitorando a carga tributária efetiva trimestralmente.\n`;
    alertas += `2. **Oportunidade:** Use a estabilidade tributária para investir em crescimento ou redução de custos operacionais.\n`;
  }

  // ═══════════════════════════════════════════════════
  // 5. CONCLUSÃO ESTRATÉGICA
  // ═══════════════════════════════════════════════════
  let conclusao = `## 5. Conclusão Estratégica\n\n`;

  if (variacao > 10) {
    conclusao += `### 🔴 Cenário Desfavorável\n\n`;
    conclusao += `1. **Aumento expressivo da carga:** A elevação de ${variacaoAbs.toFixed(2)}% na carga tributária compromete a margem líquida e exige ajustes de precificação ou estrutura de custos.\n`;
    conclusao += `2. **Pressão severa no caixa:** O Split Payment retém ${fmt(impactoSplit)}/mês, exigindo gestão rigorosa de capital de giro ou fontes alternativas de financiamento.\n`;
    conclusao += `3. **Ação recomendada:** Iniciar imediatamente um projeto de adequação tributária com contador especialista em Reforma Tributária. Simular cenários de regime alternativo e reavaliar cadeia de fornecedores.\n`;
  } else if (variacao > 0) {
    conclusao += `### 🟡 Cenário Neutro a Levemente Desfavorável\n\n`;
    conclusao += `1. **Aumento administrável:** A elevação de ${variacaoAbs.toFixed(2)}% é perceptível, mas pode ser mitigada pela apropriação de créditos de insumos e ajustes operacionais leves.\n`;
    conclusao += `2. **Caixa monitorável:** O impacto do Split Payment requer atenção, mas não compromete a solvência a curto prazo se houver gestão de tesouraria adequada.\n`;
    conclusao += `3. **Ação recomendada:** Manter monitoramento contínuo e aproveitar a não-cumulatividade plena para reduzir a carga líquida efetiva na prática.\n`;
  } else {
    conclusao += `### 🟢 Cenário Favorável\n\n`;
    conclusao += `1. **Redução real da carga:** A diminuição de ${variacaoAbs.toFixed(2)}% libera recursos mensais que podem ser reinvestidos em crescimento, tecnologia ou redução de preços para ganho de market share.\n`;
    conclusao += `2. **Simplificação operacional:** A unificação de PIS, COFINS, ICMS e ISS em IBS/CBS reduz custos de compliance e obrigações acessórias.\n`;
    conclusao += `3. **Ação recomendada:** Acelerar a transição se possível, maximizando o aproveitamento de créditos e usando o diferencial tributário como vantagem competitiva.\n`;
  }

  // ═══════════════════════════════════════════════════
  // CABEÇALHO EXECUTIVO
  // ═══════════════════════════════════════════════════
  const cabecalho = `# Parecer Executivo — Reforma Tributária IBS/CBS

**Empresa:** ${empresa || "Não informada"}
**Setor:** ${setor}
**Regime Atual:** ${regimeLabel}
**Faturamento Mensal:** ${fmt(faturamentoMensal)}
**Data do parecer:** ${new Date().toLocaleDateString("pt-BR")}

---

`;

  // ═══════════════════════════════════════════════════
  // DISCLAIMER
  // ═══════════════════════════════════════════════════
  const disclaimer = `

---

*Este parecer foi gerado automaticamente com base nos dados informados na simulação. As alíquotas e regras da Reforma Tributária estão sujeitas a alterações legislativas. Recomenda-se validação com contador especialista antes de decisões estratégicas.*
`;

  return (
    cabecalho +
    analiseComparativa +
    impactoCaixa +
    creditoPleno +
    alertas +
    conclusao +
    disclaimer
  );
}
