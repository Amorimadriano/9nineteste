
CREATE TABLE public.bancos_cartoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tipo text NOT NULL DEFAULT 'banco',
  nome text NOT NULL,
  banco text,
  agencia text,
  conta text,
  bandeira text,
  limite numeric DEFAULT 0,
  saldo_inicial numeric DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bancos_cartoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own bancos_cartoes" ON public.bancos_cartoes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_bancos_cartoes_updated_at
  BEFORE UPDATE ON public.bancos_cartoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
