/**
 * Cliente HTTP com suporte a mTLS (mutual TLS) para GINFES.
 * O servidor de produção da GINFES exige autenticação por certificado
 * digital no nível do TLS (client certificate), não apenas assinatura XML.
 *
 * Usa Deno.createHttpClient quando disponível, com fallback para fetch simples.
 */

interface MTLSConfig {
  certPem: string;
  keyPem: string;
}

const GINFES_URLS = {
  homologacao: "https://homologacao.ginfes.com.br/ServiceGinfesImpl",
  producao: "https://producao.ginfes.com.br/ServiceGinfesImpl",
};

function getAmbiente(): "homologacao" | "producao" {
  return (Deno.env.get("NFSE_AMBIENTE") || "homologacao") as "homologacao" | "producao";
}

/**
 * Envia requisição SOAP para GINFES com suporte a mTLS.
 * Em produção, usa Deno.createHttpClient com o certificado digital.
 * Em homologação, usa fetch normal (sem mTLS).
 */
export async function enviarRequisicaoSOAP(
  soapEnvelope: string,
  certificado?: MTLSConfig,
): Promise<string> {
  const env = getAmbiente();
  const url = GINFES_URLS[env];

  // Homologação não requer mTLS
  if (env === "homologacao" || !certificado) {
    console.log("mtls-client: usando fetch sem mTLS (ambiente:", env, ")");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/soap+xml; charset=utf-8",
        "SOAPAction": "",
      },
      body: soapEnvelope,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro HTTP ${response.status}: ${text.substring(0, 500)}`);
    }
    return await response.text();
  }

  // Produção: tentar mTLS com Deno.createHttpClient
  try {
    const client = Deno.createHttpClient({
      certChain: certificado.certPem,
      privateKey: certificado.keyPem,
    });

    console.log("mtls-client: usando Deno.createHttpClient com mTLS para produção");

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/soap+xml; charset=utf-8",
          "SOAPAction": "",
        },
        body: soapEnvelope,
        client,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erro HTTP ${response.status}: ${text.substring(0, 500)}`);
      }

      return await response.text();
    } finally {
      client.close();
    }
  } catch (httpClientError: any) {
    // Se Deno.createHttpClient não está disponível ou falhou, tentar conexão TLS manual
    const errMsg = httpClientError?.message || String(httpClientError);

    if (errMsg.includes("createHttpClient") || errMsg.includes("is not a function")) {
      console.warn("mtls-client: Deno.createHttpClient não disponível, tentando Deno.connectTLS...");
    } else {
      console.error("mtls-client: Erro com createHttpClient:", errMsg);
    }

    // Fallback: usar Deno.connectTLS para estabelecer conexão com certificado cliente
    return enviarRequisicaoMTLSManual(url, soapEnvelope, certificado);
  }
}

/**
 * Fallback: estabelece conexão TLS manual com certificado cliente
 * e envia a requisição HTTP/1.1 diretamente.
 */
async function enviarRequisicaoMTLSManual(
  url: string,
  soapEnvelope: string,
  certificado: MTLSConfig,
): Promise<string> {
  const parsedUrl = new URL(url);
  const hostname = parsedUrl.hostname;
  const port = parseInt(parsedUrl.port) || 443;

  let conn: Deno.TlsConn | null = null;
  try {
    conn = await Deno.connectTLS({
      hostname,
      port,
      certChain: certificado.certPem,
      privateKey: certificado.keyPem,
    });

    console.log("mtls-client: conexão TLS manual estabelecida com", hostname);

    // Montar requisição HTTP/1.1 manualmente
    const path = parsedUrl.pathname + parsedUrl.search;
    const contentLength = new TextEncoder().encode(soapEnvelope).length;

    const httpRequest = [
      `POST ${path} HTTP/1.1`,
      `Host: ${hostname}`,
      "Content-Type: application/soap+xml; charset=utf-8",
      "SOAPAction: \"\"",
      `Content-Length: ${contentLength}`,
      "Connection: close",
      "",
      soapEnvelope,
    ].join("\r\n");

    await conn.write(new TextEncoder().encode(httpRequest));

    // Ler resposta
    const chunks: Uint8Array[] = [];
    const reader = conn.readable.getReader();

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } catch {
      // Connection closed by server - expected
    }

    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const responseBytes = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      responseBytes.set(chunk, offset);
      offset += chunk.length;
    }

    const responseText = new TextDecoder().decode(responseBytes);

    // Separar headers do body (HTTP/1.1)
    const headerEndIndex = responseText.indexOf("\r\n\r\n");
    if (headerEndIndex === -1) {
      throw new Error("Resposta HTTP mal formatada: sem separador header/body");
    }

    const headers = responseText.substring(0, headerEndIndex);
    const body = responseText.substring(headerEndIndex + 4);

    // Verificar status HTTP
    const statusMatch = headers.match(/^HTTP\/\d\.\d\s+(\d+)\s+(.+)/);
    if (!statusMatch) {
      throw new Error(`Resposta HTTP inválida: ${headers.substring(0, 200)}`);
    }

    const statusCode = parseInt(statusMatch[1]);
    const statusText = statusMatch[2];

    if (statusCode >= 300) {
      throw new Error(`Erro HTTP ${statusCode}: ${body.substring(0, 500)}`);
    }

    // Se a resposta tem Transfer-Encoding: chunked, decodificar
    if (headers.toLowerCase().includes("transfer-encoding: chunked")) {
      return decodeChunked(body);
    }

    return body;
  } catch (tlsError: any) {
    const errMsg = tlsError?.message || String(tlsError);
    console.error("mtls-client: Erro na conexão TLS manual:", errMsg);

    if (errMsg.includes("connectTLS") || errMsg.includes("is not a function")) {
      throw new Error(
        "O ambiente atual não suporta mTLS (certificado cliente no nível TLS). " +
        "A emissão em produção requer um servidor proxy com suporte a mTLS, " +
        "ou um ambiente Deno com acesso à API Deno.connectTLS. " +
        "Erro original: " + errMsg
      );
    }

    throw new Error(`Erro na comunicação com GINFES (mTLS): ${errMsg}`);
  } finally {
    if (conn) {
      try { conn.close(); } catch { /* ignore */ }
    }
  }
}

/**
 * Decodifica resposta HTTP chunked transfer encoding.
 */
function decodeChunked(body: string): string {
  let result = "";
  let pos = 0;
  while (pos < body.length) {
    const lineEnd = body.indexOf("\r\n", pos);
    if (lineEnd === -1) break;

    const sizeStr = body.substring(pos, lineEnd);
    const chunkSize = parseInt(sizeStr, 16);
    if (isNaN(chunkSize) || chunkSize === 0) break;

    pos = lineEnd + 2;
    result += body.substring(pos, pos + chunkSize);
    pos += chunkSize + 2; // skip chunk data + \r\n
  }
  return result;
}