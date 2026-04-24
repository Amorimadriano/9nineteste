#!/usr/bin/env node
/**
 * Script de configuração automática do sistema de certificados NFS-e
 * Executa:
 * 1. Criação da tabela certificados_nfse (via SQL)
 * 2. Criação do bucket no Storage
 * 3. Configuração das políticas RLS
 */

const { createClient } = require('@supabase/supabase-js');

// Configuração
const SUPABASE_URL = 'https://tomrlopsmxgvzgqsfizh.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: SUPABASE_SERVICE_ROLE_KEY não definida');
  console.error('Por favor, defina a variável de ambiente SUPABASE_SERVICE_ROLE_KEY');
  console.error('Você pode encontrar esta chave em: Project Settings > API > service_role secret');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createTable() {
  console.log('📦 Criando tabela certificados_nfse...');

  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS certificados_nfse (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          nome TEXT NOT NULL,
          arquivo_path TEXT,
          valido_ate DATE,
          cnpj TEXT,
          emissor TEXT,
          ativo BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      COMMENT ON TABLE certificados_nfse IS 'Tabela de certificados digitais A1 para emissão de NFS-e';

      CREATE INDEX IF NOT EXISTS idx_certificados_nfse_user_id ON certificados_nfse(user_id);
      CREATE INDEX IF NOT EXISTS idx_certificados_nfse_ativo ON certificados_nfse(ativo) WHERE ativo = true;

      ALTER TABLE certificados_nfse ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Usuários podem ver seus próprios certificados" ON certificados_nfse;
      DROP POLICY IF EXISTS "Usuários podem inserir seus próprios certificados" ON certificados_nfse;
      DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios certificados" ON certificados_nfse;
      DROP POLICY IF EXISTS "Usuários podem deletar seus próprios certificados" ON certificados_nfse;

      CREATE POLICY "Usuários podem ver seus próprios certificados"
      ON certificados_nfse FOR SELECT USING (auth.uid() = user_id);

      CREATE POLICY "Usuários podem inserir seus próprios certificados"
      ON certificados_nfse FOR INSERT WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Usuários podem atualizar seus próprios certificados"
      ON certificados_nfse FOR UPDATE USING (auth.uid() = user_id);

      CREATE POLICY "Usuários podem deletar seus próprios certificados"
      ON certificados_nfse FOR DELETE USING (auth.uid() = user_id);
    `
  });

  if (error) {
    console.error('❌ Erro ao criar tabela:', error.message);
    return false;
  }

  console.log('✅ Tabela criada com sucesso!');
  return true;
}

async function createBucket() {
  console.log('🪣 Criando bucket certificados-nfse...');

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('❌ Erro ao listar buckets:', listError.message);
    return false;
  }

  const bucketExists = buckets.some(b => b.name === 'certificados-nfse');

  if (bucketExists) {
    console.log('ℹ️ Bucket já existe');
    return true;
  }

  const { error } = await supabase.storage.createBucket('certificados-nfse', {
    public: false,
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['application/x-pkcs12', 'application/octet-stream']
  });

  if (error) {
    console.error('❌ Erro ao criar bucket:', error.message);
    return false;
  }

  console.log('✅ Bucket criado com sucesso!');
  return true;
}

async function main() {
  console.log('🚀 Iniciando configuração do sistema de certificados NFS-e\n');

  const tableOk = await createTable();
  const bucketOk = await createBucket();

  console.log('\n' + '='.repeat(50));
  if (tableOk && bucketOk) {
    console.log('✅ Configuração concluída com sucesso!');
    console.log('\nPróximo passo: Deploy da Edge Function');
    console.log('  npx supabase functions deploy validar-certificado-nfse');
  } else {
    console.log('⚠️ Alguns passos falharam. Verifique os erros acima.');
    process.exit(1);
  }
}

main().catch(console.error);
