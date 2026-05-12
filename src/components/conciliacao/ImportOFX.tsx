import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTableQuery, useTableMutation } from "@/hooks/useSupabaseQuery";
import { parseOFX } from "@/lib/ofxParser";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, FileText, CheckCircle2 } from "lucide-react";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => {
  if (!d) return "—";
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) return "—";
  return `${String(day).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
};

interface Props {
  bancos: any[];
}

export default function ImportOFX({ bancos }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { insert } = useTableMutation("extrato_bancario");
  const fileRef = useRef<HTMLInputElement>(null);
  const [bancoId, setBancoId] = useState("");
  const [preview, setPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const transactions = parseOFX(text);

    if (transactions.length === 0) {
      toast({ title: "Nenhuma transação encontrada no arquivo OFX", variant: "destructive" });
      return;
    }

    setPreview(transactions);
    toast({ title: `${transactions.length} transações encontradas` });
  };

  const handleImport = async () => {
    if (!bancoId) {
      toast({ title: "Selecione um banco/conta", variant: "destructive" });
      return;
    }
    if (preview.length === 0) return;

    setImporting(true);
    let imported = 0;
    let skipped = 0;

    for (const tx of preview) {
      try {
        await insert.mutateAsync({
          banco_cartao_id: bancoId,
          data_transacao: tx.date,
          descricao: tx.description,
          valor: tx.amount,
          tipo: tx.type,
          fitid: tx.fitid,
          origem: "ofx",
        });
        imported++;
      } catch (err: any) {
        if (err.message?.includes("duplicate") || err.code === "23505") {
          skipped++;
        } else {
          console.error("Erro ao importar:", err);
        }
      }
    }

    toast({ title: `Importação concluída: ${imported} importadas, ${skipped} duplicadas ignoradas` });
    setPreview([]);
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const bancosAtivos = bancos.filter((b: any) => b.ativo);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4" /> Importar Extrato OFX
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Banco / Conta</Label>
              <Select value={bancoId} onValueChange={setBancoId}>
                <SelectTrigger><SelectValue placeholder="Selecione o banco" /></SelectTrigger>
                <SelectContent>
                  {bancosAtivos.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Arquivo OFX</Label>
              <input
                ref={fileRef}
                type="file"
                accept=".ofx,.OFX"
                onChange={handleFile}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
            </div>
          </div>

          {preview.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {preview.length} transações prontas para importar
                </p>
                <Button onClick={handleImport} disabled={importing || !bancoId}>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((tx, i) => (
                      <TableRow key={i}>
                        <TableCell>{fmtDate(tx.date)}</TableCell>
                        <TableCell className="font-medium max-w-[300px] truncate">{tx.description}</TableCell>
                        <TableCell>
                          <Badge variant={tx.type === "entrada" ? "default" : "destructive"}>
                            {tx.type === "entrada" ? "Entrada" : "Saída"}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${tx.type === "entrada" ? "text-green-600" : "text-red-600"}`}>
                          {fmt(tx.amount)}
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
