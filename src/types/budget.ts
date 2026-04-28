export type Month =
  | "jan"
  | "feb"
  | "mar"
  | "apr"
  | "may"
  | "jun"
  | "jul"
  | "aug"
  | "sep"
  | "oct"
  | "nov"
  | "dec";

export const MONTHS: Month[] = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

export type BudgetSource = "auto" | "manual" | null;

export interface BudgetCell {
  value: number | null;
  source: BudgetSource;
}

export interface BudgetRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  type: "revenue" | "cost" | "expense";
  months: Record<Month, BudgetCell>;
}

export interface BudgetPlan {
  id: string;
  fiscalYear: number;
  companyId: string;
  rows: BudgetRow[];
  createdAt: string;
  updatedAt: string;
}
