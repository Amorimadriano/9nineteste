# Guia de Teste - Certificado Digital NFS-e

## 🚀 Teste Rápido (Local)

Abri uma página de teste no seu navegador. Nela você pode:

1. **Selecionar seu arquivo .pfx ou .p12**
2. **Digitar a senha**
3. **Verificar se o certificado é válido**

**O arquivo NÃO será enviado para lugar nenhum** - tudo é processado localmente.

---

## 📋 Pré-requisitos para Teste no Sistema

Antes de testar no sistema real, certifique-se de que:

### 1. Banco de Dados Configurado ✅

Acesse: https://app.supabase.com/project/tomrlopsmxgvzgqsfizh/sql/new

Execute este SQL para verificar se a tabela existe:

```sql
SELECT 
    'Tabela existe: ' || EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificados_nfse') as status,
    'Bucket existe: ' || EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'certificados-nfse') as bucket_status;
```

Se retornar `false` em algum item, execute o script:
**`scripts/setup-certificado-nfse.sql`**

### 2. Bucket no Storage Criado ✅

Vá em: https://app.supabase.com/project/tomrlopsmxgvzgqsfizh/storage/buckets

Crie um bucket chamado `certificados-nfse`:
- ✅ Public: OFF (privado)
- ✅ File size limit: 10MB
- ✅ MIME types: `application/x-pkcs12`

**Políticas do bucket** (Storage > Policies):
```
SELECT: auth.uid() = owner
INSERT: auth.uid() = owner
DELETE: auth.uid() = owner
```

### 3. Edge Function Deployada ✅

No terminal do projeto, execute:

```bash
cd C:\Users\Antonio Amorim\Documents\GitHub\ninebpofinanceiro
npx supabase functions deploy validar-certificado-nfse
```

---

## 🧪 Como Testar no Sistema Real

### Opção 1: Página de Teste Local (Recomendado Primeiro)

1. Abra o arquivo: `scripts/testar-certificado.html`
2. Selecione seu arquivo .pfx/.p12
3. Digite a senha
4. Clique em "Testar Certificado"
5. Verifique se as informações aparecem corretamente

### Opção 2: Sistema Completo (Após configuração)

1. Acesse a página de emissão de NFS-e
2. Clique em **"Configurar Certificado"**
3. Faça upload do arquivo
4. Digite a senha
5. Confirme o upload

---

## 🔍 Troubleshooting

### Erro: "Tabela não encontrada"

**Solução:** Execute o script SQL `setup-certificado-nfse.sql` no SQL Editor do Supabase.

### Erro: "Bucket não encontrado"

**Solução:** Crie o bucket manualmente:
1. Vá em Storage > New bucket
2. Nome: `certificados-nfse`
3. Public: OFF
4. File size limit: 10MB

### Erro: "Senha incorreta"

**Verifique:**
- A senha está correta?
- O arquivo não está corrompido?
- É um certificado A1 (PFX/P12) e não A3 (token)?

### Erro: "Edge Function retornou erro"

**Solução:** Deploy da função:
```bash
npx supabase functions deploy validar-certificado-nfse
```

---

## 📁 Arquivos Criados

| Arquivo | Propósito |
|---------|-----------|
| `scripts/testar-certificado.html` | Teste local rápido |
| `scripts/setup-certificado-nfse.sql` | Configuração do banco |
| `scripts/README-CERTIFICADO.md` | Documentação completa |

---

## ✅ Checklist de Configuração

- [ ] Tabela `certificados_nfse` criada no banco
- [ ] Bucket `certificados-nfse` criado no Storage
- [ ] Políticas do bucket configuradas
- [ ] Edge Function `validar-certificado-nfse` deployada
- [ ] Teste local funcionando (testar-certificado.html)
- [ ] Teste no sistema funcionando

---

**Data:** 18/04/2026
