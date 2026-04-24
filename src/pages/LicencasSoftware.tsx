import { useState, useMemo } from "react";
import { useTableQuery, useTableMutation } from "@/hooks/useSupabaseQuery";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Plus, Search, Key, Building2, Users, Copy, CheckCircle2, XCircle,
  PauseCircle, Clock, Edit2, Trash2, RefreshCw, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const ADMIN_EMAILS = ["9ninebpo9@gmail.com", "adriano.amorim83@gmail.com", "marketing@9ninebusinesscontrol.com.br"];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

const tiposCliente = [
  { value: "escritorio", label: "Escritório de Contabilidade" },
  { value: "bpo", label: "BPO Financeiro" },
  { value: "consultor", label: "Consultor" },
];

const planos = [
  { value: "profissional", label: "Profissional", preco: 399.90 },
];

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  ativa: { label: "Ativa", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle2 },
  suspensa: { label: "Suspensa", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: PauseCircle },
  cancelada: { label: "Cancelada", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
  expirada: { label: "Expirada", color: "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400", icon: Clock },
};

const emptyForm = {
  tipo_cliente: "escritorio",
  razao_social: "",
  nome_fantasia: "",
  cnpj: "",
  email: "",
  telefone: "",
  contato_nome: "",
  plano: "profissional",
  valor_mensal: 399.90,
  desconto_percentual: 0,
  data_inicio: new Date().toISOString().split("T")[0],
  data_fim: "",
  status: "ativa",
  max_usuarios: 5,
  quantidade_licencas: 1,
  observacoes: "",
};

export default function LicencasSoftware() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: licencas = [] } = useTableQuery("licencas_software" as any);
  const { insert, update, remove } = useTableMutation("licencas_software" as any);
  useRealtimeSubscription("licencas_software", [["licencas_software"]]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [cnpjLoading, setCnpjLoading] = useState(false);

  // Admin guard - after all hooks
  const isAdmin = ADMIN_EMAILS.includes(user?.email || "");
  if (!isAdmin) return <Navigate to="/" replace />;

  const lookupCnpj = async () => {
    const clean = form.cnpj.replace(/\D/g, "");
    if (clean.length !== 14) {
      toast({ title: "CNPJ inválido", description: "Digite um CNPJ com 14 dígitos", variant: "destructive" });
      return;
    }
    setCnpjLoading(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);
      if (!res.ok) throw new Error("CNPJ não encontrado");
      const data = await res.json();
      const telefone = data.ddd_telefone_1
        ? `(${data.ddd_telefone_1.substring(0, 2)}) ${data.ddd_telefone_1.substring(2)}`
        : "";
      setForm(f => ({
        ...f,
        razao_social: data.razao_social || f.razao_social,
        nome_fantasia: data.nome_fantasia || f.nome_fantasia,
        email: data.email || f.email,
        telefone: telefone || f.telefone,
        contato_nome: data.qsa?.[0]?.nome_socio || f.contato_nome,
      }));
      toast({ title: "Dados do CNPJ preenchidos automaticamente!" });
    } catch {
      toast({ title: "Erro ao consultar CNPJ", description: "Verifique o número digitado", variant: "destructive" });
    } finally {
      setCnpjLoading(false);
    }
  };

  const items = useMemo(() => {
    let list = (licencas as any[]);
    if (statusFilter !== "todos") list = list.filter(l => l.status === statusFilter);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(l =>
        l.razao_social?.toLowerCase().includes(s) ||
        l.nome_fantasia?.toLowerCase().includes(s) ||
        l.cnpj?.includes(s) ||
        l.chave_licenca?.toLowerCase().includes(s)
      );
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [licencas, search, statusFilter]);

  const kpis = useMemo(() => {
    const all = licencas as any[];
    const ativas = all.filter(l => l.status === "ativa");
    const mrrTotal = ativas.reduce((s, l) => {
      const desc = Number(l.desconto_percentual || 0);
      const qtd = Number(l.quantidade_licencas || 1);
      return s + (Number(l.valor_mensal) * (1 - desc / 100) * qtd);
    }, 0);
    return {
      total: all.length,
      ativas: ativas.length,
      suspensas: all.filter(l => l.status === "suspensa").length,
      mrr: mrrTotal,
    };
  }, [licencas]);

  const openNew = () => {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (lic: any) => {
    setEditId(lic.id);
    setForm({
      tipo_cliente: lic.tipo_cliente || "escritorio",
      razao_social: lic.razao_social || "",
      nome_fantasia: lic.nome_fantasia || "",
      cnpj: lic.cnpj || "",
      email: lic.email || "",
      telefone: lic.telefone || "",
      contato_nome: lic.contato_nome || "",
      plano: lic.plano || "profissional",
      valor_mensal: Number(lic.valor_mensal),
      desconto_percentual: Number(lic.desconto_percentual || 0),
      data_inicio: lic.data_inicio || "",
      data_fim: lic.data_fim || "",
      status: lic.status || "ativa",
      max_usuarios: Number(lic.max_usuarios || 5),
      quantidade_licencas: Number(lic.quantidade_licencas || 1),
      observacoes: lic.observacoes || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.razao_social.trim()) {
      toast({ title: "Preencha a razão social", variant: "destructive" });
      return;
    }
    const payload: any = {
      ...form,
      data_fim: form.data_fim || null,
      observacoes: form.observacoes || null,
    };

    if (editId) {
      await update.mutateAsync({ id: editId, ...payload });
      toast({ title: "Licença atualizada com sucesso!" });
    } else {
      payload.user_id = user?.id;
      await insert.mutateAsync(payload);
      toast({ title: "Licença criada com sucesso!" });
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await remove.mutateAsync(deleteId);
    setDeleteId(null);
    toast({ title: "Licença removida" });
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({ title: "Chave copiada!" });
  };

  const handlePlanoChange = (plano: string) => {
    const p = planos.find(p => p.value === plano);
    setForm(f => ({ ...f, plano, valor_mensal: p?.preco || f.valor_mensal }));
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const s = statusMap[status] || statusMap.ativa;
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
        <Icon className="h-3 w-3" /> {s.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Licenças de Software</h1>
          <p className="text-sm text-muted-foreground">Gerencie licenças para escritórios, BPOs e consultores</p>
        </div>
        <Button className="gap-2" onClick={openNew}>
          <Plus className="h-4 w-4" /> Nova Licença
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total de Licenças", value: String(kpis.total), icon: Key, gradient: "var(--gradient-primary)" },
          { label: "Ativas", value: String(kpis.ativas), icon: CheckCircle2, gradient: "var(--gradient-accent)" },
          { label: "Suspensas", value: String(kpis.suspensas), icon: PauseCircle, gradient: "var(--gradient-danger)" },
          { label: "MRR (Receita Mensal)", value: fmt(kpis.mrr), icon: Building2, gradient: "var(--gradient-primary)" },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="hover:shadow-[var(--shadow-elevated)] transition-shadow h-full">
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className="text-lg font-bold font-display truncate">{kpi.value}</p>
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: kpi.gradient }}>
                    <kpi.icon className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome, CNPJ ou chave..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativa">Ativas</SelectItem>
                <SelectItem value="suspensa">Suspensas</SelectItem>
                <SelectItem value="cancelada">Canceladas</SelectItem>
                <SelectItem value="expirada">Expiradas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead className="text-center">Qtd</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Chave</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    Nenhuma licença encontrada
                  </TableCell>
                </TableRow>
              ) : items.map(lic => (
                <TableRow key={lic.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{lic.nome_fantasia || lic.razao_social}</p>
                      {lic.cnpj && <p className="text-xs text-muted-foreground">{lic.cnpj}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {tiposCliente.find(t => t.value === lic.tipo_cliente)?.label || lic.tipo_cliente}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">{lic.plano}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-medium">
                      {lic.quantidade_licencas || 1}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {(() => {
                      const qtd = Number(lic.quantidade_licencas || 1);
                      const valorUnitario = Number(lic.valor_mensal) * (1 - Number(lic.desconto_percentual || 0) / 100);
                      const valorTotal = valorUnitario * qtd;
                      return (
                        <>
                          {fmt(valorTotal)}
                          {qtd > 1 && (
                            <span className="text-xs text-muted-foreground ml-1 block">
                              {fmt(valorUnitario)} × {qtd}
                            </span>
                          )}
                          {Number(lic.desconto_percentual) > 0 && (
                            <span className="text-xs text-emerald-600 ml-1">(-{lic.desconto_percentual}%)</span>
                          )}
                        </>
                      );
                    })()}
                  </TableCell>
                  <TableCell><StatusBadge status={lic.status} /></TableCell>
                  <TableCell>
                    <button
                      onClick={() => copyKey(lic.chave_licenca)}
                      className="inline-flex items-center gap-1 text-xs font-mono bg-muted px-2 py-1 rounded hover:bg-muted/80 transition-colors"
                      title="Clique para copiar"
                    >
                      {lic.chave_licenca?.substring(0, 8)}...
                      <Copy className="h-3 w-3" />
                    </button>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {fmtDate(lic.data_inicio)}
                    {lic.data_fim && <> — {fmtDate(lic.data_fim)}</>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(lic)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(lic.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Licença" : "Nova Licença"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tipo de Cliente *</Label>
                <Select value={form.tipo_cliente} onValueChange={v => setForm(f => ({ ...f, tipo_cliente: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {tiposCliente.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Razão Social *</Label>
                <Input value={form.razao_social} onChange={e => setForm(f => ({ ...f, razao_social: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nome Fantasia</Label>
                <Input value={form.nome_fantasia} onChange={e => setForm(f => ({ ...f, nome_fantasia: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>CNPJ</Label>
                <div className="flex gap-2">
                  <Input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} placeholder="00.000.000/0000-00" />
                  <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={lookupCnpj} disabled={cnpjLoading} title="Buscar CNPJ na Receita Federal">
                    {cnpjLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Contato</Label>
                <Input value={form.contato_nome} onChange={e => setForm(f => ({ ...f, contato_nome: e.target.value }))} />
              </div>
            </div>

            <div className="border-t pt-4 mt-2">
              <h3 className="text-sm font-semibold mb-3">Plano e Faturamento</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Plano *</Label>
                  <Select value={form.plano} onValueChange={handlePlanoChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {planos.map(p => <SelectItem key={p.value} value={p.value}>{p.label} — {fmt(p.preco)}/mês</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Valor Mensal (R$)</Label>
                  <Input type="number" step="0.01" value={form.valor_mensal} onChange={e => setForm(f => ({ ...f, valor_mensal: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Desconto (%)</Label>
                  <Input type="number" min={0} max={100} value={form.desconto_percentual} onChange={e => setForm(f => ({ ...f, desconto_percentual: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1">
                    Qtd. Licenças
                    <span className="text-xs text-muted-foreground">(×{form.quantidade_licencas})</span>
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.quantidade_licencas}
                    onChange={e => setForm(f => ({ ...f, quantidade_licencas: Number(e.target.value) }))}
                    className="font-medium"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div className="space-y-1.5">
                  <Label>Máx. Usuários</Label>
                  <Input type="number" min={1} value={form.max_usuarios} onChange={e => setForm(f => ({ ...f, max_usuarios: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Data Início</Label>
                  <Input type="date" value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Data Fim</Label>
                  <Input type="date" value={form.data_fim} onChange={e => setForm(f => ({ ...f, data_fim: e.target.value }))} />
                </div>
              </div>
            </div>

            {editId && (
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="suspensa">Suspensa</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                    <SelectItem value="expirada">Expirada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={insert.isPending || update.isPending}>
              {editId ? "Salvar" : "Criar Licença"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Licença</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir esta licença? Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={remove.isPending}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
