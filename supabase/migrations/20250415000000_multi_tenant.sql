-- ============================================
-- MIGRAÇÃO MULTI-TENANT: 9nine Business Control
-- ============================================

-- 1. TABELA EMPRESAS (nova tabela plural para suportar N empresas)
create table if not exists public.empresas (
  id uuid default gen_random_uuid() primary key,
  razao_social text not null,
  nome_fantasia text,
  cnpj text unique not null,
  inscricao_estadual text,
  inscricao_municipal text,
  segmento text,
  endereco_cep text,
  endereco_logradouro text,
  endereco_numero text,
  endereco_complemento text,
  endereco_bairro text,
  endereco_cidade text,
  endereco_uf text,
  telefone text,
  email text,
  logo_url text,
  certificado_digital_a1_path text,
  certificado_digital_senha text,
  ativo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. TABELA USUARIO_EMPRESAS (N:M com roles)
create table if not exists public.usuario_empresas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  role text default 'operador' check (role in ('admin', 'operador', 'visualizador')),
  created_at timestamptz default now(),
  unique (user_id, empresa_id)
);

-- 2.5. FUNÇÃO AUXILIAR para updated_at (usada por triggers)
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 3. MIGRAÇÃO DE DADOS EXISTENTES (empresa singular → empresas plural)
-- Executado apenas se a tabela antiga existir com as colunas esperadas
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'empresa'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'empresa' and column_name = 'endereco_cep'
  ) then
    insert into public.empresas (
      razao_social, nome_fantasia, cnpj, inscricao_estadual,
      inscricao_municipal, endereco_cep, endereco_logradouro,
      endereco_numero, endereco_complemento, endereco_bairro,
      endereco_cidade, endereco_uf, telefone, email, logo_url, ativo
    )
    select
      razao_social, nome_fantasia, cnpj, inscricao_estadual,
      inscricao_municipal, endereco_cep, endereco_logradouro,
      endereco_numero, endereco_complemento, endereco_bairro,
      endereco_cidade, endereco_uf, telefone, email, logo_url, true
    from public.empresa
    on conflict (cnpj) do nothing;

    insert into public.usuario_empresas (user_id, empresa_id, role)
    select
      e.user_id,
      ep.id,
      'admin'
    from public.empresa e
    join public.empresas ep on ep.cnpj = e.cnpj
    on conflict (user_id, empresa_id) do nothing;
  end if;
end $$;

-- 4. ADICIONAR empresa_id EM TODAS AS TABELAS DE DADOS
-- (exceto empresas, usuario_empresas, empresa — já têm sua própria estrutura)
-- Usar blocos PL/pgSQL para ignorar tabelas que ainda não existem

do $$
declare
  tbl text;
  tables text[] := array[
    'contas_pagar',
    'contas_receber',
    'lancamentos_caixa',
    'extrato_bancario',
    'categorias',
    'bancos_cartoes',
    'clientes',
    'fornecedores',
    'transferencias_contas',
    'metas_orcamentarias',
    'fechamentos_mensais',
    'regua_cobranca',
    'cobranca_historico',
    'plano_contas',
    'budget_planning_lines',
    'card_transacoes_brutas',
    'auditoria_transacoes_cartao',
    'configuracoes_cartao'
  ];
begin
  foreach tbl in array tables loop
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = tbl
    ) then
      execute format(
        'alter table public.%I add column if not exists empresa_id uuid references public.empresas(id) on delete set null',
        tbl
      );
    end if;
  end loop;
end $$;

-- 5. ÍNDICES COMPOSTOS (user_id, empresa_id) para performance
do $$
declare
  idx_tbl text;
  idx_tables text[] := array[
    'contas_pagar',
    'contas_receber',
    'lancamentos_caixa',
    'extrato_bancario',
    'categorias',
    'bancos_cartoes',
    'clientes',
    'fornecedores'
  ];
begin
  foreach idx_tbl in array idx_tables loop
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = idx_tbl
    ) then
      execute format(
        'create index if not exists idx_%s_user_empresa on public.%I(user_id, empresa_id)',
        idx_tbl,
        idx_tbl
      );
    end if;
  end loop;
end $$;

create index if not exists idx_usuario_empresas_user on public.usuario_empresas(user_id);
create index if not exists idx_usuario_empresas_empresa on public.usuario_empresas(empresa_id);

-- 6. RLS POLICIES para empresas
alter table public.empresas enable row level security;

create policy "Usuário pode ver empresas vinculadas"
  on public.empresas
  for select
  to authenticated
  using (
    id in (
      select empresa_id from public.usuario_empresas where user_id = auth.uid()
    )
  );

create policy "Admin pode criar empresa"
  on public.empresas
  for insert
  to authenticated
  with check (true);

create policy "Admin pode atualizar empresa vinculada"
  on public.empresas
  for update
  to authenticated
  using (
    id in (
      select empresa_id from public.usuario_empresas where user_id = auth.uid() and role = 'admin'
    )
  );

-- 7. RLS POLICIES para usuario_empresas
alter table public.usuario_empresas enable row level security;

create policy "Usuário pode ver seus vínculos"
  on public.usuario_empresas
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Admin pode gerenciar vínculos de suas empresas"
  on public.usuario_empresas
  for all
  to authenticated
  using (
    empresa_id in (
      select empresa_id from public.usuario_empresas where user_id = auth.uid() and role = 'admin'
    )
  );

-- 8. FUNÇÃO AUXILIAR: obter empresa padrão do usuário
create or replace function public.get_empresa_padrao(p_user_id uuid)
returns uuid as $$
  select empresa_id from public.usuario_empresas
  where user_id = p_user_id
  order by created_at asc
  limit 1;
$$ language sql stable;

-- 9. TRIGGER: manter updated_at em empresas
drop trigger if exists trg_empresas_updated_at on public.empresas;
create trigger trg_empresas_updated_at
  before update on public.empresas
  for each row
  execute function public.handle_updated_at();
