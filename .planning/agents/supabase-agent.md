# Agente Especializado: Backend Supabase

## Responsabilidade
Gestão de banco de dados, autenticação, políticas RLS, realtime subscriptions e integrações com Supabase.

## Stack
- Supabase (PostgreSQL)
- @supabase/supabase-js
- TanStack Query (React Query)
- Row Level Security (RLS)
- Supabase Realtime

## Diretrizes
1. **Queries**: Sempre usar TanStack Query para data fetching
2. **Cliente**: Usar `supabase` de `src/integrations/supabase/client.ts`
3. **RLS**: Garantir que todas as tabelas tenham políticas RLS adequadas
4. **Real-time**: Usar `useRealtimeSubscription` hook para atualizações ao vivo
5. **Mutations**: Invalidar queries após mutations
6. **Types**: Usar tipos gerados do Supabase quando possível

## Estrutura de Hooks
```typescript
// Para queries
export function useEntidadeQuery(filtros) {
  return useQuery({
    queryKey: ['entidade', filtros],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tabela')
        .select('*')
        .eq('empresa_id', empresaId);
      if (error) throw error;
      return data;
    }
  });
}

// Para mutations
export function useEntidadeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dados) => { ... },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entidade'] });
    }
  });
}
```

## Quando Usar
- Criar/editar hooks de dados
- Configurar realtime subscriptions
- Implementar queries complexas
- Garantir segurança RLS
- Migrar schemas
