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

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const hoje = new Date().toISOString().split("T")[0];
    const limite = new Date();
    limite.setDate(limite.getDate() + 3);
    const limiteStr = limite.toISOString().split("T")[0];

    // Get all users
    const { data: users } = await adminClient.auth.admin.listUsers();
    if (!users?.users) {
      return new Response(JSON.stringify({ message: "No users found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];

    for (const user of users.users) {
      if (!user.email) continue;

      // Get overdue bills (contas a pagar)
      const { data: vencidasPagar } = await adminClient
        .from("contas_pagar")
        .select("id, descricao, valor, data_vencimento")
        .eq("user_id", user.id)
        .eq("status", "pendente")
        .lt("data_vencimento", hoje);

      // Get overdue bills (contas a receber)
      const { data: vencidasReceber } = await adminClient
        .from("contas_receber")
        .select("id, descricao, valor, data_vencimento")
        .eq("user_id", user.id)
        .eq("status", "pendente")
        .lt("data_vencimento", hoje);

      // Get bills due in next 3 days (contas a pagar)
      const { data: proximasPagar } = await adminClient
        .from("contas_pagar")
        .select("id, descricao, valor, data_vencimento")
        .eq("user_id", user.id)
        .eq("status", "pendente")
        .gte("data_vencimento", hoje)
        .lte("data_vencimento", limiteStr);

      // Get bills due in next 3 days (contas a receber)
      const { data: proximasReceber } = await adminClient
        .from("contas_receber")
        .select("id, descricao, valor, data_vencimento")
        .eq("user_id", user.id)
        .eq("status", "pendente")
        .gte("data_vencimento", hoje)
        .lte("data_vencimento", limiteStr);

      const totalAlerts =
        (vencidasPagar?.length || 0) +
        (vencidasReceber?.length || 0) +
        (proximasPagar?.length || 0) +
        (proximasReceber?.length || 0);

      if (totalAlerts > 0) {
        // Store notification data for this user
        results.push({
          user_id: user.id,
          email: user.email,
          vencidasPagar: vencidasPagar || [],
          vencidasReceber: vencidasReceber || [],
          proximasPagar: proximasPagar || [],
          proximasReceber: proximasReceber || [],
        });

        console.log(
          `User ${user.email}: ${vencidasPagar?.length || 0} overdue payables, ${vencidasReceber?.length || 0} overdue receivables, ${proximasPagar?.length || 0} upcoming payables, ${proximasReceber?.length || 0} upcoming receivables`
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Checked ${users.users.length} users, ${results.length} with alerts`,
        alerts: results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error checking bill alerts:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
