-- Migration: Automação da Régua de Cobrança
-- Agente: @agente-supabase
-- Objetivo: Performance e triggers de automação

-- ============================================
-- ÍNDICES DE PERFORMANCE
-- ============================================

-- Índices para contas a receber
CREATE INDEX IF NOT EXISTS idx_contas_receber_status ON contas_receber(status);
CREATE INDEX IF NOT EXISTS idx_contas_receber_data_vencimento ON contas_receber(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_receber_cliente_id ON contas_receber(cliente_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_status_vencimento ON contas_receber(status, data_vencimento)
  WHERE status IN ('pendente', 'vencido');

-- Índices para histórico de cobrança
CREATE INDEX IF NOT EXISTS idx_cobranca_historico_conta ON cobranca_historico(conta_receber_id);
CREATE INDEX IF NOT EXISTS idx_cobranca_historico_data ON cobranca_historico(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cobranca_historico_tipo ON cobranca_historico(tipo);

-- ============================================
-- FUNÇÕES DE AUTOMAÇÃO
-- ============================================

-- Função: Buscar contas que precisam de ação de cobrança
CREATE OR REPLACE FUNCTION get_contas_cobranca_pendentes(
  p_user_id UUID,
  p_dias_atraso_min INT DEFAULT 0,
  p_dias_atraso_max INT DEFAULT 365
)
RETURNS TABLE (
  conta_id UUID,
  cliente_nome TEXT,
  cliente_email TEXT,
  valor NUMERIC,
  data_vencimento DATE,
  dias_atraso INT,
  tipo_sugerido TEXT,
  prioridade INT,
  score_cliente INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cr.id as conta_id,
    c.nome as cliente_nome,
    c.email as cliente_email,
    cr.valor,
    cr.data_vencimento,
    GREATEST(0, CURRENT_DATE - cr.data_vencimento)::INT as dias_atraso,
    CASE
      WHEN cr.data_vencimento > CURRENT_DATE THEN 'lembrete'
      WHEN cr.data_vencimento = CURRENT_DATE THEN 'lembrete'
      WHEN CURRENT_DATE - cr.data_vencimento <= 5 THEN 'cobranca'
      WHEN CURRENT_DATE - cr.data_vencimento <= 15 THEN 'urgente'
      ELSE 'bloqueio'
    END::TEXT as tipo_sugerido,
    CASE
      WHEN cr.data_vencimento > CURRENT_DATE THEN 1
      WHEN cr.data_vencimento = CURRENT_DATE THEN 2
      WHEN CURRENT_DATE - cr.data_vencimento <= 5 THEN 3
      WHEN CURRENT_DATE - cr.data_vencimento <= 15 THEN 4
      ELSE 5
    END::INT as prioridade,
    COALESCE(
      (SELECT
        CASE
          WHEN COUNT(*) FILTER (WHERE status = 'recebido')::NUMERIC / NULLIF(COUNT(*), 0) * 100 > 80 THEN 80
          WHEN COUNT(*) FILTER (WHERE status = 'recebido')::NUMERIC / NULLIF(COUNT(*), 0) * 100 > 50 THEN 50
          ELSE 20
        END::INT
      FROM contas_receber cr2
      WHERE cr2.cliente_id = cr.cliente_id
    ), 50)::INT as score_cliente
  FROM contas_receber cr
  JOIN clientes c ON c.id = cr.cliente_id
  WHERE cr.user_id = p_user_id
    AND cr.status IN ('pendente', 'vencido')
    AND cr.data_vencimento >= CURRENT_DATE - p_dias_atraso_max
    AND cr.data_vencimento <= CURRENT_DATE + 7
    AND NOT EXISTS (
      SELECT 1 FROM cobranca_historico ch
      WHERE ch.conta_receber_id = cr.id
        AND ch.created_at > CURRENT_DATE - INTERVAL '3 days'
        AND ch.tipo IN ('lembrete', 'cobranca', 'urgente', 'bloqueio')
    )
  ORDER BY prioridade DESC, cr.data_vencimento ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: Calcular estatísticas de cobrança
CREATE OR REPLACE FUNCTION get_regua_cobranca_stats(
  p_user_id UUID,
  p_data_inicio DATE DEFAULT NULL,
  p_data_fim DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  IF p_data_inicio IS NULL THEN
    p_data_inicio := CURRENT_DATE - INTERVAL '30 days';
  END IF;
  IF p_data_fim IS NULL THEN
    p_data_fim := CURRENT_DATE;
  END IF;

  SELECT json_build_object(
    'total_devedores', COUNT(DISTINCT cr.cliente_id),
    'valor_vencido', COALESCE(SUM(cr.valor) FILTER (WHERE cr.status = 'vencido'), 0),
    'valor_pendente', COALESCE(SUM(cr.valor) FILTER (WHERE cr.status = 'pendente'), 0),
    'contas_vencidas', COUNT(*) FILTER (WHERE cr.status = 'vencido'),
    'contas_pendentes', COUNT(*) FILTER (WHERE cr.status = 'pendente'),
    'taxa_recuperacao', ROUND(
      COUNT(*) FILTER (WHERE cr.status = 'recebido')::NUMERIC /
      NULLIF(COUNT(*) FILTER (WHERE cr.status IN ('recebido', 'vencido', 'pendente')), 0) * 100,
      2
    ),
    'cobrancas_enviadas', (
      SELECT COUNT(*) FROM cobranca_historico ch
      WHERE ch.user_id = p_user_id
        AND ch.created_at BETWEEN p_data_inicio AND p_data_fim
    ),
    'cobrancas_respondidas', (
      SELECT COUNT(*) FROM cobranca_historico ch
      WHERE ch.user_id = p_user_id
        AND ch.created_at BETWEEN p_data_inicio AND p_data_fim
        AND ch.status = 'respondido'
    ),
    'inadimplentes_criticos', (
      SELECT COUNT(DISTINCT cr2.cliente_id)
      FROM contas_receber cr2
      WHERE cr2.user_id = p_user_id
        AND cr2.status = 'vencido'
        AND cr2.data_vencimento < CURRENT_DATE - INTERVAL '30 days'
    ),
    'por_faixa_atraso', json_build_object(
      'ate_5_dias', COUNT(*) FILTER (WHERE cr.status = 'vencido' AND CURRENT_DATE - cr.data_vencimento <= 5),
      '6_a_15_dias', COUNT(*) FILTER (WHERE cr.status = 'vencido' AND CURRENT_DATE - cr.data_vencimento BETWEEN 6 AND 15),
      '16_a_30_dias', COUNT(*) FILTER (WHERE cr.status = 'vencido' AND CURRENT_DATE - cr.data_vencimento BETWEEN 16 AND 30),
      'mais_30_dias', COUNT(*) FILTER (WHERE cr.status = 'vencido' AND CURRENT_DATE - cr.data_vencimento > 30)
    ),
    'por_canal', (
      SELECT json_agg(json_build_object(
        'canal', canal,
        'total', COUNT(*),
        'sucesso', COUNT(*) FILTER (WHERE status = 'respondido')
      ))
      FROM cobranca_historico ch
      WHERE ch.user_id = p_user_id
        AND ch.created_at BETWEEN p_data_inicio AND p_data_fim
      GROUP BY canal
    )
  ) INTO v_result
  FROM contas_receber cr
  WHERE cr.user_id = p_user_id
    AND cr.data_vencimento BETWEEN p_data_inicio AND p_data_fim + INTERVAL '30 days';

  RETURN COALESCE(v_result, '{}'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: Gerar mensagem de cobrança personalizada
CREATE OR REPLACE FUNCTION gerar_mensagem_cobranca(
  p_cliente_nome TEXT,
  p_valor NUMERIC,
  p_data_vencimento DATE,
  p_dias_atraso INT,
  p_tipo TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_mensagem TEXT;
  v_valor_fmt TEXT;
  v_data_fmt TEXT;
BEGIN
  v_valor_fmt := 'R$ ' || TO_CHAR(p_valor, 'FM999G999G999D99');
  v_data_fmt := TO_CHAR(p_data_vencimento, 'DD/MM/YYYY');

  CASE p_tipo
    WHEN 'lembrete' THEN
      IF p_dias_atraso < 0 THEN
        v_mensagem := format(
          'Olá %s, seu pagamento de %s vence em %s dia(s) (%s). Evite multas e mantenha seu crédito em dia!',
          p_cliente_nome, v_valor_fmt, ABS(p_dias_atraso), v_data_fmt
        );
      ELSE
        v_mensagem := format(
          'Olá %s, seu pagamento de %s vence hoje (%s). Regularize agora e evite multas!',
          p_cliente_nome, v_valor_fmt, v_data_fmt
        );
      END IF;

    WHEN 'cobranca' THEN
      v_mensagem := format(
        'Prezado %s, identificamos que sua fatura de %s, vencida em %s, está em atraso há %s dia(s). Solicitamos a regularização para evitar bloqueio.',
        p_cliente_nome, v_valor_fmt, v_data_fmt, p_dias_atraso
      );

    WHEN 'urgente' THEN
      v_mensagem := format(
        'URGENTE: %s, sua dívida de %s (venc. %s) está em atraso há %s dias. Entre em contato imediatamente para negociar e evitar protesto.',
        p_cliente_nome, v_valor_fmt, v_data_fmt, p_dias_atraso
      );

    WHEN 'bloqueio' THEN
      v_mensagem := format(
        '%s, seu cadastro será bloqueado devido à dívida de %s em atraso há %s dias. Entre em contato URGENTE para regularização.',
        p_cliente_nome, v_valor_fmt, p_dias_atraso
      );

    ELSE
      v_mensagem := format('Prezado %s, regularize seu pagamento de %s.', p_cliente_nome, v_valor_fmt);
  END CASE;

  RETURN v_mensagem;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- TRIGGER: Atualizar status automático
-- ============================================

CREATE OR REPLACE FUNCTION atualizar_status_conta_receber()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar status para vencido se passou a data e ainda está pendente
  IF NEW.status = 'pendente' AND NEW.data_vencimento < CURRENT_DATE THEN
    NEW.status := 'vencido';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_atualizar_status_contas_receber ON contas_receber;
CREATE TRIGGER trigger_atualizar_status_contas_receber
  BEFORE UPDATE ON contas_receber
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_status_conta_receber();

-- ============================================
-- TABELA: Configurações de automação
-- ============================================

CREATE TABLE IF NOT EXISTS regua_cobranca_automacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID,

  -- Regras de automação
  enviar_lembretes BOOLEAN DEFAULT true,
  dias_antes_lembrete_1 INT DEFAULT 3,
  dias_antes_lembrete_2 INT DEFAULT 1,
  enviar_dia_vencimento BOOLEAN DEFAULT true,

  -- Escalonamento
  dias_apos_cobranca_1 INT DEFAULT 3,
  dias_apos_cobranca_2 INT DEFAULT 7,
  dias_apos_cobranca_3 INT DEFAULT 15,
  dias_bloqueio INT DEFAULT 30,

  -- Canais
  canal_padrao TEXT DEFAULT 'email',
  usar_whatsapp BOOLEAN DEFAULT false,
  usar_sms BOOLEAN DEFAULT false,

  -- Horários
  horario_envio_inicio TIME DEFAULT '08:00',
  horario_envio_fim TIME DEFAULT '18:00',
  dias_semana_envio INT[] DEFAULT ARRAY[1,2,3,4,5], -- Segunda a Sexta

  -- Mensagens
  mensagem_lembrete TEXT DEFAULT 'Olá {cliente}, seu pagamento de {valor} vence em {dias} dia(s).',
  mensagem_vencimento TEXT DEFAULT 'Olá {cliente}, seu pagamento de {valor} vence hoje!',
  mensagem_cobranca TEXT DEFAULT 'Prezado {cliente}, sua fatura de {valor} venceu há {dias} dias. Regularize agora.',
  mensagem_urgente TEXT DEFAULT 'URGENTE: {cliente}, dívida de {valor} em atraso há {dias} dias. Entre em contato!',

  -- Ativação
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, empresa_id)
);

-- RLS para tabela de automação
ALTER TABLE regua_cobranca_automacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own automacao config" ON regua_cobranca_automacao;
CREATE POLICY "Users can manage their own automacao config"
ON regua_cobranca_automacao
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Índices
CREATE INDEX IF NOT EXISTS idx_regua_automacao_user ON regua_cobranca_automacao(user_id);

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON FUNCTION get_contas_cobranca_pendentes IS
  'Retorna contas que precisam de cobrança com score e prioridade. Agente: @agente-supabase';

COMMENT ON FUNCTION get_regua_cobranca_stats IS
  'Estatísticas de performance da régua de cobrança. Agente: @agente-supabase';

COMMENT ON FUNCTION gerar_mensagem_cobranca IS
  'Gera mensagem personalizada de cobrança. Agente: @agente-supabase';

COMMENT ON TABLE regua_cobranca_automacao IS
  'Configurações de automação da régua de cobrança. Agente: @agente-supabase';
