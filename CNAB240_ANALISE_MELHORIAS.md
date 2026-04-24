# Análise CNAB 240 - Implementação vs Manual Inter

## 📋 Resumo da Análise

**Manual:** CNAB 240 - Banco Inter (077)  
**Versão Layout:** 107 (Arquivo) / 046 (Lote)  
**Data Análise:** 17/04/2026

---

## 🚨 Divergências Críticas Encontradas

### 1. HEADER DE ARQUIVO (Registro 0)

| Campo | Posição Manual | Implementação Atual | Status |
|-------|---------------|---------------------|--------|
| Código Banco | 1-3 | ✅ OK | ✓ |
| Lote Serviço | 4-7 | ✅ OK (0000) | ✓ |
| Tipo Registro | 8 | ✅ OK (0) | ✓ |
| Brancos | 9-17 | ✅ OK | ✓ |
| Tipo Inscrição | 18 | ✅ OK (2=CNPJ) | ✓ |
| CNPJ | 19-32 | ✅ OK | ✓ |
| Código Convênio | 33-52 | ✅ OK | ✓ |
| Agência | 53-57 | ✅ OK | ✓ |
| DV Agência | 58 | ✅ OK | ✓ |
| Conta | 59-70 | ✅ OK | ✓ |
| DV Conta | 71 | ✅ OK | ✓ |
| DV Ag/Conta | 72 | ✅ OK | ✓ |
| Nome Empresa | 73-102 | ✅ OK | ✓ |
| Nome Banco | 103-132 | ✅ OK | ✓ |
| Brancos | 133-142 | ✅ OK | ✓ |
| Código Remessa | 143 | ✅ OK (1) | ✓ |
| Data Geração | 144-151 | ✅ OK | ✓ |
| Hora Geração | 152-157 | ✅ OK | ⚠️ Faltando implementar hora real |
| NSA | 158-163 | ✅ OK | ✓ |
| **Versão Layout** | **164-166** | **❌ ERRO: "087"** | **🚨 Deve ser "107"** |
| Densidade | 167-171 | ✅ OK (01600) | ✓ |
| Reservado Banco | 172-191 | ✅ OK | ✓ |
| Reservado Empresa | 192-211 | ✅ OK | ✓ |
| Brancos | 212-240 | ✅ OK | ✓ |

**Problema Crítico:** A versão do layout está como "087" mas deve ser "107" segundo o manual Inter.

---

### 2. HEADER DE LOTE (Registro 1) - TED/Pix

| Campo | Posição Manual | Implementação Atual | Status |
|-------|---------------|---------------------|--------|
| Código Banco | 1-3 | ✅ OK | ✓ |
| Lote | 4-7 | ✅ OK | ✓ |
| Tipo Registro | 8 | ✅ OK (1) | ✓ |
| Tipo Operação | 9 | ✅ OK (C=Crédito) | ✓ |
| Tipo Serviço | 10-11 | ✅ OK | ✓ |
| Forma Lançamento | 12-13 | ⚠️ Verificar | ⚠️ |
| **Versão Layout Lote** | **14-16** | **❌ ERRO: "045"** | **🚨 Deve ser "046"** |
| Branco | 17 | ✅ OK | ✓ |
| Tipo Inscrição | 18 | ✅ OK | ✓ |
| CNPJ | 19-32 | ✅ OK | ✓ |
| Convênio | 33-52 | ✅ OK | ✓ |
| Agência | 53-57 | ✅ OK | ✓ |
| DV Agência | 58 | ✅ OK | ✓ |
| Conta | 59-70 | ✅ OK | ✓ |
| DV Conta | 71 | ✅ OK | ✓ |
| DV Ag/Conta | 72 | ✅ OK | ✓ |
| Nome Empresa | 73-102 | ✅ OK | ✓ |
| Info Genérica | 103-142 | ✅ OK | ✓ |
| Endereço | 143-172 | ❌ FALTANDO | 🚨 |
| Número | 173-177 | ❌ FALTANDO | 🚨 |
| Complemento | 178-192 | ❌ FALTANDO | 🚨 |
| Cidade | 193-212 | ❌ FALTANDO | 🚨 |
| CEP | 213-217 | ❌ FALTANDO | 🚨 |
| Complemento CEP | 218-220 | ❌ FALTANDO | 🚨 |
| UF | 221-222 | ❌ FALTANDO | 🚨 |
| Brancos | 223-230 | ❌ FALTANDO | 🚨 |
| Ocorrências | 231-240 | ✅ OK | ✓ |

**Problemas:**
1. Versão layout lote: "045" → deve ser "046"
2. Faltam campos de endereço da empresa (posições 143-230)

---

### 3. SEGMENTO A (TED)

| Campo | Posição Manual | Implementação | Status |
|-------|---------------|-----------------|--------|
| Código Banco | 1-3 | ✅ OK | ✓ |
| Lote | 4-7 | ✅ OK | ✓ |
| Tipo Registro | 8 | ✅ OK (3) | ✓ |
| Nº Sequencial | 9-13 | ✅ OK | ✓ |
| Segmento | 14 | ✅ OK (A) | ✓ |
| Tipo Movimento | 15 | ✅ OK | ✓ |
| Código Instrução | 16-17 | ✅ OK (00) | ✓ |
| Câmara | 18-20 | ✅ OK (000) | ✓ |
| Banco Favorecido | 21-23 | ✅ OK | ✓ |
| Agência Favorecido | 24-28 | ✅ OK | ✓ |
| DV Agência | 29 | ✅ OK | ✓ |
| Conta Favorecido | 30-41 | ✅ OK | ✓ |
| DV Conta | 42 | ✅ OK | ✓ |
| DV Ag/Conta | 43 | ❌ Verificar | ⚠️ |
| Nome Favorecido | 44-73 | ✅ OK | ✓ |
| Nº Documento Empresa | 74-93 | ✅ OK | ✓ |
| Data Pagamento | 94-101 | ✅ OK | ✓ |
| Tipo Moeda | 102-104 | ✅ OK (BRL) | ✓ |
| Quantidade Moeda | 105-119 | ✅ OK | ✓ |
| Valor Pagamento | 120-134 | ✅ OK | ✓ |
| Nº Documento Banco | 135-154 | ✅ OK | ✓ |
| Data Real Efetivação | 155-162 | ✅ OK | ✓ |
| Valor Real Efetivação | 163-177 | ✅ OK | ✓ |
| Tipo Conta | 200-201 | ❌ FALTANDO | 🚨 Pos 178-199 |
| Código Finalidade TED | 220-224 | ❌ FALTANDO | 🚨 |
| Ocorrências | 231-240 | ✅ OK | ✓ |

---

### 4. SEGMENTO B (TED)

| Campo | Posição Manual | Implementação | Status |
|-------|---------------|-----------------|--------|
| Código Banco | 1-3 | ✅ OK | ✓ |
| Lote | 4-7 | ✅ OK | ✓ |
| Tipo Registro | 8 | ✅ OK (3) | ✓ |
| Nº Sequencial | 9-13 | ✅ OK | ✓ |
| Segmento | 14 | ✅ OK (B) | ✓ |
| Brancos | 15-17 | ✅ OK | ✓ |
| Tipo Inscrição | 18 | ✅ OK | ✓ |
| CPF/CNPJ | 19-32 | ✅ OK | ✓ |
| Logradouro | 33-67 | ✅ OK | ✓ |
| Número | 68-72 | ✅ OK | ✓ |
| Complemento | 73-87 | ✅ OK | ✓ |
| Bairro | 88-102 | ✅ OK | ✓ |
| Cidade | 103-117 | ✅ OK | ✓ |
| CEP | 118-125 | ⚠️ Verificar formato | ⚠️ |
| Estado | 126-127 | ✅ OK | ✓ |
| Brancos | 128-232 | ✅ OK | ✓ |
| **Código ISPB** | **233-240** | **❌ FALTANDO** | **🚨 Campo obrigatório** |

---

### 5. SEGMENTO A (Pix)

**Diferenças específicas para Pix:**
- Campos 21-43: Devem ser zeros (não dados bancários)
- Campos 178-191: CPF/CNPJ do favorecido
- Campos 192-199: Código ISPB
- Campos 200-201: Tipo de conta

---

### 6. SEGMENTO B (Pix)

| Campo | Posição Manual | Implementação | Status |
|-------|---------------|-----------------|--------|
| Forma Iniciação | 15-17 | ❌ FALTANDO | 🚨 01=Telefone, 02=Email, 03=CPF/CNPJ, 04=Chave Aleatória, 05=Dados Bancários |
| Tipo Inscrição | 18 | ✅ OK | ✓ |
| CPF/CNPJ | 19-32 | ✅ OK | ✓ |
| TX ID | 33-67 | ⚠️ Opcional | ⚠️ |
| Brancos | 68-127 | ✅ OK | ✓ |
| Chave Pix | 128-226 | ✅ OK | ✓ |
| Brancos | 227-232 | ✅ OK | ✓ |
| Código ISPB | 233-240 | ✅ OK | ✓ |

---

### 7. SEGMENTO J (Pagamento de Cobrança)

| Campo | Posição Manual | Implementação | Status |
|-------|---------------|-----------------|--------|
| Código Barras | 18-61 | ❌ FALTANDO | 🚨 44 posições |
| Nome Beneficiário | 62-91 | ❌ FALTANDO | 🚨 |
| Data Vencimento | 92-99 | ❌ FALTANDO | 🚨 |
| Valor Nominal | 100-114 | ❌ FALTANDO | 🚨 |
| Valor Desconto | 115-129 | ❌ FALTANDO | 🚨 |
| Valor Mora | 130-144 | ❌ FALTANDO | 🚨 |
| Data Pagamento | 145-152 | ❌ FALTANDO | 🚨 |
| Valor Pagamento | 153-167 | ❌ FALTANDO | 🚨 |
| Quantidade Moeda | 168-182 | ❌ FALTANDO | 🚨 |
| Nº Documento Empresa | 183-202 | ❌ FALTANDO | 🚨 |
| Nosso Número | 203-222 | ❌ FALTANDO | 🚨 |

---

### 8. SEGMENTO O (Pagamento de Convênios)

| Campo | Posição Manual | Implementação | Status |
|-------|---------------|-----------------|--------|
| Código Barras | 18-61 | ❌ FALTANDO | 🚨 |
| Nome Concessionária | 62-91 | ❌ FALTANDO | 🚨 |
| Data Vencimento | 92-99 | ❌ FALTANDO | 🚨 |
| Data Pagamento | 100-107 | ❌ FALTANDO | 🚨 |
| Valor Pagamento | 108-122 | ❌ FALTANDO | 🚨 |
| Seu Número | 123-142 | ❌ FALTANDO | 🚨 |
| Nosso Número | 143-162 | ❌ FALTANDO | 🚨 |

---

### 9. TRAILER DE LOTE

| Campo | Posição Manual | Implementação | Status |
|-------|---------------|-----------------|--------|
| Código Banco | 1-3 | ✅ OK | ✓ |
| Lote | 4-7 | ✅ OK | ✓ |
| Tipo Registro | 8 | ✅ OK (5) | ✓ |
| Brancos | 9-17 | ✅ OK | ✓ |
| Quantidade Registros | 18-23 | ✅ OK | ✓ |
| Somatória Valores | 24-41 | ⚠️ **Tamanho errado** | 🚨 Manual: 18 posições, Código: 17 posições |
| Somatória Moedas | 42-59 | ⚠️ **Tamanho errado** | 🚨 Manual: 18 posições, Código: 18 posições |
| Nº Aviso Débito | 60-65 | ✅ OK | ✓ |
| Brancos | 66-230 | ✅ OK | ✓ |
| Ocorrências | 231-240 | ✅ OK | ✓ |

---

### 10. TRAILER DE ARQUIVO

| Campo | Posição Manual | Implementação | Status |
|-------|---------------|-----------------|--------|
| Código Banco | 1-3 | ✅ OK | ✓ |
| Lote | 4-7 | ✅ OK (9999) | ✓ |
| Tipo Registro | 8 | ✅ OK (9) | ✓ |
| Brancos | 9-17 | ✅ OK | ✓ |
| Quantidade Lotes | 18-23 | ✅ OK | ✓ |
| Quantidade Registros | 24-29 | ✅ OK | ✓ |
| Contas Conciliação | 30-35 | ✅ OK | ✓ |
| Brancos | 36-240 | ✅ OK | ✓ |

---

## 📝 Códigos de Ocorrência (Retorno) - Manual Inter

```
"00" - Crédito ou Débito Efetivado
"02" - Crédito ou Débito Cancelado pelo Pagador/Credor
"AR" - Valor do Lançamento Inválido
"AG" - Agência/Conta Corrente/DV Inválido
"ZI" - Beneficiário divergente
"AP" - Data Lançamento Inválido
"HF" - Conta Corrente da Empresa com Saldo Insuficiente
"AB" - Tipo de Operação Inválido
"AC" - Tipo de Serviço Inválido
"HA" - Lote Não Aceito
"BD" - Inclusão Efetuada com Sucesso
"PA" - Pix não efetivado
"PJ" - Chave não cadastrada no DICT
"PM" - Chave de pagamento inválida
"PN" - Chave de pagamento não informada
"PK" - QR Code inválido/vencido
"PB" - Transação interrompida devido a erro no PSP do Recebedor
"PD" - Tipo incorreto para a conta transacional especificada
"PE" - Tipo de transação não é suportado/autorizado na conta
"PH" - Ordem rejeitada pelo PSP do Recebedor
"AL" - Código do Banco Favorecido Inválido
"PG" - CPF/CNPJ do usuário recebedor incorreto
"AS" - Aviso ao Favorecido - Identificação Inválida
"ZK" - Boleto já liquidado
"HC" - Convênio com a Empresa Inexistente/Inválido
"CD" - Código de Barras - Valor do Título Inválido
"ZH" - Sistema em contingência - título indexado
"PI" - ISPB do PSP do Pagador inválido
"HE" - Tipo de Serviço Inválido para o Contrato
"YA" - Título Não Encontrado
```

---

## 🎯 Prioridade de Correções

### 🔴 CRÍTICO (Impede processamento)
1. **Versão Layout Arquivo:** 087 → 107
2. **Versão Layout Lote:** 045 → 046
3. **Segmento B TED:** Código ISPB (233-240) - Obrigatório
4. **Trailer Lote:** Correção tamanho campos 24-41 (18 posições, não 17)

### 🟠 ALTO (Recomendado)
5. Implementar Segmento J (Pagamento de Cobrança)
6. Implementar Segmento O (Pagamento de Convênios)
7. Header Lote: Campos de endereço (143-230)
8. Segmento A: Código Finalidade TED (220-224)
9. Implementar hora real no header (152-157)

### 🟡 MÉDIO (Melhorias)
10. Segmento B Pix: Campo "Forma de Iniciação" (15-17)
11. Segmento A Pix: Formato específico (zeros em dados bancários)
12. Adicionar todos os códigos de ocorrência do Inter
13. Implementar Segmento J-52 e J-52 Pix

### 🟢 BAIXO (Opcional)
14. Validadores de CPF/CNPJ
15. Geração de nome de arquivo conforme padrão Inter
16. Suporte a múltiplos lotes no mesmo arquivo

---

## 🔧 Arquivos que Precisam de Alteração

1. `src/lib/cnab240/remessaPagamento.ts` - Correções de layout
2. `src/lib/cnab240/remessaCobranca.ts` - Versão layout e validações
3. `src/lib/cnab240/retornoCobranca.ts` - Códigos de ocorrência Inter
4. `src/lib/cnab240/types.ts` - Novos tipos (Segmento J, O, Pix)
5. `src/lib/cnab240/utils.ts` - Funções auxiliares (hora, validações)

---

## 📊 Estimativa de Esforço

- **Correções Críticas:** 2-3 horas
- **Implementações Alto/Médio:** 8-12 horas
- **Testes e Validação:** 4-6 horas
- **Total Estimado:** 14-21 horas
