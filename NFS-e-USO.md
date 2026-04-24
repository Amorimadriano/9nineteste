# 🧾 Como Usar a NFS-e (Nota Fiscal de Serviço)

## Visão Geral

A integração NFS-e permite emitir notas fiscais de serviço eletrônicas diretamente para a Prefeitura de São Paulo via sistema GINFES, seguindo o layout ABRASF 2.04.

---

## 🚀 Primeiros Passos

### 1. Configurar Emitente

Antes de emitir notas, configure o emitente:

```sql
-- Inserir emitente no Supabase
INSERT INTO nfs_e_emitentes (
  empresa_id,
  cnpj_emitente,
  inscricao_municipal,
  razao_social,
  nome_fantasia,
  endereco,
  certificado_digital,
  senha_certificado,
  regime_tributario,
  aliquota_iss,
  item_lista_servicos,
  cnae,
  ativo,
  ambiente
) VALUES (
  'uuid-empresa',
  '11222333000100',
  '123456',
  'Empresa Exemplo LTDA',
  'Empresa Exemplo',
  '{"logradouro": "Rua Exemplo", "numero": "100", "bairro": "Centro", "cidade": "São Paulo", "uf": "SP", "cep": "01000000"}',
  'certificado_base64_aqui',
  'senha_certificado',
  'simples_nacional',
  2.0,
  '1.01',
  '6201501',
  true,
  'homologacao'  -- ou 'producao'
);
```

### 2. Acessar a Interface

1. Faça login no sistema
2. Vá em **"NFS-e Emissão"** no menu lateral
3. Você verá 3 tabs: **Nova Nota**, **Rascunhos**, **Histórico**

---

## 💡 Emitindo uma Nota Fiscal

### Passo 1: Dados do Tomador

- **Tipo**: Selecione CPF ou CNPJ
- **Documento**: Digite o número (com máscara automática)
- **Buscar**: Clique em "Buscar" para consultar Brasil API (CNPJ) ou preencher manualmente
- **Razão Social**: Nome do cliente
- **E-mail**: Para envio automático
- **Endereço**: Preencha o CEP para busca automática (ViaCEP)

### Passo 2: Dados do Serviço

- **Descrição**: Descreva o serviço prestado
- **Valor Bruto**: Valor total do serviço
- **Deduções**: Valores a deduzir (se houver)
- **Base de Cálculo**: Calculada automaticamente (valor - deduções)
- **Alíquota ISS**: Padrão do emitente (editável)
- **ISS Retido**: Marque se houver retenção
- **Valor ISS**: Calculado automaticamente
- **Valor Líquido**: Valor final a receber
- **CNAE**: Código de atividade
- **Item da Lista de Serviços**: Código LC 116 (ex: 1.01, 1.02)
- **Código de Tributação**: Código específico da prefeitura

### Passo 3: Retenções (Opcional)

Se houver retenções na fonte:
- PIS (%)
- COFINS (%)
- INSS (%)
- IR (%)
- CSLL (%)

### Passo 4: Revisão

- Confira todos os dados
- Visualize o preview da nota
- Clique em **"Salvar Rascunho"** ou **"Emitir Nota"**

---

## 🔄 Ciclo de Vida da Nota

```
Rascunho → Enviando → Autorizada/Rejeitada → Cancelada (opcional)
```

| Status | Descrição |
|--------|-----------|
| **Rascunho** | Em edição, ainda não enviada |
| **Enviando** | Em processamento na prefeitura |
| **Autorizada** | Emitida com sucesso, tem número e protocolo |
| **Rejeitada** | Erro na emissão, pode ser corrigida |
| **Cancelada** | Cancelada (só no mesmo dia) |

---

## 📥 Downloads

Após autorização, você pode baixar:
- **PDF**: Visualização da nota fiscal
- **XML**: Arquivo para contabilidade
- **Consulta Pública**: Link com código de verificação

---

## ⚠️ Regras Importantes

### Cancelamento
- **Só pode cancelar no mesmo dia da emissão** (regra da Prefeitura SP)
- Após 24h, entre em contato com a prefeitura

### Certificado Digital
- Deve ser válido (A1 ou A3)
- Arquivo .pfx (PKCS12)
- Senha correta
- Vencimento monitorado pelo sistema (alertas 30 dias antes)

### Numeração
- Controle automático por série
- Não pode haver gaps na numeração
- Próximo número exibido automaticamente

---

## 🔧 Configurações Avançadas

### Variáveis de Ambiente

```env
# .env
VITE_NFSE_AMBIENTE=homologacao  # ou producao
```

### Agendamento Automático

O sistema verifica automaticamente:
- Notas pendentes a cada 5 minutos
- Download de PDF/XML após autorização
- Alertas de certificados próximos do vencimento
- Limpeza de rascunhos antigos (30 dias)

---

## 🐛 Solução de Problemas

### Erro "Certificado inválido"
- Verifique se o certificado está no formato .pfx
- Confirme a senha
- Verifique a validade do certificado

### Erro "Rejeitada pela prefeitura"
- Clique na nota para ver o motivo
- Corrija os dados e reenvie
- Verifique CNPJ do tomador

### Nota não aparece no histórico
- Verifique filtros (período, status)
- Aguarde alguns segundos e atualize
- Verifique se foi salva como rascunho

---

## 📞 Suporte

Para problemas com a prefeitura:
- GINFES: https://www.ginfes.com.br
- Prefeitura SP: https://www.prefeitura.sp.gov.br

Para problemas no sistema:
- Consulte os logs em `nfs_e_logs` no Supabase
- Verifique console do navegador (F12)
- Entre em contato com o administrador

---

**Sistema pronto para uso!** 🎉
