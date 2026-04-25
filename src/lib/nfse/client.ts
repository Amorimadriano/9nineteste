/**
 * Client NFS-e
 * Gerencia comunicação SOAP com a prefeitura
 */

import type {
  NFSeEmissaoData,
  NFSeResposta,
  NFSeConsultaData,
  NFSeCancelamentoData,
  NFSeCancelamentoResposta,
  CertificadoDigital,
} from "../../types/nfse";
import { NFSeXMLBuilder } from "./xmlBuilder";
import { NFSeParser } from "./parser";

interface NFSeClientConfig {
  urlHomologacao: string;
  urlProducao: string;
  ambiente: "homologacao" | "producao";
  versao: string;
  timeoutMs: number;
  retryAttempts: number;
}

export class NFSeClient {
  private config: NFSeClientConfig;
  private builder: NFSeXMLBuilder;
  private parser: NFSeParser;

  constructor(config: NFSeClientConfig) {
    this.config = config;
    this.builder = new NFSeXMLBuilder();
    this.parser = new NFSeParser();
  }

  /**
   * Emite nota fiscal
   * Uses GINFES v03 format: SOAP 1.2, cabecalho in Body as arg0/arg1
   */
  async emitir(
    data: NFSeEmissaoData,
    certificado: CertificadoDigital
  ): Promise<NFSeResposta & { xmlEnvio?: string; xmlRetorno?: string }> {
    // Validações
    if (data.servico.valorServicos <= 0) {
      throw new Error("Valor dos serviços deve ser maior que zero");
    }

    this.validarCertificado(certificado);

    const url =
      this.config.ambiente === "producao"
        ? this.config.urlProducao
        : this.config.urlHomologacao;

    // Build XML with proper GINFES v03 namespace and signing
    const xmlEnvio = this.builder.buildSignedRPS(data, certificado.arquivoPem);

    // GINFES v03 SOAP envelope: cabecalho in Body as arg0, dados as arg1
    const cabecalho = `<cabecalho xmlns="http://www.ginfes.com.br/cabecalho_v03.xsd" versao="3"><versaoDados>3</versaoDados></cabecalho>`;
    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap12:Body>
    <RecepcionarLoteRpsV3 xmlns="http://www.ginfes.com.br/">
      <arg0>${cabecalho}</arg0>
      <arg1><![CDATA[${xmlEnvio}]]></arg1>
    </RecepcionarLoteRpsV3>
  </soap12:Body>
</soap12:Envelope>`;

    return this.executeWithRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/soap+xml; charset=utf-8",
            "SOAPAction": "",
          },
          body: soapEnvelope,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const xmlRetorno = await response.text();

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const resposta = this.parser.parseRespostaAutorizacao(xmlRetorno);

        return {
          ...resposta,
          xmlEnvio,
          xmlRetorno,
        };
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw new Error("timeout");
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    });
  }

  /**
   * Consulta nota fiscal (GINFES v03 format)
   */
  async consultar(data: NFSeConsultaData): Promise<NFSeResposta> {
    const url =
      this.config.ambiente === "producao"
        ? this.config.urlProducao
        : this.config.urlHomologacao;

    const xmlConsulta = this.buildConsultaXML(data);
    const cabecalho = `<cabecalho xmlns="http://www.ginfes.com.br/cabecalho_v03.xsd" versao="3"><versaoDados>3</versaoDados></cabecalho>`;
    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap12:Body>
    <ConsultarNfseRpsV3 xmlns="http://www.ginfes.com.br/">
      <arg0>${cabecalho}</arg0>
      <arg1><![CDATA[${xmlConsulta}]]></arg1>
    </ConsultarNfseRpsV3>
  </soap12:Body>
</soap12:Envelope>`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/soap+xml; charset=utf-8",
          "SOAPAction": "",
        },
        body: soapEnvelope,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const xmlRetorno = await response.text();
      return this.parser.parseRespostaConsulta(xmlRetorno);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("timeout");
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Cancela nota fiscal (GINFES v03 format)
   */
  async cancelar(
    data: NFSeCancelamentoData,
    certificado: CertificadoDigital
  ): Promise<NFSeCancelamentoResposta> {
    this.validarCertificado(certificado);

    const url =
      this.config.ambiente === "producao"
        ? this.config.urlProducao
        : this.config.urlHomologacao;

    const xmlCancelamento = this.buildCancelamentoXML(data, certificado.arquivoPem);
    const cabecalho = `<cabecalho xmlns="http://www.ginfes.com.br/cabecalho_v03.xsd" versao="3"><versaoDados>3</versaoDados></cabecalho>`;
    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap12:Body>
    <CancelarNfseV3 xmlns="http://www.ginfes.com.br/">
      <arg0>${cabecalho}</arg0>
      <arg1><![CDATA[${xmlCancelamento}]]></arg1>
    </CancelarNfseV3>
  </soap12:Body>
</soap12:Envelope>`;

    return this.executeWithRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/soap+xml; charset=utf-8",
            "SOAPAction": "",
          },
          body: soapEnvelope,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const xmlRetorno = await response.text();
        return this.parser.parseRespostaCancelamento(xmlRetorno);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw new Error("timeout");
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    });
  }

  /**
   * Executa função com retry
   */
  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Não fazer retry em erros de rede ou timeout (não vão melhorar)
        if (lastError.name === "AbortError" || lastError.message === "timeout" ||
            lastError instanceof TypeError) {
          throw lastError;
        }

        // Não fazer retry em erros 4xx
        if (lastError.message.includes("400") || lastError.message.includes("401") || lastError.message.includes("403") || lastError.message.includes("404")) {
          throw lastError;
        }

        // Esperar antes de tentar novamente (exponential backoff)
        if (attempt < this.config.retryAttempts - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`máximo de tentativas atingido: ${lastError?.message}`);
  }

  /**
   * Valida certificado digital
   */
  private validarCertificado(certificado: CertificadoDigital): void {
    if (!certificado.ativo) {
      throw new Error("Certificado digital está inativo");
    }

    const validadeFim = new Date(certificado.validadeFim);
    const agora = new Date();

    if (validadeFim < agora) {
      throw new Error("Certificado digital expirado");
    }
  }

  /**
   * Constrói XML de consulta (GINFES v03 namespace)
   */
  private buildConsultaXML(data: NFSeConsultaData): string {
    // Consulta por tomador/período (different from RPS-based consulta)
    if (data.cnpjTomador || data.cpfTomador) {
      return `<?xml version="1.0" encoding="UTF-8"?>
<ConsultarNfseServicoPrestadoEnvio xmlns="http://www.ginfes.com.br/servico_consultar_nfse_servico_prestado_envio_v03.xsd">
  <Prestador>
    ${data.cnpjPrestador ? `<Cnpj>${data.cnpjPrestador.replace(/\D/g, "")}</Cnpj>` : ""}
    ${data.inscricaoMunicipalPrestador ? `<InscricaoMunicipal>${data.inscricaoMunicipalPrestador}</InscricaoMunicipal>` : ""}
  </Prestador>
  <Tomador>
    <CpfCnpj>
      ${data.cnpjTomador ? `<Cnpj>${data.cnpjTomador.replace(/\D/g, "")}</Cnpj>` : ""}
      ${data.cpfTomador ? `<Cpf>${data.cpfTomador.replace(/\D/g, "")}</Cpf>` : ""}
    </CpfCnpj>
  </Tomador>
  ${data.dataInicio ? `<Periodo><DataInicial>${data.dataInicio}</DataInicial><DataFinal>${data.dataFim || data.dataInicio}</DataFinal></Periodo>` : ""}
</ConsultarNfseServicoPrestadoEnvio>`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<ConsultarNfseRpsEnvio xmlns="http://www.ginfes.com.br/servico_consultar_nfse_rps_envio_v03.xsd">
  <IdentificacaoRps>
    ${data.numero ? `<Numero>${data.numero}</Numero>` : ""}
    ${data.serie ? `<Serie>${data.serie}</Serie>` : ""}
    ${data.tipo ? `<Tipo>${data.tipo}</Tipo>` : ""}
  </IdentificacaoRps>
  <Prestador>
    ${data.cnpjPrestador ? `<Cnpj>${data.cnpjPrestador.replace(/\D/g, "")}</Cnpj>` : ""}
    ${data.inscricaoMunicipalPrestador ? `<InscricaoMunicipal>${data.inscricaoMunicipalPrestador}</InscricaoMunicipal>` : ""}
  </Prestador>
</ConsultarNfseRpsEnvio>`;
  }

  /**
   * Constrói XML de cancelamento (GINFES v03 namespace)
   */
  private buildCancelamentoXML(data: NFSeCancelamentoData, _certificadoPem: string): string {
    const pedidoId = `CANC${data.numero}`;
    return `<?xml version="1.0" encoding="UTF-8"?>
<CancelarNfseEnvio xmlns="http://www.ginfes.com.br/servico_cancelar_nfse_envio_v03.xsd">
  <Pedido Id="${pedidoId}">
    <InfPedidoCancelamento>
      <IdentificacaoNfse>
        <Numero>${data.numero}</Numero>
        <Cnpj>${data.cnpjPrestador.replace(/\D/g, "")}</Cnpj>
        <InscricaoMunicipal>${data.inscricaoMunicipalPrestador}</InscricaoMunicipal>
        <CodigoMunicipio>${data.codigoMunicipio}</CodigoMunicipio>
      </IdentificacaoNfse>
      <CodigoCancelamento>${data.codigoCancelamento}</CodigoCancelamento>
      ${data.motivoCancelamento ? `<MotivoCancelamento>${data.motivoCancelamento}</MotivoCancelamento>` : ""}
    </InfPedidoCancelamento>
  </Pedido>
</CancelarNfseEnvio>`;
  }
}
