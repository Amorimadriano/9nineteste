# Configuração do Sistema de Certificados NFS-e

## 🚀 Passos Automatizados

### Opção 1: Script SQL (Recomendado - Mais Rápido)

1. **Acesse o SQL Editor do Supabase:**
   - Vá para: https://app.supabase.com/project/tomrlopsmxgvzgqsfizh/sql/new

2. **Execute o script SQL:**
   - Copie o conteúdo do arquivo `setup-certificado-nfse.sql`
   - Cole no SQL Editor
   - Clique em "Run"

3. **Crie o bucket no Storage:**
   - Vá para: Storage > New bucket
   - Nome: `certificados-nfse`
   - Public: ❌ Desmarcado (privado)
   - File size limit: 10MB
   - Clique em "Save"

4. **Configure as políticas do bucket:**
   - No bucket criado, vá em "Policies"
   - Crie 3 políticas:
     ```
     SELECT: auth.uid() = owner
     INSERT: auth.uid() = owner
     DELETE: auth.uid() = owner
     ```

5. **Deploy da Edge Function:**
   ```bash
   npx supabase functions deploy validar-certificado-nfse
   ```

---

### Opção 2: Script Node.js (Se tiver acesso service_role key)

1. **Obtenha a service_role key:**
   - Project Settings > API > service_role secret

2. **Execute o script:**
   ```bash
   export SUPABASE_SERVICE_ROLE_KEY="sua-chave-aqui"
   node scripts/setup-certificado-nfse.js
   ```

---

## ✅ Verificação

Após configurar, verifique se:

1. A tabela `certificados_nfse` existe (Database > Tables)
2. O bucket `certificados-nfse` existe (Storage)
3. A Edge Function `validar-certificado-nfse` está deployada (Edge Functions)

---

## 🐛 Problemas Comuns

### "Tabela não encontrada"
- Execute o script SQL novamente
- Verifique se não há erros na execução

### "Bucket não encontrado"
- Crie manualmente no painel do Supabase
- Verifique se o nome está exatamente `certificados-nfse`

### "Erro de permissão"
- Verifique se as políticas RLS foram criadas
- Certifique-se de estar logado no sistema

---

## 📋 Checklist Final

- [ ] Tabela `certificados_nfse` criada
- [ ] Bucket `certificados-nfse` criado
- [ ] Políticas RLS configuradas
- [ ] Políticas do bucket configuradas
- [ ] Edge Function deployada
- [ ] Teste de upload funcionando

---

**Data:** 18/04/2026  
**Versão:** 1.0
