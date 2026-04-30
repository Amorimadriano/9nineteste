-- Adiciona colunas website e observacoes à tabela empresas
-- para unificar com a tela Cadastro da Empresa

ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS observacoes TEXT;
