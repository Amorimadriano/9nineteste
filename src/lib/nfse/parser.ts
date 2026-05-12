/**
 * Parser de respostas NFS-e (API Paulistana)
 * Parseia XMLs de resposta da prefeitura usando extração robusta por regex
 * Suporta API Paulistana (Prefeitura de São Paulo)
 */

import type { NFSeResposta, MensagemRetorno, NFSeCancelamentoResposta } from "../../types/nfse";

function extractValue(xml: string, tag: string): string | undefined {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : undefined;
}

function extractBlock(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function parseMessages(xml: string): MensagemRetorno[] {
  const msgs: MensagemRetorno[] = [];
  const blocks = [...xml.matchAll(/<MensagemRetorno[^>]*>([\s\S]*?)<\/MensagemRetorno>/gi)];
  if (blocks.length === 0) {
    const codigos = [...xml.matchAll(/<Codigo(?:\s[^>]*)?>([^<]*)<\/Codigo>/gi)].map(m => m[1]);
    const mensagens = [...xml.matchAll(/<Mensagem(?:\s[^>]*)?>([^<]*)<\/Mensagem>/gi)].map(m => m[1]);
    for (let i = 0; i < Math.max(codigos.length, mensagens.length); i++) {
      msgs.push({ codigo: codigos[i] || "ERR", mensagem: mensagens[i] || "Erro desconhecido" });
    }
    return msgs;
  }
  for (const [, block] of blocks) {
    const codigo = extractValue(block, "Codigo") || "";
    const mensagem = extractValue(block, "Mensagem") || "";
    const correcao = extractValue(block, "Correcao");
    msgs.push({ codigo, mensagem: correcao ? `${mensagem} (${correcao})` : mensagem });
  }
  return msgs;
}

function stripNamespaces(xml: string): string {
  return xml.replace(/<\/?[a-zA-Z0-9_]+:/g, m => (m.startsWith("</") ? "</" : "<"));
}

function extractCdata(xml: string): string {
  const cdata = xml.match(/<return[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/return>/i);
  if (cdata) return cdata[1];
  return xml;
}

export function parseNfseResponse(xml: string): NFSeResposta {
  if (!xml || typeof xml !== "string") {
    return { sucesso: false, mensagens: [{ codigo: "ERR", mensagem: "XML vazio ou inválido" }] };
  }
  let workXml = extractCdata(stripNamespaces(xml));
  const msgs = parseMessages(workXml);
  const hasError = msgs.some(m => m.codigo && m.codigo !== "0000");

  const compNfse = extractBlock(workXml, "CompNfse") || extractBlock(workXml, "ListaNfse");
  const nfseBlock = compNfse ? (extractBlock(compNfse, "Nfse") || compNfse) : workXml;
  const infNfse = extractBlock(nfseBlock, "InfNfse") || nfseBlock;

  const numero = extractValue(infNfse, "NumeroNfse") || extractValue(infNfse, "NumeroNFe") || extractValue(infNfse, "Numero");
  const codigoVerificacao = extractValue(infNfse, "CodigoVerificacao");
  const dataEmissao = extractValue(infNfse, "DataEmissaoNfse") || extractValue(infNfse, "DataEmissaoNFe") || extractValue(infNfse, "DataEmissao");
  const protocolo = extractValue(workXml, "Protocolo");

  const valoresBlock = extractBlock(infNfse, "ValoresNfse") || extractBlock(infNfse, "Valores");

  const sucesso = !hasError && !!(numero || protocolo);

  return {
    sucesso,
    numero,
    codigoVerificacao,
    dataEmissao,
    protocolo,
    mensagens: msgs.length > 0 ? msgs : sucesso ? [{ codigo: "0000", mensagem: "Operação realizada com sucesso" }] : undefined,
    valores: valoresBlock
      ? {
          valorServicos: parseFloat((extractValue(valoresBlock, "ValorServicos") || "0").replace(",", ".")),
          valorDeducoes: parseFloat((extractValue(valoresBlock, "ValorDeducoes") || "0").replace(",", ".")),
          valorPis: parseFloat((extractValue(valoresBlock, "ValorPis") || "0").replace(",", ".")),
          valorCofins: parseFloat((extractValue(valoresBlock, "ValorCofins") || "0").replace(",", ".")),
          valorInss: parseFloat((extractValue(valoresBlock, "ValorInss") || "0").replace(",", ".")),
          valorIr: parseFloat((extractValue(valoresBlock, "ValorIr") || "0").replace(",", ".")),
          valorCsll: parseFloat((extractValue(valoresBlock, "ValorCsll") || "0").replace(",", ".")),
          valorIss: parseFloat((extractValue(valoresBlock, "ValorIss") || "0").replace(",", ".")),
          valorIssRetido: parseFloat((extractValue(valoresBlock, "ValorIssRetido") || "0").replace(",", ".")),
          outrasRetencoes: parseFloat((extractValue(valoresBlock, "OutrasRetencoes") || "0").replace(",", ".")),
          baseCalculo: parseFloat((extractValue(valoresBlock, "BaseCalculo") || "0").replace(",", ".")),
          aliquota: parseFloat((extractValue(valoresBlock, "Aliquota") || "0").replace(",", ".")),
          valorLiquidoNfse: parseFloat((extractValue(valoresBlock, "ValorLiquidoNfse") || "0").replace(",", ".")),
        }
      : undefined,
  };
}

export function parseConsultaResponse(xml: string): NFSeResposta {
  const base = parseNfseResponse(xml);
  const cleanXml = stripNamespaces(extractCdata(xml));
  const dataCancelamento = extractValue(cleanXml, "DataCancelamento");
  const nfseSubstituida = extractValue(cleanXml, "NfseSubstituida");
  const status = dataCancelamento ? "CANCELADA" : nfseSubstituida === "1" ? "SUBSTITUIDA" : "NORMAL";
  return { ...base, status };
}

export function parseCancelamentoResponse(xml: string): NFSeCancelamentoResposta {
  const msgs = parseMessages(stripNamespaces(extractCdata(xml)));
  const hasError = msgs.some(m => m.codigo && m.codigo !== "0000");
  const confirmacao = extractBlock(stripNamespaces(extractCdata(xml)), "Confirmacao");
  const sucesso = !hasError && (extractValue(confirmacao || xml, "Sucesso") === "true" || extractValue(confirmacao || xml, "sucesso") === "true");
  const dataHora = extractValue(confirmacao || xml, "DataHoraCancelamento");
  return {
    sucesso,
    dataHoraCancelamento: dataHora,
    mensagens: msgs.length > 0 ? msgs : sucesso ? [{ codigo: "0000", mensagem: "Cancelamento confirmado" }] : undefined,
  };
}

export function parseErroSOAP(xml: string): { tipo: string; mensagem: string; faultCode?: string; faultString?: string; codigo?: string } {
  const clean = stripNamespaces(xml);
  const fault = extractBlock(clean, "Fault");
  if (fault) {
    const detail = extractBlock(fault, "detail");
    const errorMessage = extractValue(detail || "", "ErrorMessage");
    const faultString = extractValue(fault, "faultstring");
    return {
      tipo: "SOAP_FAULT",
      faultCode: extractValue(fault, "faultcode"),
      faultString,
      codigo: extractValue(detail || "", "ErrorCode") || extractValue(fault, "faultcode"),
      mensagem: errorMessage || faultString || "Erro SOAP",
    };
  }
  return { tipo: "UNKNOWN", mensagem: "Erro desconhecido na resposta" };
}

/** Classe wrapper para compatibilidade com testes existentes */
export class NFSeParser {
  parseRespostaAutorizacao(xml: string): NFSeResposta {
    return parseNfseResponse(xml);
  }
  parseRespostaConsulta(xml: string): NFSeResposta {
    return parseConsultaResponse(xml);
  }
  parseRespostaCancelamento(xml: string): NFSeCancelamentoResposta {
    return parseCancelamentoResponse(xml);
  }
  parseErroSOAP(xml: string): ReturnType<typeof parseErroSOAP> {
    return parseErroSOAP(xml);
  }
}
