import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Paperclip, Upload, Trash2, FileText, Download } from "lucide-react";

interface AnexosProps {
  contaId: string;
  tipo: "pagar" | "receber";
}

interface Anexo {
  id: string;
  nome_arquivo: string;
  storage_path: string;
  tipo_arquivo: string | null;
  tamanho: number | null;
  created_at: string;
}

export default function Anexos({ contaId, tipo }: AnexosProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchAnexos = async () => {
    const col = tipo === "pagar" ? "conta_pagar_id" : "conta_receber_id";
    const { data } = await (supabase.from("anexos") as any)
      .select("*")
      .eq(col, contaId)
      .order("created_at", { ascending: false });
    setAnexos(data || []);
  };

  useEffect(() => {
    if (open) fetchAnexos();
  }, [open]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setLoading(true);

    const path = `${user.id}/${contaId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("anexos")
      .upload(path, file);

    if (uploadError) {
      toast({ title: "Erro ao enviar arquivo", variant: "destructive" });
      setLoading(false);
      return;
    }

    const col = tipo === "pagar" ? "conta_pagar_id" : "conta_receber_id";
    await (supabase.from("anexos") as any).insert({
      user_id: user.id,
      [col]: contaId,
      nome_arquivo: file.name,
      storage_path: path,
      tipo_arquivo: file.type,
      tamanho: file.size,
    });

    toast({ title: "Arquivo anexado!" });
    await fetchAnexos();
    setLoading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDelete = async (anexo: Anexo) => {
    await supabase.storage.from("anexos").remove([anexo.storage_path]);
    await (supabase.from("anexos") as any).delete().eq("id", anexo.id);
    toast({ title: "Anexo removido" });
    await fetchAnexos();
  };

  const handleDownload = (anexo: Anexo) => {
    const { data } = supabase.storage.from("anexos").getPublicUrl(anexo.storage_path);
    window.open(data.publicUrl, "_blank");
  };

  const fmtSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} title="Anexos">
        <Paperclip className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Paperclip className="h-4 w-4" /> Anexos
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer border border-dashed rounded-lg p-3 hover:bg-muted/50 transition-colors">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {loading ? "Enviando..." : "Clique para anexar arquivo"}
              </span>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={handleUpload}
                disabled={loading}
              />
            </label>

            {anexos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum anexo</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {anexos.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.nome_arquivo}</p>
                      <p className="text-[10px] text-muted-foreground">{fmtSize(a.tamanho)}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(a)}>
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(a)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
