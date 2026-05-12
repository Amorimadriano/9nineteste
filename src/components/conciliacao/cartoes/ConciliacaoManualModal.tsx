/**
 * Modal de Conciliação Manual para Cartões
 * @agente-frontend
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BandeiraBadge } from "@/components/ui/BandeiraBadge";
import {
  AlertCircle,
  Search,
  Link2,
  CheckCircle2,
  Calculator,
  FileText,
} from "lucide-react";
import type { ConciliacaoManualModalProps } from "./types";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

export default function ConciliacaoManualModal({
  transacao,
  candidatos,
  onClose,
  onConciliar,
  onConciliarDireto,
}: ConciliacaoManualModalProps) {
  const [busca, setBusca] = useState("");
  const [abaAtiva, setAbaAtiva] = useState("sugeridos");
  const [processando, setProcessando] = useState(false);
  const [candidatoSelecionado, setCandidatoSelecionado] = useState<string | null>(null);

  const candidatosFiltrados = useMemo(() => {
    if (!busca) return candidatos;
    const termo = busca.toLowerCase();
    return candidatos.filter(
      (c) =>
        c.descricao.toLowerCase().includes(termo) ||
        c.valor.toString().includes(termo) ||
        c.data.includes(termo)
    );
  }, [candidatos, busca]);

  const calcularDiferenca = (valorTransacao: number, valorCandidato: number) => {
    const diff = valorTransacao - valorCandidato;
    const percentual = valorCandidato > 0 ? Math.abs((diff / valorCandidato) * 100) : 0;
    return { diff, percentual };
  };

  const handleConciliar = async () => {
    if (!transacao || !candidatoSelecionado) return;
    setProcessando(true);

    const candidato = candidatos.find((c) => c.id === candidatoSelecionado);
    if (!candidato) return;

    await onConciliar(transacao.id, candidato.id, candidato.tipo);
    setProcessando(false);
    onClose();
  };

  const handleConciliarDireto = async () => {
    if (!transacao) return;
    setProcessando(true);
    await onConciliarDireto(transacao.id);
    setProcessando(false);
    onClose();
  };

  if (!transacao) return null;

  const diferenca = candidatoSelecionado
    ? calcularDiferenca(
        transacao.valor_bruto,
        candidatos.find((c) => c.id === candidatoSelecionado)?.valor || 0
      )
    : { diff: 0, percentual: 0 };

  const temDivergencia = Math.abs(diferenca.diff) > 0.01;

  return (
    <Dialog open={!!transacao} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Conciliação Manual
          </DialogTitle>
          <DialogDescription>
            Vincule a transação do cartão com um lançamento existente
          </DialogDescription>
        </DialogHeader>

        {/* Resumo da Transação */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BandeiraBadge bandeira={transacao.bandeira} />
              <span className="text-sm text-muted-foreground">
                {fmtDate(transacao.data_transacao)}
              </span>
            </div>
            <span className="text-xl font-bold">{fmt(transacao.valor_bruto)}</span>
          </div>
          {transacao.linha_extrato && (
            <p className="text-sm text-muted-foreground">{transacao.linha_extrato}</p>
          )}
          <div className="flex gap-4 text-xs text-muted-foreground pt-2 border-t">
            <span>Líquido: {fmt(transacao.valor_liquido)}</span>
            <span>Taxa: {transacao.taxa_percentual.toFixed(2)}%</span>
            {transacao.numero_cartao_mascara && (
              <span>Cartão: **** {transacao.numero_cartao_mascara}</span>
            )}
          </div>
        </div>

        {/* Alerta de Divergência */}
        <AnimatePresence>
          {candidatoSelecionado && temDivergencia && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Alert variant="destructive" className="bg-orange-50 border-orange-200">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <AlertDescription>
                  Diferença de valor: {fmt(Math.abs(diferenca.diff))} ({diferenca.percentual.toFixed(2)}%)
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sugeridos">Sugeridos ({candidatos.length})</TabsTrigger>
            <TabsTrigger value="buscar"><Search className="h-4 w-4 mr-1" /> Buscar</TabsTrigger>
            <TabsTrigger value="direto"><FileText className="h-4 w-4 mr-1" /> Direto</TabsTrigger>
          </TabsList>

          <TabsContent value="sugeridos" className="flex-1 overflow-auto mt-0">
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Divergência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidatosFiltrados.map((c) => {
                    const { diff, percentual } = calcularDiferenca(transacao.valor_bruto, c.valor);
                    const selecionado = candidatoSelecionado === c.id;

                    return (
                      <TableRow
                        key={c.id}
                        className={`cursor-pointer ${selecionado ? "bg-blue-50" : ""}`}
                        onClick={() => setCandidatoSelecionado(c.id)}
                      >
                        <TableCell>
                          <input
                            type="radio"
                            checked={selecionado}
                            onChange={() => setCandidatoSelecionado(c.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {c.tipo === "conta_receber" ? "A Receber" : "Lançamento"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{c.descricao}</TableCell>
                        <TableCell>{fmtDate(c.data)}</TableCell>
                        <TableCell className="text-right">{fmt(c.valor)}</TableCell>
                        <TableCell>
                          {Math.abs(diff) > 0.01 ? (
                            <Badge variant="destructive" className="text-[10px]">
                              {percentual.toFixed(1)}%
                            </Badge>
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="buscar" className="mt-0">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descrição, valor ou data..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="direto" className="mt-0">
            <div className="text-center py-8 space-y-4">
              <Calculator className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium">Conciliar sem vínculo</p>
                <p className="text-sm text-muted-foreground">
                  Marque a transação como conciliada sem vincular a um lançamento específico
                </p>
              </div>
              <Button onClick={handleConciliarDireto} variant="outline">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirmar Conciliação Direta
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleConciliar}
            disabled={!candidatoSelecionado || processando}
          >
            <Link2 className="h-4 w-4 mr-2" />
            {processando ? "Processando..." : "Confirmar Vínculo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
