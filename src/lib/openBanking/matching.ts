import { supabase } from "@/integrations/supabase/client";

// Bypass typing for tables not present in generated types
const db: any = supabase;

export interface MatchingOptions {
  /** Tolerância em dias para matching (padrão: 1) */
  toleranciaDias?: number;
  /** Tolerância de valor percentual (padrão: 0 - valor exato) */
  toleranciaValor?: number;
  /** Priorizar matching por descrição similar */
  matchDescricao?: boolean;
}

export interface MatchingResult {
  transacaoId: string;
  lancamentoId: string | null;
  conciliado: boolean;
  metodo: "automatico" | "manual" | "nenhum";
  confianca: number;
}

/**
 * Compara transações bancárias com lançamentos pendentes
 * para matching automático de conciliação
 *
 * Critérios de matching:
 * 1. Valor exato (ou dentro da tolerância)
 * 2. Data da transação +/- tolerância de dias
 * 3. Tipo correspondente (entrada/saída)
 *
 * @param userId - ID do usuário
 * @param transacoes - Lista de transações do Open Banking
 * @param options - Opções de matching
 * @returns Resultados do matching
 *
 * @example
 * ```typescript
 * const transacoes = [
 *   { id: "tx1", valor: 150.00, tipo: "saida", data_transacao: "2024-01-15", descricao: "Pagamento fornecedor" },
 * ];
 *
 * const resultados = await matchingAutomatico(userId, transacoes, {
 *   toleranciaDias: 1,
 *   toleranciaValor: 0.01
 * });
 * ```
 */
export async function matchingAutomatico(
  userId: string,
  transacoes: Array<{
    id: string;
    valor: number;
    tipo: "entrada" | "saida";
    data_transacao: string;
    descricao?: string;
    transacao_id: string;
  }>,
  options: MatchingOptions = {}
): Promise<MatchingResult[]> {
  const {
    toleranciaDias = 1,
    toleranciaValor = 0,
    matchDescricao = false,
  } = options;

  const resultados: MatchingResult[] = [];

  try {
    // Buscar lançamentos pendentes do usuário
    const { data: lancamentosPendentes, error: lancamentosError } = await supabase
      .from("contas_pagar")
      .select("id, valor, data_vencimento, data_pagamento, status, descricao")
      .eq("user_id", userId)
      .in("status", ["pendente", "pago"])
      .then(async ({ data: contasPagar, error: errorPagar }) => {
        if (errorPagar) throw errorPagar;

        const { data: contasReceber, error: errorReceber } = await supabase
          .from("contas_receber")
          .select("id, valor, data_vencimento, data_recebimento, status, descricao")
          .eq("user_id", userId)
          .in("status", ["pendente", "recebido"]);

        if (errorReceber) throw errorReceber;

        // Combinar e formatar lançamentos
        const lancamentos = [
          ...(contasPagar || []).map((c) => ({
            id: c.id,
            valor: c.valor,
            data: c.data_pagamento || c.data_vencimento,
            tipo: "saida" as const,
            status: c.status,
            descricao: c.descricao,
            tabela: "contas_pagar" as const,
          })),
          ...(contasReceber || []).map((c) => ({
            id: c.id,
            valor: c.valor,
            data: c.data_recebimento || c.data_vencimento,
            tipo: "entrada" as const,
            status: c.status,
            descricao: c.descricao,
            tabela: "contas_receber" as const,
          })),
        ];

        return { data: lancamentos, error: null };
      });

    if (lancamentosError) {
      throw new Error("Erro ao buscar lançamentos pendentes");
    }

    // Para cada transação, tentar encontrar match
    for (const transacao of transacoes) {
      const transacaoDate = new Date(transacao.data_transacao);
      const transacaoValor = Math.abs(transacao.valor);

      let melhorMatch: {
        lancamentoId: string | null;
        confianca: number;
        metodo: "automatico" | "manual" | "nenhum";
      } = {
        lancamentoId: null,
        confianca: 0,
        metodo: "nenhum",
      };

      // Verificar cada lançamento pendente
      for (const lancamento of lancamentosPendentes || []) {
        // Verificar tipo
        if (lancamento.tipo !== transacao.tipo) continue;

        // Verificar valor (com tolerância)
        const valorMatch =
          toleranciaValor === 0
            ? Math.abs(lancamento.valor - transacaoValor) < 0.01
            : Math.abs(lancamento.valor - transacaoValor) / transacaoValor <=
              toleranciaValor;

        if (!valorMatch) continue;

        // Verificar data (com tolerância)
        const lancamentoDate = new Date(lancamento.data);
        const diffDias = Math.abs(
          (transacaoDate.getTime() - lancamentoDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        if (diffDias > toleranciaDias) continue;

        // Calcular confiança
        let confianca = 0.5; // Base por valor e tipo

        // Bonus por data exata
        if (diffDias === 0) confianca += 0.3;
        else confianca += 0.1 * (1 - diffDias / toleranciaDias);

        // Bonus por descrição similar (se habilitado)
        if (
          matchDescricao &&
          transacao.descricao &&
          lancamento.descricao &&
          calcularSimilaridadeDescricao(
            transacao.descricao,
            lancamento.descricao
          ) > 0.7
        ) {
          confianca += 0.2;
        }

        // Se confiança alta o suficiente, considerar match automático
        if (confianca >= 0.7 && confianca > melhorMatch.confianca) {
          melhorMatch = {
            lancamentoId: lancamento.id,
            confianca,
            metodo: "automatico",
          };
        } else if (
          confianca >= 0.4 &&
          confianca > melhorMatch.confianca &&
          melhorMatch.metodo !== "automatico"
        ) {
          // Sugerir para matching manual
          melhorMatch = {
            lancamentoId: lancamento.id,
            confianca,
            metodo: "manual",
          };
        }
      }

      // Se encontrou match automático, vincular
      if (melhorMatch.metodo === "automatico" && melhorMatch.lancamentoId) {
        await vincularTransacaoLancamento(
          transacao.id,
          melhorMatch.lancamentoId,
          transacao.tipo === "saida" ? "contas_pagar" : "contas_receber"
        );
      }

      resultados.push({
        transacaoId: transacao.id,
        lancamentoId: melhorMatch.lancamentoId,
        conciliado: melhorMatch.metodo === "automatico",
        metodo: melhorMatch.metodo,
        confianca: melhorMatch.confianca,
      });
    }

    return resultados;
  } catch (error) {
    console.error("Erro no matching automático:", error);
    throw error;
  }
}

/**
 * Vincula uma transação do Open Banking a um lançamento
 */
async function vincularTransacaoLancamento(
  transacaoId: string,
  lancamentoId: string,
  tabela: "contas_pagar" | "contas_receber"
): Promise<void> {
  try {
    // Atualizar transação do Open Banking
    const { error: updateError } = await db
      .from("open_banking_extratos")
      .update({
        conta_pagar_id: tabela === "contas_pagar" ? lancamentoId : null,
        conta_receber_id: tabela === "contas_receber" ? lancamentoId : null,
        status_conciliacao: "conciliado",
        conciliado_em: new Date().toISOString(),
      })
      .eq("id", transacaoId);

    if (updateError) throw updateError;

    // Atualizar lançamento como conciliado
    const { error: lancamentoError } = await (supabase as any)
      .from(tabela)
      .update({
        conciliado: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", lancamentoId);

    if (lancamentoError) throw lancamentoError;
  } catch (error) {
    console.error("Erro ao vincular transação:", error);
    throw error;
  }
}

/**
 * Calcula similaridade entre duas descrições
 * Usa distância de Levenshtein simplificada
 */
function calcularSimilaridadeDescricao(desc1: string, desc2: string): number {
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, "")
      .trim();

  const s1 = normalize(desc1);
  const s2 = normalize(desc2);

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  // Calcular distância de Levenshtein
  const matrix: number[][] = [];
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[s1.length][s2.length];
  const maxLength = Math.max(s1.length, s2.length);

  return 1 - distance / maxLength;
}

/**
 * Sugere matches manuais para transações não conciliadas
 *
 * @param userId - ID do usuário
 * @param transacaoId - ID da transação do Open Banking
 * @param limite - Número máximo de sugestões
 * @returns Lista de sugestões ordenadas por confiança
 */
export async function sugerirMatchesManuais(
  userId: string,
  transacaoId: string,
  limite: number = 5
): Promise<
  Array<{
    lancamentoId: string;
    tipo: "contas_pagar" | "contas_receber";
    descricao: string;
    valor: number;
    data: string;
    confianca: number;
  }>
> {
  try {
    // Buscar detalhes da transação
    const { data: transacao, error: transacaoError } = await db
      .from("open_banking_extratos")
      .select("*")
      .eq("id", transacaoId)
      .single();

    if (transacaoError || !transacao) {
      throw new Error("Transação não encontrada");
    }

    const transacaoDate = new Date(transacao.data_transacao);
    const transacaoValor = Math.abs(transacao.valor);

    // Buscar lançamentos pendentes
    const sugestoes: Array<{
      lancamentoId: string;
      tipo: "contas_pagar" | "contas_receber";
      descricao: string;
      valor: number;
      data: string;
      confianca: number;
    }> = [];

    // Buscar contas a pagar
    const { data: contasPagar } = await supabase
      .from("contas_pagar")
      .select("id, descricao, valor, data_vencimento, data_pagamento")
      .eq("user_id", userId)
      .in("status", ["pendente", "pago"]);

    for (const conta of contasPagar || []) {
      const data = conta.data_pagamento || conta.data_vencimento;
      const contaDate = new Date(data);
      const diffDias = Math.abs(
        (transacaoDate.getTime() - contaDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const diffValor = Math.abs(conta.valor - transacaoValor) / transacaoValor;

      // Calcular confiança
      let confianca = 0;
      if (diffValor < 0.01) confianca += 0.5;
      else if (diffValor < 0.1) confianca += 0.3;

      if (diffDias === 0) confianca += 0.5;
      else if (diffDias <= 3) confianca += 0.3 * (1 - diffDias / 3);

      if (confianca > 0) {
        sugestoes.push({
          lancamentoId: conta.id,
          tipo: "contas_pagar",
          descricao: conta.descricao,
          valor: conta.valor,
          data,
          confianca,
        });
      }
    }

    // Buscar contas a receber
    const { data: contasReceber } = await supabase
      .from("contas_receber")
      .select("id, descricao, valor, data_vencimento, data_recebimento")
      .eq("user_id", userId)
      .in("status", ["pendente", "recebido"]);

    for (const conta of contasReceber || []) {
      const data = conta.data_recebimento || conta.data_vencimento;
      const contaDate = new Date(data);
      const diffDias = Math.abs(
        (transacaoDate.getTime() - contaDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const diffValor = Math.abs(conta.valor - transacaoValor) / transacaoValor;

      let confianca = 0;
      if (diffValor < 0.01) confianca += 0.5;
      else if (diffValor < 0.1) confianca += 0.3;

      if (diffDias === 0) confianca += 0.5;
      else if (diffDias <= 3) confianca += 0.3 * (1 - diffDias / 3);

      if (confianca > 0) {
        sugestoes.push({
          lancamentoId: conta.id,
          tipo: "contas_receber",
          descricao: conta.descricao,
          valor: conta.valor,
          data,
          confianca,
        });
      }
    }

    // Ordenar por confiança e limitar
    return sugestoes
      .sort((a, b) => b.confianca - a.confianca)
      .slice(0, limite);
  } catch (error) {
    console.error("Erro ao sugerir matches:", error);
    throw error;
  }
}
