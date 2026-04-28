import { useMemo, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import BudgetGrid from "@/components/budget/BudgetGrid";
import { BudgetRow, MONTHS } from "@/types/budget";
import { saveAllBudgetLines } from "@/lib/budgetService";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i);

function buildEmptyRows(accounts: any[]): BudgetRow[] {
  return accounts.map((acc) => ({
    accountId: acc.id,
    accountCode: acc.codigo_conta,
    accountName: acc.descricao,
    type: acc.natureza === "receita" ? "revenue" : "cost",
    months: MONTHS.reduce((accMonths, m) => {
      accMonths[m] = { value: null, source: null };
      return accMonths;
    }, {} as BudgetRow["months"]),
  }));
}

function mergeWithBudgetLines(
  rows: BudgetRow[],
  lines: any[]
): BudgetRow[] {
  const lineMap = new Map<string, any>();
  lines.forEach((line) => {
    lineMap.set(line.plano_conta_id, line.values);
  });

  return rows.map((row) => {
    const values = lineMap.get(row.accountId);
    if (!values) return row;

    const newMonths = { ...row.months };
    MONTHS.forEach((m) => {
      const cell = values[m];
      if (cell) {
        newMonths[m] = {
          value: cell.v ?? null,
          source: cell.s ?? null,
        };
      }
    });

    return { ...row, months: newMonths };
  });
}

export default function PlanejamentoOrcamentario() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fiscalYear, setFiscalYear] = useState(CURRENT_YEAR);

  const {
    data: accounts = [],
    isLoading: loadingAccounts,
  } = useQuery({
    queryKey: ["plano_contas_orcamento", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plano_contas")
        .select("id, codigo_conta, descricao, natureza, tipo_conta, ativo")
        .in("natureza", ["receita", "despesa"])
        .eq("tipo_conta", "analitica")
        .eq("ativo", true)
        .order("codigo_conta", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const {
    data: budgetLines = [],
    isLoading: loadingLines,
  } = useQuery({
    queryKey: ["budget_planning_lines", fiscalYear, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_planning_lines")
        .select("plano_conta_id, values")
        .eq("fiscal_year", fiscalYear)
        .eq("user_id", user!.id);

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const initialRows = useMemo(() => {
    const emptyRows = buildEmptyRows(accounts);
    return mergeWithBudgetLines(emptyRows, budgetLines);
  }, [accounts, budgetLines]);

  const saveMutation = useMutation({
    mutationFn: async (rows: BudgetRow[]) => {
      await saveAllBudgetLines(rows, fiscalYear, user!.id, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["budget_planning_lines", fiscalYear, user?.id],
      });
      toast({ title: "Orçamento salvo com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar orçamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = useCallback(
    async (rows: BudgetRow[]) => {
      await saveMutation.mutateAsync(rows);
    },
    [saveMutation]
  );

  const isLoading = loadingAccounts || loadingLines;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Planejamento Orçamentário
          </h1>
          <p className="text-sm text-muted-foreground">
            Preencha os valores mensais por categoria. A replicação automática facilita o preenchimento.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={String(fiscalYear)}
            onValueChange={(v) => setFiscalYear(Number(v))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <div className="grid grid-cols-12 gap-2">
              {Array.from({ length: 14 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <BudgetGrid
          key={fiscalYear}
          initialRows={initialRows}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
