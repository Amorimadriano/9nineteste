-- Migration: Correção da função verificar_ou_criar_plano_padrao
-- Data: 2026-04-19
-- Descrição: Remove dependência da função criar_plano_contas_padrao

-- ============================================
-- CORREÇÃO: Recriar função sem dependência externa
-- ============================================
CREATE OR REPLACE FUNCTION public.verificar_ou_criar_plano_padrao(
    p_user_id UUID,
    p_empresa_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
    v_contas_criadas INTEGER := 0;
BEGIN
    -- Verificar se já existe plano de contas
    SELECT COUNT(*) INTO v_count
    FROM public.plano_contas
    WHERE user_id = p_user_id
    AND (empresa_id = p_empresa_id OR (p_empresa_id IS NULL AND empresa_id IS NULL));

    -- Se já existe, retornar 0
    IF v_count > 0 THEN
        RETURN 0;
    END IF;

    -- Criar plano de contas padrão CFC simplificado

    -- ATIVO (1)
    INSERT INTO public.plano_contas (user_id, empresa_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, descricao_reduzida, ativo, permite_lancamento) VALUES
    (p_user_id, p_empresa_id, '1', NULL, 1, 'sintetica', 'ativa', 'ATIVO', 'ATIVO', true, false),
    (p_user_id, p_empresa_id, '1.1', '1', 2, 'sintetica', 'ativa', 'Ativo Circulante', 'Ativo Circ.', true, false),
    (p_user_id, p_empresa_id, '1.1.01', '1.1', 3, 'sintetica', 'ativa', 'Caixa e Equivalentes', 'Caixa', true, false),
    (p_user_id, p_empresa_id, '1.1.01.0001', '1.1.01', 4, 'analitica', 'ativa', 'Caixa Geral', 'Caixa Geral', true, true),
    (p_user_id, p_empresa_id, '1.1.01.0002', '1.1.01', 4, 'analitica', 'ativa', 'Bancos Conta Movimento', 'Bancos', true, true);
    v_contas_criadas := v_contas_criadas + 5;

    -- PASSIVO (2)
    INSERT INTO public.plano_contas (user_id, empresa_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, descricao_reduzida, ativo, permite_lancamento) VALUES
    (p_user_id, p_empresa_id, '2', NULL, 1, 'sintetica', 'passiva', 'PASSIVO', 'PASSIVO', true, false),
    (p_user_id, p_empresa_id, '2.1', '2', 2, 'sintetica', 'passiva', 'Passivo Circulante', 'Passivo Circ.', true, false),
    (p_user_id, p_empresa_id, '2.1.01', '2.1', 3, 'sintetica', 'passiva', 'Fornecedores', 'Fornecedores', true, false),
    (p_user_id, p_empresa_id, '2.1.01.0001', '2.1.01', 4, 'analitica', 'passiva', 'Fornecedores Nacionais', 'Forn. Nacionais', true, true);
    v_contas_criadas := v_contas_criadas + 4;

    -- RECEITAS (3)
    INSERT INTO public.plano_contas (user_id, empresa_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, descricao_reduzida, ativo, permite_lancamento) VALUES
    (p_user_id, p_empresa_id, '3', NULL, 1, 'sintetica', 'receita', 'RECEITAS', 'RECEITAS', true, false),
    (p_user_id, p_empresa_id, '3.1', '3', 2, 'sintetica', 'receita', 'Receitas Operacionais', 'Rec. Operac.', true, false),
    (p_user_id, p_empresa_id, '3.1.01', '3.1', 3, 'sintetica', 'receita', 'Vendas de Mercadorias', 'Vendas', true, false),
    (p_user_id, p_empresa_id, '3.1.01.0001', '3.1.01', 4, 'analitica', 'receita', 'Vendas de Mercadorias', 'Vendas', true, true),
    (p_user_id, p_empresa_id, '3.1.02', '3.1', 3, 'sintetica', 'receita', 'Serviços Prestados', 'Serviços', true, false),
    (p_user_id, p_empresa_id, '3.1.02.0001', '3.1.02', 4, 'analitica', 'receita', 'Serviços de Consultoria', 'Consultoria', true, true),
    (p_user_id, p_empresa_id, '3.1.02.0002', '3.1.02', 4, 'analitica', 'receita', 'BPO Financeiro', 'BPO', true, true),
    (p_user_id, p_empresa_id, '3.1.02.0003', '3.1.02', 4, 'analitica', 'receita', 'Serviços Contábeis', 'Contábil', true, true);
    v_contas_criadas := v_contas_criadas + 7;

    -- DESPESAS (4)
    INSERT INTO public.plano_contas (user_id, empresa_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, descricao_reduzida, ativo, permite_lancamento) VALUES
    (p_user_id, p_empresa_id, '4', NULL, 1, 'sintetica', 'despesa', 'DESPESAS', 'DESPESAS', true, false),
    (p_user_id, p_empresa_id, '4.1', '4', 2, 'sintetica', 'despesa', 'Despesas Operacionais', 'Desp. Operac.', true, false),
    (p_user_id, p_empresa_id, '4.1.01', '4.1', 3, 'sintetica', 'despesa', 'Pessoal', 'Pessoal', true, false),
    (p_user_id, p_empresa_id, '4.1.01.0001', '4.1.01', 4, 'analitica', 'despesa', 'Salários e Ordenados', 'Salários', true, true),
    (p_user_id, p_empresa_id, '4.1.01.0002', '4.1.01', 4, 'analitica', 'despesa', 'Encargos Sociais', 'Encargos', true, true),
    (p_user_id, p_empresa_id, '4.1.02', '4.1', 3, 'sintetica', 'despesa', 'Despesas Administrativas', 'Desp. Admin.', true, false),
    (p_user_id, p_empresa_id, '4.1.02.0001', '4.1.02', 4, 'analitica', 'despesa', 'Aluguel', 'Aluguel', true, true),
    (p_user_id, p_empresa_id, '4.1.02.0002', '4.1.02', 4, 'analitica', 'despesa', 'Condomínio', 'Condomínio', true, true),
    (p_user_id, p_empresa_id, '4.1.02.0003', '4.1.02', 4, 'analitica', 'despesa', 'Energia Elétrica', 'Energia', true, true),
    (p_user_id, p_empresa_id, '4.1.02.0004', '4.1.02', 4, 'analitica', 'despesa', 'Água e Esgoto', 'Água', true, true),
    (p_user_id, p_empresa_id, '4.1.02.0005', '4.1.02', 4, 'analitica', 'despesa', 'Telefone e Internet', 'Telefone', true, true),
    (p_user_id, p_empresa_id, '4.1.02.0006', '4.1.02', 4, 'analitica', 'despesa', 'Material de Escritório', 'Material', true, true);
    v_contas_criadas := v_contas_criadas + 11;

    RETURN v_contas_criadas;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.verificar_ou_criar_plano_padrao IS
'Verifica se existe plano de contas, se não existir cria um plano padrão simplificado';

-- Verificar instalação
SELECT 'Função verificar_ou_criar_plano_padrao corrigida com sucesso!' as status;
