/**
 * Cliente para consulta de Score na API Serasa Experian
 * Documentação: https://developer.serasa.com.br/
 */

import { supabase } from "@/integrations/supabase/client";

export interface ConsultaScoreSerasa {
  documento: string;
  tipo: "pf" | "pj";
  score?: number;
  classificacao?: string;
  risco?: "baixo" | "medio" | "alto" | "muito_alto";
  probabilidadeInadimplencia?: number;
  dadosCadastrais?: {
    nome?: string;
    nomeFantasia?: string;
    situacao?: string;
    dataSituacao?: string;
  };
  mensagem?: string;
}

export interface ResultadoConsultaSerasa {
  sucesso: boolean;
  dados?: ConsultaScoreSerasa;
  erro?: string;
}

/**
 * Consulta score na Serasa via Edge Function
 * @param documento CPF ou CNPJ
 * @param tipo "pf" ou "pj"
 * @returns Resultado da consulta
 */
export async function consultarScoreSerasa(
  documento: string,
  tipo: "pf" | "pj"
): Promise<ResultadoConsultaSerasa> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "consulta-score-serasa",
      {
        body: {
          documento: documento.replace(/\D/g, ""),
          tipo,
        },
      }
    );

    if (error) {
      throw error;
    }

    if (!data.sucesso) {
      return {
        sucesso: false,
        erro: data.erro || "Erro na consulta",
      };
    }

    return {
      sucesso: true,
      dados: data as ConsultaScoreSerasa,
    };
  } catch (error: any) {
    console.error("Erro ao consultar Serasa:", error);
    return {
      sucesso: false,
      erro: error.message || "Erro ao conectar com Serasa",
    };
  }
}

/**
 * Formata o score para exibição
 */
export function formatarScoreSerasa(score: number): {
  classificacao: string;
  cor: string;
  risco: string;
  recomendacao: string;
} {
  if (score >= 800) {
    return {
      classificacao: "AAA",
      cor: "bg-emerald-500",
      risco: "Baixo",
      recomendacao: "Excelente pontuação. Risco mínimo de inadimplência.",
    };
  } else if (score >= 700) {
    return {
      classificacao: "AA",
      cor: "bg-green-500",
      risco: "Baixo",
      recomendacao: "Bom pagador. Risco baixo de inadimplência.",
    };
  } else if (score >= 600) {
    return {
      classificacao: "A",
      cor: "bg-lime-500",
      risco: "Médio",
      recomendacao: "Risco moderado. Analisar caso a caso.",
    };
  } else if (score >= 500) {
    return {
      classificacao: "B",
      cor: "bg-amber-500",
      risco: "Médio-Alto",
      recomendacao: "Risco elevado. Exigir garantias adicionais.",
    };
  } else if (score >= 400) {
    return {
      classificacao: "C",
      cor: "bg-orange-500",
      risco: "Alto",
      recomendacao: "Risco alto. Exigir pagamento à vista ou garantia real.",
    };
  } else if (score >= 300) {
    return {
      classificacao: "D",
      cor: "bg-red-400",
      risco: "Muito Alto",
      recomendacao: "Risco muito alto. Não recomendado para prazo.",
    };
  } else {
    return {
      classificacao: "E",
      cor: "bg-red-600",
      risco: "Crítico",
      recomendacao: "Risco crítico. Venda apenas à vista.",
    };
  }
}

/**
 * Calcula probabilidade de inadimplência baseada no score
 */
export function calcularProbabilidadeInadimplencia(score: number): number {
  // Quanto menor o score, maior a probabilidade
  return Math.round((1000 - score) / 10);
}
