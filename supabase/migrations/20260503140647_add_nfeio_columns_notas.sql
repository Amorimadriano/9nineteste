-- Adiciona colunas NFE.io à tabela notas_fiscais_servico
ALTER TABLE notas_fiscais_servico
  ADD COLUMN IF NOT EXISTS nfeio_id TEXT,
  ADD COLUMN IF NOT EXISTS nfeio_status TEXT;
