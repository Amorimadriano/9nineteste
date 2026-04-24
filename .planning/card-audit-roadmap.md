# 9nine Business Control Card — Roadmap de Desenvolvimento

## Visão Geral

Sistema de Auditoria de Recebíveis de Cartão de Crédito com conformidade fiscal (IBS/CBS/Split Payment), focado em automação, conciliação em lote e relatórios personalizados.

---

## Fase 1 — Fundação (Concluída ✅)

- [x] Estrutura básica da página `/card-audit`
- [x] Hook `useCardAudit` com CRUD de transações
- [x] Lib `cardAudit` com cálculo de Split Payment e parser CSV
- [x] Tabelas `card_transacoes_brutas`, `card_audit_logs`, `card_split_simulacoes`, `card_aliquotas_reforma`
- [x] Dashboard com KPIs básicos (Bruto, Taxas, Líquido, Pendentes/Conferidas/Divergentes)
- [x] Importação CSV simples
- [x] Auditoria manual (ok/divergente)
- [x] Simulador de Split Payment
- [x] Tabela de alíquotas EC 132/2023
- [x] Wiki básica

---

## Fase 2 — Importação Avançada (Atual 🔄)

- [ ] Parser OFX para extratos bancários
- [ ] Parser Excel (.xlsx) para extratos de adquirentes
- [ ] Detecção automática de layout por adquirente (Cielo, Rede, Stone, GetNet, SafraPay)
- [ ] Drag-and-drop de arquivos com barra de progresso
- [ ] Validação de dados importados com preview antes de salvar
- [ ] Suporte a Crédito Parcelado com detalhamento de parcelas

---

## Fase 3 — Dashboard Profissional

- [ ] Gráfico de vendas vs recebimentos (Recharts AreaChart)
- [ ] Breakdown por adquirente com comparativo de taxas (MDR)
- [ ] Previsão de cash flow por período
- [ ] Projeção de recebimentos futuros por bandeira e tipo
- [ ] Filtros por data, adquirente, bandeira e tipo de transação
- [ ] Botão "Zerar Dashboard" com confirmação e audit log

---

## Fase 4 — Auditoria Avançada

- [ ] Seleção flexível de adquirente no momento da auditoria
- [ ] Suporte completo a Crédito Parcelado (visualização por parcela)
- [ ] Matching automático (NSU + valor + data) com score de confiança
- [ ] Marcação em lote (selecionar todas, conferir, divergir)
- [ ] Filtros avançados (data, status, adquirente, bandeira, NSU)
- [ ] Detecção de divergências automáticas (valor, taxa, data)
- [ ] Comentários/observações por transação
- [ ] Exportação da tabela de auditoria para CSV

---

## Fase 5 — Relatórios Automáticos

- [ ] Geração de relatório consolidado em PDF
- [ ] Personalização com logotipo e nome da empresa (tabela `empresa`)
- [ ] Templates: Mensal, Por Adquirente, Divergências, Split Payment
- [ ] Preview antes de exportar
- [ ] Cabeçalho e rodapé com dados da empresa e período

---

## Fase 6 — Reforma Tributária Aprimorada

- [ ] Configuração de alíquotas de transição via UI (EC 132/2023)
- [ ] Simulador interativo com múltiplos cenários
- [ ] Comparativo: regime atual (PIS/COFINS/ICMS/ISS) vs. IBS/CBS
- [ ] Projeção de impacto financeiro ano a ano
- [ ] Histórico de simulações salvas

---

## Fase 7 — Central de Ajuda/Wiki

- [ ] Passo a passo ilustrado da importação de arquivos
- [ ] Explicação técnica sobre Split Payment e impacto no fluxo de caixa
- [ ] Glossário completo (NSU, Chargeback, Antecipação, MDR, CBS, IBS)
- [ ] FAQ com perguntas frequentes
- [ ] Links para legislação (EC 132/2023)

---

## Fase 8 — Segurança e LGPD

- [ ] Audit trail completo (quem fez o quê, quando)
- [ ] Logs de importação, auditoria e exclusão com IP e user-agent
- [ ] Isolamento de dados por empresa (RLS obrigatório)
- [ ] Criptografia em repouso e em trânsito (Supabase default)
- [ ] Política de retenção de dados
- [ ] Consentimento e termos de uso no primeiro acesso

---

## Estrutura de Arquivos

```
src/
├── lib/cardAudit/
│   ├── index.ts              # Exportações e tipos centrais
│   ├── ofxParser.ts          # Parser de arquivos OFX
│   ├── excelParser.ts        # Parser de Excel/CSV avançado
│   ├── reportGenerator.ts   # Geração de relatórios PDF
│   └── types.ts              # Tipos e interfaces compartilhados
├── hooks/
│   └── useCardAudit.ts       # Hook principal (queries + mutations)
├── pages/
│   └── CardAudit.tsx         # Página principal com 6 abas
└── components/
    └── card-audit/
        ├── DashboardTab.tsx
        ├── ImportTab.tsx
        ├── AuditTab.tsx
        ├── ReportsTab.tsx
        ├── TaxReformTab.tsx
        └── WikiTab.tsx
```

---

## Critérios de Aceite

1. Importação de CSV/OFX/Excel processa em < 5 segundos para 1000 transações
2. Conciliação automática com score ≥ 90% para matches exatos
3. Relatório PDF gerado em < 3 segundos
4. Interface responsiva (mobile-first) com cores do 9nine (azul marinho, cinza grafite, branco)
5. Audit trail registra toda ação com user_id e timestamp
6. RLS ativo em todas as tabelas do módulo