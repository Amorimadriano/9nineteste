/**
 * Exemplos de Uso - Integração Open Banking
 * Task #23 - Agente Financeiro & DevOps
 */

import {
  // Config
  BANCOS_DISPONIVEIS,
  obterConfigBanco,
  // Auth
  iniciarFluxoConsentimento,
  trocarCodePorToken,
  refreshAccessToken,
  isBancoConfigurado,
  limparDadosAuth,
  type IntegracaoOpenBanking,
  // Client
  criarOpenBankingClient,
  type ApiResponse,
  // Parser
  criarParser,
  type ExtratoNineBPO,
  type ContaNineBPO,
} from './index';
import type { BancoCodigo } from './config';

// ============================================================================
// EXEMPLO 1: Listar Bancos Disponíveis
// ============================================================================
export function exemploListarBancos() {
  console.log('=== Bancos Disponíveis ===');
  BANCOS_DISPONIVEIS.forEach((banco) => {
    console.log(`${banco.codigo} - ${banco.nome}`);
    console.log(`  Configurado: ${isBancoConfigurado(banco.codigo)}`);
  });
}

// ============================================================================
// EXEMPLO 2: Iniciar Fluxo de Consentimento
// ============================================================================
export async function exemploIniciarConsentimento() {
  const bancoCodigo: BancoCodigo = '341'; // Itaú
  const usuarioId = 'user-123';
  const scopes = ['extrato', 'dados-conta'];

  try {
    const { url, state } = await iniciarFluxoConsentimento(
      bancoCodigo,
      usuarioId,
      scopes
    );

    console.log('=== Fluxo de Consentimento Iniciado ===');
    console.log('URL para redirecionar usuário:', url);
    console.log('State (CSRF):', state);

    // Em uma aplicação real:
    // window.location.href = url;

    return { url, state };
  } catch (error) {
    console.error('Erro ao iniciar consentimento:', error);
    throw error;
  }
}

// ============================================================================
// EXEMPLO 3: Callback OAuth - Trocar Code por Token
// ============================================================================
export async function exemploCallbackOAuth(code: string, state: string) {
  try {
    const tokenData = await trocarCodePorToken(code, state);

    console.log('=== Token Obtido ===');
    console.log('Access Token:', tokenData.access_token.substring(0, 20) + '...');
    console.log('Refresh Token:', tokenData.refresh_token.substring(0, 20) + '...');
    console.log('Expires In:', tokenData.expires_in);
    console.log('Scope:', tokenData.scope);

    // Criar objeto de integração (normalmente salvaria no banco)
    const integracao: IntegracaoOpenBanking = {
      id: `int-${Date.now()}`,
      bancoCodigo: tokenData.bancoCodigo,
      usuarioId: tokenData.usuarioId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      scopes: tokenData.scope.split(' '),
      status: 'ativo',
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    };

    return integracao;
  } catch (error) {
    console.error('Erro no callback:', error);
    throw error;
  }
}

// ============================================================================
// EXEMPLO 4: Obter Dados da Conta
// ============================================================================
export async function exemploObterDadosConta(integracao: IntegracaoOpenBanking) {
  const client = criarOpenBankingClient(integracao);

  try {
    const response = await client.obterDadosConta();

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Erro desconhecido');
    }

    // Parse para formato Nine BPO
    const parser = criarParser(integracao.bancoCodigo);
    const contas: ContaNineBPO[] = response.data.map((conta) =>
      parser.parseConta(conta)
    );

    console.log('=== Contas Obtidas ===');
    contas.forEach((conta) => {
      console.log(`Conta: ${conta.numeroConta}`);
      console.log(`  Tipo: ${conta.tipo}`);
      console.log(`  Status: ${conta.status}`);
      console.log(`  Moeda: ${conta.moeda}`);
    });

    return contas;
  } catch (error) {
    console.error('Erro ao obter dados:', error);
    throw error;
  }
}

// ============================================================================
// EXEMPLO 5: Obter Extrato
// ============================================================================
export async function exemploObterExtrato(
  integracao: IntegracaoOpenBanking,
  accountId: string
) {
  const client = criarOpenBankingClient(integracao);
  const parser = criarParser(integracao.bancoCodigo);

  // Período dos últimos 30 dias
  const dataFim = new Date();
  const dataInicio = new Date();
  dataInicio.setDate(dataFim.getDate() - 30);

  try {
    const response = await client.obterExtrato(accountId, dataInicio, dataFim);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Erro ao obter extrato');
    }

    // Converter para formato Nine BPO
    const extrato: ExtratoNineBPO = parser.parseExtrato(response.data);

    console.log('=== Extrato Obtido ===');
    console.log(`Período: ${extrato.periodoInicio.toLocaleDateString()} a ${extrato.periodoFim.toLocaleDateString()}`);
    console.log(`Total de Transações: ${extrato.quantidadeTransacoes}`);
    console.log(`Entradas: R$ ${extrato.totalEntradas.toFixed(2)}`);
    console.log(`Saídas: R$ ${extrato.totalSaidas.toFixed(2)}`);
    console.log(`Saldo: R$ ${(extrato.totalEntradas - extrato.totalSaidas).toFixed(2)}`);

    // Agrupar por categoria
    const porCategoria = parser.agruparPorCategoria(extrato.transacoes);
    console.log('\n=== Transações por Categoria ===');
    Object.entries(porCategoria).forEach(([cat, trans]) => {
      const total = trans
        .filter((t) => t.status === 'confirmada')
        .reduce((sum, t) => sum + (t.tipo === 'saida' ? -t.valor : t.valor), 0);
      console.log(`${cat}: ${trans.length} transações (R$ ${total.toFixed(2)})`);
    });

    return extrato;
  } catch (error) {
    console.error('Erro ao obter extrato:', error);
    throw error;
  }
}

// ============================================================================
// EXEMPLO 6: Renovar Token Automaticamente
// ============================================================================
export async function exemploRenovarToken(integracao: IntegracaoOpenBanking) {
  try {
    const novoToken = await refreshAccessToken(integracao);

    // Atualizar integração
    integracao.accessToken = novoToken.access_token;
    integracao.refreshToken = novoToken.refresh_token || integracao.refreshToken;
    integracao.expiresAt = new Date(Date.now() + novoToken.expires_in * 1000);
    integracao.atualizadoEm = new Date();

    console.log('=== Token Renovado ===');
    console.log('Novo Access Token:', novoToken.access_token.substring(0, 20) + '...');
    console.log('Expira em:', novoToken.expires_in, 'segundos');

    return integracao;
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    throw error;
  }
}

// ============================================================================
// EXEMPLO 7: Fluxo Completo
// ============================================================================
export async function exemploFluxoCompleto() {
  console.log('=== FLUXO COMPLETO OPEN BANKING ===\n');

  // 1. Listar bancos
  exemploListarBancos();

  // 2. Verificar se banco está configurado
  const bancoCodigo: BancoCodigo = '341';
  if (!isBancoConfigurado(bancoCodigo)) {
    console.warn(`Banco ${bancoCodigo} não configurado!`);
    return;
  }

  // 3. Iniciar consentimento (gera URL)
  // const { url } = await exemploIniciarConsentimento();
  // Em produção: redirecionar o usuário para `url`

  // 4. Após callback, trocar code por token
  // const integracao = await exemploCallbackOAuth('code_aqui', 'state_aqui');

  // Mock para exemplo:
  const integracaoMock: IntegracaoOpenBanking = {
    id: 'int-123',
    bancoCodigo: '341',
    usuarioId: 'user-123',
    accessToken: 'mock_token',
    refreshToken: 'mock_refresh',
    expiresAt: new Date(Date.now() + 3600 * 1000),
    scopes: ['extrato', 'dados-conta'],
    status: 'ativo',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  };

  // 5. Obter dados da conta
  // const contas = await exemploObterDadosConta(integracaoMock);

  // 6. Obter extrato
  // const extrato = await exemploObterExtrato(integracaoMock, 'account-123');

  console.log('\n=== Fluxo simulado concluído ===');
}

// ============================================================================// EXEMPLO 8: Tratamento de Erros
// ============================================================================
export function exemploTratamentoErros(response: ApiResponse<unknown>) {
  if (!response.success) {
    const error = response.error;

    switch (error?.code) {
      case 'RATE_LIMIT_EXCEEDED':
        console.warn('Limite de requisições excedido. Aguarde antes de tentar novamente.');
        break;
      case 'TIMEOUT':
        console.warn('A requisição demorou muito. Verifique sua conexão.');
        break;
      case 'NETWORK_ERROR':
        console.warn('Erro de rede. Verifique sua conexão com a internet.');
        break;
      case 'INVALID_TOKEN':
      case 'TOKEN_EXPIRED':
        console.error('Token inválido ou expirado. Necessário reautorizar.');
        limparDadosAuth();
        break;
      default:
        console.error('Erro:', error?.message);
    }

    return false;
  }

  return true;
}

// Exportar exemplo de uso para documentação
export const EXEMPLO_USO_MARKDOWN = `
## Exemplo de Uso - Open Banking

### 1. Configurar Variáveis de Ambiente

\`\`\`env
# .env
VITE_OPEN_BANKING_AMBIENTE=sandbox
VITE_OPEN_BANKING_REDIRECT_URI=http://localhost:5173/open-banking/callback

VITE_ITAU_CLIENT_ID_SANDBOX=seu_client_id_itau
VITE_ITAU_CLIENT_ID_PROD=seu_client_id_itau_prod

VITE_BRADESCO_CLIENT_ID_SANDBOX=seu_client_id_bradesco
# ... demais bancos
\`\`\`

### 2. Iniciar Integração

\`\`\`typescript
import { iniciarFluxoConsentimento } from '@/lib/openBanking';

const { url } = await iniciarFluxoConsentimento('341', userId);
window.location.href = url; // Redireciona para o banco
\`\`\`

### 3. Processar Callback

\`\`\`typescript
import { trocarCodePorToken } from '@/lib/openBanking';

// Na página de callback (/open-banking/callback)
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');

const tokenData = await trocarCodePorToken(code, state);
// Salvar tokenData no banco de dados
\`\`\`

### 4. Usar a API

\`\`\`typescript
import { criarOpenBankingClient } from '@/lib/openBanking';

const client = criarOpenBankingClient(integracao);
const { data: contas } = await client.obterDadosConta();
const { data: extrato } = await client.obterExtrato(accountId, dataInicio, dataFim);
\`\`\`

### 5. Parse dos Dados

\`\`\`typescript
import { criarParser } from '@/lib/openBanking';

const parser = criarParser('341');
const extratoNormalizado = parser.parseExtrato(extratoData);
const transacoesPorCategoria = parser.agruparPorCategoria(extratoNormalizado.transacoes);
\`\`\`
`;
