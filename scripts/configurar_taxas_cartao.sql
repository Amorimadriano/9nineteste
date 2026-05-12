-- ============================================
-- CONFIGURAÇÃO DE TAXAS DE CARTÃO POR EMPRESA
-- Execute após as migrations estarem aplicadas
-- ============================================

-- Insere configurações padrão para todas as empresas existentes
-- Taxas padrão do mercado:
-- Visa: 1.99%
-- Mastercard: 1.99%
-- Elo: 2.29%
-- Amex: 2.99%
-- Hipercard: 2.50%
-- Outros: 2.50%

INSERT INTO configuracoes_cartao (
    empresa_id,
    user_id,
    taxa_visa,
    taxa_mastercard,
    taxa_elo,
    taxa_amex,
    taxa_hipercard,
    taxa_outros,
    prazo_credito_dias,
    prazo_debito_dias,
    prazo_parcelado_dias,
    criterios_conciliacao
)
SELECT
    e.id as empresa_id,
    NULL as user_id, -- Será atualizado pelo primeiro usuário da empresa
    0.0199 as taxa_visa,      -- 1.99%
    0.0199 as taxa_mastercard, -- 1.99%
    0.0229 as taxa_elo,       -- 2.29%
    0.0299 as taxa_amex,      -- 2.99%
    0.0250 as taxa_hipercard, -- 2.50%
    0.0250 as taxa_outros,    -- 2.50%
    30 as prazo_credito_dias,
    1 as prazo_debito_dias,
    30 as prazo_parcelado_dias,
    '{
        "tolerancia_valor": 0.50,
        "tolerancia_dias": 2,
        "peso_valor": 0.50,
        "peso_data": 0.30,
        "peso_bandeira": 0.10,
        "peso_nsu": 0.10
    }'::jsonb as criterios_conciliacao
FROM empresas e
WHERE NOT EXISTS (
    SELECT 1 FROM configuracoes_cartao c
    WHERE c.empresa_id = e.id
)
ON CONFLICT (empresa_id) DO NOTHING;

-- Verificar configurações criadas
SELECT
    emp.nome as empresa,
    cc.taxa_visa * 100 as visa_percent,
    cc.taxa_mastercard * 100 as mastercard_percent,
    cc.taxa_elo * 100 as elo_percent,
    cc.taxa_amex * 100 as amex_percent,
    cc.prazo_credito_dias,
    cc.prazo_debito_dias
FROM configuracoes_cartao cc
JOIN empresas emp ON emp.id = cc.empresa_id;
