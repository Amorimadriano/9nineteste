-- ============================================
-- MIGRATION: Fix missing tables and columns
-- Tables: nfse_rascunhos, mapeamento_contabil
-- Columns: certificados_nfse additions
-- Data: 2026-04-24
-- ============================================

-- ============================================
-- 1. TABELA: nfse_rascunhos (com colunas que o frontend espera)
-- O migration antigo criou "nfs_e_rascunhos" com "usuario_id",
-- mas o frontend usa "nfse_rascunhos" com "user_id".
-- Criamos a tabela correta para compatibilidade com o frontend.
-- ============================================

CREATE TABLE IF NOT EXISTS public.nfse_rascunhos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Snapshot dos campos do formulário
    dados JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraint: apenas um rascunho por usuário
    CONSTRAINT uq_nfse_rascunho_usuario UNIQUE (user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_nfse_rascunhos_user_id ON public.nfse_rascunhos(user_id);
CREATE INDEX IF NOT EXISTS idx_nfse_rascunhos_created_at ON public.nfse_rascunhos(created_at);

-- RLS
ALTER TABLE public.nfse_rascunhos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own nfse_rascunhos"
ON public.nfse_rascunhos
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_nfse_rascunhos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_nfse_rascunhos_updated_at ON public.nfse_rascunhos;
CREATE TRIGGER trigger_update_nfse_rascunhos_updated_at
BEFORE UPDATE ON public.nfse_rascunhos
FOR EACH ROW
EXECUTE FUNCTION update_nfse_rascunhos_updated_at();

-- Grant
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nfse_rascunhos TO authenticated;
GRANT ALL ON public.nfse_rascunhos TO service_role;

-- ============================================
-- 2. TABELA: mapeamento_contabil (idempotente)
-- Re-cria caso a migration original nao foi aplicada
-- ============================================

CREATE TABLE IF NOT EXISTS public.mapeamento_contabil (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    empresa_id UUID, -- sem FK pois tabela empresas pode nao existir
    categoria_id UUID, -- sem FK para evitar erro se tabela nao existe
    tipo_lancamento TEXT NOT NULL CHECK (tipo_lancamento IN ('despesa', 'receita', 'transferencia')),
    plano_conta_id UUID NOT NULL, -- sem FK para evitar erro se tabela nao existe
    historico_padrao TEXT,
    centro_custo TEXT,
    regra_condicional JSONB,
    ativo BOOLEAN NOT NULL DEFAULT true,
    automatico BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT mapeamento_unico UNIQUE (user_id, empresa_id, categoria_id, tipo_lancamento)
);

-- Índices (idempotentes)
CREATE INDEX IF NOT EXISTS idx_mapeamento_user ON public.mapeamento_contabil(user_id);
CREATE INDEX IF NOT EXISTS idx_mapeamento_categoria ON public.mapeamento_contabil(categoria_id);
CREATE INDEX IF NOT EXISTS idx_mapeamento_plano ON public.mapeamento_contabil(plano_conta_id);

-- RLS (idempotente)
ALTER TABLE public.mapeamento_contabil ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own mapeamento_contabil"
ON public.mapeamento_contabil
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_mapeamento_contabil_updated_at ON public.mapeamento_contabil;
CREATE TRIGGER update_mapeamento_contabil_updated_at
BEFORE UPDATE ON public.mapeamento_contabil
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Grant
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mapeamento_contabil TO authenticated;
GRANT ALL ON public.mapeamento_contabil TO service_role;

-- ============================================
-- 3. COLUNAS: certificados_nfse (idempotente)
-- Re-aplica caso a migration 20260424210000 nao foi aplicada
-- ============================================

ALTER TABLE public.certificados_nfse
    ADD COLUMN IF NOT EXISTS arquivo_pfx TEXT,
    ADD COLUMN IF NOT EXISTS senha TEXT,
    ADD COLUMN IF NOT EXISTS razao_social TEXT,
    ADD COLUMN IF NOT EXISTS inscricao_municipal TEXT,
    ADD COLUMN IF NOT EXISTS endereco JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS codigo_municipio TEXT DEFAULT '3550308',
    ADD COLUMN IF NOT EXISTS uf TEXT DEFAULT 'SP',
    ADD COLUMN IF NOT EXISTS cep TEXT,
    ADD COLUMN IF NOT EXISTS numero TEXT,
    ADD COLUMN IF NOT EXISTS bairro TEXT;

-- ============================================
-- 4. COLUNAS: notas_fiscais_servico (idempotente)
-- ============================================

ALTER TABLE public.notas_fiscais_servico
    ADD COLUMN IF NOT EXISTS data_autorizacao TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT,
    ADD COLUMN IF NOT EXISTS mensagem_erro TEXT;

-- ============================================
-- 5. TABELAS: nfse_sync_logs e nfse_cron_logs (idempotente)
-- ============================================

CREATE TABLE IF NOT EXISTS public.nfse_sync_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nota_id UUID REFERENCES public.notas_fiscais_servico(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    mensagem TEXT,
    detalhes JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nfse_sync_logs_nota ON public.nfse_sync_logs(nota_id);
CREATE INDEX IF NOT EXISTS idx_nfse_sync_logs_user ON public.nfse_sync_logs(user_id);

ALTER TABLE public.nfse_sync_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sync logs" ON public.nfse_sync_logs;
DROP POLICY IF EXISTS "Users can insert own sync logs" ON public.nfse_sync_logs;
CREATE POLICY "Users can view own sync logs" ON public.nfse_sync_logs
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sync logs" ON public.nfse_sync_logs
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.nfse_cron_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    notas_processadas INTEGER DEFAULT 0,
    notas_autorizadas INTEGER DEFAULT 0,
    notas_rejeitadas INTEGER DEFAULT 0,
    erros INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nfse_cron_logs_user ON public.nfse_cron_logs(user_id);

ALTER TABLE public.nfse_cron_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own cron logs" ON public.nfse_cron_logs;
CREATE POLICY "Users can view own cron logs" ON public.nfse_cron_logs
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

SELECT 'Migration 20260424220000 applied successfully!' as status;