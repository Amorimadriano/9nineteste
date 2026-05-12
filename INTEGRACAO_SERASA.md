# Integração com Serasa Experian - Score de Crédito

## 📋 Visão Geral

Implementação completa para consulta de score de crédito via API oficial da **Serasa Experian**.

---

## 🎯 Funcionalidades

- ✅ Consulta de Score para CPF e CNPJ
- ✅ Classificação de risco (AAA, AA, A, B, C, D, E)
- ✅ Probabilidade de inadimplência
- ✅ Dados cadastrais do consultado
- ✅ Modo simulação para testes (sem credenciais)
- ✅ Interface amigável com visualização do score

---

## 🚀 Como Usar

### 1. Modo Simulação (Padrão)
Sem credenciais configuradas, o sistema gera scores aleatórios consistentes para testes.

### 2. Modo Produção (Com Credenciais)
Com credenciais válidas da Serasa, consulta a base real de dados.

---

## 🔧 Configuração

### Passo 1: Contratar Serasa

1. Acesse: https://www.serasaexperian.com.br/
2. Solicite uma proposta para **API de Score**
3. Assine o contrato comercial
4. Obtenha as credenciais:
   - `Client ID`
   - `Client Secret`

### Passo 2: Configurar Variáveis de Ambiente

No painel do Supabase, vá em **Settings > API** e adicione as secrets:

```bash
SERASA_CLIENT_ID=seu_client_id_aqui
SERASA_CLIENT_SECRET=seu_client_secret_aqui
SERASA_API_URL=https://api.serasa.com.br
```

### Passo 3: Deploy da Edge Function

```bash
npx supabase functions deploy consulta-score-serasa
```

---

## 📁 Arquivos Criados/Modificados

| Arquivo | Descrição |
|---------|-----------|
| `supabase/functions/consulta-score-serasa/index.ts` | Edge Function para consulta API |
| `src/lib/serasa/index.ts` | Cliente e funções utilitárias |
| `src/pages/ConsultaScoreSerasa.tsx` | Página de consulta Serasa |
| `src/pages/ConsultaCnpjCpf.tsx` | Adicionado link para consulta Serasa |
| `src/App.tsx` | Adicionada rota `/consulta-score-serasa` |
| `src/components/AppSidebar.tsx` | Adicionado menu "Score Serasa" |

---

## 🔗 Endpoints

### API Interna (Edge Function)

**URL:** `https://tomrlopsmxgvzgqsfizh.supabase.co/functions/v1/consulta-score-serasa`

**Método:** `POST`

**Body:**
```json
{
  "documento": "12345678901234",
  "tipo": "pj"
}
```

**Resposta Sucesso:**
```json
{
  "sucesso": true,
  "documento": "12345678901234",
  "tipo": "pj",
  "score": 750,
  "classificacao": "AA",
  "risco": "baixo",
  "probabilidadeInadimplencia": 25,
  "dadosCadastrais": {
    "nome": "EMPRESA EXEMPLO LTDA",
    "situacao": "ATIVA"
  }
}
```

---

## 📊 Interpretação do Score

| Score | Classificação | Risco | Recomendação |
|-------|--------------|-------|--------------|
| 800-1000 | AAA | Baixo | Excelente - Risco mínimo |
| 700-799 | AA | Baixo | Bom pagador - Risco baixo |
| 600-699 | A | Médio | Risco moderado - Analisar |
| 500-599 | B | Médio-Alto | Risco elevado - Exigir garantia |
| 400-499 | C | Alto | Risco alto - Só à vista |
| 0-399 | D/E | Crítico | Risco crítico - Não liberar |

---

## 🔒 Segurança

- As credenciais são armazenadas como **secrets** no Supabase
- A consulta é feita via **Edge Function** (servidor)
- O token OAuth2 é gerado automaticamente a cada requisição
- Os dados sensíveis não são armazenados no banco

---

## 🧪 Testes

### Teste sem Credenciais (Simulação)
1. Acesse: `/consulta-score-serasa`
2. Digite qualquer CPF ou CNPJ
3. Clique em "Consultar Score"
4. O sistema retorna score simulado para testes

### Teste com Credenciais (Produção)
1. Configure as variáveis de ambiente
2. Deploy da Edge Function
3. Consulte um documento real
4. O sistema retorna dados da base Serasa

---

## 📞 Contato Serasa

- **Site:** https://www.serasaexperian.com.br/
- **Developer Portal:** https://developer.serasa.com.br/
- **Vendas:** Contate via site para proposta comercial

---

## 📝 Notas

- A consulta na Serasa requer **contrato comercial** válido
- Cada consulta pode ter **custo** conforme contrato
- O score varia de **0 a 1000**
- Quanto **maior** o score, **menor** o risco

---

## ✅ Checklist de Implantação

- [ ] Contratar serviço Serasa Experian
- [ ] Obter credenciais (Client ID e Secret)
- [ ] Configurar variáveis de ambiente no Supabase
- [ ] Deploy da Edge Function
- [ ] Testar consulta com documento válido
- [ ] Verificar logs em caso de erro

---

**Data:** 18/04/2026
