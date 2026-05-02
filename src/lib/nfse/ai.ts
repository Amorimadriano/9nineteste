/**
 * Integração do Orquestrador Multi-LLM com NFSe
 *
 * Funções especializadas que usam o roteamento inteligente
 * para tarefas específicas do fluxo de Nota Fiscal de Serviço.
 */
import type { AiRequest, AiResponse } from "@/lib/ai";

const GATEWAY_URL = import.meta.env.VITE_AI_GATEWAY_URL ?? "https://ai.gateway.lovable.dev/v1/chat/completions";
const API_KEY = import.meta.env.VITE_LOVABLE_API_KEY ?? "";

/** Tipos de resposta das funções IA */
export interface SugestaoServico {
  itemListaServico: string;
  cnae: string;
  sugestaoDescricao: string;
  aliquotaSugerida: number;
  confianca: "alta" | "media" | "baixa";
}

export interface AnalisePreEmissao {
  valido: boolean;
  problemas: Array<{ campo: string; mensagem: string; severidade: "erro" | "aviso" }>;
  sugestoes: string[];
}

export interface ErroTraduzido {
  codigoOriginal: string;
  mensagemOriginal: string;
  explicacao: string;
  acaoSugerida: string;
  documentacao?: string;
}

export interface AnaliseTomador {
  consistente: boolean;
  alertas: Array<{ tipo: "divergencia" | "incompleto" | "suspeito"; mensagem: string }>;
  sugestoes: string[];
}

/** Helper genérico para chamar o gateway */
async function askAI(taskType: AiRequest["taskType"], messages: AiRequest["messages"], temperature?: number): Promise<AiResponse> {
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ taskType, messages, temperature }),
  });
  if (!res.ok) throw new Error(`Erro ${res.status}: ${await res.text()}`);
  return res.json();
}

/**
 * Sugere item da lista de serviços (LC 116), CNAE e descrição
 * a partir de uma descrição natural do serviço prestado.
 *
 * Usa Claude Sonnet (reasoning) para mapeamento preciso.
 */
export async function sugerirServico(descricaoNatural: string): Promise<SugestaoServico> {
  const systemPrompt = `Você é um especialista em classificação fiscal de serviços segundo a LC 116/2003 (Lista de Serviços do ISSQN).

Dada uma descrição natural de serviço, retorne APENAS um JSON válido com:
- itemListaServico: código do item LC 116 (ex: "1.01", "1.02", "14.02")
- cnae: código CNAE relacionado (ex: "6201500")
- sugestaoDescricao: texto padronizado para discriminação da nota fiscal
- aliquotaSugerida: número (percentual, ex: 2.0)
- confianca: "alta" | "media" | "baixa"

ITENS COMUNS:
1.01 - Análise e desenvolvimento de sistemas
1.02 - Programação
1.03 - Processamento de dados
1.04 - Elaboração de programas de computadores
1.05 - Licenciamento de programas de computadores
1.06 - Assessoria e consultoria em informática
1.07 - Suporte técnico em informática
14.01 - Serviços de engenharia
14.02 - Serviços de arquitetura
17.01 - Serviços de contabilidade
17.02 - Serviços de auditoria
17.03 - Serviços de consultoria e assessoria empresarial
17.04 - Serviços de organização de sistemas administrativos
17.05 - Serviços de consultoria em gestão
17.09 - Serviços de consultoria em recursos humanos

Retorne SOMENTE o JSON, sem markdown, sem explicações adicionais.`;

  const response = await askAI("reasoning", [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Descrição do serviço: "${descricaoNatural}"` },
  ], 0.2);

  try {
    const clean = response.content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(clean) as SugestaoServico;
  } catch {
    // Fallback: retorna estrutura padrão se o LLM não retornar JSON válido
    return {
      itemListaServico: "",
      cnae: "",
      sugestaoDescricao: descricaoNatural,
      aliquotaSugerida: 2.0,
      confianca: "baixa",
    };
  }
}

/**
 * Analisa dados do tomador e detecta inconsistências
 * comparando com dados históricos ou padrões conhecidos.
 *
 * Usa Gemini Flash (fast) para velocidade.
 */
export async function analisarTomador(
  tomador: {
    documento: string;
    razaoSocial: string;
    endereco: string;
    cidade: string;
    estado: string;
    email: string;
  }
): Promise<AnaliseTomador> {
  const systemPrompt = `Você é um validador de dados cadastrais para notas fiscais de serviço.
Analise os dados do tomador e retorne APENAS um JSON com:
- consistente: boolean
- alertas: array de objetos { tipo: "divergencia" | "incompleto" | "suspeito", mensagem: string }
- sugestoes: array de strings

Regras:
- Endereço incompleto (sem número, sem bairro) = alerta tipo "incompleto"
- Email suspeito (domínio genérico tipo @gmail.com para empresa grande) = alerta tipo "suspeito"
- Razão social muito curta (< 5 caracteres) = alerta tipo "suspeito"
- Documento vazio ou inválido = alerta tipo "divergencia"

Retorne SOMENTE o JSON, sem markdown.`;

  const response = await askAI("fast", [
    { role: "system", content: systemPrompt },
    { role: "user", content: JSON.stringify(tomador, null, 2) },
  ], 0.1);

  try {
    const clean = response.content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(clean) as AnaliseTomador;
  } catch {
    return { consistente: true, alertas: [], sugestoes: [] };
  }
}

/**
 * Valida os dados completos da nota antes da emissão,
 * detectando problemas que a validação estática não pega.
 *
 * Usa Claude Sonnet (reasoning) para lógica complexa.
 */
export async function validarPreEmissao(
  dados: Record<string, any>
): Promise<AnalisePreEmissao> {
  const systemPrompt = `Você é um auditor fiscal de notas fiscais de serviço (NFSe) experiente.
Analise os dados da nota e retorne APENAS um JSON com:
- valido: boolean
- problemas: array de { campo: string, mensagem: string, severidade: "erro" | "aviso" }
- sugestoes: array de strings

Regras de validação:
- Valor bruto <= 0 → erro
- Base de cálculo ≠ (valor bruto - deduções) → erro
- Valor ISS ≠ (base × alíquota / 100) → erro (tolerância R$ 0,01)
- Descrição vazia ou muito curta (< 10 caracteres) → erro
- Tomador sem CNPJ/CPF → erro
- Alíquota ISS > 5% para São Paulo → aviso
- Retenções somadas > 30% do valor bruto → aviso
- Valor líquido < 0 → erro
- ISS retido sem justificativa (valor baixo) → aviso

Retorne SOMENTE o JSON, sem markdown.`;

  const response = await askAI("reasoning", [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Dados da nota:\n${JSON.stringify(dados, null, 2)}` },
  ], 0.2);

  try {
    const clean = response.content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(clean) as AnalisePreEmissao;
  } catch {
    return { valido: true, problemas: [], sugestoes: [] };
  }
}

/**
 * Traduz erros do GINFES em mensagens amigáveis e acionáveis.
 *
 * Usa GPT-4o (code) para parsing estruturado de XML/erros.
 */
export async function traduzirErroGinfes(
  codigo: string,
  mensagemOriginal: string,
  xmlContexto?: string
): Promise<ErroTraduzido> {
  const systemPrompt = `Você é um especialista em integração com a Prefeitura de São Paulo (GINFES).
Traduza erros técnicos em instruções claras para o usuário.

Retorne APENAS um JSON com:
- codigoOriginal: string
- mensagemOriginal: string
- explicacao: string (em português, linguagem simples)
- acaoSugerida: string (passo a passo do que fazer)
- documentacao: string (URL ou referência, se conhecida)

CÓDIGOS GINFES CONHECIDOS:
E1 - CNPJ inválido → Verificar se o CNPJ do tomador está correto
E2 - Inscrição Municipal inválida → Verificar inscrição municipal do prestador
E3 - RPS já informado → O número do RPS já foi usado; gerar novo número
E10 - Tomador não informado → Preencher dados do tomador
E26 - NFS-e não encontrada → Verificar número da nota ou consultar novamente mais tarde
E28 - Certificado inválido → Verificar validade e CNPJ do certificado digital
E29 - Assinatura inválida → Reassinar o XML ou verificar certificado
E30 - XML mal formatado → Verificar estrutura do XML enviado
E50 - Erro interno da prefeitura → Tentar novamente em alguns minutos
E60 - Requisição mal formada → Verificar parâmetros da requisição

Retorne SOMENTE o JSON, sem markdown.`;

  const userContent = xmlContexto
    ? `Código: ${codigo}\nMensagem: ${mensagemOriginal}\n\nXML de contexto:\n${xmlContexto.substring(0, 3000)}`
    : `Código: ${codigo}\nMensagem: ${mensagemOriginal}`;

  const response = await askAI("code", [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent },
  ], 0.1);

  try {
    const clean = response.content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(clean) as ErroTraduzido;
  } catch {
    return {
      codigoOriginal: codigo,
      mensagemOriginal,
      explicacao: mensagemOriginal,
      acaoSugerida: "Verifique os dados e tente novamente. Se o erro persistir, consulte o suporte.",
    };
  }
}

/**
 * Sugere configurações de retenção baseado no serviço e tomador.
 *
 * Usa Claude Sonnet (reasoning).
 */
export async function sugerirRetencoes(
  valorBruto: number,
  itemListaServico: string,
  tomadorRegime?: string
): Promise<{
  pis: number;
  cofins: number;
  inss: number;
  ir: number;
  csll: number;
  justificativa: string;
}> {
  const systemPrompt = `Você é um consultor tributário especializado em retenções de NFSe.
Baseado no valor do serviço, item LC 116 e regime do tomador, sugira as alíquotas de retenção.

Retorne APENAS um JSON com:
- pis: número (percentual)
- cofins: número (percentual)
- inss: número (percentual)
- ir: número (percentual)
- csll: número (percentual)
- justificativa: string explicando a sugestão

REGRAS GERAIS:
- Valor até R$ 5.000: geralmente sem retenção federal
- Valor > R$ 5.000 e <= R$ 10.000: pode haver retenção de INSS (11%) e IR (1,5%)
- Valor > R$ 10.000: retenções completas (PIS 0,65%, COFINS 3%, INSS 11%, IR 1,5%, CSLL 1%)
- Simples Nacional: geralmente isento de retenções federais
- Serviços de TI (1.01-1.07): geralmente sem retenção federal se valor < R$ 5.000

Retorne SOMENTE o JSON, sem markdown.`;

  const response = await askAI("reasoning", [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Valor bruto: R$ ${valorBruto}\nItem LC 116: ${itemListaServico}\nRegime do tomador: ${tomadorRegime || "não informado"}` },
  ], 0.2);

  try {
    const clean = response.content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return { pis: 0, cofins: 0, inss: 0, ir: 0, csll: 0, justificativa: "Não foi possível sugerir. Consulte seu contador." };
  }
}

/**
 * Analisa um lote de notas emitidas e gera insights.
 *
 * Usa Claude Opus (creative) para análise estratégica.
 */
export async function analisarLoteNotas(notas: Array<Record<string, any>>): Promise<string> {
  const systemPrompt = `Você é um consultor financeiro analisando um lote de notas fiscais de serviço.
Forneça um resumo executivo conciso em português, máximo 3 parágrafos.
Destaque padrões, anomalias e recomendações práticas.`;

  const response = await askAI("creative", [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Analise este lote de notas:\n${JSON.stringify(notas.slice(0, 20), null, 2)}` },
  ], 0.5);

  return response.content;
}
