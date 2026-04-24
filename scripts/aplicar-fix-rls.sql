-- ============================================
-- SCRIPT DE CORREÇÃO RÁPIDA: RLS certificados_nfse
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Desativar triggers temporariamente para evitar conflitos
SET session_replication_role = replica;

-- 1. Limpar completamente: remover TODAS as políticas existentes
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'certificados_nfse'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON certificados_nfse', pol.policyname);
        RAISE NOTICE 'Política removida: %', pol.policyname;
    END LOOP;
END $$;

-- Reativar triggers
SET session_replication_role = DEFAULT;

-- 2. Garantir que a tabela existe
CREATE TABLE IF NOT EXISTS certificados_nfse (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    nome TEXT NOT NULL,
    arquivo_path TEXT,
    valido_ate DATE,
    cnpj TEXT,
    emissor TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Constraint única (remover duplicatas se existirem)
DELETE FROM certificados_nfse a
USING certificados_nfse b
WHERE a.ctid < b.ctid
AND a.user_id = b.user_id;

ALTER TABLE certificados_nfse
DROP CONSTRAINT IF EXISTS unique_user_id,
DROP CONSTRAINT IF EXISTS certificados_nfse_user_id_key;

ALTER TABLE certificados_nfse
ADD CONSTRAINT unique_user_id UNIQUE (user_id);

-- 4. Trigger para updated_at
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
FOR EACH ROW EXECUTE FUNCTION update_certificado_updated_at();

-- 5. Resetar RLS
ALTER TABLE certificados_nfse DISABLE ROW LEVEL SECURITY;
ALTER TABLE certificados_nfse ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificados_nfse FORCE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS
CREATE POLICY "select_certificados_nfse"
ON certificados_nfse FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "insert_certificados_nfse"
ON certificados_nfse FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_certificados_nfse"
ON certificados_nfse FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "delete_certificados_nfse"
ON certificados_nfse FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- 7. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON certificados_nfse TO authenticated;
GRANT ALL ON certificados_nfse TO service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;

-- 8. STORAGE: Criar bucket para certificados
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificados-nfse', 'certificados-nfse', false)
ON CONFLICT (id) DO NOTHING;

-- 9. STORAGE: Limpar políticas antigas do bucket
DROP POLICY IF EXISTS "Users can upload certificados" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own certificados" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own certificados" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own certificados" ON storage.objects;

-- 10. STORAGE: Criar políticas RLS para o bucket
CREATE POLICY "Users can upload certificados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'certificados-nfse' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own certificados"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'certificados-nfse' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own certificados"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'certificados-nfse' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own certificados"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'certificados-nfse' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 11. Verificação
SELECT 'Correção aplicada com sucesso!' as status;
SELECT
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'certificados_nfse') as total_politicas,
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'certificados_nfse') as rls_habilitado,
    (SELECT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'certificados-nfse')) as storage_bucket_ok;
