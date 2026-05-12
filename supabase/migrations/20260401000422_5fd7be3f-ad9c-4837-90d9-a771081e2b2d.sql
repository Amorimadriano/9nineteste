
ALTER TABLE public.contas_pagar
  ADD COLUMN recorrente boolean NOT NULL DEFAULT false,
  ADD COLUMN frequencia text DEFAULT NULL,
  ADD COLUMN data_fim_recorrencia date DEFAULT NULL,
  ADD COLUMN forma_pagamento text DEFAULT NULL;

ALTER TABLE public.contas_receber
  ADD COLUMN recorrente boolean NOT NULL DEFAULT false,
  ADD COLUMN frequencia text DEFAULT NULL,
  ADD COLUMN data_fim_recorrencia date DEFAULT NULL,
  ADD COLUMN forma_pagamento text DEFAULT NULL;
