import { useState, useMemo } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ArrowDownCircle, ArrowUpCircle, TrendingUp, TrendingDown, Receipt, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { addHeader, addFooter, drawKpiRow, tableTheme, COLORS } from "@/lib/pdfContasExport";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

export default function AuditoriaRecebiveis() {
  const { user } = useAuth();
  const [dataInicio, setDataInicio] = useState<Date | undefined>(undefined);
  const [dataFim, setDataFim] = useState<Date | undefined>(undefined);
  const [filtroAtivo, setFiltroAtivo] = useState(false);

  const { data: contasReceber = [] } = useQuery({
    queryKey: ["contas_receber", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase.from("contas_receber") as any)
        .select("*, categorias(nome), clientes(nome)")
        .order("data_vencimento", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: contasPagar = [] } = useQuery({
    queryKey: ["contas_pagar", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase.from("contas_pagar") as any)
        .select("*, categorias(nome), fornecedores(nome)")
        .order("data_vencimento", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: empresa } = useQuery({
    queryKey: ["empresa", user?.id],
    queryFn: async () => {
      const { data } = await (supabase.from("empresa") as any)
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const filteredReceber = useMemo(() => {
    if (!filtroAtivo || (!dataInicio && !dataFim)) return contasReceber;
    return contasReceber.filter((c: any) => {
      const d = new Date(c.data_vencimento + "T00:00:00");
      if (dataInicio && d < dataInicio) return false;
      if (dataFim && d > dataFim) return false;
      return true;
    });
  }, [contasReceber, dataInicio, dataFim, filtroAtivo]);

  const filteredPagar = useMemo(() => {
    if (!filtroAtivo || (!dataInicio && !dataFim)) return contasPagar;
    return contasPagar.filter((c: any) => {
      const d = new Date(c.data_vencimento + "T00:00:00");
      if (dataInicio && d < dataInicio) return false;
      if (dataFim && d > dataFim) return false;
      return true;
    });
  }, [contasPagar, dataInicio, dataFim, filtroAtivo]);

  const stats = useMemo(() => {
    const totalReceber = filteredReceber.reduce((s: number, c: any) => s + Number(c.valor || 0), 0);
    const recebido = filteredReceber.filter((c: any) => c.status === "recebido").reduce((s: number, c: any) => s + Number(c.valor || 0), 0);
    const pendenteReceber = filteredReceber.filter((c: any) => c.status === "pendente").reduce((s: number, c: any) => s + Number(c.valor || 0), 0);
    const vencidoReceber = filteredReceber.filter((c: any) => c.status === "pendente" && new Date(c.data_vencimento) < new Date()).reduce((s: number, c: any) => s + Number(c.valor || 0), 0);

    const totalPagar = filteredPagar.reduce((s: number, c: any) => s + Number(c.valor || 0), 0);
    const pago = filteredPagar.filter((c: any) => c.status === "pago").reduce((s: number, c: any) => s + Number(c.valor || 0), 0);
    const pendentePagar = filteredPagar.filter((c: any) => c.status === "pendente").reduce((s: number, c: any) => s + Number(c.valor || 0), 0);
    const vencidoPagar = filteredPagar.filter((c: any) => c.status === "pendente" && new Date(c.data_vencimento) < new Date()).reduce((s: number, c: any) => s + Number(c.valor || 0), 0);

    const saldo = recebido - pago;
    const saldoProjetado = totalReceber - totalPagar;

    return {
      totalReceber, recebido, pendenteReceber, vencidoReceber,
      totalPagar, pago, pendentePagar, vencidoPagar,
      saldo, saldoProjetado,
      qtdReceber: filteredReceber.length,
      qtdPagar: filteredPagar.length,
    };
  }, [filteredReceber, filteredPagar]);

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    let y = addHeader(doc, "Auditoria de Recebíveis e Pagamentos", empresa);

    // KPIs row 1
    y = drawKpiRow(doc, y, [
      { label: "Total Recebíveis", value: fmt(stats.totalReceber), color: COLORS.success },
      { label: "Recebido", value: fmt(stats.recebido), color: COLORS.success },
      { label: "Pendente (Receber)", value: fmt(stats.pendenteReceber), color: COLORS.warning },
    ]);

    // KPIs row 2
    y = drawKpiRow(doc, y, [
      { label: "Total Pagamentos", value: fmt(stats.totalPagar), color: COLORS.danger },
      { label: "Pago", value: fmt(stats.pago), color: COLORS.danger },
      { label: "Pendente (Pagar)", value: fmt(stats.pendentePagar), color: COLORS.warning },
    ]);

    // KPIs row 3 - saldos
    y = drawKpiRow(doc, y, [
      { label: "Saldo Realizado", value: fmt(stats.saldo), color: stats.saldo >= 0 ? COLORS.success : COLORS.danger },
      { label: "Saldo Projetado", value: fmt(stats.saldoProjetado), color: stats.saldoProjetado >= 0 ? COLORS.success : COLORS.danger },
    ]);

    // Recebíveis table
    const theme = tableTheme(COLORS.primary);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.primary);
    doc.text("CONTAS A RECEBER", 14, y);
    y += 4;

    const totalReceber = filteredReceber.reduce((s: number, c: any) => s + Number(c.valor), 0);
    autoTable(doc, {
      startY: y,
      head: [["Descrição", "Cliente", "Categoria", "Vencimento", "Valor", "Status"]],
      body: filteredReceber.map((c: any) => [
        c.descricao || "—", c.clientes?.nome || "—", c.categorias?.nome || "—",
        fmtDate(c.data_vencimento), fmt(Number(c.valor)),
        c.status === "recebido" ? "Recebido" : c.status === "pendente" ? "Pendente" : c.status,
      ]),
      foot: [["", "", "", "TOTAL", fmt(totalReceber), ""]],
      ...theme,
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    // Pagamentos table
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.primary);
    doc.text("CONTAS A PAGAR", 14, y);
    y += 4;

    const totalPagar = filteredPagar.reduce((s: number, c: any) => s + Number(c.valor), 0);
    autoTable(doc, {
      startY: y,
      head: [["Descrição", "Fornecedor", "Categoria", "Vencimento", "Valor", "Status"]],
      body: filteredPagar.map((c: any) => [
        c.descricao || "—", c.fornecedores?.nome || "—", c.categorias?.nome || "—",
        fmtDate(c.data_vencimento), fmt(Number(c.valor)),
        c.status === "pago" ? "Pago" : c.status === "pendente" ? "Pendente" : c.status,
      ]),
      foot: [["", "", "", "TOTAL", fmt(totalPagar), ""]],
      ...theme,
    });

    addFooter(doc, empresa);
    doc.save(`auditoria-recebiveis-pagamentos-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" /> Auditoria de Recebíveis e Pagamentos
          </h1>
          <p className="text-sm text-muted-foreground">Visão consolidada de entradas e saídas com cálculos automáticos</p>
        </div>
        <Button onClick={exportPDF} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <FileText className="h-4 w-4" /> Relatório PDF
        </Button>
      </div>

      {/* Date Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Data Início</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !dataInicio && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicio ? format(dataInicio, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dataInicio} onSelect={setDataInicio} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Data Fim</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !dataFim && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFim ? format(dataFim, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dataFim} onSelect={setDataFim} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            <Button onClick={() => setFiltroAtivo(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Search className="h-4 w-4" /> Buscar
            </Button>
            {filtroAtivo && (
              <Button variant="outline" size="sm" onClick={() => { setDataInicio(undefined); setDataFim(undefined); setFiltroAtivo(false); }}>
                Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card><CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownCircle className="h-4 w-4 text-green-600" />
            <p className="text-[10px] text-muted-foreground">Total Recebíveis</p>
          </div>
          <p className="text-sm font-bold text-green-600">{fmt(stats.totalReceber)}</p>
          <p className="text-[10px] text-muted-foreground">{stats.qtdReceber} lançamentos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <p className="text-[10px] text-muted-foreground">Recebido</p>
          <p className="text-sm font-bold text-green-600">{fmt(stats.recebido)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <p className="text-[10px] text-muted-foreground">Pendente (Receber)</p>
          <p className="text-sm font-bold text-yellow-600">{fmt(stats.pendenteReceber)}</p>
          {stats.vencidoReceber > 0 && <p className="text-[10px] text-red-500">Vencido: {fmt(stats.vencidoReceber)}</p>}
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpCircle className="h-4 w-4 text-red-600" />
            <p className="text-[10px] text-muted-foreground">Total Pagamentos</p>
          </div>
          <p className="text-sm font-bold text-red-600">{fmt(stats.totalPagar)}</p>
          <p className="text-[10px] text-muted-foreground">{stats.qtdPagar} lançamentos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <p className="text-[10px] text-muted-foreground">Pago</p>
          <p className="text-sm font-bold text-red-600">{fmt(stats.pago)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <p className="text-[10px] text-muted-foreground">Pendente (Pagar)</p>
          <p className="text-sm font-bold text-yellow-600">{fmt(stats.pendentePagar)}</p>
          {stats.vencidoPagar > 0 && <p className="text-[10px] text-red-500">Vencido: {fmt(stats.vencidoPagar)}</p>}
        </CardContent></Card>
      </div>

      {/* Saldo cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={`border-l-4 ${stats.saldo >= 0 ? "border-l-green-500" : "border-l-red-500"}`}>
          <CardContent className="pt-4 pb-4 flex items-center gap-4">
            {stats.saldo >= 0 ? <TrendingUp className="h-8 w-8 text-green-600" /> : <TrendingDown className="h-8 w-8 text-red-600" />}
            <div>
              <p className="text-xs text-muted-foreground">Saldo Realizado (Recebido - Pago)</p>
              <p className={`text-xl font-bold ${stats.saldo >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(stats.saldo)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${stats.saldoProjetado >= 0 ? "border-l-green-500" : "border-l-red-500"}`}>
          <CardContent className="pt-4 pb-4 flex items-center gap-4">
            {stats.saldoProjetado >= 0 ? <TrendingUp className="h-8 w-8 text-green-600" /> : <TrendingDown className="h-8 w-8 text-red-600" />}
            <div>
              <p className="text-xs text-muted-foreground">Saldo Projetado (Total Receber - Total Pagar)</p>
              <p className={`text-xl font-bold ${stats.saldoProjetado >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(stats.saldoProjetado)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recebíveis */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowDownCircle className="h-4 w-4 text-green-600" /> Contas a Receber
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceber.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma conta a receber</TableCell></TableRow>
                ) : filteredReceber.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm">{c.descricao}</TableCell>
                    <TableCell className="text-sm">{c.clientes?.nome || "—"}</TableCell>
                    <TableCell className="text-sm">{c.categorias?.nome || "—"}</TableCell>
                    <TableCell className="text-sm">{fmtDate(c.data_vencimento)}</TableCell>
                    <TableCell className="text-sm text-right font-medium text-green-600">{fmt(Number(c.valor))}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={c.status === "recebido" ? "bg-green-100 text-green-800 border-green-300" : c.status === "pendente" && new Date(c.data_vencimento) < new Date() ? "bg-red-100 text-red-800 border-red-300" : "bg-yellow-100 text-yellow-800 border-yellow-300"}>
                        {c.status === "recebido" ? "Recebido" : c.status === "pendente" && new Date(c.data_vencimento) < new Date() ? "Vencido" : "Pendente"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagamentos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowUpCircle className="h-4 w-4 text-red-600" /> Contas a Pagar
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPagar.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma conta a pagar</TableCell></TableRow>
                ) : filteredPagar.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm">{c.descricao}</TableCell>
                    <TableCell className="text-sm">{c.fornecedores?.nome || "—"}</TableCell>
                    <TableCell className="text-sm">{c.categorias?.nome || "—"}</TableCell>
                    <TableCell className="text-sm">{fmtDate(c.data_vencimento)}</TableCell>
                    <TableCell className="text-sm text-right font-medium text-red-600">{fmt(Number(c.valor))}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={c.status === "pago" ? "bg-green-100 text-green-800 border-green-300" : c.status === "pendente" && new Date(c.data_vencimento) < new Date() ? "bg-red-100 text-red-800 border-red-300" : "bg-yellow-100 text-yellow-800 border-yellow-300"}>
                        {c.status === "pago" ? "Pago" : c.status === "pendente" && new Date(c.data_vencimento) < new Date() ? "Vencido" : "Pendente"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
