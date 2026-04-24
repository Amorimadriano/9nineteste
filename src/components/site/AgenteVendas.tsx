/**
 * Agente Virtual de Vendas - 9Nine Business Control
 * Chatbot flutuante para captar leads e oferecer os serviços
 */
import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Sparkles, ChevronRight, Phone, Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Mensagem {
  id: string;
  tipo: "bot" | "usuario" | "acao";
  texto: string;
  opcoes?: Opcao[];
  campo?: "nome" | "email" | "telefone" | "empresa";
}

interface Opcao {
  label: string;
  valor: string;
  icone?: React.ReactNode;
}

interface LeadData {
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  interesse: string;
  tamanhoEmpresa: string;
  urgencia: string;
}

const FLUXO_CONVERSA = {
  inicio: {
    mensagem: "Olá! 👋 Sou o **Victor**, consultor virtual da **9Nine Business Control**.\n\nEstou aqui para ajudar sua empresa a ter mais controle financeiro e eficiência operacional. Como posso ajudar você hoje?",
    opcoes: [
      { label: "Conhecer o sistema ERP", valor: "erp" },
      { label: "BPO Financeiro", valor: "bpo" },
      { label: "Consultoria Financeira", valor: "consultoria" },
      { label: "Ver demonstração", valor: "demo" },
    ],
  },
  erp: {
    mensagem: "Excelente escolha! 🎯\n\nNosso **9Nine Business Control** é um sistema ERP financeiro completo desenvolvido internamente. Ele inclui:\n\n✅ Dashboard em tempo real\n✅ Controle de contas a pagar/receber\n✅ Conciliação bancária e de cartões\n✅ DRE e fluxo de caixa automatizados\n✅ Planejamento orçamentário\n✅ Integração com contador\n✅ Régua de cobrança inteligente\n\nQual o tamanho da sua empresa?",
    opcoes: [
      { label: "MEI / Autônomo", valor: "mei" },
      { label: "Pequena empresa", valor: "pequena" },
      { label: "Média empresa", valor: "media" },
      { label: "Grande empresa", valor: "grande" },
    ],
  },
  bpo: {
    mensagem: "Perfeito! 💼\n\nNosso **BPO Financeiro** é ideal para empresas que querem terceirizar a gestão financeira com profissionais especializados. Inclui:\n\n✅ Gestão de contas a pagar e receber\n✅ Conciliação bancária diária\n✅ Fluxo de caixa atualizado\n✅ Relatórios gerenciais mensais\n✅ Cobrança e negociação com clientes\n✅ Integração com seu sistema atual\n\nVocê precisa de BPO completo ou suporte parcial?",
    opcoes: [
      { label: "BPO Completo", valor: "bpo_completo" },
      { label: "Suporte Parcial", valor: "bpo_parcial" },
      { label: "Quero saber mais", valor: "bpo_info" },
    ],
  },
  consultoria: {
    mensagem: "Ótimo! 📊\n\nNossa **Consultoria Financeira Empresarial** ajuda empresas a tomarem decisões estratégicas baseadas em dados. Oferecemos:\n\n✅ Análise de viabilidade de projetos\n✅ Reestruturação financeira\n✅ Planejamento tributário\n✅ Indicadores de performance (KPIs)\n✅ Planejamento estratégico\n✅ Análise de ponto de equilíbrio\n\nQual é sua principal necessidade atual?",
    opcoes: [
      { label: "Organizar finanças", valor: "organizar" },
      { label: "Reduzir custos", valor: "cortar_custos" },
      { label: "Crescer empresa", valor: "crescer" },
      { label: "Resolver crise", valor: "crise" },
    ],
  },
  demo: {
    mensagem: "Maravilha! 🚀\n\nVou adorar mostrar nosso sistema em ação. A demonstração dura cerca de 30 minutos e podemos fazer:\n\n📅 Online (Google Meet/Zoom)\n📱 WhatsApp Video\n🏢 Presencial (se em São Paulo)\n\nQual sua preferência?",
    opcoes: [
      { label: "Vídeo Online", valor: "demo_online" },
      { label: "WhatsApp", valor: "demo_whatsapp" },
      { label: "Presencial", valor: "demo_presencial" },
    ],
  },
  coletar_dados: {
    mensagem: "Para que eu possa direcionar você ao consultor mais adequado e preparar uma proposta personalizada, preciso de alguns dados.\n\nQual seu **nome completo**?",
    campo: "nome",
  },
  coletar_email: {
    mensagem: "Obrigado! Agora, qual seu **e-mail corporativo**?",
    campo: "email",
  },
  coletar_telefone: {
    mensagem: "Perfeito! E seu **telefone/WhatsApp**?",
    campo: "telefone",
  },
  coletar_empresa: {
    mensagem: "Por último, qual o **nome da sua empresa**?",
    campo: "empresa",
  },
  finalizacao: {
    mensagem: "🎉 **Obrigado pelas informações!**\n\nNossa equipe comercial entrará em contato em **até 2 horas úteis** para apresentar uma proposta personalizada.\n\nVocê também pode:\n\n📱 Falar direto pelo WhatsApp\n📧 Enviar e-mail para contato@9ninebusinesscontrol.com.br\n📅 Agendar sua demonstração agora",
    opcoes: [
      { label: "📱 Chamar no WhatsApp", valor: "whatsapp", icone: <Phone className="h-4 w-4" /> },
      { label: "📅 Agendar Demonstração", valor: "agendar", icone: <Calendar className="h-4 w-4" /> },
      { label: "📧 Enviar E-mail", valor: "email", icone: <Mail className="h-4 w-4" /> },
    ],
  },
};

const MENSAGENS_SEGUINTES: Record<string, { mensagem: string; proximo?: string; opcoes?: Opcao[] }> = {
  mei: {
    mensagem: "Entendido! Para MEIs e autônomos, temos planos a partir de R$ 97/mês. Você terá acesso a todas as funcionalidades essenciais para organizar suas finanças.\n\nQual próximo passo?",
    opcoes: [
      { label: "Quero uma proposta", valor: "coletar_dados" },
      { label: "Ver demonstração", valor: "demo" },
    ],
  },
  pequena: {
    mensagem: "Ótimo! Para pequenas empresas, nosso sistema é perfeito para organizar o financeiro sem complicação. Planos a partir de R$ 197/mês.\n\nQual próximo passo?",
    opcoes: [
      { label: "Quero uma proposta", valor: "coletar_dados" },
      { label: "Ver demonstração", valor: "demo" },
    ],
  },
  media: {
    mensagem: "Excelente! Empresas de médio porte costumam economizar até 40% do tempo gasto em tarefas financeiras com nosso sistema. Planos sob medida.\n\nQual próximo passo?",
    opcoes: [
      { label: "Quero uma proposta", valor: "coletar_dados" },
      { label: "Ver demonstração", valor: "demo" },
    ],
  },
  grande: {
    mensagem: "Perfeito! Para grandes empresas, oferecemos soluções personalizadas com integrações específicas, API dedicada e suporte prioritário. Vamos preparar uma proposta exclusiva?",
    opcoes: [
      { label: "Sim, quero proposta personalizada", valor: "coletar_dados" },
      { label: "Falar com executivo", valor: "coletar_dados" },
    ],
  },
  bpo_completo: {
    mensagem: "Excelente escolha! Com o BPO completo, sua empresa terá um departamento financeiro terceirizado com profissionais especializados. Reduza custos e ganhe eficiência.\n\nVamos preparar uma proposta?",
    proximo: "coletar_dados",
  },
  bpo_parcial: {
    mensagem: "Perfeito! No suporte parcial, você escolhe quais processos quer terceirizar. Flexibilidade total para sua necessidade.\n\nVamos preparar uma proposta?",
    proximo: "coletar_dados",
  },
  bpo_info: {
    mensagem: "Claro! O BPO Financeiro é a terceirização do seu departamento financeiro. Você terceiriza toda a operação ou apenas partes específicas, pagando apenas pelo que usar.\n\nQuer saber mais detalhes?",
    opcoes: [
      { label: "Sim, quero uma proposta", valor: "coletar_dados" },
      { label: "Ver demonstração", valor: "demo" },
    ],
  },
  organizar: {
    mensagem: "Entendo perfeitamente! Muitas empresas têm o financeiro 'na cabeça' ou em planilhas desorganizadas. Nossa consultoria pode estruturar tudo em 30 dias.\n\nVamos conversar melhor sobre sua situação?",
    proximo: "coletar_dados",
  },
  cortar_custos: {
    mensagem: "Smart! 💡 Nossa análise de custos já ajudou empresas a identificar desperdícios de até 25% do faturamento. Quer descobrir o potencial de economia na sua empresa?",
    proximo: "coletar_dados",
  },
  crescer: {
    mensagem: "Admirável! 🚀 Para crescer de forma sustentável, o financeiro precisa acompanhar. Nosso planejamento estratégico pode ser o diferencial. Vamos conversar?",
    proximo: "coletar_dados",
  },
  crise: {
    mensagem: "Entendo a urgência. Nossa consultoria de reestruturação financeira já ajudou dezenas de empresas a sair da crise. Vamos analisar sua situação com prioridade?",
    proximo: "coletar_dados",
  },
  demo_online: {
    mensagem: "Perfeito! A demonstração online é rápida, prática e sem compromisso. Dura cerca de 30 minutos.\n\nVou coletar seus dados para nosso consultor entrar em contato e agendar o melhor horário.",
    proximo: "coletar_dados",
  },
  demo_whatsapp: {
    mensagem: "Ótimo! Podemos fazer uma demonstração por vídeo no WhatsApp. É mais rápido e direto.\n\nVou coletar seus dados para nosso consultor agendar.",
    proximo: "coletar_dados",
  },
  demo_presencial: {
    mensagem: "Maravilha! Se estiver em São Paulo ou região metropolitana, podemos ir até você. Também recebemos visitas na Av. Paulista, 1842.\n\nVou coletar seus dados para verificar disponibilidade.",
    proximo: "coletar_dados",
  },
};

export function AgenteVendas() {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [leadData, setLeadData] = useState<Partial<LeadData>>({});
  const [etapaColeta, setEtapaColeta] = useState<keyof LeadData | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [notificacao, setNotificacao] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Iniciar conversa automaticamente quando abrir
  useEffect(() => {
    if (aberto && mensagens.length === 0) {
      iniciarConversa();
    }
  }, [aberto]);

  // Scroll automático
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensagens]);

  // Mostrar notificação após 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!aberto) {
        setNotificacao(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const iniciarConversa = () => {
    const fluxo = FLUXO_CONVERSA.inicio;
    adicionarMensagemBot(fluxo.mensagem, fluxo.opcoes);
  };

  const adicionarMensagemBot = (texto: string, opcoes?: Opcao[]) => {
    setCarregando(true);
    setTimeout(() => {
      setMensagens((prev) => [
        ...prev,
        { id: Date.now().toString(), tipo: "bot", texto: texto, opcoes },
      ]);
      setCarregando(false);
    }, 600);
  };

  const adicionarMensagemUsuario = (texto: string) => {
    setMensagens((prev) => [
      ...prev,
      { id: Date.now().toString(), tipo: "usuario", texto },
    ]);
  };

  const handleOpcaoClick = (valor: string) => {
    // Encontrar o label da opção
    const msgAtual = mensagens[mensagens.length - 1];
    const opcao = msgAtual.opcoes?.find((o) => o.valor === valor);
    const label = opcao?.label || valor;

    adicionarMensagemUsuario(label);

    // Processar resposta
    processarResposta(valor);
  };

  const processarResposta = (valor: string) => {
    // Verificar se é um fluxo de coleta de dados
    if (valor === "coletar_dados") {
      setEtapaColeta("nome");
      const fluxo = FLUXO_CONVERSA.coletar_dados;
      adicionarMensagemBot(fluxo.mensagem);
      return;
    }

    // Verificar se é ação final
    if (valor === "whatsapp") {
      const msg = `Olá! Sou ${leadData.nome} da empresa ${leadData.empresa}. Tenho interesse em conhecer o 9Nine Business Control. Podemos conversar?`;
      window.open(`https://wa.me/5511960012210?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
      return;
    }

    if (valor === "email") {
      const subject = "Interesse no 9Nine Business Control";
      const body = `Olá,\n\nMeu nome é ${leadData.nome} da empresa ${leadData.empresa}.\nGostaria de receber mais informações sobre o sistema.\n\nTelefone: ${leadData.telefone}\nE-mail: ${leadData.email}`;
      window.open(`mailto:contato@9ninebusinesscontrol.com.br?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
      return;
    }

    if (valor === "agendar") {
      const msg = `Olá! Sou ${leadData.nome} da empresa ${leadData.empresa}. Gostaria de agendar uma demonstração do sistema. Qual a disponibilidade de vocês?`;
      window.open(`https://wa.me/5511960012210?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
      return;
    }

    // Verificar mensagens seguintes
    const seguinte = MENSAGENS_SEGUINTES[valor];
    if (seguinte) {
      setTimeout(() => {
        if (seguinte.proximo === "coletar_dados") {
          setEtapaColeta("nome");
          const fluxo = FLUXO_CONVERSA.coletar_dados;
          adicionarMensagemBot(seguinte.mensagem);
        } else if (seguinte.opcoes) {
          adicionarMensagemBot(seguinte.mensagem, seguinte.opcoes);
        } else {
          adicionarMensagemBot(seguinte.mensagem);
        }
      }, 500);
      return;
    }

    // Fluxos principais
    if (FLUXO_CONVERSA[valor as keyof typeof FLUXO_CONVERSA]) {
      const fluxo = FLUXO_CONVERSA[valor as keyof typeof FLUXO_CONVERSA] as any;
      setTimeout(() => {
        adicionarMensagemBot(fluxo.mensagem, fluxo.opcoes);
      }, 500);
    }
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    adicionarMensagemUsuario(inputValue);
    setInputValue("");

    // Processar coleta de dados
    if (etapaColeta) {
      const valor = inputValue.trim();
      setLeadData((prev) => ({ ...prev, [etapaColeta]: valor }));

      setTimeout(() => {
        if (etapaColeta === "nome") {
          setEtapaColeta("email");
          adicionarMensagemBot(FLUXO_CONVERSA.coletar_email.mensagem);
        } else if (etapaColeta === "email") {
          setEtapaColeta("telefone");
          adicionarMensagemBot(FLUXO_CONVERSA.coletar_telefone.mensagem);
        } else if (etapaColeta === "telefone") {
          setEtapaColeta("empresa");
          adicionarMensagemBot(FLUXO_CONVERSA.coletar_empresa.mensagem);
        } else if (etapaColeta === "empresa") {
          setEtapaColeta(null);
          setLeadData((prev) => ({ ...prev, empresa: valor }));
          // Enviar dados para o backend ou email
          enviarLeadParaSupabase({ ...leadData, empresa: valor } as LeadData);
          adicionarMensagemBot(FLUXO_CONVERSA.finalizacao.mensagem, FLUXO_CONVERSA.finalizacao.opcoes);
        }
      }, 500);
    }
  };

  const enviarLeadParaSupabase = async (lead: LeadData) => {
    try {
      // Tentar enviar para uma tabela de leads (se existir)
      const { supabase } = await import("@/integrations/supabase/client");
      const client: any = supabase;
      await client.from("site_leads").insert({
        nome: lead.nome,
        email: lead.email,
        telefone: lead.telefone,
        empresa: lead.empresa,
        interesse: lead.interesse || "Geral",
        origem: "agente_virtual",
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      // Silenciar erro - os dados já foram coletados e o usuário foi notificado
      console.log("Lead coletado:", lead);
    }
  };

  const toggleChat = () => {
    setAberto(!aberto);
    setNotificacao(false);
  };

  return (
    <>
      {/* Botão flutuante */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* Notificação */}
        {notificacao && !aberto && (
          <div
            onClick={toggleChat}
            className="bg-white rounded-2xl shadow-xl p-4 mb-2 cursor-pointer animate-bounce hover:scale-105 transition-transform border border-blue-100 max-w-[280px]"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Victor da 9Nine</p>
                <p className="text-xs text-gray-500">Olá! Posso ajudar você a conhecer nosso sistema? 👋</p>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setNotificacao(false); }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-gray-400 hover:bg-gray-500 rounded-full flex items-center justify-center text-white text-xs"
            >
              ×
            </button>
          </div>
        )}

        <Button
          onClick={toggleChat}
          size="lg"
          className={cn(
            "h-14 w-14 rounded-full shadow-2xl transition-all duration-300",
            aberto
              ? "bg-gray-600 hover:bg-gray-700 rotate-90"
              : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 hover:scale-110"
          )}
        >
          {aberto ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Chat */}
      {aberto && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] bg-white rounded-3xl shadow-2xl border border-blue-100 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white flex items-center gap-2">
                  Victor
                  <Sparkles className="h-4 w-4 text-yellow-300" />
                </h3>
                <p className="text-blue-100 text-xs">Consultor Virtual 9Nine</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-blue-100">Online</span>
              </div>
            </div>
          </div>

          {/* Mensagens */}
          <div
            ref={scrollRef}
            className="flex-1 max-h-[400px] overflow-y-auto p-4 space-y-4 bg-gray-50/50"
          >
            {mensagens.length === 0 && (
              <div className="flex items-center justify-center h-20 text-gray-400 text-sm">
                Iniciando conversa...
              </div>
            )}

            {mensagens.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3",
                  msg.tipo === "usuario" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    msg.tipo === "usuario"
                      ? "bg-blue-600"
                      : "bg-gradient-to-br from-blue-500 to-blue-600"
                  )}
                >
                  {msg.tipo === "usuario" ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <Bot className="h-4 w-4 text-white" />
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                    msg.tipo === "usuario"
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-white border border-gray-200 text-gray-700 rounded-bl-md shadow-sm"
                  )}
                >
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: msg.texto
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\n/g, "<br />"),
                    }}
                  />

                  {/* Opções */}
                  {msg.opcoes && msg.opcoes.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.opcoes.map((opcao) => (
                        <button
                          key={opcao.valor}
                          onClick={() => handleOpcaoClick(opcao.valor)}
                          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl text-left transition-all group"
                        >
                          <span className="text-sm text-gray-700 font-medium">
                            {opcao.label}
                          </span>
                          {opcao.icone || (
                            <ChevronRight className="h-4 w-4 text-blue-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Indicador de digitação */}
            {carregando && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          {etapaColeta && (
            <form onSubmit={handleInputSubmit} className="p-4 bg-white border-t border-gray-100">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={
                    etapaColeta === "nome"
                      ? "Digite seu nome completo..."
                      : etapaColeta === "email"
                      ? "seu@email.com"
                      : etapaColeta === "telefone"
                      ? "(11) 99999-9999"
                      : "Nome da sua empresa"
                  }
                  className="flex-1"
                  autoFocus
                />
                <Button type="submit" size="icon" className="bg-blue-600 hover:bg-blue-700">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          )}

          {/* Footer */}
          <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-[10px] text-gray-400">
              Powered by 9Nine Business Control
            </p>
          </div>
        </div>
      )}
    </>
  );
}
