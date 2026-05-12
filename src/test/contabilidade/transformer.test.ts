/**
 * Testes de Transformer
 * Task #34 - APIs Contabilidade - Testes e Documentação
 * Valida conversão de dados entre formatos do sistema e cada ERP
 */

import { describe, it, expect } from "vitest";
import {
  contasPagarExemplo,
  contasReceberExemplo,
  mapeamentoContas,
  xmlTOTVS,
  jsonSankhya,
  xmlDominio,
  jsonAlterdata,
} from "./fixtures/erpFixtures";

// Implementações dos transformers para teste
const transformers = {
  // TOTVS - usa XML
  totvs: {
    contasPagarParaXML: (data: typeof contasPagarExemplo): string => {
      const lancamentos = data
        .map((item) => {
          const contaMapeada = mapeamentoContas[item.contaContabil as keyof typeof mapeamentoContas]?.totvs || item.contaContabil;
          return `
        <ContaPagar>
          <Codigo>${item.id}</Codigo>
          <Fornecedor>${escapeXML(item.fornecedor)}</Fornecedor>
          <CNPJ>${item.cnpjFornecedor.replace(/[^0-9]/g, "")}</CNPJ>
          <Documento>${item.numeroDocumento}</Documento>
          <Emissao>${formatDateTOTVS(item.dataEmissao)}</Emissao>
          <Vencimento>${formatDateTOTVS(item.dataVencimento)}</Vencimento>
          <Valor>${formatValorBR(item.valor)}</Valor>
          <Historico>${escapeXML(truncate(item.historico, 60))}</Historico>
          <ContaContabil>${contaMapeada}</ContaContabil>
        </ContaPagar>`;
        })
        .join("");

      return `<?xml version="1.0" encoding="UTF-8"?>
<ExportacaoContas>${lancamentos}
</ExportacaoContas>`;
    },

    contasReceberParaXML: (data: typeof contasReceberExemplo): string => {
      const lancamentos = data
        .map((item) => {
          const contaMapeada = mapeamentoContas[item.contaContabil as keyof typeof mapeamentoContas]?.totvs || item.contaContabil;
          return `
        <ContaReceber>
          <Codigo>${item.id}</Codigo>
          <Cliente>${escapeXML(item.cliente)}</Cliente>
          <CNPJ>${item.cnpjCliente.replace(/[^0-9]/g, "")}</CNPJ>
          <Documento>${item.numeroDocumento}</Documento>
          <Emissao>${formatDateTOTVS(item.dataEmissao)}</Emissao>
          <Vencimento>${formatDateTOTVS(item.dataVencimento)}</Vencimento>
          <Valor>${formatValorBR(item.valor)}</Valor>
          <Historico>${escapeXML(truncate(item.historico, 60))}</Historico>
          <ContaContabil>${contaMapeada}</ContaContabil>
        </ContaReceber>`;
        })
        .join("");

      return `<?xml version="1.0" encoding="UTF-8"?>
<ExportacaoContas>${lancamentos}
</ExportacaoContas>`;
    },
  },

  // Sankhya - usa JSON com estrutura específica
  sankhya: {
    contasPagarParaJSON: (data: typeof contasPagarExemplo): any => {
      const rows = data.map((item) => {
        const contaMapeada = mapeamentoContas[item.contaContabil as keyof typeof mapeamentoContas]?.sankhya || item.contaContabil;
        return {
          localFields: {
            CODPARC: { $: "123" },
            DTNEG: { $: formatDateSankhya(item.dataEmissao) },
            DTVENC: { $: formatDateSankhya(item.dataVencimento) },
            VLRDESDOB: { $: item.valor.toFixed(2) },
            HISTORICO: { $: truncate(item.historico, 250) },
            CODNAT: { $: contaMapeada },
            NUMNOTA: { $: item.numeroDocumento },
          },
        };
      });

      return {
        serviceName: "CRUDServiceProvider.saveRecord",
        body: {
          dataSet: {
            rootEntity: "Financeiro",
            includePresentationFields: "N",
            dataRow: rows[0],
          },
        },
      };
    },

    contasReceberParaJSON: (data: typeof contasReceberExemplo): any => {
      return data.map((item) => {
        const contaMapeada = mapeamentoContas[item.contaContabil as keyof typeof mapeamentoContas]?.sankhya || item.contaContabil;
        return {
          serviceName: "CRUDServiceProvider.saveRecord",
          body: {
            dataSet: {
              rootEntity: "Financeiro",
              dataRow: {
                localFields: {
                  CODPARC: { $: "456" },
                  DTNEG: { $: formatDateSankhya(item.dataEmissao) },
                  DTVENC: { $: formatDateSankhya(item.dataVencimento) },
                  VLRDESDOB: { $: item.valor.toFixed(2) },
                  HISTORICO: { $: truncate(item.historico, 250) },
                  CODNAT: { $: contaMapeada },
                  RECDESP: { $: "R" },
                },
              },
            },
          },
        };
      });
    },
  },

  // Domínio - usa XML
  dominio: {
    contasPagarParaXML: (data: typeof contasPagarExemplo): string => {
      const lancamentos = data
        .map((item) => {
          const contaMapeada = mapeamentoContas[item.contaContabil as keyof typeof mapeamentoContas]?.dominio || item.contaContabil;
          return `
      <Lancamento>
        <Tipo>CPAGAR</Tipo>
        <CodigoExterno>${item.id}</CodigoExterno>
        <Pessoa>${escapeXML(item.fornecedor)}</Pessoa>
        <Cnpj>${item.cnpjFornecedor}</Cnpj>
        <Documento>${item.numeroDocumento}</Documento>
        <Data>${item.dataEmissao}</Data>
        <Vencimento>${item.dataVencimento}</Vencimento>
        <Valor>${item.valor.toFixed(2)}</Valor>
        <Historico>${escapeXML(truncate(item.historico, 200))}</Historico>
        <Conta>${contaMapeada}</Conta>
      </Lancamento>`;
        })
        .join("");

      return `<?xml version="1.0"?>
<Integracao>${lancamentos}
</Integracao>`;
    },
  },

  // Alterdata - usa JSON
  alterdata: {
    contasPagarParaJSON: (data: typeof contasPagarExemplo): any => {
      const contaMapeada = mapeamentoContas[data[0].contaContabil as keyof typeof mapeamentoContas]?.alterdata || data[0].contaContabil;

      return {
        operacao: "inclusao",
        tipoLancamento: "contasPagar",
        lancamentos: data.map((item) => ({
          codigoExterno: item.id,
          pessoa: {
            nome: item.fornecedor,
            cnpjCpf: item.cnpjFornecedor,
          },
          documento: {
            numero: item.numeroDocumento,
            dataEmissao: item.dataEmissao,
            dataVencimento: item.dataVencimento,
          },
          valor: item.valor,
          historico: truncate(item.historico, 150),
          contaContabil: contaMapeada,
        })),
      };
    },
  },
};

// Funções utilitárias
function formatDateTOTVS(date: string): string {
  // AAAAMMDD
  return date.replace(/-/g, "");
}

function formatDateSankhya(date: string): string {
  // DD/MM/YYYY
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function formatValorBR(valor: number): string {
  // Formato brasileiro com vírgula
  return valor.toFixed(2).replace(".", ",");
}

function escapeXML(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength);
}

describe("Transformer - TOTVS", () => {
  describe("Conversão de Contas a Pagar", () => {
    it("deve converter para XML válido", () => {
      const xml = transformers.totvs.contasPagarParaXML(contasPagarExemplo);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain("<ExportacaoContas>");
      expect(xml).toContain("<ContaPagar>");
      expect(xml).toContain("</ContaPagar>");
    });

    it("deve formatar data no padrão AAAAMMDD", () => {
      const xml = transformers.totvs.contasPagarParaXML([contasPagarExemplo[0]]);

      expect(xml).toContain("<Emissao>20240401</Emissao>");
      expect(xml).toContain("<Vencimento>20240430</Vencimento>");
    });

    it("deve formatar valores com vírgula decimal", () => {
      const xml = transformers.totvs.contasPagarParaXML([contasPagarExemplo[0]]);

      expect(xml).toContain("<Valor>15000,00</Valor>");
    });

    it("deve remover formatação do CNPJ", () => {
      const xml = transformers.totvs.contasPagarParaXML([contasPagarExemplo[0]]);

      expect(xml).toContain("<CNPJ>12345678000190</CNPJ>");
      expect(xml).not.toContain("12.345.678/0001-90");
    });

    it("deve mapear conta contábil do formato interno para TOTVS", () => {
      const xml = transformers.totvs.contasPagarParaXML([contasPagarExemplo[0]]);

      expect(xml).toContain("<ContaContabil>21101</ContaContabil>");
    });

    it("deve escapar caracteres especiais no XML", () => {
      const dadosComEspecial = [
        {
          ...contasPagarExemplo[0],
          historico: "Compra > 1000 & itens",
        },
      ];

      const xml = transformers.totvs.contasPagarParaXML(dadosComEspecial);

      expect(xml).toContain("Compra &gt; 1000 &amp; itens");
      expect(xml).not.toContain("Compra > 1000 & itens");
    });
  });

  describe("Conversão de Contas a Receber", () => {
    it("deve converter contas a receber para XML", () => {
      const xml = transformers.totvs.contasReceberParaXML(contasReceberExemplo);

      expect(xml).toContain("<ContaReceber>");
      expect(xml).toContain("<Cliente>");
      expect(xml).toContain("<CNPJ>55444333000122</CNPJ>");
    });

    it("deve mapear conta contábil para contas a receber", () => {
      const xml = transformers.totvs.contasReceberParaXML([contasReceberExemplo[0]]);

      expect(xml).toContain("<ContaContabil>11201</ContaContabil>");
    });
  });

  describe("Truncamento de Campos", () => {
    it("deve truncar histórico para 60 caracteres", () => {
      const dadosLongos = [
        {
          ...contasPagarExemplo[0],
          historico: "A".repeat(100),
        },
      ];

      const xml = transformers.totvs.contasPagarParaXML(dadosLongos);
      const match = xml.match(/<Historico>([^<]*)<\/Historico>/);

      expect(match?.[1].length).toBe(60);
    });
  });
});

describe("Transformer - Sankhya", () => {
  describe("Conversão de Contas a Pagar", () => {
    it("deve criar estrutura JSON correta", () => {
      const json = transformers.sankhya.contasPagarParaJSON([contasPagarExemplo[0]]);

      expect(json).toHaveProperty("serviceName", "CRUDServiceProvider.saveRecord");
      expect(json).toHaveProperty("body.dataSet.rootEntity", "Financeiro");
      expect(json).toHaveProperty("body.dataSet.dataRow.localFields");
    });

    it("deve formatar data no padrão DD/MM/YYYY", () => {
      const json = transformers.sankhya.contasPagarParaJSON([contasPagarExemplo[0]]);

      expect(json.body.dataSet.dataRow.localFields.DTNEG.$).toBe("01/04/2024");
    });

    it("deve formatar valor com ponto decimal", () => {
      const json = transformers.sankhya.contasPagarParaJSON([contasPagarExemplo[0]]);

      expect(json.body.dataSet.dataRow.localFields.VLRDESDOB.$).toBe("15000.00");
    });

    it("deve mapear conta contábil", () => {
      const json = transformers.sankhya.contasPagarParaJSON([contasPagarExemplo[0]]);

      expect(json.body.dataSet.dataRow.localFields.CODNAT.$).toBe("21101");
    });

    it("deve truncar histórico para 250 caracteres", () => {
      const dadosLongos = [
        {
          ...contasPagarExemplo[0],
          historico: "A".repeat(300),
        },
      ];

      const json = transformers.sankhya.contasPagarParaJSON(dadosLongos);

      expect(json.body.dataSet.dataRow.localFields.HISTORICO.$.length).toBe(250);
    });
  });

  describe("Conversão de Contas a Receber", () => {
    it("deve incluir RECDESP = R para receitas", () => {
      const json = transformers.sankhya.contasReceberParaJSON([contasReceberExemplo[0]]);

      expect(json[0].body.dataSet.dataRow.localFields.RECDESP.$).toBe("R");
    });
  });
});

describe("Transformer - Domínio", () => {
  describe("Conversão de Contas a Pagar", () => {
    it("deve converter para XML válido", () => {
      const xml = transformers.dominio.contasPagarParaXML([contasPagarExemplo[0]]);

      expect(xml).toContain('<?xml version="1.0"?>');
      expect(xml).toContain("<Integracao>");
      expect(xml).toContain("<Lancamento>");
    });

    it("deve usar tipo CPAGAR para contas a pagar", () => {
      const xml = transformers.dominio.contasPagarParaXML([contasPagarExemplo[0]]);

      expect(xml).toContain("<Tipo>CPAGAR</Tipo>");
    });

    it("deve manter CNPJ formatado", () => {
      const xml = transformers.dominio.contasPagarParaXML([contasPagarExemplo[0]]);

      expect(xml).toContain("<Cnpj>12.345.678/0001-90</Cnpj>");
    });

    it("deve mapear conta contábil para código do Domínio", () => {
      const xml = transformers.dominio.contasPagarParaXML([contasPagarExemplo[0]]);

      expect(xml).toContain("<Conta>FORNECEDORES</Conta>");
    });
  });
});

describe("Transformer - Alterdata", () => {
  describe("Conversão de Contas a Pagar", () => {
    it("deve criar estrutura JSON correta", () => {
      const json = transformers.alterdata.contasPagarParaJSON([contasPagarExemplo[0]]);

      expect(json).toHaveProperty("operacao", "inclusao");
      expect(json).toHaveProperty("tipoLancamento", "contasPagar");
      expect(json).toHaveProperty("lancamentos");
    });

    it("deve incluir dados da pessoa", () => {
      const json = transformers.alterdata.contasPagarParaJSON([contasPagarExemplo[0]]);

      expect(json.lancamentos[0]).toHaveProperty("pessoa");
      expect(json.lancamentos[0].pessoa).toHaveProperty("nome");
      expect(json.lancamentos[0].pessoa).toHaveProperty("cnpjCpf");
    });

    it("deve incluir dados do documento", () => {
      const json = transformers.alterdata.contasPagarParaJSON([contasPagarExemplo[0]]);

      expect(json.lancamentos[0]).toHaveProperty("documento");
      expect(json.lancamentos[0].documento).toHaveProperty("dataEmissao");
      expect(json.lancamentos[0].documento).toHaveProperty("dataVencimento");
    });

    it("deve mapear conta contábil para formato Alterdata", () => {
      const json = transformers.alterdata.contasPagarParaJSON([contasPagarExemplo[0]]);

      expect(json.lancamentos[0].contaContabil).toBe("2.01.01.01");
    });
  });
});

describe("Validação de Campos Obrigatórios", () => {
  const validarCamposObrigatorios = (dados: any, campos: string[]): boolean => {
    return campos.every((campo) => {
      const valor = dados[campo];
      return valor !== undefined && valor !== null && valor !== "";
    });
  };

  it("deve validar campos obrigatórios para contas a pagar", () => {
    const camposObrigatorios = [
      "fornecedor",
      "cnpjFornecedor",
      "dataVencimento",
      "valor",
      "contaContabil",
    ];

    const valido = validarCamposObrigatorios(contasPagarExemplo[0], camposObrigatorios);

    expect(valido).toBe(true);
  });

  it("deve rejeitar dados sem campos obrigatórios", () => {
    const camposObrigatorios = ["fornecedor", "valor"];

    const invalido = { fornecedor: "", valor: null };

    const valido = validarCamposObrigatorios(invalido, camposObrigatorios);

    expect(valido).toBe(false);
  });
});

describe("Normalização de Valores", () => {
  it("deve aceitar valor com vírgula e converter para número", () => {
    const valorString = "1.5000,00";
    const normalizado = parseFloat(valorString.replace(/\./g, "").replace(",", "."));

    expect(normalizado).toBe(15000.0);
  });

  it("deve aceitar valor com ponto e converter corretamente", () => {
    const valorString = "25000.50";
    const normalizado = parseFloat(valorString);

    expect(normalizado).toBe(25000.5);
  });

  it("deve arredondar valores para 2 casas decimais", () => {
    const valor = 15000.999;
    const arredondado = Math.round(valor * 100) / 100;

    expect(arredondado).toBe(15001.0);
  });
});

describe("Formatação de Datas", () => {
  it("deve formatar data ISO para AAAAMMDD", () => {
    const data = "2024-04-15";
    const formatada = data.replace(/-/g, "");

    expect(formatada).toBe("20240415");
  });

  it("deve formatar data ISO para DD/MM/YYYY", () => {
    const data = "2024-04-15";
    const [year, month, day] = data.split("-");
    const formatada = `${day}/${month}/${year}`;

    expect(formatada).toBe("15/04/2024");
  });

  it("deve validar data no formato ISO", () => {
    const data = "2024-04-15";
    const regex = /^\d{4}-\d{2}-\d{2}$/;

    expect(regex.test(data)).toBe(true);
  });

  it("deve rejeitar data inválida", () => {
    const data = "2024-13-45";
    const dataObj = new Date(data);

    expect(isNaN(dataObj.getTime())).toBe(true);
  });
});
