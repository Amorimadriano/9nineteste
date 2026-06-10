CREATE OR REPLACE FUNCTION public.trigger_criar_plano_categoria()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_plano_conta_id UUID;
    v_empresa_id UUID;
BEGIN
    -- Se já tem vínculo, não faz nada
    IF NEW.plano_conta_id IS NOT NULL THEN
        RETURN NEW;
    END IF;

    -- Buscar empresa do usuário
    SELECT empresa_id INTO v_empresa_id
    FROM public.usuario_empresas
    WHERE user_id = NEW.user_id
    LIMIT 1;

    -- Tentar encontrar conta existente pelo nome
    SELECT id INTO v_plano_conta_id
    FROM public.plano_contas
    WHERE user_id = NEW.user_id
    AND (empresa_id = v_empresa_id OR (v_empresa_id IS NULL AND empresa_id IS NULL))
    AND LOWER(descricao) = LOWER(NEW.nome)
    AND natureza = CASE WHEN NEW.tipo = 'receita' THEN 'receita' ELSE 'despesa' END
    LIMIT 1;

    -- Se não encontrou, criar automaticamente
    IF v_plano_conta_id IS NULL THEN
        v_plano_conta_id := public.criar_conta_plano_automatico(
            NEW.user_id,
            v_empresa_id,
            NEW.nome,
            NEW.tipo
        );
    END IF;

    -- Vincular à categoria
    IF v_plano_conta_id IS NOT NULL THEN
        NEW.plano_conta_id := v_plano_conta_id;
    END IF;

    RETURN NEW;
END;
$function$;
