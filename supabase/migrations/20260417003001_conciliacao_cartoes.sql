-- Migration: Conciliação de Cartões
-- Agente: @agente-supabase
-- Data: 2026-04-17
-- Descrição: Schema completo para conciliação de cartões de crédito/débito

-- ============================================
-- TABELAS PRINCIPAIS
-- ============================================

-- Tabela: Configurações de cartão por empresa
CREATE TABLE IF NOT EXISTS configuracoes_cartao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),

    -- Taxas por bandeira (%)
    taxa_visa DECIMAL(5,4) DEFAULT 0.0199,
    taxa_mastercard DECIMAL(5,4) DEFAULT 0.0199,
    taxa_elo DECIMAL(5,4) DEFAULT 0.0229,
    taxa_amex DECIMAL(5,4) DEFAULT 0.0299,
    taxa_hipercard DECIMAL(5,4) DEFAULT 0.0250,
    taxa_outros DECIMAL(5,4) DEFAULT 0.0250,

    -- Prazos de recebimento (dias)
    prazo_credito_dias INTEGER DEFAULT 30,
    prazo_debito_dias INTEGER DEFAULT 1,
    prazo_parcelado_dias INTEGER DEFAULT 30,

    -- Critérios de conciliação (JSONB)
    criterios_conciliacao JSONB DEFAULT '{
        "tolerancia_valor": 0.50,
        "tolerancia_dias": 2,
        "peso_valor": 0.50,
        "peso_data": 0.30,
        "peso_bandeira": 0.10,
        "peso_nsu": 0.10
    }'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(empresa_id)
);

-- Tabela: Transações de cartão
CREATE TABLE IF NOT EXISTS transacoes_cartao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),

    -- Dados da transação
    data_transacao DATE NOT NULL,
    data_pagamento DATE, -- quando a operadora vai pagar
    bandeira VARCHAR(20) NOT NULL CHECK (bandeira IN ('visa', 'mastercard', 'elo', 'amex', 'hipercard', 'diners', 'discover', 'jcb', 'outros')),

    -- Valores
    valor_bruto DECIMAL(15,2) NOT NULL,
    taxa_percentual DECIMAL(5,4) DEFAULT 0,
    valor_taxa DECIMAL(15,2) DEFAULT 0,
    valor_liquido DECIMAL(15,2) NOT NULL,

    -- Dados do cartão (sensíveis - mascarados)
    numero_cartao_mascara VARCHAR(4), -- últimos 4 dígitos apenas
    nsu VARCHAR(50), -- número sequencial único
    codigo_autorizacao VARCHAR(20),

    -- Tipo e status
    tipo_transacao VARCHAR(20) DEFAULT 'credito' CHECK (tipo_transacao IN ('credito', 'debito', 'parcelado')),
    numero_parcelas INTEGER DEFAULT 1,
    parcela_atual INTEGER DEFAULT 1,

    -- Conciliação
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'conciliado', 'divergente', 'chargeback', 'cancelado')),
    conciliado_com UUID, -- referência para conta_receber ou lancamento
    conciliado_tipo VARCHAR(20) CHECK (conciliado_tipo IN ('conta_receber', 'lancamento')),
    conciliado_em TIMESTAMPTZ,
    score_conciliacao DECIMAL(5,2),

    -- Dados brutos do extrato
    linha_extrato TEXT,
    arquivo_origem VARCHAR(255),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: Auditoria de transações (para segurança)
CREATE TABLE IF NOT EXISTS auditoria_transacoes_cartao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    empresa_id UUID,
    tabela TEXT NOT NULL,
    operacao TEXT NOT NULL CHECK (operacao IN ('INSERT', 'UPDATE', 'DELETE')),
    registro_id UUID,
    dados_antigos JSONB,
    dados_novos JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES DE PERFORMANCE
-- ============================================

-- Índices para transacoes_cartao
CREATE INDEX IF NOT EXISTS idx_transacoes_cartao_empresa ON transacoes_cartao(empresa_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_cartao_status ON transacoes_cartao(status);
CREATE INDEX IF NOT EXISTS idx_transacoes_cartao_data ON transacoes_cartao(data_transacao);
CREATE INDEX IF NOT EXISTS idx_transacoes_cartao_bandeira ON transacoes_cartao(bandeira);
CREATE INDEX IF NOT EXISTS idx_transacoes_cartao_composto ON transacoes_cartao(empresa_id, status, data_transacao);
CREATE INDEX IF NOT EXISTS idx_transacoes_cartao_valor ON transacoes_cartao(valor_liquido);
CREATE INDEX IF NOT EXISTS idx_transacoes_cartao_conciliado ON transacoes_cartao(conciliado_com) WHERE conciliado_com IS NOT NULL;

-- Índices GIN para busca textual
CREATE INDEX IF NOT EXISTS idx_transacoes_cartao_descricao ON transacoes_cartao USING gin(to_tsvector('portuguese', COALESCE(linha_extrato, '')));

-- Índices para auditoria
CREATE INDEX IF NOT EXISTS idx_auditoria_empresa ON auditoria_transacoes_cartao(empresa_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_data ON auditoria_transacoes_cartao(created_at);

-- ============================================
-- FUNÇÕES PL/pgSQL
-- ============================================

-- Função: Buscar candidatos para matching de cartão
CREATE OR REPLACE FUNCTION buscar_candidatos_cartao(
    p_transacao_id UUID,
    p_empresa_id UUID
) RETURNS TABLE (
    candidato_id UUID,
    candidato_tipo TEXT,
    descricao TEXT,
    valor NUMERIC,
    data DATE,
    score NUMERIC
) AS $$
DECLARE
    v_transacao RECORD;
    v_config JSONB;
    v_tolerancia_valor NUMERIC;
    v_tolerancia_dias INTEGER;
BEGIN
    -- Buscar dados da transação
    SELECT * INTO v_transacao FROM transacoes_cartao WHERE id = p_transacao_id;

    IF v_transacao IS NULL THEN
        RETURN;
    END IF;

    -- Buscar configurações
    SELECT criterios_conciliacao INTO v_config
    FROM configuracoes_cartao
    WHERE empresa_id = p_empresa_id;

    v_tolerancia_valor := COALESCE((v_config->>'tolerancia_valor')::NUMERIC, 0.50);
    v_tolerancia_dias := COALESCE((v_config->>'tolerancia_dias')::INTEGER, 2);

    -- Retornar contas a receber
    RETURN QUERY
    SELECT
        cr.id as candidato_id,
        'conta_receber'::TEXT as candidato_tipo,
        cr.descricao,
        cr.valor,
        COALESCE(cr.data_recebimento, cr.data_vencimento)::DATE as data,
        (
            -- Score baseado em valor líquido (50%)
            CASE
                WHEN ABS(cr.valor - v_transacao.valor_liquido) < v_tolerancia_valor THEN 50
                WHEN ABS(cr.valor - v_transacao.valor_liquido) < (v_tolerancia_valor * 2) THEN 30
                ELSE 10
            END +
            -- Score baseado em data (30%)
            CASE
                WHEN COALESCE(cr.data_recebimento, cr.data_vencimento) = v_transacao.data_pagamento THEN 30
                WHEN ABS(EXTRACT(DAY FROM (COALESCE(cr.data_recebimento, cr.data_vencimento) - v_transacao.data_pagamento))) <= 1 THEN 20
                WHEN ABS(EXTRACT(DAY FROM (COALESCE(cr.data_recebimento, cr.data_vencimento) - v_transacao.data_pagamento))) <= v_tolerancia_dias THEN 10
                ELSE 0
            END +
            -- Score baseado em tipo (sempre 10 para contas a receber)
            10
        )::NUMERIC as score
    FROM contas_receber cr
    WHERE cr.empresa_id = p_empresa_id
        AND cr.status IN ('pendente', 'recebido')
        AND COALESCE(cr.data_recebimento, cr.data_vencimento) BETWEEN
            (v_transacao.data_pagamento - INTERVAL '3 days')::DATE
            AND (v_transacao.data_pagamento + INTERVAL '3 days')::DATE
        AND ABS(cr.valor - v_transacao.valor_liquido) < (v_tolerancia_valor * 5)
        AND cr.id NOT IN (
            SELECT conciliado_com FROM transacoes_cartao
            WHERE conciliado_com IS NOT NULL AND status = 'conciliado'
        )
    HAVING (
        CASE
            WHEN ABS(cr.valor - v_transacao.valor_liquido) < v_tolerancia_valor THEN 50
            WHEN ABS(cr.valor - v_transacao.valor_liquido) < (v_tolerancia_valor * 2) THEN 30
            ELSE 10
        END +
        CASE
            WHEN COALESCE(cr.data_recebimento, cr.data_vencimento) = v_transacao.data_pagamento THEN 30
            WHEN ABS(EXTRACT(DAY FROM (COALESCE(cr.data_recebimento, cr.data_vencimento) - v_transacao.data_pagamento))) <= 1 THEN 20
            WHEN ABS(EXTRACT(DAY FROM (COALESCE(cr.data_recebimento, cr.data_vencimento) - v_transacao.data_pagamento))) <= v_tolerancia_dias THEN 10
            ELSE 0
        END +
        10
    ) >= 40
    ORDER BY score DESC, ABS(cr.valor - v_transacao.valor_liquido) ASC
    LIMIT 10;

    -- Retornar lançamentos
    RETURN QUERY
    SELECT
        l.id as candidato_id,
        'lancamento'::TEXT as candidato_tipo,
        l.descricao,
        l.valor,
        l.data_lancamento::DATE as data,
        (
            CASE
                WHEN ABS(l.valor - v_transacao.valor_liquido) < v_tolerancia_valor THEN 50
                WHEN ABS(l.valor - v_transacao.valor_liquido) < (v_tolerancia_valor * 2) THEN 30
                ELSE 10
            END +
            CASE
                WHEN l.data_lancamento = v_transacao.data_pagamento THEN 30
                WHEN ABS(EXTRACT(DAY FROM (l.data_lancamento - v_transacao.data_pagamento))) <= 1 THEN 20
                WHEN ABS(EXTRACT(DAY FROM (l.data_lancamento - v_transacao.data_pagamento))) <= v_tolerancia_dias THEN 10
                ELSE 0
            END +
            CASE WHEN l.tipo = 'receita' THEN 10 ELSE 5 END
        )::NUMERIC as score
    FROM lancamentos_caixa l
    WHERE l.empresa_id = p_empresa_id
        AND l.data_lancamento BETWEEN
            (v_transacao.data_pagamento - INTERVAL '3 days')::DATE
            AND (v_transacao.data_pagamento + INTERVAL '3 days')::DATE
        AND ABS(l.valor - v_transacao.valor_liquido) < (v_tolerancia_valor * 5)
        AND l.id NOT IN (
            SELECT conciliado_com FROM transacoes_cartao
            WHERE conciliado_com IS NOT NULL AND status = 'conciliado'
        )
    HAVING (
        CASE
            WHEN ABS(l.valor - v_transacao.valor_liquido) < v_tolerancia_valor THEN 50
            WHEN ABS(l.valor - v_transacao.valor_liquido) < (v_tolerancia_valor * 2) THEN 30
            ELSE 10
        END +
        CASE
            WHEN l.data_lancamento = v_transacao.data_pagamento THEN 30
            WHEN ABS(EXTRACT(DAY FROM (l.data_lancamento - v_transacao.data_pagamento))) <= 1 THEN 20
            WHEN ABS(EXTRACT(DAY FROM (l.data_lancamento - v_transacao.data_pagamento))) <= v_tolerancia_dias THEN 10
            ELSE 0
        END +
        CASE WHEN l.tipo = 'receita' THEN 10 ELSE 5 END
    ) >= 40
    ORDER BY score DESC, ABS(l.valor - v_transacao.valor_liquido) ASC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: Estatísticas de conciliação de cartões
CREATE OR REPLACE FUNCTION get_stats_cartao(
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
        'total_transacoes', COUNT(*),
        'conciliados', COUNT(*) FILTER (WHERE status = 'conciliado'),
        'pendentes', COUNT(*) FILTER (WHERE status = 'pendente'),
        'divergentes', COUNT(*) FILTER (WHERE status = 'divergente'),
        'chargebacks', COUNT(*) FILTER (WHERE status = 'chargeback'),
        'taxa_conciliacao', ROUND(
            COUNT(*) FILTER (WHERE status = 'conciliado')::NUMERIC /
            NULLIF(COUNT(*), 0) * 100,
            2
        ),
        'valor_bruto_total', COALESCE(SUM(valor_bruto), 0),
        'valor_taxas_total', COALESCE(SUM(valor_taxa), 0),
        'valor_liquido_total', COALESCE(SUM(valor_liquido), 0),
        'por_bandeira', (
            SELECT json_agg(json_build_object(
                'bandeira', bandeira,
                'total', COUNT(*),
                'conciliados', COUNT(*) FILTER (WHERE status = 'conciliado'),
                'valor_total', COALESCE(SUM(valor_bruto), 0)
            ))
            FROM transacoes_cartao
            WHERE empresa_id = p_empresa_id
                AND data_transacao BETWEEN p_data_inicio AND p_data_fim
            GROUP BY bandeira
        )
    ) INTO v_stats
    FROM transacoes_cartao
    WHERE empresa_id = p_empresa_id
        AND data_transacao BETWEEN p_data_inicio AND p_data_fim;

    RETURN COALESCE(v_stats, '{}'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: Trigger para atualizar timestamps
CREATE OR REPLACE FUNCTION atualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_atualizar_transacoes_cartao ON transacoes_cartao;
CREATE TRIGGER trigger_atualizar_transacoes_cartao
    BEFORE UPDATE ON transacoes_cartao
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_updated_at();

DROP TRIGGER IF EXISTS trigger_atualizar_configuracoes_cartao ON configuracoes_cartao;
CREATE TRIGGER trigger_atualizar_configuracoes_cartao
    BEFORE UPDATE ON configuracoes_cartao
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_updated_at();

-- Função: Trigger de auditoria
CREATE OR REPLACE FUNCTION audit_transacoes_cartao()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO auditoria_transacoes_cartao (
        user_id,
        empresa_id,
        tabela,
        operacao,
        registro_id,
        dados_antigos,
        dados_novos
    ) VALUES (
        auth.uid(),
        COALESCE(NEW.empresa_id, OLD.empresa_id),
        TG_TABLE_NAME,
        TG_OP,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN
            jsonb_build_object(
                'status', OLD.status,
                'valor_liquido', OLD.valor_liquido,
                'conciliado_com', OLD.conciliado_com
            )
        ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN
            jsonb_build_object(
                'status', NEW.status,
                'valor_liquido', NEW.valor_liquido,
                'conciliado_com', NEW.conciliado_com
            )
        ELSE NULL END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger de auditoria
DROP TRIGGER IF EXISTS trigger_audit_transacoes_cartao ON transacoes_cartao;
CREATE TRIGGER trigger_audit_transacoes_cartao
    AFTER INSERT OR UPDATE OR DELETE ON transacoes_cartao
    FOR EACH ROW
    EXECUTE FUNCTION audit_transacoes_cartao();

-- Função: Calcular valor líquido com base na bandeira
CREATE OR REPLACE FUNCTION calcular_valor_liquido_cartao(
    p_valor_bruto NUMERIC,
    p_bandeira VARCHAR,
    p_empresa_id UUID
) RETURNS NUMERIC AS $$
DECLARE
    v_taxa NUMERIC;
BEGIN
    SELECT CASE p_bandeira
        WHEN 'visa' THEN taxa_visa
        WHEN 'mastercard' THEN taxa_mastercard
        WHEN 'elo' THEN taxa_elo
        WHEN 'amex' THEN taxa_amex
        WHEN 'hipercard' THEN taxa_hipercard
        ELSE taxa_outros
    END INTO v_taxa
    FROM configuracoes_cartao
    WHERE empresa_id = p_empresa_id;

    IF v_taxa IS NULL THEN
        v_taxa := 0.025; -- Taxa padrão 2.5%
    END IF;

    RETURN p_valor_bruto * (1 - v_taxa);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================

-- Habilitar RLS nas tabelas
ALTER TABLE transacoes_cartao ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_cartao ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria_transacoes_cartao ENABLE ROW LEVEL SECURITY;

-- Políticas para transacoes_cartao
CREATE POLICY select_transacoes_cartao ON transacoes_cartao
    FOR SELECT USING (
        empresa_id IN (
            SELECT empresa_id FROM usuarios_empresas
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY insert_transacoes_cartao ON transacoes_cartao
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        empresa_id IN (
            SELECT empresa_id FROM usuarios_empresas
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY update_transacoes_cartao ON transacoes_cartao
    FOR UPDATE USING (
        empresa_id IN (
            SELECT empresa_id FROM usuarios_empresas
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY delete_transacoes_cartao ON transacoes_cartao
    FOR DELETE USING (
        empresa_id IN (
            SELECT empresa_id FROM usuarios_empresas
            WHERE user_id = auth.uid()
        )
    );

-- Políticas para configuracoes_cartao
CREATE POLICY select_configuracoes_cartao ON configuracoes_cartao
    FOR SELECT USING (
        empresa_id IN (
            SELECT empresa_id FROM usuarios_empresas
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY insert_configuracoes_cartao ON configuracoes_cartao
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        empresa_id IN (
            SELECT empresa_id FROM usuarios_empresas
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY update_configuracoes_cartao ON configuracoes_cartao
    FOR UPDATE USING (
        empresa_id IN (
            SELECT empresa_id FROM usuarios_empresas
            WHERE user_id = auth.uid()
        )
    );

-- Políticas para auditoria (apenas visualização)
CREATE POLICY select_auditoria_cartao ON auditoria_transacoes_cartao
    FOR SELECT USING (
        empresa_id IN (
            SELECT empresa_id FROM usuarios_empresas
            WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================

COMMENT ON TABLE transacoes_cartao IS
    'Transações de cartão importadas das operadoras para conciliação. Agente: @agente-supabase';

COMMENT ON TABLE configuracoes_cartao IS
    'Configurações de taxas e critérios de conciliação por empresa. Agente: @agente-supabase';

COMMENT ON TABLE auditoria_transacoes_cartao IS
    'Log de auditoria para rastreamento de alterações em transações de cartão. Agente: @agente-seguranca';

COMMENT ON FUNCTION buscar_candidatos_cartao IS
    'Busca candidatos para conciliação de cartão com algoritmo de scoring. Agente: @agente-financeiro';

COMMENT ON FUNCTION get_stats_cartao IS
    'Retorna estatísticas de conciliação de cartões em formato JSON. Agente: @agente-analytics';
