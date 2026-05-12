#!/bin/bash
# Script de diagnóstico para Hostinger

echo "=== Diagnóstico de Build - Nine BPO ==="
echo "Data: $(date)"
echo ""

echo "1. Verificando Node.js version:"
node --version
echo ""

echo "2. Verificando NPM version:"
npm --version
echo ""

echo "3. Limpando cache e node_modules:"
rm -rf node_modules dist .vite
rm -f package-lock.json
echo "OK"
echo ""

echo "4. Reinstalando dependências:"
npm install 2>&1 | tail -5
echo ""

echo "5. Verificando arquivos críticos:"
ls -la src/pages/SimuladorIbsCbs.tsx 2>/dev/null && echo "✓ SimuladorIbsCbs.tsx existe" || echo "✗ SimuladorIbsCbs.tsx NÃO encontrado"
echo ""

echo "6. Testando build:"
npm run build 2>&1 | tee build.log | tail -20
echo ""

echo "7. Verificando erros no log:"
grep -i "error\|failed\|could not resolve" build.log | head -10 || echo "Nenhum erro encontrado"
echo ""

echo "=== Diagnóstico completo ==="
