/**
 * Componente de Importação de Extrato de Cartão
 * @agente-frontend
 */

import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Upload, FileText, CheckCircle2, AlertCircle, FileSpreadsheet, X } from "lucide-react";
import { BandeiraBadge } from "@/components/ui/BandeiraBadge";
import { parseExtratoRede, parseExtratoCielo, parseExtratoStone, getTaxaPadrao } from "@/lib/cartoes";
import type { ParsedTransacaoCartao, BandeiraCartao, TransacaoCartao } from "@/types/cartoes";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

interface ImportarExtratoCartaoProps {
  onImportar: (transacoes: Partial<TransacaoCartao>[]) => Promise<void>;
}

export default function ImportarExtratoCartao({ onImportar }: ImportarExtratoCartaoProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ParsedTransacaoCartao[]>([]);
  const [importando, setImportando] = useState(false);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const totais = useMemo(() => {
    const totalBruto = preview.reduce((s, t) => s + t.valor_bruto, 0);
    return { totalBruto, count: preview.length };
  }, [preview]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.toLowerCase().split(".").pop();
    if (!["csv", "xlsx", "xls", "txt"].includes(ext || "")) {
      setErro("Formato inválido. Selecione um arquivo CSV, XLSX ou XLS.");
      return;
    }

    setNomeArquivo(file.name);
    setPreview([]);
    setErro(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      let resultado: { transacoes: ParsedTransacaoCartao[]; erros: string[] };

      // Tentar detectar o tipo de arquivo pelo nome ou conteúdo
      const nomeLower = file.name.toLowerCase();
      if (nomeLower.includes('rede') || nomeLower.includes('itau')) {
        resultado = parseExtratoRede(arrayBuffer, file.name);
      } else if (nomeLower.includes('cielo')) {
        resultado = parseExtratoCielo(arrayBuffer, file.name);
      } else if (nomeLower.includes('stone')) {
        resultado = parseExtratoStone(arrayBuffer, file.name);
      } else {
        // Tentar todos os parsers
        resultado = parseExtratoRede(arrayBuffer, file.name);
        if (resultado.transacoes.length === 0) {
          resultado = parseExtratoCielo(arrayBuffer, file.name);
        }
        if (resultado.transacoes.length === 0) {
          resultado = parseExtratoStone(arrayBuffer, file.name);
        }
      }

      if (resultado.erros.length > 0) {
        console.warn('Erros no parsing:', resultado.erros);
      }

      if (resultado.transacoes.length === 0) {
        setErro("Nenhuma transação válida encontrada no arquivo. Verifique o formato.");
      } else {
        setPreview(resultado.transacoes);
      }
    } catch (err: any) {
      setErro(`Erro ao processar arquivo: ${err.message}`);
    }
  };

  const handleImportar = async () => {
    if (preview.length === 0) return;
    setImportando(true);

    const transacoes: Partial<TransacaoCartao>[] = preview.map(t => {
      const taxaPercentual = getTaxaPadrao(t.bandeira) * 100;
      const valorTaxa = t.valor_bruto * (taxaPercentual / 100);
      const valorLiquido = t.valor_bruto - valorTaxa;

      return {
        data_transacao: t.data_transacao,
        data_pagamento: t.data_pagamento,
        bandeira: t.bandeira,
        valor_bruto: t.valor_bruto,
        taxa_percentual: taxaPercentual,
        valor_taxa: valorTaxa,
        valor_liquido: valorLiquido,
        numero_cartao_mascara: t.numero_cartao_mascara,
        nsu: t.nsu,
        codigo_autorizacao: t.codigo_autorizacao,
        tipo_transacao: t.tipo_transacao || 'credito',
        numero_parcelas: t.numero_parcelas || 1,
        parcela_atual: t.parcela_atual || 1,
        status: 'pendente',
        linha_extrato: t.descricao,
        arquivo_origem: nomeArquivo,
      };
    });

    await onImportar(transacoes);
    setImportando(false);
    setPreview([]);
    setNomeArquivo("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const removerItem = (index: number) => {
    setPreview(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            Importar Extrato de Cartão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
               onClick={() => fileRef.current?.click()}>
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-muted-foreground mb-2">
              Arraste um arquivo CSV ou Excel ou clique para selecionar
            </p>
            <p className="text-xs text-muted-foreground">
              Suporta: Rede, Cielo, Stone (.csv, .xlsx, .xls)
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            {nomeArquivo && (
              <p className="text-xs text-muted-foreground mt-2">
                Arquivo: {nomeArquivo}
              </p>
            )}
          </div>

          {/* Erro */}
          <AnimatePresence>
            {erro && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-4 pb-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <p className="text-sm text-red-700">{erro}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preview */}
          <AnimatePresence>
            {preview.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-xs">
                      {preview.length} transações
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Total Bruto: {fmt(totais.totalBruto)}
                    </Badge>
                  </div>
                  <Button onClick={handleImportar} disabled={importando}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {importando ? "Importando..." : "Confirmar Importação"}
                  </Button>
                </div>

                <div className="rounded-xl border max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Bandeira</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Valor Bruto</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.map((tx, i) => (
                        <TableRow key={i}>
                          <TableCell>{fmtDate(tx.data_transacao)}</TableCell>
                          <TableCell>
                            <BandeiraBadge bandeira={tx.bandeira} size="sm" />
                          </TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {tx.descricao || "Transação importada"}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {fmt(tx.valor_bruto)}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" onClick={() => removerItem(i)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
