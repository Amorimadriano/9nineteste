/**
 * Módulo de Conciliação Automática
 * Realiza matching entre lançamentos importados do ERP e lançamentos financeiros locais
 */

import { supabase } from "@/integrations/supabase/client";

// Bypass typing for tables not present in generated types
const db: any = supabase;

export interface CriterioConciliacao {
  toleranciaValor: number;
  toleranciaDias: number;
  exigirDocumento: boolean;
  pesoValor: number;
  pesoData: number;
  pesoDocumento: number;
}

export interface SugestaoMatch {
  lancamentoImportadoId: string;
  candidatoId: string;
  candidatoTipo: string;
  score: number;
  motivo: string;
}

export interface ResultadoConciliacao {
  conciliado: boolean;
  lancamentoImportadoId?: string;
  lancamentoLocalId?: string;
  multiplosMatches?: boolean;
  sugestoes?: SugestaoMatch[];
  erro?: string;
}

export interface RelatorioDivergencias {
  totalPendente: number;
  totalConciliado: number;
  divergenciasValor: DivergenciaValor[];
  divergenciasData: DivergenciaData[];
  naoEncontrados: NaoEncontrado[];
}

export interface DivergenciaValor {
  id: string;
  tipo: string;
  descricao: string;
  valorERP: number;
  valorLocal: number;
  diferenca: number;
}

export interface DivergenciaData {
  id: string;
  tipo: string;
  descricao: string;
  dataERP: string;
  dataLocal: string;
  diferencaDias: number;
}

export interface NaoEncontrado {
  id: string;
  tipo: string;
  descricao: string;
  valor: number;
  data: string;
}

// Critérios padrão
const CRITERIOS_PADRAO: CriterioConciliacao = {
  toleranciaValor: 0.01,
  toleranciaDias: 1,
  exigirDocumento: false,
  pesoValor: 0.5,
  pesoData: 0.3,
  pesoDocumento: 0.2,
};

/**
 * Calcula score de matching entre dois lançamentos
 */
export function calcularScore(
  importado: {
    valor: number;
    data: string;
    documento?: string;
  },
  candidato: {
    valor: number;
    data: string;
    documento?: string;
  },
  criterios: CriterioConciliacao
): { score: number; detalhes: Record<string, number> } {
  const detalhes: Record<string, number> = {};

  // Score por valor (quanto mais próximo, maior o score)
  const diffValor = Math.abs(importado.valor - candidato.valor);
  const scoreValor = Math.max(0, 1 - diffValor / importado.valor);
  detalhes.valor = scoreValor * criterios.pesoValor;

  // Score por data
  const importadoDate = new Date(importado.data);
  const candidatoDate = new Date(candidato.data);
  const diffDias = Math.abs(
    (importadoDate.getTime() - candidatoDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const scoreData = Math.max(0, 1 - diffDias / criterios.toleranciaDias);
  detalhes.data = scoreData * criterios.pesoData;

  // Score por documento
  let scoreDocumento = 0;
  if (importado.documento && candidato.documento) {
    const docImportado = importado.documento.toLowerCase().replace(/\D/g, "");
    const docCandidato = candidato.documento.toLowerCase().replace(/\D/g, "");

    if (docImportado === docCandidato) {
      scoreDocumento = 1;
    } else if (
      docImportado.includes(docCandidato) ||
      docCandidato.includes(docImportado)
    ) {
      scoreDocumento = 0.8;
    } else if (levenshteinDistance(docImportado, docCandidato) <= 2) {
      scoreDocumento = 0.6;
    }
  }
  detalhes.documento = scoreDocumento * criterios.pesoDocumento;

  // Score total
  const score = detalhes.valor + detalhes.data + detalhes.documento;

  return { score, detalhes };
}

/**
 * Calcula distância de Levenshtein para similaridade de strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Busca candidatos para conciliação
 */
export async function buscarCandidatos(
  userId: string,
  importado: {
    tipo: string;
    valor: number;
    data: string;
    documento?: string;
  },
  criterios: CriterioConciliacao
): Promise<
  {
    id: string;
    valor: number;
    data: string;
    documento?: string;
    descricao?: string;
  }[]
> {
  const dataInicio = new Date(importado.data);
  dataInicio.setDate(dataInicio.getDate() - criterios.toleranciaDias);

  const dataFim = new Date(importado.data);
  dataFim.setDate(dataFim.getDate() + criterios.toleranciaDias);

  const valorMin = importado.valor - criterios.toleranciaValor;
  const valorMax = importado.valor + criterios.toleranciaValor;

  let query;
  if (importado.tipo === "contas_pagar") {
    query = supabase
      .from("contas_pagar")
      .select("id, valor, data_vencimento, data_pagamento, documento, descricao")
      .eq("user_id", userId)
      .eq("status", "pago")
      .gte("valor", valorMin)
      .lte("valor", valorMax);
  } else if (importado.tipo === "contas_receber") {
    query = supabase
      .from("contas_receber")
      .select(
        "id, valor, data_vencimento, data_recebimento, documento, descricao"
      )
      .eq("user_id", userId)
      .eq("status", "recebido")
      .gte("valor", valorMin)
      .lte("valor", valorMax);
  } else {
    // Caixa/Extrato
    query = supabase
      .from("extrato_bancario")
      .select("id, valor, data_transacao, descricao")
      .eq("user_id", userId)
      .gte("valor", valorMin)
      .lte("valor", valorMax);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("Erro ao buscar candidatos:", error);
    return [];
  }

  // Filtrar por data
  return data.filter((c) => {
    const dataCandidato =
      c.data_pagamento || c.data_recebimento || c.data_vencimento || c.data_transacao;
    if (!dataCandidato) return false;

    const candidatoDate = new Date(dataCandidato);
    return candidatoDate >= dataInicio && candidatoDate <= dataFim;
  });
}

/**
 * Tenta conciliar lançamento importado automaticamente
 */
export async function tentarConciliacaoAutomatica(
  userId: string,
  lancamentoImportadoId: string,
  criterios: CriterioConciliacao = CRITERIOS_PADRAO
): Promise<ResultadoConciliacao> {
  try {
    // Buscar dados do lançamento importado
    const { data: importado, error } = await db
      .from("contabilidade_lancamentos_importados")
      .select("*")
      .eq("id", lancamentoImportadoId)
      .eq("user_id", userId)
      .single();

    if (error || !importado) {
      return {
        conciliado: false,
        erro: "Lançamento importado não encontrado",
      };
    }

    if (importado.status === "conciliado") {
      return {
        conciliado: true,
        lancamentoImportadoId,
        lancamentoLocalId: importado.lancamento_local_id,
      };
    }

    // Buscar candidatos
    const candidatos = await buscarCandidatos(
      userId,
      {
        tipo: importado.tipo,
        valor: importado.valor,
        data: importado.data,
        documento: importado.documento,
      },
      criterios
    );

    if (candidatos.length === 0) {
      // Nenhum candidato encontrado
      await db
        .from("contabilidade_lancamentos_importados")
        .update({
          status: "nao_encontrado",
          notas: "Nenhum lançamento local correspondente encontrado",
        })
        .eq("id", lancamentoImportadoId);

      return {
        conciliado: false,
        lancamentoImportadoId,
      };
    }

    // Calcular scores
    const matches: SugestaoMatch[] = candidatos.map((c) => {
      const dataCandidato =
        (c as any).data_pagamento ||
        (c as any).data_recebimento ||
        (c as any).data_vencimento ||
        (c as any).data_transacao ||
        c.data;

      const { score, detalhes } = calcularScore(
        {
          valor: importado.valor,
          data: importado.data,
          documento: importado.documento,
        },
        {
          valor: c.valor,
          data: dataCandidato,
          documento: c.documento,
        },
        criterios
      );

      return {
        lancamentoImportadoId,
        candidatoId: c.id,
        candidatoTipo: importado.tipo,
        score,
        motivo: `Valor: ${Math.round(detalhes.valor * 100)}%, Data: ${Math.round(
          detalhes.data * 100
        )}%, Documento: ${Math.round(detalhes.documento * 100)}%`,
      };
    });

    // Ordenar por score
    matches.sort((a, b) => b.score - a.score);

    // Verificar se há match definitivo (score >= 0.9)
    const melhorMatch = matches[0];

    if (melhorMatch.score >= 0.9) {
      // Match definitivo
      await db
        .from("contabilidade_lancamentos_importados")
        .update({
          status: "conciliado",
          lancamento_local_id: melhorMatch.candidatoId,
          conciliado_em: new Date().toISOString(),
          notas: `Match automático (score: ${Math.round(melhorMatch.score * 100)}%)`,
        })
        .eq("id", lancamentoImportadoId);

      return {
        conciliado: true,
        lancamentoImportadoId,
        lancamentoLocalId: melhorMatch.candidatoId,
      };
    }

    // Verificar se há múltiplos matches com score alto (>= 0.7)
    const matchesAltos = matches.filter((m) => m.score >= 0.7);

    if (matchesAltos.length > 1) {
      // Múltiplos matches - sugerir manual
      await db
        .from("contabilidade_lancamentos_importados")
        .update({
          status: "revisao_manual",
          notas: `Múltiplos candidatos encontrados (scores: ${matchesAltos
            .map((m) => Math.round(m.score * 100))
            .join("%, ")}%)`,
        })
        .eq("id", lancamentoImportadoId);

      return {
        conciliado: false,
        lancamentoImportadoId,
        multiplosMatches: true,
        sugestoes: matchesAltos,
      };
    }

    // Match único com score médio - sugerir manual
    await db
      .from("contabilidade_lancamentos_importados")
      .update({
        status: "revisao_manual",
        notas: `Candidato encontrado com score ${Math.round(
          melhorMatch.score * 100
        )}% - requer confirmação`,
      })
      .eq("id", lancamentoImportadoId);

    return {
      conciliado: false,
      lancamentoImportadoId,
      sugestoes: matches.slice(0, 3), // Top 3 sugestões
    };
  } catch (error: any) {
    return {
      conciliado: false,
      lancamentoImportadoId,
      erro: error.message,
    };
  }
}

/**
 * Concilia todos os lançamentos pendentes de um config
 */
export async function conciliarTodosPendentes(
  userId: string,
  configId: string,
  criterios: CriterioConciliacao = CRITERIOS_PADRAO
): Promise<{
  totalProcessado: number;
  conciliados: number;
  pendentes: number;
  sugeridosManual: number;
}> {
  // Buscar lançamentos pendentes
  const { data: pendentes, error } = await db
    .from("contabilidade_lancamentos_importados")
    .select("id")
    .eq("user_id", userId)
    .eq("config_id", configId)
    .eq("status", "pendente");

  if (error || !pendentes || pendentes.length === 0) {
    return {
      totalProcessado: 0,
      conciliados: 0,
      pendentes: 0,
      sugeridosManual: 0,
    };
  }

  let conciliados = 0;
  let sugeridosManual = 0;

  for (const pendente of pendentes) {
    const resultado = await tentarConciliacaoAutomatica(
      userId,
      pendente.id,
      criterios
    );

    if (resultado.conciliado) {
      conciliados++;
    } else if (resultado.multiplosMatches || resultado.sugestoes) {
      sugeridosManual++;
    }
  }

  return {
    totalProcessado: pendentes.length,
    conciliados,
    pendentes: pendentes.length - conciliados - sugeridosManual,
    sugeridosManual,
  };
}

/**
 * Gera relatório de divergências
 */
export async function gerarRelatorioDivergencias(
  userId: string,
  configId: string
): Promise<RelatorioDivergencias> {
  // Buscar todos os lançamentos importados
  const { data: importados, error } = await db
    .from("contabilidade_lancamentos_importados")
    .select("*")
    .eq("user_id", userId)
    .eq("config_id", configId);

  if (error || !importados) {
    return {
      totalPendente: 0,
      totalConciliado: 0,
      divergenciasValor: [],
      divergenciasData: [],
      naoEncontrados: [],
    };
  }

  const divergenciasValor: DivergenciaValor[] = [];
  const divergenciasData: DivergenciaData[] = [];
  const naoEncontrados: NaoEncontrado[] = [];

  for (const item of importados) {
    if (item.status === "conciliado" && item.lancamento_local_id) {
      // Buscar lançamento local conciliado
      let tabela = "contas_pagar";
      if (item.tipo === "contas_receber") tabela = "contas_receber";
      if (item.tipo === "caixa") tabela = "extrato_bancario";

      const { data: local } = await (supabase as any)
        .from(tabela)
        .select("*")
        .eq("id", item.lancamento_local_id)
        .single() as { data: any };

      if (local) {
        const valorLocal = local.valor;
        const diffValor = Math.abs(item.valor - valorLocal);

        if (diffValor > 0.01) {
          divergenciasValor.push({
            id: item.id,
            tipo: item.tipo,
            descricao: item.descricao,
            valorERP: item.valor,
            valorLocal,
            diferenca: diffValor,
          });
        }

        const dataLocal =
          local.data_pagamento ||
          local.data_recebimento ||
          local.data_vencimento ||
          local.data_transacao;

        if (dataLocal) {
          const dataERP = new Date(item.data);
          const dataLoc = new Date(dataLocal);
          const diffDias = Math.abs(
            (dataERP.getTime() - dataLoc.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (diffDias > 1) {
            divergenciasData.push({
              id: item.id,
              tipo: item.tipo,
              descricao: item.descricao,
              dataERP: item.data,
              dataLocal,
              diferencaDias: Math.round(diffDias),
            });
          }
        }
      }
    } else if (item.status === "nao_encontrado") {
      naoEncontrados.push({
        id: item.id,
        tipo: item.tipo,
        descricao: item.descricao,
        valor: item.valor,
        data: item.data,
      });
    }
  }

  return {
    totalPendente: importados.filter((i) => i.status === "pendente").length,
    totalConciliado: importados.filter((i) => i.status === "conciliado").length,
    divergenciasValor,
    divergenciasData,
    naoEncontrados,
  };
}

/**
 * Exporta relatório de divergências
 */
export function exportarRelatorioCSV(
  relatorio: RelatorioDivergencias
): string {
  const linhas: string[] = [];

  // Header
  linhas.push("Tipo,ID,Descrição,Valor ERP,Valor Local,Diferença,Data ERP,Data Local,Diferença Dias");

  // Divergências de valor
  for (const div of relatorio.divergenciasValor) {
    linhas.push(
      `Divergencia Valor,${div.id},${div.descricao},${div.valorERP},${div.valorLocal},${div.diferenca},,,`
    );
  }

  // Divergências de data
  for (const div of relatorio.divergenciasData) {
    linhas.push(
      `Divergencia Data,${div.id},${div.descricao},,,,${div.dataERP},${div.dataLocal},${div.diferencaDias}`
    );
  }

  // Não encontrados
  for (const nao of relatorio.naoEncontrados) {
    linhas.push(
      `Nao Encontrado,${nao.id},${nao.descricao},${nao.valor},,,${nao.data},,`
    );
  }

  return linhas.join("\n");
}

/**
 * Atualiza critérios de conciliação
 */
export async function atualizarCriterios(
  userId: string,
  configId: string,
  criterios: CriterioConciliacao
): Promise<{ success: boolean; erro?: string }> {
  try {
    const { error } = await db
      .from("contabilidade_integracoes")
      .update({
        criterios_conciliacao: criterios,
        updated_at: new Date().toISOString(),
      })
      .eq("id", configId)
      .eq("user_id", userId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return { success: false, erro: error.message };
  }
}

/**
 * Busca critérios de conciliação
 */
export async function buscarCriterios(
  userId: string,
  configId: string
): Promise<CriterioConciliacao> {
  const { data, error } = await db
    .from("contabilidade_integracoes")
    .select("criterios_conciliacao")
    .eq("id", configId)
    .eq("user_id", userId)
    .single();

  if (error || !data?.criterios_conciliacao) {
    return CRITERIOS_PADRAO;
  }

  return { ...CRITERIOS_PADRAO, ...data.criterios_conciliacao };
}
