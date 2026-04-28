-- Tabela de linhas do planejamento orçamentário
-- Armazena valores mensais por conta do plano de contas

create table if not exists public.budget_planning_lines (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  empresa_id uuid null, -- FK para empresas se existir
  plano_conta_id uuid not null references public.plano_contas(id) on delete cascade,
  fiscal_year integer not null,
  values jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (plano_conta_id, fiscal_year, empresa_id, user_id)
);

-- Índices para performance
 create index if not exists idx_budget_lines_user_year
   on public.budget_planning_lines(user_id, fiscal_year);

 create index if not exists idx_budget_lines_empresa
   on public.budget_planning_lines(empresa_id);

 create index if not exists idx_budget_lines_plano_conta
   on public.budget_planning_lines(plano_conta_id);

-- Política RLS: usuário só vê seus próprios dados
alter table public.budget_planning_lines enable row level security;

create policy "Usuário pode gerenciar próprio orçamento"
  on public.budget_planning_lines
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Função para atualizar updated_at automaticamente
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger para manter updated_at
drop trigger if exists trg_budget_lines_updated_at on public.budget_planning_lines;
create trigger trg_budget_lines_updated_at
  before update on public.budget_planning_lines
  for each row
  execute function public.handle_updated_at();
