import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  fetchBankTransactions,
  checkRateLimit,
  validateTransactionData,
} from "../_shared/openBanking.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SyncRequest {
  integracaoId: string;
  userId: string;
  bancoCodigo?: string;
  agendado?: boolean;
  dataInicio?: string;
  dataFim?: string;
}

interface SyncStats {
  novas: number;
  conciliadas: number;
  pendentes: number;
  totalProcessado: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
    const { integracaoId, userId, bancoCodigo, dataInicio, dataFim } = body;

    if (!integracaoId || !userId) {
      throw new Error("Missing required parameters: integracaoId and userId");
    }

    // Verificar se userId corresponde ao usuário autenticado
    if (userId !== user.id) {
      throw new Error("User ID mismatch");
    }

    // Criar cliente admin para operações sem RLS
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Buscar integração
    const { data: integracao, error: integracaoError } = await supabaseAdmin
      .from("open_banking_integracoes")
      .select("*, bancos_cartoes (*)")
      .eq("id", integracaoId)
      .eq("user_id", userId)
      .single();

    if (integracaoError || !integracao) {
      throw new Error("Integration not found");
    }

    // Verificar consentimento ativo
    if (!integracao.consentimento_ativo) {
      throw new Error("Consentimento não está ativo");
    }

    // Verificar se token expirou
    const tokenExpirado = new Date(integracao.token_expira_em) < new Date();
    if (tokenExpirado) {
      throw new Error("Token expirado. Renove o consentimento.");
    }

    // Verificar rate limit
    const rateLimitResult = await checkRateLimit(
      integracao.banco_codigo,
      supabaseAdmin
    );

    if (!rateLimitResult.allowed) {
      throw new Error(
        `Rate limit excedido. Tente novamente em ${rateLimitResult.retryAfter} segundos.`
      );
    }

    // Definir período de busca
    const fim = dataFim || new Date().toISOString().split("T")[0];
    const inicio =
      dataInicio ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

    // Buscar transações do banco (simulado ou real)
    const transacoesBanco = await fetchBankTransactions(
      integracao.banco_codigo,
      integracao.access_token,
      inicio,
      fim,
      integracao.sandbox || false
    );

    const stats: SyncStats = {
      novas: 0,
      conciliadas: 0,
      pendentes: 0,
      totalProcessado: transacoesBanco.length,
    };

    // Processar cada transação
    for (const transacao of transacoesBanco) {
      // Validar dados
      const validation = validateTransactionData(transacao);
      if (!validation.valid) {
        console.warn(`Transação inválida ignorada: ${validation.error}`);
        continue;
      }

      // Verificar duplicidade
      const { data: existente } = await supabaseAdmin
        .from("open_banking_extratos")
        .select("id")
        .eq("integracao_id", integracaoId)
        .eq("transacao_id", transacao.transacao_id)
        .maybeSingle();

      if (existente) {
        // Já existe, ignorar
        continue;
      }

      // Inserir nova transação
      const { data: novaTransacao, error: insertError } = await supabaseAdmin
        .from("open_banking_extratos")
        .insert({
          integracao_id: integracaoId,
          user_id: userId,
          banco_cartao_id: integracao.banco_cartao_id,
          transacao_id: transacao.transacao_id,
          data_transacao: transacao.data,
          valor: transacao.valor,
          tipo: transacao.tipo === "CREDIT" ? "entrada" : "saida",
          descricao: transacao.descricao,
          informacao_complementar: transacao.informacao_complementar,
          status_conciliacao: "pendente",
          conciliado: false,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Erro ao inserir transação:", insertError);
        continue;
      }

      stats.novas++;

      // Tentar matching automático
      const matchingResult = await tentarMatchingAutomatico(
        supabaseAdmin,
        userId,
        novaTransacao
      );

      if (matchingResult.conciliado) {
        stats.conciliadas++;
      } else {
        stats.pendentes++;
      }
    }

    // Atualizar timestamp da última sincronização
    await supabaseAdmin
      .from("open_banking_integracoes")
      .update({
        ultima_sincronizacao: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", integracaoId);

    // Registrar log de sincronização
    await supabaseAdmin.from("open_banking_sync_logs").insert({
      integracao_id: integracaoId,
      user_id: userId,
      status: "sucesso",
      mensagem: `Sincronização concluída: ${stats.novas} novas, ${stats.conciliadas} conciliadas`,
      detalhes: {
        stats,
        periodo: { inicio, fim },
        total_api: transacoesBanco.length,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        message: `Sincronização concluída: ${stats.novas} novas transações, ${stats.conciliadas} conciliadas automaticamente`,
        periodo: { inicio, fim },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro na sincronização Open Banking:", error);

    // Registrar erro
    try {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      await supabaseAdmin.from("open_banking_sync_logs").insert({
        integracao_id: (await req.clone().json()).integracaoId,
        user_id: (await req.clone().json()).userId,
        status: "erro",
        mensagem: (error as Error).message,
        detalhes: { error: (error as Error).stack },
      });
    } catch {
      // Ignorar erro ao registrar log
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message,
        stats: { novas: 0, conciliadas: 0, pendentes: 0, totalProcessado: 0 },
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Tenta matching automático entre transação e lançamentos pendentes
 */
async function tentarMatchingAutomatico(
  supabase: any,
  userId: string,
  transacao: {
    id: string;
    valor: number;
    tipo: string;
    data_transacao: string;
    descricao?: string;
  }
): Promise<{ conciliado: boolean; lancamentoId?: string }> {
  try {
    const transacaoDate = new Date(transacao.data_transacao);
    const toleranciaDias = 1;
    const toleranciaValor = 0.01;

    // Buscar lançamentos pendentes compatíveis
    const { data: lancamentos } = await supabase
      .from("contas_pagar")
      .select("id, valor, data_vencimento, data_pagamento")
      .eq("user_id", userId)
      .eq("status", "pendente")
      .lte("valor", transacao.valor + toleranciaValor)
      .gte("valor", transacao.valor - toleranciaValor);

    for (const lancamento of lancamentos || []) {
      const data = lancamento.data_pagamento || lancamento.data_vencimento;
      const lancamentoDate = new Date(data);
      const diffDias = Math.abs(
        (transacaoDate.getTime() - lancamentoDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDias <= toleranciaDias) {
        // Match encontrado - vincular
        await supabase
          .from("open_banking_extratos")
          .update({
            conta_pagar_id: lancamento.id,
            status_conciliacao: "conciliado",
            conciliado: true,
            conciliado_em: new Date().toISOString(),
          })
          .eq("id", transacao.id);

        await supabase
          .from("contas_pagar")
          .update({
            status: "pago",
            data_pagamento: transacao.data_transacao,
            updated_at: new Date().toISOString(),
          })
          .eq("id", lancamento.id);

        return { conciliado: true, lancamentoId: lancamento.id };
      }
    }

    return { conciliado: false };
  } catch (error) {
    console.error("Erro no matching automático:", error);
    return { conciliado: false };
  }
}
