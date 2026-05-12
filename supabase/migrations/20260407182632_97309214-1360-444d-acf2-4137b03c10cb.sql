
-- Tabela de configuração do contador
CREATE TABLE public.contador_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome_contador text,
  email_contador text NOT NULL,
  escritorio text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.contador_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own contador_config"
  ON public.contador_config FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_contador_config_updated_at
  BEFORE UPDATE ON public.contador_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de documentos do contador
CREATE TABLE public.contador_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome_arquivo text NOT NULL,
  storage_path text NOT NULL,
  tipo_arquivo text,
  tamanho bigint,
  mes_referencia integer,
  ano_referencia integer,
  enviado boolean NOT NULL DEFAULT false,
  enviado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contador_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own contador_documentos"
  ON public.contador_documentos FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_contador_documentos_updated_at
  BEFORE UPDATE ON public.contador_documentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Bucket de storage
INSERT INTO storage.buckets (id, name, public) VALUES ('contador-docs', 'contador-docs', false);

CREATE POLICY "Users can upload contador docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'contador-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own contador docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'contador-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own contador docs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'contador-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
