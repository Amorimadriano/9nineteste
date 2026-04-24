-- Criar tabela de configurações gerais (SMTP, etc)
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  key varchar(255) NOT NULL,
  value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, key)
);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_settings_key ON public.settings(key);

-- RLS para settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see/edit their own settings
CREATE POLICY "Users can manage own settings"
  ON public.settings
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());