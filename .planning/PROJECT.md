# Nine BPO Financeiro - Project Document

## Overview
Sistema completo de gestão financeira para BPO (Business Process Outsourcing) financeiro. Permite empresas de contabilidade e gestão financeira terceirizada gerenciarem múltiplos clientes, fluxos de caixa, conciliações bancárias e cartões, DREs e planejamento orçamentário.

## Tech Stack
- **Frontend:** React 18 + TypeScript + Vite
- **UI Framework:** shadcn/ui (Radix UI primitives + Tailwind CSS)
- **Backend/Database:** Supabase (PostgreSQL + Realtime)
- **State Management:** TanStack Query (React Query)
- **Forms:** React Hook Form + Zod validation
- **Routing:** React Router DOM v6
- **Charts:** Recharts
- **PDF Generation:** jsPDF + pdfjs-dist
- **Excel:** xlsx library
- **Animations:** Framer Motion
- **Testing:** Vitest + Playwright
- **Package Manager:** Bun (com fallback npm)

## Core Features
1. **Fluxo de Caixa** - Entradas e saídas por conta bancária
2. **Conciliação Bancária** - Importação de extratos OFX, CSV, PDF
3. **Conciliação de Cartões** - Importação de extratos de cartão de crédito
4. **DRE** - Demonstração de Resultados do Exercício
5. **Planejamento Orçamentário** - Metas e projeções
6. **CNAB240** - Remessa e retorno bancário brasileiro
7. **Gestão de Clientes e Fornecedores**
8. **Categorias Financeiras** - Receitas e despesas categorizadas
9. **Multi-tenant** - Suporte a múltiplas empresas/clientes
10. **Licenciamento** - Sistema de trial e assinatura

## Architecture Patterns
- Componentes compostos com shadcn/ui
- Hooks customizados para regras de negócio
- Context API para autenticação e estado global
- Real-time subscriptions para atualizações em tempo real
- Supabase RLS para segurança multi-tenant

## Key Directories
```
src/
├── components/       # Componentes React (UI + específicos)
│   ├── ui/          # Componentes shadcn/ui base
│   └── conciliacao/ # Componentes específicos de conciliação
├── pages/           # Páginas/rotas da aplicação
├── hooks/           # Custom React hooks
├── contexts/        # React Contexts (Auth, etc)
├── lib/             # Utilitários, APIs, CNAB240
├── integrations/    # Integrações externas (Supabase, Lovable)
└── test/            # Configuração de testes
```

## External Integrations
- Supabase Auth e Database
- Lovable Cloud Auth
- APIs de CNPJ (consulta de empresas)
- Bancos brasileiros via CNAB240

## Development Guidelines
- Use TypeScript strict mode
- Componentes devem ser acessíveis (Radix UI patterns)
- Formulários sempre com Zod validation
- Queries sempre com TanStack Query
- Testes para lógicas complexas
