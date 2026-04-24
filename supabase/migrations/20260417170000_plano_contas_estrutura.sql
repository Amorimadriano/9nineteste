
-- Migration: Estrutura de Plano de Contas e Categorias Hierárquicas
-- Data: 2026-04-17
-- Descrição: Cria estrutura completa de plano de contas contábil brasileiro e relacionamento com categorias

-- ============================================
-- 1. TABELA: Plano de Contas (estrutura contábil completa)
-- ============================================
CREATE TABLE IF NOT EXISTS public.plano_contas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,

    -- Estrutura hierárquica (sintética/analítica)
    codigo_conta TEXT NOT NULL,
    codigo_pai TEXT, -- Código da conta pai (hierarquia)
    nivel INTEGER NOT NULL DEFAULT 1, -- Nível na árvore (1=raiz)

    -- Classificação contábil
    tipo_conta TEXT NOT NULL CHECK (tipo_conta IN ('sintetica', 'analitica')),
    natureza TEXT NOT NULL CHECK (natureza IN ('ativa', 'passiva', 'receita', 'despesa', 'compensacao')),

    -- Dados da conta
    descricao TEXT NOT NULL,
    descricao_reduzida TEXT, -- Máximo 20 caracteres para relatórios

    -- Status e controle
    ativo BOOLEAN NOT NULL DEFAULT true,
    permite_lancamento BOOLEAN NOT NULL DEFAULT false, -- Só contas analíticas permitem lançamento

    -- Mapeamento automático (opcional)
    categoria_financeira_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,

    -- Metadados
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comentários
COMMENT ON TABLE public.plano_contas IS 'Plano de contas contábil completo com estrutura hierárquica (sintética/analítica)';
COMMENT ON COLUMN public.plano_contas.codigo_conta IS 'Código da conta no formato X.XX.XXX.XXXX (níveis hierárquicos)';
COMMENT ON COLUMN public.plano_contas.tipo_conta IS 'sintetica = agrupadora, analitica = permite lançamentos';
COMMENT ON COLUMN public.plano_contas.natureza IS 'Classificação: ativa, passiva, receita, despesa, compensacao';
COMMENT ON COLUMN public.plano_contas.categoria_financeira_id IS 'Vinculação automática com categoria do financeiro';

-- Índices
CREATE INDEX IF NOT EXISTS idx_plano_contas_user_id ON public.plano_contas(user_id);
CREATE INDEX IF NOT EXISTS idx_plano_contas_empresa_id ON public.plano_contas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_plano_contas_codigo ON public.plano_contas(codigo_conta);
CREATE INDEX IF NOT EXISTS idx_plano_contas_codigo_pai ON public.plano_contas(codigo_pai);
CREATE INDEX IF NOT EXISTS idx_plano_contas_natureza ON public.plano_contas(natureza);
CREATE INDEX IF NOT EXISTS idx_plano_contas_categoria ON public.plano_contas(categoria_financeira_id);

-- Constraint única por usuário/empresa e código
CREATE UNIQUE INDEX IF NOT EXISTS idx_plano_contas_unico
ON public.plano_contas(user_id, COALESCE(empresa_id, '00000000-0000-0000-0000-000000000000'::UUID), codigo_conta);

-- RLS
ALTER TABLE public.plano_contas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own plano_contas"
ON public.plano_contas
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_plano_contas_updated_at
BEFORE UPDATE ON public.plano_contas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. TABELA: Mapeamento Contábil Automatizado
-- ============================================
CREATE TABLE IF NOT EXISTS public.mapeamento_contabil (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,

    -- Origem (financeiro)
    categoria_id UUID REFERENCES public.categorias(id) ON DELETE CASCADE,
    tipo_lancamento TEXT NOT NULL CHECK (tipo_lancamento IN ('despesa', 'receita', 'transferencia')),

    -- Destino (contábil)
    plano_conta_id UUID NOT NULL REFERENCES public.plano_contas(id) ON DELETE CASCADE,

    -- Complemento
    historico_padrao TEXT,
    centro_custo TEXT,

    -- Regras de negócio
    regra_condicional JSONB, -- Ex: {"valor_min": 1000, "apenas_dias_uteis": true}

    -- Status
    ativo BOOLEAN NOT NULL DEFAULT true,
    automatico BOOLEAN NOT NULL DEFAULT true, -- Mapeamento automático

    -- Metadados
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraint única
    CONSTRAINT mapeamento_unico UNIQUE (user_id, empresa_id, categoria_id, tipo_lancamento)
);

COMMENT ON TABLE public.mapeamento_contabil IS 'Mapeamento automático entre categorias financeiras e plano de contas contábil';
COMMENT ON COLUMN public.mapeamento_contabil.regra_condicional IS 'Regras JSON para mapeamentos condicionais';

-- Índices
CREATE INDEX IF NOT EXISTS idx_mapeamento_user ON public.mapeamento_contabil(user_id);
CREATE INDEX IF NOT EXISTS idx_mapeamento_categoria ON public.mapeamento_contabil(categoria_id);
CREATE INDEX IF NOT EXISTS idx_mapeamento_plano ON public.mapeamento_contabil(plano_conta_id);

-- RLS
ALTER TABLE public.mapeamento_contabil ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own mapeamento_contabil"
ON public.mapeamento_contabil
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER update_mapeamento_contabil_updated_at
BEFORE UPDATE ON public.mapeamento_contabil
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 3. FUNÇÃO: Buscar conta por código (com auto-complete)
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
    AND (pc.empresa_id = p_empresa_id OR (p_empresa_id IS NULL AND pc.empresa_id IS NULL))
    AND pc.ativo = true
    AND (pc.codigo_conta = p_codigo OR pc.codigo_conta LIKE p_codigo || '%')
    ORDER BY pc.codigo_conta;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. FUNÇÃO: Sugerir conta contábil por categoria
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
    confianca INTEGER -- 0-100% de confiança no mapeamento
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
        END as confianca
    FROM public.mapeamento_contabil mc
    JOIN public.plano_contas pc ON mc.plano_conta_id = pc.id
    WHERE mc.user_id = p_user_id
    AND (mc.empresa_id = p_empresa_id OR (p_empresa_id IS NULL AND mc.empresa_id IS NULL))
    AND mc.categoria_id = p_categoria_id
    AND mc.tipo_lancamento = p_tipo_lancamento
    AND mc.ativo = true
    ORDER BY confianca DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. FUNÇÃO: Criar plano de contas padrão (CFC/BRA)
-- ============================================
CREATE OR REPLACE FUNCTION public.criar_plano_contas_padrao(
    p_user_id UUID,
    p_empresa_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    -- ATIVO (1)
    INSERT INTO public.plano_contas (user_id, empresa_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, permite_lancamento) VALUES
    (p_user_id, p_empresa_id, '1', NULL, 1, 'sintetica', 'ativa', 'ATIVO', false),
    (p_user_id, p_empresa_id, '1.1', '1', 2, 'sintetica', 'ativa', 'Ativo Circulante', false),
    (p_user_id, p_empresa_id, '1.1.01', '1.1', 3, 'sintetica', 'ativa', 'Caixa e Equivalentes', false),
    (p_user_id, p_empresa_id, '1.1.01.0001', '1.1.01', 4, 'analitica', 'ativa', 'Caixa Geral', true),
    (p_user_id, p_empresa_id, '1.1.01.0002', '1.1.01', 4, 'analitica', 'ativa', 'Bancos Conta Movimento', true),
    (p_user_id, p_empresa_id, '1.1.02', '1.1', 3, 'sintetica', 'ativa', 'Contas a Receber', false),
    (p_user_id, p_empresa_id, '1.1.02.0001', '1.1.02', 4, 'analitica', 'ativa', 'Clientes', true),
    (p_user_id, p_empresa_id, '1.1.02.0002', '1.1.02', 4, 'analitica', 'ativa', 'Duplicatas a Receber', true),
    (p_user_id, p_empresa_id, '1.1.03', '1.1', 3, 'sintetica', 'ativa', 'Estoques', false),
    (p_user_id, p_empresa_id, '1.1.03.0001', '1.1.03', 4, 'analitica', 'ativa', 'Mercadorias para Revenda', true),
    (p_user_id, p_empresa_id, '1.1.04', '1.1', 3, 'sintetica', 'ativa', 'Despesas do Exercício Seguinte', false),
    (p_user_id, p_empresa_id, '1.1.04.0001', '1.1.04', 4, 'analitica', 'ativa', 'Despesas Antecipadas', true),
    (p_user_id, p_empresa_id, '1.2', '1', 2, 'sintetica', 'ativa', 'Ativo Não Circulante', false),
    (p_user_id, p_empresa_id, '1.2.01', '1.2', 3, 'sintetica', 'ativa', 'Realizável a Longo Prazo', false),
    (p_user_id, p_empresa_id, '1.2.01.0001', '1.2.01', 4, 'analitica', 'ativa', 'Contas a Receber LP', true),
    (p_user_id, p_empresa_id, '1.2.03', '1.2', 3, 'sintetica', 'ativa', 'Investimentos', false),
    (p_user_id, p_empresa_id, '1.2.03.0001', '1.2.03', 4, 'analitica', 'ativa', 'Participações Societárias', true),
    (p_user_id, p_empresa_id, '1.2.04', '1.2', 3, 'sintetica', 'ativa', 'Imobilizado', false),
    (p_user_id, p_empresa_id, '1.2.04.0001', '1.2.04', 4, 'analitica', 'ativa', 'Móveis e Utensílios', true),
    (p_user_id, p_empresa_id, '1.2.04.0002', '1.2.04', 4, 'analitica', 'ativa', 'Máquinas e Equipamentos', true),
    (p_user_id, p_empresa_id, '1.2.04.0003', '1.2.04', 4, 'analitica', 'ativa', 'Veículos', true),
    (p_user_id, p_empresa_id, '1.2.04.0004', '1.2.04', 4, 'analitica', 'ativa', 'Instalações', true);
    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- PASSIVO (2)
    INSERT INTO public.plano_contas (user_id, empresa_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, permite_lancamento) VALUES
    (p_user_id, p_empresa_id, '2', NULL, 1, 'sintetica', 'passiva', 'PASSIVO', false),
    (p_user_id, p_empresa_id, '2.1', '2', 2, 'sintetica', 'passiva', 'Passivo Circulante', false),
    (p_user_id, p_empresa_id, '2.1.01', '2.1', 3, 'sintetica', 'passiva', 'Fornecedores', false),
    (p_user_id, p_empresa_id, '2.1.01.0001', '2.1.01', 4, 'analitica', 'passiva', 'Fornecedores Nacionais', true),
    (p_user_id, p_empresa_id, '2.1.01.0002', '2.1.01', 4, 'analitica', 'passiva', 'Fornecedores Estrangeiros', true),
    (p_user_id, p_empresa_id, '2.1.02', '2.1', 3, 'sintetica', 'passiva', 'Empréstimos e Financiamentos', false),
    (p_user_id, p_empresa_id, '2.1.02.0001', '2.1.02', 4, 'analitica', 'passiva', 'Empréstimos Bancários', true),
    (p_user_id, p_empresa_id, '2.1.03', '2.1', 3, 'sintetica', 'passiva', 'Obrigações Fiscais', false),
    (p_user_id, p_empresa_id, '2.1.03.0001', '2.1.03', 4, 'analitica', 'passiva', 'Impostos a Pagar', true),
    (p_user_id, p_empresa_id, '2.1.03.0002', '2.1.03', 4, 'analitica', 'passiva', 'ISS a Recolher', true),
    (p_user_id, p_empresa_id, '2.1.03.0003', '2.1.03', 4, 'analitica', 'passiva', 'ICMS a Recolher', true),
    (p_user_id, p_empresa_id, '2.1.03.0004', '2.1.03', 4, 'analitica', 'passiva', 'IRRF a Recolher', true),
    (p_user_id, p_empresa_id, '2.1.03.0005', '2.1.03', 4, 'analitica', 'passiva', 'INSS a Recolher', true),
    (p_user_id, p_empresa_id, '2.1.03.0006', '2.1.03', 4, 'analitica', 'passiva', 'FGTS a Recolher', true),
    (p_user_id, p_empresa_id, '2.1.04', '2.1', 3, 'sintetica', 'passiva', 'Obrigações Trabalhistas', false),
    (p_user_id, p_empresa_id, '2.1.04.0001', '2.1.04', 4, 'analitica', 'passiva', 'Salários a Pagar', true),
    (p_user_id, p_empresa_id, '2.1.04.0002', '2.1.04', 4, 'analitica', 'passiva', 'Férias a Pagar', true),
    (p_user_id, p_empresa_id, '2.1.04.0003', '2.1.04', 4, 'analitica', 'passiva', '13º Salário a Pagar', true);

    -- RECEITAS (3)
    INSERT INTO public.plano_contas (user_id, empresa_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, permite_lancamento) VALUES
    (p_user_id, p_empresa_id, '3', NULL, 1, 'sintetica', 'receita', 'RECEITAS', false),
    (p_user_id, p_empresa_id, '3.1', '3', 2, 'sintetica', 'receita', 'Receita Bruta de Vendas', false),
    (p_user_id, p_empresa_id, '3.1.01', '3.1', 3, 'sintetica', 'receita', 'Vendas de Mercadorias', false),
    (p_user_id, p_empresa_id, '3.1.01.0001', '3.1.01', 4, 'analitica', 'receita', 'Vendas à Vista', true),
    (p_user_id, p_empresa_id, '3.1.01.0002', '3.1.01', 4, 'analitica', 'receita', 'Vendas a Prazo', true),
    (p_user_id, p_empresa_id, '3.1.02', '3.1', 3, 'sintetica', 'receita', 'Prestação de Serviços', false),
    (p_user_id, p_empresa_id, '3.1.02.0001', '3.1.02', 4, 'analitica', 'receita', 'Serviços de Consultoria', true),
    (p_user_id, p_empresa_id, '3.1.02.0002', '3.1.02', 4, 'analitica', 'receita', 'Serviços de BPO Financeiro', true),
    (p_user_id, p_empresa_id, '3.1.02.0003', '3.1.02', 4, 'analitica', 'receita', 'Serviços Contábeis', true),
    (p_user_id, p_empresa_id, '3.2', '3', 2, 'sintetica', 'receita', 'Outras Receitas Operacionais', false),
    (p_user_id, p_empresa_id, '3.2.01', '3.2', 3, 'sintetica', 'receita', 'Receitas Financeiras', false),
    (p_user_id, p_empresa_id, '3.2.01.0001', '3.2.01', 4, 'analitica', 'receita', 'Juros Ativos', true),
    (p_user_id, p_empresa_id, '3.2.01.0002', '3.2.01', 4, 'analitica', 'receita', 'Descontos Obtidos', true);

    -- DESPESAS (4)
    INSERT INTO public.plano_contas (user_id, empresa_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, permite_lancamento) VALUES
    (p_user_id, p_empresa_id, '4', NULL, 1, 'sintetica', 'despesa', 'DESPESAS', false),
    (p_user_id, p_empresa_id, '4.1', '4', 2, 'sintetica', 'despesa', 'Despesas Operacionais', false),
    (p_user_id, p_empresa_id, '4.1.01', '4.1', 3, 'sintetica', 'despesa', 'Despesas com Pessoal', false),
    (p_user_id, p_empresa_id, '4.1.01.0001', '4.1.01', 4, 'analitica', 'despesa', 'Salários e Ordenados', true),
    (p_user_id, p_empresa_id, '4.1.01.0002', '4.1.01', 4, 'analitica', 'despesa', 'Encargos Sociais', true),
    (p_user_id, p_empresa_id, '4.1.01.0003', '4.1.01', 4, 'analitica', 'despesa', 'FGTS', true),
    (p_user_id, p_empresa_id, '4.1.01.0004', '4.1.01', 4, 'analitica', 'despesa', 'Benefícios (VR, VT, etc)', true),
    (p_user_id, p_empresa_id, '4.1.02', '4.1', 3, 'sintetica', 'despesa', 'Despesas Administrativas', false),
    (p_user_id, p_empresa_id, '4.1.02.0001', '4.1.02', 4, 'analitica', 'despesa', 'Aluguel', true),
    (p_user_id, p_empresa_id, '4.1.02.0002', '4.1.02', 4, 'analitica', 'despesa', 'Condomínio', true),
    (p_user_id, p_empresa_id, '4.1.02.0003', '4.1.02', 4, 'analitica', 'despesa', 'Energia Elétrica', true),
    (p_user_id, p_empresa_id, '4.1.02.0004', '4.1.02', 4, 'analitica', 'despesa', 'Água e Esgoto', true),
    (p_user_id, p_empresa_id, '4.1.02.0005', '4.1.02', 4, 'analitica', 'despesa', 'Telefone e Internet', true),
    (p_user_id, p_empresa_id, '4.1.02.0006', '4.1.02', 4, 'analitica', 'despesa', 'Material de Escritório', true),
    (p_user_id, p_empresa_id, '4.1.02.0007', '4.1.02', 4, 'analitica', 'despesa', 'Manutenção e Conservação', true),
    (p_user_id, p_empresa_id, '4.1.02.0008', '4.1.02', 4, 'analitica', 'despesa', 'Contador/Advogado', true),
    (p_user_id, p_empresa_id, '4.1.03', '4.1', 3, 'sintetica', 'despesa', 'Despesas de Marketing', false),
    (p_user_id, p_empresa_id, '4.1.03.0001', '4.1.03', 4, 'analitica', 'despesa', 'Publicidade e Propaganda', true),
    (p_user_id, p_empresa_id, '4.1.03.0002', '4.1.03', 4, 'analitica', 'despesa', 'Marketing Digital', true),
    (p_user_id, p_empresa_id, '4.1.04', '4.1', 3, 'sintetica', 'despesa', 'Despesas Financeiras', false),
    (p_user_id, p_empresa_id, '4.1.04.0001', '4.1.04', 4, 'analitica', 'despesa', 'Juros Passivos', true),
    (p_user_id, p_empresa_id, '4.1.04.0002', '4.1.04', 4, 'analitica', 'despesa', 'Descontos Concedidos', true),
    (p_user_id, p_empresa_id, '4.1.04.0003', '4.1.04', 4, 'analitica', 'despesa', 'Tarifas Bancárias', true),
    (p_user_id, p_empresa_id, '4.1.05', '4.1', 3, 'sintetica', 'despesa', 'Impostos e Taxas', false),
    (p_user_id, p_empresa_id, '4.1.05.0001', '4.1.05', 4, 'analitica', 'despesa', 'ISS', true),
    (p_user_id, p_empresa_id, '4.1.05.0002', '4.1.05', 4, 'analitica', 'despesa', 'IPTU', true),
    (p_user_id, p_empresa_id, '4.1.05.0003', '4.1.05', 4, 'analitica', 'despesa', 'Taxas Municipais', true),
    (p_user_id, p_empresa_id, '4.2', '4', 2, 'sintetica', 'despesa', 'Despesas Não Operacionais', false),
    (p_user_id, p_empresa_id, '4.2.01', '4.2', 3, 'sintetica', 'despesa', 'Outras Despesas', false),
    (p_user_id, p_empresa_id, '4.2.01.0001', '4.2.01', 4, 'analitica', 'despesa', 'Perdas Diversas', true);

    -- COMPENSAÇÃO (9)
    INSERT INTO public.plano_contas (user_id, empresa_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, permite_lancamento) VALUES
    (p_user_id, p_empresa_id, '9', NULL, 1, 'sintetica', 'compensacao', 'CONTAS DE COMPENSAÇÃO', false),
    (p_user_id, p_empresa_id, '9.1', '9', 2, 'sintetica', 'compensacao', 'Cheques em Circulação', false),
    (p_user_id, p_empresa_id, '9.1.01', '9.1', 3, 'sintetica', 'compensacao', 'Cheques a Compensar', false),
    (p_user_id, p_empresa_id, '9.1.01.0001', '9.1.01', 4, 'analitica', 'compensacao', 'Cheques Emitidos', true);

    RETURN v_count + 50; -- Total aproximado de contas criadas
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar instalação
SELECT 'Estrutura criada com sucesso!' as status;
