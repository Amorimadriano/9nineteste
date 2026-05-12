
-- Create licencas_software table
CREATE TABLE public.licencas_software (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo_cliente TEXT NOT NULL DEFAULT 'escritorio',
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj TEXT,
  email TEXT,
  telefone TEXT,
  contato_nome TEXT,
  plano TEXT NOT NULL DEFAULT 'profissional',
  valor_mensal NUMERIC NOT NULL DEFAULT 399.90,
  desconto_percentual NUMERIC DEFAULT 0,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE,
  status TEXT NOT NULL DEFAULT 'ativa',
  chave_licenca TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  max_usuarios INTEGER NOT NULL DEFAULT 5,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint on chave_licenca
ALTER TABLE public.licencas_software ADD CONSTRAINT licencas_software_chave_licenca_key UNIQUE (chave_licenca);

-- Enable RLS
ALTER TABLE public.licencas_software ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Users manage own licencas_software"
  ON public.licencas_software
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_licencas_software_updated_at
  BEFORE UPDATE ON public.licencas_software
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
