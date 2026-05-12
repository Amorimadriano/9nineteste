
CREATE TABLE public.fechamentos_mensais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mes INTEGER NOT NULL,
  ano INTEGER NOT NULL DEFAULT 2026,
  receita_total NUMERIC NOT NULL DEFAULT 0,
  despesa_total NUMERIC NOT NULL DEFAULT 0,
  custos_diretos NUMERIC NOT NULL DEFAULT 0,
  despesas_operacionais NUMERIC NOT NULL DEFAULT 0,
  lucro_bruto NUMERIC NOT NULL DEFAULT 0,
  lucro_liquido NUMERIC NOT NULL DEFAULT 0,
  saldo_inicial NUMERIC NOT NULL DEFAULT 0,
  saldo_final NUMERIC NOT NULL DEFAULT 0,
  contas_receber_pendentes NUMERIC NOT NULL DEFAULT 0,
  contas_pagar_pendentes NUMERIC NOT NULL DEFAULT 0,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho',
  fechado_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, mes, ano)
);

ALTER TABLE public.fechamentos_mensais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own fechamentos_mensais"
ON public.fechamentos_mensais
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_fechamentos_mensais_updated_at
BEFORE UPDATE ON public.fechamentos_mensais
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
