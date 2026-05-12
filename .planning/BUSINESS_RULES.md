# Nine BPO Financeiro - Regras de Negócio

Documentação completa das regras de negócio do sistema Nine BPO Financeiro.

---

## 1. Regras de Conciliação Bancária

### 1.1 Conceito
A conciliação bancária é o processo de comparar transações importadas do extrato bancário (OFX/CSV) com os lançamentos do sistema para garantir que o saldo contábil corresponda ao saldo bancário.

### 1.2 Fluxo de Conciliação

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Importar OFX   │────▶│  Matching Auto     │────▶│  Conciliação    │
│  ou Manual      │     │  ou Seleção Manual │     │  Finalizada     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### 1.3 Regras de Matching

#### Matching Automático (Sistema → Extrato)
- **Critério de valor**: Diferença máxima aceitável: R$ 0,01
- **Critério de data**: Mesmo dia ou ±1 dia
- **Critério de tipo**: Entrada/Saída deve coincidir
- **Critério de descrição**: Não utilizado (variações entre bancos)

#### Matching Manual (Usuário)
- Usuário seleciona transação do extrato
- Usuário busca lançamento correspondente no sistema
- Sistema valida diferença de valor (máx R$ 0,01)
- Se divergente, exibe alerta e impede conciliação

### 1.4 Estados de Conciliação

| Estado | Descrição | Ações Permitidas |
|--------|-----------|------------------|
| `pendente` | Transação no extrato sem vínculo | Vincular, Excluir, Conciliar Direto |
| `conciliado` | Transação vinculada ao sistema | Desvincular, Ver detalhes |

### 1.5 Sincronização Automática (extratoSync.ts)

#### Contas a Pagar → Extrato
**Regra**: Quando status muda para "pago", cria/atualiza entrada no extrato

```typescript
if (status === "pago") {
  // Cria entrada no extrato_bancario
  // Tipo: "saida"
  // Origem: "sistema"
  // Conciliado: true (automático)
} else {
  // Remove entrada do extrato se existir
}
```

#### Contas a Receber → Extrato
**Regra**: Quando status muda para "recebido", cria/atualiza entrada no extrato

```typescript
if (status === "recebido") {
  // Cria entrada no extrato_bancario
  // Tipo: "entrada"
  // Origem: "sistema"
  // Conciliado: true (automático)
} else {
  // Remove entrada do extrato se existir
}
```

### 1.6 Divergências Detectadas

O sistema identifica automaticamente:

1. **Transações sem vínculo**: No extrato mas não no sistema
2. **Divergência de valor**: Extrato ≠ Sistema (tolerância: R$ 0,01)
3. **Divergência de saldo**: Soma das entradas/saídas divergentes

**Painel de Divergências**:
- Saldo Extrato Bancário
- Saldo Sistema (Lançamentos)
- Diferença calculada
- Lista de transações com divergência de valor
- Lista de transações sem vínculo

### 1.7 Finalização da Conciliação

**Condições para finalizar**:
- Todas as transações devem estar conciliadas OU
- Não existirem divergências de valor

**Ação**: Marca todas transações pendentes como conciliadas

---

## 2. Cálculos da DRE (Demonstrativo de Resultado)

### 2.1 Estrutura Hierárquica

```
(+) RECEITA BRUTA
    ├── 1 - Receita Com Serviços (prefixo: 1.1)
    └── 9 - Receitas Não Operacionais (prefixos: 1.2, 1.3, 1.4, 1.5)

(-) DEDUÇÕES SOBRE VENDAS
    ├── 2 - Impostos Sobre Vendas (prefixo: 2.1)
    └── 3 - Outras Deduções (prefixo: 2.2)

(=) RECEITA LÍQUIDA = Receita Bruta - Deduções

(-) CUSTOS VARIÁVEIS
    └── 4 - Custos Variáveis (prefixos: 2.4, 2.5)

(=) MARGEM DE CONTRIBUIÇÃO = Receita Líquida - Custos Variáveis
(=) % Margem de Contribuição = (Margem / Receita Líquida) × 100

(-) CUSTOS FIXOS
    ├── 5 - Gastos com Pessoal (prefixo: 2.3)
    ├── 6 - Gastos com Ocupação (prefixo: 3.3)
    ├── 7 - Gastos com Serviços de Terceiros (prefixos: 3.30, 3.31, 3.32)
    ├── 8 - Gastos com Marketing (prefixo: 3.1)
    └── 15 - Material de Escritório (prefixo: 3.311)

(=) RESULTADO OPERACIONAL = Margem de Contribuição - Custos Fixos

Resultado Não Operacional
    └── 10 - Gastos não Operacionais (prefixos: 3.4, 3.5, 4., 5.)

(=) LAIR (Lucro Antes do IR) = Resultado Operacional - Gastos Não Operacionais

(-) IMPOSTO DE RENDA E CSLL
    └── 11 - IR e CSLL (prefixos: 2.107, 2.108)

(=) LUCRO LÍQUIDO = LAIR - IR/CSLL
(=) % Margem Líquida = (Lucro Líquido / Receita Bruta) × 100
```

### 2.2 Mapeamento de Categorias

As categorias são mapeadas para a DRE através de prefixos no nome:

| Categoria DRE | Prefixos de Categoria | Tipo |
|---------------|----------------------|------|
| Receita Serviços | `1.1` | Receita |
| Receitas Não Operacionais | `1.2`, `1.3`, `1.4`, `1.5` | Receita |
| Impostos Vendas | `2.1` | Despesa |
| Outras Deduções | `2.2` | Despesa |
| Custos Variáveis | `2.4`, `2.5` | Despesa |
| Gastos Pessoal | `2.3` | Despesa |
| Gastos Ocupação | `3.3` | Despesa |
| Gastos Terceiros | `3.30`, `3.31`, `3.32` | Despesa |
| Material Escritório | `3.311` | Despesa |
| Gastos Marketing | `3.1` | Despesa |
| Gastos Não Operacionais | `3.4`, `3.5`, `4.`, `5.` | Despesa |
| IR e CSLL | `2.107`, `2.108` | Despesa |

### 2.3 Regra de Matching de Categorias

```typescript
// Prefixos mais específicos têm prioridade
const sortedItems = itemGroups.sort((a, b) => {
  const maxA = Math.max(...(a.prefixes?.map(p => p.length) || [0]));
  const maxB = Math.max(...(b.prefixes?.map(p => p.length) || [0]));
  return maxB - maxA; // Maior prefixo primeiro
});

// Cada categoria só pode ser atribuída a um grupo
const assignedCats = new Set<string>();
```

**Exemplo**: 
- Categoria "3.311 - Material de Escritório" tem prefixo 5 caracteres
- Categoria "3.31 - Serviços" tem prefixo 4 caracteres
- Resultado: "3.311" é mais específico e mapeia primeiro

### 2.4 Acumulação Mensal

```typescript
// Para cada lançamento:
const month = new Date(l.data_lancamento).getMonth(); // 0-11
catMonthly[l.categoria_id][month] += Number(l.valor);
```

### 2.5 Cálculos de Subtotais

```typescript
// Receita Bruta
receita_bruta[m] = receita_servicos[m] + receitas_nao_op[m]

// Deduções
deducoes[m] = impostos_vendas[m] + outras_deducoes[m]

// Receita Líquida
receita_liquida[m] = receita_bruta[m] - deducoes[m]

// Margem Contribuição
margem_contribuicao[m] = receita_liquida[m] - custos_variaveis[m]

// Resultado Operacional
resultado_operacional[m] = margem_contribuicao[m] - custos_fixos[m]

// LAIR
lair[m] = resultado_operacional[m] - gastos_nao_op[m]

// Lucro Líquido
lucro_liquido[m] = lair[m] - ir_csll[m]
```

### 2.6 Percentuais

| Métrica | Fórmula |
|---------|---------|
| % Margem Contribuição | `(Margem / Receita Líquida) × 100` |
| % Margem Líquida | `(Lucro Líquido / Receita Bruta) × 100` |
| Análise Vertical (AV%) | `(Valor / Receita Bruta) × 100` |
| Análise Horizontal (AH%) | `((Atual - Anterior) / Anterior) × 100` |

### 2.7 Exportação PDF

- Gera relatório completo com 12 meses + total anual
- Inclui análise vertical (AV%)
- Formatação: valores monetários em pt-BR

---

## 3. Estrutura CNAB240

### 3.1 Visão Geral

O CNAB240 é o padrão FEBRABAN para troca de arquivos entre empresas e bancos.

**Cada linha**: exatamente 240 caracteres
**Formato**: Texto plano, codificação ASCII
**Separador**: `\r\n` (CRLF)

### 3.2 Layout de Arquivo

```
Header de Arquivo (Registro 0) ─────────────┐
Header de Lote (Registro 1) ────────────────┤
    Segmentos de Detalhe (Registro 3) ──────┤
        Segmento P/A ───────────────────────┤
        Segmento Q/B ───────────────────────┤
    ... (repete para cada título/pagamento) │
Trailer de Lote (Registro 5) ─────────────┤
Trailer de Arquivo (Registro 9) ──────────┘
```

### 3.3 Tipos de Registro

| Tipo | Significado | Uso |
|------|-------------|-----|
| `0` | Header de Arquivo | 1 por arquivo |
| `1` | Header de Lote | 1 por lote de serviço |
| `3` | Detalhe | Segmentos P, Q, A, B |
| `5` | Trailer de Lote | 1 por lote |
| `9` | Trailer de Arquivo | 1 por arquivo |

### 3.4 Segmentos

#### Cobrança (Contas a Receber)
- **Segmento P**: Dados do título (boleto)
- **Segmento Q**: Dados do sacado (cliente)

#### Pagamento (Contas a Pagar)
- **Segmento A**: Dados do pagamento (TED/DOC)
- **Segmento B**: Dados complementares do favorecido

### 3.5 Remessa de Cobrança - Detalhes

#### Header de Arquivo (240 posições)

| Posição | Tamanho | Campo | Valor |
|---------|---------|-------|-------|
| 1-3 | 3 | Código Banco | "077", "341", etc |
| 4-7 | 4 | Lote | "0000" |
| 8 | 1 | Tipo Registro | "0" |
| 18 | 1 | Tipo Inscrição | "2" (CNPJ) |
| 19-32 | 14 | CNPJ | Apenas números |
| 73-102 | 30 | Nome Empresa | Razão social |
| 103-132 | 30 | Nome Banco | Nome do banco |
| 144-151 | 8 | Data Geração | DDMMAAAA |

#### Segmento P - Título (240 posições)

| Posição | Tamanho | Campo | Descrição |
|---------|---------|-------|-----------|
| 1-3 | 3 | Código Banco | "077", "341", etc |
| 4-7 | 4 | Lote | "0001" |
| 8 | 1 | Tipo Registro | "3" |
| 14 | 1 | Segmento | "P" |
| 16-17 | 2 | Código Movimento | "01" = Entrada |
| 47-57 | 11 | Nosso Número | Identificador único |
| 80-87 | 8 | Data Vencimento | DDMMAAAA |
| 88-102 | 15 | Valor | Sem ponto decimal |
| 109-110 | 2 | Espécie | "02" = DM |
| 111 | 1 | Aceite | "N" |

#### Segmento Q - Sacado (240 posições)

| Posição | Tamanho | Campo | Descrição |
|---------|---------|-------|-----------|
| 14 | 1 | Segmento | "Q" |
| 18 | 1 | Tipo Inscrição | "1"=CPF, "2"=CNPJ |
| 19-33 | 15 | Número Inscrição | CPF/CNPJ |
| 34-73 | 40 | Nome Sacado | Cliente |
| 74-113 | 40 | Endereço | Logradouro |
| 129-133 | 5 | CEP | 5 primeiros dígitos |
| 134-136 | 3 | Sufixo CEP | 3 últimos dígitos |
| 137-151 | 15 | Cidade | |
| 152-153 | 2 | UF | Estado |

### 3.6 Remessa de Pagamento - Detalhes

#### Header de Lote - Pagamento

| Posição | Tamanho | Campo | Valor |
|---------|---------|-------|-------|
| 9 | 1 | Tipo Operação | "C" (Crédito) |
| 10-11 | 2 | Tipo Serviço | "20" (Pagto Fornecedores) |
| 12-13 | 2 | Forma Lançamento | "41" (TED) |

#### Segmento A - Pagamento (240 posições)

| Posição | Tamanho | Campo | Descrição |
|---------|---------|-------|-----------|
| 14 | 1 | Segmento | "A" |
| 15 | 1 | Tipo Movimento | "0" = Inclusão |
| 21-23 | 3 | Banco Favorecido | Código do banco |
| 24-28 | 5 | Agência | Agência destino |
| 30-41 | 12 | Conta | Conta destino |
| 42 | 1 | DV Conta | Dígito verificador |
| 44-73 | 30 | Nome Favorecido | |
| 94-101 | 8 | Data Pagamento | DDMMAAAA |
| 102-104 | 3 | Tipo Moeda | "BRL" |
| 120-134 | 15 | Valor | Sem ponto decimal |

#### Segmento B - Complemento (240 posições)

| Posição | Tamanho | Campo | Descrição |
|---------|---------|-------|-----------|
| 14 | 1 | Segmento | "B" |
| 16 | 1 | Tipo Inscrição | "1"=CPF, "2"=CNPJ |
| 17-30 | 14 | Número Inscrição | CPF/CNPJ favorecido |
| 121-128 | 8 | Data Vencimento | DDMMAAAA |
| 129-143 | 15 | Valor Documento | |

### 3.7 Retorno de Cobrança

#### Processo de Parse

1. **Header de Arquivo** (tipo "0"): Extrai banco, empresa, data
2. **Segmento T**: Título processado
3. **Segmento U**: Complemento com data/valor efetivo

#### Códigos de Ocorrência

| Código | Descrição | Ação |
|--------|-----------|------|
| "02" | Entrada Confirmada | Título registrado |
| "03" | Entrada Rejeitada | Verificar erro |
| "06" | Liquidação Normal | Pago normalmente |
| "09" | Baixado Automaticamente | Cancelado |
| "10" | Baixado por Liquidação | Pago e baixado |
| "17" | Liquidação após Baixa | Pago após cancelamento |
| "20" | Débito em Conta | Débito automático |
| "25" | Protestado | Enviado a protesto |
| "26" | Instrução Rejeitada | Erro na instrução |
| "28" | Débito Tarifas | Tarifa cobrada |

### 3.8 Funções de Formatação

```typescript
// Valor: R$ 1234,56 → "0000000000123456"
formatValue(1234.56) // "0000000000123456"

// Data: 15/04/2026 → "15042026"
formatDate(new Date(2026, 3, 15)) // "15042026"

// Parse data do retorno
parseDate("15042026") // Date(2026, 3, 15)

// Parse valor do retorno
parseValue("0000000000123456") // 1234.56

// Padding
padLeft("123", 5, "0")    // "00123"
padRight("ABC", 5, " ")   // "ABC  "
onlyNumbers("12.345/678")  // "12345678"
```

### 3.9 Bancos Suportados

| Código | Nome |
|--------|------|
| 001 | BANCO DO BRASIL SA |
| 033 | BANCO SANTANDER SA |
| 077 | BANCO INTER SA |
| 104 | CAIXA ECONOMICA FEDERAL |
| 197 | STONE PAGAMENTOS SA |
| 212 | BANCO ORIGINAL SA |
| 237 | BANCO BRADESCO SA |
| 260 | NU PAGAMENTOS SA |
| 290 | PAGSEGURO INTERNET SA |
| 336 | BANCO C6 SA |
| 341 | BANCO ITAU SA |
| 380 | PICPAY SERVICOS SA |
| 403 | CORA SCD SA |
| 422 | BANCO SAFRA SA |
| 748 | BANCO SICREDI SA |
| 756 | BANCO SICOOB SA |

---

## 4. Regras de Trial e Assinatura

### 4.1 Fluxo de Trial

1. Novo usuário → Trial de 7 dias automático
2. Durante trial: Acesso completo às funcionalidades
3. Após trial: 
   - Se tiver assinatura ativa → Continua
   - Se não tiver → Bloqueio de acesso

### 4.2 Verificação (useTrialGuard)

```typescript
// Prioridade:
1. Admin → Acesso total (999 dias)
2. Assinatura ativa → Acesso total
3. Trial ativo → Dias restantes
4. Sem trial/assinatura → Expirado
```

### 4.3 Estados de Acesso

| Status | Dias Restantes | Acesso |
|--------|---------------|--------|
| Admin | 999 | Total |
| Assinatura Ativa | 999 | Total |
| Trial Ativo | > 0 | Total |
| Trial Expirado | 0 | Bloqueado |
| Sem Registro | - | Bloqueado |

---

## 5. Regras de Categorias

### 5.1 Seed de Categorias Padrão

Ao criar conta, sistema executa `seed_default_categories` (RPC Supabase):

**Categorias criadas automaticamente**:
- Receitas Operacionais (1.x)
- Impostos (2.x)
- Custos Variáveis (2.4, 2.5)
- Gastos com Pessoal (2.3)
- Gastos com Ocupação (3.3)
- Serviços de Terceiros (3.30, 3.31, 3.32)
- Marketing (3.1)
- Material de Escritório (3.311)
- Gastos Não Operacionais (3.4, 3.5, 4.x, 5.x)
- IR e CSLL (2.107, 2.108)

### 5.2 Estrutura de Prefixos

```
1.x   = Receitas
2.x   = Impostos e deduções
3.x   = Custos e despesas operacionais
4.x   = Gastos não operacionais
5.x   = Outras despesas
```

---

## 6. Regras de Realtime

### 6.1 Subscrição Global (useGlobalFinancialRealtime)

Tabelas monitoradas para atualização automática:
- `bancos_cartoes`
- `categorias`
- `contas_pagar`
- `contas_receber`
- `extrato_bancario`
- `lancamentos_caixa`

### 6.2 Invalidação de Cache

Quando ocorre alteração em qualquer tabela monitorada:
```typescript
queryClient.invalidateQueries({
  predicate: (query) => query.queryKey[0] === tableName
});
```

---

## 7. Regras de Formatação

### 7.1 Moeda
- Exibição: `R$ 1.234,56`
- Interno: `1234.56` (number)
- CNAB: `0000000000123456` (sem decimal)

### 7.2 Datas
- Exibição: `15/04/2026`
- Interno: `2026-04-15` (ISO 8601)
- CNAB: `15042026` (DDMMYYYY)
- Input: `YYYY-MM-DD` (HTML date)

### 7.3 Documentos
- CNPJ: `XX.XXX.XXX/XXXX-XX`
- CPF: `XXX.XXX.XXX-XX`
- Armazenamento: apenas números
