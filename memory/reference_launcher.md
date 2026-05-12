---
name: Launcher do Projeto
description: Informações sobre o launcher.py que inicializa o projeto Nine BPO Financeiro
type: reference
---

# Launcher do Projeto

O arquivo `launcher_ninebpo.py` está localizado em:
**`C:\Users\Antonio Amorim\Documents\GitHub\launcher_ninebpo.py`**

## Propósito
Inicializar e gerenciar todo o ambiente de desenvolvimento do projeto Nine BPO Financeiro.

## Dependências Necessárias
Para usar o launcher, certifique-se de ter instalado:

1. **Git** - Controle de versão
2. **Node.js** (v18+) - Runtime JavaScript
3. **npm** (incluído com Node.js) - Package manager (fallback se Bun não estiver instalado)
4. **Bun** (v1.0+) - Package manager preferido (opcional, usa npm como fallback)
5. **Python** (v3.8+) - Para executar o launcher

### Nota sobre Bun
O Bun é o package manager preferido por ser mais rápido, mas o launcher funciona perfeitamente com npm como fallback. Se Bun não estiver instalado, o launcher usará npm automaticamente.

## Comandos Disponíveis

```bash
python launcher_ninebpo.py setup       # Configura ambiente inicial
python launcher_ninebpo.py dev         # Inicia servidor de desenvolvimento
python launcher_ninebpo.py build       # Cria build de produção
python launcher_ninebpo.py test        # Executa testes
python launcher_ninebpo.py lint        # Executa linting
python launcher_ninebpo.py agents      # Lista agentes especializados
python launcher_ninebpo.py status       # Mostra status do projeto
```

## O que o launcher faz
- Verifica dependências (Git, Node, Bun, Python)
- Verifica estrutura do projeto
- Instala dependências (bun install ou npm install)
- Configura arquivo .env se necessário
- Executa comandos do projeto

## Primeira vez usando
1. Navegue até: `cd C:\Users\Antonio Amorim\Documents\GitHub`
2. Execute: `python launcher_ninebpo.py setup`
3. Depois: `python launcher_ninebpo.py dev`
