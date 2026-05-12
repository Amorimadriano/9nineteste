# NFS-e (Nota Fiscal de Serviço Eletrônica) - Arquitetura

> **Projeto:** ninebpofinanceiro  
> **Task:** #27 - NFS-e Arquitetura e Banco de Dados  
> **Data:** 2025-04-16  
> **Agentes:** @agente-supabase + @agente-seguranca  
> **Integração:** Prefeitura de São Paulo (Paulistana)

---

## Visão Geral

Esta arquitetura implementa a emissão de Notas Fiscais de Serviço Eletrônicas (NFS-e) integrada com a Prefeitura de São Paulo, seguindo o padrão ABRASF e o sistema **NFS-e Paulistana**.

---

## Estrutura do Banco de Dados

### Tabela: `nfs_e_emitentes`

Configuração por empresa para emissão de NFS-e.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | PK | Identificador único |
| `empresa_id` | UUID | FK | Referência à empresa |
| `cnpj_emitente` | VARCHAR(14) | Sim | CNPJ do emitente (somente números) |
| `inscricao_municipal` | VARCHAR(20) | - | Inscrição municipal |
| `razao_social` | VARCHAR(150) | Sim | Razão social do emitente |
| `nome_fantasia` | VARCHAR(60) | - | Nome fantasia |
| `endereco` | JSONB | Sim | Endereço estruturado |
| `certificado_digital` | TEXT | - | Certificado PKCS12 **criptografado** |
| `senha_certificado` | TEXT | - | Senha do certificado **criptografada** |
| `ambiente` | ENUM | Sim | `producao` ou `homologacao` |
| `proximo_numero_nota` | INTEGER | Sim | Próximo número (default: 1) |
| `serie_nota` | VARCHAR(3) | Sim | Série da nota (default: '1') |
| `regime_tributario` | ENUM | Sim | `simples_nacional`, `lucro_presumido`, `lucro_real` |
| `aliquota_iss` | DECIMAL(5,2) | Sim | Alíquota ISS padrão (default: 2.0) |
| `item_lista_servicos` | VARCHAR(5) | - | Código da LC 116 |
| `cnae` | VARCHAR(7) | - | Código CNAE |
| `codigo_tributacao_municipio` | VARCHAR(20) | - | Código de tributação municipal |
| `ativo` | BOOLEAN | Sim | Status do emitente |

**Estrutura do JSON `endereco`:**
```json
{
  "logradouro": "Rua das Flores",
  "numero": "123",
  "complemento": "Sala 45",
  "bairro": "Centro",
  "cidade": "São Paulo",
  "uf": "SP",
  "cep": "01001000"
}
```

---

### Tabela: `nfs_e_notas`

Notas fiscais de serviço emitidas.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | PK | Identificador único |
| `emitente_id` | UUID | FK | Referência ao emitente |
| `empresa_id` | UUID | FK | Referência à empresa |
| `numero_nota` | INTEGER | Sim | Número da nota fiscal |
| `serie` | VARCHAR(3) | Sim | Série da nota |
| `data_emissao` | TIMESTAMPTZ | Sim | Data de emissão |
| `competencia` | DATE | Sim | Competência (mês/ano) |
| `status` | ENUM | Sim | `rascunho`, `enviando`, `autorizada`, `rejeitada`, `cancelada` |
| `protocolo_autorizacao` | VARCHAR(50) | - | Protocolo da prefeitura |
| `codigo_verificacao` | VARCHAR(50) | - | Código para consulta pública |
| `link_pdf` | TEXT | - | URL do PDF |
| `link_xml` | TEXT | - | URL do XML |
| `tomador_tipo` | ENUM | Sim | `cpf` ou `cnpj` |
| `tomador_documento` | VARCHAR(14) | Sim | CPF/CNPJ do tomador |
| `tomador_razao_social` | VARCHAR(150) | - | Razão social do tomador |
| `tomador_endereco` | JSONB | - | Endereço do tomador |
| `tomador_email` | VARCHAR(100) | - | Email do tomador |
| `servico_descricao` | TEXT | Sim | Descrição do serviço |
| `servico_valor` | DECIMAL(15,2) | Sim | Valor do serviço |
| `servico_deducoes` | DECIMAL(15,2) | - | Deduções |
| `servico_base_calculo` | DECIMAL(15,2) | Sim | Base de cálculo (calculado) |
| `servico_aliquota` | DECIMAL(5,2) | Sim | Alíquota ISS |
| `servico_iss_retido` | BOOLEAN | Sim | ISS retido? |
| `servico_valor_iss` | DECIMAL(15,2) | Sim | Valor do ISS (calculado) |
| `servico_valor_liquido` | DECIMAL(15,2) | Sim | Valor líquido (calculado) |
| `retencoes_pis` | DECIMAL(15,2) | - | Retenção PIS |
| `retencoes_cofins` | DECIMAL(15,2) | - | Retenção COFINS |
| `retencoes_inss` | DECIMAL(15,2) | - | Retenção INSS |
| `retencoes_ir` | DECIMAL(15,2) | - | Retenção IR |
| `retencoes_csll` | DECIMAL(15,2) | - | Retenção CSLL |
| `mensagem_fiscal` | TEXT | - | Mensagem adicional |
| `rascunho` | BOOLEAN | Sim | É rascunho? |
| `enviada_prefeitura_em` | TIMESTAMPTZ | - | Data de envio à prefeitura |
| `cancelada_em` | TIMESTAMPTZ | - | Data de cancelamento |
| `motivo_cancelamento` | TEXT | - | Motivo do cancelamento |
| `error_log` | JSONB | - | Log de erros |

**Estrutura do JSON `error_log`:**
```json
{
  "codigo": "E001",
  "mensagem": "CNPJ inválido",
  "timestamp": "2025-04-16T22:30:00Z",
  "raw_response": "..."
}
```

---

### Tabela: `nfs_e_rascunhos`

Autosave de rascunhos de notas fiscais.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | PK | Identificador único |
| `empresa_id` | UUID | FK | Referência à empresa |
| `usuario_id` | UUID | FK | Referência ao usuário |
| `dados` | JSONB | Sim | Snapshot dos campos |
| `ultimo_autosave` | TIMESTAMPTZ | Sim | Último autosave |

**Restrição:** Um usuário pode ter apenas um rascunho por empresa (`UNIQUE(empresa_id, usuario_id)`).

---

## Funções do Banco

### `obter_proximo_numero_nota(emitente_id UUID)`

**Retorna:** INTEGER

Obtém o próximo número de nota para um emitente e incrementa o contador.

```sql
SELECT obter_proximo_numero_nota('uuid-do-emitente');
```

**Segurança:** Usa `FOR UPDATE` para evitar concorrência (race conditions).

---

### `mascarar_cnpj(cnpj TEXT)`

**Retorna:** TEXT

Mascara CNPJ exibindo apenas os dígitos centrais.

```sql
SELECT mascarar_cnpj('11222333000181');
-- Retorna: ***.222.333/01**
```

---

### `mascarar_cpf(cpf TEXT)`

**Retorna:** TEXT

Mascara CPF exibindo apenas os dígitos centrais.

```sql
SELECT mascarar_cpf('12345678901');
-- Retorna: ***.456.789-01
```

---

### `validar_campos_obrigatorios(nota_id UUID)`

**Retorna:** JSONB

Valida campos obrigatórios antes do envio à prefeitura.

```sql
SELECT validar_campos_obrigatorios('uuid-da-nota');
-- Retorna: {"valido": true, "erros": []}
-- Ou: {"valido": false, "erros": [{"campo": "...", "mensagem": "..."}]}
```

---

### `limpar_rascunhos_antigos()`

**Retorna:** INTEGER

Remove rascunhos com mais de 30 dias sem atualização.

```sql
SELECT limpar_rascunhos_antigos();
-- Retorna: número de rascunhos removidos
```

---

## Segurança

### Row Level Security (RLS)

Todas as tabelas possuem RLS habilitado com isolamento por empresa:

```sql
-- Exemplo de política
CREATE POLICY nfse_emitentes_isolamento ON nfs_e_emitentes
    FOR ALL TO authenticated
    USING (empresa_id IN (
        SELECT empresa_id FROM usuario_empresas WHERE usuario_id = auth.uid()
    ));
```

### Criptografia de Dados Sensíveis

Os campos `certificado_digital` e `senha_certificado` devem ser criptografados:

**Opções:**
1. **pgsodium** (recomendado no Supabase):
   ```sql
   SELECT pgsodium.crypto_secretbox_encrypt(data, key, nonce);
   ```

2. **Application Layer:** Criptografar antes de enviar ao banco

3. **Supabase Vault:** Usar para armazenar chaves de criptografia

---

## Triggers Automáticos

| Trigger | Tabela | Descrição |
|---------|--------|-----------|
| `trg_calcular_valores_nfse` | `nfs_e_notas` | Calcula base, ISS e valor líquido |
| `trg_nfse_emitentes_updated_at` | `nfs_e_emitentes` | Atualiza `updated_at` |
| `trg_nfse_notas_updated_at` | `nfs_e_notas` | Atualiza `updated_at` |
| `trg_nfse_rascunhos_updated_at` | `nfs_e_rascunhos` | Atualiza `updated_at` |

---

## Fluxo de Status

```
[rascunho] -- envia --> [enviando] -- sucesso --> [autorizada]
    |                          |
    |                          +-- erro --> [rejeitada] -- corrige --> [rascunho]
    |
    +-- cancela --> [cancelada]
```

### Status:

| Status | Descrição |
|--------|-----------|
| `rascunho` | Nota em edição, não enviada |
| `enviando` | Nota em processamento |
| `autorizada` | Nota aceita pela prefeitura |
| `rejeitada` | Nota rejeitada (erros de validação) |
| `cancelada` | Nota cancelada |

---

## Validações Implementadas

### Constraints:

- **CNPJ:** 14 dígitos numéricos
- **CPF:** 11 dígitos numéricos
- **Alíquota ISS:** Entre 0 e 100
- **Próximo número:** Deve ser maior que 0
- **Endereço:** Campos obrigatórios em JSONB
- **Competência:** Não pode ser mais de 1 mês no futuro

### Validações de Negócio:

- Nota autorizada não pode ser editada
- Cancelamento só em até 180 dias (regra Paulistana)
- ISS retido só para tomadores PJ

---

## Integração com Prefeitura SP

### Endpoints (Homologação):

```
WSDL: https://testenfseseq.prefeitura.sp.gov.br/ws/wsrp.asmx
```

### Endpoints (Produção):

```
WSDL: https://nfe.prefeitura.sp.gov.br/ws/wsrp.asmx
```

### Operações Suportadas:

1. **Envio de RPS:** `EnvioLoteRPS`
2. **Consulta:** `ConsultaNFSe`
3. **Cancelamento:** `CancelamentoNFSe`
4. **Consulta Lote:** `ConsultaLote`

---

## Próximos Passos

- [ ] Task #28: NFS-e Testes e Validação
- [ ] Task #29: NFS-e Integração API Prefeitura SP
- [ ] Task #30: NFS-e Interface de Emissão
- [ ] Task #31: NFS-e Sincronização e Status
- [ ] Task #32: Criar testes completos para integração NFS-e

---

## Referências

- [ABRASF - Padrão NFS-e](https://www.abrasf.org.br/)
- [Prefeitura de São Paulo - NFS-e](https://nfe.prefeitura.sp.gov.br/)
- [Lei Complementar 116/2003](http://www.planalto.gov.br/legislacao/legislacao-ava/lc/116-2003.html)

---

## Arquivos Relacionados

- `supabase/migrations/20250416224000_nfse_arquitetura_prefeitura_sp.sql`
