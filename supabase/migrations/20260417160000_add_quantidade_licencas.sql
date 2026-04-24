
-- Migration: Adicionar campo quantidade_licencas na tabela licencas_software
-- Data: 2026-04-17
-- Descrição: Permite definir quantidade de licenças vendidas para escritórios/BPOs

-- Adicionar coluna quantidade_licencas se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'licencas_software'
        AND column_name = 'quantidade_licencas'
    ) THEN
        ALTER TABLE public.licencas_software
        ADD COLUMN quantidade_licencas INTEGER NOT NULL DEFAULT 1;
    END IF;
END $$;

-- Comentário para documentação
COMMENT ON COLUMN public.licencas_software.quantidade_licencas IS 'Quantidade de licenças vendidas para o cliente (útil para escritórios e BPOs com múltiplas unidades)';

-- Verificar instalação
SELECT
    'Coluna quantidade_licencas adicionada:' as info,
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'licencas_software'
        AND column_name = 'quantidade_licencas'
    ) as installed;
