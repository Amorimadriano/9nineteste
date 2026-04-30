import { useMemo, useState } from "react";
import { useTableQuery, useTableMutation } from "@/hooks/useSupabaseQuery";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  Target, TrendingUp, TrendingDown, BarChart3, Plus, Save, Trash2,
  AlertTriangle, CheckCircle2, PieChart, ArrowUpDown, Calendar, ChevronsUpDown, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ComposedChart, Line, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ReferenceLine,
  Area, AreaChart
} from "recharts";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const mesesFull = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const COLORS = [
  "hsl(217, 72%, 42%)", "hsl(160, 60%, 42%)", "hsl(0, 72%, 51%)",
  "hsl(45, 90%, 50%)", "hsl(280, 60%, 50%)", "hsl(190, 70%, 45%)",
  "hsl(30, 80%, 50%)", "hsl(330, 60%, 50%)", "hsl(120, 50%, 40%)",
  "hsl(200, 80%, 55%)"
];

export default function PlanejamentoOrcamentario() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: categorias = [], isLoading: loadingCat } = useTableQuery("categorias");
  const { data: lancamentos = [] } = useTableQuery("lancamentos_caixa", { orderBy: "data_lancamento" });
  const { data: contasReceber = [] } = useTableQuery("contas_receber", { orderBy: "data_vencimento" });
  const { data: contasPagar = [] } = useTableQuery("contas_pagar", { orderBy: "data_vencimento" });
  const { data: metas = [], isLoading: loadingMetas } = useTableQuery("metas_orcamentarias");
  const { insert: insertMeta, update: updateMeta, remove: removeMeta } = useTableMutation("metas_orcamentarias");

  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [selectedYear] = useState(2026);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMeta, setEditMeta] = useState<any>(null);
  const [formCat, setFormCat] = useState("");
  const [formValor, setFormValor] = useState("");
  const [formObs, setFormObs] = useState("");
  const [catComboOpen, setCatComboOpen] = useState(false);
  const [replicarMeses, setReplicarMeses] = useState(true);

  const isLoading = loadingCat || loadingMetas;

  const cats = categorias as any[];
  const metasArr = metas as any[];

  // Build budget data
  const budgetAnalysis = useMemo(() => {
    const monthIdx = Number(selectedMonth) - 1;

    // Realized per category for selected month
    const realizadoPorCat: Record<string, { valor: number; tipo: string }> = {};
    (lancamentos as any[]).forEach((l) => {
      const lMonth = new Date(l.data_lancamento + "T00:00:00").getMonth();
      if (lMonth === monthIdx && l.categoria_id) {
        if (!realizadoPorCat[l.categoria_id]) {
          realizadoPorCat[l.categoria_id] = { valor: 0, tipo: l.tipo };
        }
        realizadoPorCat[l.categoria_id].valor += Number(l.valor);
      }
    });

    // Auto-budget from pending accounts for selected month
    const autoBudgetPorCat: Record<string, number> = {};
    (contasReceber as any[]).forEach((c) => {
      const cMonth = new Date(c.data_vencimento + "T00:00:00").getMonth();
      if (cMonth === monthIdx && c.categoria_id) {
        autoBudgetPorCat[c.categoria_id] = (autoBudgetPorCat[c.categoria_id] || 0) + Number(c.valor);
      }
    });
    (contasPagar as any[]).forEach((c) => {
      const cMonth = new Date(c.data_vencimento + "T00:00:00").getMonth();
      if (cMonth === monthIdx && c.categoria_id) {
        autoBudgetPorCat[c.categoria_id] = (autoBudgetPorCat[c.categoria_id] || 0) + Number(c.valor);
      }
    });

    // Manual metas for selected month
    const manualMetasPorCat: Record<string, { id: string; valor: number; obs: string }> = {};
    metasArr.filter((m) => m.mes === Number(selectedMonth) && m.ano === selectedYear).forEach((m) => {
      manualMetasPorCat[m.categoria_id] = { id: m.id, valor: Number(m.valor_orcado), obs: m.observacoes || "" };
    });

    // Build rows per category
    const rows = cats.filter((c) => c.ativo).map((cat) => {
      const metaManual = manualMetasPorCat[cat.id];
      const autoOrcado = autoBudgetPorCat[cat.id] || 0;
      const orcado = metaManual ? metaManual.valor : autoOrcado;
      const realizado = realizadoPorCat[cat.id]?.valor || 0;
      const variacao = realizado - orcado;
      const percentual = orcado > 0 ? (realizado / orcado) * 100 : realizado > 0 ? 100 : 0;
      return {
        id: cat.id,
        nome: cat.nome,
        tipo: cat.tipo as "receita" | "despesa",
        orcado,
        autoOrcado,
        realizado,
        variacao,
        percentual,
        metaManual,
        temMetaManual: !!metaManual,
      };
    });

    const receitas = rows.filter((r) => r.tipo === "receita");
    const despesas = rows.filter((r) => r.tipo === "despesa");

    const totalReceitaOrcada = receitas.reduce((s, r) => s + r.orcado, 0);
    const totalReceitaRealizada = receitas.reduce((s, r) => s + r.realizado, 0);
    const totalDespesaOrcada = despesas.reduce((s, r) => s + r.orcado, 0);
    const totalDespesaRealizada = despesas.reduce((s, r) => s + r.realizado, 0);

    // Annual monthly trend
    const monthlyTrend = meses.map((m, idx) => {
      let orcReceitas = 0, orcDespesas = 0, realReceitas = 0, realDespesas = 0;

      // Manual metas for this month
      const monthMetas = metasArr.filter((mt) => mt.mes === idx + 1 && mt.ano === selectedYear);
      monthMetas.forEach((mt) => {
        const cat = cats.find((c) => c.id === mt.categoria_id);
        if (cat?.tipo === "receita") orcReceitas += Number(mt.valor_orcado);
        else if (cat?.tipo === "despesa") orcDespesas += Number(mt.valor_orcado);
      });

      // Auto from pending accounts (only for categories WITHOUT manual metas)
      const metaCatIds = new Set(monthMetas.map((mt) => mt.categoria_id));
      (contasReceber as any[]).forEach((c) => {
        const cMonth = new Date(c.data_vencimento + "T00:00:00").getMonth();
        if (cMonth === idx && c.categoria_id && !metaCatIds.has(c.categoria_id)) {
          orcReceitas += Number(c.valor);
        }
      });
      (contasPagar as any[]).forEach((c) => {
        const cMonth = new Date(c.data_vencimento + "T00:00:00").getMonth();
        if (cMonth === idx && c.categoria_id && !metaCatIds.has(c.categoria_id)) {
          orcDespesas += Number(c.valor);
        }
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
        orcado: orcReceitas - orcDespesas,
        realizado: realReceitas - realDespesas,
        receitaOrcada: orcReceitas,
        despesaOrcada: orcDespesas,
        receitaRealizada: realReceitas,
        despesaRealizada: realDespesas,
      };
    });

    // Pie chart data (top categories by budget)
    const pieData = [...receitas, ...despesas]
      .filter((r) => r.orcado > 0)
      .sort((a, b) => b.orcado - a.orcado)
      .slice(0, 8)
      .map((r, i) => ({ name: r.nome, value: r.orcado, tipo: r.tipo, fill: r.tipo === "receita" ? "hsl(142, 71%, 45%)" : "hsl(0, 72%, 51%)" }));

    // Radar data for category performance
    const radarData = [...receitas, ...despesas]
      .filter((r) => r.orcado > 0 || r.realizado > 0)
      .slice(0, 8)
      .map((r) => ({
        categoria: r.nome.length > 12 ? r.nome.slice(0, 12) + "…" : r.nome,
        orcado: r.orcado,
        realizado: r.realizado,
      }));

    return {
      receitas, despesas, rows,
      totalReceitaOrcada, totalReceitaRealizada,
      totalDespesaOrcada, totalDespesaRealizada,
      monthlyTrend, pieData, radarData,
    };
  }, [cats, metasArr, lancamentos, contasReceber, contasPagar, selectedMonth, selectedYear]);

  const resultadoOrcado = budgetAnalysis.totalReceitaOrcada - budgetAnalysis.totalDespesaOrcada;
  const resultadoRealizado = budgetAnalysis.totalReceitaRealizada - budgetAnalysis.totalDespesaRealizada;

  const handleSaveMeta = async () => {
    if (!formCat || !formValor) {
      toast({ title: "Preencha categoria e valor", variant: "destructive" });
      return;
    }
    try {
      if (editMeta) {
        await updateMeta.mutateAsync({ id: editMeta.id, valor_orcado: Number(formValor), observacoes: formObs || null });
      } else {
        const mesInicial = Number(selectedMonth);
        const valor = Number(formValor);
        const obs = formObs || null;

        // Sempre salva o mês selecionado
        await insertMeta.mutateAsync({
          categoria_id: formCat,
          mes: mesInicial,
          ano: selectedYear,
          valor_orcado: valor,
          observacoes: obs,
        });

        // Replica para os próximos meses (até dezembro), pulando meses que já têm meta
        if (replicarMeses && mesInicial < 12) {
          let replicados = 0;
          for (let m = mesInicial + 1; m <= 12; m++) {
            const jaExiste = metasArr.some(
              (mt: any) => mt.categoria_id === formCat && mt.mes === m && mt.ano === selectedYear
            );
            if (jaExiste) continue;
            await insertMeta.mutateAsync({
              categoria_id: formCat,
              mes: m,
              ano: selectedYear,
              valor_orcado: valor,
              observacoes: obs,
            });
            replicados++;
          }
          if (replicados > 0) {
            toast({
              title: "Meta replicada",
              description: `Valor replicado automaticamente para ${replicados} mês(es) seguintes.`,
            });
          }
        }
      }
      setDialogOpen(false);
      resetForm();
    } catch (e) {}
  };

  const handleEdit = (row: any) => {
    setEditMeta(row.metaManual);
    setFormCat(row.id);
    setFormValor(String(row.metaManual.valor));
    setFormObs(row.metaManual.obs);
    setDialogOpen(true);
  };

  const handleDelete = async (metaId: string) => {
    await removeMeta.mutateAsync(metaId);
  };

  const resetForm = () => {
    setEditMeta(null);
    setFormCat("");
    setFormValor("");
    setFormObs("");
  };

  const openNewDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  // Categories without manual meta for current month
  const availableCats = cats.filter((c) => c.ativo && !metasArr.some((m: any) => m.categoria_id === c.id && m.mes === Number(selectedMonth) && m.ano === selectedYear));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="flex justify-between gap-4">
            <span>{p.name}:</span>
            <span className="font-medium">{fmt(p.value)}</span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Planejamento Orçamentário</h1>
          <p className="text-sm text-muted-foreground">Defina metas, acompanhe a execução e analise variações</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mesesFull.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>{m} {selectedYear}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Nova Meta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editMeta ? "Editar Meta" : "Nova Meta Orçamentária"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Categoria</Label>
                  {editMeta ? (
                    <Input value={cats.find((c) => c.id === formCat)?.nome || ""} disabled className="mt-1" />
                  ) : (
                    <Popover open={catComboOpen} onOpenChange={setCatComboOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={catComboOpen}
                          className="w-full justify-between mt-1 font-normal"
                        >
                          {formCat
                            ? (() => { const c = cats.find((c) => c.id === formCat); return c ? `${c.nome} (${c.tipo})` : "Selecione..."; })()
                            : "Selecione a categoria..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Pesquisar categoria..." />
                          <CommandList>
                            <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                            <CommandGroup>
                              {availableCats.map((c: any) => (
                                <CommandItem
                                  key={c.id}
                                  value={`${c.nome} ${c.tipo}`}
                                  onSelect={() => {
                                    setFormCat(c.id);
                                    setCatComboOpen(false);
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", formCat === c.id ? "opacity-100" : "opacity-0")} />
                                  {c.nome} <span className="ml-1 text-muted-foreground">({c.tipo})</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
                <div>
                  <Label>Valor Orçado (R$)</Label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={formValor}
                    onChange={(e) => setFormValor(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Observações</Label>
                  <Input
                    placeholder="Opcional"
                    value={formObs}
                    onChange={(e) => setFormObs(e.target.value)}
                  />
                </div>
                {!editMeta && Number(selectedMonth) < 12 && (
                  <label className="flex items-start gap-2 p-3 rounded-md border border-border bg-muted/40 cursor-pointer hover:bg-muted/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={replicarMeses}
                      onChange={(e) => setReplicarMeses(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-input accent-primary cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        Replicar para os próximos meses
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Cria automaticamente a mesma meta de {mesesFull[Number(selectedMonth) - 1]} até Dezembro/{selectedYear}. Meses já cadastrados serão preservados.
                      </p>
                    </div>
                  </label>
                )}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleSaveMeta} disabled={insertMeta.isPending || updateMeta.isPending}>
                    <Save className="h-4 w-4 mr-1" />
                    {editMeta ? "Atualizar" : "Salvar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-accent" />
              <p className="text-xs text-muted-foreground">Receita Orçada</p>
            </div>
            <p className="text-xl font-bold text-accent">{fmt(budgetAnalysis.totalReceitaOrcada)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Real: {fmt(budgetAnalysis.totalReceitaRealizada)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <p className="text-xs text-muted-foreground">Despesa Orçada</p>
            </div>
            <p className="text-xl font-bold text-destructive">{fmt(budgetAnalysis.totalDespesaOrcada)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Real: {fmt(budgetAnalysis.totalDespesaRealizada)}</p>
          </CardContent>
        </Card>
        <Card className={resultadoOrcado >= 0 ? "border-accent/30" : "border-destructive/30"}>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">Resultado Orçado</p>
            </div>
            <p className={`text-xl font-bold ${resultadoOrcado >= 0 ? "text-accent" : "text-destructive"}`}>{fmt(resultadoOrcado)}</p>
          </CardContent>
        </Card>
        <Card className={resultadoRealizado >= 0 ? "border-accent/30" : "border-destructive/30"}>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              {resultadoRealizado >= 0 ? <CheckCircle2 className="h-4 w-4 text-accent" /> : <AlertTriangle className="h-4 w-4 text-destructive" />}
              <p className="text-xs text-muted-foreground">Resultado Real</p>
            </div>
            <p className={`text-xl font-bold ${resultadoRealizado >= 0 ? "text-accent" : "text-destructive"}`}>{fmt(resultadoRealizado)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpDown className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">Variação</p>
            </div>
            <p className={`text-xl font-bold ${resultadoRealizado - resultadoOrcado >= 0 ? "text-accent" : "text-destructive"}`}>
              {resultadoRealizado - resultadoOrcado >= 0 ? "+" : ""}{fmt(resultadoRealizado - resultadoOrcado)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="visao-geral">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="visao-geral"><BarChart3 className="h-3.5 w-3.5 mr-1" />Visão Geral</TabsTrigger>
          <TabsTrigger value="detalhamento"><Target className="h-3.5 w-3.5 mr-1" />Detalhamento</TabsTrigger>
          <TabsTrigger value="metas"><Plus className="h-3.5 w-3.5 mr-1" />Metas Manuais</TabsTrigger>
        </TabsList>

        {/* VISÃO GERAL */}
        <TabsContent value="visao-geral" className="space-y-6">
          {/* Annual trend */}
          <Card>
            <CardHeader><CardTitle className="text-lg font-display">Resultado Mensal — Orçado vs Realizado ({selectedYear})</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={budgetAnalysis.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
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

          {/* Charts grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Receitas vs Despesas area chart */}
            <Card>
              <CardHeader><CardTitle className="text-base font-display">Receitas vs Despesas Orçadas ({selectedYear})</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={budgetAnalysis.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="receitaOrcada" name="Receita Orçada" fill="hsl(142, 71%, 45%)" fillOpacity={0.3} stroke="hsl(142, 71%, 45%)" strokeWidth={3} />
                    <Area type="monotone" dataKey="despesaOrcada" name="Despesa Orçada" fill="hsl(0, 72%, 51%)" fillOpacity={0.3} stroke="hsl(0, 72%, 51%)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Bar chart */}
            <Card>
              <CardHeader><CardTitle className="text-base font-display">Distribuição Orçamentária — {mesesFull[Number(selectedMonth) - 1]}</CardTitle></CardHeader>
              <CardContent>
                {budgetAnalysis.pieData.length === 0 ? (
                  <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
                    <BarChart3 className="h-8 w-8 mr-2 opacity-30" />
                    Sem dados orçados para este mês.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={budgetAnalysis.pieData} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Bar dataKey="value" name="Orçado" radius={[0, 6, 6, 0]} barSize={24}>
                        {budgetAnalysis.pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Radar chart */}
          {budgetAnalysis.radarData.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base font-display">Performance por Categoria — {mesesFull[Number(selectedMonth) - 1]}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <RadarChart data={budgetAnalysis.radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="categoria" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                    <Radar name="Orçado" dataKey="orcado" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
                    <Radar name="Realizado" dataKey="realizado" stroke="hsl(160, 60%, 42%)" fill="hsl(160, 60%, 42%)" fillOpacity={0.15} strokeWidth={2} />
                    <Legend />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* DETALHAMENTO */}
        <TabsContent value="detalhamento" className="space-y-6">
          {/* Progress cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  Receitas — {mesesFull[Number(selectedMonth) - 1]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {budgetAnalysis.receitas.filter((r) => r.orcado > 0 || r.realizado > 0).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Sem movimentação neste mês.</p>
                ) : (
                  <div className="space-y-4">
                    {budgetAnalysis.receitas.filter((r) => r.orcado > 0 || r.realizado > 0).map((row) => (
                      <div key={row.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground flex items-center gap-1.5">
                            {row.nome}
                            {row.temMetaManual && <Badge variant="outline" className="text-[10px] px-1 py-0">Manual</Badge>}
                          </span>
                          <span className="text-xs text-muted-foreground">{fmt(row.realizado)} / {fmt(row.orcado)}</span>
                        </div>
                        <Progress value={Math.min(row.percentual, 100)} className="h-2.5" />
                        <div className="flex justify-between text-xs">
                          <span className={row.variacao >= 0 ? "text-accent" : "text-destructive"}>
                            {row.variacao >= 0 ? "+" : ""}{fmt(row.variacao)}
                          </span>
                          <span className="text-muted-foreground font-medium">{row.percentual.toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  Despesas — {mesesFull[Number(selectedMonth) - 1]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {budgetAnalysis.despesas.filter((r) => r.orcado > 0 || r.realizado > 0).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Sem movimentação neste mês.</p>
                ) : (
                  <div className="space-y-4">
                    {budgetAnalysis.despesas.filter((r) => r.orcado > 0 || r.realizado > 0).map((row) => (
                      <div key={row.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground flex items-center gap-1.5">
                            {row.nome}
                            {row.temMetaManual && <Badge variant="outline" className="text-[10px] px-1 py-0">Manual</Badge>}
                          </span>
                          <span className="text-xs text-muted-foreground">{fmt(row.realizado)} / {fmt(row.orcado)}</span>
                        </div>
                        <Progress value={Math.min(row.percentual, 100)} className="h-2.5" />
                        <div className="flex justify-between text-xs">
                          <span className={row.variacao <= 0 ? "text-accent" : "text-destructive"}>
                            {row.variacao >= 0 ? "+" : ""}{fmt(row.variacao)}
                          </span>
                          <span className="text-muted-foreground font-medium">{row.percentual.toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Full table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Detalhamento — {mesesFull[Number(selectedMonth) - 1]} {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead className="text-right">Orçado</TableHead>
                    <TableHead className="text-right">Realizado</TableHead>
                    <TableHead className="text-right">Variação</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgetAnalysis.rows.filter((r) => r.orcado > 0 || r.realizado > 0).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        <Target className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        Sem dados para {mesesFull[Number(selectedMonth) - 1]}. Cadastre metas ou contas com categorias.
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {budgetAnalysis.rows.filter((r) => r.orcado > 0 || r.realizado > 0).map((row) => {
                        const isReceita = row.tipo === "receita";
                        const statusBom = isReceita ? row.variacao >= 0 : row.variacao <= 0;
                        return (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">{row.nome}</TableCell>
                            <TableCell>
                              <Badge variant={isReceita ? "default" : "destructive"}>{isReceita ? "Receita" : "Despesa"}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">
                                {row.temMetaManual ? "Manual" : "Auto"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{fmt(row.orcado)}</TableCell>
                            <TableCell className="text-right">{fmt(row.realizado)}</TableCell>
                            <TableCell className={`text-right font-semibold ${statusBom ? "text-accent" : "text-destructive"}`}>
                              {row.variacao >= 0 ? "+" : ""}{fmt(row.variacao)}
                            </TableCell>
                            <TableCell className="text-right">{row.percentual.toFixed(0)}%</TableCell>
                            <TableCell>
                              {isReceita ? (
                                row.percentual >= 100 ? (
                                  <Badge className="bg-accent/10 text-accent border-accent/20 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-0.5" />Atingido</Badge>
                                ) : row.percentual >= 70 ? (
                                  <Badge variant="outline" className="text-primary text-[10px]">Em andamento</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground text-[10px]">Pendente</Badge>
                                )
                              ) : (
                                row.percentual > 100 ? (
                                  <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]"><AlertTriangle className="h-3 w-3 mr-0.5" />Excedido</Badge>
                                ) : row.percentual >= 80 ? (
                                  <Badge variant="outline" className="text-amber-600 text-[10px]">Atenção</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-accent text-[10px]">No limite</Badge>
                                )
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="bg-muted/30 font-bold border-t-2">
                        <TableCell colSpan={3}>RESULTADO</TableCell>
                        <TableCell className="text-right">{fmt(resultadoOrcado)}</TableCell>
                        <TableCell className="text-right">{fmt(resultadoRealizado)}</TableCell>
                        <TableCell className={`text-right ${resultadoRealizado - resultadoOrcado >= 0 ? "text-accent" : "text-destructive"}`}>
                          {fmt(resultadoRealizado - resultadoOrcado)}
                        </TableCell>
                        <TableCell className="text-right">
                          {resultadoOrcado !== 0 ? ((resultadoRealizado / resultadoOrcado) * 100).toFixed(0) : "—"}%
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

        {/* METAS MANUAIS */}
        <TabsContent value="metas" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-display">Metas Orçamentárias — {mesesFull[Number(selectedMonth) - 1]} {selectedYear}</CardTitle>
              <Button size="sm" onClick={openNewDialog}>
                <Plus className="h-4 w-4 mr-1" /> Nova Meta
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor Orçado</TableHead>
                    <TableHead className="text-right">Realizado</TableHead>
                    <TableHead className="text-right">Variação</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgetAnalysis.rows.filter((r) => r.temMetaManual).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        <Target className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        Nenhuma meta manual cadastrada para {mesesFull[Number(selectedMonth) - 1]}.
                        <br />
                        <span className="text-xs">Clique em "Nova Meta" para definir um orçamento por categoria.</span>
                      </TableCell>
                    </TableRow>
                  ) : (
                    budgetAnalysis.rows.filter((r) => r.temMetaManual).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.nome}</TableCell>
                        <TableCell>
                          <Badge variant={row.tipo === "receita" ? "default" : "destructive"}>
                            {row.tipo === "receita" ? "Receita" : "Despesa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{fmt(row.orcado)}</TableCell>
                        <TableCell className="text-right">{fmt(row.realizado)}</TableCell>
                        <TableCell className={`text-right font-semibold ${
                          (row.tipo === "receita" ? row.variacao >= 0 : row.variacao <= 0) ? "text-accent" : "text-destructive"
                        }`}>
                          {row.variacao >= 0 ? "+" : ""}{fmt(row.variacao)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{row.metaManual?.obs || "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(row)}>
                              <Save className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(row.metaManual.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Auto-populated categories info */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base font-display flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Categorias com Orçamento Automático
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Categorias sem meta manual utilizam automaticamente os valores das contas pendentes (a pagar/receber) como referência orçamentária.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {budgetAnalysis.rows.filter((r) => !r.temMetaManual && (r.orcado > 0 || r.realizado > 0)).map((row) => (
                  <div key={row.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                    <span className="text-sm font-medium">{row.nome}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">Auto</Badge>
                      <span className="text-sm font-semibold">{fmt(row.orcado)}</span>
                    </div>
                  </div>
                ))}
                {budgetAnalysis.rows.filter((r) => !r.temMetaManual && (r.orcado > 0 || r.realizado > 0)).length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-2 text-center py-4">Nenhuma categoria com orçamento automático neste mês.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
