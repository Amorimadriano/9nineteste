/**
 * Hook do módulo 9nine Business Control Card — v2.0
 * Auditoria de Recebíveis de Cartão de Crédito
 * Reforma Tributária IBS/CBS · Split Payment · Relatórios
 */
import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  calcularSplitPayment,
  type AliquotaReforma,
  ADQUIRENTES,
  TIPOS_TRANSACAO,
  parseExtratoAvancado,
  parseOFX,
  ofxToCardTransactions,
  type ReportData,
} from "@/lib/cardAudit";

export interface CardTransacao {
  id: string;
  user_id: string;
  banco_cartao_id: string | null;
  empresa_id: string | null;
  adquirente: string;
  bandeira: string | null;
  nsu: string | null;
  autorizacao: string | null;
  data_venda: string;
  data_prevista_recebimento: string | null;
  data_recebimento: string | null;
  tipo_transacao: string;
  parcelas: number;
  parcela_atual: number;
  valor_bruto: number;
  taxa_mdr: number;
  valor_taxa: number;
  valor_liquido: number;
  status_auditoria: string;
  conciliado: boolean;
  arquivo_origem: string | null;
  tipo_arquivo: string;
  observacoes: string | null;
  data_conciliacao: string | null;
  score_conciliacao: number | null;
  created_at: string;
}

export interface CardImportacao {
  id: string;
  user_id: string;
  adquirente: string;
  tipo_arquivo: string;
  nome_arquivo: string;
  tamanho_arquivo: number;
  total_linhas: number;
  total_importadas: number;
  total_erros: number;
  status: string;
  criado_em: string;
}

export interface FiltrosAuditoria {
  dataInicio: string;
  dataFim: string;
  adquirente: string;
  bandeira: string;
  status: string;
  tipoTransacao: string;
  search: string;
}

const BANDEIRAS = ["visa", "mastercard", "elo", "amex", "hipercard", "diners", "discover", "outros"];

export function useCardAudit() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filtros, setFiltros] = useState<FiltrosAuditoria>({
    dataInicio: "",
    dataFim: "",
    adquirente: "todas",
    bandeira: "todas",
    status: "todos",
    tipoTransacao: "todos",
    search: "",
  });

  // --- Queries ---

  const transacoesQuery = useQuery<CardTransacao[]>({
    queryKey: ["card-transacoes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("card_transacoes_brutas")
        .select("*")
        .order("data_venda", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CardTransacao[];
    },
  });

  const aliquotasQuery = useQuery<AliquotaReforma[]>({
    queryKey: ["card-aliquotas-reforma"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("card_aliquotas_reforma")
        .select("*")
        .order("ano", { ascending: true });
      if (error) throw error;
      return (data ?? []) as AliquotaReforma[];
    },
  });

  const importacoesQuery = useQuery<CardImportacao[]>({
    queryKey: ["card-importacoes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("card_importacoes")
        .select("*")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CardImportacao[];
    },
  });

  const empresaQuery = useQuery({
    queryKey: ["empresa", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("empresa")
        .select("nome_fantasia, razao_social, cnpj, logo_url")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  // --- Mutations ---

  const importarLote = useMutation({
    mutationFn: async (
      params: {
        transacoes: Array<Partial<CardTransacao> & { arquivo_origem?: string }>;
        adquirente: string;
        tipoArquivo: string;
        nomeArquivo: string;
        totalLinhas: number;
        totalErros: number;
      }
    ) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { transacoes, adquirente, tipoArquivo, nomeArquivo, totalLinhas, totalErros } = params;

      const payload = transacoes.map((t) => ({
        ...t,
        user_id: user.id,
        adquirente: t.adquirente || adquirente,
        tipo_transacao: t.tipo_transacao || "credito_a_vista",
        tipo_arquivo: tipoArquivo,
      }));

      const { data, error } = await (supabase as any)
        .from("card_transacoes_brutas")
        .insert(payload)
        .select();
      if (error) throw error;

      // Registrar importação
      await (supabase as any).from("card_importacoes").insert({
        user_id: user.id,
        adquirente,
        tipo_arquivo: tipoArquivo,
        nome_arquivo: nomeArquivo,
        total_linhas: totalLinhas,
        total_importadas: transacoes.length,
        total_erros: totalErros,
        status: "concluido",
        processado_em: new Date().toISOString(),
      });

      // Audit log
      await (supabase as any).from("card_audit_logs").insert({
        user_id: user.id,
        acao: "import_lote",
        entidade: "card_transacoes_brutas",
        detalhes: { quantidade: transacoes.length, adquirente, tipoArquivo, nomeArquivo },
      });

      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data?.length || 0} transações importadas com sucesso!`);
      qc.invalidateQueries({ queryKey: ["card-transacoes"] });
      qc.invalidateQueries({ queryKey: ["card-importacoes"] });
    },
    onError: (e: any) => toast.error("Erro ao importar: " + e.message),
  });

  const auditar = useMutation({
    mutationFn: async ({
      id,
      status,
      observacoes,
    }: {
      id: string;
      status: string;
      observacoes?: string;
    }) => {
      const { error } = await (supabase as any)
        .from("card_transacoes_brutas")
        .update({
          status_auditoria: status,
          observacoes,
          data_conciliacao: status === "ok" ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
      await (supabase as any).from("card_audit_logs").insert({
        user_id: user!.id,
        acao: "auditar",
        entidade: "card_transacoes_brutas",
        entidade_id: id,
        detalhes: { status, observacoes },
      });
    },
    onSuccess: () => {
      toast.success("Transação auditada");
      qc.invalidateQueries({ queryKey: ["card-transacoes"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const auditarLote = useMutation({
    mutationFn: async ({
      ids,
      status,
    }: {
      ids: string[];
      status: string;
    }) => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await (supabase as any)
        .from("card_transacoes_brutas")
        .update({
          status_auditoria: status,
          data_conciliacao: status === "ok" ? new Date().toISOString() : null,
        })
        .in("id", ids);
      if (error) throw error;
      await (supabase as any).from("card_audit_logs").insert({
        user_id: user.id,
        acao: "auditar_lote",
        entidade: "card_transacoes_brutas",
        detalhes: { quantidade: ids.length, status },
      });
    },
    onSuccess: (_, vars) => {
      toast.success(`${vars.ids.length} transações auditadas como "${vars.status}"`);
      qc.invalidateQueries({ queryKey: ["card-transacoes"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const zerarDashboard = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from("card_transacoes_brutas")
        .delete()
        .eq("user_id", user!.id);
      if (error) throw error;
      await (supabase as any).from("card_audit_logs").insert({
        user_id: user!.id,
        acao: "zerar_dashboard",
        entidade: "card_transacoes_brutas",
      });
    },
    onSuccess: () => {
      toast.success("Dashboard zerado. Pronto para reprocessamento.");
      qc.invalidateQueries({ queryKey: ["card-transacoes"] });
      qc.invalidateQueries({ queryKey: ["card-importacoes"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const salvarSimulacao = useMutation({
    mutationFn: async (sim: {
      nome: string;
      valor_bruto: number;
      taxa_mdr: number;
      aliquota_cbs: number;
      aliquota_ibs: number;
      ano_referencia: number;
      valor_mdr: number;
      valor_cbs: number;
      valor_ibs: number;
      valor_liquido: number;
    }) => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await (supabase as any)
        .from("card_simulacoes_salvas")
        .insert({ ...sim, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Simulação salva"),
    onError: (e: any) => toast.error(e.message),
  });

  // --- Computed Values ---

  const transacoes = transacoesQuery.data || [];
  const aliquotas = aliquotasQuery.data || [];
  const importacoes = importacoesQuery.data || [];
  const empresa = empresaQuery.data;
  const anoAtual = new Date().getFullYear();
  const aliquotaVigente =
    aliquotas.find((a) => a.ano === anoAtual) ||
    aliquotas.find((a) => a.ano === 2026) ||
    { ano: anoAtual, aliquota_cbs: 0, aliquota_ibs: 0 };

  // Filtros aplicados
  const transacoesFiltradas = useMemo(() => {
    return transacoes.filter((t) => {
      if (filtros.dataInicio && t.data_venda < filtros.dataInicio) return false;
      if (filtros.dataFim && t.data_venda > filtros.dataFim) return false;
      if (filtros.adquirente !== "todas" && t.adquirente !== filtros.adquirente) return false;
      if (filtros.bandeira !== "todas" && t.bandeira !== filtros.bandeira) return false;
      if (filtros.status !== "todos" && t.status_auditoria !== filtros.status) return false;
      if (filtros.tipoTransacao !== "todos" && t.tipo_transacao !== filtros.tipoTransacao) return false;
      if (filtros.search) {
        const s = filtros.search.toLowerCase();
        const match =
          (t.nsu || "").toLowerCase().includes(s) ||
          (t.bandeira || "").toLowerCase().includes(s) ||
          (t.adquirente || "").toLowerCase().includes(s) ||
          (t.observacoes || "").toLowerCase().includes(s);
        if (!match) return false;
      }
      return true;
    });
  }, [transacoes, filtros]);

  // Dashboard consolidado
  const dashboard = useMemo(() => {
    const totalBruto = transacoes.reduce((s, t) => s + Number(t.valor_bruto), 0);
    const totalLiquido = transacoes.reduce((s, t) => s + Number(t.valor_liquido), 0);
    const totalTaxa = transacoes.reduce((s, t) => s + Number(t.valor_taxa), 0);
    const pendentes = transacoes.filter((t) => t.status_auditoria === "pendente").length;
    const conferidas = transacoes.filter((t) => t.status_auditoria === "ok").length;
    const divergentes = transacoes.filter((t) => t.status_auditoria === "divergente").length;
    const chargebacks = transacoes.filter((t) => t.status_auditoria === "chargeback").length;

    const split = transacoes.reduce(
      (acc, t) => {
        const r = calcularSplitPayment({
          valor_bruto: Number(t.valor_bruto),
          taxa_mdr: Number(t.taxa_mdr),
          aliquota_cbs: aliquotaVigente.aliquota_cbs,
          aliquota_ibs: aliquotaVigente.aliquota_ibs,
        });
        acc.cbs += r.valor_cbs;
        acc.ibs += r.valor_ibs;
        acc.liquidoProjetado += r.valor_liquido_empresa;
        return acc;
      },
      { cbs: 0, ibs: 0, liquidoProjetado: 0 }
    );

    // Breakdown por adquirente
    const porAdquirente = Object.entries(
      transacoes.reduce(
        (acc, t) => {
          const key = t.adquirente || "outras";
          if (!acc[key]) acc[key] = { total: 0, bruto: 0, liquido: 0, taxas: 0 };
          acc[key].total++;
          acc[key].bruto += Number(t.valor_bruto);
          acc[key].liquido += Number(t.valor_liquido);
          acc[key].taxas += Number(t.valor_taxa);
          return acc;
        },
        {} as Record<string, { total: number; bruto: number; liquido: number; taxas: number }>
      )
    ).map(([adquirente, v]) => ({
      adquirente,
      ...v,
      taxaPercentual: v.bruto > 0 ? (v.taxas / v.bruto) * 100 : 0,
    }));

    // Breakdown por bandeira
    const porBandeira = Object.entries(
      transacoes.reduce(
        (acc, t) => {
          const key = t.bandeira || "outros";
          if (!acc[key]) acc[key] = { total: 0, bruto: 0, liquido: 0 };
          acc[key].total++;
          acc[key].bruto += Number(t.valor_bruto);
          acc[key].liquido += Number(t.valor_liquido);
          return acc;
        },
        {} as Record<string, { total: number; bruto: number; liquido: number }>
      )
    ).map(([bandeira, v]) => ({ bandeira, ...v }));

    // Previsão de cash flow (próximos 30 dias por data_prevista_recebimento)
    const hoje = new Date();
    const limite = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000);
    const cashFlowPrevisto = transacoes
      .filter((t) => {
        if (!t.data_prevista_recebimento) return false;
        const d = new Date(t.data_prevista_recebimento);
        return d >= hoje && d <= limite && t.status_auditoria !== "chargeback";
      })
      .reduce((acc, t) => {
        const key = t.data_prevista_recebimento!.slice(0, 10);
        if (!acc[key]) acc[key] = { data: key, valor: 0 };
        acc[key].valor += Number(t.valor_liquido);
        return acc;
      }, {} as Record<string, { data: string; valor: number }>);

    return {
      totalBruto,
      totalLiquido,
      totalTaxa,
      pendentes,
      conferidas,
      divergentes,
      chargebacks,
      total: transacoes.length,
      split,
      aliquotaVigente,
      porAdquirente,
      porBandeira,
      cashFlowPrevisto: Object.values(cashFlowPrevisto).sort((a, b) =>
        a.data.localeCompare(b.data)
      ),
    };
  }, [transacoes, aliquotaVigente]);

  // --- File Processing ---

  const processFile = useCallback(
    async (file: File, adquirente: string, tipoImport: string) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const isOfx = ext === "ofx";

      const text = await file.text();

      if (isOfx) {
        const ofx = parseOFX(text);
        const rows = ofxToCardTransactions(ofx, adquirente);
        const transacoesMap = rows.map((r) => ({
          ...r,
          adquirente,
          tipo_transacao: r.tipo_transacao || tipoImport,
          arquivo_origem: file.name,
        }));
        return {
          transacoes: transacoesMap,
          tipoArquivo: "ofx",
          totalLinhas: rows.length,
          totalErros: 0,
        };
      }

      // CSV/Excel
      const result = parseExtratoAvancado(text, adquirente);
      const transacoesMap = result.rows
        .filter((r) => r.data_venda && r.valor_bruto > 0)
        .map((r) => ({
          ...r,
          adquirente,
          tipo_transacao: r.tipo_transacao || tipoImport,
          arquivo_origem: file.name,
        }));
      return {
        transacoes: transacoesMap,
        tipoArquivo: "csv",
        totalLinhas: result.rows.length,
        totalErros: result.errors.length,
      };
    },
    []
  );

  // --- Report Data Builder ---

  const buildReportData = useCallback(
    (tipoRelatorio: ReportData["tipoRelatorio"]): ReportData => {
      const periodoInicio =
        filtros.dataInicio ||
        transacoes.reduce(
          (min, t) => (t.data_venda < min ? t.data_venda : min),
          "9999-12-31"
        );
      const periodoFim =
        filtros.dataFim ||
        transacoes.reduce(
          (max, t) => (t.data_venda > max ? t.data_venda : max),
          "0000-01-01"
        );

      return {
        empresa: {
          nome_fantasia: empresa?.nome_fantasia || "Minha Empresa",
          razao_social: empresa?.razao_social || "",
          cnpj: empresa?.cnpj || "",
          logo_url: empresa?.logo_url || undefined,
        },
        periodo: { inicio: periodoInicio, fim: periodoFim },
        resumo: {
          totalBruto: dashboard.totalBruto,
          totalLiquido: dashboard.totalLiquido,
          totalTaxas: dashboard.totalTaxa,
          totalTransacoes: dashboard.total,
          pendentes: dashboard.pendentes,
          conferidas: dashboard.conferidas,
          divergentes: dashboard.divergentes,
          chargebacks: dashboard.chargebacks,
        },
        porAdquirente: dashboard.porAdquirente,
        porBandeira: dashboard.porBandeira,
        split: {
          aliquotaAno: aliquotaVigente.ano,
          cbs: dashboard.split.cbs,
          ibs: dashboard.split.ibs,
          liquidoProjetado: dashboard.split.liquidoProjetado,
        },
        tipoRelatorio,
      };
    },
    [filtros, transacoes, empresa, dashboard, aliquotaVigente]
  );

  return {
    // Data
    transacoes,
    transacoesFiltradas,
    aliquotas,
    importacoes,
    empresa,
    aliquotaVigente,
    dashboard,
    filtros,
    setFiltros,
    // Loading
    isLoading: transacoesQuery.isLoading,
    // Mutations
    importarLote,
    auditar,
    auditarLote,
    zerarDashboard,
    salvarSimulacao,
    // Helpers
    processFile,
    buildReportData,
    // Constants
    ADQUIRENTES,
    TIPOS_TRANSACAO,
    BANDEIRAS,
  };
}