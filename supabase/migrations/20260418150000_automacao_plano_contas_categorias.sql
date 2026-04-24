-- Migration: Automação Completa Plano de Contas x Categorias
-- Data: 2026-04-18
-- Descrição: Triggers e funções para criação automática de plano de contas baseado nas categorias

-- ============================================
-- 1. FUNÇÃO: Criar conta no plano de contas automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION public.criar_conta_plano_automatico(
    p_user_id UUID,
    p_empresa_id UUID DEFAULT NULL,
    p_nome_categoria TEXT,
    p_tipo TEXT
) RETURNS UUID AS $$
DECLARE
    v_codigo_pai TEXT;
    v_codigo_novo TEXT;
    v_natureza TEXT;
    v_descricao TEXT;
    v_nivel INTEGER;
    v_conta_id UUID;
    v_next_number INTEGER;
BEGIN
    -- Definir natureza baseada no tipo
    v_natureza := CASE
        WHEN p_tipo = 'receita' THEN 'receita'
        ELSE 'despesa'
    END;

    -- Determinar código pai baseado no tipo
    v_codigo_pai := CASE
        WHEN p_tipo = 'receita' THEN '3.1.02'
        ELSE '4.1.02'
    END;

    -- Gerar próximo código sequencial
    SELECT COALESCE(MAX(CAST(SUBSTRING(codigo_conta FROM '([0-9]+)$') AS INTEGER)), 0) + 1
    INTO v_next_number
    FROM public.plano_contas
    WHERE user_id = p_user_id
    AND (empresa_id = p_empresa_id OR (p_empresa_id IS NULL AND empresa_id IS NULL))
    AND codigo_conta LIKE v_codigo_pai || '.%';

    -- Criar código completo
    v_codigo_novo := v_codigo_pai || '.' || LPAD(v_next_number::TEXT, 4, '0');
    v_descricao := INITCAP(p_nome_categoria);
    v_nivel := 4;

    -- Verificar se já existe conta com esse nome
    SELECT id INTO v_conta_id
    FROM public.plano_contas
    WHERE user_id = p_user_id
    AND (empresa_id = p_empresa_id OR (p_empresa_id IS NULL AND empresa_id IS NULL))
    AND LOWER(descricao) = LOWER(v_descricao)
    LIMIT 1;

    -- Se já existe, retornar o ID
    IF v_conta_id IS NOT NULL THEN
        RETURN v_conta_id;
    END IF;

    -- Criar nova conta
    INSERT INTO public.plano_contas (
        user_id,
        empresa_id,
        codigo_conta,
        codigo_pai,
        nivel,
        tipo_conta,
        natureza,
        descricao,
        descricao_reduzida,
        ativo,
        permite_lancamento
    ) VALUES (
        p_user_id,
        p_empresa_id,
        v_codigo_novo,
        v_codigo_pai,
        v_nivel,
        'analitica',
        v_natureza,
        v_descricao,
        LEFT(v_descricao, 20),
        true,
        true
    )
    RETURNING id INTO v_conta_id;

    RETURN v_conta_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.criar_conta_plano_automatico IS
'Cria automaticamente uma conta no plano de contas baseada no nome da categoria';

-- ============================================
-- 2. TRIGGER: Criar plano de contas ao inserir categoria (se não vinculada)
-- ============================================
CREATE OR REPLACE FUNCTION public.trigger_criar_plano_categoria()
RETURNS TRIGGER AS $$
DECLARE
    v_plano_conta_id UUID;
    v_empresa_id UUID;
BEGIN
    -- Se já tem vínculo, não faz nada
    IF NEW.plano_conta_id IS NOT NULL THEN
        RETURN NEW;
    END IF;

    -- Buscar empresa do usuário
    SELECT id INTO v_empresa_id
    FROM public.empresas
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_auto_plano_categoria ON public.categorias;

-- Criar trigger
CREATE TRIGGER trigger_auto_plano_categoria
    BEFORE INSERT ON public.categorias
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_criar_plano_categoria();

COMMENT ON FUNCTION public.trigger_criar_plano_categoria IS
'Trigger que cria automaticamente conta no plano de contas ao criar uma categoria';

-- ============================================
-- 3. FUNÇÃO: Sincronizar todas as categorias existentes
-- ============================================
CREATE OR REPLACE FUNCTION public.sincronizar_categorias_plano_contas(
    p_user_id UUID,
    p_empresa_id UUID DEFAULT NULL
) RETURNS TABLE (
    categoria_id UUID,
    categoria_nome TEXT,
    plano_conta_id UUID,
    acao TEXT
) AS $$
DECLARE
    v_categoria RECORD;
    v_plano_conta_id UUID;
BEGIN
    -- Para cada categoria sem vínculo
    FOR v_categoria IN
        SELECT c.id, c.nome, c.tipo
        FROM public.categorias c
        WHERE c.user_id = p_user_id
        AND c.plano_conta_id IS NULL
        AND c.ativo = true
    LOOP
        -- Tentar encontrar conta existente
        SELECT pc.id INTO v_plano_conta_id
        FROM public.plano_contas pc
        WHERE pc.user_id = p_user_id
        AND (pc.empresa_id = p_empresa_id OR (p_empresa_id IS NULL AND pc.empresa_id IS NULL))
        AND LOWER(pc.descricao) = LOWER(v_categoria.nome)
        AND pc.natureza = CASE WHEN v_categoria.tipo = 'receita' THEN 'receita' ELSE 'despesa' END
        LIMIT 1;

        -- Se não encontrou, criar
        IF v_plano_conta_id IS NULL THEN
            v_plano_conta_id := public.criar_conta_plano_automatico(
                p_user_id,
                p_empresa_id,
                v_categoria.nome,
                v_categoria.tipo
            );

            -- Atualizar categoria
            UPDATE public.categorias
            SET plano_conta_id = v_plano_conta_id
            WHERE id = v_categoria.id;

            categoria_id := v_categoria.id;
            categoria_nome := v_categoria.nome;
            plano_conta_id := v_plano_conta_id;
            acao := 'CRIADO';
            RETURN NEXT;
        ELSE
            -- Apenas vincular
            UPDATE public.categorias
            SET plano_conta_id = v_plano_conta_id
            WHERE id = v_categoria.id;

            categoria_id := v_categoria.id;
            categoria_nome := v_categoria.nome;
            plano_conta_id := v_plano_conta_id;
            acao := 'VINCULADO';
            RETURN NEXT;
        END IF;
    END LOOP;

    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.sincronizar_categorias_plano_contas IS
'Sincroniza todas as categorias existentes sem vínculo, criando contas no plano de contas automaticamente';

-- ============================================
-- 4. FUNÇÃO: Verificar e criar plano de contas padrão se não existir
-- ============================================
CREATE OR REPLACE FUNCTION public.verificar_ou_criar_plano_padrao(
    p_user_id UUID,
    p_empresa_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Verificar se já existe plano de contas
    SELECT COUNT(*) INTO v_count
    FROM public.plano_contas
    WHERE user_id = p_user_id
    AND (empresa_id = p_empresa_id OR (p_empresa_id IS NULL AND empresa_id IS NULL));

    -- Se não existe, criar plano padrão
    IF v_count = 0 THEN
        RETURN public.criar_plano_contas_padrao(p_user_id, p_empresa_id);
    END IF;

    RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.verificar_ou_criar_plano_padrao IS
'Verifica se existe plano de contas, se não existir cria o plano padrão CFC';

-- ============================================
-- 5. VIEW: Resumo de automação categorias-plano
-- ============================================
CREATE OR REPLACE VIEW public.v_automacao_categorias_plano AS
SELECT
    c.user_id,
    COUNT(*) as total_categorias,
    COUNT(c.plano_conta_id) as categorias_vinculadas,
    COUNT(*) - COUNT(c.plano_conta_id) as categorias_sem_vinculo,
    CASE
        WHEN COUNT(*) > 0 THEN ROUND((COUNT(c.plano_conta_id)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
        ELSE 0
    END as percentual_vinculado
FROM public.categorias c
WHERE c.ativo = true
GROUP BY c.user_id;

COMMENT ON VIEW public.v_automacao_categorias_plano IS
'Resumo percentual de categorias vinculadas ao plano de contas por usuário';

-- Verificar instalação
SELECT 'Automação plano de contas x categorias criada com sucesso!' as status;
