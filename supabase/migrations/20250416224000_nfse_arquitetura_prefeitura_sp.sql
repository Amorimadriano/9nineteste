-- Migration: NFS-e Arquitetura - Prefeitura de São Paulo
-- Data: 2025-04-16
-- Task: #27
-- Agentes: @agente-supabase + @agente-seguranca

-- =============================================================================
-- TIPOS ENUM
-- =============================================================================

-- Ambiente de emissão (homologação vs produção)
CREATE TYPE ambiente_enum AS ENUM ('producao', 'homologacao');

-- Regime tributário
CREATE TYPE regime_tributario_enum AS ENUM ('simples_nacional', 'lucro_presumido', 'lucro_real');

-- Status da nota fiscal
CREATE TYPE nfse_status_enum AS ENUM (
    'rascunho',
    'enviando',
    'autorizada',
    'rejeitada',
    'cancelada'
);

-- Tipo de documento do tomador
CREATE TYPE tomador_tipo_enum AS ENUM ('cpf', 'cnpj');

-- =============================================================================
-- TABELA: nfs_e_emitentes (Configuração por empresa)
-- =============================================================================

CREATE TABLE nfs_e_emitentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,

    -- Dados do emitente/empresa
    cnpj_emitente VARCHAR(14) NOT NULL,
    inscricao_municipal VARCHAR(20),
    razao_social VARCHAR(150) NOT NULL,
    nome_fantasia VARCHAR(60),

    -- Endereço (estruturado em JSONB)
    endereco JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (
        jsonb_typeof(endereco) = 'object' AND
        endereco ? 'logradouro' AND
        endereco ? 'numero' AND
        endereco ? 'bairro' AND
        endereco ? 'cidade' AND
        endereco ? 'uf' AND
        endereco ? 'cep'
    ),

    -- Certificado digital (criptografado via pgsodium)
    certificado_digital TEXT, -- Encrypted com pgsodium (PKCS12)
    senha_certificado TEXT,   -- Encrypted com pgsodium

    -- Configurações de emissão
    ambiente ambiente_enum NOT NULL DEFAULT 'homologacao',
    proximo_numero_nota INTEGER NOT NULL DEFAULT 1,
    serie_nota VARCHAR(3) NOT NULL DEFAULT '1',

    -- Tributação e serviços
    regime_tributario regime_tributario_enum NOT NULL DEFAULT 'simples_nacional',
    aliquota_iss DECIMAL(5,2) NOT NULL DEFAULT 2.00,
    item_lista_servicos VARCHAR(5), -- Código da LC 116
    cnae VARCHAR(7),
    codigo_tributacao_municipio VARCHAR(20),

    -- Controle
    ativo BOOLEAN NOT NULL DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_cnpj_emitente CHECK (
        cnpj_emitente ~ '^[0-9]{14}$'
    ),
    CONSTRAINT chk_proximo_numero_nota CHECK (proximo_numero_nota > 0),
    CONSTRAINT chk_aliquota_iss CHECK (aliquota_iss >= 0 AND aliquota_iss <= 100)
);

-- Comentários
COMMENT ON TABLE nfs_e_emitentes IS 'Configuração de emitentes de NFS-e por empresa - integração Prefeitura SP';
COMMENT ON COLUMN nfs_e_emitentes.certificado_digital IS 'Certificado PKCS12 criptografado via pgsodium';
COMMENT ON COLUMN nfs_e_emitentes.senha_certificado IS 'Senha do certificado criptografada via pgsodium';
COMMENT ON COLUMN nfs_e_emitentes.endereco IS 'JSON: {logradouro, numero, complemento, bairro, cidade, uf, cep}';

-- Indexes
CREATE INDEX idx_nfse_emitentes_empresa ON nfs_e_emitentes(empresa_id);
CREATE INDEX idx_nfse_emitentes_cnpj ON nfs_e_emitentes(cnpj_emitente);
CREATE INDEX idx_nfse_emitentes_ativo ON nfs_e_emitentes(ativo) WHERE ativo = true;

-- =============================================================================
-- TABELA: nfs_e_notas (Notas emitidas)
-- =============================================================================

CREATE TABLE nfs_e_notas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emitente_id UUID NOT NULL REFERENCES nfs_e_emitentes(id) ON DELETE RESTRICT,
    empresa_id UUID NOT NULL,

    -- Numeração da nota
    numero_nota INTEGER NOT NULL,
    serie VARCHAR(3) NOT NULL DEFAULT '1',

    -- Datas
    data_emissao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    competencia DATE NOT NULL,

    -- Status e protocolos
    status nfse_status_enum NOT NULL DEFAULT 'rascunho',
    protocolo_autorizacao VARCHAR(50), -- Da prefeitura
    codigo_verificacao VARCHAR(50),    -- Para consulta pública

    -- Links dos documentos
    link_pdf TEXT,  -- URL da nota
    link_xml TEXT,  -- URL do XML

    -- Dados do tomador
    tomador_tipo tomador_tipo_enum NOT NULL,
    tomador_documento VARCHAR(14) NOT NULL,
    tomador_razao_social VARCHAR(150),
    tomador_endereco JSONB DEFAULT '{}'::jsonb,
    tomador_email VARCHAR(100),

    -- Dados do serviço
    servico_descricao TEXT NOT NULL,
    servico_valor DECIMAL(15,2) NOT NULL,
    servico_deducoes DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    servico_base_calculo DECIMAL(15,2) NOT NULL,
    servico_aliquota DECIMAL(5,2) NOT NULL,
    servico_iss_retido BOOLEAN NOT NULL DEFAULT false,
    servico_valor_iss DECIMAL(15,2) NOT NULL,
    servico_valor_liquido DECIMAL(15,2) NOT NULL,

    -- Retenções de impostos
    retencoes_pis DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    retencoes_cofins DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    retencoes_inss DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    retencoes_ir DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    retencoes_csll DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    -- Mensagem e controle
    mensagem_fiscal TEXT,
    rascunho BOOLEAN NOT NULL DEFAULT true,

    -- Controle de envio e cancelamento
    enviada_prefeitura_em TIMESTAMPTZ,
    cancelada_em TIMESTAMPTZ,
    motivo_cancelamento TEXT,

    -- Log de erros
    error_log JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT uq_numero_nota_emitente UNIQUE (emitente_id, numero_nota, serie),
    CONSTRAINT chk_tomador_documento CHECK (
        (tomador_tipo = 'cpf' AND tomador_documento ~ '^[0-9]{11}$') OR
        (tomador_tipo = 'cnpj' AND tomador_documento ~ '^[0-9]{14}$')
    ),
    CONSTRAINT chk_servico_valor CHECK (servico_valor >= 0),
    CONSTRAINT chk_competencia CHECK (competencia <= CURRENT_DATE + INTERVAL '1 month')
);

-- Comentários
COMMENT ON TABLE nfs_e_notas IS 'Notas fiscais de serviço eletrônicas emitidas - Prefeitura SP';
COMMENT ON COLUMN nfs_e_notas.protocolo_autorizacao IS 'Protocolo de autorização retornado pela prefeitura';
COMMENT ON COLUMN nfs_e_notas.codigo_verificacao IS 'Código para consulta pública na prefeitura';
COMMENT ON COLUMN nfs_e_notas.error_log IS 'JSON com erros de processamento: {codigo, mensagem, timestamp, raw_response}';

-- Indexes
CREATE INDEX idx_nfse_notas_empresa ON nfs_e_notas(empresa_id);
CREATE INDEX idx_nfse_notas_emitente ON nfs_e_notas(emitente_id);
CREATE INDEX idx_nfse_notas_status ON nfs_e_notas(status);
CREATE INDEX idx_nfse_notas_numero ON nfs_e_notas(numero_nota);
CREATE INDEX idx_nfse_notas_competencia ON nfs_e_notas(competencia);
CREATE INDEX idx_nfse_notas_tomador ON nfs_e_notas(tomador_documento);
CREATE INDEX idx_nfse_notas_data_emissao ON nfs_e_notas(data_emissao);
CREATE INDEX idx_nfse_notas_enviada_em ON nfs_e_notas(enviada_prefeitura_em);

-- Índice para busca por status e empresa (dashboard)
CREATE INDEX idx_nfse_notas_status_empresa ON nfs_e_notas(empresa_id, status, data_emissao DESC);

-- =============================================================================
-- TABELA: nfs_e_rascunhos (Autosave)
-- =============================================================================

CREATE TABLE nfs_e_rascunhos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,
    usuario_id UUID NOT NULL,

    -- Snapshot dos campos do formulário
    dados JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Timestamp do último autosave
    ultimo_autosave TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraint: apenas um rascunho por usuário/empresa
    CONSTRAINT uq_rascunho_usuario_empresa UNIQUE (empresa_id, usuario_id)
);

-- Comentários
COMMENT ON TABLE nfs_e_rascunhos IS 'Rascunhos de notas fiscais com autosave';
COMMENT ON COLUMN nfs_e_rascunhos.dados IS 'JSON com snapshot de todos os campos do formulário de emissão';

-- Indexes
CREATE INDEX idx_nfse_rascunhos_empresa ON nfs_e_rascunhos(empresa_id);
CREATE INDEX idx_nfse_rascunhos_usuario ON nfs_e_rascunhos(usuario_id);
CREATE INDEX idx_nfse_rascunhos_autosave ON nfs_e_rascunhos(ultimo_autosave);

-- =============================================================================
-- FUNÇÕES AUXILIARES
-- =============================================================================

-- Função: obter_proximo_numero_nota
-- Retorna o próximo número de nota para um emitente e incrementa o contador
CREATE OR REPLACE FUNCTION obter_proximo_numero_nota(p_emitente_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_proximo_numero INTEGER;
BEGIN
    -- Bloqueia a linha e obtém o número atual
    SELECT proximo_numero_nota INTO v_proximo_numero
    FROM nfs_e_emitentes
    WHERE id = p_emitente_id
    FOR UPDATE;

    IF v_proximo_numero IS NULL THEN
        RAISE EXCEPTION 'Emitente não encontrado: %', p_emitente_id;
    END IF;

    -- Incrementa o contador
    UPDATE nfs_e_emitentes
    SET proximo_numero_nota = proximo_numero_nota + 1,
        updated_at = NOW()
    WHERE id = p_emitente_id;

    RETURN v_proximo_numero;
END;
$$;

COMMENT ON FUNCTION obter_proximo_numero_nota IS 'Retorna e incrementa o próximo número de nota fiscal para um emitente';

-- Função: mascarar_cnpj
-- Exibe ***.123.456/**00
CREATE OR REPLACE FUNCTION mascarar_cnpj(p_cnpj TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_cnpj_limpo TEXT;
BEGIN
    -- Remove caracteres não numéricos
    v_cnpj_limpo := regexp_replace(p_cnpj, '[^0-9]', '', 'g');

    -- Valida se tem 14 dígitos
    IF LENGTH(v_cnpj_limpo) != 14 THEN
        RETURN 'CNPJ INVÁLIDO';
    END IF;

    -- Mascara: ***.XXX.XXX/XX** (mostra apenas dígitos 4-11)
    RETURN '***.' ||
           SUBSTRING(v_cnpj_limpo, 3, 3) || '.' ||
           SUBSTRING(v_cnpj_limpo, 6, 3) || '/' ||
           SUBSTRING(v_cnpj_limpo, 9, 2) || '**';
END;
$$;

COMMENT ON FUNCTION mascarar_cnpj IS 'Mascara CNPJ exibindo apenas dígitos centrais: ***.XXX.XXX/XX**';

-- Função: mascarar_cpf (bônus - complementar)
CREATE OR REPLACE FUNCTION mascarar_cpf(p_cpf TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_cpf_limpo TEXT;
BEGIN
    v_cpf_limpo := regexp_replace(p_cpf, '[^0-9]', '', 'g');

    IF LENGTH(v_cpf_limpo) != 11 THEN
        RETURN 'CPF INVÁLIDO';
    END IF;

    RETURN '***.' ||
           SUBSTRING(v_cpf_limpo, 4, 3) || '.' ||
           SUBSTRING(v_cpf_limpo, 7, 2) || '-**';
END;
$$;

-- Função: validar_campos_obrigatorios
-- Valida se todos os campos obrigatórios estão preenchidos
CREATE OR REPLACE FUNCTION validar_campos_obrigatorios(p_nota_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_nota RECORD;
    v_erros JSONB := '[]'::jsonb;
BEGIN
    -- Obtém a nota
    SELECT * INTO v_nota
    FROM nfs_e_notas
    WHERE id = p_nota_id;

    IF v_nota IS NULL THEN
        RETURN jsonb_build_object(
            'valido', false,
            'erros', '[{"campo": "nota", "mensagem": "Nota não encontrada"}]'::jsonb
        );
    END IF;

    -- Validações de campos obrigatórios
    IF v_nota.tomador_documento IS NULL OR v_nota.tomador_documento = '' THEN
        v_erros := v_erros || '{"campo": "tomador_documento", "mensagem": "Documento do tomador é obrigatório"}'::jsonb;
    END IF;

    IF v_nota.tomador_razao_social IS NULL OR v_nota.tomador_razao_social = '' THEN
        v_erros := v_erros || '{"campo": "tomador_razao_social", "mensagem": "Razão social do tomador é obrigatória"}'::jsonb;
    END IF;

    IF v_nota.servico_descricao IS NULL OR v_nota.servico_descricao = '' THEN
        v_erros := v_erros || '{"campo": "servico_descricao", "mensagem": "Descrição do serviço é obrigatória"}'::jsonb;
    END IF;

    IF v_nota.servico_valor IS NULL OR v_nota.servico_valor <= 0 THEN
        v_erros := v_erros || '{"campo": "servico_valor", "mensagem": "Valor do serviço deve ser maior que zero"}'::jsonb;
    END IF;

    IF v_nota.competencia IS NULL THEN
        v_erros := v_erros || '{"campo": "competencia", "mensagem": "Competência é obrigatória"}'::jsonb;
    END IF;

    -- Validação do endereço do tomador (se preenchido)
    IF v_nota.tomador_endereco IS NOT NULL AND v_nota.tomador_endereco != '{}'::jsonb THEN
        IF NOT (v_nota.tomador_endereco ? 'logradouro' AND
                v_nota.tomador_endereco ? 'numero' AND
                v_nota.tomador_endereco ? 'bairro' AND
                v_nota.tomador_endereco ? 'cidade' AND
                v_nota.tomador_endereco ? 'uf') THEN
            v_erros := v_erros || '{"campo": "tomador_endereco", "mensagem": "Endereço do tomador incompleto"}'::jsonb;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'valido', jsonb_array_length(v_erros) = 0,
        'erros', v_erros
    );
END;
$$;

COMMENT ON FUNCTION validar_campos_obrigatorios IS 'Valida campos obrigatórios de uma nota fiscal antes do envio';

-- Função: calcular_valores_nfse
-- Calcula base de cálculo, ISS e valor líquido automaticamente
CREATE OR REPLACE FUNCTION calcular_valores_nfse()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_emitente RECORD;
BEGIN
    -- Obtém alíquota do emitente se não informada
    IF NEW.servico_aliquota IS NULL THEN
        SELECT aliquota_iss INTO NEW.servico_aliquota
        FROM nfs_e_emitentes
        WHERE id = NEW.emitente_id;
    END IF;

    -- Calcula base de cálculo
    NEW.servico_base_calculo := NEW.servico_valor - COALESCE(NEW.servico_deducoes, 0);

    -- Calcula ISS
    IF NEW.servico_iss_retido THEN
        NEW.servico_valor_iss := ROUND(NEW.servico_base_calculo * NEW.servico_aliquota / 100, 2);
    ELSE
        NEW.servico_valor_iss := 0;
    END IF;

    -- Calcula valor líquido
    NEW.servico_valor_liquido := NEW.servico_base_calculo
        - NEW.servico_valor_iss
        - COALESCE(NEW.retencoes_pis, 0)
        - COALESCE(NEW.retencoes_cofins, 0)
        - COALESCE(NEW.retencoes_inss, 0)
        - COALESCE(NEW.retencoes_ir, 0)
        - COALESCE(NEW.retencoes_csll, 0);

    RETURN NEW;
END;
$$;

-- Trigger para calcular valores automaticamente
CREATE TRIGGER trg_calcular_valores_nfse
    BEFORE INSERT OR UPDATE ON nfs_e_notas
    FOR EACH ROW
    EXECUTE FUNCTION calcular_valores_nfse();

-- Função: atualizar_updated_at
CREATE OR REPLACE FUNCTION atualizar_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Triggers de updated_at
CREATE TRIGGER trg_nfse_emitentes_updated_at
    BEFORE UPDATE ON nfs_e_emitentes
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER trg_nfse_notas_updated_at
    BEFORE UPDATE ON nfs_e_notas
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER trg_nfse_rascunhos_updated_at
    BEFORE UPDATE ON nfs_e_rascunhos
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

-- Função: limpar_rascunhos_antigos
-- Remove rascunhos com mais de 30 dias sem atualização
CREATE OR REPLACE FUNCTION limpar_rascunhos_antigos()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_removidos INTEGER;
BEGIN
    DELETE FROM nfs_e_rascunhos
    WHERE ultimo_autosave < NOW() - INTERVAL '30 days';

    GET DIAGNOSTICS v_removidos = ROW_COUNT;
    RETURN v_removidos;
END;
$$;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Habilita RLS nas tabelas
ALTER TABLE nfs_e_emitentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfs_e_notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfs_e_rascunhos ENABLE ROW LEVEL SECURITY;

-- Política: Isolamento por empresa para emitentes
CREATE POLICY nfse_emitentes_isolamento ON nfs_e_emitentes
    FOR ALL
    TO authenticated
    USING (empresa_id IN (
        SELECT empresa_id FROM usuario_empresas WHERE usuario_id = auth.uid()
    ))
    WITH CHECK (empresa_id IN (
        SELECT empresa_id FROM usuario_empresas WHERE usuario_id = auth.uid()
    ));

-- Política: Isolamento por empresa para notas
CREATE POLICY nfse_notas_isolamento ON nfs_e_notas
    FOR ALL
    TO authenticated
    USING (empresa_id IN (
        SELECT empresa_id FROM usuario_empresas WHERE usuario_id = auth.uid()
    ))
    WITH CHECK (empresa_id IN (
        SELECT empresa_id FROM usuario_empresas WHERE usuario_id = auth.uid()
    ));

-- Política: Isolamento por empresa para rascunhos
CREATE POLICY nfse_rascunhos_isolamento ON nfs_e_rascunhos
    FOR ALL
    TO authenticated
    USING (empresa_id IN (
        SELECT empresa_id FROM usuario_empresas WHERE usuario_id = auth.uid()
    ))
    WITH CHECK (empresa_id IN (
        SELECT empresa_id FROM usuario_empresas WHERE usuario_id = auth.uid()
    ));

-- Política: Usuário só pode ver/editar seus próprios rascunhos
CREATE POLICY nfse_rascunhos_usuario ON nfs_e_rascunhos
    FOR ALL
    TO authenticated
    USING (usuario_id = auth.uid())
    WITH CHECK (usuario_id = auth.uid());

-- Política: Serviço role pode tudo (para edge functions)
CREATE POLICY nfse_emitentes_service ON nfs_e_emitentes
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY nfse_notas_service ON nfs_e_notas
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY nfse_rascunhos_service ON nfs_e_rascunhos
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =============================================================================
-- PERMISSÕES
-- =============================================================================

-- Grant básico para authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON nfs_e_emitentes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON nfs_e_notas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON nfs_e_rascunhos TO authenticated;

-- Grant para service_role (edge functions)
GRANT ALL ON nfs_e_emitentes TO service_role;
GRANT ALL ON nfs_e_notas TO service_role;
GRANT ALL ON nfs_e_rascunhos TO service_role;

-- Grant nas funções
GRANT EXECUTE ON FUNCTION obter_proximo_numero_nota TO authenticated;
GRANT EXECUTE ON FUNCTION mascarar_cnpj TO authenticated;
GRANT EXECUTE ON FUNCTION mascarar_cpf TO authenticated;
GRANT EXECUTE ON FUNCTION validar_campos_obrigatorios TO authenticated;

GRANT EXECUTE ON FUNCTION obter_proximo_numero_nota TO service_role;
GRANT EXECUTE ON FUNCTION mascarar_cnpj TO service_role;
GRANT EXECUTE ON FUNCTION mascarar_cpf TO service_role;
GRANT EXECUTE ON FUNCTION validar_campos_obrigatorios TO service_role;

-- =============================================================================
-- NOTA DE SEGURANÇA: CRIPTOGRAFIA DO CERTIFICADO DIGITAL
-- =============================================================================
--
-- Os campos certificado_digital e senha_certificado são do tipo TEXT
-- e devem ser criptografados usando a extensão pgsodium do Supabase.
--
-- Exemplo de uso:
--   INSERT: pgsodium.crypto_secretbox_encrypt(certificado, chave, nonce)
--   SELECT: pgsodium.crypto_secretbox_decrypt(encrypted, chave, nonce)
--
-- A chave deve ser armazenada no Vault do Supabase ou via KMS.
--
-- Alternativamente, usar criptografia no application layer antes de salvar.
-- =============================================================================
