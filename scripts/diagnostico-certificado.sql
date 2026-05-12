-- Diagnóstico do estado das políticas RLS para certificados

-- Ver políticas existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'certificados_nfse';

-- Verificar se tabela existe
SELECT 
    table_name,
    row_security_active(tables.table_name::regclass) as rls_enabled
FROM information_schema.tables 
WHERE table_name = 'certificados_nfse';

-- Ver estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'certificados_nfse';
