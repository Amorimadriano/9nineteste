-- ============================================================================
-- MIGRATION: APIs de Contabilidade (ERP Contabeis)
-- TASK: #33 - APIs Contabilidade - Arquitetura e Banco
-- DATA: 2026-04-16
-- AGENTES: @agente-supabase + @agente-seguranca
-- DESCRICAO: Arquitetura de banco para integracao com ERPs contabeis
-- ============================================================================

-- =============================================================================
-- 1. ENUMS
-- =============================================================================

-- Tipo de ERP suportado
CREATE TYPE erp_tipo AS ENUM (
    'totvs_protheus',
    'sankhya',
    'dominio',
    'alterdata',
    'contabilista',
    'outro'
);

-- Ambiente de operacao
CREATE TYPE erp_ambiente AS ENUM (
    'producao',
    'homologacao'
);

-- Status de conexao com ERP
CREATE TYPE erp_status_conexao AS ENUM (
    'conectado',
    'desconectado',
    'erro'
);

-- Tipo de lancamento contabil
CREATE TYPE tipo_lancamento_contabil AS ENUM (
    'receita',
    'despesa',
    'transferencia',
    'imposto',
    'folha'
);

-- Tipo de operacao de sincronizacao
CREATE TYPE tipo_operacao_sinc AS ENUM (
    'exportar_contas_pagar',
    'exportar_contas_receber',
    'exportar_caixa',
    'importar_lancamentos',
    'importar_saldo',
    'conciliar'
);

-- Status de operacao de sincronizacao
CREATE TYPE status_sincronizacao AS ENUM (
    'pendente',
    'processando',
    'sucesso',
    'parcial',
    'erro'
);

-- Tipo de debito/credito
CREATE TYPE tipo_debito_credito AS ENUM (
    'debito',
    'credito'
);

-- =============================================================================
-- 2. TABELA: contabilidade_erp_config
-- =============================================================================

CREATE TABLE public.contabilidade_erp_config (
    -- Identificacao
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Configuracao basica
    erp_tipo erp_tipo NOT NULL,
    nome_configuracao VARCHAR(100) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    ambiente erp_ambiente NOT NULL DEFAULT 'homologacao',

    -- Credenciais de API (encrypted storage)
    api_url TEXT,
    api_key BYTEA,                    -- Encrypted
    api_secret BYTEA,                 -- Encrypted
    usuario VARCHAR(100),
    senha BYTEA,                      -- Encrypted
    token_acesso BYTEA,               -- Encrypted
    token_refresh BYTEA,              -- Encrypted
    token_expira_em TIMESTAMPTZ,

    -- Configuracoes especificas por ERP
    codigo_empresa_erp VARCHAR(50),    -- Codigo da empresa no ERP
    codigo_filial VARCHAR(50),         -- Codigo da filial no ERP
    configuracoes_extras JSONB DEFAULT '{}'::jsonb, -- Campos dinamicos por ERP

    -- Metadados de sincronizacao
    ultima_sincronizacao TIMESTAMPTZ,
    status_conexao erp_status_conexao DEFAULT 'desconectado',
    error_log JSONB,                   -- Log de erros da ultima tentativa

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comentarios
COMMENT ON TABLE public.contabilidade_erp_config IS 'Configuracoes de integracao com ERPs contabeis';
COMMENT ON COLUMN public.contabilidade_erp_config.api_key IS 'Chave de API criptografada (pgsodium)';
COMMENT ON COLUMN public.contabilidade_erp_config.api_secret IS 'Secret de API criptografado (pgsodium)';
COMMENT ON COLUMN public.contabilidade_erp_config.senha IS 'Senha criptografada (pgsodium)';
COMMENT ON COLUMN public.contabilidade_erp_config.token_acesso IS 'Token OAuth criptografado (pgsodium)';
COMMENT ON COLUMN public.contabilidade_erp_config.token_refresh IS 'Refresh token criptografado (pgsodium)';

-- Trigger para updated_at
CREATE TRIGGER update_contabilidade_erp_config_updated_at
    BEFORE UPDATE ON public.contabilidade_erp_config
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Indices
CREATE INDEX idx_contabilidade_erp_config_user ON public.contabilidade_erp_config(user_id);
CREATE INDEX idx_contabilidade_erp_config_tipo ON public.contabilidade_erp_config(erp_tipo);
CREATE INDEX idx_contabilidade_erp_config_ativo ON public.contabilidade_erp_config(ativo);
CREATE INDEX idx_contabilidade_erp_config_status ON public.contabilidade_erp_config(status_conexao);

-- =============================================================================
-- 3. TABELA: contabilidade_mapeamento_contas
-- =============================================================================

CREATE TABLE public.contabilidade_mapeamento_contas (
    -- Identificacao
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    config_id UUID NOT NULL REFERENCES public.contabilidade_erp_config(id) ON DELETE CASCADE,

    -- Mapeamento
    tipo_lancamento tipo_lancamento_contabil NOT NULL,
    categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
    conta_contabil_erp VARCHAR(50) NOT NULL,  -- Codigo da conta no ERP (ex: "1.1.01")
    historico_padrao TEXT,                    -- Historico padrao para o lancamento
    centro_custo_erp VARCHAR(50),               -- Centro de custo no ERP (opcional)

    -- Status
    ativo BOOLEAN NOT NULL DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comentarios
COMMENT ON TABLE public.contabilidade_mapeamento_contas IS 'Mapeamento entre categorias do sistema e contas contabeis do ERP';
COMMENT ON COLUMN public.contabilidade_mapeamento_contas.conta_contabil_erp IS 'Codigo da conta contabil no ERP (ex: 1.1.01.001)';
COMMENT ON COLUMN public.contabilidade_mapeamento_contas.centro_custo_erp IS 'Codigo do centro de custo no ERP (opcional)';

-- Trigger para updated_at
CREATE TRIGGER update_contabilidade_mapeamento_updated_at
    BEFORE UPDATE ON public.contabilidade_mapeamento_contas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Indices
CREATE INDEX idx_contabilidade_mapeamento_user ON public.contabilidade_mapeamento_contas(user_id);
CREATE INDEX idx_contabilidade_mapeamento_config ON public.contabilidade_mapeamento_contas(config_id);
CREATE INDEX idx_contabilidade_mapeamento_categoria ON public.contabilidade_mapeamento_contas(categoria_id);
CREATE INDEX idx_contabilidade_mapeamento_tipo ON public.contabilidade_mapeamento_contas(tipo_lancamento);
CREATE INDEX idx_contabilidade_mapeamento_ativo ON public.contabilidade_mapeamento_contas(ativo);

-- Constraint unica: Um mapeamento por categoria/config/tipo
CREATE UNIQUE INDEX idx_contabilidade_mapeamento_unico
    ON public.contabilidade_mapeamento_contas(config_id, categoria_id, tipo_lancamento)
    WHERE categoria_id IS NOT NULL;

-- =============================================================================
-- 4. TABELA: contabilidade_sincronizacao
-- =============================================================================

CREATE TABLE public.contabilidade_sincronizacao (
    -- Identificacao
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES public.contabilidade_erp_config(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Operacao
    tipo_operacao tipo_operacao_sinc NOT NULL,
    status status_sincronizacao NOT NULL DEFAULT 'pendente',

    -- Periodo
    periodo_inicio DATE NOT NULL,
    periodo_fim DATE NOT NULL,

    -- Contadores
    total_registros INTEGER DEFAULT 0,
    registros_sucesso INTEGER DEFAULT 0,
    registros_erro INTEGER DEFAULT 0,

    -- Dados
    dados_exportados JSONB,            -- Snapshot dos dados exportados
    resposta_erp JSONB,                -- Resposta completa do ERP
    erros_detalhados JSONB,              -- Detalhes dos erros

    -- Metadados
    iniciado_em TIMESTAMPTZ,
    finalizado_em TIMESTAMPTZ,
    iniciado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT chk_periodo_valido CHECK (periodo_fim >= periodo_inicio),
    CONSTRAINT chk_contadores_validos CHECK (registros_sucesso + registros_erro <= total_registros)
);

-- Comentarios
COMMENT ON TABLE public.contabilidade_sincronizacao IS 'Registro de operacoes de sincronizacao com ERPs contabeis';
COMMENT ON COLUMN public.contabilidade_sincronizacao.dados_exportados IS 'Snapshot dos dados enviados ao ERP (JSONB)';
COMMENT ON COLUMN public.contabilidade_sincronizacao.resposta_erp IS 'Resposta completa recebida do ERP (JSONB)';
COMMENT ON COLUMN public.contabilidade_sincronizacao.erros_detalhados IS 'Lista de erros com detalhes (JSONB)';

-- Trigger para updated_at
CREATE TRIGGER update_contabilidade_sincronizacao_updated_at
    BEFORE UPDATE ON public.contabilidade_sincronizacao
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Indices
CREATE INDEX idx_contabilidade_sinc_config ON public.contabilidade_sincronizacao(config_id);
CREATE INDEX idx_contabilidade_sinc_user ON public.contabilidade_sincronizacao(user_id);
CREATE INDEX idx_contabilidade_sinc_tipo ON public.contabilidade_sincronizacao(tipo_operacao);
CREATE INDEX idx_contabilidade_sinc_status ON public.contabilidade_sincronizacao(status);
CREATE INDEX idx_contabilidade_sinc_periodo ON public.contabilidade_sincronizacao(periodo_inicio, periodo_fim);
CREATE INDEX idx_contabilidade_sinc_created ON public.contabilidade_sincronizacao(created_at DESC);

-- =============================================================================
-- 5. TABELA: contabilidade_lancamentos_importados
-- =============================================================================

CREATE TABLE public.contabilidade_lancamentos_importados (
    -- Identificacao
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sincronizacao_id UUID NOT NULL REFERENCES public.contabilidade_sincronizacao(id) ON DELETE CASCADE,
    config_id UUID NOT NULL REFERENCES public.contabilidade_erp_config(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Identificacao no ERP
    lancamento_erp_id VARCHAR(255) NOT NULL,  -- ID original no ERP

    -- Dados do lancamento
    data_lancamento DATE NOT NULL,
    data_competencia DATE NOT NULL,
    tipo tipo_debito_credito NOT NULL,
    conta_contabil VARCHAR(50) NOT NULL,        -- Codigo da conta contabil
    historico TEXT,
    valor NUMERIC(15,2) NOT NULL,
    centro_custo VARCHAR(50),                   -- Centro de custo
    documento VARCHAR(100),                     -- Numero do documento

    -- Conciliacao
    conciliado BOOLEAN NOT NULL DEFAULT false,
    lancamento_financeiro_vinculado_id UUID REFERENCES public.lancamentos_caixa(id) ON DELETE SET NULL,

    -- Dados brutos
    dados_originais JSONB NOT NULL DEFAULT '{}'::jsonb,  -- Dados brutos do ERP

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT chk_valor_positivo CHECK (valor > 0)
);

-- Comentarios
COMMENT ON TABLE public.contabilidade_lancamentos_importados IS 'Lancamentos contabeis importados do ERP';
COMMENT ON COLUMN public.contabilidade_lancamentos_importados.lancamento_erp_id IS 'ID do lancamento no sistema ERP de origem';
COMMENT ON COLUMN public.contabilidade_lancamentos_importados.dados_originais IS 'Dados brutos recebidos do ERP (preservado para auditoria)';

-- Trigger para updated_at
CREATE TRIGGER update_contabilidade_lancamentos_updated_at
    BEFORE UPDATE ON public.contabilidade_lancamentos_importados
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Indices
CREATE INDEX idx_contabilidade_lanc_sinc ON public.contabilidade_lancamentos_importados(sincronizacao_id);
CREATE INDEX idx_contabilidade_lanc_config ON public.contabilidade_lancamentos_importados(config_id);
CREATE INDEX idx_contabilidade_lanc_user ON public.contabilidade_lancamentos_importados(user_id);
CREATE INDEX idx_contabilidade_lanc_erp_id ON public.contabilidade_lancamentos_importados(lancamento_erp_id);
CREATE INDEX idx_contabilidade_lanc_data ON public.contabilidade_lancamentos_importados(data_lancamento);
CREATE INDEX idx_contabilidade_lanc_conta ON public.contabilidade_lancamentos_importados(conta_contabil);
CREATE INDEX idx_contabilidade_lanc_conciliado ON public.contabilidade_lancamentos_importados(conciliado);
CREATE INDEX idx_contabilidade_lanc_vinculado ON public.contabilidade_lancamentos_importados(lancamento_financeiro_vinculado_id);

-- Constraint unica: Um lancamento por ERP/configuracao
CREATE UNIQUE INDEX idx_contabilidade_lanc_unico
    ON public.contabilidade_lancamentos_importados(config_id, lancamento_erp_id);

-- =============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.contabilidade_erp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contabilidade_mapeamento_contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contabilidade_sincronizacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contabilidade_lancamentos_importados ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- TABELA: contabilidade_erp_config
-- -----------------------------------------------------------------------------

-- Select: Usuarios veem apenas suas configuracoes
CREATE POLICY contabilidade_erp_config_select_own
    ON public.contabilidade_erp_config
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Insert: Usuarios criam apenas para si
CREATE POLICY contabilidade_erp_config_insert_own
    ON public.contabilidade_erp_config
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Update: Usuarios atualizam apenas suas configuracoes
CREATE POLICY contabilidade_erp_config_update_own
    ON public.contabilidade_erp_config
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Delete: Usuarios removem apenas suas configuracoes
CREATE POLICY contabilidade_erp_config_delete_own
    ON public.contabilidade_erp_config
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- TABELA: contabilidade_mapeamento_contas
-- -----------------------------------------------------------------------------

-- Select: Usuarios veem apenas seus mapeamentos
CREATE POLICY contabilidade_mapeamento_select_own
    ON public.contabilidade_mapeamento_contas
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Insert: Usuarios criam apenas para si
CREATE POLICY contabilidade_mapeamento_insert_own
    ON public.contabilidade_mapeamento_contas
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Update: Usuarios atualizam apenas seus mapeamentos
CREATE POLICY contabilidade_mapeamento_update_own
    ON public.contabilidade_mapeamento_contas
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Delete: Usuarios removem apenas seus mapeamentos
CREATE POLICY contabilidade_mapeamento_delete_own
    ON public.contabilidade_mapeamento_contas
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- TABELA: contabilidade_sincronizacao
-- -----------------------------------------------------------------------------

-- Select: Usuarios veem apenas suas sincronizacoes
CREATE POLICY contabilidade_sinc_select_own
    ON public.contabilidade_sincronizacao
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Insert: Usuarios criam apenas para si
CREATE POLICY contabilidade_sinc_insert_own
    ON public.contabilidade_sincronizacao
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Update: Usuarios atualizam apenas suas sincronizacoes
CREATE POLICY contabilidade_sinc_update_own
    ON public.contabilidade_sincronizacao
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Delete: Usuarios removem apenas suas sincronizacoes
CREATE POLICY contabilidade_sinc_delete_own
    ON public.contabilidade_sincronizacao
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- TABELA: contabilidade_lancamentos_importados
-- -----------------------------------------------------------------------------

-- Select: Usuarios veem apenas seus lancamentos
CREATE POLICY contabilidade_lanc_select_own
    ON public.contabilidade_lancamentos_importados
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Insert: Usuarios criam apenas para si (via Edge Functions)
CREATE POLICY contabilidade_lanc_insert_own
    ON public.contabilidade_lancamentos_importados
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Update: Usuarios atualizam apenas seus lancamentos
CREATE POLICY contabilidade_lanc_update_own
    ON public.contabilidade_lancamentos_importados
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Delete: Usuarios removem apenas seus lancamentos
CREATE POLICY contabilidade_lanc_delete_own
    ON public.contabilidade_lancamentos_importados
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- =============================================================================
-- 7. FUNCOES UTILITARIAS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Funcao: obter_mapeamento_contas(config_id UUID)
-- Retorna: JSONB com mapeamento de contas para uma configuracao
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.obter_mapeamento_contas(p_config_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_object_agg(
        cm.categoria_id::text || '_' || cm.tipo_lancamento::text,
        jsonb_build_object(
            'conta_contabil', cm.conta_contabil_erp,
            'centro_custo', cm.centro_custo_erp,
            'historico', cm.historico_padrao
        )
    )
    INTO v_result
    FROM public.contabilidade_mapeamento_contas cm
    WHERE cm.config_id = p_config_id
      AND cm.ativo = true;

    RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

COMMENT ON FUNCTION public.obter_mapeamento_contas(UUID) IS
    'Retorna mapa de categorias para contas contabeis do ERP em formato JSONB';

-- -----------------------------------------------------------------------------
-- Funcao: validar_configuracao_erp(config_id UUID)
-- Retorna: JSONB com resultado da validacao
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validar_configuracao_erp(p_config_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_config RECORD;
    v_erros TEXT[] := ARRAY[]::TEXT[];
    v_result JSONB;
    v_has_mapping BOOLEAN;
BEGIN
    -- Buscar configuracao
    SELECT * INTO v_config
    FROM public.contabilidade_erp_config
    WHERE id = p_config_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'valido', false,
            'erros', ARRAY['Configuracao nao encontrada']
        );
    END IF;

    -- Validar campos obrigatorios
    IF v_config.api_url IS NULL OR v_config.api_url = '' THEN
        v_erros := array_append(v_erros, 'URL da API nao configurada');
    END IF;

    -- Validacoes especificas por tipo de ERP
    CASE v_config.erp_tipo
        WHEN 'totvs_protheus' THEN
            IF v_config.usuario IS NULL OR v_config.usuario = '' THEN
                v_erros := array_append(v_erros, 'Usuario TOTVS nao configurado');
            END IF;
            IF v_config.codigo_empresa_erp IS NULL OR v_config.codigo_empresa_erp = '' THEN
                v_erros := array_append(v_erros, 'Codigo da empresa TOTVS nao configurado');
            END IF;

        WHEN 'sankhya' THEN
            IF v_config.api_key IS NULL THEN
                v_erros := array_append(v_erros, 'API Key Sankhya nao configurada');
            END IF;

        WHEN 'dominio' THEN
            IF v_config.usuario IS NULL OR v_config.usuario = '' THEN
                v_erros := array_append(v_erros, 'Usuario Dominio nao configurado');
            END IF;
            IF v_config.senha IS NULL THEN
                v_erros := array_append(v_erros, 'Senha Dominio nao configurada');
            END IF;

        WHEN 'alterdata' THEN
            IF v_config.token_acesso IS NULL THEN
                v_erros := array_append(v_erros, 'Token de acesso Alterdata nao configurado');
            END IF;

        ELSE
            -- ERP tipo 'outro' ou nao mapeado
            NULL;
    END CASE;

    -- Verificar se existe pelo menos um mapeamento de contas
    SELECT EXISTS (
        SELECT 1 FROM public.contabilidade_mapeamento_contas
        WHERE config_id = p_config_id AND ativo = true
    ) INTO v_has_mapping;

    IF NOT v_has_mapping THEN
        v_erros := array_append(v_erros, 'Nenhum mapeamento de contas configurado');
    END IF;

    -- Montar resultado
    v_result := jsonb_build_object(
        'valido', array_length(v_erros, 1) IS NULL OR array_length(v_erros, 1) = 0,
        'erros', v_erros,
        'config_id', p_config_id,
        'erp_tipo', v_config.erp_tipo,
        'possui_mapeamento', v_has_mapping
    );

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.validar_configuracao_erp(UUID) IS
    'Valida se uma configuracao de ERP esta completa para uso';

-- -----------------------------------------------------------------------------
-- Funcao: obter_ultima_sincronizacao(config_id UUID, tipo_operacao TEXT)
-- Retorna: Record com dados da ultima sincronizacao
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.obter_ultima_sincronizacao(
    p_config_id UUID,
    p_tipo_operacao TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    tipo_operacao tipo_operacao_sinc,
    status status_sincronizacao,
    periodo_inicio DATE,
    periodo_fim DATE,
    total_registros INTEGER,
    registros_sucesso INTEGER,
    registros_erro INTEGER,
    finalizado_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cs.id,
        cs.tipo_operacao,
        cs.status,
        cs.periodo_inicio,
        cs.periodo_fim,
        cs.total_registros,
        cs.registros_sucesso,
        cs.registros_erro,
        cs.finalizado_em,
        cs.created_at
    FROM public.contabilidade_sincronizacao cs
    WHERE cs.config_id = p_config_id
      AND (p_tipo_operacao IS NULL OR cs.tipo_operacao::text = p_tipo_operacao)
    ORDER BY cs.created_at DESC
    LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.obter_ultima_sincronizacao(UUID, TEXT) IS
    'Retorna a ultima sincronizacao de uma configuracao, opcionalmente filtrada por tipo';

-- -----------------------------------------------------------------------------
-- Funcao: mascarar_credenciais(credencial TEXT)
-- Retorna: TEXT mascarado
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mascarar_credenciais(p_credencial TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_len INTEGER;
BEGIN
    IF p_credencial IS NULL OR length(p_credencial) <= 8 THEN
        RETURN '****';
    END IF;

    v_len := length(p_credencial);
    RETURN substring(p_credencial, 1, 4) || '****' || substring(p_credencial, v_len - 3, 4);
END;
$$;

COMMENT ON FUNCTION public.mascarar_credenciais(TEXT) IS
    'Mascara credenciais para exibicao (ex: API keys, tokens)';

-- -----------------------------------------------------------------------------
-- Funcao: registrar_sincronizacao(config_id, user_id, tipo_operacao, ...)
-- Retorna: UUID da sincronizacao criada
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.registrar_sincronizacao(
    p_config_id UUID,
    p_user_id UUID,
    p_tipo_operacao tipo_operacao_sinc,
    p_periodo_inicio DATE,
    p_periodo_fim DATE,
    p_iniciado_por UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sinc_id UUID;
BEGIN
    INSERT INTO public.contabilidade_sincronizacao (
        config_id,
        user_id,
        tipo_operacao,
        status,
        periodo_inicio,
        periodo_fim,
        iniciado_em,
        iniciado_por
    ) VALUES (
        p_config_id,
        p_user_id,
        p_tipo_operacao,
        'processando',
        p_periodo_inicio,
        p_periodo_fim,
        now(),
        COALESCE(p_iniciado_por, p_user_id)
    )
    RETURNING id INTO v_sinc_id;

    -- Atualizar ultima sincronizacao na config
    UPDATE public.contabilidade_erp_config
    SET ultima_sincronizacao = now(),
        status_conexao = 'conectado'
    WHERE id = p_config_id;

    RETURN v_sinc_id;
END;
$$;

COMMENT ON FUNCTION public.registrar_sincronizacao(UUID, UUID, tipo_operacao_sinc, DATE, DATE, UUID) IS
    'Inicia uma nova sincronizacao e retorna o ID';

-- -----------------------------------------------------------------------------
-- Funcao: finalizar_sincronizacao(sinc_id, status, registros_sucesso, ...)
-- Retorna: void
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.finalizar_sincronizacao(
    p_sinc_id UUID,
    p_status status_sincronizacao,
    p_total_registros INTEGER DEFAULT 0,
    p_registros_sucesso INTEGER DEFAULT 0,
    p_registros_erro INTEGER DEFAULT 0,
    p_resposta_erp JSONB DEFAULT NULL,
    p_erros_detalhados JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.contabilidade_sincronizacao
    SET
        status = p_status,
        total_registros = p_total_registros,
        registros_sucesso = p_registros_sucesso,
        registros_erro = p_registros_erro,
        resposta_erp = p_resposta_erp,
        erros_detalhados = p_erros_detalhados,
        finalizado_em = now()
    WHERE id = p_sinc_id;
END;
$$;

COMMENT ON FUNCTION public.finalizar_sincronizacao(UUID, status_sincronizacao, INTEGER, INTEGER, INTEGER, JSONB, JSONB) IS
    'Finaliza uma sincronizacao com os resultados';

-- -----------------------------------------------------------------------------
-- Funcao: conciliar_lancamento(lancamento_importado_id, lancamento_caixa_id)
-- Retorna: BOOLEAN (sucesso)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.conciliar_lancamento(
    p_lancamento_importado_id UUID,
    p_lancamento_caixa_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.contabilidade_lancamentos_importados
    SET
        conciliado = true,
        lancamento_financeiro_vinculado_id = p_lancamento_caixa_id
    WHERE id = p_lancamento_importado_id
      AND user_id = auth.uid();  -- Garantir RLS

    RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION public.conciliar_lancamento(UUID, UUID) IS
    'Vincula um lancamento importado a um lancamento de caixa interno';

-- =============================================================================
-- 8. VIEWS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- View: v_contabilidade_sincronizacao_resumo
-- Resumo de sincronizacoes por configuracao
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_contabilidade_sincronizacao_resumo AS
SELECT
    cec.id AS config_id,
    cec.nome_configuracao,
    cec.erp_tipo,
    cec.status_conexao,
    cec.ultima_sincronizacao,
    COUNT(cs.id) AS total_sincronizacoes,
    COUNT(cs.id) FILTER (WHERE cs.status = 'sucesso') AS sincronizacoes_sucesso,
    COUNT(cs.id) FILTER (WHERE cs.status = 'erro') AS sincronizacoes_erro,
    MAX(cs.created_at) AS ultima_tentativa,
    COALESCE(SUM(cs.registros_sucesso), 0) AS total_registros_processados
FROM public.contabilidade_erp_config cec
LEFT JOIN public.contabilidade_sincronizacao cs ON cs.config_id = cec.id
WHERE cec.user_id = auth.uid()  -- RLS via view
GROUP BY cec.id, cec.nome_configuracao, cec.erp_tipo, cec.status_conexao, cec.ultima_sincronizacao;

COMMENT ON VIEW public.v_contabilidade_sincronizacao_resumo IS
    'Resumo de sincronizacoes por configuracao (sem dados sensiveis)';

-- -----------------------------------------------------------------------------
-- View: v_contabilidade_lancamentos_pendentes
-- Lancamentos nao conciliados
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_contabilidade_lancamentos_pendentes AS
SELECT
    cli.*,
    cec.nome_configuracao,
    cec.erp_tipo
FROM public.contabilidade_lancamentos_importados cli
JOIN public.contabilidade_erp_config cec ON cec.id = cli.config_id
WHERE cli.conciliado = false
  AND cli.user_id = auth.uid();  -- RLS via view

COMMENT ON VIEW public.v_contabilidade_lancamentos_pendentes IS
    'Lancamentos importados pendentes de conciliacao';

-- =============================================================================
-- 9. REALTIME (Supabase Realtime)
-- =============================================================================

-- Adicionar tabelas ao publication de realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.contabilidade_sincronizacao;

-- =============================================================================
-- 10. DADOS INICIAIS (Opcional - descomentar se necessario)
-- =============================================================================

-- Exemplos de configuracoes por ERP (descomentar para inserir):
/*
INSERT INTO public.contabilidade_erp_config (
    user_id, erp_tipo, nome_configuracao, ambiente, api_url, configuracoes_extras
) VALUES
-- Exemplo TOTVS Protheus
('00000000-0000-0000-0000-000000000000', 'totvs_protheus', 'Protheus Principal', 'homologacao',
 'http://localhost:8080/rest',
 '{"versao": "12.1.33", "banco": "MSSQL"}'),

-- Exemplo Sankhya
('00000000-0000-0000-0000-000000000000', 'sankhya', 'Sankhya API', 'homologacao',
 'https://api.sankhya.com.br/v1',
 '{"versao_api": "v1", "formato_data": "YYYY-MM-DD"}'),

-- Exemplo Dominio
('00000000-0000-0000-0000-000000000000', 'dominio', 'Dominio Sistemas', 'homologacao',
 'https://api.dominio.com.br/contabil',
 '{"modulo": "contabilidade", "versao": "2024"}');
*/

-- =============================================================================
-- FIM DA MIGRATION
-- =============================================================================
