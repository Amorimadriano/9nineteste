
-- 1. Fix Realtime: Add restrictive RLS policy on realtime.messages
-- Allow authenticated users to receive messages only for their own data
CREATE POLICY "Authenticated users receive own realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Allow postgres_changes subscriptions scoped by table RLS
  realtime.topic() ~ '^realtime:public:'
);

-- 2. Fix privilege escalation on user_roles
-- Drop existing INSERT policy that only checks admin for admin role
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;

-- New INSERT policy: only admins can insert ANY role
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
);
