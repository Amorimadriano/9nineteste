import { Month } from "@/types/budget";

const MONTH_LABELS: Record<Month, string> = {
  jan: "Jan",
  feb: "Fev",
  mar: "Mar",
  apr: "Abr",
  may: "Mai",
  jun: "Jun",
  jul: "Jul",
  aug: "Ago",
  sep: "Set",
  oct: "Out",
  nov: "Nov",
  dec: "Dez",
};

export function monthLabel(month: Month): string {
  return MONTH_LABELS[month];
}

export function formatCurrency(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
