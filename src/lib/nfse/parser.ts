/**
 * Parser de respostas NFS-e
 * Parseia XMLs de resposta da prefeitura
 */

import type { NFSeResposta, MensagemRetorno, NFSeCancelamentoResposta } from "../../types/nfse";

interface ConsultaResposta extends NFSeResposta {
  status?: string;
  cancelada?: boolean;
  substituida?: boolean;
}

interface ErroSOAP {
  tipo: "SOAP_FAULT" | "PARSE_ERROR" | "UNKNOWN";
  codigo?: string;
  mensagem: string;
  faultCode?: string;
  faultString?: string;
}

export class NFSeParser {
  /**
   * Parseia resposta de autorização de emissão
   */
  parseRespostaAutorizacao(xml: string): NFSeResposta {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, "text/xml");

      // Verificar erro de parse
      const parseError = doc.querySelector("parsererror");
      if (parseError) {
        throw new Error("XML mal formatado");
      }

      // Verificar se há lista de mensagens de erro
      const mensagensRetorno = doc.querySelectorAll("MensagemRetorno");
      if (mensagensRetorno.length > 0) {
        const mensagens: MensagemRetorno[] = Array.from(mensagensRetorno).map((msg) => ({
          codigo: msg.querySelector("Codigo")?.textContent || "",
          mensagem: msg.querySelector("Mensagem")?.textContent || "",
          correcao: msg.querySelector("Correcao")?.textContent || undefined,
        }));

        return {
          sucesso: false,
          mensagens,
        };
      }

      // Parsear dados da NFSe
      const nfse = doc.querySelector("Nfse");
      if (!nfse) {
        return { sucesso: false };
      }

      const infNfse = nfse.querySelector("InfNfse");
      if (!infNfse) {
        return { sucesso: false };
      }

      const valoresNfse = infNfse.querySelector("ValoresNfse");
      const prestador = infNfse.querySelector("PrestadorServico");
      const tomador = infNfse.querySelector("TomadorServico");
      const declaracao = infNfse.querySelector("DeclaracaoPrestacaoServico");
      const rps = declaracao?.querySelector("Rps")?.querySelector("IdentificacaoRps");

      return {
        sucesso: true,
        numero: infNfse.querySelector("Numero")?.textContent || undefined,
        codigoVerificacao: infNfse.querySelector("CodigoVerificacao")?.textContent || undefined,
        dataEmissao: infNfse.querySelector("DataEmissao")?.textContent || undefined,
        valores: valoresNfse
          ? {
              valorServicos: this.parseFloat(valoresNfse.querySelector("ValorServicos")?.textContent),
              valorDeducoes: this.parseFloat(valoresNfse.querySelector("ValorDeducoes")?.textContent),
              valorPis: this.parseFloat(valoresNfse.querySelector("ValorPis")?.textContent),
              valorCofins: this.parseFloat(valoresNfse.querySelector("ValorCofins")?.textContent),
              valorInss: this.parseFloat(valoresNfse.querySelector("ValorInss")?.textContent),
              valorIr: this.parseFloat(valoresNfse.querySelector("ValorIr")?.textContent),
              valorCsll: this.parseFloat(valoresNfse.querySelector("ValorCsll")?.textContent),
              valorIss: this.parseFloat(valoresNfse.querySelector("ValorIss")?.textContent),
              valorIssRetido: this.parseFloat(valoresNfse.querySelector("ValorIssRetido")?.textContent),
              outrasRetencoes: this.parseFloat(valoresNfse.querySelector("OutrasRetencoes")?.textContent),
              baseCalculo: this.parseFloat(valoresNfse.querySelector("BaseCalculo")?.textContent),
              aliquota: this.parseFloat(valoresNfse.querySelector("Aliquota")?.textContent),
              valorLiquidoNfse: this.parseFloat(valoresNfse.querySelector("ValorLiquidoNfse")?.textContent),
            }
          : undefined,
        prestador: prestador
          ? {
              cnpj: prestador.querySelector("Cnpj")?.textContent || "",
              inscricaoMunicipal: prestador.querySelector("InscricaoMunicipal")?.textContent || "",
              razaoSocial: prestador.querySelector("RazaoSocial")?.textContent || "",
            }
          : undefined,
        tomador: tomador
          ? {
              cnpj:
                tomador.querySelector("CnpjCpf Cnpj")?.textContent ||
                tomador.querySelector("Cnpj")?.textContent ||
                "",
              razaoSocial: tomador.querySelector("RazaoSocial")?.textContent || "",
            }
          : undefined,
        rps: rps
          ? {
              numero: rps.querySelector("Numero")?.textContent || undefined,
              serie: rps.querySelector("Serie")?.textContent || undefined,
              tipo: rps.querySelector("Tipo")?.textContent || undefined,
            }
          : undefined,
      } as any;
    } catch (error) {
      throw new Error(`Erro ao parsear resposta de autorização: ${error}`);
    }
  }

  /**
   * Parseia resposta de consulta
   */
  parseRespostaConsulta(xml: string): ConsultaResposta {
    const resposta = this.parseRespostaAutorizacao(xml);

    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "text/xml");

    // Verificar mensagens de erro
    const mensagensRetorno = doc.querySelectorAll("MensagemRetorno");
    if (mensagensRetorno.length > 0) {
      const mensagens: MensagemRetorno[] = Array.from(mensagensRetorno).map((msg) => ({
        codigo: msg.querySelector("Codigo")?.textContent || "",
        mensagem: msg.querySelector("Mensagem")?.textContent || "",
      }));

      return {
        sucesso: false,
        mensagens,
      };
    }

    const infNfse = doc.querySelector("InfNfse");
    const nfseSubstituida = infNfse?.querySelector("NfseSubstituida")?.textContent;
    const dataCancelamento = infNfse?.querySelector("DataCancelamento")?.textContent;

    return {
      ...resposta,
      status: dataCancelamento ? "CANCELADA" : "NORMAL",
      cancelada: !!dataCancelamento,
      substituida: nfseSubstituida === "1",
    };
  }

  /**
   * Parseia resposta de cancelamento
   */
  parseRespostaCancelamento(xml: string): NFSeCancelamentoResposta {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, "text/xml");

      // Verificar mensagens de erro
      const mensagensRetorno = doc.querySelectorAll("MensagemRetorno");
      if (mensagensRetorno.length > 0) {
        const mensagens: MensagemRetorno[] = Array.from(mensagensRetorno).map((msg) => ({
          codigo: msg.querySelector("Codigo")?.textContent || "",
          mensagem: msg.querySelector("Mensagem")?.textContent || "",
        }));

        return {
          sucesso: false,
          mensagens,
        };
      }

      const confirmacao = doc.querySelector("Confirmacao");
      const sucesso = confirmacao?.querySelector("Sucesso")?.textContent === "true";

      if (sucesso) {
        return {
          sucesso: true,
          dataHoraCancelamento: confirmacao?.querySelector("DataHoraCancelamento")?.textContent || undefined,
          inscricaoMunicipalPrestador:
            confirmacao?.querySelector("InscricaoMunicipalPrestador")?.textContent || undefined,
        } as any;
      }

      return {
        sucesso: false,
        mensagens: [{ codigo: "UNKNOWN", mensagem: "Cancelamento não confirmado" }],
      };
    } catch (error) {
      return {
        sucesso: false,
        mensagens: [{ codigo: "PARSE_ERROR", mensagem: String(error) }],
      };
    }
  }

  /**
   * Parseia erro SOAP
   */
  parseErroSOAP(xml: string): ErroSOAP {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, "text/xml");

      // Verificar erro de parse
      const parseError = doc.querySelector("parsererror");
      if (parseError) {
        return {
          tipo: "PARSE_ERROR",
          mensagem: "XML mal formatado",
        };
      }

      // Buscar Fault em qualquer namespace
      const fault = doc.getElementsByTagName("Fault")[0];
      if (fault) {
        const faultCode = fault.getElementsByTagName("faultcode")[0]?.textContent || "";
        const faultString = fault.getElementsByTagName("faultstring")[0]?.textContent || "";
        const detail = fault.getElementsByTagName("detail")[0];
        const errorCode = detail?.getElementsByTagName("ErrorCode")[0]?.textContent;
        const errorMessage = detail?.getElementsByTagName("ErrorMessage")[0]?.textContent;

        return {
          tipo: "SOAP_FAULT",
          faultCode,
          faultString,
          codigo: errorCode || undefined,
          mensagem: errorMessage || faultString,
        };
      }

      return {
        tipo: "UNKNOWN",
        mensagem: "Erro desconhecido na resposta",
      };
    } catch (error) {
      return {
        tipo: "UNKNOWN",
        mensagem: `Erro ao parsear: ${error}`,
      };
    }
  }

  /**
   * Converte string para float de forma segura
   */
  private parseFloat(value: string | null | undefined): number {
    if (!value) return 0;
    const parsed = parseFloat(value.replace(",", "."));
    return isNaN(parsed) ? 0 : parsed;
  }
}
