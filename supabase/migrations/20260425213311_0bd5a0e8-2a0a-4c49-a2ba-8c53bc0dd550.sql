
-- 1. Adicionar coluna jsonb para guardar dados extras (módulos, contatos, integrações, documentos)
ALTER TABLE public.licencas_software
  ADD COLUMN IF NOT EXISTS configuracao_extra jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2. Criar bucket dedicado para documentos de licenças
INSERT INTO storage.buckets (id, name, public)
VALUES ('licencas-documentos', 'licencas-documentos', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de storage: somente o dono (user_id = auth.uid()) acessa seus arquivos.
--    Estrutura de path: {auth.uid()}/{licenca_id}/{nome_arquivo}
CREATE POLICY "licencas_docs_select_own"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'licencas-documentos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "licencas_docs_insert_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'licencas-documentos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "licencas_docs_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'licencas-documentos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "licencas_docs_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'licencas-documentos' AND auth.uid()::text = (storage.foldername(name))[1]);
