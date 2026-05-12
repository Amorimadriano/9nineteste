import { describe, it, expect } from "vitest";
import { parseOFX, OFXTransaction } from "./ofxParser";

describe("parseOFX", () => {
  it("deve retornar array vazio para conteudo vazio", () => {
    const result = parseOFX("");
    expect(result).toEqual([]);
  });

  it("deve retornar array vazio quando nao ha transacoes", () => {
    const content = `
      <OFX>
        <SIGNONMSGSRSV1>
        </SIGNONMSGSRSV1>
      </OFX>
    `;

    const result = parseOFX(content);
    expect(result).toEqual([]);
  });

  it("deve parsear uma transacao simples", () => {
    const content = `
      <OFX>
        <STMTTRN>
          <FITID>TRANS001</FITID>
          <DTPOSTED>20240115120000</DTPOSTED>
          <TRNAMT>-150.50</TRNAMT>
          <NAME>COMPRA NO MERCADO</NAME>
        </STMTTRN>
      </OFX>
    `;

    const result = parseOFX(content);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      fitid: "TRANS001",
      date: "2024-01-15",
      amount: 150.5,
      description: "COMPRA NO MERCADO",
      type: "saida",
    });
  });

  it("deve parsear multiplas transacoes", () => {
    const content = `
      <OFX>
        <STMTTRN>
          <FITID>TRANS001</FITID>
          <DTPOSTED>20240115120000</DTPOSTED>
          <TRNAMT>-150.50</TRNAMT>
          <NAME>COMPRA 1</NAME>
        </STMTTRN>
        <STMTTRN>
          <FITID>TRANS002</FITID>
          <DTPOSTED>20240116120000</DTPOSTED>
          <TRNAMT>2500.00</TRNAMT>
          <NAME>SALARIO</NAME>
        </STMTTRN>
      </OFX>
    `;

    const result = parseOFX(content);

    expect(result).toHaveLength(2);
    expect(result[0].fitid).toBe("TRANS001");
    expect(result[1].fitid).toBe("TRANS002");
  });

  it("deve identificar tipo entrada para valores positivos", () => {
    const content = `
      <STMTTRN>
        <FITID>TRANS001</FITID>
        <DTPOSTED>20240115</DTPOSTED>
        <TRNAMT>150.00</TRNAMT>
        <NAME>DEPOSITO</NAME>
      </STMTTRN>
    `;

    const result = parseOFX(content);

    expect(result[0].type).toBe("entrada");
    expect(result[0].amount).toBe(150.0);
  });

  it("deve identificar tipo saida para valores negativos", () => {
    const content = `
      <STMTTRN>
        <FITID>TRANS001</FITID>
        <DTPOSTED>20240115</DTPOSTED>
        <TRNAMT>-150.00</TRNAMT>
        <NAME>SAQUE</NAME>
      </STMTTRN>
    `;

    const result = parseOFX(content);

    expect(result[0].type).toBe("saida");
    expect(result[0].amount).toBe(150.0);
  });

  it("deve converter virgula para ponto em valores", () => {
    const content = `
      <STMTTRN>
        <FITID>TRANS001</FITID>
        <DTPOSTED>20240115</DTPOSTED>
        <TRNAMT>1.234,56</TRNAMT>
        <NAME>PAGAMENTO</NAME>
      </STMTTRN>
    `;

    const result = parseOFX(content);

    expect(result[0].amount).toBe(1234.56);
  });

  it("deve usar MEMO quando NAME nao existe", () => {
    const content = `
      <STMTTRN>
        <FITID>TRANS001</FITID>
        <DTPOSTED>20240115</DTPOSTED>
        <TRNAMT>-100.00</TRNAMT>
        <MEMO>DESCRICAO DO MEMO</MEMO>
      </STMTTRN>
    `;

    const result = parseOFX(content);

    expect(result[0].description).toBe("DESCRICAO DO MEMO");
  });

  it("deve usar descricao padrao quando nao ha NAME nem MEMO", () => {
    const content = `
      <STMTTRN>
        <FITID>TRANS001</FITID>
        <DTPOSTED>20240115</DTPOSTED>
        <TRNAMT>-100.00</TRNAMT>
      </STMTTRN>
    `;

    const result = parseOFX(content);

    expect(result[0].description).toBe("Sem descrição");
  });

  it("deve gerar FITID quando nao existe", () => {
    const content = `
      <STMTTRN>
        <DTPOSTED>20240115</DTPOSTED>
        <TRNAMT>-100.00</TRNAMT>
        <NAME>TESTE</NAME>
      </STMTTRN>
    `;

    const result = parseOFX(content);

    expect(result[0].fitid).toMatch(/^gen-/);
  });

  it("deve pular transacoes sem DTPOSTED", () => {
    const content = `
      <STMTTRN>
        <FITID>TRANS001</FITID>
        <TRNAMT>-100.00</TRNAMT>
        <NAME>TESTE</NAME>
      </STMTTRN>
    `;

    const result = parseOFX(content);

    expect(result).toHaveLength(0);
  });

  it("deve pular transacoes sem TRNAMT", () => {
    const content = `
      <STMTTRN>
        <FITID>TRANS001</FITID>
        <DTPOSTED>20240115</DTPOSTED>
        <NAME>TESTE</NAME>
      </STMTTRN>
    `;

    const result = parseOFX(content);

    expect(result).toHaveLength(0);
  });

  describe("parseOFXDate", () => {
    it("deve formatar data basica", () => {
      const content = `
        <STMTTRN>
          <FITID>TRANS001</FITID>
          <DTPOSTED>20240115</DTPOSTED>
          <TRNAMT>-100.00</TRNAMT>
          <NAME>TESTE</NAME>
        </STMTTRN>
      `;

      const result = parseOFX(content);

      expect(result[0].date).toBe("2024-01-15");
    });

    it("deve remover timezone", () => {
      const content = `
        <STMTTRN>
          <FITID>TRANS001</FITID>
          <DTPOSTED>20240115120000[-3:BRT]</DTPOSTED>
          <TRNAMT>-100.00</TRNAMT>
          <NAME>TESTE</NAME>
        </STMTTRN>
      `;

      const result = parseOFX(content);

      expect(result[0].date).toBe("2024-01-15");
    });

    it("deve remover diferentes formatos de timezone", () => {
      const testCases = [
        { input: "20240115120000[-3:BRT]", expected: "2024-01-15" },
        { input: "20240115120000[-03:EST]", expected: "2024-01-15" },
        { input: "20240115120000[GMT]", expected: "2024-01-15" },
      ];

      testCases.forEach(({ input, expected }) => {
        const content = `
          <STMTTRN>
            <FITID>TRANS001</FITID>
            <DTPOSTED>${input}</DTPOSTED>
            <TRNAMT>-100.00</TRNAMT>
            <NAME>TESTE</NAME>
          </STMTTRN>
        `;

        const result = parseOFX(content);
        expect(result[0].date).toBe(expected);
      });
    });

    it("deve retornar string vazia para data invalida", () => {
      const content = `
        <STMTTRN>
          <FITID>TRANS001</FITID>
          <DTPOSTED>INVALIDO</DTPOSTED>
          <TRNAMT>-100.00</TRNAMT>
          <NAME>TESTE</NAME>
        </STMTTRN>
      `;

      const result = parseOFX(content);

      expect(result[0].date).toBe("");
    });

    it("deve validar ranges de data", () => {
      const content = `
        <STMTTRN>
          <FITID>TRANS001</FITID>
          <DTPOSTED>20241345</DTPOSTED>
          <TRNAMT>-100.00</TRNAMT>
          <NAME>TESTE</NAME>
        </STMTTRN>
      `;

      const result = parseOFX(content);

      expect(result[0].date).toBe("");
    });

    it("deve validar ano", () => {
      const content = `
        <STMTTRN>
          <FITID>TRANS001</FITID>
          <DTPOSTED>30000115</DTPOSTED>
          <TRNAMT>-100.00</TRNAMT>
          <NAME>TESTE</NAME>
        </STMTTRN>
      `;

      const result = parseOFX(content);

      expect(result[0].date).toBe("");
    });
  });

  describe("case insensitive", () => {
    it("deve aceitar tags em maiusculo", () => {
      const content = `
        <STMTTRN>
          <FITID>TRANS001</FITID>
          <DTPOSTED>20240115</DTPOSTED>
          <TRNAMT>-100.00</TRNAMT>
          <NAME>TESTE</NAME>
        </STMTTRN>
      `;

      const result = parseOFX(content);

      expect(result).toHaveLength(1);
    });

    it("deve aceitar tags em minusculo", () => {
      const content = `
        <stmttrn>
          <fitid>TRANS001</fitid>
          <dtposted>20240115</dtposted>
          <trnamt>-100.00</trnamt>
          <name>TESTE</name>
        </stmttrn>
      `;

      const result = parseOFX(content);

      expect(result).toHaveLength(1);
    });

    it("deve aceitar tags mistas", () => {
      const content = `
        <StmtTrn>
          <FitId>TRANS001</FitId>
          <DtPosted>20240115</DtPosted>
          <TrnAmt>-100.00</TrnAmt>
          <Name>TESTE</Name>
        </StmtTrn>
      `;

      const result = parseOFX(content);

      expect(result).toHaveLength(1);
    });
  });

  it("deve lidar com valores muito grandes", () => {
    const content = `
      <STMTTRN>
        <FITID>TRANS001</FITID>
        <DTPOSTED>20240115</DTPOSTED>
        <TRNAMT>999999.99</TRNAMT>
        <NAME>VALOR GRANDE</NAME>
      </STMTTRN>
    `;

    const result = parseOFX(content);

    expect(result[0].amount).toBe(999999.99);
  });

  it("deve lidar com valores muito pequenos", () => {
    const content = `
      <STMTTRN>
        <FITID>TRANS001</FITID>
        <DTPOSTED>20240115</DTPOSTED>
        <TRNAMT>0.01</TRNAMT>
        <NAME>VALOR PEQUENO</NAME>
      </STMTTRN>
    `;

    const result = parseOFX(content);

    expect(result[0].amount).toBe(0.01);
  });
});
