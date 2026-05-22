-- ============================================
-- MIGRATION: Melhorias no Sistema de Certificados NFS-e
-- Data: 2026-04-17
-- ============================================

-- 1. Criar bucket no Storage para certificados (se não existir)
-- Executar via API do Supabase ou painel

-- 2. Atualizar tabela de certificados (se existir)
-- Adicionar coluna para armazenar o caminho do arquivo no storage

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'certificados_nfse'
    ) THEN
        -- Adicionar coluna arquivo_path se não existir
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'certificados_nfse'
            AND column_name = 'arquivo_path'
        ) THEN
            ALTER TABLE certificados_nfse
            ADD COLUMN arquivo_path TEXT;
        END IF;

        -- Adicionar coluna cnpj se não existir
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'certificados_nfse'
            AND column_name = 'cnpj'
        ) THEN
            ALTER TABLE certificados_nfse
            ADD COLUMN cnpj TEXT;
        END IF;

        -- Adicionar coluna emissor se não existir
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'certificados_nfse'
            AND column_name = 'emissor'
        ) THEN
            ALTER TABLE certificados_nfse
            ADD COLUMN emissor TEXT;
        END IF;

        -- Adicionar coluna created_at se não existir
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'certificados_nfse'
            AND column_name = 'created_at'
        ) THEN
            ALTER TABLE certificados_nfse
            ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
    END IF;
END $$;

-- 3. Criar índice para busca por user_id (se tabela existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'certificados_nfse'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_certificados_nfse_user_id
        ON certificados_nfse(user_id);
    END IF;
END $$;

-- 4. Criar índice para busca por ativo (se tabela existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'certificados_nfse'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_certificados_nfse_ativo
        ON certificados_nfse(ativo) WHERE ativo = true;
    END IF;
END $$;

-- 5. Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_certificado_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verificar se o trigger já existe (se tabela existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'certificados_nfse'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_trigger
            WHERE tgname = 'trigger_update_certificado_updated_at'
            AND tgrelid = 'certificados_nfse'::regclass
        ) THEN
            CREATE TRIGGER trigger_update_certificado_updated_at
            BEFORE UPDATE ON certificados_nfse
            FOR EACH ROW
            EXECUTE FUNCTION update_certificado_updated_at();
        END IF;
    END IF;
END $$;

-- 6. Configurar RLS (Row Level Security) se a tabela existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'certificados_nfse'
    ) THEN
        ALTER TABLE certificados_nfse ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Usuários podem ver seus próprios certificados" ON certificados_nfse;
        DROP POLICY IF EXISTS "Usuários podem inserir seus próprios certificados" ON certificados_nfse;
        DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios certificados" ON certificados_nfse;
        DROP POLICY IF EXISTS "Usuários podem deletar seus próprios certificados" ON certificados_nfse;

        CREATE POLICY "Usuários podem ver seus próprios certificados"
        ON certificados_nfse
        FOR SELECT
        USING (auth.uid() = user_id);

        CREATE POLICY "Usuários podem inserir seus próprios certificados"
        ON certificados_nfse
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Usuários podem atualizar seus próprios certificados"
        ON certificados_nfse
        FOR UPDATE
        USING (auth.uid() = user_id);

        CREATE POLICY "Usuários podem deletar seus próprios certificados"
        ON certificados_nfse
        FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- 7. Comentários para documentação (se tabela existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'certificados_nfse'
    ) THEN
        COMMENT ON TABLE certificados_nfse IS 'Tabela de certificados digitais A1 para emissão de NFS-e';
        COMMENT ON COLUMN certificados_nfse.arquivo_path IS 'Caminho do arquivo no Supabase Storage';
        COMMENT ON COLUMN certificados_nfse.cnpj IS 'CNPJ do titular do certificado';
        COMMENT ON COLUMN certificados_nfse.emissor IS 'Autoridade Certificadora emissora';
    END IF;
END $$;
