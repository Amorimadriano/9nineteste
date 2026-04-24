import { useState } from "react";
import { useTableQuery, useTableMutation } from "@/hooks/useSupabaseQuery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Building2, CreditCard } from "lucide-react";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const emptyForm = {
  tipo: "banco",
  nome: "",
  banco: "",
  agencia: "",
  conta: "",
  bandeira: "",
  limite: "",
  saldo_inicial: "",
  observacoes: "",
};

export default function BancosCartoes() {
  const { data: registros = [], isLoading } = useTableQuery("bancos_cartoes");
  const { insert, update, remove } = useTableMutation("bancos_cartoes");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  const handleSubmit = async () => {
    const payload = {
      ...form,
      limite: form.limite ? parseFloat(form.limite) : 0,
      saldo_inicial: form.saldo_inicial ? parseFloat(form.saldo_inicial) : 0,
      banco: form.banco || null,
      agencia: form.agencia || null,
      conta: form.conta || null,
      bandeira: form.bandeira || null,
      observacoes: form.observacoes || null,
    };
    if (editing) {
      await update.mutateAsync({ id: editing.id, ...payload });
    } else {
      await insert.mutateAsync(payload);
    }
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleEdit = (item: any) => {
    setEditing(item);
    setForm({
      tipo: item.tipo,
      nome: item.nome,
      banco: item.banco || "",
      agencia: item.agencia || "",
      conta: item.conta || "",
      bandeira: item.bandeira || "",
      limite: item.limite?.toString() || "",
      saldo_inicial: item.saldo_inicial?.toString() || "",
      observacoes: item.observacoes || "",
    });
    setOpen(true);
  };

  const closeDialog = (v: boolean) => {
    setOpen(v);
    if (!v) { setEditing(null); setForm(emptyForm); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Bancos e Cartões</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas contas bancárias e cartões de crédito</p>
        </div>
        <Dialog open={open} onOpenChange={closeDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Novo Cadastro</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar" : "Novo"} Banco / Cartão</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banco">Conta Bancária</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Nome / Apelido</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Conta Principal Itaú" /></div>
              <div><Label>Banco / Instituição</Label><Input value={form.banco} onChange={(e) => setForm({ ...form, banco: e.target.value })} placeholder="Ex: Itaú, Nubank, Bradesco" /></div>
              
              {form.tipo === "banco" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Agência</Label><Input value={form.agencia} onChange={(e) => setForm({ ...form, agencia: e.target.value })} /></div>
                  <div><Label>Conta</Label><Input value={form.conta} onChange={(e) => setForm({ ...form, conta: e.target.value })} /></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Bandeira</Label>
                    <Select value={form.bandeira} onValueChange={(v) => setForm({ ...form, bandeira: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visa">Visa</SelectItem>
                        <SelectItem value="mastercard">Mastercard</SelectItem>
                        <SelectItem value="elo">Elo</SelectItem>
                        <SelectItem value="amex">American Express</SelectItem>
                        <SelectItem value="hipercard">Hipercard</SelectItem>
                        <SelectItem value="outra">Outra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Limite</Label><Input type="number" step="0.01" value={form.limite} onChange={(e) => setForm({ ...form, limite: e.target.value })} /></div>
                </div>
              )}

              <div><Label>Saldo Inicial</Label><Input type="number" step="0.01" value={form.saldo_inicial} onChange={(e) => setForm({ ...form, saldo_inicial: e.target.value })} /></div>
              <div><Label>Observações</Label><Input value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>
              
              <Button onClick={handleSubmit} className="w-full" disabled={!form.nome}>
                {editing ? "Atualizar" : "Cadastrar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Banco</TableHead>
              <TableHead>Agência / Conta</TableHead>
              <TableHead>Saldo Inicial</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : (registros as any[]).length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                Nenhum banco ou cartão cadastrado
              </TableCell></TableRow>
            ) : (
              (registros as any[]).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Badge variant={item.tipo === "banco" ? "default" : "secondary"} className="gap-1">
                      {item.tipo === "banco" ? <Building2 className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />}
                      {item.tipo === "banco" ? "Banco" : "Cartão"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{item.nome}</TableCell>
                  <TableCell>{item.banco || "—"}</TableCell>
                  <TableCell>
                    {item.tipo === "banco"
                      ? `${item.agencia || "—"} / ${item.conta || "—"}`
                      : item.bandeira ? item.bandeira.charAt(0).toUpperCase() + item.bandeira.slice(1) : "—"
                    }
                  </TableCell>
                  <TableCell>{fmt(Number(item.saldo_inicial || 0))}</TableCell>
                  <TableCell>
                    <Badge variant={item.ativo ? "default" : "destructive"}>
                      {item.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove.mutate(item.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
