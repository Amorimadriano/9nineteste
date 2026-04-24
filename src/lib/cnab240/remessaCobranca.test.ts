import { describe, it, expect } from "vitest";
import { gerarRemessaCobranca } from "./remessaCobranca";
import { CnabEmpresa, CnabBoleto } from "./types";

describe("gerarRemessaCobranca", () => {
  const empresaBase: CnabEmpresa = {
    razaoSocial: "EMPRESA TESTE LTDA",
    cnpj: "12.345.678/0001-90",
    agencia: "1234",
    conta: "56789",
    digitoConta: "0",
    codigoBanco: "077",
    nomeBanco: "BANCO INTER",
  };

  const boletoBase: CnabBoleto = {
    nossoNumero: "00000001234",
    dataVencimento: new Date(2024, 6, 15), // 15/07/2024
    valor: 1500.5,
    sacadoNome: "CLIENTE TESTE",
    sacadoDocumento: "123.456.789-09",
    sacadoEndereco: "RUA TESTE, 123",
    sacadoCidade: "SAO PAULO",
    sacadoEstado: "SP",
    sacadoCep: "01001-000",
  };

  describe("estrutura do arquivo", () => {
    it("deve gerar arquivo com linhas", () => {
      const result = gerarRemessaCobranca(empresaBase, [boletoBase]);
      const lines = result.split("\r\n");

      expect(lines.length).toBeGreaterThanOrEqual(5); // Header + Header Lote + P + Q + Trailer Lote + Trailer Arquivo
    });

    it("cada linha deve ter 240 caracteres", () => {
      const result = gerarRemessaCobranca(empresaBase, [boletoBase]);
      const lines = result.split("\r\n").filter((l) => l.length > 0);

      lines.forEach((line) => {
        expect(line.length).toBe(240);
      });
    });

    it("deve ter header de arquivo como primeira linha", () => {
      const result = gerarRemessaCobranca(empresaBase, [boletoBase]);
      const firstLine = result.split("\r\n")[0];

      expect(firstLine.charAt(7)).toBe("0"); // Tipo registro = 0
      expect(firstLine.substring(0, 3)).toBe("077"); // Código do banco
    });

    it("deve ter trailer de arquivo como ultima linha", () => {
      const result = gerarRemessaCobranca(empresaBase, [boletoBase]);
      const lines = result.split("\r\n").filter((l) => l.length > 0);
      const lastLine = lines[lines.length - 1];

      expect(lastLine.charAt(7)).toBe("9"); // Tipo registro = 9
      expect(lastLine.substring(4, 8)).toBe("9999"); // Lote 9999
    });
  });

  describe("header de arquivo", () => {
    it("deve preencher código do banco", () => {
      const result = gerarRemessaCobranca(empresaBase, [boletoBase]);
      const header = result.split("\r\n")[0];

      expect(header.substring(0, 3)).toBe("077");
    });

    it("deve preencher CNPJ da empresa", () => {
      const result = gerarRemessaCobranca(empresaBase, [boletoBase]);
      const header = result.split("\r\n")[0];

      expect(header.substring(18, 32)).toBe("12345678000190");
    });

    it("deve preencher razao social", () => {
      const result = gerarRemessaCobranca(empresaBase, [boletoBase]);
      const header = result.split("\r\n")[0];

      expect(header.substring(72, 102)).toContain("EMPRESA TESTE");
    });

    it("deve preencher data de geracao", () => {
      const result = gerarRemessaCobranca(empresaBase, [boletoBase]);
      const header = result.split("\r\n")[0];
      const dataGeracao = header.substring(143, 151);

      expect(dataGeracao).toMatch(/^\d{8}$/); // Formato DDMMAAAA
    });

    it("deve usar tipo inscricao 2 para CNPJ", () => {
      const result = gerarRemessaCobranca(empresaBase, [boletoBase]);
      const header = result.split("\r\n")[0];

      expect(header.charAt(17)).toBe("2");
    });

    it("deve preencher agencia", () => {
      const result = gerarRemessaCobranca(empresaBase, [boletoBase]);
      const header = result.split("\r\n")[0];

      expect(header.substring(52, 57)).toBe("01234"); // Agencia com padding
    });

    it("deve preencher conta", () => {
      const result = gerarRemessaCobranca(empresaBase, [boletoBase]);
      const header = result.split("\r\n")[0];

      expect(header.substring(58, 70)).toBe("000000056789"); // Conta com padding
    });

    it("deve preencher digito da conta", () => {
      const result = gerarRemessaCobranca(empresaBase, [boletoBase]);
      const header = result.split("\r\n")[0];

      expect(header.charAt(70)).toBe("0");
    });

    it("deve preencher NSA (numero sequencial arquivo)", () => {
      const result = gerarRemessaCobranca(empresaBase, [boletoBase], 5);
      const header = result.split("\r\n")[0];

      expect(header.substring(157, 163)).toBe("000005");
    });
  });

  describe("segmento P", () => {
    it("deve ter tipo de registro 3", () => {
      const result = gerarRemessaCobranca(empresaBase, [boletoBase]);
      const lines = result.split("\r\n");
      const segmentoP = lines.find((l) => l.charAt(13) === "P");

      expect(segmentoP).toBeDefined();
      expect(segmentoP!.charAt(7)).toBe("3");
    });

    it("deve ter codigo de segmento P", () => {
      const result = gerarRemessaCobranca(empresaBase, [boletoBase]);
      const lines = result.split("\r\n");
      const segmentoP = lines.find((l) => l.charAt(7) === "3" && l.charAt(13) === "P");

      expect(segmentoP).toBeDefined();
    });

    it("deve preencher codigo de movimento 01", () => {
      const result = gerarRemessaCobranca(empresaBase, [boletoBase]);
      const lines = result.split("\r\n");
      const segmentoP = lines.find((l) => l.charAt(13) === "P");

      expect(segmentoP!.substring(15, 17)).toBe("01");
    });

    it("deve preencher nosso numero", () => {
      const result = gerarRemessaCobranca(empresaBase, [boletoBase]);
      const lines = result.split("\r\n");
      const segmentoP = lines.find((l) => l.charAt(13) === "P");

      expect(segmentoP!.substring(46, 57)).toContain("00000001234");
    });

    it("deve preencher data de vencimento", () => {
      const result = gerarRemessaCobranca(empresaBase, [boletoBase]);
      const lines = result.split("\r\n");
      const segmentoP = lines.find((l) => l.charAt(13) === "P");

      expect(segmentoP!.substring(79, 87)).toBe("15072024");
    });

    it("deve preencher valor do titulo", () => {
      const result = gerarRemessaCobranca(empresaBase, [boletoBase]);
      const lines = result.split("\r\n");
      const segmentoP = lines.find((l) => l.charAt(13) === "P");

      expect(segmentoP!.substring(87, 102)).toBe("000000000150050");
    });

    it("deve preencher especie do titulo 02 (DM)", () => {
      const result = gerarRemessaCobranca(empresaBase, [boletoBase]);
      const lines = result.split("\r\n");
      const segmentoP = lines.find((l) => l.charAt(13) === "P");

      expect(segmentoP!.substring(108, 110)).toBe("02");
    });

    it("deve preencher aceite N", () => {
      const result = gerarRemessaCobranca(empresaBase, [boletoBase]);
      const lines = result.split("\r\n");
      const segmentoP = lines.find((l) => l.charAt(13) === "P");

      expect(segmentoP!.charAt(110)).toBe("N");
    });
  });

  describe("segmento Q", () => {
    it("deve ter codigo de segmento Q", () => {
      const result = gerarRemessaCobranca(empresaBase, [boletoBase]);
      const lines = result.split("\r\n");
      const segmentoQ = lines.find((l) => l.charAt(7) === "3" && l.charAt(13) === "Q");

      expect(segmentoQ).toBeDefined();
    });

    it("deve preencher tipo de inscricao 1 para CPF", () => {
      const result = gerarRemessaCobranca(empresaBase, [boletoBase]);
      const lines = result.split("\r\n");
      const segmentoQ = lines.find((l) => l.charAt(13) === "Q");

      expect(segmentoQ!.charAt(17)).toBe("1");
    });

    it("deve preencher documento do sacado", () => {
      const result = gerarRemessaCobranca(empresaBase, [boletoBase]);
      const lines = result.split("\r\n");
      const segmentoQ = lines.find((l) => l.charAt(13) === "Q");

      expect(segmentoQ!.substring(18, 33)).toBe("000012345678909");
    });

    it("deve preencher nome do sacado", () => {
      const result = gerarRemessaCobranca(empresaBase, [boletoBase]);
      const lines = result.split("\r\n");
      const segmentoQ = lines.find((l) => l.charAt(13) === "Q");

      expect(segmentoQ!.substring(33, 73)).toContain("CLIENTE TESTE");
    });

    it("deve preencher endereco do sacado", () => {
      const result = gerarRemessaCobranca(empresaBase, [boletoBase]);
      const lines = result.split("\r\n");
      const segmentoQ = lines.find((l) => l.charAt(13) === "Q");

      expect(segmentoQ!.substring(73, 113)).toContain("RUA TESTE");
    });

    it("deve preencher CEP do sacado", () => {
      const result = gerarRemessaCobranca(empresaBase, [boletoBase]);
      const lines = result.split("\r\n");
      const segmentoQ = lines.find((l) => l.charAt(13) === "Q");

      expect(segmentoQ!.substring(128, 133)).toBe("01001");
      expect(segmentoQ!.substring(133, 136)).toBe("000");
    });

    it("deve preencher cidade e estado do sacado", () => {
      const result = gerarRemessaCobranca(empresaBase, [boletoBase]);
      const lines = result.split("\r\n");
      const segmentoQ = lines.find((l) => l.charAt(13) === "Q");

      expect(segmentoQ!.substring(136, 151)).toContain("SAO PAULO");
      expect(segmentoQ!.substring(151, 153)).toBe("SP");
    });

    it("deve usar tipo 2 para CNPJ do sacado", () => {
      const boletoCNPJ: CnabBoleto = {
        ...boletoBase,
        sacadoDocumento: "12.345.678/0001-90",
      };

      const result = gerarRemessaCobranca(empresaBase, [boletoCNPJ]);
      const lines = result.split("\r\n");
      const segmentoQ = lines.find((l) => l.charAt(13) === "Q");

      expect(segmentoQ!.charAt(17)).toBe("2");
    });
  });

  describe("multiplos boletos", () => {
    it("deve gerar P e Q para cada boleto", () => {
      const boletos: CnabBoleto[] = [
        { ...boletoBase, nossoNumero: "00000000001" },
        { ...boletoBase, nossoNumero: "00000000002" },
      ];

      const result = gerarRemessaCobranca(empresaBase, boletos);
      const lines = result.split("\r\n").filter((l) => l.length > 0);

      // Header + Header Lote + P1 + Q1 + P2 + Q2 + Trailer Lote + Trailer Arquivo = 8
      expect(lines.length).toBe(8);
    });

    it("deve calcular quantidade de registros no trailer de lote", () => {
      const boletos: CnabBoleto[] = [
        { ...boletoBase, nossoNumero: "00000000001" },
        { ...boletoBase, nossoNumero: "00000000002" },
      ];

      const result = gerarRemessaCobranca(empresaBase, boletos);
      const lines = result.split("\r\n").filter((l) => l.length > 0);
      const trailerLote = lines[lines.length - 2]; // Penultima linha

      // Header lote (1) + Trailer lote (1) + Segmentos (2 * 2) = 6
      expect(trailerLote.substring(17, 23)).toBe("000006");
    });

    it("deve somar valores no trailer de lote", () => {
      const boletos: CnabBoleto[] = [
        { ...boletoBase, nossoNumero: "00000000001", valor: 100.0 },
        { ...boletoBase, nossoNumero: "00000000002", valor: 200.0 },
      ];

      const result = gerarRemessaCobranca(empresaBase, boletos);
      const lines = result.split("\r\n").filter((l) => l.length > 0);
      const trailerLote = lines[lines.length - 2];

      expect(trailerLote.substring(23, 40)).toBe("00000000000030000");
    });
  });

  describe("trailer de arquivo", () => {
    it("deve contar lotes corretamente", () => {
      const result = gerarRemessaCobranca(empresaBase, [boletoBase]);
      const lines = result.split("\r\n").filter((l) => l.length > 0);
      const trailerArquivo = lines[lines.length - 1];

      expect(trailerArquivo.substring(17, 23)).toBe("000001"); // 1 lote
    });

    it("deve contar registros corretamente", () => {
      const result = gerarRemessaCobranca(empresaBase, [boletoBase]);
      const lines = result.split("\r\n").filter((l) => l.length > 0);
      const trailerArquivo = lines[lines.length - 1];

      // Total de linhas (6) incluindo o proprio trailer
      expect(trailerArquivo.substring(23, 29)).toBe("000006");
    });
  });

  describe("empresa sem codigo de banco", () => {
    it("deve usar banco padrao 077", () => {
      const empresaSemBanco: CnabEmpresa = {
        ...empresaBase,
        codigoBanco: undefined,
        nomeBanco: undefined,
      };

      const result = gerarRemessaCobranca(empresaSemBanco, [boletoBase]);
      const header = result.split("\r\n")[0];

      expect(header.substring(0, 3)).toBe("077");
    });
  });
});
