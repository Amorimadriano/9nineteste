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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    if (!rawBody) {
      return new Response(JSON.stringify({ received: true, message: "empty body" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = JSON.parse(rawBody);
    console.log("Webhook received:", JSON.stringify(body, null, 2));

    const eventType = body.type;
    const data = body.data ?? {};

    // Only process relevant events
    const relevantEvents = [
      "order.paid",
      "order.closed",
      "charge.paid",
      "charge.underpaid",
      "charge.overpaid",
      "charge.refunded",
      "charge.payment_failed",
    ];

    if (!relevantEvents.includes(eventType)) {
      console.log("Ignoring event:", eventType);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const isChargeEvent = typeof eventType === "string" && eventType.startsWith("charge.");
    const orderId = data?.order?.id || data?.charges?.[0]?.order?.id || (!isChargeEvent ? data?.id : null);
    const chargeId = data?.charges?.[0]?.id || (isChargeEvent ? data?.id : null);
    const chargeStatus = data?.charges?.[0]?.status || data?.last_transaction?.status || data?.status;

    if (!orderId && !chargeId) {
      console.error("No order_id or charge_id found in webhook payload");
      return new Response(JSON.stringify({ error: "No order_id or charge_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${eventType} for order ${orderId ?? "n/a"}, charge ${chargeId ?? "n/a"}, status: ${chargeStatus}`);

    if (eventType === "order.paid" || eventType === "charge.paid") {
      // Activate subscription
      let updateQuery = supabase
        .from("assinaturas")
        .update({
          status: "ativa",
          data_inicio: new Date().toISOString(),
          data_fim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          pagarme_charge_id: chargeId,
        });

      updateQuery = orderId
        ? updateQuery.eq("pagarme_order_id", orderId)
        : updateQuery.eq("pagarme_charge_id", chargeId);

      const { data: updated, error } = await updateQuery.select();

      if (error) {
        console.error("Error activating subscription:", error);
      } else {
        console.log("Subscription activated:", updated);
        // Notify admins
        const customerEmail = data?.customer?.email || updated?.[0]?.metodo_pagamento || "N/A";
        const valor = data?.amount ? (data.amount / 100).toFixed(2) : "199,90";
        await supabase.from("notificacoes_admin").insert({
          titulo: "💰 Nova compra realizada!",
          mensagem: `Pagamento confirmado via Pagar.me. Cliente: ${customerEmail}. Valor: R$ ${valor}. Pedido: ${orderId || chargeId}.`,
          tipo: "pagamento",
        });
      }
    } else if (eventType === "charge.refunded") {
      // Cancel subscription on refund
      let updateQuery = supabase
        .from("assinaturas")
        .update({ status: "cancelada" });

      updateQuery = orderId
        ? updateQuery.eq("pagarme_order_id", orderId)
        : updateQuery.eq("pagarme_charge_id", chargeId);

      const { error } = await updateQuery;

      if (error) {
        console.error("Error canceling subscription:", error);
      } else {
        console.log("Subscription canceled due to refund for order:", orderId);
      }
    } else if (eventType === "charge.payment_failed") {
      // Mark as failed
      let updateQuery = supabase
        .from("assinaturas")
        .update({ status: "falha" });

      updateQuery = orderId
        ? updateQuery.eq("pagarme_order_id", orderId)
        : updateQuery.eq("pagarme_charge_id", chargeId);

      const { error } = await updateQuery;

      if (error) {
        console.error("Error updating failed payment:", error);
      } else {
        console.log("Subscription marked as failed for order:", orderId);
      }
    }

    return new Response(JSON.stringify({ received: true, event: eventType }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
