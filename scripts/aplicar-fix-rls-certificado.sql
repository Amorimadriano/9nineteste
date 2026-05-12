-- Script de correção rápida para RLS de certificados
-- Execute no SQL Editor do Supabase

-- Limpar e recriar políticas
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

-- Política única simplificada (abordagem alternativa)
CREATE POLICY "all_certificados_nfse"
ON public.certificados_nfse
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Grant
GRANT ALL ON public.certificados_nfse TO authenticated;

SELECT 'Política RLS simplificada aplicada!' as status;
