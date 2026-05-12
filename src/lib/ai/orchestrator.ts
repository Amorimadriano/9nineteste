/**
 * Orquestrador Multi-LLM com Roteamento Inteligente
 *
 * Decide qual modelo usar com base no tipo de tarefa e suporta fallback
 * automático caso o modelo primário falhe.
 */
import type { TaskType, AiRequest, AiResponse, AiError, RoutingResult, ModelConfig } from "./types";
import { getModelsForTask, getMultimodalModels, DEFAULT_MODEL } from "./config";

/** Heurística simples: detecta se a mensagem do usuário pede raciocínio complexo */
function detectAdvancedTask(messages: AiRequest["messages"]): TaskType | null {
  const userText = messages
    .filter((m) => m.role === "user")
    .map((m) => (typeof m.content === "string" ? m.content : JSON.stringify(m.content)))
    .join(" ")
    .toLowerCase();

  const reasoningKeywords = [
    "analise", "analisar", "compare", "comparar", "projecao", "projetar",
    "razao", "raciocinio", "logica", "demonstracao", "dre", "indicador",
    "tendencia", "previsao", "forecast", "calcule", "calcular",
  ];
  const codeKeywords = [
    "json", "xml", "codigo", "code", "schema", "estruturado", "formato",
    "regex", "script", "function", "classe", "interface", "type",
  ];
  const creativeKeywords = [
    "redija", "escreva", "crie um texto", "relatorio executivo", "parecer",
    "resumo estrategico", "relatorio completo", "descricao detalhada",
  ];

  if (reasoningKeywords.some((k) => userText.includes(k))) return "reasoning";
  if (codeKeywords.some((k) => userText.includes(k))) return "code";
  if (creativeKeywords.some((k) => userText.includes(k))) return "creative";

  return null;
}

/** Roteia uma requisição para o modelo mais adequado */
export function routeRequest(request: AiRequest): RoutingResult {
  const { taskType, messages, forceModel } = request;

  // Se o usuário forçou um modelo específico, usa ele
  if (forceModel) {
    return {
      model: DEFAULT_MODEL,
      strategy: "task-based",
      reason: `Modelo forçado pelo usuário: ${forceModel}`,
    };
  }

  // Detecta automaticamente o task se não foi informado
  const effectiveTask: TaskType = taskType ?? detectAdvancedTask(messages) ?? "chat";

  // Se for multimodal (tem imagem no payload), prioriza modelos multimodais
  const hasImage = messages.some((m) =>
    Array.isArray(m.content)
      ? m.content.some((c) => c.type === "image_url")
      : false
  );

  let candidates: ModelConfig[];
  if (hasImage) {
    candidates = getMultimodalModels();
  } else {
    candidates = getModelsForTask(effectiveTask);
  }

  const selected = candidates[0] ?? DEFAULT_MODEL;

  return {
    model: selected,
    strategy: "task-based",
    reason: `Task '${effectiveTask}'${hasImage ? " + multimodal" : ""} → ${selected.label} (priority ${selected.priority})`,
  };
}

/** Cria uma resposta de erro padronizada */
export function createAiError(message: string, status?: number): AiError {
  const retryableCodes = [429, 500, 502, 503, 504];
  return {
    code: status ? `HTTP_${status}` : "UNKNOWN_ERROR",
    message,
    status,
    isRetryable: status ? retryableCodes.includes(status) : true,
  };
}

/** Verifica se um erro é recuperável (permite fallback) */
export function isRetryableError(error: AiError): boolean {
  return error.isRetryable;
}

/** Seleciona o próximo modelo da fila para fallback */
export function selectFallback(
  currentModel: ModelConfig,
  taskType: TaskType,
  hasImage: boolean
): ModelConfig | null {
  const candidates = hasImage ? getMultimodalModels() : getModelsForTask(taskType);
  const currentIndex = candidates.findIndex((m) => m.model === currentModel.model);
  const next = candidates[currentIndex + 1];
  return next ?? null;
}
