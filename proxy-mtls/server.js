/**
 * Proxy mTLS para NFS-e (GINFES e Paulistana)
 *
 * Recebe requisições SOAP da Edge Function do Supabase e encaminha
 * para a prefeitura com autenticação por certificado digital (mTLS).
 *
 * Variáveis de ambiente:
 *   PROXY_PORT       - Porta do servidor (default: 3001)
 *   PROXY_API_KEY    - Chave de autenticação para proteger o proxy
 *   NODE_TLS_REJECT_UNAUTHORIZED - Usar "0" apenas em homologação
 *
 * Deploy em: Railway, Render, Fly.io, VPS, etc.
 */

const https = require("https");
const http = require("http");
const express = require("express");

const app = express();
app.use(express.json({ limit: "5mb" }));

const PORT = parseInt(process.env.PORT || process.env.PROXY_PORT || "3001", 10);
const API_KEY = process.env.PROXY_API_KEY || "";

// URLs da GINFES (legado - mantido para compatibilidade)
const GINFES_URLS = {
  homologacao: "https://homologacao.ginfes.com.br/ServiceGinfesImpl",
  producao: "https://producao.ginfes.com.br/ServiceGinfesImpl",
};

// URLs da API Paulistana
const PAULISTANA_URLS = {
  homologacao: "https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx",
  producao: "https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx",
};

/**
 * Middleware de autenticação via API Key
 */
function authenticate(req, res, next) {
  if (!API_KEY) return next();

  const authHeader = req.headers["authorization"];
  const apiKey = req.headers["x-api-key"];

  if (apiKey === API_KEY || (authHeader && authHeader.replace("Bearer ", "") === API_KEY)) {
    return next();
  }

  return res.status(401).json({ error: "Unauthorized" });
}

/**
 * Health check
 */
app.get("/health", authenticate, (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), providers: ["ginfes", "paulistana"] });
});

/**
 * Resolve target URL from request body.
 * Accepts explicit `url`, or `provider` + `ambiente` mapping.
 */
function resolveTargetUrl(body) {
  if (body.url) return body.url;
  const provider = body.provider || "ginfes";
  const env = body.ambiente || "producao";
  if (provider === "paulistana") {
    return PAULISTANA_URLS[env] || PAULISTANA_URLS.producao;
  }
  return GINFES_URLS[env] || GINFES_URLS.producao;
}

/**
 * Endpoint genérico: encaminha requisição SOAP com mTLS
 *
 * Body JSON esperado:
 *   {
 *     "soapEnvelope": "<soap12:Envelope>...</soap12:Envelope>",
 *     "certPem": "-----BEGIN CERTIFICATE-----\n...",
 *     "keyPem": "-----BEGIN PRIVATE KEY-----\n...",
 *     "ambiente": "producao" | "homologacao",
 *     "provider": "ginfes" | "paulistana",
 *     "url": "https://..." // opcional, sobrescreve provider/ambiente
 *   }
 */
app.post("/proxy-nfse", authenticate, (req, res) => {
  const { soapEnvelope, certPem, keyPem, soapAction } = req.body;

  if (!soapEnvelope) {
    return res.status(400).json({ error: "soapEnvelope é obrigatório" });
  }

  const targetUrl = resolveTargetUrl(req.body);
  const action = soapAction || "";

  if (!certPem || !keyPem) {
    console.log(`[proxy] Enviando sem mTLS para ${targetUrl} action=${action}`);
    return sendWithoutMTLS(targetUrl, soapEnvelope, action, res);
  }

  console.log(`[proxy] Enviando com mTLS para ${targetUrl} action=${action}`);
  console.log(`[proxy] Envelope preview: ${soapEnvelope.substring(0, 200)}...`);
  sendWithMTLS(targetUrl, soapEnvelope, action, certPem, keyPem, res);
});

/**
 * Endpoint legado: encaminha requisição SOAP para GINFES com mTLS
 * (mantido para compatibilidade com versões antigas das edge functions)
 */
app.post("/proxy-ginfes", authenticate, (req, res) => {
  const { soapEnvelope, certPem, keyPem, ambiente, soapAction } = req.body;

  if (!soapEnvelope) {
    return res.status(400).json({ error: "soapEnvelope é obrigatório" });
  }

  const targetEnv = ambiente || "producao";
  const targetUrl = GINFES_URLS[targetEnv] || GINFES_URLS.producao;
  const action = soapAction || "";

  if (!certPem || !keyPem) {
    console.log(`[proxy] [legacy] Enviando sem mTLS para ${targetEnv} action=${action}`);
    return sendWithoutMTLS(targetUrl, soapEnvelope, action, res);
  }

  console.log(`[proxy] [legacy] Enviando com mTLS para ${targetEnv} action=${action}`);
  console.log(`[proxy] [legacy] Envelope preview: ${soapEnvelope.substring(0, 200)}...`);
  sendWithMTLS(targetUrl, soapEnvelope, action, certPem, keyPem, res);
});

/**
 * Envia requisição SOAP sem mTLS (para homologação)
 */
function sendWithoutMTLS(targetUrl, soapEnvelope, soapAction, res) {
  const parsedUrl = new URL(targetUrl);
  const payload = Buffer.from(soapEnvelope, "utf-8");

  const options = {
    hostname: parsedUrl.hostname,
    port: parseInt(parsedUrl.port) || 443,
    path: parsedUrl.pathname,
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "SOAPAction": soapAction ? `"${soapAction}"` : "",
      "Content-Length": payload.length,
    },
  };

  const req = https.request(options, (response) => {
    let data = "";
    response.on("data", (chunk) => { data += chunk; });
    response.on("end", () => {
      if (response.statusCode >= 300) {
        return res.status(response.statusCode).send(data.substring(0, 5000));
      }
      res.setHeader("Content-Type", response.headers["content-type"] || "text/xml");
      res.status(response.statusCode).send(data);
    });
  });

  req.on("error", (err) => {
    console.error("[proxy] Erro na requisição sem mTLS:", err.message);
    res.status(502).json({ error: `Erro de conexão: ${err.message}` });
  });

  req.write(payload);
  req.end();
}

/**
 * Envia requisição SOAP com mTLS (certificado digital no handshake TLS)
 */
function sendWithMTLS(targetUrl, soapEnvelope, soapAction, certPem, keyPem, res) {
  const parsedUrl = new URL(targetUrl);
  const payload = Buffer.from(soapEnvelope, "utf-8");

  const options = {
    hostname: parsedUrl.hostname,
    port: parseInt(parsedUrl.port) || 443,
    path: parsedUrl.pathname,
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "SOAPAction": soapAction ? `"${soapAction}"` : "",
      "Content-Length": payload.length,
    },
    cert: certPem,
    key: keyPem,
    rejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED !== "0",
  };

  const req = https.request(options, (response) => {
    let data = "";
    response.on("data", (chunk) => { data += chunk; });
    response.on("end", () => {
      console.log(`[proxy] Resposta: ${response.statusCode}`);
      if (response.statusCode >= 300) {
        return res.status(response.statusCode).send(data.substring(0, 5000));
      }
      res.setHeader("Content-Type", response.headers["content-type"] || "text/xml");
      res.status(response.statusCode).send(data);
    });
  });

  req.on("error", (err) => {
    console.error("[proxy] Erro mTLS:", err.message);
    res.status(502).json({ error: `Erro mTLS: ${err.message}` });
  });

  req.write(payload);
  req.end();
}

const server = app.listen(PORT, () => {
  console.log(`[proxy] NFS-e mTLS proxy rodando na porta ${PORT}`);
  console.log(`[proxy] GINFES produção: ${GINFES_URLS.producao}`);
  console.log(`[proxy] GINFES homologação: ${GINFES_URLS.homologacao}`);
  console.log(`[proxy] Paulistana: ${PAULISTANA_URLS.producao}`);
  console.log(`[proxy] Autenticação: ${API_KEY ? "API Key configurada" : "SEM AUTENTICAÇÃO (apenas para desenvolvimento)"}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("[proxy] Encerrando...");
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  console.log("[proxy] Encerrando...");
  server.close(() => process.exit(0));
});