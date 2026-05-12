import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBudgetPlanning } from "./useBudgetPlanning";
import { BudgetRow, MONTHS } from "@/types/budget";

function createEmptyRow(id: string, overrides?: Partial<BudgetRow>): BudgetRow {
  return {
    accountId: id,
    accountCode: `1.${id}`,
    accountName: `Conta ${id}`,
    type: "revenue",
    months: MONTHS.reduce((acc, m) => {
      acc[m] = { value: null, source: null };
      return acc;
    }, {} as BudgetRow["months"]),
    ...overrides,
  };
}

describe("useBudgetPlanning", () => {
  const onPersist = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve inicializar com os rows fornecidos", () => {
    const initialRows = [createEmptyRow("001")];
    const { result } = renderHook(() =>
      useBudgetPlanning({ initialRows, onPersist })
    );

    expect(result.current.rows).toHaveLength(1);
    expect(result.current.hasChanges).toBe(false);
  });

  it("deve atualizar uma celula manualmente", () => {
    const initialRows = [createEmptyRow("001")];
    const { result } = renderHook(() =>
      useBudgetPlanning({ initialRows, onPersist })
    );

    act(() => {
      result.current.updateCell("001", "jan", "1500");
    });

    expect(result.current.rows[0].months.jan.value).toBe(1500);
    expect(result.current.rows[0].months.jan.source).toBe("manual");
    expect(result.current.hasChanges).toBe(true);
  });

  it("deve replicar valor para meses subsequentes no blur", () => {
    const initialRows = [createEmptyRow("001")];
    const { result } = renderHook(() =>
      useBudgetPlanning({ initialRows, onPersist })
    );

    act(() => {
      result.current.updateCell("001", "jan", "2000");
    });

    act(() => {
      result.current.handleBlur("001", "jan", 2000);
    });

    MONTHS.slice(1).forEach((m) => {
      expect(result.current.rows[0].months[m].value).toBe(2000);
      expect(result.current.rows[0].months[m].source).toBe("auto");
    });
  });

  it("nao deve sobrescrever celulas manuais durante a replicacao", () => {
    const row = createEmptyRow("001");
    row.months.mar = { value: 3000, source: "manual" };
    row.months.jun = { value: 5000, source: "manual" };

    const { result } = renderHook(() =>
      useBudgetPlanning({ initialRows: [row], onPersist })
    );

    act(() => {
      result.current.updateCell("001", "jan", "1000");
    });

    act(() => {
      result.current.handleBlur("001", "jan", 1000);
    });

    expect(result.current.rows[0].months.feb.value).toBe(1000);
    expect(result.current.rows[0].months.mar.value).toBe(3000);
    expect(result.current.rows[0].months.mar.source).toBe("manual");
    expect(result.current.rows[0].months.jun.value).toBe(5000);
    expect(result.current.rows[0].months.jun.source).toBe("manual");
  });

  it("deve permitir re-replicacao apos limpar uma linha", () => {
    const row = createEmptyRow("001");
    row.months.mar = { value: 3000, source: "manual" };

    const { result } = renderHook(() =>
      useBudgetPlanning({ initialRows: [row], onPersist })
    );

    act(() => {
      result.current.clearRow("001");
    });

    MONTHS.forEach((m) => {
      expect(result.current.rows[0].months[m].value).toBeNull();
      expect(result.current.rows[0].months[m].source).toBeNull();
    });

    act(() => {
      result.current.updateCell("001", "jan", "5000");
    });

    act(() => {
      result.current.handleBlur("001", "jan", 5000);
    });

    expect(result.current.rows[0].months.dec.value).toBe(5000);
    expect(result.current.rows[0].months.dec.source).toBe("auto");
  });

  it("deve replicar a partir de um mes intermediario", () => {
    const initialRows = [createEmptyRow("001")];
    const { result } = renderHook(() =>
      useBudgetPlanning({ initialRows, onPersist })
    );

    act(() => {
      result.current.updateCell("001", "jun", "4000");
    });

    act(() => {
      result.current.handleBlur("001", "jun", 4000);
    });

    expect(result.current.rows[0].months.jun.value).toBe(4000);
    expect(result.current.rows[0].months.jul.value).toBe(4000);
    expect(result.current.rows[0].months.dec.value).toBe(4000);
    expect(result.current.rows[0].months.may.value).toBeNull();
  });

  it("deve chamar onPersist ao salvar", async () => {
    const initialRows = [createEmptyRow("001")];
    const { result } = renderHook(() =>
      useBudgetPlanning({ initialRows, onPersist })
    );

    act(() => {
      result.current.updateCell("001", "jan", "100");
    });

    await act(async () => {
      await result.current.save();
    });

    expect(onPersist).toHaveBeenCalledTimes(1);
    expect(result.current.hasChanges).toBe(false);
  });
});
