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

    const { order_id } = await req.json();
    if (!order_id) throw new Error("order_id is required");

    const orderData: any = await pagarmeRequest(`/orders/${order_id}`, {
      headers: {
        "Authorization": getPagarmeBasicAuth(PAGARME_SECRET_KEY),
      },
    });

    console.log("Order status:", orderData.id, orderData.status);

    const charge = orderData.charges?.[0];
    const isPaid = orderData.status === "paid" || charge?.status === "paid";

    if (isPaid) {
      // Use service role to update subscription regardless of RLS
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      const { error: updateError } = await supabaseAdmin
        .from("assinaturas")
        .update({
          status: "ativa",
          data_inicio: new Date().toISOString(),
          data_fim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("pagarme_order_id", order_id)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("DB update error:", updateError);
      } else {
        console.log("Subscription activated for user:", user.id);
      }
    }

    return new Response(JSON.stringify({
      paid: isPaid,
      status: orderData.status,
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
