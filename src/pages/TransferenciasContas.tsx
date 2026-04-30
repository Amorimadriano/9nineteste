import { useState, useMemo } from "react";
import { useTableQuery } from "@/hooks/useSupabaseQuery";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRightLeft, Plus, Trash2, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

export default function TransferenciasContas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bancos = [] } = useTableQuery("bancos_cartoes");
  const { data: transferencias = [] } = useTableQuery("transferencias_contas" as any);

  useRealtimeSubscription("transferencias_contas", [["transferencias_contas"]]);
  useRealtimeSubscription("bancos_cartoes", [["bancos_cartoes"]]);

  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    conta_origem_id: "",
    conta_destino_id: "",
    valor: "",
    data_transferencia: new Date().toISOString().slice(0, 10),
    descricao: "",
    observacoes: "",
  });

  const contasAtivas = useMemo(
    () => (bancos as any[]).filter((b: any) => b.ativo),
    [bancos]
  );

  const transferList = useMemo(() => {
    const items = (transferencias as any[]).slice();
    items.sort((a: any, b: any) => b.data_transferencia.localeCompare(a.data_transferencia));
    return items;
  }, [transferencias]);

  const totalTransferido = useMemo(
    () => transferList.reduce((s: number, t: any) => s + Number(t.valor), 0),
    [transferList]
  );

  const getNomeConta = (id: string) => {
    const c = (bancos as any[]).find((b: any) => b.id === id);
    return c ? c.nome : "—";
  };

  const handleSave = async () => {
    if (!user) return;
    if (!form.conta_origem_id || !form.conta_destino_id || !form.valor) {
      toast({ title: "Preencha conta origem, destino e valor", variant: "destructive" });
      return;
    }
    if (form.conta_origem_id === form.conta_destino_id) {
      toast({ title: "Conta origem e destino devem ser diferentes", variant: "destructive" });
      return;
    }
    setSaving(true);

    const valorTransferencia = parseFloat(form.valor);

    // Registra a transferência
    const { error } = await (supabase.from("transferencias_contas") as any).insert({
      user_id: user.id,
      conta_origem_id: form.conta_origem_id,
      conta_destino_id: form.conta_destino_id,
      valor: valorTransferencia,
      data_transferencia: form.data_transferencia,
      descricao: form.descricao || null,
      observacoes: form.observacoes || null,
    });

    if (error) {
      setSaving(false);
      toast({ title: "Erro ao salvar transferência", description: error.message, variant: "destructive" });
      return;
    }

    // Atualiza os saldos das contas
    const contaOrigem = contasAtivas.find((c: any) => c.id === form.conta_origem_id);
    const contaDestino = contasAtivas.find((c: any) => c.id === form.conta_destino_id);

    if (contaOrigem) {
      const saldoOrigem = Number(contaOrigem.saldo_inicial || 0);
      await (supabase.from("bancos_cartoes") as any)
        .update({ saldo_inicial: saldoOrigem - valorTransferencia })
        .eq("id", form.conta_origem_id);
    }

    if (contaDestino) {
      const saldoDestino = Number(contaDestino.saldo_inicial || 0);
      await (supabase.from("bancos_cartoes") as any)
        .update({ saldo_inicial: saldoDestino + valorTransferencia })
        .eq("id", form.conta_destino_id);
    }

    setSaving(false);
    toast({ title: "Transferência registrada com sucesso!" });
    setShowAdd(false);
    setForm({ conta_origem_id: "", conta_destino_id: "", valor: "", data_transferencia: new Date().toISOString().slice(0, 10), descricao: "", observacoes: "" });
    queryClient.invalidateQueries({ queryKey: ["transferencias_contas"] });
    queryClient.invalidateQueries({ queryKey: ["bancos_cartoes"] });
    queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });
  };

  const handleDelete = async (id: string) => {
    const transferencia = transferList.find((t: any) => t.id === id);
    if (!transferencia) {
      toast({ title: "Transferência não encontrada", variant: "destructive" });
      return;
    }

    const contaOrigem = contasAtivas.find((c: any) => c.id === transferencia.conta_origem_id);
    const contaDestino = contasAtivas.find((c: any) => c.id === transferencia.conta_destino_id);
    const valor = Number(transferencia.valor);

    const saldoOrigemOriginal = contaOrigem ? Number(contaOrigem.saldo_inicial || 0) : null;
    const saldoDestinoOriginal = contaDestino ? Number(contaDestino.saldo_inicial || 0) : null;
    const novoSaldoOrigem = saldoOrigemOriginal !== null ? saldoOrigemOriginal + valor : null;
    const novoSaldoDestino = saldoDestinoOriginal !== null ? saldoDestinoOriginal - valor : null;

    try {
      if (novoSaldoOrigem !== null && contaOrigem) {
        const { error } = await (supabase.from("bancos_cartoes") as any)
          .update({ saldo_inicial: novoSaldoOrigem })
          .eq("id", transferencia.conta_origem_id);
        if (error) throw new Error("Erro ao reverter saldo origem: " + error.message);
      }

      if (novoSaldoDestino !== null && contaDestino) {
        const { error } = await (supabase.from("bancos_cartoes") as any)
          .update({ saldo_inicial: novoSaldoDestino })
          .eq("id", transferencia.conta_destino_id);
        if (error) throw new Error("Erro ao reverter saldo destino: " + error.message);
      }

      const { error } = await (supabase.from("transferencias_contas") as any).delete().eq("id", id);
      if (error) throw new Error("Erro ao excluir transferência: " + error.message);

      toast({ title: "Transferência excluída" });
      queryClient.invalidateQueries({ queryKey: ["transferencias_contas"] });
      queryClient.invalidateQueries({ queryKey: ["bancos_cartoes"] });
      queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });
    } catch (err: any) {
      // Rollback manual dos saldos
      if (saldoOrigemOriginal !== null) {
        await (supabase.from("bancos_cartoes") as any)
          .update({ saldo_inicial: saldoOrigemOriginal })
          .eq("id", transferencia.conta_origem_id)
          .catch(() => {});
      }
      if (saldoDestinoOriginal !== null) {
        await (supabase.from("bancos_cartoes") as any)
          .update({ saldo_inicial: saldoDestinoOriginal })
          .eq("id", transferencia.conta_destino_id)
          .catch(() => {});
      }
      toast({ title: "Erro ao excluir transferência", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Transferências Entre Contas</h1>
        <p className="text-sm text-muted-foreground">Registre e gerencie transferências entre suas contas bancárias e cartões</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-primary" />
              <div>
                <p className="text-[10px] text-muted-foreground">Total Transferências</p>
                <p className="text-sm font-bold">{transferList.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-[10px] text-muted-foreground">Valor Total Transferido</p>
                <p className="text-sm font-bold">{fmt(totalTransferido)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-[10px] text-muted-foreground">Contas Ativas</p>
                <p className="text-sm font-bold">{contasAtivas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="h-4 w-4 mr-1" /> Nova Transferência
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Transferência Entre Contas</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Conta Origem</Label>
                <Select value={form.conta_origem_id} onValueChange={v => setForm(f => ({ ...f, conta_origem_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione a conta de origem" /></SelectTrigger>
                  <SelectContent>
                    {contasAtivas.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Conta Destino</Label>
                <Select value={form.conta_destino_id} onValueChange={v => setForm(f => ({ ...f, conta_destino_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione a conta de destino" /></SelectTrigger>
                  <SelectContent>
                    {contasAtivas.filter((c: any) => c.id !== form.conta_origem_id).map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  value={form.valor}
                  onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                />
              </div>
              <div>
                <Label>Data da Transferência</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.data_transferencia && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.data_transferencia ? format(parse(form.data_transferencia, "yyyy-MM-dd", new Date()), "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.data_transferencia ? parse(form.data_transferencia, "yyyy-MM-dd", new Date()) : undefined}
                      onSelect={d => d && setForm(f => ({ ...f, data_transferencia: format(d, "yyyy-MM-dd") }))}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Descrição</Label>
                <Input
                  placeholder="Ex: Transferência para conta corrente"
                  value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                />
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  placeholder="Observações adicionais..."
                  value={form.observacoes}
                  onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {saving ? "Salvando..." : "Salvar Transferência"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de Transferências</CardTitle>
        </CardHeader>
        <CardContent>
          {transferList.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma transferência registrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Conta Origem</TableHead>
                    <TableHead>Conta Destino</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transferList.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs">{fmtDate(t.data_transferencia)}</TableCell>
                      <TableCell className="text-xs font-medium">{getNomeConta(t.conta_origem_id)}</TableCell>
                      <TableCell className="text-xs font-medium">{getNomeConta(t.conta_destino_id)}</TableCell>
                      <TableCell className="text-xs text-right font-bold">{fmt(Number(t.valor))}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{t.descricao || "—"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(t.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
