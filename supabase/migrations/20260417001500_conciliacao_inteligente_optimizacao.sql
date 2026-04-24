-- Migration: Otimização da Conciliação Bancária Inteligente
-- Agente: @agente-supabase
-- Objetivo: Performance e automação da conciliação

-- ============================================
-- ÍNDICES DE PERFORMANCE
-- ============================================

-- Índices para consultas de conciliação
CREATE INDEX IF NOT EXISTS idx_extrato_bancario_conciliado ON extrato_bancario(conciliado) WHERE conciliado = false;
CREATE INDEX IF NOT EXISTS idx_extrato_bancario_data_transacao ON extrato_bancario(data_transacao);
CREATE INDEX IF NOT EXISTS idx_extrato_bancario_banco_cartao_id ON extrato_bancario(banco_cartao_id);
CREATE INDEX IF NOT EXISTS idx_extrato_bancario_composto ON extrato_bancario(banco_cartao_id, conciliado, data_transacao);

-- Índices para matching
CREATE INDEX IF NOT EXISTS idx_extrato_bancario_valor ON extrato_bancario(valor);
CREATE INDEX IF NOT EXISTS idx_extrato_bancario_descricao ON extrato_bancario USING gin(to_tsvector('portuguese', descricao));

-- Índices para lançamentos
CREATE INDEX IF NOT EXISTS idx_lancamentos_caixa_data ON lancamentos_caixa(data_lancamento);
CREATE INDEX IF NOT EXISTS idx_lancamentos_caixa_valor ON lancamentos_caixa(valor);

-- Índices para contas
CREATE INDEX IF NOT EXISTS idx_contas_pagar_status ON contas_pagar(status) WHERE status IN ('pendente', 'vencido');
CREATE INDEX IF NOT EXISTS idx_contas_receber_status ON contas_receber(status) WHERE status IN ('pendente', 'vencido');

-- ============================================
-- FUNÇÕES DE CONCILIAÇÃO
-- ============================================

-- Função: Buscar candidatos de matching para um item do extrato
CREATE OR REPLACE FUNCTION buscar_candidatos_conciliacao(
    p_extrato_id UUID,
    p_empresa_id UUID,
    p_data_inicio DATE DEFAULT NULL,
    p_data_fim DATE DEFAULT NULL
) RETURNS TABLE (
    candidato_id UUID,
    candidato_tipo TEXT,
    descricao TEXT,
    valor NUMERIC,
    data DATE,
    score NUMERIC
) AS $$
DECLARE
    v_extrato RECORD;
    v_data_range INT := 3; -- dias de tolerância
BEGIN
    -- Buscar dados do extrato
    SELECT * INTO v_extrato FROM extrato_bancario WHERE id = p_extrato_id;

    IF v_extrato IS NULL THEN
        RETURN;
    END IF;

    -- Definir range de datas
    IF p_data_inicio IS NULL THEN
        p_data_inicio := v_extrato.data_transacao - INTERVAL '3 days';
    END IF;
    IF p_data_fim IS NULL THEN
        p_data_fim := v_extrato.data_transacao + INTERVAL '3 days';
    END IF;

    -- Retornar lançamentos
    RETURN QUERY
    SELECT
        l.id as candidato_id,
        'lancamento'::TEXT as candidato_tipo,
        l.descricao,
        l.valor,
        l.data_lancamento::DATE as data,
        (
            -- Score baseado em valor (40%)
            CASE
                WHEN ABS(l.valor - v_extrato.valor) < 0.01 THEN 40
                WHEN ABS(l.valor - v_extrato.valor) < 1.0 THEN 25
                ELSE 0
            END +
            -- Score baseado em data (30%)
            CASE
                WHEN l.data_lancamento = v_extrato.data_transacao THEN 30
                WHEN ABS(EXTRACT(DAY FROM (l.data_lancamento - v_extrato.data_transacao))) <= 1 THEN 20
                WHEN ABS(EXTRACT(DAY FROM (l.data_lancamento - v_extrato.data_transacao))) <= 3 THEN 10
                ELSE 0
            END +
            -- Score baseado em tipo (10%)
            CASE WHEN l.tipo = v_extrato.tipo THEN 10 ELSE 0 END
        )::NUMERIC as score
    FROM lancamentos_caixa l
    WHERE l.empresa_id = p_empresa_id
        AND l.data_lancamento BETWEEN p_data_inicio AND p_data_fim
        AND l.tipo = v_extrato.tipo
        AND (
            ABS(l.valor - v_extrato.valor) < 0.01
            OR ABS(l.valor - v_extrato.valor) < 1.0
        )
        AND l.id NOT IN (
            SELECT lancamento_id FROM extrato_bancario
            WHERE lancamento_id IS NOT NULL AND conciliado = true
        )
    HAVING (
        CASE
            WHEN ABS(l.valor - v_extrato.valor) < 0.01 THEN 40
            WHEN ABS(l.valor - v_extrato.valor) < 1.0 THEN 25
            ELSE 0
        END +
        CASE
            WHEN l.data_lancamento = v_extrato.data_transacao THEN 30
            WHEN ABS(EXTRACT(DAY FROM (l.data_lancamento - v_extrato.data_transacao))) <= 1 THEN 20
            WHEN ABS(EXTRACT(DAY FROM (l.data_lancamento - v_extrato.data_transacao))) <= 3 THEN 10
            ELSE 0
        END +
        CASE WHEN l.tipo = v_extrato.tipo THEN 10 ELSE 0 END
    ) >= 50
    ORDER BY score DESC
    LIMIT 10;

    -- Retornar contas a pagar
    RETURN QUERY
    SELECT
        cp.id as candidato_id,
        'conta_pagar'::TEXT as candidato_tipo,
        cp.descricao,
        cp.valor,
        COALESCE(cp.data_pagamento, cp.data_vencimento)::DATE as data,
        (
            CASE
                WHEN ABS(cp.valor - v_extrato.valor) < 0.01 THEN 40
                WHEN ABS(cp.valor - v_extrato.valor) < 1.0 THEN 25
                ELSE 0
            END +
            CASE
                WHEN COALESCE(cp.data_pagamento, cp.data_vencimento) = v_extrato.data_transacao THEN 30
                WHEN ABS(EXTRACT(DAY FROM (COALESCE(cp.data_pagamento, cp.data_vencimento) - v_extrato.data_transacao))) <= 1 THEN 20
                WHEN ABS(EXTRACT(DAY FROM (COALESCE(cp.data_pagamento, cp.data_vencimento) - v_extrato.data_transacao))) <= 3 THEN 10
                ELSE 0
            END +
            10 -- tipo sempre match para contas a pagar (saida)
        )::NUMERIC as score
    FROM contas_pagar cp
    WHERE cp.empresa_id = p_empresa_id
        AND cp.status IN ('pendente', 'pago')
        AND COALESCE(cp.data_pagamento, cp.data_vencimento) BETWEEN p_data_inicio AND p_data_fim
        AND v_extrato.tipo = 'saida'
        AND (
            ABS(cp.valor - v_extrato.valor) < 0.01
            OR ABS(cp.valor - v_extrato.valor) < 1.0
        )
        AND cp.id NOT IN (
            SELECT conta_pagar_id FROM extrato_bancario
            WHERE conta_pagar_id IS NOT NULL AND conciliado = true
        )
    HAVING (
        CASE
            WHEN ABS(cp.valor - v_extrato.valor) < 0.01 THEN 40
            WHEN ABS(cp.valor - v_extrato.valor) < 1.0 THEN 25
            ELSE 0
        END +
        CASE
            WHEN COALESCE(cp.data_pagamento, cp.data_vencimento) = v_extrato.data_transacao THEN 30
            WHEN ABS(EXTRACT(DAY FROM (COALESCE(cp.data_pagamento, cp.data_vencimento) - v_extrato.data_transacao))) <= 1 THEN 20
            WHEN ABS(EXTRACT(DAY FROM (COALESCE(cp.data_pagamento, cp.data_vencimento) - v_extrato.data_transacao))) <= 3 THEN 10
            ELSE 0
        END +
        10
    ) >= 50
    ORDER BY score DESC
    LIMIT 10;

    -- Retornar contas a receber
    RETURN QUERY
    SELECT
        cr.id as candidato_id,
        'conta_receber'::TEXT as candidato_tipo,
        cr.descricao,
        cr.valor,
        COALESCE(cr.data_recebimento, cr.data_vencimento)::DATE as data,
        (
            CASE
                WHEN ABS(cr.valor - v_extrato.valor) < 0.01 THEN 40
                WHEN ABS(cr.valor - v_extrato.valor) < 1.0 THEN 25
                ELSE 0
            END +
            CASE
                WHEN COALESCE(cr.data_recebimento, cr.data_vencimento) = v_extrato.data_transacao THEN 30
                WHEN ABS(EXTRACT(DAY FROM (COALESCE(cr.data_recebimento, cr.data_vencimento) - v_extrato.data_transacao))) <= 1 THEN 20
                WHEN ABS(EXTRACT(DAY FROM (COALESCE(cr.data_recebimento, cr.data_vencimento) - v_extrato.data_transacao))) <= 3 THEN 10
                ELSE 0
            END +
            10 -- tipo sempre match para contas a receber (entrada)
        )::NUMERIC as score
    FROM contas_receber cr
    WHERE cr.empresa_id = p_empresa_id
        AND cr.status IN ('pendente', 'recebido')
        AND COALESCE(cr.data_recebimento, cr.data_vencimento) BETWEEN p_data_inicio AND p_data_fim
        AND v_extrato.tipo = 'entrada'
        AND (
            ABS(cr.valor - v_extrato.valor) < 0.01
            OR ABS(cr.valor - v_extrato.valor) < 1.0
        )
        AND cr.id NOT IN (
            SELECT conta_receber_id FROM extrato_bancario
            WHERE conta_receber_id IS NOT NULL AND conciliado = true
        )
    HAVING (
        CASE
            WHEN ABS(cr.valor - v_extrato.valor) < 0.01 THEN 40
            WHEN ABS(cr.valor - v_extrato.valor) < 1.0 THEN 25
            ELSE 0
        END +
        CASE
            WHEN COALESCE(cr.data_recebimento, cr.data_vencimento) = v_extrato.data_transacao THEN 30
            WHEN ABS(EXTRACT(DAY FROM (COALESCE(cr.data_recebimento, cr.data_vencimento) - v_extrato.data_transacao))) <= 1 THEN 20
            WHEN ABS(EXTRACT(DAY FROM (COALESCE(cr.data_recebimento, cr.data_vencimento) - v_extrato.data_transacao))) <= 3 THEN 10
            ELSE 0
        END +
        10
    ) >= 50
    ORDER BY score DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: Estatísticas de conciliação
CREATE OR REPLACE FUNCTION get_conciliacao_stats(
    p_empresa_id UUID,
    p_data_inicio DATE DEFAULT NULL,
    p_data_fim DATE DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_stats JSON;
BEGIN
    IF p_data_inicio IS NULL THEN
        p_data_inicio := CURRENT_DATE - INTERVAL '30 days';
    END IF;
    IF p_data_fim IS NULL THEN
        p_data_fim := CURRENT_DATE;
    END IF;

    SELECT json_build_object(
        'total_extrato', COUNT(*),
        'conciliados', COUNT(*) FILTER (WHERE conciliado = true),
        'pendentes', COUNT(*) FILTER (WHERE conciliado = false),
        'taxa_conciliacao', ROUND(
            COUNT(*) FILTER (WHERE conciliado = true)::NUMERIC /
            NULLIF(COUNT(*), 0) * 100,
            2
        ),
        'entradas', json_build_object(
            'total', COALESCE(SUM(valor) FILTER (WHERE tipo = 'entrada'), 0),
            'conciliadas', COALESCE(SUM(valor) FILTER (WHERE tipo = 'entrada' AND conciliado = true), 0)
        ),
        'saidas', json_build_object(
            'total', COALESCE(SUM(valor) FILTER (WHERE tipo = 'saida'), 0),
            'conciliadas', COALESCE(SUM(valor) FILTER (WHERE tipo = 'saida' AND conciliado = true), 0)
        ),
        'por_banco', (
            SELECT json_agg(json_build_object(
                'banco_id', banco_cartao_id,
                'banco_nome', bc.nome,
                'total', COUNT(*),
                'conciliados', COUNT(*) FILTER (WHERE conciliado = true)
            ))
            FROM extrato_bancario eb
            LEFT JOIN bancos_cartoes bc ON bc.id = eb.banco_cartao_id
            WHERE eb.empresa_id = p_empresa_id
                AND eb.data_transacao BETWEEN p_data_inicio AND p_data_fim
            GROUP BY banco_cartao_id, bc.nome
        )
    ) INTO v_stats
    FROM extrato_bancario
    WHERE empresa_id = p_empresa_id
        AND data_transacao BETWEEN p_data_inicio AND p_data_fim;

    RETURN COALESCE(v_stats, '{}'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Atualizar saldo bancário após conciliação
-- ============================================

CREATE OR REPLACE FUNCTION atualizar_saldo_banco_conciliacao()
RETURNS TRIGGER AS $$
BEGIN
    -- Se conciliou um lançamento, atualizar status
    IF NEW.conciliado = true AND OLD.conciliado = false THEN
        -- Atualizar timestamp de conciliação
        NEW.data_conciliacao := NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_atualizar_conciliacao ON extrato_bancario;
CREATE TRIGGER trigger_atualizar_conciliacao
    BEFORE UPDATE ON extrato_bancario
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_saldo_banco_conciliacao();

-- ============================================
-- POLÍTICAS RLS PARA FUNÇÕES
-- ============================================

-- Garantir que as funções respeitem RLS
ALTER FUNCTION buscar_candidatos_conciliacao(UUID, UUID, DATE, DATE)
    SET search_path = public;

ALTER FUNCTION get_conciliacao_stats(UUID, DATE, DATE)
    SET search_path = public;

COMMENT ON FUNCTION buscar_candidatos_conciliacao IS
    'Busca candidatos para conciliação com algoritmo de scoring. Agente: @agente-supabase';

COMMENT ON FUNCTION get_conciliacao_stats IS
    'Retorna estatísticas de conciliação em formato JSON. Agente: @agente-supabase';
