#!/usr/bin/env node
/**
 * Script de configuração automática do banco de dados Supabase
 * Configura tabela e bucket para certificados NFS-e
 */

const https = require('https');
const readline = require('readline');

// Configuração do projeto
const SUPABASE_URL = 'tomrlopsmxgvzgqsfizh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvbXJsb3BzbXhndnpncXNmaXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NTcwNzQsImV4cCI6MjA5MDQzMzA3NH0.l2r0zBo8p4Y2xkXSQYO5exQCvqtq0yYF4-J6sLz7RhQ';

// Cores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      port: 443,
      path: path,
      method: method,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData, headers: res.headers });
        }
      });
    });

    req.on('error', (error) => reject(error));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function verificarTabela() {
  log('\n📋 Verificando tabela certificados_nfse...', 'cyan');

  try {
    const response = await makeRequest('/rest/v1/certificados_nfse?select=id&limit=1');

    if (response.status === 200) {
      log('✅ Tabela certificados_nfse existe!', 'green');
      return true;
    }
  } catch (error) {
    if (error.status === 404 || error.message?.includes('not found')) {
      log('❌ Tabela não existe', 'red');
    }
  }
  return false;
}

async function verificarBucket() {
  log('\n🪣 Verificando bucket certificados-nfse...', 'cyan');

  try {
    const response = await makeRequest('/storage/v1/bucket/certificados-nfse');

    if (response.status === 200) {
      log('✅ Bucket certificados-nfse existe!', 'green');
      return true;
    }
  } catch (error) {
    log('❌ Bucket não existe', 'red');
  }
  return false;
}

async function criarTabelaViaSQL() {
  log('\n🔧 Criando tabela via SQL...', 'cyan');

  const sql = `
-- Criar tabela de certificados
CREATE TABLE IF NOT EXISTS certificados_nfse (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    arquivo_path TEXT,
    valido_ate DATE,
    cnpj TEXT,
    emissor TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE certificados_nfse IS 'Tabela de certificados digitais A1 para emissão de NFS-e';

-- Índices
CREATE INDEX IF NOT EXISTS idx_certificados_nfse_user_id ON certificados_nfse(user_id);
CREATE INDEX IF NOT EXISTS idx_certificados_nfse_ativo ON certificados_nfse(ativo) WHERE ativo = true;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_certificado_updated_at()
RETURNS TRIGGER AS $$\nBEGIN\n    NEW.updated_at = NOW();\n    RETURN NEW;\nEND;\n$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_certificado_updated_at ON certificados_nfse;
CREATE TRIGGER trigger_update_certificado_updated_at
    BEFORE UPDATE ON certificados_nfse
    FOR EACH ROW
    EXECUTE FUNCTION update_certificado_updated_at();

-- RLS
ALTER TABLE certificados_nfse ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "certificados_select_policy" ON certificados_nfse;
DROP POLICY IF EXISTS "certificados_insert_policy" ON certificados_nfse;
DROP POLICY IF EXISTS "certificados_update_policy" ON certificados_nfse;
DROP POLICY IF EXISTS "certificados_delete_policy" ON certificados_nfse;

CREATE POLICY "certificados_select_policy" ON certificados_nfse
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "certificados_insert_policy" ON certificados_nfse
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "certificados_update_policy" ON certificados_nfse
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "certificados_delete_policy" ON certificados_nfse
    FOR DELETE USING (auth.uid() = user_id);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON certificados_nfse TO authenticated, anon;
GRANT ALL ON certificados_nfse TO service_role;
  `;

  try {
    // Tentar executar SQL via endpoint REST (pode não funcionar sem service_role)
    log('⚠️  Tentando criar tabela...', 'yellow');
    log('📝 SQL preparado:', 'cyan');
    log(sql, 'yellow');
    return false;
  } catch (error) {
    log(`❌ Erro: ${error.message}`, 'red');
    return false;
  }
}

async function criarBucket() {
  log('\n🔧 Criando bucket certificados-nfse...', 'cyan');

  const bucketData = {
    id: 'certificados-nfse',
    name: 'certificados-nfse',
    public: false,
    file_size_limit: 10485760, // 10MB
    allowed_mime_types: ['application/x-pkcs12', 'application/octet-stream']
  };

  try {
    const response = await makeRequest('/storage/v1/bucket', 'POST', bucketData);

    if (response.status === 200 || response.status === 201) {
      log('✅ Bucket criado com sucesso!', 'green');
      return true;
    } else {
      log(`⚠️  Resposta inesperada: ${response.status}`, 'yellow');
      log(response.data, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Erro ao criar bucket: ${error.message}`, 'red');
    return false;
  }
}

async function mostrarInstrucoesSQL() {
  log('\n' + '='.repeat(70), 'cyan');
  log('INSTRUÇÕES PARA CONFIGURAR O BANCO MANUALMENTE', 'cyan');
  log('='.repeat(70) + '\n', 'cyan');

  log('1️⃣  Acesse o SQL Editor do Supabase:', 'yellow');
  log('   https://app.supabase.com/project/tomrlopsmxgvzgqsfizh/sql/new\n');

  log('2️⃣  Copie e execute o SQL abaixo:\n', 'yellow');

  const sql = `-- ============================================
-- CONFIGURAÇÃO DO SISTEMA DE CERTIFICADOS
-- ============================================

-- 1. Criar tabela de certificados
CREATE TABLE IF NOT EXISTS certificados_nfse (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    arquivo_path TEXT,
    valido_ate DATE,
    cnpj TEXT,
    emissor TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Comentários
COMMENT ON TABLE certificados_nfse IS 'Tabela de certificados digitais A1 para emissão de NFS-e';

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_certificados_nfse_user_id ON certificados_nfse(user_id);
CREATE INDEX IF NOT EXISTS idx_certificados_nfse_ativo ON certificados_nfse(ativo) WHERE ativo = true;

-- 4. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_certificado_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_certificado_updated_at ON certificados_nfse;
CREATE TRIGGER trigger_update_certificado_updated_at
    BEFORE UPDATE ON certificados_nfse
    FOR EACH ROW
    EXECUTE FUNCTION update_certificado_updated_at();

-- 5. Habilitar RLS
ALTER TABLE certificados_nfse ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS
DROP POLICY IF EXISTS "certificados_select_policy" ON certificados_nfse;
DROP POLICY IF EXISTS "certificados_insert_policy" ON certificados_nfse;
DROP POLICY IF EXISTS "certificados_update_policy" ON certificados_nfse;
DROP POLICY IF EXISTS "certificados_delete_policy" ON certificados_nfse;

CREATE POLICY "certificados_select_policy" ON certificados_nfse
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "certificados_insert_policy" ON certificados_nfse
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "certificados_update_policy" ON certificados_nfse
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "certificados_delete_policy" ON certificados_nfse
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON certificados_nfse TO authenticated, anon;
GRANT ALL ON certificados_nfse TO service_role;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT 'Tabela criada com sucesso!' as status;`;

  log(sql, 'green');

  log('\n3️⃣  Crie o bucket no Storage:', 'yellow');
  log('   https://app.supabase.com/project/tomrlopsmxgvzgqsfizh/storage/buckets\n');
  log('   Clique em "New Bucket":', 'yellow');
  log('   - Name: certificados-nfse', 'cyan');
  log('   - Public: OFF (desmarcado)', 'cyan');
  log('   - File size limit: 10485760 (10MB)', 'cyan');
  log('   - Allowed MIME types: application/x-pkcs12', 'cyan');

  log('\n4️⃣  Configure as políticas do bucket:', 'yellow');
  log('   No bucket criado, vá em "Policies" e adicione:\n');
  log('   SELECT: auth.uid() = owner', 'cyan');
  log('   INSERT: auth.uid() = owner', 'cyan');
  log('   DELETE: auth.uid() = owner\n', 'cyan');

  log('='.repeat(70) + '\n', 'cyan');
}

async function main() {
  log('\n' + '='.repeat(70), 'blue');
  log('  CONFIGURAÇÃO AUTOMÁTICA DO BANCO - CERTIFICADOS NFS-e', 'blue');
  log('='.repeat(70) + '\n', 'blue');

  // Verificar estado atual
  const tabelaExiste = await verificarTabela();
  const bucketExiste = await verificarBucket();

  if (tabelaExiste && bucketExiste) {
    log('\n✅ Tudo já está configurado!', 'green');
    log('O sistema de certificados está pronto para uso.\n', 'green');
    return;
  }

  // Tentar criar automaticamente
  let sucesso = true;

  if (!tabelaExiste) {
    const criado = await criarTabelaViaSQL();
    if (!criado) sucesso = false;
  }

  if (!bucketExiste) {
    const criado = await criarBucket();
    if (!criado) sucesso = false;
  }

  // Se não conseguiu criar automaticamente, mostrar instruções
  if (!sucesso) {
    await mostrarInstrucoesSQL();

    // Tentar abrir o navegador
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Deseja abrir o SQL Editor no navegador? (S/N): ', (answer) => {
      if (answer.toLowerCase() === 's') {
        const { exec } = require('child_process');
        const url = 'https://app.supabase.com/project/tomrlopsmxgvzgqsfizh/sql/new';

        if (process.platform === 'darwin') {
          exec(`open "${url}"`);
        } else if (process.platform === 'win32') {
          exec(`start "" "${url}"`);
        } else {
          exec(`xdg-open "${url}"`);
        }
      }
      rl.close();
    });
  } else {
    log('\n✅ Configuração concluída com sucesso!', 'green');
    log('Tabela e bucket criados automaticamente.\n', 'green');
  }
}

// Executar
main().catch(error => {
  log(`\n❌ Erro: ${error.message}`, 'red');
  process.exit(1);
});
