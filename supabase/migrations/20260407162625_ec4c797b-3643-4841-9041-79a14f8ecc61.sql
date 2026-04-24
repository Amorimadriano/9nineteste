
-- Tabela de configuração da régua de cobrança
CREATE TABLE public.regua_cobranca (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL DEFAULT 'Régua Padrão',
  dias_antes_1 INTEGER DEFAULT 3,
  dias_antes_2 INTEGER DEFAULT 1,
  dias_no_vencimento BOOLEAN DEFAULT true,
  dias_apos_1 INTEGER DEFAULT 3,
  dias_apos_2 INTEGER DEFAULT 7,
  dias_apos_3 INTEGER DEFAULT 15,
  canal TEXT NOT NULL DEFAULT 'email',
  mensagem_antes TEXT DEFAULT 'Prezado(a) cliente, informamos que sua fatura no valor de {valor} vence em {dias} dia(s), no dia {data_vencimento}. Agradecemos a atenção.',
  mensagem_vencimento TEXT DEFAULT 'Prezado(a) cliente, informamos que sua fatura no valor de {valor} vence hoje, dia {data_vencimento}. Agradecemos a atenção.',
  mensagem_apos TEXT DEFAULT 'Prezado(a) cliente, identificamos que sua fatura no valor de {valor}, com vencimento em {data_vencimento}, encontra-se em atraso há {dias} dia(s). Solicitamos a regularização.',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.regua_cobranca ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own regua_cobranca"
ON public.regua_cobranca FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Tabela de histórico de cobranças enviadas
CREATE TABLE public.cobranca_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conta_receber_id UUID REFERENCES public.contas_receber(id) ON DELETE SET NULL,
  cliente_nome TEXT,
  cliente_email TEXT,
  tipo TEXT NOT NULL, -- antes_vencimento, no_vencimento, apos_vencimento
  canal TEXT NOT NULL DEFAULT 'email',
  mensagem TEXT,
  status TEXT NOT NULL DEFAULT 'enviado',
  valor NUMERIC,
  data_vencimento DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cobranca_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own cobranca_historico"
ON public.cobranca_historico FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_regua_cobranca_updated_at
BEFORE UPDATE ON public.regua_cobranca
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
