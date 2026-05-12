import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Save, FileDown, Send, Clock, AlertTriangle, CheckCircle, Mail, UserX, Trash2, CalendarIcon, Zap, BarChart3, Search, ShieldCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { COLORS, addHeader } from "@/lib/pdfContasExport";
import { useReguaCobrancaAutomatica } from "@/hooks/useReguaCobrancaAutomatica";
import { DashboardCobranca } from "@/components/cobranca/DashboardCobranca";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

interface ReguaConfig {
  id?: string;
  dias_antes_1: number;
  dias_antes_2: number;
  dias_no_vencimento: boolean;
  dias_apos_1: number;
  dias_apos_2: number;
  dias_apos_3: number;
  canal: string;
  mensagem_antes: string;
  mensagem_vencimento: string;
  mensagem_apos: string;
  ativo: boolean;
}

const defaultConfig: ReguaConfig = {
  dias_antes_1: 3,
  dias_antes_2: 1,
  dias_no_vencimento: true,
  dias_apos_1: 3,
  dias_apos_2: 7,
  dias_apos_3: 15,
  canal: "email",
  mensagem_antes: "Prezado(a) cliente, informamos que sua fatura no valor de {valor} vence em {dias} dia(s), no dia {data_vencimento}. Agradecemos a atenção.",
  mensagem_vencimento: "Prezado(a) cliente, informamos que sua fatura no valor de {valor} vence hoje, dia {data_vencimento}. Agradecemos a atenção.",
  mensagem_apos: "Prezado(a) cliente, identificamos que sua fatura no valor de {valor}, com vencimento em {data_vencimento}, encontra-se em atraso há {dias} dia(s). Solicitamos a regularização.",
  ativo: true,
};

export default function ReguaCobranca() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [config, setConfig] = useState<ReguaConfig>(defaultConfig);
  const [historico, setHistorico] = useState<any[]>([]);
  const [contasVencidas, setContasVencidas] = useState<any[]>([]);
  const [contasAVencer, setContasAVencer] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [empresa, setEmpresa] = useState<any>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailParaEnvio, setEmailParaEnvio] = useState("");
  const [contaParaEnvio, setContaParaEnvio] = useState<any>(null);
  const [tipoParaEnvio, setTipoParaEnvio] = useState("");
  const [filterDataDe, setFilterDataDe] = useState("");
  const [filterDataAte, setFilterDataAte] = useState("");

  // Clientes excluídos da régua de cobrança (armazena {id: nome})
  const [clientesExcluidos, setClientesExcluidos] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("regua_clientes_excluidos_v2");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const excluirCliente = (clienteId: string, clienteNome: string) => {
    const updated = { ...clientesExcluidos, [clienteId]: clienteNome };
    setClientesExcluidos(updated);
    localStorage.setItem("regua_clientes_excluidos_v2", JSON.stringify(updated));
    toast({ title: `${clienteNome} excluído da régua de cobrança` });
    // Re-filter lists immediately
    setContasVencidas(prev => prev.filter(c => c.cliente_id !== clienteId));
    setContasAVencer(prev => prev.filter(c => c.cliente_id !== clienteId));
  };

  const reincluirCliente = (clienteId: string) => {
    const updated = { ...clientesExcluidos };
    delete updated[clienteId];
    setClientesExcluidos(updated);
    localStorage.setItem("regua_clientes_excluidos_v2", JSON.stringify(updated));
    toast({ title: "Cliente reincluído na régua de cobrança" });
    loadData();
  };

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const [reguaRes, histRes, contasRes, empresaRes] = await Promise.all([
      (supabase.from("regua_cobranca") as any).select("*").eq("user_id", user!.id).maybeSingle(),
      (supabase.from("cobranca_historico") as any).select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(100),
      (supabase.from("contas_receber") as any).select("*, clientes(nome, email)").eq("user_id", user!.id).eq("status", "pendente"),
      (supabase.from("empresa") as any).select("*").eq("user_id", user!.id).maybeSingle(),
    ]);

    if (reguaRes.data) {
      setConfig(reguaRes.data);
    }
    setHistorico(histRes.data || []);
    setEmpresa(empresaRes.data);

    const hoje = new Date();
    const contas = contasRes.data || [];
    const vencidas: any[] = [];
    const aVencer: any[] = [];

    contas.forEach((c: any) => {
      // Excluir clientes removidos da régua
      if (c.cliente_id && clientesExcluidos[c.cliente_id]) return;
      const venc = new Date(c.data_vencimento + "T00:00:00");
      const diff = Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      const item = { ...c, dias_diff: diff };
      if (diff < 0) vencidas.push(item);
      else aVencer.push(item);
    });

    setContasVencidas(vencidas.sort((a, b) => a.dias_diff - b.dias_diff));
    setContasAVencer(aVencer.sort((a, b) => a.dias_diff - b.dias_diff));
    setLoading(false);
  };

  const saveConfig = async () => {
    setSaving(true);
    const payload = {
      ...config,
      user_id: user!.id,
      nome: "Régua Padrão",
    };

    if (config.id) {
      await (supabase.from("regua_cobranca") as any).update(payload).eq("id", config.id);
    } else {
      const { data } = await (supabase.from("regua_cobranca") as any).insert(payload).select().single();
      if (data) setConfig({ ...config, id: data.id });
    }
    setSaving(false);
    toast({ title: "Configuração salva com sucesso!" });
  };

  const abrirDialogEmail = (conta: any, tipo: string) => {
    const clienteEmail = conta.clientes?.email || "";
    setContaParaEnvio(conta);
    setTipoParaEnvio(tipo);
    setEmailParaEnvio(clienteEmail);
    setEmailDialogOpen(true);
  };

  const confirmarEnvio = async () => {
    if (!contaParaEnvio || !emailParaEnvio.trim()) {
      toast({ title: "Informe um e-mail válido", variant: "destructive" });
      return;
    }

    const conta = contaParaEnvio;
    const tipo = tipoParaEnvio;
    const clienteNome = conta.clientes?.nome || "Cliente";

    let mensagem = "";
    if (tipo === "antes_vencimento") mensagem = config.mensagem_antes;
    else if (tipo === "no_vencimento") mensagem = config.mensagem_vencimento;
    else mensagem = config.mensagem_apos;

    mensagem = mensagem
      .replace("{valor}", fmt(conta.valor))
      .replace("{data_vencimento}", fmtDate(conta.data_vencimento))
      .replace("{dias}", Math.abs(conta.dias_diff).toString());

    await (supabase.from("cobranca_historico") as any).insert({
      user_id: user!.id,
      conta_receber_id: conta.id,
      cliente_nome: clienteNome,
      cliente_email: emailParaEnvio.trim(),
      tipo,
      canal: config.canal,
      mensagem,
      status: "enviado",
      valor: conta.valor,
      data_vencimento: conta.data_vencimento,
    });

    setEmailDialogOpen(false);
    toast({ title: `Lembrete registrado para ${clienteNome}` });
    loadData();
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    let y = addHeader(doc, "Relatório de Régua de Cobrança", empresa);
    y += 5;

    // Resumo
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.primary);
    doc.text("Resumo", 14, y);
    y += 8;

    const resumoData = [
      ["Contas vencidas", contasVencidas.length.toString(), fmt(contasVencidas.reduce((s, c) => s + Number(c.valor), 0))],
      ["Contas a vencer", contasAVencer.length.toString(), fmt(contasAVencer.reduce((s, c) => s + Number(c.valor), 0))],
      ["Lembretes enviados", historico.length.toString(), ""],
    ];

    autoTable(doc, {
      startY: y,
      head: [["Situação", "Quantidade", "Valor Total"]],
      body: resumoData,
      theme: "grid",
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: "bold", fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 4 },
    });

    y = (doc as any).lastAutoTable.finalY + 12;

    // Contas Vencidas
    if (contasVencidas.length > 0) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.danger);
      doc.text("Contas Vencidas", 14, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: [["Descrição", "Cliente", "Valor", "Vencimento", "Dias em Atraso"]],
        body: contasVencidas.map(c => [
          c.descricao,
          c.clientes?.nome || "—",
          fmt(c.valor),
          fmtDate(c.data_vencimento),
          Math.abs(c.dias_diff).toString(),
        ]),
        theme: "striped",
        headStyles: { fillColor: COLORS.danger, textColor: COLORS.white, fontStyle: "bold", fontSize: 8 },
        styles: { fontSize: 7, cellPadding: 3 },
      });
      y = (doc as any).lastAutoTable.finalY + 12;
    }

    // Contas a Vencer
    if (contasAVencer.length > 0) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.warning);
      doc.text("Contas a Vencer", 14, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: [["Descrição", "Cliente", "Valor", "Vencimento", "Dias Restantes"]],
        body: contasAVencer.slice(0, 30).map(c => [
          c.descricao,
          c.clientes?.nome || "—",
          fmt(c.valor),
          fmtDate(c.data_vencimento),
          c.dias_diff.toString(),
        ]),
        theme: "striped",
        headStyles: { fillColor: COLORS.warning, textColor: COLORS.white, fontStyle: "bold", fontSize: 8 },
        styles: { fontSize: 7, cellPadding: 3 },
      });
      y = (doc as any).lastAutoTable.finalY + 12;
    }

    // Histórico
    if (historico.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.primary);
      doc.text("Histórico de Cobranças", 14, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: [["Data", "Cliente", "Tipo", "Canal", "Valor", "Status"]],
        body: historico.slice(0, 50).map(h => [
          new Date(h.created_at).toLocaleDateString("pt-BR"),
          h.cliente_nome || "—",
          h.tipo === "antes_vencimento" ? "Antes Venc." : h.tipo === "no_vencimento" ? "No Venc." : "Após Venc.",
          h.canal,
          h.valor ? fmt(h.valor) : "—",
          h.status,
        ]),
        theme: "striped",
        headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: "bold", fontSize: 8 },
        styles: { fontSize: 7, cellPadding: 3 },
      });
    }

    doc.save("relatorio-regua-cobranca.pdf");
    toast({ title: "Relatório PDF exportado!" });
  };

  const totalVencido = useMemo(() => contasVencidas.reduce((s, c) => s + Number(c.valor), 0), [contasVencidas]);
  const totalAVencer = useMemo(() => contasAVencer.reduce((s, c) => s + Number(c.valor), 0), [contasAVencer]);

  // Hook de automação de cobrança
  const todasContas = useMemo(() => [...contasVencidas, ...contasAVencer], [contasVencidas, contasAVencer]);
  const {
    acoesPendentes,
    acoesHoje,
    clientesScore,
    stats: statsAutomacao,
    executarAcao,
    executarTodasAcoes,
    isLoading: isLoadingAutomacao,
    progresso: progressoAutomacao,
  } = useReguaCobrancaAutomatica(todasContas, historico);

  const filteredVencidas = useMemo(() => contasVencidas.filter(c => {
    if (filterDataDe && c.data_vencimento < filterDataDe) return false;
    if (filterDataAte && c.data_vencimento > filterDataAte) return false;
    return true;
  }), [contasVencidas, filterDataDe, filterDataAte]);

  const filteredAVencer = useMemo(() => contasAVencer.filter(c => {
    if (filterDataDe && c.data_vencimento < filterDataDe) return false;
    if (filterDataAte && c.data_vencimento > filterDataAte) return false;
    return true;
  }), [contasAVencer, filterDataDe, filterDataAte]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Régua de Cobrança
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie lembretes automáticos de cobrança para seus clientes</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
            onClick={() => navigate("/consulta-cnpj-cpf")}
          >
            <ShieldCheck className="h-4 w-4" />
            Consultar Score Interno
          </Button>
          <Button onClick={exportarPDF} className="gap-2">
            <FileDown className="h-4 w-4" />
            Exportar Relatório PDF
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contas Vencidas</p>
                <p className="text-xl font-bold text-destructive">{contasVencidas.length}</p>
                <p className="text-xs text-muted-foreground">{fmt(totalVencido)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">A Vencer</p>
                <p className="text-xl font-bold text-amber-600">{contasAVencer.length}</p>
                <p className="text-xs text-muted-foreground">{fmt(totalAVencer)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Send className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lembretes Enviados</p>
                <p className="text-xl font-bold text-primary">{historico.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Régua</p>
                <p className="text-xl font-bold text-emerald-600">{config.ativo ? "Ativa" : "Inativa"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard" className="gap-2"><BarChart3 className="h-4 w-4" /> Dashboard</TabsTrigger>
          <TabsTrigger value="contas">Contas Pendentes</TabsTrigger>
          <TabsTrigger value="configuracao">Configuração</TabsTrigger>
          <TabsTrigger value="historico">Histórico de Envios</TabsTrigger>
        </TabsList>

        {/* Dashboard de Automação */}
        <TabsContent value="dashboard">
          <DashboardCobranca
            stats={statsAutomacao}
            clientesScore={clientesScore}
            acoesPendentes={acoesPendentes}
            acoesHoje={acoesHoje}
            onExecutarTodas={executarTodasAcoes}
            onExecutarAcao={executarAcao}
            isLoading={isLoadingAutomacao}
            progresso={progressoAutomacao}
          />
        </TabsContent>

        {/* Contas Pendentes */}
        <TabsContent value="contas" className="space-y-6">
          {/* Filtro de datas */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                <div>
                  <Label className="text-xs text-muted-foreground">Vencimento De</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 text-xs", !filterDataDe && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filterDataDe ? format(parse(filterDataDe, "yyyy-MM-dd", new Date()), "dd/MM/yyyy") : "Data início"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={filterDataDe ? parse(filterDataDe, "yyyy-MM-dd", new Date()) : undefined} onSelect={(date) => setFilterDataDe(date ? format(date, "yyyy-MM-dd") : "")} locale={ptBR} className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Vencimento Até</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 text-xs", !filterDataAte && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filterDataAte ? format(parse(filterDataAte, "yyyy-MM-dd", new Date()), "dd/MM/yyyy") : "Data fim"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={filterDataAte ? parse(filterDataAte, "yyyy-MM-dd", new Date()) : undefined} onSelect={(date) => setFilterDataAte(date ? format(date, "yyyy-MM-dd") : "")} locale={ptBR} className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Button variant="outline" size="sm" onClick={() => { setFilterDataDe(""); setFilterDataAte(""); }}>Limpar Filtros</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vencidas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Contas Vencidas ({filteredVencidas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredVencidas.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">Nenhuma conta vencida 🎉</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Atraso</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVencidas.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.descricao}</TableCell>
                        <TableCell>{c.clientes?.nome || "—"}</TableCell>
                        <TableCell>{fmt(c.valor)}</TableCell>
                        <TableCell>{fmtDate(c.data_vencimento)}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{Math.abs(c.dias_diff)} dia(s)</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5"
                              onClick={() => abrirDialogEmail(c, "apos_vencimento")}
                            >
                              <Mail className="h-3.5 w-3.5" />
                              Cobrar
                            </Button>
                            {c.cliente_id && (
                              <Button
                                size="sm"
                                className="gap-1.5 bg-primary hover:bg-primary/90"
                                onClick={() => excluirCliente(c.cliente_id, c.clientes?.nome || "Cliente")}
                                title="Excluir cliente da régua"
                              >
                                <UserX className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
           </Card>

          {/* A Vencer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-amber-600 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Contas a Vencer ({filteredAVencer.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredAVencer.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">Nenhuma conta a vencer</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Dias Restantes</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAVencer.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.descricao}</TableCell>
                        <TableCell>{c.clientes?.nome || "—"}</TableCell>
                        <TableCell>{fmt(c.valor)}</TableCell>
                        <TableCell>{fmtDate(c.data_vencimento)}</TableCell>
                        <TableCell>
                          <Badge variant={c.dias_diff <= 3 ? "secondary" : "outline"}>
                            {c.dias_diff} dia(s)
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5"
                              onClick={() => abrirDialogEmail(c, c.dias_diff === 0 ? "no_vencimento" : "antes_vencimento")}
                            >
                              <Mail className="h-3.5 w-3.5" />
                              Lembrar
                            </Button>
                            {c.cliente_id && (
                              <Button
                                size="sm"
                                className="gap-1.5 bg-primary hover:bg-primary/90"
                                onClick={() => excluirCliente(c.cliente_id, c.clientes?.nome || "Cliente")}
                                title="Excluir cliente da régua"
                              >
                                <UserX className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Clientes Excluídos */}
          {Object.keys(clientesExcluidos).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm">
                  <UserX className="h-4 w-4" />
                  Clientes Excluídos da Régua ({Object.keys(clientesExcluidos).length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(clientesExcluidos).map(([clienteId, nome]) => (
                    <Badge key={clienteId} variant="outline" className="gap-1.5 py-1.5 px-3 cursor-pointer hover:bg-accent" onClick={() => reincluirCliente(clienteId)}>
                      {nome} ✕ Reincluir
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Clique para reincluir o cliente na régua de cobrança</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Configuração */}
        <TabsContent value="configuracao">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Configuração da Régua</span>
                <div className="flex items-center gap-2">
                  <Label htmlFor="regua-ativa" className="text-sm">Ativa</Label>
                  <Switch
                    id="regua-ativa"
                    checked={config.ativo}
                    onCheckedChange={(v) => setConfig({ ...config, ativo: v })}
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Lembrete 1 — Dias Antes</Label>
                  <Input
                    type="number"
                    min={1}
                    value={config.dias_antes_1}
                    onChange={(e) => setConfig({ ...config, dias_antes_1: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Lembrete 2 — Dias Antes</Label>
                  <Input
                    type="number"
                    min={1}
                    value={config.dias_antes_2}
                    onChange={(e) => setConfig({ ...config, dias_antes_2: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={config.dias_no_vencimento}
                    onCheckedChange={(v) => setConfig({ ...config, dias_no_vencimento: v })}
                  />
                  <Label className="text-sm">Enviar no dia do vencimento</Label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Cobrança 1 — Dias Após</Label>
                  <Input
                    type="number"
                    min={1}
                    value={config.dias_apos_1}
                    onChange={(e) => setConfig({ ...config, dias_apos_1: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Cobrança 2 — Dias Após</Label>
                  <Input
                    type="number"
                    min={1}
                    value={config.dias_apos_2}
                    onChange={(e) => setConfig({ ...config, dias_apos_2: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Cobrança 3 — Dias Após</Label>
                  <Input
                    type="number"
                    min={1}
                    value={config.dias_apos_3}
                    onChange={(e) => setConfig({ ...config, dias_apos_3: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Mensagem — Antes do Vencimento</Label>
                  <Textarea
                    value={config.mensagem_antes}
                    onChange={(e) => setConfig({ ...config, mensagem_antes: e.target.value })}
                    rows={3}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Variáveis: {"{valor}"}, {"{data_vencimento}"}, {"{dias}"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Mensagem — No Dia do Vencimento</Label>
                  <Textarea
                    value={config.mensagem_vencimento}
                    onChange={(e) => setConfig({ ...config, mensagem_vencimento: e.target.value })}
                    rows={3}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Mensagem — Após Vencimento</Label>
                  <Textarea
                    value={config.mensagem_apos}
                    onChange={(e) => setConfig({ ...config, mensagem_apos: e.target.value })}
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>

              <Button onClick={saveConfig} disabled={saving} className="gap-2">
                <Save className="h-4 w-4" />
                {saving ? "Salvando..." : "Salvar Configuração"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Cobranças Enviadas</CardTitle>
            </CardHeader>
            <CardContent>
              {historico.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">Nenhuma cobrança enviada ainda</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Canal</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historico.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell>{new Date(h.created_at).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>{h.cliente_nome || "—"}</TableCell>
                        <TableCell className="text-xs">{h.cliente_email || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={h.tipo === "apos_vencimento" ? "destructive" : "secondary"}>
                            {h.tipo === "antes_vencimento" ? "Antes Venc." : h.tipo === "no_vencimento" ? "No Venc." : "Após Venc."}
                          </Badge>
                        </TableCell>
                        <TableCell>{h.canal}</TableCell>
                        <TableCell>{h.valor ? fmt(h.valor) : "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{h.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={async () => {
                              const { error } = await (supabase.from("cobranca_historico") as any).delete().eq("id", h.id);
                              if (error) {
                                toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
                              } else {
                                setHistorico((prev) => prev.filter((item) => item.id !== h.id));
                                toast({ title: "Registro excluído com sucesso!" });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para inserir/editar e-mail antes de enviar */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Confirmar E-mail para Envio
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {contaParaEnvio && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Cliente:</strong> {contaParaEnvio.clientes?.nome || "—"}</p>
                <p><strong>Valor:</strong> {fmt(contaParaEnvio.valor)}</p>
                <p><strong>Vencimento:</strong> {fmtDate(contaParaEnvio.data_vencimento)}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email-cobranca">E-mail do destinatário</Label>
              <Input
                id="email-cobranca"
                type="email"
                placeholder="email@exemplo.com"
                value={emailParaEnvio}
                onChange={(e) => setEmailParaEnvio(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarEnvio} disabled={!emailParaEnvio.trim()} className="gap-1.5">
              <Send className="h-4 w-4" />
              Enviar Cobrança
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
