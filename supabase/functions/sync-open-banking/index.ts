import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Inline Open Banking helpers ---
const OPEN_BANKING_URLS: Record<string, string> = {
  "001": "https://api.bb.com.br/open-banking",
  "237": "https://api.bradesco.com/open-banking",
  "341": "https://api.itau.com.br/open-banking",
  "033": "https://openbanking.santander.com.br",
  "104": "https://openbanking.caixa.gov.br",
  "260": "https://api.nubank.com.br/open-banking",
  "077": "https://api.inter.co/open-banking",
  "756": "https://api.sicoob.com.br/open-banking",
};

const OPEN_BANKING_SANDBOX_URLS: Record<string, string> = {
  "001": "https://api.sandbox.bb.com.br/open-banking",
  "237": "https://api-sandbox.bradesco.com/open-banking",
  "341": "https://api.itau.com.br/sandbox/open-banking",
  "033": "https://openbanking-sandbox.santander.com.br",
  "104": "https://openbanking-sandbox.caixa.gov.br",
  "260": "https://api-sandbox.nubank.com.br/open-banking",
  "077": "https://api-sandbox.inter.co/open-banking",
  "756": "https://api-sandbox.sicoob.com.br/open-banking",
};

const RATE_LIMITS: Record<string, number> = {
  "001": 60,
  "237": 60,
  "341": 100,
  "033": 60,
  "104": 60,
  "260": 120,
  "077": 100,
  "756": 60,
};

function getOpenBankingUrl(bancoCodigo: string, sandbox = false): string {
  const urls = sandbox ? OPEN_BANKING_SANDBOX_URLS : OPEN_BANKING_URLS;
  return urls[bancoCodigo] || "";
}

async function fetchBankTransactions(
  bancoCodigo: string,
  accessToken: string,
  dataInicio: string,
  dataFim: string,
  sandbox = false
): Promise<Array<{
  transacao_id: string;
  data: string;
  valor: number;
  tipo: "CREDIT" | "DEBIT";
  descricao: string;
  informacao_complementar?: string;
}>> {
  if (sandbox) {
    const transacoes = [];
    const numTransacoes = Math.floor(Math.random() * 10) + 5;
    for (let i = 0; i < numTransacoes; i++) {
      const data = new Date(dataInicio);
      data.setDate(data.getDate() + Math.floor(Math.random() * 30));
      transacoes.push({
        transacao_id: `TXN-${Date.now()}-${i}`,
        data: data.toISOString().split("T")[0],
        valor: Math.round((Math.random() * 1000 + 50) * 100) / 100,
        tipo: (Math.random() > 0.5 ? "CREDIT" : "DEBIT") as "CREDIT" | "DEBIT",
        descricao: `Transação simulada ${i + 1}`,
        informacao_complementar: `Complemento ${i + 1}`,
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    return transacoes;
  }

  const baseUrl = getOpenBankingUrl(bancoCodigo, false);
  if (!baseUrl) {
    throw new Error(`Banco ${bancoCodigo} não suportado`);
  }
  throw new Error("Integração real com banco não implementada");
}

async function checkRateLimit(
  bancoCodigo: string,
  kv: any
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const limit = RATE_LIMITS[bancoCodigo] || 60;
  const key = `rate_limit:${bancoCodigo}`;
  const now = Date.now();
  const windowMs = 60 * 1000;

  const current = (await kv.get(key)) || { count: 0, windowStart: now };

  if (now - current.windowStart > windowMs) {
    current.count = 0;
    current.windowStart = now;
  }

  if (current.count >= limit) {
    const retryAfter = Math.ceil((current.windowStart + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }

  current.count++;
  await kv.set(key, current, { ttl: 60 });

  return { allowed: true };
}

function validateTransactionData(
  data: any
): { valid: boolean; error?: string } {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Resposta inválida da API" };
  }
  if (!data.transacao_id || typeof data.transacao_id !== "string") {
    return { valid: false, error: "transacao_id ausente ou inválido" };
  }
  if (!data.data || typeof data.data !== "string") {
    return { valid: false, error: "data ausente ou inválida" };
  }
  if (typeof data.valor !== "number" || data.valor < 0) {
    return { valid: false, error: "valor ausente ou inválido" };
  }
  if (!data.tipo || !["CREDIT", "DEBIT"].includes(data.tipo)) {
    return { valid: false, error: "tipo ausente ou inválido" };
  }
  return { valid: true };
}
// --- End inline Open Banking helpers ---

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const body: SyncRequest = await req.json();
    const { integracaoId, userId, bancoCodigo, dataInicio, dataFim } = body;

    if (!integracaoId || !userId) {
      throw new Error("Missing required parameters: integracaoId and userId");
    }

    if (userId !== user.id) {
      throw new Error("User ID mismatch");
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: integracao, error: integracaoError } = await supabaseAdmin
      .from("open_banking_integracoes")
      .select("*, bancos_cartoes (*)")
      .eq("id", integracaoId)
      .eq("user_id", userId)
      .single();

    if (integracaoError || !integracao) {
      throw new Error("Integration not found");
    }

    if (!integracao.consentimento_ativo) {
      throw new Error("Consentimento não está ativo");
    }

    const tokenExpirado = new Date(integracao.token_expira_em) < new Date();
    if (tokenExpirado) {
      throw new Error("Token expirado. Renove o consentimento.");
    }

    const rateLimitResult = await checkRateLimit(
      integracao.banco_codigo,
      supabaseAdmin
    );

    if (!rateLimitResult.allowed) {
      throw new Error(
        `Rate limit excedido. Tente novamente em ${rateLimitResult.retryAfter} segundos.`
      );
    }

    const fim = dataFim || new Date().toISOString().split("T")[0];
    const inicio =
      dataInicio ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

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

    for (const transacao of transacoesBanco) {
      const validation = validateTransactionData(transacao);
      if (!validation.valid) {
        console.warn(`Transação inválida ignorada: ${validation.error}`);
        continue;
      }

      const { data: existente } = await supabaseAdmin
        .from("open_banking_extratos")
        .select("id")
        .eq("integracao_id", integracaoId)
        .eq("transacao_id", transacao.transacao_id)
        .maybeSingle();

      if (existente) {
        continue;
      }

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

    await supabaseAdmin
      .from("open_banking_integracoes")
      .update({
        ultima_sincronizacao: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", integracaoId);

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