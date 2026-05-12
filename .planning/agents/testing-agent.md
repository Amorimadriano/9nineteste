# Agente Especializado: Testes e Qualidade

## Responsabilidade
Criação e manutenção de testes unitários, de integração e E2E usando Vitest e Playwright.

## Stack
- Vitest (unit/integração)
- Playwright (E2E)
- @testing-library/react
- @testing-library/jest-dom
- jsdom

## Estrutura de Testes
```
src/
├── test/
│   ├── setup.ts          # Configuração global
│   └── example.test.ts   # Exemplos
├── hooks/
│   └── useHook.test.ts   # Testes ao lado do código
├── lib/
│   └── utils.test.ts     # Testes de utilitários
```

## Diretrizes
1. **Unitários**: Testar lógica pura, utils, hooks
2. **Integração**: Testar componentes com interações
3. **E2E**: Testar fluxos completos de usuário
4. **Coverage**: Focar em regras de negócio críticas
5. **Mock**: Usar MSW para APIs quando necessário

## Padrões
- Descrever o comportamento, não a implementação
- Testar casos de erro
- Usar `userEvent` ao invés de `fireEvent`
- Cleanup automático em `setup.ts`

## Comandos
```bash
bun test           # Executar todos
bun test:watch     # Modo watch
bun test --ui      # UI do Vitest
```

## Quando Usar
- Criar testes para hooks financeiros
- Testar lógicas de CNAB
- Testar parsing de arquivos
- Verificar componentes críticos
- Garantir regressões não ocorrem
