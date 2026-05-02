/**
 * Testes de Validação NFS-e
 * Valida CNPJ, CPF, campos obrigatórios, valores e datas
 */

import { describe, it, expect } from "vitest";
import {
  validarCNPJ,
  validarCPF,
  validarCamposObrigatorios,
  validarValores,
  validarDataCompetencia,
  formatarCNPJ,
  formatarCPF,
  limparDocumento,
} from "@/lib/nfse/validacao";
import {
  cnpjsValidos,
  cnpjsInvalidos,
  cpfsValidos,
  cpfsInvalidos,
  dadosNotaFiscalValida,
  dadosNotaFiscalInvalida,
} from "./fixtures/nfseFixtures";
import type { NFSeEmissaoData } from "@/types/nfse";

describe("Validação NFSe", () => {
  describe("CNPJ válido/inválido", () => {
    describe("CNPJs válidos", () => {
      cnpjsValidos.forEach((cnpj) => {
        it(`deve validar CNPJ válido: ${cnpj}`, () => {
          const resultado = validarCNPJ(cnpj);
          expect(resultado.valido).toBe(true);
          expect(resultado.erro).toBeUndefined();
        });
      });

      it("deve aceitar CNPJ com formatação", () => {
        const resultado = validarCNPJ("12.345.678/0001-95");
        expect(resultado.valido).toBe(true);
      });

      it("deve aceitar CNPJ com espaços", () => {
        const resultado = validarCNPJ("  12345678000195  ");
        expect(resultado.valido).toBe(true);
      });

      it("deve retornar CNPJ sem formatação", () => {
        const resultado = validarCNPJ("12.345.678/0001-95");
        expect(resultado.cnpjLimpo).toBe("12345678000195");
      });
    });

    describe("CNPJs inválidos", () => {
      cnpjsInvalidos.forEach((cnpj) => {
        it(`deve rejeitar CNPJ inválido: ${cnpj || "(vazio)"}`, () => {
          const resultado = validarCNPJ(cnpj);
          expect(resultado.valido).toBe(false);
          expect(resultado.erro).toBeDefined();
        });
      });

      it("deve rejeitar CNPJ com dígitos verificadores errados", () => {
        const resultado = validarCNPJ("12345678000100");
        expect(resultado.valido).toBe(false);
        expect(resultado.erro).toContain("dígito verificador");
      });

      it("deve rejeitar CNPJ com todos dígitos iguais", () => {
        const resultado = validarCNPJ("11111111111111");
        expect(resultado.valido).toBe(false);
      });

      it("deve rejeitar CNPJ com letras", () => {
        const resultado = validarCNPJ("abcdefghijklmn");
        expect(resultado.valido).toBe(false);
      });

      it("deve rejeitar CNPJ muito curto", () => {
        const resultado = validarCNPJ("12345");
        expect(resultado.valido).toBe(false);
        expect(resultado.erro).toContain("14 dígitos");
      });

      it("deve rejeitar CNPJ muito longo", () => {
        const resultado = validarCNPJ("123456789012345");
        expect(resultado.valido).toBe(false);
      });
    });

    describe("Formatação de CNPJ", () => {
      it("deve formatar CNPJ válido", () => {
        const formatado = formatarCNPJ("12345678000195");
        expect(formatado).toBe("12.345.678/0001-95");
      });

      it("deve retornar string vazia para CNPJ inválido", () => {
        const formatado = formatarCNPJ("12345");
        expect(formatado).toBe("");
      });

      it("deve manter CNPJ já formatado", () => {
        const formatado = formatarCNPJ("12.345.678/0001-95");
        expect(formatado).toBe("12.345.678/0001-95");
      });
    });
  });

  describe("CPF válido/inválido", () => {
    describe("CPFs válidos", () => {
      cpfsValidos.forEach((cpf) => {
        it(`deve validar CPF válido: ${cpf}`, () => {
          const resultado = validarCPF(cpf);
          expect(resultado.valido).toBe(true);
          expect(resultado.erro).toBeUndefined();
        });
      });

      it("deve aceitar CPF com formatação", () => {
        const resultado = validarCPF("529.982.247-25");
        expect(resultado.valido).toBe(true);
      });

      it("deve aceitar CPF com espaços", () => {
        const resultado = validarCPF("  52998224725  ");
        expect(resultado.valido).toBe(true);
      });

      it("deve retornar CPF sem formatação", () => {
        const resultado = validarCPF("529.982.247-25");
        expect(resultado.cpfLimpo).toBe("52998224725");
      });
    });

    describe("CPFs inválidos", () => {
      cpfsInvalidos.forEach((cpf) => {
        it(`deve rejeitar CPF inválido: ${cpf || "(vazio)"}`, () => {
          const resultado = validarCPF(cpf);
          expect(resultado.valido).toBe(false);
          expect(resultado.erro).toBeDefined();
        });
      });

      it("deve rejeitar CPF com dígitos verificadores errados", () => {
        const resultado = validarCPF("12345678900");
        expect(resultado.valido).toBe(false);
        expect(resultado.erro).toContain("dígito verificador");
      });

      it("deve rejeitar CPF com todos dígitos iguais", () => {
        const resultado = validarCPF("11111111111");
        expect(resultado.valido).toBe(false);
      });

      it("deve rejeitar CPF com letras", () => {
        const resultado = validarCPF("abcdefghijk");
        expect(resultado.valido).toBe(false);
      });

      it("deve rejeitar CPF muito curto", () => {
        const resultado = validarCPF("123456789");
        expect(resultado.valido).toBe(false);
        expect(resultado.erro).toContain("11 dígitos");
      });

      it("deve rejeitar CPF muito longo", () => {
        const resultado = validarCPF("123456789012");
        expect(resultado.valido).toBe(false);
      });
    });

    describe("Formatação de CPF", () => {
      it("deve formatar CPF válido", () => {
        const formatado = formatarCPF("52998224725");
        expect(formatado).toBe("529.982.247-25");
      });

      it("deve retornar string vazia para CPF inválido", () => {
        const formatado = formatarCPF("12345");
        expect(formatado).toBe("");
      });

      it("deve manter CPF já formatado", () => {
        const formatado = formatarCPF("529.982.247-25");
        expect(formatado).toBe("529.982.247-25");
      });
    });

    describe("Limpar documento", () => {
      it("deve remover formatação de CNPJ", () => {
        const limpo = limparDocumento("12.345.678/0001-95");
        expect(limpo).toBe("12345678000195");
      });

      it("deve remover formatação de CPF", () => {
        const limpo = limparDocumento("529.982.247-25");
        expect(limpo).toBe("52998224725");
      });

      it("deve remover caracteres não numéricos", () => {
        const limpo = limparDocumento("ABC-123.XYZ");
        expect(limpo).toBe("123");
      });
    });
  });

  describe("Campos obrigatórios", () => {
    it("deve validar dados completos", () => {
      const resultado = validarCamposObrigatorios(dadosNotaFiscalValida);
      expect(resultado.valido).toBe(true);
      expect(resultado.erros).toHaveLength(0);
    });

    it("deve detectar CNPJ do prestador ausente", () => {
      const dados = {
        ...dadosNotaFiscalInvalida.semCnpj,
        prestador: {
          ...dadosNotaFiscalInvalida.semCnpj.prestador,
          cnpj: "",
        },
      } as NFSeEmissaoData;

      const resultado = validarCamposObrigatorios(dados);
      expect(resultado.valido).toBe(false);
      expect(resultado.erros).toContainEqual(
        expect.objectContaining({
          campo: "prestador.cnpj",
          mensagem: expect.stringContaining("CNPJ"),
        })
      );
    });

    it("deve detectar CNPJ/CPF do tomador ausente", () => {
      const resultado = validarCamposObrigatorios(
        dadosNotaFiscalInvalida.semCnpj as NFSeEmissaoData
      );
      expect(resultado.valido).toBe(false);
      expect(resultado.erros).toContainEqual(
        expect.objectContaining({
          campo: "tomador.cnpj",
          mensagem: expect.stringContaining("CNPJ"),
        })
      );
    });

    it("deve detectar razão social do tomador ausente", () => {
      const dados = {
        ...dadosNotaFiscalValida,
        tomador: {
          ...dadosNotaFiscalValida.tomador,
          razaoSocial: "",
        },
      };

      const resultado = validarCamposObrigatorios(dados);
      expect(resultado.valido).toBe(false);
      expect(resultado.erros).toContainEqual(
        expect.objectContaining({
          campo: "tomador.razaoSocial",
        })
      );
    });

    it("deve detectar discriminação ausente", () => {
      const dados = {
        ...dadosNotaFiscalValida,
        servico: {
          ...dadosNotaFiscalValida.servico,
          discriminacao: "",
        },
      };

      const resultado = validarCamposObrigatorios(dados);
      expect(resultado.valido).toBe(false);
      expect(resultado.erros).toContainEqual(
        expect.objectContaining({
          campo: "servico.discriminacao",
        })
      );
    });

    it("deve detectar item da lista de serviço ausente", () => {
      const dados = {
        ...dadosNotaFiscalValida,
        servico: {
          ...dadosNotaFiscalValida.servico,
          itemListaServico: "",
        },
      };

      const resultado = validarCamposObrigatorios(dados);
      expect(resultado.valido).toBe(false);
      expect(resultado.erros).toContainEqual(
        expect.objectContaining({
          campo: "servico.itemListaServico",
        })
      );
    });

    it("deve detectar código de tributação municipal ausente", () => {
      const dados = {
        ...dadosNotaFiscalValida,
        servico: {
          ...dadosNotaFiscalValida.servico,
          codigoTributacaoMunicipio: "",
        },
      };

      const resultado = validarCamposObrigatorios(dados);
      expect(resultado.valido).toBe(false);
      expect(resultado.erros).toContainEqual(
        expect.objectContaining({
          campo: "servico.codigoTributacaoMunicipio",
        })
      );
    });

    it("deve detectar inscrição municipal do prestador ausente", () => {
      const dados = {
        ...dadosNotaFiscalValida,
        prestador: {
          ...dadosNotaFiscalValida.prestador,
          inscricaoMunicipal: "",
        },
      };

      const resultado = validarCamposObrigatorios(dados);
      expect(resultado.valido).toBe(false);
      expect(resultado.erros).toContainEqual(
        expect.objectContaining({
          campo: "prestador.inscricaoMunicipal",
        })
      );
    });

    it("deve detectar código do município ausente", () => {
      const dados = {
        ...dadosNotaFiscalValida,
        servico: {
          ...dadosNotaFiscalValida.servico,
          codigoMunicipio: "",
        },
      };

      const resultado = validarCamposObrigatorios(dados);
      expect(resultado.valido).toBe(false);
      expect(resultado.erros).toContainEqual(
        expect.objectContaining({
          campo: "servico.codigoMunicipio",
        })
      );
    });

    it("deve detectar múltiplos campos ausentes", () => {
      const dados = {
        ...dadosNotaFiscalValida,
        tomador: {
          ...dadosNotaFiscalValida.tomador,
          razaoSocial: "",
        },
        servico: {
          ...dadosNotaFiscalValida.servico,
          discriminacao: "",
          itemListaServico: "",
        },
      };

      const resultado = validarCamposObrigatorios(dados);
      expect(resultado.valido).toBe(false);
      expect(resultado.erros.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Valores negativos (devem rejeitar)", () => {
    it("deve rejeitar valor de serviços negativo", () => {
      const resultado = validarValores(
        dadosNotaFiscalInvalida.valorNegativo as NFSeEmissaoData
      );
      expect(resultado.valido).toBe(false);
      expect(resultado.erros).toContainEqual(
        expect.objectContaining({
          campo: "servico.valorServicos",
          mensagem: expect.stringContaining("negativo"),
        })
      );
    });

    it("deve rejeitar valor de deduções negativo", () => {
      const dados = {
        ...dadosNotaFiscalValida,
        servico: {
          ...dadosNotaFiscalValida.servico,
          valorDeducoes: -50,
        },
      };

      const resultado = validarValores(dados);
      expect(resultado.valido).toBe(false);
      expect(resultado.erros).toContainEqual(
        expect.objectContaining({
          campo: "servico.valorDeducoes",
        })
      );
    });

    it("deve rejeitar alíquota negativa", () => {
      const dados = {
        ...dadosNotaFiscalValida,
        servico: {
          ...dadosNotaFiscalValida.servico,
          aliquota: -5,
        },
      };

      const resultado = validarValores(dados);
      expect(resultado.valido).toBe(false);
      expect(resultado.erros).toContainEqual(
        expect.objectContaining({
          campo: "servico.aliquota",
        })
      );
    });

    it("deve rejeitar alíquota maior que 100%", () => {
      const dados = {
        ...dadosNotaFiscalValida,
        servico: {
          ...dadosNotaFiscalValida.servico,
          aliquota: 101,
        },
      };

      const resultado = validarValores(dados);
      expect(resultado.valido).toBe(false);
      expect(resultado.erros).toContainEqual(
        expect.objectContaining({
          campo: "servico.aliquota",
        })
      );
    });

    it("deve rejeitar valor de retenções negativo", () => {
      const dados = {
        ...dadosNotaFiscalValida,
        servico: {
          ...dadosNotaFiscalValida.servico,
          valorPis: -10,
        },
      };

      const resultado = validarValores(dados);
      expect(resultado.valido).toBe(false);
    });

    it("deve aceitar valores zero", () => {
      const dados = {
        ...dadosNotaFiscalValida,
        servico: {
          ...dadosNotaFiscalValida.servico,
          valorDeducoes: 0,
          valorPis: 0,
        },
      };

      const resultado = validarValores(dados);
      expect(resultado.valido).toBe(true);
    });
  });

  describe("Data futura não permitida", () => {
    it("deve rejeitar data de competência futura", () => {
      const resultado = validarDataCompetencia(
        dadosNotaFiscalInvalida.dataFutura as NFSeEmissaoData
      );
      expect(resultado.valido).toBe(false);
      expect(resultado.erros).toContainEqual(
        expect.objectContaining({
          campo: "competencia",
          mensagem: expect.stringContaining("futura"),
        })
      );
    });

    it("deve aceitar data de competência atual", () => {
      const hoje = new Date();
      const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
      const dados = {
        ...dadosNotaFiscalValida,
        competencia: hojeStr,
      };

      const resultado = validarDataCompetencia(dados);
      expect(resultado.valido).toBe(true);
    });

    it("deve aceitar data de competência passada", () => {
      const dados = {
        ...dadosNotaFiscalValida,
        competencia: "2023-01-01",
      };

      const resultado = validarDataCompetencia(dados);
      expect(resultado.valido).toBe(true);
    });

    it("deve rejeitar formato de data inválido", () => {
      const dados = {
        ...dadosNotaFiscalValida,
        competencia: "invalid-date",
      };

      const resultado = validarDataCompetencia(dados as NFSeEmissaoData);
      expect(resultado.valido).toBe(false);
      expect(resultado.erros).toContainEqual(
        expect.objectContaining({
          campo: "competencia",
        })
      );
    });

    it("deve rejeitar data de emissão futura", () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString();

      const dados = {
        ...dadosNotaFiscalValida,
        dataEmissao: dataFutura,
      };

      const resultado = validarDataCompetencia(dados);
      expect(resultado.valido).toBe(false);
    });

    it("deve permitir data de emissão do dia atual", () => {
      const hoje = new Date().toISOString();
      const dados = {
        ...dadosNotaFiscalValida,
        dataEmissao: hoje,
      };

      const resultado = validarDataCompetencia(dados);
      expect(resultado.valido).toBe(true);
    });
  });

  describe("Validação completa", () => {
    it("deve retornar sucesso para dados válidos completos", () => {
      const resultado = validarCamposObrigatorios(dadosNotaFiscalValida);
      expect(resultado.valido).toBe(true);
      expect(resultado.erros).toHaveLength(0);
    });

    it("deve retornar todos os erros encontrados", () => {
      const dadosInvalidos = {
        ...dadosNotaFiscalValida,
        tomador: {
          ...dadosNotaFiscalValida.tomador,
          cnpj: "",
          razaoSocial: "",
        },
        servico: {
          ...dadosNotaFiscalValida.servico,
          valorServicos: -100,
          discriminacao: "",
        },
      } as NFSeEmissaoData;

      const resultado = validarCamposObrigatorios(dadosInvalidos);
      expect(resultado.valido).toBe(false);
      expect(resultado.erros.length).toBeGreaterThanOrEqual(3);
    });

    it("deve incluir mensagens de erro descritivas", () => {
      const resultado = validarCNPJ("12345");
      expect(resultado.valido).toBe(false);
      expect(resultado.erro).toBeTruthy();
      expect(resultado.erro?.length).toBeGreaterThan(5);
    });
  });

  describe("Edge cases", () => {
    it("deve lidar com undefined", () => {
      const resultado = validarCNPJ(undefined as unknown as string);
      expect(resultado.valido).toBe(false);
    });

    it("deve lidar com null", () => {
      const resultado = validarCNPJ(null as unknown as string);
      expect(resultado.valido).toBe(false);
    });

    it("deve lidar com objeto", () => {
      const resultado = validarCNPJ({} as unknown as string);
      expect(resultado.valido).toBe(false);
    });

    it("deve validar código do município (7 dígitos)", () => {
      const resultado = validarCamposObrigatorios({
        ...dadosNotaFiscalValida,
        servico: {
          ...dadosNotaFiscalValida.servico,
          codigoMunicipio: "123", // Código inválido
        },
      });

      expect(resultado.valido).toBe(false);
    });

    it("deve validar item da lista de serviço (formato XX.XX)", () => {
      const resultado = validarCamposObrigatorios({
        ...dadosNotaFiscalValida,
        servico: {
          ...dadosNotaFiscalValida.servico,
          itemListaServico: "invalido",
        },
      });

      expect(resultado.valido).toBe(false);
    });

    it("deve aceitar código CNAE vazio (opcional)", () => {
      const dados = {
        ...dadosNotaFiscalValida,
        servico: {
          ...dadosNotaFiscalValida.servico,
          codigoCnae: "",
        },
      };

      const resultado = validarCamposObrigatorios(dados);
      // CNAE é opcional, então não deve invalidar
      expect(resultado.erros.some((e) => e.campo === "servico.codigoCnae")).toBe(
        false
      );
    });
  });
});
