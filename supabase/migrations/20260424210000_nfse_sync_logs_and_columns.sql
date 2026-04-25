-- ============================================
-- MIGRATION: NFS-e sync logs, certificate columns, nota columns
-- Data: 2026-04-24
-- ============================================

-- 1. Create nfse_sync_logs table
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
ALTER TABLE public.nfse_sync_logs FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sync logs" ON public.nfse_sync_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync logs" ON public.nfse_sync_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 2. Create nfse_cron_logs table
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
ALTER TABLE public.nfse_cron_logs FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cron logs" ON public.nfse_cron_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 3. Add columns to certificados_nfse
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

-- 4. Add columns to notas_fiscais_servico
ALTER TABLE public.notas_fiscais_servico
  ADD COLUMN IF NOT EXISTS data_autorizacao TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT,
  ADD COLUMN IF NOT EXISTS mensagem_erro TEXT;

SELECT 'NFS-e migration applied!' as status;