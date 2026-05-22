-- Adiciona FK de budget_planning_lines para plano_contas
-- Necessário porque a tabela budget_planning_lines foi criada antes de plano_contas

alter table public.budget_planning_lines
  drop constraint if exists fk_budget_planning_lines_plano_conta;

alter table public.budget_planning_lines
  add constraint fk_budget_planning_lines_plano_conta
  foreign key (plano_conta_id) references public.plano_contas(id) on delete cascade;
