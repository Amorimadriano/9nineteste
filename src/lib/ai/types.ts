/**
 * Tipos do sistema de orquestração multi-LLM
 */

export type TaskType =
  | "fast"        // Respostas rápidas, chat simples, baixo custo
  | "chat"        // Conversação contínua, interativa
  | "reasoning"   // Raciocínio complexo, análise financeira, lógica
  | "code"        // Geração de código, JSON estruturado, schemas
  | "multimodal"  // Processamento de imagens, PDFs, inputs visuais
  | "creative";   // Textos criativos, copy, redação

export type ModelProvider = "google" | "anthropic" | "openai";

export interface ModelConfig {
  /** Identificador completo do modelo no gateway (ex: google/gemini-3-flash-preview) */
  model: string;
  /** Provider de origem */
  provider: ModelProvider;
  /** Nome amigável para logs/UI */
  label: string;
  /** Task primária que este modelo executa melhor */
  primaryTask: TaskType;
  /** Outras tasks que este modelo suporta, em ordem de prioridade */
  fallbackTasks: TaskType[];
  /** Forças do modelo (usado para roteamento inteligente) */
  strengths: string[];
  /** Temperatura padrão recomendada */
  defaultTemperature: number;
  /** Indica se suporta multimodal (imagens, PDF) */
  supportsMultimodal: boolean;
  /** Indica se é rápido/baixo custo */
  isFast: boolean;
  /** Ordem de preferência quando múltiplos modelos atendem a mesma task (menor = preferido) */
  priority: number;
}

export interface Message {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
}

export interface AiRequest {
  /** Tipo de tarefa para roteamento */
  taskType: TaskType;
  /** Mensagens no formato OpenAI chat */
  messages: Message[];
  /** Temperatura (0-1). Se não informado, usa a do modelo */
  temperature?: number;
  /** Máximo de tokens na resposta */
  maxTokens?: number;
  /** Forçar uso de um modelo específico (bypass no roteamento) */
  forceModel?: string;
}

export interface AiResponse {
  /** Texto gerado pelo modelo */
  content: string;
  /** Modelo que realmente processou a requisição */
  modelUsed: string;
  /** Provider do modelo usado */
  provider: ModelProvider;
  /** Se houve fallback de outro modelo */
  fallback?: boolean;
  /** Modelo originalmente tentado (se fallback ocorreu) */
  originalModel?: string;
  /** Motivo do fallback (se ocorreu) */
  fallbackReason?: string;
  /** Tokens usados (se disponível) */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AiError {
  code: string;
  message: string;
  status?: number;
  /** Indica se o erro é recuperável (pode tentar fallback) */
  isRetryable: boolean;
}

export type RoutingStrategy = "task-based" | "cost-optimized" | "quality-optimized";

export interface RoutingResult {
  model: ModelConfig;
  strategy: RoutingStrategy;
  reason: string;
}
