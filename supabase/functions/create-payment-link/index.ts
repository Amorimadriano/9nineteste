import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getPagarmeBasicAuth, getPagarmeSecretKey, pagarmeRequest } from "../_shared/pagarme.ts";

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

    // Pagar.me v5: Create a checkout/payment link via orders endpoint
    // Using multi-payment order so customer can choose method on Pagar.me hosted page
    const payload = {
      items: [
        {
          amount: 39990,
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
              installments: [{ number: 1, total: 39990 }],
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
      valor: 399.90,
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
