import { useMemo } from "react";
import { useTableQuery } from "@/hooks/useSupabaseQuery";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Wallet, AlertTriangle,
  ArrowDownCircle, ArrowUpCircle, BarChart3, Percent, Landmark,
  Clock, AlertCircle, Bell, CreditCard,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, ComposedChart, Line,
} from "recharts";
import { useNavigate } from "react-router-dom";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};
const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const PIE_COLORS = [
  "hsl(var(--chart-income))", "hsl(var(--chart-expense))", "hsl(var(--chart-balance))",
  "hsl(var(--chart-services))", "hsl(var(--chart-non-op))", "hsl(var(--chart-transfers))",
  "hsl(35, 85%, 55%)", "hsl(280, 55%, 55%)",
];

const DIAS_ALERTA = 3;

export default function Dashboard() {
  const { data: contasReceber = [] } = useTableQuery("contas_receber");
  const { data: contasPagar = [] } = useTableQuery("contas_pagar");
  const { data: lancamentos = [] } = useTableQuery("lancamentos_caixa");
  const { data: categorias = [] } = useTableQuery("categorias");
  const { data: clientes = [] } = useTableQuery("clientes");
  const { data: fornecedores = [] } = useTableQuery("fornecedores");
  const { data: bancos = [] } = useTableQuery("bancos_cartoes");
  const { data: extrato = [] } = useTableQuery("extrato_bancario");
  const { data: transferencias = [] } = useTableQuery("transferencias_contas" as any);
  const navigate = useNavigate();

  useRealtimeSubscription("contas_pagar", [["contas_pagar"]]);
  useRealtimeSubscription("contas_receber", [["contas_receber"]]);
  useRealtimeSubscription("lancamentos_caixa", [["lancamentos_caixa"]]);
  useRealtimeSubscription("categorias", [["categorias"]]);
  useRealtimeSubscription("bancos_cartoes", [["bancos_cartoes"]]);
  useRealtimeSubscription("extrato_bancario", [["extrato_bancario"]]);
  useRealtimeSubscription("transferencias_contas", [["transferencias_contas", "bancos_cartoes"]]);

  const stats = useMemo(() => {
    const cr = contasReceber as any[];
    const cp = contasPagar as any[];
    const lc = lancamentos as any[];
    const bc = bancos as any[];
    const ext = extrato as any[];
    const transf = transferencias as any[];

    const totalReceber = cr.filter((c) => c.status === "pendente").reduce((s, c) => s + Number(c.valor), 0);
    const totalPagar = cp.filter((c) => c.status === "pendente").reduce((s, c) => s + Number(c.valor), 0);
    const totalRecebido = cr.filter((c) => c.status === "recebido").reduce((s, c) => s + Number(c.valor), 0);
    const totalPago = cp.filter((c) => c.status === "pago").reduce((s, c) => s + Number(c.valor), 0);
    const saldo = totalRecebido - totalPago;

    // Separate banks from cards
    const contasBancarias = bc.filter(b => b.ativo && b.tipo === "banco");
    const cartoesCredito = bc.filter(b => b.ativo && b.tipo === "cartao_credito");
    const cartoesDebito = bc.filter(b => b.ativo && b.tipo === "cartao_debito");

    const totalEntradas = lc.filter(l => l.tipo === "entrada").reduce((s, l) => s + Number(l.valor), 0);
    const totalSaidas = lc.filter(l => l.tipo === "saida").reduce((s, l) => s + Number(l.valor), 0);

    // Per-account balances (saldo_inicial + extrato entradas - extrato saidas + transfers in - transfers out)
    const saldosPorConta = contasBancarias.map(conta => {
      const saldoInicial = Number(conta.saldo_inicial || 0);
      const entradasExtrato = ext
        .filter(e => e.banco_cartao_id === conta.id && e.tipo === "entrada")
        .reduce((s, e) => s + Number(e.valor), 0);
      const saidasExtrato = ext
        .filter(e => e.banco_cartao_id === conta.id && e.tipo === "saida")
        .reduce((s, e) => s + Math.abs(Number(e.valor)), 0);
      const transferenciasEntrada = transf
        .filter(t => t.conta_destino_id === conta.id)
        .reduce((s, t) => s + Number(t.valor), 0);
      const transferenciasSaida = transf
        .filter(t => t.conta_origem_id === conta.id)
        .reduce((s, t) => s + Number(t.valor), 0);
      const saldo = saldoInicial + entradasExtrato - saidasExtrato + transferenciasEntrada - transferenciasSaida;
      return { id: conta.id, nome: conta.nome, saldo, banco: conta.banco };
    });

    // Global bank balance = sum of all individual account balances (consistent source)
    const saldoBancario = saldosPorConta.reduce((s, c) => s + c.saldo, 0);

    // Card limits and usage
    const limiteCartaoCredito = cartoesCredito.reduce((s, c) => s + Number(c.limite || 0), 0);
    const cartaoCreditoIds = new Set(cartoesCredito.map(c => c.id));
    const gastoCartaoNaoConciliado = ext
      .filter(e => cartaoCreditoIds.has(e.banco_cartao_id) && !e.conciliado)
      .reduce((s, e) => s + Math.abs(Number(e.valor)), 0);
    const limiteDisponivelCartao = limiteCartaoCredito - gastoCartaoNaoConciliado;
    const limiteCartaoDebito = cartoesDebito.reduce((s, c) => s + Number(c.saldo_inicial || 0), 0);

    const custosDiretos = lc.filter(l => {
      if (l.tipo !== "saida") return false;
      const cat = (categorias as any[]).find(c => c.id === l.categoria_id);
      const nome = (cat?.nome || "").toLowerCase();
      return nome.includes("custo") || nome.includes("cmv") || nome.includes("mercadoria") || nome.includes("produto") || nome.includes("matéria") || nome.includes("insumo");
    }).reduce((s, l) => s + Number(l.valor), 0);
    const lucroBruto = totalEntradas - custosDiretos;
    const margemBruta = totalEntradas > 0 ? (lucroBruto / totalEntradas) * 100 : 0;

    const margemContribuicao = totalEntradas - custosDiretos;
    const margemContribuicaoPct = totalEntradas > 0 ? (margemContribuicao / totalEntradas) * 100 : 0;

    const despesasOperacionais = totalSaidas - custosDiretos;
    const lucroLiquido = totalEntradas - totalSaidas;
    const margemLiquida = totalEntradas > 0 ? (lucroLiquido / totalEntradas) * 100 : 0;

    const hoje = new Date().toISOString().split("T")[0];
    const limiteAlerta = new Date();
    limiteAlerta.setDate(limiteAlerta.getDate() + DIAS_ALERTA);
    const limiteStr = limiteAlerta.toISOString().split("T")[0];

    const vencidasReceber = cr.filter((c) => (c.status === "vencido") || (c.status === "pendente" && c.data_vencimento < hoje));
    const vencidasPagar = cp.filter((c) => (c.status === "vencido") || (c.status === "pendente" && c.data_vencimento < hoje));
    const vencidas = vencidasReceber.length + vencidasPagar.length;
    const totalVencidasValor = vencidasReceber.reduce((s, c) => s + Number(c.valor), 0) + vencidasPagar.reduce((s, c) => s + Number(c.valor), 0);

    const proximasReceber = cr.filter((c) => c.status === "pendente" && c.data_vencimento >= hoje && c.data_vencimento <= limiteStr);
    const proximasPagar = cp.filter((c) => c.status === "pendente" && c.data_vencimento >= hoje && c.data_vencimento <= limiteStr);

    // Monthly data - realized (lancamentos) + projected (pending contas)
    const monthly: Record<string, { entradasRealizadas: number; saidasRealizadas: number; entradasPrevistas: number; saidasPrevistas: number }> = {};
    meses.forEach((m) => { monthly[m] = { entradasRealizadas: 0, saidasRealizadas: 0, entradasPrevistas: 0, saidasPrevistas: 0 }; });
    
    // Realized from lancamentos_caixa
    lc.forEach((l) => {
      const month = new Date(l.data_lancamento + "T00:00:00").getMonth();
      if (l.tipo === "entrada") monthly[meses[month]].entradasRealizadas += Number(l.valor);
      else monthly[meses[month]].saidasRealizadas += Number(l.valor);
    });
    
    // Projected from pending contas a receber
    cr.filter(c => c.status === "pendente" || c.status === "vencido").forEach((c) => {
      const month = new Date(c.data_vencimento + "T00:00:00").getMonth();
      monthly[meses[month]].entradasPrevistas += Number(c.valor);
    });
    
    // Projected from pending contas a pagar
    cp.filter(c => c.status === "pendente" || c.status === "vencido").forEach((c) => {
      const month = new Date(c.data_vencimento + "T00:00:00").getMonth();
      monthly[meses[month]].saidasPrevistas += Number(c.valor);
    });

    let acum = saldoBancario;
    const chartData = meses.map((m) => {
      const d = monthly[m];
      acum += (d.entradasRealizadas + d.entradasPrevistas) - (d.saidasRealizadas + d.saidasPrevistas);
      return { mes: m, ...d, saldo: acum };
    });

    const despCat: Record<string, number> = {};
    lc.filter((l) => l.tipo === "saida").forEach((l) => {
      const cat = (categorias as any[]).find((c) => c.id === l.categoria_id);
      const nome = cat?.nome || "Outros";
      despCat[nome] = (despCat[nome] || 0) + Number(l.valor);
    });
    const pieData = Object.entries(despCat).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    return {
      totalReceber, totalPagar, totalRecebido, totalPago, saldo, saldoBancario,
      limiteCartaoCredito, limiteDisponivelCartao, limiteCartaoDebito, gastoCartaoNaoConciliado,
      contasBancarias, cartoesCredito, cartoesDebito, saldosPorConta,
      vencidas, totalVencidasValor, chartData, pieData,
      lucroBruto, margemBruta, lucroLiquido, margemLiquida,
      margemContribuicao, margemContribuicaoPct,
      totalEntradas, despesasOperacionais, custosDiretos,
      vencidasReceber, vencidasPagar, proximasReceber, proximasPagar,
    };
  }, [contasReceber, contasPagar, lancamentos, categorias, bancos, extrato, transferencias]);

  const totalAlertas = stats.vencidasReceber.length + stats.vencidasPagar.length + stats.proximasReceber.length + stats.proximasPagar.length;

  const kpis = [
    { label: "Saldo Conta Corrente", value: fmt(stats.saldoBancario), icon: Landmark, gradient: "var(--gradient-primary)", desc: `${stats.contasBancarias.length} conta(s) bancária(s)` },
    { label: "Limite Cartão Crédito", value: fmt(stats.limiteDisponivelCartao), icon: CreditCard, gradient: stats.limiteDisponivelCartao < stats.limiteCartaoCredito * 0.2 ? "var(--gradient-danger)" : "var(--gradient-accent)", desc: stats.gastoCartaoNaoConciliado > 0 ? `Fatura aberta: ${fmt(stats.gastoCartaoNaoConciliado)}` : `${stats.cartoesCredito.length} cartão(ões)` },
    { label: "A Receber", value: fmt(stats.totalReceber), icon: ArrowDownCircle, gradient: "var(--gradient-accent)", desc: "Pendente de recebimento" },
    { label: "A Pagar", value: fmt(stats.totalPagar), icon: ArrowUpCircle, gradient: "var(--gradient-danger)", desc: "Pendente de pagamento" },
    { label: "Saldo Realizado", value: fmt(stats.saldo), icon: Wallet, gradient: "var(--gradient-primary)", desc: "Entradas - Saídas efetivadas" },
    { label: "Contas Vencidas", value: `${stats.vencidas} (${fmt(stats.totalVencidasValor)})`, icon: AlertTriangle, gradient: "var(--gradient-warm)", desc: "Requerem atenção" },
    { label: "Margem Contribuição", value: `${fmt(stats.margemContribuicao)}`, icon: Percent, gradient: stats.margemContribuicaoPct >= 50 ? "var(--gradient-accent)" : "var(--gradient-warm)", desc: `MC: ${stats.margemContribuicaoPct.toFixed(1)}% da receita` },
    { label: "Lucro Bruto", value: `${fmt(stats.lucroBruto)}`, icon: TrendingUp, gradient: "var(--gradient-accent)", desc: `Margem: ${stats.margemBruta.toFixed(1)}%` },
    { label: "Lucro Líquido", value: `${fmt(stats.lucroLiquido)}`, icon: stats.lucroLiquido >= 0 ? TrendingUp : TrendingDown, gradient: stats.lucroLiquido >= 0 ? "var(--gradient-primary)" : "var(--gradient-danger)", desc: `Margem: ${stats.margemLiquida.toFixed(1)}%` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral financeira</p>
      </div>

      {/* Alertas de Vencimento */}
      {totalAlertas > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Bell className="h-5 w-5 text-destructive" />
                Alertas de Vencimento
                <Badge variant="destructive" className="ml-2">{totalAlertas}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Contas Vencidas */}
              {(stats.vencidasPagar.length > 0 || stats.vencidasReceber.length > 0) && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" /> Contas Vencidas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {stats.vencidasPagar.map((c: any) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20 cursor-pointer hover:bg-destructive/15 transition-colors"
                        onClick={() => navigate("/contas-pagar")}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive" className="text-[10px] shrink-0">PAGAR</Badge>
                            <span className="text-sm font-medium truncate">{c.descricao}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">Venceu em {fmtDate(c.data_vencimento)}</p>
                        </div>
                        <span className="text-sm font-bold text-destructive shrink-0 ml-2">{fmt(Number(c.valor))}</span>
                      </div>
                    ))}
                    {stats.vencidasReceber.map((c: any) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20 cursor-pointer hover:bg-destructive/15 transition-colors"
                        onClick={() => navigate("/contas-receber")}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] shrink-0 border-orange-500 text-orange-600">RECEBER</Badge>
                            <span className="text-sm font-medium truncate">{c.descricao}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">Venceu em {fmtDate(c.data_vencimento)}</p>
                        </div>
                        <span className="text-sm font-bold text-orange-600 shrink-0 ml-2">{fmt(Number(c.valor))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contas Próximas ao Vencimento */}
              {(stats.proximasPagar.length > 0 || stats.proximasReceber.length > 0) && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-amber-600">
                    <Clock className="h-4 w-4" /> Vencendo nos Próximos {DIAS_ALERTA} Dias
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {stats.proximasPagar.map((c: any) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 cursor-pointer hover:bg-amber-500/15 transition-colors"
                        onClick={() => navigate("/contas-pagar")}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className="text-[10px] shrink-0 bg-amber-500 hover:bg-amber-600">PAGAR</Badge>
                            <span className="text-sm font-medium truncate">{c.descricao}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">Vence em {fmtDate(c.data_vencimento)}</p>
                        </div>
                        <span className="text-sm font-bold text-amber-600 shrink-0 ml-2">{fmt(Number(c.valor))}</span>
                      </div>
                    ))}
                    {stats.proximasReceber.map((c: any) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 cursor-pointer hover:bg-amber-500/15 transition-colors"
                        onClick={() => navigate("/contas-receber")}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className="text-[10px] shrink-0 bg-blue-500 hover:bg-blue-600">RECEBER</Badge>
                            <span className="text-sm font-medium truncate">{c.descricao}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">Vence em {fmtDate(c.data_vencimento)}</p>
                        </div>
                        <span className="text-sm font-bold text-blue-600 shrink-0 ml-2">{fmt(Number(c.valor))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Saldos por Conta Corrente */}
      {stats.saldosPorConta.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
            <Landmark className="h-4 w-4" /> Saldo por Conta Corrente
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {stats.saldosPorConta.map((conta, i) => (
              <motion.div
                key={conta.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className="hover:shadow-[var(--shadow-elevated)] transition-shadow h-full">
                  <CardContent className="pt-3 pb-3 px-3 h-full">
                    <div className="flex items-start justify-between gap-1.5 h-full">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <p className="text-[11px] text-muted-foreground leading-tight truncate">{conta.nome}</p>
                        <p className={`text-sm font-bold font-display truncate ${conta.saldo >= 0 ? "text-accent" : "text-destructive"}`} title={fmt(conta.saldo)}>
                          {fmt(conta.saldo)}
                        </p>
                        {conta.banco && <p className="text-[10px] text-muted-foreground leading-tight truncate">{conta.banco}</p>}
                      </div>
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: conta.saldo >= 0 ? "var(--gradient-primary)" : "var(--gradient-danger)" }}>
                        <Landmark className="h-3.5 w-3.5 text-primary-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="hover:shadow-[var(--shadow-elevated)] transition-shadow h-full">
              <CardContent className="pt-3 pb-3 px-3 h-full">
                <div className="flex items-start justify-between gap-1.5 h-full">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <p className="text-[11px] text-muted-foreground leading-tight truncate">{kpi.label}</p>
                    <p className="text-sm font-bold font-display truncate" title={kpi.value}>{kpi.value}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight truncate" title={kpi.desc}>{kpi.desc}</p>
                  </div>
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: kpi.gradient }}>
                    <kpi.icon className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fluxo Mensal */}
        <Card>
          <CardHeader><CardTitle className="text-lg font-display">Entradas vs Saídas</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="entradasRealizadas" name="Recebido" fill="hsl(var(--chart-income))" radius={[4, 4, 0, 0]} stackId="e" />
                <Bar dataKey="entradasPrevistas" name="A Receber" fill="hsl(160, 60%, 72%)" radius={[4, 4, 0, 0]} stackId="e" />
                <Bar dataKey="saidasRealizadas" name="Pago" fill="hsl(var(--chart-expense))" radius={[4, 4, 0, 0]} stackId="s" />
                <Bar dataKey="saidasPrevistas" name="A Pagar" fill="hsl(0, 72%, 78%)" radius={[4, 4, 0, 0]} stackId="s" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Saldo Acumulado */}
        <Card>
          <CardHeader><CardTitle className="text-lg font-display">Saldo Acumulado</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={340}>
              <ComposedChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="entradasRealizadas" name="Recebido" fill="hsl(160, 60%, 42%)" radius={[4, 4, 0, 0]} stackId="entradas" />
                <Bar dataKey="entradasPrevistas" name="A Receber" fill="hsl(160, 60%, 72%)" radius={[4, 4, 0, 0]} stackId="entradas" />
                <Bar dataKey="saidasRealizadas" name="Pago" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} stackId="saidas" />
                <Bar dataKey="saidasPrevistas" name="A Pagar" fill="hsl(0, 72%, 78%)" radius={[4, 4, 0, 0]} stackId="saidas" />
                <Line type="monotone" dataKey="saldo" name="Saldo Acumulado" stroke="hsl(var(--chart-balance))" strokeWidth={2} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Despesas por Categoria - Barras */}
        <Card>
          <CardHeader><CardTitle className="text-lg font-display">Despesas por Categoria</CardTitle></CardHeader>
          <CardContent>
            {stats.pieData.length === 0 ? (
              <p className="text-center text-muted-foreground py-16">Sem dados de despesas</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(300, stats.pieData.length * 40)}>
                <BarChart data={stats.pieData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tickFormatter={(v: number) => fmt(v)} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12, textAnchor: "end" }} interval={0} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="value" name="Despesa" radius={[0, 4, 4, 0]}>
                    {stats.pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader><CardTitle className="text-lg font-display">Resumo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Clientes cadastrados</span>
              <span className="font-bold">{(clientes as any[]).length}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Fornecedores cadastrados</span>
              <span className="font-bold">{(fornecedores as any[]).length}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Categorias</span>
              <span className="font-bold">{(categorias as any[]).length}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-accent/10">
              <span className="text-sm font-medium text-accent">Total Recebido</span>
              <span className="font-bold text-accent">{fmt(stats.totalRecebido)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-destructive/10">
              <span className="text-sm font-medium text-destructive">Total Pago</span>
              <span className="font-bold text-destructive">{fmt(stats.totalPago)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
