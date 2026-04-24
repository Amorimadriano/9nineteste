
## 🔐 Auditoria Completa — Nível SaaS Real

### 1. Tabela de Logs de Auditoria
- Criar tabela `audit_logs` com: usuário, ação (criar/editar/excluir), tabela afetada, registro afetado, dados anteriores, dados novos, IP, timestamp
- RLS para que cada usuário veja apenas seus próprios logs

### 2. Triggers Automáticos no Banco
- Criar função PL/pgSQL que registra automaticamente INSERT, UPDATE e DELETE em todas as tabelas financeiras:
  - `contas_pagar`, `contas_receber`, `lancamentos_caixa`, `categorias`, `clientes`, `fornecedores`, `bancos_cartoes`, `extrato_bancario`, `empresa`, `fechamentos_mensais`, `metas_orcamentarias`
- Armazena snapshot dos dados antes e depois da alteração (JSON)

### 3. Página de Auditoria no Sistema
- Nova página `/auditoria` com:
  - Filtros por data, tipo de ação, tabela, usuário
  - Tabela com histórico completo de alterações
  - Badge colorido por tipo de ação (criação=verde, edição=azul, exclusão=vermelho)
  - Detalhes expandíveis mostrando o que mudou (antes vs depois)

### 4. Menu Lateral
- Adicionar link "Auditoria" no sidebar com ícone de escudo/log
