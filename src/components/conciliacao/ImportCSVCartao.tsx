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
import { Upload, FileText, CheckCircle2, Info } from "lucide-react";
import * as XLSX from "xlsx";

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

const DATE_KEYS = ["data", "date", "data_transacao", "dt", "data transação", "data_compra", "data compra"];
const DESC_KEYS = ["descricao", "descrição", "description", "desc", "estabelecimento", "histórico", "historico", "lançamento", "lancamento"];
const AMOUNT_KEYS = ["valor", "amount", "value", "vl", "montante"];
const TYPE_KEYS = ["tipo", "type", "natureza", "categoria"];

function findKey(row: Record<string, any>, candidates: string[]): string | undefined {
  const keys = Object.keys(row).map(k => k.toLowerCase().trim());
  for (const c of candidates) {
    const idx = keys.findIndex(k => k === c || k.includes(c));
    if (idx !== -1) return Object.keys(row)[idx];
  }
  return undefined;
}

function parseDate(value: any): string {
  if (!value) return "";
  const s = String(value).trim();

  // DD/MM/YYYY or DD-MM-YYYY
  const brMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (brMatch) return `${brMatch[3]}-${brMatch[2].padStart(2, "0")}-${brMatch[1].padStart(2, "0")}`;

  // YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  // Excel serial date
  if (typeof value === "number" && value > 30000 && value < 60000) {
    const d = new Date((value - 25569) * 86400 * 1000);
    return d.toISOString().split("T")[0];
  }

  // Try Date parse
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];

  return "";
}

function parseAmount(value: any): number {
  if (typeof value === "number") return value;
  const s = String(value).replace(/[R$\s]/g, "").trim();
  // Handle Brazilian format: 1.234,56
  if (s.includes(",") && (s.indexOf(",") > s.lastIndexOf("."))) {
    return parseFloat(s.replace(/\./g, "").replace(",", ".")) || 0;
  }
  return parseFloat(s.replace(",", ".")) || 0;
}

export default function ImportCSVCartao({ bancos }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [cartaoId, setCartaoId] = useState("");
  const [preview, setPreview] = useState<ParsedTransaction[]>([]);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState("");

  const cartoes = useMemo(() => (bancos || []).filter((b: any) => (b.tipo === "cartao_credito" || b.tipo === "cartao_debito") && b.ativo), [bancos]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.toLowerCase().split(".").pop();
    if (!["csv", "xlsx", "xls"].includes(ext || "")) {
      toast({ title: "Formato inválido", description: "Selecione um arquivo CSV, XLSX ou XLS.", variant: "destructive" });
      return;
    }

    setFileName(file.name);
    setPreview([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (rows.length === 0) {
        toast({ title: "Planilha vazia", description: "O arquivo não contém dados.", variant: "destructive" });
        return;
      }

      const firstRow = rows[0];
      const dateKey = findKey(firstRow, DATE_KEYS);
      const descKey = findKey(firstRow, DESC_KEYS);
      const amountKey = findKey(firstRow, AMOUNT_KEYS);
      const typeKey = findKey(firstRow, TYPE_KEYS);

      if (!dateKey || !amountKey) {
        toast({
          title: "Colunas não identificadas",
          description: `Colunas encontradas: ${Object.keys(firstRow).join(", ")}. Necessário: Data e Valor.`,
          variant: "destructive",
        });
        return;
      }

      const transactions: ParsedTransaction[] = rows
        .map(row => {
          const date = parseDate(row[dateKey]);
          const rawAmount = parseAmount(row[amountKey]);
          const desc = descKey ? String(row[descKey]).trim() : "Transação importada";

          let type: "entrada" | "saida" = "saida";
          if (typeKey) {
            const t = String(row[typeKey]).toLowerCase();
            if (t.includes("entrada") || t.includes("crédito") || t.includes("credito") || t.includes("estorno")) {
              type = "entrada";
            }
          } else if (rawAmount < 0) {
            type = "entrada";
          }

          return { date, description: desc, amount: Math.abs(rawAmount), type };
        })
        .filter(t => t.date && t.amount > 0);

      if (transactions.length === 0) {
        toast({ title: "Nenhuma transação válida encontrada", variant: "destructive" });
      } else {
        setPreview(transactions);
        toast({ title: `${transactions.length} transações encontradas!` });
      }
    } catch (err: any) {
      console.error("Erro ao processar arquivo:", err);
      toast({ title: "Erro ao ler arquivo", description: err.message, variant: "destructive" });
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
        origem: "csv",
      });
      if (error) { errors++; } else { imported++; }
    }

    toast({ title: `Importação concluída: ${imported} importadas${errors > 0 ? `, ${errors} erros` : ""}` });
    queryClient.invalidateQueries({ queryKey: ["extrato_bancario"] });
    setPreview([]);
    setFileName("");
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeItem = (index: number) => setPreview(prev => prev.filter((_, i) => i !== index));

  const totalSaidas = preview.filter(t => t.type === "saida").reduce((s, t) => s + t.amount, 0);
  const totalEntradas = preview.filter(t => t.type === "entrada").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4" /> Importar Fatura via CSV / Excel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg bg-muted/50 flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              A planilha deve conter colunas de <strong>Data</strong> e <strong>Valor</strong>. Colunas opcionais: Descrição, Tipo.
              Formatos aceitos: CSV, XLSX, XLS. Datas nos formatos DD/MM/AAAA ou AAAA-MM-DD.
            </p>
          </div>

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
            </div>
            <div>
              <Label>Arquivo CSV / Excel</Label>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
            </div>
          </div>

          {preview.length > 0 && (
            <>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" /> {preview.length} transações
                  </p>
                  <Badge variant="outline" className="text-xs">Saídas: {fmt(totalSaidas)}</Badge>
                  <Badge variant="outline" className="text-xs">Entradas: {fmt(totalEntradas)}</Badge>
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
                          <Button size="sm" variant="ghost" onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive">✕</Button>
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
