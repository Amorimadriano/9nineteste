import { useState, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, FileText, CheckCircle2, Loader2 } from "lucide-react";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

interface Props {
  bancos: any[];
}

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "entrada" | "saida";
}

async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const pdfjsLib = await import("pdfjs-dist");
    const version = "4.4.168";
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    }).promise;

    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((item: any) => item.str).join(" ");
      pages.push(text);
    }

    const fullText = pages.join("\n\n").trim();
    return fullText.length > 10 ? fullText : "";
  } catch (err) {
    console.warn("pdfjs-dist extraction failed, will use multimodal fallback:", err);
    return "";
  }
}

async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export default function ImportPDFCartao({ bancos }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [cartaoId, setCartaoId] = useState("");
  const [preview, setPreview] = useState<ParsedTransaction[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState("");

  const cartoes = useMemo(() => (bancos || []).filter((b: any) => (b.tipo === "cartao_credito" || b.tipo === "cartao_debito") && b.ativo), [bancos]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "Selecione um arquivo PDF", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "O PDF deve ter no máximo 10MB.", variant: "destructive" });
      return;
    }

    setFileName(file.name);
    setParsing(true);
    setPreview([]);

    try {
      // Try text extraction first
      let pdfText = "";
      try {
        pdfText = await extractTextFromPdf(file);
      } catch {
        // silently fall through to base64
      }

      let body: Record<string, string>;
      if (pdfText) {
        body = { text: pdfText };
      } else {
        // Send PDF as base64 for multimodal AI processing
        const base64 = await fileToBase64(file);
        body = { pdf_base64: base64, filename: file.name };
      }

      const { data, error } = await supabase.functions.invoke("parse-card-pdf", { body });

      if (error) {
        const msg = typeof error === "object" && "message" in error ? error.message : String(error);
        throw new Error(msg);
      }

      if (data?.error) {
        toast({ title: "Aviso", description: data.error, variant: "destructive" });
        return;
      }

      const transactions: ParsedTransaction[] = (data?.transactions || []).map((t: any) => ({
        date: t.date,
        description: t.description,
        amount: Math.abs(Number(t.amount)),
        type: t.type === "entrada" ? "entrada" as const : "saida" as const,
      }));

      if (transactions.length === 0) {
        toast({
          title: "Nenhuma transação encontrada no PDF",
          description: "Verifique se o arquivo é uma fatura de cartão válida com transações listadas.",
          variant: "destructive",
        });
      } else {
        setPreview(transactions);
        toast({ title: `${transactions.length} transações encontradas no PDF!` });
      }
    } catch (err: any) {
      console.error("Erro ao processar PDF:", err);
      toast({
        title: "Erro ao processar PDF",
        description: err.message || "Tente novamente com outro arquivo.",
        variant: "destructive",
      });
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (!cartaoId) {
      toast({ title: "Selecione um cartão", variant: "destructive" });
      return;
    }
    if (preview.length === 0) return;

    setImporting(true);
    let imported = 0;
    let errors = 0;

    for (const tx of preview) {
      const { error } = await (supabase.from("extrato_bancario") as any).insert({
        user_id: user!.id,
        banco_cartao_id: cartaoId,
        data_transacao: tx.date,
        descricao: tx.description,
        valor: tx.amount,
        tipo: tx.type,
        origem: "pdf",
      });

      if (error) {
        console.error("Erro ao inserir:", error);
        errors++;
      } else {
        imported++;
      }
    }

    toast({ title: `Importação concluída: ${imported} importadas${errors > 0 ? `, ${errors} erros` : ""}` });
    queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });
    setPreview([]);
    setFileName("");
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeItem = (index: number) => {
    setPreview(prev => prev.filter((_, i) => i !== index));
  };

  const totalSaidas = preview.filter(t => t.type === "saida").reduce((s, t) => s + t.amount, 0);
  const totalEntradas = preview.filter(t => t.type === "entrada").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4" /> Importar Fatura PDF de Cartão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Cartão</Label>
              <Select value={cartaoId} onValueChange={setCartaoId}>
                <SelectTrigger><SelectValue placeholder="Selecione o cartão" /></SelectTrigger>
                <SelectContent>
                  {cartoes.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome} ({c.tipo === "cartao_credito" ? "Crédito" : "Débito"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {cartoes.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Nenhum cartão cadastrado. Cadastre em <strong>Bancos e Cartões</strong>.
                </p>
              )}
            </div>
            <div>
              <Label>Arquivo PDF da Fatura</Label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={parsing}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer disabled:opacity-50"
              />
              <p className="text-xs text-muted-foreground mt-1">Suporta PDFs de texto e imagem (máx. 10MB)</p>
            </div>
          </div>

          {parsing && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div>
                <p className="text-sm font-medium">Processando PDF com IA...</p>
                <p className="text-xs text-muted-foreground">Extraindo e identificando transações de "{fileName}"</p>
              </div>
            </div>
          )}

          {preview.length > 0 && (
            <>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {preview.length} transações prontas
                  </p>
                  <Badge variant="outline" className="text-xs">
                    Saídas: {fmt(totalSaidas)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Entradas: {fmt(totalEntradas)}
                  </Badge>
                </div>
                <Button onClick={handleImport} disabled={importing || !cartaoId}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {importing ? "Importando..." : "Confirmar Importação"}
                </Button>
              </div>

              <div className="rounded-xl border max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((tx, i) => (
                      <TableRow key={i}>
                        <TableCell>{fmtDate(tx.date)}</TableCell>
                        <TableCell className="font-medium max-w-[300px] truncate">{tx.description}</TableCell>
                        <TableCell>
                          <Badge variant={tx.type === "entrada" ? "default" : "destructive"}>
                            {tx.type === "entrada" ? "Estorno" : "Compra"}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${tx.type === "entrada" ? "text-green-600" : "text-red-600"}`}>
                          {fmt(tx.amount)}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive">
                            ✕
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
