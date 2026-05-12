-- Make anexos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'anexos';

-- Add UPDATE policy for anexos
CREATE POLICY "Users can update their own attachments"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'anexos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Fix logos policies to require authentication
DROP POLICY IF EXISTS "Anyone can upload a logo" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update logos" ON storage.objects;

CREATE POLICY "Authenticated users can upload their own logo"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can update their own logo"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);