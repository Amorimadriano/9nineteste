-- Migration: Fix notas_fiscais_servico columns to match code expectations
-- Date: 2026-04-23 12:00:00
-- Problem: Code expects columns cliente_nome, servico_codigo, cnae, codigo_tributacao
--          but table has cliente_razao_social, servico_item_lista_servico, servico_cnae, servico_codigo_tributacao

-- 1. Add missing columns with the names the code expects
ALTER TABLE public.notas_fiscais_servico
ADD COLUMN IF NOT EXISTS cliente_nome TEXT;

ALTER TABLE public.notas_fiscais_servico
ADD COLUMN IF NOT EXISTS servico_codigo TEXT;

ALTER TABLE public.notas_fiscais_servico
ADD COLUMN IF NOT EXISTS cnae TEXT;

ALTER TABLE public.notas_fiscais_servico
ADD COLUMN IF NOT EXISTS codigo_tributacao TEXT;

-- 2. Create trigger function to sync new columns with existing ones
CREATE OR REPLACE FUNCTION public.sync_notas_fiscais_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync cliente_nome from cliente_razao_social (if cliente_nome is NULL or being set)
  IF NEW.cliente_nome IS NULL AND NEW.cliente_razao_social IS NOT NULL THEN
    NEW.cliente_nome := NEW.cliente_razao_social;
  END IF;
  
  -- Sync servico_codigo from servico_item_lista_servico
  IF NEW.servico_codigo IS NULL AND NEW.servico_item_lista_servico IS NOT NULL THEN
    NEW.servico_codigo := NEW.servico_item_lista_servico;
  END IF;
  
  -- Sync cnae from servico_cnae
  IF NEW.cnae IS NULL AND NEW.servico_cnae IS NOT NULL THEN
    NEW.cnae := NEW.servico_cnae;
  END IF;
  
  -- Sync codigo_tributacao from servico_codigo_tributacao
  IF NEW.codigo_tributacao IS NULL AND NEW.servico_codigo_tributacao IS NOT NULL THEN
    NEW.codigo_tributacao := NEW.servico_codigo_tributacao;
  END IF;
  
  -- Also sync in the reverse direction (for UPDATE on source columns)
  IF NEW.cliente_razao_social IS NULL AND NEW.cliente_nome IS NOT NULL THEN
    NEW.cliente_razao_social := NEW.cliente_nome;
  END IF;
  
  IF NEW.servico_item_lista_servico IS NULL AND NEW.servico_codigo IS NOT NULL THEN
    NEW.servico_item_lista_servico := NEW.servico_codigo;
  END IF;
  
  IF NEW.servico_cnae IS NULL AND NEW.cnae IS NOT NULL THEN
    NEW.servico_cnae := NEW.cnae;
  END IF;
  
  IF NEW.servico_codigo_tributacao IS NULL AND NEW.codigo_tributacao IS NOT NULL THEN
    NEW.servico_codigo_tributacao := NEW.codigo_tributacao;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger for INSERT and UPDATE
DROP TRIGGER IF EXISTS sync_notas_fiscais_columns_trigger ON public.notas_fiscais_servico;
CREATE TRIGGER sync_notas_fiscais_columns_trigger
  BEFORE INSERT OR UPDATE ON public.notas_fiscais_servico
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_notas_fiscais_columns();

-- 4. Backfill existing rows (optional - for data that was inserted before the trigger existed)
UPDATE public.notas_fiscais_servico
SET 
  cliente_nome = cliente_razao_social,
  servico_codigo = servico_item_lista_servico,
  cnae = servico_cnae,
  codigo_tributacao = servico_codigo_tributacao
WHERE cliente_nome IS NULL;
