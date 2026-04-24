/**
 * Cliente HTTP para integração com API de NFS-e da GINFES/Prefeitura de São Paulo
 * Implementa operações: emitir, consultar, cancelar e download de documentos
 */

import { NFSeConfig, type TipoRps } from './config';
import { EmitenteNfse, CertificadoDigital, criarHeaderSOAP, assinarXML } from './auth';
import {
  DadosNotaFiscal,
  construirRps,
  construirLoteRps,
  construirPedidoConsulta,
  construirPedidoConsultaLote,
  construirPedidoCancelamento,
  validarDadosNota,
} from './xmlBuilder';
import {
  RespostaEmissao,
  RespostaConsulta,
  RespostaConsultaLote,
  RespostaCancelamento,
  parsearRespostaEmissao,
  parsearRespostaConsulta,
  parsearRespostaConsultaLote,
  parsearRespostaCancelamento,
  parsearErros,
  traduzirErroGinfes,
} from './parser';

// Configuração do cliente
export interface NFSeClientConfig {
  ambiente: 'homologacao' | 'producao';
  timeout?: number;
  certificado?: CertificadoDigital;
}

// Opções para requisições
interface RequestOptions {
  method?: 'POST' | 'GET';
  body?: string;
  soapAction?: string;
  headers?: Record<string, string>;
}

/**
 * Classe cliente para integração com NFS-e
 */
export class NFSeClientSP {
  private config: NFSeClientConfig;
  private baseUrl: string;

  constructor(config?: Partial<NFSeClientConfig>) {
    this.config = {
      ambiente: config?.ambiente || NFSeConfig.ambiente,
      timeout: config?.timeout || NFSeConfig.timeout,
      certificado: config?.certificado,
    };

    this.baseUrl = NFSeConfig.urls[this.config.ambiente];
  }

  /**
   * Atualiza a configuração do cliente
   */
  setConfig(config: Partial<NFSeClientConfig>): void {
    this.config = { ...this.config, ...config };
    this.baseUrl = NFSeConfig.urls[this.config.ambiente];
  }

  /**
   * Faz requisição SOAP para a API da GINFES
   */
  private async fazerRequisicaoSOAP(
    endpoint: string,
    xmlBody: string,
    options?: RequestOptions
  ): Promise<string> {
    const soapAction = options?.soapAction || NFSeConfig.soapActions.enviarLoteRps;

    const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="${NFSeConfig.namespaces.soap}" xmlns:xsi="${NFSeConfig.namespaces.xsi}" xmlns:xsd="${NFSeConfig.namespaces.xsd}">
${criarHeaderSOAP({ cnpj: '', inscricaoMunicipal: '', endereco: { logradouro: '', numero: '', bairro: '', codigoMunicipio: '', uf: '', cep: '' }, certificado: { certificado: '', senha: '' }, razaoSocial: '' })}
  <soap:Body>
    <RecepcionarLoteRpsRequest xmlns="${NFSeConfig.namespaces.nfse}">
      ${xmlBody}
    </RecepcionarLoteRpsRequest>
  </soap:Body>
</soap:Envelope>`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': NFSeConfig.contentType,
          'SOAPAction': `"${soapAction}"`,
          ...options?.headers,
        },
        body: envelope,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const xmlResponse = await response.text();
      return xmlResponse;

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Timeout na requisição após ${this.config.timeout}ms`);
        }
        throw new Error(`Erro na requisição SOAP: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Extrai o corpo da resposta SOAP
   */
  private extrairCorpoResposta(xmlResponse: string): string {
    // Remove envelope SOAP
    const bodyMatch = xmlResponse.match(/<soap:Body[^>]*>([\s\S]*?)<\/soap:Body>/i) ||
                       xmlResponse.match(/<Body[^>]*>([\s\S]*?)<\/Body>/i);

    if (bodyMatch) {
      return bodyMatch[1].trim();
    }

    return xmlResponse;
  }

  /**
   * Emite uma nota fiscal de serviço eletrônica (síncrono)
   * Para emissão em lote, usar emitirLoteRps
   */
  async emitirNota(dadosNota: DadosNotaFiscal): Promise<RespostaEmissao> {
    // Valida dados da nota
    const errosValidacao = validarDadosNota(dadosNota);
    if (errosValidacao.length > 0) {
      return {
        sucesso: false,
        mensagens: errosValidacao.map((erro, idx) => ({
          codigo: `V${String(idx + 1).padStart(3, '0')}`,
          mensagem: erro,
          tipo: 'Erro' as const,
        })),
      };
    }

    try {
      // Constrói XML do RPS
      const xmlRps = construirRps(dadosNota);

      // Assina o XML se houver certificado
      let xmlAssinado = xmlRps;
      if (this.config.certificado) {
        xmlAssinado = await assinarXML(
          xmlRps,
          this.config.certificado,
          dadosNota.identificacaoRps.numero
        );
      }

      // Envia para API
      const xmlResponse = await this.fazerRequisicaoSOAP(
        NFSeConfig.endpoints.envioSincrono,
        xmlAssinado,
        { soapAction: NFSeConfig.soapActions.enviarLoteRps }
      );

      const corpoResposta = this.extrairCorpoResposta(xmlResponse);
      const resposta = parsearRespostaEmissao(corpoResposta);

      // Traduz códigos de erro para mensagens amigáveis
      if (!resposta.sucesso) {
        resposta.mensagens = resposta.mensagens.map(msg => ({
          ...msg,
          mensagem: msg.codigo ? traduzirErroGinfes(msg.codigo) : msg.mensagem,
        }));
      }

      return resposta;

    } catch (error) {
      return {
        sucesso: false,
        mensagens: [{
          codigo: 'CLIENT_ERROR',
          mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
          tipo: 'Erro',
        }],
      };
    }
  }

  /**
   * Emite lote de RPS (assíncrono)
   * Útil para emissão em batch de múltiplas notas
   */
  async emitirLoteRps(
    notas: DadosNotaFiscal[],
    numeroLote: string,
    emitente: EmitenteNfse
  ): Promise<RespostaEmissao> {
    if (notas.length === 0) {
      return {
        sucesso: false,
        mensagens: [{
          codigo: 'E0',
          mensagem: 'Lote deve conter pelo menos um RPS',
          tipo: 'Erro',
        }],
      };
    }

    try {
      // Valida todas as notas
      for (let i = 0; i < notas.length; i++) {
        const erros = validarDadosNota(notas[i]);
        if (erros.length > 0) {
          return {
            sucesso: false,
            mensagens: erros.map((erro, idx) => ({
              codigo: `V${String(idx + 1).padStart(3, '0')}`,
              mensagem: `[Nota ${i + 1}] ${erro}`,
              tipo: 'Erro' as const,
            })),
          };
        }
      }

      // Constrói XML do lote
      const xmlLote = construirLoteRps(
        notas,
        numeroLote,
        emitente.cnpj,
        emitente.inscricaoMunicipal
      );

      // Assina o XML se houver certificado
      let xmlAssinado = xmlLote;
      if (this.config.certificado) {
        xmlAssinado = await assinarXML(xmlLote, this.config.certificado, numeroLote);
      }

      // Envia para API
      const xmlResponse = await this.fazerRequisicaoSOAP(
        NFSeConfig.endpoints.envioLote,
        xmlAssinado,
        { soapAction: NFSeConfig.soapActions.enviarLoteRps }
      );

      const corpoResposta = this.extrairCorpoResposta(xmlResponse);
      return parsearRespostaEmissao(corpoResposta);

    } catch (error) {
      return {
        sucesso: false,
        mensagens: [{
          codigo: 'CLIENT_ERROR',
          mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
          tipo: 'Erro',
        }],
      };
    }
  }

  /**
   * Consulta uma nota fiscal por RPS
   */
  async consultarNota(
    numeroRps: string,
    serie: string,
    emitente: EmitenteNfse,
    tipoRps: TipoRps = 'RPS'
  ): Promise<RespostaConsulta> {
    try {
      const xmlConsulta = construirPedidoConsulta(
        numeroRps,
        serie,
        tipoRps,
        emitente.cnpj,
        emitente.inscricaoMunicipal
      );

      const xmlResponse = await this.fazerRequisicaoSOAP(
        NFSeConfig.endpoints.consultaRps,
        xmlConsulta,
        { soapAction: NFSeConfig.soapActions.consultarNfsePorRps }
      );

      const corpoResposta = this.extrairCorpoResposta(xmlResponse);
      return parsearRespostaConsulta(corpoResposta);

    } catch (error) {
      return {
        sucesso: false,
        mensagens: [{
          codigo: 'CLIENT_ERROR',
          mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
          tipo: 'Erro',
        }],
      };
    }
  }

  /**
   * Consulta status de processamento de lote
   */
  async consultarLoteRps(
    protocolo: string,
    emitente: EmitenteNfse
  ): Promise<RespostaConsultaLote> {
    try {
      const xmlConsulta = construirPedidoConsultaLote(
        protocolo,
        emitente.cnpj,
        emitente.inscricaoMunicipal
      );

      const xmlResponse = await this.fazerRequisicaoSOAP(
        NFSeConfig.endpoints.consultaLote,
        xmlConsulta,
        { soapAction: NFSeConfig.soapActions.consultarLoteRps }
      );

      const corpoResposta = this.extrairCorpoResposta(xmlResponse);
      return parsearRespostaConsultaLote(corpoResposta);

    } catch (error) {
      return {
        sucesso: false,
        situacao: 'PROCESSADO_COM_ERRO',
        protocolo,
        mensagens: [{
          codigo: 'CLIENT_ERROR',
          mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
          tipo: 'Erro',
        }],
      };
    }
  }

  /**
   * Cancela uma nota fiscal emitida
   */
  async cancelarNota(
    numeroNfse: string,
    emitente: EmitenteNfse,
    codigoCancelamento: string = 'E007',
    motivoCancelamento?: string
  ): Promise<RespostaCancelamento> {
    try {
      const xmlCancelamento = construirPedidoCancelamento(
        numeroNfse,
        emitente.cnpj,
        emitente.inscricaoMunicipal,
        codigoCancelamento,
        motivoCancelamento
      );

      // Assina o XML de cancelamento
      let xmlAssinado = xmlCancelamento;
      if (this.config.certificado) {
        xmlAssinado = await assinarXML(xmlCancelamento, this.config.certificado, `CAN${numeroNfse}`);
      }

      const xmlResponse = await this.fazerRequisicaoSOAP(
        NFSeConfig.endpoints.cancelamento,
        xmlAssinado,
        { soapAction: NFSeConfig.soapActions.cancelarNfse }
      );

      const corpoResposta = this.extrairCorpoResposta(xmlResponse);
      return parsearRespostaCancelamento(corpoResposta);

    } catch (error) {
      return {
        sucesso: false,
        mensagens: [{
          codigo: 'CLIENT_ERROR',
          mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
          tipo: 'Erro',
        }],
      };
    }
  }

  /**
   * Realiza download do PDF da nota fiscal
   */
  async downloadPDF(link: string): Promise<Blob | null> {
    try {
      const response = await fetch(link, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.blob();

    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      return null;
    }
  }

  /**
   * Realiza download do XML da nota fiscal
   */
  async downloadXML(link: string): Promise<string | null> {
    try {
      const response = await fetch(link, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.text();

    } catch (error) {
      console.error('Erro ao baixar XML:', error);
      return null;
    }
  }

  /**
   * Verifica status da API
   */
  async verificarStatus(): Promise<{ online: boolean; mensagem?: string }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });

      return {
        online: response.ok || response.status === 405, // 405 é OK (método não permitido, mas serviço online)
      };
    } catch (error) {
      return {
        online: false,
        mensagem: error instanceof Error ? error.message : 'Serviço indisponível',
      };
    }
  }
}

// Exporta instância padrão
export const nfseClientSP = new NFSeClientSP();

// Tipos disponíveis via import de './index'
