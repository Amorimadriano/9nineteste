-- Schema fix script generated automatically
BEGIN;

ALTER TABLE public.bancos_cartoes ADD COLUMN IF NOT EXISTS empresa_id uuid;
ALTER TABLE public.categorias ADD COLUMN IF NOT EXISTS empresa_id uuid;
ALTER TABLE public.cobranca_historico ADD COLUMN IF NOT EXISTS empresa_id uuid;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS empresa_id uuid;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS empresa_id uuid;
ALTER TABLE public.extrato_bancario ADD COLUMN IF NOT EXISTS empresa_id uuid;
ALTER TABLE public.extrato_bancario ADD COLUMN IF NOT EXISTS status_conciliacao text;
ALTER TABLE public.fechamentos_mensais ADD COLUMN IF NOT EXISTS empresa_id uuid;
ALTER TABLE public.lancamentos_caixa ADD COLUMN IF NOT EXISTS empresa_id uuid;
ALTER TABLE public.metas_orcamentarias ADD COLUMN IF NOT EXISTS empresa_id uuid;
ALTER TABLE public.regua_cobranca ADD COLUMN IF NOT EXISTS empresa_id uuid;
ALTER TABLE public.transferencias_contas ADD COLUMN IF NOT EXISTS empresa_id uuid;

COMMIT;
