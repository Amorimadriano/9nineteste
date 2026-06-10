SELECT
    'ALTER TABLE public.' || conrelid::regclass::text || ' DROP CONSTRAINT ' || conname || ';' AS drop_cmd,
    'ALTER TABLE public.' || conrelid::regclass::text || ' ADD CONSTRAINT ' || conname || ' FOREIGN KEY (' || (SELECT string_agg(a.attname, ', ') FROM pg_attribute a WHERE a.attrelid = conrelid AND a.attnum = ANY(conkey)) || ') REFERENCES ' || confrelid::regclass::text || '(' || (SELECT string_agg(a.attname, ', ') FROM pg_attribute a WHERE a.attrelid = confrelid AND a.attnum = ANY(confkey)) || ') ON DELETE ' || (CASE confdeltype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END) || ';' AS add_cmd
FROM pg_constraint
WHERE contype = 'f'
    AND confrelid::regclass::text LIKE 'auth.%'
    AND connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text;
