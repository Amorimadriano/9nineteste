# APIs de Contabilidade (ERP Contabeis) - Arquitetura

> **Projeto:** ninebpofinanceiro  
> **Task:** #33 - APIs Contabilidade - Arquitetura e Banco  
> **Data:** 2026-04-16  
> **Agentes:** @agente-supabase + @agente-seguranca

---

## Visao Geral

Esta arquitetura implementa integracao com ERPs contabeis, permitindo:

- **Exportacao:** Contas a pagar, contas a receber e lancamentos de caixa para o ERP
- **Importacao:** Lancamentos contabeis do ERP para conciliacao
- **Mapeamento:** Configuravel entre categorias do sistema e contas contabeis do ERP
- **Sincronizacao:** Processos automatizados e auditaveis

### ERPs Suportados

| ERP | Tipo | Protocolo | Status |
|-----|------|-----------|--------|
| TOTVS Protheus | `totvs_protheus` | REST API | Implementado |
| Sankhya | `sankhya` | REST API | Implementado |
| Dominio | `dominio` | REST API | Implementado |
| Alterdata | `alterdata` | REST API | Implementado |
| Contabilista (outros) | `contabilista` | Manual | Implementado |
| Outros | `outro` | Variado | Base implementada |

---

## Diagrama Entidade-Relacionamento

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ERP CONTABIL - ER DIAGRAM                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐
│  auth.users             │
│─────────────────────────│
│ id (PK)                 │
│ email                   │
└──────────┬──────────────┘
           │
           │ 1:N
           ▼
┌─────────────────────────┐         ┌─────────────────────────┐
│ contabilidade_erp_config│◄───────│  categorias             │
│─────────────────────────│         │  (vinculo opcional)     │
│ id (PK)                 │         │─────────────────────────│
│ user_id (FK)            │         │ id (PK)                 │
│ erp_tipo (enum)         │         │ tipo (receita/despesa)  │
│ nome_configuracao       │         └─────────────────────────┘
│ api_url                 │
│ api_key (encrypted)     │
│ api_secret (encrypted)  │
│ usuario                 │         ┌─────────────────────────┐
│ senha (encrypted)       │         │ lancamentos_caixa       │
│ token_acesso (enc.)     │         │ (vinculo opcional)      │
│ token_refresh (enc.)    │         │─────────────────────────│
│ codigo_empresa_erp      │         │ id (PK)                 │
│ codigo_filial           │         │ tipo                    │
│ ultima_sincronizacao    │         │ valor                   │
│ status_conexao          │         │ data_lancamento         │
└──────────┬──────────────┘         └─────────────────────────┘
           │
           │ 1:N
           ▼
┌─────────────────────────┐
│ contabilidade_          │         ┌─────────────────────────┐
│ mapeamento_contas       │         │ contas_a_pagar          │
│─────────────────────────│         │ contas_a_receber        │
│ id (PK)                 │         │ (exportadas para ERP)   │
│ config_id (FK)          │         └─────────────────────────┘
│ categoria_id (FK)       │
│ tipo_lancamento (enum)  │
│ conta_contabil_erp      │
│ centro_custo_erp        │
│ historico_padrao        │
└─────────────────────────┘

           │
           │ 1:N
           ▼
┌─────────────────────────┐
│ contabilidade_          │         ┌─────────────────────────┐
│ sincronizacao           │────────►│ contabilidade_          │
│─────────────────────────│         │ lancamentos_importados  │
│ id (PK)                 │         │─────────────────────────│
│ config_id (FK)          │         │ id (PK)                 │
│ tipo_operacao (enum)    │         │ sincronizacao_id (FK)   │
│ status (enum)           │         │ lancamento_erp_id       │
│ periodo_inicio/fim      │         │ data_lancamento         │
│ total_registros         │         │ conta_contabil          │
│ registros_sucesso       │         │ valor                   │
│ registros_erro          │         │ conciliado              │
│ dados_exportados        │         │ lancamento_vinculado_id │
│ resposta_erp (JSONB)    │         │ dados_originais (JSONB) │
│ erros_detalhados (JSONB)│         └─────────────────────────┘
└─────────────────────────┘
```

---

## Estrutura do Banco de Dados

### 1. Tabela: `contabilidade_erp_config`

Configuracoes de integracao com ERPs contabeis.

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `id` | UUID | PK | Identificador unico |
| `user_id` | UUID | FK | Usuario proprietario |
| `erp_tipo` | ENUM | Sim | Tipo do ERP (totvs_protheus, sankhya, etc) |
| `nome_configuracao` | VARCHAR(100) | Sim | Nome amigavel da configuracao |
| `ativo` | BOOLEAN | Sim | Status da configuracao |
| `ambiente` | ENUM | Sim | `producao` ou `homologacao` |
| `api_url` | TEXT | - | URL base da API |
| `api_key` | BYTEA | - | **Criptografado** - Chave API |
| `api_secret` | BYTEA | - | **Criptografado** - Secret API |
| `usuario` | VARCHAR(100) | - | Usuario de acesso |
| `senha` | BYTEA | - | **Criptografado** - Senha |
| `token_acesso` | BYTEA | - | **Criptografado** - Token OAuth |
| `token_refresh` | BYTEA | - | **Criptografado** - Refresh Token |
| `token_expira_em` | TIMESTAMPTZ | - | Data de expiracao do token |
| `codigo_empresa_erp` | VARCHAR(50) | - | Codigo da empresa no ERP |
| `codigo_filial` | VARCHAR(50) | - | Codigo da filial no ERP |
| `configuracoes_extras` | JSONB | - | Configuracoes dinamicas por ERP |
| `ultima_sincronizacao` | TIMESTAMPTZ | - | Ultima sincronizacao realizada |
| `status_conexao` | ENUM | Sim | `conectado`, `desconectado`, `erro` |
| `error_log` | JSONB | - | Log de erros da ultima tentativa |

**Exemplo de `configuracoes_extras`:**

```json
{
  "totvs": {
    "versao": "12.1.33",
    "banco": "MSSQL",
    "schema": "dbo"
  },
  "sankhya": {
    "versao_api": "v1",
    "formato_data": "YYYY-MM-DD",
    "timezone": "America/Sao_Paulo"
  },
  "dominio": {
    "modulo": "contabilidade",
    "versao": "2024"
  }
}
```

---

### 2. Tabela: `contabilidade_mapeamento_contas`

Mapeamento entre categorias do sistema e contas contabeis do ERP.

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `id` | UUID | PK | Identificador unico |
| `user_id` | UUID | FK | Usuario proprietario |
| `config_id` | UUID | FK | Configuracao ERP |
| `tipo_lancamento` | ENUM | Sim | `receita`, `despesa`, `transferencia`, `imposto`, `folha` |
| `categoria_id` | UUID | FK | Categoria do sistema |
| `conta_contabil_erp` | VARCHAR(50) | Sim | Codigo da conta no ERP (ex: "1.1.01.001") |
| `historico_padrao` | TEXT | - | Historico padrao para o lancamento |
| `centro_custo_erp` | VARCHAR(50) | - | Centro de custo no ERP |
| `ativo` | BOOLEAN | Sim | Status do mapeamento |

**Exemplos de `conta_contabil_erp` por sistema:**

| ERP | Formato Conta | Exemplo |
|-----|---------------|---------|
| TOTVS Protheus | 5 niveis | `1.1.01.001` |
| Sankhya | Plano de 8 digitos | `11101001` |
| Dominio | Ponto flutuante | `1.1.01.0001` |
| Alterdata | Grau variavel | `1.01.001` |

---

### 3. Tabela: `contabilidade_sincronizacao`

Registro de operacoes de sincronizacao.

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `id` | UUID | PK | Identificador unico |
| `config_id` | UUID | FK | Configuracao ERP |
| `user_id` | UUID | FK | Usuario proprietario |
| `tipo_operacao` | ENUM | Sim | Tipo de operacao |
| `status` | ENUM | Sim | `pendente`, `processando`, `sucesso`, `parcial`, `erro` |
| `periodo_inicio` | DATE | Sim | Inicio do periodo |
| `periodo_fim` | DATE | Sim | Fim do periodo |
| `total_registros` | INTEGER | - | Total de registros processados |
| `registros_sucesso` | INTEGER | - | Registros com sucesso |
| `registros_erro` | INTEGER | - | Registros com erro |
| `dados_exportados` | JSONB | - | Snapshot dos dados exportados |
| `resposta_erp` | JSONB | - | Resposta completa do ERP |
| `erros_detalhados` | JSONB | - | Lista de erros detalhados |
| `iniciado_em` | TIMESTAMPTZ | - | Inicio da sincronizacao |
| `finalizado_em` | TIMESTAMPTZ | - | Termino da sincronizacao |
| `iniciado_por` | UUID | FK | Usuario que iniciou |

**Tipos de Operacao:**

| Operacao | Descricao |
|----------|-----------|
| `exportar_contas_pagar` | Exporta contas a pagar para o ERP |
| `exportar_contas_receber` | Exporta contas a receber para o ERP |
| `exportar_caixa` | Exporta lancamentos de caixa para o ERP |
| `importar_lancamentos` | Importa lancamentos do ERP |
| `importar_saldo` | Importa saldos de contas |
| `conciliar` | Executa conciliacao automatica |

---

### 4. Tabela: `contabilidade_lancamentos_importados`

Lancamentos contabeis importados do ERP.

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `id` | UUID | PK | Identificador unico |
| `sincronizacao_id` | UUID | FK | Sincronizacao de origem |
| `config_id` | UUID | FK | Configuracao ERP |
| `user_id` | UUID | FK | Usuario proprietario |
| `lancamento_erp_id` | VARCHAR(255) | Sim | ID original no ERP |
| `data_lancamento` | DATE | Sim | Data do lancamento |
| `data_competencia` | DATE | Sim | Data de competencia |
| `tipo` | ENUM | Sim | `debito` ou `credito` |
| `conta_contabil` | VARCHAR(50) | Sim | Codigo da conta contabil |
| `historico` | TEXT | - | Historico do lancamento |
| `valor` | NUMERIC(15,2) | Sim | Valor do lancamento |
| `centro_custo` | VARCHAR(50) | - | Centro de custo |
| `documento` | VARCHAR(100) | - | Numero do documento |
| `conciliado` | BOOLEAN | Sim | Se foi conciliado |
| `lancamento_financeiro_vinculado_id` | UUID | FK | Vinculo com lancamento_caixa |
| `dados_originais` | JSONB | Sim | Dados brutos do ERP |

---

## Funcoes do Banco

### `obter_mapeamento_contas(config_id UUID)`

Retorna mapa JSONB de contas para uma configuracao.

```sql
SELECT public.obter_mapeamento_contas('uuid-da-config');
-- Retorna:
-- {
--   "categoria-uuid-1_receita": {"conta_contabil": "1.1.01", "centro_custo": "1000"},
--   "categoria-uuid-2_despesa": {"conta_contabil": "2.1.01", "centro_custo": "2000"}
-- }
```

---

### `validar_configuracao_erp(config_id UUID)`

Valida se uma configuracao esta completa.

```sql
SELECT public.validar_configuracao_erp('uuid-da-config');
-- Retorna:
-- {
--   "valido": true/false,
--   "erros": ["lista", "de", "erros"],
--   "config_id": "...",
--   "erp_tipo": "totvs_protheus",
--   "possui_mapeamento": true
-- }
```

**Validacoes por ERP:**

| ERP | Campos Obrigatorios |
|-----|---------------------|
| TOTVS Protheus | api_url, usuario, codigo_empresa_erp |
| Sankhya | api_url, api_key |
| Dominio | api_url, usuario, senha |
| Alterdata | api_url, token_acesso |

---

### `obter_ultima_sincronizacao(config_id UUID, tipo_operacao TEXT)`

Retorna dados da ultima sincronizacao.

```sql
-- Ultima sincronizacao geral
SELECT * FROM public.obter_ultima_sincronizacao('uuid-da-config');

-- Ultima sincronizacao especifica
SELECT * FROM public.obter_ultima_sincronizacao('uuid-da-config', 'exportar_contas_pagar');
```

---

### `registrar_sincronizacao(...)` e `finalizar_sincronizacao(...)`

Gerenciam o ciclo de vida de uma sincronizacao.

```sql
-- Iniciar sincronizacao
SELECT public.registrar_sincronizacao(
    'uuid-config',
    'uuid-user',
    'exportar_contas_pagar',
    '2026-04-01'::DATE,
    '2026-04-30'::DATE
);

-- Finalizar sincronizacao
SELECT public.finalizar_sincronizacao(
    'uuid-sinc',
    'sucesso',
    100,    -- total
    95,     -- sucesso
    5,      -- erro
    '{"erp_response": "..."}'::jsonb,
    '[{"registro": 10, "erro": "Valor invalido"}]'::jsonb
);
```

---

### `conciliar_lancamento(lancamento_importado_id, lancamento_caixa_id)`

Vincula um lancamento importado a um lancamento interno.

```sql
SELECT public.conciliar_lancamento(
    'uuid-lancamento-importado',
    'uuid-lancamento-caixa'
);
-- Retorna: true (sucesso) ou false (nao encontrado)
```

---

## Seguranca (RLS)

### Politicas Implementadas

Todas as tabelas possuem **Row Level Security** com isolamento por usuario:

| Tabela | Select | Insert | Update | Delete |
|--------|--------|--------|--------|--------|
| `contabilidade_erp_config` | Proprias | Proprias | Proprias | Proprias |
| `contabilidade_mapeamento_contas` | Proprias | Proprias | Proprias | Proprias |
| `contabilidade_sincronizacao` | Proprias | Proprias | Proprias | Proprias |
| `contabilidade_lancamentos_importados` | Proprias | Proprias | Proprias | Proprias |

### Criptografia

Campos sensiveis sao armazenados em formato **criptografado** (BYTEA):

- `api_key`
- `api_secret`
- `senha`
- `token_acesso`
- `token_refresh`

**Recomendacao de uso:**

```sql
-- Usar pgsodium para criptografia
SELECT pgsodium.crypto_secretbox_encrypt(
    'minha-api-key',
    (SELECT key_id FROM pgsodium.key WHERE name = 'erp_secrets'),
    gen_random_bytes(24)
);
```

---

## Exemplos de Mapeamento por ERP

### TOTVS Protheus

```sql
-- Configuracao
INSERT INTO public.contabilidade_erp_config (
    user_id, erp_tipo, nome_configuracao, ambiente,
    api_url, usuario, codigo_empresa_erp, codigo_filial,
    configuracoes_extras
) VALUES (
    'uuid-user',
    'totvs_protheus',
    'Protheus - Matriz',
    'producao',
    'http://servidor:8080/rest',
    'usuario_rest',
    '01',
    '01',
    '{"versao": "12.1.33", "banco": "MSSQL", "schema": "dbo"}'
);

-- Mapeamento de contas
INSERT INTO public.contabilidade_mapeamento_contas (
    user_id, config_id, tipo_lancamento, categoria_id,
    conta_contabil_erp, historico_padrao, centro_custo_erp
) VALUES
-- Receitas
('uuid-user', 'uuid-config', 'receita', 'cat-servicos', '3.1.01.001', 'Receita de Servicos', '1000'),
('uuid-user', 'uuid-config', 'receita', 'cat-produtos', '3.1.02.001', 'Receita de Produtos', '1000'),

-- Despesas
('uuid-user', 'uuid-config', 'despesa', 'cat-aluguel', '2.1.01.001', 'Despesa com Aluguel', '2000'),
('uuid-user', 'uuid-config', 'despesa', 'cat-salarios', '2.1.02.001', 'Folha de Pagamento', '3000'),
('uuid-user', 'uuid-config', 'despesa', 'cat-fornecedores', '2.1.03.001', 'Fornecedores', '2000');
```

---

### Sankhya

```sql
-- Configuracao
INSERT INTO public.contabilidade_erp_config (
    user_id, erp_tipo, nome_configuracao, ambiente,
    api_url, configuracoes_extras
) VALUES (
    'uuid-user',
    'sankhya',
    'Sankhya API',
    'producao',
    'https://api.sankhya.com.br/v1',
    '{"versao_api": "v1", "formato_data": "YYYY-MM-DD"}'
);

-- Mapeamento de contas (Sankhya usa plano de 8 digitos)
INSERT INTO public.contabilidade_mapeamento_contas (
    user_id, config_id, tipo_lancamento, categoria_id,
    conta_contabil_erp, historico_padrao
) VALUES
-- Receitas
('uuid-user', 'uuid-config', 'receita', 'cat-servicos', '31101001', 'Receita de Servicos'),
('uuid-user', 'uuid-config', 'receita', 'cat-produtos', '31101002', 'Receita de Produtos'),

-- Despesas
('uuid-user', 'uuid-config', 'despesa', 'cat-aluguel', '22101001', 'Despesa com Aluguel'),
('uuid-user', 'uuid-config', 'despesa', 'cat-salarios', '22201001', 'Folha de Pagamento'),
('uuid-user', 'uuid-config', 'despesa', 'cat-impostos', '22301001', 'Impostos a Pagar');
```

---

### Dominio Sistemas

```sql
-- Configuracao
INSERT INTO public.contabilidade_erp_config (
    user_id, erp_tipo, nome_configuracao, ambiente,
    api_url, usuario, configuracoes_extras
) VALUES (
    'uuid-user',
    'dominio',
    'Dominio - Contabil',
    'producao',
    'https://api.dominio.com.br/contabil',
    'usuario_api',
    '{"modulo": "contabilidade", "versao": "2024"}'
);

-- Mapeamento de contas
INSERT INTO public.contabilidade_mapeamento_contas (
    user_id, config_id, tipo_lancamento, categoria_id,
    conta_contabil_erp, centro_custo_erp
) VALUES
-- Receitas
('uuid-user', 'uuid-config', 'receita', 'cat-servicos', '1.1.01.0001', '1000'),
('uuid-user', 'uuid-config', 'receita', 'cat-produtos', '1.1.01.0002', '1000'),

-- Despesas
('uuid-user', 'uuid-config', 'despesa', 'cat-aluguel', '2.1.01.0001', '2000'),
('uuid-user', 'uuid-config', 'despesa', 'cat-salarios', '2.1.02.0001', '3000'),
('uuid-user', 'uuid-config', 'despesa', 'cat-fornecedores', '2.1.03.0001', '2000');
```

---

### Alterdata

```sql
-- Configuracao
INSERT INTO public.contabilidade_erp_config (
    user_id, erp_tipo, nome_configuracao, ambiente,
    api_url, configuracoes_extras
) VALUES (
    'uuid-user',
    'alterdata',
    'Alterdata - Contabil',
    'producao',
    'https://api.alterdata.com.br/v2',
    '{"versao": "2.0", "formato": "json"}'
);

-- Mapeamento de contas (Alterdata usa grau variavel)
INSERT INTO public.contabilidade_mapeamento_contas (
    user_id, config_id, tipo_lancamento, categoria_id,
    conta_contabil_erp, historico_padrao
) VALUES
-- Receitas
('uuid-user', 'uuid-config', 'receita', 'cat-servicos', '1.01.001', 'Receita de Servicos'),
('uuid-user', 'uuid-config', 'receita', 'cat-produtos', '1.01.002', 'Venda de Produtos'),

-- Despesas
('uuid-user', 'uuid-config', 'despesa', 'cat-aluguel', '2.01.001', 'Aluguel'),
('uuid-user', 'uuid-config', 'despesa', 'cat-salarios', '2.01.002', 'Salarios');
```

---

## Fluxos de Integracao

### Fluxo 1: Exportar Contas a Pagar

```
┌─────────┐     ┌─────────────────────────┐     ┌─────────┐
│  App    │────►│  contas_a_pagar         │────►│  ERP    │
│  Nine   │     │  (filtro: periodo)      │     │Contabil │
│  BPO    │     └─────────────────────────┘     │         │
└────┬────┘                    │                └────┬────┘
     │                         │                     │
     │                         ▼                     │
     │              ┌─────────────────────────┐      │
     │              │ contabilidade_sinc      │      │
     │              │ (registro da operacao)  │◄─────┘
     │              └─────────────────────────┘
     │
     │              ┌─────────────────────────┐
     └─────────────►│ Mapeia categorias para│
                    │ contas contabeis      │
                    └─────────────────────────┘
```

### Fluxo 2: Importar Lancamentos

```
┌─────────┐     ┌─────────────────────────┐     ┌─────────┐
│  App    │◄────│ contabilidade_          │◄────│  ERP    │
│  Nine   │     │ lancamentos_importados  │     │Contabil │
│  BPO    │     └─────────────────────────┘     │         │
└────┬────┘                    │                └─────────┘
     │                         │
     │              ┌─────────────────────────┐
     └─────────────►│ Conciliacao automatica │
                    │ ou manual            │
                    └─────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────────┐
                    │ lancamentos_caixa       │
                    │ (vinculo opcional)      │
                    └─────────────────────────┘
```

---

## Views Disponiveis

### `v_contabilidade_sincronizacao_resumo`

Resumo por configuracao sem dados sensiveis.

```sql
SELECT * FROM public.v_contabilidade_sincronizacao_resumo;
```

### `v_contabilidade_lancamentos_pendentes`

Lancamentos nao conciliados.

```sql
SELECT * FROM public.v_contabilidade_lancamentos_pendentes
ORDER BY data_lancamento DESC;
```

---

## Checklist de Seguranca

- [x] Tokens armazenados criptografados (BYTEA)
- [x] RLS policies em todas as tabelas
- [x] Acesso por user_id isolado
- [x] Colunas mascaradas para exibicao
- [x] Logs de auditoria completos (tabela sincronizacao)
- [x] Indices para performance
- [x] Constraints de integridade
- [x] Views sem dados sensiveis

---

## Proximos Passos

1. **Task #34:** Criar testes automatizados para APIs Contabilidade
2. **Task #35:** Interface de configuracao de ERPs
3. **Task #36:** Implementar integracao com cada ERP
4. **Task #37:** Sincronizacao automatica agendada

---

## Arquivos Relacionados

- `supabase/migrations/20260416232335_apis_contabilidade_arquitetura.sql`

---

## Referencias

- [TOTVS Protheus REST API](https://tdn.totvs.com/)
- [Sankhya API Documentation](https://developer.sankhya.com.br/)
- [Dominio Sistemas API](https://www.dominio.com.br/)
- [Alterdata API](https://www.alterdata.com.br/)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Vault (pgsodium)](https://supabase.com/docs/guides/database/vault)
