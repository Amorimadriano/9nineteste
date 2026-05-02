# NFS-e mTLS Proxy

Proxy leve para comunicação com a Prefeitura de São Paulo (API Paulistana) usando certificado digital (mTLS).

O Supabase Edge Functions (Deno Deploy) não suporta mTLS (client certificate no handshake TLS). Este proxy resolve isso recebendo a requisição SOAP da Edge Function e encaminhando para a prefeitura com o certificado digital.

## Deploy Rápido

### Railway
```bash
# Criar projeto no Railway e conectar este diretório
railway init
railway up

# Configurar variáveis de ambiente no Railway:
# PROXY_API_KEY = sua-chave-secreta-aqui
```

### Render (recomendado - já configurado)
O arquivo `render.yaml` já está configurado. Basta conectar o repositório no dashboard do Render.

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

## Endpoints

### Health Check
```bash
curl https://seu-proxy.onrender.com/health \
  -H "X-API-Key: sua-chave"
```

### Enviar requisição SOAP (API Paulistana)
```bash
curl -X POST https://seu-proxy.onrender.com/proxy-nfse \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua-chave" \
  -d '{
    "soapEnvelope": "<soap:Envelope>...</soap:Envelope>",
    "certPem": "-----BEGIN CERTIFICATE-----\n...",
    "keyPem": "-----BEGIN PRIVATE KEY-----\n...",
    "ambiente": "producao",
    "provider": "paulistana",
    "soapAction": "http://www.prefeitura.sp.gov.br/nfe/ConsultaNFe"
  }'
```

### Sem mTLS (homologação)
```bash
curl -X POST https://seu-proxy.onrender.com/proxy-nfse \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua-chave" \
  -d '{
    "soapEnvelope": "<soap:Envelope>...</soap:Envelope>",
    "ambiente": "homologacao",
    "provider": "paulistana"
  }'
```

### Legado GINFES (mantido para compatibilidade)
```bash
curl -X POST https://seu-proxy.onrender.com/proxy-ginfes \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua-chave" \
  -d '{
    "soapEnvelope": "<soap12:Envelope>...</soap12:Envelope>",
    "certPem": "-----BEGIN CERTIFICATE-----\n...",
    "keyPem": "-----BEGIN PRIVATE KEY-----\n...",
    "ambiente": "producao"
  }'
```

## Segurança

- **HTTPS obrigatório em produção** - Use um reverse proxy (nginx, Cloudflare, etc.)
- **API Key** - Configure `PROXY_API_KEY` e nunca deixe vazio em produção
- **Certificados** - Os certificados PEM são enviados apenas durante a requisição e não são armazenados
- **Recomendação** - Deploy em plataforma com HTTPS automático (Railway, Render, Fly.io)