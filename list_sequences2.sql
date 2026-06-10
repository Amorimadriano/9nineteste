SELECT
    c.relname as tabela,
    c2.relname as sequencia,
    s.seqstart as inicio
FROM pg_class c
JOIN pg_depend d ON c.oid = d.refobjid
JOIN pg_class c2 ON d.objid = c2.oid
JOIN pg_sequence s ON c2.oid = s.seqrelid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND c.relkind = 'r'
ORDER BY c.relname;
