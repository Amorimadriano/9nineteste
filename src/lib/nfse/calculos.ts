/**
 * Cálculos NFSe
 * Gerencia cálculos de base de cálculo, ISS, valores líquidos e retenções
 */

import type { Servico } from "../../types/nfse";

/**
 * Calcula base de cálculo (valor dos serviços - deduções)
 */
export function calcularBaseCalculo(
  valorServicos: number,
  valorDeducoes: number
): number {
  if (valorServicos < 0) {
    throw new Error("Valor dos serviços não pode ser negativo");
  }

  const base = valorServicos - valorDeducoes;
  return Math.max(0, base);
}

/**
 * Calcula valor do ISS (base de cálculo × alíquota / 100)
 */
export function calcularISS(baseCalculo: number, aliquota: number): number {
  if (aliquota < 0) {
    throw new Error("Alíquota não pode ser negativa");
  }

  if (aliquota > 100) {
    throw new Error("Alíquota não pode ser maior que 100%");
  }

  const iss = (baseCalculo * aliquota) / 100;
  return parseFloat(iss.toFixed(2));
}

/**
 * Calcula valor líquido da nota fiscal
 * Considera deduções e ISS retido
 */
export function calcularValorLiquido(servico: Servico): number {
  const base = calcularBaseCalculo(
    servico.valorServicos,
    servico.valorDeducoes
  );

  // Se ISS for retido, desconta do valor líquido
  const descontoISS = servico.issRetido === 1 ? servico.valorIss : 0;

  return parseFloat((base - descontoISS).toFixed(2));
}

/**
 * Calcula valor líquido considerando todas as retenções
 * Fórmula ABRASF: ValorServicos - ValorDeducoes - ValorPis - ValorCofins
 *                  - ValorInss - ValorIr - ValorCsll - OutrasRetencoes - ValorIssRetido
 */
export function calcularValorLiquidoComRetencoes(servico: Servico): number {
  const totalRetencoes = calcularTodasRetencoes({
    valorPis: servico.valorPis,
    valorCofins: servico.valorCofins,
    valorInss: servico.valorInss,
    valorIr: servico.valorIr,
    valorCsll: servico.valorCsll,
    valorIssRetido: servico.valorIssRetido,
    outrasRetencoes: servico.outrasRetencoes,
  });

  const base = calcularBaseCalculo(
    servico.valorServicos,
    servico.valorDeducoes
  );

  return parseFloat((base - totalRetencoes).toFixed(2));
}

/**
 * Calcula total de retenções
 */
export function calcularTodasRetencoes(retencoes: {
  valorPis: number;
  valorCofins: number;
  valorInss: number;
  valorIr: number;
  valorCsll: number;
  valorIssRetido: number;
  outrasRetencoes: number;
}): number {
  const total =
    retencoes.valorPis +
    retencoes.valorCofins +
    retencoes.valorInss +
    retencoes.valorIr +
    retencoes.valorCsll +
    retencoes.valorIssRetido +
    retencoes.outrasRetencoes;

  return parseFloat(total.toFixed(2));
}

/**
 * Valida se os cálculos da nota fiscal estão corretos
 */
export function validarCalculos(servico: Servico): {
  valido: boolean;
  erros: string[];
} {
  const erros: string[] = [];

  // Validar base de cálculo
  const baseEsperada = calcularBaseCalculo(
    servico.valorServicos,
    servico.valorDeducoes
  );
  if (Math.abs(baseEsperada - servico.baseCalculo) > 0.01) {
    erros.push(
      `Base de cálculo incorreta: esperado ${baseEsperada}, recebido ${servico.baseCalculo}`
    );
  }

  // Validar ISS
  const issEsperado = calcularISS(servico.baseCalculo, servico.aliquota);
  if (Math.abs(issEsperado - servico.valorIss) > 0.01) {
    erros.push(
      `Valor do ISS incorreto: esperado ${issEsperado}, recebido ${servico.valorIss}`
    );
  }

  // Validar valor líquido
  const liquidoEsperado = calcularValorLiquidoComRetencoes(servico);
  if (Math.abs(liquidoEsperado - servico.valorLiquidoNfse) > 0.01) {
    erros.push(
      `Valor líquido incorreto: esperado ${liquidoEsperado}, recebido ${servico.valorLiquidoNfse}`
    );
  }

  // Validar valores negativos
  if (servico.valorServicos < 0) erros.push("Valor dos serviços não pode ser negativo");
  if (servico.valorDeducoes < 0) erros.push("Valor das deduções não pode ser negativo");
  if (servico.valorPis < 0) erros.push("Valor do PIS não pode ser negativo");
  if (servico.valorCofins < 0) erros.push("Valor do COFINS não pode ser negativo");
  if (servico.valorInss < 0) erros.push("Valor do INSS não pode ser negativo");
  if (servico.valorIr < 0) erros.push("Valor do IR não pode ser negativo");
  if (servico.valorCsll < 0) erros.push("Valor do CSLL não pode ser negativo");
  if (servico.aliquota < 0) erros.push("Alíquota não pode ser negativa");
  if (servico.aliquota > 100) erros.push("Alíquota não pode ser maior que 100%");

  return {
    valido: erros.length === 0,
    erros,
  };
}
