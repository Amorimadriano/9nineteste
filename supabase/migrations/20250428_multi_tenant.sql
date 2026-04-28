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

-- 3. MIGRAÇÃO DE DADOS EXISTENTES (empresa singular → empresas plural)
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

-- Vincular usuários existentes às empresas migradas
insert into public.usuario_empresas (user_id, empresa_id, role)
select
  e.user_id,
  ep.id,
  'admin'
from public.empresa e
join public.empresas ep on ep.cnpj = e.cnpj
on conflict (user_id, empresa_id) do nothing;

-- 4. ADICIONAR empresa_id EM TODAS AS TABELAS DE DADOS
-- (exceto empresas, usuario_empresas, empresa — já têm sua própria estrutura)

alter table public.contas_pagar add column if not exists empresa_id uuid references public.empresas(id) on delete set null;
alter table public.contas_receber add column if not exists empresa_id uuid references public.empresas(id) on delete set null;
alter table public.lancamentos_caixa add column if not exists empresa_id uuid references public.empresas(id) on delete set null;
alter table public.extrato_bancario add column if not exists empresa_id uuid references public.empresas(id) on delete set null;
alter table public.categorias add column if not exists empresa_id uuid references public.empresas(id) on delete set null;
alter table public.bancos_cartoes add column if not exists empresa_id uuid references public.empresas(id) on delete set null;
alter table public.clientes add column if not exists empresa_id uuid references public.empresas(id) on delete set null;
alter table public.fornecedores add column if not exists empresa_id uuid references public.empresas(id) on delete set null;
alter table public.transferencias_contas add column if not exists empresa_id uuid references public.empresas(id) on delete set null;
alter table public.metas_orcamentarias add column if not exists empresa_id uuid references public.empresas(id) on delete set null;
alter table public.fechamentos_mensais add column if not exists empresa_id uuid references public.empresas(id) on delete set null;
alter table public.regua_cobranca add column if not exists empresa_id uuid references public.empresas(id) on delete set null;
alter table public.cobranca_historico add column if not exists empresa_id uuid references public.empresas(id) on delete set null;
alter table public.plano_contas add column if not exists empresa_id uuid references public.empresas(id) on delete set null;
alter table public.budget_planning_lines add column if not exists empresa_id uuid references public.empresas(id) on delete set null;

-- Tabelas de cartões (se existirem)
do $$
begin
  if exists (select from information_schema.tables where table_name = 'card_transacoes_brutas') then
    execute 'alter table public.card_transacoes_brutas add column if not exists empresa_id uuid references public.empresas(id) on delete set null';
  end if;
  if exists (select from information_schema.tables where table_name = 'auditoria_transacoes_cartao') then
    execute 'alter table public.auditoria_transacoes_cartao add column if not exists empresa_id uuid references public.empresas(id) on delete set null';
  end if;
  if exists (select from information_schema.tables where table_name = 'configuracoes_cartao') then
    execute 'alter table public.configuracoes_cartao add column if not exists empresa_id uuid references public.empresas(id) on delete set null';
  end if;
end $$;

-- 5. ÍNDICES COMPOSTOS (user_id, empresa_id) para performance
create index if not exists idx_contas_pagar_user_empresa on public.contas_pagar(user_id, empresa_id);
create index if not exists idx_contas_receber_user_empresa on public.contas_receber(user_id, empresa_id);
create index if not exists idx_lancamentos_caixa_user_empresa on public.lancamentos_caixa(user_id, empresa_id);
create index if not exists idx_extrato_bancario_user_empresa on public.extrato_bancario(user_id, empresa_id);
create index if not exists idx_categorias_user_empresa on public.categorias(user_id, empresa_id);
create index if not exists idx_bancos_cartoes_user_empresa on public.bancos_cartoes(user_id, empresa_id);
create index if not exists idx_clientes_user_empresa on public.clientes(user_id, empresa_id);
create index if not exists idx_fornecedores_user_empresa on public.fornecedores(user_id, empresa_id);
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
