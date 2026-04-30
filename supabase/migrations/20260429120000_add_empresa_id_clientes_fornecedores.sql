-- Adiciona coluna empresa_id em clientes e fornecedores
-- Necessário para integração com multi-tenant via useSupabaseQuery
-- e para evitar erro ao salvar quando empresa está selecionada

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL;

ALTER TABLE public.fornecedores
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL;

-- Atualiza políticas RLS: mantém apenas user_id para evitar recursão infinita
-- com a tabela usuario_empresas. O filtro por empresa é feito na aplicação.
DROP POLICY IF EXISTS "Users manage own clientes" ON public.clientes;
CREATE POLICY "Users manage own clientes"
  ON public.clientes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own fornecedores" ON public.fornecedores;
CREATE POLICY "Users manage own fornecedores"
  ON public.fornecedores
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON public.clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_empresa ON public.fornecedores(empresa_id);
