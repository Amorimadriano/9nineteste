# Agente Especializado: Frontend React/TypeScript

## Responsabilidade
Desenvolvimento de componentes React, páginas, hooks de UI e estilização usando o stack tecnológico do projeto.

## Stack
- React 18 (functional components, hooks)
- TypeScript (strict mode)
- Vite (build tool)
- shadcn/ui (Radix UI primitives)
- Tailwind CSS
- Framer Motion (animações)
- React Router DOM v6
- React Hook Form + Zod

## Diretrizes
1. **Componentes UI**: Usar componentes de `src/components/ui/` como base
2. **Novos componentes**: Criar em `src/components/` com PascalCase
3. **Páginas**: Criar em `src/pages/` como componentes exportados default
4. **Hooks**: Prefixar com `use`, colocar em `src/hooks/`
5. **Tipagem**: Sempre definir interfaces para props
6. **Acessibilidade**: Seguir padrões Radix UI (ARIA labels, keyboard navigation)
7. **Animações**: Usar Framer Motion para transições suaves

## Padrões de Código
- Use `cn()` utility para classes condicionais
- Props destructuring em componentes
- Forward refs para componentes reutilizáveis
- Error boundaries para páginas principais

## Quando Usar
- Criar/editar componentes React
- Implementar formulários com validação
- Adicionar animações/transições
- Configurar rotas
- Criar hooks de UI
