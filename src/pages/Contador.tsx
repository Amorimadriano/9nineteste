import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Upload,
  Send,
  Trash2,
  FileText,
  Mail,
  Save,
  Loader2,
} from "lucide-react";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface ContadorDoc {
  id: string;
  nome_arquivo: string;
  storage_path: string;
  tipo_arquivo: string | null;
  tamanho: number | null;
  mes_referencia: number | null;
  ano_referencia: number | null;
  enviado: boolean;
  enviado_em: string | null;
  created_at: string;
}

interface ContadorConfig {
  id: string;
  nome_contador: string | null;
  email_contador: string;
  escritorio: string | null;
}

export default function Contador() {
  const { user } = useAuth();
  const [config, setConfig] = useState<ContadorConfig | null>(null);
  const [docs, setDocs] = useState<ContadorDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Config form
  const [nomeContador, setNomeContador] = useState("");
  const [emailContador, setEmailContador] = useState("");
  const [escritorio, setEscritorio] = useState("");

  // Upload form
  const now = new Date();
  const [mesRef, setMesRef] = useState(String(now.getMonth() + 1));
  const [anoRef, setAnoRef] = useState(String(now.getFullYear()));

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [configRes, docsRes] = await Promise.all([
      (supabase.from("contador_config") as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
      (supabase.from("contador_documentos") as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (configRes.data) {
      setConfig(configRes.data);
      setNomeContador(configRes.data.nome_contador || "");
      setEmailContador(configRes.data.email_contador || "");
      setEscritorio(configRes.data.escritorio || "");
    }
    if (docsRes.data) setDocs(docsRes.data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveConfig = async () => {
    if (!user || !emailContador.trim()) {
      toast.error("Informe o e-mail do contador");
      return;
    }
    setSavingConfig(true);
    const payload = {
      user_id: user.id,
      nome_contador: nomeContador.trim() || null,
      email_contador: emailContador.trim(),
      escritorio: escritorio.trim() || null,
    };

    if (config) {
      await (supabase.from("contador_config") as any)
        .update(payload)
        .eq("id", config.id);
    } else {
      await (supabase.from("contador_config") as any).insert(payload);
    }
    toast.success("Dados do contador salvos");
    await fetchData();
    setSavingConfig(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.length) return;
    setUploading(true);
    const files = Array.from(e.target.files);

    for (const file of files) {
      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("contador-docs")
        .upload(path, file);

      if (uploadErr) {
        toast.error(`Erro ao enviar ${file.name}: ${uploadErr.message}`);
        continue;
      }

      await (supabase.from("contador_documentos") as any).insert({
        user_id: user.id,
        nome_arquivo: file.name,
        storage_path: path,
        tipo_arquivo: file.type || null,
        tamanho: file.size,
        mes_referencia: Number(mesRef),
        ano_referencia: Number(anoRef),
      });
    }

    toast.success(`${files.length} arquivo(s) enviado(s)`);
    e.target.value = "";
    await fetchData();
    setUploading(false);
  };

  const handleDelete = async (doc: ContadorDoc) => {
    await supabase.storage.from("contador-docs").remove([doc.storage_path]);
    await (supabase.from("contador_documentos") as any).delete().eq("id", doc.id);
    toast.success("Documento removido");
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(doc.id); return n; });
    await fetchData();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === docs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(docs.map((d) => d.id)));
    }
  };

  const handleSendToContador = async () => {
    if (!config?.email_contador) {
      toast.error("Configure o e-mail do contador primeiro");
      return;
    }
    if (selectedIds.size === 0) {
      toast.error("Selecione ao menos um documento");
      return;
    }

    setSending(true);
    const selectedDocs = docs.filter((d) => selectedIds.has(d.id));

    // Generate signed URLs for selected docs
    const urls: { name: string; url: string }[] = [];
    for (const doc of selectedDocs) {
      const { data } = await supabase.storage
        .from("contador-docs")
        .createSignedUrl(doc.storage_path, 60 * 60 * 24 * 7); // 7 days
      if (data?.signedUrl) {
        urls.push({ name: doc.nome_arquivo, url: data.signedUrl });
      }
    }

    const { error } = await supabase.functions.invoke("send-contador-email", {
      body: {
        to: config.email_contador,
        nomeContador: config.nome_contador || "Contador",
        documentos: urls,
        mesRef: Number(mesRef),
        anoRef: Number(anoRef),
      },
    });

    if (error) {
      toast.error("Erro ao enviar e-mail: " + error.message);
      setSending(false);
      return;
    }

    // Mark as sent
    const now = new Date().toISOString();
    for (const id of selectedIds) {
      await (supabase.from("contador_documentos") as any)
        .update({ enviado: true, enviado_em: now })
        .eq("id", id);
    }

    toast.success(`E-mail enviado para ${config.email_contador}`);
    setSelectedIds(new Set());
    await fetchData();
    setSending(false);
  };

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Contador</h1>
          <p className="text-muted-foreground text-sm">
            Armazene e envie documentos para o seu contador
          </p>
        </div>
      </div>

      {/* Configuração do Contador */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5" /> Dados do Contador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Nome do Contador</label>
              <Input
                placeholder="Nome do contador"
                value={nomeContador}
                onChange={(e) => setNomeContador(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">E-mail do Contador *</label>
              <Input
                type="email"
                placeholder="contador@email.com"
                value={emailContador}
                onChange={(e) => setEmailContador(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Escritório</label>
              <Input
                placeholder="Nome do escritório"
                value={escritorio}
                onChange={(e) => setEscritorio(e.target.value)}
              />
            </div>
          </div>
          <Button className="mt-4" onClick={handleSaveConfig} disabled={savingConfig}>
            {savingConfig ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Dados
          </Button>
        </CardContent>
      </Card>

      {/* Upload de Documentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="h-5 w-5" /> Enviar Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Mês de Referência</label>
              <Select value={mesRef} onValueChange={setMesRef}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Ano</label>
              <Input
                type="number"
                className="w-28"
                value={anoRef}
                onChange={(e) => setAnoRef(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Arquivos</label>
              <Input
                type="file"
                multiple
                onChange={handleUpload}
                disabled={uploading}
                accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.jpg,.jpeg,.png,.xml,.zip,.rar"
              />
            </div>
            {uploading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Documentos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" /> Documentos ({docs.length})
            </CardTitle>
            <Button
              onClick={handleSendToContador}
              disabled={sending || selectedIds.size === 0 || !config?.email_contador}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Enviar ao Contador ({selectedIds.size})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {docs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum documento cadastrado</p>
          ) : (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedIds.size === docs.length && docs.length > 0}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Referência</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enviado em</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docs.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(doc.id)}
                          onCheckedChange={() => toggleSelect(doc.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {doc.nome_arquivo}
                      </TableCell>
                      <TableCell>
                        {doc.mes_referencia && doc.ano_referencia
                          ? `${MESES[doc.mes_referencia - 1]} ${doc.ano_referencia}`
                          : "-"}
                      </TableCell>
                      <TableCell>{formatBytes(doc.tamanho)}</TableCell>
                      <TableCell>
                        {doc.enviado ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Enviado</Badge>
                        ) : (
                          <Badge variant="secondary">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {doc.enviado_em
                          ? new Date(doc.enviado_em).toLocaleDateString("pt-BR")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(doc)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
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
