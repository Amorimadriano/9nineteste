# Design de UX - Conciliação de Cartões

## Visão Geral

Sistema de conciliação automática de transações de cartão de crédito/débito, com matching inteligente e interface amigável.

## Fluxo de Usuário

### 1. Importação
```
[Tela inicial] → [Arrastar arquivo] → [Preview dados] → [Confirmar]
```

- Detectar bandeira automaticamente
- Mostrar resumo: X transações, Y bandeiras, valor total
- Alertar sobre transações suspeitas (valores muito altos)

### 2. Conciliação
```
[Lista pendentes] → [Ver sugestões] → [Confirmar/Rejeitar]
```

- Destacar matches confiantes (>90% score)
- Permitir comparar lado a lado
- Mostrar explicação do score

### 3. Divergências
```
[Lista divergências] → [Investigar] → [Corrigir/Ignorar]
```

- Agrupar por tipo: valor diferente, data diferente, não encontrado
- Permitir ajuste manual

## Cores por Bandeira

| Bandeira | Cor |
|----------|-----|
| Visa | #1A1F71 (azul escuro) |
| Mastercard | #EB001B (vermelho) + #F79E1B (laranja) |
| Elo | #00A4E0 (azul claro) + #F9A11B (laranja) |
| Amex | #006FCF (azul) |

## Estados de Status

- **Pendente**: Cinza/neutro
- **Conciliado**: Verde/sucesso
- **Divergente**: Amarelo/alerta
- **Chargeback**: Vermelho/perigo

## Mensagens Amigáveis

| Antes | Depois |
|-------|--------|
| "Erro no parsing" | "Não conseguimos ler esse arquivo. Verifique se é o extrato da operadora." |
| "Nenhuma transação" | "Importe seu primeiro extrato de cartão para começar" |
| "Match duvidoso" | "Encontramos uma transação parecida, mas precisamos da sua confirmação." |

## Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| Ctrl+I | Importar |
| Ctrl+F | Buscar |
| C | Conciliar lote |
| Esc | Fechar modal |

## Acessibilidade

- ARIA labels em todos os elementos interativos
- Contraste mínimo 4.5:1
- Navegação por teclado
- Suporte a prefers-reduced-motion
