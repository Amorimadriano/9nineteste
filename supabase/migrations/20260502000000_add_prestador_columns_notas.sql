-- Migration: Adiciona colunas do prestador na tabela notas_fiscais_servico
-- Data: 2026-05-02

ALTER TABLE public.notas_fiscais_servico
    ADD COLUMN IF NOT EXISTS cnpj_prestador TEXT,
    ADD COLUMN IF NOT EXISTS inscricao_municipal TEXT;

-- Comentários
COMMENT ON COLUMN public.notas_fiscais_servico.cnpj_prestador IS 'CNPJ do prestador (copiado do certificado na emissão)';
COMMENT ON COLUMN public.notas_fiscais_servico.inscricao_municipal IS 'Inscrição municipal do prestador (copiada do certificado na emissão)';
