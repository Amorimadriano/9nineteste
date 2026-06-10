SELECT
    c.relname as tabela,
    c2.relname as sequencia,
    t.seqstart as inicio,
    t.seqlastvalue as ultimo_valor
FROM pg_class c
JOIN pg_depend d ON c.oid = d.refobjid
JOIN pg_class c2 ON d.objid = c2.oid
JOIN pg_sequence t ON c2.oid = t.seqrelid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND c.relkind = 'r'
ORDER BY c.relname;
