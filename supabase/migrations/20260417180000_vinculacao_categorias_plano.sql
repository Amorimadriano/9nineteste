-- Migration: Vinculação Categorias-Plano de Contas e Funções Auxiliares
-- Data: 2026-04-17
-- Descrição: Adiciona coluna plano_conta_id na tabela categorias e funções de busca

-- ============================================
-- 1. ADICIONAR COLUNA plano_conta_id EM categorias
-- ============================================
ALTER TABLE public.categorias
ADD COLUMN IF NOT EXISTS plano_conta_id UUID REFERENCES public.plano_contas(id) ON DELETE SET NULL;

-- Comentário
COMMENT ON COLUMN public.categorias.plano_conta_id IS 'Vínculo automático com plano de contas contábil';

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_categorias_plano_conta ON public.categorias(plano_conta_id);

-- ============================================
-- 2. FUNÇÃO: Buscar conta no plano (com autocomplete)
-- ============================================
CREATE OR REPLACE FUNCTION public.buscar_conta_plano(
    p_user_id UUID,
    p_empresa_id UUID,
    p_codigo TEXT
) RETURNS TABLE (
    id UUID,
    codigo_conta TEXT,
    descricao TEXT,
    tipo_conta TEXT,
    natureza TEXT,
    nivel INTEGER,
    permite_lancamento BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pc.id,
        pc.codigo_conta,
        pc.descricao,
        pc.tipo_conta,
        pc.natureza,
        pc.nivel,
        pc.permite_lancamento
    FROM public.plano_contas pc
    WHERE pc.user_id = p_user_id
    AND (p_empresa_id IS NULL OR pc.empresa_id = p_empresa_id)
    AND pc.ativo = true
    AND (pc.codigo_conta = p_codigo OR pc.codigo_conta LIKE p_codigo || '%')
    ORDER BY pc.codigo_conta
    LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.buscar_conta_plano IS 'Busca contas no plano de contas por código com autocomplete';

-- ============================================
-- 3. FUNÇÃO: Sugerir conta contábil por categoria
-- ============================================
CREATE OR REPLACE FUNCTION public.sugerir_conta_contabil(
    p_user_id UUID,
    p_empresa_id UUID,
    p_categoria_id UUID,
    p_tipo_lancamento TEXT
) RETURNS TABLE (
    plano_conta_id UUID,
    codigo_conta TEXT,
    descricao TEXT,
    historico_padrao TEXT,
    centro_custo TEXT,
    confianca INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        mc.plano_conta_id,
        pc.codigo_conta,
        pc.descricao,
        mc.historico_padrao,
        mc.centro_custo,
        CASE
            WHEN mc.ativo AND mc.automatico THEN 100
            WHEN mc.ativo THEN 80
            ELSE 50
        END::INTEGER as confianca
    FROM public.mapeamento_contabil mc
    JOIN public.plano_contas pc ON mc.plano_conta_id = pc.id
    WHERE mc.user_id = p_user_id
    AND (p_empresa_id IS NULL OR mc.empresa_id = p_empresa_id)
    AND mc.categoria_id = p_categoria_id
    AND mc.tipo_lancamento = p_tipo_lancamento
    AND mc.ativo = true
    ORDER BY confianca DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.sugerir_conta_contabil IS 'Sugere conta contábil baseada no mapeamento da categoria';

-- ============================================
-- 4. TRIGGER: Validar tipo de conta vs categoria
-- ============================================
CREATE OR REPLACE FUNCTION public.validar_vinculo_categoria_plano()
RETURNS TRIGGER AS $$
DECLARE
    v_plano_natureza TEXT;
    v_categoria_tipo TEXT;
BEGIN
    -- Se não há vínculo, permite
    IF NEW.plano_conta_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Buscar natureza do plano de contas
    SELECT natureza INTO v_plano_natureza
    FROM public.plano_contas
    WHERE id = NEW.plano_conta_id;

    -- Verificar compatibilidade
    IF NEW.tipo = 'receita' AND v_plano_natureza != 'receita' THEN
        RAISE EXCEPTION 'Categorias de receita devem ser vinculadas a contas de receita (natureza: receita)';
    END IF;

    IF NEW.tipo = 'despesa' AND v_plano_natureza NOT IN ('despesa', 'ativa') THEN
        RAISE EXCEPTION 'Categorias de despesa devem ser vinculadas a contas de despesa ou ativo (ex: caixa/banco)';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
DROP TRIGGER IF EXISTS trigger_validar_vinculo_categoria ON public.categorias;
CREATE TRIGGER trigger_validar_vinculo_categoria
    BEFORE INSERT OR UPDATE ON public.categorias
    FOR EACH ROW
    EXECUTE FUNCTION public.validar_vinculo_categoria_plano();

-- ============================================
-- 5. VIEW: Categorias com Plano de Contas
-- ============================================
CREATE OR REPLACE VIEW public.v_categorias_com_plano AS
SELECT
    c.*,
    pc.codigo_conta as plano_codigo,
    pc.descricao as plano_descricao,
    pc.natureza as plano_natureza,
    CASE
        WHEN pc.id IS NOT NULL THEN true
        ELSE false
    END as vinculado
FROM public.categorias c
LEFT JOIN public.plano_contas pc ON c.plano_conta_id = pc.id
WHERE c.ativo = true;

COMMENT ON VIEW public.v_categorias_com_plano IS 'View com categorias e informações do plano de contas vinculado';

-- Verificar instalação
SELECT 'Vinculação categorias-plano criada com sucesso!' as status;
