ALTER TABLE public.extrato_bancario ADD COLUMN parcelas integer DEFAULT 1;
ALTER TABLE public.extrato_bancario ADD COLUMN parcela_atual integer DEFAULT 1;