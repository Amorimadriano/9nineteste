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
