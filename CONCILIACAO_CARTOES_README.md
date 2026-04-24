# Conciliação de Cartões - Documentação

## Visão Geral

Sistema completo de conciliação automática de transações de cartão de crédito/débito com suporte a múltiplas operadoras.

## Funcionalidades

### ✨ Principais Features

- **Importação de Extratos**: Suporte a Rede, Cielo e Stone (CSV/Excel)
- **Matching Inteligente**: Algoritmo de scoring com pesos configuráveis
- **Detecção Automática**: Bandeira por BIN, chargebacks, parcelamentos
- **Conciliação em Lote**: Processamento automático de matches confiáveis
- **Auditoria Completa**: Log de todas as operações

## Estrutura de Arquivos

```
src/
├── components/
│   ├── conciliacao/
│   │   └── cartoes/
│   │       ├── ImportarExtratoCartao.tsx    # Upload de arquivos
│   │       ├── TabelaTransacoesCartao.tsx   # Lista de transações
│   │       ├── MatchSuggestionCard.tsx      # Sugestões de match
│   │       ├── ConciliacaoManualModal.tsx    # Modal de conciliação
│   │       ├── ResumoConciliacao.tsx         # KPIs e estatísticas
│   │       └── types.ts                      # Tipos TypeScript
│   ├── analytics/cartoes/
│   │   └── GraficoConciliacaoPorBandeira.tsx # Gráficos
│   └── ui/
│       └── BandeiraBadge.tsx                 # Badge de bandeira
├── hooks/
│   ├── useConciliacaoCartoes.ts              # Hook principal
│   └── useDebounce.ts                        # Debounce para filtros
├── lib/cartoes/
│   ├── utils.ts                              # Utilitários
│   ├── validators.ts                         # Validações de segurança
│   ├── index.ts                              # Exportações
│   └── parsers/
│       ├── parserRede.ts                     # Parser Rede
│       ├── parserCielo.ts                    # Parser Cielo
│       └── parserStone.ts                    # Parser Stone
├── pages/
│   └── ConciliacaoCartoes.tsx                # Página principal
├── test/cartoes/
│   ├── conciliadorCartoes.test.ts            # Testes unitários
│   ├── parsers.test.ts                       # Testes de parsers
│   └── fixtures/                             # Dados de teste
└── types/
    └── cartoes.ts                            # Tipos globais

supabase/
└── migrations/
    ├── 20260417003000_conciliacao_cartoes.sql       # Schema
    └── 20260417003000_conciliacao_cartoes_rls.sql  # Segurança
```

## Setup

### 1. Executar Migrations

```bash
# Via CLI do Supabase
supabase db push

# Ou execute o script SQL no Editor do Supabase
scripts/setup-cartoes.sql
```

### 2. Configurar Taxas por Empresa

```sql
INSERT INTO configuracoes_cartao (
    empresa_id,
    taxa_visa,
    taxa_mastercard,
    taxa_elo,
    prazo_credito_dias
) VALUES (
    'seu-empresa-uuid',
    0.0199,  -- 1.99%
    0.0199,  -- 1.99%
    0.0229,  -- 2.29%
    30       -- 30 dias
);
```

## Algoritmo de Matching

### Pesos do Score

| Fator | Peso | Descrição |
|-------|------|-----------|
| Valor Líquido | 50% | Diferença tolerada: R$ 0,50 |
| Data Pagamento | 30% | Tolerância: 2 dias |
| Bandeira | 10% | Match de tipo |
| NSU | 10% | Bônus se disponível |

### Regras de Match

- **Automático**: Score ≥ 80%
- **Sugestão**: Score 60-80%
- **Divergente**: Score < 60% ou valor fora da tolerância

## Parsers Suportados

### Rede (Itaú)
- Formato: CSV com separador `;`
- Colunas: Data, Bandeira, Valor Bruto, NSU
- Detecção: Por nome do arquivo ou conteúdo

### Cielo
- Formato: CSV com separador `;`
- Colunas: Data Venda, Data Pagamento, TID
- Suporte a parcelamento

### Stone
- Formato: CSV com separador `,`
- Colunas: Data/Hora, Tipo, Parcela
- Layout moderno e limpo

## Segurança

### Medidas Implementadas

1. **RLS (Row Level Security)**: Isolamento por empresa
2. **Auditoria**: Log de todas as operações
3. **Mascaramento**: Apenas últimos 4 dígitos do cartão
4. **Rate Limiting**: Máximo 100 uploads/hora
5. **Validação de Arquivos**: Extensão, tamanho, tipo MIME

### Políticas RLS

- `transacoes_cartao`: SELECT/INSERT/UPDATE/DELETE por empresa
- `configuracoes_cartao`: Apenas usuários da empresa
- `auditoria_transacoes_cartao`: Apenas visualização pelo tenant

## Testes

```bash
# Executar testes específicos
bun test src/test/cartoes/

# Executar todos os testes
bun test
```

## Uso

### Importar Extrato

1. Acesse **Conciliação de Cartões** no menu
2. Clique em **Importar**
3. Arraste ou selecione o arquivo CSV/Excel
4. Verifique o preview e confirme

### Conciliar Transações

1. Na aba **Pendentes**, selecione as transações
2. Clique em **Conciliar** para matches automáticos
3. Ou clique em **Manual** para escolher o candidato
4. Confirme o vínculo

### Visualizar Relatórios

1. Acesse a aba **Relatórios**
2. Filtre por bandeira, período ou status
3. Exporte em CSV ou PDF

## Troubleshooting

### Erro: "Nenhuma transação válida encontrada"
- Verifique se o arquivo está no formato correto
- Confirme que o separador é vírgula ou ponto-e-vírgula
- Veja o console para mensagens de erro detalhadas

### Erro: "Limite de uploads excedido"
- Aguarde 1 hora para nova tentativa
- Ou limpe o rate limit manualmente no banco

### Matches não encontrados
- Ajuste a tolerância de valor nas configurações
- Verifique se as contas a receber estão cadastradas
- Confirme as datas de pagamento esperadas

## Contribuição

Time BPO Nine - Agentes:
- @agente-supabase: Schema e performance
- @agente-financeiro: Regras de negócio
- @agente-frontend: Interface React
- @agente-testes: Testes automatizados
- @agente-devops: Build e otimização
- @agente-uiux: Design e UX
- @agente-seguranca: RLS e proteção
- @agente-analytics: Dashboards
