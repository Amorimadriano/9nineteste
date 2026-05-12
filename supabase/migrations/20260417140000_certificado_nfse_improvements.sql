-- ============================================
-- MIGRATION: Melhorias no Sistema de Certificados NFS-e
-- Data: 2026-04-17
-- ============================================

-- 1. Criar bucket no Storage para certificados (se não existir)
-- Executar via API do Supabase ou painel

-- 2. Atualizar tabela de certificados
-- Adicionar coluna para armazenar o caminho do arquivo no storage

-- Verificar se a tabela existe
DO $$
BEGIN
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
END $$;

-- 3. Criar índice para busca por user_id
CREATE INDEX IF NOT EXISTS idx_certificados_nfse_user_id
ON certificados_nfse(user_id);

-- 4. Criar índice para busca por ativo
CREATE INDEX IF NOT EXISTS idx_certificados_nfse_ativo
ON certificados_nfse(ativo) WHERE ativo = true;

-- 5. Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_certificado_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verificar se o trigger já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trigger_update_certificado_updated_at'
    ) THEN
        CREATE TRIGGER trigger_update_certificado_updated_at
        BEFORE UPDATE ON certificados_nfse
        FOR EACH ROW
        EXECUTE FUNCTION update_certificado_updated_at();
    END IF;
END $$;

-- 6. Configurar RLS (Row Level Security) se ainda não estiver configurado

-- Habilitar RLS
ALTER TABLE certificados_nfse ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para recriar
DROP POLICY IF EXISTS "Usuários podem ver seus próprios certificados" ON certificados_nfse;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios certificados" ON certificados_nfse;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios certificados" ON certificados_nfse;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios certificados" ON certificados_nfse;

-- Criar políticas
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

-- 7. Comentários para documentação
COMMENT ON TABLE certificados_nfse IS 'Tabela de certificados digitais A1 para emissão de NFS-e';
COMMENT ON COLUMN certificados_nfse.arquivo_path IS 'Caminho do arquivo no Supabase Storage';
COMMENT ON COLUMN certificados_nfse.cnpj IS 'CNPJ do titular do certificado';
COMMENT ON COLUMN certificados_nfse.emissor IS 'Autoridade Certificadora emissora';

-- 8. Verificar instalação
SELECT
    'Tabela certificados_nfse atualizada:' as info,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificados_nfse' AND column_name = 'arquivo_path') as arquivo_path,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificados_nfse' AND column_name = 'cnpj') as cnpj,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificados_nfse' AND column_name = 'emissor') as emissor;
