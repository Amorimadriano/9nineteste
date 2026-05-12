-- Corrige recursão infinita na política RLS de usuario_empresas
-- A política anterior consultava a própria tabela dentro do USING/WITH CHECK,
-- causando "infinite recursion detected in policy for relation usuario_empresas"

-- Remove a política recursiva
DROP POLICY IF EXISTS "Admin pode gerenciar vínculos de suas empresas" ON public.usuario_empresas;

-- Política simples: usuário vê seus próprios vínculos
DROP POLICY IF EXISTS "Usuário pode ver seus vínculos" ON public.usuario_empresas;
CREATE POLICY "Usuário pode ver seus vínculos"
  ON public.usuario_empresas
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Política simples: usuário insere seus próprios vínculos
DROP POLICY IF EXISTS "Usuário pode inserir seus vínculos" ON public.usuario_empresas;
CREATE POLICY "Usuário pode inserir seus vínculos"
  ON public.usuario_empresas
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Política simples: usuário atualiza seus próprios vínculos
DROP POLICY IF EXISTS "Usuário pode atualizar seus vínculos" ON public.usuario_empresas;
CREATE POLICY "Usuário pode atualizar seus vínculos"
  ON public.usuario_empresas
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Política simples: usuário remove seus próprios vínculos
DROP POLICY IF EXISTS "Usuário pode remover seus vínculos" ON public.usuario_empresas;
CREATE POLICY "Usuário pode remover seus vínculos"
  ON public.usuario_empresas
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
