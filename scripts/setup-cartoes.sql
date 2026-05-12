-- Script de Setup para Conciliação de Cartões
-- Execute no Supabase SQL Editor

-- 1. Criar tabelas e funções
\i supabase/migrations/20260417003000_conciliacao_cartoes.sql

-- 2. Configurar RLS e auditoria
\i supabase/migrations/20260417003000_conciliacao_cartoes_rls.sql

-- 3. Inserir configurações padrão para empresa de teste
-- Substitua 'empresa-uuid-aqui' pelo UUID real da empresa
INSERT INTO configuracoes_cartao (
    empresa_id,
    taxa_visa,
    taxa_mastercard,
    taxa_elo,
    taxa_amex,
    taxa_hipercard,
    taxa_outros,
    prazo_credito_dias,
    prazo_debito_dias,
    prazo_parcelado_dias
) VALUES (
    'empresa-uuid-aqui',  -- Substitua pelo UUID da empresa
    0.0199,  -- Visa: 1.99%
    0.0199,  -- Mastercard: 1.99%
    0.0229,  -- Elo: 2.29%
    0.0299,  -- Amex: 2.99%
    0.0250,  -- Hipercard: 2.50%
    0.0250,  -- Outros: 2.50%
    30,      -- Crédito: 30 dias
    1,       -- Débito: 1 dia
    30       -- Parcelado: 30 dias
)
ON CONFLICT (empresa_id) DO NOTHING;

-- 4. Criar índices adicionais se necessário
CREATE INDEX IF NOT EXISTS idx_transacoes_cartao_status_data
ON transacoes_cartao(status, data_transacao)
WHERE status = 'pendente';

-- 5. Verificar instalação
SELECT
    'Tabelas criadas:' as info,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transacoes_cartao') as transacoes_cartao,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'configuracoes_cartao') as configuracoes_cartao,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'auditoria_transacoes_cartao') as auditoria;
