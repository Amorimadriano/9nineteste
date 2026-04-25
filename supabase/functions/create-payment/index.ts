import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Inline PagarMe v5 helpers ---
const PAGARME_V5_URL = "https://api.pagar.me/core/v5";
const MAX_RETRIES = 3;
const AUTHORIZATION_DENIED_MESSAGE = "authorization has been denied for this request";

type PagarmePayload = Record<string, unknown>;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isPayloadWithErrors(payload: unknown): payload is PagarmePayload & { errors: unknown } {
  return Boolean(payload && typeof payload === "object" && "errors" in payload);
}

function isAuthorizationDenied(message: string) {
  return message.toLowerCase().includes(AUTHORIZATION_DENIED_MESSAGE);
}

function buildPagarmeError(status: number, message: string) {
  if (status === 401) {
    return new Error(
      "Falha de autenticação na Pagar.me. Verifique se a SecretKey em PAGARME_API_KEY está correta e se pertence ao ambiente certo (sk_ produção ou sk_test_ sandbox).",
    );
  }
  if (status === 403 || isAuthorizationDenied(message)) {
    return new Error(
      "A Pagar.me negou a autorização desta requisição. Verifique se a SecretKey pertence à mesma conta/merchant, se o ambiente da chave está correto e se o IP Allowlist da Pagar.me libera o backend.",
    );
  }
  return new Error(`Erro Pagar.me: ${message}`);
}

function getPagarmeSecretKey() {
  const secretKey = Deno.env.get("PAGARME_API_KEY")?.trim();
  if (!secretKey) {
    throw new Error("PAGARME_API_KEY not configured");
  }
  if (!secretKey.startsWith("sk_")) {
    throw new Error("PAGARME_API_KEY inválida. Configure a SecretKey (sk_ ou sk_test_) da Pagar.me.");
  }
  return secretKey;
}

function getPagarmeBasicAuth(secretKey = getPagarmeSecretKey()) {
  return `Basic ${globalThis.btoa(`${secretKey}:`)}`;
}

async function parseResponse(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function extractPagarmeError(payload: PagarmePayload = {}) {
  if (typeof payload.message === "string" && payload.message) {
    return payload.message;
  }
  if (typeof payload.error === "string" && payload.error) {
    return payload.error;
  }
  if (Array.isArray(payload.errors)) {
    for (const item of payload.errors) {
      if (typeof item === "string" && item) return item;
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        if (typeof record.message === "string" && record.message) return record.message;
      }
    }
  }
  return "Erro desconhecido";
}

async function pagarmeRequest(path: string, init: RequestInit = {}) {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    const response = await fetch(`${PAGARME_V5_URL}${path}`, {
      ...init,
      headers: {
        accept: "application/json",
        ...init.headers,
      },
    });
    const payload = await parseResponse(response);
    if (response.ok && !isPayloadWithErrors(payload)) {
      return payload;
    }
    const message = extractPagarmeError((payload ?? {}) as PagarmePayload);
    const canRetry = attempt < MAX_RETRIES && (response.status >= 500 || isAuthorizationDenied(message));
    console.error(`Pagar.me request failed (attempt ${attempt}/${MAX_RETRIES}, status ${response.status}, path ${path}): ${message}`);
    lastError = buildPagarmeError(response.status, message);
    if (!canRetry) {
      throw lastError;
    }
    await sleep(attempt * 500);
  }
  throw lastError ?? new Error("Erro desconhecido ao comunicar com a Pagar.me.");
}
// --- End inline PagarMe helpers ---

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PAGARME_SECRET_KEY = getPagarmeSecretKey();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const body = await req.json();
    const { payment_method, customer, card } = body;

    const cleanDoc = customer.document.replace(/\D/g, "");
    const cleanPhone = customer.phone ? customer.phone.replace(/\D/g, "") : "";

    // Build Pagar.me v5 order payload
    const customerPayload: any = {
      name: customer.name,
      email: customer.email,
      type: cleanDoc.length > 11 ? "company" : "individual",
      document: cleanDoc,
      document_type: cleanDoc.length > 11 ? "CNPJ" : "CPF",
    };

    if (cleanPhone.length >= 10) {
      const ddd = cleanPhone.substring(0, 2);
      const number = cleanPhone.substring(2);
      customerPayload.phones = {
        mobile_phone: {
          country_code: "55",
          area_code: ddd,
          number: number,
        },
      };
    }

    // Build payment object based on method
    const paymentObj: any = {
      payment_method,
      amount: 19990, // R$ 199,90 in cents
    };

    if (payment_method === "credit_card") {
      if (!card) throw new Error("Dados do cartão são obrigatórios");
      let expYear = parseInt(card.exp_year);
      if (expYear < 100) expYear += 2000;
      paymentObj.credit_card = {
        recurrence: false,
        installments: 1,
        statement_descriptor: "9NINE BPO",
        card: {
          number: card.number.replace(/\s/g, ""),
          holder_name: card.holder_name,
          exp_month: parseInt(card.exp_month),
          exp_year: expYear,
          cvv: card.cvv,
          billing_address: {
            line_1: `100, ${customer.address || "Rua Exemplo"}, ${customer.neighborhood || "Centro"}`,
            zip_code: (customer.zip_code || "01000000").replace(/\D/g, ""),
            city: customer.city || "São Paulo",
            state: customer.state || "SP",
            country: "BR",
          },
        },
      };
    } else if (payment_method === "boleto") {
      paymentObj.boleto = {
        instructions: "Pagar até o vencimento. Após o vencimento, cobrar multa de 2%.",
        due_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      };
    } else if (payment_method === "pix") {
      paymentObj.pix = {
        expires_in: 3600, // 1 hour in seconds
      };
    }

    const orderPayload = {
      customer: customerPayload,
      items: [
        {
          amount: 19990,
          description: "9Nine Business Control - Mensal",
          quantity: 1,
          code: "9nine-mensal",
        },
      ],
      payments: [paymentObj],
      closed: true,
      metadata: {
        product: "9Nine Business Control - Mensal",
        user_id: user.id,
      },
    };

    console.log("Creating order (v5):", JSON.stringify(orderPayload, null, 2));

    const orderData: any = await pagarmeRequest("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": getPagarmeBasicAuth(PAGARME_SECRET_KEY),
      },
      body: JSON.stringify(orderPayload),
    });

    console.log("Order created:", orderData.id, "status:", orderData.status);

    // Extract charge info from the first charge
    const charge = orderData.charges?.[0];
    const lastTransaction = charge?.last_transaction;

    // Save subscription record
    const subscriptionData: any = {
      user_id: user.id,
      status: "pendente",
      plano: "mensal",
      valor: 199.90,
      metodo_pagamento: payment_method,
      pagarme_order_id: orderData.id,
      pagarme_charge_id: charge?.id || null,
      pagarme_customer_id: orderData.customer?.id || null,
    };

    if (payment_method === "pix" && lastTransaction) {
      subscriptionData.pix_qr_code = lastTransaction.qr_code;
      subscriptionData.pix_qr_code_url = lastTransaction.qr_code_url;
    } else if (payment_method === "boleto" && lastTransaction) {
      subscriptionData.boleto_url = lastTransaction.pdf || lastTransaction.url;
      subscriptionData.boleto_barcode = lastTransaction.line || lastTransaction.barcode;
    } else if (payment_method === "credit_card" && charge?.status === "paid") {
      subscriptionData.status = "ativa";
      subscriptionData.data_inicio = new Date().toISOString();
      subscriptionData.data_fim = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    const { data: subscription, error: dbError } = await supabase
      .from("assinaturas")
      .insert(subscriptionData)
      .select()
      .single();

    if (dbError) {
      console.error("DB error:", dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      subscription,
      pix_qr_code: subscriptionData.pix_qr_code,
      pix_qr_code_url: subscriptionData.pix_qr_code_url,
      boleto_url: subscriptionData.boleto_url,
      boleto_barcode: subscriptionData.boleto_barcode,
      order_status: orderData.status,
      charge_status: charge?.status,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});