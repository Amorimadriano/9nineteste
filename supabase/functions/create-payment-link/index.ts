const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://9ninebusinesscontrol.com.br",
  "https://www.9ninebusinesscontrol.com.br",
  "https://9nineteste.9ninebusinesscontrol.com.br",
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

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
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

    // Pagar.me v5: Create a checkout/payment link via orders endpoint
    // Using multi-payment order so customer can choose method on Pagar.me hosted page
    const payload = {
      items: [
        {
          amount: 19990,
          description: "9Nine Business Control - Mensal",
          quantity: 1,
          code: "9nine-mensal",
        },
      ],
      customer: {
        name: user.email?.split("@")[0] || "Cliente",
        email: user.email || "cliente@email.com",
      },
      payments: [
        {
          payment_method: "checkout",
          checkout: {
            expires_in: 7200, // 2 hours
            accepted_payment_methods: ["credit_card", "boleto", "pix"],
            success_url: `${req.headers.get("origin") || "https://ninebpofinanceiro.lovable.app"}/planos?success=true`,
            boleto: {
              instructions: "Pagar até o vencimento. Após o vencimento, cobrar multa de 2%.",
              due_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            },
            pix: {
              expires_in: 3600,
            },
            credit_card: {
              installments: [{ number: 1, total: 19990 }],
              statement_descriptor: "9NINE BPO",
            },
          },
        },
      ],
      closed: true,
      metadata: {
        product: "9Nine Business Control - Mensal",
        user_id: user.id,
      },
    };

    console.log("Creating checkout order (v5)...");

    const data: any = await pagarmeRequest("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": getPagarmeBasicAuth(PAGARME_SECRET_KEY),
      },
      body: JSON.stringify(payload),
    });

    console.log("Checkout order created:", data.id);

    // Extract checkout URL from the charge
    const charge = data.charges?.[0];
    const checkoutUrl = charge?.last_transaction?.checkout_url
      || charge?.checkout_url
      || data.checkouts?.[0]?.payment_url;

    // Save subscription record
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    await supabaseAdmin.from("assinaturas").insert({
      user_id: user.id,
      status: "pendente",
      plano: "mensal",
      valor: 199.90,
      metodo_pagamento: "link",
      pagarme_order_id: data.id,
      pagarme_charge_id: charge?.id || null,
      pagarme_customer_id: data.customer?.id || null,
    });

    return new Response(JSON.stringify({
      success: true,
      payment_link_id: data.id,
      payment_link_url: checkoutUrl,
      short_url: checkoutUrl,
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