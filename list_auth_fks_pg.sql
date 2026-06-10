SELECT
    conrelid::regclass AS table_name,
    conname AS constraint_name,
    confrelid::regclass AS foreign_table_name
FROM pg_constraint
WHERE contype = 'f'
    AND confrelid::regclass::text LIKE 'auth.%'
    AND connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text;
