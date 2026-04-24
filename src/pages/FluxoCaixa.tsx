import { useMemo, useState } from "react";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { useTableQuery } from "@/hooks/useSupabaseQuery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, TrendingDown, Calendar, Target, BarChart3, AlertTriangle, CheckCircle2, FileDown, Search, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, ComposedChart, Cell, ReferenceLine } from "recharts";
import { Progress } from "@/components/ui/progress";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";
const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const mesesFull = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function FluxoCaixa() {
  const { data: lancamentos = [], isLoading: loadingLanc } = useTableQuery("lancamentos_caixa", { orderBy: "data_lancamento" });
  const { data: contasReceber = [], isLoading: loadingCR } = useTableQuery("contas_receber", { orderBy: "data_vencimento" });
  const { data: contasPagar = [], isLoading: loadingCP } = useTableQuery("contas_pagar", { orderBy: "data_vencimento" });
  const { data: categorias = [], isLoading: loadingCat } = useTableQuery("categorias");

  const isLoading = loadingLanc || loadingCR || loadingCP || loadingCat;
  const { toast } = useToast();

  useRealtimeSubscription("lancamentos_caixa", [["lancamentos_caixa"]]);
  useRealtimeSubscription("contas_receber", [["contas_receber"]]);
  useRealtimeSubscription("contas_pagar", [["contas_pagar"]]);

  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth()));

  // Estados para filtros de data (Fluxo Realizado)
  const [dataInicio, setDataInicio] = useState<string>(() => {
    const hoje = new Date();
    const inicioMes = startOfMonth(hoje);
    return format(inicioMes, "yyyy-MM-dd");
  });
  const [dataFim, setDataFim] = useState<string>(() => {
    const hoje = new Date();
    const fimMes = endOfMonth(hoje);
    return format(fimMes, "yyyy-MM-dd");
  });
  const [mostrarFiltros, setMostrarFiltros] = useState<boolean>(false);

  // Estados para filtros de data (Planejamento Orçamentário)
  const [dataInicioPlan, setDataInicioPlan] = useState<string>(() => {
    const hoje = new Date();
    const inicioMes = startOfMonth(hoje);
    return format(inicioMes, "yyyy-MM-dd");
  });
  const [dataFimPlan, setDataFimPlan] = useState<string>(() => {
    const hoje = new Date();
    const fimMes = endOfMonth(hoje);
    return format(fimMes, "yyyy-MM-dd");
  });
  const [mostrarFiltrosPlan, setMostrarFiltrosPlan] = useState<boolean>(false);

  const { chartData, totalEntradas, totalSaidas, totalOrcadoEntradas, totalOrcadoSaidas, orcadoItems } = useMemo(() => {
    const monthlyReal: Record<string, { entradas: number; saidas: number }> = {};
    meses.forEach((m) => { monthlyReal[m] = { entradas: 0, saidas: 0 }; });

    (lancamentos as any[]).forEach((l) => {
      const month = new Date(l.data_lancamento + "T00:00:00").getMonth();
      const key = meses[month];
      if (l.tipo === "entrada") monthlyReal[key].entradas += Number(l.valor);
      else monthlyReal[key].saidas += Number(l.valor);
    });

    const monthlyOrc: Record<string, { entradas: number; saidas: number }> = {};
    meses.forEach((m) => { monthlyOrc[m] = { entradas: 0, saidas: 0 }; });

    const orcadoItems: any[] = [];

    (contasReceber as any[]).filter((c) => c.status === "pendente").forEach((c) => {
      const month = new Date(c.data_vencimento + "T00:00:00").getMonth();
      const key = meses[month];
      monthlyOrc[key].entradas += Number(c.valor);
      orcadoItems.push({ ...c, _tipo: "entrada", _origem: "A Receber" });
    });

    (contasPagar as any[]).filter((c) => c.status === "pendente").forEach((c) => {
      const month = new Date(c.data_vencimento + "T00:00:00").getMonth();
      const key = meses[month];
      monthlyOrc[key].saidas += Number(c.valor);
      orcadoItems.push({ ...c, _tipo: "saida", _origem: "A Pagar" });
    });

    let saldoReal = 0;
    let saldoTotal = 0;
    const chartData = meses.map((m) => {
      saldoReal += monthlyReal[m].entradas - monthlyReal[m].saidas;
      saldoTotal += (monthlyReal[m].entradas + monthlyOrc[m].entradas) - (monthlyReal[m].saidas + monthlyOrc[m].saidas);
      return {
        mes: m,
        entradasReal: monthlyReal[m].entradas,
        saidasReal: monthlyReal[m].saidas,
        entradasOrc: monthlyOrc[m].entradas,
        saidasOrc: monthlyOrc[m].saidas,
        saldoReal,
        saldoProjetado: saldoTotal,
      };
    });

    const totalEntradas = (lancamentos as any[]).filter((l) => l.tipo === "entrada").reduce((s, l) => s + Number(l.valor), 0);
    const totalSaidas = (lancamentos as any[]).filter((l) => l.tipo === "saida").reduce((s, l) => s + Number(l.valor), 0);
    const totalOrcadoEntradas = (contasReceber as any[]).filter((c) => c.status === "pendente").reduce((s, c) => s + Number(c.valor), 0);
    const totalOrcadoSaidas = (contasPagar as any[]).filter((c) => c.status === "pendente").reduce((s, c) => s + Number(c.valor), 0);

    return { chartData, totalEntradas, totalSaidas, totalOrcadoEntradas, totalOrcadoSaidas, orcadoItems };
  }, [lancamentos, contasReceber, contasPagar]);

  // Budget planning data — auto-generated from categories + actual data
  const budgetData = useMemo(() => {
    const monthIdx = Number(selectedMonth);
    const cats = categorias as any[];

    // Group categories by type
    const receitaCats = cats.filter((c) => c.tipo === "receita" && c.ativo);
    const despesaCats = cats.filter((c) => c.tipo === "despesa" && c.ativo);

    // Calculate realized per category for the selected month
    const realizadoPorCategoria: Record<string, number> = {};
    (lancamentos as any[]).forEach((l) => {
      const lMonth = new Date(l.data_lancamento + "T00:00:00").getMonth();
      if (lMonth === monthIdx && l.categoria_id) {
        realizadoPorCategoria[l.categoria_id] = (realizadoPorCategoria[l.categoria_id] || 0) + Number(l.valor);
      }
    });

    // Calculate budgeted (pending) per category for the selected month
    const orcadoPorCategoria: Record<string, number> = {};
    (contasReceber as any[]).forEach((c) => {
      const cMonth = new Date(c.data_vencimento + "T00:00:00").getMonth();
      if (cMonth === monthIdx && c.categoria_id) {
        orcadoPorCategoria[c.categoria_id] = (orcadoPorCategoria[c.categoria_id] || 0) + Number(c.valor);
      }
    });
    (contasPagar as any[]).forEach((c) => {
      const cMonth = new Date(c.data_vencimento + "T00:00:00").getMonth();
      if (cMonth === monthIdx && c.categoria_id) {
        orcadoPorCategoria[c.categoria_id] = (orcadoPorCategoria[c.categoria_id] || 0) + Number(c.valor);
      }
    });

    const buildRows = (catList: any[], tipo: "receita" | "despesa") => {
      return catList.map((cat) => {
        const orcado = orcadoPorCategoria[cat.id] || 0;
        const realizado = realizadoPorCategoria[cat.id] || 0;
        const variacao = realizado - orcado;
        const percentual = orcado > 0 ? (realizado / orcado) * 100 : realizado > 0 ? 100 : 0;
        return { id: cat.id, nome: cat.nome, tipo, orcado, realizado, variacao, percentual };
      });
    };

    const receitas = buildRows(receitaCats, "receita");
    const despesas = buildRows(despesaCats, "despesa");

    const totalReceitaOrcada = receitas.reduce((s, r) => s + r.orcado, 0);
    const totalReceitaRealizada = receitas.reduce((s, r) => s + r.realizado, 0);
    const totalDespesaOrcada = despesas.reduce((s, r) => s + r.orcado, 0);
    const totalDespesaRealizada = despesas.reduce((s, r) => s + r.realizado, 0);

    // Chart data for budget vs realized by category
    const chartCategories = [...receitas, ...despesas]
      .filter((r) => r.orcado > 0 || r.realizado > 0)
      .sort((a, b) => (b.orcado + b.realizado) - (a.orcado + a.realizado))
      .slice(0, 10);

    // Monthly trend for the year
    const monthlyBudget = meses.map((m, idx) => {
      let orcReceitas = 0, orcDespesas = 0, realReceitas = 0, realDespesas = 0;

      (contasReceber as any[]).forEach((c) => {
        const cMonth = new Date(c.data_vencimento + "T00:00:00").getMonth();
        if (cMonth === idx) orcReceitas += Number(c.valor);
      });
      (contasPagar as any[]).forEach((c) => {
        const cMonth = new Date(c.data_vencimento + "T00:00:00").getMonth();
        if (cMonth === idx) orcDespesas += Number(c.valor);
      });
      (lancamentos as any[]).forEach((l) => {
        const lMonth = new Date(l.data_lancamento + "T00:00:00").getMonth();
        if (lMonth === idx) {
          if (l.tipo === "entrada") realReceitas += Number(l.valor);
          else realDespesas += Number(l.valor);
        }
      });

      return {
        mes: m,
        receitaOrcada: orcReceitas,
        despesaOrcada: orcDespesas,
        receitaRealizada: realReceitas,
        despesaRealizada: realDespesas,
        resultadoOrcado: orcReceitas - orcDespesas,
        resultadoRealizado: realReceitas - realDespesas,
      };
    });

    return {
      receitas, despesas,
      totalReceitaOrcada, totalReceitaRealizada,
      totalDespesaOrcada, totalDespesaRealizada,
      chartCategories, monthlyBudget,
    };
  }, [categorias, lancamentos, contasReceber, contasPagar, selectedMonth]);

  const resultadoOrcado = budgetData.totalReceitaOrcada - budgetData.totalDespesaOrcada;
  const resultadoRealizado = budgetData.totalReceitaRealizada - budgetData.totalDespesaRealizada;

  // Função para exportar relatório de planejamento orçamentário
  const exportarRelatorioPlanejamento = () => {
    const dataInicioObj = parseISO(dataInicioPlan);
    const dataFimObj = parseISO(dataFimPlan);

    // Dados das receitas
    const dadosReceitas = budgetData.receitas
      .filter((r) => r.orcado > 0 || r.realizado > 0)
      .map((r) => ({
        Categoria: r.nome,
        Tipo: "Receita",
        Orçado: r.orcado,
        Realizado: r.realizado,
        Variação: r.variacao,
        Percentual: `${r.percentual.toFixed(0)}%`,
      }));

    // Dados das despesas
    const dadosDespesas = budgetData.despesas
      .filter((r) => r.orcado > 0 || r.realizado > 0)
      .map((r) => ({
        Categoria: r.nome,
        Tipo: "Despesa",
        Orçado: r.orcado,
        Realizado: r.realizado,
        Variação: r.variacao,
        Percentual: `${r.percentual.toFixed(0)}%`,
      }));

    // Resumo
    const dadosResumo = [
      { Item: "Total Receita Orçada", Valor: budgetData.totalReceitaOrcada },
      { Item: "Total Receita Realizada", Valor: budgetData.totalReceitaRealizada },
      { Item: "Total Despesa Orçada", Valor: budgetData.totalDespesaOrcada },
      { Item: "Total Despesa Realizada", Valor: budgetData.totalDespesaRealizada },
      { Item: "Resultado Orçado", Valor: resultadoOrcado },
      { Item: "Resultado Realizado", Valor: resultadoRealizado },
    ];

    // Criar workbook
    const wb = XLSX.utils.book_new();

    // Adicionar abas
    if (dadosReceitas.length > 0) {
      const wsReceitas = XLSX.utils.json_to_sheet(dadosReceitas);
      wsReceitas["!cols"] = [{ wch: 40 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, wsReceitas, "Receitas");
    }

    if (dadosDespesas.length > 0) {
      const wsDespesas = XLSX.utils.json_to_sheet(dadosDespesas);
      wsDespesas["!cols"] = [{ wch: 40 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, wsDespesas, "Despesas");
    }

    const wsResumo = XLSX.utils.json_to_sheet(dadosResumo);
    wsResumo["!cols"] = [{ wch: 30 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

    // Exportar
    const nomeArquivo = `Planejamento_Orcamentario_${format(dataInicioObj, "dd-MM-yyyy")}_a_${format(dataFimObj, "dd-MM-yyyy")}.xlsx`;
    XLSX.writeFile(wb, nomeArquivo);

    toast({
      title: "Relatório de planejamento exportado!",
      description: `Planejamento orçamentário exportado para Excel.`,
    });
  };

  // Função para exportar relatório de fluxo
  const exportarRelatorio = () => {
    const dataInicioObj = parseISO(dataInicio);
    const dataFimObj = parseISO(dataFim);

    // Filtrar lançamentos no período
    const lancamentosFiltrados = (lancamentos as any[]).filter((l) => {
      const dataLanc = parseISO(l.data_lancamento);
      return dataLanc >= dataInicioObj && dataLanc <= dataFimObj;
    });

    const entradas = lancamentosFiltrados.filter((l) => l.tipo === "entrada");
    const saidas = lancamentosFiltrados.filter((l) => l.tipo === "saida");

    const totalEntradas = entradas.reduce((s, l) => s + Number(l.valor), 0);
    const totalSaidas = saidas.reduce((s, l) => s + Number(l.valor), 0);
    const saldo = totalEntradas - totalSaidas;

    // Preparar dados para exportação
    const dadosEntradas = entradas.map((l) => ({
      Data: fmtDate(l.data_lancamento),
      Descricao: l.descricao,
      Tipo: "Entrada",
      Valor: Number(l.valor),
    }));

    const dadosSaidas = saidas.map((l) => ({
      Data: fmtDate(l.data_lancamento),
      Descricao: l.descricao,
      Tipo: "Saída",
      Valor: Number(l.valor),
    }));

    const resumo = [
      { Item: "Total de Entradas", Valor: totalEntradas },
      { Item: "Total de Saídas", Valor: totalSaidas },
      { Item: "Saldo do Período", Valor: saldo },
    ];

    // Criar workbook
    const wb = XLSX.utils.book_new();

    // Adicionar abas
    if (dadosEntradas.length > 0) {
      const wsEntradas = XLSX.utils.json_to_sheet(dadosEntradas);
      wsEntradas["!cols"] = [{ wch: 12 }, { wch: 50 }, { wch: 12 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsEntradas, "Entradas");
    }

    if (dadosSaidas.length > 0) {
      const wsSaidas = XLSX.utils.json_to_sheet(dadosSaidas);
      wsSaidas["!cols"] = [{ wch: 12 }, { wch: 50 }, { wch: 12 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsSaidas, "Saídas");
    }

    const wsResumo = XLSX.utils.json_to_sheet(resumo);
    wsResumo["!cols"] = [{ wch: 30 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

    // Exportar
    const nomeArquivo = `Fluxo_Caixa_${format(dataInicioObj, "dd-MM-yyyy")}_a_${format(dataFimObj, "dd-MM-yyyy")}.xlsx`;
    XLSX.writeFile(wb, nomeArquivo);

    toast({
      title: "Relatório exportado!",
      description: `${lancamentosFiltrados.length} lançamentos exportados para Excel.`,
    });
  };

  // Aplicar filtro de datas
  const lancamentosFiltrados = useMemo(() => {
    if (!dataInicio || !dataFim) return lancamentos;

    const dataInicioObj = parseISO(dataInicio);
    const dataFimObj = parseISO(dataFim);

    return (lancamentos as any[]).filter((l) => {
      const dataLanc = parseISO(l.data_lancamento);
      return dataLanc >= dataInicioObj && dataLanc <= dataFimObj;
    });
  }, [lancamentos, dataInicio, dataFim]);

  return (
    <div className="space-y-6">
      {/* Header com título e botões */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Fluxo de Caixa</h1>
          <p className="text-sm text-muted-foreground">Realizado, orçado e planejamento orçamentário</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className={mostrarFiltros ? "bg-muted" : ""}
          >
            <Filter className="mr-2 h-4 w-4" />
            {mostrarFiltros ? "Ocultar Filtros" : "Filtrar por Data"}
          </Button>
          <Button onClick={exportarRelatorio} className="bg-blue-600 hover:bg-blue-700">
            <FileDown className="mr-2 h-4 w-4" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Filtros de Data */}
      {mostrarFiltros && (
        <Card className="border-blue-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <Label className="text-xs font-medium mb-1.5 block">Data Início</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex-1 w-full">
                <Label className="text-xs font-medium mb-1.5 block">Data Fim</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const hoje = new Date();
                    setDataInicio(format(startOfMonth(hoje), "yyyy-MM-dd"));
                    setDataFim(format(endOfMonth(hoje), "yyyy-MM-dd"));
                  }}
                >
                  Mês Atual
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const hoje = new Date();
                    setDataInicio(format(new Date(hoje.getFullYear(), 0, 1), "yyyy-MM-dd"));
                    setDataFim(format(new Date(hoje.getFullYear(), 11, 31), "yyyy-MM-dd"));
                  }}
                >
                  Ano Atual
                </Button>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
              <Search className="h-3 w-3" />
              Período selecionado: {format(parseISO(dataInicio), "dd/MM/yyyy")} a {format(parseISO(dataFim), "dd/MM/yyyy")}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Entradas Realizadas</p>
            <p className="text-lg font-bold text-accent">{fmt(totalEntradas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Saídas Realizadas</p>
            <p className="text-lg font-bold text-destructive">{fmt(totalSaidas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Saldo Realizado</p>
            <p className="text-lg font-bold text-primary">{fmt(totalEntradas - totalSaidas)}</p>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">A Receber (Orçado)</p>
            </div>
            <p className="text-lg font-bold text-accent">{fmt(totalOrcadoEntradas)}</p>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">A Pagar (Orçado)</p>
            </div>
            <p className="text-lg font-bold text-destructive">{fmt(totalOrcadoSaidas)}</p>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Saldo Projetado</p>
            </div>
            <p className="text-lg font-bold text-primary">
              {fmt((totalEntradas - totalSaidas) + (totalOrcadoEntradas - totalOrcadoSaidas))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader><CardTitle className="text-lg font-display">Fluxo Mensal — Realizado vs Orçado</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Bar dataKey="entradasReal" name="Entradas Realizadas" fill="hsl(var(--chart-income))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saidasReal" name="Saídas Realizadas" fill="hsl(var(--chart-expense))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="entradasOrc" name="Entradas Orçadas" fill="hsl(var(--chart-income))" radius={[4, 4, 0, 0]} opacity={0.35} />
              <Bar dataKey="saidasOrc" name="Saídas Orçadas" fill="hsl(var(--chart-expense))" radius={[4, 4, 0, 0]} opacity={0.35} />
              <Line type="monotone" dataKey="saldoReal" name="Saldo Realizado" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="saldoProjetado" name="Saldo Projetado" stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="6 3" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabs: Realizado / Orçado / Planejamento */}
      <Tabs defaultValue="realizado">
        <TabsList>
          <TabsTrigger value="realizado">Realizado</TabsTrigger>
          <TabsTrigger value="orcado">Orçado (Pendentes)</TabsTrigger>
          <TabsTrigger value="planejamento">
            <Target className="h-3.5 w-3.5 mr-1.5" />
            Planejamento Orçamentário
          </TabsTrigger>
        </TabsList>

        <TabsContent value="realizado">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-lg font-display">Lançamentos Realizados</CardTitle>
              {mostrarFiltros && (
                <Badge variant="secondary" className="text-xs">
                  {lancamentosFiltrados.length} lançamentos no período filtrado
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
                  ) : (lancamentosFiltrados as any[]).length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      {mostrarFiltros
                        ? "Nenhum lançamento encontrado no período selecionado."
                        : "Nenhum lançamento realizado."}
                    </TableCell></TableRow>
                  ) : (
                    (lancamentosFiltrados as any[]).sort((a, b) => b.data_lancamento.localeCompare(a.data_lancamento)).map((l) => (
                      <TableRow key={l.id}>
                        <TableCell>{fmtDate(l.data_lancamento)}</TableCell>
                        <TableCell className="font-medium">{l.descricao}</TableCell>
                        <TableCell>
                          <Badge variant={l.tipo === "entrada" ? "default" : "destructive"}>
                            {l.tipo === "entrada" ? "ENTRADA" : "SAÍDA"}
                          </Badge>
                        </TableCell>
                        <TableCell className={l.tipo === "entrada" ? "text-accent font-semibold" : "text-destructive font-semibold"}>
                          {l.tipo === "entrada" ? "+" : "-"}{fmt(Number(l.valor))}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orcado">
          <Card>
            <CardHeader><CardTitle className="text-lg font-display">Contas Pendentes (Orçado)</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
                  ) : orcadoItems.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      Nenhuma conta pendente encontrada.
                    </TableCell></TableRow>
                  ) : (
                    orcadoItems.sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento)).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{fmtDate(item.data_vencimento)}</TableCell>
                        <TableCell className="font-medium">{item.descricao}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item._origem}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item._tipo === "entrada" ? "default" : "destructive"}>
                            {item._tipo === "entrada" ? "ENTRADA" : "SAÍDA"}
                          </Badge>
                        </TableCell>
                        <TableCell className={item._tipo === "entrada" ? "text-accent font-semibold" : "text-destructive font-semibold"}>
                          {item._tipo === "entrada" ? "+" : "-"}{fmt(Number(item.valor))}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PLANEJAMENTO ORÇAMENTÁRIO */}
        <TabsContent value="planejamento" className="space-y-6">
          {/* Header com título, botões e filtros */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold font-display text-foreground">Planejamento Orçamentário</h2>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setMostrarFiltrosPlan(!mostrarFiltrosPlan)}
                  className={mostrarFiltrosPlan ? "bg-muted" : ""}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  {mostrarFiltrosPlan ? "Ocultar Filtros" : "Filtrar por Data"}
                </Button>
                <Button onClick={exportarRelatorioPlanejamento} className="bg-blue-600 hover:bg-blue-700">
                  <FileDown className="mr-2 h-4 w-4" />
                  Exportar Relatório
                </Button>
              </div>
            </div>

            {/* Filtros de Data do Planejamento */}
            {mostrarFiltrosPlan && (
              <Card className="border-blue-200">
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                      <Label className="text-xs font-medium mb-1.5 block">Data Início</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          value={dataInicioPlan}
                          onChange={(e) => setDataInicioPlan(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="flex-1 w-full">
                      <Label className="text-xs font-medium mb-1.5 block">Data Fim</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          value={dataFimPlan}
                          onChange={(e) => setDataFimPlan(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const hoje = new Date();
                          setDataInicioPlan(format(startOfMonth(hoje), "yyyy-MM-dd"));
                          setDataFimPlan(format(endOfMonth(hoje), "yyyy-MM-dd"));
                        }}
                      >
                        Mês Atual
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const hoje = new Date();
                          setDataInicioPlan(format(new Date(hoje.getFullYear(), 0, 1), "yyyy-MM-dd"));
                          setDataFimPlan(format(new Date(hoje.getFullYear(), 11, 31), "yyyy-MM-dd"));
                        }}
                      >
                        Ano Atual
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    Período selecionado: {format(parseISO(dataInicioPlan), "dd/MM/yyyy")} a {format(parseISO(dataFimPlan), "dd/MM/yyyy")}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Month selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Mês de referência:</span>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mesesFull.map((m, i) => (
                    <SelectItem key={i} value={String(i)}>{m} 2026</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary cards for selected month */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-xs text-muted-foreground">Receita Orçada</p>
                <p className="text-lg font-bold text-accent">{fmt(budgetData.totalReceitaOrcada)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-xs text-muted-foreground">Receita Realizada</p>
                <p className="text-lg font-bold text-accent">{fmt(budgetData.totalReceitaRealizada)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-xs text-muted-foreground">Despesa Orçada</p>
                <p className="text-lg font-bold text-destructive">{fmt(budgetData.totalDespesaOrcada)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-xs text-muted-foreground">Despesa Realizada</p>
                <p className="text-lg font-bold text-destructive">{fmt(budgetData.totalDespesaRealizada)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Result cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card className={resultadoOrcado >= 0 ? "border-accent/30 bg-accent/5" : "border-destructive/30 bg-destructive/5"}>
              <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
                <div className={`rounded-full p-2 ${resultadoOrcado >= 0 ? "bg-accent/10" : "bg-destructive/10"}`}>
                  <Target className={`h-5 w-5 ${resultadoOrcado >= 0 ? "text-accent" : "text-destructive"}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Resultado Orçado ({mesesFull[Number(selectedMonth)]})</p>
                  <p className={`text-xl font-bold ${resultadoOrcado >= 0 ? "text-accent" : "text-destructive"}`}>
                    {fmt(resultadoOrcado)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className={resultadoRealizado >= 0 ? "border-accent/30 bg-accent/5" : "border-destructive/30 bg-destructive/5"}>
              <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
                <div className={`rounded-full p-2 ${resultadoRealizado >= 0 ? "bg-accent/10" : "bg-destructive/10"}`}>
                  {resultadoRealizado >= 0 ? <CheckCircle2 className="h-5 w-5 text-accent" /> : <AlertTriangle className="h-5 w-5 text-destructive" />}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Resultado Realizado ({mesesFull[Number(selectedMonth)]})</p>
                  <p className={`text-xl font-bold ${resultadoRealizado >= 0 ? "text-accent" : "text-destructive"}`}>
                    {fmt(resultadoRealizado)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Annual trend chart */}
          <Card>
            <CardHeader><CardTitle className="text-lg font-display">Resultado Mensal — Orçado vs Realizado (2026)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={budgetData.monthlyBudget}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                  <Bar dataKey="receitaOrcada" name="Receita Orçada" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} opacity={0.4} barSize={18} />
                  <Bar dataKey="despesaOrcada" name="Despesa Orçada" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} opacity={0.4} barSize={18} />
                  <Bar dataKey="receitaRealizada" name="Receita Realizada" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} barSize={18} />
                  <Bar dataKey="despesaRealizada" name="Despesa Realizada" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} barSize={18} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category breakdown tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Receitas por categoria */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  Receitas por Categoria — {mesesFull[Number(selectedMonth)]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {budgetData.receitas.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhuma categoria de receita cadastrada.</p>
                ) : (
                  <div className="space-y-3">
                    {budgetData.receitas.filter(r => r.orcado > 0 || r.realizado > 0).map((row) => (
                      <div key={row.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">{row.nome}</span>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>Orçado: {fmt(row.orcado)}</span>
                            <span>Real: {fmt(row.realizado)}</span>
                          </div>
                        </div>
                        <Progress value={Math.min(row.percentual, 100)} className="h-2" />
                        <div className="flex justify-between text-xs">
                          <span className={row.variacao >= 0 ? "text-accent" : "text-destructive"}>
                            {row.variacao >= 0 ? "+" : ""}{fmt(row.variacao)}
                          </span>
                          <span className="text-muted-foreground">{row.percentual.toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                    {budgetData.receitas.every(r => r.orcado === 0 && r.realizado === 0) && (
                      <p className="text-sm text-muted-foreground text-center py-4">Sem movimentação neste mês.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Despesas por categoria */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  Despesas por Categoria — {mesesFull[Number(selectedMonth)]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {budgetData.despesas.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhuma categoria de despesa cadastrada.</p>
                ) : (
                  <div className="space-y-3">
                    {budgetData.despesas.filter(r => r.orcado > 0 || r.realizado > 0).map((row) => (
                      <div key={row.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">{row.nome}</span>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>Orçado: {fmt(row.orcado)}</span>
                            <span>Real: {fmt(row.realizado)}</span>
                          </div>
                        </div>
                        <Progress value={Math.min(row.percentual, 100)} className="h-2" />
                        <div className="flex justify-between text-xs">
                          <span className={row.variacao <= 0 ? "text-accent" : "text-destructive"}>
                            {row.variacao >= 0 ? "+" : ""}{fmt(row.variacao)}
                          </span>
                          <span className="text-muted-foreground">{row.percentual.toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                    {budgetData.despesas.every(r => r.orcado === 0 && r.realizado === 0) && (
                      <p className="text-sm text-muted-foreground text-center py-4">Sem movimentação neste mês.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed budget table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Detalhamento Orçamentário — {mesesFull[Number(selectedMonth)]} 2026
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Orçado</TableHead>
                    <TableHead className="text-right">Realizado</TableHead>
                    <TableHead className="text-right">Variação</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...budgetData.receitas, ...budgetData.despesas].filter(r => r.orcado > 0 || r.realizado > 0).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        <Target className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        Sem dados orçamentários para {mesesFull[Number(selectedMonth)]}. Cadastre contas a pagar/receber com categorias.
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {budgetData.receitas.filter(r => r.orcado > 0 || r.realizado > 0).map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.nome}</TableCell>
                          <TableCell><Badge variant="default">Receita</Badge></TableCell>
                          <TableCell className="text-right">{fmt(row.orcado)}</TableCell>
                          <TableCell className="text-right">{fmt(row.realizado)}</TableCell>
                          <TableCell className={`text-right font-semibold ${row.variacao >= 0 ? "text-accent" : "text-destructive"}`}>
                            {row.variacao >= 0 ? "+" : ""}{fmt(row.variacao)}
                          </TableCell>
                          <TableCell className="text-right">{row.percentual.toFixed(0)}%</TableCell>
                          <TableCell>
                            {row.percentual >= 100 ? (
                              <Badge className="bg-accent/10 text-accent border-accent/20"><CheckCircle2 className="h-3 w-3 mr-1" />Atingido</Badge>
                            ) : row.percentual >= 70 ? (
                              <Badge variant="outline" className="text-primary">Em andamento</Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">Pendente</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {budgetData.despesas.filter(r => r.orcado > 0 || r.realizado > 0).map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.nome}</TableCell>
                          <TableCell><Badge variant="destructive">Despesa</Badge></TableCell>
                          <TableCell className="text-right">{fmt(row.orcado)}</TableCell>
                          <TableCell className="text-right">{fmt(row.realizado)}</TableCell>
                          <TableCell className={`text-right font-semibold ${row.variacao <= 0 ? "text-accent" : "text-destructive"}`}>
                            {row.variacao >= 0 ? "+" : ""}{fmt(row.variacao)}
                          </TableCell>
                          <TableCell className="text-right">{row.percentual.toFixed(0)}%</TableCell>
                          <TableCell>
                            {row.percentual > 100 ? (
                              <Badge className="bg-destructive/10 text-destructive border-destructive/20"><AlertTriangle className="h-3 w-3 mr-1" />Excedido</Badge>
                            ) : row.percentual >= 70 ? (
                              <Badge variant="outline" className="text-amber-600">Atenção</Badge>
                            ) : (
                              <Badge variant="outline" className="text-accent">Dentro do orçamento</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Totals */}
                      <TableRow className="bg-muted/30 font-bold">
                        <TableCell>TOTAL RECEITAS</TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right text-accent">{fmt(budgetData.totalReceitaOrcada)}</TableCell>
                        <TableCell className="text-right text-accent">{fmt(budgetData.totalReceitaRealizada)}</TableCell>
                        <TableCell className={`text-right ${budgetData.totalReceitaRealizada - budgetData.totalReceitaOrcada >= 0 ? "text-accent" : "text-destructive"}`}>
                          {fmt(budgetData.totalReceitaRealizada - budgetData.totalReceitaOrcada)}
                        </TableCell>
                        <TableCell className="text-right">
                          {budgetData.totalReceitaOrcada > 0 ? ((budgetData.totalReceitaRealizada / budgetData.totalReceitaOrcada) * 100).toFixed(0) : 0}%
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      <TableRow className="bg-muted/30 font-bold">
                        <TableCell>TOTAL DESPESAS</TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right text-destructive">{fmt(budgetData.totalDespesaOrcada)}</TableCell>
                        <TableCell className="text-right text-destructive">{fmt(budgetData.totalDespesaRealizada)}</TableCell>
                        <TableCell className={`text-right ${budgetData.totalDespesaRealizada - budgetData.totalDespesaOrcada <= 0 ? "text-accent" : "text-destructive"}`}>
                          {fmt(budgetData.totalDespesaRealizada - budgetData.totalDespesaOrcada)}
                        </TableCell>
                        <TableCell className="text-right">
                          {budgetData.totalDespesaOrcada > 0 ? ((budgetData.totalDespesaRealizada / budgetData.totalDespesaOrcada) * 100).toFixed(0) : 0}%
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
