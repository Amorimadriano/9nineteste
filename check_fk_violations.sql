DO $$
DECLARE
    fk RECORD;
    v_count INT;
    v_sql TEXT;
BEGIN
    FOR fk IN
        SELECT
            tc.table_name AS tabela,
            kcu.column_name AS coluna,
            ccu.table_name AS ref_tabela,
            ccu.column_name AS ref_coluna
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
            AND ccu.table_schema = 'public'
    LOOP
        v_sql := format(
            'SELECT count(*) FROM public.%I t LEFT JOIN public.%I r ON t.%I = r.%I WHERE t.%I IS NOT NULL AND r.%I IS NULL',
            fk.tabela, fk.ref_tabela, fk.coluna, fk.ref_coluna, fk.coluna, fk.ref_coluna
        );
        EXECUTE v_sql INTO v_count;
        IF v_count > 0 THEN
            RAISE NOTICE 'VIOLACAO: %.% -> %.% : % registros orfaos',
                fk.tabela, fk.coluna, fk.ref_tabela, fk.ref_coluna, v_count;
        END IF;
    END LOOP;
END $$;
