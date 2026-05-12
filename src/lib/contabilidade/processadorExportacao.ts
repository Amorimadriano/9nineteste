/**
 * Processador de Exportação para ERP
 * Busca dados do Supabase, aplica mapeamento e envia para ERP
 */

import { supabase } from "@/integrations/supabase/client";

// Bypass typing for tables not present in generated types
const db: any = supabase;

export interface PeriodoExportacao {
  inicio: string;
  fim: string;
}

export interface ConfigExportacao {
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

export interface ResultadoProcessamento {
  total: number;
  exportados: number;
  erros: number;
  detalhesErros: DetalheErro[];
  mensagem: string;
}

export interface DetalheErro {
  registroId: string;
  tipo: string;
  erro: string;
  dados?: Record<string, any>;
}

export interface DadoExportacao {
  id: string;
  user_id: string;
  tipo: "contas_pagar" | "contas_receber" | "caixa";
  dados: Record<string, any>;
  mapeado: Record<string, any>;
}

const BATCH_SIZE = 100;

/**
 * Valida saldos antes da exportação
 */
export async function validarSaldos(
  userId: string,
  periodo: PeriodoExportacao
): Promise<{
  valido: boolean;
  mensagem: string;
  diferenca?: number;
}> {
  try {
    // Buscar total de contas a pagar no período
    const { data: totalPagar, error: errorPagar } = await supabase
      .from("contas_pagar")
      .select("valor")
      .eq("user_id", userId)
      .gte("data_vencimento", periodo.inicio)
      .lte("data_vencimento", periodo.fim);

    if (errorPagar) throw errorPagar;

    // Buscar total de contas a receber no período
    const { data: totalReceber, error: errorReceber } = await supabase
      .from("contas_receber")
      .select("valor")
      .eq("user_id", userId)
      .gte("data_vencimento", periodo.inicio)
      .lte("data_vencimento", periodo.fim);

    if (errorReceber) throw errorReceber;

    const somaPagar = (totalPagar || []).reduce((sum, c) => sum + (c.valor || 0), 0);
    const somaReceber = (totalReceber || []).reduce(
      (sum, c) => sum + (c.valor || 0),
      0
    );

    // Verificar se há valores negativos
    const valoresNegativos = [...(totalPagar || []), ...(totalReceber || [])].filter(
      (c) => c.valor < 0
    );

    if (valoresNegativos.length > 0) {
      return {
        valido: false,
        mensagem: `Existem ${valoresNegativos.length} registros com valores negativos`,
      };
    }

    // Verificar se saldos estão consistentes
    if (somaPagar < 0 || somaReceber < 0) {
      return {
        valido: false,
        mensagem: "Saldos inconsistentes detectados",
      };
    }

    return {
      valido: true,
      mensagem: "Saldos validados com sucesso",
    };
  } catch (error: any) {
    return {
      valido: false,
      mensagem: `Erro na validação de saldos: ${error.message}`,
    };
  }
}

/**
 * Busca configuração de integração
 */
export async function buscarConfiguracao(
  configId: string
): Promise<ConfigExportacao | null> {
  const { data, error } = await db
    .from("contabilidade_integracoes")
    .select("id, erp_tipo, mapeamento_contas, config_api")
    .eq("id", configId)
    .single();

  if (error || !data) {
    console.error("Erro ao buscar configuração:", error);
    return null;
  }

  return data as ConfigExportacao;
}

/**
 * Aplica mapeamento de contas
 */
export function aplicarMapeamento(
  dados: Record<string, any>,
  mapeamento: Record<string, string>,
  tipo: string
): Record<string, any> {
  const mapeado: Record<string, any> = { ...dados };

  // Mapear conta contábil
  if (dados.categoria_id && mapeamento[dados.categoria_id]) {
    mapeado.conta_contabil_erp = mapeamento[dados.categoria_id];
  }

  // Mapear cliente/fornecedor
  if (dados.entidade_id && mapeamento[`${tipo}_${dados.entidade_id}`]) {
    mapeado.entidade_erp = mapeamento[`${tipo}_${dados.entidade_id}`];
  }

  // Mapear centro de custo
  if (dados.centro_custo_id && mapeamento[`cc_${dados.centro_custo_id}`]) {
    mapeado.centro_custo_erp = mapeamento[`cc_${dados.centro_custo_id}`];
  }

  return mapeado;
}

/**
 * Transforma dados para formato do ERP específico
 */
export function transformarParaERP(
  dados: Record<string, any>,
  tipoERP: string,
  tipoRegistro: string
): Record<string, any> {
  const base: Record<string, any> = {
    externalId: dados.id,
    dataCriacao: dados.created_at,
    dataAtualizacao: dados.updated_at,
  };

  switch (tipoERP.toLowerCase()) {
    case "omie":
      return transformarOmie(dados, tipoRegistro, base);
    case "nibo":
      return transformarNibo(dados, tipoRegistro, base);
    case "contaazul":
      return transformarContaAzul(dados, tipoRegistro, base);
    case "tiny":
      return transformarTiny(dados, tipoRegistro, base);
    default:
      // Formato genérico
      return {
        ...base,
        ...dados,
      };
  }
}

function transformarOmie(
  dados: Record<string, any>,
  tipo: string,
  base: Record<string, any>
): Record<string, any> {
  if (tipo === "contas_pagar") {
    return {
      ...base,
      codigo_lancamento_integracao: dados.id,
      codigo_cliente_fornecedor: dados.entidade_erp || "1",
      data_vencimento: dados.data_vencimento?.replace(/-/g, "/"),
      valor_documento: dados.valor,
      numero_documento: dados.documento || dados.id,
      status_titulo: dados.status === "pago" ? "PAGO" : "ABERTO",
      codigo_categoria: dados.conta_contabil_erp || "1.01.01",
      observacao: dados.descricao,
    };
  }

  if (tipo === "contas_receber") {
    return {
      ...base,
      codigo_lancamento_integracao: dados.id,
      codigo_cliente_fornecedor: dados.entidade_erp || "1",
      data_vencimento: dados.data_vencimento?.replace(/-/g, "/"),
      valor_documento: dados.valor,
      numero_documento: dados.documento || dados.id,
      status_titulo: dados.status === "recebido" ? "RECEBIDO" : "ABERTO",
      codigo_categoria: dados.conta_contabil_erp || "1.01.01",
      observacao: dados.descricao,
    };
  }

  if (tipo === "caixa") {
    return {
      ...base,
      codigo_lancamento_integracao: dados.id,
      data: dados.data_transacao?.replace(/-/g, "/"),
      valor: dados.valor,
      tipo: dados.tipo === "entrada" ? "ENTRADA" : "SAIDA",
      codigo_categoria: dados.conta_contabil_erp || "1.01.01",
      observacao: dados.descricao,
    };
  }

  return { ...base, ...dados };
}

function transformarNibo(
  dados: Record<string, any>,
  tipo: string,
  base: Record<string, any>
): Record<string, any> {
  if (tipo === "contas_pagar" || tipo === "contas_receber") {
    return {
      ...base,
      externalId: dados.id,
      description: dados.descricao,
      amount: dados.valor,
      dueDate: dados.data_vencimento,
      documentNumber: dados.documento,
      categoryId: dados.conta_contabil_erp,
      entityId: dados.entidade_erp,
      status: dados.status === "pago" || dados.status === "recebido" ? "PAID" : "OPEN",
    };
  }

  return { ...base, ...dados };
}

function transformarContaAzul(
  dados: Record<string, any>,
  tipo: string,
  base: Record<string, any>
): Record<string, any> {
  return {
    ...base,
    externalId: dados.id,
    description: dados.descricao,
    value: dados.valor,
    dueDate: dados.data_vencimento || dados.data_transacao,
    documentNumber: dados.documento,
    category: {
      id: dados.conta_contabil_erp,
    },
    supplier: tipo === "contas_pagar" ? { id: dados.entidade_erp } : undefined,
    customer: tipo === "contas_receber" ? { id: dados.entidade_erp } : undefined,
  };
}

function transformarTiny(
  dados: Record<string, any>,
  tipo: string,
  base: Record<string, any>
): Record<string, any> {
  return {
    ...base,
    id_externo: dados.id,
    descricao: dados.descricao,
    valor: dados.valor,
    data_vencimento: dados.data_vencimento,
    numero_documento: dados.documento,
    id_categoria: dados.conta_contabil_erp,
    id_contato: dados.entidade_erp,
  };
}

/**
 * Busca contas a pagar para exportação
 */
export async function buscarContasPagar(
  userId: string,
  periodo: PeriodoExportacao
): Promise<any[]> {
  const { data, error } = await supabase
    .from("contas_pagar")
    .select(`
      *,
      fornecedores (id, nome, cnpj),
      categorias (id, nome, codigo_contabil)
    `)
    .eq("user_id", userId)
    .gte("data_vencimento", periodo.inicio)
    .lte("data_vencimento", periodo.fim)
    .order("data_vencimento");

  if (error) {
    console.error("Erro ao buscar contas a pagar:", error);
    return [];
  }

  return data || [];
}

/**
 * Busca contas a receber para exportação
 */
export async function buscarContasReceber(
  userId: string,
  periodo: PeriodoExportacao
): Promise<any[]> {
  const { data, error } = await supabase
    .from("contas_receber")
    .select(`
      *,
      clientes (id, nome, cnpj),
      categorias (id, nome, codigo_contabil)
    `)
    .eq("user_id", userId)
    .gte("data_vencimento", periodo.inicio)
    .lte("data_vencimento", periodo.fim)
    .order("data_vencimento");

  if (error) {
    console.error("Erro ao buscar contas a receber:", error);
    return [];
  }

  return data || [];
}

/**
 * Busca lançamentos de caixa para exportação
 */
export async function buscarLancamentosCaixa(
  userId: string,
  periodo: PeriodoExportacao
): Promise<any[]> {
  const { data, error } = await supabase
    .from("extrato_bancario")
    .select(`
      *,
      categorias (id, nome, codigo_contabil)
    `)
    .eq("user_id", userId)
    .gte("data_transacao", periodo.inicio)
    .lte("data_transacao", periodo.fim)
    .order("data_transacao");

  if (error) {
    console.error("Erro ao buscar lançamentos de caixa:", error);
    return [];
  }

  return data || [];
}

/**
 * Valida dados antes de enviar para ERP
 */
export function validarDados(
  dados: Record<string, any>,
  tipo: string
): { valido: boolean; erros: string[] } {
  const erros: string[] = [];

  if (!dados.id) {
    erros.push("ID é obrigatório");
  }

  if (!dados.valor || dados.valor <= 0) {
    erros.push("Valor deve ser positivo");
  }

  if (tipo === "contas_pagar" || tipo === "contas_receber") {
    if (!dados.data_vencimento) {
      erros.push("Data de vencimento é obrigatória");
    }
  }

  if (tipo === "caixa") {
    if (!dados.data_transacao) {
      erros.push("Data da transação é obrigatória");
    }
    if (!dados.tipo) {
      erros.push("Tipo (entrada/saída) é obrigatório");
    }
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}

/**
 * Envia registro para ERP
 */
export async function enviarParaERP(
  dados: Record<string, any>,
  config: ConfigExportacao
): Promise<{ success: boolean; erro?: string; resposta?: any }> {
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

    const response = await fetch(config_api.url, {
      method: "POST",
      headers,
      body: JSON.stringify(dados),
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

    const resposta = await response.json();
    return { success: true, resposta };
  } catch (error: any) {
    if (error.name === "AbortError") {
      return { success: false, erro: "Timeout ao conectar com ERP" };
    }
    return { success: false, erro: error.message };
  }
}

/**
 * Registra resultado da exportação
 */
export async function registrarExportacao(
  userId: string,
  configId: string,
  tipo: string,
  registroId: string,
  status: "sucesso" | "erro",
  detalhes?: Record<string, any>,
  erroMsg?: string
): Promise<void> {
  try {
    await db.from("contabilidade_exportacoes").insert({
      user_id: userId,
      config_id: configId,
      tipo,
      registro_id: registroId,
      status,
      detalhes,
      erro: erroMsg,
      exportado_em: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erro ao registrar exportação:", error);
  }
}

/**
 * Verifica se registro já foi exportado
 */
export async function verificarExportacaoExistente(
  configId: string,
  registroId: string
): Promise<boolean> {
  const { data, error } = await db
    .from("contabilidade_exportacoes")
    .select("id")
    .eq("config_id", configId)
    .eq("registro_id", registroId)
    .eq("status", "sucesso")
    .maybeSingle();

  if (error) {
    console.error("Erro ao verificar exportação:", error);
    return false;
  }

  return !!data;
}

/**
 * Processa exportação em lotes
 */
export async function processarExportacaoLote(
  userId: string,
  config: ConfigExportacao,
  tipo: "contas_pagar" | "contas_receber" | "caixa",
  periodo: PeriodoExportacao,
  onProgress?: (atual: number, total: number) => void
): Promise<ResultadoProcessamento> {
  const detalhesErros: DetalheErro[] = [];
  let exportados = 0;
  let total = 0;

  // Buscar dados conforme tipo
  let dados: any[] = [];
  switch (tipo) {
    case "contas_pagar":
      dados = await buscarContasPagar(userId, periodo);
      break;
    case "contas_receber":
      dados = await buscarContasReceber(userId, periodo);
      break;
    case "caixa":
      dados = await buscarLancamentosCaixa(userId, periodo);
      break;
  }

  total = dados.length;

  if (total === 0) {
    return {
      total: 0,
      exportados: 0,
      erros: 0,
      detalhesErros: [],
      mensagem: "Nenhum registro encontrado para exportação",
    };
  }

  // Processar em lotes
  for (let i = 0; i < dados.length; i += BATCH_SIZE) {
    const lote = dados.slice(i, i + BATCH_SIZE);

    for (const registro of lote) {
      try {
        // Verificar se já exportado
        const jaExportado = await verificarExportacaoExistente(config.id, registro.id);
        if (jaExportado) {
          exportados++;
          continue;
        }

        // Aplicar mapeamento
        const mapeado = aplicarMapeamento(
          registro,
          config.mapeamento_contas,
          tipo === "contas_pagar" ? "fornecedor" : "cliente"
        );

        // Validar dados
        const validacao = validarDados(mapeado, tipo);
        if (!validacao.valido) {
          detalhesErros.push({
            registroId: registro.id,
            tipo,
            erro: `Validação falhou: ${validacao.erros.join(", ")}`,
            dados: registro,
          });
          await registrarExportacao(
            userId,
            config.id,
            tipo,
            registro.id,
            "erro",
            registro,
            validacao.erros.join(", ")
          );
          continue;
        }

        // Transformar para formato ERP
        const transformado = transformarParaERP(mapeado, config.erp_tipo, tipo);

        // Enviar para ERP
        const resultado = await enviarParaERP(transformado, config);

        if (resultado.success) {
          exportados++;
          await registrarExportacao(userId, config.id, tipo, registro.id, "sucesso", {
            ...registro,
            resposta_erp: resultado.resposta,
          });
        } else {
          detalhesErros.push({
            registroId: registro.id,
            tipo,
            erro: resultado.erro || "Erro desconhecido",
            dados: registro,
          });
          await registrarExportacao(
            userId,
            config.id,
            tipo,
            registro.id,
            "erro",
            registro,
            resultado.erro
          );
        }
      } catch (error: any) {
        detalhesErros.push({
          registroId: registro.id,
          tipo,
          erro: error.message || "Erro desconhecido",
          dados: registro,
        });
        await registrarExportacao(
          userId,
          config.id,
          tipo,
          registro.id,
          "erro",
          registro,
          error.message
        );
      }
    }

    // Notificar progresso
    onProgress?.(Math.min(i + BATCH_SIZE, total), total);
  }

  return {
    total,
    exportados,
    erros: detalhesErros.length,
    detalhesErros,
    mensagem: `Exportados ${exportados} de ${total} registros${detalhesErros.length > 0 ? `, ${detalhesErros.length} erros` : ""}`,
  };
}

/**
 * Reprocessa apenas registros com erro
 */
export async function reprocessarErros(
  userId: string,
  config: ConfigExportacao,
  tipo: "contas_pagar" | "contas_receber" | "caixa"
): Promise<ResultadoProcessamento> {
  // Buscar registros com erro
  const { data: errosAnteriores, error } = await db
    .from("contabilidade_exportacoes")
    .select("registro_id, tipo, detalhes, erro")
    .eq("config_id", config.id)
    .eq("tipo", tipo)
    .eq("status", "erro");

  if (error || !errosAnteriores || errosAnteriores.length === 0) {
    return {
      total: 0,
      exportados: 0,
      erros: 0,
      detalhesErros: [],
      mensagem: "Nenhum registro com erro encontrado para reprocessamento",
    };
  }

  const detalhesErros: DetalheErro[] = [];
  let exportados = 0;

  for (const erroAnterior of errosAnteriores) {
    try {
      const registro = erroAnterior.detalhes;

      // Reaplicar mapeamento
      const mapeado = aplicarMapeamento(
        registro,
        config.mapeamento_contas,
        tipo === "contas_pagar" ? "fornecedor" : "cliente"
      );

      // Revalidar
      const validacao = validarDados(mapeado, tipo);
      if (!validacao.valido) {
        detalhesErros.push({
          registroId: registro.id,
          tipo,
          erro: `Ainda com erro: ${validacao.erros.join(", ")}`,
          dados: registro,
        });
        continue;
      }

      // Tentar enviar novamente
      const transformado = transformarParaERP(mapeado, config.erp_tipo, tipo);
      const resultado = await enviarParaERP(transformado, config);

      if (resultado.success) {
        exportados++;
        // Atualizar status
        await db
          .from("contabilidade_exportacoes")
          .update({
            status: "sucesso",
            erro: null,
            exportado_em: new Date().toISOString(),
          })
          .eq("config_id", config.id)
          .eq("registro_id", registro.id);
      } else {
        detalhesErros.push({
          registroId: registro.id,
          tipo,
          erro: `Reprocessamento falhou: ${resultado.erro}`,
          dados: registro,
        });
      }
    } catch (error: any) {
      detalhesErros.push({
        registroId: erroAnterior.registro_id,
        tipo,
        erro: error.message,
      });
    }
  }

  return {
    total: errosAnteriores.length,
    exportados,
    erros: detalhesErros.length,
    detalhesErros,
    mensagem: `Reprocessados ${exportados} de ${errosAnteriores.length} registros${detalhesErros.length > 0 ? `, ${detalhesErros.length} ainda com erro` : ""}`,
  };
}
