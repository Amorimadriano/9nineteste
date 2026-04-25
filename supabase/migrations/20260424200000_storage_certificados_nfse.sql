-- ============================================
-- MIGRATION: Storage bucket e RLS para certificados NFS-e
-- Data: 2026-04-24
-- ============================================

-- 1. Criar bucket de storage para certificados
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('certificados-nfse', 'certificados-nfse', false, 5242880, ARRAY['application/x-pkcs12', 'application/pkcs12'])
ON CONFLICT (id) DO NOTHING;

-- 2. Remover politicas existentes (se houver)
DROP POLICY IF EXISTS "Users can upload certificados-nfse" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own certificados-nfse" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own certificados-nfse" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own certificados-nfse" ON storage.objects;

-- 3. Criar politicas RLS para o bucket certificados-nfse

-- Upload: usuarios autenticados so podem enviar arquivos para sua propria pasta
CREATE POLICY "Users can upload certificados-nfse"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'certificados-nfse' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Leitura: usuarios so podem ver seus proprios certificados
CREATE POLICY "Users can view own certificados-nfse"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'certificados-nfse' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Update: usuarios so podem atualizar seus proprios certificados
CREATE POLICY "Users can update own certificados-nfse"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'certificados-nfse' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'certificados-nfse' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Delete: usuarios so podem deletar seus proprios certificados
CREATE POLICY "Users can delete own certificados-nfse"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'certificados-nfse' AND (storage.foldername(name))[1] = auth.uid()::text);

SELECT 'Storage bucket certificados-nfse criado com RLS!' as status;