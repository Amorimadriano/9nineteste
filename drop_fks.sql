SELECT string_agg('ALTER TABLE public.' || conrelid::regclass::text || ' DROP CONSTRAINT ' || conname || ';', E'\n' ORDER BY conrelid::regclass::text) AS sql
FROM pg_constraint
WHERE contype = 'f'
    AND confrelid::regclass::text LIKE 'auth.%'
    AND connamespace = 'public'::regnamespace;
