-- Adiciona colunas CNAE e natureza jurídica em clientes e fornecedores
-- preserva dados retornados pela consulta de CNPJ

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS cnae TEXT,
  ADD COLUMN IF NOT EXISTS natureza_juridica TEXT;

ALTER TABLE public.fornecedores
  ADD COLUMN IF NOT EXISTS cnae TEXT,
  ADD COLUMN IF NOT EXISTS natureza_juridica TEXT;
