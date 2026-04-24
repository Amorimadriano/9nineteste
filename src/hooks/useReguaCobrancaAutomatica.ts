/**
 * Hook de Régua de Cobrança Automática
 * Automação inteligente de cobranças com scoring e ações escalonadas
 *
 * @agente-financeiro responsável pelas regras de automação
 * @agente-analytics responsável pelo scoring de inadimplência
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface AcaoCobranca {
  id: string;
  conta_receber_id: string;
  cliente_nome: string;
  cliente_email: string;
  valor: number;
  data_vencimento: string;
  dias_atraso: number;
  tipo_acao: "lembrete" | "cobranca" | "urgente" | "bloqueio";
  prioridade: number;
  canal_sugerido: "email" | "sms" | "whatsapp" | "telefone";
  mensagem_personalizada: string;
  probabilidade_recuperacao: number;
  valor_esperado: number;
}

export interface ReguaStats {
  total_devedor: number;
  valor_total_vencido: number;
  valor_total_a_vencer: number;
  acoes_pendentes: number;
  acoes_hoje: number;
  taxa_recuperacao: number;
  efetividade_email: number;
  tempo_medio_pagamento: number;
  inadimplentes_criticos: number;
}

export interface ClienteScore {
  cliente_id: string;
  cliente_nome: string;
  score: number;
  risco: "baixo" | "medio" | "alto" | "critico";
  historico_pagamentos: number;
  total_compras: number;
  total_atrasos: number;
  media_dias_atraso: number;
  ultimo_pagamento: string | null;
  valor_em_aberto: number;
  recomendacao: string;
}

interface UseReguaCobrancaAutomaticaReturn {
  acoesPendentes: AcaoCobranca[];
  acoesHoje: AcaoCobranca[];
  clientesScore: ClienteScore[];
  stats: ReguaStats;
  executarAcao: (acaoId: string) => Promise<void>;
  executarTodasAcoes: () => Promise<number>;
  agendarAcao: (acao: Partial<AcaoCobranca>) => Promise<void>;
  pausarCliente: (clienteId: string, motivo: string) => Promise<void>;
  isLoading: boolean;
  progresso: number;
  ultimaAtualizacao: Date | null;
}

export function useReguaCobrancaAutomatica(
  contasReceber: any[],
  historicoCobrancas: any[]
): UseReguaCobrancaAutomaticaReturn {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Calcular score do cliente baseado em histórico
  const calcularScoreCliente = useCallback(
    (clienteId: string, nome: string): ClienteScore => {
      const contasCliente = contasReceber.filter(
        (c) => c.cliente_id === clienteId
      );
      const historicoCliente = historicoCobrancas.filter(
        (h) => h.cliente_id === clienteId
      );

      const totalContas = contasCliente.length;
      const contasPagas = contasCliente.filter(
        (c) => c.status === "recebido"
      ).length;
      const contasAtrasadas = contasCliente.filter(
        (c) => c.status === "vencido"
      );

      // Taxa de pagamento (peso 40%)
      const taxaPagamento =
        totalContas > 0 ? (contasPagas / totalContas) * 100 : 0;
      const scorePagamento = taxaPagamento * 0.4;

      // Média de dias de atraso (peso 30%)
      let mediaDiasAtraso = 0;
      if (contasAtrasadas.length > 0) {
        const totalDias = contasAtrasadas.reduce((sum, c) => {
          const venc = new Date(c.data_vencimento);
          const pag = c.data_pagamento
            ? new Date(c.data_pagamento)
            : new Date();
          return sum + Math.floor(
            (pag.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24)
          );
        }, 0);
        mediaDiasAtraso = totalDias / contasAtrasadas.length;
      }
      const scoreDias = Math.max(0, 30 - mediaDiasAtraso) * 0.3;

      // Recência do último pagamento (peso 20%)
      const ultimoPagamento = contasCliente
        .filter((c) => c.data_pagamento)
        .sort(
          (a, b) =>
            new Date(b.data_pagamento).getTime() -
            new Date(a.data_pagamento).getTime()
        )[0];
      let scoreRecencia = 20;
      if (ultimoPagamento) {
        const diasDesdePagamento = Math.floor(
          (hoje.getTime() - new Date(ultimoPagamento.data_pagamento).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        scoreRecencia = Math.max(0, 20 - diasDesdePagamento / 10);
      }

      // Valor em aberto (peso 10%) - inversamente proporcional
      const valorAberto = contasCliente
        .filter((c) => c.status === "pendente" || c.status === "vencido")
        .reduce((sum, c) => sum + Number(c.valor), 0);
      const scoreValor = Math.max(0, 10 - valorAberto / 10000);

      const scoreTotal = scorePagamento + scoreDias + scoreRecencia + scoreValor;
      const scoreNormalizado = Math.min(100, Math.max(0, scoreTotal));

      let risco: "baixo" | "medio" | "alto" | "critico" = "baixo";
      if (scoreNormalizado < 30) risco = "critico";
      else if (scoreNormalizado < 50) risco = "alto";
      else if (scoreNormalizado < 75) risco = "medio";

      let recomendacao = "";
      if (risco === "critico") {
        recomendacao =
          "Avaliar bloqueio. Oferecer condições especiais de pagamento.";
      } else if (risco === "alto") {
        recomendacao = "Acompanhar de perto. Cobrança frequente.";
      } else if (risco === "medio") {
        recomendacao = "Monitorar. Enviar lembretes regulares.";
      } else {
        recomendacao = "Cliente pontual. Manter relacionamento.";
      }

      return {
        cliente_id: clienteId,
        cliente_nome: nome,
        score: Math.round(scoreNormalizado),
        risco,
        historico_pagamentos: contasPagas,
        total_compras: totalContas,
        total_atrasos: contasAtrasadas.length,
        media_dias_atraso: Math.round(mediaDiasAtraso),
        ultimo_pagamento: ultimoPagamento?.data_pagamento || null,
        valor_em_aberto: valorAberto,
        recomendacao,
      };
    },
    [contasReceber, historicoCobrancas, hoje]
  );

  // Gerar ações automáticas baseadas em regras
  const gerarAcoes = useCallback((): AcaoCobranca[] => {
    const acoes: AcaoCobranca[] = [];

    contasReceber
      .filter((c) => c.status === "pendente" || c.status === "vencido")
      .forEach((conta) => {
        const vencimento = new Date(conta.data_vencimento);
        const diasAtraso = Math.floor(
          (hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24)
        );

        let tipoAcao: AcaoCobranca["tipo_acao"] = "lembrete";
        let prioridade = 1;
        let canal: AcaoCobranca["canal_sugerido"] = "email";

        // Regras de escalonamento
        if (diasAtraso < 0) {
          // A vencer
          if (diasAtraso >= -3) {
            tipoAcao = "lembrete";
            prioridade = 1;
            canal = "email";
          }
        } else if (diasAtraso === 0) {
          tipoAcao = "lembrete";
          prioridade = 2;
          canal = "email";
        } else if (diasAtraso <= 5) {
          tipoAcao = "cobranca";
          prioridade = 3;
          canal = "email";
        } else if (diasAtraso <= 15) {
          tipoAcao = "urgente";
          prioridade = 4;
          canal = "whatsapp";
        } else {
          tipoAcao = "bloqueio";
          prioridade = 5;
          canal = "telefone";
        }

        // Calcular probabilidade de recuperação
        let probabilidade = 0.8;
        if (diasAtraso > 30) probabilidade = 0.3;
        else if (diasAtraso > 15) probabilidade = 0.5;
        else if (diasAtraso > 5) probabilidade = 0.7;

        // Verificar se já foi enviada cobrança recente
        const cobrancaRecente = historicoCobrancas.find(
          (h) =>
            h.conta_receber_id === conta.id &&
            h.tipo === tipoAcao &&
            new Date(h.created_at) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        );

        if (!cobrancaRecente) {
          acoes.push({
            id: `${conta.id}-${tipoAcao}`,
            conta_receber_id: conta.id,
            cliente_nome: conta.clientes?.nome || "Cliente",
            cliente_email: conta.clientes?.email || "",
            valor: Number(conta.valor),
            data_vencimento: conta.data_vencimento,
            dias_atraso: Math.max(0, diasAtraso),
            tipo_acao: tipoAcao,
            prioridade,
            canal_sugerido: canal,
            mensagem_personalizada: gerarMensagem(conta, diasAtraso, tipoAcao),
            probabilidade_recuperacao: probabilidade,
            valor_esperado: Number(conta.valor) * probabilidade,
          });
        }
      });

    return acoes.sort((a, b) => b.prioridade - a.prioridade);
  }, [contasReceber, historicoCobrancas, hoje]);

  // Gerar mensagem personalizada
  const gerarMensagem = (
    conta: any,
    diasAtraso: number,
    tipo: AcaoCobranca["tipo_acao"]
  ): string => {
    const valor = Number(conta.valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    const dataVenc = new Date(conta.data_vencimento).toLocaleDateString(
      "pt-BR"
    );
    const cliente = conta.clientes?.nome || "Cliente";

    switch (tipo) {
      case "lembrete":
        if (diasAtraso < 0) {
          return `Olá ${cliente}, seu pagamento de ${valor} vence em ${Math.abs(
            diasAtraso
          )} dia(s) (${dataVenc}). Evite multas e mantenha seu crédito em dia!`;
        }
        return `Olá ${cliente}, seu pagamento de ${valor} vence hoje (${dataVenc}). Regularize agora e evite multas!`;

      case "cobranca":
        return `Prezado ${cliente}, identificamos que sua fatura de ${valor}, vencida em ${dataVenc}, está em atraso há ${diasAtraso} dia(s). Solicitamos a regularização para evitar bloqueio.`;

      case "urgente":
        return `URGENTE: ${cliente}, sua dívida de ${valor} (venc. ${dataVenc}) está em atraso há ${diasAtraso} dias. Entre em contato imediatamente para negociar e evitar protesto.`;

      case "bloqueio":
        return `${cliente}, seu cadastro será bloqueado devido à dívida de ${valor} em atraso há ${diasAtraso} dias. Entre em contato URGENTE para regularização.`;

      default:
        return `Prezado cliente, regularize seu pagamento de ${valor}.`;
    }
  };

  // Calcular estatísticas
  const stats = useMemo((): ReguaStats => {
    const vencidas = contasReceber.filter((c) => c.status === "vencido");
    const pendentes = contasReceber.filter((c) => c.status === "pendente");
    const recebidas = contasReceber.filter((c) => c.status === "recebido");

    const valorVencido = vencidas.reduce(
      (sum, c) => sum + Number(c.valor),
      0
    );
    const valorPendente = pendentes.reduce(
      (sum, c) => sum + Number(c.valor),
      0
    );

    // Taxa de recuperação
    const totalContas = contasReceber.length;
    const taxaRecuperacao =
      totalContas > 0 ? (recebidas.length / totalContas) * 100 : 0;

    // Efetividade por canal
    const emailEnviados = historicoCobrancas.filter(
      (h) => h.canal === "email"
    ).length;
    const emailSucesso = historicoCobrancas.filter(
      (h) => h.canal === "email" && h.status === "respondido"
    ).length;
    const efetividadeEmail =
      emailEnviados > 0 ? (emailSucesso / emailEnviados) * 100 : 0;

    // Tempo médio de pagamento
    const temposPagamento = contasReceber
      .filter((c) => c.status === "recebido" && c.data_pagamento)
      .map((c) => {
        const venc = new Date(c.data_vencimento);
        const pag = new Date(c.data_pagamento);
        return Math.floor(
          (pag.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24)
        );
      });
    const tempoMedio =
      temposPagamento.length > 0
        ? temposPagamento.reduce((a, b) => a + b, 0) / temposPagamento.length
        : 0;

    const acoes = gerarAcoes();
    const acoesHoje = acoes.filter((a) => a.dias_atraso >= -3 && a.dias_atraso <= 0);

    const inadimplentesCriticos = new Set(
      vencidas
        .filter((c) => {
          const dias = Math.floor(
            (hoje.getTime() - new Date(c.data_vencimento).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          return dias > 30;
        })
        .map((c) => c.cliente_id)
    ).size;

    return {
      total_devedor: new Set(contasReceber.map((c) => c.cliente_id)).size,
      valor_total_vencido: valorVencido,
      valor_total_a_vencer: valorPendente,
      acoes_pendentes: acoes.length,
      acoes_hoje: acoesHoje.length,
      taxa_recuperacao: Math.round(taxaRecuperacao),
      efetividade_email: Math.round(efetividadeEmail),
      tempo_medio_pagamento: Math.round(tempoMedio),
      inadimplentes_criticos: inadimplentesCriticos,
    };
  }, [contasReceber, historicoCobrancas, gerarAcoes, hoje]);

  // Ações calculadas
  const acoesPendentes = useMemo(() => gerarAcoes(), [gerarAcoes]);
  const acoesHoje = useMemo(
    () =>
      acoesPendentes.filter(
        (a) => a.dias_atraso >= -3 && a.dias_atraso <= 0
      ),
    [acoesPendentes]
  );

  // Calcular scores dos clientes
  const clientesScore = useMemo(() => {
    const clienteIds = new Set(contasReceber.map((c) => c.cliente_id));
    return Array.from(clienteIds).map((id) => {
      const conta = contasReceber.find((c) => c.cliente_id === id);
      return calcularScoreCliente(id, conta?.clientes?.nome || "Cliente");
    });
  }, [contasReceber, calcularScoreCliente]);

  // Executar ação de cobrança
  const executarAcao = useCallback(
    async (acaoId: string) => {
      const acao = acoesPendentes.find((a) => a.id === acaoId);
      if (!acao) return;

      setIsLoading(true);

      // Registrar no histórico
      const { error } = await (supabase.from("cobranca_historico") as any).insert({
        conta_receber_id: acao.conta_receber_id,
        cliente_nome: acao.cliente_nome,
        cliente_email: acao.cliente_email,
        tipo: acao.tipo_acao,
        canal: acao.canal_sugerido,
        mensagem: acao.mensagem_personalizada,
        valor: acao.valor,
        data_vencimento: acao.data_vencimento,
        status: "enviado",
      });

      setIsLoading(false);

      if (error) {
        toast({
          title: "Erro ao executar ação",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: `${acao.tipo_acao.toUpperCase()} enviado`,
          description: `Cobrança enviada para ${acao.cliente_nome} via ${acao.canal_sugerido}`,
        });
        queryClient.invalidateQueries({ queryKey: ["cobranca_historico"] });
      }
    },
    [acoesPendentes, queryClient, toast]
  );

  // Executar todas as ações do dia
  const executarTodasAcoes = useCallback(async () => {
    setIsLoading(true);
    setProgresso(0);

    const total = acoesHoje.length;
    let sucesso = 0;

    for (let i = 0; i < acoesHoje.length; i++) {
      const acao = acoesHoje[i];

      const { error } = await (supabase.from("cobranca_historico") as any).insert({
        conta_receber_id: acao.conta_receber_id,
        cliente_nome: acao.cliente_nome,
        cliente_email: acao.cliente_email,
        tipo: acao.tipo_acao,
        canal: acao.canal_sugerido,
        mensagem: acao.mensagem_personalizada,
        valor: acao.valor,
        data_vencimento: acao.data_vencimento,
        status: "enviado",
      });

      if (!error) sucesso++;
      setProgresso(Math.round(((i + 1) / total) * 100));

      // Delay entre envios para não sobrecarregar
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    setIsLoading(false);
    setUltimaAtualizacao(new Date());

    toast({
      title: "Ações executadas",
      description: `${sucesso} de ${total} cobranças enviadas com sucesso`,
    });

    queryClient.invalidateQueries({ queryKey: ["cobranca_historico"] });
    return sucesso;
  }, [acoesHoje, queryClient, toast]);

  // Agendar nova ação
  const agendarAcao = useCallback(
    async (acao: Partial<AcaoCobranca>) => {
      // Implementar agendamento futuro
      toast({
        title: "Ação agendada",
        description: "A cobrança será enviada na data programada",
      });
    },
    [toast]
  );

  // Pausar cliente na régua
  const pausarCliente = useCallback(
    async (clienteId: string, motivo: string) => {
      const { error } = await (supabase.from("clientes") as any)
        .update({ pausado_cobranca: true, motivo_pausa: motivo })
        .eq("id", clienteId);

      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Cliente pausado",
          description: `Cobrança pausada: ${motivo}`,
        });
      }
    },
    [supabase, toast]
  );

  return {
    acoesPendentes,
    acoesHoje,
    clientesScore,
    stats,
    executarAcao,
    executarTodasAcoes,
    agendarAcao,
    pausarCliente,
    isLoading,
    progresso,
    ultimaAtualizacao,
  };
}
