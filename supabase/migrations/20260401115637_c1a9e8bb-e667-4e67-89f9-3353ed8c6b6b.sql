
CREATE TABLE public.extrato_bancario (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  banco_cartao_id UUID REFERENCES public.bancos_cartoes(id) ON DELETE SET NULL,
  data_transacao DATE NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'entrada',
  fitid TEXT,
  conciliado BOOLEAN NOT NULL DEFAULT false,
  lancamento_id UUID REFERENCES public.lancamentos_caixa(id) ON DELETE SET NULL,
  conta_receber_id UUID REFERENCES public.contas_receber(id) ON DELETE SET NULL,
  conta_pagar_id UUID REFERENCES public.contas_pagar(id) ON DELETE SET NULL,
  origem TEXT NOT NULL DEFAULT 'ofx',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.extrato_bancario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own extrato_bancario"
  ON public.extrato_bancario
  FOR ALL
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE UNIQUE INDEX extrato_bancario_fitid_user_idx ON public.extrato_bancario(user_id, fitid) WHERE fitid IS NOT NULL;
