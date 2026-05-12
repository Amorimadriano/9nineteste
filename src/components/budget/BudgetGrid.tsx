import React from "react";
import { Month, MONTHS, BudgetRow } from "@/types/budget";
import { useBudgetPlanning } from "@/hooks/useBudgetPlanning";
import { formatCurrency, monthLabel } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

interface BudgetGridProps {
  initialRows: BudgetRow[];
  onSave: (rows: BudgetRow[]) => Promise<void>;
}

export default function BudgetGrid({ initialRows, onSave }: BudgetGridProps) {
  const { rows, updateCell, handleBlur, clearRow, save, hasChanges } =
    useBudgetPlanning({ initialRows, onPersist: onSave });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Planejamento Orçamentário</h2>
        <button
          onClick={save}
          disabled={!hasChanges}
          className={cn(
            "px-4 py-2 rounded text-white transition-colors",
            hasChanges
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          )}
        >
          Salvar Alterações
        </button>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left w-16">Código</th>
              <th className="px-4 py-2 text-left">Conta</th>
              {MONTHS.map((m) => (
                <th key={m} className="px-2 py-2 text-center w-24">
                  {monthLabel(m)}
                </th>
              ))}
              <th className="px-2 py-2 w-12">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.accountId} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 font-mono text-xs text-gray-600">
                  {row.accountCode}
                </td>
                <td className="px-4 py-2 font-medium">{row.accountName}</td>

                {MONTHS.map((month) => {
                  const cell = row.months[month];
                  const displayValue = cell.value?.toString() ?? "";

                  return (
                    <td key={month} className="px-1 py-1">
                      <input
                        type="number"
                        step="0.01"
                        value={displayValue}
                        onChange={(e) =>
                          updateCell(row.accountId, month, e.target.value)
                        }
                        onBlur={() =>
                          handleBlur(row.accountId, month, cell.value)
                        }
                        className={cn(
                          "w-full px-2 py-1 text-right rounded border outline-none focus:ring-2 transition-colors",
                          cell.source === "manual" &&
                            "text-blue-700 bg-blue-50 border-blue-200 focus:ring-blue-300",
                          cell.source === "auto" &&
                            "text-gray-600 bg-gray-50 border-gray-200 italic",
                          cell.source === null &&
                            "text-gray-900 border-gray-300 focus:ring-blue-300"
                        )}
                        placeholder="—"
                      />
                    </td>
                  );
                })}

                <td className="px-2 py-1 text-center">
                  <button
                    onClick={() => clearRow(row.accountId)}
                    title="Limpar linha"
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-blue-50 border border-blue-200" />
          Editado Manualmente
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-gray-50 border border-gray-200" />
          Replicado / Sugerido
        </span>
      </div>
    </div>
  );
}
