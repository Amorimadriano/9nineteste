-- ============================================
-- SCRIPT DE VERIFICAÇÃO DA INSTALAÇÃO
-- Conciliação de Cartões - Nine BPO Financeiro
-- Execute no Editor SQL do Supabase
-- ============================================

-- 1. Verificar tabelas criadas
SELECT 'TABELAS' as verificacao;
SELECT
    table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transacoes_cartao') as transacoes_cartao,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'configuracoes_cartao') as configuracoes_cartao,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'auditoria_transacoes_cartao') as auditoria,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rate_limit_uploads') as rate_limit;

-- 2. Verificar funções criadas
SELECT 'FUNÇÕES' as verificacao;
SELECT
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'buscar_candidatos_cartao',
    'get_stats_cartao',
    'calcular_valor_liquido_cartao',
    'mask_card_number',
    'check_upload_rate_limit',
    'audit_transacoes_cartao',
    'atualizar_updated_at'
);

-- 3. Verificar índices
SELECT 'ÍNDICES' as verificacao;
SELECT
    indexname,
    tablename
FROM pg_indexes
WHERE tablename IN ('transacoes_cartao', 'auditoria_transacoes_cartao')
AND schemaname = 'public';

-- 4. Verificar políticas RLS
SELECT 'POLÍTICAS RLS' as verificacao;
SELECT
    schemaname,
    tablename,
    policyname,
    permissive
FROM pg_policies
WHERE tablename IN ('transacoes_cartao', 'configuracoes_cartao', 'auditoria_transacoes_cartao');

-- 5. Verificar configurações existentes
SELECT 'CONFIGURAÇÕES' as verificacao;
SELECT
    cc.id,
    e.nome as empresa,
    cc.taxa_visa * 100 as taxa_visa_pct,
    cc.taxa_mastercard * 100 as taxa_mastercard_pct,
    cc.taxa_elo * 100 as taxa_elo_pct,
    cc.prazo_credito_dias,
    cc.prazo_debito_dias
FROM configuracoes_cartao cc
LEFT JOIN empresas e ON e.id = cc.empresa_id;

-- 6. Verificar se há transações cadastradas
SELECT 'TRANSAÇÕES' as verificacao;
SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'pendente') as pendentes,
    COUNT(*) FILTER (WHERE status = 'conciliado') as conciliados,
    COUNT(*) FILTER (WHERE status = 'chargeback') as chargebacks
FROM transacoes_cartao;

-- 7. Teste de função buscar_candidatos (precisa de uma transação real)
-- Descomente após ter transações no sistema:
-- SELECT * FROM buscar_candidatos_cartao('uuid-da-transacao', 'uuid-da-empresa');

-- 8. Teste de estatísticas
-- Descomente após ter transações no sistema:
-- SELECT get_stats_cartao('uuid-da-empresa');

-- 9. Verificar rate limiting
SELECT 'RATE LIMIT' as verificacao;
SELECT COUNT(*) as usuarios_no_rate_limit FROM rate_limit_uploads;

-- 10. Verificar auditoria
SELECT 'AUDITORIA' as verificacao;
SELECT COUNT(*) as registros_auditoria FROM auditoria_transacoes_cartao;
