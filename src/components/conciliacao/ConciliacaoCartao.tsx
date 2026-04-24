import { useState, useMemo } from "react";
import { useTableQuery } from "@/hooks/useSupabaseQuery";
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
import {
  CheckCircle2, XCircle, Link2, Unlink, CreditCard, Plus, Trash2,
  ArrowDownCircle, ArrowUpCircle, RefreshCw, DollarSign, CalendarIcon, FlagTriangleRight
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

interface Props {
  bancos: any[];
}

export default function ConciliacaoCartao({ bancos }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: extrato = [] } = useTableQuery("extrato_bancario");
  const { data: contasPagar = [] } = useTableQuery("contas_pagar");
  const { data: contasReceber = [] } = useTableQuery("contas_receber");
  const { data: lancamentos = [] } = useTableQuery("lancamentos_caixa");

  const [filterCartao, setFilterCartao] = useState("todos");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterDataDe, setFilterDataDe] = useState("");
  const [filterDataAte, setFilterDataAte] = useState("");
  const [matchingItemId, setMatchingItemId] = useState<string | null>(null);

  // New transaction dialog
  const [showAdd, setShowAdd] = useState(false);
  const [newTx, setNewTx] = useState({
    cartao_id: "",
    data: new Date().toISOString().slice(0, 10),
    descricao: "",
    valor: "",
    tipo: "saida" as "entrada" | "saida",
    parcelas: "1",
  });
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [salvandoConciliacao, setSalvandoConciliacao] = useState(false);

  // Filter only cards (credito/debito)
  const cartoes = useMemo(() =>
    bancos.filter((b: any) => b.ativo && (b.tipo === "cartao_credito" || b.tipo === "cartao_debito")),
    [bancos]
  );

  const cartoesMap = Object.fromEntries(cartoes.map((c: any) => [c.id, c]));

  // Filter extrato for cards only
  const extratoCartoes = useMemo(() => {
    return (extrato as any[]).filter(item => {
      const cartao = cartoesMap[item.banco_cartao_id];
      if (!cartao) return false;
      if (filterCartao !== "todos" && item.banco_cartao_id !== filterCartao) return false;
      if (filterStatus === "conciliado" && !item.conciliado) return false;
      if (filterStatus === "pendente" && item.conciliado) return false;
      if (filterDataDe && item.data_transacao < filterDataDe) return false;
      if (filterDataAte && item.data_transacao > filterDataAte) return false;
      return true;
    }).sort((a, b) => (a.data_transacao > b.data_transacao ? -1 : 1));
  }, [extrato, cartoesMap, filterCartao, filterStatus, filterDataDe, filterDataAte]);

  // Stats
  const stats = useMemo(() => {
    const items = extratoCartoes;
    const conciliados = items.filter(i => i.conciliado);
    const pendentes = items.filter(i => !i.conciliado);
    const totalCredito = items
      .filter(i => cartoesMap[i.banco_cartao_id]?.tipo === "cartao_credito")
      .reduce((s, i) => s + Number(i.valor), 0);
    const totalDebito = items
      .filter(i => cartoesMap[i.banco_cartao_id]?.tipo === "cartao_debito")
      .reduce((s, i) => s + Number(i.valor), 0);
    const gastos = items.filter(i => i.tipo === "saida").reduce((s, i) => s + Number(i.valor), 0);
    const recebimentos = items.filter(i => i.tipo === "entrada").reduce((s, i) => s + Number(i.valor), 0);
    return { conciliados: conciliados.length, pendentes: pendentes.length, totalCredito, totalDebito, gastos, recebimentos };
  }, [extratoCartoes, cartoesMap]);

  // Simple pending count for cards
  const semVinculo = useMemo(() => {
    const cartoesIds = new Set(cartoes.map((c: any) => c.id));
    return (extrato as any[]).filter(i => cartoesIds.has(i.banco_cartao_id) && !i.conciliado && !i.lancamento_id && !i.conta_receber_id && !i.conta_pagar_id);
  }, [extrato, cartoes]);

  // Matchable items
  const matchableItems = useMemo(() => {
    const items: any[] = [];
    (lancamentos as any[]).forEach((l: any) => {
      items.push({
        id: l.id, tipo_match: "lancamento", data: l.data_lancamento,
        descricao: l.descricao, valor: Number(l.valor), tipo: l.tipo,
      });
    });
    (contasReceber as any[]).filter((c: any) => c.status === "pendente" || c.status === "vencido").forEach((c: any) => {
      items.push({
        id: c.id, tipo_match: "conta_receber", data: c.data_vencimento,
        descricao: c.descricao, valor: Number(c.valor), tipo: "entrada",
      });
    });
    (contasPagar as any[]).filter((c: any) => c.status === "pendente" || c.status === "vencido").forEach((c: any) => {
      items.push({
        id: c.id, tipo_match: "conta_pagar", data: c.data_vencimento,
        descricao: c.descricao, valor: Number(c.valor), tipo: "saida",
      });
    });
    return items;
  }, [lancamentos, contasReceber, contasPagar]);

  const handleMatch = async (extratoId: string, matchItem: any) => {
    const updateData: any = { conciliado: true };
    if (matchItem.tipo_match === "lancamento") updateData.lancamento_id = matchItem.id;
    else if (matchItem.tipo_match === "conta_receber") updateData.conta_receber_id = matchItem.id;
    else if (matchItem.tipo_match === "conta_pagar") updateData.conta_pagar_id = matchItem.id;

    const { error } = await (supabase.from("extrato_bancario") as any)
      .update(updateData).eq("id", extratoId);

    if (error) {
      toast({ title: "Erro ao conciliar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Transação de cartão conciliada!" });
      queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });
    }
    setMatchingItemId(null);
  };

  const handleUnconciliar = async (id: string) => {
    const { error } = await (supabase.from("extrato_bancario") as any)
      .update({ conciliado: false, lancamento_id: null, conta_receber_id: null, conta_pagar_id: null })
      .eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Conciliação desfeita" });
      queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });
    }
  };

  const handleConciliarDireto = async (id: string) => {
    const { error } = await (supabase.from("extrato_bancario") as any)
      .update({ conciliado: true }).eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Marcado como conciliado" });
      queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });
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

  const handleAddTx = async () => {
    if (!newTx.cartao_id || !newTx.descricao || !newTx.valor) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setSaving(true);
    const totalParcelas = parseInt(newTx.parcelas) || 1;
    const valorTotal = parseFloat(newTx.valor);
    const valorParcela = Math.round((valorTotal / totalParcelas) * 100) / 100;
    const baseDate = new Date(newTx.data + "T00:00:00");

    let imported = 0;
    for (let i = 0; i < totalParcelas; i++) {
      const parcelaDate = new Date(baseDate);
      parcelaDate.setMonth(parcelaDate.getMonth() + i);
      const dataStr = parcelaDate.toISOString().slice(0, 10);
      const desc = totalParcelas > 1 ? `${newTx.descricao} (${i + 1}/${totalParcelas})` : newTx.descricao;

      const { error } = await (supabase.from("extrato_bancario") as any).insert({
        user_id: user!.id,
        banco_cartao_id: newTx.cartao_id,
        data_transacao: dataStr,
        descricao: desc,
        valor: valorParcela,
        tipo: newTx.tipo,
        origem: "manual",
        parcelas: totalParcelas,
        parcela_atual: i + 1,
      });
      if (!error) imported++;
    }
    setSaving(false);
    if (imported > 0) {
      toast({ title: `${imported} parcela(s) adicionada(s)!` });
      queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });
      setShowAdd(false);
      setNewTx({ cartao_id: "", data: new Date().toISOString().slice(0, 10), descricao: "", valor: "", tipo: "saida", parcelas: "1" });
    } else {
      toast({ title: "Erro ao adicionar transação", variant: "destructive" });
    }
  };

  // Sincronizar contas a pagar com cartão de crédito
  const handleSyncContasCartao = async () => {
    if (!user) return;
    setSyncing(true);

    const now = new Date();
    const mesAtual = now.getMonth();
    const anoAtual = now.getFullYear();

    const cartaoDefault = cartoes[0];
    if (!cartaoDefault) {
      toast({ title: "Cadastre um cartão primeiro", variant: "destructive" });
      setSyncing(false);
      return;
    }

    // IDs já no extrato
    const cpIdsExistentes = new Set((extrato as any[]).filter(e => e.conta_pagar_id).map(e => e.conta_pagar_id));

    // Contas a pagar que usam cartão de crédito, pendentes do mês
    const cpCartao = (contasPagar as any[]).filter((c: any) => {
      if (cpIdsExistentes.has(c.id)) return false;
      if (c.status !== "pendente" && c.status !== "vencido") return false;
      if (c.forma_pagamento !== "cartao_credito" && c.forma_pagamento !== "cartao_debito") return false;
      const venc = new Date(c.data_vencimento + "T00:00:00");
      return venc.getMonth() === mesAtual && venc.getFullYear() === anoAtual;
    });

    let imported = 0;
    for (const cp of cpCartao) {
      const { error } = await (supabase.from("extrato_bancario") as any).insert({
        user_id: user.id,
        banco_cartao_id: cartaoDefault.id,
        data_transacao: cp.data_vencimento,
        descricao: cp.descricao,
        valor: Number(cp.valor),
        tipo: "saida",
        origem: "sistema",
        conta_pagar_id: cp.id,
      });
      if (!error) imported++;
    }

    setSyncing(false);
    if (imported > 0) {
      toast({ title: `${imported} conta(s) de cartão sincronizada(s)!` });
      queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });
    } else {
      toast({ title: "Nenhuma conta de cartão nova para sincronizar neste mês" });
    }
  };

  const handleAutoConciliar = async () => {
    const pendentes = extratoCartoes.filter(i => !i.conciliado);
    let matched = 0;

    for (const item of pendentes) {
      // Try to find a matching conta_pagar or conta_receber
      const matchTarget = item.tipo === "saida"
        ? (contasPagar as any[]).find((c: any) =>
            (c.status === "pendente" || c.status === "vencido") &&
            Math.abs(Number(c.valor) - Number(item.valor)) < 0.01
          )
        : (contasReceber as any[]).find((c: any) =>
            (c.status === "pendente" || c.status === "vencido") &&
            Math.abs(Number(c.valor) - Number(item.valor)) < 0.01
          );

      if (matchTarget) {
        const updateData: any = { conciliado: true };
        if (item.tipo === "saida") updateData.conta_pagar_id = matchTarget.id;
        else updateData.conta_receber_id = matchTarget.id;

        const { error } = await (supabase.from("extrato_bancario") as any)
          .update(updateData).eq("id", item.id);
        if (!error) matched++;
      }
    }

    if (matched > 0) {
      toast({ title: `${matched} transação(ões) conciliada(s) automaticamente!` });
      queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });
    } else {
      toast({ title: "Nenhuma correspondência automática encontrada", variant: "destructive" });
    }
  };

  // Pagar fatura - marca todas transações pendentes do cartão selecionado como conciliadas
  const [showPagarFatura, setShowPagarFatura] = useState(false);
  const [pagandoFatura, setPagandoFatura] = useState(false);
  const [faturaCartaoId, setFaturaCartaoId] = useState("");

  // Fechamento de fatura
  const [showFechamento, setShowFechamento] = useState(false);
  const [fechamentoCartaoId, setFechamentoCartaoId] = useState("");
  const [fechamentoData, setFechamentoData] = useState(new Date().toISOString().slice(0, 10));
  const [fechando, setFechando] = useState(false);
  const [fechamentoDataPorCartao, setFechamentoDataPorCartao] = useState<Record<string, string>>({});
  const [fechandoCartaoId, setFechandoCartaoId] = useState<string | null>(null);

  // Datas de fechamento editáveis por cartão (armazenadas localmente)
  const [diasFechamento, setDiasFechamento] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("cartao_dias_fechamento");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const saveDiaFechamento = (cartaoId: string, dia: number) => {
    const updated = { ...diasFechamento, [cartaoId]: dia };
    setDiasFechamento(updated);
    localStorage.setItem("cartao_dias_fechamento", JSON.stringify(updated));
  };

  const handleFechamentoFatura = async () => {
    if (!fechamentoCartaoId || !user) {
      toast({ title: "Selecione o cartão", variant: "destructive" });
      return;
    }
    setFechando(true);

    const diaFech = diasFechamento[fechamentoCartaoId] || 25;
    // Pegar todas as transações pendentes do cartão até a data de fechamento
    const pendentes = (extrato as any[]).filter(
      i => i.banco_cartao_id === fechamentoCartaoId && !i.conciliado && i.data_transacao <= fechamentoData
    );

    let count = 0;
    for (const item of pendentes) {
      const { error } = await (supabase.from("extrato_bancario") as any)
        .update({ conciliado: true }).eq("id", item.id);
      if (!error) count++;
    }

    const totalFechamento = pendentes.reduce((s, i) => s + (i.tipo === "saida" ? Number(i.valor) : -Number(i.valor)), 0);

    if (count > 0 && totalFechamento > 0) {
      const cartaoNome = cartoesMap[fechamentoCartaoId]?.nome || "Cartão";
      await (supabase.from("lancamentos_caixa") as any).insert({
        user_id: user.id,
        descricao: `Fechamento fatura ${cartaoNome} - ${fmtDate(fechamentoData)}`,
        valor: totalFechamento,
        tipo: "saida",
        data_lancamento: fechamentoData,
        observacoes: `Fatura fechada com ${count} transação(ões). Dia de fechamento: ${diaFech}`,
      });
    }

    setFechando(false);
    if (count > 0) {
      toast({ title: `Fatura fechada! ${count} transação(ões) conciliada(s) até ${fmtDate(fechamentoData)}.` });
      queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });
      queryClient.invalidateQueries({ queryKey: ["lancamentos_caixa"] });
    } else {
      toast({ title: "Nenhuma transação pendente até a data de fechamento" });
    }
    setShowFechamento(false);
  };
  const handleFechamentoRapido = async (cartaoId: string, dataFech: string) => {
    if (!user) return;
    setFechandoCartaoId(cartaoId);

    const pendentes = (extrato as any[]).filter(
      i => i.banco_cartao_id === cartaoId && !i.conciliado && i.data_transacao <= dataFech
    );

    let count = 0;
    for (const item of pendentes) {
      const { error } = await (supabase.from("extrato_bancario") as any)
        .update({ conciliado: true }).eq("id", item.id);
      if (!error) count++;
    }

    const totalFech = pendentes.reduce((s, i) => s + (i.tipo === "saida" ? Number(i.valor) : -Number(i.valor)), 0);

    if (count > 0 && totalFech > 0) {
      const cartaoNome = cartoesMap[cartaoId]?.nome || "Cartão";
      await (supabase.from("lancamentos_caixa") as any).insert({
        user_id: user.id,
        descricao: `Fechamento fatura ${cartaoNome} - ${fmtDate(dataFech)}`,
        valor: totalFech,
        tipo: "saida",
        data_lancamento: dataFech,
        observacoes: `Fatura fechada com ${count} transação(ões).`,
      });
    }

    setFechandoCartaoId(null);
    if (count > 0) {
      toast({ title: `✅ Fechamento realizado! ${count} transação(ões) conciliada(s) até ${fmtDate(dataFech)}.` });
      queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });
      queryClient.invalidateQueries({ queryKey: ["lancamentos_caixa"] });
    } else {
      toast({ title: "Nenhuma transação pendente até essa data" });
    }
  };

  const fechamentoTotal = useMemo(() => {
    if (!fechamentoCartaoId) return 0;
    return (extrato as any[])
      .filter(i => i.banco_cartao_id === fechamentoCartaoId && !i.conciliado && i.tipo === "saida" && i.data_transacao <= fechamentoData)
      .reduce((s, i) => s + Number(i.valor), 0);
  }, [extrato, fechamentoCartaoId, fechamentoData]);

  const fechamentoPendentesCount = useMemo(() => {
    if (!fechamentoCartaoId) return 0;
    return (extrato as any[])
      .filter(i => i.banco_cartao_id === fechamentoCartaoId && !i.conciliado && i.data_transacao <= fechamentoData).length;
  }, [extrato, fechamentoCartaoId, fechamentoData]);

  const faturaTotal = useMemo(() => {
    if (!faturaCartaoId) return 0;
    return (extrato as any[])
      .filter(i => i.banco_cartao_id === faturaCartaoId && !i.conciliado && i.tipo === "saida")
      .reduce((s, i) => s + Number(i.valor), 0);
  }, [extrato, faturaCartaoId]);

  const handlePagarFatura = async () => {
    if (!faturaCartaoId) {
      toast({ title: "Selecione o cartão", variant: "destructive" });
      return;
    }
    setPagandoFatura(true);
    const pendentes = (extrato as any[]).filter(
      i => i.banco_cartao_id === faturaCartaoId && !i.conciliado
    );
    let count = 0;
    for (const item of pendentes) {
      const { error } = await (supabase.from("extrato_bancario") as any)
        .update({ conciliado: true }).eq("id", item.id);
      if (!error) count++;
    }

    // Gerar lançamento no caixa com o valor total da fatura
    if (count > 0 && faturaTotal > 0) {
      const cartaoNome = cartoesMap[faturaCartaoId]?.nome || "Cartão";
      const hoje = new Date().toISOString().slice(0, 10);
      await (supabase.from("lancamentos_caixa") as any).insert({
        user_id: user!.id,
        descricao: `Pagamento fatura ${cartaoNome}`,
        valor: faturaTotal,
        tipo: "saida",
        data_lancamento: hoje,
        observacoes: `Fatura com ${count} transação(ões) conciliada(s) automaticamente`,
      });
    }

    setPagandoFatura(false);
    if (count > 0) {
      toast({ title: `Fatura paga! ${count} transação(ões) conciliada(s) e lançamento de ${fmt(faturaTotal)} registrado no caixa.` });
      queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });
      queryClient.invalidateQueries({ queryKey: ["lancamentos_caixa"] });
    } else {
      toast({ title: "Nenhuma transação pendente para este cartão" });
    }
    setShowPagarFatura(false);
  };

  const handleSalvarConciliacao = async () => {
    const pendentes = extratoCartoes.filter(i => !i.conciliado);
    if (pendentes.length === 0) {
      toast({ title: "Todas as transações já estão conciliadas!" });
      return;
    }
    setSalvandoConciliacao(true);
    let ok = 0;
    for (const item of pendentes) {
      const { error } = await (supabase.from("extrato_bancario") as any)
        .update({ conciliado: true })
        .eq("id", item.id);
      if (!error) ok++;
    }
    setSalvandoConciliacao(false);
    toast({ title: `Conciliação salva! ${ok} transação(ões) conciliada(s).` });
    queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });
  };

  const totalPendentesCartao = extratoCartoes.filter(i => !i.conciliado).length;

  return (
    <div className="space-y-4">
      {/* Aviso de pendências */}
      {semVinculo.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50/50 dark:bg-yellow-950/20 dark:border-yellow-800">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
              {semVinculo.length} transação(ões) de cartão pendentes de conciliação
            </p>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-purple-600" />
            <div><p className="text-[10px] text-muted-foreground">Gastos no Cartão</p><p className="text-sm font-bold">{fmt(stats.gastos)}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2">
            <ArrowDownCircle className="h-4 w-4 text-green-600" />
            <div><p className="text-[10px] text-muted-foreground">Recebimentos</p><p className="text-sm font-bold">{fmt(stats.recebimentos)}</p></div>
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

      {/* Datas de fechamento dos cartões */}
      {cartoes.filter(c => c.tipo === "cartao_credito").length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">📅 Datas de Fechamento das Faturas</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {cartoes.filter(c => c.tipo === "cartao_credito").map((c: any) => (
                <div key={c.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <p className="text-xs font-medium">{c.nome}</p>
                    <p className="text-[10px] text-muted-foreground">{c.bandeira || "—"}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Dia</span>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={diasFechamento[c.id] || 25}
                      onChange={e => saveDiaFechamento(c.id, parseInt(e.target.value) || 25)}
                      className="h-7 w-14 text-xs text-center"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros + Ações */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          {/* Linha de Filtros */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Cartão</label>
              <Select value={filterCartao} onValueChange={setFilterCartao}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os cartões</SelectItem>
                  {cartoes.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome} ({c.tipo === "cartao_credito" ? "Crédito" : "Débito"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="conciliado">Conciliados</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Data De</label>
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
              <label className="text-xs text-muted-foreground mb-1 block">Data Até</label>
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
          </div>

          {/* Linha de Botões de Ação */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" onClick={handleSyncContasCartao} disabled={syncing}>
              <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Sincronizando..." : "Sincronizar Contas"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleAutoConciliar}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> Auto Conciliar
            </Button>

            <Dialog open={showPagarFatura} onOpenChange={setShowPagarFatura}>
              <DialogTrigger asChild>
                <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700">
                  <DollarSign className="h-4 w-4 mr-1" /> Pagar Fatura
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Pagar Fatura do Cartão</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Cartão</Label>
                    <Select value={faturaCartaoId} onValueChange={setFaturaCartaoId}>
                      <SelectTrigger><SelectValue placeholder="Selecione o cartão" /></SelectTrigger>
                      <SelectContent>
                        {cartoes.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome} ({c.tipo === "cartao_credito" ? "Crédito" : "Débito"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {faturaCartaoId && (
                    <div className="rounded-lg border p-4 space-y-2">
                      <p className="text-sm text-muted-foreground">Total da fatura pendente:</p>
                      <p className="text-2xl font-bold text-red-600">{fmt(faturaTotal)}</p>
                      <p className="text-xs text-muted-foreground">
                        {(extrato as any[]).filter(i => i.banco_cartao_id === faturaCartaoId && !i.conciliado).length} transação(ões) pendente(s)
                      </p>
                    </div>
                  )}
                  <Button className="w-full" onClick={handlePagarFatura} disabled={pagandoFatura || !faturaCartaoId}>
                    <DollarSign className="h-4 w-4 mr-1" />
                    {pagandoFatura ? "Processando..." : "Confirmar Pagamento da Fatura"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showFechamento} onOpenChange={setShowFechamento}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  <CreditCard className="h-4 w-4 mr-1" /> Fechamento de Fatura
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Fechamento de Fatura</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Cartão</Label>
                    <Select value={fechamentoCartaoId} onValueChange={setFechamentoCartaoId}>
                      <SelectTrigger><SelectValue placeholder="Selecione o cartão" /></SelectTrigger>
                      <SelectContent>
                        {cartoes.filter(c => c.tipo === "cartao_credito").map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {fechamentoCartaoId && (
                    <>
                      <div>
                        <Label>Dia de Fechamento da Fatura</Label>
                        <Input
                          type="number"
                          min={1}
                          max={31}
                          value={diasFechamento[fechamentoCartaoId] || 25}
                          onChange={e => saveDiaFechamento(fechamentoCartaoId, parseInt(e.target.value) || 25)}
                          className="h-9"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Dia do mês em que a fatura fecha (ex: 25)</p>
                      </div>
                      <div>
                        <Label>Data de Fechamento</Label>
                        <Input
                          type="date"
                          value={fechamentoData}
                          onChange={e => setFechamentoData(e.target.value)}
                          className="h-9"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Todas as transações até esta data serão incluídas no fechamento</p>
                      </div>
                      <div className="rounded-lg border p-4 space-y-2">
                        <p className="text-sm text-muted-foreground">Total do fechamento:</p>
                        <p className="text-2xl font-bold text-red-600">{fmt(fechamentoTotal)}</p>
                        <p className="text-xs text-muted-foreground">
                          {fechamentoPendentesCount} transação(ões) pendente(s) até {fmtDate(fechamentoData)}
                        </p>
                      </div>
                    </>
                  )}
                  <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleFechamentoFatura} disabled={fechando || !fechamentoCartaoId}>
                    <CreditCard className="h-4 w-4 mr-1" />
                    {fechando ? "Processando..." : "Confirmar Fechamento de Fatura"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="ml-auto">
              <Dialog open={showAdd} onOpenChange={setShowAdd}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Adicionar Transação</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Nova Transação de Cartão</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Cartão</Label>
                      <Select value={newTx.cartao_id} onValueChange={v => setNewTx(p => ({ ...p, cartao_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="Selecione o cartão" /></SelectTrigger>
                        <SelectContent>
                          {cartoes.map((c: any) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.nome} ({c.tipo === "cartao_credito" ? "Crédito" : "Débito"})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Data</Label>
                      <Input type="date" value={newTx.data} onChange={e => setNewTx(p => ({ ...p, data: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Input value={newTx.descricao} onChange={e => setNewTx(p => ({ ...p, descricao: e.target.value }))} placeholder="Ex: Compra no supermercado" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Valor Total (R$)</Label>
                        <Input type="number" step="0.01" value={newTx.valor} onChange={e => setNewTx(p => ({ ...p, valor: e.target.value }))} placeholder="0,00" />
                      </div>
                      <div>
                        <Label>Parcelas</Label>
                        <Select value={newTx.parcelas} onValueChange={v => setNewTx(p => ({ ...p, parcelas: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => i + 1).map(n => (
                              <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {parseInt(newTx.parcelas) > 1 && newTx.valor && (
                      <p className="text-xs text-muted-foreground">
                        {newTx.parcelas}x de {fmt(Math.round((parseFloat(newTx.valor) / parseInt(newTx.parcelas)) * 100) / 100)}
                      </p>
                    )}
                    <div>
                      <Label>Tipo</Label>
                      <Select value={newTx.tipo} onValueChange={v => setNewTx(p => ({ ...p, tipo: v as "entrada" | "saida" }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="saida">Saída (Compra)</SelectItem>
                          <SelectItem value="entrada">Entrada (Estorno)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full" onClick={handleAddTx} disabled={saving}>
                      {saving ? "Salvando..." : "Adicionar"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Transações de Cartão ({extratoCartoes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cartoes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Nenhum cartão cadastrado. Cadastre cartões em <strong>Bancos e Cartões</strong>.</p>
            </div>
          ) : (
            <div className="rounded-xl border max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Cartão</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Parcelas</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extratoCartoes.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Nenhuma transação de cartão encontrada.
                    </TableCell></TableRow>
                  ) : (
                    extratoCartoes.map((item: any) => {
                      const cartao = cartoesMap[item.banco_cartao_id];
                      return (
                        <TableRow key={item.id} className={!item.conciliado ? "bg-yellow-50/50" : ""}>
                          <TableCell>
                            {item.conciliado
                              ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                              : <XCircle className="h-5 w-5 text-yellow-500" />}
                          </TableCell>
                          <TableCell>{fmtDate(item.data_transacao)}</TableCell>
                          <TableCell className="text-xs">
                            <div>{cartao?.nome || "—"}</div>
                            <Badge variant="outline" className="text-[10px] mt-0.5">
                              {cartao?.tipo === "cartao_credito" ? "Crédito" : "Débito"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate">{item.descricao}</TableCell>
                          <TableCell className="text-xs text-center">
                            {item.parcelas && item.parcelas > 1
                              ? <Badge variant="outline">{item.parcela_atual}/{item.parcelas}</Badge>
                              : <span className="text-muted-foreground">1x</span>}
                          </TableCell>
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
                                <Button size="sm" variant="ghost" onClick={() => handleUnconciliar(item.id)} title="Desfazer">
                                  <Unlink className="h-4 w-4" />
                                </Button>
                              ) : (
                                <>
                                  <Button size="sm" variant="ghost" onClick={() => handleConciliarDireto(item.id)} title="Conciliar">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  </Button>
                                  <Dialog open={matchingItemId === item.id} onOpenChange={(open) => setMatchingItemId(open ? item.id : null)}>
                                    <DialogTrigger asChild>
                                      <Button size="sm" variant="ghost" title="Vincular">
                                        <Link2 className="h-4 w-4 text-blue-500" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl max-h-[500px] overflow-auto">
                                      <DialogHeader>
                                        <DialogTitle>Vincular: {item.descricao}</DialogTitle>
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
                                          {matchableItems.filter(m => m.tipo === item.tipo).map(m => (
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
                                                <Button size="sm" onClick={() => handleMatch(item.id, m)}>
                                                  <Link2 className="h-3 w-3 mr-1" /> Vincular
                                                </Button>
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                          {matchableItems.filter(m => m.tipo === item.tipo).length === 0 && (
                                            <TableRow>
                                              <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                                                Nenhum registro compatível
                                              </TableCell>
                                            </TableRow>
                                          )}
                                        </TableBody>
                                      </Table>
                                    </DialogContent>
                                  </Dialog>
                                </>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)} title="Excluir">
                                <Trash2 className="h-4 w-4 text-red-400" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
