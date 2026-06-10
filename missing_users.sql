WITH all_user_ids AS (
    SELECT user_id FROM public.plano_contas WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.categorias WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.contas_pagar WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.contas_receber WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.lancamentos_caixa WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.clientes WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.fornecedores WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.empresas_mecanico WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.profiles WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.usuario_empresas WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.mapeamento_contabil WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.budget_planning_lines WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.nfse_rascunhos WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.nfse_sync_logs WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.nfse_cron_logs WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.notas_fiscais_servico WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.open_banking_integracoes WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.open_banking_logs WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.open_banking_extratos WHERE importado_por IS NOT NULL
    UNION
    SELECT user_id FROM public.transacoes_cartao WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.user_roles WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.usuarios WHERE id IS NOT NULL
    UNION
    SELECT user_id FROM public.vehicles WHERE driver_id IS NOT NULL
    UNION
    SELECT user_id FROM public.students WHERE guardian_id IS NOT NULL
    UNION
    SELECT user_id FROM public.rate_limit_uploads WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.regua_cobranca_automacao WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.assinaturas_mecanico WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.card_audit_logs WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.card_dashboard_cache WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.card_importacoes WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.card_relatorios_gerados WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.card_report_config WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.card_simulacoes_salvas WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.card_split_simulacoes WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.card_transacoes_brutas WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.configuracoes_cartao WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.contabilidade_erp_config WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.contabilidade_lancamentos_importados WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.contabilidade_mapeamento_contas WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.contabilidade_sincronizacao WHERE user_id IS NOT NULL
    UNION
    SELECT iniciado_por FROM public.contabilidade_sincronizacao WHERE iniciado_por IS NOT NULL
    UNION
    SELECT user_id FROM public.obd2_leituras_mecanico WHERE user_id IS NOT NULL
)
SELECT a.user_id
FROM all_user_ids a
LEFT JOIN auth.users u ON a.user_id = u.id
WHERE u.id IS NULL;
