CREATE TABLE public.leads_diagnostico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  empresa TEXT NOT NULL,
  cnpj TEXT,
  faturamento_mensal TEXT,
  num_funcionarios TEXT,
  principal_dor TEXT,
  origem TEXT NOT NULL DEFAULT 'site',
  status TEXT NOT NULL DEFAULT 'novo',
  observacoes_internas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.leads_diagnostico ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode inserir (formulário público)
CREATE POLICY "Anyone can submit a lead"
ON public.leads_diagnostico
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Somente admins podem ler
CREATE POLICY "Admins can view all leads"
ON public.leads_diagnostico
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Somente admins podem atualizar
CREATE POLICY "Admins can update leads"
ON public.leads_diagnostico
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Somente admins podem deletar
CREATE POLICY "Admins can delete leads"
ON public.leads_diagnostico
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger updated_at
CREATE TRIGGER set_leads_diagnostico_updated_at
BEFORE UPDATE ON public.leads_diagnostico
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices
CREATE INDEX idx_leads_diagnostico_status ON public.leads_diagnostico(status);
CREATE INDEX idx_leads_diagnostico_created ON public.leads_diagnostico(created_at DESC);