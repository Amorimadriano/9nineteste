import { useState, useRef, useMemo, useEffect } from "react";
import { useTableQuery, useTableMutation } from "@/hooks/useSupabaseQuery";
import { useCategoriasInteligentes } from "@/hooks/useCategoriasInteligentes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Tag, Search, Download, Upload, Link2, Calculator, Sparkles, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { Link as RouterLink } from "react-router-dom";
import { NATUREZAS_PLANO_CONTAS } from "@/lib/planoContas/types";
import type { PlanoConta } from "@/lib/planoContas/types";

const DEFAULT_PREFIXES = [
  "1.1", "1.2", "1.3", "1.4", "1.5",
  "2.1", "2.2", "2.3", "2.31", "2.32", "2.4", "2.5",
  "2.107", "2.108",
  "3.1", "3.12", "3.3", "3.30", "3.31", "3.311", "3.32", "3.33", "3.34", "3.35",
  "3.4", "3.5", "4.1", "5.1",
];

function isDefaultCategory(nome: string) {
  return DEFAULT_PREFIXES.some((p) => nome?.startsWith(p + " "));
}

export default function Categorias() {
  const { data: categorias = [], isLoading } = useTableQuery("categorias");
  const { insert, update, remove } = useTableMutation("categorias");
  const {
    categorias: categoriasComPlano,
    planoContas,
    buscarSugestaoPorNome,
    vincularConta,
    verificarCriarPlanoPadrao,
    isLoading: isLoadingInteligente,
  } = useCategoriasInteligentes();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    nome: "",
    tipo: "receita" as "receita" | "despesa",
    descricao: "",
    plano_conta_id: "",
  });
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState(false);
  const [activeTab, setActiveTab] = useState("todas");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const filtered = (categorias as any[]).filter((cat) =>
    cat.nome?.toLowerCase().includes(search.toLowerCase()) ||
    cat.descricao?.toLowerCase().includes(search.toLowerCase())
  );

  // Efeito para criar plano de contas padrão automaticamente ao carregar
  useEffect(() => {
    const init = async () => {
      if (!isLoading && !isLoadingInteligente && planoContas.length === 0) {
        await verificarCriarPlanoPadrao();
      }
    };
    init();
  }, [isLoading, isLoadingInteligente, planoContas.length]);

  const categoriasFiltradasPorTab = useMemo(() => {
    if (activeTab === "todas") return filtered;
    if (activeTab === "receita") return filtered.filter((c) => c.tipo === "receita");
    if (activeTab === "despesa") return filtered.filter((c) => c.tipo === "despesa");
    if (activeTab === "vinculadas") return filtered.filter((c) => c.plano_conta_id);
    return filtered;
  }, [filtered, activeTab]);

  const estatisticas = useMemo(() => ({
    total: (categorias as any[]).length,
    receita: (categorias as any[]).filter((c) => c.tipo === "receita").length,
    despesa: (categorias as any[]).filter((c) => c.tipo === "despesa").length,
    vinculadas: (categorias as any[]).filter((c) => c.plano_conta_id).length,
  }), [categorias]);

  const handleSubmit = async () => {
    if (!form.nome) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }

    // Buscar sugestão automática se plano_conta_id não estiver definido ou for "auto"
    let planoContaId = form.plano_conta_id === "auto" ? null : form.plano_conta_id || null;
    if (!planoContaId && form.nome) {
      const sugestao = buscarSugestaoPorNome(form.nome, form.tipo);
      if (sugestao) {
        const contaEncontrada = planoContas.find(
          (c) => c.codigo_conta === sugestao.codigo
        );
        if (contaEncontrada) {
          planoContaId = contaEncontrada.id;
        }
      }
    }

    const payload = {
      ...form,
      plano_conta_id: planoContaId || null,
    };

    if (editing) {
      await update.mutateAsync({ id: editing.id, ...payload });
    } else {
      await insert.mutateAsync(payload);
    }
    setOpen(false);
    setEditing(null);
    setForm({ nome: "", tipo: "receita", descricao: "", plano_conta_id: "" });
  };

  const handleEdit = (cat: any) => {
    setEditing(cat);
    setForm({
      nome: cat.nome || "",
      tipo: cat.tipo || "despesa",
      descricao: cat.descricao || "",
      plano_conta_id: cat.plano_conta_id || "",
    });
    setOpen(true);
  };

  const handleOpenNew = () => {
    setEditing(null);
    setForm({ nome: "", tipo: "receita", descricao: "", plano_conta_id: "" });
    setOpen(true);
  };

  const handleExport = () => {
    const data = (categorias as any[]).map((cat) => {
      const plano = planoContas.find((p) => p.id === cat.plano_conta_id);
      return {
        Nome: cat.nome,
        Tipo: cat.tipo,
        Descrição: cat.descricao || "",
        ContaContabil: plano ? `${plano.codigo_conta} - ${plano.descricao}` : "",
      };
    });

    if (data.length === 0) {
      data.push(
        { Nome: "Exemplo Receita", Tipo: "receita", Descrição: "Exemplo de categoria de receita", ContaContabil: "" },
        { Nome: "Exemplo Despesa", Tipo: "despesa", Descrição: "Exemplo de categoria de despesa", ContaContabil: "" },
      );
    }

    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [{ wch: 40 }, { wch: 12 }, { wch: 50 }, { wch: 40 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Categorias");
    XLSX.writeFile(wb, "categorias.xlsx");
    toast({ title: "Planilha exportada com sucesso!" });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws);

      if (rows.length === 0) {
        toast({ title: "Planilha vazia", description: "Nenhuma linha encontrada.", variant: "destructive" });
        return;
      }

      const existingNames = new Set((categorias as any[]).map((c) => c.nome?.toLowerCase()));
      let imported = 0;
      let skipped = 0;

      for (const row of rows) {
        const nome = (row["Nome"] || row["nome"] || "").toString().trim();
        let tipo = (row["Tipo"] || row["tipo"] || "").toString().trim().toLowerCase();
        const descricao = (row["Descrição"] || row["descricao"] || row["Descricao"] || "").toString().trim();

        if (!nome) { skipped++; continue; }
        if (existingNames.has(nome.toLowerCase())) { skipped++; continue; }
        if (tipo !== "receita" && tipo !== "despesa") tipo = "despesa";

        // Buscar sugestão automática
        const sugestao = buscarSugestaoPorNome(nome, tipo as "receita" | "despesa");
        let planoContaId = "";
        if (sugestao) {
          const contaEncontrada = planoContas.find(
            (c) => c.codigo_conta === sugestao.codigo
          );
          if (contaEncontrada) {
            planoContaId = contaEncontrada.id;
          }
        }

        await insert.mutateAsync({ nome, tipo, descricao, plano_conta_id: planoContaId });
        existingNames.add(nome.toLowerCase());
        imported++;
      }

      toast({
        title: `Importação concluída!`,
        description: `${imported} categorias importadas${skipped > 0 ? `, ${skipped} ignoradas (duplicadas ou vazias)` : ""}.`,
      });
    } catch (err: any) {
      toast({ title: "Erro na importação", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getPlanoContaVinculado = (categoria: any): PlanoConta | undefined => {
    return planoContas.find((p) => p.id === categoria.plano_conta_id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-display text-foreground">Categorias Financeiras</h1>
            <Badge variant="outline" className="text-xs">
              <RouterLink to="/plano-contas" className="flex items-center gap-1 hover:text-primary">
                <Calculator className="h-3 w-3" />
                Ver Plano de Contas
              </RouterLink>
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Gerencie as categorias de receitas e despesas vinculadas ao plano de contas contábil
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
            <Upload className="mr-2 h-4 w-4" /> {importing ? "Importando..." : "Importar"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleImport}
          />
          <Button onClick={handleOpenNew}>
            <Plus className="mr-2 h-4 w-4" /> Nova Categoria
          </Button>
        </div>
      </div>


      {/* Estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total de Categorias", value: estatisticas.total, icon: Tag, color: "text-blue-500" },
          { label: "Receitas", value: estatisticas.receita, icon: ArrowUpRight, color: "text-emerald-500" },
          { label: "Despesas", value: estatisticas.despesa, icon: ArrowUpRight, color: "text-rose-500" },
          { label: "Vinculadas ao Plano", value: estatisticas.vinculadas, icon: CheckCircle2, color: "text-amber-500" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold font-display">{stat.value}</p>
              </div>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Filtros e Tabs */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar categorias..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="todas">Todas</TabsTrigger>
            <TabsTrigger value="receita">Receitas</TabsTrigger>
            <TabsTrigger value="despesa">Despesas</TabsTrigger>
            <TabsTrigger value="vinculadas">Vinculadas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Plano de Contas</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || isLoadingInteligente ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">Carregando...</TableCell>
              </TableRow>
            ) : categoriasFiltradasPorTab.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  <Tag className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  {search ? "Nenhuma categoria encontrada" : "Nenhuma categoria cadastrada"}
                </TableCell>
              </TableRow>
            ) : (
              categoriasFiltradasPorTab.map((cat) => {
                const planoVinculado = getPlanoContaVinculado(cat);
                const naturezaInfo = planoVinculado
                  ? NATUREZAS_PLANO_CONTAS.find((n) => n.value === planoVinculado.natureza)
                  : null;

                return (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">
                      {cat.nome}
                      {isDefaultCategory(cat.nome) && (
                        <Badge variant="outline" className="ml-2 text-xs">Padrão</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={cat.tipo === "receita" ? "default" : "destructive"}>
                        {cat.tipo === "receita" ? "Receita" : "Despesa"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {planoVinculado ? (
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="font-mono text-xs"
                            style={{ color: naturezaInfo?.cor }}
                          >
                            {planoVinculado.codigo_conta}
                          </Badge>
                          <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                            {planoVinculado.descricao}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <Link2 className="h-3 w-3 mr-1" />
                          Não vinculado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{cat.descricao || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(cat)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {!isDefaultCategory(cat.nome) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => remove.mutate(cat.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog Categoria */}
      <Dialog open={open} onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setEditing(null);
          setForm({ nome: "", tipo: "receita", descricao: "", plano_conta_id: "" });
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar" : "Nova"} Categoria</DialogTitle>
            <DialogDescription>
              {editing
                ? "Edite a categoria e seu vínculo com o plano de contas"
                : "Crie uma nova categoria. O plano de contas será criado/vinculado automaticamente."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={form.nome}
                onChange={(e) => {
                  const nome = e.target.value;
                  setForm({ ...form, nome });
                }}
                placeholder="Ex: Aluguel, Serviços, etc"
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select
                value={form.tipo}
                onValueChange={(v) => setForm({ ...form, tipo: v as "receita" | "despesa" })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Descrição opcional da categoria"
              />
            </div>
            <div>
              <Label>Vincular ao Plano de Contas</Label>
              <Select
                value={form.plano_conta_id}
                onValueChange={(v) => setForm({ ...form, plano_conta_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Automático (recomendado)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automático (cria/vincula automaticamente)</SelectItem>
                  {planoContas
                    .filter((p) => p.tipo_conta === "analitica" && p.permite_lancamento)
                    .map((conta) => (
                      <SelectItem key={conta.id} value={conta.id}>
                        <span className="font-mono text-xs">{conta.codigo_conta}</span>
                        <span className="ml-2">{conta.descricao}</span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                <Sparkles className="inline h-3 w-3 mr-1" />
                {form.plano_conta_id
                  ? "Vinculado manualmente à conta selecionada"
                  : "O sistema criará ou vinculará automaticamente ao plano de contas"}
              </p>
            </div>
            <Button onClick={handleSubmit} className="w-full" disabled={!form.nome}>
              {editing ? "Atualizar" : "Criar"} Categoria
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
