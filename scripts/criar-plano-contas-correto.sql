-- Script correto para criar tabela plano_contas e inserir dados
-- Execute no SQL Editor do Supabase

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

-- 2. Criar índice único (se não existir)
DROP INDEX IF EXISTS idx_plano_contas_user_codigo;
CREATE UNIQUE INDEX idx_plano_contas_user_codigo ON public.plano_contas(user_id, codigo_conta);

-- 3. Habilitar RLS
ALTER TABLE public.plano_contas ENABLE ROW LEVEL SECURITY;

-- 4. Remover políticas antigas
DROP POLICY IF EXISTS all_plano_contas ON public.plano_contas;
DROP POLICY IF EXISTS select_plano_contas ON public.plano_contas;
DROP POLICY IF EXISTS insert_plano_contas ON public.plano_contas;
DROP POLICY IF EXISTS update_plano_contas ON public.plano_contas;
DROP POLICY IF EXISTS delete_plano_contas ON public.plano_contas;

-- 5. Criar política única
CREATE POLICY all_plano_contas ON public.plano_contas
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Grants
GRANT ALL ON public.plano_contas TO authenticated;
GRANT ALL ON public.plano_contas TO service_role;

-- 7. Verificar se está logado
DO $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Você precisa estar logado para executar este script';
    END IF;
END $$;

-- 8. Inserir dados (sem ON CONFLICT para evitar erro)
INSERT INTO public.plano_contas (user_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, descricao_reduzida, ativo, permite_lancamento)
SELECT auth.uid(), '1', NULL, 1, 'sintetica', 'ativa', 'ATIVO', 'ATIVO', true, false
WHERE NOT EXISTS (SELECT 1 FROM public.plano_contas WHERE user_id = auth.uid() AND codigo_conta = '1');

INSERT INTO public.plano_contas (user_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, descricao_reduzida, ativo, permite_lancamento)
SELECT auth.uid(), '1.1', '1', 2, 'sintetica', 'ativa', 'Ativo Circulante', 'Ativo Circ.', true, false
WHERE NOT EXISTS (SELECT 1 FROM public.plano_contas WHERE user_id = auth.uid() AND codigo_conta = '1.1');

INSERT INTO public.plano_contas (user_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, descricao_reduzida, ativo, permite_lancamento)
SELECT auth.uid(), '1.1.01', '1.1', 3, 'sintetica', 'ativa', 'Caixa e Equivalentes', 'Caixa', true, false
WHERE NOT EXISTS (SELECT 1 FROM public.plano_contas WHERE user_id = auth.uid() AND codigo_conta = '1.1.01');

INSERT INTO public.plano_contas (user_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, descricao_reduzida, ativo, permite_lancamento)
SELECT auth.uid(), '1.1.01.0001', '1.1.01', 4, 'analitica', 'ativa', 'Caixa Geral', 'Caixa Geral', true, true
WHERE NOT EXISTS (SELECT 1 FROM public.plano_contas WHERE user_id = auth.uid() AND codigo_conta = '1.1.01.0001');

INSERT INTO public.plano_contas (user_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, descricao_reduzida, ativo, permite_lancamento)
SELECT auth.uid(), '2', NULL, 1, 'sintetica', 'passiva', 'PASSIVO', 'PASSIVO', true, false
WHERE NOT EXISTS (SELECT 1 FROM public.plano_contas WHERE user_id = auth.uid() AND codigo_conta = '2');

INSERT INTO public.plano_contas (user_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, descricao_reduzida, ativo, permite_lancamento)
SELECT auth.uid(), '2.1', '2', 2, 'sintetica', 'passiva', 'Passivo Circulante', 'Passivo Circ.', true, false
WHERE NOT EXISTS (SELECT 1 FROM public.plano_contas WHERE user_id = auth.uid() AND codigo_conta = '2.1');

INSERT INTO public.plano_contas (user_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, descricao_reduzida, ativo, permite_lancamento)
SELECT auth.uid(), '3', NULL, 1, 'sintetica', 'receita', 'RECEITAS', 'RECEITAS', true, false
WHERE NOT EXISTS (SELECT 1 FROM public.plano_contas WHERE user_id = auth.uid() AND codigo_conta = '3');

INSERT INTO public.plano_contas (user_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, descricao_reduzida, ativo, permite_lancamento)
SELECT auth.uid(), '3.1', '3', 2, 'sintetica', 'receita', 'Receitas Operacionais', 'Rec. Operac.', true, false
WHERE NOT EXISTS (SELECT 1 FROM public.plano_contas WHERE user_id = auth.uid() AND codigo_conta = '3.1');

INSERT INTO public.plano_contas (user_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, descricao_reduzida, ativo, permite_lancamento)
SELECT auth.uid(), '4', NULL, 1, 'sintetica', 'despesa', 'DESPESAS', 'DESPESAS', true, false
WHERE NOT EXISTS (SELECT 1 FROM public.plano_contas WHERE user_id = auth.uid() AND codigo_conta = '4');

INSERT INTO public.plano_contas (user_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, descricao_reduzida, ativo, permite_lancamento)
SELECT auth.uid(), '4.1', '4', 2, 'sintetica', 'despesa', 'Despesas Operacionais', 'Desp. Operac.', true, false
WHERE NOT EXISTS (SELECT 1 FROM public.plano_contas WHERE user_id = auth.uid() AND codigo_conta = '4.1');

INSERT INTO public.plano_contas (user_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, descricao_reduzida, ativo, permite_lancamento)
SELECT auth.uid(), '4.1.01', '4.1', 3, 'sintetica', 'despesa', 'Pessoal', 'Pessoal', true, false
WHERE NOT EXISTS (SELECT 1 FROM public.plano_contas WHERE user_id = auth.uid() AND codigo_conta = '4.1.01');

-- Verificar resultado
SELECT 'Plano de contas criado!' as status, COUNT(*) as total_contas
FROM public.plano_contas
WHERE user_id = auth.uid();
