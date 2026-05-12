import { useMemo, useState } from "react";
import { useTableQuery, useTableMutation } from "@/hooks/useSupabaseQuery";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  CheckCircle2, Lock, Unlock, FileText, TrendingUp, TrendingDown,
  Wallet, AlertTriangle, ArrowDownCircle, ArrowUpCircle, Landmark, Download,
} from "lucide-react";
import { exportFechamentoPdf } from "@/lib/pdfFechamentoExport";
import { useTableQuery as useTableQueryGeneric } from "@/hooks/useSupabaseQuery";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const PIE_COLORS = [
  "hsl(var(--chart-income))", "hsl(var(--chart-expense))", "hsl(var(--chart-balance))",
  "hsl(var(--chart-services))", "hsl(var(--chart-non-op))", "hsl(var(--chart-transfers))",
  "hsl(35, 85%, 55%)", "hsl(280, 55%, 55%)",
];

export default function FechamentoMes() {
  const now = new Date();
  const [mesSel, setMesSel] = useState(now.getMonth() + 1);
  const [anoSel, setAnoSel] = useState(2026);
  const [obs, setObs] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);

  const { toast } = useToast();
  const { data: lancamentos = [] } = useTableQuery("lancamentos_caixa");
  const { data: contasReceber = [] } = useTableQuery("contas_receber");
  const { data: contasPagar = [] } = useTableQuery("contas_pagar");
  const { data: categorias = [] } = useTableQuery("categorias");
  const { data: bancos = [] } = useTableQuery("bancos_cartoes");
  const { data: fechamentos = [] } = useTableQuery("fechamentos_mensais" as any);
  const { data: empresaList = [] } = useTableQuery("empresa" as any);
  const { insert, update } = useTableMutation("fechamentos_mensais" as any);
  const empresa = (empresaList as any[])[0] || null;

  useRealtimeSubscription("lancamentos_caixa", [["lancamentos_caixa"]]);
  useRealtimeSubscription("contas_receber", [["contas_receber"]]);
  useRealtimeSubscription("contas_pagar", [["contas_pagar"]]);
  useRealtimeSubscription("bancos_cartoes", [["bancos_cartoes"]]);
  useRealtimeSubscription("fechamentos_mensais", [["fechamentos_mensais"]]);

  const fechamentoAtual = useMemo(() => {
    return (fechamentos as any[]).find(f => f.mes === mesSel && f.ano === anoSel);
  }, [fechamentos, mesSel, anoSel]);

  const isFechado = fechamentoAtual?.status === "fechado";

  const dados = useMemo(() => {
    const lc = (lancamentos as any[]).filter(l => {
      const d = new Date(l.data_lancamento + "T00:00:00");
      return d.getMonth() + 1 === mesSel && d.getFullYear() === anoSel;
    });
    const cr = (contasReceber as any[]).filter(c => {
      const d = new Date(c.data_vencimento + "T00:00:00");
      return d.getMonth() + 1 === mesSel && d.getFullYear() === anoSel;
    });
    const cp = (contasPagar as any[]).filter(c => {
      const d = new Date(c.data_vencimento + "T00:00:00");
      return d.getMonth() + 1 === mesSel && d.getFullYear() === anoSel;
    });

    const receita = lc.filter(l => l.tipo === "entrada").reduce((s, l) => s + Number(l.valor), 0);
    const despesa = lc.filter(l => l.tipo === "saida").reduce((s, l) => s + Number(l.valor), 0);

    const custosDiretos = lc.filter(l => {
      if (l.tipo !== "saida") return false;
      const cat = (categorias as any[]).find(c => c.id === l.categoria_id);
      const nome = (cat?.nome || "").toLowerCase();
      return nome.includes("custo") || nome.includes("cmv") || nome.includes("mercadoria") || nome.includes("produto") || nome.includes("matéria") || nome.includes("insumo");
    }).reduce((s, l) => s + Number(l.valor), 0);

    const despOp = despesa - custosDiretos;
    const lucroBruto = receita - custosDiretos;
    const lucroLiquido = receita - despesa;

    const crPendentes = cr.filter(c => c.status === "pendente").reduce((s, c) => s + Number(c.valor), 0);
    const cpPendentes = cp.filter(c => c.status === "pendente").reduce((s, c) => s + Number(c.valor), 0);
    const crRecebido = cr.filter(c => c.status === "recebido").reduce((s, c) => s + Number(c.valor), 0);
    const cpPago = cp.filter(c => c.status === "pago").reduce((s, c) => s + Number(c.valor), 0);
    const crVencidas = cr.filter(c => c.status === "vencido" || (c.status === "pendente" && c.data_vencimento < new Date().toISOString().split("T")[0])).length;
    const cpVencidas = cp.filter(c => c.status === "vencido" || (c.status === "pendente" && c.data_vencimento < new Date().toISOString().split("T")[0])).length;

    // Saldo bancário (apenas contas correntes, sem cartões)
    const saldoInicial = (bancos as any[]).filter(b => b.ativo && b.tipo === "banco").reduce((s, b) => s + Number(b.saldo_inicial || 0), 0);
    const allLcBefore = (lancamentos as any[]).filter(l => {
      const d = new Date(l.data_lancamento + "T00:00:00");
      return d < new Date(anoSel, mesSel - 1, 1);
    });
    const entBefore = allLcBefore.filter(l => l.tipo === "entrada").reduce((s, l) => s + Number(l.valor), 0);
    const saiBefore = allLcBefore.filter(l => l.tipo === "saida").reduce((s, l) => s + Number(l.valor), 0);
    const saldoInicioMes = saldoInicial + entBefore - saiBefore;
    const saldoFimMes = saldoInicioMes + receita - despesa;

    // Despesas por categoria
    const despCat: Record<string, number> = {};
    lc.filter(l => l.tipo === "saida").forEach(l => {
      const cat = (categorias as any[]).find(c => c.id === l.categoria_id);
      const nome = cat?.nome || "Outros";
      despCat[nome] = (despCat[nome] || 0) + Number(l.valor);
    });
    const pieData = Object.entries(despCat).map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

    // Comparativo últimos 3 meses
    const comparativo = [];
    for (let i = 2; i >= 0; i--) {
      let m = mesSel - i;
      let a = anoSel;
      if (m <= 0) { m += 12; a--; }
      const lcM = (lancamentos as any[]).filter(l => {
        const d = new Date(l.data_lancamento + "T00:00:00");
        return d.getMonth() + 1 === m && d.getFullYear() === a;
      });
      const ent = lcM.filter(l => l.tipo === "entrada").reduce((s, l) => s + Number(l.valor), 0);
      const sai = lcM.filter(l => l.tipo === "saida").reduce((s, l) => s + Number(l.valor), 0);
      comparativo.push({ mes: meses[m - 1]?.substring(0, 3), receitas: ent, despesas: sai, resultado: ent - sai });
    }

    return {
      receita, despesa, custosDiretos, despOp, lucroBruto, lucroLiquido,
      crPendentes, cpPendentes, crRecebido, cpPago, crVencidas, cpVencidas,
      saldoInicioMes, saldoFimMes, pieData, comparativo,
      totalContas: cr.length + cp.length,
      contasRecebidas: cr.filter(c => c.status === "recebido").length,
      contasPagas: cp.filter(c => c.status === "pago").length,
    };
  }, [lancamentos, contasReceber, contasPagar, categorias, bancos, mesSel, anoSel]);

  const handleFechar = async () => {
    const payload = {
      mes: mesSel,
      ano: anoSel,
      receita_total: dados.receita,
      despesa_total: dados.despesa,
      custos_diretos: dados.custosDiretos,
      despesas_operacionais: dados.despOp,
      lucro_bruto: dados.lucroBruto,
      lucro_liquido: dados.lucroLiquido,
      saldo_inicial: dados.saldoInicioMes,
      saldo_final: dados.saldoFimMes,
      contas_receber_pendentes: dados.crPendentes,
      contas_pagar_pendentes: dados.cpPendentes,
      observacoes: obs || null,
      status: "fechado",
      fechado_em: new Date().toISOString(),
    };

    if (fechamentoAtual) {
      await update.mutateAsync({ id: fechamentoAtual.id, ...payload });
    } else {
      await insert.mutateAsync(payload);
    }
    setConfirmOpen(false);
    toast({ title: `Mês ${meses[mesSel - 1]}/${anoSel} fechado com sucesso!` });
  };

  const handleReabrir = async () => {
    if (!fechamentoAtual) return;
    await update.mutateAsync({ id: fechamentoAtual.id, status: "reaberto", fechado_em: null });
    setReopenOpen(false);
    toast({ title: `Mês ${meses[mesSel - 1]}/${anoSel} reaberto.` });
  };

  const alertas = useMemo(() => {
    const list: string[] = [];
    if (dados.crPendentes > 0) list.push(`${fmt(dados.crPendentes)} em contas a receber pendentes`);
    if (dados.cpPendentes > 0) list.push(`${fmt(dados.cpPendentes)} em contas a pagar pendentes`);
    if (dados.crVencidas > 0) list.push(`${dados.crVencidas} conta(s) a receber vencida(s)`);
    if (dados.cpVencidas > 0) list.push(`${dados.cpVencidas} conta(s) a pagar vencida(s)`);
    if (dados.lucroLiquido < 0) list.push("Resultado líquido negativo no período");
    return list;
  }, [dados]);

  const kpis = [
    { label: "Saldo Início", value: fmt(dados.saldoInicioMes), icon: Landmark, gradient: "var(--gradient-primary)" },
    { label: "Saldo Fim", value: fmt(dados.saldoFimMes), icon: Wallet, gradient: "var(--gradient-primary)" },
    { label: "Receita Total", value: fmt(dados.receita), icon: ArrowDownCircle, gradient: "var(--gradient-accent)" },
    { label: "Despesa Total", value: fmt(dados.despesa), icon: ArrowUpCircle, gradient: "var(--gradient-danger)" },
    { label: "Lucro Bruto", value: fmt(dados.lucroBruto), icon: TrendingUp, gradient: "var(--gradient-primary)", desc: `Margem: ${dados.receita > 0 ? ((dados.lucroBruto / dados.receita) * 100).toFixed(1) : "0.0"}%` },
    { label: "Lucro Líquido", value: fmt(dados.lucroLiquido), icon: dados.lucroLiquido >= 0 ? TrendingUp : TrendingDown, gradient: dados.lucroLiquido >= 0 ? "var(--gradient-primary)" : "var(--gradient-danger)", desc: `Margem: ${dados.receita > 0 ? ((dados.lucroLiquido / dados.receita) * 100).toFixed(1) : "0.0"}%` },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Fechamento de Mês</h1>
          <p className="text-sm text-muted-foreground">Consolide e feche o período contábil</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={String(mesSel)} onValueChange={v => setMesSel(Number(v))}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {meses.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(anoSel)} onValueChange={v => setAnoSel(Number(v))}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 2050 - 2024 + 1 }, (_, i) => 2024 + i).map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button
            className="gap-2"
            onClick={() => exportFechamentoPdf(dados, mesSel, anoSel, empresa, fechamentoAtual?.status || null, obs || fechamentoAtual?.observacoes || null)}
          >
            <Download className="h-4 w-4" /> Relatório PDF
          </Button>
          {isFechado ? (
            <Badge variant="default" className="gap-1 bg-accent text-accent-foreground">
              <Lock className="h-3 w-3" /> Fechado
            </Badge>
          ) : fechamentoAtual?.status === "reaberto" ? (
            <Badge variant="outline" className="gap-1 text-amber-600 border-amber-400">
              <Unlock className="h-3 w-3" /> Reaberto
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <FileText className="h-3 w-3" /> Aberto
            </Badge>
          )}
        </div>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Atenção antes de fechar</p>
                <ul className="text-xs text-amber-700 dark:text-amber-400 mt-1 space-y-0.5">
                  {alertas.map((a, i) => <li key={i}>• {a}</li>)}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="hover:shadow-[var(--shadow-elevated)] transition-shadow h-full">
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0 flex-1 overflow-hidden">
                    <p className="text-xs text-muted-foreground truncate">{kpi.label}</p>
                    <p className="text-xs font-bold font-display leading-tight truncate">{kpi.value}</p>
                    {kpi.desc && <p className="text-[10px] text-muted-foreground truncate">{kpi.desc}</p>}
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: kpi.gradient }}>
                    <kpi.icon className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comparativo trimestral */}
        <Card>
          <CardHeader><CardTitle className="text-lg font-display">Comparativo Trimestral</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dados.comparativo}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="receitas" name="Receitas" fill="hsl(var(--chart-income))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--chart-expense))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resultado" name="Resultado" fill="hsl(var(--chart-balance))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Despesas por categoria */}
        <Card>
          <CardHeader><CardTitle className="text-lg font-display">Despesas por Categoria</CardTitle></CardHeader>
          <CardContent>
            {dados.pieData.length === 0 ? (
              <p className="text-center text-muted-foreground py-16">Sem despesas no período</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(280, dados.pieData.length * 40)}>
                <BarChart data={dados.pieData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v: number) => fmt(v)} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12, textAnchor: "end" }} interval={0} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {dados.pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Resumo do período */}
        <Card>
          <CardHeader><CardTitle className="text-lg font-display">Resumo do Período</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Custos Diretos (CMV)</span>
              <span className="font-bold text-destructive">{fmt(dados.custosDiretos)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Despesas Operacionais</span>
              <span className="font-bold text-destructive">{fmt(dados.despOp)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Contas Recebidas</span>
              <span className="font-bold">{dados.contasRecebidas} — {fmt(dados.crRecebido)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Contas Pagas</span>
              <span className="font-bold">{dados.contasPagas} — {fmt(dados.cpPago)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-accent/10">
              <span className="text-sm font-medium">Pendências a Receber</span>
              <span className="font-bold text-accent">{fmt(dados.crPendentes)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-destructive/10">
              <span className="text-sm font-medium">Pendências a Pagar</span>
              <span className="font-bold text-destructive">{fmt(dados.cpPendentes)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Ações de fechamento */}
        <Card>
          <CardHeader><CardTitle className="text-lg font-display">Ação de Fechamento</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Observações sobre o fechamento deste mês..."
              value={obs}
              onChange={e => setObs(e.target.value)}
              rows={4}
              disabled={isFechado}
            />

            {fechamentoAtual?.fechado_em && (
              <p className="text-xs text-muted-foreground">
                Fechado em: {new Date(fechamentoAtual.fechado_em).toLocaleString("pt-BR")}
              </p>
            )}

            <div className="flex gap-3">
              {!isFechado ? (
                <Button className="flex-1 gap-2" onClick={() => setConfirmOpen(true)}>
                  <Lock className="h-4 w-4" /> Fechar Mês
                </Button>
              ) : (
                <Button variant="outline" className="flex-1 gap-2" onClick={() => setReopenOpen(true)}>
                  <Unlock className="h-4 w-4" /> Reabrir Mês
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico */}
      <Card>
        <CardHeader><CardTitle className="text-lg font-display">Histórico de Fechamentos</CardTitle></CardHeader>
        <CardContent>
          {(fechamentos as any[]).filter(f => f.status === "fechado").length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum mês fechado ainda</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(fechamentos as any[])
                .filter(f => f.status === "fechado")
                .sort((a, b) => b.ano * 100 + b.mes - (a.ano * 100 + a.mes))
                .map(f => (
                  <div key={f.id} className="p-3 rounded-lg border bg-card space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{meses[f.mes - 1]} {f.ano}</span>
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>Receita: {fmt(Number(f.receita_total))}</p>
                      <p>Despesa: {fmt(Number(f.despesa_total))}</p>
                      <p className={Number(f.lucro_liquido) >= 0 ? "text-accent font-medium" : "text-destructive font-medium"}>
                        Resultado: {fmt(Number(f.lucro_liquido))}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog confirmar fechamento */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Fechamento</DialogTitle>
            <DialogDescription>
              Deseja fechar o mês de <strong>{meses[mesSel - 1]}/{anoSel}</strong>?
              Os valores serão registrados como referência. Você poderá reabrir se necessário.
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm space-y-1 py-2">
            <p>Receita: <strong>{fmt(dados.receita)}</strong></p>
            <p>Despesa: <strong>{fmt(dados.despesa)}</strong></p>
            <p>Resultado: <strong className={dados.lucroLiquido >= 0 ? "text-accent" : "text-destructive"}>{fmt(dados.lucroLiquido)}</strong></p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button onClick={handleFechar} className="gap-2" disabled={insert.isPending || update.isPending}>
              <Lock className="h-4 w-4" /> Confirmar Fechamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog reabrir */}
      <Dialog open={reopenOpen} onOpenChange={setReopenOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reabrir Mês</DialogTitle>
            <DialogDescription>
              Deseja reabrir o mês de <strong>{meses[mesSel - 1]}/{anoSel}</strong>?
              Isso permitirá novos lançamentos e ajustes no período.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReopenOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReabrir} className="gap-2" disabled={update.isPending}>
              <Unlock className="h-4 w-4" /> Reabrir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
