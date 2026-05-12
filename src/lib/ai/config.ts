/**
 * Configuração dos modelos disponíveis no orquestrador multi-LLM
 *
 * Ajuste os modelos e prioridades conforme novos modelos são lançados
 * ou conforme a política de custo da empresa muda.
 */
import type { ModelConfig, TaskType } from "./types";

/** Registro de todos os modelos disponíveis */
export const MODELS: ModelConfig[] = [
  // ── Google Gemini ──
  {
    model: "google/gemini-3-flash-preview",
    provider: "google",
    label: "Gemini 3 Flash",
    primaryTask: "fast",
    fallbackTasks: ["chat", "multimodal"],
    strengths: ["speed", "low_cost", "chat", "multimodal", "portuguese"],
    defaultTemperature: 0.7,
    supportsMultimodal: true,
    isFast: true,
    priority: 1,
  },
  {
    model: "google/gemini-2.5-flash",
    provider: "google",
    label: "Gemini 2.5 Flash",
    primaryTask: "multimodal",
    fallbackTasks: ["fast", "chat"],
    strengths: ["multimodal", "pdf_parsing", "low_cost", "speed"],
    defaultTemperature: 0.1,
    supportsMultimodal: true,
    isFast: true,
    priority: 2,
  },
  // ── Anthropic Claude ──
  {
    model: "anthropic/claude-sonnet-4-6",
    provider: "anthropic",
    label: "Claude Sonnet 4.6",
    primaryTask: "reasoning",
    fallbackTasks: ["code", "creative", "chat"],
    strengths: ["logic", "reasoning", "code", "analysis", "long_context"],
    defaultTemperature: 0.3,
    supportsMultimodal: false,
    isFast: false,
    priority: 1,
  },
  {
    model: "anthropic/claude-opus-4-7",
    provider: "anthropic",
    label: "Claude Opus 4.7",
    primaryTask: "creative",
    fallbackTasks: ["reasoning", "code"],
    strengths: ["creativity", "deep_reasoning", "code", "complex_analysis"],
    defaultTemperature: 0.5,
    supportsMultimodal: false,
    isFast: false,
    priority: 1,
  },
  // ── OpenAI ──
  {
    model: "openai/gpt-4o",
    provider: "openai",
    label: "GPT-4o",
    primaryTask: "code",
    fallbackTasks: ["reasoning", "chat", "creative"],
    strengths: ["json", "structured_output", "code", "tool_use", "speed"],
    defaultTemperature: 0.2,
    supportsMultimodal: true,
    isFast: false,
    priority: 1,
  },
  {
    model: "openai/gpt-4o-mini",
    provider: "openai",
    label: "GPT-4o Mini",
    primaryTask: "chat",
    fallbackTasks: ["fast", "code"],
    strengths: ["low_cost", "chat", "json", "speed"],
    defaultTemperature: 0.5,
    supportsMultimodal: false,
    isFast: true,
    priority: 2,
  },
];

/** Modelo padrão quando nenhum taskType é especificado */
export const DEFAULT_MODEL = MODELS.find((m) => m.model === "google/gemini-3-flash-preview") ?? MODELS[0];

/** URL do gateway de IA (pode ser sobrescrita via env) */
export const AI_GATEWAY_URL =
  import.meta.env?.VITE_AI_GATEWAY_URL ??
  "https://ai.gateway.lovable.dev/v1/chat/completions";

/** Timeout padrão para requisições (ms) */
export const DEFAULT_TIMEOUT = 30000;

/** Número máximo de tentativas (incluindo fallback) */
export const MAX_RETRIES = 2;

/** Mapeamento direto task → modelos ordenados por prioridade */
export function getModelsForTask(task: TaskType): ModelConfig[] {
  return MODELS.filter((m) => m.primaryTask === task || m.fallbackTasks.includes(task)).sort(
    (a, b) => {
      // Primary task tem prioridade sobre fallback
      const aIsPrimary = a.primaryTask === task;
      const bIsPrimary = b.primaryTask === task;
      if (aIsPrimary && !bIsPrimary) return -1;
      if (!aIsPrimary && bIsPrimary) return 1;
      // Mesmo nível: ordena por priority (menor = melhor)
      return a.priority - b.priority;
    }
  );
}

/** Lista de modelos que suportam multimodal, ordenados */
export function getMultimodalModels(): ModelConfig[] {
  return MODELS.filter((m) => m.supportsMultimodal).sort((a, b) => a.priority - b.priority);
}
