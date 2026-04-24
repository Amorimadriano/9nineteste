# CLAUDE.md - Nine BPO Financeiro

Este arquivo fornece contexto e instruções para o Claude Code trabalhar neste projeto.

## Visão Geral

Nine BPO Financeiro é um sistema de gestão financeira para empresas de BPO (Business Process Outsourcing) contábil e financeiro. Permite gerenciar múltiplos clientes, fluxos de caixa, conciliações bancárias, DREs e planejamento orçamentário.

## Stack Tecnológico

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** shadcn/ui (Radix UI + Tailwind CSS)
- **Backend:** Supabase (PostgreSQL + Realtime)
- **Query:** TanStack Query (React Query)
- **Forms:** React Hook Form + Zod
- **Testes:** Vitest + Playwright
- **Package Manager:** Bun

## Estrutura de Diretórios

```
src/
├── components/       # Componentes React
│   ├── ui/          # shadcn/ui base components
│   └── conciliacao/ # Componentes específicos
├── pages/           # Páginas/routes
├── hooks/           # Custom React hooks
├── contexts/        # React Contexts
├── lib/             # Utilitários e lógica de negócio
│   └── cnab240/     # Implementação CNAB240
├── integrations/      # Integrações (Supabase, Lovable)
└── test/            # Configuração de testes

.planning/           # Documentação GSD
├── PROJECT.md
├── REQUIREMENTS.md
├── ROADMAP.md
├── STATE.md
└── agents/          # Agentes especializados
```

## Comandos Comuns

```bash
# Desenvolvimento
bun dev              # Inicia dev server

# Build
bun run build        # Build produção
bun run build:dev    # Build development

# Testes
bun test             # Executa testes
bun test:watch       # Testes em watch mode

# Qualidade
bun lint             # ESLint
```

## 🤖 Agentes BPO - Time Oficial

**Status:** 🟢 SEMPRE ATIVO - Nunca desativado  
**Versão:** 2.0 - Sistema Oficial Permanente  
**Diretor:** Claude Code + Ollama

Os Agentes BPO são um time permanente de 8 especialistas que trabalham automaticamente em todas as sessões do Claude Code. Eles NUNCA são "demitidos" - estão sempre prontos para executar tarefas.

### 👥 Time de Agentes (8 Especialistas)

| Agente | Especialidade | ID | Arquivo |
|--------|---------------|-----|---------|
| 🎨 Frontend | React, TypeScript, UI, Animações | `@agente-frontend` | `.planning/agents/agente-frontend.md` |
| 🗄️ Supabase | PostgreSQL, Realtime, RLS | `@agente-supabase` | `.planning/agents/agente-supabase.md` |
| 💰 Financeiro | CNAB240, DRE, Regras de negócio | `@agente-financeiro` | `.planning/agents/agente-financeiro.md` |
| 🧪 Testes | Vitest, Playwright, Qualidade | `@agente-testes` | `.planning/agents/agente-testes.md` |
| ⚙️ DevOps | Vite, Build, Performance | `@agente-devops` | `.planning/agents/agente-devops.md` |
| 🎭 UI/UX | Design, Onboarding, A11y | `@agente-uiux` | `.planning/agents/agente-uiux.md` |
| 🔐 Segurança | Auth, RLS, Proteção | `@agente-seguranca` | `.planning/agents/agente-seguranca.md` |
| 📊 Analytics | Gráficos, Dashboards, PDF/Excel | `@agente-analytics` | `.planning/agents/agente-analytics.md` |

### 🚀 Como Usar os Agentes

Para delegar uma tarefa a um agente específico, use o padrão:

```markdown
@agente-[nome] [descrição da tarefa]
```

**Exemplos:**
```markdown
@agente-frontend Criar componente de modal para confirmação
@agente-supabase Otimizar query do dashboard
@agente-financeiro Implementar cálculo de projeção
@agente-testes Criar testes para hook de autenticação
@agente-uiux Melhorar onboarding de novos usuários
@agente-seguranca Revisar políticas RLS
```

### 📚 Documentação Completa

- **Guia Oficial:** `.planning/agents/AGENTES_BPO.md`
- **Ativação Manual:** `python .planning/agents/ativar_agente.py [nome]`
- **Ativar Todos (Windows):** `.planning/agents/ATIVAR_TODOS.bat`
- **Ativar Todos (Linux/Mac):** `bash .planning/agents/ATIVAR_TODOS.sh`

### ⚡ Ativação Automática

Este sistema é carregado automaticamente em cada sessão do Claude Code. Não é necessário ativar manualmente - os agentes estão sempre disponíveis.

---

## Launcher do Projeto

Use o launcher Python para gerenciar o projeto:

```bash
cd C:\Users\Antonio Amorim\Documents\GitHub
python launcher_ninebpo.py [comando]
```

Comandos: `setup`, `dev`, `build`, `test`, `lint`, `agents`, `status`

## Convenções de Código

1. **Componentes:** PascalCase, exports default
2. **Hooks:** Prefixo `use`, camelCase
3. **Utils:** camelCase, funções puras
4. **Types:** PascalCase, interfaces preferidas
5. **Styles:** Tailwind classes com `cn()` utility

## Regras de Negócio Importantes

- CNAB240 segue layout FEBRABAN 240 posições
- Conciliação faz matching por valor + data
- Categorias: tipo 1 (Receita) ou 2 (Despesa)
- RLS obrigatório em todas as tabelas
- Multi-tenant via `empresa_id`

## Variáveis de Ambiente

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Integração NFS-e (GINFES/Prefeitura SP)

A biblioteca `src/lib/nfs-e/` implementa integração com a API de Nota Fiscal de Serviço Eletrônica da Prefeitura de São Paulo via GINFES, seguindo o layout ABRASF 2.04.

### Estrutura da Biblioteca

```
src/lib/nfs-e/
├── config.ts       # Configurações e URLs da API
├── auth.ts         # Autenticação e certificados digitais
├── xmlBuilder.ts   # Construtor de XML (layout ABRASF 2.04)
├── parser.ts       # Parser de respostas XML
├── client.ts       # Cliente HTTP para API GINFES
├── index.ts        # Exportações principais
```

### Uso Básico

```typescript
import { NFSeClientSP, construirRps, parsearRespostaEmissao } from '@/lib/nfs-e';

// Criar cliente
const client = new NFSeClientSP({ ambiente: 'homologacao' });

// Emitir nota fiscal
const resposta = await client.emitirNota({
  identificacaoRps: { numero: '1234', serie: '1', tipo: 'RPS' },
  dataEmissao: new Date(),
  naturezaOperacao: 1,
  emitente: { cnpj: '00.000.000/0000-00', inscricaoMunicipal: '123456', ... },
  tomador: { cpfCnpj: '111.111.111-11', razaoSocial: 'Cliente Exemplo', ... },
  servico: { valores: { valorServicos: 1000.00 }, itemListaServico: '1.01', ... }
});

// Verificar resultado
if (resposta.sucesso) {
  console.log('Nota emitida:', resposta.numeroNfse);
  console.log('Protocolo:', resposta.protocolo);
}
```

### URLs da API

- **Homologação:** https://homologacao.ginfes.com.br
- **Produção:** https://producao.ginfes.com.br

### Operações Disponíveis

- `emitirNota(dadosNota)` - Emissão síncrona
- `emitirLoteRps(notas, numeroLote, emitente)` - Emissão em lote
- `consultarNota(numeroRps, serie, emitente)` - Consulta por RPS
- `consultarLoteRps(protocolo, emitente)` - Consulta status de lote
- `cancelarNota(numeroNfse, emitente, codigoCancelamento)` - Cancelamento
- `downloadPDF(link)` / `downloadXML(link)` - Downloads

### Variáveis de Ambiente NFS-e

```
VITE_NFSE_AMBIENTE=homologacao|producao
VITE_NFSE_CERTIFICADO_PATH=
VITE_NFSE_CERTIFICADO_SENHA=
```

## Links Úteis

- shadcn/ui: https://ui.shadcn.com
- Supabase: https://supabase.com/docs
- TanStack Query: https://tanstack.com/query
- React Router: https://reactrouter.com
- GINFES: https://www.ginfes.com.br
