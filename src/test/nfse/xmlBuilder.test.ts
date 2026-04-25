/**
 * Testes de XML Builder NFS-e
 * Valida construção de RPS e XML conforme padrão ABRASF
 */

import { describe, it, expect, beforeEach } from "vitest";
import { NFSeXMLBuilder } from "@/lib/nfse/xmlBuilder";
import {
  dadosNotaFiscalValida,
  dadosNotaFiscalCPF,
} from "./fixtures/nfseFixtures";
import type { NFSeEmissaoData } from "@/types/nfse";

describe("NFSeXMLBuilder", () => {
  let builder: NFSeXMLBuilder;

  beforeEach(() => {
    builder = new NFSeXMLBuilder();
  });

  describe("Construção de RPS válido", () => {
    it("deve construir XML válido para nota fiscal completa", () => {
      const xml = builder.buildRPS(dadosNotaFiscalValida);

      expect(xml).toContain('<?xml version="1.0"');
      expect(xml).toContain("EnviarLoteRpsEnvio");
      expect(xml).toContain(dadosNotaFiscalValida.prestador.cnpj);
      expect(xml).toContain(dadosNotaFiscalValida.tomador.cnpj);
    });

    it("deve incluir todos os campos obrigatórios do prestador", () => {
      const xml = builder.buildRPS(dadosNotaFiscalValida);

      expect(xml).toContain("<Cnpj>");
      expect(xml).toContain("<InscricaoMunicipal>");
      expect(xml).toContain("<RazaoSocial>");
      expect(xml).toContain("<Endereco>");
    });

    it("deve incluir todos os campos obrigatórios do tomador", () => {
      const xml = builder.buildRPS(dadosNotaFiscalValida);

      expect(xml).toContain("<Tomador>");
      expect(xml).toContain(dadosNotaFiscalValida.tomador.razaoSocial);
      expect(xml).toContain("IdentificacaoTomador");
    });

    it("deve incluir todos os campos de serviço", () => {
      const xml = builder.buildRPS(dadosNotaFiscalValida);

      expect(xml).toContain("<Servico>");
      expect(xml).toContain("<Valores>");
      expect(xml).toContain("<ItemListaServico>");
      expect(xml).toContain("<CodigoTributacaoMunicipio>");
      expect(xml).toContain("<Discriminacao>");
    });

    it("deve construir XML para tomador CPF", () => {
      const xml = builder.buildRPS(dadosNotaFiscalCPF);

      expect(xml).toContain("<Cpf>");
      expect(xml).toContain(dadosNotaFiscalCPF.tomador.cpf);
      expect(xml).not.toContain("<Cnpj>" + dadosNotaFiscalCPF.tomador.cpf);
    });

    it("deve gerar XML com estrutura GINFES v03 válida", () => {
      const xml = builder.buildRPS(dadosNotaFiscalValida);

      // Verificar estrutura básica GINFES v03
      expect(xml).toContain("ginfes.com.br");
      expect(xml).toContain("<Rps>");
      expect(xml).toContain("<InfRps");
      expect(xml).toContain("IdentificacaoTomador");
    });
  });

  describe("Validação de campos obrigatórios ABRASF", () => {
    it("deve lançar erro quando CNPJ do prestador está ausente", () => {
      const dadosInvalidos = {
        ...dadosNotaFiscalValida,
        prestador: {
          ...dadosNotaFiscalValida.prestador,
          cnpj: "",
        },
      };

      expect(() => builder.buildRPS(dadosInvalidos as NFSeEmissaoData)).toThrow(
        "CNPJ do prestador é obrigatório"
      );
    });

    it("deve lançar erro quando CNPJ/CPF do tomador está ausente", () => {
      const dadosInvalidos = {
        ...dadosNotaFiscalValida,
        tomador: {
          ...dadosNotaFiscalValida.tomador,
          cnpj: undefined,
          cpf: undefined,
        },
      };

      expect(() => builder.buildRPS(dadosInvalidos as NFSeEmissaoData)).toThrow(
        "CNPJ ou CPF do tomador é obrigatório"
      );
    });

    it("deve lançar erro quando valor dos serviços é zero", () => {
      const dadosInvalidos = {
        ...dadosNotaFiscalValida,
        servico: {
          ...dadosNotaFiscalValida.servico,
          valorServicos: 0,
        },
      };

      expect(() => builder.buildRPS(dadosInvalidos)).toThrow(
        "Valor dos serviços deve ser maior que zero"
      );
    });

    it("deve lançar erro quando item da lista de serviço está ausente", () => {
      const dadosInvalidos = {
        ...dadosNotaFiscalValida,
        servico: {
          ...dadosNotaFiscalValida.servico,
          itemListaServico: "",
        },
      };

      expect(() => builder.buildRPS(dadosInvalidos)).toThrow(
        "Item da lista de serviço é obrigatório"
      );
    });

    it("deve lançar erro quando discriminação está vazia", () => {
      const dadosInvalidos = {
        ...dadosNotaFiscalValida,
        servico: {
          ...dadosNotaFiscalValida.servico,
          discriminacao: "",
        },
      };

      expect(() => builder.buildRPS(dadosInvalidos)).toThrow(
        "Discriminação do serviço é obrigatória"
      );
    });

    it("deve lançar erro quando inscrição municipal do prestador está ausente", () => {
      const dadosInvalidos = {
        ...dadosNotaFiscalValida,
        prestador: {
          ...dadosNotaFiscalValida.prestador,
          inscricaoMunicipal: "",
        },
      };

      expect(() => builder.buildRPS(dadosInvalidos)).toThrow(
        "Inscrição municipal do prestador é obrigatória"
      );
    });
  });

  describe("Formatação correta de valores (2 decimais)", () => {
    it("deve formatar valor dos serviços com 2 decimais", () => {
      const dados = {
        ...dadosNotaFiscalValida,
        servico: {
          ...dadosNotaFiscalValida.servico,
          valorServicos: 1000.5,
        },
      };

      const xml = builder.buildRPS(dados);
      expect(xml).toContain("<ValorServicos>1000.50</ValorServicos>");
    });

    it("deve formatar valor das deduções com 2 decimais", () => {
      const dados = {
        ...dadosNotaFiscalValida,
        servico: {
          ...dadosNotaFiscalValida.servico,
          valorDeducoes: 100.999,
        },
      };

      const xml = builder.buildRPS(dados);
      expect(xml).toContain("<ValorDeducoes>101.00</ValorDeducoes>");
    });

    it("deve formatar alíquota com 4 decimais", () => {
      const dados = {
        ...dadosNotaFiscalValida,
        servico: {
          ...dadosNotaFiscalValida.servico,
          aliquota: 5.1234,
        },
      };

      const xml = builder.buildRPS(dados);
      expect(xml).toContain("<Aliquota>5.1234</Aliquota>");
    });

    it("deve formatar valores de retenções com 2 decimais", () => {
      const dados = {
        ...dadosNotaFiscalValida,
        servico: {
          ...dadosNotaFiscalValida.servico,
          valorPis: 6.555,
          valorCofins: 3.333,
        },
      };

      const xml = builder.buildRPS(dados);
      expect(xml).toContain("<ValorPis>6.55</ValorPis>");
      expect(xml).toContain("<ValorCofins>3.33</ValorCofins>");
    });

    it("deve formatar valor líquido com 2 decimais", () => {
      const xml = builder.buildRPS(dadosNotaFiscalValida);
      expect(xml).toContain("<ValorLiquidoNfse>877.00</ValorLiquidoNfse>");
    });
  });

  describe("Encoding UTF-8", () => {
    it("deve gerar XML com declaração UTF-8", () => {
      const xml = builder.buildRPS(dadosNotaFiscalValida);
      expect(xml).toContain('encoding="UTF-8"');
    });

    it("deve preservar caracteres especiais corretamente", () => {
      const dadosComAcentos = {
        ...dadosNotaFiscalValida,
        servico: {
          ...dadosNotaFiscalValida.servico,
          discriminacao: "Serviço de consultoria técnica com ênfase em área",
        },
      };

      const xml = builder.buildRPS(dadosComAcentos);
      expect(xml).toContain("Serviço de consultoria técnica com ênfase em área");
    });

    it("deve escapar caracteres XML especiais", () => {
      const dadosComEspeciais = {
        ...dadosNotaFiscalValida,
        servico: {
          ...dadosNotaFiscalValida.servico,
          discriminacao: "Serviços <de> & > software",
        },
      };

      const xml = builder.buildRPS(dadosComEspeciais);
      expect(xml).toContain("Serviços &lt;de&gt; &amp; &gt; software");
    });
  });

  describe("Assinatura digital", () => {
    it("deve gerar XML de RPS com Ids para assinatura", () => {
      const certificadoPem = "-----BEGIN CERTIFICATE-----\nMIIDXT...";
      const xml = builder.buildSignedRPS(dadosNotaFiscalValida, certificadoPem);

      // buildSignedRPS now delegates to buildRPS (signing is done by backend)
      expect(xml).toContain("InfRps");
      expect(xml).toContain('Id="');
      expect(xml).toContain("LoteRps");
    });

    it("deve incluir IDs para referência de assinatura", () => {
      const certificadoPem = "-----BEGIN CERTIFICATE-----\nMIIDXT...\n-----END CERTIFICATE-----";
      const xml = builder.buildSignedRPS(dadosNotaFiscalValida, certificadoPem);

      expect(xml).toMatch(/Id="R\d+"/);
      expect(xml).toMatch(/Id="LOTE\d+"/);
    });
  });

  describe("Build lote de RPS", () => {
    it("deve construir XML de lote com múltiplos RPS", () => {
      const dados2 = {
        ...dadosNotaFiscalValida,
        numero: 2,
        servico: {
          ...dadosNotaFiscalValida.servico,
          discriminacao: "Serviço 2",
        },
      };

      const xml = builder.buildLote([dadosNotaFiscalValida, dados2]);

      expect(xml).toContain("<EnviarLoteRpsEnvio");
      expect(xml).toContain("<LoteRps>");
      expect(xml).toContain("<QuantidadeRps>2</QuantidadeRps>");
    });

    it("deve lançar erro quando lote está vazio", () => {
      expect(() => builder.buildLote([])).toThrow(
        "Lote deve conter pelo menos um RPS"
      );
    });
  });

  describe("Serialização XML", () => {
    it("deve produzir XML bem formatado", () => {
      const xml = builder.buildRPS(dadosNotaFiscalValida);

      // Verificar que o XML é válido
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, "text/xml");
      const parseError = doc.querySelector("parsererror");

      expect(parseError).toBeNull();
    });

    it("deve gerar XML consistente para mesmos dados (desconsiderando IDs dinâmicos)", () => {
      const xml1 = builder.buildRPS(dadosNotaFiscalValida);
      const xml2 = builder.buildRPS(dadosNotaFiscalValida);

      // Remove os IDs dinâmicos (LOTE e RPS) antes de comparar
      const stripDynamicIds = (xml: string) => xml.replace(/Id="LOTE\d+"/g, 'Id="LOTE_DYN"').replace(/Id="R\d+"/g, 'Id="R_DYN"');
      expect(stripDynamicIds(xml1)).toBe(stripDynamicIds(xml2));
    });
  });
});
