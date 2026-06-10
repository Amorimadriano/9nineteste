SELECT pg_get_functiondef(p.oid) AS source
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'trigger_criar_plano_categoria';
