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

/**
 * Edge Function: Sincronização Contábil
 * Execução server-side para exportação/importação de dados com ERPs
 *
 * Ações suportadas:
 * - exportar: Exporta contas a pagar/receber/caixa
 * - importar: Importa lançamentos do ERP
 * - conciliar: Tenta conciliação automática
 * - completo: Executa todas as operações
 * - reprocessar: Reprocessa apenas erros
 * - batch: Processamento em lote
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


// Rate limiting por ERP
const rateLimitStore: Record<string, { count: number; resetTime: number }> = {};

const RATE_LIMIT = {
  omie: { requests: 100, window: 60000 }, // 100 req/min
  nibo: { requests: 120, window: 60000 }, // 120 req/min
  contaazul: { requests: 60, window: 60000 }, // 60 req/min
  tiny: { requests: 80, window: 60000 }, // 80 req/min
  default: { requests: 60, window: 60000 }, // 60 req/min padrão
};

interface SyncRequest {
  action: "exportar" | "importar" | "conciliar" | "completo" | "reprocessar" | "batch";
  configId: string;
  userId: string;
  tipo?: "contas_pagar" | "contas_receber" | "caixa" | "todos";
  periodo?: { inicio: string; fim: string };
  agendado?: boolean;
}

interface ConfigERP {
  id: string;
  erp_tipo: string;
  ativo: boolean;
  mapeamento_contas: Record<string, string>;
  config_api: {
    url: string;
    token?: string;
    headers?: Record<string, string>;
    timeout?: number;
  };
  sync_config?: {
    frequencia: string;
    horario: string;
    ativo: boolean;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    const corsHeaders = getCorsHeaders(req);
  return new Response(null, { headers: corsHeaders });
  }

  // Log de início
  console.log(`[${new Date().toISOString()}] Iniciando sync-contabilidade`);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Criar cliente com autenticação do usuário
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verificar usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Parse do body
    const body: SyncRequest = await req.json();
    const { action, configId, userId, tipo, periodo, agendado } = body;

    if (!configId || !userId) {
      throw new Error("Missing required parameters: configId and userId");
    }

    // Verificar se userId corresponde ao usuário autenticado
    if (userId !== user.id) {
      throw new Error("User ID mismatch");
    }

    // Criar cliente admin para operações sem RLS
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Buscar configuração do ERP
    const { data: config, error: configError } = await supabaseAdmin
      .from("contabilidade_integracoes")
      .select("*")
      .eq("id", configId)
      .eq("user_id", userId)
      .single();

    if (configError || !config) {
      throw new Error("Configuração de integração não encontrada");
    }

    if (!config.ativo) {
      throw new Error("Integração está inativa");
    }

    const configERP = config as ConfigERP;

    // Verificar rate limit
    const rateLimitResult = checkRateLimit(configERP.erp_tipo);
    if (!rateLimitResult.allowed) {
      throw new Error(
        `Rate limit excedido. Tente novamente em ${rateLimitResult.retryAfter} segundos.`
      );
    }

    // Executar ação solicitada
    let resultado: any;

    switch (action) {
      case "exportar":
        resultado = await executarExportacao(
          supabaseAdmin,
          userId,
          configERP,
          tipo || "todos",
          periodo
        );
        break;

      case "importar":
        resultado = await executarImportacao(
          supabaseAdmin,
          userId,
          configERP,
          periodo
        );
        break;

      case "conciliar":
        resultado = await executarConciliacao(
          supabaseAdmin,
          userId,
          configERP
        );
        break;

      case "completo":
        resultado = await executarCompleto(
          supabaseAdmin,
          userId,
          configERP,
          periodo
        );
        break;

      case "reprocessar":
        resultado = await reprocessarErros(
          supabaseAdmin,
          userId,
          configERP,
          tipo || "todos"
        );
        break;

      case "batch":
        resultado = await executarBatch(
          supabaseAdmin,
          userId,
          configERP,
          body
        );
        break;

      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }

    // Registrar log de sincronização
    await registrarLog(supabaseAdmin, configId, userId, action, "sucesso", resultado, agendado);

    console.log(`[${new Date().toISOString()}] Sync concluído com sucesso`);

    return new Response(JSON.stringify({ success: true, ...resultado }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erro na sincronização:`, error);

    // Registrar erro
    try {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      const body = await req.clone().json();
      await registrarLog(
        supabaseAdmin,
        body.configId,
        body.userId,
        body.action,
        "erro",
        { error: (error as Error).message },
        body.agendado
      );
    } catch {
      // Ignorar erro ao registrar log
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Verifica rate limit por ERP
 */
function checkRateLimit(erpTipo: string): { allowed: boolean; retryAfter?: number } {
  const limit = RATE_LIMIT[erpTipo.toLowerCase() as keyof typeof RATE_LIMIT] || RATE_LIMIT.default;
  const now = Date.now();
  const key = erpTipo.toLowerCase();

  if (!rateLimitStore[key]) {
    rateLimitStore[key] = { count: 1, resetTime: now + limit.window };
    return { allowed: true };
  }

  const entry = rateLimitStore[key];

  if (now > entry.resetTime) {
    // Reset window
    rateLimitStore[key] = { count: 1, resetTime: now + limit.window };
    return { allowed: true };
  }

  if (entry.count >= limit.requests) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  entry.count++;
  return { allowed: true };
}

/**
 * Executa exportação de dados
 */
async function executarExportacao(
  supabase: any,
  userId: string,
  config: ConfigERP,
  tipo: string,
  periodo?: { inicio: string; fim: string }
): Promise<any> {
  const resultados: any = {};
  const detalhesErros: any[] = [];

  const periodoPadrao = periodo || {
    inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    fim: new Date().toISOString().split("T")[0],
  };

  // Validar saldos antes de exportar
  const validacao = await validarSaldos(supabase, userId, periodoPadrao);
  if (!validacao.valido) {
    throw new Error(`Validação de saldos falhou: ${validacao.mensagem}`);
  }

  // Exportar conforme tipo
  if (tipo === "contas_pagar" || tipo === "todos") {
    resultados.contas_pagar = await exportarContasPagar(
      supabase,
      userId,
      config,
      periodoPadrao,
      detalhesErros
    );
  }

  if (tipo === "contas_receber" || tipo === "todos") {
    resultados.contas_receber = await exportarContasReceber(
      supabase,
      userId,
      config,
      periodoPadrao,
      detalhesErros
    );
  }

  if (tipo === "caixa" || tipo === "todos") {
    resultados.caixa = await exportarCaixa(
      supabase,
      userId,
      config,
      periodoPadrao,
      detalhesErros
    );
  }

  // Calcular totais
  const total = Object.values(resultados).reduce(
    (sum: number, r: any) => sum + (r?.total || 0),
    0
  );
  const exportados = Object.values(resultados).reduce(
    (sum: number, r: any) => sum + (r?.exportados || 0),
    0
  );

  return {
    total,
    exportados,
    erros: detalhesErros.length,
    detalhesErros,
    mensagem: `Exportados ${exportados} de ${total} registros`,
    resultados,
  };
}

/**
 * Exporta contas a pagar
 */
async function exportarContasPagar(
  supabase: any,
  userId: string,
  config: ConfigERP,
  periodo: { inicio: string; fim: string },
  detalhesErros: any[]
): Promise<{ total: number; exportados: number }> {
  // Buscar contas a pagar
  const { data: contas } = await supabase
    .from("contas_pagar")
    .select("*")
    .eq("user_id", userId)
    .gte("data_vencimento", periodo.inicio)
    .lte("data_vencimento", periodo.fim);

  if (!contas || contas.length === 0) {
    return { total: 0, exportados: 0 };
  }

  let exportados = 0;

  for (const conta of contas) {
    try {
      // Verificar se já exportado
      const { data: existente } = await supabase
        .from("contabilidade_exportacoes")
        .select("id")
        .eq("config_id", config.id)
        .eq("registro_id", conta.id)
        .eq("tipo", "contas_pagar")
        .eq("status", "sucesso")
        .maybeSingle();

      if (existente) {
        exportados++;
        continue;
      }

      // Transformar dados para ERP
      const dadosERP = transformarParaERP(conta, config.erp_tipo, "contas_pagar");

      // Validar
      if (!dadosERP.valor || dadosERP.valor <= 0) {
        throw new Error("Valor inválido");
      }

      // Simular envio para ERP (em produção, seria uma chamada real)
      const sucesso = await simularEnvioERP(config, dadosERP);

      // Registrar exportação
      await supabase.from("contabilidade_exportacoes").insert({
        user_id: userId,
        config_id: config.id,
        tipo: "contas_pagar",
        registro_id: conta.id,
        status: sucesso ? "sucesso" : "erro",
        detalhes: dadosERP,
        erro: sucesso ? null : "Falha no envio para ERP",
        exportado_em: new Date().toISOString(),
      });

      if (sucesso) {
        exportados++;
      } else {
        detalhesErros.push({
          registroId: conta.id,
          tipo: "contas_pagar",
          erro: "Falha no envio para ERP",
        });
      }
    } catch (error: any) {
      detalhesErros.push({
        registroId: conta.id,
        tipo: "contas_pagar",
        erro: error.message,
      });
    }
  }

  return { total: contas.length, exportados };
}

/**
 * Exporta contas a receber
 */
async function exportarContasReceber(
  supabase: any,
  userId: string,
  config: ConfigERP,
  periodo: { inicio: string; fim: string },
  detalhesErros: any[]
): Promise<{ total: number; exportados: number }> {
  const { data: contas } = await supabase
    .from("contas_receber")
    .select("*")
    .eq("user_id", userId)
    .gte("data_vencimento", periodo.inicio)
    .lte("data_vencimento", periodo.fim);

  if (!contas || contas.length === 0) {
    return { total: 0, exportados: 0 };
  }

  let exportados = 0;

  for (const conta of contas) {
    try {
      const { data: existente } = await supabase
        .from("contabilidade_exportacoes")
        .select("id")
        .eq("config_id", config.id)
        .eq("registro_id", conta.id)
        .eq("tipo", "contas_receber")
        .eq("status", "sucesso")
        .maybeSingle();

      if (existente) {
        exportados++;
        continue;
      }

      const dadosERP = transformarParaERP(conta, config.erp_tipo, "contas_receber");

      if (!dadosERP.valor || dadosERP.valor <= 0) {
        throw new Error("Valor inválido");
      }

      const sucesso = await simularEnvioERP(config, dadosERP);

      await supabase.from("contabilidade_exportacoes").insert({
        user_id: userId,
        config_id: config.id,
        tipo: "contas_receber",
        registro_id: conta.id,
        status: sucesso ? "sucesso" : "erro",
        detalhes: dadosERP,
        erro: sucesso ? null : "Falha no envio para ERP",
        exportado_em: new Date().toISOString(),
      });

      if (sucesso) {
        exportados++;
      } else {
        detalhesErros.push({
          registroId: conta.id,
          tipo: "contas_receber",
          erro: "Falha no envio para ERP",
        });
      }
    } catch (error: any) {
      detalhesErros.push({
        registroId: conta.id,
        tipo: "contas_receber",
        erro: error.message,
      });
    }
  }

  return { total: contas.length, exportados };
}

/**
 * Exporta lançamentos de caixa
 */
async function exportarCaixa(
  supabase: any,
  userId: string,
  config: ConfigERP,
  periodo: { inicio: string; fim: string },
  detalhesErros: any[]
): Promise<{ total: number; exportados: number }> {
  const { data: lancamentos } = await supabase
    .from("extrato_bancario")
    .select("*")
    .eq("user_id", userId)
    .gte("data_transacao", periodo.inicio)
    .lte("data_transacao", periodo.fim);

  if (!lancamentos || lancamentos.length === 0) {
    return { total: 0, exportados: 0 };
  }

  let exportados = 0;

  for (const lancamento of lancamentos) {
    try {
      const { data: existente } = await supabase
        .from("contabilidade_exportacoes")
        .select("id")
        .eq("config_id", config.id)
        .eq("registro_id", lancamento.id)
        .eq("tipo", "caixa")
        .eq("status", "sucesso")
        .maybeSingle();

      if (existente) {
        exportados++;
        continue;
      }

      const dadosERP = transformarParaERP(lancamento, config.erp_tipo, "caixa");

      if (!dadosERP.valor || dadosERP.valor <= 0) {
        throw new Error("Valor inválido");
      }

      const sucesso = await simularEnvioERP(config, dadosERP);

      await supabase.from("contabilidade_exportacoes").insert({
        user_id: userId,
        config_id: config.id,
        tipo: "caixa",
        registro_id: lancamento.id,
        status: sucesso ? "sucesso" : "erro",
        detalhes: dadosERP,
        erro: sucesso ? null : "Falha no envio para ERP",
        exportado_em: new Date().toISOString(),
      });

      if (sucesso) {
        exportados++;
      } else {
        detalhesErros.push({
          registroId: lancamento.id,
          tipo: "caixa",
          erro: "Falha no envio para ERP",
        });
      }
    } catch (error: any) {
      detalhesErros.push({
        registroId: lancamento.id,
        tipo: "caixa",
        erro: error.message,
      });
    }
  }

  return { total: lancamentos.length, exportados };
}

/**
 * Executa importação de dados
 */
async function executarImportacao(
  supabase: any,
  userId: string,
  config: ConfigERP,
  periodo?: { inicio: string; fim: string }
): Promise<any> {
  const periodoPadrao = periodo || {
    inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    fim: new Date().toISOString().split("T")[0],
  };

  // Criar backup
  await criarBackup(supabase, userId, config.id);

  // Simular busca de lançamentos do ERP
  const lancamentos = await simularBuscaERP(config, periodoPadrao);

  let importados = 0;
  let duplicados = 0;
  let conciliadosAuto = 0;
  const detalhesErros: any[] = [];

  for (const lancamento of lancamentos) {
    try {
      // Verificar duplicidade
      const { data: existente } = await supabase
        .from("contabilidade_lancamentos_importados")
        .select("id")
        .eq("user_id", userId)
        .eq("id_erp", lancamento.id_erp)
        .eq("tipo", lancamento.tipo)
        .maybeSingle();

      if (existente) {
        duplicados++;
        continue;
      }

      // Inserir lançamento importado
      const { data: novo } = await supabase
        .from("contabilidade_lancamentos_importados")
        .insert({
          user_id: userId,
          config_id: config.id,
          ...lancamento,
          status: "pendente",
          importado_em: new Date().toISOString(),
        })
        .select("id")
        .single();

      importados++;

      // Tentar conciliação automática
      const conciliacao = await tentarConciliacao(supabase, userId, novo.id, lancamento);
      if (conciliacao) {
        conciliadosAuto++;
      }
    } catch (error: any) {
      detalhesErros.push({
        registroId: lancamento.id_erp,
        tipo: lancamento.tipo,
        erro: error.message,
      });
    }
  }

  return {
    total: lancamentos.length,
    importados,
    duplicados,
    erros: detalhesErros.length,
    conciliadosAuto,
    detalhesErros,
    mensagem: `Importados ${importados} de ${lancamentos.length} lançamentos, ${conciliadosAuto} conciliados`,
  };
}

/**
 * Tenta conciliação automática
 */
async function tentarConciliacao(
  supabase: any,
  userId: string,
  lancamentoImportadoId: string,
  lancamento: any
): Promise<boolean> {
  try {
    const toleranciaDias = 1;
    const toleranciaValor = 0.01;

    const dataInicio = new Date(lancamento.data);
    dataInicio.setDate(dataInicio.getDate() - toleranciaDias);

    const dataFim = new Date(lancamento.data);
    dataFim.setDate(dataFim.getDate() + toleranciaDias);

    let tabela = "contas_pagar";
    let statusCampo = "status";
    let statusValor = "pago";

    if (lancamento.tipo === "contas_receber") {
      tabela = "contas_receber";
      statusValor = "recebido";
    } else if (lancamento.tipo === "caixa") {
      tabela = "extrato_bancario";
      statusCampo = "";
    }

    let query = supabase
      .from(tabela)
      .select("id, valor, data_vencimento, data_pagamento, data_recebimento, data_transacao, documento")
      .eq("user_id", userId)
      .gte("valor", lancamento.valor - toleranciaValor)
      .lte("valor", lancamento.valor + toleranciaValor);

    if (statusCampo) {
      query = query.eq(statusCampo, statusValor);
    }

    const { data: candidatos } = await query;

    if (!candidatos || candidatos.length === 0) {
      return false;
    }

    // Verificar data
    const matches = candidatos.filter((c: any) => {
      const dataCandidato =
        c.data_pagamento || c.data_recebimento || c.data_vencimento || c.data_transacao;
      if (!dataCandidato) return false;

      const candidatoDate = new Date(dataCandidato);
      const importadoDate = new Date(lancamento.data);
      const diffDias = Math.abs(
        (candidatoDate.getTime() - importadoDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      return diffDias <= toleranciaDias;
    });

    if (matches.length !== 1) {
      return false;
    }

    // Conciliar
    await supabase
      .from("contabilidade_lancamentos_importados")
      .update({
        status: "conciliado",
        lancamento_local_id: matches[0].id,
        conciliado_em: new Date().toISOString(),
      })
      .eq("id", lancamentoImportadoId);

    return true;
  } catch {
    return false;
  }
}

/**
 * Executa conciliação de todos os pendentes
 */
async function executarConciliacao(
  supabase: any,
  userId: string,
  config: ConfigERP
): Promise<any> {
  // Buscar lançamentos pendentes
  const { data: pendentes } = await supabase
    .from("contabilidade_lancamentos_importados")
    .select("id, valor, data, tipo, documento")
    .eq("user_id", userId)
    .eq("config_id", config.id)
    .eq("status", "pendente");

  if (!pendentes || pendentes.length === 0) {
    return {
      totalProcessado: 0,
      conciliados: 0,
      pendentes: 0,
      sugeridosManual: 0,
      mensagem: "Nenhum lançamento pendente de conciliação",
    };
  }

  let conciliados = 0;
  let sugeridosManual = 0;

  for (const pendente of pendentes) {
    const conciliado = await tentarConciliacao(supabase, userId, pendente.id, pendente);

    if (conciliado) {
      conciliados++;
    } else {
      // Marcar para revisão manual
      await supabase
        .from("contabilidade_lancamentos_importados")
        .update({
          status: "revisao_manual",
          notas: "Requer revisão manual",
        })
        .eq("id", pendente.id);
      sugeridosManual++;
    }
  }

  return {
    totalProcessado: pendentes.length,
    conciliados,
    pendentes: pendentes.length - conciliados - sugeridosManual,
    sugeridosManual,
    mensagem: `Conciliados ${conciliados} de ${pendentes.length} lançamentos`,
  };
}

/**
 * Executa sincronização completa
 */
async function executarCompleto(
  supabase: any,
  userId: string,
  config: ConfigERP,
  periodo?: { inicio: string; fim: string }
): Promise<any> {
  console.log(`[${new Date().toISOString()}] Executando sincronização completa`);

  // Exportar
  const resultadoExportacao = await executarExportacao(
    supabase,
    userId,
    config,
    "todos",
    periodo
  );

  // Importar
  const resultadoImportacao = await executarImportacao(supabase, userId, config, periodo);

  // Conciliar
  const resultadoConciliacao = await executarConciliacao(supabase, userId, config);

  return {
    success: true,
    mensagem: "Sincronização completa finalizada",
    exportacao: resultadoExportacao,
    importacao: resultadoImportacao,
    conciliacao: resultadoConciliacao,
  };
}

/**
 * Reprocessa apenas erros
 */
async function reprocessarErros(
  supabase: any,
  userId: string,
  config: ConfigERP,
  tipo: string
): Promise<any> {
  // Buscar erros anteriores
  const { data: erros } = await supabase
    .from("contabilidade_exportacoes")
    .select("registro_id, tipo, detalhes")
    .eq("config_id", config.id)
    .eq("status", "erro");

  if (!erros || erros.length === 0) {
    return {
      total: 0,
      exportados: 0,
      erros: 0,
      detalhesErros: [],
      mensagem: "Nenhum registro com erro encontrado",
    };
  }

  const detalhesErros: any[] = [];
  let exportados = 0;

  for (const erro of erros) {
    try {
      if (tipo !== "todos" && erro.tipo !== tipo) continue;

      const dadosERP = transformarParaERP(erro.detalhes, config.erp_tipo, erro.tipo);
      const sucesso = await simularEnvioERP(config, dadosERP);

      if (sucesso) {
        exportados++;
        // Atualizar status
        await supabase
          .from("contabilidade_exportacoes")
          .update({
            status: "sucesso",
            erro: null,
            exportado_em: new Date().toISOString(),
          })
          .eq("config_id", config.id)
          .eq("registro_id", erro.registro_id);
      } else {
        detalhesErros.push({
          registroId: erro.registro_id,
          tipo: erro.tipo,
          erro: "Reprocessamento falhou",
        });
      }
    } catch (error: any) {
      detalhesErros.push({
        registroId: erro.registro_id,
        tipo: erro.tipo,
        erro: error.message,
      });
    }
  }

  return {
    total: erros.length,
    exportados,
    erros: detalhesErros.length,
    detalhesErros,
    mensagem: `Reprocessados ${exportados} de ${erros.length} registros`,
  };
}

/**
 * Executa processamento em batch
 */
async function executarBatch(
  supabase: any,
  userId: string,
  config: ConfigERP,
  body: any
): Promise<any> {
  const { batchSize = 100, offset = 0, tipo, periodo } = body;

  // Implementação de processamento em lotes
  return {
    success: true,
    batchSize,
    offset,
    processed: 0,
    mensagem: `Batch processado: offset ${offset}, size ${batchSize}`,
  };
}

/**
 * Valida saldos antes de exportar
 */
async function validarSaldos(
  supabase: any,
  userId: string,
  periodo: { inicio: string; fim: string }
): Promise<{ valido: boolean; mensagem: string }> {
  try {
    // Buscar somas
    const [pagarResult, receberResult] = await Promise.all([
      supabase
        .from("contas_pagar")
        .select("valor")
        .eq("user_id", userId)
        .gte("data_vencimento", periodo.inicio)
        .lte("data_vencimento", periodo.fim),
      supabase
        .from("contas_receber")
        .select("valor")
        .eq("user_id", userId)
        .gte("data_vencimento", periodo.inicio)
        .lte("data_vencimento", periodo.fim),
    ]);

    const valoresPagar = (pagarResult.data || []).map((c: any) => c.valor);
    const valoresReceber = (receberResult.data || []).map((c: any) => c.valor);

    // Verificar valores negativos
    const negativos = [...valoresPagar, ...valoresReceber].filter((v) => v < 0);
    if (negativos.length > 0) {
      return {
        valido: false,
        mensagem: `${negativos.length} registros com valores negativos`,
      };
    }

    return { valido: true, mensagem: "Saldos válidos" };
  } catch (error: any) {
    return {
      valido: false,
      mensagem: `Erro na validação: ${error.message}`,
    };
  }
}

/**
 * Cria backup antes de importar
 */
async function criarBackup(supabase: any, userId: string, configId: string): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    const backupId = `backup_${configId}_${Date.now()}`;

    const { data: lancamentos } = await supabase
      .from("contabilidade_lancamentos_importados")
      .select("*")
      .eq("user_id", userId)
      .eq("config_id", configId);

    await supabase.from("contabilidade_backups").insert({
      id: backupId,
      user_id: userId,
      config_id: configId,
      backup_criado_em: timestamp,
      dados: { lancamentos: lancamentos || [] },
    });
  } catch (error) {
    console.warn("Erro ao criar backup:", error);
  }
}

/**
 * Transforma dados para formato ERP
 */
function transformarParaERP(
  dados: any,
  erpTipo: string,
  tipoRegistro: string
): Record<string, any> {
  switch (erpTipo.toLowerCase()) {
    case "omie":
      return transformarOmie(dados, tipoRegistro);
    case "nibo":
      return transformarNibo(dados, tipoRegistro);
    case "contaazul":
      return transformarContaAzul(dados, tipoRegistro);
    case "tiny":
      return transformarTiny(dados, tipoRegistro);
    default:
      return { ...dados };
  }
}

function transformarOmie(dados: any, tipo: string): any {
  if (tipo === "contas_pagar") {
    return {
      codigo_lancamento_integracao: dados.id,
      codigo_cliente_fornecedor: dados.fornecedor_id || "1",
      data_vencimento: dados.data_vencimento?.replace(/-/g, "/"),
      valor_documento: dados.valor,
      numero_documento: dados.documento || dados.id,
      status_titulo: dados.status === "pago" ? "PAGO" : "ABERTO",
      codigo_categoria: dados.categoria_id || "1.01.01",
      observacao: dados.descricao,
    };
  }

  if (tipo === "contas_receber") {
    return {
      codigo_lancamento_integracao: dados.id,
      codigo_cliente_fornecedor: dados.cliente_id || "1",
      data_vencimento: dados.data_vencimento?.replace(/-/g, "/"),
      valor_documento: dados.valor,
      numero_documento: dados.documento || dados.id,
      status_titulo: dados.status === "recebido" ? "RECEBIDO" : "ABERTO",
      codigo_categoria: dados.categoria_id || "1.01.01",
      observacao: dados.descricao,
    };
  }

  return {
    codigo_lancamento_integracao: dados.id,
    data: dados.data_transacao?.replace(/-/g, "/"),
    valor: dados.valor,
    tipo: dados.tipo === "entrada" ? "ENTRADA" : "SAIDA",
    codigo_categoria: dados.categoria_id || "1.01.01",
    observacao: dados.descricao,
  };
}

function transformarNibo(dados: any, tipo: string): any {
  return {
    externalId: dados.id,
    description: dados.descricao,
    amount: dados.valor,
    dueDate: dados.data_vencimento || dados.data_transacao,
    documentNumber: dados.documento,
    categoryId: dados.categoria_id,
    entityId: dados.fornecedor_id || dados.cliente_id,
    status: tipo === "contas_pagar" ? (dados.status === "pago" ? "PAID" : "OPEN") : "OPEN",
  };
}

function transformarContaAzul(dados: any, tipo: string): any {
  return {
    externalId: dados.id,
    description: dados.descricao,
    value: dados.valor,
    dueDate: dados.data_vencimento || dados.data_transacao,
    documentNumber: dados.documento,
    category: { id: dados.categoria_id },
    supplier: tipo === "contas_pagar" ? { id: dados.fornecedor_id } : undefined,
    customer: tipo === "contas_receber" ? { id: dados.cliente_id } : undefined,
  };
}

function transformarTiny(dados: any, tipo: string): any {
  return {
    id_externo: dados.id,
    descricao: dados.descricao,
    valor: dados.valor,
    data_vencimento: dados.data_vencimento,
    numero_documento: dados.documento,
    id_categoria: dados.categoria_id,
    id_contato: dados.fornecedor_id || dados.cliente_id,
  };
}

/**
 * Simula envio para ERP (substituir por chamada real em produção)
 */
async function simularEnvioERP(config: ConfigERP, dados: any): Promise<boolean> {
  // Simulação: 95% de sucesso
  return Math.random() > 0.05;
}

/**
 * Simula busca de lançamentos do ERP
 */
async function simularBuscaERP(
  config: ConfigERP,
  periodo: { inicio: string; fim: string }
): Promise<any[]> {
  // Simulação: retorna alguns lançamentos mock
  return [
    {
      id_erp: `erp_${Date.now()}_1`,
      tipo: "contas_pagar",
      data: periodo.inicio,
      valor: 1500.0,
      descricao: "Fornecedor Exemplo",
      documento: "NF-001",
      conta_contabil_erp: "2.01.01",
    },
    {
      id_erp: `erp_${Date.now()}_2`,
      tipo: "contas_receber",
      data: periodo.fim,
      valor: 3000.0,
      descricao: "Cliente Exemplo",
      documento: "NF-002",
      conta_contabil_erp: "1.01.01",
    },
  ];
}

/**
 * Registra log de sincronização
 */
async function registrarLog(
  supabase: any,
  configId: string,
  userId: string,
  tipo: string,
  status: string,
  detalhes: any,
  agendado?: boolean
): Promise<void> {
  try {
    await supabase.from("contabilidade_sync_logs").insert({
      config_id: configId,
      user_id: userId,
      tipo,
      status,
      agendado: agendado || false,
      detalhes,
      mensagem: detalhes.mensagem || `${tipo}: ${status}`,
    });
  } catch (error) {
    console.error("Erro ao registrar log:", error);
  }
}
