import { useState, useMemo } from "react";
import { useTableQuery } from "@/hooks/useSupabaseQuery";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Brain,
  CheckCircle2,
  XCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import ImportOFX from "@/components/conciliacao/ImportOFX";
import SugestoesConciliacao from "@/components/conciliacao/SugestoesConciliacao";
import ConciliacaoMatchPanel from "@/components/conciliacao/ConciliacaoMatchPanel";
import CriarLancamentoAjusteModal from "@/components/conciliacao/CriarLancamentoAjusteModal";
import { useConciliacaoInteligente } from "@/hooks/useConciliacaoInteligente";
import { useConciliacaoBancariaV2 } from "@/hooks/useConciliacaoBancariaV2";
import { cn } from "@/lib/utils";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ConciliacaoBancaria() {
  const { user } = useAuth();
  const [bancoSelecionadoId, setBancoSelecionadoId] =
    useState<string>("todos");
  const [activeTab, setActiveTab] = useState("painel");
  const [modalAjusteOpen, setModalAjusteOpen] = useState(false);
  const [extratoSelecionado, setExtratoSelecionado] = useState<
    {
      id: string;
      descricao: string;
      valor: number;
      data_transacao: string;
      tipo: "entrada" | "saida";
    } | null
  >(null);

  const { data: bancos = [] } = useTableQuery("bancos_cartoes");
  const { data: extrato = [] } = useTableQuery("extrato_bancario");
  const { data: lancamentos = [] } = useTableQuery("lancamentos_caixa");
  const { data: contasReceber = [] } = useTableQuery("contas_receber");
  const { data: contasPagar = [] } = useTableQuery("contas_pagar");
  const { data: categorias = [] } = useTableQuery("categorias");

  const bancosAtivos = useMemo(
    () => (bancos as any[]).filter((b) => b.ativo && b.tipo === "banco"),
    [bancos]
  );
  const bancosIds = useMemo(
    () => new Set(bancosAtivos.map((b) => b.id)),
    [bancosAtivos]
  );

  const extratoBancos = useMemo(
    () =>
      (extrato as any[]).filter((i) => bancosIds.has(i.banco_cartao_id)),
    [extrato, bancosIds]
  );

  const extratoFiltrado = useMemo(() => {
    if (bancoSelecionadoId === "todos") return extratoBancos;
    return extratoBancos.filter(
      (i) => i.banco_cartao_id === bancoSelecionadoId
    );
  }, [extratoBancos, bancoSelecionadoId]);

  // Separa itens OFX de espelhos do sistema
  const ofxItems = useMemo(
    () =>
      extratoFiltrado.filter(
        (i) => i.origem === "ofx" || i.origem === "manual"
      ),
    [extratoFiltrado]
  );
  const espelhoItems = useMemo(
    () =>
      extratoFiltrado.filter(
        (i) => i.origem === "sistema" && !i.conciliado
      ),
    [extratoFiltrado]
  );

  const { matches, stats: statsV2, confirmarMatch, criarLancamentoAjuste, isLoading: isLoadingV2 } =
    useConciliacaoBancariaV2(ofxItems, espelhoItems);

  const {
    sugestoes,
    stats: statsIA,
    conciliarAutomatico,
    conciliarEmLote,
    recusarSugestao,
    isLoading: isLoadingIA,
    progresso,
  } = useConciliacaoInteligente(
    extratoFiltrado,
    lancamentos as any[],
    contasReceber as any[],
    contasPagar as any[]
  );

  const stats = useMemo(() => {
    const items = extratoFiltrado;
    const conciliados = items.filter((i) => i.conciliado);
    const pendentes = items.filter((i) => !i.conciliado);
    const entradas = conciliados
      .filter((i) => i.tipo === "entrada")
      .reduce((s, i) => s + Number(i.valor), 0);
    const saidas = conciliados
      .filter((i) => i.tipo === "saida")
      .reduce((s, i) => s + Number(i.valor), 0);
    const aguardando = items.filter(
      (i) =>
        i.origem === "sistema" &&
        !i.conciliado &&
        (i.conta_pagar_id || i.conta_receber_id)
    ).length;
    return {
      total: items.length,
      conciliados: conciliados.length,
      pendentes: pendentes.length,
      entradas,
      saidas,
      aguardando,
      taxaIA: statsIA.taxaMatchAutomatico,
      sugestoesIA: statsIA.sugestoesPendentes,
      greenV2: statsV2.green,
      redV2: statsV2.red,
    };
  }, [extratoFiltrado, statsIA, statsV2]);

  const handleSemLancamento = (extrato: any) => {
    setExtratoSelecionado(extrato);
    setModalAjusteOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Conciliação Bancária
          </h1>
          <p className="text-sm text-muted-foreground">
            Importe extratos OFX e concilie transações com seus lançamentos
          </p>
        </div>
        <div className="w-full md:w-72">
          <Select
            value={bancoSelecionadoId}
            onValueChange={setBancoSelecionadoId}
          >
            <SelectTrigger>
              <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Selecionar banco" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os bancos</SelectItem>
              {bancosAtivos.map((banco) => (
                <SelectItem key={banco.id} value={banco.id}>
                  {banco.nome || banco.banco} — Ag. {banco.agencia} / CC{" "}
                  {banco.conta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-[10px] text-muted-foreground">
                  Entradas Conciliadas
                </p>
                <p className="text-sm font-bold">{fmt(stats.entradas)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-[10px] text-muted-foreground">
                  Saídas Conciliadas
                </p>
                <p className="text-sm font-bold">{fmt(stats.saidas)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-[10px] text-muted-foreground">
                  Conciliados
                </p>
                <p className="text-sm font-bold">{stats.conciliados}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-[10px] text-muted-foreground">Pendentes</p>
                <p className="text-sm font-bold">{stats.pendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={cn(stats.aguardando > 0 && "border-blue-300")}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-[10px] text-muted-foreground">
                  Aguardando Extrato
                </p>
                <p className="text-sm font-bold">{stats.aguardando}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="painel" className="gap-2">
            <BarChart3 className="h-4 w-4" /> Painel de Match{" "}
            {(stats.greenV2 > 0 || stats.redV2 > 0) && (
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {stats.greenV2 + stats.redV2}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="inteligente" className="gap-2">
            <Brain className="h-4 w-4" /> Inteligente{" "}
            {stats.sugestoesIA > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {stats.sugestoesIA}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="importar" className="gap-2">
            <Upload className="h-4 w-4" /> Importar OFX
          </TabsTrigger>
        </TabsList>

        {/* Painel de Match (novo) */}
        <TabsContent value="painel" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold font-display">
              Checklist de Conciliação
            </h2>
            <div className="flex gap-2">
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {stats.greenV2} matches
              </Badge>
              <Badge
                variant="outline"
                className="bg-red-50 text-red-700 border-red-200"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                {stats.redV2} divergências
              </Badge>
            </div>
          </div>

          <ConciliacaoMatchPanel
            matches={matches}
            onConfirmarMatch={confirmarMatch}
            onSemLancamento={handleSemLancamento}
            isLoading={isLoadingV2}
          />
        </TabsContent>

        {/* Inteligente (existente) */}
        <TabsContent value="inteligente">
          <SugestoesConciliacao
            sugestoes={sugestoes}
            stats={statsIA}
            onConciliarAutomatico={async () => {
              await conciliarAutomatico();
            }}
            onConciliarEmLote={async (matches) => {
              await conciliarEmLote(matches);
            }}
            onRecusar={recusarSugestao}
            isLoading={isLoadingIA}
            progresso={progresso}
          />
        </TabsContent>

        {/* Importar OFX (existente) */}
        <TabsContent value="importar">
          <ImportOFX bancos={bancos as any[]} />
        </TabsContent>
      </Tabs>

      {/* Modal de ajuste */}
      <CriarLancamentoAjusteModal
        open={modalAjusteOpen}
        onOpenChange={setModalAjusteOpen}
        extrato={extratoSelecionado}
        categorias={categorias as any[]}
        onConfirm={criarLancamentoAjuste}
        isLoading={isLoadingV2}
      />
    </div>
  );
}
