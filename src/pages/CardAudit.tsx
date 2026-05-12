/**
 * 9nine Business Control Card — v2.0
 * Auditoria de Recebíveis de Cartão de Crédito
 * Dashboard · Importação · Auditoria · Relatórios · Reforma Tributária · Wiki
 */
import { useState, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CreditCard,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  TrendingUp,
  Percent,
  Calculator,
  HelpCircle,
  BookOpen,
  FileText,
  Download,
  Printer,
  Search,
  Filter,
  BarChart3,
  DollarSign,
  Clock,
  Shield,
  Save,
  ChevronDown,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { useCardAudit, type FiltrosAuditoria } from "@/hooks/useCardAudit";
import { calcularSplitPayment, printReport, downloadReportHTML } from "@/lib/cardAudit";
import { toast } from "sonner";

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (d: string) => {
  try {
    return new Date(d + "T12:00:00").toLocaleDateString("pt-BR");
  } catch {
    return d;
  }
};

export default function CardAudit() {
  const {
    transacoes,
    transacoesFiltradas,
    aliquotas,
    importacoes,
    empresa,
    aliquotaVigente,
    dashboard,
    filtros,
    setFiltros,
    isLoading,
    importarLote,
    auditar,
    auditarLote,
    zerarDashboard,
    salvarSimulacao,
    processFile,
    buildReportData,
    ADQUIRENTES,
    TIPOS_TRANSACAO,
    BANDEIRAS,
  } = useCardAudit();

  const [adquirenteImport, setAdquirenteImport] = useState<string>("cielo");
  const [tipoImport, setTipoImport] = useState<string>("credito_a_vista");
  const [importProgress, setImportProgress] = useState<number>(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulador
  const [simBruto, setSimBruto] = useState<number>(1000);
  const [simMdr, setSimMdr] = useState<number>(2.99);
  const [simAno, setSimAno] = useState<number>(new Date().getFullYear());

  const aliqSim =
    aliquotas.find((a) => a.ano === simAno) || { aliquota_cbs: 0, aliquota_ibs: 0, ano: simAno };
  const simResult = calcularSplitPayment({
    valor_bruto: simBruto,
    taxa_mdr: simMdr / 100,
    aliquota_cbs: aliqSim.aliquota_cbs,
    aliquota_ibs: aliqSim.aliquota_ibs,
  });

  // --- File Handler ---

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImportProgress(30);
      const result = await processFile(file, adquirenteImport, tipoImport);
      setImportProgress(70);

      if (result.transacoes.length === 0) {
        toast.error("Nenhuma transação válida encontrada. Verifique colunas: data, nsu, valor_bruto, taxa, valor_liquido");
        setImportProgress(0);
        return;
      }

      importarLote.mutate({
        transacoes: result.transacoes as any,
        adquirente: adquirenteImport,
        tipoArquivo: result.tipoArquivo,
        nomeArquivo: file.name,
        totalLinhas: result.totalLinhas,
        totalErros: result.totalErros,
      });
      setImportProgress(100);
      setTimeout(() => setImportProgress(0), 2000);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      toast.error("Erro ao ler arquivo: " + err.message);
      setImportProgress(0);
    }
  };

  // --- Selection ---

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const allIds = new Set(transacoesFiltradas.map((t) => t.id));
    setSelectedIds(allIds);
  };

  const clearSelection = () => setSelectedIds(new Set());

  // --- Batch Audit ---

  const batchAudit = (status: string) => {
    if (selectedIds.size === 0) {
      toast.error("Selecione transações para auditar em lote");
      return;
    }
    auditarLote.mutate({ ids: Array.from(selectedIds), status });
    setSelectedIds(new Set());
  };

  // --- Report ---

  const handlePrintReport = (tipo: "mensal" | "por_adquirente" | "divergencias" | "split_payment") => {
    try {
      const data = buildReportData(tipo);
      printReport(data);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDownloadReport = (tipo: "mensal" | "por_adquirente" | "divergencias" | "split_payment") => {
    const data = buildReportData(tipo);
    downloadReportHTML(data);
    toast.success("Relatório baixado com sucesso");
  };

  // --- Status Badge ---

  const statusBadge = (s: string) => {
    if (s === "ok") return <Badge className="bg-green-600">Conferida</Badge>;
    if (s === "divergente") return <Badge variant="destructive">Divergente</Badge>;
    if (s === "chargeback") return <Badge className="bg-amber-600">Chargeback</Badge>;
    return <Badge variant="secondary">Pendente</Badge>;
  };

  // --- Cash Flow Progress ---

  const cashFlowTotal = dashboard.cashFlowPrevisto.reduce((s, c) => s + c.valor, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            9nine Business Control Card
          </h1>
          <p className="text-sm text-muted-foreground">
            Auditoria de Recebíveis · Reforma Tributária IBS/CBS · Split Payment
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="gap-1">
            <Percent className="h-3 w-3" />
            CBS {(aliquotaVigente.aliquota_cbs * 100).toFixed(2)}% · IBS{" "}
            {(aliquotaVigente.aliquota_ibs * 100).toFixed(2)}% ({aliquotaVigente.ano})
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Shield className="h-3 w-3" /> LGPD
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 lg:w-auto lg:inline-flex">
          <TabsTrigger value="dashboard" className="gap-1.5">
            <BarChart3 className="h-4 w-4" /> <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="importar" className="gap-1.5">
            <Upload className="h-4 w-4" /> <span className="hidden sm:inline">Importar</span>
          </TabsTrigger>
          <TabsTrigger value="auditoria" className="gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> <span className="hidden sm:inline">Auditoria</span>
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="gap-1.5">
            <FileText className="h-4 w-4" /> <span className="hidden sm:inline">Relatórios</span>
          </TabsTrigger>
          <TabsTrigger value="reforma" className="gap-1.5">
            <Calculator className="h-4 w-4" /> <span className="hidden sm:inline">Reforma</span>
          </TabsTrigger>
          <TabsTrigger value="wiki" className="gap-1.5">
            <BookOpen className="h-4 w-4" /> <span className="hidden sm:inline">Wiki</span>
          </TabsTrigger>
        </TabsList>

        {/* ============================================ */}
        {/* DASHBOARD DE CONCILIAÇÃO                     */}
        {/* ============================================ */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Total Bruto" value={fmtBRL(dashboard.totalBruto)} icon={DollarSign} tone="default" />
            <KpiCard label="Taxas (MDR)" value={fmtBRL(dashboard.totalTaxa)} icon={TrendingUp} tone="err" />
            <KpiCard label="Líquido Recebido" value={fmtBRL(dashboard.totalLiquido)} icon={CheckCircle2} tone="ok" />
            <KpiCard label="Transações" value={String(dashboard.total)} icon={CreditCard} tone="info" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Pendentes" value={String(dashboard.pendentes)} icon={Clock} tone="warn" />
            <KpiCard label="Conferidas" value={String(dashboard.conferidas)} icon={CheckCircle2} tone="ok" />
            <KpiCard label="Divergentes" value={String(dashboard.divergentes)} icon={AlertTriangle} tone="err" />
            <KpiCard
              label={`Líquido Projetado (${aliquotaVigente.ano})`}
              value={fmtBRL(dashboard.split.liquidoProjetado)}
              icon={Percent}
              tone="info"
            />
          </div>

          {/* Split Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Percent className="h-4 w-4 text-primary" /> Projeção de Split Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Stat label="CBS retido" value={fmtBRL(dashboard.split.cbs)} />
                <Stat label="IBS retido" value={fmtBRL(dashboard.split.ibs)} />
                <Stat
                  label="Líquido para empresa"
                  value={fmtBRL(dashboard.split.liquidoProjetado)}
                  highlight
                />
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Cálculo conforme cronograma de transição da EC 132/2023, alíquotas vigentes em{" "}
                {aliquotaVigente.ano}.
              </p>
            </CardContent>
          </Card>

          {/* Breakdown por Adquirente */}
          {dashboard.porAdquirente.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4 text-primary" /> Vendas por Adquirente
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Adquirente</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Bruto</TableHead>
                      <TableHead className="text-right">Taxas</TableHead>
                      <TableHead className="text-right">Líquido</TableHead>
                      <TableHead className="text-right">MDR %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboard.porAdquirente.map((a) => (
                      <TableRow key={a.adquirente}>
                        <TableCell className="capitalize font-medium">{a.adquirente}</TableCell>
                        <TableCell className="text-right">{a.total}</TableCell>
                        <TableCell className="text-right">{fmtBRL(a.bruto)}</TableCell>
                        <TableCell className="text-right text-destructive">{fmtBRL(a.taxas)}</TableCell>
                        <TableCell className="text-right font-medium">{fmtBRL(a.liquido)}</TableCell>
                        <TableCell className="text-right">{a.taxaPercentual.toFixed(2)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Breakdown por Bandeira */}
          {dashboard.porBandeira.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4 text-primary" /> Distribuição por Bandeira
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bandeira</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Bruto</TableHead>
                      <TableHead className="text-right">Líquido</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboard.porBandeira.map((b) => (
                      <TableRow key={b.bandeira}>
                        <TableCell className="capitalize font-medium">{b.bandeira}</TableCell>
                        <TableCell className="text-right">{b.total}</TableCell>
                        <TableCell className="text-right">{fmtBRL(b.bruto)}</TableCell>
                        <TableCell className="text-right font-medium">{fmtBRL(b.liquido)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Cash Flow Previsto */}
          {dashboard.cashFlowPrevisto.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-primary" /> Previsão de Cash Flow (30 dias)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboard.cashFlowPrevisto.map((cf) => (
                    <div key={cf.data} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-20">{fmtDate(cf.data)}</span>
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{
                              width: `${cashFlowTotal > 0 ? (cf.valor / cashFlowTotal) * 100 : 0}%`,
                              minWidth: cf.valor > 0 ? "8px" : "0",
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium w-28 text-right">{fmtBRL(cf.valor)}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Total Previsto</span>
                  <span className="text-sm font-bold text-primary">{fmtBRL(cashFlowTotal)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2">
                  <Trash2 className="h-4 w-4" /> Zerar Dashboard
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Zerar Dashboard?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação remove TODAS as transações importadas para reprocessamento.
                    Não pode ser desfeita. A ação será registrada nos logs de auditoria.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => zerarDashboard.mutate()}>
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TabsContent>

        {/* ============================================ */}
        {/* MÓDULO DE IMPORTAÇÃO                         */}
        {/* ============================================ */}
        <TabsContent value="importar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" /> Importar Extrato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Adquirente</Label>
                  <Select value={adquirenteImport} onValueChange={setAdquirenteImport}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ADQUIRENTES.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo padrão</Label>
                  <Select value={tipoImport} onValueChange={setTipoImport}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_TRANSACAO.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Arquivo (CSV, OFX, Excel)</Label>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt,.ofx,.xlsx"
                    onChange={handleFile}
                    disabled={importarLote.isPending}
                  />
                </div>
              </div>

              {importProgress > 0 && (
                <Progress value={importProgress} className="h-2" />
              )}

              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md space-y-1">
                <p><strong>Formatos aceitos:</strong> CSV (separador <code>;</code> ou <code>,</code>), OFX (v1/v2) e Excel (.xlsx).</p>
                <p><strong>Colunas reconhecidas automaticamente:</strong> <code>data_venda</code>, <code>nsu</code>, <code>bandeira</code>, <code>valor_bruto</code>, <code>taxa</code>, <code>valor_liquido</code>, <code>parcelas</code>.</p>
                <p><strong>Detecção automática:</strong> O sistema identifica o layout da adquirente (Cielo, Rede, Stone, GetNet, PagSeguro, SafraPay) e mapeia as colunas correspondentes.</p>
                <p><strong>Performance:</strong> Conciliação básica em &lt; 5 segundos para até 1.000 transações.</p>
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Importações */}
          {importacoes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-primary" /> Histórico de Importações
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Adquirente</TableHead>
                      <TableHead>Arquivo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Importadas</TableHead>
                      <TableHead className="text-right">Erros</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importacoes.map((imp) => (
                      <TableRow key={imp.id}>
                        <TableCell className="text-xs">
                          {new Date(imp.criado_em).toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell className="capitalize">{imp.adquirente}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">
                          {imp.nome_arquivo}
                        </TableCell>
                        <TableCell className="uppercase text-xs">{imp.tipo_arquivo}</TableCell>
                        <TableCell className="text-right">{imp.total_importadas}</TableCell>
                        <TableCell className="text-right">
                          {imp.total_erros > 0 ? (
                            <span className="text-destructive">{imp.total_erros}</span>
                          ) : (
                            "0"
                          )}
                        </TableCell>
                        <TableCell>
                          {imp.status === "concluido" ? (
                            <Badge className="bg-green-600">Concluído</Badge>
                          ) : imp.status === "erro" ? (
                            <Badge variant="destructive">Erro</Badge>
                          ) : (
                            <Badge variant="secondary">Processando</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ============================================ */}
        {/* AUDITORIA DE TRANSAÇÕES                      */}
        {/* ============================================ */}
        <TabsContent value="auditoria" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Filtros</span>
                {(filtros.adquirente !== "todas" || filtros.status !== "todos" || filtros.bandeira !== "todas" || filtros.tipoTransacao !== "todos" || filtros.search || filtros.dataInicio || filtros.dataFim) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs gap-1"
                    onClick={() =>
                      setFiltros({
                        dataInicio: "",
                        dataFim: "",
                        adquirente: "todas",
                        bandeira: "todas",
                        status: "todos",
                        tipoTransacao: "todos",
                        search: "",
                      })
                    }
                  >
                    <X className="h-3 w-3" /> Limpar
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                <Input
                  placeholder="Buscar NSU, bandeira..."
                  value={filtros.search}
                  onChange={(e) => setFiltros((f) => ({ ...f, search: e.target.value }))}
                  className="h-8 text-xs"
                />
                <Input
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => setFiltros((f) => ({ ...f, dataInicio: e.target.value }))}
                  className="h-8 text-xs"
                />
                <Input
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => setFiltros((f) => ({ ...f, dataFim: e.target.value }))}
                  className="h-8 text-xs"
                />
                <Select value={filtros.adquirente} onValueChange={(v) => setFiltros((f) => ({ ...f, adquirente: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Adquirente" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    {ADQUIRENTES.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filtros.bandeira} onValueChange={(v) => setFiltros((f) => ({ ...f, bandeira: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Bandeira" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    {BANDEIRAS.map((b) => (
                      <SelectItem key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filtros.status} onValueChange={(v) => setFiltros((f) => ({ ...f, status: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="ok">Conferida</SelectItem>
                    <SelectItem value="divergente">Divergente</SelectItem>
                    <SelectItem value="chargeback">Chargeback</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filtros.tipoTransacao} onValueChange={(v) => setFiltros((f) => ({ ...f, tipoTransacao: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {TIPOS_TRANSACAO.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Ações em Lote */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg border border-primary/20">
              <span className="text-sm font-medium">{selectedIds.size} selecionada(s)</span>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => batchAudit("ok")}>
                <CheckCircle2 className="h-3 w-3" /> Conferir
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-destructive" onClick={() => batchAudit("divergente")}>
                <AlertTriangle className="h-3 w-3" /> Divergente
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={clearSelection}>
                <X className="h-3 w-3" /> Limpar seleção
              </Button>
            </div>
          )}

          {/* Tabela de Transações */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={selectedIds.size === transacoesFiltradas.length && transacoesFiltradas.length > 0}
                          onCheckedChange={(checked) => (checked ? selectAll() : clearSelection())}
                        />
                      </TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Adquirente</TableHead>
                      <TableHead>Bandeira</TableHead>
                      <TableHead>NSU</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Bruto</TableHead>
                      <TableHead className="text-right">Taxa</TableHead>
                      <TableHead className="text-right">Líquido</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    )}
                    {!isLoading && transacoesFiltradas.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                          {transacoes.length === 0
                            ? 'Nenhuma transação importada. Use a aba "Importar".'
                            : "Nenhuma transação corresponde aos filtros."}
                        </TableCell>
                      </TableRow>
                    )}
                    {transacoesFiltradas.slice(0, 100).map((t) => (
                      <TableRow key={t.id} className={selectedIds.has(t.id) ? "bg-primary/5" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(t.id)}
                            onCheckedChange={() => toggleSelect(t.id)}
                          />
                        </TableCell>
                        <TableCell className="text-xs">{fmtDate(t.data_venda)}</TableCell>
                        <TableCell className="capitalize text-xs">{t.adquirente}</TableCell>
                        <TableCell className="capitalize text-xs">{t.bandeira || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{t.nsu || "—"}</TableCell>
                        <TableCell className="text-xs">
                          {t.tipo_transacao === "credito_parcelado"
                            ? `Parc. ${t.parcela_atual}/${t.parcelas}`
                            : t.tipo_transacao === "debito"
                            ? "Débito"
                            : t.tipo_transacao === "pix"
                            ? "Pix"
                            : "Crédito"}
                        </TableCell>
                        <TableCell className="text-right text-xs">{fmtBRL(Number(t.valor_bruto))}</TableCell>
                        <TableCell className="text-right text-xs text-destructive">
                          -{fmtBRL(Number(t.valor_taxa))}
                        </TableCell>
                        <TableCell className="text-right text-xs font-medium">
                          {fmtBRL(Number(t.valor_liquido))}
                        </TableCell>
                        <TableCell>{statusBadge(t.status_auditoria)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-green-600"
                              onClick={() => auditar.mutate({ id: t.id, status: "ok" })}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-destructive"
                              onClick={() => auditar.mutate({ id: t.id, status: "divergente" })}
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {transacoesFiltradas.length > 100 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Mostrando 100 de {transacoesFiltradas.length} transações. Use filtros para refinar.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================ */}
        {/* RELATÓRIOS AUTOMÁTICOS                       */}
        {/* ============================================ */}
        <TabsContent value="relatorios" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReportCard
              title="Relatório Mensal"
              description="Visão consolidada do mês com todas as transações, taxas e projeção de Split Payment."
              icon={BarChart3}
              onPrint={() => handlePrintReport("mensal")}
              onDownload={() => handleDownloadReport("mensal")}
            />
            <ReportCard
              title="Por Adquirente"
              description="Breakdown detalhado por adquirente com comparativo de taxas MDR e volumes."
              icon={CreditCard}
              onPrint={() => handlePrintReport("por_adquirente")}
              onDownload={() => handleDownloadReport("por_adquirente")}
            />
            <ReportCard
              title="Divergências"
              description="Lista de transações com status divergente ou chargeback para análise."
              icon={AlertTriangle}
              onPrint={() => handlePrintReport("divergencias")}
              onDownload={() => handleDownloadReport("divergencias")}
            />
            <ReportCard
              title="Projeção Split Payment"
              description="Simulação de impacto da Reforma Tributária (IBS/CBS) sobre o fluxo de caixa."
              icon={Percent}
              onPrint={() => handlePrintReport("split_payment")}
              onDownload={() => handleDownloadReport("split_payment")}
            />
          </div>

          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">
                Todos os relatórios são gerados com o logotipo e nome da empresa cadastrada no sistema.
                O PDF é gerado via navegador (Ctrl+P → Salvar como PDF) ou pode ser baixado como HTML
                para conversão posterior. Os relatórios respeitam os filtros de data, adquirente e
                bandeira aplicados na aba Auditoria.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================ */}
        {/* REFORMA TRIBUTÁRIA                           */}
        {/* ============================================ */}
        <TabsContent value="reforma" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" /> Simulador de Split Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Valor bruto (R$)</Label>
                  <Input
                    type="number"
                    value={simBruto}
                    onChange={(e) => setSimBruto(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Taxa MDR (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={simMdr}
                    onChange={(e) => setSimMdr(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Ano de referência</Label>
                  <Select
                    value={String(simAno)}
                    onValueChange={(v) => setSimAno(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aliquotas.map((a) => (
                        <SelectItem key={a.ano} value={String(a.ano)}>
                          {a.ano}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
                <Stat label="Bruto" value={fmtBRL(simResult.valor_bruto)} />
                <Stat label="MDR" value={fmtBRL(simResult.valor_mdr)} />
                <Stat
                  label={`CBS ${(aliqSim.aliquota_cbs * 100).toFixed(2)}%`}
                  value={fmtBRL(simResult.valor_cbs)}
                />
                <Stat
                  label={`IBS ${(aliqSim.aliquota_ibs * 100).toFixed(2)}%`}
                  value={fmtBRL(simResult.valor_ibs)}
                />
                <Stat label="Líquido Empresa" value={fmtBRL(simResult.valor_liquido_empresa)} highlight />
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() =>
                    salvarSimulacao.mutate({
                      nome: `Simulação ${fmtBRL(simBruto)} ${simAno}`,
                      valor_bruto: simBruto,
                      taxa_mdr: simMdr / 100,
                      aliquota_cbs: aliqSim.aliquota_cbs,
                      aliquota_ibs: aliqSim.aliquota_ibs,
                      ano_referencia: simAno,
                      valor_mdr: simResult.valor_mdr,
                      valor_cbs: simResult.valor_cbs,
                      valor_ibs: simResult.valor_ibs,
                      valor_liquido: simResult.valor_liquido_empresa,
                    })
                  }
                >
                  <Save className="h-4 w-4" /> Salvar Simulação
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Cronograma EC 132/2023 — Transição IBS/CBS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ano</TableHead>
                      <TableHead className="text-right">CBS</TableHead>
                      <TableHead className="text-right">IBS</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Observação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aliquotas.map((a) => (
                      <TableRow key={a.ano} className={a.ano === new Date().getFullYear() ? "bg-primary/5" : ""}>
                        <TableCell className="font-medium">{a.ano}</TableCell>
                        <TableCell className="text-right">{(a.aliquota_cbs * 100).toFixed(2)}%</TableCell>
                        <TableCell className="text-right">{(a.aliquota_ibs * 100).toFixed(2)}%</TableCell>
                        <TableCell className="text-right font-medium">
                          {((a.aliquota_cbs + a.aliquota_ibs) * 100).toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{a.observacao}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Explicação do Split Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" /> Como funciona o Split Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                No regime atual, os tributos (PIS, COFINS, ICMS, ISS) são recolhidos
                posteriormente pela empresa. Com a Reforma Tributária (EC 132/2023), os
                novos tributos <strong>CBS</strong> (federal) e <strong>IBS</strong>
                (estadual/municipal) serão retidos <strong>na fonte</strong> pela
                adquirente no momento da liquidação financeira.
              </p>
              <pre className="bg-muted p-3 rounded text-xs font-mono">
{`┌─────────────────────────────────────────────┐
│              VALOR BRUTO (R$)                │
│  Ex: R$ 1.000,00                             │
├──────────┬──────────┬────────────────────────┤
│  - MDR   │  - CBS   │  - IBS                 │
│ (Adq.)   │ (Fiscal) │ (Fiscal)               │
│  R$29,90 │  R$10,00 │  R$10,00 (2026: 1+1%) │
├──────────┴──────────┴────────────────────────┤
│         LÍQUIDO PARA EMPRESA: R$ 950,10      │
└─────────────────────────────────────────────┘`}
              </pre>
              <p>
                O <strong>Split Payment</strong> separa automaticamente a parcela do fisco
                no momento em que a adquirente liquida a venda. A empresa recebe apenas
                o valor líquido, sem precisar recolher esses tributos depois.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================ */}
        {/* CENTRAL DE AJUDA / WIKI                      */}
        {/* ============================================ */}
        <TabsContent value="wiki" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" /> Central de Ajuda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
              <Section title="1. Como importar arquivos">
                <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                  <li>Vá até a aba <strong>Importar</strong>.</li>
                  <li>Selecione a <strong>Adquirente</strong> (Cielo, Rede, Stone, GetNet, PagSeguro, SafraPay).</li>
                  <li>Defina o <strong>Tipo padrão</strong> (Crédito à Vista, Parcelado, Débito, Pix, Voucher). Será usado se o arquivo não informar o tipo.</li>
                  <li>Escolha o arquivo <strong>CSV</strong>, <strong>OFX</strong> ou <strong>Excel (.xlsx)</strong>.</li>
                  <li>O sistema reconhece colunas automaticamente por adquirente: data, NSU, valor bruto, taxa, valor líquido, bandeira e parcelas.</li>
                  <li>A conciliação básica é feita em menos de 5 segundos.</li>
                  <li>Todas as importações são registradas no <strong>histórico</strong> com detalhes de erros e sucesso.</li>
                </ol>
              </Section>

              <Section title="2. Auditoria de transações">
                <p className="text-muted-foreground">
                  Na aba <strong>Auditoria</strong>, você pode conferir transações individualmente ou em lote.
                  Use os filtros por data, adquirente, bandeira, status e tipo para localizar transações.
                  Selecione múltiplas linhas usando os checkboxes e audite em lote com os botões
                  "Conferir" ou "Divergente". Para <strong>Crédito Parcelado</strong>, cada parcela
                  aparece separadamente com indicação "Parc. X/Y".
                </p>
              </Section>

              <Section title="3. Relatórios em PDF">
                <p className="text-muted-foreground">
                  A aba <strong>Relatórios</strong> oferece 4 modelos: Mensal, Por Adquirente,
                  Divergências e Projeção Split Payment. Cada relatório é personalizado com
                  o logotipo e nome da empresa. Use <strong>Imprimir</strong> para gerar PDF
                  via navegador (Ctrl+P → Salvar como PDF) ou <strong>Baixar</strong> para
                  exportar como HTML.
                </p>
              </Section>

              <Section title="4. Split Payment e Fluxo de Caixa">
                <p className="text-muted-foreground">
                  No regime IBS/CBS (a partir de 2026), parte do valor da venda no cartão é
                  retida na liquidação pela adquirente e enviada diretamente ao fisco. O
                  valor que cai na sua conta passa a ser:
                </p>
                <pre className="bg-muted p-3 rounded text-xs font-mono mt-2">
{`Líquido = Bruto - MDR - (CBS + IBS)`}
                </pre>
                <p className="text-muted-foreground mt-2">
                  Use o <strong>Simulador</strong> para projetar o impacto no fluxo de caixa
                  ano a ano segundo a EC 132/2023. As alíquotas sobem gradualmente de 1%+1%
                  em 2026 até ~7.38%+7.38% em 2033.
                </p>
              </Section>

              <Section title="5. Segurança e LGPD">
                <p className="text-muted-foreground">
                  Toda auditoria, importação e exclusão registra log com usuário, data e
                  detalhes. Os dados são isolados por usuário (RLS) e protegidos por
                  criptografia em repouso e em trânsito. O sistema está preparado para
                  conformidade com a LGPD, incluindo rastreabilidade completa de ações.
                </p>
              </Section>

              <Section title="6. Glossário">
                <dl className="space-y-2">
                  <Term term="NSU" def="Número Sequencial Único — identificador da transação na adquirente." />
                  <Term term="Chargeback" def="Estorno solicitado pelo portador do cartão junto ao banco emissor." />
                  <Term term="Antecipação" def="Receber hoje valores cuja liquidação só ocorreria no futuro, mediante taxa adicional." />
                  <Term term="MDR" def="Merchant Discount Rate — taxa cobrada pela adquirente sobre o valor bruto da venda." />
                  <Term term="CBS" def="Contribuição sobre Bens e Serviços (federal) — substitui PIS/COFINS na reforma tributária." />
                  <Term term="IBS" def="Imposto sobre Bens e Serviços (estadual/municipal) — substitui ICMS/ISS na reforma tributária." />
                  <Term term="Split Payment" def="Mecanismo da reforma tributária que separa tributos do valor líquido na liquidação pela adquirente." />
                  <Term term="EC 132/2023" def="Emenda Constitucional que institui a Reforma Tributária com IBS/CBS e Split Payment." />
                  <Term term="OFX" def="Open Financial Exchange — formato padrão para troca de dados financeiros entre sistemas." />
                  <Term term="Adquirente" def="Empresa que processa pagamentos com cartão (Cielo, Rede, Stone, etc.)." />
                </dl>
              </Section>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============================================ */
/* Sub-components                               */
/* ============================================ */

function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  tone?: "default" | "ok" | "warn" | "err" | "info";
}) {
  const toneClass = {
    default: "text-foreground",
    ok: "text-green-600",
    warn: "text-amber-600",
    err: "text-destructive",
    info: "text-primary",
  }[tone];
  const iconToneClass = {
    default: "text-muted-foreground",
    ok: "text-green-600",
    warn: "text-amber-600",
    err: "text-destructive",
    info: "text-primary",
  }[tone];
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`h-4 w-4 ${iconToneClass}`} />
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        <p className={`text-lg font-bold ${toneClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`p-3 rounded-md border ${
        highlight ? "bg-primary/10 border-primary/30" : "bg-muted/30"
      }`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-base font-bold ${highlight ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function Term({ term, def }: { term: string; def: string }) {
  return (
    <div className="flex flex-col md:flex-row md:gap-2">
      <dt className="font-semibold min-w-[120px]">{term}</dt>
      <dd className="text-muted-foreground">{def}</dd>
    </div>
  );
}

function ReportCard({
  title,
  description,
  icon: Icon,
  onPrint,
  onDownload,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  onPrint: () => void;
  onDownload: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={onPrint}>
            <Printer className="h-4 w-4" /> Imprimir PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={onDownload}>
            <Download className="h-4 w-4" /> Baixar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}