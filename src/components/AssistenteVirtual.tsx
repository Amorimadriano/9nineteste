/**
 * Assistente Virtual do Sistema - 9Nine Business Control
 * Agente de IA multi-modelo com roteamento inteligente
 */
import { useState, useRef, useEffect } from "react";
import {
  MessageCircle, X, Send, Bot, User, Sparkles, ChevronRight,
  Lightbulb, ArrowRight, HelpCircle, Zap, Brain, Code, Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAssistant } from "@/hooks/useAssistant";

interface AcaoRapida {
  label: string;
  path: string;
  icone: React.ReactNode;
  descricao: string;
}

const ACOES_RAPIDAS: AcaoRapida[] = [
  {
    label: "Contas a Receber",
    path: "/contas-receber",
    icone: <ArrowRight className="h-4 w-4" />,
    descricao: "Cadastre e acompanhe receitas",
  },
  {
    label: "Contas a Pagar",
    path: "/contas-pagar",
    icone: <ArrowRight className="h-4 w-4" />,
    descricao: "Gerencie despesas e fornecedores",
  },
  {
    label: "Conciliação",
    path: "/conciliacao-bancaria",
    icone: <ArrowRight className="h-4 w-4" />,
    descricao: "Importe e concilie extratos",
  },
  {
    label: "DRE",
    path: "/dre",
    icone: <ArrowRight className="h-4 w-4" />,
    descricao: "Demonstração de resultados",
  },
  {
    label: "Fluxo de Caixa",
    path: "/fluxo-caixa",
    icone: <ArrowRight className="h-4 w-4" />,
    descricao: "Análise de entradas e saídas",
  },
  {
    label: "Clientes",
    path: "/clientes",
    icone: <ArrowRight className="h-4 w-4" />,
    descricao: "Cadastro de tomadores",
  },
];

const MENSAGEM_INICIAL = `👋 **Olá! Sou o Neo**, seu assistente virtual do 9Nine Business Control.

Estou aqui para te ajudar com:

📚 **Explicar funcionalidades** do sistema
🎯 **Guiar** em fluxos e processos
💡 **Analisar** dados financeiros
🔍 **Navegar** com você pelas páginas

**Como posso ajudar você hoje?**`;

/** Indicador visual do modelo usado */
function ModelBadge({ model, provider, fallback }: { model?: string; provider?: string; fallback?: boolean }) {
  if (!model) return null;
  const isGemini = model.includes("gemini");
  const isClaude = model.includes("claude");
  const isGPT = model.includes("gpt");

  const icon = isGemini ? <Zap className="h-3 w-3" /> : isClaude ? <Brain className="h-3 w-3" /> : isGPT ? <Code className="h-3 w-3" /> : <Wand2 className="h-3 w-3" />;
  const color = isGemini ? "bg-blue-100 text-blue-700" : isClaude ? "bg-orange-100 text-orange-700" : isGPT ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700";

  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium mt-1", color)}>
      {icon}
      {model.split("/").pop()}
      {fallback && <span className="text-red-500" title="Fallback">(FB)</span>}
    </span>
  );
}

export function AssistenteVirtual() {
  const [aberto, setAberto] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [mostrarAcoes, setMostrarAcoes] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const apiKey = import.meta.env.VITE_LOVABLE_API_KEY ?? "";

  const { messages, sendMessage, isLoading, clearMessages } = useAssistant({
    apiKey,
    contextoPagina: window.location.pathname,
  });

  // Scroll automático
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Iniciar conversa quando abrir
  useEffect(() => {
    if (aberto && messages.length === 0 && !isLoading) {
      // Mensagem inicial é estática (não gasta tokens)
    }
  }, [aberto, messages.length, isLoading]);

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    setMostrarAcoes(false);
    sendMessage(inputValue);
    setInputValue("");
  };

  const handleAcaoClick = (path: string) => {
    navigate(path);
    setAberto(false);
  };

  const toggleChat = () => {
    setAberto(!aberto);
    if (!aberto) {
      setMostrarAcoes(true);
    }
  };

  const handleClear = () => {
    clearMessages();
    setMostrarAcoes(true);
  };

  return (
    <>
      {/* Botão flutuante */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        <Button
          onClick={toggleChat}
          size="lg"
          className={cn(
            "h-14 w-14 rounded-full shadow-2xl transition-all duration-300",
            aberto
              ? "bg-gray-600 hover:bg-gray-700 rotate-90"
              : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 hover:scale-110"
          )}
        >
          {aberto ? (
            <X className="h-6 w-6" />
          ) : (
            <div className="relative">
              <HelpCircle className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
            </div>
          )}
        </Button>
      </div>

      {/* Chat */}
      {aberto && (
        <div className="fixed bottom-24 right-6 z-50 w-[420px] max-w-[calc(100vw-48px)] bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/30">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white flex items-center gap-2">
                  Neo
                  <Sparkles className="h-4 w-4 text-yellow-300" />
                </h3>
                <p className="text-emerald-100 text-xs">Assistente Multi-IA • Roteamento Inteligente</p>
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    onClick={handleClear}
                    className="text-xs text-white/70 hover:text-white underline"
                    title="Limpar conversa"
                  >
                    Limpar
                  </button>
                )}
                <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-emerald-100">Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mensagens */}
          <div
            ref={scrollRef}
            className="flex-1 max-h-[450px] overflow-y-auto p-4 space-y-4 bg-gray-50/50"
          >
            {/* Mensagem inicial */}
            {messages.length === 0 && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-emerald-500 to-teal-500">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm bg-white border border-gray-200 text-gray-700 rounded-bl-md shadow-sm">
                  <div className="prose prose-sm max-w-none whitespace-pre-line">
                    {MENSAGEM_INICIAL}
                  </div>

                  {/* Ações rápidas */}
                  {mostrarAcoes && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-gray-500 font-medium">Ações rápidas:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {ACOES_RAPIDAS.slice(0, 4).map((acao) => (
                          <button
                            key={acao.path}
                            onClick={() => handleAcaoClick(acao.path)}
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-xl text-left transition-all group"
                          >
                            <span className="text-emerald-500">{acao.icone}</span>
                            <div>
                              <span className="text-xs text-gray-700 font-medium block">{acao.label}</span>
                              <span className="text-[10px] text-gray-400">{acao.descricao}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mensagens do chat */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    msg.role === "user"
                      ? "bg-emerald-600"
                      : "bg-gradient-to-br from-emerald-500 to-teal-500"
                  )}
                >
                  {msg.role === "user" ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <Bot className="h-4 w-4 text-white" />
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                    msg.role === "user"
                      ? "bg-emerald-500 text-white rounded-br-md"
                      : "bg-white border border-gray-200 text-gray-700 rounded-bl-md shadow-sm"
                  )}
                >
                  <div className="prose prose-sm max-w-none whitespace-pre-line">
                    {msg.content}
                  </div>
                  {msg.role === "assistant" && (
                    <ModelBadge model={msg.modelUsed} provider={msg.provider} fallback={msg.fallback} />
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-emerald-500 to-teal-500">
                  <Bot className="h-4 w-4 text-white animate-bounce" />
                </div>
                <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm bg-white border border-gray-200 rounded-bl-md shadow-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Sparkles className="h-4 w-4 animate-spin" />
                    <span>Neo está pensando...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleInputSubmit} className="p-4 bg-white border-t border-gray-100">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Digite sua dúvida aqui..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" className="bg-emerald-500 hover:bg-emerald-600" disabled={isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              💡 Neo usa roteamento inteligente — Gemini, Claude ou GPT conforme a tarefa
            </p>
          </form>
        </div>
      )}
    </>
  );
}
