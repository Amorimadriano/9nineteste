import { supabase } from "@/integrations/supabase/client";

type ManageUsersPayload =
  | { action: "list" }
  | { action: "create"; email: string; password: string }
  | { action: "delete"; userId: string }
  | { action: "ban"; userId: string; banned: boolean }
  | { action: "grant_admin"; userId: string }
  | { action: "revoke_admin"; userId: string }
  | { action: "update_email"; userId: string; email: string };

type ManageUsersErrorResponse = {
  error?: string;
  message?: string;
};

function parseJsonSafely(text: string): ManageUsersErrorResponse | null {
  if (!text) return null;

  try {
    return JSON.parse(text) as ManageUsersErrorResponse;
  } catch {
    return null;
  }
}

function getFriendlyErrorMessage(message: string, status: number) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("already been registered") || normalizedMessage.includes("email_exists")) {
    return "Já existe um usuário com esse e-mail.";
  }

  if (normalizedMessage.includes("não autorizado") || normalizedMessage.includes("unauthorized") || status === 401) {
    return "Sua sessão expirou. Faça login novamente.";
  }

  return message || `Falha ao processar a solicitação (${status}).`;
}

export async function callManageUsers<T>(payload: ManageUsersPayload): Promise<T> {
  const { data, error } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (error || !accessToken) {
    throw new Error("Sua sessão expirou. Faça login novamente.");
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify(payload),
  });

  const rawBody = await response.text();
  const parsedBody = parseJsonSafely(rawBody);

  if (!response.ok) {
    const message = parsedBody?.error || parsedBody?.message || rawBody;
    throw new Error(getFriendlyErrorMessage(message, response.status));
  }

  return (parsedBody ?? {}) as T;
}
