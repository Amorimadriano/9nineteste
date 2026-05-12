-- ============================================
-- SCRIPT DE DIAGNÓSTICO: Verificar estado RLS certificados_nfse
-- Execute no SQL Editor do Supabase para verificar o estado atual
-- ============================================

-- 1. Verificar se a tabela existe
SELECT
    'Tabela certificados_nfse' as item,
    EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'certificados_nfse'
    ) as existe;

-- 2. Verificar estrutura da tabela
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'certificados_nfse'
ORDER BY ordinal_position;

-- 3. Verificar RLS está habilitado
SELECT
    tablename,
    rowsecurity as rls_habilitado,
    forcerowsecurity as rls_forcado
FROM pg_tables
WHERE tablename = 'certificados_nfse';

-- 4. Listar todas as políticas RLS
SELECT
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_expression,
    with_check
FROM pg_policies
WHERE tablename = 'certificados_nfse'
ORDER BY policyname;

-- 5. Verificar grants
SELECT
    grantee,
    privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'certificados_nfse'
AND grantee LIKE '%authenticated%';

-- 6. Verificar constraint única
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'certificados_nfse'::regclass
AND contype = 'u';

-- 7. Teste de verificação RLS (simulação)
-- Esta query mostra como as políticas seriam aplicadas
SELECT
    'Teste RLS: auth.uid() = ' || coalesce(auth.uid()::text, 'NULL') as current_user_id;

-- 8. Verificar se auth.uid() está acessível
DO $$
BEGIN
    RAISE NOTICE 'auth.uid() disponível: %', auth.uid();
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao acessar auth.uid(): %', SQLERRM;
END $$;
