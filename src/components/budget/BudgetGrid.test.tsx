import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BudgetGrid from "./BudgetGrid";
import { BudgetRow, MONTHS } from "@/types/budget";

function createEmptyRow(id: string): BudgetRow {
  return {
    accountId: id,
    accountCode: `1.${id}`,
    accountName: `Conta ${id}`,
    type: "revenue",
    months: MONTHS.reduce((acc, m) => {
      acc[m] = { value: null, source: null };
      return acc;
    }, {} as BudgetRow["months"]),
  };
}

describe("BudgetGrid", () => {
  const onSave = vi.fn().mockResolvedValue(undefined);

  it("deve renderizar todas as colunas de meses", () => {
    const rows = [createEmptyRow("001")];
    render(<BudgetGrid initialRows={rows} onSave={onSave} />);

    expect(screen.getByText("Jan")).toBeInTheDocument();
    expect(screen.getByText("Dez")).toBeInTheDocument();
    expect(screen.getByText("Conta 001")).toBeInTheDocument();
  });

  it("deve replicar valor ao sair da celula de janeiro", () => {
    const rows = [createEmptyRow("001")];
    render(<BudgetGrid initialRows={rows} onSave={onSave} />);

    const inputJan = screen.getAllByPlaceholderText("—")[0];
    fireEvent.change(inputJan, { target: { value: "2500" } });
    fireEvent.blur(inputJan);

    const allInputs = screen.getAllByPlaceholderText("—");
    const febInput = allInputs[1] as HTMLInputElement;
    const marInput = allInputs[2] as HTMLInputElement;

    expect(febInput.value).toBe("2500");
    expect(marInput.value).toBe("2500");
  });

  it("deve marcar celula como manual ao digitar", () => {
    const rows = [createEmptyRow("001")];
    render(<BudgetGrid initialRows={rows} onSave={onSave} />);

    const allInputs = screen.getAllByPlaceholderText("—");
    const junInput = allInputs[5];

    fireEvent.change(junInput, { target: { value: "8000" } });

    expect(junInput).toHaveClass("text-blue-700");
    expect(junInput).toHaveClass("bg-blue-50");
  });

  it("deve limpar a linha ao clicar no botao de acao", () => {
    const rows = [createEmptyRow("001")];
    render(<BudgetGrid initialRows={rows} onSave={onSave} />);

    const allInputs = screen.getAllByPlaceholderText("—");
    const inputJan = allInputs[0];

    fireEvent.change(inputJan, { target: { value: "1000" } });
    fireEvent.blur(inputJan);

    expect(allInputs[1]).toHaveValue(1000);

    const clearBtn = screen.getByTitle("Limpar linha");
    fireEvent.click(clearBtn);

    const updatedInputs = screen.getAllByPlaceholderText("—");
    updatedInputs.forEach((input) => {
      expect(input).toHaveValue(null);
    });
  });

  it("deve habilitar o botao salvar apenas quando houver mudancas", () => {
    const rows = [createEmptyRow("001")];
    render(<BudgetGrid initialRows={rows} onSave={onSave} />);

    const saveBtn = screen.getByText("Salvar Alterações");
    expect(saveBtn).toBeDisabled();

    const inputJan = screen.getAllByPlaceholderText("—")[0];
    fireEvent.change(inputJan, { target: { value: "500" } });

    expect(saveBtn).not.toBeDisabled();
  });
});
