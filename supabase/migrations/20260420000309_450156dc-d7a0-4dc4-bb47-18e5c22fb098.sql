-- Add banco_cartao_id to contas_pagar and contas_receber to persist
-- which bank/card was selected for payment/receipt.
ALTER TABLE public.contas_pagar
  ADD COLUMN IF NOT EXISTS banco_cartao_id uuid REFERENCES public.bancos_cartoes(id) ON DELETE SET NULL;

ALTER TABLE public.contas_receber
  ADD COLUMN IF NOT EXISTS banco_cartao_id uuid REFERENCES public.bancos_cartoes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_contas_pagar_banco_cartao_id ON public.contas_pagar(banco_cartao_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_banco_cartao_id ON public.contas_receber(banco_cartao_id);