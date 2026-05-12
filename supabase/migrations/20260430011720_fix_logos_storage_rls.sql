-- Fix storage RLS policies for logos bucket
-- The previous migration dropped INSERT/UPDATE policies for logos and never recreated them,
-- causing "new row violates row-level security policy" on logo upload.
-- Additionally, the old policy required auth.uid() = foldername, but the app uses empresaId as folder.

-- INSERT: allow any authenticated user to upload to logos bucket
DROP POLICY IF EXISTS "Users can upload logos" ON storage.objects;
CREATE POLICY "Users can upload logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'logos');

-- UPDATE: allow any authenticated user to update files in logos bucket
DROP POLICY IF EXISTS "Users can update logos" ON storage.objects;
CREATE POLICY "Users can update logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'logos');

-- DELETE: allow any authenticated user to delete files in logos bucket
DROP POLICY IF EXISTS "Users can delete logos" ON storage.objects;
CREATE POLICY "Users can delete logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'logos');

-- SELECT: already exists and is public (kept as-is)
