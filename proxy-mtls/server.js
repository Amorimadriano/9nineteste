/**
 * Proxy mTLS para NFS-e (API Paulistana)
 *
 * Recebe requisições SOAP da Edge Function do Supabase e encaminha
 * para a prefeitura com autenticação por certificado digital (mTLS).
 *
 * Variáveis de ambiente:
 *   PROXY_PORT       - Porta do servidor (default: 3001)
 *   PROXY_API_KEY    - Chave de autenticação para proteger o proxy
 *   NODE_TLS_REJECT_UNAUTHORIZED - Usar "0" apenas em homologação
 */

const https = require("https");
const http = require("http");
const express = require("express");

const app = express();

// Middleware de log detalhado
app.use((req, res, next) => {
  console.log(`[proxy] ${req.method} ${req.path} - Content-Type: ${req.headers['content-type'] || 'none'}`);
  next();
});

app.use(express.json({ limit: "5mb" }));
app.use(express.text({ limit: "5mb", type: "text/*" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

const PORT = parseInt(process.env.PORT || process.env.PROXY_PORT || "3001", 10);
const API_KEY = process.env.PROXY_API_KEY || "";

// URLs da API Paulistana
const PAULISTANA_URLS = {
  homologacao: "https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx",
  producao: "https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx",
};

// URLs da GINFES (legado - mantido para compatibilidade)
const GINFES_URLS = {
  homologacao: "https://homologacao.ginfes.com.br/ServiceGinfesImpl",
  producao: "https://producao.ginfes.com.br/ServiceGinfesImpl",
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
 * Error handler global
 */
function errorHandler(err, _req, res, _next) {
  console.error("[proxy] Unhandled error:", err);
  res.status(500).json({ error: "Internal server error", details: err.message });
}
app.use(errorHandler);

/**
 * Health check
 */
app.get("/health", authenticate, (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), providers: ["paulistana", "ginfes"] });
});

/**
 * Resolve target URL from request body.
 */
function resolveTargetUrl(body) {
  if (body.url) return body.url;
  const provider = body.provider || "paulistana";
  const env = body.ambiente || "producao";
  if (provider === "paulistana") {
    return PAULISTANA_URLS[env] || PAULISTANA_URLS.producao;
  }
  return GINFES_URLS[env] || GINFES_URLS.producao;
}

/**
 * Endpoint genérico: encaminha requisição SOAP com mTLS
 */
app.post("/proxy-nfse", authenticate, (req, res) => {
  try {
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
  } catch (err) {
    console.error("[proxy] Erro no handler /proxy-nfse:", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

/**
 * Endpoint legado: encaminha requisição SOAP para GINFES com mTLS
 */
app.post("/proxy-ginfes", authenticate, (req, res) => {
  try {
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
  } catch (err) {
    console.error("[proxy] Erro no handler /proxy-ginfes:", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

/**
 * Envia requisição SOAP sem mTLS
 */
function sendWithoutMTLS(targetUrl, soapEnvelope, soapAction, res) {
  const parsedUrl = new URL(targetUrl);
  const payload = Buffer.from(soapEnvelope, "utf-8");

  const options = {
    hostname: parsedUrl.hostname,
    port: parseInt(parsedUrl.port) || 443,
    path: parsedUrl.pathname + (parsedUrl.search || ""),
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "SOAPAction": soapAction ? `"${soapAction}"` : "",
      "Content-Length": payload.length,
    },
    timeout: 30000,
  };

  const clientReq = https.request(options, (response) => {
    let data = "";
    response.on("data", (chunk) => { data += chunk; });
    response.on("end", () => {
      console.log(`[proxy] Resposta sem-mTLS: ${response.statusCode} ${data.length} bytes`);
      res.setHeader("Content-Type", response.headers["content-type"] || "text/xml");
      res.status(response.statusCode || 200).send(data);
    });
  });

  clientReq.on("error", (err) => {
    console.error("[proxy] Erro na requisição sem mTLS:", err.message);
    res.status(502).json({ error: `Erro de conexão: ${err.message}` });
  });

  clientReq.on("timeout", () => {
    console.error("[proxy] Timeout na requisição sem mTLS");
    clientReq.destroy();
    res.status(504).json({ error: "Timeout" });
  });

  clientReq.write(payload);
  clientReq.end();
}

/**
 * Envia requisição SOAP com mTLS
 */
function sendWithMTLS(targetUrl, soapEnvelope, soapAction, certPem, keyPem, res) {
  const parsedUrl = new URL(targetUrl);
  const payload = Buffer.from(soapEnvelope, "utf-8");

  const options = {
    hostname: parsedUrl.hostname,
    port: parseInt(parsedUrl.port) || 443,
    path: parsedUrl.pathname + (parsedUrl.search || ""),
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "SOAPAction": soapAction ? `"${soapAction}"` : "",
      "Content-Length": payload.length,
    },
    cert: certPem,
    key: keyPem,
    rejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED !== "0",
    timeout: 30000,
  };

  const clientReq = https.request(options, (response) => {
    let data = "";
    response.on("data", (chunk) => { data += chunk; });
    response.on("end", () => {
      console.log(`[proxy] Resposta mTLS: ${response.statusCode} ${data.length} bytes`);
      res.setHeader("Content-Type", response.headers["content-type"] || "text/xml");
      res.status(response.statusCode || 200).send(data);
    });
  });

  clientReq.on("error", (err) => {
    console.error("[proxy] Erro mTLS:", err.message);
    res.status(502).json({ error: `Erro mTLS: ${err.message}` });
  });

  clientReq.on("timeout", () => {
    console.error("[proxy] Timeout na requisição mTLS");
    clientReq.destroy();
    res.status(504).json({ error: "Timeout" });
  });

  clientReq.write(payload);
  clientReq.end();
}

const server = app.listen(PORT, () => {
  console.log(`[proxy] NFS-e mTLS proxy rodando na porta ${PORT}`);
  console.log(`[proxy] Paulistana: ${PAULISTANA_URLS.producao}`);
  console.log(`[proxy] GINFES produção: ${GINFES_URLS.producao}`);
  console.log(`[proxy] GINFES homologação: ${GINFES_URLS.homologacao}`);
  console.log(`[proxy] Autenticação: ${API_KEY ? "API Key configurada" : "SEM AUTENTICAÇÃO"}`);
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
