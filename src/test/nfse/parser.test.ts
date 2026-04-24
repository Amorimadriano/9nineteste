/**
 * Testes de Parser NFS-e
 * Valida parse de respostas da prefeitura (autorização, rejeição, erros)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { NFSeParser } from "@/lib/nfse/parser";
import {
  xmlRespostaAutorizacao,
  xmlRespostaRejeicao,
  xmlRespostaConsulta,
  xmlRespostaCancelamento,
  xmlErroSOAP500,
  xmlErroTimeout,
} from "./fixtures/nfseFixtures";

describe("NFSeParser", () => {
  let parser: NFSeParser;

  beforeEach(() => {
    parser = new NFSeParser();
  });

  describe("Parse de resposta de autorização", () => {
    it("deve parsear resposta de autorização bem-sucedida", () => {
      const resposta = parser.parseRespostaAutorizacao(xmlRespostaAutorizacao);

      expect(resposta.sucesso).toBe(true);
      expect(resposta.numero).toBe("12345");
      expect(resposta.codigoVerificacao).toBe("A1B2C3D4");
    });

    it("deve extrair data de emissão corretamente", () => {
      const resposta = parser.parseRespostaAutorizacao(xmlRespostaAutorizacao);

      expect(resposta.dataEmissao).toBe("2024-01-15T10:00:00");
    });

    it("deve extrair valores numéricos corretamente", () => {
      const resposta = parser.parseRespostaAutorizacao(xmlRespostaAutorizacao);

      expect(resposta.valores).toBeDefined();
      expect(resposta.valores?.valorServicos).toBe(1000.0);
      expect(resposta.valores?.valorDeducoes).toBe(100.0);
      expect(resposta.valores?.valorIss).toBe(50.0);
      expect(resposta.valores?.baseCalculo).toBe(900.0);
      expect(resposta.valores?.aliquota).toBe(5.0);
    });

    it("deve extrair dados do prestador", () => {
      const resposta = parser.parseRespostaAutorizacao(xmlRespostaAutorizacao);

      expect(resposta.prestador).toBeDefined();
      expect(resposta.prestador?.cnpj).toBe("12345678000195");
      expect(resposta.prestador?.inscricaoMunicipal).toBe("123456");
      expect(resposta.prestador?.razaoSocial).toBe("Empresa Teste LTDA");
    });

    it("deve extrair dados do tomador", () => {
      const resposta = parser.parseRespostaAutorizacao(xmlRespostaAutorizacao);

      expect(resposta.tomador).toBeDefined();
      expect(resposta.tomador?.cnpj).toBe("98765432000196");
      expect(resposta.tomador?.razaoSocial).toBe("Tomador Teste LTDA");
    });

    it("deve extrair dados do RPS vinculado", () => {
      const resposta = parser.parseRespostaAutorizacao(xmlRespostaAutorizacao);

      expect(resposta.rps).toBeDefined();
      expect(resposta.rps?.numero).toBe("1");
      expect(resposta.rps?.serie).toBe("1");
      expect(resposta.rps?.tipo).toBe("1");
    });

    it("deve retornar sucesso false quando não há NFSe na resposta", () => {
      const xmlSemNFSe = `<?xml version="1.0" encoding="UTF-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <GerarNfseResponse xmlns="http://www.abrasf.org.br/ABRASF/arquivos/nfse.xsd">
              <GerarNfseResult>
                <ListaNfse></ListaNfse>
              </GerarNfseResult>
            </GerarNfseResponse>
          </soap:Body>
        </soap:Envelope>`;

      const resposta = parser.parseRespostaAutorizacao(xmlSemNFSe);

      expect(resposta.sucesso).toBe(false);
    });

    it("deve formatar valores com decimais corretamente", () => {
      const resposta = parser.parseRespostaAutorizacao(xmlRespostaAutorizacao);

      // Verificar que valores são números, não strings
      expect(typeof resposta.valores?.valorServicos).toBe("number");
      expect(resposta.valores?.valorServicos).toBe(1000.0);
    });
  });

  describe("Parse de resposta de rejeição", () => {
    it("deve parsear resposta de rejeição com múltiplos erros", () => {
      const resposta = parser.parseRespostaAutorizacao(xmlRespostaRejeicao);

      expect(resposta.sucesso).toBe(false);
      expect(resposta.mensagens).toBeDefined();
      expect(resposta.mensagens?.length).toBe(2);
    });

    it("deve extrair códigos de erro corretamente", () => {
      const resposta = parser.parseRespostaAutorizacao(xmlRespostaRejeicao);

      expect(resposta.mensagens?.[0].codigo).toBe("E1");
      expect(resposta.mensagens?.[1].codigo).toBe("E2");
    });

    it("deve extrair mensagens de erro", () => {
      const resposta = parser.parseRespostaAutorizacao(xmlRespostaRejeicao);

      expect(resposta.mensagens?.[0].mensagem).toBe("CNPJ do prestador inválido");
      expect(resposta.mensagens?.[1].mensagem).toBe(
        "Alíquota inválida para o município"
      );
    });

    it("deve extrair sugestões de correção quando disponíveis", () => {
      const resposta = parser.parseRespostaAutorizacao(xmlRespostaRejeicao);

      expect(resposta.mensagens?.[0].correcao).toBe(
        "Verifique o CNPJ informado e tente novamente"
      );
    });

    it("deve retornar sucesso false quando há apenas erros", () => {
      const resposta = parser.parseRespostaAutorizacao(xmlRespostaRejeicao);

      expect(resposta.sucesso).toBe(false);
      expect(resposta.numero).toBeUndefined();
      expect(resposta.codigoVerificacao).toBeUndefined();
    });

    it("deve parsear resposta com erro único", () => {
      const xmlErroUnico = `<?xml version="1.0" encoding="UTF-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <GerarNfseResponse xmlns="http://www.abrasf.org.br/ABRASF/arquivos/nfse.xsd">
              <GerarNfseResult>
                <ListaMensagemRetorno>
                  <MensagemRetorno>
                    <Codigo>E999</Codigo>
                    <Mensagem>Erro genérico</Mensagem>
                  </MensagemRetorno>
                </ListaMensagemRetorno>
              </GerarNfseResult>
            </GerarNfseResponse>
          </soap:Body>
        </soap:Envelope>`;

      const resposta = parser.parseRespostaAutorizacao(xmlErroUnico);

      expect(resposta.sucesso).toBe(false);
      expect(resposta.mensagens?.length).toBe(1);
      expect(resposta.mensagens?.[0].codigo).toBe("E999");
    });
  });

  describe("Parse de erros (códigos e mensagens)", () => {
    it("deve parsear erro SOAP 500", () => {
      const resposta = parser.parseErroSOAP(xmlErroSOAP500);

      expect(resposta.tipo).toBe("SOAP_FAULT");
      expect(resposta.codigo).toBe("500");
      expect(resposta.mensagem).toContain("Serviço temporariamente indisponível");
    });

    it("deve parsear erro de timeout", () => {
      const resposta = parser.parseErroSOAP(xmlErroTimeout);

      expect(resposta.tipo).toBe("SOAP_FAULT");
      expect(resposta.codigo).toBe("408");
      expect(resposta.mensagem).toContain("não respondeu dentro do tempo limite");
    });

    it("deve retornar tipo UNKNOWN para XML mal formatado", () => {
      const xmlInvalido = "not valid xml";

      const resposta = parser.parseErroSOAP(xmlInvalido);

      expect(resposta.tipo).toBe("UNKNOWN");
      expect(resposta.mensagem).toBeDefined();
    });

    it("deve extrair faultcode e faultstring", () => {
      const resposta = parser.parseErroSOAP(xmlErroSOAP500);

      expect(resposta.faultCode).toBe("soap:Server");
      expect(resposta.faultString).toBe("Erro interno no servidor");
    });
  });

  describe("Parse de resposta de consulta", () => {
    it("deve parsear resposta de consulta por RPS", () => {
      const resposta = parser.parseRespostaConsulta(xmlRespostaConsulta);

      expect(resposta.sucesso).toBe(true);
      expect(resposta.numero).toBe("12345");
      expect(resposta.codigoVerificacao).toBe("A1B2C3D4");
    });

    it("deve extrair status da NFSe na consulta", () => {
      const resposta = parser.parseRespostaConsulta(xmlRespostaConsulta);

      expect(resposta.status).toBe("NORMAL");
      expect(resposta.cancelada).toBe(false);
    });

    it("deve detectar NFSe substituída", () => {
      const xmlSubstituida = xmlRespostaConsulta.replace(
        "<NfseSubstituida>0</NfseSubstituida>",
        "<NfseSubstituida>1</NfseSubstituida>"
      );

      const resposta = parser.parseRespostaConsulta(xmlSubstituida);

      expect(resposta.substituida).toBe(true);
    });

    it("deve parsear resposta de NFSe não encontrada", () => {
      const xmlNaoEncontrada = `<?xml version="1.0" encoding="UTF-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <ConsultarNfseRpsResponse xmlns="http://www.abrasf.org.br/ABRASF/arquivos/nfse.xsd">
              <ConsultarNfseRpsResult>
                <ListaMensagemRetorno>
                  <MensagemRetorno>
                    <Codigo>E5</Codigo>
                    <Mensagem>RPS não localizado na base de dados</Mensagem>
                  </MensagemRetorno>
                </ListaMensagemRetorno>
              </ConsultarNfseRpsResult>
            </ConsultarNfseRpsResponse>
          </soap:Body>
        </soap:Envelope>`;

      const resposta = parser.parseRespostaConsulta(xmlNaoEncontrada);

      expect(resposta.sucesso).toBe(false);
      expect(resposta.mensagens?.[0].codigo).toBe("E5");
    });
  });

  describe("Parse de resposta de cancelamento", () => {
    it("deve parsear resposta de cancelamento bem-sucedido", () => {
      const resposta = parser.parseRespostaCancelamento(xmlRespostaCancelamento);

      expect(resposta.sucesso).toBe(true);
      expect(resposta.dataHoraCancelamento).toBe("2024-01-15T14:30:00");
    });

    it("deve extrair inscrição municipal do prestador no cancelamento", () => {
      const resposta = parser.parseRespostaCancelamento(xmlRespostaCancelamento);

      expect(resposta.inscricaoMunicipalPrestador).toBe("123456");
    });

    it("deve parsear resposta de cancelamento com erro", () => {
      const xmlErroCancelamento = `<?xml version="1.0" encoding="UTF-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <CancelarNfseResponse xmlns="http://www.abrasf.org.br/ABRASF/arquivos/nfse.xsd">
              <CancelarNfseResult>
                <ListaMensagemRetorno>
                  <MensagemRetorno>
                    <Codigo>E10</Codigo>
                    <Mensagem>NFS-e já cancelada anteriormente</Mensagem>
                  </MensagemRetorno>
                </ListaMensagemRetorno>
              </CancelarNfseResult>
            </CancelarNfseResponse>
          </soap:Body>
        </soap:Envelope>`;

      const resposta = parser.parseRespostaCancelamento(xmlErroCancelamento);

      expect(resposta.sucesso).toBe(false);
      expect(resposta.mensagens?.[0].codigo).toBe("E10");
    });
  });

  describe("Valores numéricos extraídos corretamente", () => {
    it("deve converter valores de string para number", () => {
      const resposta = parser.parseRespostaAutorizacao(xmlRespostaAutorizacao);

      expect(typeof resposta.valores?.valorServicos).toBe("number");
      expect(typeof resposta.valores?.aliquota).toBe("number");
      expect(typeof resposta.valores?.baseCalculo).toBe("number");
    });

    it("deve manter precisão decimal correta", () => {
      const resposta = parser.parseRespostaAutorizacao(xmlRespostaAutorizacao);

      expect(resposta.valores?.valorPis).toBe(6.5);
      expect(resposta.valores?.valorCofins).toBe(3.0);
    });

    it("deve converter alíquota corretamente", () => {
      const resposta = parser.parseRespostaAutorizacao(xmlRespostaAutorizacao);

      expect(resposta.valores?.aliquota).toBe(5.0);
    });

    it("deve lidar com valores zero", () => {
      const xmlComZero = xmlRespostaAutorizacao.replace(
        /<ValorDeducoes>[\d.]+\u003c\/ValorDeducoes>/,
        "<ValorDeducoes>0</ValorDeducoes>"
      );

      const resposta = parser.parseRespostaAutorizacao(xmlComZero);

      expect(resposta.valores?.valorDeducoes).toBe(0);
    });

    it("deve calcular valor líquido a partir dos componentes", () => {
      const resposta = parser.parseRespostaAutorizacao(xmlRespostaAutorizacao);

      // Valor líquido = baseCalculo - retenções (exceto ISS)
      const expected =
        resposta.valores?.baseCalculo ?? 0 -
        ((resposta.valores?.valorPis ?? 0) +
          (resposta.valores?.valorCofins ?? 0) +
          (resposta.valores?.valorInss ?? 0) +
          (resposta.valores?.valorIr ?? 0) +
          (resposta.valores?.valorCsll ?? 0) +
          (resposta.valores?.valorIssRetido ?? 0));

      expect(resposta.valores?.valorLiquidoNfse).toBeCloseTo(expected, 2);
    });
  });

  describe("Edge cases", () => {
    it("deve lidar com XML vazio", () => {
      expect(() => parser.parseRespostaAutorizacao("")).toThrow();
    });

    it("deve lidar com XML nulo", () => {
      expect(() => parser.parseRespostaAutorizacao(null as unknown as string)).toThrow();
    });

    it("deve lidar com namespaces diferentes", () => {
      const xmlNSDiferente = xmlRespostaAutorizacao.replace(
        'xmlns="http://www.abrasf.org.br/ABRASF/arquivos/nfse.xsd"',
        'xmlns="http://www.prefeitura.sp.gov.br/nfe"'
      );

      const resposta = parser.parseRespostaAutorizacao(xmlNSDiferente);

      // Parser deve tentar extrair dados mesmo com namespace diferente
      expect(resposta).toBeDefined();
    });

    it("deve lidar com valores ausentes", () => {
      const xmlSemValores = xmlRespostaAutorizacao.replace(
        /<ValoresNfse>[\s\S]*?<\/ValoresNfse>/,
        ""
      );

      const resposta = parser.parseRespostaAutorizacao(xmlSemValores);

      expect(resposta.sucesso).toBe(true);
      expect(resposta.valores).toBeUndefined();
    });
  });
});
