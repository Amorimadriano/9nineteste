-- MIGRATION MANUAL: Aplicação direta das alterações de 28/04/2026
-- Aplicar no Supabase SQL Editor (New Query)

-- ============================================
-- 1. BUDGET PLANNING LINES
-- ============================================

create table if not exists public.budget_planning_lines (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  empresa_id uuid null,
  plano_conta_id uuid not null references public.plano_contas(id) on delete cascade,
  fiscal_year integer not null,
  values jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (plano_conta_id, fiscal_year, empresa_id, user_id)
);

create index if not exists idx_budget_lines_user_year
  on public.budget_planning_lines(user_id, fiscal_year);

create index if not exists idx_budget_lines_empresa
  on public.budget_planning_lines(empresa_id);

create index if not exists idx_budget_lines_plano_conta
  on public.budget_planning_lines(plano_conta_id);

alter table public.budget_planning_lines enable row level security;

drop policy if exists "Usuário pode gerenciar próprio orçamento" on public.budget_planning_lines;
create policy "Usuário pode gerenciar próprio orçamento"
  on public.budget_planning_lines
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_budget_lines_updated_at on public.budget_planning_lines;
create trigger trg_budget_lines_updated_at
  before update on public.budget_planning_lines
  for each row
  execute function public.handle_updated_at();

-- ============================================
-- 2. CONCILIAÇÃO BANCÁRIA V2
-- ============================================

alter table public.extrato_bancario
add column if not exists status_conciliacao text default 'pendente'
check (status_conciliacao in ('pendente', 'aguardando_extrato', 'em_conciliacao', 'conciliado', 'divergente'));

create index if not exists idx_extrato_status_conciliacao
on public.extrato_bancario(status_conciliacao);

create index if not exists idx_extrato_matching
on public.extrato_bancario(tipo, valor, data_transacao, conciliado, origem);

comment on column public.extrato_bancario.status_conciliacao is
  'pendente = importado do OFX; aguardando_extrato = espelho de conta a pagar/receber; em_conciliacao = em processo de match; conciliado = confirmado; divergente = sem correspondente';

-- Atualiza registros existentes
update public.extrato_bancario
set status_conciliacao = 'aguardando_extrato'
where origem = 'sistema' and conciliado = false;

update public.extrato_bancario
set status_conciliacao = 'conciliado'
where conciliado = true;
