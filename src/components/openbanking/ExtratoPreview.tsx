import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  EyeOff,
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "debit" | "credit";
  category?: string;
  status: "completed" | "pending" | "cancelled";
}

interface ExtratoPreviewProps {
  bankName: string;
  bankColor?: string;
  transactions: Transaction[];
  isLoading?: boolean;
  lastSync?: Date;
  onRefresh?: () => void;
  onViewFull?: () => void;
  maxItems?: number;
  showHeader?: boolean;
}

export function ExtratoPreview({
  bankName,
  bankColor = "#64748B",
  transactions,
  isLoading = false,
  lastSync,
  onRefresh,
  onViewFull,
  maxItems = 5,
  showHeader = true,
}: ExtratoPreviewProps) {
  const [showValues, setShowValues] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const displayedTransactions = expanded
    ? transactions
    : transactions.slice(0, maxItems);

  const totalIncome = transactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + t.amount, 0);

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatValue = (value: number) => {
    if (!showValues) return "R$ ••••••";
    return formatCurrency(value);
  };

  const getCategoryBadge = (category?: string) => {
    if (!category) return null;
    const colors: Record<string, string> = {
      "transferencia": "bg-blue-100 text-blue-700",
      "pix": "bg-purple-100 text-purple-700",
      "pagamento": "bg-green-100 text-green-700",
      "recebimento": "bg-emerald-100 text-emerald-700",
      "estorno": "bg-amber-100 text-amber-700",
      "tarifa": "bg-red-100 text-red-700",
    };
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded ${colors[category] || "bg-gray-100 text-gray-700"}`}>
        {category}
      </span>
    );
  };

  if (isLoading) {
    return (
      <Card>
        {showHeader && (
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header com informações do banco */}
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: bankColor }}
              >
                {bankName.charAt(0)}
              </div>
              <div>
                <CardTitle className="text-base">{bankName}</CardTitle>
                {lastSync && (
                  <p className="text-xs text-muted-foreground">
                    Atualizado {format(lastSync, "dd/MM HH:mm")}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowValues(!showValues)}
              >
                {showValues ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onRefresh}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Resumo de entradas e saídas */}
          <div className="flex gap-4 mt-3 pt-3 border-t">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                <ArrowDownLeft className="h-3 w-3 text-green-600" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Entradas</p>
                <p className="text-sm font-medium text-green-600">
                  {formatValue(totalIncome)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                <ArrowUpRight className="h-3 w-3 text-red-600" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Saídas</p>
                <p className="text-sm font-medium text-red-600">
                  {formatValue(totalExpense)}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      )}

      {/* Lista de transações */}
      <CardContent className="p-0">
        <div className="divide-y">
          <AnimatePresence>
            {displayedTransactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Ícone de tipo */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      transaction.type === "credit"
                        ? "bg-green-100"
                        : "bg-red-100"
                    }`}
                  >
                    {transaction.type === "credit" ? (
                      <ArrowDownLeft className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium line-clamp-1">
                      {transaction.description}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(transaction.date), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      {getCategoryBadge(transaction.category)}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-sm font-medium whitespace-nowrap ml-2 ${
                    transaction.type === "credit"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {transaction.type === "credit" ? "+" : "-"}
                  {formatValue(transaction.amount)}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Botão expandir/ver mais */}
        {transactions.length > maxItems && (
          <Button
            variant="ghost"
            className="w-full h-10 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Mostrar menos
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Ver {transactions.length - maxItems} transações anteriores
              </>
            )}
          </Button>
        )}

        {/* Estado vazio */}
        {transactions.length === 0 && (
          <div className="py-8 text-center">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhuma transação encontrada
            </p>
          </div>
        )}

        {/* Botão ver extrato completo */}
        {onViewFull && transactions.length > 0 && (
          <div className="p-3 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={onViewFull}
            >
              <FileText className="h-4 w-4 mr-2" />
              Ver extrato completo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Versão minimalista para dashboards
export function ExtratoPreviewCompact({
  transactions,
  isLoading,
  maxItems = 3,
}: Omit<ExtratoPreviewProps, "bankName" | "bankColor">) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {transactions.slice(0, maxItems).map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between py-2 border-b last:border-0"
        >
          <div className="flex items-center gap-2">
            {transaction.type === "credit" ? (
              <ArrowDownLeft className="h-3 w-3 text-green-500" />
            ) : (
              <ArrowUpRight className="h-3 w-3 text-red-500" />
            )}
            <span className="text-sm line-clamp-1">{transaction.description}</span>
          </div>
          <span
            className={`text-sm font-medium ${
              transaction.type === "credit" ? "text-green-600" : "text-red-600"
            }`}
          >
            {transaction.type === "credit" ? "+" : "-"}
            {formatCurrency(transaction.amount)}
          </span>
        </div>
      ))}
      {transactions.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhuma transação recente
        </p>
      )}
    </div>
  );
}

export default ExtratoPreview;
