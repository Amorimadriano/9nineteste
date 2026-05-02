/**
 * Testes de Parser NFS-e (API Paulistana)
 * Valida parse de respostas da prefeitura (autorização, rejeição, erros)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { NFSeParser } from "@/lib/nfse/parser";
import {
  xmlRespostaAutorizacao,
  xmlRespostaAutorizacaoComNfse,
  xmlRespostaRejeicao,
  xmlRespostaConsulta,
  xmlRespostaConsultaNaoEncontrada,
  xmlRespostaCancelamento,
  xmlErroSOAP500,
  xmlErroTimeout,
} from "./fixtures/nfseFixtures";

describe("NFSeParser (API Paulistana)", () => {
  let parser: NFSeParser;

  beforeEach(() => {
    parser = new NFSeParser();
  });

  describe("Parse de resposta de autorização", () => {
    it("deve parsear resposta de autorização bem-sucedida retornando protocolo", () => {
      const resposta = parser.parseRespostaAutorizacao(xmlRespostaAutorizacao);

      expect(resposta.sucesso).toBe(true);
      expect(resposta.protocolo).toBe("PROT123456789");
    });

    it("deve parsear resposta de consulta de lote com NFSe processada", () => {
      const resposta = parser.parseRespostaAutorizacao(xmlRespostaAutorizacaoComNfse);

      expect(resposta.sucesso).toBe(true);
      expect(resposta.numero).toBe("12345");
      expect(resposta.codigoVerificacao).toBe("A1B2C3D4");
    });

    it("deve extrair data de emissão corretamente", () => {
      const resposta = parser.parseRespostaAutorizacao(xmlRespostaAutorizacaoComNfse);

      expect(resposta.dataEmissao).toBe("2024-01-15T10:00:00");
    });

    it("deve extrair valores numéricos corretamente", () => {
      const resposta = parser.parseRespostaAutorizacao(xmlRespostaAutorizacaoComNfse);

      expect(resposta.valores).toBeDefined();
      expect(resposta.valores?.valorServicos).toBe(1000.0);
      expect(resposta.valores?.valorDeducoes).toBe(100.0);
      expect(resposta.valores?.valorIss).toBe(50.0);
      expect(resposta.valores?.baseCalculo).toBe(900.0);
      expect(resposta.valores?.aliquota).toBe(5.0);
    });

    it("deve formatar valores com decimais corretamente", () => {
      const resposta = parser.parseRespostaAutorizacao(xmlRespostaAutorizacaoComNfse);

      expect(typeof resposta.valores?.valorServicos).toBe("number");
      expect(resposta.valores?.valorServicos).toBe(1000.0);
    });

    it("deve retornar sucesso false quando não há NFSe na resposta", () => {
      const xmlSemNFSe = `<?xml version="1.0" encoding="UTF-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <ns2:EnvioLoteRPSResponse xmlns:ns2="http://www.prefeitura.sp.gov.br/nfe">
              <return><![CDATA[<?xml version="1.0" encoding="UTF-8"?>
<EnvioLoteRPSResposta xmlns="http://www.prefeitura.sp.gov.br/nfe">
  <ListaMensagemRetorno/>
</EnvioLoteRPSResposta>]]></return>
            </ns2:EnvioLoteRPSResponse>
          </soap:Body>
        </soap:Envelope>`;

      const resposta = parser.parseRespostaAutorizacao(xmlSemNFSe);

      expect(resposta.sucesso).toBe(false);
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

      expect(resposta.mensagens?.[0].codigo).toBe("1001");
      expect(resposta.mensagens?.[1].codigo).toBe("1002");
    });

    it("deve extrair mensagens de erro", () => {
      const resposta = parser.parseRespostaAutorizacao(xmlRespostaRejeicao);

      expect(resposta.mensagens?.[0].mensagem).toBe("CNPJ do prestador inválido (Verifique o CNPJ informado e tente novamente)");
      expect(resposta.mensagens?.[1].mensagem).toBe("Alíquota inválida para o município (Informe uma alíquota válida para o código de tributação)");
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
            <ns2:EnvioLoteRPSResponse xmlns:ns2="http://www.prefeitura.sp.gov.br/nfe">
              <return><![CDATA[<?xml version="1.0" encoding="UTF-8"?>
<EnvioLoteRPSResposta xmlns="http://www.prefeitura.sp.gov.br/nfe">
  <ListaMensagemRetorno>
    <MensagemRetorno>
      <Codigo>1999</Codigo>
      <Mensagem>Erro genérico</Mensagem>
    </MensagemRetorno>
  </ListaMensagemRetorno>
</EnvioLoteRPSResposta>]]></return>
            </ns2:EnvioLoteRPSResponse>
          </soap:Body>
        </soap:Envelope>`;

      const resposta = parser.parseRespostaAutorizacao(xmlErroUnico);

      expect(resposta.sucesso).toBe(false);
      expect(resposta.mensagens?.length).toBe(1);
      expect(resposta.mensagens?.[0].codigo).toBe("1999");
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
    });

    it("deve detectar NFSe substituída", () => {
      const xmlSubstituida = xmlRespostaConsulta.replace(
        "<NfseSubstituida>0</NfseSubstituida>",
        "<NfseSubstituida>1</NfseSubstituida>"
      );

      const resposta = parser.parseRespostaConsulta(xmlSubstituida);

      expect(resposta.status).toBe("SUBSTITUIDA");
    });

    it("deve parsear resposta de NFSe não encontrada", () => {
      const resposta = parser.parseRespostaConsulta(xmlRespostaConsultaNaoEncontrada);

      expect(resposta.sucesso).toBe(false);
      expect(resposta.mensagens?.[0].codigo).toBe("1005");
    });
  });

  describe("Parse de resposta de cancelamento", () => {
    it("deve parsear resposta de cancelamento bem-sucedido", () => {
      const resposta = parser.parseRespostaCancelamento(xmlRespostaCancelamento);

      expect(resposta.sucesso).toBe(true);
      expect(resposta.dataHoraCancelamento).toBe("2024-01-15T14:30:00");
    });

    it("deve parsear resposta de cancelamento com erro", () => {
      const xmlErroCancelamento = `<?xml version="1.0" encoding="UTF-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <ns2:CancelamentoNFeResponse xmlns:ns2="http://www.prefeitura.sp.gov.br/nfe">
              <return><![CDATA[<?xml version="1.0" encoding="UTF-8"?>
<CancelamentoNFeResposta xmlns="http://www.prefeitura.sp.gov.br/nfe">
  <ListaMensagemRetorno>
    <MensagemRetorno>
      <Codigo>1010</Codigo>
      <Mensagem>NFS-e já cancelada anteriormente</Mensagem>
    </MensagemRetorno>
  </ListaMensagemRetorno>
</CancelamentoNFeResposta>]]></return>
            </ns2:CancelamentoNFeResponse>
          </soap:Body>
        </soap:Envelope>`;

      const resposta = parser.parseRespostaCancelamento(xmlErroCancelamento);

      expect(resposta.sucesso).toBe(false);
      expect(resposta.mensagens?.[0].codigo).toBe("1010");
    });
  });

  describe("Valores numéricos extraídos corretamente", () => {
    it("deve converter valores de string para number", () => {
      const resposta = parser.parseRespostaAutorizacao(xmlRespostaAutorizacaoComNfse);

      expect(typeof resposta.valores?.valorServicos).toBe("number");
      expect(typeof resposta.valores?.aliquota).toBe("number");
      expect(typeof resposta.valores?.baseCalculo).toBe("number");
    });

    it("deve manter precisão decimal correta", () => {
      const resposta = parser.parseRespostaAutorizacao(xmlRespostaAutorizacaoComNfse);

      expect(resposta.valores?.valorPis).toBe(6.5);
      expect(resposta.valores?.valorCofins).toBe(3.0);
    });

    it("deve converter alíquota corretamente", () => {
      const resposta = parser.parseRespostaAutorizacao(xmlRespostaAutorizacaoComNfse);

      expect(resposta.valores?.aliquota).toBe(5.0);
    });

    it("deve lidar com valores zero", () => {
      const xmlComZero = xmlRespostaAutorizacaoComNfse.replace(
        /<ValorDeducoes>[\d.]+<\/ValorDeducoes>/,
        "<ValorDeducoes>0</ValorDeducoes>"
      );

      const resposta = parser.parseRespostaAutorizacao(xmlComZero);

      expect(resposta.valores?.valorDeducoes).toBe(0);
    });

    it("deve calcular valor líquido a partir dos componentes", () => {
      const resposta = parser.parseRespostaAutorizacao(xmlRespostaAutorizacaoComNfse);

      const expected =
        (resposta.valores?.baseCalculo ?? 0) -
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
      const resposta = parser.parseRespostaAutorizacao("");
      expect(resposta.sucesso).toBe(false);
    });

    it("deve lidar com XML nulo", () => {
      const resposta = parser.parseRespostaAutorizacao(null as unknown as string);
      expect(resposta.sucesso).toBe(false);
    });

    it("deve lidar com namespaces diferentes", () => {
      const xmlNSDiferente = xmlRespostaAutorizacaoComNfse.replace(
        'xmlns="http://www.prefeitura.sp.gov.br/nfe"',
        'xmlns="http://www.example.com/nfe"'
      );

      const resposta = parser.parseRespostaAutorizacao(xmlNSDiferente);

      expect(resposta).toBeDefined();
    });

    it("deve lidar com valores ausentes", () => {
      const xmlSemValores = xmlRespostaAutorizacaoComNfse.replace(
        /<ValoresNfse>[\s\S]*?<\/ValoresNfse>/,
        ""
      );

      const resposta = parser.parseRespostaAutorizacao(xmlSemValores);

      expect(resposta.sucesso).toBe(true);
      expect(resposta.valores).toBeUndefined();
    });
  });
});
