SELECT
    t.tgname AS trigger_name,
    c.relname AS table_name,
    p.proname AS function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND t.tgisinternal = false
  AND (
      p.prosrc ILIKE '%empresas_mecanico%'
      OR EXISTS (
          SELECT 1 FROM pg_depend d
          JOIN pg_class c2 ON d.objid = c2.oid
          WHERE d.classid = 'pg_trigger'::regclass
            AND c2.relname = 'empresas_mecanico'
      )
  );
