import { describe, it, expect } from "vitest";
import {
  padRight,
  padLeft,
  formatDate,
  parseDate,
  formatValue,
  parseValue,
  onlyNumbers,
  generateSequencialLote,
  extrairContaEDV,
} from "./utils";

describe("CNAB240 Utils", () => {
  describe("padRight", () => {
    it("deve preencher string com espacos a direita", () => {
      expect(padRight("TESTE", 10)).toBe("TESTE     ");
      expect(padRight("TESTE", 10, "X")).toBe("TESTEXXXXX");
    });

    it("deve truncar string se for maior que o tamanho", () => {
      expect(padRight("TESTE MUITO LONGO", 10)).toBe("TESTE MUIT");
    });

    it("deve lidar com string vazia", () => {
      expect(padRight("", 5)).toBe("     ");
    });

    it("deve lidar com undefined/null", () => {
      expect(padRight(undefined as unknown as string, 5)).toBe("     ");
      expect(padRight(null as unknown as string, 5)).toBe("     ");
    });

    it("deve retornar string exata quando tamanho igual", () => {
      expect(padRight("EXATO", 5)).toBe("EXATO");
    });
  });

  describe("padLeft", () => {
    it("deve preencher string com zeros a esquerda", () => {
      expect(padLeft("123", 10)).toBe("0000000123");
      expect(padLeft("123", 10, "X")).toBe("XXXXXXX123");
    });

    it("deve truncar string se for maior que o tamanho", () => {
      expect(padLeft("12345678901", 10)).toBe("1234567890");
    });

    it("deve lidar com string vazia", () => {
      expect(padLeft("", 5)).toBe("00000");
    });

    it("deve lidar com undefined/null", () => {
      expect(padLeft(undefined as unknown as string, 5)).toBe("00000");
      expect(padLeft(null as unknown as string, 5)).toBe("00000");
    });

    it("deve retornar string exata quando tamanho igual", () => {
      expect(padLeft("12345", 5)).toBe("12345");
    });
  });

  describe("formatDate", () => {
    it("deve formatar data no formato DDMMAAAA", () => {
      const date = new Date(2024, 0, 15); // 15/01/2024
      expect(formatDate(date)).toBe("15012024");
    });

    it("deve adicionar zero a esquerda em dia e mes", () => {
      const date = new Date(2024, 1, 5); // 05/02/2024
      expect(formatDate(date)).toBe("05022024");
    });

    it("deve funcionar com diferentes anos", () => {
      expect(formatDate(new Date(2023, 5, 10))).toBe("10062023");
      expect(formatDate(new Date(2025, 11, 25))).toBe("25122025");
    });
  });

  describe("parseDate", () => {
    it("deve parsear data no formato DDMMAAAA", () => {
      const date = parseDate("15012024");
      expect(date.getDate()).toBe(15);
      expect(date.getMonth()).toBe(0); // Janeiro = 0
      expect(date.getFullYear()).toBe(2024);
    });

    it("deve lidar com string vazia", () => {
      const date = parseDate("");
      expect(date instanceof Date).toBe(true);
    });

    it("deve lidar com string curta", () => {
      const date = parseDate("1501202");
      expect(date instanceof Date).toBe(true);
    });

    it("deve retornar data valida para diferentes entradas", () => {
      expect(parseDate("01012024").getTime()).toBe(new Date(2024, 0, 1).getTime());
      expect(parseDate("31122024").getTime()).toBe(new Date(2024, 11, 31).getTime());
    });
  });

  describe("formatValue", () => {
    it("deve formatar valor com 2 decimais por padrao", () => {
      expect(formatValue(150.50)).toBe("15050");
      expect(formatValue(1500)).toBe("150000");
    });

    it("deve formatar valor com decimais customizados", () => {
      expect(formatValue(150.5, 3)).toBe("150500");
      expect(formatValue(150, 0)).toBe("150");
    });

    it("deve lidar com valores negativos", () => {
      expect(formatValue(-50.25)).toBe("-5025");
    });

    it("deve lidar com zero", () => {
      expect(formatValue(0)).toBe("0");
      expect(formatValue(0, 2)).toBe("0");
    });

    it("deve arredondar valores corretamente", () => {
      expect(formatValue(150.555)).toBe("15056");
      expect(formatValue(150.554)).toBe("15055");
    });
  });

  describe("parseValue", () => {
    it("deve parsear valor com 2 decimais por padrao", () => {
      expect(parseValue("15050")).toBe(150.5);
      expect(parseValue("0000015050")).toBe(150.5);
    });

    it("deve parsear valor com decimais customizados", () => {
      expect(parseValue("150500", 3)).toBe(150.5);
      expect(parseValue("150", 0)).toBe(150);
    });

    it("deve lidar com string vazia", () => {
      expect(parseValue("")).toBe(0);
    });

    it("deve lidar com zero", () => {
      expect(parseValue("0")).toBe(0);
      expect(parseValue("00000")).toBe(0);
    });

    it("deve lidar com valores negativos", () => {
      expect(parseValue("-5025")).toBe(-50.25);
    });
  });

  describe("onlyNumbers", () => {
    it("deve remover todos caracteres nao numericos", () => {
      expect(onlyNumbers("12.345.678/0001-90")).toBe("12345678000190");
      expect(onlyNumbers("(11) 98765-4321")).toBe("11987654321");
      expect(onlyNumbers("R$ 1.234,56")).toBe("123456");
    });

    it("deve retornar string vazia para input sem numeros", () => {
      expect(onlyNumbers("ABC")).toBe("");
      expect(onlyNumbers("!@#$%")).toBe("");
    });

    it("deve retornar mesma string se ja for numerica", () => {
      expect(onlyNumbers("12345")).toBe("12345");
    });

    it("deve lidar com string vazia", () => {
      expect(onlyNumbers("")).toBe("");
    });

    it("deve lidar com undefined/null", () => {
      expect(onlyNumbers(undefined as unknown as string)).toBe("");
      expect(onlyNumbers(null as unknown as string)).toBe("");
    });
  });

  describe("generateSequencialLote", () => {
    it("deve retornar valor fixo padrao", () => {
      expect(generateSequencialLote()).toBe("0001");
    });

    it("deve sempre retornar o mesmo valor", () => {
      const valores = Array.from({ length: 10 }, generateSequencialLote);
      expect(valores.every((v) => v === "0001")).toBe(true);
    });
  });

  describe("Integracao entre format e parse", () => {
    it("deve ser reversivel para valores", () => {
      const original = 1234.56;
      const formatted = formatValue(original);
      const parsed = parseValue(formatted);

      expect(parsed).toBe(original);
    });

    it("deve ser reversivel para datas", () => {
      const original = new Date(2024, 5, 15);
      original.setHours(0, 0, 0, 0);

      const formatted = formatDate(original);
      const parsed = parseDate(formatted);
      parsed.setHours(0, 0, 0, 0);

      expect(parsed.getTime()).toBe(original.getTime());
    });
  });

  describe("extrairContaEDV", () => {
    it("deve extrair conta e DV do formato XXXXX-X", () => {
      const resultado = extrairContaEDV("2523465-0");
      expect(resultado.conta).toBe("2523465");
      expect(resultado.dv).toBe("0");
    });

    it("deve extrair conta e DV do formato XXXXXX (sem separador)", () => {
      const resultado = extrairContaEDV("25234650");
      expect(resultado.conta).toBe("2523465");
      expect(resultado.dv).toBe("0");
    });

    it("deve usar DV informado explicitamente quando fornecido", () => {
      const resultado = extrairContaEDV("2523465-5", "5"); // Conta com DV no final igual ao explícito
      expect(resultado.conta).toBe("2523465");
      expect(resultado.dv).toBe("5");
    });

    it("deve manter conta limpa quando DV nao estiver no final", () => {
      const resultado = extrairContaEDV("2523465", "0");
      expect(resultado.conta).toBe("2523465");
      expect(resultado.dv).toBe("0");
    });

    it("deve lidar com conta de um digito", () => {
      const resultado = extrairContaEDV("1");
      expect(resultado.conta).toBe("1");
      expect(resultado.dv).toBe("");
    });

    it("deve lidar com string vazia", () => {
      const resultado = extrairContaEDV("");
      expect(resultado.conta).toBe("");
      expect(resultado.dv).toBe("");
    });

    it("deve remover DV do final quando conta ja vem com DV e DV e informado separadamente", () => {
      const resultado = extrairContaEDV("25234650", "0");
      expect(resultado.conta).toBe("2523465");
      expect(resultado.dv).toBe("0");
    });
  });
});
