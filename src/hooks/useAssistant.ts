/**
 * Hook especializado para o Assistente Virtual (Neo)
 *
 * Mantém estado do chat, histórico de mensagens e faz chamadas
 * ao orquestrador multi-LLM com taskType dinâmico.
 */
import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import type { AiRequest, AiResponse, Message, TaskType } from "@/lib/ai";

interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  modelUsed?: string;
  provider?: string;
  fallback?: boolean;
  timestamp: number;
}

interface UseAssistantOptions {
  apiKey: string;
  systemPrompt?: string;
  contextoPagina?: string;
}

/** Gera system prompt com contexto do sistema Nine BPO */
function buildSystemPrompt(userPrompt: string, contextoPagina?: string): string {
  let prompt = `Você é o Neo, assistente virtual do 9Nine Business Control — sistema de gestão financeira para BPO contábil.\n\n`;
  prompt += `REGRAS:\n`;
  prompt += `- Responda em português brasileiro formal e profissional\n`;
  prompt += `- Seja conciso e direto\n`;
  prompt += `- Quando apropriado, sugira navegação para páginas do sistema usando tags como [navegar:/caminho]\n`;
  prompt += `- Use markdown para formatação quando útil\n`;
  prompt += `- Se não souber algo, seja honesto e sugira onde o usuário pode encontrar\n`;

  if (contextoPagina) {
    prompt += `\nCONTEXTO ATUAL: O usuário está na página "${contextoPagina}".\n`;
  }

  return prompt;
}

/** Detecta taskType baseado na pergunta do usuário */
function detectTaskType(question: string): TaskType {
  const q = question.toLowerCase();
  if (q.includes("analis") || q.includes("compare") || q.includes("projec") || q.includes("dre")) {
    return "reasoning";
  }
  if (q.includes("json") || q.includes("codigo") || q.includes("script") || q.includes("formato")) {
    return "code";
  }
  if (q.includes("redija") || q.includes("escreva") || q.includes("relatorio") || q.includes("parecer")) {
    return "creative";
  }
  return "chat";
}

export function useAssistant(options: UseAssistantOptions) {
  const { apiKey, contextoPagina } = options;
  const [messages, setMessages] = useState<AssistantMessage[]>([]);

  const mutation = useMutation<AiResponse, Error, { question: string; history: Message[] }>({
    mutationFn: async ({ question, history }) => {
      const systemPrompt = buildSystemPrompt(question, contextoPagina);

      const requestMessages: Message[] = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: question },
      ];

      const request: AiRequest = {
        taskType: detectTaskType(question),
        messages: requestMessages,
        temperature: 0.5,
      };

      const res = await fetch(
        import.meta.env.VITE_AI_GATEWAY_URL ?? "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erro ${res.status}: ${text}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content ?? "";

      return {
        content,
        modelUsed: data.model ?? "unknown",
        provider: "unknown",
      } as AiResponse;
    },
  });

  const sendMessage = useCallback(
    (question: string) => {
      const userMsg: AssistantMessage = {
        id: Date.now().toString(),
        role: "user",
        content: question,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      const history: Message[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      mutation.mutate(
        { question, history },
        {
          onSuccess: (data) => {
            const botMsg: AssistantMessage = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: data.content,
              modelUsed: data.modelUsed,
              provider: data.provider,
              fallback: data.fallback,
              timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, botMsg]);
          },
        }
      );
    },
    [messages, mutation]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage,
    clearMessages,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
