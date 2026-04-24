import { useState, useRef } from "react";
import { useTableQuery, useTableMutation } from "@/hooks/useSupabaseQuery";
import { useCnpjLookup } from "@/hooks/useCnpjLookup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Truck, Search, Loader2, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

const emptyForm = { nome: "", documento: "", email: "", telefone: "", endereco: "", cidade: "", estado: "", observacoes: "" };
const COLUMNS = ["Nome", "CPF/CNPJ", "E-mail", "Telefone", "Endereço", "Cidade", "Estado", "Observações"];
const FIELD_MAP: Record<string, string> = { "Nome": "nome", "CPF/CNPJ": "documento", "E-mail": "email", "Telefone": "telefone", "Endereço": "endereco", "Cidade": "cidade", "Estado": "estado", "Observações": "observacoes" };

export default function Fornecedores() {
  const { data: fornecedores = [], isLoading } = useTableQuery("fornecedores");
  const { insert, update, remove } = useTableMutation("fornecedores");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { lookup, loading: cnpjLoading } = useCnpjLookup((updater) => setForm(updater));

  const filtered = (fornecedores as any[]).filter((f) =>
    f.nome?.toLowerCase().includes(search.toLowerCase()) ||
    f.documento?.toLowerCase().includes(search.toLowerCase()) ||
    f.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    if (editing) {
      await update.mutateAsync({ id: editing.id, ...form });
    } else {
      await insert.mutateAsync(form);
    }
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleEdit = (item: any) => {
    setEditing(item);
    setForm({
      nome: item.nome, documento: item.documento || "", email: item.email || "",
      telefone: item.telefone || "", endereco: item.endereco || "",
      cidade: item.cidade || "", estado: item.estado || "", observacoes: item.observacoes || "",
    });
    setOpen(true);
  };

  const handleExport = () => {
    const data = (fornecedores as any[]).map((f) => ({
      Nome: f.nome, "CPF/CNPJ": f.documento || "", "E-mail": f.email || "",
      Telefone: f.telefone || "", Endereço: f.endereco || "",
      Cidade: f.cidade || "", Estado: f.estado || "", Observações: f.observacoes || "",
    }));
    if (data.length === 0) {
      data.push({ Nome: "Exemplo Fornecedor", "CPF/CNPJ": "00.000.000/0001-00", "E-mail": "email@exemplo.com", Telefone: "(11) 99999-9999", Endereço: "Rua Exemplo, 123", Cidade: "São Paulo", Estado: "SP", Observações: "" });
    }
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = COLUMNS.map(() => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fornecedores");
    XLSX.writeFile(wb, "fornecedores.xlsx");
    toast({ title: "Planilha de fornecedores exportada!" });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      if (rows.length === 0) { toast({ title: "Planilha vazia", variant: "destructive" }); return; }

      const existingDocs = new Set((fornecedores as any[]).map((f) => f.documento?.replace(/\D/g, "")).filter(Boolean));
      let imported = 0, skipped = 0;

      for (const row of rows) {
        const record: any = {};
        for (const [col, field] of Object.entries(FIELD_MAP)) {
          const val = row[col] ?? row[col.toLowerCase()] ?? row[field] ?? "";
          record[field] = val.toString().trim();
        }
        if (!record.nome) { skipped++; continue; }
        const docClean = record.documento?.replace(/\D/g, "");
        if (docClean && existingDocs.has(docClean)) { skipped++; continue; }
        await insert.mutateAsync(record);
        if (docClean) existingDocs.add(docClean);
        imported++;
      }
      toast({ title: `Importação concluída!`, description: `${imported} fornecedores importados${skipped > 0 ? `, ${skipped} ignorados` : ""}.` });
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
          <h1 className="text-2xl font-bold font-display text-foreground">Fornecedores</h1>
          <p className="text-sm text-muted-foreground">Cadastro de fornecedores</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Exportar</Button>
          <Button onClick={() => fileInputRef.current?.click()} disabled={importing}>
            <Upload className="mr-2 h-4 w-4" /> {importing ? "Importando..." : "Importar"}
          </Button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Novo Fornecedor</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} Fornecedor</DialogTitle></DialogHeader>
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
                <div><Label>Cidade</Label><Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} /></div>
                <div><Label>Estado</Label><Input value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} /></div>
                <div className="col-span-2"><Label>Endereço</Label><Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} /></div>
                <div className="col-span-2"><Label>Observações</Label><Input value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={!form.nome}>
                {editing ? "Atualizar" : "Criar"}
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Pesquisar fornecedores..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
                <Truck className="h-8 w-8 mx-auto mb-2 opacity-30" />{search ? "Nenhum fornecedor encontrado" : "Nenhum fornecedor cadastrado"}
              </TableCell></TableRow>
            ) : (
              filtered.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.nome}</TableCell>
                  <TableCell>{f.documento || "—"}</TableCell>
                  <TableCell>{f.email || "—"}</TableCell>
                  <TableCell>{f.telefone || "—"}</TableCell>
                  <TableCell>{f.cidade && f.estado ? `${f.cidade}/${f.estado}` : "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(f)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove.mutate(f.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
