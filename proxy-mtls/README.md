# NFS-e mTLS Proxy

Proxy leve para comunicação com a GINFES em produção usando certificado digital (mTLS).

O Supabase Edge Functions (Deno Deploy) não suporta mTLS (client certificate no handshake TLS). Este proxy resolve isso recebendo a requisição SOAP da Edge Function e encaminhando para a GINFES com o certificado digital.

## Deploy Rápido

### Railway
```bash
# Criar projeto no Railway e conectar este diretório
railway init
railway up

# Configurar variáveis de ambiente no Railway:
# PROXY_API_KEY = sua-chave-secreta-aqui
```

### Render
```bash
# Conectar repositório e configurar:
# Build Command: npm install
# Start Command: npm start
# Environment Variables: PROXY_API_KEY
```

### VPS / Docker
```bash
npm install
PROXY_PORT=3001 PROXY_API_KEY=sua-chave node server.js
```

### Docker
```bash
docker build -t nfse-mtls-proxy .
docker run -p 3001:3001 -e PROXY_API_KEY=sua-chave nfse-mtls-proxy
```

## Variáveis de Ambiente

| Variável | Descrição | Default |
|----------|-----------|---------|
| `PROXY_PORT` | Porta do servidor | `3001` |
| `PROXY_API_KEY` | Chave de autenticação (obrigatória em produção) | vazio |

## Uso

### Health Check
```bash
curl https://seu-proxy.railway.app/health \
  -H "X-API-Key: sua-chave"
```

### Enviar requisição SOAP
```bash
curl -X POST https://seu-proxy.railway.app/proxy-ginfes \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua-chave" \
  -d '{
    "soapEnvelope": "<soap12:Envelope>...</soap12:Envelope>",
    "certPem": "-----BEGIN CERTIFICATE-----\n...",
    "keyPem": "-----BEGIN PRIVATE KEY-----\n...",
    "ambiente": "producao"
  }'
```

### Sem mTLS (homologação)
```bash
curl -X POST https://seu-proxy.railway.app/proxy-ginfes \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua-chave" \
  -d '{
    "soapEnvelope": "<soap12:Envelope>...</soap12:Envelope>",
    "ambiente": "homologacao"
  }'
```

## Segurança

- **HTTPS obrigatório em produção** - Use um reverse proxy (nginx, Cloudflare, etc.)
- **API Key** - Configure `PROXY_API_KEY` e nunca deixe vazio em produção
- **Certificados** - Os certificados PEM são enviados apenas durante a requisição e não são armazenados
- **Recomendação** - Deploy em plataforma com HTTPS automático (Railway, Render, Fly.io)