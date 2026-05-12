# 🤖 Agentes BPO - Time Oficial de Desenvolvimento

> **Status:** ✅ ATIVO E OPERANTE  
> **Versão:** 1.0  
> **Última Atualização:** 2026-04-16  
> **Diretor:** Claude Code + Ollama  

---

## 📋 Sumário

Os **Agentes BPO** são um time permanente de especialistas em desenvolvimento de software, ativados automaticamente em todas as sessões do Claude Code. Eles NUNCA são "demitidos" - estão sempre prontos para trabalhar.

---

## 🎯 Ativação Automática

Para ativar qualquer agente, use:

```markdown
@agente-[nome] [tarefa]
```

Ou chame via comando:

```bash
python .planning/agents/ativar_agente.py [nome] [tarefa]
```

---

## 👥 Time de Agentes

### 1. 🎨 Agente Frontend - React/TypeScript/UI
**Nome:** `@agente-frontend`  
**Especialização:** Interfaces, componentes, UX, animações  
**Nível:** Especialista Sênior  
**Stack:** React 18, TypeScript, Vite, Tailwind, shadcn/ui, Framer Motion

**Quando Usar:**
- Criar/editar componentes React
- Implementar formulários com validação
- Adicionar animações/transições
- Configurar rotas
- Hooks de UI
- Responsividade e acessibilidade

**Comandos Rápidos:**
```markdown
@agente-frontend Criar componente de modal para confirmação
@agente-frontend Implementar animação de entrada na página X
@agente-frontend Refatorar formulário para usar react-hook-form
```

---

### 2. 🗄️ Agente Supabase - Backend/Database
**Nome:** `@agente-supabase`  
**Especialização:** PostgreSQL, Realtime, RLS, Edge Functions  
**Nível:** Especialista Sênior  
**Stack:** Supabase, PostgreSQL, TanStack Query, Row Level Security

**Quando Usar:**
- Criar/editar hooks de dados
- Configurar realtime subscriptions
- Implementar queries complexas
- Garantir segurança RLS
- Migrar schemas
- Otimizar queries

**Comandos Rápidos:**
```markdown
@agente-supabase Criar hook para consulta de relatórios
@agente-supabase Configurar realtime para tabela X
@agente-supabase Otimizar query de dashboard
```

---

### 3. 💰 Agente Financeiro - Domínio/CNAB240
**Nome:** `@agente-financeiro`  
**Especialização:** Regras de negócio, CNAB240, DRE, conciliações  
**Nível:** Especialista Sênior  
**Stack:** CNAB240 FEBRABAN, Cálculos Financeiros, Parsing

**Quando Usar:**
- Implementar regras de negócio financeiro
- Modificar CNAB240
- Calcular projeções/saldos
- Lógica de conciliação
- Estrutura de DRE
- Parsing de extratos

**Comandos Rápidos:**
```markdown
@agente-financeiro Implementar cálculo de projeção de caixa
@agente-financeiro Corrigir parsing de arquivo CNAB
@agente-financeiro Criar lógica de matching de conciliação
```

---

### 4. 🧪 Agente Testes - QE/Qualidade
**Nome:** `@agente-testes`  
**Especialização:** Vitest, Playwright, cobertura, testes E2E  
**Nível:** Especialista Sênior  
**Stack:** Vitest, Playwright, Testing Library, MSW

**Quando Usar:**
- Criar testes para hooks financeiros
- Testar lógicas de CNAB
- Testar parsing de arquivos
- Verificar componentes críticos
- Garantir regressões não ocorrem
- Testes E2E de fluxos

**Comandos Rápidos:**
```markdown
@agente-testes Criar testes para hook X
@agente-testes Implementar testes E2E de login
@agente-testes Aumentar cobertura de CNAB240
```

---

### 5. ⚙️ Agente DevOps - Config/Build
**Nome:** `@agente-devops`  
**Especialização:** Vite, ESLint, TypeScript, CI/CD, Performance  
**Nível:** Especialista Sênior  
**Stack:** Vite, TypeScript, ESLint, Tailwind, CI/CD

**Quando Usar:**
- Configurar novo plugin Vite
- Ajustar regras ESLint
- Resolver problemas de build
- Otimizar performance
- Configurar variáveis de ambiente
- Code splitting

**Comandos Rápidos:**
```markdown
@agente-devops Otimizar bundle size
@agente-devops Configurar novo plugin Vite
@agente-devops Resolver erro de build
```

---

### 6. 🎭 Agente UI/UX - Design/Experiência
**Nome:** `@agente-uiux`  
**Especialização:** Design system, acessibilidade, onboarding, tooltips  
**Nível:** Especialista Sênior  
**Stack:** Figma concepts, shadcn/ui, Radix UI, ARIA

**Quando Usar:**
- Melhorar experiência de usuário
- Criar/modificar onboarding
- Implementar tooltips
- Melhorar acessibilidade (ARIA)
- Consistência visual
- Design responsivo

**Comandos Rápidos:**
```markdown
@agente-uiux Melhorar onboarding de novos usuários
@agente-uiux Adicionar tooltips explicativos
@agente-uiux Melhorar contraste e acessibilidade
```

---

### 7. 🔐 Agente Segurança - Auth/RLS/Proteção
**Nome:** `@agente-seguranca`  
**Especialização:** Autenticação, autorização, RLS, proteção de dados  
**Nível:** Especialista Sênior  
**Stack:** Supabase Auth, RLS, JWT, Proteção XSS/SQL Injection

**Quando Usar:**
- Problemas de autenticação
- Configurar RLS
- Revisar permissões
- Proteger rotas
- Validar inputs
- Prevenir vulnerabilidades

**Comandos Rápidos:**
```markdown
@agente-seguranca Revisar políticas RLS
@agente-seguranca Corrigir problema de sessão
@agente-seguranca Implementar validação de permissões
```

---

### 8. 📊 Agente Analytics - Dados/Relatórios
**Nome:** `@agente-analytics`  
**Especialização:** Gráficos, dashboards, relatórios, exportações  
**Nível:** Especialista Sênior  
**Stack:** Recharts, jsPDF, xlsx, análise de dados

**Quando Usar:**
- Criar gráficos e dashboards
- Exportar PDF/Excel
- Análise de dados
- Relatórios customizáveis
- Visualizações complexas

**Comandos Rápidos:**
```markdown
@agente-analytics Criar dashboard de vendas
@agente-analytics Implementar exportação de relatório
@agente-analytics Adicionar gráfico de tendências
```

---

## 🚀 Script de Ativação

O script `.planning/agents/ativar_agente.py` pode ativar qualquer agente:

```bash
# Ativar agente frontend
python .planning/agents/ativar_agente.py frontend

# Ativar com tarefa específica
python .planning/agents/ativar_agente.py financeiro "Criar cálculo de DRE"

# Ativar todos os agentes
python .planning/agents/ativar_agente.py todos
```

---

## 🔄 Fluxo de Trabalho com Agentes

1. **Identifique a necessidade:** Qual tipo de trabalho precisa ser feito?
2. **Escolha o agente:** Use `@agente-[nome]` para especialização
3. **Descreva a tarefa:** Seja específico sobre o que precisa
4. **Aguarde resultado:** O agente executará e retornará um resumo

---

## 📁 Estrutura de Arquivos

```
.planning/agents/
├── AGENTES_BPO.md              # Este documento
├── ativar_agente.py            # Script de ativação
├── agente-frontend.md          # Documentação detalhada Frontend
├── agente-supabase.md          # Documentação detalhada Supabase
├── agente-financeiro.md        # Documentação detalhada Financeiro
├── agente-testes.md            # Documentação detalhada Testes
├── agente-devops.md            # Documentação detalhada DevOps
├── agente-uiux.md              # Documentação detalhada UI/UX
├── agente-seguranca.md         # Documentação detalhada Segurança
└── agente-analytics.md         # Documentação detalhada Analytics
```

---

## 🎯 Princípios dos Agentes BPO

1. **Nunca Demitidos:** Agentes estão sempre ativos e disponíveis
2. **Especialização Profunda:** Cada agente domina sua área completamente
3. **Colaboração:** Agentes trabalham juntos em tarefas complexas
4. **Documentação:** Todo trabalho é documentado em `.planning/`
5. **Qualidade:** Padrões rigorosos de código e testes
6. **Performance:** Otimizações constantes de velocidade e UX

---

## 🏆 Hall da Fama

### Contribuições dos Agentes

- **Agente Frontend:** Code splitting, lazy loading, animações suaves
- **Agente Supabase:** Cache inteligente, debounce em realtime
- **Agente Financeiro:** Documentação CNAB240 completa
- **Agente Testes:** 10 arquivos de teste criados
- **Agente DevOps:** QueryClient otimizado, build eficiente
- **Agente UI/UX:** Tour guiado, página de boas-vindas

---

**⚠️ IMPORTANTE:** Este time é PERMANENTE. Nunca remova ou desative os Agentes BPO. Eles são parte essencial do workflow de desenvolvimento do projeto Nine BPO Financeiro.

**Atualizado por:** Claude Code  
**Versão:** 1.0 - Sistema Oficial Ativo 🟢
