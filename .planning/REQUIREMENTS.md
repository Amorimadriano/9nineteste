# Nine BPO Financeiro - Requirements Document

## Funcionalidades Core (MVP)

### 1. Autenticação e Autorização
- [x] Login com email/senha via Supabase Auth
- [x] Recuperação de senha
- [x] Proteção de rotas
- [x] Sistema de trial/período de teste
- [ ] Roles de usuário (admin, contador, cliente)

### 2. Gestão de Empresas/Clientes
- [x] Cadastro de empresas (CNPJ, razão social, etc)
- [x] Vínculo de usuários a empresas
- [x] Seleção de empresa ativa
- [ ] Dashboard por empresa

### 3. Fluxo de Caixa
- [x] Lançamentos de receitas e despesas
- [x] Categorização por tipo
- [x] Vínculo a clientes/fornecedores
- [x] Conciliação manual
- [x] Visualização em tabela e calendário
- [ ] Projeção de saldo futuro

### 4. Conciliação Bancária
- [x] Importação de extratos OFX
- [x] Importação de CSV
- [x] Matching automático de lançamentos
- [x] Conciliação manual
- [x] Histórico de importações

### 5. Conciliação de Cartões
- [x] Importação de PDF de faturas
- [x] Parsing de dados do PDF
- [x] Categorização automática
- [x] Cálculo de taxas de antecipação

### 6. DRE (Demonstração de Resultados)
- [x] Geração de DRE por período
- [x] Comparativo período anterior
- [x] Exportação PDF
- [ ] DRE acumulado

### 7. Planejamento Orçamentário
- [x] Definição de orçamentos por categoria
- [x] Acompanhamento de realizado vs orçado
- [x] Alertas de ultrapassagem

### 8. CNAB240
- [x] Geração de remessa de cobrança
- [x] Geração de remessa de pagamento
- [x] Processamento de retorno
- [x] Suporte a múltiplos bancos

### 9. Relatórios e Exportações
- [x] Exportação de lançamentos (Excel)
- [x] Exportação de relatórios PDF
- [ ] Relatórios customizáveis

## Requisitos Não-Funcionais

### Performance
- Tempo de resposta < 2s para queries principais
- Lazy loading de componentes pesados
- Paginação de todas as listagens

### Segurança
- Todas as queries via RLS do Supabase
- Sanitização de inputs de arquivo
- Validação de CNPJ

### UX/UI
- Design responsivo (mobile-first)
- Feedback visual para ações
- Estados de loading em todas as interações

## Integrações Futuras
- [ ] Open Banking (APIs dos bancos)
- [ ] Nota Fiscal Eletrônica
- [ ] Integração com ERPs
