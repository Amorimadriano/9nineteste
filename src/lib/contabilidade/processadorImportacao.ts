/**
 * Processador de Importação de Dados Contábeis do ERP
 * Importa lançamentos, valida duplicidade e tenta conciliação automática
 */

import { supabase } from "@/integrations/supabase/client";

// Bypass typing for tables not present in generated types
const db: any = supabase;

export interface PeriodoImportacao {
  inicio: string;
  fim: string;
}

export interface ConfigImportacao {
  id: string;
  erp_tipo: string;
  mapeamento_contas: Record<string, string>;
  config_api: {
    url: string;
    token?: string;
    headers?: Record<string, string>;
    timeout?: number;
  };
}

export interface ResultadoImportacao {
  total: number;
  importados: number;
  duplicados: number;
  erros: number;
  conciliadosAuto: number;
  detalhesErros: DetalheErro[];
  mensagem: string;
}

export interface DetalheErro {
  registroId: string;
  tipo: string;
  erro: string;
  dados?: Record<string, any>;
}

export interface LancamentoERP {
  id_erp: string;
  tipo: "contas_pagar" | "contas_receber" | "caixa";
  data: string;
  valor: number;
  descricao: string;
  documento?: string;
  conta_contabil_erp: string;
  entidade_erp?: string;
  entidade_nome?: string;
  centro_custo_erp?: string;
  status: string;
  data_vencimento?: string;
  data_pagamento?: string;
  metadata?: Record<string, any>;
}

const BATCH_SIZE = 100;

/**
 * Cria backup antes da importação
 */
export async function criarBackup(
  userId: string,
  configId: string
): Promise<{ success: boolean; backupId?: string; erro?: string }> {
  try {
    const timestamp = new Date().toISOString();
    const backupId = `backup_${configId}_${Date.now()}`;

    // Buscar dados atuais para backup
    const [lancamentosImportados, exportacoes] = await Promise.all([
      db
        .from("contabilidade_lancamentos_importados")
        .select("*")
        .eq("user_id", userId)
        .eq("config_id", configId),
      db
        .from("contabilidade_exportacoes")
        .select("*")
        .eq("user_id", userId)
        .eq("config_id", configId),
    ]);

    // Inserir backup
    await db.from("contabilidade_backups").insert({
      id: backupId,
      user_id: userId,
      config_id: configId,
      backup_criado_em: timestamp,
      dados: {
        lancamentos_importados: lancamentosImportados.data || [],
        exportacoes: exportacoes.data || [],
      },
    });

    return { success: true, backupId };
  } catch (error: any) {
    return {
      success: false,
      erro: `Erro ao criar backup: ${error.message}`,
    };
  }
}

/**
 * Busca lançamentos do ERP via API
 */
export async function buscarLancamentosERP(
  config: ConfigImportacao,
  periodo: PeriodoImportacao
): Promise<{ success: boolean; dados?: LancamentoERP[]; erro?: string }> {
  try {
    const { config_api } = config;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...config_api.headers,
    };

    if (config_api.token) {
      headers["Authorization"] = `Bearer ${config_api.token}`;
    }

    const timeout = config_api.timeout || 30000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Construir URL com parâmetros de período
    const url = new URL(config_api.url);
    url.searchParams.append("data_inicio", periodo.inicio);
    url.searchParams.append("data_fim", periodo.fim);
    url.searchParams.append("tipo", "lancamentos");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        erro: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const dados = await response.json();

    // Transformar dados conforme tipo de ERP
    const lancamentos = transformarDadosERP(dados, config.erp_tipo);

    return { success: true, dados: lancamentos };
  } catch (error: any) {
    if (error.name === "AbortError") {
      return { success: false, erro: "Timeout ao conectar com ERP" };
    }
    return { success: false, erro: error.message };
  }
}

/**
 * Transforma dados do ERP para formato padrão
 */
function transformarDadosERP(dados: any[], tipoERP: string): LancamentoERP[] {
  switch (tipoERP.toLowerCase()) {
    case "omie":
      return transformarOmie(dados);
    case "nibo":
      return transformarNibo(dados);
    case "contaazul":
      return transformarContaAzul(dados);
    case "tiny":
      return transformarTiny(dados);
    default:
      return dados as LancamentoERP[];
  }
}

function transformarOmie(dados: any[]): LancamentoERP[] {
  return dados.map((item) => ({
    id_erp: item.codigo_lancamento?.toString() || item.codigo_lancamento_integracao,
    tipo: item.codigo_cliente_fornecedor
      ? "contas_pagar"
      : "caixa",
    data: item.data_vencimento
      ? item.data_vencimento.replace(/\//g, "-")
      : item.data?.replace(/\//g, "-"),
    valor: parseFloat(item.valor_documento || item.valor || 0),
    descricao: item.observacao || item.descricao || "",
    documento: item.numero_documento,
    conta_contabil_erp: item.codigo_categoria || "",
    entidade_erp: item.codigo_cliente_fornecedor?.toString(),
    entidade_nome: item.nome_cliente_fornecedor,
    status: item.status_titulo || "ABERTO",
    data_vencimento: item.data_vencimento?.replace(/\//g, "-"),
    data_pagamento: item.data_pagamento?.replace(/\//g, "-"),
    metadata: item,
  }));
}

function transformarNibo(dados: any[]): LancamentoERP[] {
  return dados.map((item) => ({
    id_erp: item.id?.toString(),
    tipo: item.amount >= 0 ? "contas_receber" : "contas_pagar",
    data: item.dueDate,
    valor: Math.abs(parseFloat(item.amount || 0)),
    descricao: item.description || "",
    documento: item.documentNumber,
    conta_contabil_erp: item.categoryId || "",
    entidade_erp: item.entityId,
    entidade_nome: item.entityName,
    status: item.status || "OPEN",
    data_vencimento: item.dueDate,
    metadata: item,
  }));
}

function transformarContaAzul(dados: any[]): LancamentoERP[] {
  return dados.map((item) => ({
    id_erp: item.id?.toString(),
    tipo: item.supplier ? "contas_pagar" : "contas_receber",
    data: item.dueDate,
    valor: parseFloat(item.value || 0),
    descricao: item.description || "",
    documento: item.documentNumber,
    conta_contabil_erp: item.category?.id || "",
    entidade_erp: item.supplier?.id || item.customer?.id,
    entidade_nome: item.supplier?.name || item.customer?.name,
    status: item.status || "OPEN",
    data_vencimento: item.dueDate,
    metadata: item,
  }));
}

function transformarTiny(dados: any[]): LancamentoERP[] {
  return dados.map((item) => ({
    id_erp: item.id?.toString() || item.id_externo,
    tipo: item.tipo?.toLowerCase().includes("pagar")
      ? "contas_pagar"
      : "contas_receber",
    data: item.data_vencimento,
    valor: parseFloat(item.valor || 0),
    descricao: item.descricao || "",
    documento: item.numero_documento,
    conta_contabil_erp: item.id_categoria?.toString() || "",
    entidade_erp: item.id_contato?.toString(),
    status: item.situacao || "ABERTO",
    data_vencimento: item.data_vencimento,
    metadata: item,
  }));
}

/**
 * Verifica duplicidade por ID do ERP
 */
export async function verificarDuplicidade(
  userId: string,
  idERP: string,
  tipo: string
): Promise<boolean> {
  const { data, error } = await db
    .from("contabilidade_lancamentos_importados")
    .select("id")
    .eq("user_id", userId)
    .eq("id_erp", idERP)
    .eq("tipo", tipo)
    .maybeSingle();

  if (error) {
    console.error("Erro ao verificar duplicidade:", error);
    return false;
  }

  return !!data;
}

/**
 * Aplica mapeamento reverso de contas
 */
export function aplicarMapeamentoReverso(
  lancamento: LancamentoERP,
  mapeamento: Record<string, string>
): { categoriaId?: string; entidadeId?: string } {
  const resultado: { categoriaId?: string; entidadeId?: string } = {};

  // Inverter mapeamento para busca
  const mapeamentoInvertido: Record<string, string> = {};
  for (const [key, value] of Object.entries(mapeamento)) {
    mapeamentoInvertido[value] = key;
  }

  // Buscar categoria
  if (lancamento.conta_contabil_erp) {
    resultado.categoriaId = mapeamentoInvertido[lancamento.conta_contabil_erp];
  }

  // Buscar entidade
  if (lancamento.entidade_erp) {
    const entidadeKey = `${lancamento.tipo === "contas_pagar" ? "fornecedor" : "cliente"}_${lancamento.entidade_erp}`;
    const entidadeLocal = mapeamentoInvertido[entidadeKey];
    if (entidadeLocal) {
      resultado.entidadeId = entidadeLocal.replace(/^(fornecedor|cliente)_/, "");
    }
  }

  return resultado;
}

/**
 * Cria registro de lançamento importado
 */
export async function criarLancamentoImportado(
  userId: string,
  configId: string,
  lancamento: LancamentoERP,
  mapeamentoReverso: { categoriaId?: string; entidadeId?: string }
): Promise<{ success: boolean; id?: string; erro?: string }> {
  try {
    const { data, error } = await db
      .from("contabilidade_lancamentos_importados")
      .insert({
        user_id: userId,
        config_id: configId,
        id_erp: lancamento.id_erp,
        tipo: lancamento.tipo,
        data: lancamento.data,
        valor: lancamento.valor,
        descricao: lancamento.descricao,
        documento: lancamento.documento,
        conta_contabil_erp: lancamento.conta_contabil_erp,
        entidade_erp: lancamento.entidade_erp,
        entidade_nome: lancamento.entidade_nome,
        categoria_local_id: mapeamentoReverso.categoriaId,
        entidade_local_id: mapeamentoReverso.entidadeId,
        status: "pendente",
        metadata: lancamento.metadata,
        importado_em: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) throw error;

    return { success: true, id: data.id };
  } catch (error: any) {
    return {
      success: false,
      erro: error.message,
    };
  }
}

/**
 * Tenta conciliar lançamento importado automaticamente
 */
export async function tentarConciliacaoAutomatica(
  userId: string,
  lancamento: LancamentoERP,
  lancamentoImportadoId: string
): Promise<{
  conciliado: boolean;
  matchId?: string;
  matchTipo?: string;
  multiplosMatches?: boolean;
}> {
  try {
    const toleranciaValor = 0.01;
    const toleranciaDias = 1;

    const dataInicio = new Date(lancamento.data);
    dataInicio.setDate(dataInicio.getDate() - toleranciaDias);

    const dataFim = new Date(lancamento.data);
    dataFim.setDate(dataFim.getDate() + toleranciaDias);

    // Buscar lançamentos financeiros compatíveis
    let query;
    if (lancamento.tipo === "contas_pagar") {
      query = supabase
        .from("contas_pagar")
        .select("id, valor, data_vencimento, data_pagamento, documento, status")
        .eq("user_id", userId)
        .eq("status", "pago");
    } else if (lancamento.tipo === "contas_receber") {
      query = supabase
        .from("contas_receber")
        .select("id, valor, data_vencimento, data_recebimento, documento, status")
        .eq("user_id", userId)
        .eq("status", "recebido");
    } else {
      query = supabase
        .from("extrato_bancario")
        .select("id, valor, data_transacao, descricao")
        .eq("user_id", userId);
    }

    const { data: candidatos, error } = await query;

    if (error || !candidatos || candidatos.length === 0) {
      return { conciliado: false };
    }

    // Filtrar por valor e data
    const matches = candidatos.filter((c) => {
      const valorMatch =
        Math.abs(c.valor - lancamento.valor) <= toleranciaValor;

      const dataCandidato =
        c.data_pagamento || c.data_recebimento || c.data_vencimento || c.data_transacao;
      const candidatoDate = new Date(dataCandidato);
      const lancamentoDate = new Date(lancamento.data);
      const diffDias = Math.abs(
        (candidatoDate.getTime() - lancamentoDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const dataMatch = diffDias <= toleranciaDias;

      // Verificar documento se disponível
      const documentoMatch =
        lancamento.documento && c.documento
          ? c.documento.includes(lancamento.documento) ||
            lancamento.documento.includes(c.documento)
          : true;

      return valorMatch && dataMatch && documentoMatch;
    });

    if (matches.length === 0) {
      return { conciliado: false };
    }

    if (matches.length > 1) {
      // Múltiplos matches - sugerir manual
      return {
        conciliado: false,
        multiplosMatches: true,
      };
    }

    // Match único - conciliar
    const match = matches[0];

    await db
      .from("contabilidade_lancamentos_importados")
      .update({
        status: "conciliado",
        lancamento_local_id: match.id,
        conciliado_em: new Date().toISOString(),
      })
      .eq("id", lancamentoImportadoId);

    return {
      conciliado: true,
      matchId: match.id,
      matchTipo: lancamento.tipo,
    };
  } catch (error) {
    console.error("Erro na conciliação automática:", error);
    return { conciliado: false };
  }
}

/**
 * Processa importação de lançamentos
 */
export async function processarImportacao(
  userId: string,
  config: ConfigImportacao,
  periodo: PeriodoImportacao,
  onProgress?: (atual: number, total: number) => void
): Promise<ResultadoImportacao> {
  const detalhesErros: DetalheErro[] = [];
  let importados = 0;
  let duplicados = 0;
  let conciliadosAuto = 0;

  // Criar backup
  const backup = await criarBackup(userId, config.id);
  if (!backup.success) {
    console.warn("Não foi possível criar backup:", backup.erro);
  }

  // Buscar lançamentos do ERP
  const resultadoBusca = await buscarLancamentosERP(config, periodo);
  if (!resultadoBusca.success) {
    return {
      total: 0,
      importados: 0,
      duplicados: 0,
      erros: 1,
      conciliadosAuto: 0,
      detalhesErros: [
        { registroId: "", tipo: "geral", erro: resultadoBusca.erro || "Erro ao buscar dados" },
      ],
      mensagem: resultadoBusca.erro || "Erro ao buscar dados do ERP",
    };
  }

  const lancamentos = resultadoBusca.dados || [];
  const total = lancamentos.length;

  if (total === 0) {
    return {
      total: 0,
      importados: 0,
      duplicados: 0,
      erros: 0,
      conciliadosAuto: 0,
      detalhesErros: [],
      mensagem: "Nenhum lançamento encontrado no período",
    };
  }

  // Processar em lotes
  for (let i = 0; i < lancamentos.length; i += BATCH_SIZE) {
    const lote = lancamentos.slice(i, i + BATCH_SIZE);

    for (const lancamento of lote) {
      try {
        // Verificar duplicidade
        const duplicado = await verificarDuplicidade(userId, lancamento.id_erp, lancamento.tipo);
        if (duplicado) {
          duplicados++;
          continue;
        }

        // Aplicar mapeamento reverso
        const mapeamentoReverso = aplicarMapeamentoReverso(lancamento, config.mapeamento_contas);

        // Criar registro importado
        const resultadoCriacao = await criarLancamentoImportado(
          userId,
          config.id,
          lancamento,
          mapeamentoReverso
        );

        if (!resultadoCriacao.success) {
          detalhesErros.push({
            registroId: lancamento.id_erp,
            tipo: lancamento.tipo,
            erro: resultadoCriacao.erro || "Erro ao criar registro",
            dados: lancamento,
          });
          continue;
        }

        importados++;

        // Tentar conciliação automática
        const resultadoConciliacao = await tentarConciliacaoAutomatica(
          userId,
          lancamento,
          resultadoCriacao.id!
        );

        if (resultadoConciliacao.conciliado) {
          conciliadosAuto++;
        } else if (resultadoConciliacao.multiplosMatches) {
          // Marcar para revisão manual
          await db
            .from("contabilidade_lancamentos_importados")
            .update({
              status: "revisao_manual",
              notas: "Múltiplos matches encontrados",
            })
            .eq("id", resultadoCriacao.id);
        }
      } catch (error: any) {
        detalhesErros.push({
          registroId: lancamento.id_erp,
          tipo: lancamento.tipo,
          erro: error.message,
          dados: lancamento,
        });
      }
    }

    onProgress?.(Math.min(i + BATCH_SIZE, total), total);
  }

  return {
    total,
    importados,
    duplicados,
    erros: detalhesErros.length,
    conciliadosAuto,
    detalhesErros,
    mensagem: `Importados ${importados} de ${total} lançamentos, ${conciliadosAuto} conciliados automaticamente, ${duplicados} duplicados ignorados${detalhesErros.length > 0 ? `, ${detalhesErros.length} erros` : ""}`,
  };
}

/**
 * Busca lançamentos pendentes de revisão manual
 */
export async function buscarLancamentosPendentesRevisao(
  userId: string,
  configId?: string
): Promise<any[]> {
  let query = db
    .from("contabilidade_lancamentos_importados")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "revisao_manual");

  if (configId) {
    query = query.eq("config_id", configId);
  }

  const { data, error } = await query.order("importado_em", { ascending: false });

  if (error) {
    console.error("Erro ao buscar lançamentos pendentes:", error);
    return [];
  }

  return data || [];
}

/**
 * Vincula lançamento manualmente
 */
export async function vincularLancamentoManual(
  lancamentoImportadoId: string,
  lancamentoLocalId: string,
  notas?: string
): Promise<{ success: boolean; erro?: string }> {
  try {
    const { error } = await db
      .from("contabilidade_lancamentos_importados")
      .update({
        status: "conciliado",
        lancamento_local_id: lancamentoLocalId,
        notas: notas || "Vinculação manual",
        conciliado_em: new Date().toISOString(),
      })
      .eq("id", lancamentoImportadoId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      erro: error.message,
    };
  }
}

/**
 * Ignora lançamento importado (não vincular)
 */
export async function ignorarLancamento(
  lancamentoImportadoId: string,
  motivo?: string
): Promise<{ success: boolean; erro?: string }> {
  try {
    const { error } = await db
      .from("contabilidade_lancamentos_importados")
      .update({
        status: "ignorado",
        notas: motivo || "Ignorado pelo usuário",
      })
      .eq("id", lancamentoImportadoId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      erro: error.message,
    };
  }
}
