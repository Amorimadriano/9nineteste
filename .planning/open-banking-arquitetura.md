# Open Banking - Arquitetura de Banco de Dados

**Task:** #19 - Open Banking Setup e Arquitetura  
**Data:** 2026-04-16  
**Criado por:** Agente Supabase + Agente Seguranca

---

## 1. Visao Geral

Esta arquitetura implementa o suporte a Open Banking no Nine BPO Financeiro, permitindo integracao segura com instituicoes financeiras brasileiras para importacao automatica de extratos e transacoes.

### 1.1 Diagrama Entidade-Relacionamento (ER)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              OPEN BANKING - ER DIAGRAM                           │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐         ┌─────────────────────────┐
│  auth.users             │         │ open_banking_bancos_    │
│─────────────────────────│         │   suportados            │
│ id (PK)                 │         │─────────────────────────│
│ email                   │         │ id (PK)                 │
│ ...                     │         │ codigo (UNIQUE)         │
└──────────┬──────────────┘         │ nome                    │
           │                        │ api_base_url            │
           │                        │ auth_url                │
           │                        │ token_url               │
           │                        │ ativo                   │
           │                        └─────────────────────────┘
           │                                   │
           │                                   │
           │  1:N                              │
           ▼                                   │
┌─────────────────────────┐                    │
│ open_banking_integracoes│◄───────────────────┘
│─────────────────────────│
│ id (PK)                 │         ┌─────────────────────────┐
│ user_id (FK)            │────────►│ lancamentos_caixa       │
│ banco_codigo            │         │ (vinculacao opcional)   │
│ access_token_encrypted  │         │─────────────────────────│
│ refresh_token_encrypted │         │ id (PK)                 │
│ token_expires_at        │         └─────────────────────────┘
│ consent_id              │
│ consent_expires_at      │
│ status                  │
│ conta_numero            │
│ ultima_sincronizacao    │
│ created_at              │
└──────────┬──────────────┘
           │
           │  1:N
           ▼
┌─────────────────────────┐
│ open_banking_extratos   │
│─────────────────────────│
│ id (PK)                 │
│ integracao_id (FK)      │
│ transacao_id (UNIQUE)   │
│ data_transacao          │
│ descricao               │
│ valor                   │
│ tipo (entrada/saida)    │
│ conciliado              │
│ lancamento_vinculado_id │
│ ignorado                │
│ created_at              │
└─────────────────────────┘

┌─────────────────────────┐
│ open_banking_logs       │
│─────────────────────────│
│ id (PK)                 │
│ integracao_id (FK)      │
│ user_id (FK)            │
│ operacao                │
│ status                  │
│ mensagem                │
│ detalhes (JSONB)        │
│ created_at              │
└─────────────────────────┘
```

---

## 2. Tabelas

### 2.1 open_banking_integracoes

Armazena as integracoes OAuth2 com instituicoes financeiras.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | Identificador unico da integracao |
| user_id | uuid (FK) | Usuario proprietario (auth.users) |
| banco_codigo | varchar(10) | Codigo do banco (ex: "001") |
| banco_nome | varchar(100) | Nome do banco |
| access_token_encrypted | bytea | Token OAuth2 criptografado |
| refresh_token_encrypted | bytea | Refresh token criptografado |
| token_expires_at | timestamptz | Expiracao do token |
| consent_id | varchar(255) | ID do consentimento FAPI |
| consent_expires_at | timestamptz | Expiracao do consentimento |
| status | enum | ativo, expirado, revogado, erro |
| conta_numero | varchar(20) | Numero da conta (mascarado) |
| conta_tipo | varchar(50) | Tipo de conta (CC, CP) |
| agencia | varchar(20) | Numero da agencia |
| ultima_sincronizacao | timestamptz | Ultima sync de extrato |
| proxima_sincronizacao | timestamptz | Proxima sync agendada |
| auto_sync | boolean | Sync automatico ativo |
| sync_interval_minutes | integer | Intervalo em minutos |

**Constraints:**
- `unique_user_banco_conta`: Integracao unica por usuario/banco/conta
- `valid_banco_codigo`: Apenas numeros no codigo
- `valid_sync_interval`: Minimo 15 min, maximo 1440 (24h)

**Indice importante:** `idx_open_banking_integracoes_proxima_sync` para jobs de sync

---

### 2.2 open_banking_extratos

Armazena as transacoes bancarias importadas.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | Identificador unico |
| integracao_id | uuid (FK) | Integracao de origem |
| transacao_id | varchar(255) | ID da transacao no banco |
| data_transacao | date | Data da transacao |
| data_lancamento | timestamptz | Data de importacao |
| descricao | text | Descricao formatada |
| descricao_original | text | Descricao original do banco |
| valor | numeric(15,2) | Valor da transacao |
| tipo | enum | entrada ou saida |
| categoria_banco | varchar(100) | Categoria do banco |
| conciliado | boolean | Se foi vinculado a lancamento |
| lancamento_vinculado_id | uuid (FK) | Vinculo com lancamentos_caixa |
| ignorado | boolean | Se foi ignorada |
| ignorado_motivo | text | Motivo da ignorancia |

**Constraints:**
- `unique_transacao_integracao`: Transacao unica por integracao
- `valor_nao_zero`: Valor nao pode ser zero
- `data_transacao_valida`: Data nao pode ser futura

**Indice parcial:** `idx_open_banking_extratos_nao_conciliados` para pendentes

---

### 2.3 open_banking_logs

Log de auditoria para todas as operacoes.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | Identificador do log |
| integracao_id | uuid (FK) | Integracao relacionada |
| user_id | uuid (FK) | Usuario relacionado |
| operacao | varchar(100) | Tipo de operacao |
| status | varchar(50) | sucesso, erro, aviso |
| mensagem | text | Mensagem descritiva |
| detalhes | jsonb | Dados adicionais |
| request_path | varchar(255) | Endpoint acessado |
| http_status | integer | Status HTTP |

---

### 2.4 open_banking_bancos_suportados

Cadastro de bancos habilitados para Open Banking.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | Identificador |
| codigo | varchar(10) (UNIQUE) | Codigo do banco |
| nome | varchar(100) | Nome curto |
| nome_completo | varchar(255) | Nome completo |
| api_base_url | text | URL base da API |
| auth_url | text | URL de autorizacao OAuth2 |
| token_url | text | URL de token OAuth2 |
| scopes_padrao | text[] | Scopes suportados |
| ativo | boolean | Se esta disponivel |

---

## 3. Seguranca (RLS Policies)

### 3.1 open_banking_integracoes

| Operacao | Politica | Descricao |
|----------|----------|-----------|
| SELECT | Users view own | Usuario ve apenas suas integracoes |
| INSERT | Users insert own | Usuario cria apenas para si |
| UPDATE | Users update own | Usuario atualiza apenas suas |
| DELETE | Users delete own | Usuario remove apenas suas |
| SELECT | Admins view all | Admin ve todas (suporte) |

### 3.2 open_banking_extratos

| Operacao | Politica | Descricao |
|----------|----------|-----------|
| ALL | Users own extratos | Acesso apenas a extratos de integracoes do usuario |

### 3.3 open_banking_logs

| Operacao | Politica | Descricao |
|----------|----------|-----------|
| SELECT | Users view own | Ve logs de suas integracoes |
| SELECT | Admins view all | Admin ve todos |
| INSERT | Service can insert | Edge Functions podem logar |

### 3.4 open_banking_bancos_suportados

| Operacao | Politica | Descricao |
|----------|----------|-----------|
| SELECT | Authenticated view | Todos veem bancos ativos |
| ALL | Admins manage | Apenas admins gerenciam |

---

## 4. Fluxo de Seguranca

```
┌────────────────────────────────────────────────────────────────┐
│                    FLUXO DE SEGURANCA                           │
└────────────────────────────────────────────────────────────────┘

1. AUTENTICACAO OAUTH2
   ┌─────────┐                    ┌─────────┐
   │  App    │ ──(1) Auth Code──►│  Banco  │
   │  Nine   │◄──(2) Code + PKCE─│  OAuth  │
   │  BPO    │ ──(3) Exchange────►│ Server  │
   │         │◄─(4) Tokens ───────│         │
   └────┬────┘                    └─────────┘
        │
        ▼ (5) Armazena tokens criptografados
   ┌─────────┐
   │Supabase │
   │(bytea)  │
   └─────────┘

2. ACESSO A DADOS
   ┌─────────┐                    ┌─────────┐
   │  App    │ ──(1) Request ────►│  Banco  │
   │  Nine   │    + Access Token    │  API    │
   │  BPO    │◄──(2) Extrato ──────│         │
   │         │                      │         │
   └────┬────┘                      └─────────┘
        │
        ▼ (3) RLS Check
   ┌─────────┐     ┌─────────┐
   │Supabase │────►│  User   │
   │Extratos │     │  Data   │
   └─────────┘     └─────────┘

3. CONCILIACAO
   ┌─────────────┐
   │   Extrato   │◄── Transacao bancaria
   │Open Banking │
   └──────┬──────┘
          │
          │ Match/Link
          ▼
   ┌─────────────┐
   │  Lancamento │◄── Registro contabil interno
   │   Interno   │
   └─────────────┘
```

---

## 5. Edge Functions (Opcional)

### 5.1 refresh-token

Renova automaticamente tokens OAuth2 proximos da expiracao.

```typescript
// Funcao: supabase/functions/refresh-token/index.ts
// Trigger: Cron job a cada 5 minutos
// Filtro: token_expires_at < now() + interval '10 minutes'
```

### 5.2 sync-extrato

Sincroniza extratos automaticamente.

```typescript
// Funcao: supabase/functions/sync-extrato/index.ts
// Trigger: Cron job ou manual
// Filtro: auto_sync = true AND proxima_sincronizacao <= now()
```

---

## 6. Views Disponiveis

### 6.1 v_open_banking_extratos_completo

Join de extratos com dados da integracao (tokens nao expostos).

```sql
SELECT * FROM v_open_banking_extratos_completo
WHERE integracao_id = '...'
ORDER BY data_transacao DESC;
```

### 6.2 v_open_banking_conciliacao_resumo

Resumo de conciliacao por integracao.

```sql
SELECT * FROM v_open_banking_conciliacao_resumo
WHERE integracao_id = '...';
```

---

## 7. Funcoes Utilitarias

| Funcao | Descricao |
|--------|-----------|
| `open_banking_token_expirado(uuid)` | Verifica se token expirou (margem 5 min) |
| `open_banking_consent_expirado(uuid)` | Verifica se consentimento expirou |
| `open_banking_registrar_log(...)` | Insere registro de log |
| `mascarar_conta(text)` | Mascara numero da conta (****1234) |

---

## 8. Checklist de Seguranca

- [x] Tokens armazenados criptografados (bytea)
- [x] RLS policies em todas as tabelas
- [x] Acesso por user_id isolado
- [x] View sem tokens para consultas
- [x] Logs de auditoria completos
- [x] Indices para performance
- [x] Constraints de integridade
- [x] Colunas mascaradas (conta_numero)
- [x] Scopes minimos necessarios
- [x] PKCE para OAuth2

---

## 9. Proximos Passos

1. Implementar Edge Functions (refresh-token, sync-extrato)
2. Criar UI de configuracao de bancos
3. Implementar tela de conciliacao
4. Adicionar webhooks para notificacoes
5. Criar testes automatizados

---

## 10. Referencias

- [Open Banking Brasil - Documentacao](https://openbankingbrasil.org.br/)
- [FAPI 1.0 Security Profile](https://openid.net/specs/fapi-1_0-security-profile.html)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
