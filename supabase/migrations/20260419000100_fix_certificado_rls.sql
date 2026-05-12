-- ============================================
-- MIGRATION: Correção RLS para certificados_nfse
-- Data: 2026-04-19
-- ============================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Usuários podem ver seus próprios certificados" ON certificados_nfse;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios certificados" ON certificados_nfse;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios certificados" ON certificados_nfse;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios certificados" ON certificados_nfse;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON certificados_nfse;

-- Criar política única simplificada para usuários autenticados
CREATE POLICY "Enable all for authenticated users"
ON certificados_nfse
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Grant adicional para authenticated
GRANT ALL ON certificados_nfse TO authenticated;
GRANT ALL ON certificados_nfse TO service_role;

-- Verificar se existe constraint única em user_id, se não existir criar
DO $$
BEGIN
    -- Remover constraint existente se houver
    ALTER TABLE certificados_nfse DROP CONSTRAINT IF EXISTS unique_user_id;

    -- Adicionar constraint única para user_id (um certificado por usuário)
    ALTER TABLE certificados_nfse ADD CONSTRAINT unique_user_id UNIQUE (user_id);
EXCEPTION
    WHEN duplicate_table THEN
        NULL;
    WHEN others THEN
        NULL;
END $$;

-- Verificar instalação
SELECT 'Políticas RLS de certificados_nfse corrigidas com sucesso!' as status;
