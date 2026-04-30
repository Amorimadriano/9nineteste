import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTableQuery, useTableMutation } from "@/hooks/useSupabaseQuery";
import { useCnpjLookup } from "@/hooks/useCnpjLookup";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Users, Search, Loader2, Download, Upload, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { processarImportacao, ResultadoImportacao, ErroImportacao } from "@/lib/importCadastro";

const emptyForm = { nome: "", documento: "", email: "", telefone: "", endereco: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "", cep: "", cnae: "", natureza_juridica: "", observacoes: "" };
const COLUMNS = ["Nome", "CPF/CNPJ", "E-mail", "Telefone", "Endereço", "Cidade", "Estado", "Observações"];
const FIELD_MAP: Record<string, string> = { "Nome": "nome", "CPF/CNPJ": "documento", "E-mail": "email", "Telefone": "telefone", "Endereço": "endereco", "Cidade": "cidade", "Estado": "estado", "Observações": "observacoes" };

export default function Clientes() {
  const { data: clientes = [], isLoading } = useTableQuery("clientes");
  const { insert, update, remove } = useTableMutation("clientes");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ResultadoImportacao | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, session } = useAuth();
  const { empresaSelecionada } = useEmpresa();
  const { lookup, loading: cnpjLoading } = useCnpjLookup((updater) => setForm(updater));

  const filtered = (clientes as any[]).filter((c) =>
    c.nome?.toLowerCase().includes(search.toLowerCase()) ||
    c.documento?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const ALLOWED_FIELDS = ["nome", "documento", "email", "telefone", "endereco", "numero", "complemento", "bairro", "cidade", "estado", "cep", "cnae", "natureza_juridica", "observacoes"];

  const sanitizeForm = (raw: any) => {
    const clean: any = {};
    for (const key of ALLOWED_FIELDS) {
      if (raw[key] !== undefined) clean[key] = raw[key];
    }
    return clean;
  };

  const handleSubmit = async () => {
    const payload = sanitizeForm(form);
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
      nome: item.nome, documento: item.documento || "", email: item.email || "",
      telefone: item.telefone || "", endereco: item.endereco || "", numero: item.numero || "",
      complemento: item.complemento || "", bairro: item.bairro || "", cidade: item.cidade || "",
      estado: item.estado || "", cep: item.cep || "", cnae: item.cnae || "", natureza_juridica: item.natureza_juridica || "",
      observacoes: item.observacoes || "",
    });
    setOpen(true);
  };

  const handleExport = () => {
    const data = (clientes as any[]).map((c) => ({
      Nome: c.nome, "CPF/CNPJ": c.documento || "", "E-mail": c.email || "",
      Telefone: c.telefone || "", Endereço: c.endereco || "",
      Cidade: c.cidade || "", Estado: c.estado || "", Observações: c.observacoes || "",
    }));
    if (data.length === 0) {
      data.push({ Nome: "Exemplo Cliente", "CPF/CNPJ": "00.000.000/0001-00", "E-mail": "email@exemplo.com", Telefone: "(11) 99999-9999", Endereço: "Rua Exemplo, 123", Cidade: "São Paulo", Estado: "SP", Observações: "" });
    }
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = COLUMNS.map(() => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clientes");
    XLSX.writeFile(wb, "clientes.xlsx");
    toast({ title: "Planilha de clientes exportada!" });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user?.id) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }
    setImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      if (rows.length === 0) { toast({ title: "Planilha vazia", variant: "destructive" }); return; }

      const resultado = await processarImportacao({
        tabela: "clientes",
        userId: user.id,
        empresaId: empresaSelecionada?.id || null,
        session,
        rows,
        existingData: clientes as any[],
      });

      setImportResult(resultado);
      setImportDialogOpen(true);
      queryClient.invalidateQueries({ queryKey: ["clientes"] });

      const temErros = resultado.erros.length > 0;
      const descricao = `${resultado.importados} importados, ${resultado.atualizados} atualizados, ${resultado.ignorados} ignorados.${temErros ? ` ${resultado.erros.length} erro(s) encontrado(s).` : ""}`;
      toast({
        title: temErros ? "Importação concluída com avisos" : "Importação concluída!",
        description: descricao,
        variant: temErros ? "default" : "default",
      });
    } catch (err: any) {
      toast({ title: "Erro na importação", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground">Cadastro de clientes</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Exportar</Button>
          <Button onClick={() => fileInputRef.current?.click()} disabled={importing}>
            <Upload className="mr-2 h-4 w-4" /> {importing ? "Importando..." : "Importar"}
          </Button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Novo Cliente</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] p-0 overflow-hidden">
              <DialogHeader className="px-6 pt-6 pb-2"><DialogTitle>{editing ? "Editar" : "Novo"} Cliente</DialogTitle></DialogHeader>
              <div className="px-6 pb-6 overflow-y-auto" style={{ maxHeight: "calc(85vh - 80px)" }}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>CPF/CNPJ</Label>
                    <div className="flex gap-2">
                      <Input value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} placeholder="Digite o CNPJ para busca automática" />
                      <Button type="button" variant="outline" size="icon" onClick={() => lookup(form.documento)} disabled={cnpjLoading || form.documento.replace(/\D/g, "").length !== 14} title="Buscar CNPJ na Receita Federal">
                        {cnpjLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Digite 14 dígitos do CNPJ e clique na lupa para preencher automaticamente</p>
                  </div>
                  <div className="col-span-2"><Label>Nome *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
                  <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  <div><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>

                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-1 mb-1">Endereço</p>
                  </div>
                  <div><Label>CEP</Label><Input value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} /></div>
                  <div><Label>Cidade</Label><Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} /></div>
                  <div><Label>Estado</Label><Input value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} /></div>
                  <div className="col-span-2"><Label>Endereço</Label><Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} /></div>
                  <div><Label>Número</Label><Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} /></div>
                  <div><Label>Complemento</Label><Input value={form.complemento} onChange={(e) => setForm({ ...form, complemento: e.target.value })} /></div>
                  <div className="col-span-2"><Label>Bairro</Label><Input value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} /></div>

                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-1 mb-1">Dados da Receita Federal</p>
                  </div>
                  <div className="col-span-2"><Label>CNAE Principal</Label><Input value={form.cnae} onChange={(e) => setForm({ ...form, cnae: e.target.value })} /></div>
                  <div className="col-span-2"><Label>Natureza Jurídica</Label><Input value={form.natureza_juridica} onChange={(e) => setForm({ ...form, natureza_juridica: e.target.value })} /></div>

                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-1 mb-1">Outros</p>
                  </div>
                  <div className="col-span-2"><Label>Observações</Label><Input value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>
                </div>
                <Button onClick={handleSubmit} className="w-full mt-4" disabled={!form.nome}>
                  {editing ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Pesquisar clientes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF/CNPJ</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Cidade/UF</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />{search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
              </TableCell></TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell>{c.documento || "—"}</TableCell>
                  <TableCell>{c.email || "—"}</TableCell>
                  <TableCell>{c.telefone || "—"}</TableCell>
                  <TableCell>{c.cidade && c.estado ? `${c.cidade}/${c.estado}` : "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove.mutate(c.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de Relatório de Importação */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              {importResult && importResult.erros.length > 0 ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Importação Concluída com Avisos
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Importação Concluída com Sucesso
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 overflow-y-auto" style={{ maxHeight: "calc(80vh - 80px)" }}>
            {importResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border p-3 text-center bg-green-50">
                    <div className="text-2xl font-bold text-green-700">{importResult.importados}</div>
                    <div className="text-xs text-green-600">Importados</div>
                  </div>
                  <div className="rounded-lg border p-3 text-center bg-blue-50">
                    <div className="text-2xl font-bold text-blue-700">{importResult.atualizados}</div>
                    <div className="text-xs text-blue-600">Atualizados</div>
                  </div>
                  <div className="rounded-lg border p-3 text-center bg-yellow-50">
                    <div className="text-2xl font-bold text-yellow-700">{importResult.ignorados}</div>
                    <div className="text-xs text-yellow-600">Ignorados</div>
                  </div>
                </div>

                {importResult.erros.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      Erros encontrados ({importResult.erros.length})
                    </h4>
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">Linha</TableHead>
                            <TableHead className="w-24">Campo</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Motivo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importResult.erros.map((erro, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{erro.linha > 0 ? erro.linha : "—"}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">{erro.campo}</Badge>
                              </TableCell>
                              <TableCell className="font-mono text-xs max-w-[150px] truncate">{erro.valor || "—"}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{erro.motivo}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                <Button onClick={() => setImportDialogOpen(false)} className="w-full">
                  Fechar
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
