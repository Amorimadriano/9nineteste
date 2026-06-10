SELECT COUNT(DISTINCT user_id) AS missing_count
FROM public.plano_contas
WHERE user_id NOT IN (SELECT id FROM auth.users);
