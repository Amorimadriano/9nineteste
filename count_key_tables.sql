SELECT
    'empresas' as tabela, count(*) as linhas FROM public.empresas
UNION ALL SELECT 'clientes', count(*) FROM public.clientes
UNION ALL SELECT 'fornecedores', count(*) FROM public.fornecedores
UNION ALL SELECT 'contas_pagar', count(*) FROM public.contas_pagar
UNION ALL SELECT 'contas_receber', count(*) FROM public.contas_receber
UNION ALL SELECT 'lancamentos_caixa', count(*) FROM public.lancamentos_caixa
UNION ALL SELECT 'extrato_bancario', count(*) FROM public.extrato_bancario
UNION ALL SELECT 'categorias', count(*) FROM public.categorias
UNION ALL SELECT 'notas_fiscais_servico', count(*) FROM public.notas_fiscais_servico
UNION ALL SELECT 'certificados_nfse', count(*) FROM public.certificados_nfse
UNION ALL SELECT 'user_roles', count(*) FROM public.user_roles
UNION ALL SELECT 'plano_contas', count(*) FROM public.plano_contas
UNION ALL SELECT 'auth.users', count(*) FROM auth.users
ORDER BY linhas DESC;
