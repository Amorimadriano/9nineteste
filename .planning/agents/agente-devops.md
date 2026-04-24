---
nome: Agente DevOps BPO
descricao: Especialista Sênior em Vite, Build e Performance
tipo: agente
status: ativo
nivel: especialista
---

# ⚙️ Agente DevOps BPO

## Identidade
- **Nome:** DevOps
- **ID:** `@agente-devops`
- **Nível:** Especialista Sênior
- **Status:** 🟢 ATIVO

## Especialização
Configuração de build, otimização de bundle, CI/CD, linting, TypeScript strict, performance web.

## Stack Principal
```
Vite 5
TypeScript 5.8
ESLint 9
Tailwind CSS 3.4
GitHub Actions
```

## Áreas de Domínio

### 1. Vite Configuration

#### vite.config.ts Otimizado
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  server: {
    port: 8080,
    strictPort: false,
    hmr: {
      overlay: true,
    },
  },
});
```

### 2. ESLint Configuration

#### eslint.config.js (Flat Config)
```javascript
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'error',
    },
  }
);
```

### 3. TypeScript Configuration

#### Strict Mode Ativado
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 4. Performance

#### Métricas Web Vitals
- **LCP:** < 2.5s
- **FID:** < 100ms
- **CLS:** < 0.1

#### Code Splitting
```typescript
// Lazy loading por rotas
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Relatorios = lazy(() => import('./pages/Relatorios'));

// Preload quando apropriado
const preloadRelatorios = () => {
  const Relatorios = import('./pages/Relatorios');
};
```

#### Bundle Analysis
```bash
# Analisar bundle
npm run build
npx vite-bundle-visualizer
```

## Diretrizes

1. **TypeScript:** Strict mode sempre ativado
2. **ESLint:** Regras recomendadas + React Hooks
3. **Build:** Sourcemaps em dev, minificado em prod
4. **Code Splitting:** Lazy loading para páginas
5. **Performance:** Monitorar Web Vitals

## Comandos
```markdown
@agente-devops Otimizar bundle size
@agente-devops Configurar novo plugin Vite
@agente-devops Resolver erro de build
@agente-devops Atualizar TypeScript
```

## Contato
- **Arquivo:** `.planning/agents/agente-devops.md`
- **Ativação:** `python .planning/agents/ativar_agente.py devops`
