
CREATE TABLE public.transferencias_contas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conta_origem_id UUID REFERENCES public.bancos_cartoes(id) ON DELETE SET NULL,
  conta_destino_id UUID REFERENCES public.bancos_cartoes(id) ON DELETE SET NULL,
  valor NUMERIC NOT NULL,
  data_transferencia DATE NOT NULL DEFAULT CURRENT_DATE,
  descricao TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.transferencias_contas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own transferencias_contas"
ON public.transferencias_contas
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_transferencias_contas_updated_at
BEFORE UPDATE ON public.transferencias_contas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
