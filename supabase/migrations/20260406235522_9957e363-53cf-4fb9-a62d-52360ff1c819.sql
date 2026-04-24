
-- 1. Fix: Remove broad SELECT policy on user_roles that exposes all roles
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.user_roles;

-- 2. Fix: Change licencas_software policy from public to authenticated role
DROP POLICY IF EXISTS "Users manage own licencas_software" ON public.licencas_software;

CREATE POLICY "Users manage own licencas_software"
ON public.licencas_software
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Fix: Add RLS policies on realtime.messages to restrict channel subscriptions
-- Users can only subscribe to channels matching their own user ID
CREATE POLICY "Users can only listen to own changes"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = 'user:' || auth.uid()::text
  OR realtime.topic() IN (
    SELECT 'realtime:public:' || t
    FROM unnest(ARRAY['categorias','contas_receber','contas_pagar','lancamentos_caixa','bancos_cartoes','extrato_bancario']) AS t
  )
);
