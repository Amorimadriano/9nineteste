@echo off
chcp 65001 > nul
echo ============================================
echo  CONFIGURACAO DO BANCO - CERTIFICADOS NFS-e
echo ============================================
echo.
echo Abrindo paineis do Supabase...
echo.

REM Abrir SQL Editor
echo Abrindo SQL Editor...
start https://app.supabase.com/project/tomrlopsmxgvzgqsfizh/sql/new
timeout /t 2 > nul

REM Abrir Storage
echo Abrindo Storage...
start https://app.supabase.com/project/tomrlopsmxgvzgqsfizh/storage/buckets
timeout /t 2 > nul

echo.
echo ============================================
echo  PASSOS A SEGUIR:
echo ============================================
echo.
echo 1. No SQL Editor, execute o script:
echo    scripts\setup-database-simples.sql
echo.
echo 2. No Storage, crie o bucket:
echo    - Nome: certificados-nfse
echo    - Public: OFF
echo    - File size limit: 10MB
echo.
echo ============================================
echo.

REM Abrir a pasta com o arquivo SQL
explorer /select,"%~dp0\setup-database-simples.sql"

echo Arquivos abertos!
echo.
pause
