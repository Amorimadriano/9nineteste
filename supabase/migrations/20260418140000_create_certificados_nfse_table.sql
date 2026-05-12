-- ============================================
-- MIGRATION: Criar tabela certificados_nfse
-- Data: 2026-04-18
-- ============================================

-- Criar tabela de certificados digitais para NFS-e
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

-- Comentários
COMMENT ON TABLE certificados_nfse IS 'Tabela de certificados digitais A1 para emissão de NFS-e';
COMMENT ON COLUMN certificados_nfse.arquivo_path IS 'Caminho do arquivo no Supabase Storage';
COMMENT ON COLUMN certificados_nfse.cnpj IS 'CNPJ do titular do certificado';
COMMENT ON COLUMN certificados_nfse.emissor IS 'Autoridade Certificadora emissora';

-- Índices
CREATE INDEX IF NOT EXISTS idx_certificados_nfse_user_id
ON certificados_nfse(user_id);

CREATE INDEX IF NOT EXISTS idx_certificados_nfse_ativo
ON certificados_nfse(ativo) WHERE ativo = true;

-- Trigger para atualizar updated_at
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

-- Grant para authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON certificados_nfse TO authenticated;
GRANT ALL ON certificados_nfse TO service_role;

-- ============================================
-- STORAGE BUCKET: certificados-nfse
-- ============================================
-- NOTA: O bucket deve ser criado manualmente no painel do Supabase
-- ou via API pois requer configuração de storage.
--
-- Configurações recomendadas para o bucket:
-- - Nome: certificados-nfse
-- - Public: false (privado)
-- - Allowed MIME types: application/x-pkcs12
-- - Max file size: 10MB
--
-- Políticas de storage necessárias (via SQL ou painel):
-- 1. SELECT: auth.uid() = owner
-- 2. INSERT: auth.uid() = owner
-- 3. DELETE: auth.uid() = owner
-- ============================================
