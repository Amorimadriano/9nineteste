
-- =========================================================
-- 9nine Business Control Card - Módulo de Auditoria de Cartões
-- =========================================================

-- 1. Transações brutas importadas das adquirentes
CREATE TABLE public.card_transacoes_brutas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  banco_cartao_id UUID REFERENCES public.bancos_cartoes(id) ON DELETE SET NULL,
  adquirente TEXT NOT NULL DEFAULT 'outras',
  bandeira TEXT,
  nsu TEXT,
  autorizacao TEXT,
  data_venda DATE NOT NULL,
  data_prevista_recebimento DATE,
  data_recebimento DATE,
  tipo_transacao TEXT NOT NULL DEFAULT 'credito',
  parcelas INTEGER NOT NULL DEFAULT 1,
  parcela_atual INTEGER NOT NULL DEFAULT 1,
  valor_bruto NUMERIC(14,2) NOT NULL DEFAULT 0,
  taxa_mdr NUMERIC(7,4) NOT NULL DEFAULT 0,
  valor_taxa NUMERIC(14,2) NOT NULL DEFAULT 0,
  valor_liquido NUMERIC(14,2) NOT NULL DEFAULT 0,
  status_auditoria TEXT NOT NULL DEFAULT 'pendente',
  conciliado BOOLEAN NOT NULL DEFAULT false,
  arquivo_origem TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_card_trans_user ON public.card_transacoes_brutas(user_id);
CREATE INDEX idx_card_trans_data ON public.card_transacoes_brutas(data_venda);
CREATE INDEX idx_card_trans_nsu ON public.card_transacoes_brutas(nsu);

ALTER TABLE public.card_transacoes_brutas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "card_trans_select_own" ON public.card_transacoes_brutas
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "card_trans_insert_own" ON public.card_transacoes_brutas
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "card_trans_update_own" ON public.card_transacoes_brutas
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "card_trans_delete_own" ON public.card_transacoes_brutas
  FOR DELETE USING (auth.uid() = user_id);

-- 2. Simulações de Split Payment (IBS/CBS)
CREATE TABLE public.card_split_simulacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  transacao_id UUID REFERENCES public.card_transacoes_brutas(id) ON DELETE CASCADE,
  ano_referencia INTEGER NOT NULL,
  valor_bruto NUMERIC(14,2) NOT NULL DEFAULT 0,
  aliquota_cbs NUMERIC(7,4) NOT NULL DEFAULT 0,
  aliquota_ibs NUMERIC(7,4) NOT NULL DEFAULT 0,
  valor_cbs NUMERIC(14,2) NOT NULL DEFAULT 0,
  valor_ibs NUMERIC(14,2) NOT NULL DEFAULT 0,
  valor_mdr NUMERIC(14,2) NOT NULL DEFAULT 0,
  valor_liquido_empresa NUMERIC(14,2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_card_split_user ON public.card_split_simulacoes(user_id);
CREATE INDEX idx_card_split_trans ON public.card_split_simulacoes(transacao_id);

ALTER TABLE public.card_split_simulacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "card_split_select_own" ON public.card_split_simulacoes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "card_split_insert_own" ON public.card_split_simulacoes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "card_split_update_own" ON public.card_split_simulacoes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "card_split_delete_own" ON public.card_split_simulacoes
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Alíquotas oficiais da Reforma Tributária (EC 132/2023)
CREATE TABLE public.card_aliquotas_reforma (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ano INTEGER NOT NULL UNIQUE,
  aliquota_cbs NUMERIC(7,4) NOT NULL DEFAULT 0,
  aliquota_ibs NUMERIC(7,4) NOT NULL DEFAULT 0,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.card_aliquotas_reforma ENABLE ROW LEVEL SECURITY;

CREATE POLICY "card_aliq_select_all_authed" ON public.card_aliquotas_reforma
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "card_aliq_admin_insert" ON public.card_aliquotas_reforma
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "card_aliq_admin_update" ON public.card_aliquotas_reforma
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "card_aliq_admin_delete" ON public.card_aliquotas_reforma
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Pré-popular cronograma EC 132/2023 (valores oficiais de transição)
INSERT INTO public.card_aliquotas_reforma (ano, aliquota_cbs, aliquota_ibs, observacao) VALUES
  (2026, 0.0090, 0.0010, 'Ano teste - CBS 0,9% e IBS 0,1%'),
  (2027, 0.0880, 0.0010, 'CBS plena, IBS ainda em teste'),
  (2028, 0.0880, 0.0010, 'CBS plena, IBS ainda em teste'),
  (2029, 0.0792, 0.0220, 'Transição: 90% CBS + 10% IBS'),
  (2030, 0.0704, 0.0440, 'Transição: 80% CBS + 20% IBS'),
  (2031, 0.0616, 0.0660, 'Transição: 70% CBS + 30% IBS'),
  (2032, 0.0528, 0.0880, 'Transição: 60% CBS + 40% IBS'),
  (2033, 0.0880, 0.1770, 'Implantação plena IBS/CBS');

-- 4. Logs de auditoria do módulo (LGPD)
CREATE TABLE public.card_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  acao TEXT NOT NULL,
  entidade TEXT NOT NULL,
  entidade_id UUID,
  detalhes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_card_audit_user ON public.card_audit_logs(user_id);
CREATE INDEX idx_card_audit_data ON public.card_audit_logs(created_at DESC);

ALTER TABLE public.card_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "card_audit_select_own" ON public.card_audit_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "card_audit_insert_own" ON public.card_audit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Triggers de updated_at
CREATE TRIGGER trg_card_trans_updated
  BEFORE UPDATE ON public.card_transacoes_brutas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_card_split_updated
  BEFORE UPDATE ON public.card_split_simulacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_card_aliq_updated
  BEFORE UPDATE ON public.card_aliquotas_reforma
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
