# 🔗 Como Usar as APIs de Contabilidade (ERP Contábeis)

## Visão Geral

O Nine BPO agora se integra com os principais sistemas ERP contábeis do mercado brasileiro: **TOTVS Protheus**, **Sankhya Omegasoft**, **Domínio Sistemas** e **Alterdata**.

---

## 🚀 Primeiros Passos

### 1. Acessar Configuração

1. Faça login no sistema
2. Vá em **"Integração Contábil"** no menu lateral
3. Você verá 4 tabs: **Configurações**, **Mapeamento**, **Sincronização**, **Histórico**

### 2. Configurar ERP

Clique em **"Nova Configuração"** e siga o wizard:

#### Step 1: Selecionar ERP

Escolha o seu sistema contábil:

| ERP | Tipo de API |
|-----|-------------|
| **TOTVS Protheus** | REST (TDataSet) |
| **Sankhya** | SOAP/WSDL |
| **Domínio** | REST |
| **Alterdata** | REST |
| **Outro** | Genérico |

#### Step 2: Credenciais

Preencha os dados de acesso:

- **URL da API**: Endpoint fornecido pelo ERP
- **API Key / Secret**: Credenciais de integração
- **Usuário / Senha**: Acesso ao sistema
- **Código da Empresa**: Seu código no ERP
- **Código da Filial**: Se houver filiais

Clique em **"Testar Conexão"** para validar.

#### Step 3: Mapeamento de Contas

Configure a relação entre suas categorias financeiras e as contas contábeis do ERP:

| Categoria Nine BPO | Tipo | Conta Contábil ERP | Histórico Padrão |
|-------------------|------|---------------------|------------------|
| Receita - Serviços | Receita | 1.1.01 | Venda de serviços |
| Despesa - Aluguel | Despesa | 2.1.05 | Pagamento aluguel |
| ... | ... | ... | ... |

**Dica:** Use "Sugestão Automática" para criar mapeamentos baseados em histórico.

#### Step 4: Revisão

- Confira a configuração
- Ative sincronização automática (opcional)
- Escolha a frequência: diária, semanal ou mensal

---

## 💡 Tipos de Sincronização

### Exportação (Nine BPO → ERP)

Exporta dados financeiros para o contador:

- **Contas a Pagar**: Fornecedores, vencimentos, valores
- **Contas a Receber**: Clientes, faturas, recebimentos
- **Movimentação de Caixa**: Lançamentos bancários

### Importação (ERP → Nine BPO)

Importa lançamentos contábeis:

- **Lançamentos Contábeis**: Entradas no livro caixa
- **Saldos**: Posição financeira
- **Conciliação**: Match automático com seus dados

### Conciliação Automática

O sistema tenta vincular automaticamente:

- Valor exato + Data coincidente
- Documento/Referência igual
- Score de confiança > 80%

Se não encontrar match, aparece para revisão manual.

---

## 🔄 Executar Sincronização

### Manual

1. Vá na tab **"Sincronização"**
2. Selecione o **período** (ex: 01/04/2024 a 30/04/2024)
3. Escolha as **operações**:
   - ☑️ Exportar Contas a Pagar
   - ☑️ Exportar Contas a Receber
   - ☐ Exportar Caixa
   - ☐ Importar Lançamentos
4. Veja o **preview** (quantos registros serão sincronizados)
5. Clique **"Executar Agora"**
6. Acompanhe o **progresso** em tempo real

### Automática

Se configurada, o sistema executa automaticamente:

- **Diária**: Todos os dias às 6h
- **Semanal**: Segundas às 6h
- **Mensal**: Dia 1 às 6h

Você recebe notificação de conclusão ou erro.

---

## 📊 Verificando Resultados

### Tab Histórico

Veja todas as sincronizações:

| Data | Tipo | Total | Sucesso | Erros | Status |
|------|------|-------|---------|-------|--------|
| 16/04/24 | Export CP | 50 | 48 | 2 | ✅ Sucesso |
| 15/04/24 | Import | 120 | 120 | 0 | ✅ Sucesso |

Clique em **"Ver Detalhes"** para:
- Lista de registros processados
- Quais tiveram erro e por quê
- Opção de reprocessar apenas erros

---

## 🐛 Solução de Problemas

### Erro de Conexão

- Verifique URL da API
- Confirme API Key/Senha
- Verifique se IP está liberado no firewall do ERP

### Erro na Exportação

- Verifique mapeamento de contas (se está completo)
- Confirma se conta contábil existe no ERP
- Verifique saldo antes de exportar (deve estar OK)

### Erro na Importação

- Verifica duplicidade: ID já importado?
- Formato de data diferente?
- Encoding (UTF-8 vs Latin1)

### Conciliação Não Funciona

- Verifique se valores estão iguais
- Datas podem variar até 1 dia
- Documento/referência deve coincidir

---

## 📈 Dados Exportados

### Contas a Pagar

```json
{
  "fornecedor": "Empresa XYZ",
  "cnpj": "11222333000100",
  "valor": 5000.00,
  "vencimento": "2024-04-30",
  "conta_contabil": "2.1.05",
  "historico": "Pagamento referente NF 1234"
}
```

### Contas a Receber

```json
{
  "cliente": "Cliente ABC",
  "cnpj": "00999888000177",
  "valor": 8000.00,
  "vencimento": "2024-04-30",
  "conta_contabil": "1.1.01",
  "historico": "Fatura ref serviço abril"
}
```

### Lançamentos de Caixa

```json
{
  "data": "2024-04-16",
  "tipo": "entrada",
  "valor": 1200.00,
  "conta_bancaria": "001",
  "conta_contabil": "1.1.02",
  "historico": "Deposito cliente"
}
```

---

## 🔐 Segurança

- Todas as credenciais são **criptografadas**
- Acesso apenas para usuários autorizados
- Logs de todas as operações
- Backup automático antes de importar

---

## 📞 Suporte

Para problemas específicos de cada ERP:

- **TOTVS**: https://suporte.totvs.com
- **Sankhya**: https://www.sankhya.com.br
- **Domínio**: https://www.dominiosistemas.com
- **Alterdata**: https://www.alterdata.com.br

Para problemas no Nine BPO:
- Consulte logs em "Histórico"
- Verifique console do navegador (F12)

---

**Integração pronta para uso!** 🎉
