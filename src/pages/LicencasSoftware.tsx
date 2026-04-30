import { useState, useMemo, useRef, useCallback } from "react";
import { useTableQuery, useTableMutation } from "@/hooks/useSupabaseQuery";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Key, Building2, Users, Copy, CheckCircle2, XCircle,
  PauseCircle, Clock, Edit2, Trash2, Loader2, ChevronLeft, ChevronRight,
  FileText, UploadCloud, X, AlertCircle, Save, Banknote, Settings2,
  UserCircle2, FileCheck2, Trash, Download,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const ADMIN_EMAILS = ["9ninebpo9@gmail.com", "adriano.amorim83@gmail.com", "amorim.adriano83@gmail.com", "marketing@9ninebusinesscontrol.com.br"];
const DRAFT_KEY = "licenca-rascunho-v1";
const BUCKET = "licencas-documentos";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

const tiposCliente = [
  { value: "escritorio", label: "Escritório de Contabilidade" },
  { value: "bpo", label: "BPO Financeiro" },
  { value: "consultor", label: "Consultor" },
];

const planos = [{ value: "profissional", label: "Profissional", preco: 199.90 }];

const modulosDisponiveis = [
  { id: "financeiro", label: "Financeiro" },
  { id: "fiscal", label: "Fiscal / NFS-e" },
  { id: "conciliacao", label: "Conciliação Bancária" },
  { id: "cartoes", label: "Conciliação de Cartões" },
  { id: "dre", label: "DRE Gerencial" },
  { id: "cobranca", label: "Régua de Cobrança" },
  { id: "openbanking", label: "Open Banking" },
  { id: "contabilidade", label: "Integração Contábil" },
];

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  ativa: { label: "Ativa", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle2 },
  suspensa: { label: "Suspensa", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: PauseCircle },
  cancelada: { label: "Cancelada", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
  expirada: { label: "Expirada", color: "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400", icon: Clock },
};

type ContatoExtra = { tipo: "financeiro" | "operacional" | "decisor"; nome: string; email: string; telefone: string };
type IntegracaoBancaria = { banco: string; agencia: string; conta: string; status: "conectado" | "pendente" | "desconectado" };
type DocumentoExtra = { nome: string; path: string; tipo: string; tamanho: number; uploaded_at: string };

type ConfigExtra = {
  modulos?: string[];
  contatos?: ContatoExtra[];
  integracoes?: IntegracaoBancaria[];
  documentos?: DocumentoExtra[];
  acesso_ativo?: boolean;
};

type FormState = {
  tipo_cliente: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  email: string;
  telefone: string;
  contato_nome: string;
  plano: string;
  valor_mensal: number;
  desconto_percentual: number;
  data_inicio: string;
  data_fim: string;
  status: string;
  max_usuarios: number;
  quantidade_licencas: number;
  observacoes: string;
  configuracao_extra: ConfigExtra;
};

const emptyForm: FormState = {
  tipo_cliente: "escritorio",
  razao_social: "",
  nome_fantasia: "",
  cnpj: "",
  email: "",
  telefone: "",
  contato_nome: "",
  plano: "profissional",
  valor_mensal: 199.90,
  desconto_percentual: 0,
  data_inicio: new Date().toISOString().split("T")[0],
  data_fim: "",
  status: "ativa",
  max_usuarios: 5,
  quantidade_licencas: 1,
  observacoes: "",
  configuracao_extra: {
    modulos: ["financeiro", "fiscal", "dre"],
    contatos: [],
    integracoes: [],
    documentos: [],
    acesso_ativo: true,
  },
};

const steps = [
  { id: 0, label: "Dados da Empresa", icon: Building2, desc: "CNPJ, razão social, fantasia" },
  { id: 1, label: "Configuração de Licença", icon: Settings2, desc: "Plano, módulos, usuários" },
  { id: 2, label: "Contatos e Responsáveis", icon: UserCircle2, desc: "Financeiro, operacional, decisor" },
  { id: 3, label: "Integração & Documentos", icon: Banknote, desc: "Bancos e contratos" },
];

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
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = ADMIN_EMAILS.includes(user?.email || "");
  if (!isAdmin) return <Navigate to="/" replace />;

  const updateConfig = (patch: Partial<ConfigExtra>) =>
    setForm(f => ({ ...f, configuracao_extra: { ...f.configuracao_extra, ...patch } }));

  const lookupCnpj = async () => {
    const clean = form.cnpj.replace(/\D/g, "");
    if (clean.length !== 14) {
      toast({ title: "CNPJ inválido", description: "Digite um CNPJ com 14 dígitos", variant: "destructive" });
      return;
    }
    setCnpjLoading(true);
    try {
      const { data: resp, error } = await supabase.functions.invoke("consultar-cnpj", {
        body: { cnpj: clean },
      });
      if (error) throw new Error(error.message || "Erro ao consultar CNPJ");
      if (resp?.error) throw new Error(resp.error);
      const data = resp?.data || {};
      const telefone = data.ddd_telefone_1
        ? `(${String(data.ddd_telefone_1).substring(0, 2)}) ${String(data.ddd_telefone_1).substring(2)}`
        : "";
      setForm(f => ({
        ...f,
        razao_social: data.razao_social || f.razao_social,
        nome_fantasia: data.nome_fantasia || f.nome_fantasia,
        email: data.email || f.email,
        telefone: telefone || f.telefone,
        contato_nome: data.qsa?.[0]?.nome_socio || f.contato_nome,
      }));
      toast({ title: "Dados preenchidos via Receita Federal" });
    } catch (err: any) {
      toast({ title: "Erro ao consultar CNPJ", description: err.message || "Verifique o número digitado", variant: "destructive" });
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
    const hoje = new Date();
    const em30dias = new Date(); em30dias.setDate(em30dias.getDate() + 30);
    const aVencer = all.filter(l => {
      if (!l.data_fim) return false;
      const d = new Date(l.data_fim + "T00:00:00");
      return d >= hoje && d <= em30dias;
    });
    const pendentes = all.filter(l => !l.cnpj || !l.email || !l.razao_social);
    const mrrTotal = ativas.reduce((s, l) => {
      const desc = Number(l.desconto_percentual || 0);
      const qtd = Number(l.quantidade_licencas || 1);
      return s + (Number(l.valor_mensal) * (1 - desc / 100) * qtd);
    }, 0);
    return {
      total: all.length,
      ativas: ativas.length,
      aVencer: aVencer.length,
      pendentes: pendentes.length,
      mrr: mrrTotal,
    };
  }, [licencas]);

  const openNew = () => {
    setEditId(null);
    // Tentar carregar rascunho
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        setForm({ ...emptyForm, ...draft });
        toast({ title: "Rascunho carregado", description: "Continuando o cadastro anterior" });
      } else {
        setForm(emptyForm);
      }
    } catch {
      setForm(emptyForm);
    }
    setCurrentStep(0);
    setDialogOpen(true);
  };

  const openEdit = (lic: any) => {
    setEditId(lic.id);
    const cfg: ConfigExtra = (lic.configuracao_extra as ConfigExtra) || {};
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
      configuracao_extra: {
        modulos: cfg.modulos ?? [],
        contatos: cfg.contatos ?? [],
        integracoes: cfg.integracoes ?? [],
        documentos: cfg.documentos ?? [],
        acesso_ativo: cfg.acesso_ativo ?? (lic.status === "ativa"),
      },
    });
    setCurrentStep(0);
    setDialogOpen(true);
  };

  const salvarRascunho = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      toast({ title: "Rascunho salvo localmente" });
    } catch {
      toast({ title: "Erro ao salvar rascunho", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!form.razao_social.trim()) {
      toast({ title: "Razão social é obrigatória", variant: "destructive" });
      setCurrentStep(0);
      return;
    }
    const payload: any = {
      ...form,
      data_fim: form.data_fim || null,
      observacoes: form.observacoes || null,
      status: form.configuracao_extra.acesso_ativo === false ? "suspensa" : form.status,
    };

    if (editId) {
      await update.mutateAsync({ id: editId, ...payload });
      toast({ title: "Licença atualizada" });
    } else {
      payload.user_id = user?.id;
      await insert.mutateAsync(payload);
      toast({ title: "Licença criada com sucesso!" });
      localStorage.removeItem(DRAFT_KEY);
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

  // Toggle de ativação
  const toggleAcesso = async (lic: any, ativo: boolean) => {
    const novoStatus = ativo ? "ativa" : "suspensa";
    const cfg = { ...((lic.configuracao_extra as ConfigExtra) || {}), acesso_ativo: ativo };
    await update.mutateAsync({ id: lic.id, status: novoStatus, configuracao_extra: cfg });
    toast({ title: ativo ? "Acesso ativado" : "Acesso suspenso" });
  };

  // ---- Drag and Drop ----
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    if (!user?.id) return;
    const arr = Array.from(files);
    if (arr.length === 0) return;
    setUploading(true);
    const novos: DocumentoExtra[] = [];
    try {
      for (const file of arr) {
        if (file.size > 10 * 1024 * 1024) {
          toast({ title: `${file.name}: máx 10MB`, variant: "destructive" });
          continue;
        }
        const id = editId || `temp-${Date.now()}`;
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${user.id}/${id}/${Date.now()}-${safeName}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
        if (error) {
          toast({ title: `Erro ao enviar ${file.name}`, description: error.message, variant: "destructive" });
          continue;
        }
        novos.push({
          nome: file.name,
          path,
          tipo: file.type || "application/octet-stream",
          tamanho: file.size,
          uploaded_at: new Date().toISOString(),
        });
      }
      if (novos.length > 0) {
        updateConfig({ documentos: [...(form.configuracao_extra.documentos || []), ...novos] });
        toast({ title: `${novos.length} documento(s) enviado(s)` });
      }
    } finally {
      setUploading(false);
    }
  }, [user?.id, editId, form.configuracao_extra.documentos, toast]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  const removerDocumento = async (doc: DocumentoExtra) => {
    await supabase.storage.from(BUCKET).remove([doc.path]);
    updateConfig({
      documentos: (form.configuracao_extra.documentos || []).filter(d => d.path !== doc.path),
    });
    toast({ title: "Documento removido" });
  };

  const baixarDocumento = async (doc: DocumentoExtra) => {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(doc.path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  // ---- Contatos ----
  const adicionarContato = () => {
    updateConfig({
      contatos: [...(form.configuracao_extra.contatos || []), { tipo: "financeiro", nome: "", email: "", telefone: "" }],
    });
  };
  const atualizarContato = (i: number, patch: Partial<ContatoExtra>) => {
    const list = [...(form.configuracao_extra.contatos || [])];
    list[i] = { ...list[i], ...patch };
    updateConfig({ contatos: list });
  };
  const removerContato = (i: number) =>
    updateConfig({ contatos: (form.configuracao_extra.contatos || []).filter((_, idx) => idx !== i) });

  // ---- Integrações Bancárias ----
  const adicionarIntegracao = () =>
    updateConfig({
      integracoes: [...(form.configuracao_extra.integracoes || []), { banco: "", agencia: "", conta: "", status: "pendente" }],
    });
  const atualizarIntegracao = (i: number, patch: Partial<IntegracaoBancaria>) => {
    const list = [...(form.configuracao_extra.integracoes || [])];
    list[i] = { ...list[i], ...patch };
    updateConfig({ integracoes: list });
  };
  const removerIntegracao = (i: number) =>
    updateConfig({ integracoes: (form.configuracao_extra.integracoes || []).filter((_, idx) => idx !== i) });

  const StatusBadge = ({ status }: { status: string }) => {
    const s = statusMap[status] || statusMap.ativa;
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
        <Icon className="h-3 w-3" /> {s.label}
      </span>
    );
  };

  const podeAvancar = () => {
    if (currentStep === 0) return form.razao_social.trim().length > 0;
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Header com Breadcrumb */}
      <div className="flex flex-col gap-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/">Início</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Clientes & Licenças</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">Gestão de Clientes & Licenças</h1>
            <p className="text-sm text-muted-foreground">Cadastro, configuração e monitoramento de licenças BPO</p>
          </div>
          <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={openNew}>
            <Plus className="h-4 w-4" /> Novo Cadastro
          </Button>
        </div>
      </div>

      {/* KPIs - Cards informativos no topo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Empresas Ativas", value: String(kpis.ativas), sub: `${kpis.total} no total`, icon: Building2, tone: "primary" },
          { label: "Licenças a Vencer", value: String(kpis.aVencer), sub: "próximos 30 dias", icon: Clock, tone: "amber" },
          { label: "Pendências de Cadastro", value: String(kpis.pendentes), sub: "dados incompletos", icon: AlertCircle, tone: "red" },
          { label: "MRR Mensal", value: fmt(kpis.mrr), sub: "receita recorrente", icon: Banknote, tone: "emerald" },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-border/60 hover:shadow-md transition-shadow h-full">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center",
                    kpi.tone === "primary" && "bg-primary/10 text-primary",
                    kpi.tone === "amber" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                    kpi.tone === "red" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                    kpi.tone === "emerald" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                  )}>
                    <kpi.icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
                <p className="text-2xl font-bold font-display mt-0.5">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filtros */}
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

      {/* Tabela */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-center">Qtd</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Acesso</TableHead>
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
              ) : items.map(lic => {
                const cfg = (lic.configuracao_extra as ConfigExtra) || {};
                const ativo = cfg.acesso_ativo ?? (lic.status === "ativa");
                return (
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
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-medium">
                        {lic.quantidade_licencas || 1}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {(() => {
                        const qtd = Number(lic.quantidade_licencas || 1);
                        const valorUnitario = Number(lic.valor_mensal) * (1 - Number(lic.desconto_percentual || 0) / 100);
                        return fmt(valorUnitario * qtd);
                      })()}
                    </TableCell>
                    <TableCell><StatusBadge status={lic.status} /></TableCell>
                    <TableCell className="text-center">
                      <Switch checked={ativo} onCheckedChange={(v) => toggleAcesso(lic, v)} />
                    </TableCell>
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
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Wizard Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-hidden p-0 flex flex-col">
          {/* Header do wizard */}
          <DialogHeader className="px-6 pt-5 pb-3 border-b shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink href="#">Clientes</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbPage>{editId ? "Editar Cadastro" : "Novo Cadastro"}</BreadcrumbPage></BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                <DialogTitle className="text-xl">{editId ? "Editar Licença" : "Novo Cliente / Licença"}</DialogTitle>
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={salvarRascunho}>
                <Save className="h-4 w-4" /> Salvar Rascunho
              </Button>
            </div>
          </DialogHeader>

          <div className="flex flex-1 overflow-hidden">
            {/* Stepper Lateral */}
            <aside className="hidden md:flex flex-col w-64 border-r bg-muted/30 p-4 gap-1 overflow-y-auto shrink-0">
              {steps.map((s) => {
                const active = s.id === currentStep;
                const done = s.id < currentStep;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setCurrentStep(s.id)}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
                      active && "bg-primary/10 border border-primary/20",
                      !active && "hover:bg-muted",
                    )}
                  >
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold",
                      active && "bg-primary text-primary-foreground",
                      done && "bg-emerald-500 text-white",
                      !active && !done && "bg-muted-foreground/20 text-muted-foreground",
                    )}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : s.id + 1}
                    </div>
                    <div className="min-w-0">
                      <p className={cn("text-sm font-medium", active && "text-primary")}>{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                    </div>
                  </button>
                );
              })}
            </aside>

            {/* Stepper mobile (chips no topo) */}
            <div className="md:hidden flex gap-1 overflow-x-auto px-4 py-2 border-b">
              {steps.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(s.id)}
                  className={cn(
                    "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium",
                    s.id === currentStep ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  {s.id + 1}. {s.label}
                </button>
              ))}
            </div>

            {/* Conteúdo do step */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-5"
                >
                  {/* STEP 0: Dados da Empresa */}
                  {currentStep === 0 && (
                    <>
                      <div>
                        <h2 className="text-lg font-semibold">Dados da Empresa</h2>
                        <p className="text-sm text-muted-foreground">Informações cadastrais e fiscais</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5 md:col-span-1">
                          <Label>Tipo de Cliente *</Label>
                          <Select value={form.tipo_cliente} onValueChange={v => setForm(f => ({ ...f, tipo_cliente: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {tiposCliente.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                          <Label>CNPJ</Label>
                          <div className="flex gap-2">
                            <Input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} placeholder="00.000.000/0000-00" />
                            <Button type="button" variant="outline" className="shrink-0 gap-2" onClick={lookupCnpj} disabled={cnpjLoading}>
                              {cnpjLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                              Buscar
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">Busca automática via Receita Federal (BrasilAPI)</p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label>Razão Social *</Label>
                        <Input value={form.razao_social} onChange={e => setForm(f => ({ ...f, razao_social: e.target.value }))} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label>Nome Fantasia</Label>
                          <Input value={form.nome_fantasia} onChange={e => setForm(f => ({ ...f, nome_fantasia: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>E-mail principal</Label>
                          <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Telefone</Label>
                          <Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label>Observações</Label>
                        <Textarea rows={3} value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
                      </div>
                    </>
                  )}

                  {/* STEP 1: Configuração de Licença */}
                  {currentStep === 1 && (
                    <>
                      <div>
                        <h2 className="text-lg font-semibold">Configuração de Licença</h2>
                        <p className="text-sm text-muted-foreground">Plano, módulos e limites de uso</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                          <Label>Qtd. Licenças (×{form.quantidade_licencas})</Label>
                          <Input type="number" min={1} value={form.quantidade_licencas} onChange={e => setForm(f => ({ ...f, quantidade_licencas: Number(e.target.value) }))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Máx. Usuários</Label>
                          <Input type="number" min={1} value={form.max_usuarios} onChange={e => setForm(f => ({ ...f, max_usuarios: Number(e.target.value) }))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Status</Label>
                          <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusMap).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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

                      {/* Toggle Acesso */}
                      <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                        <div>
                          <p className="font-medium text-sm">Acesso do cliente</p>
                          <p className="text-xs text-muted-foreground">Ativa ou suspende imediatamente o login do cliente</p>
                        </div>
                        <Switch
                          checked={form.configuracao_extra.acesso_ativo ?? true}
                          onCheckedChange={(v) => updateConfig({ acesso_ativo: v })}
                        />
                      </div>

                      {/* Módulos */}
                      <div>
                        <Label className="mb-2 block">Módulos ativos</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {modulosDisponiveis.map(m => {
                            const ativos = form.configuracao_extra.modulos || [];
                            const checked = ativos.includes(m.id);
                            return (
                              <label
                                key={m.id}
                                className={cn(
                                  "flex items-center gap-2 p-2.5 rounded-md border cursor-pointer transition-colors",
                                  checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                                )}
                              >
                                <input
                                  type="checkbox"
                                  className="rounded"
                                  checked={checked}
                                  onChange={(e) => {
                                    const next = e.target.checked
                                      ? [...ativos, m.id]
                                      : ativos.filter(x => x !== m.id);
                                    updateConfig({ modulos: next });
                                  }}
                                />
                                <span className="text-sm">{m.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}

                  {/* STEP 2: Contatos */}
                  {currentStep === 2 && (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-semibold">Contatos e Responsáveis</h2>
                          <p className="text-sm text-muted-foreground">Financeiro, operacional e decisor</p>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={adicionarContato} className="gap-2">
                          <Plus className="h-4 w-4" /> Adicionar
                        </Button>
                      </div>

                      <div className="space-y-1.5">
                        <Label>Contato principal</Label>
                        <Input value={form.contato_nome} onChange={e => setForm(f => ({ ...f, contato_nome: e.target.value }))} />
                      </div>

                      <div className="space-y-3">
                        {(form.configuracao_extra.contatos || []).length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-lg">
                            Nenhum contato adicional. Clique em "Adicionar" para incluir.
                          </p>
                        )}
                        {(form.configuracao_extra.contatos || []).map((c, i) => (
                          <Card key={i}>
                            <CardContent className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                <div className="md:col-span-3 space-y-1.5">
                                  <Label className="text-xs">Tipo</Label>
                                  <Select value={c.tipo} onValueChange={(v: any) => atualizarContato(i, { tipo: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="financeiro">Financeiro</SelectItem>
                                      <SelectItem value="operacional">Operacional</SelectItem>
                                      <SelectItem value="decisor">Decisor</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="md:col-span-3 space-y-1.5">
                                  <Label className="text-xs">Nome</Label>
                                  <Input value={c.nome} onChange={e => atualizarContato(i, { nome: e.target.value })} />
                                </div>
                                <div className="md:col-span-3 space-y-1.5">
                                  <Label className="text-xs">E-mail</Label>
                                  <Input value={c.email} onChange={e => atualizarContato(i, { email: e.target.value })} />
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                  <Label className="text-xs">Telefone</Label>
                                  <Input value={c.telefone} onChange={e => atualizarContato(i, { telefone: e.target.value })} />
                                </div>
                                <div className="md:col-span-1 flex justify-end">
                                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removerContato(i)}>
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}

                  {/* STEP 3: Integrações + Documentos */}
                  {currentStep === 3 && (
                    <>
                      <div>
                        <h2 className="text-lg font-semibold">Integração Bancária e Documentos</h2>
                        <p className="text-sm text-muted-foreground">Contas monitoradas e arquivos contratuais</p>
                      </div>

                      {/* Integrações */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label>Contas bancárias monitoradas</Label>
                          <Button type="button" variant="outline" size="sm" onClick={adicionarIntegracao} className="gap-2">
                            <Plus className="h-4 w-4" /> Adicionar conta
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {(form.configuracao_extra.integracoes || []).length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-6 border-2 border-dashed rounded-lg">
                              Nenhuma integração bancária cadastrada
                            </p>
                          )}
                          {(form.configuracao_extra.integracoes || []).map((b, i) => (
                            <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center p-3 border rounded-lg">
                              <Input className="md:col-span-4" placeholder="Banco" value={b.banco} onChange={e => atualizarIntegracao(i, { banco: e.target.value })} />
                              <Input className="md:col-span-2" placeholder="Agência" value={b.agencia} onChange={e => atualizarIntegracao(i, { agencia: e.target.value })} />
                              <Input className="md:col-span-3" placeholder="Conta" value={b.conta} onChange={e => atualizarIntegracao(i, { conta: e.target.value })} />
                              <Select value={b.status} onValueChange={(v: any) => atualizarIntegracao(i, { status: v })}>
                                <SelectTrigger className="md:col-span-2"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="conectado">Conectado</SelectItem>
                                  <SelectItem value="pendente">Pendente</SelectItem>
                                  <SelectItem value="desconectado">Desconectado</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button variant="ghost" size="icon" className="text-destructive md:col-span-1" onClick={() => removerIntegracao(i)}>
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Drag and Drop */}
                      <div>
                        <Label className="mb-2 block">Documentos (contrato social, procurações)</Label>
                        <div
                          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                          onDragLeave={() => setDragActive(false)}
                          onDrop={onDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={cn(
                            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                            dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30",
                          )}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => e.target.files && handleFiles(e.target.files)}
                          />
                          {uploading ? (
                            <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin" />
                          ) : (
                            <UploadCloud className="h-10 w-10 mx-auto text-muted-foreground" />
                          )}
                          <p className="text-sm font-medium mt-2">
                            {uploading ? "Enviando..." : "Arraste arquivos aqui ou clique para selecionar"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, JPG, PNG • máx 10MB cada</p>
                        </div>

                        {/* Lista de documentos */}
                        {(form.configuracao_extra.documentos || []).length > 0 && (
                          <div className="mt-3 space-y-2">
                            {(form.configuracao_extra.documentos || []).map((d, i) => (
                              <div key={i} className="flex items-center gap-3 p-2.5 border rounded-md bg-muted/20">
                                <FileCheck2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{d.nome}</p>
                                  <p className="text-xs text-muted-foreground">{(d.tamanho / 1024).toFixed(1)} KB</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => baixarDocumento(d)}>
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removerDocumento(d)}>
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Footer fixo - barra de ações */}
          <DialogFooter className="px-6 py-3 border-t bg-muted/30 shrink-0 flex-row sm:justify-between items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" /> Voltar
            </Button>

            <div className="text-xs text-muted-foreground hidden md:block">
              Etapa {currentStep + 1} de {steps.length}
            </div>

            {currentStep < steps.length - 1 ? (
              <Button
                onClick={() => setCurrentStep(s => Math.min(steps.length - 1, s + 1))}
                disabled={!podeAvancar()}
                className="gap-2"
              >
                Próximo <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={insert.isPending || update.isPending} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                {(insert.isPending || update.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Finalizar Cadastro
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar exclusão */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remover licença?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
