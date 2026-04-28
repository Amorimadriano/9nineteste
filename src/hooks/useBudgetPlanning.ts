import { useState, useCallback } from "react";
import { Month, MONTHS, BudgetRow, BudgetCell } from "@/types/budget";

interface UseBudgetPlanningProps {
  initialRows: BudgetRow[];
  onPersist: (rows: BudgetRow[]) => Promise<void>;
}

export function useBudgetPlanning({
  initialRows,
  onPersist,
}: UseBudgetPlanningProps) {
  const [rows, setRows] = useState<BudgetRow[]>(initialRows);
  const [dirtyRows, setDirtyRows] = useState<Set<string>>(new Set());

  const replicateForward = useCallback(
    (rowId: string, fromMonth: Month, value: number) => {
      if (value === null || Number.isNaN(value)) return;

      setRows((prev) =>
        prev.map((row) => {
          if (row.accountId !== rowId) return row;

          const monthIndex = MONTHS.indexOf(fromMonth);
          const newMonths = { ...row.months };

          for (let i = monthIndex + 1; i < MONTHS.length; i++) {
            const m = MONTHS[i];
            const cell = newMonths[m];

            if (cell.source !== "manual") {
              newMonths[m] = { value, source: "auto" };
            }
          }

          return { ...row, months: newMonths };
        })
      );
    },
    []
  );

  const updateCell = useCallback(
    (rowId: string, month: Month, rawValue: string) => {
      const numericValue = rawValue === "" ? null : parseFloat(rawValue);
      const source: BudgetCell["source"] =
        numericValue === null ? null : "manual";

      setRows((prev) =>
        prev.map((row) => {
          if (row.accountId !== rowId) return row;

          return {
            ...row,
            months: {
              ...row.months,
              [month]: { value: numericValue, source },
            },
          };
        })
      );

      setDirtyRows((prev) => {
        const next = new Set(prev);
        next.add(rowId);
        return next;
      });
    },
    []
  );

  const handleBlur = useCallback(
    (rowId: string, month: Month, value: number | null) => {
      if (value !== null) {
        replicateForward(rowId, month, value);
      }
    },
    [replicateForward]
  );

  const clearRow = useCallback((rowId: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.accountId !== rowId) return row;

        const clearedMonths = MONTHS.reduce(
          (acc, m) => {
            acc[m] = { value: null, source: null };
            return acc;
          },
          {} as Record<Month, BudgetCell>
        );

        return { ...row, months: clearedMonths };
      })
    );

    setDirtyRows((prev) => {
      const next = new Set(prev);
      next.add(rowId);
      return next;
    });
  }, []);

  const save = useCallback(async () => {
    await onPersist(rows);
    setDirtyRows(new Set());
  }, [rows, onPersist]);

  return {
    rows,
    dirtyRows,
    updateCell,
    handleBlur,
    clearRow,
    save,
    hasChanges: dirtyRows.size > 0,
  };
}
