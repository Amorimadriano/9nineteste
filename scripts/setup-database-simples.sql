-- ============================================
-- CONFIGURAÇÃO DO BANCO - CERTIFICADOS NFS-e
-- Execute este script no SQL Editor do Supabase
-- Link: https://app.supabase.com/project/tomrlopsmxgvzgqsfizh/sql/new
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
