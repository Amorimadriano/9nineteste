import { supabase } from "@/integrations/supabase/client";

type PaymentFunctionName = "create-payment" | "create-payment-link" | "check-payment-status";

function getErrorMessage(payload: unknown, status: number) {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (typeof record.error === "string" && record.error) {
      return record.error;
    }

    if (typeof record.message === "string" && record.message) {
      return record.message;
    }
  }

  return `Falha ao processar o pagamento (${status}).`;
}

export async function callPaymentFunction<T = Record<string, unknown>>(
  functionName: PaymentFunctionName,
  body: Record<string, unknown> = {},
): Promise<T> {
  const { data, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error("Não foi possível validar sua sessão. Faça login novamente.");
  }

  const accessToken = data.session?.access_token;

  if (!accessToken) {
    throw new Error("Sua sessão expirou. Faça login novamente para continuar.");
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let payload: unknown = {};

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, response.status));
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (typeof record.error === "string" && record.error) {
      throw new Error(record.error);
    }
  }

  return payload as T;
}