import { useMemo, useState } from "react";
import { useTableQuery } from "@/hooks/useSupabaseQuery";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Target, TrendingUp, TrendingDown, DollarSign, Percent,
  AlertTriangle, CheckCircle2, FileText, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ReferenceLine, ComposedChart, Line, Area,
} from "recharts";
import { exportPontoEquilibrioPdf } from "@/lib/pdfPontoEquilibrioExport";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPct = (v: number) => `${v.toFixed(1)}%`;
const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const mesesFull = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// Termos que identificam custos variáveis (CMV, CSP, insumos, etc.)
const TERMOS_CUSTOS_VARIAVEIS = ["custo", "cmv", "csp", "insumo", "mercadoria", "matéria", "material", "frete", "comissão", "comissao"];
const TERMOS_IMPOSTOS = ["imposto", "iss", "icms", "pis", "cofins", "tributo", "irpj", "csll", "ir ", "dedução", "deducao"];

function isCustoVariavel(nome: string) {
  const lower = nome.toLowerCase();
  return TERMOS_CUSTOS_VARIAVEIS.some(t => lower.includes(t)) || TERMOS_IMPOSTOS.some(t => lower.includes(t));
}

export default function PontoEquilibrio() {
  const currentYear = new Date().getFullYear();
  const [anoSel, setAnoSel] = useState(currentYear);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: contasReceber = [] } = useTableQuery("contas_receber");
  const { data: contasPagar = [] } = useTableQuery("contas_pagar");
  const { data: lancamentos = [] } = useTableQuery("lancamentos_caixa");
  const { data: categorias = [] } = useTableQuery("categorias");

  useRealtimeSubscription("contas_receber", [["contas_receber"]]);
  useRealtimeSubscription("contas_pagar", [["contas_pagar"]]);
  useRealtimeSubscription("lancamentos_caixa", [["lancamentos_caixa"]]);
  useRealtimeSubscription("categorias", [["categorias"]]);

  const catMap = useMemo(() => {
    const m: Record<string, any> = {};
    (categorias as any[]).forEach(c => { m[c.id] = c; });
    return m;
  }, [categorias]);

  const calc = useMemo(() => {
    const cr = (contasReceber as any[]).filter(c => c.status === "recebido");
    const cp = (contasPagar as any[]).filter(c => c.status === "pago");

    // Monthly breakdown
    const monthly = meses.map((mes, idx) => {
      const mesNum = idx + 1;
      const crMes = cr.filter(c => {
        const d = c.data_recebimento || c.data_vencimento;
        return d && new Date(d).getFullYear() === anoSel && (new Date(d).getMonth() + 1) === mesNum;
      });
      const cpMes = cp.filter(c => {
        const d = c.data_pagamento || c.data_vencimento;
        return d && new Date(d).getFullYear() === anoSel && (new Date(d).getMonth() + 1) === mesNum;
      });

      const receita = crMes.reduce((s, c) => s + Number(c.valor), 0);

      let custoVariavel = 0;
      let custoFixo = 0;
      cpMes.forEach(c => {
        const cat = c.categoria_id ? catMap[c.categoria_id] : null;
        const catNome = cat?.nome || "";
        if (isCustoVariavel(catNome)) {
          custoVariavel += Number(c.valor);
        } else {
          custoFixo += Number(c.valor);
        }
      });

      const mc = receita - custoVariavel;
      const mcPct = receita > 0 ? (mc / receita) * 100 : 0;
      const pe = mcPct > 0 ? (custoFixo / (mcPct / 100)) : 0;
      const atingido = receita >= pe && pe > 0;

      return { mes, mesNum, receita, custoVariavel, custoFixo, mc, mcPct, pe, atingido };
    });

    const receitaTotal = monthly.reduce((s, m) => s + m.receita, 0);
    const custosVariaveis = monthly.reduce((s, m) => s + m.custoVariavel, 0);
    const custosFixos = monthly.reduce((s, m) => s + m.custoFixo, 0);
    const margemContribuicao = receitaTotal - custosVariaveis;
    const margemContribuicaoPct = receitaTotal > 0 ? (margemContribuicao / receitaTotal) * 100 : 0;
    const pontoEquilibrio = margemContribuicaoPct > 0 ? custosFixos / (margemContribuicaoPct / 100) : 0;
    const percentualAtingido = pontoEquilibrio > 0 ? (receitaTotal / pontoEquilibrio) * 100 : 0;
    const folga = receitaTotal - pontoEquilibrio;

    // Top custos fixos por categoria
    const custoFixoPorCat: Record<string, number> = {};
    cp.filter(c => {
      const d = c.data_pagamento || c.data_vencimento;
      return d && new Date(d).getFullYear() === anoSel;
    }).forEach(c => {
      const cat = c.categoria_id ? catMap[c.categoria_id] : null;
      const catNome = cat?.nome || "Sem Categoria";
      if (!isCustoVariavel(catNome)) {
        custoFixoPorCat[catNome] = (custoFixoPorCat[catNome] || 0) + Number(c.valor);
      }
    });
    const topCustosFixos = Object.entries(custoFixoPorCat)
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);

    // Top custos variáveis
    const custoVarPorCat: Record<string, number> = {};
    cp.filter(c => {
      const d = c.data_pagamento || c.data_vencimento;
      return d && new Date(d).getFullYear() === anoSel;
    }).forEach(c => {
      const cat = c.categoria_id ? catMap[c.categoria_id] : null;
      const catNome = cat?.nome || "Sem Categoria";
      if (isCustoVariavel(catNome)) {
        custoVarPorCat[catNome] = (custoVarPorCat[catNome] || 0) + Number(c.valor);
      }
    });
    const topCustosVariaveis = Object.entries(custoVarPorCat)
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);

    const mesesAtingidos = monthly.filter(m => m.atingido && m.receita > 0).length;

    return {
      receitaTotal, custosVariaveis, custosFixos, margemContribuicao, margemContribuicaoPct,
      pontoEquilibrio, percentualAtingido, folga, monthly, topCustosFixos, topCustosVariaveis,
      mesesAtingidos,
    };
  }, [contasReceber, contasPagar, categorias, catMap, anoSel]);

  const chartData = calc.monthly.map(m => ({
    mes: m.mes,
    Receita: m.receita,
    "Ponto Equilíbrio": m.pe,
    "Custo Fixo": m.custoFixo,
    "Custo Variável": m.custoVariavel,
  }));

  const handleExportPdf = async () => {
    let empresa: any = null;
    if (user) {
      const { data } = await (supabase.from("empresa") as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      empresa = data;
    }

    exportPontoEquilibrioPdf(
      {
        receitaTotal: calc.receitaTotal,
        custosVariaveis: calc.custosVariaveis,
        custosFixos: calc.custosFixos,
        margemContribuicao: calc.margemContribuicao,
        margemContribuicaoPct: calc.margemContribuicaoPct,
        pontoEquilibrio: calc.pontoEquilibrio,
        faturamentoAtual: calc.receitaTotal,
        percentualAtingido: calc.percentualAtingido,
        folga: calc.folga,
        detalheMensal: calc.monthly.map(m => ({
          mes: m.mes,
          receita: m.receita,
          custoVariavel: m.custoVariavel,
          custoFixo: m.custoFixo,
          mc: m.mc,
          pe: m.pe,
          atingido: m.atingido,
        })),
        topCustosFixos: calc.topCustosFixos,
        topCustosVariaveis: calc.topCustosVariaveis,
      },
      anoSel,
      empresa,
    );
    toast({ title: "Relatório exportado com sucesso!" });
  };

  const cardAnim = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Ponto de Equilíbrio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análise do faturamento mínimo necessário para cobrir todos os custos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={String(anoSel)} onValueChange={v => setAnoSel(Number(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(a => (
                <SelectItem key={a} value={String(a)}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleExportPdf} className="bg-primary hover:bg-primary/90">
            <FileText className="mr-2 h-4 w-4" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        {calc.percentualAtingido >= 100 ? (
          <Badge className="bg-green-500/10 text-green-600 border-green-200 text-sm px-3 py-1">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Ponto de Equilíbrio Atingido — {fmtPct(calc.percentualAtingido)}
          </Badge>
        ) : calc.pontoEquilibrio > 0 ? (
          <Badge className="bg-red-500/10 text-red-600 border-red-200 text-sm px-3 py-1">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Abaixo do Ponto de Equilíbrio — falta {fmt(Math.abs(calc.folga))}
          </Badge>
        ) : (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200 text-sm px-3 py-1">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Sem dados suficientes para calcular
          </Badge>
        )}
        <Badge variant="outline" className="text-sm px-3 py-1">
          {calc.mesesAtingidos}/12 meses acima do PE
        </Badge>
      </div>

      {/* KPI Cards */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
      >
        {[
          { title: "Receita Total", value: fmt(calc.receitaTotal), icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
          { title: "Custos Fixos", value: fmt(calc.custosFixos), icon: DollarSign, color: "text-red-600", bg: "bg-red-50" },
          { title: "Custos Variáveis", value: fmt(calc.custosVariaveis), icon: TrendingDown, color: "text-orange-600", bg: "bg-orange-50" },
          { title: "Margem Contrib.", value: fmtPct(calc.margemContribuicaoPct), icon: Percent, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Ponto de Equilíbrio", value: fmt(calc.pontoEquilibrio), icon: Target, color: "text-purple-600", bg: "bg-purple-50" },
          { title: "Folga / Déficit", value: fmt(calc.folga), icon: calc.folga >= 0 ? ArrowUpRight : ArrowDownRight, color: calc.folga >= 0 ? "text-green-600" : "text-red-600", bg: calc.folga >= 0 ? "bg-green-50" : "bg-red-50" },
        ].map((kpi, i) => (
          <motion.div key={i} variants={cardAnim}>
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg ${kpi.bg}`}>
                    <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{kpi.title}</span>
                </div>
                <p className={`text-base font-bold ${kpi.color} truncate`}>{kpi.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receita vs PE */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receita vs Ponto de Equilíbrio</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="Receita" fill="hsl(var(--chart-income))" radius={[4, 4, 0, 0]} />
                <Line dataKey="Ponto Equilíbrio" stroke="hsl(var(--destructive))" strokeWidth={2} strokeDasharray="6 3" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Composição de Custos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Composição de Custos Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="Custo Fixo" stackId="a" fill="hsl(var(--chart-expense))" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Custo Variável" stackId="a" fill="hsl(var(--chart-balance))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detail tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Análise Mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Análise Mensal</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 px-2">Mês</th>
                  <th className="py-2 px-2 text-right">Receita</th>
                  <th className="py-2 px-2 text-right">Pt. Equilíbrio</th>
                  <th className="py-2 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {calc.monthly.map((m, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-2 px-2 font-medium">{m.mes}</td>
                    <td className="py-2 px-2 text-right">{fmt(m.receita)}</td>
                    <td className="py-2 px-2 text-right">{fmt(m.pe)}</td>
                    <td className="py-2 px-2 text-center">
                      {m.receita === 0 && m.pe === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : m.atingido ? (
                        <Badge className="bg-green-100 text-green-700 text-xs">Atingido</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 text-xs">Abaixo</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Top Custos Fixos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Custos Fixos por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {calc.topCustosFixos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum custo fixo registrado no período
              </p>
            ) : (
              <div className="space-y-3">
                {calc.topCustosFixos.map((c, i) => {
                  const pct = calc.custosFixos > 0 ? (c.valor / calc.custosFixos) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="truncate mr-2">{c.nome}</span>
                        <span className="font-medium whitespace-nowrap">{fmt(c.valor)}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Explicação */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-sm mb-2 text-foreground">Como funciona o cálculo?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground mb-1">1. Margem de Contribuição</p>
              <p>Receita Total − Custos Variáveis = Margem que sobra para cobrir os custos fixos.</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">2. Ponto de Equilíbrio</p>
              <p>Custos Fixos ÷ (Margem de Contribuição %) = Faturamento mínimo necessário.</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">3. Classificação Automática</p>
              <p>As categorias contendo "custo", "CMV", "CSP", "imposto" são classificadas como variáveis. As demais são fixas.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
