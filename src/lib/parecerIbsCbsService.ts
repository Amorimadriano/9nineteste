import { gerarParecerExecutivo, SimulacaoDados } from "./gerarParecerIbsCbs";
import { supabase } from "@/integrations/supabase/client";

/**
 * Serviço de parecer IBS/CBS com fallback inteligente:
 * 1. Tenta chamar a edge function do Supabase
 * 2. Se falhar (rede, erro 5xx, timeout), gera localmente
 * 3. Sempre retorna um parecer válido
 */

const EDGE_FUNCTION_NAME = "parecer-ibs-cbs";
const TIMEOUT_MS = 15000;

async function chamarEdgeFunction(dados: SimulacaoDados): Promise<string> {
  const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION_NAME, {
    body: { dados },
  });

  if (error) {
    throw error;
  }

  if (!data || typeof data.parecer !== "string") {
    throw new Error("Resposta da edge function inválida");
  }

  return data.parecer;
}

export async function gerarParecerComFallback(dados: SimulacaoDados): Promise<{
  texto: string;
  fonte: "edge" | "local";
  erro?: string;
}> {
  // Validação prévia
  if (!dados || typeof dados !== "object") {
    return {
      texto: gerarParecerExecutivo(dados),
      fonte: "local",
      erro: "Dados inválidos — usando geração local",
    };
  }

  if (
    typeof dados.faturamentoMensal !== "number" ||
    !Number.isFinite(dados.faturamentoMensal) ||
    dados.faturamentoMensal <= 0
  ) {
    return {
      texto: "Não foi possível gerar o parecer: faturamento mensal inválido.",
      fonte: "local",
      erro: "Faturamento mensal deve ser maior que zero.",
    };
  }

  // Tenta edge function com timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const texto = await Promise.race([
      chamarEdgeFunction(dados),
      new Promise<string>((_, reject) => {
        controller.signal.addEventListener("abort", () => {
          reject(new Error("Timeout ao chamar parecer-ibs-cbs"));
        });
      }),
    ]);

    clearTimeout(timeoutId);
    return { texto, fonte: "edge" };
  } catch (err: any) {
    const erroMsg = err?.message || String(err);
    console.warn("[parecer-ibs-cbs] Edge function falhou, usando fallback local:", erroMsg);

    // Fallback local garantido
    const texto = gerarParecerExecutivo(dados);
    return {
      texto,
      fonte: "local",
      erro: `Serviço remoto indisponível (${erroMsg}). Parecer gerado localmente.`,
    };
  }
}
