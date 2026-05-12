#!/usr/bin/env python3
"""
Nine BPO Financeiro - Launcher
Inicializa todo o ambiente de desenvolvimento do projeto.

Uso:
    python launcher_ninebpo.py [comando]

Comandos disponíveis:
    setup       - Instala dependências e configura ambiente
    dev         - Inicia servidor de desenvolvimento
    build       - Cria build de produção
    test        - Executa testes
    lint        - Executa linting
    db:sync     - Sincroniza schema do Supabase
    agents      - Lista agentes especializados disponíveis
    status      - Mostra status do projeto

Autor: Claude Code
Criado: 2026-04-16
"""

import os
import sys
import subprocess
import json
from pathlib import Path
from typing import Optional

# Configurações do projeto
PROJECT_NAME = "ninebpofinanceiro"
PROJECT_DIR = Path(__file__).parent / PROJECT_NAME
REQUIRED_NODE_VERSION = "18.0.0"
REQUIRED_BUN_VERSION = "1.0.0"


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
    """Log com cores"""
    colors = {
        "info": Colors.OKBLUE,
        "success": Colors.OKGREEN,
        "warning": Colors.WARNING,
        "error": Colors.FAIL,
        "header": Colors.HEADER
    }
    print(f"{colors.get(level, '')}{message}{Colors.ENDC}")


def check_command(cmd: str) -> bool:
    """Verifica se um comando está disponível"""
    result = subprocess.run(
        ["where" if os.name == "nt" else "which", cmd],
        capture_output=True,
        text=True
    )
    return result.returncode == 0


def get_node_version() -> Optional[str]:
    """Retorna versão do Node.js instalada"""
    try:
        result = subprocess.run(
            ["node", "--version"],
            capture_output=True,
            text=True
        )
        return result.stdout.strip().lstrip("v")
    except:
        return None


def get_bun_version() -> Optional[str]:
    """Retorna versão do Bun instalada"""
    try:
        result = subprocess.run(
            ["bun", "--version"],
            capture_output=True,
            text=True
        )
        return result.stdout.strip()
    except:
        return None


def check_dependencies():
    """Verifica todas as dependências necessárias"""
    log("\n=== Verificando Dependências ===", "header")

    checks = {
        "Git": check_command("git"),
        "Node.js": check_command("node"),
        "Bun": check_command("bun"),
        "Python": check_command("python"),
    }

    all_ok = True
    for name, ok in checks.items():
        status = f"{Colors.OKGREEN}[OK]{Colors.ENDC}" if ok else f"{Colors.FAIL}[X]{Colors.ENDC}"
        print(f"  {status} {name}")
        if not ok:
            all_ok = False

    if checks["Node.js"]:
        version = get_node_version()
        print(f"     Versão Node: {Colors.OKCYAN}{version}{Colors.ENDC}")

    if checks["Bun"]:
        version = get_bun_version()
        print(f"     Versão Bun: {Colors.OKCYAN}{version}{Colors.ENDC}")

    if not all_ok:
        log("\n[!] Algumas dependências estão faltando!", "warning")
        log("Instale as dependências ausentes antes de continuar.", "warning")
    else:
        log("\n[OK] Todas as dependências estão instaladas!", "success")

    return all_ok


def check_project_structure():
    """Verifica se o projeto está configurado corretamente"""
    log("\n=== Verificando Estrutura do Projeto ===", "header")

    required_files = [
        "package.json",
        "vite.config.ts",
        "tsconfig.json",
        "tailwind.config.ts",
        ".env",
        "src/main.tsx"
    ]

    required_dirs = [
        "src",
        "src/components",
        "src/pages",
        "src/hooks",
        "src/lib",
        "src/integrations",
        ".planning"
    ]

    all_ok = True

    for file in required_files:
        path = PROJECT_DIR / file
        status = f"{Colors.OKGREEN}[OK]{Colors.ENDC}" if path.exists() else f"{Colors.FAIL}[X]{Colors.ENDC}"
        print(f"  {status} {file}")
        if not path.exists():
            all_ok = False

    for dir in required_dirs:
        path = PROJECT_DIR / dir
        status = f"{Colors.OKGREEN}[OK]{Colors.ENDC}" if path.exists() else f"{Colors.FAIL}[X]{Colors.ENDC}"
        print(f"  {status} {dir}/")
        if not path.exists():
            all_ok = False

    if not all_ok:
        log("\n[!] Estrutura do projeto incompleta!", "warning")
    else:
        log("\n[OK] Estrutura do projeto verificada!", "success")

    return all_ok


def install_dependencies():
    """Instala dependências do projeto"""
    log("\n=== Instalando Dependências ===", "header")

    os.chdir(PROJECT_DIR)

    # Verifica se node_modules existe
    if (PROJECT_DIR / "node_modules").exists():
        log("node_modules já existe. Pulando instalação.", "info")
        return True

    log("Instalando com bun...", "info")
    result = subprocess.run(
        ["bun", "install"],
        cwd=PROJECT_DIR,
        capture_output=False
    )

    if result.returncode != 0:
        log("Falha ao instalar com bun. Tentando com npm...", "warning")
        result = subprocess.run(
            ["npm", "install"],
            cwd=PROJECT_DIR,
            capture_output=False
        )

    if result.returncode == 0:
        log("[OK] Dependências instaladas com sucesso!", "success")
        return True
    else:
        log("[X] Falha ao instalar dependências", "error")
        return False


def setup_env():
    """Configura variáveis de ambiente"""
    log("\n=== Configurando Ambiente ===", "header")

    env_file = PROJECT_DIR / ".env"
    env_example = PROJECT_DIR / ".env.example"

    if not env_file.exists() and env_example.exists():
        log("Criando .env a partir de .env.example...", "info")
        with open(env_example, "r") as f:
            content = f.read()
        with open(env_file, "w") as f:
            f.write(content)
        log("[OK] Arquivo .env criado!", "success")
        log("[!] Edite o arquivo .env com suas credenciais do Supabase", "warning")
    elif env_file.exists():
        log("[OK] Arquivo .env já existe", "success")
    else:
        log("[!] Criando .env básico...", "warning")
        with open(env_file, "w") as f:
            f.write("""VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
""")


def start_dev():
    """Inicia servidor de desenvolvimento"""
    log("\n=== Iniciando Servidor de Desenvolvimento ===", "header")
    os.chdir(PROJECT_DIR)
    log("Executando: npm run dev", "info")
    subprocess.run(["npm", "run", "dev"], cwd=PROJECT_DIR)


def run_build():
    """Cria build de produção"""
    log("\n=== Criando Build de Produção ===", "header")
    os.chdir(PROJECT_DIR)

    log("Limpando build anterior...", "info")
    if (PROJECT_DIR / "dist").exists():
        import shutil
        shutil.rmtree(PROJECT_DIR / "dist")

    log("Executando build...", "info")
    result = subprocess.run(
        ["bun", "run", "build"],
        cwd=PROJECT_DIR,
        capture_output=False
    )

    if result.returncode == 0:
        log("[OK] Build criado com sucesso em dist/", "success")
    else:
        log("[X] Falha no build", "error")


def run_tests():
    """Executa testes"""
    log("\n=== Executando Testes ===", "header")
    os.chdir(PROJECT_DIR)
    subprocess.run(["bun", "test"], cwd=PROJECT_DIR)


def run_lint():
    """Executa linting"""
    log("\n=== Executando Lint ===", "header")
    os.chdir(PROJECT_DIR)
    subprocess.run(["bun", "lint"], cwd=PROJECT_DIR)


def show_agents():
    """Mostra agentes especializados disponíveis"""
    log("\n=== Agentes Especializados GSD ===", "header")

    agents = [
        ("Frontend React/TS", "Componentes, UI, hooks de interface"),
        ("Supabase", "Backend, queries, realtime, RLS"),
        ("Financeiro/CNAB240", "Regras de negócio, CNAB, DRE"),
        ("Testes/QE", "Vitest, Playwright, qualidade"),
        ("DevOps/Config", "Build, lint, Vite, TypeScript")
    ]

    for name, desc in agents:
        print(f"\n  {Colors.BOLD}{name}{Colors.ENDC}")
        print(f"     {desc}")

    print(f"\n\n  Documentação em: {Colors.OKCYAN}.planning/agents/{Colors.ENDC}")


def show_status():
    """Mostra status completo do projeto"""
    log("\n" + "="*50, "header")
    log(f"  {PROJECT_NAME.upper()}", "header")
    log("="*50, "header")

    check_dependencies()
    check_project_structure()

    # Verifica se node_modules existe
    if (PROJECT_DIR / "node_modules").exists():
        log("\n[OK] Dependências instaladas", "success")
    else:
        log("\n[X] Dependências não instaladas. Execute: setup", "error")

    log(f"\n  Diretório: {Colors.OKCYAN}{PROJECT_DIR}{Colors.ENDC}")
    log(f"\n  Para iniciar o servidor: {Colors.OKGREEN}python launcher_ninebpo.py dev{Colors.ENDC}")
    log(f"  URL padrao: {Colors.OKCYAN}http://localhost:8080{Colors.ENDC}")


def main():
    """Função principal"""
    if len(sys.argv) < 2:
        show_status()
        print(f"\n{Colors.BOLD}Uso:{Colors.ENDC}")
        print("  python launcher_ninebpo.py [comando]")
        print(f"\n{Colors.BOLD}Comandos:{Colors.ENDC}")
        print("  setup       - Configura ambiente inicial")
        print("  dev         - Inicia servidor de desenvolvimento")
        print("  build       - Cria build de produção")
        print("  test        - Executa testes")
        print("  lint        - Executa linting")
        print("  agents      - Lista agentes especializados")
        print("  status      - Mostra status do projeto")
        return

    command = sys.argv[1]

    if not PROJECT_DIR.exists():
        log(f"[X] Diretório do projeto não encontrado: {PROJECT_DIR}", "error")
        log("Certifique-se que este launcher está no diretório pai do projeto.", "error")
        sys.exit(1)

    commands = {
        "setup": lambda: [check_dependencies(), setup_env(), install_dependencies()],
        "dev": start_dev,
        "build": run_build,
        "test": run_tests,
        "lint": run_lint,
        "agents": show_agents,
        "status": show_status,
    }

    if command in commands:
        commands[command]()
    else:
        log(f"[X] Comando desconhecido: {command}", "error")
        log("Execute sem argumentos para ver comandos disponíveis.", "info")


if __name__ == "__main__":
    main()
