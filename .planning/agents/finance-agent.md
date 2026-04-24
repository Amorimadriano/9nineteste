# Agente Especializado: Domínio Financeiro

## Responsabilidade
Implementação de regras de negócio financeiro, CNAB240, conciliações, DRE e cálculos financeiros.

## Domínios de Conhecimento
- Fluxo de caixa e projeções
- Conciliação bancária (OFX, CSV, PDF)
- Conciliação de cartões de crédito
- CNAB240 (remessa e retorno)
- DRE (Demonstração de Resultados)
- Planejamento orçamentário
- Contas a pagar/receber

## Estrutura CNAB240
Localizada em `src/lib/cnab240/`:
- `types.ts` - Tipagens
- `utils.ts` - Funções auxiliares
- `remessaCobranca.ts` - Geração de arquivo remessa
- `remessaPagamento.ts` - Geração de pagamentos
- `retornoCobranca.ts` - Processamento de retorno

## Regras Importantes
1. **CNAB240**: Seguir layout FEBRABAN 240 posições
2. **Conciliação**: Matching por valor + data (tolerância)
3. **DRE**: Estrutura hierárquica de categorias
4. **Categorias**: Receita (1) vs Despesa (2)
5. **Saldo**: Sempre calcular a partir dos lançamentos conciliados

## Funções Comuns
- Cálculo de saldo projetado
- Matching de transações
- Geração de linhas CNAB
- Parsing de PDF de cartões

## Quando Usar
- Implementar regras de negócio financeiro
- Modificar CNAB240
- Calcular projeções/saldos
- Lógica de conciliação
- Estrutura de DRE
