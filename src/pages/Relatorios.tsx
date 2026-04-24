import { useState, useMemo, useEffect, useCallback } from "react";
import { useTableQuery } from "@/hooks/useSupabaseQuery";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileDown, FileText, Filter, TrendingUp, TrendingDown, DollarSign, FileSpreadsheet, BarChart3, PieChart as PieChartIcon, Receipt, Wallet, Loader2, Brain, CalendarIcon, RefreshCw, Clock, ArrowRightLeft } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, ComposedChart, Line,
} from "recharts";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";
const fmtNum = (v: number) => v.toFixed(2).replace(".", ",");

type ReportType = "contas_receber" | "contas_pagar" | "fluxo_caixa" | "dfc" | "orcamento" | "ciclo_financeiro" | "resumo";

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// Professional color palette for PDF
const COLORS = {
  primary: [30, 58, 95] as [number, number, number],       // Dark navy
  secondary: [52, 73, 94] as [number, number, number],     // Slate
  accent: [41, 128, 185] as [number, number, number],      // Professional blue
  success: [39, 174, 96] as [number, number, number],      // Green
  danger: [192, 57, 43] as [number, number, number],       // Red
  warning: [243, 156, 18] as [number, number, number],     // Amber
  purple: [142, 68, 173] as [number, number, number],      // Purple
  lightBg: [248, 249, 250] as [number, number, number],    // Light gray bg
  headerBg: [30, 58, 95] as [number, number, number],      // Dark navy for headers
  kpiBg: [240, 244, 248] as [number, number, number],      // KPI background
  white: [255, 255, 255] as [number, number, number],
  text: [44, 62, 80] as [number, number, number],
  mutedText: [127, 140, 141] as [number, number, number],
  border: [220, 224, 228] as [number, number, number],
};

export default function Relatorios() {
  const { user } = useAuth();
  const { data: contasReceber = [] } = useTableQuery("contas_receber");
  const { data: contasPagar = [] } = useTableQuery("contas_pagar");
  const { data: lancamentos = [] } = useTableQuery("lancamentos_caixa");
  const { data: categorias = [] } = useTableQuery("categorias");
  const { data: clientes = [] } = useTableQuery("clientes");
  const { data: fornecedores = [] } = useTableQuery("fornecedores");
  const { data: metas = [] } = useTableQuery("metas_orcamentarias");

  useRealtimeSubscription("contas_receber", [["contas_receber"]]);
  useRealtimeSubscription("contas_pagar", [["contas_pagar"]]);
  useRealtimeSubscription("lancamentos_caixa", [["lancamentos_caixa"]]);
  useRealtimeSubscription("categorias", [["categorias"]]);

  const [reportType, setReportType] = useState<ReportType>("resumo");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [empresa, setEmpresa] = useState<any>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    supabase.from("empresa").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) setEmpresa(data);
    });
  }, [user]);

  const clientesMap = useMemo(() => Object.fromEntries((clientes as any[]).map(c => [c.id, c.nome])), [clientes]);
  const fornecedoresMap = useMemo(() => Object.fromEntries((fornecedores as any[]).map(f => [f.id, f.nome])), [fornecedores]);
  const categoriasMap = useMemo(() => Object.fromEntries((categorias as any[]).map(c => [c.id, c.nome])), [categorias]);

  const filterByDate = (items: any[], dateField: string) => {
    return items.filter((item: any) => {
      const d = item[dateField];
      if (!d) return false;
      if (dataInicio && d < dataInicio) return false;
      if (dataFim && d > dataFim) return false;
      if (statusFilter !== "todos" && item.status !== statusFilter) return false;
      return true;
    });
  };

  const filteredReceber = useMemo(() => filterByDate(contasReceber as any[], "data_vencimento"), [contasReceber, dataInicio, dataFim, statusFilter]);
  const filteredPagar = useMemo(() => filterByDate(contasPagar as any[], "data_vencimento"), [contasPagar, dataInicio, dataFim, statusFilter]);
  const filteredLancamentos = useMemo(() => {
    return (lancamentos as any[]).filter((l: any) => {
      if (dataInicio && l.data_lancamento < dataInicio) return false;
      if (dataFim && l.data_lancamento > dataFim) return false;
      return true;
    });
  }, [lancamentos, dataInicio, dataFim]);

  const totalReceber = filteredReceber.reduce((s: number, c: any) => s + Number(c.valor), 0);
  const totalPagar = filteredPagar.reduce((s: number, c: any) => s + Number(c.valor), 0);
  const totalEntradas = filteredLancamentos.filter((l: any) => l.tipo === "entrada").reduce((s: number, l: any) => s + Number(l.valor), 0);
  const totalSaidas = filteredLancamentos.filter((l: any) => l.tipo === "saida").reduce((s: number, l: any) => s + Number(l.valor), 0);

  const receberPendentes = filteredReceber.filter((c: any) => c.status === "pendente");
  const receberRecebidos = filteredReceber.filter((c: any) => c.status === "recebido");
  const receberVencidos = filteredReceber.filter((c: any) => {
    if (c.status !== "pendente") return false;
    return c.data_vencimento < new Date().toISOString().split("T")[0];
  });
  const pagarPendentes = filteredPagar.filter((c: any) => c.status === "pendente");
  const pagarPagos = filteredPagar.filter((c: any) => c.status === "pago");
  const pagarVencidos = filteredPagar.filter((c: any) => {
    if (c.status !== "pendente") return false;
    return c.data_vencimento < new Date().toISOString().split("T")[0];
  });

  // DFC data
  const dfcData = useMemo(() => {
    const months: Record<string, { entradas: number; saidas: number; recebimentos: number; pagamentos: number }> = {};
    (lancamentos as any[]).forEach((l: any) => {
      if (dataInicio && l.data_lancamento < dataInicio) return;
      if (dataFim && l.data_lancamento > dataFim) return;
      const mes = l.data_lancamento?.substring(0, 7);
      if (!mes) return;
      if (!months[mes]) months[mes] = { entradas: 0, saidas: 0, recebimentos: 0, pagamentos: 0 };
      if (l.tipo === "entrada") months[mes].entradas += Number(l.valor);
      else months[mes].saidas += Number(l.valor);
    });
    (contasReceber as any[]).forEach((c: any) => {
      if (c.status !== "recebido" || !c.data_recebimento) return;
      if (dataInicio && c.data_recebimento < dataInicio) return;
      if (dataFim && c.data_recebimento > dataFim) return;
      const mes = c.data_recebimento.substring(0, 7);
      if (!months[mes]) months[mes] = { entradas: 0, saidas: 0, recebimentos: 0, pagamentos: 0 };
      months[mes].recebimentos += Number(c.valor);
    });
    (contasPagar as any[]).forEach((c: any) => {
      if (c.status !== "pago" || !c.data_pagamento) return;
      if (dataInicio && c.data_pagamento < dataInicio) return;
      if (dataFim && c.data_pagamento > dataFim) return;
      const mes = c.data_pagamento.substring(0, 7);
      if (!months[mes]) months[mes] = { entradas: 0, saidas: 0, recebimentos: 0, pagamentos: 0 };
      months[mes].pagamentos += Number(c.valor);
    });
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([mes, v]) => ({
      mes,
      mesLabel: (() => { const [y, m] = mes.split("-"); return `${MESES[parseInt(m) - 1]}/${y}`; })(),
      ...v,
      saldo: v.entradas + v.recebimentos - v.saidas - v.pagamentos,
    }));
  }, [lancamentos, contasReceber, contasPagar, dataInicio, dataFim]);

  // Orçamento data
  const orcamentoData = useMemo(() => {
    const catMap: Record<string, { nome: string; orcado: number; realizado: number }> = {};
    (metas as any[]).forEach((m: any) => {
      const nome = categoriasMap[m.categoria_id] || "Sem categoria";
      const key = m.categoria_id || "sem";
      if (!catMap[key]) catMap[key] = { nome, orcado: 0, realizado: 0 };
      catMap[key].orcado += Number(m.valor_orcado);
    });
    (lancamentos as any[]).forEach((l: any) => {
      if (dataInicio && l.data_lancamento < dataInicio) return;
      if (dataFim && l.data_lancamento > dataFim) return;
      const key = l.categoria_id || "sem";
      const nome = categoriasMap[l.categoria_id] || "Sem categoria";
      if (!catMap[key]) catMap[key] = { nome, orcado: 0, realizado: 0 };
      catMap[key].realizado += Number(l.valor);
    });
    (contasPagar as any[]).forEach((c: any) => {
      if (c.status !== "pendente") return;
      if (dataInicio && c.data_vencimento < dataInicio) return;
      if (dataFim && c.data_vencimento > dataFim) return;
      const key = c.categoria_id || "sem";
      const nome = categoriasMap[c.categoria_id] || "Sem categoria";
      if (!catMap[key]) catMap[key] = { nome, orcado: 0, realizado: 0 };
      if (catMap[key].orcado === 0) catMap[key].orcado += Number(c.valor);
    });
    (contasReceber as any[]).forEach((c: any) => {
      if (c.status !== "pendente") return;
      if (dataInicio && c.data_vencimento < dataInicio) return;
      if (dataFim && c.data_vencimento > dataFim) return;
      const key = c.categoria_id || "sem";
      const nome = categoriasMap[c.categoria_id] || "Sem categoria";
      if (!catMap[key]) catMap[key] = { nome, orcado: 0, realizado: 0 };
      if (catMap[key].orcado === 0) catMap[key].orcado += Number(c.valor);
    });
    return Object.values(catMap).filter(c => c.orcado > 0 || c.realizado > 0);
  }, [metas, lancamentos, contasPagar, contasReceber, categoriasMap, dataInicio, dataFim]);

  // Ciclo Financeiro data
  const cicloFinanceiroData = useMemo(() => {
    const cr = contasReceber as any[];
    const cp = contasPagar as any[];

    // Filter by date if set
    const crFiltered = cr.filter((c: any) => {
      if (dataInicio && c.data_vencimento < dataInicio) return false;
      if (dataFim && c.data_vencimento > dataFim) return false;
      return true;
    });
    const cpFiltered = cp.filter((c: any) => {
      if (dataInicio && c.data_vencimento < dataInicio) return false;
      if (dataFim && c.data_vencimento > dataFim) return false;
      return true;
    });

    // PMR - Prazo Médio de Recebimento (dias entre emissão e recebimento)
    const recebidos = crFiltered.filter(c => c.status === "recebido" && c.data_recebimento && c.data_emissao);
    let totalDiasRecebimento = 0;
    recebidos.forEach((c: any) => {
      const emissao = new Date(c.data_emissao + "T00:00:00");
      const recebimento = new Date(c.data_recebimento + "T00:00:00");
      totalDiasRecebimento += Math.max(0, (recebimento.getTime() - emissao.getTime()) / (1000 * 60 * 60 * 24));
    });
    const pmr = recebidos.length > 0 ? totalDiasRecebimento / recebidos.length : 0;

    // PMP - Prazo Médio de Pagamento (dias entre emissão e pagamento)
    const pagos = cpFiltered.filter(c => c.status === "pago" && c.data_pagamento && c.data_emissao);
    let totalDiasPagamento = 0;
    pagos.forEach((c: any) => {
      const emissao = new Date(c.data_emissao + "T00:00:00");
      const pagamento = new Date(c.data_pagamento + "T00:00:00");
      totalDiasPagamento += Math.max(0, (pagamento.getTime() - emissao.getTime()) / (1000 * 60 * 60 * 24));
    });
    const pmp = pagos.length > 0 ? totalDiasPagamento / pagos.length : 0;

    // Ciclo Financeiro = PMR - PMP
    const cicloFinanceiro = pmr - pmp;

    // Necessidade de Capital de Giro
    const receberPendVal = crFiltered.filter(c => c.status === "pendente").reduce((s: number, c: any) => s + Number(c.valor), 0);
    const pagarPendVal = cpFiltered.filter(c => c.status === "pendente").reduce((s: number, c: any) => s + Number(c.valor), 0);
    const ncg = receberPendVal - pagarPendVal;

    // Monthly breakdown
    const mesesMap: Record<string, { pmr: number; pmp: number; ciclo: number; qtdRec: number; qtdPag: number }> = {};
    const MESES_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    recebidos.forEach((c: any) => {
      const mes = new Date(c.data_recebimento + "T00:00:00").getMonth();
      const key = MESES_SHORT[mes];
      if (!mesesMap[key]) mesesMap[key] = { pmr: 0, pmp: 0, ciclo: 0, qtdRec: 0, qtdPag: 0 };
      const dias = Math.max(0, (new Date(c.data_recebimento + "T00:00:00").getTime() - new Date(c.data_emissao + "T00:00:00").getTime()) / (1000 * 60 * 60 * 24));
      mesesMap[key].pmr = (mesesMap[key].pmr * mesesMap[key].qtdRec + dias) / (mesesMap[key].qtdRec + 1);
      mesesMap[key].qtdRec++;
    });
    pagos.forEach((c: any) => {
      const mes = new Date(c.data_pagamento + "T00:00:00").getMonth();
      const key = MESES_SHORT[mes];
      if (!mesesMap[key]) mesesMap[key] = { pmr: 0, pmp: 0, ciclo: 0, qtdRec: 0, qtdPag: 0 };
      const dias = Math.max(0, (new Date(c.data_pagamento + "T00:00:00").getTime() - new Date(c.data_emissao + "T00:00:00").getTime()) / (1000 * 60 * 60 * 24));
      mesesMap[key].pmp = (mesesMap[key].pmp * mesesMap[key].qtdPag + dias) / (mesesMap[key].qtdPag + 1);
      mesesMap[key].qtdPag++;
    });

    const chartData = MESES_SHORT.filter(m => mesesMap[m]).map(m => {
      const d = mesesMap[m];
      return { mes: m, pmr: Math.round(d.pmr), pmp: Math.round(d.pmp), ciclo: Math.round(d.pmr - d.pmp) };
    });

    // Diagnóstico
    let diagnostico = "";
    let saude: "excelente" | "bom" | "atencao" | "critico" = "bom";
    if (cicloFinanceiro <= 0) {
      diagnostico = "Excelente! Seu ciclo financeiro é negativo, o que significa que a empresa recebe dos clientes antes de precisar pagar os fornecedores. Isso gera folga de caixa e reduz a necessidade de capital de giro.";
      saude = "excelente";
    } else if (cicloFinanceiro <= 15) {
      diagnostico = "Bom. O ciclo financeiro está dentro de uma faixa saudável. A empresa tem um intervalo curto entre o pagamento a fornecedores e o recebimento de clientes, com baixa necessidade de capital de giro externo.";
      saude = "bom";
    } else if (cicloFinanceiro <= 45) {
      diagnostico = "Atenção. O ciclo financeiro indica que a empresa precisa financiar suas operações por um período considerável. Considere negociar prazos maiores com fornecedores ou antecipar recebíveis para reduzir a necessidade de capital de giro.";
      saude = "atencao";
    } else {
      diagnostico = "Crítico! O ciclo financeiro está muito longo, exigindo alto volume de capital de giro para manter as operações. É urgente renegociar prazos de pagamento com fornecedores, reduzir prazos de recebimento de clientes e avaliar a antecipação de recebíveis.";
      saude = "critico";
    }

    return { pmr, pmp, cicloFinanceiro, ncg, receberPendVal, pagarPendVal, recebidos: recebidos.length, pagos: pagos.length, chartData, diagnostico, saude, totalCR: crFiltered.length, totalCP: cpFiltered.length };
  }, [contasReceber, contasPagar, dataInicio, dataFim]);

  // ═══════════════════════════════════════════
  // PROFESSIONAL PDF GENERATION
  // ═══════════════════════════════════════════

  const addPdfHeader = (doc: jsPDF, title: string): number => {
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();

    // Top accent bar
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pw, 4, "F");

    // Company name
    let y = 16;
    const empresaNome = empresa?.nome_fantasia || empresa?.razao_social || "9Nine Business Control";
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.primary);
    doc.text(empresaNome.toUpperCase(), pw / 2, y, { align: "center" });
    y += 6;

    // Company details line
    const details: string[] = [];
    if (empresa?.cnpj) details.push(`CNPJ: ${empresa.cnpj}`);
    if (empresa?.telefone) details.push(`Tel: ${empresa.telefone}`);
    if (empresa?.email) details.push(empresa.email);
    if (details.length > 0) {
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.mutedText);
      doc.text(details.join("  |  "), pw / 2, y, { align: "center" });
      y += 5;
    }

    // Address line
    if (empresa?.endereco) {
      const addr = [empresa.endereco, empresa.numero, empresa.bairro, empresa.cidade, empresa.estado, empresa.cep].filter(Boolean).join(", ");
      doc.setFontSize(7);
      doc.text(addr, pw / 2, y, { align: "center" });
      y += 5;
    }

    // Separator
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.5);
    doc.line(14, y, pw - 14, y);
    y += 8;

    // Report title with background
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(14, y - 4, pw - 28, 10, 2, 2, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.white);
    doc.text(title.toUpperCase(), pw / 2, y + 3, { align: "center" });
    y += 12;

    // Period and generation info
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.mutedText);
    const periodo = dataInicio || dataFim
      ? `Período: ${dataInicio ? fmtDate(dataInicio) : "início"} a ${dataFim ? fmtDate(dataFim) : "atual"}`
      : "Período: Todos os registros";
    doc.text(periodo, 14, y);
    doc.text(`Emitido em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, pw - 14, y, { align: "right" });
    y += 8;

    return y;
  };

  const addPdfFooter = (doc: jsPDF) => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      // Bottom accent bar
      doc.setFillColor(...COLORS.primary);
      doc.rect(0, ph - 4, pw, 4, "F");
      // Page number
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.mutedText);
      doc.text(`Página ${i} de ${pageCount}`, pw / 2, ph - 7, { align: "center" });
      // System name
      doc.text("9Nine Business Control", 14, ph - 7);
      const empresaNome = empresa?.nome_fantasia || empresa?.razao_social || "";
      if (empresaNome) doc.text(empresaNome, pw - 14, ph - 7, { align: "right" });
    }
  };

  const drawKpiBox = (doc: jsPDF, x: number, y: number, w: number, h: number, label: string, value: string, color: [number, number, number]) => {
    // Box with border
    doc.setFillColor(...COLORS.kpiBg);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 2, 2, "FD");

    // Color accent left bar
    doc.setFillColor(...color);
    doc.roundedRect(x, y, 3, h, 2, 0, "F");
    doc.rect(x + 1.5, y, 1.5, h, "F");

    // Label
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.mutedText);
    doc.text(label, x + 7, y + 6);

    // Value
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...color);
    doc.text(value, x + 7, y + 14);
  };

  const drawKpiRow = (doc: jsPDF, y: number, kpis: { label: string; value: string; color: [number, number, number] }[]): number => {
    const pw = doc.internal.pageSize.getWidth();
    const margin = 14;
    const gap = 4;
    const cols = kpis.length;
    const boxW = (pw - margin * 2 - gap * (cols - 1)) / cols;
    const boxH = 18;
    kpis.forEach((kpi, i) => {
      drawKpiBox(doc, margin + i * (boxW + gap), y, boxW, boxH, kpi.label, kpi.value, kpi.color);
    });
    return y + boxH + 6;
  };

  const tableTheme = (color: [number, number, number]) => ({
    styles: {
      fontSize: 7.5,
      cellPadding: 3,
      lineColor: COLORS.border,
      lineWidth: 0.2,
      textColor: COLORS.text,
    },
    headStyles: {
      fillColor: color,
      textColor: COLORS.white,
      fontStyle: "bold" as const,
      fontSize: 7.5,
      halign: "left" as const,
    },
    alternateRowStyles: {
      fillColor: [248, 249, 252] as [number, number, number],
    },
    footStyles: {
      fillColor: [230, 234, 240] as [number, number, number],
      textColor: COLORS.primary,
      fontStyle: "bold" as const,
      fontSize: 8,
    },
    margin: { left: 14, right: 14 },
  });

  const getFinancialDataForAI = useCallback(() => {
    const saldo = totalEntradas - totalSaidas;
    const receberPendVal = receberPendentes.reduce((s: number, c: any) => s + Number(c.valor), 0);
    const pagarPendVal = pagarPendentes.reduce((s: number, c: any) => s + Number(c.valor), 0);

    if (reportType === "contas_receber") {
      return {
        totalReceber, pendentes: receberPendentes.length, recebidos: receberRecebidos.length,
        vencidos: receberVencidos.length, valorPendente: receberPendVal,
        taxaRecebimento: filteredReceber.length > 0 ? ((receberRecebidos.length / filteredReceber.length) * 100).toFixed(1) + "%" : "0%",
        taxaInadimplencia: filteredReceber.length > 0 ? ((receberVencidos.length / filteredReceber.length) * 100).toFixed(1) + "%" : "0%",
      };
    } else if (reportType === "contas_pagar") {
      return {
        totalPagar, pendentes: pagarPendentes.length, pagos: pagarPagos.length,
        vencidos: pagarVencidos.length, valorPendente: pagarPendVal,
        taxaPagamento: filteredPagar.length > 0 ? ((pagarPagos.length / filteredPagar.length) * 100).toFixed(1) + "%" : "0%",
      };
    } else if (reportType === "fluxo_caixa") {
      return { totalEntradas, totalSaidas, saldoLiquido: saldo, qtdLancamentos: filteredLancamentos.length };
    } else if (reportType === "dfc") {
      const totalEnt = dfcData.reduce((s, d) => s + d.entradas + d.recebimentos, 0);
      const totalSai = dfcData.reduce((s, d) => s + d.saidas + d.pagamentos, 0);
      return { totalIngressos: totalEnt, totalDesembolsos: totalSai, geracaoCaixa: totalEnt - totalSai, meses: dfcData.map(d => ({ mes: d.mesLabel, saldo: d.saldo })) };
    } else if (reportType === "orcamento") {
      const totalOrc = orcamentoData.reduce((s, d) => s + d.orcado, 0);
      const totalReal = orcamentoData.reduce((s, d) => s + d.realizado, 0);
      return { totalOrcado: totalOrc, totalRealizado: totalReal, variacao: totalReal - totalOrc, pctExecucao: totalOrc > 0 ? ((totalReal / totalOrc) * 100).toFixed(1) + "%" : "0%", categorias: orcamentoData.length };
    } else if (reportType === "ciclo_financeiro") {
      return {
        pmr: cicloFinanceiroData.pmr.toFixed(1) + " dias",
        pmp: cicloFinanceiroData.pmp.toFixed(1) + " dias",
        cicloFinanceiro: cicloFinanceiroData.cicloFinanceiro.toFixed(1) + " dias",
        necessidadeCapitalGiro: cicloFinanceiroData.ncg,
        contasReceberPendentes: cicloFinanceiroData.receberPendVal,
        contasPagarPendentes: cicloFinanceiroData.pagarPendVal,
        qtdRecebimentos: cicloFinanceiroData.recebidos,
        qtdPagamentos: cicloFinanceiroData.pagos,
        diagnostico: cicloFinanceiroData.diagnostico,
        saude: cicloFinanceiroData.saude,
      };
    } else {
      return {
        totalReceber, totalPagar, totalEntradas, totalSaidas, saldo,
        pendentesReceber: receberPendentes.length, pendentesPagar: pagarPendentes.length,
        vencidosReceber: receberVencidos.length, vencidosPagar: pagarVencidos.length,
        posicaoLiquida: receberPendVal - pagarPendVal,
      };
    }
  }, [reportType, totalReceber, totalPagar, totalEntradas, totalSaidas, receberPendentes, receberRecebidos, receberVencidos, pagarPendentes, pagarPagos, pagarVencidos, filteredReceber, filteredPagar, filteredLancamentos, dfcData, orcamentoData, cicloFinanceiroData]);

  const fetchCommentary = async (): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke("financial-commentary", {
        body: {
          reportType,
          financialData: getFinancialDataForAI(),
          empresaNome: empresa?.nome_fantasia || empresa?.razao_social || "Empresa",
        },
      });
      if (error) throw error;
      return data?.commentary || "";
    } catch (e: any) {
      console.error("Erro ao gerar comentário:", e);
      return "";
    }
  };

  const addCommentaryToPdf = (doc: jsPDF, commentary: string) => {
    if (!commentary) return;
    const pw = doc.internal.pageSize.getWidth();
    const margin = 14;
    const maxWidth = pw - margin * 2 - 10;

    doc.addPage();
    let y = 20;

    // Title bar
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(margin, y - 4, pw - margin * 2, 10, 2, 2, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.white);
    doc.text("PARECER ECONÔMICO-FINANCEIRO", pw / 2, y + 3, { align: "center" });
    y += 16;

    // Commentary box
    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(...COLORS.accent);
    doc.setLineWidth(0.8);

    const paragraphs = commentary.split("\n").filter(p => p.trim());
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.text);

    // Calculate total height
    let totalTextHeight = 0;
    const allLines: string[][] = [];
    paragraphs.forEach(p => {
      const lines = doc.splitTextToSize(p.trim(), maxWidth);
      allLines.push(lines);
      totalTextHeight += lines.length * 4.5 + 3;
    });

    const boxHeight = totalTextHeight + 12;
    doc.roundedRect(margin, y - 4, pw - margin * 2, boxHeight, 3, 3, "FD");

    // Left accent bar
    doc.setFillColor(...COLORS.accent);
    doc.roundedRect(margin, y - 4, 3, boxHeight, 3, 0, "F");
    doc.rect(margin + 1.5, y - 4, 1.5, boxHeight, "F");

    y += 2;
    allLines.forEach(lines => {
      lines.forEach((line: string) => {
        doc.text(line, margin + 8, y);
        y += 4.5;
      });
      y += 3;
    });

    // Signature
    y += 6;
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...COLORS.mutedText);
    doc.text("Parecer gerado automaticamente por inteligência artificial com base nos dados financeiros do período.", margin, y);
    y += 4;
    doc.text(`Data de emissão: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, margin, y);
  };

  const exportPDF = async () => {
    setIsGeneratingPdf(true);
    toast({ title: "Gerando relatório...", description: "Analisando dados financeiros com IA." });

    let commentary = "";
    try {
      commentary = await fetchCommentary();
    } catch (e) {
      console.error("Falha ao obter comentário IA:", e);
    }

    const doc = new jsPDF();
    const titles: Record<ReportType, string> = {
      resumo: "Resumo Executivo Financeiro",
      contas_receber: "Relatório Analítico — Contas a Receber",
      contas_pagar: "Relatório Analítico — Contas a Pagar",
      fluxo_caixa: "Relatório de Fluxo de Caixa",
      dfc: "Demonstração de Fluxo de Caixa — DFC",
      orcamento: "Planejamento Orçamentário — Orçado × Realizado",
      ciclo_financeiro: "Relatório de Ciclo Financeiro",
    };
    let y = addPdfHeader(doc, titles[reportType]);

    if (reportType === "contas_receber") {
      const totalPend = receberPendentes.reduce((s: number, c: any) => s + Number(c.valor), 0);
      const totalRecb = receberRecebidos.reduce((s: number, c: any) => s + Number(c.valor), 0);
      const totalVenc = receberVencidos.reduce((s: number, c: any) => s + Number(c.valor), 0);
      const ticketMedio = filteredReceber.length > 0 ? totalReceber / filteredReceber.length : 0;

      y = drawKpiRow(doc, y, [
        { label: "TOTAL A RECEBER", value: fmt(totalReceber), color: COLORS.accent },
        { label: "PENDENTES", value: `${receberPendentes.length} — ${fmt(totalPend)}`, color: COLORS.warning },
        { label: "RECEBIDOS", value: `${receberRecebidos.length} — ${fmt(totalRecb)}`, color: COLORS.success },
        { label: "VENCIDOS", value: `${receberVencidos.length} — ${fmt(totalVenc)}`, color: COLORS.danger },
      ]);
      y = drawKpiRow(doc, y, [
        { label: "QTD. REGISTROS", value: String(filteredReceber.length), color: COLORS.secondary },
        { label: "TICKET MÉDIO", value: fmt(ticketMedio), color: COLORS.purple },
        { label: "TAXA RECEBIMENTO", value: filteredReceber.length > 0 ? ((receberRecebidos.length / filteredReceber.length) * 100).toFixed(1) + "%" : "0%", color: COLORS.success },
        { label: "TAXA INADIMPLÊNCIA", value: filteredReceber.length > 0 ? ((receberVencidos.length / filteredReceber.length) * 100).toFixed(1) + "%" : "0%", color: COLORS.danger },
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Descrição", "Cliente", "Categoria", "Vencimento", "Status", "Valor (R$)"]],
        body: filteredReceber.map((c: any) => [
          c.descricao, clientesMap[c.cliente_id] || "—", categoriasMap[c.categoria_id] || "—",
          fmtDate(c.data_vencimento), c.status.charAt(0).toUpperCase() + c.status.slice(1), fmt(Number(c.valor)),
        ]),
        foot: [["", "", "", "", "TOTAL GERAL", fmt(totalReceber)]],
        ...tableTheme(COLORS.accent),
        columnStyles: { 5: { halign: "right" } },
      });

    } else if (reportType === "contas_pagar") {
      const totalPend = pagarPendentes.reduce((s: number, c: any) => s + Number(c.valor), 0);
      const totalPg = pagarPagos.reduce((s: number, c: any) => s + Number(c.valor), 0);
      const totalVenc = pagarVencidos.reduce((s: number, c: any) => s + Number(c.valor), 0);
      const ticketMedio = filteredPagar.length > 0 ? totalPagar / filteredPagar.length : 0;

      y = drawKpiRow(doc, y, [
        { label: "TOTAL A PAGAR", value: fmt(totalPagar), color: COLORS.danger },
        { label: "PENDENTES", value: `${pagarPendentes.length} — ${fmt(totalPend)}`, color: COLORS.warning },
        { label: "PAGOS", value: `${pagarPagos.length} — ${fmt(totalPg)}`, color: COLORS.success },
        { label: "VENCIDOS", value: `${pagarVencidos.length} — ${fmt(totalVenc)}`, color: COLORS.danger },
      ]);
      y = drawKpiRow(doc, y, [
        { label: "QTD. REGISTROS", value: String(filteredPagar.length), color: COLORS.secondary },
        { label: "TICKET MÉDIO", value: fmt(ticketMedio), color: COLORS.purple },
        { label: "TAXA PAGAMENTO", value: filteredPagar.length > 0 ? ((pagarPagos.length / filteredPagar.length) * 100).toFixed(1) + "%" : "0%", color: COLORS.success },
        { label: "COMPROMETIMENTO", value: fmt(totalPend), color: COLORS.warning },
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Descrição", "Fornecedor", "Categoria", "Vencimento", "Status", "Valor (R$)"]],
        body: filteredPagar.map((c: any) => [
          c.descricao, fornecedoresMap[c.fornecedor_id] || "—", categoriasMap[c.categoria_id] || "—",
          fmtDate(c.data_vencimento), c.status.charAt(0).toUpperCase() + c.status.slice(1), fmt(Number(c.valor)),
        ]),
        foot: [["", "", "", "", "TOTAL GERAL", fmt(totalPagar)]],
        ...tableTheme(COLORS.danger),
        columnStyles: { 5: { halign: "right" } },
      });

    } else if (reportType === "fluxo_caixa") {
      const saldo = totalEntradas - totalSaidas;
      y = drawKpiRow(doc, y, [
        { label: "ENTRADAS", value: fmt(totalEntradas), color: COLORS.success },
        { label: "SAÍDAS", value: fmt(totalSaidas), color: COLORS.danger },
        { label: "SALDO LÍQUIDO", value: fmt(saldo), color: saldo >= 0 ? COLORS.success : COLORS.danger },
        { label: "QTD. LANÇAMENTOS", value: String(filteredLancamentos.length), color: COLORS.secondary },
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Data", "Descrição", "Tipo", "Categoria", "Valor (R$)"]],
        body: filteredLancamentos.map((l: any) => [
          fmtDate(l.data_lancamento), l.descricao, l.tipo === "entrada" ? "Entrada" : "Saída",
          categoriasMap[l.categoria_id] || "—", fmt(Number(l.valor)),
        ]),
        foot: [
          ["", "", "", "Total Entradas", fmt(totalEntradas)],
          ["", "", "", "Total Saídas", fmt(totalSaidas)],
          ["", "", "", "SALDO LÍQUIDO", fmt(saldo)],
        ],
        ...tableTheme(COLORS.accent),
        columnStyles: { 4: { halign: "right" } },
        didParseCell: (data: any) => {
          if (data.section === "body" && data.column.index === 4) {
            const row = filteredLancamentos[data.row.index];
            if (row) {
              data.cell.styles.textColor = row.tipo === "entrada" ? COLORS.success : COLORS.danger;
              data.cell.styles.fontStyle = "bold";
            }
          }
        },
      });

    } else if (reportType === "dfc") {
      const totalEnt = dfcData.reduce((s, d) => s + d.entradas + d.recebimentos, 0);
      const totalSai = dfcData.reduce((s, d) => s + d.saidas + d.pagamentos, 0);
      const saldoGeral = totalEnt - totalSai;
      const melhorMes = dfcData.length > 0 ? dfcData.reduce((best, d) => d.saldo > best.saldo ? d : best, dfcData[0]) : null;

      y = drawKpiRow(doc, y, [
        { label: "TOTAL INGRESSOS", value: fmt(totalEnt), color: COLORS.success },
        { label: "TOTAL DESEMBOLSOS", value: fmt(totalSai), color: COLORS.danger },
        { label: "GERAÇÃO DE CAIXA", value: fmt(saldoGeral), color: saldoGeral >= 0 ? COLORS.success : COLORS.danger },
        { label: "MELHOR MÊS", value: melhorMes ? `${melhorMes.mesLabel}` : "—", color: COLORS.accent },
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Período", "Entradas (R$)", "Recebimentos (R$)", "Saídas (R$)", "Pagamentos (R$)", "Saldo (R$)"]],
        body: dfcData.map(d => [
          d.mesLabel, fmt(d.entradas), fmt(d.recebimentos), fmt(d.saidas), fmt(d.pagamentos), fmt(d.saldo),
        ]),
        foot: [[
          "TOTAL", fmt(dfcData.reduce((s, d) => s + d.entradas, 0)),
          fmt(dfcData.reduce((s, d) => s + d.recebimentos, 0)),
          fmt(dfcData.reduce((s, d) => s + d.saidas, 0)),
          fmt(dfcData.reduce((s, d) => s + d.pagamentos, 0)),
          fmt(saldoGeral),
        ]],
        ...tableTheme(COLORS.primary),
        columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" } },
        didParseCell: (data: any) => {
          if (data.section === "body") {
            if (data.column.index === 1 || data.column.index === 2) {
              data.cell.styles.textColor = COLORS.success;
              data.cell.styles.fontStyle = "bold";
            }
            if (data.column.index === 3 || data.column.index === 4) {
              data.cell.styles.textColor = COLORS.danger;
              data.cell.styles.fontStyle = "bold";
            }
            if (data.column.index === 5) {
              const d = dfcData[data.row.index];
              if (d) data.cell.styles.textColor = d.saldo >= 0 ? COLORS.success : COLORS.danger;
              data.cell.styles.fontStyle = "bold";
            }
          }
        },
      });

    } else if (reportType === "orcamento") {
      const totalOrc = orcamentoData.reduce((s, d) => s + d.orcado, 0);
      const totalReal = orcamentoData.reduce((s, d) => s + d.realizado, 0);
      const variacao = totalReal - totalOrc;
      const pctExec = totalOrc > 0 ? (totalReal / totalOrc) * 100 : 0;
      const catAcima = orcamentoData.filter(d => d.orcado > 0 && d.realizado > d.orcado * 1.1).length;
      const catAbaixo = orcamentoData.filter(d => d.orcado > 0 && d.realizado < d.orcado * 0.9).length;

      y = drawKpiRow(doc, y, [
        { label: "TOTAL ORÇADO", value: fmt(totalOrc), color: COLORS.accent },
        { label: "TOTAL REALIZADO", value: fmt(totalReal), color: COLORS.purple },
        { label: "VARIAÇÃO", value: fmt(variacao), color: variacao >= 0 ? COLORS.success : COLORS.danger },
        { label: "% EXECUÇÃO", value: pctExec.toFixed(1) + "%", color: pctExec >= 90 && pctExec <= 110 ? COLORS.success : COLORS.warning },
      ]);
      y = drawKpiRow(doc, y, [
        { label: "QTD. CATEGORIAS", value: String(orcamentoData.length), color: COLORS.secondary },
        { label: "ACIMA DO ORÇADO (>10%)", value: String(catAcima), color: COLORS.danger },
        { label: "ABAIXO DO ORÇADO (<90%)", value: String(catAbaixo), color: COLORS.warning },
        { label: "DENTRO DA META", value: String(orcamentoData.length - catAcima - catAbaixo), color: COLORS.success },
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Categoria", "Orçado (R$)", "Realizado (R$)", "Variação (R$)", "% Execução"]],
        body: orcamentoData.map(d => {
          const pct = d.orcado > 0 ? ((d.realizado / d.orcado) * 100) : 0;
          return [d.nome, fmt(d.orcado), fmt(d.realizado), fmt(d.realizado - d.orcado), d.orcado > 0 ? pct.toFixed(1) + "%" : "—"];
        }),
        foot: [["TOTAL", fmt(totalOrc), fmt(totalReal), fmt(variacao), totalOrc > 0 ? pctExec.toFixed(1) + "%" : "—"]],
        ...tableTheme(COLORS.purple),
        columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
        didParseCell: (data: any) => {
          if (data.section === "body" && data.column.index === 3) {
            const d = orcamentoData[data.row.index];
            if (d) data.cell.styles.textColor = d.realizado >= d.orcado ? COLORS.success : COLORS.danger;
          }
          if (data.section === "body" && data.column.index === 4) {
            const d = orcamentoData[data.row.index];
            if (d && d.orcado > 0) {
              const p = (d.realizado / d.orcado) * 100;
              data.cell.styles.textColor = p >= 90 && p <= 110 ? COLORS.success : p > 110 ? COLORS.danger : COLORS.warning;
              data.cell.styles.fontStyle = "bold";
            }
          }
        },
      });

    } else if (reportType === "ciclo_financeiro") {
      const { pmr, pmp, cicloFinanceiro: cf, ncg, receberPendVal: rpv, pagarPendVal: ppv, recebidos: qtdRec, pagos: qtdPag, chartData: cfChart, diagnostico, saude } = cicloFinanceiroData;
      const saudeLabel = saude === "excelente" ? "EXCELENTE" : saude === "bom" ? "BOM" : saude === "atencao" ? "ATENÇÃO" : "CRÍTICO";
      const saudeColor = saude === "excelente" || saude === "bom" ? COLORS.success : saude === "atencao" ? COLORS.warning : COLORS.danger;

      y = drawKpiRow(doc, y, [
        { label: "PMR (PRAZO MÉDIO RECEBIMENTO)", value: pmr.toFixed(1) + " dias", color: COLORS.accent },
        { label: "PMP (PRAZO MÉDIO PAGAMENTO)", value: pmp.toFixed(1) + " dias", color: COLORS.purple },
        { label: "CICLO FINANCEIRO", value: cf.toFixed(1) + " dias", color: cf <= 0 ? COLORS.success : cf <= 15 ? COLORS.accent : cf <= 45 ? COLORS.warning : COLORS.danger },
        { label: "SAÚDE FINANCEIRA", value: saudeLabel, color: saudeColor },
      ]);
      y = drawKpiRow(doc, y, [
        { label: "NECESSIDADE CAP. GIRO", value: fmt(ncg), color: ncg >= 0 ? COLORS.accent : COLORS.danger },
        { label: "A RECEBER (PENDENTE)", value: fmt(rpv), color: COLORS.success },
        { label: "A PAGAR (PENDENTE)", value: fmt(ppv), color: COLORS.danger },
        { label: "AMOSTRA (REC + PAG)", value: `${qtdRec} + ${qtdPag}`, color: COLORS.secondary },
      ]);

      // Diagnóstico box
      const pw = doc.internal.pageSize.getWidth();
      doc.setFillColor(245, 247, 250);
      doc.setDrawColor(...saudeColor);
      doc.setLineWidth(0.8);
      const diagLines = doc.splitTextToSize(diagnostico, pw - 28 - 10);
      const diagH = diagLines.length * 4.5 + 12;
      doc.roundedRect(14, y, pw - 28, diagH, 3, 3, "FD");
      doc.setFillColor(...saudeColor);
      doc.roundedRect(14, y, 3, diagH, 3, 0, "F");
      doc.rect(15.5, y, 1.5, diagH, "F");

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...saudeColor);
      doc.text(`DIAGNÓSTICO: ${saudeLabel}`, 22, y + 6);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.text);
      let dy = y + 12;
      diagLines.forEach((line: string) => { doc.text(line, 22, dy); dy += 4.5; });
      y += diagH + 6;

      // Table
      autoTable(doc, {
        startY: y,
        head: [["Indicador", "Valor", "Interpretação"]],
        body: [
          ["Prazo Médio de Recebimento (PMR)", pmr.toFixed(1) + " dias", "Tempo médio que a empresa leva para receber de clientes"],
          ["Prazo Médio de Pagamento (PMP)", pmp.toFixed(1) + " dias", "Tempo médio que a empresa leva para pagar fornecedores"],
          ["Ciclo Financeiro (PMR - PMP)", cf.toFixed(1) + " dias", cf <= 0 ? "A empresa recebe antes de pagar — situação ideal" : "A empresa precisa financiar " + cf.toFixed(0) + " dias de operação"],
          ["Necessidade de Capital de Giro", fmt(ncg), ncg >= 0 ? "Recursos a receber superam as obrigações" : "Obrigações superam recursos a receber"],
          ["Recebíveis Pendentes", fmt(rpv), `${cicloFinanceiroData.totalCR} contas a receber no período`],
          ["Pagáveis Pendentes", fmt(ppv), `${cicloFinanceiroData.totalCP} contas a pagar no período`],
        ],
        ...tableTheme(COLORS.accent),
        columnStyles: { 1: { halign: "right" }, 2: { fontStyle: "italic", textColor: COLORS.mutedText } },
      });

    } else {
      // Resumo Executivo
      const saldo = totalEntradas - totalSaidas;
      const receberPendVal = receberPendentes.reduce((s: number, c: any) => s + Number(c.valor), 0);
      const pagarPendVal = pagarPendentes.reduce((s: number, c: any) => s + Number(c.valor), 0);

      y = drawKpiRow(doc, y, [
        { label: "TOTAL A RECEBER", value: fmt(totalReceber), color: COLORS.success },
        { label: "TOTAL A PAGAR", value: fmt(totalPagar), color: COLORS.danger },
        { label: "ENTRADAS REALIZADAS", value: fmt(totalEntradas), color: COLORS.accent },
        { label: "SAÍDAS REALIZADAS", value: fmt(totalSaidas), color: COLORS.warning },
      ]);
      y = drawKpiRow(doc, y, [
        { label: "SALDO DO PERÍODO", value: fmt(saldo), color: saldo >= 0 ? COLORS.success : COLORS.danger },
        { label: "PENDENTES RECEBER", value: `${receberPendentes.length} — ${fmt(receberPendVal)}`, color: COLORS.warning },
        { label: "PENDENTES PAGAR", value: `${pagarPendentes.length} — ${fmt(pagarPendVal)}`, color: COLORS.danger },
        { label: "POSIÇÃO LÍQUIDA", value: fmt(receberPendVal - pagarPendVal), color: receberPendVal >= pagarPendVal ? COLORS.success : COLORS.danger },
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Indicador", "Valor"]],
        body: [
          ["Total a Receber", fmt(totalReceber)],
          ["  └ Pendentes", `${receberPendentes.length} registros — ${fmt(receberPendVal)}`],
          ["  └ Recebidos", `${receberRecebidos.length} registros — ${fmt(receberRecebidos.reduce((s: number, c: any) => s + Number(c.valor), 0))}`],
          ["  └ Vencidos", `${receberVencidos.length} registros — ${fmt(receberVencidos.reduce((s: number, c: any) => s + Number(c.valor), 0))}`],
          ["", ""],
          ["Total a Pagar", fmt(totalPagar)],
          ["  └ Pendentes", `${pagarPendentes.length} registros — ${fmt(pagarPendVal)}`],
          ["  └ Pagos", `${pagarPagos.length} registros — ${fmt(pagarPagos.reduce((s: number, c: any) => s + Number(c.valor), 0))}`],
          ["  └ Vencidos", `${pagarVencidos.length} registros — ${fmt(pagarVencidos.reduce((s: number, c: any) => s + Number(c.valor), 0))}`],
          ["", ""],
          ["Entradas Realizadas (Caixa)", fmt(totalEntradas)],
          ["Saídas Realizadas (Caixa)", fmt(totalSaidas)],
          ["Saldo do Período", fmt(saldo)],
          ["Posição Líquida (Receber - Pagar)", fmt(receberPendVal - pagarPendVal)],
        ],
        ...tableTheme(COLORS.primary),
        columnStyles: { 1: { halign: "right" } },
        didParseCell: (data: any) => {
          if (data.section === "body") {
            const val = data.cell.raw as string;
            if (val && (val.startsWith("  └"))) {
              data.cell.styles.textColor = COLORS.mutedText;
              data.cell.styles.fontSize = 7;
            }
            if (data.row.index === 0 || data.row.index === 5 || data.row.index === 10 || data.row.index === 11 || data.row.index === 12 || data.row.index === 13) {
              data.cell.styles.fontStyle = "bold";
            }
          }
        },
      });
    }

    if (commentary) {
      addCommentaryToPdf(doc, commentary);
    }

    addPdfFooter(doc);
    doc.save(`${reportType}_${new Date().toISOString().split("T")[0]}.pdf`);
    setIsGeneratingPdf(false);
    toast({ title: "Relatório gerado!", description: commentary ? "Inclui parecer econômico-financeiro." : "PDF exportado com sucesso." });
  };

  // CSV export (unchanged logic)
  const exportCSV = () => {
    let csvContent = "";
    let fileName = "";

    if (reportType === "contas_receber") {
      csvContent = "Descrição;Valor;Vencimento;Status;Cliente;Categoria\n";
      filteredReceber.forEach((c: any) => {
        csvContent += `${c.descricao};${fmtNum(Number(c.valor))};${fmtDate(c.data_vencimento)};${c.status};${clientesMap[c.cliente_id] || ""};${categoriasMap[c.categoria_id] || ""}\n`;
      });
      fileName = "contas_receber.csv";
    } else if (reportType === "contas_pagar") {
      csvContent = "Descrição;Valor;Vencimento;Status;Fornecedor;Categoria\n";
      filteredPagar.forEach((c: any) => {
        csvContent += `${c.descricao};${fmtNum(Number(c.valor))};${fmtDate(c.data_vencimento)};${c.status};${fornecedoresMap[c.fornecedor_id] || ""};${categoriasMap[c.categoria_id] || ""}\n`;
      });
      fileName = "contas_pagar.csv";
    } else if (reportType === "fluxo_caixa") {
      csvContent = "Data;Descrição;Tipo;Valor;Categoria\n";
      filteredLancamentos.forEach((l: any) => {
        csvContent += `${fmtDate(l.data_lancamento)};${l.descricao};${l.tipo};${fmtNum(Number(l.valor))};${categoriasMap[l.categoria_id] || ""}\n`;
      });
      fileName = "fluxo_caixa.csv";
    } else if (reportType === "dfc") {
      csvContent = "Mês;Entradas;Recebimentos;Saídas;Pagamentos;Saldo\n";
      dfcData.forEach(d => {
        csvContent += `${d.mesLabel};${fmtNum(d.entradas)};${fmtNum(d.recebimentos)};${fmtNum(d.saidas)};${fmtNum(d.pagamentos)};${fmtNum(d.saldo)}\n`;
      });
      fileName = "dfc.csv";
    } else if (reportType === "orcamento") {
      csvContent = "Categoria;Orçado;Realizado;Variação;% Execução\n";
      orcamentoData.forEach(d => {
        csvContent += `${d.nome};${fmtNum(d.orcado)};${fmtNum(d.realizado)};${fmtNum(d.realizado - d.orcado)};${d.orcado > 0 ? ((d.realizado / d.orcado) * 100).toFixed(1) : "0"}%\n`;
      });
      fileName = "orcamento_orcado_x_realizado.csv";
    } else if (reportType === "ciclo_financeiro") {
      csvContent = "Indicador;Valor\n";
      csvContent += `PMR (Prazo Médio Recebimento);${cicloFinanceiroData.pmr.toFixed(1)} dias\n`;
      csvContent += `PMP (Prazo Médio Pagamento);${cicloFinanceiroData.pmp.toFixed(1)} dias\n`;
      csvContent += `Ciclo Financeiro;${cicloFinanceiroData.cicloFinanceiro.toFixed(1)} dias\n`;
      csvContent += `Necessidade Capital de Giro;${fmtNum(cicloFinanceiroData.ncg)}\n`;
      csvContent += `Recebíveis Pendentes;${fmtNum(cicloFinanceiroData.receberPendVal)}\n`;
      csvContent += `Pagáveis Pendentes;${fmtNum(cicloFinanceiroData.pagarPendVal)}\n`;
      fileName = "ciclo_financeiro.csv";
    } else {
      csvContent = "Indicador;Valor\n";
      csvContent += `Total a Receber;${fmtNum(totalReceber)}\nTotal a Pagar;${fmtNum(totalPagar)}\nEntradas Realizadas;${fmtNum(totalEntradas)}\nSaídas Realizadas;${fmtNum(totalSaidas)}\nSaldo;${fmtNum(totalEntradas - totalSaidas)}\n`;
      fileName = "resumo_financeiro.csv";
    }

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  // ═══════════════════════════════════════════
  // CHART COLORS & RENDER CHARTS
  // ═══════════════════════════════════════════
  const CHART_GREEN = "#27ae60";
  const CHART_RED = "#c0392b";
  const CHART_BLUE = "#2980b9";
  const CHART_AMBER = "#f39c12";
  const CHART_PURPLE = "#8e44ad";

  const renderCharts = () => {
    if (reportType === "resumo") {
      const pieData = [
        { name: "A Receber", value: totalReceber },
        { name: "A Pagar", value: totalPagar },
      ];
      const barData = [
        { name: "Entradas", valor: totalEntradas, fill: CHART_GREEN },
        { name: "Saídas", valor: totalSaidas, fill: CHART_RED },
        { name: "Saldo", valor: totalEntradas - totalSaidas, fill: CHART_BLUE },
      ];
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Receber vs Pagar</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    <Cell fill={CHART_GREEN} />
                    <Cell fill={CHART_RED} />
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Entradas vs Saídas</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={10} tickFormatter={(v) => fmt(v)} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (reportType === "contas_receber") {
      const statusData = [
        { name: "Pendentes", value: receberPendentes.length, color: CHART_AMBER },
        { name: "Recebidos", value: receberRecebidos.length, color: CHART_GREEN },
        { name: "Vencidos", value: receberVencidos.length, color: CHART_RED },
      ].filter(d => d.value > 0);
      const catData = Object.entries(
        filteredReceber.reduce((acc: Record<string, number>, c: any) => {
          const cat = categoriasMap[c.categoria_id] || "Sem categoria";
          acc[cat] = (acc[cat] || 0) + Number(c.valor);
          return acc;
        }, {})
      ).map(([name, valor]) => ({ name, valor: valor as number })).sort((a, b) => b.valor - a.valor).slice(0, 8);
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Distribuição por Status</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Top Categorias</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={catData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" fontSize={10} tickFormatter={(v) => fmt(v)} />
                  <YAxis type="category" dataKey="name" fontSize={10} width={100} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="valor" fill={CHART_BLUE} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (reportType === "contas_pagar") {
      const statusData = [
        { name: "Pendentes", value: pagarPendentes.length, color: CHART_AMBER },
        { name: "Pagos", value: pagarPagos.length, color: CHART_GREEN },
        { name: "Vencidos", value: pagarVencidos.length, color: CHART_RED },
      ].filter(d => d.value > 0);
      const catData = Object.entries(
        filteredPagar.reduce((acc: Record<string, number>, c: any) => {
          const cat = categoriasMap[c.categoria_id] || "Sem categoria";
          acc[cat] = (acc[cat] || 0) + Number(c.valor);
          return acc;
        }, {})
      ).map(([name, valor]) => ({ name, valor: valor as number })).sort((a, b) => b.valor - a.valor).slice(0, 8);
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Distribuição por Status</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Top Categorias</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={catData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" fontSize={10} tickFormatter={(v) => fmt(v)} />
                  <YAxis type="category" dataKey="name" fontSize={10} width={100} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="valor" fill={CHART_RED} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (reportType === "fluxo_caixa") {
      const monthData = Object.entries(
        filteredLancamentos.reduce((acc: Record<string, { entradas: number; saidas: number }>, l: any) => {
          const mes = l.data_lancamento?.substring(0, 7);
          if (!mes) return acc;
          if (!acc[mes]) acc[mes] = { entradas: 0, saidas: 0 };
          if (l.tipo === "entrada") acc[mes].entradas += Number(l.valor);
          else acc[mes].saidas += Number(l.valor);
          return acc;
        }, {})
      ).sort(([a], [b]) => a.localeCompare(b)).map(([mes, v]) => {
        const [y, m] = mes.split("-");
        const vTyped = v as { entradas: number; saidas: number };
        return { mes: `${MESES[parseInt(m) - 1]?.substring(0, 3)}/${y}`, ...vTyped, saldo: vTyped.entradas - vTyped.saidas };
      });
      return (
        <Card>
          <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Fluxo de Caixa Mensal</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={monthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" fontSize={10} />
                <YAxis fontSize={10} tickFormatter={(v) => fmt(v)} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="entradas" name="Entradas" fill={CHART_GREEN} radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" name="Saídas" fill={CHART_RED} radius={[4, 4, 0, 0]} />
                <Line dataKey="saldo" name="Saldo" stroke={CHART_BLUE} strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      );
    }

    if (reportType === "dfc") {
      const chartData = dfcData.map(d => ({
        mes: d.mesLabel.length > 10 ? d.mesLabel.substring(0, 8) + "…" : d.mesLabel,
        ingressos: d.entradas + d.recebimentos,
        desembolsos: d.saidas + d.pagamentos,
        saldo: d.saldo,
      }));
      return (
        <Card>
          <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">DFC — Ingressos vs Desembolsos</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" fontSize={10} />
                <YAxis fontSize={10} tickFormatter={(v) => fmt(v)} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="ingressos" name="Ingressos" fill={CHART_GREEN} radius={[4, 4, 0, 0]} />
                <Bar dataKey="desembolsos" name="Desembolsos" fill={CHART_RED} radius={[4, 4, 0, 0]} />
                <Line dataKey="saldo" name="Saldo" stroke={CHART_BLUE} strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      );
    }

    if (reportType === "orcamento") {
      const chartData = orcamentoData.slice(0, 10).map(d => ({
        nome: d.nome.length > 12 ? d.nome.substring(0, 10) + "…" : d.nome,
        orcado: d.orcado,
        realizado: d.realizado,
      }));
      const pieData = [
        { name: "Orçado", value: orcamentoData.reduce((s, d) => s + d.orcado, 0) },
        { name: "Realizado", value: orcamentoData.reduce((s, d) => s + d.realizado, 0) },
      ];
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2">
            <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Orçado × Realizado por Categoria</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" fontSize={10} />
                  <YAxis fontSize={10} tickFormatter={(v) => fmt(v)} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="orcado" name="Orçado" fill={CHART_BLUE} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="realizado" name="Realizado" fill={CHART_PURPLE} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Total Geral</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    <Cell fill={CHART_BLUE} />
                    <Cell fill={CHART_PURPLE} />
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      );
    }
    if (reportType === "ciclo_financeiro") {
      const { pmr, pmp, cicloFinanceiro: cf, chartData: cfChart, diagnostico, saude } = cicloFinanceiroData;
      const saudeColor = saude === "excelente" || saude === "bom" ? "text-green-700" : saude === "atencao" ? "text-amber-700" : "text-red-700";
      const saudeBg = saude === "excelente" || saude === "bom" ? "bg-green-50 border-green-200" : saude === "atencao" ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";
      return (
        <div className="space-y-4">
          {/* Diagnóstico */}
          <Card className={`border ${saudeBg}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <RefreshCw className={`h-5 w-5 mt-0.5 ${saudeColor}`} />
                <div>
                  <p className={`text-sm font-bold ${saudeColor}`}>
                    Diagnóstico do Ciclo Financeiro
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{diagnostico}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Gráfico */}
          {cfChart.length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Evolução Mensal — PMR × PMP × Ciclo</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={cfChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" fontSize={10} />
                    <YAxis fontSize={10} unit=" d" />
                    <Tooltip formatter={(v: number) => `${v} dias`} />
                    <Legend />
                    <Bar dataKey="pmr" name="PMR (Recebimento)" fill={CHART_BLUE} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pmp" name="PMP (Pagamento)" fill={CHART_PURPLE} radius={[4, 4, 0, 0]} />
                    <Line dataKey="ciclo" name="Ciclo Financeiro" stroke={cf <= 0 ? CHART_GREEN : CHART_RED} strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    return null;
  };

  // ═══════════════════════════════════════════
  // CONTEXT-SENSITIVE KPIs FOR UI
  // ═══════════════════════════════════════════

  const renderContextKpis = () => {
    if (reportType === "contas_receber") {
      const totalPend = receberPendentes.reduce((s: number, c: any) => s + Number(c.valor), 0);
      const totalVenc = receberVencidos.reduce((s: number, c: any) => s + Number(c.valor), 0);
      const ticketMedio = filteredReceber.length > 0 ? totalReceber / filteredReceber.length : 0;
      return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KpiCard icon={<DollarSign className="h-4 w-4" />} label="Total a Receber" value={fmt(totalReceber)} accent="text-blue-600" bg="bg-blue-50" />
          <KpiCard icon={<Receipt className="h-4 w-4" />} label="Pendentes" value={`${receberPendentes.length} — ${fmt(totalPend)}`} accent="text-amber-600" bg="bg-amber-50" />
          <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="Recebidos" value={`${receberRecebidos.length}`} accent="text-green-600" bg="bg-green-50" />
          <KpiCard icon={<TrendingDown className="h-4 w-4" />} label="Vencidos" value={`${receberVencidos.length} — ${fmt(totalVenc)}`} accent="text-red-600" bg="bg-red-50" />
          <KpiCard icon={<BarChart3 className="h-4 w-4" />} label="Ticket Médio" value={fmt(ticketMedio)} accent="text-purple-600" bg="bg-purple-50" />
        </div>
      );
    }
    if (reportType === "contas_pagar") {
      const totalPend = pagarPendentes.reduce((s: number, c: any) => s + Number(c.valor), 0);
      const totalVenc = pagarVencidos.reduce((s: number, c: any) => s + Number(c.valor), 0);
      const ticketMedio = filteredPagar.length > 0 ? totalPagar / filteredPagar.length : 0;
      return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KpiCard icon={<DollarSign className="h-4 w-4" />} label="Total a Pagar" value={fmt(totalPagar)} accent="text-red-600" bg="bg-red-50" />
          <KpiCard icon={<Receipt className="h-4 w-4" />} label="Pendentes" value={`${pagarPendentes.length} — ${fmt(totalPend)}`} accent="text-amber-600" bg="bg-amber-50" />
          <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="Pagos" value={`${pagarPagos.length}`} accent="text-green-600" bg="bg-green-50" />
          <KpiCard icon={<TrendingDown className="h-4 w-4" />} label="Vencidos" value={`${pagarVencidos.length} — ${fmt(totalVenc)}`} accent="text-red-600" bg="bg-red-50" />
          <KpiCard icon={<BarChart3 className="h-4 w-4" />} label="Ticket Médio" value={fmt(ticketMedio)} accent="text-purple-600" bg="bg-purple-50" />
        </div>
      );
    }
    if (reportType === "dfc") {
      const totalEnt = dfcData.reduce((s, d) => s + d.entradas + d.recebimentos, 0);
      const totalSai = dfcData.reduce((s, d) => s + d.saidas + d.pagamentos, 0);
      const saldoGeral = totalEnt - totalSai;
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="Total Ingressos" value={fmt(totalEnt)} accent="text-green-600" bg="bg-green-50" />
          <KpiCard icon={<TrendingDown className="h-4 w-4" />} label="Total Desembolsos" value={fmt(totalSai)} accent="text-red-600" bg="bg-red-50" />
          <KpiCard icon={<DollarSign className="h-4 w-4" />} label="Geração de Caixa" value={fmt(saldoGeral)} accent={saldoGeral >= 0 ? "text-green-600" : "text-red-600"} bg={saldoGeral >= 0 ? "bg-green-50" : "bg-red-50"} />
          <KpiCard icon={<PieChartIcon className="h-4 w-4" />} label="Meses Analisados" value={`${dfcData.length}`} accent="text-blue-600" bg="bg-blue-50" />
        </div>
      );
    }
    if (reportType === "orcamento") {
      const totalOrc = orcamentoData.reduce((s, d) => s + d.orcado, 0);
      const totalReal = orcamentoData.reduce((s, d) => s + d.realizado, 0);
      const variacao = totalReal - totalOrc;
      const pctExec = totalOrc > 0 ? (totalReal / totalOrc) * 100 : 0;
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard icon={<Wallet className="h-4 w-4" />} label="Total Orçado" value={fmt(totalOrc)} accent="text-blue-600" bg="bg-blue-50" />
          <KpiCard icon={<BarChart3 className="h-4 w-4" />} label="Total Realizado" value={fmt(totalReal)} accent="text-purple-600" bg="bg-purple-50" />
          <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="Variação" value={fmt(variacao)} accent={variacao >= 0 ? "text-green-600" : "text-red-600"} bg={variacao >= 0 ? "bg-green-50" : "bg-red-50"} />
          <KpiCard icon={<PieChartIcon className="h-4 w-4" />} label="% Execução" value={pctExec.toFixed(1) + "%"} accent={pctExec >= 90 && pctExec <= 110 ? "text-green-600" : "text-amber-600"} bg="bg-amber-50" />
        </div>
      );
    }
    if (reportType === "ciclo_financeiro") {
      const { pmr, pmp, cicloFinanceiro: cf, ncg, saude } = cicloFinanceiroData;
      const saudeLabel = saude === "excelente" ? "Excelente" : saude === "bom" ? "Bom" : saude === "atencao" ? "Atenção" : "Crítico";
      const saudeAccent = saude === "excelente" || saude === "bom" ? "text-green-600" : saude === "atencao" ? "text-amber-600" : "text-red-600";
      const saudeBg = saude === "excelente" || saude === "bom" ? "bg-green-50" : saude === "atencao" ? "bg-amber-50" : "bg-red-50";
      return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KpiCard icon={<Clock className="h-4 w-4" />} label="PMR (Recebimento)" value={pmr.toFixed(1) + " dias"} accent="text-blue-600" bg="bg-blue-50" />
          <KpiCard icon={<Clock className="h-4 w-4" />} label="PMP (Pagamento)" value={pmp.toFixed(1) + " dias"} accent="text-purple-600" bg="bg-purple-50" />
          <KpiCard icon={<RefreshCw className="h-4 w-4" />} label="Ciclo Financeiro" value={cf.toFixed(1) + " dias"} accent={cf <= 0 ? "text-green-600" : cf <= 15 ? "text-blue-600" : "text-red-600"} bg={cf <= 0 ? "bg-green-50" : cf <= 15 ? "bg-blue-50" : "bg-red-50"} />
          <KpiCard icon={<ArrowRightLeft className="h-4 w-4" />} label="Necessidade Cap. Giro" value={fmt(ncg)} accent={ncg >= 0 ? "text-blue-600" : "text-red-600"} bg={ncg >= 0 ? "bg-blue-50" : "bg-red-50"} />
          <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="Saúde Financeira" value={saudeLabel} accent={saudeAccent} bg={saudeBg} />
        </div>
      );
    }
    // Default: resumo and fluxo_caixa
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="Total a Receber" value={fmt(totalReceber)} accent="text-green-600" bg="bg-green-50" />
        <KpiCard icon={<TrendingDown className="h-4 w-4" />} label="Total a Pagar" value={fmt(totalPagar)} accent="text-red-600" bg="bg-red-50" />
        <KpiCard icon={<DollarSign className="h-4 w-4" />} label="Entradas" value={fmt(totalEntradas)} accent="text-blue-600" bg="bg-blue-50" />
        <KpiCard icon={<FileSpreadsheet className="h-4 w-4" />} label="Saldo Período" value={fmt(totalEntradas - totalSaidas)} accent={totalEntradas - totalSaidas >= 0 ? "text-green-600" : "text-red-600"} bg={totalEntradas - totalSaidas >= 0 ? "bg-green-50" : "bg-red-50"} />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Relatórios</h1>
          <p className="text-xs text-muted-foreground">Extraia relatórios financeiros profissionais com filtros personalizados</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => { setReportType("ciclo_financeiro"); }} size="sm" className="bg-primary">
            <RefreshCw className="mr-1.5 h-4 w-4" /> Ciclo Financeiro
          </Button>
          <Button onClick={exportCSV} variant="outline" size="sm">
            <FileDown className="mr-1.5 h-4 w-4" /> CSV
          </Button>
          <Button onClick={exportPDF} size="sm" className="bg-primary" disabled={isGeneratingPdf}>
            {isGeneratingPdf ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Gerando...</> : <><Brain className="mr-1.5 h-4 w-4" /> Exportar PDF com Parecer IA</>}
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm flex items-center gap-2"><Filter className="h-3.5 w-3.5" /> Filtros</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Tipo de Relatório</Label>
              <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="resumo">Resumo Executivo</SelectItem>
                  <SelectItem value="contas_receber">Contas a Receber</SelectItem>
                  <SelectItem value="contas_pagar">Contas a Pagar</SelectItem>
                  <SelectItem value="fluxo_caixa">Fluxo de Caixa</SelectItem>
                  <SelectItem value="dfc">DFC — Demonstração Fluxo de Caixa</SelectItem>
                  <SelectItem value="orcamento">Orçado × Realizado</SelectItem>
                  <SelectItem value="ciclo_financeiro">Ciclo Financeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Data Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 text-xs", !dataInicio && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicio ? format(parse(dataInicio, "yyyy-MM-dd", new Date()), "dd/MM/yyyy") : "Data início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dataInicio ? parse(dataInicio, "yyyy-MM-dd", new Date()) : undefined} onSelect={(date) => setDataInicio(date ? format(date, "yyyy-MM-dd") : "")} locale={ptBR} className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-xs">Data Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 text-xs", !dataFim && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFim ? format(parse(dataFim, "yyyy-MM-dd", new Date()), "dd/MM/yyyy") : "Data fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dataFim ? parse(dataFim, "yyyy-MM-dd", new Date()) : undefined} onSelect={(date) => setDataFim(date ? format(date, "yyyy-MM-dd") : "")} locale={ptBR} className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            {(reportType === "contas_receber" || reportType === "contas_pagar") && (
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="recebido">Recebido</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Context-sensitive KPIs */}
      {renderContextKpis()}

      {/* Charts */}
      {renderCharts()}

      {/* Tabela */}
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm">
            {reportType === "resumo" && "Resumo Executivo Financeiro"}
            {reportType === "contas_receber" && `Contas a Receber — ${filteredReceber.length} registros`}
            {reportType === "contas_pagar" && `Contas a Pagar — ${filteredPagar.length} registros`}
            {reportType === "fluxo_caixa" && `Fluxo de Caixa — ${filteredLancamentos.length} lançamentos`}
            {reportType === "dfc" && `DFC — ${dfcData.length} meses`}
            {reportType === "orcamento" && `Orçado × Realizado — ${orcamentoData.length} categorias`}
            {reportType === "ciclo_financeiro" && `Ciclo Financeiro — Análise de Prazos`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportType === "resumo" && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Indicador</TableHead><TableHead className="text-right">Valor</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow><TableCell className="font-medium">Total a Receber</TableCell><TableCell className="text-right font-medium text-green-600">{fmt(totalReceber)}</TableCell></TableRow>
                  <TableRow><TableCell className="font-medium">Total a Pagar</TableCell><TableCell className="text-right font-medium text-red-600">{fmt(totalPagar)}</TableCell></TableRow>
                  <TableRow><TableCell className="font-medium">Entradas Realizadas</TableCell><TableCell className="text-right font-medium text-green-600">{fmt(totalEntradas)}</TableCell></TableRow>
                  <TableRow><TableCell className="font-medium">Saídas Realizadas</TableCell><TableCell className="text-right font-medium text-red-600">{fmt(totalSaidas)}</TableCell></TableRow>
                  <TableRow className="bg-muted/50"><TableCell className="font-bold">Saldo do Período</TableCell><TableCell className={`text-right font-bold ${totalEntradas - totalSaidas >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(totalEntradas - totalSaidas)}</TableCell></TableRow>
                  <TableRow><TableCell>Contas a Receber Pendentes</TableCell><TableCell className="text-right">{receberPendentes.length}</TableCell></TableRow>
                  <TableRow><TableCell>Contas a Pagar Pendentes</TableCell><TableCell className="text-right">{pagarPendentes.length}</TableCell></TableRow>
                  <TableRow><TableCell>Contas Vencidas (Receber)</TableCell><TableCell className="text-right text-red-600">{receberVencidos.length}</TableCell></TableRow>
                  <TableRow><TableCell>Contas Vencidas (Pagar)</TableCell><TableCell className="text-right text-red-600">{pagarVencidos.length}</TableCell></TableRow>
                </TableBody>
              </Table>
            </div>
          )}

          {reportType === "contas_receber" && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead><TableHead>Cliente</TableHead><TableHead>Categoria</TableHead>
                    <TableHead>Vencimento</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceber.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum registro encontrado</TableCell></TableRow>
                  ) : filteredReceber.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.descricao}</TableCell>
                      <TableCell>{clientesMap[c.cliente_id] || "—"}</TableCell>
                      <TableCell>{categoriasMap[c.categoria_id] || "—"}</TableCell>
                      <TableCell>{fmtDate(c.data_vencimento)}</TableCell>
                      <TableCell><Badge variant={c.status === "recebido" ? "default" : c.status === "vencido" ? "destructive" : "secondary"}>{c.status}</Badge></TableCell>
                      <TableCell className="text-right font-medium">{fmt(Number(c.valor))}</TableCell>
                    </TableRow>
                  ))}
                  {filteredReceber.length > 0 && (
                    <TableRow className="bg-muted/50 font-bold"><TableCell colSpan={5}>Total</TableCell><TableCell className="text-right">{fmt(totalReceber)}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {reportType === "contas_pagar" && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead><TableHead>Fornecedor</TableHead><TableHead>Categoria</TableHead>
                    <TableHead>Vencimento</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPagar.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum registro encontrado</TableCell></TableRow>
                  ) : filteredPagar.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.descricao}</TableCell>
                      <TableCell>{fornecedoresMap[c.fornecedor_id] || "—"}</TableCell>
                      <TableCell>{categoriasMap[c.categoria_id] || "—"}</TableCell>
                      <TableCell>{fmtDate(c.data_vencimento)}</TableCell>
                      <TableCell><Badge variant={c.status === "pago" ? "default" : c.status === "vencido" ? "destructive" : "secondary"}>{c.status}</Badge></TableCell>
                      <TableCell className="text-right font-medium">{fmt(Number(c.valor))}</TableCell>
                    </TableRow>
                  ))}
                  {filteredPagar.length > 0 && (
                    <TableRow className="bg-muted/50 font-bold"><TableCell colSpan={5}>Total</TableCell><TableCell className="text-right">{fmt(totalPagar)}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {reportType === "fluxo_caixa" && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead>Tipo</TableHead><TableHead>Categoria</TableHead><TableHead className="text-right">Valor</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLancamentos.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum lançamento encontrado</TableCell></TableRow>
                  ) : filteredLancamentos.map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell>{fmtDate(l.data_lancamento)}</TableCell>
                      <TableCell className="font-medium">{l.descricao}</TableCell>
                      <TableCell><Badge variant={l.tipo === "entrada" ? "default" : "destructive"}>{l.tipo === "entrada" ? "Entrada" : "Saída"}</Badge></TableCell>
                      <TableCell>{categoriasMap[l.categoria_id] || "—"}</TableCell>
                      <TableCell className={`text-right font-medium ${l.tipo === "entrada" ? "text-green-600" : "text-red-600"}`}>{fmt(Number(l.valor))}</TableCell>
                    </TableRow>
                  ))}
                  {filteredLancamentos.length > 0 && (
                    <>
                      <TableRow className="bg-green-50"><TableCell colSpan={4} className="font-medium text-green-700">Total Entradas</TableCell><TableCell className="text-right font-bold text-green-700">{fmt(totalEntradas)}</TableCell></TableRow>
                      <TableRow className="bg-red-50"><TableCell colSpan={4} className="font-medium text-red-700">Total Saídas</TableCell><TableCell className="text-right font-bold text-red-700">{fmt(totalSaidas)}</TableCell></TableRow>
                      <TableRow className="bg-muted/50 font-bold"><TableCell colSpan={4}>Saldo</TableCell><TableCell className={`text-right ${totalEntradas - totalSaidas >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(totalEntradas - totalSaidas)}</TableCell></TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {reportType === "dfc" && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead><TableHead className="text-right">Entradas</TableHead><TableHead className="text-right">Recebimentos</TableHead>
                    <TableHead className="text-right">Saídas</TableHead><TableHead className="text-right">Pagamentos</TableHead><TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dfcData.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum dado encontrado</TableCell></TableRow>
                  ) : dfcData.map((d) => (
                    <TableRow key={d.mes}>
                      <TableCell className="font-medium">{d.mesLabel}</TableCell>
                      <TableCell className="text-right text-green-600">{fmt(d.entradas)}</TableCell>
                      <TableCell className="text-right text-green-600">{fmt(d.recebimentos)}</TableCell>
                      <TableCell className="text-right text-red-600">{fmt(d.saidas)}</TableCell>
                      <TableCell className="text-right text-red-600">{fmt(d.pagamentos)}</TableCell>
                      <TableCell className={`text-right font-bold ${d.saldo >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(d.saldo)}</TableCell>
                    </TableRow>
                  ))}
                  {dfcData.length > 0 && (
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-right text-green-700">{fmt(dfcData.reduce((s, d) => s + d.entradas, 0))}</TableCell>
                      <TableCell className="text-right text-green-700">{fmt(dfcData.reduce((s, d) => s + d.recebimentos, 0))}</TableCell>
                      <TableCell className="text-right text-red-700">{fmt(dfcData.reduce((s, d) => s + d.saidas, 0))}</TableCell>
                      <TableCell className="text-right text-red-700">{fmt(dfcData.reduce((s, d) => s + d.pagamentos, 0))}</TableCell>
                      <TableCell className={`text-right ${dfcData.reduce((s, d) => s + d.saldo, 0) >= 0 ? "text-green-700" : "text-red-700"}`}>{fmt(dfcData.reduce((s, d) => s + d.saldo, 0))}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {reportType === "orcamento" && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead><TableHead className="text-right">Orçado</TableHead><TableHead className="text-right">Realizado</TableHead>
                    <TableHead className="text-right">Variação</TableHead><TableHead className="text-right">% Execução</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orcamentoData.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum dado encontrado</TableCell></TableRow>
                  ) : orcamentoData.map((d, i) => {
                    const variacao = d.realizado - d.orcado;
                    const pct = d.orcado > 0 ? (d.realizado / d.orcado) * 100 : 0;
                    return (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{d.nome}</TableCell>
                        <TableCell className="text-right">{fmt(d.orcado)}</TableCell>
                        <TableCell className="text-right">{fmt(d.realizado)}</TableCell>
                        <TableCell className={`text-right font-medium ${variacao >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(variacao)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={pct >= 90 && pct <= 110 ? "default" : pct > 110 ? "destructive" : "secondary"}>
                            {d.orcado > 0 ? pct.toFixed(1) + "%" : "—"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {orcamentoData.length > 0 && (() => {
                    const totalOrc = orcamentoData.reduce((s, d) => s + d.orcado, 0);
                    const totalReal = orcamentoData.reduce((s, d) => s + d.realizado, 0);
                    return (
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell>TOTAL</TableCell>
                        <TableCell className="text-right">{fmt(totalOrc)}</TableCell>
                        <TableCell className="text-right">{fmt(totalReal)}</TableCell>
                        <TableCell className={`text-right ${totalReal - totalOrc >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(totalReal - totalOrc)}</TableCell>
                        <TableCell className="text-right">{totalOrc > 0 ? ((totalReal / totalOrc) * 100).toFixed(1) + "%" : "—"}</TableCell>
                      </TableRow>
                    );
                  })()}
                </TableBody>
              </Table>
            </div>
          )}

          {reportType === "ciclo_financeiro" && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Indicador</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Interpretação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Prazo Médio de Recebimento (PMR)</TableCell>
                    <TableCell className="text-right font-bold text-blue-600">{cicloFinanceiroData.pmr.toFixed(1)} dias</TableCell>
                    <TableCell className="text-xs text-muted-foreground">Tempo médio que a empresa leva para receber de clientes</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Prazo Médio de Pagamento (PMP)</TableCell>
                    <TableCell className="text-right font-bold text-purple-600">{cicloFinanceiroData.pmp.toFixed(1)} dias</TableCell>
                    <TableCell className="text-xs text-muted-foreground">Tempo médio que a empresa leva para pagar fornecedores</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-bold">Ciclo Financeiro (PMR − PMP)</TableCell>
                    <TableCell className={`text-right font-bold ${cicloFinanceiroData.cicloFinanceiro <= 0 ? "text-green-600" : cicloFinanceiroData.cicloFinanceiro <= 15 ? "text-blue-600" : "text-red-600"}`}>
                      {cicloFinanceiroData.cicloFinanceiro.toFixed(1)} dias
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {cicloFinanceiroData.cicloFinanceiro <= 0 ? "A empresa recebe antes de pagar — situação ideal" : `A empresa precisa financiar ${cicloFinanceiroData.cicloFinanceiro.toFixed(0)} dias de operação`}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Necessidade de Capital de Giro</TableCell>
                    <TableCell className={`text-right font-bold ${cicloFinanceiroData.ncg >= 0 ? "text-blue-600" : "text-red-600"}`}>{fmt(cicloFinanceiroData.ncg)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {cicloFinanceiroData.ncg >= 0 ? "Recursos a receber superam as obrigações" : "Obrigações superam recursos a receber"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Recebíveis Pendentes</TableCell>
                    <TableCell className="text-right font-medium text-green-600">{fmt(cicloFinanceiroData.receberPendVal)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{cicloFinanceiroData.totalCR} contas a receber no período</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Pagáveis Pendentes</TableCell>
                    <TableCell className="text-right font-medium text-red-600">{fmt(cicloFinanceiroData.pagarPendVal)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{cicloFinanceiroData.totalCP} contas a pagar no período</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Amostra Recebimentos</TableCell>
                    <TableCell className="text-right font-medium">{cicloFinanceiroData.recebidos} liquidados</TableCell>
                    <TableCell className="text-xs text-muted-foreground">Contas recebidas usadas no cálculo do PMR</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Amostra Pagamentos</TableCell>
                    <TableCell className="text-right font-medium">{cicloFinanceiroData.pagos} liquidados</TableCell>
                    <TableCell className="text-xs text-muted-foreground">Contas pagas usadas no cálculo do PMP</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Compact KPI card component
function KpiCard({ icon, label, value, accent, bg }: { icon: React.ReactNode; label: string; value: string; accent: string; bg: string }) {
  return (
    <Card className="border">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${bg}`}>
            <span className={accent}>{icon}</span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground truncate leading-tight">{label}</p>
            <p className={`text-xs font-bold ${accent} truncate`}>{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
