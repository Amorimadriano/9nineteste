-- =====================================================
-- MIGRATION: Open Banking - Arquitetura de Banco de Dados
-- Task: #19 - Open Banking Setup e Arquitetura
-- Criado por: Agente Supabase + Agente Seguranca
-- Data: 2026-04-16
-- =====================================================

-- =====================================================
-- 1. TIPOS ENUM
-- =====================================================

-- Status da integracao Open Banking
CREATE TYPE public.open_banking_status AS ENUM ('ativo', 'expirado', 'revogado', 'erro');

-- Tipo de transacao (entrada ou saida)
CREATE TYPE public.open_banking_tipo_transacao AS ENUM ('entrada', 'saida');

-- =====================================================
-- 2. TABELA: open_banking_integracoes
-- =====================================================
-- Armazena as integracoes com bancos via Open Banking

CREATE TABLE public.open_banking_integracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Dados do banco
  banco_codigo varchar(10) NOT NULL,
  banco_nome varchar(100) NOT NULL,
  banco_logo_url text,

  -- Tokens OAuth2 (criptografados via pgsodium)
  access_token_encrypted bytea,
  refresh_token_encrypted bytea,
  token_expires_at timestamptz,

  -- Consentimento
  consent_id varchar(255),
  consent_expires_at timestamptz,

  -- Status da integracao
  status open_banking_status NOT NULL DEFAULT 'ativo',
  ultimo_erro text,
  ultimo_erro_at timestamptz,

  -- Dados da conta (mascarados por seguranca)
  conta_numero varchar(20),
  conta_tipo varchar(50),
  agencia varchar(20),

  -- Sincronizacao
  ultima_sincronizacao timestamptz,
  proxima_sincronizacao timestamptz,

  -- Configuracoes
  auto_sync boolean NOT NULL DEFAULT true,
  sync_interval_minutes integer NOT NULL DEFAULT 60,

  -- Auditoria
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  revoked_by uuid REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT unique_user_banco_conta UNIQUE (user_id, banco_codigo, conta_numero),
  CONSTRAINT valid_banco_codigo CHECK (banco_codigo ~ '^[0-9]+$'),
  CONSTRAINT valid_sync_interval CHECK (sync_interval_minutes >= 15 AND sync_interval_minutes <= 1440)
);

-- Comentarios para documentacao
COMMENT ON TABLE public.open_banking_integracoes IS 'Integracoes Open Banking com instituicoes financeiras';
COMMENT ON COLUMN public.open_banking_integracoes.access_token_encrypted IS 'Token de acesso OAuth2 criptografado (nao armazenar em texto plano!)';
COMMENT ON COLUMN public.open_banking_integracoes.refresh_token_encrypted IS 'Token de refresh OAuth2 criptografado (nao armazenar em texto plano!)';
COMMENT ON COLUMN public.open_banking_integracoes.conta_numero IS 'Numero da conta mascarado (ex: ****1234)';

-- =====================================================
-- 3. TABELA: open_banking_extratos
-- =====================================================
-- Armazena as transacoes/extratos importados via Open Banking

CREATE TABLE public.open_banking_extratos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integracao_id uuid NOT NULL REFERENCES public.open_banking_integracoes(id) ON DELETE CASCADE,

  -- Identificacao da transacao no banco
  transacao_id varchar(255) NOT NULL,
  transacao_id_externo varchar(255),

  -- Dados da transacao
  data_transacao date NOT NULL,
  data_lancamento timestamptz NOT NULL DEFAULT now(),
  hora_transacao time,

  -- Descricao e valores
  descricao text NOT NULL,
  descricao_original text,
  valor numeric(15,2) NOT NULL,
  tipo open_banking_tipo_transacao NOT NULL,

  -- Dados adicionais do banco
  categoria_banco varchar(100),
  subcategoria_banco varchar(100),
  codigo_mcc varchar(4),
  nome_estabelecimento varchar(255),
  cidade_transacao varchar(100),

  -- Dados da conta no momento da transacao
  conta_numero_snapshot varchar(20),
  agencia_snapshot varchar(20),
  saldo_apos_transacao numeric(15,2),

  -- Comprovante (URL segura no storage)
  comprovante_url text,
  comprovante_storage_path text,

  -- Conciliacao com lancamentos internos
  conciliado boolean NOT NULL DEFAULT false,
  conciliado_at timestamptz,
  conciliado_por uuid REFERENCES auth.users(id),
  lancamento_vinculado_id uuid REFERENCES public.lancamentos_caixa(id) ON DELETE SET NULL,
  conta_receber_vinculada_id uuid REFERENCES public.contas_receber(id) ON DELETE SET NULL,
  conta_pagar_vinculada_id uuid REFERENCES public.contas_pagar(id) ON DELETE SET NULL,

  -- Metadados da importacao
  importado_por uuid REFERENCES auth.users(id),
  importado_via varchar(50) DEFAULT 'open_banking', -- 'open_banking', 'manual', 'csv', etc

  -- Flags
  ignorado boolean NOT NULL DEFAULT false,
  ignorado_por uuid REFERENCES auth.users(id),
  ignorado_at timestamptz,
  ignorado_motivo text,

  -- Auditoria
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT unique_transacao_integracao UNIQUE (integracao_id, transacao_id),
  CONSTRAINT valor_nao_zero CHECK (valor <> 0),
  CONSTRAINT data_transacao_valida CHECK (data_transacao <= CURRENT_DATE + interval '1 day')
);

-- Comentarios
COMMENT ON TABLE public.open_banking_extratos IS 'Transacoes bancarias importadas via Open Banking';
COMMENT ON COLUMN public.open_banking_extratos.transacao_id IS 'ID unico da transacao fornecido pelo banco';
COMMENT ON COLUMN public.open_banking_extratos.lancamento_vinculado_id IS 'Vinculo com lancamento interno do sistema';

-- =====================================================
-- 4. TABELA: open_banking_logs
-- =====================================================
-- Log de operacoes e erros para auditoria

CREATE TABLE public.open_banking_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integracao_id uuid REFERENCES public.open_banking_integracoes(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Log
  operacao varchar(100) NOT NULL, -- 'sync', 'refresh_token', 'consent_create', etc
  status varchar(50) NOT NULL, -- 'sucesso', 'erro', 'aviso'
  mensagem text,
  detalhes jsonb,

  -- Dados da requisicao (anonimizados)
  request_path varchar(255),
  http_status integer,

  -- Metadados
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.open_banking_logs IS 'Log de operacoes Open Banking para auditoria e debug';

-- =====================================================
-- 5. TABELA: open_banking_bancos_suportados
-- =====================================================
-- Lista de bancos suportados pelo sistema Open Banking

CREATE TABLE public.open_banking_bancos_suportados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Dados do banco
  codigo varchar(10) NOT NULL UNIQUE,
  nome varchar(100) NOT NULL,
  nome_completo varchar(255),
  cnpj varchar(18),

  -- Configuracao da API
  api_base_url text NOT NULL,
  api_version varchar(20) DEFAULT 'v1',
  auth_url text NOT NULL,
  token_url text NOT NULL,

  -- Campos OAuth2
  client_id_required boolean DEFAULT true,
  client_secret_required boolean DEFAULT true,
  pkce_required boolean DEFAULT true,
  scopes_padrao text[] DEFAULT ARRAY['accounts', 'payments'],

  -- Status
  ativo boolean NOT NULL DEFAULT true,
  participante_open_banking boolean NOT NULL DEFAULT true,

  -- Auditoria
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.open_banking_bancos_suportados IS 'Cadastro de bancos suportados pelo sistema Open Banking';

-- =====================================================
-- 6. INDICES
-- =====================================================

-- Indices para open_banking_integracoes
CREATE INDEX idx_open_banking_integracoes_user ON public.open_banking_integracoes(user_id);
CREATE INDEX idx_open_banking_integracoes_status ON public.open_banking_integracoes(status);
CREATE INDEX idx_open_banking_integracoes_banco ON public.open_banking_integracoes(banco_codigo);
CREATE INDEX idx_open_banking_integracoes_token_expires ON public.open_banking_integracoes(token_expires_at);
CREATE INDEX idx_open_banking_integracoes_consent_expires ON public.open_banking_integracoes(consent_expires_at);
CREATE INDEX idx_open_banking_integracoes_proxima_sync ON public.open_banking_integracoes(proxima_sincronizacao);
CREATE INDEX idx_open_banking_integracoes_ultima_sync ON public.open_banking_integracoes(ultima_sincronizacao);

-- Indices para open_banking_extratos
CREATE INDEX idx_open_banking_extratos_integracao ON public.open_banking_extratos(integracao_id);
CREATE INDEX idx_open_banking_extratos_data ON public.open_banking_extratos(data_transacao);
CREATE INDEX idx_open_banking_extratos_tipo ON public.open_banking_extratos(tipo);
CREATE INDEX idx_open_banking_extratos_conciliado ON public.open_banking_extratos(conciliado);
CREATE INDEX idx_open_banking_extratos_lancamento ON public.open_banking_extratos(lancamento_vinculado_id);
CREATE INDEX idx_open_banking_extratos_transacao_id ON public.open_banking_extratos(transacao_id);
CREATE INDEX idx_open_banking_extratos_user_integracao ON public.open_banking_extratos(integracao_id, data_transacao DESC);

-- Indices para open_banking_logs
CREATE INDEX idx_open_banking_logs_integracao ON public.open_banking_logs(integracao_id);
CREATE INDEX idx_open_banking_logs_user ON public.open_banking_logs(user_id);
CREATE INDEX idx_open_banking_logs_operacao ON public.open_banking_logs(operacao);
CREATE INDEX idx_open_banking_logs_created ON public.open_banking_logs(created_at DESC);
CREATE INDEX idx_open_banking_logs_status ON public.open_banking_logs(status);

-- Partial index para transacoes nao conciliadas
CREATE INDEX idx_open_banking_extratos_nao_conciliados ON public.open_banking_extratos(integracao_id, data_transacao)
WHERE conciliado = false AND ignorado = false;

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.open_banking_integracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.open_banking_extratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.open_banking_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.open_banking_bancos_suportados ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7.1 POLICIES: open_banking_integracoes
-- =====================================================

-- Policy: Usuarios veem apenas suas proprias integracoes
CREATE POLICY "Users view own integrations"
ON public.open_banking_integracoes
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Usuarios inserem apenas para si mesmos
CREATE POLICY "Users insert own integrations"
ON public.open_banking_integracoes
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy: Usuarios atualizam apenas suas proprias integracoes
CREATE POLICY "Users update own integrations"
ON public.open_banking_integracoes
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy: Usuarios deletam apenas suas proprias integracoes
CREATE POLICY "Users delete own integrations"
ON public.open_banking_integracoes
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Policy: Admins veem todas as integracoes (para suporte)
CREATE POLICY "Admins view all integrations"
ON public.open_banking_integracoes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- 7.2 POLICIES: open_banking_extratos
-- =====================================================

-- Policy: Usuarios veem extratos de suas integracoes
CREATE POLICY "Users view own extratos"
ON public.open_banking_extratos
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.open_banking_integracoes
  WHERE id = open_banking_extratos.integracao_id
  AND user_id = auth.uid()
));

-- Policy: Usuarios inserem extratos apenas em suas integracoes
CREATE POLICY "Users insert own extratos"
ON public.open_banking_extratos
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.open_banking_integracoes
  WHERE id = open_banking_extratos.integracao_id
  AND user_id = auth.uid()
));

-- Policy: Usuarios atualizam extratos de suas integracoes
CREATE POLICY "Users update own extratos"
ON public.open_banking_extratos
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.open_banking_integracoes
  WHERE id = open_banking_extratos.integracao_id
  AND user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.open_banking_integracoes
  WHERE id = open_banking_extratos.integracao_id
  AND user_id = auth.uid()
));

-- Policy: Usuarios deletam extratos de suas integracoes
CREATE POLICY "Users delete own extratos"
ON public.open_banking_extratos
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.open_banking_integracoes
  WHERE id = open_banking_extratos.integracao_id
  AND user_id = auth.uid()
));

-- =====================================================
-- 7.3 POLICIES: open_banking_logs
-- =====================================================

-- Policy: Usuarios veem logs de suas proprias integracoes
CREATE POLICY "Users view own logs"
ON public.open_banking_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.open_banking_integracoes
  WHERE id = open_banking_logs.integracao_id
  AND user_id = auth.uid()
));

-- Policy: Sistema pode inserir logs (via service role)
CREATE POLICY "Service can insert logs"
ON public.open_banking_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy: Admins veem todos os logs
CREATE POLICY "Admins view all logs"
ON public.open_banking_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- 7.4 POLICIES: open_banking_bancos_suportados
-- =====================================================

-- Policy: Todos autenticados podem ver bancos suportados
CREATE POLICY "Authenticated can view supported banks"
ON public.open_banking_bancos_suportados
FOR SELECT
TO authenticated
USING (ativo = true);

-- Policy: Apenas admins gerenciam bancos suportados
CREATE POLICY "Admins manage supported banks"
ON public.open_banking_bancos_suportados
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- 8. TRIGGERS
-- =====================================================

-- Trigger para atualizar updated_at
CREATE TRIGGER update_open_banking_integracoes_updated_at
  BEFORE UPDATE ON public.open_banking_integracoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_open_banking_extratos_updated_at
  BEFORE UPDATE ON public.open_banking_extratos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_open_banking_bancos_suportados_updated_at
  BEFORE UPDATE ON public.open_banking_bancos_suportados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 9. FUNCOES UTILITARIAS
-- =====================================================

-- Funcao para verificar se token esta expirado
CREATE OR REPLACE FUNCTION public.open_banking_token_expirado(integracao_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expira_em timestamptz;
BEGIN
  SELECT token_expires_at INTO expira_em
  FROM public.open_banking_integracoes
  WHERE id = integracao_uuid;

  RETURN expira_em IS NULL OR expira_em <= now() + interval '5 minutes';
END;
$$;

COMMENT ON FUNCTION public.open_banking_token_expirado IS 'Verifica se o token de uma integracao esta expirado ou prestes a expirar (5 minutos de margem)';

-- Funcao para verificar se consentimento esta expirado
CREATE OR REPLACE FUNCTION public.open_banking_consent_expirado(integracao_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expira_em timestamptz;
BEGIN
  SELECT consent_expires_at INTO expira_em
  FROM public.open_banking_integracoes
  WHERE id = integracao_uuid;

  RETURN expira_em IS NULL OR expira_em <= now();
END;
$$;

-- Funcao para registrar log
CREATE OR REPLACE FUNCTION public.open_banking_registrar_log(
  p_integracao_id uuid,
  p_user_id uuid,
  p_operacao varchar,
  p_status varchar,
  p_mensagem text DEFAULT NULL,
  p_detalhes jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.open_banking_logs (
    integracao_id,
    user_id,
    operacao,
    status,
    mensagem,
    detalhes
  ) VALUES (
    p_integracao_id,
    p_user_id,
    p_operacao,
    p_status,
    p_mensagem,
    p_detalhes
  );
END;
$$;

-- Funcao para mascarar numero da conta
CREATE OR REPLACE FUNCTION public.mascarar_conta(numero text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT '****' || RIGHT(numero, 4);
$$;

-- =====================================================
-- 10. VIEWS
-- =====================================================

-- View para extratos com dados da integracao (sem tokens)
CREATE OR REPLACE VIEW public.v_open_banking_extratos_completo AS
SELECT
  e.*,
  i.banco_codigo,
  i.banco_nome,
  i.agencia as integracao_agencia,
  i.conta_numero as integracao_conta
FROM public.open_banking_extratos e
JOIN public.open_banking_integracoes i ON i.id = e.integracao_id;

COMMENT ON VIEW public.v_open_banking_extratos_completo IS 'View de extratos com dados da integracao (tokens ocultos)';

-- View para resumo de conciliacao
CREATE OR REPLACE VIEW public.v_open_banking_conciliacao_resumo AS
SELECT
  integracao_id,
  COUNT(*) as total_transacoes,
  COUNT(*) FILTER (WHERE conciliado = true) as conciliadas,
  COUNT(*) FILTER (WHERE conciliado = false AND ignorado = false) as pendentes,
  COUNT(*) FILTER (WHERE ignorado = true) as ignoradas,
  SUM(valor) FILTER (WHERE tipo = 'entrada') as total_entradas,
  SUM(valor) FILTER (WHERE tipo = 'saida') as total_saidas
FROM public.open_banking_extratos
GROUP BY integracao_id;

-- =====================================================
-- 11. DADOS INICIAIS
-- =====================================================

-- Inserir bancos suportados (principais bancos brasileiros no Open Banking)
INSERT INTO public.open_banking_bancos_suportados
  (codigo, nome, nome_completo, api_base_url, auth_url, token_url, scopes_padrao)
VALUES
  ('001', 'Banco do Brasil', 'Banco do Brasil S.A.', 'https://openapi.bb.com.br', 'https://oauth.bb.com.br', 'https://oauth.bb.com.br', ARRAY['accounts', 'payments', 'invoices']),
  ('033', 'Santander', 'Banco Santander (Brasil) S.A.', 'https://openbanking.santander.com.br', 'https://oauth.santander.com.br', 'https://oauth.santander.com.br', ARRAY['accounts', 'payments']),
  ('104', 'Caixa Economica', 'Caixa Economica Federal', 'https://openbanking.caixa.gov.br', 'https://oauth.caixa.gov.br', 'https://oauth.caixa.gov.br', ARRAY['accounts', 'payments', 'invoices']),
  ('237', 'Bradesco', 'Banco Bradesco S.A.', 'https://openbanking.bradesco.com.br', 'https://oauth.bradesco.com.br', 'https://oauth.bradesco.com.br', ARRAY['accounts', 'payments']),
  ('341', 'Itau', 'Itau Unibanco S.A.', 'https://openbanking.itau.com.br', 'https://oauth.itau.com.br', 'https://oauth.itau.com.br', ARRAY['accounts', 'payments', 'invoices']),
  ('422', 'Safra', 'Banco Safra S.A.', 'https://openbanking.safra.com.br', 'https://oauth.safra.com.br', 'https://oauth.safra.com.br', ARRAY['accounts', 'payments']),
  ('623', 'Pan', 'Banco Pan S.A.', 'https://openbanking.bancopan.com.br', 'https://oauth.bancopan.com.br', 'https://oauth.bancopan.com.br', ARRAY['accounts']),
  ('655', 'Votorantim', 'Banco Votorantim S.A.', 'https://openbanking.bv.com.br', 'https://oauth.bv.com.br', 'https://oauth.bv.com.br', ARRAY['accounts', 'payments']),
  ('260', 'NuBank', 'NuBank', 'https://openbanking.nubank.com.br', 'https://oauth.nubank.com.br', 'https://oauth.nubank.com.br', ARRAY['accounts', 'payments']),
  ('077', 'Inter', 'Banco Inter', 'https://openbanking.bancointer.com.br', 'https://oauth.bancointer.com.br', 'https://oauth.bancointer.com.br', ARRAY['accounts', 'payments', 'invoices'])
ON CONFLICT (codigo) DO NOTHING;

-- =====================================================
-- 12. PERMISSOES ADICIONAIS
-- =====================================================

-- Grant para authenticated users (RLS controla o acesso)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.open_banking_integracoes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.open_banking_extratos TO authenticated;
GRANT SELECT ON public.open_banking_logs TO authenticated;
GRANT SELECT ON public.open_banking_bancos_suportados TO authenticated;

-- Grant para service role (Edge Functions)
GRANT ALL ON public.open_banking_integracoes TO service_role;
GRANT ALL ON public.open_banking_extratos TO service_role;
GRANT ALL ON public.open_banking_logs TO service_role;
GRANT ALL ON public.open_banking_bancos_suportados TO service_role;

-- Sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
