/**
 * Cliente HTTP para o Lovable AI Gateway
 *
 * Faz chamadas ao gateway usando o modelo já roteado pelo orquestrador.
 * Lida com retry, timeout e rate-limit.
 */
import type { AiRequest, AiResponse, AiError, ModelConfig } from "@/lib/ai";
import { AI_GATEWAY_URL, DEFAULT_TIMEOUT, MAX_RETRIES } from "@/lib/ai";
import { routeRequest, createAiError, isRetryableError, selectFallback } from "@/lib/ai";

/** Faz uma chamada ao gateway com o modelo roteado */
export async function callGateway(
  request: AiRequest,
  apiKey: string
): Promise<AiResponse> {
  const routing = routeRequest(request);
  const model = routing.model;

  const response = await executeWithModel(request, model, apiKey);

  return {
    ...response,
    modelUsed: response.modelUsed ?? model.model,
    provider: response.provider ?? model.provider,
  };
}

/** Executa a requisição com fallback automático */
async function executeWithModel(
  request: AiRequest,
  model: ModelConfig,
  apiKey: string,
  attempt = 1
): Promise<AiResponse> {
  const hasImage = request.messages.some((m) =>
    Array.isArray(m.content)
      ? m.content.some((c) => c.type === "image_url")
      : false
  );

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    const payload = {
      model: model.model,
      messages: request.messages,
      temperature: request.temperature ?? model.defaultTemperature,
      max_tokens: request.maxTokens,
    };

    const res = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const error = createAiError(await res.text(), res.status);

      // Rate limit ou créditos insuficientes → tenta fallback
      if ((res.status === 429 || res.status === 402) && attempt < MAX_RETRIES) {
        const fallbackModel = selectFallback(model, request.taskType, hasImage);
        if (fallbackModel) {
          console.warn(`[AI] Fallback de ${model.label} para ${fallbackModel.label} (tentativa ${attempt})`);
          const fallbackResponse = await executeWithModel(request, fallbackModel, apiKey, attempt + 1);
          return {
            ...fallbackResponse,
            fallback: true,
            originalModel: model.model,
            fallbackReason: error.message,
          };
        }
      }

      throw error;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    return {
      content,
      modelUsed: model.model,
      provider: model.provider,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens ?? 0,
            completionTokens: data.usage.completion_tokens ?? 0,
            totalTokens: data.usage.total_tokens ?? 0,
          }
        : undefined,
    };
  } catch (err) {
    // Timeout ou erro de rede → tenta fallback
    if (err instanceof Error && err.name === "AbortError" && attempt < MAX_RETRIES) {
      const fallbackModel = selectFallback(model, request.taskType, hasImage);
      if (fallbackModel) {
        console.warn(`[AI] Timeout em ${model.label}, fallback para ${fallbackModel.label}`);
        const fallbackResponse = await executeWithModel(request, fallbackModel, apiKey, attempt + 1);
        return {
          ...fallbackResponse,
          fallback: true,
          originalModel: model.model,
          fallbackReason: "Timeout",
        };
      }
    }

    if ((err as AiError).isRetryable !== undefined) {
      throw err;
    }

    throw createAiError(err instanceof Error ? err.message : String(err));
  }
}

/** Versão simplificada para uso direto (sem roteamento explícito) */
export async function askAI(
  messages: AiRequest["messages"],
  apiKey: string,
  options?: Partial<Omit<AiRequest, "messages">>
): Promise<AiResponse> {
  return callGateway({ messages, taskType: "chat", ...options }, apiKey);
}
