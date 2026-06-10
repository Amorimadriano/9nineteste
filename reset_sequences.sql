DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT sequencename
        FROM pg_sequences
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format(
            'SELECT setval(''public.%I'', COALESCE((SELECT MAX(id) FROM public.%I), 0) + 1, false)',
            r.sequencename,
            replace(replace(r.sequencename, '_id_seq', ''), '_seq', '')
        );
    END LOOP;
END $$;
