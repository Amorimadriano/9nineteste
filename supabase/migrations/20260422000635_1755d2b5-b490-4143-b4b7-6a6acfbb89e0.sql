
-- 1. Adicionar coluna plano_conta_id na tabela categorias
ALTER TABLE public.categorias
ADD COLUMN IF NOT EXISTS plano_conta_id uuid REFERENCES public.plano_contas(id) ON DELETE SET NULL;

-- 2. Criar função de sincronização categorias <-> plano de contas
CREATE OR REPLACE FUNCTION public.sincronizar_categorias_plano_contas(p_user_id uuid, p_empresa_id uuid DEFAULT NULL)
RETURNS SETOF jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_categoria RECORD;
  v_plano RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Para cada categoria sem vínculo, tentar encontrar conta analítica correspondente
  FOR v_categoria IN
    SELECT id, nome, tipo
    FROM public.categorias
    WHERE user_id = p_user_id
      AND plano_conta_id IS NULL
      AND ativo = true
  LOOP
    -- Buscar conta analítica que melhor corresponda pelo prefixo numérico do nome da categoria
    SELECT id, codigo_conta, descricao INTO v_plano
    FROM public.plano_contas
    WHERE user_id = p_user_id
      AND permite_lancamento = true
      AND ativo = true
      AND (
        -- Match por prefixo numérico (ex: "1.1 Receita com Serviços" -> código que começa com padrão similar)
        descricao ILIKE '%' || regexp_replace(v_categoria.nome, '^[0-9.]+ ', '') || '%'
        OR regexp_replace(v_categoria.nome, '^[0-9.]+ ', '') ILIKE '%' || descricao || '%'
      )
    ORDER BY
      CASE
        WHEN v_categoria.tipo = 'receita' AND natureza = 'receita' THEN 0
        WHEN v_categoria.tipo = 'despesa' AND natureza = 'despesa' THEN 0
        ELSE 1
      END,
      nivel DESC
    LIMIT 1;

    IF v_plano.id IS NOT NULL THEN
      UPDATE public.categorias
      SET plano_conta_id = v_plano.id, updated_at = now()
      WHERE id = v_categoria.id;

      v_count := v_count + 1;

      RETURN NEXT jsonb_build_object(
        'categoria_id', v_categoria.id,
        'categoria_nome', v_categoria.nome,
        'plano_conta_id', v_plano.id,
        'plano_conta_codigo', v_plano.codigo_conta,
        'plano_conta_descricao', v_plano.descricao
      );
    END IF;
  END LOOP;

  RETURN;
END;
$$;

-- 3. Criar função verificar_ou_criar_plano_padrao
CREATE OR REPLACE FUNCTION public.verificar_ou_criar_plano_padrao(p_user_id uuid, p_empresa_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Verificar se já existe plano de contas para o usuário
  SELECT count(*) INTO v_count
  FROM public.plano_contas
  WHERE user_id = p_user_id;

  -- Se não existir, criar o plano padrão
  IF v_count = 0 THEN
    RETURN public.criar_plano_contas_padrao(p_user_id, p_empresa_id);
  END IF;

  RETURN 0;
END;
$$;
