
-- Storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('anexos', 'anexos', true);

-- RLS policies for storage
CREATE POLICY "Users can upload own anexos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'anexos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view own anexos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'anexos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own anexos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'anexos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Table to track attachments
CREATE TABLE public.anexos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conta_pagar_id UUID REFERENCES public.contas_pagar(id) ON DELETE CASCADE,
  conta_receber_id UUID REFERENCES public.contas_receber(id) ON DELETE CASCADE,
  nome_arquivo TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  tipo_arquivo TEXT,
  tamanho BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.anexos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own anexos" ON public.anexos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
