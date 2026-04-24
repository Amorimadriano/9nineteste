-- Criar tabela e inserir plano de contas automaticamente para o usuário logado
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.plano_contas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    empresa_id UUID,
    codigo_conta TEXT NOT NULL,
    codigo_pai TEXT,
    nivel INTEGER NOT NULL DEFAULT 1,
    tipo_conta TEXT NOT NULL DEFAULT 'sintetica',
    natureza TEXT NOT NULL DEFAULT 'ativa',
    descricao TEXT NOT NULL,
    descricao_reduzida TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    permite_lancamento BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE public.plano_contas ENABLE ROW LEVEL SECURITY;

-- 3. Remover e recriar políticas
DROP POLICY IF EXISTS all_plano_contas ON public.plano_contas;

CREATE POLICY all_plano_contas ON public.plano_contas
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Grants
GRANT ALL ON public.plano_contas TO authenticated;

-- 5. Inserir dados para o usuário atual (funciona se você estiver logado no dashboard)
INSERT INTO public.plano_contas (user_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, descricao_reduzida, ativo, permite_lancamento)
SELECT
    auth.uid(),
    codigo,
    codigo_pai,
    nivel,
    tipo,
    natureza,
    descricao,
    descricao_reduzida,
    ativo,
    permite_lancamento
FROM (VALUES
    ('1', NULL, 1, 'sintetica', 'ativa', 'ATIVO', 'ATIVO', true, false),
    ('1.1', '1', 2, 'sintetica', 'ativa', 'Ativo Circulante', 'Ativo Circ.', true, false),
    ('1.1.01', '1.1', 3, 'sintetica', 'ativa', 'Caixa e Equivalentes', 'Caixa', true, false),
    ('1.1.01.0001', '1.1.01', 4, 'analitica', 'ativa', 'Caixa Geral', 'Caixa Geral', true, true),
    ('1.1.01.0002', '1.1.01', 4, 'analitica', 'ativa', 'Bancos Conta Movimento', 'Bancos', true, true),
    ('1.1.02', '1.1', 3, 'sintetica', 'ativa', 'Contas a Receber', 'Contas Rec.', true, false),
    ('1.1.02.0001', '1.1.02', 4, 'analitica', 'ativa', 'Clientes', 'Clientes', true, true),
    ('2', NULL, 1, 'sintetica', 'passiva', 'PASSIVO', 'PASSIVO', true, false),
    ('2.1', '2', 2, 'sintetica', 'passiva', 'Passivo Circulante', 'Passivo Circ.', true, false),
    ('2.1.01', '2.1', 3, 'sintetica', 'passiva', 'Fornecedores', 'Fornecedores', true, false),
    ('2.1.01.0001', '2.1.01', 4, 'analitica', 'passiva', 'Fornecedores Nacionais', 'Forn. Nacionais', true, true),
    ('3', NULL, 1, 'sintetica', 'receita', 'RECEITAS', 'RECEITAS', true, false),
    ('3.1', '3', 2, 'sintetica', 'receita', 'Receitas Operacionais', 'Rec. Operac.', true, false),
    ('3.1.01', '3.1', 3, 'sintetica', 'receita', 'Vendas', 'Vendas', true, false),
    ('3.1.01.0001', '3.1.01', 4, 'analitica', 'receita', 'Vendas de Mercadorias', 'Vendas', true, true),
    ('4', NULL, 1, 'sintetica', 'despesa', 'DESPESAS', 'DESPESAS', true, false),
    ('4.1', '4', 2, 'sintetica', 'despesa', 'Despesas Operacionais', 'Desp. Operac.', true, false),
    ('4.1.01', '4.1', 3, 'sintetica', 'despesa', 'Pessoal', 'Pessoal', true, false),
    ('4.1.01.0001', '4.1.01', 4, 'analitica', 'despesa', 'Salários', 'Salários', true, true),
    ('4.1.02', '4.1', 3, 'sintetica', 'despesa', 'Despesas Administrativas', 'Desp. Admin.', true, false),
    ('4.1.02.0001', '4.1.02', 4, 'analitica', 'despesa', 'Aluguel', 'Aluguel', true, true),
    ('4.1.02.0002', '4.1.02', 4, 'analitica', 'despesa', 'Energia Elétrica', 'Energia', true, true)
) AS dados(codigo, codigo_pai, nivel, tipo, natureza, descricao, descricao_reduzida, ativo, permite_lancamento)
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, codigo_conta) DO NOTHING;

-- Verificar resultado
SELECT 'Plano de contas criado!' as status, COUNT(*) as total_contas
FROM public.plano_contas
WHERE user_id = auth.uid();
