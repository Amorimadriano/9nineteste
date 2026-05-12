export const PAGARME_V5_URL = "https://api.pagar.me/core/v5";

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

export function getPagarmeSecretKey() {
  const secretKey = Deno.env.get("PAGARME_API_KEY")?.trim();

  if (!secretKey) {
    throw new Error("PAGARME_API_KEY not configured");
  }

  if (!secretKey.startsWith("sk_")) {
    throw new Error("PAGARME_API_KEY inválida. Configure a SecretKey (sk_ ou sk_test_) da Pagar.me.");
  }

  return secretKey;
}

export function getPagarmeBasicAuth(secretKey = getPagarmeSecretKey()) {
  return `Basic ${globalThis.btoa(`${secretKey}:`)}`;
}

async function parseResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export function extractPagarmeError(payload: PagarmePayload = {}) {
  if (typeof payload.message === "string" && payload.message) {
    return payload.message;
  }

  if (typeof payload.error === "string" && payload.error) {
    return payload.error;
  }

  if (Array.isArray(payload.errors)) {
    for (const item of payload.errors) {
      if (typeof item === "string" && item) {
        return item;
      }

      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;

        if (typeof record.message === "string" && record.message) {
          return record.message;
        }
      }
    }
  }

  return "Erro desconhecido";
}

export async function pagarmeRequest(path: string, init: RequestInit = {}) {
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
