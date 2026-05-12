#!/usr/bin/env python3
"""
Agentes BPO - Script de Ativacao
Ativa agentes especializados para trabalhar no projeto.

Uso:
    python ativar_agente.py [nome_agente] [tarefa_opcional]
    python ativar_agente.py todos                    # Ativar todos
    python ativar_agente.py frontend "Criar modal"   # Ativar especifico

Agentes disponiveis:
    - frontend: React, TypeScript, UI, Animacoes
    - supabase: Backend, Database, Realtime, RLS
    - financeiro: CNAB240, DRE, Regras de negocio
    - testes: Vitest, Playwright, Qualidade
    - devops: Vite, Build, Performance, Config
    - uiux: Design, Onboarding, Acessibilidade
    - seguranca: Auth, RLS, Protecao
    - analytics: Graficos, Dashboards, Relatorios
"""

import sys
from pathlib import Path
from typing import Dict, List

# Cores para output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def log(message: str, level: str = "info"):
    colors = {
        "info": Colors.OKBLUE,
        "success": Colors.OKGREEN,
        "warning": Colors.WARNING,
        "error": Colors.FAIL,
        "header": Colors.HEADER
    }
    print(f"{colors.get(level, '')}{message}{Colors.ENDC}")

# Configuracoes dos agentes
AGENTES: Dict[str, Dict] = {
    "frontend": {
        "nome": "Agente Frontend",
        "icone": "[FRONT]",
        "descricao": "Especialista em React, TypeScript, UI e Animacoes",
        "stack": ["React 18", "TypeScript", "Vite", "Tailwind", "shadcn/ui", "Framer Motion"],
        "arquivo": "agente-frontend.md",
        "responsabilidades": [
            "Criar/editar componentes React",
            "Implementar formularios com validacao",
            "Adicionar animacoes/transicoes",
            "Configurar rotas",
            "Hooks de UI",
            "Responsividade e acessibilidade"
        ]
    },
    "supabase": {
        "nome": "Agente Supabase",
        "icone": "[SUPABASE]",
        "descricao": "Especialista em PostgreSQL, Realtime, RLS e Edge Functions",
        "stack": ["Supabase", "PostgreSQL", "TanStack Query", "Row Level Security"],
        "arquivo": "agente-supabase.md",
        "responsabilidades": [
            "Criar/editar hooks de dados",
            "Configurar realtime subscriptions",
            "Implementar queries complexas",
            "Garantir seguranca RLS",
            "Migrar schemas",
            "Otimizar queries"
        ]
    },
    "financeiro": {
        "nome": "Agente Financeiro",
        "icone": "[FINANCEIRO]",
        "descricao": "Especialista em CNAB240, DRE, Regras de negocio financeiro",
        "stack": ["CNAB240 FEBRABAN", "Calculos Financeiros", "Parsing"],
        "arquivo": "agente-financeiro.md",
        "responsabilidades": [
            "Implementar regras de negocio financeiro",
            "Modificar CNAB240",
            "Calcular projecoes/saldos",
            "Logica de conciliacao",
            "Estrutura de DRE",
            "Parsing de extratos"
        ]
    },
    "testes": {
        "nome": "Agente Testes",
        "icone": "[TESTES]",
        "descricao": "Especialista em Vitest, Playwright, Cobertura e Testes E2E",
        "stack": ["Vitest", "Playwright", "Testing Library", "MSW"],
        "arquivo": "agente-testes.md",
        "responsabilidades": [
            "Criar testes para hooks financeiros",
            "Testar logicas de CNAB",
            "Testar parsing de arquivos",
            "Verificar componentes criticos",
            "Garantir regressoes nao ocorrem",
            "Testes E2E de fluxos"
        ]
    },
    "devops": {
        "nome": "Agente DevOps",
        "icone": "[DEVOPS]",
        "descricao": "Especialista em Vite, ESLint, TypeScript, CI/CD e Performance",
        "stack": ["Vite", "TypeScript", "ESLint", "Tailwind", "CI/CD"],
        "arquivo": "agente-devops.md",
        "responsabilidades": [
            "Configurar novo plugin Vite",
            "Ajustar regras ESLint",
            "Resolver problemas de build",
            "Otimizar performance",
            "Configurar variaveis de ambiente",
            "Code splitting"
        ]
    },
    "uiux": {
        "nome": "Agente UI/UX",
        "icone": "[UI/UX]",
        "descricao": "Especialista em Design system, Acessibilidade, Onboarding e Tooltips",
        "stack": ["Figma concepts", "shadcn/ui", "Radix UI", "ARIA"],
        "arquivo": "agente-uiux.md",
        "responsabilidades": [
            "Melhorar experiencia de usuario",
            "Criar/modificar onboarding",
            "Implementar tooltips",
            "Melhorar acessibilidade (ARIA)",
            "Consistencia visual",
            "Design responsivo"
        ]
    },
    "seguranca": {
        "nome": "Agente Seguranca",
        "icone": "[SEGURANCA]",
        "descricao": "Especialista em Autenticacao, Autorizacao, RLS e Protecao de dados",
        "stack": ["Supabase Auth", "RLS", "JWT", "Protecao XSS/SQL Injection"],
        "arquivo": "agente-seguranca.md",
        "responsabilidades": [
            "Problemas de autenticacao",
            "Configurar RLS",
            "Revisar permissoes",
            "Proteger rotas",
            "Validar inputs",
            "Prevenir vulnerabilidades"
        ]
    },
    "analytics": {
        "nome": "Agente Analytics",
        "icone": "[ANALYTICS]",
        "descricao": "Especialista em Graficos, Dashboards, Relatorios e Exportacoes",
        "stack": ["Recharts", "jsPDF", "xlsx", "Analise de dados"],
        "arquivo": "agente-analytics.md",
        "responsabilidades": [
            "Criar graficos e dashboards",
            "Exportar PDF/Excel",
            "Analise de dados",
            "Relatorios customizaveis",
            "Visualizacoes complexas"
        ]
    }
}

def ativar_agente(nome: str, tarefa: str = ""):
    """Ativa um agente especifico"""
    if nome not in AGENTES:
        log(f"[X] Agente '{nome}' nao encontrado", "error")
        return False

    agente = AGENTES[nome]

    log(f"\n{'='*60}", "header")
    log(f"  {agente['icone']} ATIVANDO: {agente['nome'].upper()}", "header")
    log(f"{'='*60}", "header")

    log(f"\n[OK] {agente['descricao']}", "success")

    log(f"\n{Colors.BOLD}Stack:{Colors.ENDC}")
    for tech in agente['stack']:
        log(f"  - {tech}")

    log(f"\n{Colors.BOLD}Responsabilidades:{Colors.ENDC}")
    for resp in agente['responsabilidades']:
        log(f"  [OK] {resp}")

    if tarefa:
        log(f"\n{Colors.BOLD}Tarefa Atribuida:{Colors.ENDC}")
        log(f"  [TASK] {tarefa}")

    log(f"\n[OK] {agente['nome']} ATIVO E PRONTO PARA TRABALHAR", "success")

    return True

def ativar_todos():
    """Ativa todos os agentes"""
    log(f"\n{'='*60}", "header")
    log("  [AGENTES] ATIVANDO TODOS OS AGENTES BPO", "header")
    log(f"{'='*60}\n", "header")

    for nome, agente in AGENTES.items():
        log(f"[OK] {agente['nome']}: ATIVO")

    log(f"\n[OK] TIME COMPLETO ATIVO - {len(AGENTES)} AGENTES PRONTOS", "success")
    log(f"\n[INFO] Use '@agente-[nome]' para atribuir tarefas", "info")

def mostrar_ajuda():
    """Mostra ajuda do script"""
    print(__doc__)
    print("\nAgentes disponiveis:")
    for nome, agente in AGENTES.items():
        print(f"  {agente['icone']} {nome:12} - {agente['descricao']}")

def main():
    if len(sys.argv) < 2:
        mostrar_ajuda()
        return

    nome_agente = sys.argv[1].lower()
    tarefa = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else ""

    if nome_agente in ["--help", "-h", "help", "ajuda"]:
        mostrar_ajuda()
        return

    if nome_agente == "todos":
        ativar_todos()
    else:
        ativar_agente(nome_agente, tarefa)

if __name__ == "__main__":
    main()
