SELECT 'empresas' as tabela, id, logo_url as url
FROM public.empresas
WHERE logo_url LIKE '%rjcruiwlurqdwooarrpa%'
UNION ALL
SELECT 'anexos', id::text, url
FROM public.anexos
WHERE url LIKE '%rjcruiwlurqdwooarrpa%'
UNION ALL
SELECT 'certificados_nfse', id::text, arquivo_pfx
FROM public.certificados_nfse
WHERE arquivo_pfx LIKE '%rjcruiwlurqdwooarrpa%'
UNION ALL
SELECT 'contador_docs', id::text, url
FROM public.contador_docs
WHERE url LIKE '%rjcruiwlurqdwooarrpa%'
UNION ALL
SELECT 'licencas_documentos', id::text, url
FROM public.licencas_documentos
WHERE url LIKE '%rjcruiwlurqdwooarrpa%'
UNION ALL
SELECT 'notas_fiscais_servico', id::text, COALESCE(xml_url, pdf_url)
FROM public.notas_fiscais_servico
WHERE xml_url LIKE '%rjcruiwlurqdwooarrpa%'
   OR pdf_url LIKE '%rjcruiwlurqdwooarrpa%';
