
-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL, -- INSERT, UPDATE, DELETE
  table_name text NOT NULL,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own audit logs
CREATE POLICY "Users can view own audit_logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow inserts from triggers (security definer function handles this)
CREATE POLICY "System can insert audit_logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create index for fast querying
CREATE INDEX idx_audit_logs_user_created ON public.audit_logs (user_id, created_at DESC);
CREATE INDEX idx_audit_logs_table ON public.audit_logs (table_name, created_at DESC);

-- Create the audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_old jsonb;
  v_new jsonb;
  v_record_id text;
BEGIN
  -- Get user_id from the record
  IF TG_OP = 'DELETE' THEN
    v_user_id := (OLD).user_id;
    v_old := to_jsonb(OLD);
    v_new := NULL;
    v_record_id := (OLD).id::text;
  ELSIF TG_OP = 'INSERT' THEN
    v_user_id := (NEW).user_id;
    v_old := NULL;
    v_new := to_jsonb(NEW);
    v_record_id := (NEW).id::text;
  ELSIF TG_OP = 'UPDATE' THEN
    v_user_id := (NEW).user_id;
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_record_id := (NEW).id::text;
  END IF;

  -- Insert audit log
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (v_user_id, TG_OP, TG_TABLE_NAME, v_record_id, v_old, v_new);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Apply triggers to all financial tables
CREATE TRIGGER audit_contas_pagar AFTER INSERT OR UPDATE OR DELETE ON public.contas_pagar FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_contas_receber AFTER INSERT OR UPDATE OR DELETE ON public.contas_receber FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_lancamentos_caixa AFTER INSERT OR UPDATE OR DELETE ON public.lancamentos_caixa FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_categorias AFTER INSERT OR UPDATE OR DELETE ON public.categorias FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_clientes AFTER INSERT OR UPDATE OR DELETE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_fornecedores AFTER INSERT OR UPDATE OR DELETE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_bancos_cartoes AFTER INSERT OR UPDATE OR DELETE ON public.bancos_cartoes FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_extrato_bancario AFTER INSERT OR UPDATE OR DELETE ON public.extrato_bancario FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_empresa AFTER INSERT OR UPDATE OR DELETE ON public.empresa FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_fechamentos_mensais AFTER INSERT OR UPDATE OR DELETE ON public.fechamentos_mensais FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_metas_orcamentarias AFTER INSERT OR UPDATE OR DELETE ON public.metas_orcamentarias FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_anexos AFTER INSERT OR UPDATE OR DELETE ON public.anexos FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
