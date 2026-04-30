import { useState, useEffect, useRef } from "react";
import { useTableQuery, useTableMutation } from "@/hooks/useSupabaseQuery";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, ArrowDownCircle, CheckCircle, RefreshCw, ChevronsUpDown, Check, FileDown, Landmark, ScanBarcode, FileUp, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import ContasFilter, { useContasFilter } from "@/components/ContasFilter";
import { exportContasReceberPDF } from "@/lib/pdfContasExport";
import { syncContaReceberExtrato, removeContaReceberExtrato } from "@/lib/extratoSync";
import Anexos from "@/components/Anexos";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

const statusColors: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800 border-yellow-300",
  recebido: "bg-green-100 text-green-800 border-green-300",
  vencido: "bg-red-100 text-red-800 border-red-300",
  cancelado: "bg-gray-100 text-gray-800 border-gray-300",
};

const frequencias = [
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
  { value: "bimestral", label: "Bimestral" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
];

const formasRecebimento = [
  { value: "pix", label: "PIX" },
  { value: "boleto", label: "Boleto" },
  { value: "cartao_credito", label: "Cartão de Crédito" },
  { value: "cartao_debito", label: "Cartão de Débito" },
  { value: "transferencia", label: "Transferência" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cheque", label: "Cheque" },
];

const emptyForm = {
  descricao: "", valor: "", data_emissao: new Date().toISOString().split("T")[0],
  data_vencimento: "", cliente_id: "", categoria_id: "", documento: "", observacoes: "", status: "pendente",
  recorrente: false, frequencia: "", data_fim_recorrencia: "", forma_pagamento: "", banco_cartao_id: "",
};

const FREQUENCIAS_VALIDAS = ["semanal", "quinzenal", "mensal", "bimestral", "trimestral", "semestral", "anual"];

function addInterval(date: Date, freq: string): Date {
  const d = new Date(date);
  switch (freq) {
    case "semanal": d.setDate(d.getDate() + 7); break;
    case "quinzenal": d.setDate(d.getDate() + 15); break;
    case "mensal": d.setMonth(d.getMonth() + 1); break;
    case "bimestral": d.setMonth(d.getMonth() + 2); break;
    case "trimestral": d.setMonth(d.getMonth() + 3); break;
    case "semestral": d.setMonth(d.getMonth() + 6); break;
    case "anual": d.setFullYear(d.getFullYear() + 1); break;
    default: d.setMonth(d.getMonth() + 1); break;
  }
  return d;
}

export default function ContasReceber() {
  const { data: contas = [], isLoading } = useTableQuery("contas_receber", { orderBy: "data_vencimento", ascending: true });
  const { data: clientes = [] } = useTableQuery("clientes");
  const { data: categorias = [] } = useTableQuery("categorias");
  const { data: bancos = [] } = useTableQuery("bancos_cartoes");
  const { insert, update, remove } = useTableMutation("contas_receber");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [filtroRecorrencia, setFiltroRecorrencia] = useState<string>("todas");
  const [boletoOpen, setBoletoOpen] = useState(false);
  const [boletoMode, setBoletoMode] = useState<"barcode" | "pdf">("barcode");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [boletoLoading, setBoletoLoading] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const { filters, setFilters, applyFilters } = useContasFilter();

  const handleBoletoImport = async (mode: "barcode" | "pdf", file?: File) => {
    setBoletoLoading(true);
    const controller = new AbortController();
    // Timeout generoso: extração de PDF pode levar até 30s em PDFs complexos
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

      let res: Response;
      if (mode === "barcode") {
        if (!barcodeInput.trim()) {
          toast({ title: "Digite o código de barras ou linha digitável", variant: "destructive" });
          return;
        }
        res = await fetch(`${SUPABASE_URL}/functions/v1/parse-boleto-pdf`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_KEY,
          },
          body: JSON.stringify({ barcode: barcodeInput.trim().replace(/[\s.\-]/g, "") }),
          signal: controller.signal,
        });
      } else if (file) {
        if (file.size > 2 * 1024 * 1024) {
          toast({ title: "Arquivo muito grande", description: "O PDF deve ter no máximo 2 MB.", variant: "destructive" });
          return;
        }
        if (file.type !== "application/pdf") {
          toast({ title: "Formato inválido", description: "Envie apenas arquivos PDF.", variant: "destructive" });
          return;
        }
        toast({ title: "Processando PDF...", description: "Extraindo linha digitável do boleto. Aguarde." });
        const arrayBuffer = await file.arrayBuffer();
        res = await fetch(`${SUPABASE_URL}/functions/v1/parse-boleto-pdf`, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "apikey": SUPABASE_KEY,
          },
          body: arrayBuffer,
          signal: controller.signal,
        });
      } else {
        throw new Error("Nenhum arquivo selecionado");
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let errorMsg = `Erro HTTP ${res.status}`;
        try {
          const errorData = JSON.parse(text);
          errorMsg = errorData.error || errorData.message || errorMsg;
          if (errorData.dica) errorMsg += `\n\nDica: ${errorData.dica}`;
        } catch {
          if (text) errorMsg += `: ${text.substring(0, 200)}`;
        }
        throw new Error(errorMsg);
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const boleto = data?.boleto;
      if (!boleto) throw new Error("Resposta inválida da IA");

      // Para boletos de concessionária (arrecadação), a data de vencimento pode não estar no código de barras
      // Preenche com data atual + 5 dias se não houver data de vencimento
      let dataVencimento = boleto.data_vencimento;
      if (!dataVencimento) {
        const hoje = new Date();
        hoje.setDate(hoje.getDate() + 5);
        dataVencimento = hoje.toISOString().split("T")[0];
      }

      setForm({
        ...emptyForm,
        descricao: boleto.descricao || boleto.beneficiario || "",
        valor: boleto.valor ? String(boleto.valor) : "",
        data_vencimento: dataVencimento,
        documento: boleto.documento || boleto.codigo_barras || "",
        observacoes: [
          boleto.beneficiario ? `Pagador: ${boleto.beneficiario}` : "",
          boleto.banco ? `Banco: ${boleto.banco}` : "",
          boleto.codigo_barras ? `Cód. Barras: ${boleto.codigo_barras}` : "",
        ].filter(Boolean).join(" | "),
        forma_pagamento: "boleto",
      });
      setBoletoOpen(false);
      setBarcodeInput("");
      setEditing(null);
      setOpen(true);
      toast({ title: "Boleto reconhecido! Confira os dados e salve." });
    } catch (err: any) {
      if (err.name === "AbortError") {
        toast({ title: "Tempo esgotado", description: "O processamento do PDF demorou mais que o esperado. Tente usar a opção de código de barras.", variant: "destructive" });
      } else {
        toast({ title: "Erro ao processar boleto", description: err.message, variant: "destructive" });
      }
    } finally {
      clearTimeout(timeoutId);
      setBoletoLoading(false);
    }
  };

  // Quick-receive dialog state
  const [quickReceiveOpen, setQuickReceiveOpen] = useState(false);
  const [quickReceiveConta, setQuickReceiveConta] = useState<any>(null);
  const [quickReceiveBancoId, setQuickReceiveBancoId] = useState("");

  useRealtimeSubscription("contas_receber", [["contas_receber"], ["lancamentos_caixa"]]);
  useRealtimeSubscription("lancamentos_caixa", [["lancamentos_caixa"]]);

  // Auto-marcar contas pendentes vencidas como "vencido"
  useEffect(() => {
    const hoje = new Date().toISOString().split("T")[0];
    const vencidas = (contas as any[]).filter((c) => c.status === "pendente" && c.data_vencimento < hoje);
    if (vencidas.length > 0) {
      Promise.all(
        vencidas.map((c) =>
          (supabase.from("contas_receber") as any).update({ status: "vencido" }).eq("id", c.id)
        )
      ).then(() => {
        queryClient.invalidateQueries({ queryKey: ["contas_receber"] });
      });
    }
  }, [contas, queryClient]);

  const categoriasReceita = (categorias as any[]).filter((c) => c.tipo === "receita");
  const bancosAtivos = (bancos as any[]).filter((b: any) => b.ativo);

  const syncContaReceberCashEntry = async (contaId: string, values: {
    categoria_id: string | null;
    descricao: string;
    status: string;
    valor: number;
    data_recebimento: string | null;
  }) => {
    const { error: deleteError } = await (supabase.from("lancamentos_caixa") as any)
      .delete()
      .eq("conta_receber_id", contaId);

    if (deleteError) {
      toast({ title: "Erro ao sincronizar caixa", description: deleteError.message, variant: "destructive" });
      return false;
    }

    if (values.status !== "recebido") {
      queryClient.invalidateQueries({ queryKey: ["lancamentos_caixa"] });
      return true;
    }

    const { error: insertError } = await (supabase.from("lancamentos_caixa") as any).insert({
      user_id: user!.id,
      tipo: "entrada",
      categoria_id: values.categoria_id,
      descricao: values.descricao,
      valor: values.valor,
      data_lancamento: values.data_recebimento || new Date().toISOString().split("T")[0],
      conta_receber_id: contaId,
    });

    if (insertError) {
      toast({ title: "Erro ao sincronizar caixa", description: insertError.message, variant: "destructive" });
      return false;
    }

    queryClient.invalidateQueries({ queryKey: ["lancamentos_caixa"] });
    return true;
  };

  const handleSubmit = async () => {
    const hoje = new Date().toISOString().split("T")[0];
    const payload = {
      descricao: form.descricao,
      valor: parseFloat(form.valor),
      data_emissao: form.data_emissao,
      data_vencimento: form.data_vencimento,
      cliente_id: form.cliente_id || null,
      categoria_id: form.categoria_id || null,
      documento: form.documento || null,
      observacoes: form.observacoes || null,
      status: form.status,
      recorrente: form.recorrente,
      frequencia: form.recorrente ? form.frequencia || null : null,
      data_fim_recorrencia: form.recorrente && form.data_fim_recorrencia ? form.data_fim_recorrencia : null,
      forma_pagamento: form.forma_pagamento || null,
      banco_cartao_id: form.banco_cartao_id || null,
      data_recebimento: form.status === "recebido" ? editing?.data_recebimento || hoje : null,
    };

    if (editing) {
      const statusAnterior = editing.status;
      await update.mutateAsync({ id: editing.id, ...payload });

      // Se o recebimento foi cancelado (status era recebido e agora não é mais), reverte o saldo do banco
      if (statusAnterior === "recebido" && payload.status !== "recebido" && editing.banco_cartao_id) {
        const banco = bancosAtivos.find((b: any) => b.id === editing.banco_cartao_id);
        if (banco) {
          const saldoAtual = Number(banco.saldo_inicial || 0);
          const novoSaldo = saldoAtual - Number(editing.valor);
          await (supabase.from("bancos_cartoes") as any)
            .update({ saldo_inicial: novoSaldo })
            .eq("id", editing.banco_cartao_id);
        }
      }

      const synced = await syncContaReceberCashEntry(editing.id, payload);
      if (!synced) return;

      await syncContaReceberExtrato(user!.id, editing.id, {
        descricao: payload.descricao,
        valor: payload.valor,
        data_vencimento: payload.data_vencimento,
        status: payload.status,
        data_recebimento: payload.data_recebimento,
        forma_pagamento: payload.forma_pagamento,
        banco_cartao_id: form.banco_cartao_id || null,
      });

      queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });
      queryClient.invalidateQueries({ queryKey: ["bancos_cartoes"] });

      if (statusAnterior !== "recebido" && payload.status === "recebido") {
        toast({ title: "Recebimento registrado e lançamento criado!" });
      } else if (statusAnterior === "recebido" && payload.status !== "recebido") {
        toast({ title: "Recebimento cancelado e lançamento removido do caixa!" });
      }
    } else {
      const created = await insert.mutateAsync(payload);
      const synced = await syncContaReceberCashEntry(created.id, payload);
      if (!synced) return;

      await syncContaReceberExtrato(user!.id, created.id, {
        descricao: payload.descricao,
        valor: payload.valor,
        data_vencimento: payload.data_vencimento,
        status: payload.status,
        data_recebimento: payload.data_recebimento,
        forma_pagamento: payload.forma_pagamento,
        banco_cartao_id: form.banco_cartao_id || null,
      });

      queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });
      queryClient.invalidateQueries({ queryKey: ["bancos_cartoes"] });

      if (form.recorrente && form.frequencia && form.data_fim_recorrencia) {
        if (!FREQUENCIAS_VALIDAS.includes(form.frequencia)) {
          toast({ title: "Frequência inválida", description: "Selecione uma frequência válida.", variant: "destructive" });
          return;
        }
        const dataFim = new Date(form.data_fim_recorrencia + "T00:00:00");
        let nextDate = addInterval(new Date(form.data_vencimento + "T00:00:00"), form.frequencia);
        const parcelas: any[] = [];
        const maxParcelas = 1000;

        while (nextDate <= dataFim && parcelas.length < maxParcelas) {
          parcelas.push({
            ...payload,
            user_id: user!.id,
            data_vencimento: nextDate.toISOString().split("T")[0],
            data_emissao: new Date().toISOString().split("T")[0],
            status: "pendente",
            data_recebimento: null,
          });
          nextDate = addInterval(nextDate, form.frequencia);
        }
        if (parcelas.length >= maxParcelas) {
          console.warn("Limite de parcelas recorrentes atingido (", maxParcelas, ")");
        }

        if (parcelas.length > 0) {
          const { data: createdParcelas, error: recurringError } = await (supabase.from("contas_receber") as any)
            .insert(parcelas)
            .select();

          if (recurringError) {
            toast({ title: "Erro ao gerar recorrências", description: recurringError.message, variant: "destructive" });
          } else {
            await Promise.all(
              (createdParcelas || []).map((parcela: any) =>
                syncContaReceberExtrato(user!.id, parcela.id, {
                  descricao: parcela.descricao,
                  valor: Number(parcela.valor),
                  data_vencimento: parcela.data_vencimento,
                  status: parcela.status,
                  data_recebimento: parcela.data_recebimento,
                  forma_pagamento: parcela.forma_pagamento,
                  banco_cartao_id: form.banco_cartao_id || null,
                })
              )
            );

            queryClient.invalidateQueries({ queryKey: ["contas_receber"] });
            queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });
            toast({ title: `${createdParcelas?.length || 0} parcelas recorrentes geradas!` });
          }
        }
      }
    }
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleEdit = (item: any) => {
    setEditing(item);
    setForm({
      descricao: item.descricao, valor: String(item.valor),
      data_emissao: item.data_emissao, data_vencimento: item.data_vencimento,
      cliente_id: item.cliente_id || "", categoria_id: item.categoria_id || "",
      documento: item.documento || "", observacoes: item.observacoes || "", status: item.status,
      recorrente: item.recorrente || false, frequencia: item.frequencia || "",
      data_fim_recorrencia: item.data_fim_recorrencia || "", forma_pagamento: item.forma_pagamento || "",
      banco_cartao_id: item.banco_cartao_id || "",
    });
    setOpen(true);
  };

  const handleReceberConfirm = async () => {
    if (!quickReceiveConta) return;
    const conta = quickReceiveConta;
    const hoje = new Date().toISOString().split("T")[0];

    // Atualiza o status da conta para recebido
    await (supabase.from("contas_receber") as any)
      .update({ status: "recebido", data_recebimento: hoje, banco_cartao_id: quickReceiveBancoId || null })
      .eq("id", conta.id);

    // Se tem banco selecionado, atualiza o saldo (adiciona o valor recebido)
    if (quickReceiveBancoId) {
      const banco = bancosAtivos.find((b: any) => b.id === quickReceiveBancoId);
      if (banco) {
        const saldoAtual = Number(banco.saldo_inicial || 0);
        const novoSaldo = saldoAtual + Number(conta.valor);
        await (supabase.from("bancos_cartoes") as any)
          .update({ saldo_inicial: novoSaldo })
          .eq("id", quickReceiveBancoId);
      }
    }

    const synced = await syncContaReceberCashEntry(conta.id, {
      categoria_id: conta.categoria_id || null,
      descricao: conta.descricao,
      status: "recebido",
      valor: Number(conta.valor),
      data_recebimento: hoje,
    });
    if (!synced) return;

    await syncContaReceberExtrato(user!.id, conta.id, {
      descricao: conta.descricao,
      valor: Number(conta.valor),
      data_vencimento: conta.data_vencimento,
      status: "recebido",
      data_recebimento: hoje,
      forma_pagamento: conta.forma_pagamento,
      banco_cartao_id: quickReceiveBancoId || null,
    });

    toast({ title: "Recebimento registrado!" });
    queryClient.invalidateQueries({ queryKey: ["contas_pagar"] });
    queryClient.invalidateQueries({ queryKey: ["contas_receber"] });
    queryClient.invalidateQueries({ queryKey: ["lancamentos_caixa"] });
    queryClient.invalidateQueries({ queryKey: ["categorias"] });
    queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });
    queryClient.invalidateQueries({ queryKey: ["bancos_cartoes"] });
    setQuickReceiveOpen(false);
    setQuickReceiveConta(null);
    setQuickReceiveBancoId("");
  };

  const handleDelete = async (contaId: string) => {
    const conta = (contas as any[]).find((c) => c.id === contaId);
    if (!conta) {
      toast({ title: "Conta não encontrada", variant: "destructive" });
      return;
    }

    const banco = conta.status === "recebido" && conta.banco_cartao_id
      ? bancosAtivos.find((b: any) => b.id === conta.banco_cartao_id)
      : null;
    const saldoOriginal = banco ? Number(banco.saldo_inicial || 0) : null;
    const novoSaldo = saldoOriginal !== null ? saldoOriginal - Number(conta.valor) : null;

    try {
      const { error: caixaError } = await (supabase.from("lancamentos_caixa") as any)
        .delete()
        .eq("conta_receber_id", contaId);
      if (caixaError) throw new Error("Erro ao excluir lançamento do caixa: " + caixaError.message);

      if (novoSaldo !== null && banco) {
        const { error: saldoError } = await (supabase.from("bancos_cartoes") as any)
          .update({ saldo_inicial: novoSaldo })
          .eq("id", conta.banco_cartao_id);
        if (saldoError) throw new Error("Erro ao reverter saldo: " + saldoError.message);
      }

      await removeContaReceberExtrato(contaId);
      await remove.mutateAsync(contaId);
      queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });
      queryClient.invalidateQueries({ queryKey: ["bancos_cartoes"] });
      toast({ title: "Conta excluída com sucesso" });
    } catch (err: any) {
      // Rollback manual do saldo se necessário
      if (novoSaldo !== null && saldoOriginal !== null) {
        await (supabase.from("bancos_cartoes") as any)
          .update({ saldo_inicial: saldoOriginal })
          .eq("id", conta.banco_cartao_id)
          .catch(() => {});
      }
      toast({ title: "Erro ao excluir conta", description: err.message, variant: "destructive" });
    }
  };

  const [empresa, setEmpresa] = useState<any>(null);
  useEffect(() => {
    let mounted = true;
    if (!user) return;
    supabase.from("empresa").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (mounted && data) setEmpresa(data);
    });
    return () => { mounted = false; };
  }, [user]);

  const handleExportPDF = () => {
    const filtered = applyFilters(
      (contas as any[]).filter((c) => filtroRecorrencia === "todas" ? true : filtroRecorrencia === "recorrentes" ? c.recorrente : !c.recorrente),
      "cliente_id"
    );
    exportContasReceberPDF({
      contas: filtered,
      clientes: clientes as any[],
      categorias: categoriasReceita,
      empresa,
      formaLabel,
    });
    toast({ title: "Relatório PDF exportado com sucesso!" });
  };

  const formaLabel = (v: string) => formasRecebimento.find(f => f.value === v)?.label || v;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Contas a Receber</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas receitas e recebimentos</p>
        </div>
        <div className="flex gap-2 flex-wrap">
        <Dialog open={boletoOpen} onOpenChange={(v) => { setBoletoOpen(v); if (!v) setBarcodeInput(""); }}>
          <DialogTrigger asChild>
            <Button variant="outline"><ScanBarcode className="mr-2 h-4 w-4" /> Importar Boleto</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Importar Boleto / Código de Barras</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button type="button" variant={boletoMode === "barcode" ? "default" : "outline"} className="flex-1" onClick={() => setBoletoMode("barcode")}>
                  <ScanBarcode className="mr-2 h-4 w-4" /> Código de Barras
                </Button>
                <Button type="button" variant={boletoMode === "pdf" ? "default" : "outline"} className="flex-1" onClick={() => setBoletoMode("pdf")}>
                  <FileUp className="mr-2 h-4 w-4" /> PDF do Boleto
                </Button>
              </div>
              {boletoMode === "barcode" ? (
                <div className="space-y-2">
                  <Label>Linha digitável ou código de barras</Label>
                  <Input placeholder="Cole aqui (44/47/48 dígitos, mínimo 36)" value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} />
                  <Button onClick={() => handleBoletoImport("barcode")} disabled={boletoLoading || barcodeInput.replace(/\D/g, "").length < 36} className="w-full">
                    {boletoLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</> : "Reconhecer Boleto"}
                  </Button>
                  <p className="text-xs text-muted-foreground">Aceita cobrança (44/47 dígitos), arrecadação (48 dígitos) e tributos.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Selecione o PDF do boleto</Label>
                  <input ref={pdfInputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBoletoImport("pdf", f); }} />
                  <Button onClick={() => pdfInputRef.current?.click()} disabled={boletoLoading} className="w-full" variant="outline">
                    {boletoLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando PDF...</> : <><FileUp className="mr-2 h-4 w-4" /> Escolher PDF</>}
                  </Button>
                  <p className="text-xs text-muted-foreground">A IA extrairá os dados automaticamente.</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Nova Conta</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Editar" : "Nova"} Conta a Receber</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Label>Descrição *</Label><Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
              <div><Label>Valor *</Label><Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} /></div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="recebido">Recebido</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Emissão</Label><Input type="date" value={form.data_emissao} onChange={(e) => setForm({ ...form, data_emissao: e.target.value })} /></div>
              <div><Label>Vencimento *</Label><Input type="date" value={form.data_vencimento} onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })} /></div>
              <div><Label>Cliente</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal h-10">
                      {form.cliente_id ? (clientes as any[]).find((c) => c.id === form.cliente_id)?.nome : "Selecione"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Pesquisar cliente..." />
                      <CommandList>
                        <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                        <CommandGroup>
                          {(clientes as any[]).map((c) => (
                            <CommandItem key={c.id} value={c.nome} onSelect={() => setForm({ ...form, cliente_id: c.id })}>
                              <Check className={cn("mr-2 h-4 w-4", form.cliente_id === c.id ? "opacity-100" : "opacity-0")} />
                              {c.nome}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div><Label>Categoria</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal h-10">
                      {form.categoria_id ? categoriasReceita.find((c) => c.id === form.categoria_id)?.nome : "Selecione"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Pesquisar categoria..." />
                      <CommandList>
                        <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                        <CommandGroup>
                          {categoriasReceita.map((c) => (
                            <CommandItem key={c.id} value={c.nome} onSelect={() => setForm({ ...form, categoria_id: c.id })}>
                              <Check className={cn("mr-2 h-4 w-4", form.categoria_id === c.id ? "opacity-100" : "opacity-0")} />
                              {c.nome}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div><Label>Forma de Recebimento</Label>
                <Select value={form.forma_pagamento} onValueChange={(v) => setForm({ ...form, forma_pagamento: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{formasRecebimento.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Banco / Conta</Label>
                <Select value={form.banco_cartao_id} onValueChange={(v) => setForm({ ...form, banco_cartao_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
                  <SelectContent>
                    {bancosAtivos.map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>
                        <span className="flex items-center gap-2">
                          <Landmark className="h-3 w-3" />
                          {b.nome} {b.banco ? `(${b.banco})` : ""}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Documento</Label><Input value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} /></div>
              <div className="col-span-2"><Label>Observações</Label><Input value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>

              {/* Recorrência */}
              <div className="col-span-2 border-t pt-4 mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-base font-semibold">Recebimento Recorrente</Label>
                  </div>
                  <Switch checked={form.recorrente} onCheckedChange={(v) => setForm({ ...form, recorrente: v })} />
                </div>
              </div>
              {form.recorrente && (
                <>
                  <div><Label>Frequência *</Label>
                    <Select value={form.frequencia} onValueChange={(v) => setForm({ ...form, frequencia: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{frequencias.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Até quando? *</Label><Input type="date" value={form.data_fim_recorrencia} onChange={(e) => setForm({ ...form, data_fim_recorrencia: e.target.value })} /></div>
                </>
              )}
            </div>
            <Button onClick={handleSubmit} className="w-full" disabled={!form.descricao || !form.valor || !form.data_vencimento}>
              {editing ? "Atualizar" : "Criar"}
            </Button>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Quick Receive Dialog */}
      <Dialog open={quickReceiveOpen} onOpenChange={(v) => { setQuickReceiveOpen(v); if (!v) { setQuickReceiveConta(null); setQuickReceiveBancoId(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Confirmar Recebimento</DialogTitle></DialogHeader>
          {quickReceiveConta && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <p className="font-semibold">{quickReceiveConta.descricao}</p>
                <p className="text-accent font-bold text-lg">{fmt(Number(quickReceiveConta.valor))}</p>
                <p className="text-sm text-muted-foreground">Vencimento: {fmtDate(quickReceiveConta.data_vencimento)}</p>
              </div>
              <div>
                <Label>Conta de entrada (Banco) *</Label>
                <Select value={quickReceiveBancoId} onValueChange={setQuickReceiveBancoId}>
                  <SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
                  <SelectContent>
                    {bancosAtivos.map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>
                        <span className="flex items-center gap-2">
                          <Landmark className="h-3 w-3" />
                          {b.nome} {b.banco ? `(${b.banco})` : ""}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleReceberConfirm} className="w-full" disabled={!quickReceiveBancoId}>
                <CheckCircle className="mr-2 h-4 w-4" /> Confirmar Recebimento
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-2 flex-wrap">
        <Select value={filtroRecorrencia} onValueChange={setFiltroRecorrencia}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="recorrentes">Recorrentes</SelectItem>
            <SelectItem value="avulsas">Avulsas</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" className="gap-2" onClick={handleExportPDF}>
          <FileDown className="h-4 w-4" /> Exportar PDF
        </Button>
      </div>

      <ContasFilter
        filters={filters}
        onFiltersChange={setFilters}
        entidades={(clientes as any[]).map((c) => ({ id: c.id, nome: c.nome }))}
        entidadeLabel="Cliente"
      />

      <div className="rounded-xl border bg-card overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Recebimento</TableHead>
              <TableHead>Forma Receb.</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Recor.</TableHead>
              <TableHead className="w-32">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : (contas as any[]).length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">
                <ArrowDownCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />Nenhuma conta cadastrada
              </TableCell></TableRow>
            ) : (
              applyFilters((contas as any[]).filter((c) => filtroRecorrencia === "todas" ? true : filtroRecorrencia === "recorrentes" ? c.recorrente : !c.recorrente), "cliente_id").map((c) => {
                const isAntecipado = c.status === "recebido" && c.data_recebimento && c.data_vencimento && c.data_recebimento < c.data_vencimento;
                return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.descricao}</TableCell>
                  <TableCell className="text-accent font-semibold">{fmt(Number(c.valor))}</TableCell>
                  <TableCell>{fmtDate(c.data_vencimento)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm">{c.data_recebimento ? fmtDate(c.data_recebimento) : "—"}</span>
                      {isAntecipado && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-[10px] w-fit">ANTECIPADO</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{c.forma_pagamento ? formaLabel(c.forma_pagamento) : "—"}</TableCell>
                  <TableCell><Badge className={statusColors[c.status]}>{c.status.toUpperCase()}</Badge></TableCell>
                  <TableCell>
                    {c.recorrente ? (
                      <Badge variant="outline" className="text-xs gap-1"><RefreshCw className="h-3 w-3" />{c.frequencia}</Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {(c.status === "pendente" || c.status === "vencido") && (
                        <Button variant="ghost" size="icon" onClick={() => { setQuickReceiveConta(c); setQuickReceiveBancoId(c.banco_cartao_id || ""); setQuickReceiveOpen(true); }} title="Receber" className="text-accent">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Anexos contaId={c.id} tipo="receber" />
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
