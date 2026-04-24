/**
 * Assistente Virtual do Sistema - 9Nine Business Control
 * Agente de IA especialista em orientar usuários no ERP
 */
import { useState, useRef, useEffect } from "react";
import {
  MessageCircle, X, Send, Bot, User, Sparkles, ChevronRight,
  BookOpen, Lightbulb, ArrowRight, HelpCircle, Search, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface Mensagem {
  id: string;
  tipo: "bot" | "usuario" | "acao";
  texto: string;
  opcoes?: Opcao[];
  acoes?: AcaoRapida[];
  campoBusca?: boolean;
}

interface Opcao {
  label: string;
  valor: string;
  icone?: React.ReactNode;
  descricao?: string;
}

interface AcaoRapida {
  label: string;
  path: string;
  icone: React.ReactNode;
  descricao: string;
}

interface ContextoPagina {
  path: string;
  titulo: string;
  dicas: string[];
  fluxos: { label: string; passos: string[] }[];
}

const CONTEXTO_SISTEMA: Record<string, ContextoPagina> = {
  "/": {
    titulo: "Dashboard",
    path: "/",
    dicas: [
      "O Dashboard mostra visão geral das suas finanças em tempo real",
      "Você pode clicar em qualquer card para ver detalhes",
      "Use os filtros de período para ajustar os dados exibidos",
      "O gráfico de fluxo de caixa ajuda a visualizar tendências",
    ],
    fluxos: [
      {
        label: "Análise rápida do mês",
        passos: [
          "Verifique o saldo geral no topo",
          "Analise receitas vs despesas",
          "Confira as contas a vencer nos próximos 7 dias",
          "Clique em 'Ver detalhes' para aprofundar",
        ],
      },
    ],
  },
  "/contas-receber": {
    titulo: "Contas a Receber",
    path: "/contas-receber",
    dicas: [
      "Cadastre todas as vendas/comissões como contas a receber",
      "Use a coluna 'Cliente' para vincular ao cadastro",
      "Marque como 'recebida' quando o pagamento entrar",
      "A conciliação bancária pode fazer isso automaticamente",
    ],
    fluxos: [
      {
        label: "Cadastrar nova conta a receber",
        passos: [
          "Clique no botão '+ Nova Conta'",
          "Preencha descrição, valor e data de vencimento",
          "Selecione o cliente (cadastre se for novo)",
          "Escolha a forma de pagamento",
          "Clique em 'Salvar'",
        ],
      },
      {
        label: "Dar baixa em conta recebida",
        passos: [
          "Localize a conta na lista",
          "Clique no ícone de check (✓) ou 'Receber'",
          "Informe a data de recebimento",
          "Selecione o banco/cartão que recebeu",
          "Confirme a baixa",
        ],
      },
    ],
  },
  "/contas-pagar": {
    titulo: "Contas a Pagar",
    path: "/contas-pagar",
    dicas: [
      "Cadastre todas as despesas e compromissos de pagamento",
      "Use categorias para melhor organização",
      "Marque como 'paga' quando efetuar o pagamento",
      "Contas vencidas aparecem em destaque",
    ],
    fluxos: [
      {
        label: "Cadastrar nova conta a pagar",
        passos: [
          "Clique em '+ Nova Conta'",
          "Preencha descrição, valor e vencimento",
          "Selecione o fornecedor",
          "Escolha categoria e forma de pagamento",
          "Salve o registro",
        ],
      },
      {
        label: "Pagar uma conta",
        passos: [
          "Encontre a conta na lista",
          "Clique em 'Pagar' ou no ícone de dinheiro",
          "Informe data de pagamento e banco/cartão",
          "Se for cartão de crédito, o limite será atualizado",
          "Confirme o pagamento",
        ],
      },
    ],
  },
  "/fluxo-caixa": {
    titulo: "Fluxo de Caixa",
    path: "/fluxo-caixa",
    dicas: [
      "O fluxo de caixa mostra entradas e saídas por período",
      "Lançamentos manuais afetam apenas o relatório",
      "Lançamentos do sistema vêm das contas pagas/recebidas",
      "Use filtros para análises específicas",
    ],
    fluxos: [
      {
        label: "Analisar fluxo de caixa",
        passos: [
          "Selecione o período desejado (mês/ano)",
          "Visualize o resumo de entradas e saídas",
          "Analise o saldo acumulado no gráfico",
          "Exporte o relatório em Excel se necessário",
        ],
      },
      {
        label: "Adicionar lançamento manual",
        passos: [
          "Clique em '+ Lançamento'",
          "Escolha tipo: Entrada ou Saída",
          "Preencha descrição, valor e data",
          "Selecione a categoria",
          "Salve o lançamento",
        ],
      },
    ],
  },
  "/conciliacao-bancaria": {
    titulo: "Conciliação Bancária",
    path: "/conciliacao-bancaria",
    dicas: [
      "Importe extratos bancários em OFX ou CSV",
      "O sistema tenta conciliar automaticamente por valor",
      "Transações não conciliadas precisam de lançamento manual",
      "Movimentações conciliadas atualizam saldos automaticamente",
    ],
    fluxos: [
      {
        label: "Importar extrato bancário",
        passos: [
          "Acesse a aba 'Importar Extrato'",
          "Selecione o arquivo OFX ou CSV",
          "Escolha o banco correspondente",
          "Clique em 'Importar'",
          "Verifique as transações importadas",
        ],
      },
      {
        label: "Conciliar transações",
        passos: [
          "Vá para a aba 'Conciliar'",
          "Veja transações não conciliadas",
          "Clique em 'Conciliar' ao lado da transação",
          "Selecione a conta correspondente do sistema",
          "Confirme a conciliação",
        ],
      },
    ],
  },
  "/clientes": {
    titulo: "Clientes",
    path: "/clientes",
    dicas: [
      "Mantenha o cadastro de clientes atualizado",
      "O CNPJ/CPF é importante para emissão de NFSe",
      "Endereço completo é necessário para alguns relatórios",
      "Você pode ver histórico financeiro por cliente",
    ],
    fluxos: [
      {
        label: "Cadastrar novo cliente",
        passos: [
          "Clique em '+ Novo Cliente'",
          "Preencha CNPJ/CPF (sistema busca dados automaticamente)",
          "Complete nome, e-mail e telefone",
          "Adicione endereço completo",
          "Salve o cadastro",
        ],
      },
    ],
  },
  "/fornecedores": {
    titulo: "Fornecedores",
    path: "/fornecedores",
    dicas: [
      "Cadastre fornecedores para organizar contas a pagar",
      "Dados bancários facilitam pagamentos",
      "Categorização ajuda na análise de gastos",
    ],
    fluxos: [
      {
        label: "Cadastrar fornecedor",
        passos: [
          "Clique em '+ Novo Fornecedor'",
          "Informe CNPJ e razão social",
          "Preencha dados de contato",
          "Adicione dados bancários se houver",
          "Salve o cadastro",
        ],
      },
    ],
  },
  "/bancos-cartoes": {
    titulo: "Bancos e Cartões",
    path: "/bancos-cartoes",
    dicas: [
      "Cadastre todas as contas bancárias e cartões",
      "Para cartões de crédito, informe o limite",
      "O saldo é atualizado pela conciliação ou lançamentos",
      "Cartões de crédito têm limite reduzido conforme usado",
    ],
    fluxos: [
      {
        label: "Cadastrar cartão de crédito",
        passos: [
          "Clique em '+ Nova Conta'",
          "Selecione tipo 'Cartão de Crédito'",
          "Preencha nome e limite total",
          "Informe data de fechamento e vencimento",
          "Salve o cadastro",
        ],
      },
    ],
  },
  "/categorias": {
    titulo: "Categorias",
    path: "/categorias",
    dicas: [
      "Categorias organizam receitas e despesas",
      "O sistema vincula automaticamente ao plano de contas",
      "Use categorias detalhadas para melhor análise",
      "Categorias de tipo 'Receita' ou 'Despesa'",
    ],
    fluxos: [
      {
        label: "Criar categoria",
        passos: [
          "Clique em '+ Nova Categoria'",
          "Defina nome e tipo (Receita/Despesa)",
          "Selecione uma cor para identificação",
          "Escolha o plano de contas relacionado",
          "Salve a categoria",
        ],
      },
    ],
  },
  "/dre": {
    titulo: "DRE Gerencial",
    path: "/dre",
    dicas: [
      "DRE demonstra resultado do exercício",
      "Receitas - Despesas = Resultado",
      "Compare períodos para análise de evolução",
      "Exporte em PDF para apresentações",
    ],
    fluxos: [
      {
        label: "Gerar DRE",
        passos: [
          "Selecione o período desejado",
          "Escolha comparativo (se desejar)",
          "Clique em 'Gerar DRE'",
          "Analise receitas, despesas e resultado",
          "Exporte em PDF se necessário",
        ],
      },
    ],
  },
  "/regua-cobranca": {
    titulo: "Régua de Cobrança",
    path: "/regua-cobranca",
    dicas: [
      "Configure lembretes automáticos de cobrança",
      "Personalize mensagens para cada etapa",
      "Veja contas vencidas e a vencer",
      "Use o dashboard de automação",
    ],
    fluxos: [
      {
        label: "Configurar régua de cobrança",
        passos: [
          "Acesse a aba 'Configuração'",
          "Defina dias antes e após vencimento",
          "Personalize as mensagens",
          "Ative a régua",
          "Salve as configurações",
        ],
      },
    ],
  },
  "/nfse": {
    titulo: "NFS-e Emissão",
    path: "/nfse",
    dicas: [
      "Configure certificado digital antes de emitir",
      "Preencha dados do tomador corretamente",
      "Valores de retenção calculam automaticamente",
      "ISS deve ser informado manualmente por município",
    ],
    fluxos: [
      {
        label: "Emitir NFSe",
        passos: [
          "Preencha dados do tomador (cliente)",
          "Descreva o serviço prestado",
          "Informe valor e alíquota de ISS",
          "Verifique retenções calculadas",
          "Clique em 'Emitir NFSe'",
        ],
      },
    ],
  },
  "/cnab240": {
    titulo: "CNAB 240",
    path: "/cnab240",
    dicas: [
      "Gere arquivos de remessa para boletos",
      "Importe arquivos de retorno para atualização",
      "Configure convênios bancários",
      "Segmentos A, J e outros conforme necessidade",
    ],
    fluxos: [
      {
        label: "Gerar remessa",
        passos: [
          "Selecione contas a receber pendentes",
          "Escolha o banco/convenio",
          "Clique em 'Gerar Remessa'",
          "Baixe o arquivo CNAB240",
          "Envie ao banco",
        ],
      },
    ],
  },
};

const FLUXOS_GERAIS = {
  primeiros_passos: {
    titulo: "Primeiros Passos no Sistema",
    passos: [
      "Cadastre sua empresa em /empresa",
      "Configure bancos e cartões em /bancos-cartoes",
      "Crie categorias financeiras em /categorias",
      "Cadastre clientes em /clientes",
      "Cadastre fornecedores em /fornecedores",
      "Comece a lançar contas a pagar e receber",
    ],
  },
  fechamento_mensal: {
    titulo: "Fechamento Mensal",
    passos: [
      "Confirme que todas as contas do mês foram baixadas",
      "Verifique conciliação bancária",
      "Analise o DRE do período",
      "Confira fluxo de caixa",
      "Gere relatórios para contador",
      "Exporte documentos se necessário",
    ],
  },
  analise_financeira: {
    titulo: "Análise Financeira Completa",
    passos: [
      "Acesse o Dashboard para visão geral",
      "Verifique Contas a Receber vencidas",
      "Analise Contas a Pagar próximas ao vencimento",
      "Consulte o Fluxo de Caixa projetado",
      "Gere DRE comparativo",
      "Verifique indicadores no ROI",
    ],
  },
};

const MENSAGEM_INICIAL = `👋 **Olá! Sou o Neo**, seu assistente virtual do 9Nine Business Control.

Estou aqui para te ajudar a usar o sistema da melhor forma possível. Posso:

📚 **Explicar funcionalidades** do sistema
🎯 **Guiar passo a passo** em qualquer fluxo
💡 **Dar dicas** de uso e boas práticas
🔍 **Navegar** com você pelas páginas

**Como posso ajudar você hoje?**`;

export function AssistenteVirtual() {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [etapaAjuda, setEtapaAjuda] = useState<string | null>(null);
  const [paginaContexto, setPaginaContexto] = useState<string>(window.location.pathname);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Monitorar mudança de página
  useEffect(() => {
    const handleLocationChange = () => {
      setPaginaContexto(window.location.pathname);
    };
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  // Iniciar conversa
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

  const iniciarConversa = () => {
    const contexto = CONTEXTO_SISTEMA[paginaContexto];
    const mensagem = contexto
      ? `${MENSAGEM_INICIAL}\n\n📍 *Você está em: **${contexto.titulo}***\nPosso te ajudar com algo específico desta página?`
      : MENSAGEM_INICIAL;

    adicionarMensagemBot(mensagem, getMenuPrincipal(contexto));
  };

  const getMenuPrincipal = (contexto?: ContextoPagina): Opcao[] => {
    const opcoes: Opcao[] = [
      { label: "Como usar esta página", valor: "pagina_atual", descricao: "Ajuda específica do local atual" },
      { label: "Primeiros passos", valor: "primeiros_passos", descricao: "Guia para iniciantes" },
      { label: "Ver fluxos disponíveis", valor: "fluxos", descricao: "Passo a passo de tarefas" },
      { label: "Tirar dúvidas", valor: "duvidas", descricao: "Pergunte sobre funcionalidades" },
    ];

    if (!contexto) {
      return opcoes.filter((o) => o.valor !== "pagina_atual");
    }

    return opcoes;
  };

  const adicionarMensagemBot = (texto: string, opcoes?: Opcao[], acoes?: AcaoRapida[]) => {
    setTimeout(() => {
      setMensagens((prev) => [
        ...prev,
        { id: Date.now().toString(), tipo: "bot", texto, opcoes, acoes },
      ]);
    }, 400);
  };

  const adicionarMensagemUsuario = (texto: string) => {
    setMensagens((prev) => [
      ...prev,
      { id: Date.now().toString(), tipo: "usuario", texto },
    ]);
  };

  const handleOpcaoClick = (valor: string) => {
    const msgAtual = mensagens[mensagens.length - 1];
    const opcao = msgAtual.opcoes?.find((o) => o.valor === valor);
    const label = opcao?.label || valor;

    adicionarMensagemUsuario(label);
    processarResposta(valor);
  };

  const processarResposta = (valor: string) => {
    const contexto = CONTEXTO_SISTEMA[paginaContexto];

    switch (valor) {
      case "pagina_atual":
        if (contexto) {
          let msg = `**${contexto.titulo}**\n\n`;
          msg += `💡 **Dicas úteis:**\n`;
          contexto.dicas.forEach((dica) => {
            msg += `• ${dica}\n`;
          });

          const opcoesFluxo: Opcao[] = contexto.fluxos.map((f) => ({
            label: f.label,
            valor: `fluxo_${f.label}`,
          }));
          opcoesFluxo.push({ label: "Voltar ao menu", valor: "voltar" });

          adicionarMensagemBot(msg, opcoesFluxo);
        }
        break;

      case "primeiros_passos":
        mostrarFluxo(FLUXOS_GERAIS.primeiros_passos);
        break;

      case "fluxos":
        adicionarMensagemBot(
          "**Escolha o fluxo que deseja aprender:**",
          [
            { label: "Primeiros Passos", valor: "primeiros_passos", descricao: "Configuração inicial" },
            { label: "Fechamento Mensal", valor: "fechamento_mensal", descricao: "Processo de fechamento" },
            { label: "Análise Financeira", valor: "analise_financeira", descricao: "Análise completa" },
            { label: "Emitir NFSe", valor: "fluxo_nfse", descricao: "Nota fiscal de serviço" },
            { label: "Voltar", valor: "voltar" },
          ]
        );
        break;

      case "duvidas":
        adicionarMensagemBot(
          "**Sobre o que você tem dúvidas?**\n\nDigite sua pergunta ou escolha um tema:",
          [
            { label: "Contas a Pagar/Receber", valor: "duvida_contas" },
            { label: "Conciliação Bancária", valor: "duvida_conciliacao" },
            { label: "Relatórios (DRE/Fluxo)", valor: "duvida_relatorios" },
            { label: "Cadastros", valor: "duvida_cadastros" },
            { label: "Configurações", valor: "duvida_config" },
            { label: "Voltar", valor: "voltar" },
          ]
        );
        setEtapaAjuda("duvidas");
        break;

      case "fechamento_mensal":
        mostrarFluxo(FLUXOS_GERAIS.fechamento_mensal);
        break;

      case "analise_financeira":
        mostrarFluxo(FLUXOS_GERAIS.analise_financeira);
        break;

      case "fluxo_nfse":
        if (CONTEXTO_SISTEMA["/nfse"]) {
          mostrarFluxo({
            titulo: "Emitir NFSe",
            passos: CONTEXTO_SISTEMA["/nfse"].fluxos[0].passos,
          });
        }
        break;

      case "duvida_contas":
        adicionarMensagemBot(
          "**Contas a Pagar e Receber**\n\n" +
            "📥 **Contas a Receber:**\n" +
            "• Registre vendas e comissões futuras\n" +
            "• Acompanhe o que entrará no caixa\n" +
            "• Dê baixa quando receber\n\n" +
            "📤 **Contas a Pagar:**\n" +
            "• Cadastre todas as despesas\n" +
            "• Organize por fornecedor e categoria\n" +
            "• Controle o vencimento\n\n" +
            "💡 **Dica:** Use a conciliação bancária para atualizar automaticamente!",
          [{ label: "Ir para Contas a Receber", valor: "nav_receber" }, { label: "Ir para Contas a Pagar", valor: "nav_pagar" }, { label: "Voltar", valor: "voltar" }]
        );
        break;

      case "duvida_conciliacao":
        adicionarMensagemBot(
          "**Conciliação Bancária**\n\n" +
            "A conciliação compara seu extrato bancário com os lançamentos do sistema.\n\n" +
            "✅ **Como funciona:**\n" +
            "• Importe o extrato (OFX/CSV)\n" +
            "• O sistema busca lançamentos por valor\n" +
            "• Transações não encontradas ficam pendentes\n" +
            "• Você pode criar lançamentos ou conciliar manualmente\n\n" +
            "🎯 **Benefício:** Mantém o saldo bancário atualizado automaticamente!",
          [{ label: "Ir para Conciliação", valor: "nav_conciliacao" }, { label: "Voltar", valor: "voltar" }]
        );
        break;

      case "duvida_relatorios":
        adicionarMensagemBot(
          "**Relatórios Gerenciais**\n\n" +
            "📊 **DRE:** Demonstração do Resultado do Exercício\n" +
            "• Receitas - Despesas = Lucro/Prejuízo\n" +
            "• Compare períodos diferentes\n\n" +
            "💰 **Fluxo de Caixa:**\n" +
            "• Entradas e saídas por período\n" +
            "• Projeção futura\n" +
            "• Saldo acumulado\n\n" +
            "📈 **Outros:**\n" +
            "• Régua de Cobrança\n" +
            "• Análise de Clientes/Fornecedores\n" +
            "• Exportações em PDF e Excel",
          [
            { label: "Ir para DRE", valor: "nav_dre" },
            { label: "Ir para Fluxo de Caixa", valor: "nav_fluxo" },
            { label: "Voltar", valor: "voltar" },
          ]
        );
        break;

      case "duvida_cadastros":
        adicionarMensagemBot(
          "**Cadastros do Sistema**\n\n" +
            "**Principais cadastros:**\n\n" +
            "👤 **Empresa:** Dados da sua empresa\n" +
            "👥 **Clientes:** Tomadores de serviço\n" +
            "🏢 **Fornecedores:** Prestadores de serviço\n" +
            "🏦 **Bancos e Cartões:** Contas financeiras\n" +
            "🏷️ **Categorias:** Classificação de receitas/despesas\n" +
            "📋 **Plano de Contas:** Estrutura contábil\n\n" +
            "💡 **Dica:** Cadastros bem feitos geram relatórios melhores!",
          [{ label: "Voltar", valor: "voltar" }]
        );
        break;

      case "duvida_config":
        adicionarMensagemBot(
          "**Configurações**\n\n" +
            "⚙️ **Configurações > Sistema:**\n" +
            "• Dados da empresa\n" +
            "• Preferências\n\n" +
            "👥 **Usuários:**\n" +
            "• Cadastro de usuários\n" +
            "• Permissões de acesso\n\n" +
            "🔔 **Régua de Cobrança:**\n" +
            "• Configurar lembretes automáticos\n\n" +
            "🏦 **Open Banking:**\n" +
            "• Integração bancária",
          [{ label: "Ir para Configurações", valor: "nav_config" }, { label: "Voltar", valor: "voltar" }]
        );
        break;

      case "nav_receber":
        navigate("/contas-receber");
        setAberto(false);
        break;
      case "nav_pagar":
        navigate("/contas-pagar");
        setAberto(false);
        break;
      case "nav_conciliacao":
        navigate("/conciliacao-bancaria");
        setAberto(false);
        break;
      case "nav_dre":
        navigate("/dre");
        setAberto(false);
        break;
      case "nav_fluxo":
        navigate("/fluxo-caixa");
        setAberto(false);
        break;
      case "nav_config":
        navigate("/configuracoes");
        setAberto(false);
        break;

      case "voltar":
        iniciarConversa();
        break;

      default:
        // Verificar se é um fluxo específico
        if (valor.startsWith("fluxo_") && contexto) {
          const fluxoNome = valor.replace("fluxo_", "");
          const fluxo = contexto.fluxos.find((f) => f.label === fluxoNome);
          if (fluxo) {
            mostrarFluxo({ titulo: fluxo.label, passos: fluxo.passos });
          }
        } else {
          adicionarMensagemBot(
            "Entendi! Posso te ajudar de várias formas. Escolha uma opção:",
            getMenuPrincipal(contexto)
          );
        }
    }
  };

  const mostrarFluxo = (fluxo: { titulo: string; passos: string[] }) => {
    let msg = `**${fluxo.titulo}**\n\nSiga estes passos:\n\n`;
    fluxo.passos.forEach((passo, idx) => {
      msg += `${idx + 1}.️ ${passo}\n`;
    });
    msg += `\n✨ **Dica:** Você pode abrir esta conversa a qualquer momento para rever os passos!`;

    adicionarMensagemBot(msg, [
      { label: "Ir para a página", valor: "ir_pagina" },
      { label: "Outros fluxos", valor: "fluxos" },
      { label: "Menu principal", valor: "voltar" },
    ]);
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    adicionarMensagemUsuario(inputValue);
    const pergunta = inputValue.toLowerCase();
    setInputValue("");

    // Analisar pergunta e responder
    setTimeout(() => {
      const resposta = buscarRespostaInteligente(pergunta);
      adicionarMensagemBot(resposta.texto, resposta.opcoes);
    }, 500);
  };

  const buscarRespostaInteligente = (pergunta: string): { texto: string; opcoes: Opcao[] } => {
    // Palavras-chave e respostas
    const palavrasChave: Record<string, { texto: string; acao?: string }> = {
      "receber": {
        texto: "Para contas a receber, você deve acessar a página 'Contas a Receber' e clicar em '+ Nova Conta'. Lá você cadastra vendas e serviços prestados.",
        acao: "nav_receber",
      },
      "pagar": {
        texto: "Para contas a pagar, acesse a página dedicada e cadastre suas despesas. Você pode organizar por fornecedor e categoria.",
        acao: "nav_pagar",
      },
      "cliente": {
        texto: "Clientes são cadastrados na página 'Clientes'. Mantenha os dados atualizados para emissão de notas fiscais.",
      },
      "fornecedor": {
        texto: "Fornecedores são cadastrados na página 'Fornecedores'. Isso ajuda a organizar suas contas a pagar.",
      },
      "concilia": {
        texto: "A conciliação bancária compara seu extrato com os lançamentos do sistema. Importe o arquivo OFX do seu banco.",
        acao: "nav_conciliacao",
      },
      "dre": {
        texto: "O DRE (Demonstração do Resultado) mostra receitas, despesas e o resultado do período. Acesse em Relatórios > DRE.",
        acao: "nav_dre",
      },
      "fluxo": {
        texto: "O Fluxo de Caixa mostra entradas e saídas ao longo do tempo. Útil para planejamento financeiro.",
        acao: "nav_fluxo",
      },
      "nota": {
        texto: "Para emitir NFSe, vá em NFS-e Emissão. Você precisa ter o certificado digital configurado e o cliente cadastrado.",
      },
      "boleto": {
        texto: "Boletos são gerenciados via CNAB 240. Você gera remessa para o banco e importa o retorno.",
      },
      "categoria": {
        texto: "Categorias classificam receitas e despesas. Elas são vinculadas automaticamente ao plano de contas.",
      },
      "cartao": {
        texto: "Cartões de crédito são cadastrados em 'Bancos e Cartões'. O sistema atualiza o limite disponível conforme usado.",
      },
      "configuracao": {
        texto: "Configurações gerais estão em Configurações > Sistema. Lá você define dados da empresa e preferências.",
        acao: "nav_config",
      },
      "usuario": {
        texto: "Usuários são gerenciados em Configurações > Usuários. Você pode definir permissões de acesso.",
      },
      "export": {
        texto: "A maioria das páginas tem botão de exportação. Relatórios podem ser exportados em PDF ou Excel.",
      },
      "relatorio": {
        texto: "Relatórios completos estão no menu 'Relatórios'. Inclui DRE, Fluxo de Caixa e muito mais.",
      },
    };

    // Buscar correspondência
    for (const [chave, resposta] of Object.entries(palavrasChave)) {
      if (pergunta.includes(chave)) {
        const opcoes: Opcao[] = [{ label: "Obrigado!", valor: "voltar" }];
        if (resposta.acao) {
          opcoes.unshift({ label: "Ir para a página", valor: resposta.acao });
        }
        return { texto: resposta.texto, opcoes };
      }
    }

    // Resposta padrão
    return {
      texto: "Não entendi completamente. Posso te ajudar com:\n\n• Contas a Pagar/Receber\n• Conciliação Bancária\n• Relatórios (DRE, Fluxo)\n• Cadastros\n• Configurações\n\nEscolha uma opção abaixo ou reformule sua pergunta:",
      opcoes: [
        { label: "Primeiros passos", valor: "primeiros_passos" },
        { label: "Ver fluxos disponíveis", valor: "fluxos" },
        { label: "Menu principal", valor: "voltar" },
      ],
    };
  };

  const toggleChat = () => {
    setAberto(!aberto);
    if (!aberto) {
      setPaginaContexto(window.location.pathname);
    }
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
                <p className="text-emerald-100 text-xs">Assistente Virtual 9Nine</p>
              </div>
              <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-emerald-100">Online</span>
              </div>
            </div>
          </div>

          {/* Mensagens */}
          <div
            ref={scrollRef}
            className="flex-1 max-h-[450px] overflow-y-auto p-4 space-y-4 bg-gray-50/50"
          >
            {mensagens.length === 0 && (
              <div className="flex items-center justify-center h-20 text-gray-400 text-sm">
                <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                Iniciando assistente...
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
                      ? "bg-emerald-600"
                      : "bg-gradient-to-br from-emerald-500 to-teal-500"
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
                      ? "bg-emerald-500 text-white rounded-br-md"
                      : "bg-white border border-gray-200 text-gray-700 rounded-bl-md shadow-sm"
                  )}
                >
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: msg.texto
                        .replace(/\*\*(.*?)\*\*/g, "<strong class='text-emerald-700'>$1</strong>")
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
                          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-xl text-left transition-all group"
                        >
                          <div>
                            <span className="text-sm text-gray-700 font-medium">
                              {opcao.label}
                            </span>
                            {opcao.descricao && (
                              <p className="text-xs text-gray-400">{opcao.descricao}</p>
                            )}
                          </div>
                          <ChevronRight className="h-4 w-4 text-emerald-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input para perguntas livres */}
          <form onSubmit={handleInputSubmit} className="p-4 bg-white border-t border-gray-100">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Digite sua dúvida aqui..."
                className="flex-1"
              />
              <Button type="submit" size="icon" className="bg-emerald-500 hover:bg-emerald-600">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              💡 Dica: Você pode perguntar sobre qualquer funcionalidade
            </p>
          </form>
        </div>
      )}
    </>
  );
}
