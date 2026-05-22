# Status da Migração Supabase

## Novo Projeto
- **Ref:** `gcmxhuadibdrumvqdrkc`
- **Nome:** ERP Financeiro
- **Região:** us-west-2
- **Postgres:** 17.6.1.121

## Concluído

### Schema
- 73 migrations aplicadas com sucesso
- Tabelas criadas: 105 tabelas no schema public
- RLS ativo em todas as tabelas
- Triggers, funções e índices migrados
- Colunas ausentes adicionadas via `fix_columns.sql`

### Dados
- ~1.9 MB de dados importados
- Tabelas principais populadas:
  - plano_contas: 142 registros
  - notas_fiscais_servico: 92 registros
  - categorias: 56 registros
  - contas_pagar: 50 registros
  - contas_receber: 33 registros
  - fornecedores: 19 registros
  - lancamentos_caixa: 15 registros
  - extrato_bancario: 15 registros
  - clientes: 11 registros
  - empresas: 4 registros
  - user_roles: 3 registros
  - certificados_nfse: 1 registro
- Usuários placeholder criados em auth.users (11 registros)
- FKs para auth.users recriadas com sucesso
- Nenhuma violação de FK cruzada entre tabelas públicas
- Sequences resetadas

### Edge Functions
- 25 funções deployadas e ativas
- Configurações verify_jwt aplicadas do config.toml

### Storage
- 5 buckets criados no novo projeto
- 45 arquivos migrados com sucesso:
  - logos: 26 arquivos
  - anexos: 18 arquivos
  - certificados-nfse: 1 arquivo
- URLs de storage no banco atualizadas (logo_url em empresas)

## Pendente (requer ação manual no Dashboard)

### 1. Auth (CRÍTICO)
- Usuários reais precisam ser migrados do projeto antigo
- Os 11 usuários placeholder não têm senhas válidas
- Solução: migrar via Management API ou pedir redefinição de senha

### 2. Edge Function Secrets (MANUAL)
Reconfigurar no Dashboard > Edge Functions > Secrets:
- SMTP (send-contador-email, test-smtp-connection, send-email-marketing)
- Pagar.me API Key (create-payment, create-payment-link, pagarme-webhook, check-payment-status)
- Serasa API (consulta-score-serasa)
- NFe.io API Key (nfeio-proxy)
- Certificados NFSe (emitir-nfse, cancelar-nfse, validar-certificado-nfse)
- Open Banking credentials (sync-open-banking)
- AI Gateway Key (ai-orchestrator, financial-commentary)
- CNPJ API (consultar-cnpj)

### 3. Auth Providers (MANUAL)
- Google, Apple, Microsoft via Dashboard
- Templates de e-mail
- Redirect URLs

## Próximos Passos
1. Reconfigurar secrets das Edge Functions
2. Migrar usuários auth reais ou configurar redefinição de senha
3. Configurar Auth Providers no Dashboard
