/**
 * Hook genérico para chamar o orquestrador multi-LLM via TanStack Query
 *
 * Exemplo de uso:
 * const { data, isLoading } = useAiQuery({
 *   taskType: "reasoning",
 *   messages: [{ role: "user", content: "Analise estes dados financeiros" }],
 * });
 */
import { useQuery, useMutation } from "@tanstack/react-query";
import type { AiRequest, AiResponse } from "@/lib/ai";

const AI_GATEWAY_URL =
  import.meta.env.VITE_AI_GATEWAY_URL ??
  "https://ai.gateway.lovable.dev/v1/chat/completions";

/** Hook para chamadas GET/READ (uso raro — geralmente IA é mutation) */
export function useAiQuery(
  request: AiRequest,
  apiKey: string,
  enabled = false
) {
  return useQuery<AiResponse, Error>({
    queryKey: ["ai", request.taskType, request.messages],
    queryFn: async () => {
      const res = await fetch(AI_GATEWAY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });
      if (!res.ok) throw new Error(`AI error: ${res.status}`);
      return res.json();
    },
    enabled,
  });
}

/** Hook para chamadas de IA (chat, análise, geração) */
export function useAiMutation(apiKey: string) {
  return useMutation<AiResponse, Error, AiRequest>({
    mutationFn: async (request) => {
      const res = await fetch(AI_GATEWAY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });
      if (!res.ok) throw new Error(`AI error: ${res.status}`);
      return res.json();
    },
  });
}
