import { supabase } from "@/integrations/supabase/client";

/**
 * Atualiza o limite do cartão de crédito quando um pagamento é realizado
 * Deduz o valor do pagamento do limite disponível do cartão
 */
async function atualizarLimiteCartao(
  cartaoId: string,
  valorPagamento: number,
  isEstorno: boolean = false
): Promise<boolean> {
  try {
    // Buscar dados atuais do cartão
    const { data: cartao, error: fetchError } = await (supabase
      .from("bancos_cartoes") as any)
      .select("limite, saldo_inicial, nome")
      .eq("id", cartaoId)
      .single();

    if (fetchError) {
      console.error("Erro ao buscar cartão:", fetchError);
      return false;
    }

    if (!cartao) {
      console.error("Cartão não encontrado:", cartaoId);
      return false;
    }

    // Calcular novo limite
    // Se for pagamento: reduz o limite (limite - valor)
    // Se for estorno: aumenta o limite (limite + valor)
    const fator = isEstorno ? 1 : -1;
    const limiteAtual = cartao.limite ?? 0;
    const novoLimite = limiteAtual + (fator * valorPagamento);

    // O limite não pode ser negativo
    const limiteFinal = Math.max(0, novoLimite);

    // Atualizar no banco
    const { error: updateError } = await (supabase
      .from("bancos_cartoes") as any)
      .update({
        limite: limiteFinal,
        updated_at: new Date().toISOString()
      })
      .eq("id", cartaoId);

    if (updateError) {
      console.error("Erro ao atualizar limite do cartão:", updateError);
      return false;
    }

    console.log(`Limite do cartão ${cartao.nome} atualizado: ${limiteAtual} -> ${limiteFinal}`);
    return true;

  } catch (error) {
    console.error("Erro inesperado ao atualizar limite do cartão:", error);
    return false;
  }
}

/**
 * Verifica se a forma de pagamento é via cartão de crédito
 */
function isCartaoCredito(formaPagamento?: string | null): boolean {
  return formaPagamento === "cartao_credito";
}

async function findDestinoFinanceiro(
  userId: string,
  formaPagamento?: string | null,
  fallbackId?: string | null
): Promise<string | null> {
  const tipoDestino =
    formaPagamento === "cartao_credito" || formaPagamento === "cartao_debito"
      ? formaPagamento
      : "banco";

  const { data, error } = await (supabase.from("bancos_cartoes") as any)
    .select("id")
    .eq("user_id", userId)
    .eq("ativo", true)
    .eq("tipo", tipoDestino)
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) {
    console.error("Erro ao localizar destino financeiro da sincronização:", error);
    return fallbackId ?? null;
  }

  return data?.[0]?.id ?? fallbackId ?? null;
}

/**
 * Sync a conta a pagar with extrato_bancario:
 * - Only creates/keeps an extrato entry when status is "pago"
 * - When status reverts to "pendente", removes the extrato entry
 * - This ensures bank balance only changes on actual payment
 */
export async function syncContaPagarExtrato(
  userId: string,
  contaId: string,
  values: {
    descricao: string;
    valor: number;
    data_vencimento: string;
    status: string;
    data_pagamento?: string | null;
    forma_pagamento?: string | null;
    banco_cartao_id?: string | null;
  }
) {
  const isPago = values.status === "pago";

  // If not paid, remove any existing extrato entry and return
  if (!isPago) {
    await removeContaPagarExtrato(contaId);
    return true;
  }

  const { data: existing, error: existingError } = await (supabase.from("extrato_bancario") as any)
    .select("id, banco_cartao_id, conciliado")
    .eq("conta_pagar_id", contaId)
    .eq("origem", "sistema")
    .maybeSingle();

  if (existingError) {
    console.error("Erro ao localizar extrato existente (pagar):", existingError);
  }

  // Use explicitly provided banco_cartao_id, otherwise fallback to auto-detection
  const bancoCartaoId = values.banco_cartao_id
    ? values.banco_cartao_id
    : await findDestinoFinanceiro(
        userId,
        values.forma_pagamento,
        existing?.banco_cartao_id ?? null
      );

  const payload = {
    user_id: userId,
    descricao: values.descricao,
    valor: values.valor,
    data_transacao: values.data_pagamento || new Date().toISOString().split("T")[0],
    tipo: "saida",
    conta_pagar_id: contaId,
    conciliado: true,
    origem: "sistema",
    banco_cartao_id: bancoCartaoId,
  };

  const { error } = existing?.id
    ? await (supabase.from("extrato_bancario") as any).update(payload).eq("id", existing.id)
    : await (supabase.from("extrato_bancario") as any).insert(payload);

  if (error) {
    console.error("Erro ao sincronizar extrato (pagar):", error);
    return false;
  }

  // Se for pagamento via cartão de crédito, atualizar o limite do cartão
  if (isCartaoCredito(values.forma_pagamento) && bancoCartaoId) {
    const atualizado = await atualizarLimiteCartao(bancoCartaoId, values.valor, false);
    if (!atualizado) {
      console.warn("Não foi possível atualizar o limite do cartão de crédito");
    }
  }

  return true;
}

/**
 * Sync a conta a receber with extrato_bancario:
 * - Only creates/keeps an extrato entry when status is "recebido"
 * - When status reverts to "pendente", removes the extrato entry
 * - This ensures bank balance only changes on actual receipt
 */
export async function syncContaReceberExtrato(
  userId: string,
  contaId: string,
  values: {
    descricao: string;
    valor: number;
    data_vencimento: string;
    status: string;
    data_recebimento?: string | null;
    forma_pagamento?: string | null;
    banco_cartao_id?: string | null;
  }
) {
  const isRecebido = values.status === "recebido";

  // If not received, remove any existing extrato entry and return
  if (!isRecebido) {
    await removeContaReceberExtrato(contaId);
    return true;
  }

  const { data: existing, error: existingError } = await (supabase.from("extrato_bancario") as any)
    .select("id, banco_cartao_id, conciliado")
    .eq("conta_receber_id", contaId)
    .eq("origem", "sistema")
    .maybeSingle();

  if (existingError) {
    console.error("Erro ao localizar extrato existente (receber):", existingError);
  }

  // Use explicitly provided banco_cartao_id, otherwise fallback to auto-detection (banco)
  const bancoCartaoId = values.banco_cartao_id
    ? values.banco_cartao_id
    : await findDestinoFinanceiro(
        userId,
        "banco",
        existing?.banco_cartao_id ?? null
      );

  const payload = {
    user_id: userId,
    descricao: values.descricao,
    valor: values.valor,
    data_transacao: values.data_recebimento || new Date().toISOString().split("T")[0],
    tipo: "entrada",
    conta_receber_id: contaId,
    conciliado: true,
    origem: "sistema",
    banco_cartao_id: bancoCartaoId,
  };

  const { error } = existing?.id
    ? await (supabase.from("extrato_bancario") as any).update(payload).eq("id", existing.id)
    : await (supabase.from("extrato_bancario") as any).insert(payload);

  if (error) {
    console.error("Erro ao sincronizar extrato (receber):", error);
  }
  return !error;
}

/**
 * Remove extrato entries for a conta a pagar
 * Se for cartão de crédito, restaura o limite do cartão
 */
export async function removeContaPagarExtrato(contaId: string) {
  try {
    // Buscar o registro antes de excluir para verificar se é cartão de crédito
    const { data: extrato } = await (supabase
      .from("extrato_bancario") as any)
      .select("banco_cartao_id, valor, conta_pagar_id(conta_pagar_id(forma_pagamento))")
      .eq("conta_pagar_id", contaId)
      .eq("origem", "sistema")
      .single();

    // Restaurar o limite do cartão se for cartão de crédito
    if (extrato?.banco_cartao_id && extrato?.valor) {
      await atualizarLimiteCartao(extrato.banco_cartao_id, extrato.valor, true);
    }
  } catch (e) {
    console.log("Não foi possível verificar tipo de pagamento ao remover extrato:", e);
  }

  await (supabase.from("extrato_bancario") as any)
    .delete()
    .eq("conta_pagar_id", contaId)
    .eq("origem", "sistema");
}

/**
 * Cria um lançamento espelho em extrato_bancario ao criar uma conta a pagar
 * Status: aguardando_extrato
 */
export async function createPendingExtratoPagar(
  userId: string,
  contaId: string,
  values: {
    descricao: string;
    valor: number;
    data_vencimento: string;
    forma_pagamento?: string | null;
    banco_cartao_id?: string | null;
  }
) {
  const bancoCartaoId =
    values.banco_cartao_id ??
    (await findDestinoFinanceiro(userId, values.forma_pagamento, null));

  const payload = {
    user_id: userId,
    descricao: values.descricao,
    valor: values.valor,
    data_transacao: values.data_vencimento,
    tipo: "saida",
    conta_pagar_id: contaId,
    conciliado: false,
    origem: "sistema",
    status_conciliacao: "aguardando_extrato",
    banco_cartao_id: bancoCartaoId,
  };

  const { error } = await (supabase.from("extrato_bancario") as any).insert(
    payload
  );

  if (error) {
    console.error("Erro ao criar espelho de conta a pagar:", error);
    return false;
  }
  return true;
}

/**
 * Cria um lançamento espelho em extrato_bancario ao criar uma conta a receber
 * Status: aguardando_extrato
 */
export async function createPendingExtratoReceber(
  userId: string,
  contaId: string,
  values: {
    descricao: string;
    valor: number;
    data_vencimento: string;
    forma_pagamento?: string | null;
    banco_cartao_id?: string | null;
  }
) {
  const bancoCartaoId =
    values.banco_cartao_id ??
    (await findDestinoFinanceiro(userId, "banco", null));

  const payload = {
    user_id: userId,
    descricao: values.descricao,
    valor: values.valor,
    data_transacao: values.data_vencimento,
    tipo: "entrada",
    conta_receber_id: contaId,
    conciliado: false,
    origem: "sistema",
    status_conciliacao: "aguardando_extrato",
    banco_cartao_id: bancoCartaoId,
  };

  const { error } = await (supabase.from("extrato_bancario") as any).insert(
    payload
  );

  if (error) {
    console.error("Erro ao criar espelho de conta a receber:", error);
    return false;
  }
  return true;
}

/**
 * Remove extrato entries for a conta a receber
 */
export async function removeContaReceberExtrato(contaId: string) {
  await (supabase.from("extrato_bancario") as any)
    .delete()
    .eq("conta_receber_id", contaId)
    .eq("origem", "sistema");
}
