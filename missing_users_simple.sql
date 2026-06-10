SELECT pc.user_id
FROM public.plano_contas pc
LEFT JOIN auth.users u ON pc.user_id = u.id
WHERE u.id IS NULL
LIMIT 20;
