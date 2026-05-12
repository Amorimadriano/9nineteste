-- Inserir plano de contas padrão simplificado
-- Execute no SQL Editor do Supabase

-- Verificar usuário atual
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Pegar o usuário atual (você precisa estar logado)
    SELECT auth.uid() INTO v_user_id;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado. Faça login primeiro.';
    END IF;

    -- Inserir contas do plano padrão
    INSERT INTO public.plano_contas (user_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, descricao_reduzida, ativo, permite_lancamento) VALUES
    -- ATIVO
    (v_user_id, '1', NULL, 1, 'sintetica', 'ativa', 'ATIVO', 'ATIVO', true, false),
    (v_user_id, '1.1', '1', 2, 'sintetica', 'ativa', 'Ativo Circulante', 'Ativo Circ.', true, false),
    (v_user_id, '1.1.01', '1.1', 3, 'sintetica', 'ativa', 'Caixa e Equivalentes', 'Caixa', true, false),
    (v_user_id, '1.1.01.0001', '1.1.01', 4, 'analitica', 'ativa', 'Caixa Geral', 'Caixa Geral', true, true),
    (v_user_id, '1.1.01.0002', '1.1.01', 4, 'analitica', 'ativa', 'Bancos', 'Bancos', true, true),
    -- PASSIVO
    (v_user_id, '2', NULL, 1, 'sintetica', 'passiva', 'PASSIVO', 'PASSIVO', true, false),
    (v_user_id, '2.1', '2', 2, 'sintetica', 'passiva', 'Passivo Circulante', 'Passivo Circ.', true, false),
    (v_user_id, '2.1.01', '2.1', 3, 'sintetica', 'passiva', 'Fornecedores', 'Fornecedores', true, false),
    (v_user_id, '2.1.01.0001', '2.1.01', 4, 'analitica', 'passiva', 'Fornecedores Nacionais', 'Forn. Nacionais', true, true),
    -- RECEITAS
    (v_user_id, '3', NULL, 1, 'sintetica', 'receita', 'RECEITAS', 'RECEITAS', true, false),
    (v_user_id, '3.1', '3', 2, 'sintetica', 'receita', 'Receitas Operacionais', 'Rec. Operac.', true, false),
    (v_user_id, '3.1.01', '3.1', 3, 'sintetica', 'receita', 'Vendas', 'Vendas', true, false),
    (v_user_id, '3.1.01.0001', '3.1.01', 4, 'analitica', 'receita', 'Vendas de Mercadorias', 'Vendas', true, true),
    -- DESPESAS
    (v_user_id, '4', NULL, 1, 'sintetica', 'despesa', 'DESPESAS', 'DESPESAS', true, false),
    (v_user_id, '4.1', '4', 2, 'sintetica', 'despesa', 'Despesas Operacionais', 'Desp. Operac.', true, false),
    (v_user_id, '4.1.01', '4.1', 3, 'sintetica', 'despesa', 'Pessoal', 'Pessoal', true, false),
    (v_user_id, '4.1.01.0001', '4.1.01', 4, 'analitica', 'despesa', 'Salários', 'Salários', true, true)
    ON CONFLICT (user_id, codigo_conta) DO NOTHING;

    RAISE NOTICE 'Plano de contas padrão criado com sucesso!';
END $$;
