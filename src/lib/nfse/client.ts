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

    const xmlEnvio = this.builder.buildSignedRPS(data, certificado.arquivoPem);

    return this.executeWithRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "text/xml; charset=utf-8",
            SOAPAction: "http://www.abrasf.org.br/ABRASF/arquivos/nfse.xsd/GerarNfse",
          },
          body: xmlEnvio,
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
   * Consulta nota fiscal
   */
  async consultar(data: NFSeConsultaData): Promise<NFSeResposta> {
    const url =
      this.config.ambiente === "producao"
        ? this.config.urlProducao
        : this.config.urlHomologacao;

    const xmlConsulta = this.buildConsultaXML(data);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction:
            "http://www.abrasf.org.br/ABRASF/arquivos/nfse.xsd/ConsultarNfseRps",
        },
        body: xmlConsulta,
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
   * Cancela nota fiscal
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

    return this.executeWithRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "text/xml; charset=utf-8",
            SOAPAction:
              "http://www.abrasf.org.br/ABRASF/arquivos/nfse.xsd/CancelarNfse",
          },
          body: xmlCancelamento,
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
   * Constrói XML de consulta
   */
  private buildConsultaXML(data: NFSeConsultaData): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<ConsultarNfseRpsEnvio xmlns="http://www.abrasf.org.br/ABRASF/arquivos/nfse.xsd">
  <IdentificacaoRps>
    ${data.numero ? `<Numero>${data.numero}</Numero>` : ""}
    ${data.serie ? `<Serie>${data.serie}</Serie>` : ""}
    ${data.tipo ? `<Tipo>${data.tipo}</Tipo>` : ""}
  </IdentificacaoRps>
  <Prestador>
    ${data.cnpjPrestador ? `<Cnpj>${data.cnpjPrestador}</Cnpj>` : ""}
    ${data.inscricaoMunicipalPrestador ? `<InscricaoMunicipal>${data.inscricaoMunicipalPrestador}</InscricaoMunicipal>` : ""}
  </Prestador>
  ${data.dataInicio ? `<DataInicio>${data.dataInicio}</DataInicio>` : ""}
  ${data.dataFim ? `<DataFim>${data.dataFim}</DataFim>` : ""}
  ${data.pagina ? `<Pagina>${data.pagina}</Pagina>` : ""}
</ConsultarNfseRpsEnvio>`;
  }

  /**
   * Constrói XML de cancelamento
   */
  private buildCancelamentoXML(data: NFSeCancelamentoData, certificadoPem: string): string {
    const certificadoClean = certificadoPem
      .replace("-----BEGIN CERTIFICATE-----", "")
      .replace("-----END CERTIFICATE-----", "")
      .replace(/\s/g, "");

    return `<?xml version="1.0" encoding="UTF-8"?>
<CancelarNfseEnvio xmlns="http://www.abrasf.org.br/ABRASF/arquivos/nfse.xsd">
  <Pedido>
    <InfPedidoCancelamento>
      <IdentificacaoNfse>
        <Numero>${data.numero}</Numero>
        <Cnpj>${data.cnpjPrestador}</Cnpj>
        <InscricaoMunicipal>${data.inscricaoMunicipalPrestador}</InscricaoMunicipal>
        <CodigoMunicipio>${data.codigoMunicipio}</CodigoMunicipio>
      </IdentificacaoNfse>
      <CodigoCancelamento>${data.codigoCancelamento}</CodigoCancelamento>
      <MotivoCancelamento>${data.motivoCancelamento}</MotivoCancelamento>
    </InfPedidoCancelamento>
  </Pedido>
</CancelarNfseEnvio>`;
  }
}
