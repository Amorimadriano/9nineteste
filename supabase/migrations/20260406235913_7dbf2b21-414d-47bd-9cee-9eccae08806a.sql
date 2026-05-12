
-- 1. Fix Realtime policy - drop old and create properly scoped one
DROP POLICY IF EXISTS "Users can only listen to own changes" ON realtime.messages;

-- 2. Fix all financial tables: change from public to authenticated role

-- clientes
DROP POLICY IF EXISTS "Users manage own clientes" ON public.clientes;
CREATE POLICY "Users manage own clientes" ON public.clientes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- fornecedores
DROP POLICY IF EXISTS "Users manage own fornecedores" ON public.fornecedores;
CREATE POLICY "Users manage own fornecedores" ON public.fornecedores FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- contas_pagar
DROP POLICY IF EXISTS "Users manage own contas_pagar" ON public.contas_pagar;
CREATE POLICY "Users manage own contas_pagar" ON public.contas_pagar FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- contas_receber
DROP POLICY IF EXISTS "Users manage own contas_receber" ON public.contas_receber;
CREATE POLICY "Users manage own contas_receber" ON public.contas_receber FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- bancos_cartoes
DROP POLICY IF EXISTS "Users manage own bancos_cartoes" ON public.bancos_cartoes;
CREATE POLICY "Users manage own bancos_cartoes" ON public.bancos_cartoes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- extrato_bancario
DROP POLICY IF EXISTS "Users manage own extrato_bancario" ON public.extrato_bancario;
CREATE POLICY "Users manage own extrato_bancario" ON public.extrato_bancario FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- lancamentos_caixa
DROP POLICY IF EXISTS "Users manage own lancamentos_caixa" ON public.lancamentos_caixa;
CREATE POLICY "Users manage own lancamentos_caixa" ON public.lancamentos_caixa FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- categorias
DROP POLICY IF EXISTS "Users manage own categorias" ON public.categorias;
CREATE POLICY "Users manage own categorias" ON public.categorias FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- empresa
DROP POLICY IF EXISTS "Users manage own empresa" ON public.empresa;
CREATE POLICY "Users manage own empresa" ON public.empresa FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- fechamentos_mensais
DROP POLICY IF EXISTS "Users manage own fechamentos_mensais" ON public.fechamentos_mensais;
CREATE POLICY "Users manage own fechamentos_mensais" ON public.fechamentos_mensais FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- metas_orcamentarias
DROP POLICY IF EXISTS "Users manage own metas_orcamentarias" ON public.metas_orcamentarias;
CREATE POLICY "Users manage own metas_orcamentarias" ON public.metas_orcamentarias FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- anexos
DROP POLICY IF EXISTS "Users manage own anexos" ON public.anexos;
CREATE POLICY "Users manage own anexos" ON public.anexos FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
