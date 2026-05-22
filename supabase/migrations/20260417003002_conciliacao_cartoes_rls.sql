-- Migration: RLS e Auditoria para Conciliação de Cartões
-- Agente: @agente-seguranca
-- Data: 2026-04-17

-- ============================================
-- TABELA DE AUDITORIA
-- ============================================

CREATE TABLE IF NOT EXISTS auditoria_transacoes_cartao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    empresa_id UUID NOT NULL,
    tabela TEXT NOT NULL,
    operacao TEXT NOT NULL CHECK (operacao IN ('INSERT', 'UPDATE', 'DELETE')),
    registro_id UUID,
    dados_antigos JSONB,
    dados_novos JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para auditoria
CREATE INDEX IF NOT EXISTS idx_auditoria_empresa ON auditoria_transacoes_cartao(empresa_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_data ON auditoria_transacoes_cartao(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_operacao ON auditoria_transacoes_cartao(operacao);

-- ============================================
-- FUNÇÃO DE MASCARAMENTO
-- ============================================

CREATE OR REPLACE FUNCTION mask_card_number(card_number TEXT)
RETURNS TEXT AS $$
BEGIN
    IF card_number IS NULL OR LENGTH(card_number) < 4 THEN
        RETURN card_number;
    END IF;
    RETURN '****' || RIGHT(card_number, 4);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- FUNÇÃO DE AUDITORIA
-- ============================================

CREATE OR REPLACE FUNCTION audit_transacoes_cartao()
RETURNS TRIGGER AS $$
DECLARE
    v_empresa_id UUID;
BEGIN
    -- Extrair empresa_id
    v_empresa_id := COALESCE(NEW.empresa_id, OLD.empresa_id);

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
        v_empresa_id,
        TG_TABLE_NAME,
        TG_OP,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN
            jsonb_build_object(
                'status', OLD.status,
                'valor_liquido', OLD.valor_liquido,
                'conciliado_com', OLD.conciliado_com,
                'numero_cartao_mascara', OLD.numero_cartao_mascara
            )
        ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN
            jsonb_build_object(
                'status', NEW.status,
                'valor_liquido', NEW.valor_liquido,
                'conciliado_com', NEW.conciliado_com,
                'numero_cartao_mascara', NEW.numero_cartao_mascara
            )
        ELSE NULL END
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger de auditoria para transacoes_cartao
DROP TRIGGER IF EXISTS trigger_audit_transacoes_cartao ON transacoes_cartao;
CREATE TRIGGER trigger_audit_transacoes_cartao
    AFTER INSERT OR UPDATE OR DELETE ON transacoes_cartao
    FOR EACH ROW
    EXECUTE FUNCTION audit_transacoes_cartao();

-- Trigger de auditoria para configuracoes_cartao
DROP TRIGGER IF EXISTS trigger_audit_configuracoes_cartao ON configuracoes_cartao;
CREATE TRIGGER trigger_audit_configuracoes_cartao
    AFTER INSERT OR UPDATE OR DELETE ON configuracoes_cartao
    FOR EACH ROW
    EXECUTE FUNCTION audit_transacoes_cartao();

-- ============================================
-- POLÍTICAS RLS APRIMORADAS
-- ============================================

-- Garantir que as políticas de transacoes_cartao estejam corretas
ALTER TABLE transacoes_cartao ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para recriar
DROP POLICY IF EXISTS select_transacoes_cartao ON transacoes_cartao;
DROP POLICY IF EXISTS insert_transacoes_cartao ON transacoes_cartao;
DROP POLICY IF EXISTS update_transacoes_cartao ON transacoes_cartao;
DROP POLICY IF EXISTS delete_transacoes_cartao ON transacoes_cartao;

-- Política SELECT
CREATE POLICY select_transacoes_cartao ON transacoes_cartao
    FOR SELECT USING (
        empresa_id IN (
            SELECT empresa_id FROM usuario_empresas
            WHERE user_id = auth.uid()
        )
    );

-- Política INSERT (verifica se usuário tem acesso à empresa)
CREATE POLICY insert_transacoes_cartao ON transacoes_cartao
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        empresa_id IN (
            SELECT empresa_id FROM usuario_empresas
            WHERE user_id = auth.uid()
        )
    );

-- Política UPDATE
CREATE POLICY update_transacoes_cartao ON transacoes_cartao
    FOR UPDATE USING (
        empresa_id IN (
            SELECT empresa_id FROM usuario_empresas
            WHERE user_id = auth.uid()
        )
    );

-- Política DELETE
CREATE POLICY delete_transacoes_cartao ON transacoes_cartao
    FOR DELETE USING (
        empresa_id IN (
            SELECT empresa_id FROM usuario_empresas
            WHERE user_id = auth.uid()
        )
    );

-- Configuracoes_cartao
ALTER TABLE configuracoes_cartao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_configuracoes_cartao ON configuracoes_cartao;
DROP POLICY IF EXISTS insert_configuracoes_cartao ON configuracoes_cartao;
DROP POLICY IF EXISTS update_configuracoes_cartao ON configuracoes_cartao;

CREATE POLICY select_configuracoes_cartao ON configuracoes_cartao
    FOR SELECT USING (
        empresa_id IN (
            SELECT empresa_id FROM usuario_empresas
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY insert_configuracoes_cartao ON configuracoes_cartao
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        empresa_id IN (
            SELECT empresa_id FROM usuario_empresas
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY update_configuracoes_cartao ON configuracoes_cartao
    FOR UPDATE USING (
        empresa_id IN (
            SELECT empresa_id FROM usuario_empresas
            WHERE user_id = auth.uid()
        )
    );

-- Auditoria - apenas visualização pelo próprio tenant
ALTER TABLE auditoria_transacoes_cartao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_auditoria_cartao ON auditoria_transacoes_cartao;

CREATE POLICY select_auditoria_cartao ON auditoria_transacoes_cartao
    FOR SELECT USING (
        empresa_id IN (
            SELECT empresa_id FROM usuario_empresas
            WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- VIEW MASCARADA (para logs seguros)
-- ============================================

CREATE OR REPLACE VIEW view_transacoes_cartao_segura AS
SELECT
    id,
    empresa_id,
    data_transacao,
    data_pagamento,
    bandeira,
    valor_bruto,
    taxa_percentual,
    valor_taxa,
    valor_liquido,
    numero_cartao_mascara,
    nsu,
    codigo_autorizacao,
    tipo_transacao,
    numero_parcelas,
    parcela_atual,
    status,
    conciliado_com,
    conciliado_tipo,
    conciliado_em,
    score_conciliacao,
    created_at,
    updated_at
FROM transacoes_cartao;

-- ============================================
-- FUNÇÃO DE VERIFICAÇÃO DE RATE LIMIT
-- ============================================

CREATE TABLE IF NOT EXISTS rate_limit_uploads (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    count INTEGER DEFAULT 0,
    reset_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour'
);

CREATE OR REPLACE FUNCTION check_upload_rate_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_record RECORD;
BEGIN
    SELECT * INTO v_record FROM rate_limit_uploads WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        INSERT INTO rate_limit_uploads (user_id, count, reset_at)
        VALUES (p_user_id, 1, NOW() + INTERVAL '1 hour');
        RETURN TRUE;
    END IF;

    IF NOW() > v_record.reset_at THEN
        UPDATE rate_limit_uploads
        SET count = 1, reset_at = NOW() + INTERVAL '1 hour'
        WHERE user_id = p_user_id;
        RETURN TRUE;
    END IF;

    IF v_record.count >= 100 THEN
        RETURN FALSE;
    END IF;

    UPDATE rate_limit_uploads
    SET count = count + 1
    WHERE user_id = p_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE auditoria_transacoes_cartao IS
    'Log de auditoria para rastreamento de alterações em transações de cartão. Agente: @agente-seguranca';

COMMENT ON FUNCTION mask_card_number IS
    'Mascara número de cartão mostrando apenas os últimos 4 dígitos';

COMMENT ON FUNCTION check_upload_rate_limit IS
    'Verifica e atualiza rate limiting para uploads (máx 100/hora)';
