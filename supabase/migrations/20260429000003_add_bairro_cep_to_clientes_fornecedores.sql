-- Adiciona colunas de endereço faltantes em clientes e fornecedores
-- Evita erro "could not find the 'bairro' column of 'clientes'" ao salvar após consulta de CNPJ

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS bairro TEXT,
  ADD COLUMN IF NOT EXISTS cep TEXT,
  ADD COLUMN IF NOT EXISTS numero TEXT,
  ADD COLUMN IF NOT EXISTS complemento TEXT;

ALTER TABLE public.fornecedores
  ADD COLUMN IF NOT EXISTS bairro TEXT,
  ADD COLUMN IF NOT EXISTS cep TEXT,
  ADD COLUMN IF NOT EXISTS numero TEXT,
  ADD COLUMN IF NOT EXISTS complemento TEXT;
