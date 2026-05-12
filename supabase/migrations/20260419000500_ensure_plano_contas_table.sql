-- ============================================
-- MIGRATION: Garantir que tabela plano_contas existe
-- Data: 2026-04-19
-- ============================================

-- Criar tabela plano_contas se não existir
CREATE TABLE IF NOT EXISTS public.plano_contas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    empresa_id UUID,
    codigo_conta TEXT NOT NULL,
    codigo_pai TEXT,
    nivel INTEGER NOT NULL DEFAULT 1,
    tipo_conta TEXT NOT NULL DEFAULT 'sintetica', -- sintetica ou analitica
    natureza TEXT NOT NULL DEFAULT 'ativa', -- ativa, passiva, receita, despesa
    descricao TEXT NOT NULL,
    descricao_reduzida TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    permite_lancamento BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE public.plano_contas IS 'Plano de contas contábil';
COMMENT ON COLUMN public.plano_contas.codigo_conta IS 'Código hierárquico (ex: 1.1.01.0001)';
COMMENT ON COLUMN public.plano_contas.tipo_conta IS 'sintetica (grupo) ou analitica (conta movimento)';
COMMENT ON COLUMN public.plano_contas.natureza IS 'ativa, passiva, receita, despesa';

-- Índices
CREATE INDEX IF NOT EXISTS idx_plano_contas_user_id ON public.plano_contas(user_id);
CREATE INDEX IF NOT EXISTS idx_plano_contas_codigo ON public.plano_contas(codigo_conta);
CREATE INDEX IF NOT EXISTS idx_plano_contas_ativo ON public.plano_contas(ativo) WHERE ativo = true;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_plano_contas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_plano_contas_updated_at ON public.plano_contas;
CREATE TRIGGER trigger_update_plano_contas_updated_at
    BEFORE UPDATE ON public.plano_contas
    FOR EACH ROW
    EXECUTE FUNCTION update_plano_contas_updated_at();

-- Habilitar RLS
ALTER TABLE public.plano_contas ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "select_plano_contas" ON public.plano_contas;
DROP POLICY IF EXISTS "insert_plano_contas" ON public.plano_contas;
DROP POLICY IF EXISTS "update_plano_contas" ON public.plano_contas;
DROP POLICY IF EXISTS "delete_plano_contas" ON public.plano_contas;

-- Criar políticas RLS
CREATE POLICY "select_plano_contas"
ON public.plano_contas
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "insert_plano_contas"
ON public.plano_contas
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_plano_contas"
ON public.plano_contas
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_plano_contas"
ON public.plano_contas
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plano_contas TO authenticated;
GRANT ALL ON public.plano_contas TO service_role;

-- Verificar instalação
SELECT 'Tabela plano_contas verificada/criada com sucesso!' as status;
