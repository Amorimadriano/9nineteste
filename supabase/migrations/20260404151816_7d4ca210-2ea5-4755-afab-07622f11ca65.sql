
-- Remove redundant public storage policies for logos bucket
DROP POLICY IF EXISTS "Users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update logos" ON storage.objects;

-- Fix anexos update policy to authenticated only
DROP POLICY IF EXISTS "Users can update their own attachments" ON storage.objects;
CREATE POLICY "Users can update their own attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING ((bucket_id = 'anexos'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]));
