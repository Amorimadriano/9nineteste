/**
 * Edge Function: Orquestrador Multi-LLM
 *
 * Recebe taskType + messages e decide qual modelo chamar no gateway.
 * Suporta fallback automático entre modelos.
 */

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://9ninebusinesscontrol.com.br",
  "https://www.9ninebusinesscontrol.com.br",
  "https://9nineteste.9ninebusinesscontrol.com.br",
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ── Configuração de modelos (espelho do src/lib/ai/config.ts) ──

const MODELS = [
  {
    model: "google/gemini-3-flash-preview",
    provider: "google",
    label: "Gemini 3 Flash",
    primaryTask: "fast",
    fallbackTasks: ["chat", "multimodal"],
    defaultTemperature: 0.7,
    supportsMultimodal: true,
    priority: 1,
  },
  {
    model: "google/gemini-2.5-flash",
    provider: "google",
    label: "Gemini 2.5 Flash",
    primaryTask: "multimodal",
    fallbackTasks: ["fast", "chat"],
    defaultTemperature: 0.1,
    supportsMultimodal: true,
    priority: 2,
  },
  {
    model: "anthropic/claude-sonnet-4-6",
    provider: "anthropic",
    label: "Claude Sonnet 4.6",
    primaryTask: "reasoning",
    fallbackTasks: ["code", "creative", "chat"],
    defaultTemperature: 0.3,
    supportsMultimodal: false,
    priority: 1,
  },
  {
    model: "anthropic/claude-opus-4-7",
    provider: "anthropic",
    label: "Claude Opus 4.7",
    primaryTask: "creative",
    fallbackTasks: ["reasoning", "code"],
    defaultTemperature: 0.5,
    supportsMultimodal: false,
    priority: 1,
  },
  {
    model: "openai/gpt-4o",
    provider: "openai",
    label: "GPT-4o",
    primaryTask: "code",
    fallbackTasks: ["reasoning", "chat", "creative"],
    defaultTemperature: 0.2,
    supportsMultimodal: true,
    priority: 1,
  },
  {
    model: "openai/gpt-4o-mini",
    provider: "openai",
    label: "GPT-4o Mini",
    primaryTask: "chat",
    fallbackTasks: ["fast", "code"],
    defaultTemperature: 0.5,
    supportsMultimodal: false,
    priority: 2,
  },
];

const DEFAULT_MODEL = MODELS[0];
const MAX_RETRIES = 2;
const DEFAULT_TIMEOUT = 30000;

function getModelsForTask(task: string) {
  return MODELS.filter((m) => m.primaryTask === task || m.fallbackTasks.includes(task))
    .sort((a, b) => {
      const aIsPrimary = a.primaryTask === task;
      const bIsPrimary = b.primaryTask === task;
      if (aIsPrimary && !bIsPrimary) return -1;
      if (!aIsPrimary && bIsPrimary) return 1;
      return a.priority - b.priority;
    });
}

function getMultimodalModels() {
  return MODELS.filter((m) => m.supportsMultimodal).sort((a, b) => a.priority - b.priority);
}

function routeRequest(body: any) {
  const taskType = body.taskType || "chat";
  const messages = body.messages || [];
  const forceModel = body.forceModel;

  if (forceModel) {
    return {
      model: DEFAULT_MODEL,
      reason: `Modelo forçado: ${forceModel}`,
    };
  }

  const hasImage = messages.some((m: any) =>
    Array.isArray(m.content)
      ? m.content.some((c: any) => c.type === "image_url")
      : false
  );

  const candidates = hasImage ? getMultimodalModels() : getModelsForTask(taskType);
  const selected = candidates[0] || DEFAULT_MODEL;

  return {
    model: selected,
    reason: `Task '${taskType}'${hasImage ? " + multimodal" : ""} → ${selected.label}`,
  };
}

async function executeWithModel(
  body: any,
  model: typeof MODELS[0],
  apiKey: string,
  attempt = 1
): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const payload = {
      model: model.model,
      messages: body.messages,
      temperature: body.temperature ?? model.defaultTemperature,
      max_tokens: body.maxTokens,
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
      const errText = await res.text();

      // Rate limit / créditos → fallback
      if ((res.status === 429 || res.status === 402) && attempt < MAX_RETRIES) {
        const taskType = body.taskType || "chat";
        const hasImage = (body.messages || []).some((m: any) =>
          Array.isArray(m.content)
            ? m.content.some((c: any) => c.type === "image_url")
            : false
        );
        const candidates = hasImage ? getMultimodalModels() : getModelsForTask(taskType);
        const currentIndex = candidates.findIndex((m) => m.model === model.model);
        const fallbackModel = candidates[currentIndex + 1];

        if (fallbackModel) {
          console.warn(`[AI-Orchestrator] Fallback ${model.label} → ${fallbackModel.label}`);
          const result = await executeWithModel(body, fallbackModel, apiKey, attempt + 1);
          return {
            ...result,
            _meta: {
              ...(result._meta || {}),
              fallback: true,
              originalModel: model.model,
              fallbackReason: errText,
            },
          };
        }
      }

      throw new Error(`Gateway error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    return {
      ...data,
      _meta: {
        modelUsed: model.model,
        provider: model.provider,
        routingReason: `Task '${body.taskType || "chat"}' → ${model.label}`,
      },
    };
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof Error && err.name === "AbortError" && attempt < MAX_RETRIES) {
      const taskType = body.taskType || "chat";
      const hasImage = (body.messages || []).some((m: any) =>
        Array.isArray(m.content)
          ? m.content.some((c: any) => c.type === "image_url")
          : false
      );
      const candidates = hasImage ? getMultimodalModels() : getModelsForTask(taskType);
      const currentIndex = candidates.findIndex((m) => m.model === model.model);
      const fallbackModel = candidates[currentIndex + 1];

      if (fallbackModel) {
        console.warn(`[AI-Orchestrator] Timeout ${model.label} → ${fallbackModel.label}`);
        const result = await executeWithModel(body, fallbackModel, apiKey, attempt + 1);
        return {
          ...result,
          _meta: {
            ...(result._meta || {}),
            fallback: true,
            originalModel: model.model,
            fallbackReason: "Timeout",
          },
        };
      }
    }

    throw err;
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const routing = routeRequest(body);
    const result = await executeWithModel(body, routing.model, apiKey);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-orchestrator error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
