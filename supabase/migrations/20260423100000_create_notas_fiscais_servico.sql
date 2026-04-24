-- Migration: Create notas_fiscais_servico table
-- Date: 2026-04-23

CREATE TABLE IF NOT EXISTS public.notas_fiscais_servico (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'enviando', 'autorizada', 'rejeitada', 'cancelada', 'erro')),
  numero_nota TEXT,
  serie TEXT,
  tipo_rps TEXT DEFAULT 'RPS',

  -- Tomador do serviço
  cliente_tipo_documento TEXT DEFAULT 'CNPJ',
  cliente_cnpj_cpf TEXT,
  cliente_razao_social TEXT,
  cliente_nome_fantasia TEXT,
  cliente_email TEXT,
  cliente_telefone TEXT,
  cliente_endereco TEXT,
  cliente_numero TEXT,
  cliente_complemento TEXT,
  cliente_bairro TEXT,
  cliente_cidade TEXT,
  cliente_estado TEXT,
  cliente_cep TEXT,
  cliente_ibge TEXT,

  -- Serviço
  servico_descricao TEXT,
  servico_codigo TEXT,
  servico_cnae TEXT,
  servico_codigo_tributacao TEXT,
  servico_discriminacao TEXT,
  servico_item_lista_servico TEXT,

  -- Valores
  valor_servico NUMERIC(15,2) DEFAULT 0,
  valor_deducoes NUMERIC(15,2) DEFAULT 0,
  valor_iss NUMERIC(15,2) DEFAULT 0,
  valor_liquido NUMERIC(15,2) DEFAULT 0,
  base_calculo NUMERIC(15,2) DEFAULT 0,
  aliquota_iss NUMERIC(6,4) DEFAULT 0,
  iss_retido BOOLEAN DEFAULT false,

  -- Retenções
  retencao_pis NUMERIC(15,2) DEFAULT 0,
  retencao_cofins NUMERIC(15,2) DEFAULT 0,
  retencao_inss NUMERIC(15,2) DEFAULT 0,
  retencao_ir NUMERIC(15,2) DEFAULT 0,
  retencao_csll NUMERIC(15,2) DEFAULT 0,
  aliquota_pis NUMERIC(6,4) DEFAULT 0,
  aliquota_cofins NUMERIC(6,4) DEFAULT 0,
  aliquota_inss NUMERIC(6,4) DEFAULT 0,
  aliquota_ir NUMERIC(6,4) DEFAULT 0,
  aliquota_csll NUMERIC(6,4) DEFAULT 0,

  -- Dados da nota
  data_competencia DATE,
  data_emissao TIMESTAMPTZ,
  natureza_operacao INTEGER DEFAULT 1,
  regime_tributario INTEGER DEFAULT 1,
  municipio_prestacao INTEGER,

  -- Certificado usado
  certificado_id UUID REFERENCES public.certificados_nfse(id),

  -- XMLs
  xml_envio TEXT,
  xml_retorno TEXT,
  numero_rps TEXT,

  -- Links download
  link_pdf TEXT,
  link_xml TEXT,
  protocolo TEXT,

  -- Dados do Ginfes
  codigo_verificacao TEXT,
  link_nfse TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Comentários
COMMENT ON TABLE public.notas_fiscais_servico IS 'Notas fiscais de serviço eletrônicas (NFS-e)';
COMMENT ON COLUMN public.notas_fiscais_servico.status IS 'rascunho, enviando, autorizada, rejeitada, cancelada, erro';
COMMENT ON COLUMN public.notas_fiscais_servico.natureza_operacao IS '1-Tributação normal, 2-IMMune, 3-Extemporânea, etc';
COMMENT ON COLUMN public.notas_fiscais_servico.regime_tributario IS '1-Simples nacional, 2-Lucro presumido, 3-Lucro real, 4-Outros';

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_servico_user_id ON public.notas_fiscais_servico(user_id);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_servico_status ON public.notas_fiscais_servico(status);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_servico_data_emissao ON public.notas_fiscais_servico(data_emissao DESC);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notas_fiscais_servico_updated_at
  BEFORE UPDATE ON public.notas_fiscais_servico
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.notas_fiscais_servico ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own notas" ON public.notas_fiscais_servico
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notas" ON public.notas_fiscais_servico
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notas" ON public.notas_fiscais_servico
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notas" ON public.notas_fiscais_servico
  FOR DELETE USING (auth.uid() = user_id);