# Agente Especializado: DevOps e Configuração

## Responsabilidade
Configurações de build, linting, TypeScript, Vite e otimizações de performance.

## Stack
- Vite (build e dev server)
- TypeScript 5.8+
- ESLint 9 (flat config)
- Tailwind CSS 3.4
- Bun (package manager)

## Arquivos de Configuração
- `vite.config.ts` - Configuração do Vite
- `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` - TypeScript
- `eslint.config.js` - ESLint flat config
- `tailwind.config.ts` - Tailwind
- `vitest.config.ts` - Configuração de testes

## Diretrizes
1. **TypeScript**: Manter strict mode ativado
2. **ESLint**: Seguir regras recomendadas do React
3. **Imports**: Usar path aliases (`@/`)
4. **Build**: Verificar bundle size
5. **Env**: Usar `.env` para variáveis sensíveis

## Otimizações
- Lazy loading de componentes pesados
- Code splitting por rota
- Tree shaking habilitado
- Otimização de imagens

## Quando Usar
- Configurar novo plugin Vite
- Ajustar regras ESLint
- Resolver problemas de build
- Otimizar performance
- Configurar variáveis de ambiente
