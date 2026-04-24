/**
 * Exemplos de Uso - Integração NFS-e (GINFES/Prefeitura SP)
 * Layout ABRASF 2.04
 * Task #29 - Agente Financeiro & DevOps
 */

import {
  // Config
  NFSeConfig,
  type NaturezaOperacao,
  type TipoRps,
  // Auth
  carregarCertificadoDigital,
  criarHeaderSOAP,
  formatarCnpjNfse,
  formatarInscricaoMunicipal,
  type EmitenteNfse,
  type CertificadoDigital,
  // Client
  NFSeClientSP,
  nfseClientSP,
  type RespostaEmissao,
  type RespostaConsulta,
  // XML Builder
  construirRps,
  construirLoteRps,
  construirPedidoConsulta,
  construirPedidoCancelamento,
  validarDadosNota,
  type DadosNotaFiscal,
  // Parser
  parsearRespostaEmissao,
  parsearRespostaConsulta,
  traduzirErroGinfes,
  type MensagemRetorno,
} from './index';

// ============================================================================
// EXEMPLO 1: Configuração do Ambiente
// ============================================================================
export function exemploConfiguracao() {
  console.log('=== Configuração NFS-e ===');
  console.log('Ambiente atual:', NFSeConfig.ambiente);
  console.log('URL Base:', NFSeConfig.baseUrl);
  console.log('Versão Layout:', NFSeConfig.versaoLayout);
  console.log('Timeout:', NFSeConfig.timeout, 'ms');

  // Naturezas de operação disponíveis
  console.log('\n=== Naturezas de Operação ===');
  Object.entries(NFSeConfig.naturezaOperacao).forEach(([nome, codigo]) => {
    console.log(`${codigo} - ${nome}`);
  });

  // Tipos de RPS
  console.log('\n=== Tipos de RPS ===');
  Object.entries(NFSeConfig.tiposRps).forEach(([nome, tipo]) => {
    console.log(`${tipo} - ${nome}`);
  });
}

// ============================================================================
// EXEMPLO 2: Carregar Certificado Digital
// ============================================================================
export async function exemploCarregarCertificado() {
  // Em ambiente browser, o certificado geralmente vem de um input file
  // const certificadoBase64 = await lerArquivoCertificado(file);
  // const senha = obterSenhaDoUsuario();

  // Exemplo com certificado mock (em produção, usar certificado real)
  const certificadoBase64 = 'MII...'; // Base64 do arquivo .pfx/.p12
  const senha = 'senha123';

  try {
    const certificado = await carregarCertificadoDigital(certificadoBase64, senha);
    console.log('=== Certificado Carregado ===');
    console.log('Tamanho:', certificado.certificado.length, 'caracteres');
    return certificado;
  } catch (error) {
    console.error('Erro ao carregar certificado:', error);
    throw error;
  }
}

// ============================================================================
// EXEMPLO 3: Criar Dados da Nota Fiscal
// ============================================================================
export function exemploCriarDadosNota(): DadosNotaFiscal {
  const emitente: EmitenteNfse = {
    cnpj: '00.000.000/0000-00',
    inscricaoMunicipal: '123456',
    razaoSocial: 'Nine BPO Financeiro LTDA',
    nomeFantasia: 'Nine BPO',
    endereco: {
      logradouro: 'Rua Exemplo',
      numero: '100',
      complemento: 'Sala 101',
      bairro: 'Centro',
      codigoMunicipio: '3550308', // São Paulo
      uf: 'SP',
      cep: '01000-000',
    },
    certificado: { certificado: '', senha: '' },
    regimeTributario: 'SimplesNacional',
  };

  const nota: DadosNotaFiscal = {
    identificacaoRps: {
      numero: '1000',
      serie: '1',
      tipo: 'RPS',
    },
    dataEmissao: new Date(),
    naturezaOperacao: 1, // Tributação no município
    optanteSimplesNacional: true,
    incentivadorCultural: false,
    emitente,
    tomador: {
      cpfCnpj: '11.111.111/0001-11',
      razaoSocial: 'Cliente Exemplo LTDA',
      endereco: {
        logradouro: 'Av. Paulista',
        numero: '1000',
        complemento: '10º Andar',
        bairro: 'Bela Vista',
        codigoMunicipio: '3550308',
        uf: 'SP',
        cep: '01310-100',
      },
      telefone: '1133334444',
      email: 'contato@cliente.com.br',
    },
    servico: {
      valores: {
        valorServicos: 5000.00,
        valorDeducoes: 0,
        issRetido: false,
        aliquota: 0.05, // 5%
        valorIss: 250.00,
        valorLiquidoNfse: 5000.00,
      },
      itemListaServico: '1.01', // Consultoria
      codigoCnae: '6201501', // Desenvolvimento de programas
      discriminacao: 'Serviços de consultoria e desenvolvimento de software conforme contrato nº 123/2024',
      codigoMunicipio: '3550308',
      exigibilidadeISS: 1,
    },
  };

  console.log('=== Dados da Nota Criados ===');
  console.log('RPS:', nota.identificacaoRps.numero, 'Série:', nota.identificacaoRps.serie);
  console.log('Valor:', nota.servico.valores.valorServicos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
  console.log('Tomador:', nota.tomador.razaoSocial);

  return nota;
}

// ============================================================================
// EXEMPLO 4: Validar Dados da Nota
// ============================================================================
export function exemploValidarNota(nota: DadosNotaFiscal) {
  const erros = validarDadosNota(nota);

  console.log('=== Validação da Nota ===');
  if (erros.length === 0) {
    console.log('Nota válida! ✓');
    return true;
  } else {
    console.log(`Encontrados ${erros.length} erro(s):`);
    erros.forEach((erro, idx) => {
      console.log(`  ${idx + 1}. ${erro}`);
    });
    return false;
  }
}

// ============================================================================
// EXEMPLO 5: Construir XML do RPS
// ============================================================================
export function exemploConstruirXML(nota: DadosNotaFiscal) {
  console.log('=== Construindo XML do RPS ===');

  const xmlRps = construirRps(nota);
  console.log('XML Gerado (primeiros 500 caracteres):');
  console.log(xmlRps.substring(0, 500) + '...');

  return xmlRps;
}

// ============================================================================
// EXEMPLO 6: Emitir Nota Fiscal (Cliente)
// ============================================================================
export async function exemploEmitirNota(nota: DadosNotaFiscal) {
  // Criar cliente em modo homologação (para testes)
  const client = new NFSeClientSP({
    ambiente: 'homologacao',
    timeout: 30000,
  });

  console.log('=== Emitindo Nota Fiscal ===');
  console.log('Ambiente:', NFSeConfig.ambiente);

  try {
    const resposta = await client.emitirNota(nota);

    console.log('\n=== Resposta da Emissão ===');
    console.log('Sucesso:', resposta.sucesso);

    if (resposta.sucesso) {
      console.log('Protocolo:', resposta.protocolo);
      console.log('Número NFSe:', resposta.numeroNfse);
      console.log('Código Verificação:', resposta.codigoVerificacao);
      console.log('Data Emissão:', resposta.dataEmissao);
    } else {
      console.log('\n=== Erros ===');
      resposta.mensagens.forEach((msg) => {
        console.log(`[${msg.codigo}] ${msg.tipo}: ${msg.mensagem}`);
        if (msg.correcao) {
          console.log(`  Correção: ${msg.correcao}`);
        }
      });
    }

    return resposta;
  } catch (error) {
    console.error('Erro ao emitir nota:', error);
    throw error;
  }
}

// ============================================================================
// EXEMPLO 7: Consultar Nota Fiscal
// ============================================================================
export async function exemploConsultarNota() {
  const client = new NFSeClientSP({ ambiente: 'homologacao' });

  const emitente: EmitenteNfse = {
    cnpj: '00.000.000/0000-00',
    inscricaoMunicipal: '123456',
    razaoSocial: 'Nine BPO',
    endereco: { logradouro: '', numero: '', bairro: '', codigoMunicipio: '', uf: '', cep: '' },
    certificado: { certificado: '', senha: '' },
  };

  console.log('=== Consultando Nota Fiscal ===');

  try {
    const resposta = await client.consultarNota('1000', '1', emitente, 'RPS');

    console.log('Sucesso:', resposta.sucesso);
    if (resposta.nfse) {
      console.log('Número NFSe:', resposta.nfse.numero);
      console.log('Código Verificação:', resposta.nfse.codigoVerificacao);
      console.log('Data Emissão:', resposta.nfse.dataEmissao);
      console.log('Valor:', resposta.nfse.servico.valores.valorServicos);
      console.log('Tomador:', resposta.nfse.tomador.razaoSocial);
    }

    return resposta;
  } catch (error) {
    console.error('Erro ao consultar nota:', error);
    throw error;
  }
}

// ============================================================================
// EXEMPLO 8: Cancelar Nota Fiscal
// ============================================================================
export async function exemploCancelarNota(numeroNfse: string) {
  const client = new NFSeClientSP({ ambiente: 'homologacao' });

  const emitente: EmitenteNfse = {
    cnpj: '00.000.000/0000-00',
    inscricaoMunicipal: '123456',
    razaoSocial: 'Nine BPO',
    endereco: { logradouro: '', numero: '', bairro: '', codigoMunicipio: '', uf: '', cep: '' },
    certificado: { certificado: '', senha: '' },
  };

  console.log('=== Cancelando Nota Fiscal ===');
  console.log('Número NFSe:', numeroNfse);

  try {
    // Códigos de cancelamento:
    // E007 - Erro de preenchimento
    // E008 - Serviço não prestado
    // E009 - Duplicidade de nota
    const resposta = await client.cancelarNota(
      numeroNfse,
      emitente,
      'E007',
      'Cancelamento por erro de preenchimento'
    );

    console.log('Sucesso:', resposta.sucesso);
    if (resposta.sucesso) {
      console.log('Data/Hora Cancelamento:', resposta.dataHoraCancelamento);
    } else {
      console.log('Erros:', resposta.mensagens);
    }

    return resposta;
  } catch (error) {
    console.error('Erro ao cancelar nota:', error);
    throw error;
  }
}

// ============================================================================
// EXEMPLO 9: Emissão em Lote (Batch)
// ============================================================================
export async function exemploEmitirLote(notas: DadosNotaFiscal[]) {
  const client = new NFSeClientSP({ ambiente: 'homologacao' });

  const emitente: EmitenteNfse = {
    cnpj: '00.000.000/0000-00',
    inscricaoMunicipal: '123456',
    razaoSocial: 'Nine BPO',
    endereco: { logradouro: '', numero: '', bairro: '', codigoMunicipio: '', uf: '', cep: '' },
    certificado: { certificado: '', senha: '' },
  };

  console.log('=== Emitindo Lote de RPS ===');
  console.log('Quantidade de notas:', notas.length);

  try {
    const resposta = await client.emitirLoteRps(notas, 'LOTE001', emitente);

    console.log('Sucesso:', resposta.sucesso);
    if (resposta.sucesso) {
      console.log('Protocolo:', resposta.protocolo);
      console.log('Use o protocolo para consultar o status do lote');
    }

    return resposta;
  } catch (error) {
    console.error('Erro ao emitir lote:', error);
    throw error;
  }
}

// ============================================================================
// EXEMPLO 10: Consultar Status do Lote
// ============================================================================
export async function exemploConsultarLote(protocolo: string) {
  const client = new NFSeClientSP({ ambiente: 'homologacao' });

  const emitente: EmitenteNfse = {
    cnpj: '00.000.000/0000-00',
    inscricaoMunicipal: '123456',
    razaoSocial: 'Nine BPO',
    endereco: { logradouro: '', numero: '', bairro: '', codigoMunicipio: '', uf: '', cep: '' },
    certificado: { certificado: '', senha: '' },
  };

  console.log('=== Consultando Status do Lote ===');
  console.log('Protocolo:', protocolo);

  try {
    const resposta = await client.consultarLoteRps(protocolo, emitente);

    console.log('Sucesso:', resposta.sucesso);
    console.log('Situação:', resposta.situacao);

    if (resposta.nfseGeradas) {
      console.log(`Notas geradas: ${resposta.nfseGeradas.length}`);
      resposta.nfseGeradas.forEach((nfse) => {
        console.log(`  - NFSe ${nfse.numero}: ${nfse.codigoVerificacao}`);
      });
    }

    if (resposta.nfseComErro) {
      console.log(`Notas com erro: ${resposta.nfseComErro.length}`);
    }

    return resposta;
  } catch (error) {
    console.error('Erro ao consultar lote:', error);
    throw error;
  }
}

// ============================================================================
// EXEMPLO 11: Tratamento de Erros
// ============================================================================
export function exemploTratamentoErros(resposta: RespostaEmissao) {
  console.log('=== Tratamento de Erros ===');

  if (!resposta.sucesso) {
    resposta.mensagens.forEach((msg) => {
      // Traduza o código de erro para mensagem amigável
      const mensagemAmigavel = traduzirErroGinfes(msg.codigo);

      switch (msg.tipo) {
        case 'Erro':
          console.error(`❌ Erro ${msg.codigo}: ${mensagemAmigavel}`);
          break;
        case 'Aviso':
          console.warn(`⚠️ Aviso ${msg.codigo}: ${mensagemAmigavel}`);
          break;
        default:
          console.log(`ℹ️ ${msg.codigo}: ${mensagemAmigavel}`);
      }

      if (msg.correcao) {
        console.log(`   Correção: ${msg.correcao}`);
      }
    });

    return false;
  }

  console.log('✓ Operação realizada com sucesso!');
  return true;
}

// ============================================================================
// EXEMPLO 12: Fluxo Completo
// ============================================================================
export async function exemploFluxoCompleto() {
  console.log('=== FLUXO COMPLETO NFS-e ===\n');

  // 1. Configurar ambiente
  exemploConfiguracao();

  // 2. Criar dados da nota
  const nota = exemploCriarDadosNota();

  // 3. Validar dados
  const valida = exemploValidarNota(nota);
  if (!valida) {
    console.log('Nota inválida, corrija os erros antes de prosseguir.');
    return;
  }

  // 4. Construir XML (demonstração)
  exemploConstruirXML(nota);

  // 5. Emitir nota (em produção, descomentar)
  // const respostaEmissao = await exemploEmitirNota(nota);

  // 6. Verificar resultado
  // if (respostaEmissao.sucesso) {
  //   console.log('Nota emitida com sucesso!');
  //
  //   // 7. Consultar nota
  //   const respostaConsulta = await exemploConsultarNota();
  //
  //   // 8. Se necessário, cancelar
  //   if (respostaEmissao.numeroNfse) {
  //     await exemploCancelarNota(respostaEmissao.numeroNfse);
  //   }
  // }

  console.log('\n=== Fluxo demonstrativo concluído ===');
  console.log('Nota: Em produção, remover os comentários para executar as operações reais.');
}

// Exportar exemplo de uso para documentação
export const EXEMPLO_USO_MARKDOWN = `
## Exemplo de Uso - NFS-e (GINFES/Prefeitura SP)

### 1. Configurar Variáveis de Ambiente

\`\`\`env
# .env
VITE_NFSE_AMBIENTE=homologacao  # ou producao
\`\`\`

### 2. Emitir Nota Fiscal

\`\`\`typescript
import { NFSeClientSP } from '@/lib/nfs-e';

const client = new NFSeClientSP({ ambiente: 'homologacao' });

const resposta = await client.emitirNota({
  identificacaoRps: { numero: '1000', serie: '1', tipo: 'RPS' },
  dataEmissao: new Date(),
  naturezaOperacao: 1, // Tributação no município
  emitente: {
    cnpj: '00.000.000/0000-00',
    inscricaoMunicipal: '123456',
    razaoSocial: 'Empresa Exemplo',
    endereco: { logradouro: 'Rua A', numero: '100', bairro: 'Centro', codigoMunicipio: '3550308', uf: 'SP', cep: '01000-000' },
    certificado: { certificado: '', senha: '' },
  },
  tomador: {
    cpfCnpj: '11.111.111/0001-11',
    razaoSocial: 'Cliente Exemplo',
    endereco: { logradouro: 'Av. B', numero: '200', bairro: 'Bela Vista', codigoMunicipio: '3550308', uf: 'SP', cep: '01310-100' },
  },
  servico: {
    valores: { valorServicos: 5000.00, issRetido: false, aliquota: 0.05 },
    itemListaServico: '1.01',
    discriminacao: 'Serviços de consultoria',
    codigoMunicipio: '3550308',
  },
});

if (resposta.sucesso) {
  console.log('NFSe:', resposta.numeroNfse);
  console.log('Protocolo:', resposta.protocolo);
}
\`\`\`

### 3. Consultar Nota

\`\`\`typescript
const resposta = await client.consultarNota('1000', '1', emitente);
console.log(resposta.nfse?.numero);
\`\`\`

### 4. Cancelar Nota

\`\`\`typescript
const resposta = await client.cancelarNota('12345', emitente, 'E007', 'Erro de preenchimento');
console.log('Cancelada:', resposta.sucesso);
\`\`\`

### 5. Emitir em Lote

\`\`\`typescript
const resposta = await client.emitirLoteRps([nota1, nota2, nota3], 'LOTE001', emitente);
console.log('Protocolo do lote:', resposta.protocolo);

// Consultar status do lote
const status = await client.consultarLoteRps(resposta.protocolo!, emitente);
console.log('Situação:', status.situacao);
\`\`\`

### Códigos de Natureza de Operação

- 1: Tributação no município
- 2: Tributação fora do município
- 3: Isenção
- 4: Imune
- 5: Exigibilidade suspensa judicial
- 6: Exigibilidade suspensa administrativa

### Códigos de Cancelamento

- E007: Erro de preenchimento
- E008: Serviço não prestado
- E009: Duplicidade de nota fiscal
`;
