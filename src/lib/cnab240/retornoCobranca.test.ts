import { describe, it, expect } from "vitest";
import { parseRetornoCobranca, RetornoParseResult } from "./retornoCobranca";

describe("parseRetornoCobranca", () => {
  it("deve retornar estrutura vazia para conteudo invalido", () => {
    const result = parseRetornoCobranca("");

    expect(result).toEqual({
      banco: "",
      empresa: "",
      dataGeracao: "",
      items: [],
      totalRegistros: 0,
      valorTotal: 0,
    });
  });

  it("deve parsear header do arquivo", () => {
    const headerArquivo = "07700000         2EMPRESA TESTE LTDA     00000000000000CONTA          20240101        00000108700000                                      ";
    const content = headerArquivo.padEnd(240, " ");

    const result = parseRetornoCobranca(content);

    expect(result.banco).toBe("077");
    expect(result.dataGeracao).toBe("20240101");
  });

  it("deve parsear segmento T (dados do titulo)", () => {
    // Header + Segmento T simplificado
    const header = "07700000         2EMPRESA TESTE          00000000000000                    20240101        000001087                                           ";
    const segmentoT = "0770001300001 T 01     NOSSONUM123      0000000000015050                  000000000000150                                                                     ";

    const content = [
      header.padEnd(240, " "),
      segmentoT.padEnd(240, " "),
    ].join("\n");

    const result = parseRetornoCobranca(content);

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0].nossoNumero).toBe("NOSSONUM123");
  });

  it("deve parsear segmento U (complemento)", () => {
    // Header + Segmento T + Segmento U
    const header = "07700000         2EMPRESA TESTE          00000000000000                    20240101        000001087                                           ";
    const segmentoT = "0770001300001 T 01     NOSSONUM123      0000000000015050                  000000000000150                                                                     ";
    const segmentoU = "0770001300001 U 00000000000000000000000000000000000000000000000000000000000123450000000000000000000015012024011501202400                      ";

    const content = [
      header.padEnd(240, " "),
      segmentoT.padEnd(240, " "),
      segmentoU.padEnd(240, " "),
    ].join("\n");

    const result = parseRetornoCobranca(content);

    expect(result.items.length).toBe(1);
    expect(result.items[0].valorPago).toBe(123.45);
  });

  it("deve calcular totais corretamente", () => {
    const header = "07700000         2EMPRESA TESTE          00000000000000                    20240101        000001087                                           ";
    const segmentoT1 = "0770001300001 T 01     NOSSO001         0000000000010000                  000000000000100                                                                     ";
    const segmentoT2 = "0770001300002 T 01     NOSSO002         0000000000020000                  000000000000100                                                                     ";

    const content = [
      header.padEnd(240, " "),
      segmentoT1.padEnd(240, " "),
      segmentoT2.padEnd(240, " "),
    ].join("\n");

    const result = parseRetornoCobranca(content);

    expect(result.totalRegistros).toBe(2);
  });

  it("deve mapear codigos de ocorrencia", () => {
    const header = "07700000         2EMPRESA TESTE          00000000000000                    20240101        000001087                                           ";
    const segmentoT = "0770001300001 T 06     NOSSO001         0000000000010000                  000000000000100                                                                     ";

    const content = [
      header.padEnd(240, " "),
      segmentoT.padEnd(240, " "),
    ].join("\n");

    const result = parseRetornoCobranca(content);

    expect(result.items[0].ocorrencia).toBe("Liquidação Normal");
  });

  it("deve usar codigo de ocorrencia quando nao mapeado", () => {
    const header = "07700000         2EMPRESA TESTE          00000000000000                    20240101        000001087                                           ";
    const segmentoT = "0770001300001 T 99     NOSSO001         0000000000010000                  000000000000100                                                                     ";

    const content = [
      header.padEnd(240, " "),
      segmentoT.padEnd(240, " "),
    ].join("\n");

    const result = parseRetornoCobranca(content);

    expect(result.items[0].ocorrencia).toBe("Código 99");
  });

  it("deve filtrar linhas menores que 240 caracteres", () => {
    const content = [
      "LINHA CURTA",
      "07700000         2EMPRESA TESTE          00000000000000                    20240101        000001087                                           ",
      "",
      "0770001300001 T 01     NOSSO001         0000000000010000                  000000000000100                                                                     ",
    ].map(l => l.padEnd(240, " ")).join("\n");

    const result = parseRetornoCobranca(content);

    expect(result.items.length).toBeGreaterThan(0);
  });

  it("deve lidar com quebra de linha CRLF", () => {
    const content = "07700000         2EMPRESA TESTE          00000000000000                    20240101        000001087                                           \r\n0770001300001 T 01     NOSSO001         0000000000010000                  000000000000100                                                                     ";

    const result = parseRetornoCobranca(content);

    expect(result.banco).toBe("077");
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("deve extrair nome da empresa", () => {
    const content = "07700000         2EMPRESA TESTE LTDA     00000000000000                    20240101        000001087                                           ".padEnd(240, " ");

    const result = parseRetornoCobranca(content);

    expect(result.empresa).toContain("EMPRESA TESTE");
  });

  it("deve extrair valor da tarifa", () => {
    const header = "07700000         2EMPRESA TESTE          00000000000000                    20240101        000001087                                           ";
    const segmentoT = "0770001300001 T 01     NOSSO001         0000000000010000                            000000000001500                                     ";

    const content = [
      header.padEnd(240, " "),
      segmentoT.padEnd(240, " "),
    ].join("\n");

    const result = parseRetornoCobranca(content);

    expect(result.items[0].valorTarifa).toBe(15.0);
  });

  it("deve combinar dados de segmento T e U", () => {
    const header = "07700000         2EMPRESA TESTE          00000000000000                    20240101        000001087                                           ";
    const segmentoT = "0770001300001 T 06     NOSSO001         0000000000010000                  000000000000100                                                                     ";
    const segmentoU = "0770001300001 U 00000000000000000000000000000000000000000000000000000000000123450000000000000000000015012024011501202400                      ";

    const content = [
      header.padEnd(240, " "),
      segmentoT.padEnd(240, " "),
      segmentoU.padEnd(240, " "),
    ].join("\n");

    const result = parseRetornoCobranca(content);

    const item = result.items[0];
    expect(item.nossoNumero).toBe("NOSSO001");
    expect(item.codigoOcorrencia).toBe("06");
    expect(item.ocorrencia).toBe("Liquidação Normal");
    expect(item.valorPago).toBe(123.45);
    expect(item.valorTarifa).toBe(1.0);
  });

  describe("Codigos de Ocorrencia", () => {
    const testCases = [
      { code: "02", expected: "Entrada Confirmada" },
      { code: "03", expected: "Entrada Rejeitada" },
      { code: "06", expected: "Liquidação Normal" },
      { code: "09", expected: "Baixado Automaticamente" },
      { code: "10", expected: "Baixado por Ter Sido Liquidado" },
      { code: "17", expected: "Liquidação após Baixa" },
      { code: "20", expected: "Débito em Conta" },
      { code: "25", expected: "Protestado" },
      { code: "26", expected: "Instrução Rejeitada" },
      { code: "27", expected: "Confirmação Alteração Dados" },
      { code: "28", expected: "Débito Tarifas" },
      { code: "30", expected: "Alteração de Dados Rejeitada" },
      { code: "33", expected: "Confirmação Pedido Alteração" },
    ];

    testCases.forEach(({ code, expected }) => {
      it(`deve mapear codigo ${code} para "${expected}"`, () => {
        const header = "07700000         2EMPRESA TESTE          00000000000000                    20240101        000001087                                           ";
        const segmentoT = `0770001300001 T ${code}     NOSSO001         0000000000010000                  000000000000100                                                                     `;

        const content = [
          header.padEnd(240, " "),
          segmentoT.padEnd(240, " "),
        ].join("\n");

        const result = parseRetornoCobranca(content);

        expect(result.items[0].ocorrencia).toBe(expected);
        expect(result.items[0].codigoOcorrencia).toBe(code);
      });
    });
  });
});
