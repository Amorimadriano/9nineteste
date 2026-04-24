# Melhoria: Quantidade de Licenças na Venda

## 🎯 Resumo

Adicionada funcionalidade para permitir que administradores definam a quantidade de licenças na hora de vender para escritórios de contabilidade ou BPO Financeiro.

**Data:** 17/04/2026  
**Status:** ✅ Implementado

---

## 📁 Arquivos Modificados/Criados

### 1. `supabase/migrations/20260417160000_add_quantidade_licencas.sql` (Novo)
- Adiciona coluna `quantidade_licencas` na tabela `licencas_software`
- Valor padrão: 1
- Comentário de documentação

### 2. `src/pages/LicencasSoftware.tsx`
Adições:
- Campo `quantidade_licencas` no formulário (após Desconto %)
- Exibição da quantidade na tabela com badge circular
- Cálculo de valor total considerando quantidade: `valor × quantidade`
- Atualização do cálculo de MRR considerando quantidade de licenças
- Carregamento do campo no modo de edição

### 3. `src/integrations/supabase/types.ts`
- Atualização dos tipos Row, Insert e Update para incluir `quantidade_licencas: number`

---

## 🚀 Como Usar

### Criar Nova Licença com Quantidade

1. Acesse a aba **Licenças de Software**
2. Clique em **Nova Licença**
3. Preencha os dados do cliente
4. Na seção **Plano e Faturamento**, defina:
   - Plano
   - Valor Mensal
   - Desconto (%)
   - **Qtd. Licenças** ← Novo campo
5. Clique em **Criar Licença**

### Exemplo

- Plano: Profissional
- Valor: R$ 399,90/mês
- Desconto: 10%
- **Quantidade: 5 licenças**
- **Valor Total: R$ 1.799,55/mês** (399,90 × 0,9 × 5)

---

## 📊 Cálculos Atualizados

### MRR (Monthly Recurring Revenue)
```
MRR = Σ (valor_mensal × (1 - desconto/100) × quantidade_licencas)
```

### Valor Exibido na Tabela
```
Valor Total = valor_unitario × quantidade_licencas
```

---

## 🎨 Interface

### Formulário
- Campo numérico com mínimo 1
- Label exibe multiplicador atual: "Qtd. Licenças (×5)"
- Posicionado após campo de Desconto

### Tabela
- Nova coluna **Qtd** entre Plano e Valor
- Exibe badge circular com número
- Valor mostra breakdown quando > 1: "R$ 399,90 × 5"

---

## 🛡️ Segurança

- Campo validado: mínimo 1
- Valor padrão: 1 (não afeta licenças existentes)
- Calculado automaticamente no MRR

---

## ✅ Checklist

- [x] Migration do banco de dados
- [x] Atualização dos tipos TypeScript
- [x] Campo no formulário
- [x] Exibição na tabela
- [x] Cálculo de MRR atualizado
- [x] Cálculo de valor total
- [x] Carregamento em edição
- [x] Build OK

---

## 📝 Notas

- Licenças existentes terão quantidade = 1 (padrão)
- Útil para BPOs e escritórios com múltiplas unidades/franquias
- Permite faturamento consolidado em uma única licença
