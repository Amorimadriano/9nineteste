-- ============================================
-- MIGRATION: Correção função criar_plano_contas_padrao
-- Data: 2026-04-19
-- ============================================

-- Drop function se existir
DROP FUNCTION IF EXISTS public.criar_plano_contas_padrao(UUID, UUID);

-- Recriar função corretamente
CREATE OR REPLACE FUNCTION public.criar_plano_contas_padrao(
    p_user_id UUID,
    p_empresa_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_temp INTEGER;
BEGIN
    -- ATIVO (1)
    INSERT INTO public.plano_contas (user_id, empresa_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, permite_lancamento) VALUES
    (p_user_id, p_empresa_id, '1', NULL, 1, 'sintetica', 'ativa', 'ATIVO', false),
    (p_user_id, p_empresa_id, '1.1', '1', 2, 'sintetica', 'ativa', 'Ativo Circulante', false),
    (p_user_id, p_empresa_id, '1.1.01', '1.1', 3, 'sintetica', 'ativa', 'Caixa e Equivalentes', false),
    (p_user_id, p_empresa_id, '1.1.01.0001', '1.1.01', 4, 'analitica', 'ativa', 'Caixa Geral', true),
    (p_user_id, p_empresa_id, '1.1.01.0002', '1.1.01', 4, 'analitica', 'ativa', 'Bancos Conta Movimento', true),
    (p_user_id, p_empresa_id, '1.1.02', '1.1', 3, 'sintetica', 'ativa', 'Contas a Receber', false),
    (p_user_id, p_empresa_id, '1.1.02.0001', '1.1.02', 4, 'analitica', 'ativa', 'Clientes', true),
    (p_user_id, p_empresa_id, '1.1.03', '1.1', 3, 'sintetica', 'ativa', 'Estoques', false),
    (p_user_id, p_empresa_id, '1.1.03.0001', '1.1.03', 4, 'analitica', 'ativa', 'Mercadorias', true),
    (p_user_id, p_empresa_id, '1.2', '1', 2, 'sintetica', 'ativa', 'Ativo Não Circulante', false),
    (p_user_id, p_empresa_id, '1.2.04', '1.2', 3, 'sintetica', 'ativa', 'Imobilizado', false),
    (p_user_id, p_empresa_id, '1.2.04.0001', '1.2.04', 4, 'analitica', 'ativa', 'Móveis e Utensílios', true);
    GET DIAGNOSTICS v_temp = ROW_COUNT;
    v_count := v_count + v_temp;

    -- PASSIVO (2)
    INSERT INTO public.plano_contas (user_id, empresa_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, permite_lancamento) VALUES
    (p_user_id, p_empresa_id, '2', NULL, 1, 'sintetica', 'passiva', 'PASSIVO', false),
    (p_user_id, p_empresa_id, '2.1', '2', 2, 'sintetica', 'passiva', 'Passivo Circulante', false),
    (p_user_id, p_empresa_id, '2.1.01', '2.1', 3, 'sintetica', 'passiva', 'Fornecedores', false),
    (p_user_id, p_empresa_id, '2.1.01.0001', '2.1.01', 4, 'analitica', 'passiva', 'Fornecedores Nacionais', true),
    (p_user_id, p_empresa_id, '2.1.03', '2.1', 3, 'sintetica', 'passiva', 'Obrigações Fiscais', false),
    (p_user_id, p_empresa_id, '2.1.03.0001', '2.1.03', 4, 'analitica', 'passiva', 'Impostos a Pagar', true),
    (p_user_id, p_empresa_id, '2.1.03.0002', '2.1.03', 4, 'analitica', 'passiva', 'ISS a Recolher', true),
    (p_user_id, p_empresa_id, '2.1.04', '2.1', 3, 'sintetica', 'passiva', 'Obrigações Trabalhistas', false),
    (p_user_id, p_empresa_id, '2.1.04.0001', '2.1.04', 4, 'analitica', 'passiva', 'Salários a Pagar', true);
    GET DIAGNOSTICS v_temp = ROW_COUNT;
    v_count := v_count + v_temp;

    -- RECEITAS (3)
    INSERT INTO public.plano_contas (user_id, empresa_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, permite_lancamento) VALUES
    (p_user_id, p_empresa_id, '3', NULL, 1, 'sintetica', 'receita', 'RECEITAS', false),
    (p_user_id, p_empresa_id, '3.1', '3', 2, 'sintetica', 'receita', 'Receitas Operacionais', false),
    (p_user_id, p_empresa_id, '3.1.01', '3.1', 3, 'sintetica', 'receita', 'Vendas', false),
    (p_user_id, p_empresa_id, '3.1.01.0001', '3.1.01', 4, 'analitica', 'receita', 'Vendas de Mercadorias', true),
    (p_user_id, p_empresa_id, '3.1.02', '3.1', 3, 'sintetica', 'receita', 'Serviços', false),
    (p_user_id, p_empresa_id, '3.1.02.0001', '3.1.02', 4, 'analitica', 'receita', 'Serviços Prestados', true),
    (p_user_id, p_empresa_id, '3.1.02.0002', '3.1.02', 4, 'analitica', 'receita', 'Consultoria', true);
    GET DIAGNOSTICS v_temp = ROW_COUNT;
    v_count := v_count + v_temp;

    -- DESPESAS (4)
    INSERT INTO public.plano_contas (user_id, empresa_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, permite_lancamento) VALUES
    (p_user_id, p_empresa_id, '4', NULL, 1, 'sintetica', 'despesa', 'DESPESAS', false),
    (p_user_id, p_empresa_id, '4.1', '4', 2, 'sintetica', 'despesa', 'Despesas Operacionais', false),
    (p_user_id, p_empresa_id, '4.1.01', '4.1', 3, 'sintetica', 'despesa', 'Pessoal', false),
    (p_user_id, p_empresa_id, '4.1.01.0001', '4.1.01', 4, 'analitica', 'despesa', 'Salários', true),
    (p_user_id, p_empresa_id, '4.1.01.0002', '4.1.01', 4, 'analitica', 'despesa', 'Encargos Sociais', true),
    (p_user_id, p_empresa_id, '4.1.02', '4.1', 3, 'sintetica', 'despesa', 'Despesas Administrativas', false),
    (p_user_id, p_empresa_id, '4.1.02.0001', '4.1.02', 4, 'analitica', 'despesa', 'Aluguel', true),
    (p_user_id, p_empresa_id, '4.1.02.0002', '4.1.02', 4, 'analitica', 'despesa', 'Energia', true),
    (p_user_id, p_empresa_id, '4.1.02.0003', '4.1.02', 4, 'analitica', 'despesa', 'Telefone', true);
    GET DIAGNOSTICS v_temp = ROW_COUNT;
    v_count := v_count + v_temp;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário
COMMENT ON FUNCTION public.criar_plano_contas_padrao IS
'Cria plano de contas padrão simplificado para o usuário';

-- Grant para authenticated
GRANT EXECUTE ON FUNCTION public.criar_plano_contas_padrao(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.criar_plano_contas_padrao(UUID, UUID) TO service_role;

-- Verificar instalação
SELECT 'Função criar_plano_contas_padrao recriada com sucesso!' as status;
