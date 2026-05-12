-- ============================================
-- MIGRATION: Correção Definitiva RLS para Certificados
-- Data: 2026-04-19
-- ============================================

-- 1. Garantir que a tabela existe
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

-- 2. Remover constraint única existente e recriar
ALTER TABLE public.certificados_nfse
DROP CONSTRAINT IF EXISTS unique_user_id;

ALTER TABLE public.certificados_nfse
ADD CONSTRAINT unique_user_id UNIQUE (user_id);

-- 3. Habilitar RLS com FORCE
ALTER TABLE public.certificados_nfse ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificados_nfse FORCE ROW LEVEL SECURITY;

-- 4. Remover TODAS as políticas existentes
DO \$\$
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
END \$\$;

-- 5. Criar políticas RLS individuais

-- SELECT
CREATE POLICY "select_certificados_nfse"
ON public.certificados_nfse
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- INSERT
CREATE POLICY "insert_certificados_nfse"
ON public.certificados_nfse
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE
CREATE POLICY "update_certificados_nfse"
ON public.certificados_nfse
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE
CREATE POLICY "delete_certificados_nfse"
ON public.certificados_nfse
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 6. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificados_nfse TO authenticated;
GRANT ALL ON public.certificados_nfse TO service_role;

-- 7. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_certificado_updated_at()
RETURNS TRIGGER AS \$\$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
\$\$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_certificado_updated_at ON public.certificados_nfse;
CREATE TRIGGER trigger_update_certificado_updated_at
    BEFORE UPDATE ON public.certificados_nfse
    FOR EACH ROW
    EXECUTE FUNCTION update_certificado_updated_at();

-- 8. Verificação
SELECT 'Correção RLS aplicada com sucesso!' as status;
