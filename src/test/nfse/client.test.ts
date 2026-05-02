/**
 * Testes de Client NFS-e (GINFES v03)
 * Valida chamadas SOAP 1.2, emissão, consulta, cancelamento e tratamento de erros
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NFSeClient } from "@/lib/nfse/client";
import {
  xmlRespostaAutorizacao,
  xmlRespostaAutorizacaoComNfse,
  xmlRespostaConsulta,
  xmlRespostaConsultaNaoEncontrada,
  xmlRespostaCancelamento,
  xmlErroSOAP500,
  xmlErroTimeout,
  xmlRespostaRejeicao,
  dadosNotaFiscalValida,
  certificadoDigitalMock,
  configuracaoAmbienteTeste,
} from "./fixtures/nfseFixtures";
import type {
  NFSeEmissaoData,
  NFSeCancelamentoData,
} from "@/types/nfse";

describe("NFSeClient (GINFES v03)", () => {
  let client: NFSeClient;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    client = new NFSeClient(configuracaoAmbienteTeste);
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Mock SOAP responses", () => {
    it("deve fazer requisição SOAP com headers corretos", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(xmlRespostaAutorizacao),
      } as unknown as Response);

      await client.emitir(dadosNotaFiscalValida, certificadoDigitalMock);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "text/xml; charset=utf-8",
          }),
        })
      );
    });

    it("deve incluir envelope SOAP 1.2 GINFES v03 na requisição", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(xmlRespostaAutorizacao),
      } as unknown as Response);

      await client.emitir(dadosNotaFiscalValida, certificadoDigitalMock);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = callArgs[1].body as string;

      expect(requestBody).toContain("soap:Envelope");
      expect(requestBody).toContain("RecepcionarLoteRpsV3");
      expect(requestBody).toContain("cabecalho");
      expect(requestBody).toContain("versaoDados");
    });

    it("deve enviar XML com namespace GINFES v03", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(xmlRespostaAutorizacao),
      } as unknown as Response);

      await client.emitir(dadosNotaFiscalValida, certificadoDigitalMock);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = callArgs[1].body as string;

      expect(requestBody).toContain("ginfes.com.br");
    });

    it("deve fazer requisição para URL correta de homologação", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(xmlRespostaAutorizacao),
      } as unknown as Response);

      await client.emitir(dadosNotaFiscalValida, certificadoDigitalMock);

      expect(mockFetch).toHaveBeenCalledWith(
        configuracaoAmbienteTeste.urlHomologacao,
        expect.any(Object)
      );
    });
  });

  describe("Teste de emissão síncrona", () => {
    it("deve emitir lote RPS com sucesso e retornar protocolo", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(xmlRespostaAutorizacao),
      } as unknown as Response);

      const resposta = await client.emitir(
        dadosNotaFiscalValida,
        certificadoDigitalMock
      );

      expect(resposta.sucesso).toBe(true);
      expect(resposta.protocolo).toBe("PROT123456789");
    });

    it("deve retornar xmlEnvio e xmlRetorno", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(xmlRespostaAutorizacao),
      } as unknown as Response);

      const resposta = await client.emitir(
        dadosNotaFiscalValida,
        certificadoDigitalMock
      );

      expect(resposta.xmlEnvio).toBeDefined();
      expect(resposta.xmlRetorno).toBeDefined();
    });

    it("deve retornar erro quando lote é rejeitado", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(xmlRespostaRejeicao),
      } as unknown as Response);

      const resposta = await client.emitir(
        dadosNotaFiscalValida,
        certificadoDigitalMock
      );

      expect(resposta.sucesso).toBe(false);
      expect(resposta.mensagens).toBeDefined();
      expect(resposta.mensagens?.length).toBeGreaterThan(0);
    });

    it("deve validar dados antes de enviar", async () => {
      const dadosInvalidos: NFSeEmissaoData = {
        ...dadosNotaFiscalValida,
        servico: {
          ...dadosNotaFiscalValida.servico,
          valorServicos: 0,
        },
      };

      await expect(
        client.emitir(dadosInvalidos, certificadoDigitalMock)
      ).rejects.toThrow("Valor dos serviços deve ser maior que zero");

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("Teste de consulta", () => {
    it("deve consultar NFSe por número e série", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(xmlRespostaConsulta),
      } as unknown as Response);

      const resposta = await client.consultar({
        numero: "12345",
        serie: "1",
        tipo: "1",
      });

      expect(resposta.sucesso).toBe(true);
      expect(resposta.numero).toBe("12345");
      expect(resposta.codigoVerificacao).toBe("A1B2C3D4");
    });

    it("deve consultar NFSe por CNPJ do tomador e período", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(xmlRespostaConsulta),
      } as unknown as Response);

      const resposta = await client.consultar({
        cnpjTomador: "98765432000196",
        dataInicio: "2024-01-01",
        dataFim: "2024-01-31",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining("98765432000196"),
        })
      );

      expect(resposta.sucesso).toBe(true);
    });

    it("deve usar action ConsultarNfseServicoPrestadoV3 quando há tomador", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(xmlRespostaConsulta),
      } as unknown as Response);

      await client.consultar({
        cnpjTomador: "98765432000196",
        dataInicio: "2024-01-01",
      });

      const callArgs = mockFetch.mock.calls[0];
      const body = callArgs[1].body as string;
      expect(body).toContain("ConsultarNfseServicoPrestadoV3");
    });

    it("deve retornar erro quando NFSe não é encontrada", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(xmlRespostaConsultaNaoEncontrada),
      } as unknown as Response);

      const resposta = await client.consultar({
        numero: "99999",
        serie: "1",
      });

      expect(resposta.sucesso).toBe(false);
      expect(resposta.mensagens?.[0].codigo).toBe("E5");
    });
  });

  describe("Teste de cancelamento", () => {
    it("deve cancelar NFSe com sucesso", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(xmlRespostaCancelamento),
      } as unknown as Response);

      const dadosCancelamento: NFSeCancelamentoData = {
        numero: "12345",
        cnpjPrestador: "12345678000195",
        inscricaoMunicipalPrestador: "123456",
        codigoMunicipio: "3550308",
        codigoCancelamento: "1",
        motivoCancelamento: "Erro na emissão",
      };

      const resposta = await client.cancelar(
        dadosCancelamento,
        certificadoDigitalMock
      );

      expect(resposta.sucesso).toBe(true);
      expect(resposta.dataHoraCancelamento).toBe("2024-01-15T14:30:00");
    });

    it("deve retornar erro quando cancelamento é rejeitado", async () => {
      const xmlErroCancelamento = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ns2:CancelarNfseV3Response xmlns:ns2="http://www.ginfes.com.br/">
      <return><![CDATA[<?xml version="1.0" encoding="UTF-8"?>
<CancelarNfseResposta xmlns="http://www.ginfes.com.br/servico_cancelar_nfse_resposta_v03.xsd">
  <ListaMensagemRetorno>
    <MensagemRetorno>
      <Codigo>E10</Codigo>
      <Mensagem>NFS-e não pode ser cancelada</Mensagem>
    </MensagemRetorno>
  </ListaMensagemRetorno>
</CancelarNfseResposta>]]></return>
    </ns2:CancelarNfseV3Response>
  </soap:Body>
</soap:Envelope>`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(xmlErroCancelamento),
      } as unknown as Response);

      const dadosCancelamento: NFSeCancelamentoData = {
        numero: "12345",
        cnpjPrestador: "12345678000195",
        inscricaoMunicipalPrestador: "123456",
        codigoMunicipio: "3550308",
        codigoCancelamento: "1",
        motivoCancelamento: "Erro na emissão",
      };

      const resposta = await client.cancelar(
        dadosCancelamento,
        certificadoDigitalMock
      );

      expect(resposta.sucesso).toBe(false);
      expect(resposta.mensagens?.[0].codigo).toBe("E10");
    });

    it("deve incluir motivo do cancelamento no XML", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(xmlRespostaCancelamento),
      } as unknown as Response);

      const dadosCancelamento: NFSeCancelamentoData = {
        numero: "12345",
        cnpjPrestador: "12345678000195",
        inscricaoMunicipalPrestador: "123456",
        codigoMunicipio: "3550308",
        codigoCancelamento: "1",
        motivoCancelamento: "Serviço não prestado",
      };

      await client.cancelar(dadosCancelamento, certificadoDigitalMock);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = callArgs[1].body as string;

      expect(requestBody).toContain("Serviço não prestado");
    });
  });

  describe("Tratamento de timeout", () => {
    it("deve lançar erro em caso de timeout", async () => {
      mockFetch.mockRejectedValueOnce(new Error("timeout"));

      await expect(
        client.emitir(dadosNotaFiscalValida, certificadoDigitalMock)
      ).rejects.toThrow(/timeout|tempo/i);
    });

    it("deve usar timeout configurado na requisição", async () => {
      const clientComTimeout = new NFSeClient({
        ...configuracaoAmbienteTeste,
        timeoutMs: 5000,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(xmlRespostaAutorizacao),
      } as unknown as Response);

      await clientComTimeout.emitir(dadosNotaFiscalValida, certificadoDigitalMock);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });

    it("deve abortar requisição após timeout", async () => {
      mockFetch.mockImplementationOnce(
        (_url: string, options: RequestInit) =>
          new Promise((_, reject) => {
            const signal = options.signal as AbortSignal;
            if (signal) {
              signal.addEventListener("abort", () => {
                reject(new DOMException("The operation was aborted", "AbortError"));
              });
            }
          })
      );

      const clientComTimeout = new NFSeClient({
        ...configuracaoAmbienteTeste,
        timeoutMs: 1,
      });

      await expect(
        clientComTimeout.emitir(dadosNotaFiscalValida, certificadoDigitalMock)
      ).rejects.toThrow();
    });
  });

  describe("Retry em erro 500", () => {
    it("deve tentar novamente em caso de erro 500", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: vi.fn().mockResolvedValue(xmlErroSOAP500),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: vi.fn().mockResolvedValue(xmlRespostaAutorizacao),
        } as unknown as Response);

      const resposta = await client.emitir(
        dadosNotaFiscalValida,
        certificadoDigitalMock
      );

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(resposta.sucesso).toBe(true);
    });

    it("deve respeitar limite de tentativas", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue(xmlErroSOAP500),
      } as unknown as Response);

      await expect(
        client.emitir(dadosNotaFiscalValida, certificadoDigitalMock)
      ).rejects.toThrow(/máximo de tentativas|max retries/i);

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("deve não tentar novamente em erro 4xx", async () => {
      const xmlErro400 = `<?xml version="1.0"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <soap:Fault>
              <faultcode>soap:Client</faultcode>
              <faultstring>Requisição inválida</faultstring>
            </soap:Fault>
          </soap:Body>
        </soap:Envelope>`;

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValue(xmlErro400),
      } as unknown as Response);

      await expect(
        client.emitir(dadosNotaFiscalValida, certificadoDigitalMock)
      ).rejects.toThrow();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("deve aumentar delay entre tentativas", async () => {
      const retryDelays: number[] = [];
      const originalSetTimeout = global.setTimeout;

      vi.spyOn(global, "setTimeout").mockImplementation((callback, delay) => {
        if (typeof delay === "number" && delay < 30000) {
          retryDelays.push(delay);
        }
        return originalSetTimeout(callback as TimerHandler, 0);
      });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue(xmlErroSOAP500),
      } as unknown as Response);

      try {
        await client.emitir(dadosNotaFiscalValida, certificadoDigitalMock);
      } catch {
        // esperado
      }

      expect(retryDelays.length).toBeGreaterThan(1);
      expect(retryDelays[1]).toBeGreaterThanOrEqual(retryDelays[0]);
    });
  });

  describe("Configuração de ambiente", () => {
    it("deve usar URL de produção quando ambiente é producao", async () => {
      const clientProducao = new NFSeClient({
        ...configuracaoAmbienteTeste,
        ambiente: "producao",
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(xmlRespostaAutorizacao),
      } as unknown as Response);

      await clientProducao.emitir(dadosNotaFiscalValida, certificadoDigitalMock);

      expect(mockFetch).toHaveBeenCalledWith(
        configuracaoAmbienteTeste.urlProducao,
        expect.any(Object)
      );
    });

    it("deve validar certificado antes de usar", async () => {
      const certificadoInvalido = {
        ...certificadoDigitalMock,
        validadeFim: "2020-01-01T00:00:00",
      };

      await expect(
        client.emitir(dadosNotaFiscalValida, certificadoInvalido)
      ).rejects.toThrow(/certificado|expirado/i);
    });
  });

  describe("Edge cases", () => {
    it("deve lidar com resposta vazia", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(""),
      } as unknown as Response);

      await expect(
        client.emitir(dadosNotaFiscalValida, certificadoDigitalMock)
      ).rejects.toThrow();
    });

    it("deve lidar com erro de rede", async () => {
      mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

      await expect(
        client.emitir(dadosNotaFiscalValida, certificadoDigitalMock)
      ).rejects.toThrow(/rede|network|fetch/i);
    });

    it("deve salvar XML de envio e retorno", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(xmlRespostaAutorizacao),
      } as unknown as Response);

      const resposta = await client.emitir(
        dadosNotaFiscalValida,
        certificadoDigitalMock
      );

      expect(resposta.xmlEnvio).toBeDefined();
      expect(resposta.xmlRetorno).toBeDefined();
    });
  });
});
