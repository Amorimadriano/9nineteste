CREATE POLICY "Admins can insert notifications"
ON public.notificacoes_admin
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));