---
name: Agentes BPO - Time Oficial de Desenvolvimento
description: Time permanente de 8 agentes especializados que trabalham automaticamente no projeto
type: reference
---

# 🤖 Agentes BPO - Time Oficial

## Status: 🟢 SEMPRE ATIVO

**Versão:** 2.0 - Sistema Oficial Permanente  
**Criado:** 2026-04-16  
**Diretor:** Claude Code + Ollama  

## Visão Geral

Os **Agentes BPO** são um time permanente de 8 especialistas que trabalhamautomaticamente em todas as sessões do Claude Code. Eles **NUNCA sãodemitidos** - estão sempre prontos para executar tarefas.

## Time de Agentes (8 Especialistas)

| ID | Nome | Especialidade |
|----|------|---------------|
| `@agente-frontend` | Frontend React/TS | Interfaces, Componentes, Animações |
| `@agente-supabase` | Supabase | PostgreSQL, Realtime, RLS |
| `@agente-financeiro` | Financeiro/CNAB240 | DRE, Conciliação, Regras de negócio |
| `@agente-testes` | Testes/QE | Vitest, Playwright, Cobertura |
| `@agente-devops` | DevOps/Config | Vite, Build, Performance |
| `@agente-uiux` | UI/UX | Design, Onboarding, Acessibilidade |
| `@agente-seguranca` | Segurança | Auth, RLS, Proteção |
| `@agente-analytics` | Analytics | Gráficos, Dashboards, PDF/Excel |

## Como Usar

Para atribuir uma tarefa a um agente:

```markdown
@agente-[nome] [descricao da tarefa]
```

### Exemplos

```markdown
@agente-frontend Criar componente de modal para confirmação
@agente-supabase Otimizar query do dashboard
@agente-financeiro Implementar cálculo de projeção de caixa
@agente-testes Criar testes para hook de autenticação
@agente-uiux Melhorar onboarding de novos usuários
@agente-seguranca Revisar políticas RLS
```

## Documentação Completa

- **Guia Oficial:** `.planning/agents/AGENTES_BPO.md`
- **Documentação Frontend:** `.planning/agents/agente-frontend.md`
- **Documentação Supabase:** `.planning/agents/agente-supabase.md`
- **Documentação Financeiro:** `.planning/agents/agente-financeiro.md`
- **Documentação Testes:** `.planning/agents/agente-testes.md`
- **Documentação DevOps:** `.planning/agents/agente-devops.md`
- **Documentação UI/UX:** `.planning/agents/agente-uiux.md`
- **Documentação Segurança:** `.planning/agents/agente-seguranca.md`
- **Documentação Analytics:** `.planning/agents/agente-analytics.md`

## Scripts de Ativação

### Ativar Todos (Windows)
```bash
.planning/agents/ATIVAR_TODOS.bat
```

### Ativar Todos (Linux/Mac)
```bash
bash .planning/agents/ATIVAR_TODOS.sh
```

### Ativar Individualmente
```bash
python .planning/agents/ativar_agente.py [nome]
python .planning/agents/ativar_agente.py frontend
```

## Princípios Fundamentais

1. **Nunca Demitidos:** Agentes estão sempre ativos e disponíveis
2. **Especialização Profunda:** Cada agente domina sua área completamente
3. **Colaboração:** Agentes trabalham juntos em tarefas complexas
4. **Documentação:** Todo trabalho é documentado em `.planning/`
5. **Qualidade:** Padrões rigorosos de código e testes
6. **Performance:** Otimizações constantes de velocidade e UX

## Atualizações

- **v2.0 (2026-04-16):** Sistema oficial permanente criado com 8 agentes
- **v1.0 (2026-04-16):** Versão inicial com 5 agentes

## Notas Importantes

- Os agentes são carregados automaticamente em cada sessão do Claude Code
- Não é necessário ativar manualmente - estão sempre disponíveis
- Use `@agente-[nome]` para delegar tarefas específicas
- Cada agente tem documentação detalhada em seu arquivo `.md`
- O time pode ser expandido com novos agentes especializados conforme necessário

## Contato do Time

Para sugerir melhorias no time de agentes ou adicionar novos especialistas, consulte o arquivo `.planning/agents/AGENTES_BPO.md`.

---

**Agentes BPO - Sempre Ativos, Sempre Prontos** ⚡
