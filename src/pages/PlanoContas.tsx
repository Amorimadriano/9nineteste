import { useState, useMemo, useEffect } from "react";
import { useTableQuery, useTableMutation } from "@/hooks/useSupabaseQuery";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Folder, FileText, ChevronRight, ChevronDown,
  TreeDeciduous, Building2, ArrowUpCircle, ArrowDownCircle,
  Save, Download, Upload, Edit2, Trash2, CheckCircle2,
  Layers, Link2, Cog, FileSpreadsheet, AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Bypass typing for tables not present in generated types
const db: any = supabase;
import * as XLSX from "xlsx";
import {
  NATUREZAS_PLANO_CONTAS, TIPOS_CONTA,
  NIVEIS_HIERARQUIA, validarCodigoConta,
  extrairNivel, obterNaturezaPorCodigo,
  gerarProximoCodigo, PLANOS_PADRAO_CFC
} from "@/lib/planoContas/types";

const naturezaIcons: Record<string, any> = {
  ativa: Building2,
  passiva: Building2,
  receita: ArrowUpCircle,
  despesa: ArrowDownCircle,
  compensacao: Layers,
};

const naturezaColors: Record<string, string> = {
  ativa: "text-emerald-600",
  passiva: "text-amber-600",
  receita: "text-blue-600",
  despesa: "text-rose-600",
  compensacao: "text-gray-600",
};

export default function PlanoContas() {
  const { data: contas = [], isLoading } = useTableQuery("plano_contas" as any);
  const { data: categorias = [] } = useTableQuery("categorias" as any);
  const { data: mapeamentos = [] } = useTableQuery("mapeamento_contabil" as any);
  const { insert, update, remove } = useTableMutation("plano_contas" as any);
  const { insert: insertMapeamento, update: updateMapeamento, remove: removeMapeamento } = useTableMutation("mapeamento_contabil" as any);

  useRealtimeSubscription("plano_contas", [["plano_contas"]]);
  useRealtimeSubscription("mapeamento_contabil", [["mapeamento_contabil"]]);

  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("arvore");
  const [search, setSearch] = useState("");
  const [naturezaFilter, setNaturezaFilter] = useState<string>("todas");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["1", "2", "3", "4", "9"]));

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMapeamento, setDialogMapeamento] = useState(false);
  const [dialogImportar, setDialogImportar] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    codigo_conta: "",
    descricao: "",
    descricao_reduzida: "",
    natureza: "despesa",
    tipo_conta: "analitica",
    codigo_pai: "",
    ativo: true,
    permite_lancamento: true,
  });

  // Form mapeamento
  const [mapeamentoForm, setMapeamentoForm] = useState({
    categoria_id: "",
    plano_conta_id: "",
    tipo_lancamento: "despesa",
    historico_padrao: "",
    ativo: true,
    automatico: true,
  });

  const contasOrdenadas = useMemo(() => {
    const lista = (contas as any[]).slice();
    return lista.sort((a, b) => a.codigo_conta.localeCompare(b.codigo_conta));
  }, [contas]);

  const contasFiltradas = useMemo(() => {
    let lista = contasOrdenadas;

    if (naturezaFilter !== "todas") {
      lista = lista.filter(c => c.natureza === naturezaFilter);
    }
    if (tipoFilter !== "todos") {
      lista = lista.filter(c => c.tipo_conta === tipoFilter);
    }
    if (search) {
      const s = search.toLowerCase();
      lista = lista.filter(c =>
        c.codigo_conta.toLowerCase().includes(s) ||
        c.descricao?.toLowerCase().includes(s)
      );
    }
    return lista;
  }, [contasOrdenadas, naturezaFilter, tipoFilter, search]);

  const arvoreContas = useMemo(() => {
    const contasMap = new Map(contasFiltradas.map(c => [c.id, { ...c, children: [] }]));
    const raiz: any[] = [];

    contasFiltradas.forEach(conta => {
      const node = contasMap.get(conta.id);
      if (conta.codigo_pai) {
        const pai = contasFiltradas.find(c => c.codigo_conta === conta.codigo_pai);
        if (pai) {
          const parentNode = contasMap.get(pai.id);
          if (parentNode) {
            parentNode.children = parentNode.children || [];
            parentNode.children.push(node);
          }
        }
      } else {
        raiz.push(node);
      }
    });

    return raiz;
  }, [contasFiltradas]);

  const estatisticas = useMemo(() => {
    const all = contas as any[];
    return {
      total: all.length,
      sinteticas: all.filter(c => c.tipo_conta === "sintetica").length,
      analiticas: all.filter(c => c.tipo_conta === "analitica").length,
      ativas: all.filter(c => c.ativo).length,
      com_lancamento: all.filter(c => c.permite_lancamento).length,
      mapeamentos: mapeamentos.length,
    };
  }, [contas, mapeamentos]);

  const handleOpenNew = () => {
    setEditing(null);
    setForm({
      codigo_conta: "",
      descricao: "",
      descricao_reduzida: "",
      natureza: "despesa",
      tipo_conta: "analitica",
      codigo_pai: "",
      ativo: true,
      permite_lancamento: true,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (conta: any) => {
    setEditing(conta);
    setForm({
      codigo_conta: conta.codigo_conta,
      descricao: conta.descricao,
      descricao_reduzida: conta.descricao_reduzida || "",
      natureza: conta.natureza,
      tipo_conta: conta.tipo_conta,
      codigo_pai: conta.codigo_pai || "",
      ativo: conta.ativo,
      permite_lancamento: conta.permite_lancamento,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.codigo_conta || !form.descricao) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    if (!validarCodigoConta(form.codigo_conta)) {
      toast({ title: "Código inválido", description: "Use formato: X.XX.XXX.XXXX", variant: "destructive" });
      return;
    }

    const payload = {
      ...form,
      nivel: extrairNivel(form.codigo_conta),
    };

    if (editing) {
      await update.mutateAsync({ id: editing.id, ...payload });
      toast({ title: "Conta atualizada com sucesso!" });
    } else {
      await insert.mutateAsync(payload);
      toast({ title: "Conta criada com sucesso!" });
    }

    setDialogOpen(false);
  };

  const handleCriarPadrao = async () => {
    try {
      const { data, error } = await supabase.rpc("criar_plano_contas_padrao", {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
      });

      if (error) throw error;

      toast({ title: `Plano de contas padrão criado!`, description: `${data} contas criadas.` });
    } catch (err: any) {
      toast({ title: "Erro ao criar plano padrão", description: err.message, variant: "destructive" });
    }
  };

  const handleExportar = () => {
    const data = contasOrdenadas.map(c => ({
      Codigo: c.codigo_conta,
      Descricao: c.descricao,
      DescricaoReduzida: c.descricao_reduzida || "",
      Natureza: c.natureza,
      Tipo: c.tipo_conta,
      Nivel: c.nivel,
      CodigoPai: c.codigo_pai || "",
      Ativo: c.ativo ? "S" : "N",
      PermiteLancamento: c.permite_lancamento ? "S" : "N",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plano de Contas");
    XLSX.writeFile(wb, "plano_contas.xlsx");
    toast({ title: "Plano de contas exportado!" });
  };

  const handleImportar = async (file: File) => {
    try {
      setImportLoading(true);
      const reader = new FileReader();

      reader.onload = async (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          toast({ title: "Arquivo vazio", description: "O arquivo Excel não contém dados.", variant: "destructive" });
          setImportLoading(false);
          return;
        }

        // Validar e formatar dados
        const contasValidas = jsonData.map((row: any) => {
          const codigo = String(row.Codigo || "").trim();
          const descricao = String(row.Descricao || "").trim();
          const natureza = String(row.Natureza || "despesa").toLowerCase();
          const tipo = String(row.Tipo || "analitica").toLowerCase();

          if (!codigo || !descricao) return null;

          const nivel = codigo.split(".").length;
          const codigoPai = nivel > 1 ? codigo.split(".").slice(0, -1).join(".") : null;

          return {
            codigo_conta: codigo,
            descricao,
            descricao_reduzida: String(row.DescricaoReduzida || descricao.substring(0, 20)).trim(),
            natureza: ["ativa", "passiva", "receita", "despesa", "compensacao"].includes(natureza) ? natureza : "despesa",
            tipo_conta: ["sintetica", "analitica"].includes(tipo) ? tipo : "analitica",
            nivel,
            codigo_pai: codigoPai,
            ativo: String(row.Ativo || "S").toUpperCase() === "S",
            permite_lancamento: String(row.PermiteLancamento || "S").toUpperCase() === "S",
          };
        }).filter(Boolean);

        if (contasValidas.length === 0) {
          toast({ title: "Dados inválidos", description: "Verifique se o arquivo tem as colunas: Codigo, Descricao, Natureza, Tipo", variant: "destructive" });
          setImportLoading(false);
          return;
        }

        setImportPreview(contasValidas);
        setImportLoading(false);
      };

      reader.readAsBinaryString(file);
    } catch (err: any) {
      toast({ title: "Erro ao importar", description: err.message, variant: "destructive" });
      setImportLoading(false);
    }
  };

  const handleConfirmarImportacao = async () => {
    try {
      setImportLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      let sucesso = 0;
      let falhas = 0;

      // Ordenar por código para garantir que pais sejam inseridos primeiro
      const ordenado = [...importPreview].sort((a, b) => a.codigo_conta.localeCompare(b.codigo_conta));

      for (const conta of ordenado) {
        try {
          await insert.mutateAsync({
            ...conta,
            user_id: user.user.id,
          });
          sucesso++;
        } catch (err) {
          console.error("Erro ao inserir conta:", conta.codigo_conta, err);
          falhas++;
        }
      }

      toast({
        title: "Importação concluída!",
        description: `${sucesso} contas importadas${falhas > 0 ? `, ${falhas} falhas` : ""}.`,
        variant: falhas > 0 ? "default" : "default",
      });

      setDialogImportar(false);
      setImportPreview([]);
    } catch (err: any) {
      toast({ title: "Erro na importação", description: err.message, variant: "destructive" });
    } finally {
      setImportLoading(false);
    }
  };

  const toggleExpand = (codigo: string) => {
    const next = new Set(expanded);
    if (next.has(codigo)) {
      next.delete(codigo);
    } else {
      next.add(codigo);
    }
    setExpanded(next);
  };

  const renderArvore = (nodes: any[], level = 0) => {
    return nodes.map(node => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expanded.has(node.codigo_conta);
      const Icon = node.tipo_conta === "sintetica" ? Folder : FileText;
      const NatureIcon = naturezaIcons[node.natureza] || Building2;

      return (
        <div key={node.id} className="select-none">
          <div
            className={`flex items-center gap-2 py-2 px-2 hover:bg-muted rounded-lg cursor-pointer transition-colors ${level > 0 ? "ml-6 border-l pl-4" : ""}`}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={() => hasChildren && toggleExpand(node.codigo_conta)}
          >
            {hasChildren && (
              isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            {!hasChildren && <span className="w-4" />}

            <Icon className={`h-4 w-4 ${naturezaColors[node.natureza]}`} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{node.codigo_conta}</span>
                <span className="font-medium text-sm truncate">{node.descricao}</span>
              </div>
            </div>

            <Badge variant="outline" className={`text-xs ${node.tipo_conta === "analitica" ? "bg-blue-50" : "bg-gray-50"}`}>
              {node.tipo_conta === "sintetica" ? "Sintética" : "Analítica"}
            </Badge>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); handleOpenEdit(node); }}>
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {hasChildren && isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {renderArvore(node.children, level + 1)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <TreeDeciduous className="h-6 w-6 text-primary" />
            Plano de Contas
          </h1>
          <p className="text-sm text-muted-foreground">Estrutura contábil hierárquica conforme CFC</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handleExportar}>
            <Download className="h-4 w-4 mr-2" /> Exportar
          </Button>
          <Button variant="outline" onClick={() => setDialogImportar(true)}>
            <Upload className="h-4 w-4 mr-2" /> Importar
          </Button>
          <Button variant="outline" onClick={handleCriarPadrao}>
            <Layers className="h-4 w-4 mr-2" /> Plano Padrão
          </Button>
          <Button onClick={handleOpenNew}>
            <Plus className="h-4 w-4 mr-2" /> Nova Conta
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Total de Contas", value: estatisticas.total, icon: Layers },
          { label: "Sintéticas", value: estatisticas.sinteticas, icon: Folder },
          { label: "Analíticas", value: estatisticas.analiticas, icon: FileText },
          { label: "Com Lançamento", value: estatisticas.com_lancamento, icon: CheckCircle2 },
          { label: "Mapeamentos", value: estatisticas.mapeamentos, icon: Link2 },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className="text-xl font-bold font-display">{kpi.value}</p>
                  </div>
                  <kpi.icon className="h-5 w-5 text-muted-foreground" />
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
              <Input
                placeholder="Buscar por código ou descrição..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={naturezaFilter} onValueChange={setNaturezaFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Natureza" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as naturezas</SelectItem>
                {NATUREZAS_PLANO_CONTAS.map(n => (
                  <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="sintetica">Sintéticas</SelectItem>
                <SelectItem value="analitica">Analíticas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="arvore">Árvore</TabsTrigger>
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="mapeamentos">Mapeamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="arvore" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-1">
                {arvoreContas.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <TreeDeciduous className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>Nenhuma conta encontrada</p>
                    <Button variant="outline" className="mt-4" onClick={handleCriarPadrao}>
                      Criar plano padrão
                    </Button>
                  </div>
                ) : (
                  renderArvore(arvoreContas)
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lista" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Natureza</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contasFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        Nenhuma conta encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    contasFiltradas.map(conta => (
                      <TableRow key={conta.id}>
                        <TableCell className="font-mono text-xs">{conta.codigo_conta}</TableCell>
                        <TableCell className="font-medium">{conta.descricao}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={naturezaColors[conta.natureza]}>
                            {NATUREZAS_PLANO_CONTAS.find(n => n.value === conta.natureza)?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={conta.tipo_conta === "analitica" ? "default" : "secondary"}>
                            {conta.tipo_conta === "analitica" ? "Analítica" : "Sintética"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{conta.nivel}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(conta)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapeamentos" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Mapeamento Automático
              </CardTitle>
              <Button onClick={() => setDialogMapeamento(true)}>
                <Plus className="h-4 w-4 mr-2" /> Novo Mapeamento
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria Financeira</TableHead>
                    <TableHead>Tipo Lançamento</TableHead>
                    <TableHead>Conta Contábil</TableHead>
                    <TableHead>Histórico Padrão</TableHead>
                    <TableHead>Automático</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(mapeamentos as any[]).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        Nenhum mapeamento configurado
                      </TableCell>
                    </TableRow>
                  ) : (
                    (mapeamentos as any[]).map(map => {
                      const cat = (categorias as any[]).find(c => c.id === map.categoria_id);
                      const conta = contasOrdenadas.find(c => c.id === map.plano_conta_id);
                      return (
                        <TableRow key={map.id}>
                          <TableCell className="font-medium">{cat?.nome || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={map.tipo_lancamento === "receita" ? "default" : "destructive"}>
                              {map.tipo_lancamento === "receita" ? "Receita" : "Despesa"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {conta?.codigo_conta} - {conta?.descricao}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{map.historico_padrao || "—"}</TableCell>
                          <TableCell>
                            {map.automatico ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <Cog className="h-4 w-4 text-amber-500" />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => removeMapeamento.mutate(map.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Conta */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Conta" : "Nova Conta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código da Conta *</Label>
                <Input
                  value={form.codigo_conta}
                  onChange={e => {
                    const cod = e.target.value;
                    const natureza = obterNaturezaPorCodigo(cod);
                    setForm(f => ({ ...f, codigo_conta: cod, natureza }));
                  }}
                  placeholder="4.1.02.0001"
                />
                <p className="text-xs text-muted-foreground">Formato: X.XX.XXX.XXXX</p>
              </div>
              <div className="space-y-2">
                <Label>Código Pai (opcional)</Label>
                <Input
                  value={form.codigo_pai}
                  onChange={e => setForm(f => ({ ...f, codigo_pai: e.target.value }))}
                  placeholder="4.1.02"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Input
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                placeholder="Aluguel"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição Reduzida (opcional)</Label>
              <Input
                value={form.descricao_reduzida}
                onChange={e => setForm(f => ({ ...f, descricao_reduzida: e.target.value }))}
                placeholder="ALUG (máx 20 caracteres)"
                maxLength={20}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Natureza</Label>
                <Select value={form.natureza} onValueChange={v => setForm(f => ({ ...f, natureza: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NATUREZAS_PLANO_CONTAS.map(n => (
                      <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Conta</Label>
                <Select value={form.tipo_conta} onValueChange={v => setForm(f => ({ ...f, tipo_conta: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_CONTA.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.ativo}
                  onCheckedChange={v => setForm(f => ({ ...f, ativo: v }))}
                />
                <Label>Conta ativa</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.permite_lancamento}
                  onCheckedChange={v => setForm(f => ({ ...f, permite_lancamento: v }))}
                />
                <Label>Permite lançamentos</Label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              {editing ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Importar */}
      <Dialog open={dialogImportar} onOpenChange={setDialogImportar}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Importar Plano de Contas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {importPreview.length === 0 ? (
              <>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Selecione um arquivo Excel (.xlsx ou .xls)
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    O arquivo deve conter as colunas: Codigo, Descricao, Natureza, Tipo
                  </p>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImportar(file);
                    }}
                    className="hidden"
                    id="import-file"
                  />
                  <Button
                    variant="outline"
                    disabled={importLoading}
                    onClick={() => document.getElementById("import-file")?.click()}
                  >
                    {importLoading ? "Carregando..." : "Selecionar Arquivo"}
                  </Button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="font-medium text-blue-900 mb-2 text-sm">Estrutura esperada do Excel:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-blue-800">
                    <li><strong>Codigo:</strong> Código da conta (ex: 1.1.01.0001)</li>
                    <li><strong>Descricao:</strong> Nome da conta</li>
                    <li><strong>Natureza:</strong> ativa, passiva, receita, despesa</li>
                    <li><strong>Tipo:</strong> sintetica ou analitica</li>
                    <li><strong>Ativo:</strong> S ou N</li>
                    <li><strong>PermiteLancamento:</strong> S ou N</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {importPreview.length} contas encontradas no arquivo. Revise antes de confirmar:
                </p>
                <div className="max-h-[300px] overflow-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Natureza</TableHead>
                        <TableHead>Tipo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importPreview.map((conta, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono text-xs">{conta.codigo_conta}</TableCell>
                          <TableCell>{conta.descricao}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{conta.natureza}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={conta.tipo_conta === "sintetica" ? "secondary" : "default"}>
                              {conta.tipo_conta}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setDialogImportar(false);
              setImportPreview([]);
            }}>
              {importPreview.length > 0 ? "Cancelar" : "Fechar"}
            </Button>
            {importPreview.length > 0 && (
              <Button onClick={handleConfirmarImportacao} disabled={importLoading}>
                {importLoading ? "Importando..." : `Importar ${importPreview.length} Contas`}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Mapeamento */}
      <Dialog open={dialogMapeamento} onOpenChange={setDialogMapeamento}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Mapeamento Contábil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Categoria Financeira</Label>
              <Select
                value={mapeamentoForm.categoria_id}
                onValueChange={v => setMapeamentoForm(f => ({ ...f, categoria_id: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(categorias as any[]).map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Lançamento</Label>
              <Select
                value={mapeamentoForm.tipo_lancamento}
                onValueChange={v => setMapeamentoForm(f => ({ ...f, tipo_lancamento: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Conta Contábil</Label>
              <Select
                value={mapeamentoForm.plano_conta_id}
                onValueChange={v => setMapeamentoForm(f => ({ ...f, plano_conta_id: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {contasOrdenadas.filter(c => c.permite_lancamento).map(conta => (
                    <SelectItem key={conta.id} value={conta.id}>
                      {conta.codigo_conta} - {conta.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Histórico Padrão (opcional)</Label>
              <Input
                value={mapeamentoForm.historico_padrao}
                onChange={e => setMapeamentoForm(f => ({ ...f, historico_padrao: e.target.value }))}
                placeholder="Ex: Ref. lançamento financeiro"
              />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={mapeamentoForm.automatico}
                  onCheckedChange={v => setMapeamentoForm(f => ({ ...f, automatico: v }))}
                />
                <Label>Mapeamento automático</Label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogMapeamento(false)}>Cancelar</Button>
            <Button
              onClick={async () => {
                await insertMapeamento.mutateAsync(mapeamentoForm);
                setDialogMapeamento(false);
                toast({ title: "Mapeamento criado com sucesso!" });
              }}
              disabled={!mapeamentoForm.categoria_id || !mapeamentoForm.plano_conta_id}
            >
              <Save className="h-4 w-4 mr-2" /> Criar Mapeamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
