
CREATE TABLE public.metas_orcamentarias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE CASCADE,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL DEFAULT 2026,
  valor_orcado NUMERIC NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, categoria_id, mes, ano)
);

ALTER TABLE public.metas_orcamentarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own metas_orcamentarias"
  ON public.metas_orcamentarias
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_metas_orcamentarias_updated_at
  BEFORE UPDATE ON public.metas_orcamentarias
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
