CREATE POLICY "Admins can update subscriptions for any user"
ON public.assinaturas
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));