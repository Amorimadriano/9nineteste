UPDATE public.empresas
SET logo_url = REPLACE(logo_url, 'rjcruiwlurqdwooarrpa.supabase.co', 'gcmxhuadibdrumvqdrkc.supabase.co')
WHERE logo_url LIKE '%rjcruiwlurqdwooarrpa.supabase.co%';

-- Adicionar outras tabelas conforme necessário
-- UPDATE public.anexos SET url = REPLACE(url, 'rjcruiwlurqdwooarrpa.supabase.co', 'gcmxhuadibdrumvqdrkc.supabase.co') WHERE url LIKE '%rjcruiwlurqdwooarrpa.supabase.co%';
-- UPDATE public.certificados_nfse SET arquivo_pfx = REPLACE(arquivo_pfx, 'rjcruiwlurqdwooarrpa.supabase.co', 'gcmxhuadibdrumvqdrkc.supabase.co') WHERE arquivo_pfx LIKE '%rjcruiwlurqdwooarrpa.supabase.co%';
