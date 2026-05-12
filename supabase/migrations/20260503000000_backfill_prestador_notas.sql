-- Migration: Backfill cnpj_prestador e inscricao_municipal das notas antigas
-- Data: 2026-05-03
-- Preenche as novas colunas com dados do certificado vinculado

UPDATE public.notas_fiscais_servico n
SET
    cnpj_prestador = c.cnpj,
    inscricao_municipal = c.inscricao_municipal
FROM public.certificados_nfse c
WHERE n.certificado_id = c.id
    AND (n.cnpj_prestador IS NULL OR n.cnpj_prestador = '')
    AND (n.inscricao_municipal IS NULL OR n.inscricao_municipal = '');

-- Para notas sem certificado_id, tenta usar o user_id para buscar o certificado ativo do usuario
UPDATE public.notas_fiscais_servico n
SET
    cnpj_prestador = c.cnpj,
    inscricao_municipal = c.inscricao_municipal
FROM public.certificados_nfse c
WHERE n.certificado_id IS NULL
    AND c.user_id = n.user_id
    AND c.ativo = true
    AND (n.cnpj_prestador IS NULL OR n.cnpj_prestador = '')
    AND (n.inscricao_municipal IS NULL OR n.inscricao_municipal = '');

-- Log de contagem (apenas informativo)
SELECT
    COUNT(*) FILTER (WHERE cnpj_prestador IS NOT NULL AND cnpj_prestador != '') AS com_cnpj,
    COUNT(*) FILTER (WHERE cnpj_prestador IS NULL OR cnpj_prestador = '') AS sem_cnpj,
    COUNT(*) FILTER (WHERE inscricao_municipal IS NOT NULL AND inscricao_municipal != '') AS com_im,
    COUNT(*) FILTER (WHERE inscricao_municipal IS NULL OR inscricao_municipal = '') AS sem_im
FROM public.notas_fiscais_servico;
