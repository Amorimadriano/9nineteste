# 🚀 Guia de Deploy na Hostinger

## 📋 O que você precisa

1. Build do projeto (pasta `dist/`)
2. Variáveis de ambiente configuradas
3. Acesso ao painel da Hostinger

---

## 🔨 Passo 1: Build do Projeto

```bash
# No diretório do projeto
npm run build
```

Isso criará a pasta `dist/` com os arquivos estáticos.

---

## 📁 Passo 2: Arquivos para ZIP

O que incluir no ZIP:

```
dist/                          ← PASTA PRINCIPAL (obrigatória)
├── assets/                    ← Assets compilados
├── index.html                 ← Entry point
└── ...                        ← Outros arquivos

.htaccess                      ← Configuração Apache (SPA)
```

### Arquivo .htaccess (SPA - Single Page Application)

Crie um arquivo `.htaccess` na raiz do `dist/`:

```apache
# SPA Rewrite Rules
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript
</IfModule>

# Cache static files
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/* "access plus 1 month"
    ExpiresByType text/css "access plus 1 week"
    ExpiresByType application/javascript "access plus 1 week"
</IfModule>
```

---

## 📦 Passo 3: Criar o ZIP

### Estrutura do ZIP final:

```
ninebpo-deploy.zip
├── dist/
│   ├── assets/
│   ├── index.html
│   └── ...
└── .htaccess
```

**OU** (se a Hostinger pedir pasta public_html):

```
public_html/
├── assets/
├── index.html
└── .htaccess
```

---

## 🌐 Passo 4: Configurar na Hostinger

### Via File Manager:

1. Acesse o painel da Hostinger
2. Vá em **File Manager**
3. Navegue até `public_html/`
4. Faça upload do ZIP
5. Extraia o ZIP

### Via FTP:

1. Conecte com FileZilla ou similar
2. Host: `ftp.seudominio.com`
3. Usuário: fornecido pela Hostinger
4. Senha: fornecido pela Hostinger
5. Envie os arquivos para `/public_html/`

---

## ⚙️ Passo 5: Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto (NÃO no dist/):

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica

# Open Banking (se usar)
VITE_OPEN_BANKING_CLIENT_ID=seu-client-id
VITE_OPEN_BANKING_REDIRECT_URI=https://seudominio.com/openbanking/callback
```

**IMPORTANTE:** As variáveis devem começar com `VITE_` para serem expostas ao frontend.

---

## 🔧 Configurações Adicionais

### 1. Dominio Customizado

Se usar domínio próprio:

1. Configure os DNS apontando para a Hostinger
2. No painel da Hostinger, adicione o domínio
3. Aguarde propagação (até 48h)

### 2. SSL (HTTPS)

A Hostinger oferece SSL gratuito:

1. Painel → SSL → Ativar
2. Force HTTPS nas configurações

### 3. Performance

Otimizações recomendadas:

```apache
# .htaccess adicional
# Enable GZIP
<IfModule mod_deflate.c>
    SetOutputFilter DEFLATE
    SetEnvIfNoCase Request_URI \.(?:gif|jpe?g|png)$ no-gzip dont-vary
</IfModule>

# Browser caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresDefault "access plus 1 month"
</IfModule>
```

---

## ✅ Checklist de Deploy

- [ ] Build executado sem erros (`npm run build`)
- [ ] Pasta `dist/` criada
- [ ] Arquivo `.htaccess` adicionado
- [ ] Variáveis de ambiente configuradas
- [ ] Arquivos enviados para Hostinger
- [ ] Teste de acesso no navegador
- [ ] SSL ativado (HTTPS)
- [ ] Teste de login funcionando

---

## 🐛 Troubleshooting

### Erro 404 em rotas
Verifique se o `.htaccess` está correto com as rewrites.

### Página em branco
Verifique se as variáveis de ambiente estão configuradas.

### Assets não carregam
Verifique os caminhos relativos no `index.html`.

---

## 📞 Suporte

Se tiver problemas:

1. Verifique os logs de erro da Hostinger
2. Teste localmente primeiro (`npm run preview`)
3. Verifique console do navegador (F12)

---

**Boa sorte com o deploy!** 🚀
