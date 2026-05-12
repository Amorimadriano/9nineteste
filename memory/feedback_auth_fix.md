---
name: Correção de Autenticação - Deslogamento Admin
description: Ajustes feitos para evitar deslogamento ao fazer login como admin
type: feedback
---

# Correção de Autenticação - Deslogamento Admin

## Problema
Ao fazer login com usuário admin, o sistema estava deslogando automaticamente.

## Causa
O componente ProtectedRoutes estava redirecionando para /login durante o carregamento inicial, antes que a sessão do Supabase fosse completamente estabilizada.

## Solução Implementada

### 1. App.tsx - ProtectedRoutes
- Adicionado estado `isReady` com delay de 500ms
- Aguarda completamente o carregamento antes de redirecionar
- Evita redirecionamentos prematuros durante a transição de autenticação

### 2. AuthContext.tsx
- Modificada ordem de inicialização: getSession() antes de onAuthStateChange
- Adicionado flag `isInitialized` para evitar atualizações duplicadas
- Só processa eventos de auth após a inicialização inicial

## Arquivos Modificados
- `src/App.tsx` - ProtectedRoutes com delay de inicialização
- `src/contexts/AuthContext.tsx` - Ordem de verificação de sessão

## Como Aplicar
As mudanças já estão no código. Reiniciar o servidor dev para testar:
```bash
npm run dev
```
