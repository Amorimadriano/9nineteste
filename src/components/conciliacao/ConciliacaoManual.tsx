import { useState, useMemo } from "react";
import { useTableQuery, useTableMutation } from "@/hooks/useSupabaseQuery";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { syncContaPagarExtrato, syncContaReceberExtrato } from "@/lib/extratoSync";
import { CheckCircle2, XCircle, Link2, Unlink, Scale, AlertTriangle, Plus, Trash2, RefreshCw, FlagTriangleRight, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

interface Props {
  bancos: any[];
}

export default function ConciliacaoManual({ bancos }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: extrato = [] } = useTableQuery("extrato_bancario");
  const { data: lancamentos = [] } = useTableQuery("lancamentos_caixa");
  const { data: contasReceber = [] } = useTableQuery("contas_receber");
  const { data: contasPagar = [] } = useTableQuery("contas_pagar");

  const [filterBanco, setFilterBanco] = useState("todos");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>(undefined);
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>(undefined);
  const [matchingItemId, setMatchingItemId] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [newTx, setNewTx] = useState({
    banco_id: "",
    data: new Date().toISOString().slice(0, 10),
    descricao: "",
    valor: "",
    tipo: "saida" as "entrada" | "saida",
  });
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const bancosAtivos = useMemo(() => bancos.filter((b: any) => b.ativo && b.tipo === "banco"), [bancos]);
  const bancoIds = useMemo(() => new Set(bancosAtivos.map((b: any) => b.id)), [bancosAtivos]);

  const filtered = useMemo(() => {
    return (extrato as any[]).filter(item => {
      if (!bancoIds.has(item.banco_cartao_id)) return false;
      if (filterBanco !== "todos" && item.banco_cartao_id !== filterBanco) return false;
      if (filterStatus === "conciliado" && !item.conciliado) return false;
      if (filterStatus === "pendente" && item.conciliado) return false;
      if (filterDateFrom) {
        const itemDate = new Date(item.data_transacao + "T00:00:00");
        if (itemDate < filterDateFrom) return false;
      }
      if (filterDateTo) {
        const itemDate = new Date(item.data_transacao + "T00:00:00");
        if (itemDate > filterDateTo) return false;
      }
      return true;
    }).sort((a, b) => (a.data_transacao > b.data_transacao ? -1 : 1));
  }, [extrato, filterBanco, filterStatus, bancoIds, filterDateFrom, filterDateTo]);

  const matchableItems = useMemo(() => {
    const items: any[] = [];

    (lancamentos as any[]).forEach((l: any) => {
      items.push({
        id: l.id,
        tipo_match: "lancamento",
        data: l.data_lancamento,
        descricao: l.descricao,
        valor: Number(l.valor),
        tipo: l.tipo,
      });
    });

    (contasReceber as any[]).filter((c: any) => c.status === "pendente" || c.status === "vencido").forEach((c: any) => {
      items.push({
        id: c.id,
        tipo_match: "conta_receber",
        data: c.data_vencimento,
        descricao: c.descricao,
        valor: Number(c.valor),
        tipo: "entrada",
      });
    });

    (contasPagar as any[]).filter((c: any) => c.status === "pendente" || c.status === "vencido").forEach((c: any) => {
      items.push({
        id: c.id,
        tipo_match: "conta_pagar",
        data: c.data_vencimento,
        descricao: c.descricao,
        valor: Number(c.valor),
        tipo: "saida",
      });
    });

    return items.sort((a, b) => (a.data > b.data ? 1 : a.data < b.data ? -1 : 0));
  }, [lancamentos, contasReceber, contasPagar]);

  const handleMatch = async (extratoId: string, matchItem: any, extratoValor: number) => {
    if (Math.abs(extratoValor - matchItem.valor) >= 0.01) {
      toast({
        title: "Valores divergentes",
        description: `Extrato: ${fmt(extratoValor)} ≠ Sistema: ${fmt(matchItem.valor)}. Corrija o valor antes de conciliar.`,
        variant: "destructive",
      });
      return;
    }

    const updateData: any = { conciliado: true };
    if (matchItem.tipo_match === "lancamento") updateData.lancamento_id = matchItem.id;
    else if (matchItem.tipo_match === "conta_receber") updateData.conta_receber_id = matchItem.id;
    else if (matchItem.tipo_match === "conta_pagar") updateData.conta_pagar_id = matchItem.id;

    const { error } = await (supabase.from("extrato_bancario") as any)
      .update(updateData)
      .eq("id", extratoId);

    if (error) {
      toast({ title: "Erro ao conciliar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Transação conciliada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });
    }
    setMatchingItemId(null);
  };

  const handleUnconciliar = async (extratoId: string) => {
    const { error } = await (supabase.from("extrato_bancario") as any)
      .update({ conciliado: false, lancamento_id: null, conta_receber_id: null, conta_pagar_id: null })
      .eq("id", extratoId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Conciliação desfeita" });
      queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });
    }
  };

  const handleConciliarDireto = async (extratoId: string) => {
    const { error } = await (supabase.from("extrato_bancario") as any)
      .update({ conciliado: true })
      .eq("id", extratoId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Marcado como conciliado" });
      queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });
    }
  };

  const handleAddTx = async () => {
    if (!newTx.banco_id || !newTx.descricao || !newTx.valor) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await (supabase.from("extrato_bancario") as any).insert({
      user_id: user!.id,
      banco_cartao_id: newTx.banco_id,
      data_transacao: newTx.data,
      descricao: newTx.descricao,
      valor: parseFloat(newTx.valor),
      tipo: newTx.tipo,
      origem: "manual",
    });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao adicionar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Transação adicionada!" });
      queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });
      setShowAdd(false);
      setNewTx({ banco_id: "", data: new Date().toISOString().slice(0, 10), descricao: "", valor: "", tipo: "saida" });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase.from("extrato_bancario") as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Transação excluída" });
      queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });
    }
  };

  const handleSyncContas = async () => {
    if (!user) return;
    if (bancosAtivos.length === 0) {
      toast({ title: "Cadastre um banco primeiro", variant: "destructive" });
      return;
    }

    setSyncing(true);

    const now = new Date();
    const mesAtual = now.getMonth();
    const anoAtual = now.getFullYear();

    const contasPagarDoMes = (contasPagar as any[]).filter((conta: any) => {
      const vencimento = new Date(conta.data_vencimento + "T00:00:00");
      const ehCartao = conta.forma_pagamento === "cartao_credito" || conta.forma_pagamento === "cartao_debito";
      return !ehCartao && vencimento.getMonth() === mesAtual && vencimento.getFullYear() === anoAtual;
    });

    const contasReceberDoMes = (contasReceber as any[]).filter((conta: any) => {
      const vencimento = new Date(conta.data_vencimento + "T00:00:00");
      const ehCartao = conta.forma_pagamento === "cartao_credito" || conta.forma_pagamento === "cartao_debito";
      return !ehCartao && vencimento.getMonth() === mesAtual && vencimento.getFullYear() === anoAtual;
    });

    const totalContas = contasPagarDoMes.length + contasReceberDoMes.length;
    if (totalContas === 0) {
      setSyncing(false);
      toast({ title: "Nenhuma conta bancária do mês para sincronizar" });
      return;
    }

    const resultados = await Promise.all([
      ...contasPagarDoMes.map((conta: any) =>
        syncContaPagarExtrato(user.id, conta.id, {
          descricao: conta.descricao,
          valor: Number(conta.valor),
          data_vencimento: conta.data_vencimento,
          status: conta.status,
          data_pagamento: conta.data_pagamento,
          forma_pagamento: conta.forma_pagamento,
        })
      ),
      ...contasReceberDoMes.map((conta: any) =>
        syncContaReceberExtrato(user.id, conta.id, {
          descricao: conta.descricao,
          valor: Number(conta.valor),
          data_vencimento: conta.data_vencimento,
          status: conta.status,
          data_recebimento: conta.data_recebimento,
          forma_pagamento: conta.forma_pagamento,
        })
      ),
    ]);

    setSyncing(false);
    const sincronizadas = resultados.filter(Boolean).length;

    if (sincronizadas > 0) {
      toast({ title: `${sincronizadas} conta(s) bancária(s) do mês resincronizada(s)!` });
      queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });
    } else {
      toast({ title: "Nenhuma conta precisou ser resincronizada" });
    }
  };

  const bancosMap = Object.fromEntries(bancos.map((b: any) => [b.id, b.nome]));

  // Finalizar conciliação: marca todos pendentes como conciliados (somente se não há divergências)
  const hasDivergencias = useMemo(() => {
    const bancoIdSet = new Set(bancos.filter((b: any) => b.ativo && b.tipo === "banco").map((b: any) => b.id));
    const extratoBank = (extrato as any[]).filter(i => bancoIdSet.has(i.banco_cartao_id));
    const conciliados = extratoBank.filter(i => i.conciliado);
    // Check value mismatches on conciliated items
    for (const item of conciliados) {
      let sistemaValor: number | null = null;
      if (item.lancamento_id) {
        const lanc = (lancamentos as any[]).find(l => l.id === item.lancamento_id);
        if (lanc) sistemaValor = Number(lanc.valor);
      } else if (item.conta_receber_id) {
        const cr = (contasReceber as any[]).find(c => c.id === item.conta_receber_id);
        if (cr) sistemaValor = Number(cr.valor);
      } else if (item.conta_pagar_id) {
        const cp = (contasPagar as any[]).find(c => c.id === item.conta_pagar_id);
        if (cp) sistemaValor = Number(cp.valor);
      }
      if (sistemaValor !== null && Math.abs(Number(item.valor) - sistemaValor) >= 0.01) return true;
    }
    return false;
  }, [extrato, bancos, lancamentos, contasReceber, contasPagar]);

  const handleFinalizarConciliacao = async () => {
    if (hasDivergencias) {
      toast({ title: "Existem divergências de valor", description: "Corrija todas as divergências antes de finalizar a conciliação.", variant: "destructive" });
      return;
    }
    const pendentes = filtered.filter(i => !i.conciliado);
    if (pendentes.length === 0) {
      toast({ title: "Todas as transações já estão conciliadas!" });
      return;
    }
    setFinalizing(true);
    let ok = 0;
    for (const item of pendentes) {
      const { error } = await (supabase.from("extrato_bancario") as any)
        .update({ conciliado: true })
        .eq("id", item.id);
      if (!error) ok++;
    }
    setFinalizing(false);
    toast({ title: `Conciliação finalizada! ${ok} transação(ões) conciliada(s).` });
    queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });
  };

  const totalConciliados = filtered.filter(i => i.conciliado).length;
  const totalPendentes = filtered.filter(i => !i.conciliado).length;

  // Divergence analysis: compare bank extrato vs system records linked to bank
  const divergencias = useMemo(() => {
    const bancoIds = new Set(bancosAtivos.map((b: any) => b.id));
    const extratoBank = (extrato as any[]).filter(i => bancoIds.has(i.banco_cartao_id));
    
    const extratoEntradas = extratoBank.filter(i => i.tipo === "entrada").reduce((s, i) => s + Number(i.valor), 0);
    const extratoSaidas = extratoBank.filter(i => i.tipo === "saida").reduce((s, i) => s + Number(i.valor), 0);
    const saldoExtrato = extratoEntradas - extratoSaidas;

    // Only count lancamentos/contas that are linked to bank extrato entries
    const linkedLancIds = new Set(extratoBank.filter(i => i.lancamento_id).map(i => i.lancamento_id));
    const linkedCrIds = new Set(extratoBank.filter(i => i.conta_receber_id).map(i => i.conta_receber_id));
    const linkedCpIds = new Set(extratoBank.filter(i => i.conta_pagar_id).map(i => i.conta_pagar_id));

    const lancLinked = (lancamentos as any[]).filter((l: any) => linkedLancIds.has(l.id));
    const crLinked = (contasReceber as any[]).filter((c: any) => linkedCrIds.has(c.id));
    const cpLinked = (contasPagar as any[]).filter((c: any) => linkedCpIds.has(c.id));

    const sistemaEntradas = 
      lancLinked.filter(l => l.tipo === "entrada").reduce((s, l) => s + Number(l.valor), 0) +
      crLinked.reduce((s, c) => s + Number(c.valor), 0);
    const sistemaSaidas = 
      lancLinked.filter(l => l.tipo === "saida").reduce((s, l) => s + Number(l.valor), 0) +
      cpLinked.reduce((s, c) => s + Number(c.valor), 0);
    const saldoSistema = sistemaEntradas - sistemaSaidas;

    const diferenca = saldoExtrato - saldoSistema;

    // Items in extrato without match in system
    const semVinculo = extratoBank.filter(i => !i.conciliado && !i.lancamento_id && !i.conta_receber_id && !i.conta_pagar_id);

    // Conciliated items with value mismatch
    const comDivergenciaValor: any[] = [];
    extratoBank.filter(i => i.conciliado).forEach((item: any) => {
      let sistemaValor: number | null = null;
      let sistemaDesc = "";
      if (item.lancamento_id) {
        const lanc = (lancamentos as any[]).find(l => l.id === item.lancamento_id);
        if (lanc) { sistemaValor = Number(lanc.valor); sistemaDesc = lanc.descricao; }
      } else if (item.conta_receber_id) {
        const cr = (contasReceber as any[]).find(c => c.id === item.conta_receber_id);
        if (cr) { sistemaValor = Number(cr.valor); sistemaDesc = cr.descricao; }
      } else if (item.conta_pagar_id) {
        const cp = (contasPagar as any[]).find(c => c.id === item.conta_pagar_id);
        if (cp) { sistemaValor = Number(cp.valor); sistemaDesc = cp.descricao; }
      }
      if (sistemaValor !== null && Math.abs(Number(item.valor) - sistemaValor) >= 0.01) {
        comDivergenciaValor.push({
          id: item.id,
          descricao: item.descricao,
          dataExtrato: item.data_transacao,
          valorExtrato: Number(item.valor),
          valorSistema: sistemaValor,
          diferenca: Number(item.valor) - sistemaValor,
          sistemaDesc,
        });
      }
    });

    return { saldoExtrato, saldoSistema, diferenca, semVinculo, comDivergenciaValor, extratoEntradas, extratoSaidas, sistemaEntradas, sistemaSaidas };
  }, [extrato, lancamentos, contasReceber, contasPagar, bancosAtivos]);

  return (
    <div className="space-y-4">
      {/* Painel de Divergências */}
      {(Math.abs(divergencias.diferenca) >= 0.01 || divergencias.comDivergenciaValor.length > 0 || divergencias.semVinculo.length > 0) && (
        <Card className="border-orange-300 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <AlertTriangle className="h-5 w-5" /> Divergências Detectadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Saldo comparison */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-lg border p-3 bg-background">
                <p className="text-[10px] text-muted-foreground">Saldo Extrato Bancário</p>
                <p className="text-sm font-bold">{fmt(divergencias.saldoExtrato)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Entradas: {fmt(divergencias.extratoEntradas)} | Saídas: {fmt(divergencias.extratoSaidas)}</p>
              </div>
              <div className="rounded-lg border p-3 bg-background">
                <p className="text-[10px] text-muted-foreground">Saldo Sistema (Lançamentos)</p>
                <p className="text-sm font-bold">{fmt(divergencias.saldoSistema)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Entradas: {fmt(divergencias.sistemaEntradas)} | Saídas: {fmt(divergencias.sistemaSaidas)}</p>
              </div>
              <div className={`rounded-lg border p-3 ${Math.abs(divergencias.diferenca) >= 0.01 ? "bg-red-50 dark:bg-red-950/30 border-red-300" : "bg-green-50 dark:bg-green-950/30 border-green-300"}`}>
                <p className="text-[10px] text-muted-foreground">Diferença</p>
                <p className={`text-sm font-bold ${Math.abs(divergencias.diferenca) >= 0.01 ? "text-red-600" : "text-green-600"}`}>
                  {fmt(divergencias.diferenca)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {Math.abs(divergencias.diferenca) < 0.01 ? "✓ Saldos conferem" : "⚠ Saldos divergentes"}
                </p>
              </div>
            </div>

            {/* Transações sem vínculo */}
            {divergencias.semVinculo.length > 0 && (
              <div>
                <p className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-1">
                  {divergencias.semVinculo.length} transação(ões) no extrato sem vínculo no sistema
                </p>
              </div>
            )}

            {/* Value mismatches */}
            {divergencias.comDivergenciaValor.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-600 mb-1">
                  {divergencias.comDivergenciaValor.length} transação(ões) com divergência de valor
                </p>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Data</TableHead>
                        <TableHead className="text-xs">Descrição Extrato</TableHead>
                        <TableHead className="text-xs text-right">Valor Extrato</TableHead>
                        <TableHead className="text-xs text-right">Valor Sistema</TableHead>
                        <TableHead className="text-xs text-right">Diferença</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {divergencias.comDivergenciaValor.map((d: any) => (
                        <TableRow key={d.id}>
                          <TableCell className="text-xs">{fmtDate(d.dataExtrato)}</TableCell>
                          <TableCell className="text-xs">{d.descricao}</TableCell>
                          <TableCell className="text-xs text-right">{fmt(d.valorExtrato)}</TableCell>
                          <TableCell className="text-xs text-right">{fmt(d.valorSistema)}</TableCell>
                          <TableCell className="text-xs text-right font-bold text-red-600">{fmt(d.diferenca)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Banco</label>
              <Select value={filterBanco} onValueChange={setFilterBanco}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os bancos</SelectItem>
                  {bancosAtivos.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="conciliado">Conciliados</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">De</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !filterDateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterDateFrom ? format(filterDateFrom, "dd/MM/yyyy") : "Data início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={filterDateFrom} onSelect={setFilterDateFrom} locale={ptBR} className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Até</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !filterDateTo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterDateTo ? format(filterDateTo, "dd/MM/yyyy") : "Data fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={filterDateTo} onSelect={setFilterDateTo} locale={ptBR} className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-end gap-2 flex-wrap">
              {(filterDateFrom || filterDateTo) && (
                <Button size="sm" variant="ghost" onClick={() => { setFilterDateFrom(undefined); setFilterDateTo(undefined); }}>
                  Limpar datas
                </Button>
              )}
              <Badge variant="outline" className="py-2">
                <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" /> {totalConciliados} conciliados
              </Badge>
              <Badge variant="outline" className="py-2">
                <XCircle className="h-3 w-3 mr-1 text-yellow-500" /> {totalPendentes} pendentes
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add manual + Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">Extrato Bancário ({filtered.length} registros)</CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={handleSyncContas} disabled={syncing}>
              <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Sincronizando..." : "Sincronizar Contas do Mês"}
            </Button>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleFinalizarConciliacao}
              disabled={finalizing || totalPendentes === 0 || hasDivergencias}
              title={hasDivergencias ? "Corrija as divergências antes de finalizar" : "Marcar todas as transações pendentes como conciliadas"}
            >
              <FlagTriangleRight className="h-4 w-4 mr-1" />
              {finalizing ? "Finalizando..." : "Finalizar Conciliação"}
            </Button>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Adicionar Manual</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Adicionar Transação Manual</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Banco</Label>
                  <Select value={newTx.banco_id} onValueChange={(v) => setNewTx({ ...newTx, banco_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione o banco" /></SelectTrigger>
                    <SelectContent>
                      {bancosAtivos.map((b: any) => (
                        <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Data</Label><Input type="date" value={newTx.data} onChange={(e) => setNewTx({ ...newTx, data: e.target.value })} /></div>
                  <div>
                    <Label>Tipo</Label>
                    <Select value={newTx.tipo} onValueChange={(v: any) => setNewTx({ ...newTx, tipo: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada</SelectItem>
                        <SelectItem value="saida">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Descrição</Label><Input value={newTx.descricao} onChange={(e) => setNewTx({ ...newTx, descricao: e.target.value })} placeholder="Ex: Pagamento fornecedor" /></div>
                <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={newTx.valor} onChange={(e) => setNewTx({ ...newTx, valor: e.target.value })} /></div>
                <Button onClick={handleAddTx} className="w-full" disabled={saving || !newTx.banco_id || !newTx.descricao || !newTx.valor}>
                  {saving ? "Salvando..." : "Adicionar Transação"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    <Scale className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    Nenhuma transação no extrato. Importe um arquivo OFX ou adicione manualmente.
                  </TableCell></TableRow>
                ) : (
                  filtered.map((item: any) => (
                    <TableRow key={item.id} className={!item.conciliado ? "bg-yellow-50/50" : ""}>
                      <TableCell>
                        {item.conciliado
                          ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                          : <XCircle className="h-5 w-5 text-yellow-500" />}
                      </TableCell>
                      <TableCell>{fmtDate(item.data_transacao)}</TableCell>
                      <TableCell className="text-xs">{bancosMap[item.banco_cartao_id] || "—"}</TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">{item.descricao}</TableCell>
                      <TableCell>
                        <Badge variant={item.tipo === "entrada" ? "default" : "destructive"}>
                          {item.tipo === "entrada" ? "Entrada" : "Saída"}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${item.tipo === "entrada" ? "text-green-600" : "text-red-600"}`}>
                        {fmt(Number(item.valor))}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {item.conciliado ? (
                            <Button size="sm" variant="ghost" onClick={() => handleUnconciliar(item.id)} title="Desfazer conciliação">
                              <Unlink className="h-4 w-4" />
                            </Button>
                          ) : (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => handleConciliarDireto(item.id)} title="Marcar como conciliado">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              </Button>
                              <Dialog open={matchingItemId === item.id} onOpenChange={(open) => setMatchingItemId(open ? item.id : null)}>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="ghost" title="Vincular a lançamento">
                                    <Link2 className="h-4 w-4 text-blue-500" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[500px] overflow-auto">
                                  <DialogHeader>
                                    <DialogTitle>Vincular transação: {item.descricao}</DialogTitle>
                                  </DialogHeader>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {fmtDate(item.data_transacao)} — {fmt(Number(item.valor))} ({item.tipo})
                                  </p>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                        <TableHead></TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {matchableItems
                                        .filter(m => m.tipo === item.tipo)
                                        .map(m => (
                                          <TableRow key={`${m.tipo_match}-${m.id}`}>
                                            <TableCell>
                                              <Badge variant="outline" className="text-xs">
                                                {m.tipo_match === "lancamento" ? "Lançamento" : m.tipo_match === "conta_receber" ? "A Receber" : "A Pagar"}
                                              </Badge>
                                            </TableCell>
                                            <TableCell>{fmtDate(m.data)}</TableCell>
                                            <TableCell className="font-medium">{m.descricao}</TableCell>
                                            <TableCell className="text-right">{fmt(m.valor)}</TableCell>
                                            <TableCell>
                                              {Math.abs(Number(item.valor) - m.valor) >= 0.01 ? (
                                                <Badge variant="destructive" className="text-[10px]">
                                                  <AlertTriangle className="h-3 w-3 mr-1" /> Valor divergente
                                                </Badge>
                                              ) : (
                                                <Button size="sm" onClick={() => handleMatch(item.id, m, Number(item.valor))}>
                                                  <Link2 className="h-3 w-3 mr-1" /> Vincular
                                                </Button>
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      {matchableItems.filter(m => m.tipo === item.tipo).length === 0 && (
                                        <TableRow>
                                          <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                                            Nenhum registro compatível encontrado
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </TableBody>
                                  </Table>
                                </DialogContent>
                              </Dialog>
                            </>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)} title="Excluir transação">
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
