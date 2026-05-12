CREATE POLICY "Admins can insert subscriptions for any user"
ON public.assinaturas
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));