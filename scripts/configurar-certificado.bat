@echo off
chcp 65001 > nul
echo ============================================
echo  CONFIGURACAO DO SISTEMA DE CERTIFICADOS NFS-e
echo ============================================
echo.
echo Este script ira guiar voce na configuracao.
echo.

REM Verificar se estamos no diretorio correto
if not exist "..\package.json" (
    echo Erro: Execute este script da pasta scripts/
    pause
    exit /b 1
)

echo 📋 Passo 1: Verificar dependencias
echo --------------------------------------------
call npx --version > nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js/npx nao encontrado!
    echo Por favor, instale o Node.js: https://nodejs.org
    pause
    exit /b 1
)
echo ✅ Node.js encontrado

echo.
echo 📋 Passo 2: Preparar arquivos
echo --------------------------------------------
if not exist "setup-certificado-nfse.sql" (
    echo ❌ Arquivo setup-certificado-nfse.sql nao encontrado!
    pause
    exit /b 1
)
echo ✅ Arquivo SQL pronto

echo.
echo ============================================
echo  INSTRUCOES PARA CONFIGURACAO
echo ============================================
echo.
echo 1. Acesse o painel do Supabase:
echo    https://app.supabase.com/project/tomrlopsmxgvzgqsfizh
echo.
echo 2. Execute o script SQL:
echo    - Va em: SQL Editor > New query
echo    - Abra o arquivo: scripts\setup-certificado-nfse.sql
echo    - Copie o conteudo e cole no editor
echo    - Clique em "Run"
echo.
echo 3. Crie o bucket no Storage:
echo    - Va em: Storage > New bucket
echo    - Nome: certificados-nfse
echo    - Public: DESMARCADO (privado)
echo    - File size limit: 10MB
echo    - Clique em "Save"
echo.
echo 4. Configure as politicas do bucket:
echo    - No bucket, va em "Policies"
echo    - Adicione 3 politicas:
echo      * SELECT: auth.uid() = owner
echo      * INSERT: auth.uid() = owner
echo      * DELETE: auth.uid() = owner
echo.
echo 5. Deploy da Edge Function:
echo    - Abra um terminal na raiz do projeto
echo    - Execute: npx supabase functions deploy validar-certificado-nfse
echo.
echo ============================================
echo.

set /p abrir="Deseja abrir o painel do Supabase agora? (S/N): "
if /i "%abrir%"=="S" (
    start https://app.supabase.com/project/tomrlopsmxgvzgqsfizh/sql/new
)

echo.
echo Para mais detalhes, veja: scripts\README-CERTIFICADO.md
echo.
pause
