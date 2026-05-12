#!/bin/bash

# ============================================
# CONFIGURACAO DO SISTEMA DE CERTIFICADOS NFS-e
# ============================================

echo "============================================"
echo " CONFIGURACAO DO SISTEMA DE CERTIFICADOS NFS-e"
echo "============================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se estamos no diretorio correto
if [ ! -f "../package.json" ]; then
    echo -e "${RED}Erro: Execute este script da pasta scripts/${NC}"
    exit 1
fi

echo "📋 Passo 1: Verificar dependencias"
echo "--------------------------------------------"
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ Node.js/npx nao encontrado!${NC}"
    echo "Por favor, instale o Node.js: https://nodejs.org"
    exit 1
fi
echo -e "${GREEN}✅ Node.js encontrado${NC}"

echo ""
echo "📋 Passo 2: Preparar arquivos"
echo "--------------------------------------------"
if [ ! -f "setup-certificado-nfse.sql" ]; then
    echo -e "${RED}❌ Arquivo setup-certificado-nfse.sql nao encontrado!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Arquivo SQL pronto${NC}"

echo ""
echo "============================================"
echo " INSTRUCOES PARA CONFIGURACAO"
echo "============================================"
echo ""
echo "1. Acesse o painel do Supabase:"
echo "   https://app.supabase.com/project/tomrlopsmxgvzgqsfizh"
echo ""
echo "2. Execute o script SQL:"
echo "   - Va em: SQL Editor > New query"
echo "   - Abra o arquivo: scripts/setup-certificado-nfse.sql"
echo "   - Copie o conteudo e cole no editor"
echo "   - Clique em \"Run\""
echo ""
echo "3. Crie o bucket no Storage:"
echo "   - Va em: Storage > New bucket"
echo "   - Nome: certificados-nfse"
echo "   - Public: DESMARCADO (privado)"
echo "   - File size limit: 10MB"
echo "   - Clique em \"Save\""
echo ""
echo "4. Configure as politicas do bucket:"
echo "   - No bucket, va em \"Policies\""
echo "   - Adicione 3 politicas:"
echo "     * SELECT: auth.uid() = owner"
echo "     * INSERT: auth.uid() = owner"
echo "     * DELETE: auth.uid() = owner"
echo ""
echo "5. Deploy da Edge Function:"
echo "   - Abra um terminal na raiz do projeto"
echo "   - Execute: npx supabase functions deploy validar-certificado-nfse"
echo ""
echo "============================================"
echo ""

read -p "Deseja abrir o painel do Supabase agora? (S/N): " abrir
if [[ $abrir =~ ^[Ss]$ ]]; then
    if command -v xdg-open &> /dev/null; then
        xdg-open "https://app.supabase.com/project/tomrlopsmxgvzgqsfizh/sql/new"
    elif command -v open &> /dev/null; then
        open "https://app.supabase.com/project/tomrlopsmxgvzgqsfizh/sql/new"
    else
        echo "Nao foi possivel abrir o navegador automaticamente."
        echo "Acesse: https://app.supabase.com/project/tomrlopsmxgvzgqsfizh/sql/new"
    fi
fi

echo ""
echo "Para mais detalhes, veja: scripts/README-CERTIFICADO.md"
echo ""
read -p "Pressione ENTER para sair..."
