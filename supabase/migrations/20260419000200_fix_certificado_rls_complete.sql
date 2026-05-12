-- ============================================
-- MIGRATION: Correção Completa RLS para certificados_nfse
-- Data: 2026-04-19
-- ============================================

-- 1. Garantir que RLS está habilitado
ALTER TABLE certificados_nfse ENABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas existentes
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
    END LOOP;
END $$;

-- 3. Criar políticas individuais corretas
CREATE POLICY "select_certificados"
ON certificados_nfse
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "insert_certificados"
ON certificados_nfse
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_certificados"
ON certificados_nfse
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_certificados"
ON certificados_nfse
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 4. Garantir permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON certificados_nfse TO authenticated;
GRANT ALL ON certificados_nfse TO service_role;

-- 5. Verificar se existe constraint única em user_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_certificados_nfse_user_id_unique'
    ) THEN
        -- Tentar adicionar constraint única
        ALTER TABLE certificados_nfse
        DROP CONSTRAINT IF EXISTS unique_user_id;

        ALTER TABLE certificados_nfse
        ADD CONSTRAINT unique_user_id UNIQUE (user_id);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Constraint já existe ou erro ao criar: %', SQLERRM;
END $$;

-- 6. Recriar índices
DROP INDEX IF EXISTS idx_certificados_nfse_user_id;
CREATE INDEX idx_certificados_nfse_user_id ON certificados_nfse(user_id);

DROP INDEX IF EXISTS idx_certificados_nfse_ativo;
CREATE INDEX idx_certificados_nfse_ativo ON certificados_nfse(ativo) WHERE ativo = true;

-- Verificar instalação
SELECT 'Políticas RLS de certificados_nfse recriadas com sucesso!' as status;
