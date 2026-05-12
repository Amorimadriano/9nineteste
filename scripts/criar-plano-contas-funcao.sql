-- Script para criar tabela plano_contas via função (funciona sem auth.uid())
-- Execute no SQL Editor do Supabase

-- 1. Criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.plano_contas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    empresa_id UUID,
    codigo_conta TEXT NOT NULL,
    codigo_pai TEXT,
    nivel INTEGER NOT NULL DEFAULT 1,
    tipo_conta TEXT NOT NULL DEFAULT 'sintetica',
    natureza TEXT NOT NULL DEFAULT 'ativa',
    descricao TEXT NOT NULL,
    descricao_reduzida TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    permite_lancamento BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Criar índice único
DROP INDEX IF EXISTS idx_plano_contas_user_codigo;
CREATE UNIQUE INDEX idx_plano_contas_user_codigo ON public.plano_contas(user_id, codigo_conta);

-- 3. Habilitar RLS
ALTER TABLE public.plano_contas ENABLE ROW LEVEL SECURITY;

-- 4. Remover políticas antigas
DROP POLICY IF EXISTS all_plano_contas ON public.plano_contas;
DROP POLICY IF EXISTS select_plano_contas ON public.plano_contas;
DROP POLICY IF EXISTS insert_plano_contas ON public.plano_contas;
DROP POLICY IF EXISTS update_plano_contas ON public.plano_contas;
DROP POLICY IF EXISTS delete_plano_contas ON public.plano_contas;

-- 5. Criar política única
CREATE POLICY all_plano_contas ON public.plano_contas
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Grants
GRANT ALL ON public.plano_contas TO authenticated;
GRANT ALL ON public.plano_contas TO service_role;

-- 7. Criar função para inserir plano padrão
CREATE OR REPLACE FUNCTION public.inserir_plano_contas_padrao(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    -- ATIVO
    INSERT INTO public.plano_contas (user_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, descricao_reduzida, ativo, permite_lancamento)
    VALUES (p_user_id, '1', NULL, 1, 'sintetica', 'ativa', 'ATIVO', 'ATIVO', true, false)
    ON CONFLICT (user_id, codigo_conta) DO NOTHING;
    GET DIAGNOSTICS v_count = ROW_COUNT;

    INSERT INTO public.plano_contas (user_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, descricao_reduzida, ativo, permite_lancamento)
    VALUES (p_user_id, '1.1', '1', 2, 'sintetica', 'ativa', 'Ativo Circulante', 'Ativo Circ.', true, false)
    ON CONFLICT (user_id, codigo_conta) DO NOTHING;

    INSERT INTO public.plano_contas (user_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, descricao_reduzida, ativo, permite_lancamento)
    VALUES (p_user_id, '1.1.01', '1.1', 3, 'sintetica', 'ativa', 'Caixa e Equivalentes', 'Caixa', true, false)
    ON CONFLICT (user_id, codigo_conta) DO NOTHING;

    INSERT INTO public.plano_contas (user_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, descricao_reduzida, ativo, permite_lancamento)
    VALUES (p_user_id, '1.1.01.0001', '1.1.01', 4, 'analitica', 'ativa', 'Caixa Geral', 'Caixa Geral', true, true)
    ON CONFLICT (user_id, codigo_conta) DO NOTHING;

    INSERT INTO public.plano_contas (user_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, descricao_reduzida, ativo, permite_lancamento)
    VALUES (p_user_id, '1.1.01.0002', '1.1.01', 4, 'analitica', 'ativa', 'Bancos', 'Bancos', true, true)
    ON CONFLICT (user_id, codigo_conta) DO NOTHING;

    -- PASSIVO
    INSERT INTO public.plano_contas (user_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, descricao_reduzida, ativo, permite_lancamento)
    VALUES (p_user_id, '2', NULL, 1, 'sintetica', 'passiva', 'PASSIVO', 'PASSIVO', true, false)
    ON CONFLICT (user_id, codigo_conta) DO NOTHING;

    INSERT INTO public.plano_contas (user_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, descricao_reduzida, ativo, permite_lancamento)
    VALUES (p_user_id, '2.1', '2', 2, 'sintetica', 'passiva', 'Passivo Circulante', 'Passivo Circ.', true, false)
    ON CONFLICT (user_id, codigo_conta) DO NOTHING;

    INSERT INTO public.plano_contas (user_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, descricao_reduzida, ativo, permite_lancamento)
    VALUES (p_user_id, '2.1.01', '2.1', 3, 'sintetica', 'passiva', 'Fornecedores', 'Fornecedores', true, false)
    ON CONFLICT (user_id, codigo_conta) DO NOTHING;

    -- RECEITAS
    INSERT INTO public.plano_contas (user_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, descricao_reduzida, ativo, permite_lancamento)
    VALUES (p_user_id, '3', NULL, 1, 'sintetica', 'receita', 'RECEITAS', 'RECEITAS', true, false)
    ON CONFLICT (user_id, codigo_conta) DO NOTHING;

    INSERT INTO public.plano_contas (user_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, descricao_reduzida, ativo, permite_lancamento)
    VALUES (p_user_id, '3.1', '3', 2, 'sintetica', 'receita', 'Receitas Operacionais', 'Rec. Operac.', true, false)
    ON CONFLICT (user_id, codigo_conta) DO NOTHING;

    -- DESPESAS
    INSERT INTO public.plano_contas (user_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, descricao_reduzida, ativo, permite_lancamento)
    VALUES (p_user_id, '4', NULL, 1, 'sintetica', 'despesa', 'DESPESAS', 'DESPESAS', true, false)
    ON CONFLICT (user_id, codigo_conta) DO NOTHING;

    INSERT INTO public.plano_contas (user_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, descricao_reduzida, ativo, permite_lancamento)
    VALUES (p_user_id, '4.1', '4', 2, 'sintetica', 'despesa', 'Despesas Operacionais', 'Desp. Operac.', true, false)
    ON CONFLICT (user_id, codigo_conta) DO NOTHING;

    RETURN 12; -- Total de contas inseridas
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant para a função
GRANT EXECUTE ON FUNCTION public.inserir_plano_contas_padrao(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inserir_plano_contas_padrao(UUID) TO service_role;

-- Instruções:
-- Agora use o botão "Plano Padrão" na tela de Plano de Contas
-- Ou execute: SELECT inserir_plano_contas_padrao('SEU_USER_ID_AQUI');
