-- Script completo: Criar tabela plano_contas e inserir dados padrão
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

-- 2. Adicionar constraint única
ALTER TABLE public.plano_contas
DROP CONSTRAINT IF EXISTS unique_user_codigo;

ALTER TABLE public.plano_contas
ADD CONSTRAINT unique_user_codigo UNIQUE (user_id, codigo_conta);

-- 3. Criar índices
CREATE INDEX IF NOT EXISTS idx_plano_contas_user_id ON public.plano_contas(user_id);
CREATE INDEX IF NOT EXISTS idx_plano_contas_codigo ON public.plano_contas(codigo_conta);

-- 4. Habilitar RLS
ALTER TABLE public.plano_contas ENABLE ROW LEVEL SECURITY;

-- 5. Remover políticas existentes
DROP POLICY IF EXISTS select_plano_contas ON public.plano_contas;
DROP POLICY IF EXISTS insert_plano_contas ON public.plano_contas;
DROP POLICY IF EXISTS update_plano_contas ON public.plano_contas;
DROP POLICY IF EXISTS delete_plano_contas ON public.plano_contas;

-- 6. Criar políticas RLS
CREATE POLICY select_plano_contas ON public.plano_contas
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY insert_plano_contas ON public.plano_contas
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY update_plano_contas ON public.plano_contas
FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY delete_plano_contas ON public.plano_contas
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 7. Grants
GRANT ALL ON public.plano_contas TO authenticated;
GRANT ALL ON public.plano_contas TO service_role;

-- 8. Inserir plano de contas padrão para o usuário atual
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT auth.uid() INTO v_user_id;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Faça login primeiro!';
    END IF;

    -- Inserir contas padrão
    INSERT INTO public.plano_contas (user_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, descricao_reduzida, ativo, permite_lancamento) VALUES
    (v_user_id, '1', NULL, 1, 'sintetica', 'ativa', 'ATIVO', 'ATIVO', true, false),
    (v_user_id, '1.1', '1', 2, 'sintetica', 'ativa', 'Ativo Circulante', 'Ativo Circ.', true, false),
    (v_user_id, '1.1.01', '1.1', 3, 'sintetica', 'ativa', 'Caixa e Equivalentes', 'Caixa', true, false),
    (v_user_id, '1.1.01.0001', '1.1.01', 4, 'analitica', 'ativa', 'Caixa Geral', 'Caixa Geral', true, true),
    (v_user_id, '1.1.01.0002', '1.1.01', 4, 'analitica', 'ativa', 'Bancos', 'Bancos', true, true),
    (v_user_id, '2', NULL, 1, 'sintetica', 'passiva', 'PASSIVO', 'PASSIVO', true, false),
    (v_user_id, '2.1', '2', 2, 'sintetica', 'passiva', 'Passivo Circulante', 'Passivo Circ.', true, false),
    (v_user_id, '2.1.01', '2.1', 3, 'sintetica', 'passiva', 'Fornecedores', 'Fornecedores', true, false),
    (v_user_id, '2.1.01.0001', '2.1.01', 4, 'analitica', 'passiva', 'Fornecedores Nacionais', 'Forn. Nacionais', true, true),
    (v_user_id, '3', NULL, 1, 'sintetica', 'receita', 'RECEITAS', 'RECEITAS', true, false),
    (v_user_id, '3.1', '3', 2, 'sintetica', 'receita', 'Receitas Operacionais', 'Rec. Operac.', true, false),
    (v_user_id, '3.1.01', '3.1', 3, 'sintetica', 'receita', 'Vendas', 'Vendas', true, false),
    (v_user_id, '3.1.01.0001', '3.1.01', 4, 'analitica', 'receita', 'Vendas de Mercadorias', 'Vendas', true, true),
    (v_user_id, '4', NULL, 1, 'sintetica', 'despesa', 'DESPESAS', 'DESPESAS', true, false),
    (v_user_id, '4.1', '4', 2, 'sintetica', 'despesa', 'Despesas Operacionais', 'Desp. Operac.', true, false),
    (v_user_id, '4.1.01', '4.1', 3, 'sintetica', 'despesa', 'Pessoal', 'Pessoal', true, false),
    (v_user_id, '4.1.01.0001', '4.1.01', 4, 'analitica', 'despesa', 'Salários', 'Salários', true, true)
    ON CONFLICT (user_id, codigo_conta) DO NOTHING;

    RAISE NOTICE 'Plano de contas criado com sucesso!';
END $$;

-- Verificar
SELECT COUNT(*) as total_contas FROM public.plano_contas WHERE user_id = auth.uid();
