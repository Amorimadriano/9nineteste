-- ============================================================
-- 9nine Business Control Card — Enhanced Schema
-- Auditoria de Recebíveis de Cartão de Crédito
-- Cria todas as tabelas do zero (idempotente)
-- ============================================================

-- ============================================================
-- 1. TABELAS BASE (criar se não existem)
-- ============================================================

-- 1a. Alíquotas da Reforma Tributária
CREATE TABLE IF NOT EXISTS card_aliquotas_reforma (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ano integer NOT NULL UNIQUE,
  aliquota_cbs numeric(8,6) NOT NULL DEFAULT 0,
  aliquota_ibs numeric(8,6) NOT NULL DEFAULT 0,
  observacao text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 1b. Logs de auditoria
CREATE TABLE IF NOT EXISTS card_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  acao text NOT NULL,
  entidade text NOT NULL,
  entidade_id uuid,
  detalhes jsonb,
  created_at timestamptz DEFAULT now()
);

-- 1c. Simulações de Split Payment (antiga)
CREATE TABLE IF NOT EXISTS card_split_simulacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transacao_id uuid,
  valor_bruto numeric(15,2) NOT NULL DEFAULT 0,
  valor_mdr numeric(15,2) NOT NULL DEFAULT 0,
  valor_cbs numeric(15,2) NOT NULL DEFAULT 0,
  valor_ibs numeric(15,2) NOT NULL DEFAULT 0,
  valor_liquido_empresa numeric(15,2) NOT NULL DEFAULT 0,
  aliquota_cbs numeric(8,6) NOT NULL DEFAULT 0,
  aliquota_ibs numeric(8,6) NOT NULL DEFAULT 0,
  ano_referencia integer NOT NULL DEFAULT 2026,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 1d. Transações brutas (tabela principal)
CREATE TABLE IF NOT EXISTS card_transacoes_brutas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  banco_cartao_id uuid REFERENCES bancos_cartoes(id) ON DELETE SET NULL,
  adquirente text NOT NULL DEFAULT 'outras',
  bandeira text,
  nsu text,
  autorizacao text,
  data_venda date NOT NULL,
  data_prevista_recebimento date,
  data_recebimento date,
  tipo_transacao text NOT NULL DEFAULT 'credito_a_vista',
  parcelas integer NOT NULL DEFAULT 1,
  parcela_atual integer NOT NULL DEFAULT 1,
  valor_bruto numeric(15,2) NOT NULL DEFAULT 0,
  taxa_mdr numeric(8,6) NOT NULL DEFAULT 0,
  valor_taxa numeric(15,2) NOT NULL DEFAULT 0,
  valor_liquido numeric(15,2) NOT NULL DEFAULT 0,
  status_auditoria text NOT NULL DEFAULT 'pendente',
  conciliado boolean NOT NULL DEFAULT false,
  arquivo_origem text,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- FK da split_simulacoes para transacoes (apenas se ambas existem agora)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'card_split_simulacoes_transacao_id_fkey'
    AND table_name = 'card_split_simulacoes'
  ) THEN
    ALTER TABLE card_split_simulacoes
      ADD CONSTRAINT card_split_simulacoes_transacao_id_fkey
      FOREIGN KEY (transacao_id) REFERENCES card_transacoes_brutas(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 2. ADICIONAR COLUNAS NOVAS à card_transacoes_brutas
-- ============================================================

DO $$
BEGIN
  -- tipo_arquivo
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'card_transacoes_brutas' AND column_name = 'tipo_arquivo'
  ) THEN
    ALTER TABLE card_transacoes_brutas ADD COLUMN tipo_arquivo text DEFAULT 'csv';
  END IF;

  -- empresa_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'card_transacoes_brutas' AND column_name = 'empresa_id'
  ) THEN
    ALTER TABLE card_transacoes_brutas ADD COLUMN empresa_id uuid;
  END IF;

  -- valor_extrato_bancario (para conciliação bancária)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'card_transacoes_brutas' AND column_name = 'valor_extrato_bancario'
  ) THEN
    ALTER TABLE card_transacoes_brutas ADD COLUMN valor_extrato_bancario numeric(15,2);
  END IF;

  -- data_conciliacao
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'card_transacoes_brutas' AND column_name = 'data_conciliacao'
  ) THEN
    ALTER TABLE card_transacoes_brutas ADD COLUMN data_conciliacao timestamptz;
  END IF;

  -- score_conciliacao (matching automático)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'card_transacoes_brutas' AND column_name = 'score_conciliacao'
  ) THEN
    ALTER TABLE card_transacoes_brutas ADD COLUMN score_conciliacao numeric(5,2);
  END IF;
END $$;

-- FK empresa_id → empresa (apenas se a coluna foi criada e FK não existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'card_transacoes_brutas' AND column_name = 'empresa_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'card_transacoes_brutas_empresa_id_fkey'
    AND table_name = 'card_transacoes_brutas'
  ) THEN
    ALTER TABLE card_transacoes_brutas
      ADD CONSTRAINT card_transacoes_brutas_empresa_id_fkey
      FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 3. TABELAS NOVAS
-- ============================================================

-- 3a. Configurações de relatórios
CREATE TABLE IF NOT EXISTS card_report_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  empresa_id uuid REFERENCES empresa(id) ON DELETE CASCADE,
  nome_relatorio text NOT NULL,
  tipo_relatorio text NOT NULL DEFAULT 'mensal',
  incluir_graficos boolean DEFAULT true,
  incluir_detalhamento_parcelas boolean DEFAULT false,
  periodo_padrao_dias integer DEFAULT 30,
  logo_empresa boolean DEFAULT true,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now(),
  UNIQUE(user_id, nome_relatorio)
);

-- 3b. Importações (rastreabilidade)
CREATE TABLE IF NOT EXISTS card_importacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  empresa_id uuid REFERENCES empresa(id) ON DELETE CASCADE,
  adquirente text NOT NULL,
  tipo_arquivo text NOT NULL DEFAULT 'csv',
  nome_arquivo text NOT NULL,
  tamanho_arquivo integer,
  total_linhas integer DEFAULT 0,
  total_importadas integer DEFAULT 0,
  total_erros integer DEFAULT 0,
  erros jsonb DEFAULT '[]',
  status text DEFAULT 'processando',
  processado_em timestamptz,
  criado_em timestamptz DEFAULT now()
);

-- 3c. Simulações salvas de Split Payment
CREATE TABLE IF NOT EXISTS card_simulacoes_salvas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  empresa_id uuid REFERENCES empresa(id) ON DELETE CASCADE,
  nome text NOT NULL,
  valor_bruto numeric(15,2) NOT NULL,
  taxa_mdr numeric(8,6) NOT NULL,
  aliquota_cbs numeric(8,6) NOT NULL,
  aliquota_ibs numeric(8,6) NOT NULL,
  ano_referencia integer NOT NULL,
  valor_mdr numeric(15,2),
  valor_cbs numeric(15,2),
  valor_ibs numeric(15,2),
  valor_liquido numeric(15,2),
  observacoes text,
  criado_em timestamptz DEFAULT now()
);

-- 3d. Relatórios gerados (histórico)
CREATE TABLE IF NOT EXISTS card_relatorios_gerados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  empresa_id uuid REFERENCES empresa(id) ON DELETE CASCADE,
  tipo_relatorio text NOT NULL,
  periodo_inicio date NOT NULL,
  periodo_fim date NOT NULL,
  filtros jsonb DEFAULT '{}',
  total_transacoes integer DEFAULT 0,
  total_bruto numeric(15,2) DEFAULT 0,
  total_liquido numeric(15,2) DEFAULT 0,
  total_divergencias integer DEFAULT 0,
  nome_arquivo text,
  tamanho_bytes integer,
  criado_em timestamptz DEFAULT now()
);

-- 3e. Cache de dashboard (performance)
CREATE TABLE IF NOT EXISTS card_dashboard_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  empresa_id uuid REFERENCES empresa(id) ON DELETE CASCADE,
  total_bruto numeric(15,2) DEFAULT 0,
  total_liquido numeric(15,2) DEFAULT 0,
  total_taxas numeric(15,2) DEFAULT 0,
  total_transacoes integer DEFAULT 0,
  pendentes integer DEFAULT 0,
  conferidas integer DEFAULT 0,
  divergentes integer DEFAULT 0,
  chargebacks integer DEFAULT 0,
  por_adquirente jsonb DEFAULT '{}',
  por_bandeira jsonb DEFAULT '{}',
  split_cbs numeric(15,2) DEFAULT 0,
  split_ibs numeric(15,2) DEFAULT 0,
  split_liquido_projetado numeric(15,2) DEFAULT 0,
  cashflow_previsto jsonb DEFAULT '[]',
  atualizado_em timestamptz DEFAULT now()
);

-- ============================================================
-- 4. RLS (Row Level Security) — Obrigatório para LGPD
-- ============================================================

-- Tabelas base
ALTER TABLE card_transacoes_brutas ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_split_simulacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_aliquotas_reforma ENABLE ROW LEVEL SECURITY;

-- Tabelas novas
ALTER TABLE card_report_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_importacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_simulacoes_salvas ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_relatorios_gerados ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_dashboard_cache ENABLE ROW LEVEL SECURITY;

-- Políticas — tabelas base
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'card_transacoes_brutas_user_policy') THEN
    CREATE POLICY card_transacoes_brutas_user_policy ON card_transacoes_brutas
      FOR ALL USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'card_audit_logs_user_policy') THEN
    CREATE POLICY card_audit_logs_user_policy ON card_audit_logs
      FOR ALL USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'card_split_simulacoes_user_policy') THEN
    CREATE POLICY card_split_simulacoes_user_policy ON card_split_simulacoes
      FOR ALL USING (user_id = auth.uid());
  END IF;

  -- Alíquotas são leitura para todos (dados de referência)
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'card_aliquotas_reforma_read_policy') THEN
    CREATE POLICY card_aliquotas_reforma_read_policy ON card_aliquotas_reforma
      FOR SELECT USING (true);
  END IF;
END $$;

-- Políticas — tabelas novas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'card_report_config_user_policy') THEN
    CREATE POLICY card_report_config_user_policy ON card_report_config
      FOR ALL USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'card_importacoes_user_policy') THEN
    CREATE POLICY card_importacoes_user_policy ON card_importacoes
      FOR ALL USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'card_simulacoes_salvas_user_policy') THEN
    CREATE POLICY card_simulacoes_salvas_user_policy ON card_simulacoes_salvas
      FOR ALL USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'card_relatorios_gerados_user_policy') THEN
    CREATE POLICY card_relatorios_gerados_user_policy ON card_relatorios_gerados
      FOR ALL USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'card_dashboard_cache_user_policy') THEN
    CREATE POLICY card_dashboard_cache_user_policy ON card_dashboard_cache
      FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- 5. ÍNDICES PARA PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_card_transacoes_user ON card_transacoes_brutas(user_id);
CREATE INDEX IF NOT EXISTS idx_card_transacoes_status ON card_transacoes_brutas(status_auditoria);
CREATE INDEX IF NOT EXISTS idx_card_transacoes_adquirente ON card_transacoes_brutas(adquirente);
CREATE INDEX IF NOT EXISTS idx_card_transacoes_data ON card_transacoes_brutas(data_venda DESC);
CREATE INDEX IF NOT EXISTS idx_card_transacoes_nsu ON card_transacoes_brutas(nsu);
CREATE INDEX IF NOT EXISTS idx_card_importacoes_user ON card_importacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_card_relatorios_user ON card_relatorios_gerados(user_id);
CREATE INDEX IF NOT EXISTS idx_card_audit_logs_user ON card_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_card_dashboard_cache_user ON card_dashboard_cache(user_id);

-- ============================================================
-- 6. FUNÇÕES AUXILIARES
-- ============================================================

CREATE OR REPLACE FUNCTION refresh_card_dashboard(p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_empresa_id uuid;
  v_ano_atual int := extract(year from now());
  v_aliquota_cbs numeric;
  v_aliquota_ibs numeric;
BEGIN
  SELECT empresa_id INTO v_empresa_id FROM card_transacoes_brutas
    WHERE user_id = p_user_id LIMIT 1;

  SELECT aliquota_cbs, aliquota_ibs INTO v_aliquota_cbs, v_aliquota_ibs
    FROM card_aliquotas_reforma
    WHERE ano = v_ano_atual
    LIMIT 1;

  IF v_aliquota_cbs IS NULL THEN
    v_aliquota_cbs := 0;
    v_aliquota_ibs := 0;
  END IF;

  INSERT INTO card_dashboard_cache (
    user_id, empresa_id,
    total_bruto, total_liquido, total_taxas, total_transacoes,
    pendentes, conferidas, divergentes, chargebacks,
    split_cbs, split_ibs, split_liquido_projetado,
    atualizado_em
  )
  SELECT
    p_user_id, v_empresa_id,
    COALESCE(SUM(valor_bruto), 0),
    COALESCE(SUM(valor_liquido), 0),
    COALESCE(SUM(valor_taxa), 0),
    COUNT(*),
    COUNT(*) FILTER (WHERE status_auditoria = 'pendente'),
    COUNT(*) FILTER (WHERE status_auditoria = 'ok'),
    COUNT(*) FILTER (WHERE status_auditoria = 'divergente'),
    COUNT(*) FILTER (WHERE status_auditoria = 'chargeback'),
    COALESCE(SUM(valor_bruto * v_aliquota_cbs), 0),
    COALESCE(SUM(valor_bruto * v_aliquota_ibs), 0),
    COALESCE(SUM(valor_bruto - valor_bruto * taxa_mdr - valor_bruto * v_aliquota_cbs - valor_bruto * v_aliquota_ibs), 0),
    now()
  FROM card_transacoes_brutas
  WHERE user_id = p_user_id
  ON CONFLICT (user_id) DO UPDATE SET
    total_bruto = EXCLUDED.total_bruto,
    total_liquido = EXCLUDED.total_liquido,
    total_taxas = EXCLUDED.total_taxas,
    total_transacoes = EXCLUDED.total_transacoes,
    pendentes = EXCLUDED.pendentes,
    conferidas = EXCLUDED.conferidas,
    divergentes = EXCLUDED.divergentes,
    chargebacks = EXCLUDED.chargebacks,
    split_cbs = EXCLUDED.split_cbs,
    split_ibs = EXCLUDED.split_ibs,
    split_liquido_projetado = EXCLUDED.split_liquido_projetado,
    atualizado_em = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para cache automático
CREATE OR REPLACE FUNCTION trg_refresh_card_dashboard()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    PERFORM refresh_card_dashboard(COALESCE(NEW.user_id, OLD.user_id));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS card_transacoes_brutas_cache_trigger ON card_transacoes_brutas;
CREATE TRIGGER card_transacoes_brutas_cache_trigger
  AFTER INSERT OR UPDATE OR DELETE ON card_transacoes_brutas
  FOR EACH ROW EXECUTE FUNCTION trg_refresh_card_dashboard();

-- ============================================================
-- 7. SEED: Alíquotas da Reforma Tributária EC 132/2023
-- ============================================================

INSERT INTO card_aliquotas_reforma (ano, aliquota_cbs, aliquota_ibs, observacao)
VALUES
  (2026, 0.01, 0.01, 'Fase piloto — alíquota simbólica (1% CBS + 1% IBS)'),
  (2027, 0.0150, 0.0150, 'Início da transição gradual (1.5% cada)'),
  (2028, 0.0250, 0.0250, '2.5% cada — aceleração da transição'),
  (2029, 0.0350, 0.0350, '3.5% cada'),
  (2030, 0.0450, 0.0450, '4.5% cada'),
  (2031, 0.0550, 0.0550, '5.5% cada'),
  (2032, 0.0650, 0.0650, '6.5% cada — fase final'),
  (2033, 0.0738, 0.0738, 'Alíquota plena (~7.38% CBS + 7.38% IBS = 14.76% total)')
ON CONFLICT (ano) DO UPDATE SET
  aliquota_cbs = EXCLUDED.aliquota_cbs,
  aliquota_ibs = EXCLUDED.aliquota_ibs,
  observacao = EXCLUDED.observacao;