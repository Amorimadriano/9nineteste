/**
 * Testes de Cálculos NFS-e
 * Valida cálculos de base, ISS, valor líquido e retenções
 */

import { describe, it, expect } from "vitest";
import {
  calcularBaseCalculo,
  calcularISS,
  calcularValorLiquido,
  calcularValorLiquidoComRetencoes,
  calcularTodasRetencoes,
  validarCalculos,
} from "@/lib/nfse/calculos";
import { casosCalculo, dadosNotaFiscalValida } from "./fixtures/nfseFixtures";
import type { Servico } from "@/types/nfse";

describe("Cálculos NFSe", () => {
  describe("Cálculo de base de cálculo (valor - deduções)", () => {
    it("deve calcular base sem deduções", () => {
      const base = calcularBaseCalculo(1000.0, 0.0);
      expect(base).toBe(1000.0);
    });

    it("deve calcular base com deduções", () => {
      const base = calcularBaseCalculo(1000.0, 100.0);
      expect(base).toBe(900.0);
    });

    it("deve retornar zero quando valor é menor que deduções", () => {
      const base = calcularBaseCalculo(100.0, 200.0);
      expect(base).toBe(0);
    });

    it("deve retornar erro quando valor é negativo", () => {
      expect(() => calcularBaseCalculo(-100, 0)).toThrow(
        "Valor dos serviços não pode ser negativo"
      );
    });

    it("deve calcular base com deduções zero", () => {
      const base = calcularBaseCalculo(1000.0, 0);
      expect(base).toBe(1000.0);
    });

    it("deve manter precisão decimal", () => {
      const base = calcularBaseCalculo(1000.555, 100.555);
      expect(base).toBeCloseTo(900.0, 2);
    });

    casosCalculo.forEach((caso) => {
      it(`caso: ${caso.descricao}`, () => {
        const base = calcularBaseCalculo(caso.valorServicos, caso.valorDeducoes);
        expect(base).toBeCloseTo(caso.baseCalculoEsperada, 2);
      });
    });
  });

  describe("Cálculo de ISS (base × alíquota / 100)", () => {
    it("deve calcular ISS com alíquota de 5%", () => {
      const iss = calcularISS(1000.0, 5.0);
      expect(iss).toBe(50.0);
    });

    it("deve calcular ISS com alíquota de 2%", () => {
      const iss = calcularISS(1000.0, 2.0);
      expect(iss).toBe(20.0);
    });

    it("deve retornar zero com alíquota zero", () => {
      const iss = calcularISS(1000.0, 0);
      expect(iss).toBe(0);
    });

    it("deve calcular ISS com base zero", () => {
      const iss = calcularISS(0, 5.0);
      expect(iss).toBe(0);
    });

    it("deve calcular ISS com alíquota decimal", () => {
      const iss = calcularISS(1000.0, 2.79);
      expect(iss).toBeCloseTo(27.9, 2);
    });

    it("deve arredondar ISS para 2 decimais", () => {
      const iss = calcularISS(100.333, 5.0);
      expect(iss).toBeCloseTo(5.02, 2);
    });

    casosCalculo.forEach((caso) => {
      it(`caso: ${caso.descricao}`, () => {
        const iss = calcularISS(caso.baseCalculoEsperada, caso.aliquota);
        expect(iss).toBeCloseTo(caso.valorIssEsperado, 2);
      });
    });
  });

  describe("Cálculo de valor líquido", () => {
    it("deve calcular valor líquido sem retenções", () => {
      const servico: Partial<Servico> = {
        valorServicos: 1000.0,
        valorDeducoes: 0,
        issRetido: 2, // Não retido
        valorIss: 50.0,
      };

      const liquido = calcularValorLiquido(servico as Servico);
      expect(liquido).toBe(1000.0);
    });

    it("deve calcular valor líquido com ISS retido", () => {
      const servico: Partial<Servico> = {
        valorServicos: 1000.0,
        valorDeducoes: 0,
        issRetido: 1, // Retido
        valorIss: 50.0,
      };

      const liquido = calcularValorLiquido(servico as Servico);
      expect(liquido).toBe(950.0);
    });

    it("deve calcular valor líquido com deduções", () => {
      const servico: Partial<Servico> = {
        valorServicos: 1000.0,
        valorDeducoes: 100.0,
        issRetido: 2,
        valorIss: 45.0,
      };

      const liquido = calcularValorLiquido(servico as Servico);
      expect(liquido).toBe(900.0);
    });

    casosCalculo.forEach((caso) => {
      it(`caso: ${caso.descricao}`, () => {
        const servico: Partial<Servico> = {
          valorServicos: caso.valorServicos,
          valorDeducoes: caso.valorDeducoes,
          issRetido: caso.issRetido,
          valorIss: caso.valorIssEsperado,
          ...(caso.valorPis !== undefined && { valorPis: caso.valorPis }),
          ...(caso.valorCofins !== undefined && { valorCofins: caso.valorCofins }),
          ...(caso.valorInss !== undefined && { valorInss: caso.valorInss }),
          ...(caso.valorIr !== undefined && { valorIr: caso.valorIr }),
          ...(caso.valorCsll !== undefined && { valorCsll: caso.valorCsll }),
          ...(caso.valorIssRetido !== undefined && { valorIssRetido: caso.valorIssRetido }),
        };

        const liquido = calcularValorLiquido(servico as Servico);
        expect(liquido).toBeCloseTo(caso.valorLiquidoEsperado, 2);
      });
    });
  });

  describe("Cálculo com retenções", () => {
    it("deve calcular valor líquido com todas as retenções", () => {
      const servico: Partial<Servico> = {
        valorServicos: 1000.0,
        valorDeducoes: 100.0,
        issRetido: 1,
        valorIss: 45.0,
        valorIssRetido: 45.0,
        valorPis: 6.5,
        valorCofins: 3.0,
        valorInss: 11.0,
        valorIr: 1.5,
        valorCsll: 1.0,
        outrasRetencoes: 0,
      };

      const liquido = calcularValorLiquidoComRetencoes(servico as Servico);
      // Base (900) - PIS (6.5) - COFINS (3) - INSS (11) - IR (1.5) - CSLL (1) - ISS Retido (45)
      expect(liquido).toBeCloseTo(832.0, 2);
    });

    it("deve calcular soma de todas as retenções", () => {
      const retencoes = calcularTodasRetencoes({
        valorPis: 6.5,
        valorCofins: 3.0,
        valorInss: 11.0,
        valorIr: 1.5,
        valorCsll: 1.0,
        valorIssRetido: 45.0,
        outrasRetencoes: 10.0,
      });

      expect(retencoes).toBeCloseTo(78.0, 2);
    });

    it("deve retornar zero quando não há retenções", () => {
      const retencoes = calcularTodasRetencoes({
        valorPis: 0,
        valorCofins: 0,
        valorInss: 0,
        valorIr: 0,
        valorCsll: 0,
        valorIssRetido: 0,
        outrasRetencoes: 0,
      });

      expect(retencoes).toBe(0);
    });

    it("deve calcular valor líquido conforme fórmula ABRASF", () => {
      const servico: Servico = {
        ...dadosNotaFiscalValida.servico,
      };

      const liquido = calcularValorLiquidoComRetencoes(servico);
      // Conforme ABRASF: ValorServicos - ValorDeducoes - ValorPis - ValorCofins
      // - ValorInss - ValorIr - ValorCsll - OutrasRetencoes - ValorIssRetido
      const esperado =
        servico.valorServicos -
        servico.valorDeducoes -
        servico.valorPis -
        servico.valorCofins -
        servico.valorInss -
        servico.valorIr -
        servico.valorCsll -
        servico.outrasRetencoes -
        servico.valorIssRetido;

      expect(liquido).toBeCloseTo(esperado, 2);
    });
  });

  describe("Validação de cálculos", () => {
    it("deve validar cálculos corretos", () => {
      const servico: Servico = {
        ...dadosNotaFiscalValida.servico,
        baseCalculo: 900.0,
        valorIss: 45.0,
        valorLiquidoNfse: 827.0,
      };

      const validacao = validarCalculos(servico);
      expect(validacao.valido).toBe(true);
      expect(validacao.erros).toHaveLength(0);
    });

    it("deve detectar base de cálculo incorreta", () => {
      const servico: Servico = {
        ...dadosNotaFiscalValida.servico,
        valorServicos: 1000.0,
        valorDeducoes: 100.0,
        baseCalculo: 800.0, // Incorreto, deveria ser 900
      };

      const validacao = validarCalculos(servico);
      expect(validacao.valido).toBe(false);
      expect(validacao.erros).toContainEqual(
        expect.stringContaining("Base de cálculo")
      );
    });

    it("deve detectar valor ISS incorreto", () => {
      const servico: Servico = {
        ...dadosNotaFiscalValida.servico,
        baseCalculo: 900.0,
        aliquota: 5.0,
        valorIss: 40.0, // Incorreto, deveria ser 45
      };

      const validacao = validarCalculos(servico);
      expect(validacao.valido).toBe(false);
      expect(validacao.erros).toContainEqual(expect.stringContaining("ISS"));
    });

    it("deve detectar valor líquido incorreto", () => {
      const servico: Servico = {
        ...dadosNotaFiscalValida.servico,
        valorLiquidoNfse: 900.0, // Incorreto
      };

      const validacao = validarCalculos(servico);
      expect(validacao.valido).toBe(false);
    });

    it("deve aceitar diferença de arredondamento de até 1 centavo", () => {
      const servico: Servico = {
        ...dadosNotaFiscalValida.servico,
        baseCalculo: 900.0,
        aliquota: 5.0,
        valorIss: 45.01, // 1 centavo a mais devido a arredondamento
      };

      const validacao = validarCalculos(servico);
      expect(validacao.valido).toBe(true);
    });
  });

  describe("Cálculos em tempo real", () => {
    it("deve recalcular quando valor dos serviços muda", () => {
      const servico = { ...dadosNotaFiscalValida.servico };

      // Cálculo inicial
      let base = calcularBaseCalculo(servico.valorServicos, servico.valorDeducoes);
      let iss = calcularISS(base, servico.aliquota);

      expect(base).toBe(900);
      expect(iss).toBe(45);

      // Alterar valor
      servico.valorServicos = 2000;
      base = calcularBaseCalculo(servico.valorServicos, servico.valorDeducoes);
      iss = calcularISS(base, servico.aliquota);

      expect(base).toBe(1900);
      expect(iss).toBe(95);
    });

    it("deve recalcular quando alíquota muda", () => {
      const servico = { ...dadosNotaFiscalValida.servico };
      const base = calcularBaseCalculo(
        servico.valorServicos,
        servico.valorDeducoes
      );

      const iss2 = calcularISS(base, 2);
      const iss5 = calcularISS(base, 5);

      expect(iss2).toBe(18); // 900 * 0.02
      expect(iss5).toBe(45); // 900 * 0.05
    });

    it("deve recalcular quando deduções mudam", () => {
      const valorServicos = 1000;

      const baseSemDeducoes = calcularBaseCalculo(valorServicos, 0);
      const baseComDeducoes = calcularBaseCalculo(valorServicos, 200);

      expect(baseSemDeducoes).toBe(1000);
      expect(baseComDeducoes).toBe(800);
    });
  });

  describe("Edge cases", () => {
    it("deve lidar com valores muito pequenos", () => {
      const base = calcularBaseCalculo(0.01, 0);
      const iss = calcularISS(base, 5);

      expect(base).toBe(0.01);
      expect(iss).toBe(0);
    });

    it("deve lidar com valores muito grandes", () => {
      const base = calcularBaseCalculo(1000000, 100000);
      const iss = calcularISS(base, 5);

      expect(base).toBe(900000);
      expect(iss).toBe(45000);
    });

    it("deve arredondar corretamente na borda", () => {
      const iss = calcularISS(100, 2.5);
      expect(iss).toBe(2.5);
    });

    it("deve calcular ISS com alíquota de 100%", () => {
      const iss = calcularISS(1000, 100);
      expect(iss).toBe(1000);
    });

    it("deve retornar erro com alíquota negativa", () => {
      expect(() => calcularISS(1000, -5)).toThrow(/alíquota/i);
    });

    it("deve retornar erro com alíquota maior que 100%", () => {
      expect(() => calcularISS(1000, 101)).toThrow(/alíquota/i);
    });
  });

  describe("Integridade dos cálculos", () => {
    it("deve manter consistência: base + deduções = valor serviços", () => {
      const valorServicos = 1234.56;
      const valorDeducoes = 234.56;
      const base = calcularBaseCalculo(valorServicos, valorDeducoes);

      expect(base + valorDeducoes).toBeCloseTo(valorServicos, 2);
    });

    it("deve calcular ISS proporcional à base", () => {
      const base = 1000;
      const aliquota = 5;
      const iss = calcularISS(base, aliquota);

      expect(iss / base).toBeCloseTo(aliquota / 100, 4);
    });

    it("deve calcular valor líquido menor que valor serviços quando há retenções", () => {
      const servico: Partial<Servico> = {
        valorServicos: 1000,
        valorDeducoes: 100,
        issRetido: 1,
        valorIss: 45,
        valorPis: 6.5,
        valorCofins: 3,
      };

      const liquido = calcularValorLiquidoComRetencoes(servico as Servico);
      expect(liquido).toBeLessThan(servico.valorServicos as number);
    });
  });
});
