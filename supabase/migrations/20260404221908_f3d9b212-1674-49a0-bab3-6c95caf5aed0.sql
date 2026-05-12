
CREATE TABLE public.assinaturas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  plano text NOT NULL DEFAULT 'mensal',
  valor numeric NOT NULL DEFAULT 399.90,
  data_inicio timestamp with time zone,
  data_fim timestamp with time zone,
  metodo_pagamento text,
  pagarme_order_id text,
  pagarme_charge_id text,
  pagarme_customer_id text,
  pix_qr_code text,
  pix_qr_code_url text,
  boleto_url text,
  boleto_barcode text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
ON public.assinaturas FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
ON public.assinaturas FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
ON public.assinaturas FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
ON public.assinaturas FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_assinaturas_updated_at
BEFORE UPDATE ON public.assinaturas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
