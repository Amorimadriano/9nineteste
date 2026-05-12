
-- 1. Fix user_roles SELECT policy: users should only see their own roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 2. Ensure no UPDATE policy on user_roles (block updates)
DROP POLICY IF EXISTS "Users can update roles" ON public.user_roles;

-- 3. Fix storage policy: change logo delete from public to authenticated
DROP POLICY IF EXISTS "Users can delete logos" ON storage.objects;
CREATE POLICY "Users can delete logos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4. Add RLS on realtime.messages if not exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'realtime' AND tablename = 'messages') THEN
    ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
