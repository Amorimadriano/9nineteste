-- Correção RLS Simplificada para Certificados
-- Execute no SQL Editor do Supabase

-- 1. Remover políticas existentes
DROP POLICY IF EXISTS all_certificados_nfse ON certificados_nfse;
DROP POLICY IF EXISTS select_certificados ON certificados_nfse;
DROP POLICY IF EXISTS insert_certificados ON certificados_nfse;
DROP POLICY IF EXISTS update_certificados ON certificados_nfse;
DROP POLICY IF EXISTS delete_certificados ON certificados_nfse;
DROP POLICY IF EXISTS "select_certificados_nfse" ON certificados_nfse;
DROP POLICY IF EXISTS "insert_certificados_nfse" ON certificados_nfse;
DROP POLICY IF EXISTS "update_certificados_nfse" ON certificados_nfse;
DROP POLICY IF EXISTS "delete_certificados_nfse" ON certificados_nfse;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON certificados_nfse;

-- 2. Garantir que tabela existe
CREATE TABLE IF NOT EXISTS public.certificados_nfse (
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

-- 3. Constraint única
ALTER TABLE public.certificados_nfse DROP CONSTRAINT IF EXISTS unique_user_id;
ALTER TABLE public.certificados_nfse ADD CONSTRAINT unique_user_id UNIQUE (user_id);

-- 4. Habilitar RLS
ALTER TABLE public.certificados_nfse ENABLE ROW LEVEL SECURITY;

-- 5. Política única simplificada
CREATE POLICY all_certificados_policy
ON public.certificados_nfse
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 6. Grants
GRANT ALL ON public.certificados_nfse TO authenticated;
GRANT ALL ON public.certificados_nfse TO service_role;

-- 7. Trigger
CREATE OR REPLACE FUNCTION update_certificado_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_certificado_updated_at ON public.certificados_nfse;
CREATE TRIGGER trigger_update_certificado_updated_at
    BEFORE UPDATE ON public.certificados_nfse
    FOR EACH ROW
    EXECUTE FUNCTION update_certificado_updated_at();

-- Verificar
SELECT 'RLS corrigido!' as status;
