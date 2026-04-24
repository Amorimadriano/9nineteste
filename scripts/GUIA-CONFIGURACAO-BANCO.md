# Guia de Configuração do Banco - Certificados NFS-e

## 🎯 Resumo

Configure o banco de dados e storage do Supabase para permitir upload de certificados digitais.

---

## 📋 PASSO 1: Configurar o Banco de Dados (SQL)

### 1.1 Acesse o SQL Editor
🔗 **Link:** https://app.supabase.com/project/tomrlopsmxgvzgqsfizh/sql/new

### 1.2 Copie o SQL abaixo

```sql
-- ============================================
-- CONFIGURAÇÃO DO BANCO - CERTIFICADOS NFS-e
-- ============================================

-- 1. Criar tabela de certificados
CREATE TABLE IF NOT EXISTS certificados_nfse (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    arquivo_path TEXT,
    valido_ate DATE,
    cnpj TEXT,
    emissor TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Comentários para documentação
COMMENT ON TABLE certificados_nfse IS 'Tabela de certificados digitais A1 para emissão de NFS-e';
COMMENT ON COLUMN certificados_nfse.arquivo_path IS 'Caminho do arquivo no Supabase Storage';
COMMENT ON COLUMN certificados_nfse.cnpj IS 'CNPJ do titular do certificado';
COMMENT ON COLUMN certificados_nfse.emissor IS 'Autoridade Certificadora emissora';

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_certificados_nfse_user_id ON certificados_nfse(user_id);
CREATE INDEX IF NOT EXISTS idx_certificados_nfse_ativo ON certificados_nfse(ativo) WHERE ativo = true;

-- 4. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_certificado_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_certificado_updated_at ON certificados_nfse;
CREATE TRIGGER trigger_update_certificado_updated_at
    BEFORE UPDATE ON certificados_nfse
    FOR EACH ROW
    EXECUTE FUNCTION update_certificado_updated_at();

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE certificados_nfse ENABLE ROW LEVEL SECURITY;

-- 6. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "certificados_select_policy" ON certificados_nfse;
DROP POLICY IF EXISTS "certificados_insert_policy" ON certificados_nfse;
DROP POLICY IF EXISTS "certificados_update_policy" ON certificados_nfse;
DROP POLICY IF EXISTS "certificados_delete_policy" ON certificados_nfse;

-- 7. Criar políticas RLS (segurança)
CREATE POLICY "certificados_select_policy" ON certificados_nfse
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "certificados_insert_policy" ON certificados_nfse
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "certificados_update_policy" ON certificados_nfse
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "certificados_delete_policy" ON certificados_nfse
    FOR DELETE USING (auth.uid() = user_id);

-- 8. Grants para usuários autenticados
GRANT SELECT, INSERT, UPDATE, DELETE ON certificados_nfse TO authenticated, anon;
GRANT ALL ON certificados_nfse TO service_role;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
SELECT
    '✅ Configuração Concluída!' as status,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificados_nfse') as tabela_ok,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificados_nfse' AND column_name = 'arquivo_path') as colunas_ok,
    EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_certificado_updated_at') as trigger_ok;
```

### 1.3 Cole no SQL Editor e clique em "Run"

Se aparecer a mensagem **"✅ Configuração Concluída!"** com `tabela_ok: true`, está pronto!

---

## 📦 PASSO 2: Criar o Bucket no Storage

### 2.1 Acesse o Storage
🔗 **Link:** https://app.supabase.com/project/tomrlopsmxgvzgqsfizh/storage/buckets

### 2.2 Clique em "New Bucket"

Preencha com:
- **Name:** `certificados-nfse`
- **Public:** ❌ OFF (desmarcado - bucket privado)
- **File size limit:** `10485760` (10MB em bytes)
- **Allowed MIME types:** `application/x-pkcs12`

Clique em **"Save"**

### 2.3 Configure as Políticas do Bucket

No bucket criado, vá em **"Policies"** e adicione 3 políticas:

| Operação | Policy |
|----------|--------|
| **SELECT** | `auth.uid() = owner` |
| **INSERT** | `auth.uid() = owner` |
| **DELETE** | `auth.uid() = owner` |

---

## ✅ Verificação Final

Após configurar, execute este SQL para confirmar:

```sql
-- Verificar se tudo está configurado
SELECT 
    'Tabela' as item,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificados_nfse') as status
UNION ALL
SELECT 
    'Bucket',
    EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'certificados-nfse');
```

**Resultado esperado:**
```
item     | status
---------|--------
Tabela   | true
Bucket   | true
```

---

## 🚀 Próximo Passo

Após configurar o banco, você pode testar o upload do certificado na aplicação!

---

## 🐛 Problemas Comuns

### Erro: "relation certificados_nfse does not exist"
**Solução:** Execute o SQL do Passo 1 novamente.

### Erro: "bucket not found"
**Solução:** Crie o bucket manualmente (Passo 2).

### Erro: "new row violates row-level security policy"
**Solução:** Verifique se as políticas RLS foram criadas corretamente.

---

**Data:** 18/04/2026
