import { supabase } from "@/integrations/supabase/client";
import { BudgetRow, Month, MONTHS } from "@/types/budget";

export interface BudgetLineDb {
  id: string;
  user_id: string;
  empresa_id: string | null;
  plano_conta_id: string;
  fiscal_year: number;
  values: Record<
    Month,
    { v: number | null; s: "auto" | "manual" | null }
  >;
  created_at: string;
  updated_at: string;
}

function toDbValues(
  months: BudgetRow["months"]
): BudgetLineDb["values"] {
  const result = {} as BudgetLineDb["values"];
  MONTHS.forEach((m) => {
    result[m] = {
      v: months[m].value,
      s: months[m].source,
    };
  });
  return result;
}

function fromDbValues(
  values: BudgetLineDb["values"]
): BudgetRow["months"] {
  const result = {} as BudgetRow["months"];
  MONTHS.forEach((m) => {
    const cell = values?.[m];
    result[m] = {
      value: cell?.v ?? null,
      source: cell?.s ?? null,
    };
  });
  return result;
}

export async function fetchBudgetLines(
  fiscalYear: number,
  empresaId?: string | null
): Promise<BudgetLineDb[]> {
  let query = supabase
    .from("budget_planning_lines")
    .select("*")
    .eq("fiscal_year", fiscalYear);

  if (empresaId) {
    query = query.eq("empresa_id", empresaId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as BudgetLineDb[];
}

export async function upsertBudgetLine(
  row: BudgetRow,
  fiscalYear: number,
  userId: string,
  empresaId?: string | null,
  existingId?: string | null
): Promise<void> {
  const payload = {
    user_id: userId,
    empresa_id: empresaId ?? null,
    plano_conta_id: row.accountId,
    fiscal_year: fiscalYear,
    values: toDbValues(row.months),
  };

  if (existingId) {
    const { error } = await supabase
      .from("budget_planning_lines")
      .update(payload)
      .eq("id", existingId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("budget_planning_lines")
      .insert(payload);
    if (error) throw error;
  }
}

export async function deleteBudgetLine(id: string): Promise<void> {
  const { error } = await supabase
    .from("budget_planning_lines")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function saveAllBudgetLines(
  rows: BudgetRow[],
  fiscalYear: number,
  userId: string,
  empresaId?: string | null
): Promise<void> {
  const { data: existing } = await supabase
    .from("budget_planning_lines")
    .select("id, plano_conta_id")
    .eq("fiscal_year", fiscalYear)
    .eq("user_id", userId);

  const existingMap = new Map<string, string>();
  (existing ?? []).forEach((line: any) => {
    existingMap.set(line.plano_conta_id, line.id);
  });

  for (const row of rows) {
    const id = existingMap.get(row.accountId);
    await upsertBudgetLine(row, fiscalYear, userId, empresaId, id ?? null);
  }
}

export { fromDbValues, toDbValues };
