/**
 * Tabela de Transações de Cartão
 * @agente-frontend
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BandeiraBadge } from "@/components/ui/BandeiraBadge";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  MoreVertical,
  CreditCard,
  Link2,
  Trash2,
} from "lucide-react";
import type { TransacaoCartao } from "./types";
import { cn } from "@/lib/utils";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

interface TabelaTransacoesCartaoProps {
  transacoes: TransacaoCartao[];
  onSelecionar?: (ids: string[]) => void;
  onConciliar?: (id: string) => void;
  onDesconciliar?: (id: string) => void;
  onConciliarManual?: (transacao: TransacaoCartao) => void;
  onExcluir?: (id: string) => void;
  loading?: boolean;
}

export default function TabelaTransacoesCartao({
  transacoes,
  onSelecionar,
  onConciliar,
  onDesconciliar,
  onConciliarManual,
  onExcluir,
  loading = false,
}: TabelaTransacoesCartaoProps) {
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  const handleSelecionarTudo = (checked: boolean) => {
    if (checked) {
      const novos = new Set(transacoes.map((t) => t.id));
      setSelecionados(novos);
      onSelecionar?.(Array.from(novos));
    } else {
      setSelecionados(new Set());
      onSelecionar?.([]);
    }
  };

  const handleSelecionarItem = (id: string, checked: boolean) => {
    const novos = new Set(selecionados);
    if (checked) {
      novos.add(id);
    } else {
      novos.delete(id);
    }
    setSelecionados(novos);
    onSelecionar?.(Array.from(novos));
  };

  const getStatusIcon = (status: TransacaoCartao["status"]) => {
    switch (status) {
      case "conciliado":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "divergente":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case "chargeback":
        return <RotateCcw className="h-5 w-5 text-red-500" />;
      default:
        return <XCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: TransacaoCartao["status"]) => {
    const variants: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
    > = {
      pendente: { label: "Pendente", variant: "secondary" },
      conciliado: { label: "Conciliado", variant: "default" },
      divergente: { label: "Divergente", variant: "outline" },
      chargeback: { label: "Chargeback", variant: "destructive" },
    };
    const config = variants[status] || variants.pendente;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (transacoes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg">
        <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p>Nenhuma transação de cartão encontrada.</p>
        <p className="text-sm mt-1">Importe um extrato para começar.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="max-h-[500px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12">
                <Checkbox
                  checked={selecionados.size === transacoes.length && transacoes.length > 0}
                  onCheckedChange={handleSelecionarTudo}
                />
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Bandeira</TableHead>
              <TableHead className="text-right">Bruto</TableHead>
              <TableHead className="text-right">Taxa</TableHead>
              <TableHead className="text-right">Líquido</TableHead>
              <TableHead>Cartão</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transacoes.map((transacao, index) => (
              <TableRow
                key={transacao.id}
                className={cn(
                  "border-b transition-colors hover:bg-muted/50",
                  transacao.status === "pendente" && "bg-yellow-50/30",
                  transacao.status === "divergente" && "bg-orange-50/30",
                  selecionados.has(transacao.id) && "bg-blue-50/50"
                )}
              >
                <TableCell>
                  <Checkbox
                    checked={selecionados.has(transacao.id)}
                    onCheckedChange={(checked) =>
                      handleSelecionarItem(transacao.id, checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell>{getStatusIcon(transacao.status)}</TableCell>
                <TableCell className="font-medium">
                  {fmtDate(transacao.data_transacao)}
                </TableCell>
                <TableCell>{fmtDate(transacao.data_pagamento || "")}</TableCell>
                <TableCell>
                  <BandeiraBadge bandeira={transacao.bandeira} size="sm" />
                </TableCell>
                <TableCell className="text-right font-medium">
                  {fmt(transacao.valor_bruto)}
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-xs text-red-500">
                    {transacao.taxa_percentual.toFixed(2)}%
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium text-green-600">
                  {fmt(transacao.valor_liquido)}
                </TableCell>
                <TableCell>
                  {transacao.numero_cartao_mascara && (
                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                      **** {transacao.numero_cartao_mascara}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {transacao.status === "pendente" ? (
                        <>
                          <DropdownMenuItem onClick={() => onConciliar?.(transacao.id)}>
                            <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                            Conciliar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onConciliarManual?.(transacao)}>
                            <Link2 className="h-4 w-4 mr-2 text-blue-500" />
                            Manual
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <DropdownMenuItem onClick={() => onDesconciliar?.(transacao.id)}>
                          <XCircle className="h-4 w-4 mr-2 text-yellow-500" />
                          Desconciliar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => onExcluir?.(transacao.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
