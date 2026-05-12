-- Adiciona coluna de status de conciliação à tabela extrato_bancario
alter table public.extrato_bancario
add column if not exists status_conciliacao text default 'pendente'
check (status_conciliacao in ('pendente', 'aguardando_extrato', 'em_conciliacao', 'conciliado', 'divergente'));

-- Índice para performance na nova coluna
create index if not exists idx_extrato_status_conciliacao
on public.extrato_bancario(status_conciliacao);

-- Índice composto para matching eficiente
create index if not exists idx_extrato_matching
on public.extrato_bancario(tipo, valor, data_transacao, conciliado, origem);

-- Comentário documentando os status
comment on column public.extrato_bancario.status_conciliacao is
  'pendente = importado do OFX; aguardando_extrato = espelho de conta a pagar/receber; em_conciliacao = em processo de match; conciliado = confirmado; divergente = sem correspondente';

-- Atualiza registros existentes: sistema + não conciliado = aguardando_extrato
update public.extrato_bancario
set status_conciliacao = 'aguardando_extrato'
where origem = 'sistema' and conciliado = false;

-- Atualiza registros existentes: conciliado = conciliado
update public.extrato_bancario
set status_conciliacao = 'conciliado'
where conciliado = true;
