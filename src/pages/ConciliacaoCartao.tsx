import { useTableQuery } from "@/hooks/useSupabaseQuery";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, CheckCircle2, XCircle, ArrowUpCircle, ArrowDownCircle, FileSpreadsheet, GitCompare } from "lucide-react";
import ConciliacaoCartaoTab from "@/components/conciliacao/ConciliacaoCartao";
import ImportCSVCartao from "@/components/conciliacao/ImportCSVCartao";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ConciliacaoCartaoPage() {
  const { data: bancos = [] } = useTableQuery("bancos_cartoes");
  const { data: extrato = [] } = useTableQuery("extrato_bancario");

  useRealtimeSubscription("extrato_bancario", [["extrato_bancario"]]);
  useRealtimeSubscription("bancos_cartoes", [["bancos_cartoes"]]);

  const cartoes = useMemo(() =>
    (bancos as any[]).filter((b: any) => b.ativo && (b.tipo === "cartao_credito" || b.tipo === "cartao_debito")),
    [bancos]
  );

  const cartoesIds = useMemo(() => new Set(cartoes.map((c: any) => c.id)), [cartoes]);

  const stats = useMemo(() => {
    const items = (extrato as any[]).filter(i => cartoesIds.has(i.banco_cartao_id));
    const conciliados = items.filter(i => i.conciliado);
    const pendentes = items.filter(i => !i.conciliado);
    const saidas = items.filter(i => i.tipo === "saida").reduce((s, i) => s + Number(i.valor), 0);
    const entradas = items.filter(i => i.tipo === "entrada").reduce((s, i) => s + Number(i.valor), 0);
    return { total: items.length, conciliados: conciliados.length, pendentes: pendentes.length, saidas, entradas };
  }, [extrato, cartoesIds]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Conciliação de Cartões</h1>
        <p className="text-sm text-muted-foreground">Gerencie e concilie transações de cartões de crédito e débito</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2">
            <ArrowUpCircle className="h-4 w-4 text-red-600" />
            <div><p className="text-[10px] text-muted-foreground">Gastos no Cartão</p><p className="text-sm font-bold">{fmt(stats.saidas)}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2">
            <ArrowDownCircle className="h-4 w-4 text-green-600" />
            <div><p className="text-[10px] text-muted-foreground">Estornos / Entradas</p><p className="text-sm font-bold">{fmt(stats.entradas)}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <div><p className="text-[10px] text-muted-foreground">Conciliados</p><p className="text-sm font-bold">{stats.conciliados}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-yellow-500" />
            <div><p className="text-[10px] text-muted-foreground">Pendentes</p><p className="text-sm font-bold">{stats.pendentes}</p></div>
          </div>
        </CardContent></Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="importar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="importar" className="gap-2"><FileSpreadsheet className="h-4 w-4" /> Importar CSV/Excel</TabsTrigger>
          <TabsTrigger value="conciliar" className="gap-2"><GitCompare className="h-4 w-4" /> Conciliar</TabsTrigger>
        </TabsList>

        <TabsContent value="importar">
          <ImportCSVCartao bancos={bancos as any[]} />
        </TabsContent>

        <TabsContent value="conciliar">
          <ConciliacaoCartaoTab bancos={bancos as any[]} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
