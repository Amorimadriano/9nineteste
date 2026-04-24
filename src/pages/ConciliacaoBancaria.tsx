import { useTableQuery } from "@/hooks/useSupabaseQuery";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Brain, Sparkles } from "lucide-react";
import ImportOFX from "@/components/conciliacao/ImportOFX";
import SugestoesConciliacao from "@/components/conciliacao/SugestoesConciliacao";
import { useConciliacaoInteligente } from "@/hooks/useConciliacaoInteligente";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ConciliacaoBancaria() {
  const { data: bancos = [] } = useTableQuery("bancos_cartoes");
  const { data: extrato = [] } = useTableQuery("extrato_bancario");
  const { data: lancamentos = [] } = useTableQuery("lancamentos_caixa");
  const { data: contasReceber = [] } = useTableQuery("contas_receber");
  const { data: contasPagar = [] } = useTableQuery("contas_pagar");

  useRealtimeSubscription("extrato_bancario", [["extrato_bancario"]]);
  useRealtimeSubscription("bancos_cartoes", [["bancos_cartoes"]]);

  // Filter only bank-type items for stats (not cards)
  const bancosAtivos = useMemo(() =>
    (bancos as any[]).filter(b => b.ativo && b.tipo === "banco"),
    [bancos]
  );
  const bancosIds = useMemo(() => new Set(bancosAtivos.map(b => b.id)), [bancosAtivos]);

  // Extrato apenas de bancos (não cartões)
  const extratoBancos = useMemo(() =>
    (extrato as any[]).filter(i => bancosIds.has(i.banco_cartao_id)),
    [extrato, bancosIds]
  );

  // Hook de conciliação inteligente
  const {
    sugestoes,
    stats: statsIA,
    conciliarAutomatico,
    conciliarEmLote,
    recusarSugestao,
    isLoading,
    progresso,
  } = useConciliacaoInteligente(
    extratoBancos,
    lancamentos as any[],
    contasReceber as any[],
    contasPagar as any[]
  );

  const stats = useMemo(() => {
    const items = extratoBancos;
    const conciliados = items.filter(i => i.conciliado);
    const pendentes = items.filter(i => !i.conciliado);
    const entradas = conciliados.filter(i => i.tipo === "entrada").reduce((s, i) => s + Number(i.valor), 0);
    const saidas = conciliados.filter(i => i.tipo === "saida").reduce((s, i) => s + Number(i.valor), 0);
    return {
      total: items.length,
      conciliados: conciliados.length,
      pendentes: pendentes.length,
      entradas,
      saidas,
      taxaIA: statsIA.taxaMatchAutomatico,
      sugestoesIA: statsIA.sugestoesPendentes,
    };
  }, [extratoBancos, statsIA]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Conciliação Bancária</h1>
        <p className="text-sm text-muted-foreground">Importe extratos OFX e concilie transações com seus lançamentos</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2">
            <ArrowDownCircle className="h-4 w-4 text-green-600" />
            <div><p className="text-[10px] text-muted-foreground">Entradas Conciliadas</p><p className="text-sm font-bold">{fmt(stats.entradas)}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2">
            <ArrowUpCircle className="h-4 w-4 text-red-600" />
            <div><p className="text-[10px] text-muted-foreground">Saídas Conciliadas</p><p className="text-sm font-bold">{fmt(stats.saidas)}</p></div>
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

      {/* Alerta de Sugestões IA */}
      {stats.sugestoesIA > 0 && (
        <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-purple-800">
              {stats.sugestoesIA} sugestões de conciliação automática disponíveis
            </p>
            <p className="text-xs text-purple-600">
              A IA identificou transações com alta probabilidade de match
            </p>
          </div>
          <Badge variant="default" className="bg-purple-600">
            {stats.taxaIA}% automático
          </Badge>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="inteligente" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inteligente" className="gap-2">
            <Brain className="h-4 w-4" /> Inteligente {stats.sugestoesIA > 0 && <Badge variant="secondary" className="ml-1 text-[10px]">{stats.sugestoesIA}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="importar" className="gap-2"><Upload className="h-4 w-4" /> Importar OFX</TabsTrigger>
        </TabsList>

        <TabsContent value="inteligente">
          <SugestoesConciliacao
            sugestoes={sugestoes}
            stats={statsIA}
            onConciliarAutomatico={async () => { await conciliarAutomatico(); }}
            onConciliarEmLote={async (matches) => { await conciliarEmLote(matches); }}
            onRecusar={recusarSugestao}
            isLoading={isLoading}
            progresso={progresso}
          />
        </TabsContent>

        <TabsContent value="importar">
          <ImportOFX bancos={bancos as any[]} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
