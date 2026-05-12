/**
 * Módulo de Autenticação OAuth2/PKCE para Open Banking
 * Task #23 - Agente Financeiro & DevOps
 */

import {
  BANCOS,
  BancoCodigo,
  OPEN_BANKING_CONFIG,
  obterConfigBanco,
  type Ambiente,
} from './config';

// Interfaces
export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string;
}

export interface ConsentimentoState {
  bancoCodigo: BancoCodigo;
  state: string;
  codeVerifier: string;
  scopes: string[];
  usuarioId: string;
  timestamp: number;
}

export interface IntegracaoOpenBanking {
  id: string;
  bancoCodigo: BancoCodigo;
  usuarioId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scopes: string[];
  status: 'ativo' | 'expirado' | 'revogado';
  criadoEm: Date;
  atualizadoEm: Date;
}

// Chaves para armazenamento local (temporário durante fluxo OAuth)
const STORAGE_KEY_PKCE = 'ninebpo_openbanking_pkce';
const STORAGE_KEY_STATE = 'ninebpo_openbanking_state';

/**
 * Gera um code verifier aleatório para PKCE
 * Conforme RFC 7636
 */
function gerarCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

/**
 * Gera o code challenge a partir do code verifier (SHA-256)
 */
async function gerarCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(hash));
}

/**
 * Codifica ArrayBuffer para Base64URL
 */
function base64URLEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Gera um state aleatório para proteção contra CSRF
 */
function gerarState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

/**
 * Cria um challenge PKCE completo
 */
export async function criarPKCEChallenge(): Promise<PKCEChallenge> {
  const codeVerifier = gerarCodeVerifier();
  const codeChallenge = await gerarCodeChallenge(codeVerifier);
  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256',
  };
}

/**
 * Inicia o fluxo de consentimento OAuth2/PKCE
 * Retorna a URL para redirecionar o usuário
 */
export async function iniciarFluxoConsentimento(
  bancoCodigo: BancoCodigo,
  usuarioId: string,
  scopes?: string[]
): Promise<{ url: string; state: string }> {
  const config = obterConfigBanco(bancoCodigo);
  const ambiente = OPEN_BANKING_CONFIG.ambiente;

  // Gerar PKCE
  const pkce = await criarPKCEChallenge();
  const state = gerarState();

  // Salvar state e PKCE no localStorage para validação no callback
  const stateData: ConsentimentoState = {
    bancoCodigo,
    state,
    codeVerifier: pkce.codeVerifier,
    scopes: scopes || config.scopesPadrao,
    usuarioId,
    timestamp: Date.now(),
  };

  localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(stateData));

  // Construir URL de autorização
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId[ambiente],
    redirect_uri: OPEN_BANKING_CONFIG.redirectUri,
    scope: (scopes || config.scopesPadrao).join(' '),
    state: state,
    code_challenge: pkce.codeChallenge,
    code_challenge_method: pkce.codeChallengeMethod,
  });

  const authUrl = `${config.authUrl[ambiente]}?${params.toString()}`;

  return { url: authUrl, state };
}

/**
 * Troca o authorization code por tokens de acesso
 */
export async function trocarCodePorToken(
  code: string,
  state: string
): Promise<TokenResponse & { bancoCodigo: BancoCodigo; usuarioId: string }> {
  // Recuperar dados do state
  const stateDataRaw = localStorage.getItem(STORAGE_KEY_STATE);
  if (!stateDataRaw) {
    throw new Error('Sessão de consentimento não encontrada ou expirada');
  }

  const stateData: ConsentimentoState = JSON.parse(stateDataRaw);

  // Validar state (proteção CSRF)
  if (stateData.state !== state) {
    throw new Error('State inválido - possível ataque CSRF');
  }

  // Validar tempo de expiração (10 minutos)
  if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
    throw new Error('Sessão de consentimento expirada');
  }

  const config = obterConfigBanco(stateData.bancoCodigo);
  const ambiente = OPEN_BANKING_CONFIG.ambiente;

  // Preparar requisição de token
  const tokenParams = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: OPEN_BANKING_CONFIG.redirectUri,
    client_id: config.clientId[ambiente],
    code_verifier: stateData.codeVerifier,
  });

  try {
    const response = await fetch(config.tokenUrl[ambiente], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Erro ao obter token: ${error.error_description || error.error || response.statusText}`
      );
    }

    const tokenData: TokenResponse = await response.json();

    // Limpar storage temporário
    localStorage.removeItem(STORAGE_KEY_STATE);
    localStorage.removeItem(STORAGE_KEY_PKCE);

    return {
      ...tokenData,
      bancoCodigo: stateData.bancoCodigo,
      usuarioId: stateData.usuarioId,
    };
  } catch (error) {
    console.error('Erro na troca de code por token:', error);
    throw error;
  }
}

/**
 * Renova o access token usando o refresh token
 */
export async function refreshAccessToken(
  integracao: IntegracaoOpenBanking
): Promise<TokenResponse> {
  const config = obterConfigBanco(integracao.bancoCodigo);
  const ambiente = OPEN_BANKING_CONFIG.ambiente;

  const refreshParams = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: integracao.refreshToken,
    client_id: config.clientId[ambiente],
    scope: integracao.scopes.join(' '),
  });

  try {
    const response = await fetch(config.tokenUrl[ambiente], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: refreshParams.toString(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Erro ao renovar token: ${error.error_description || error.error || response.statusText}`
      );
    }

    const tokenData: TokenResponse = await response.json();
    return tokenData;
  } catch (error) {
    console.error('Erro no refresh token:', error);
    throw error;
  }
}

/**
 * Revoga um token de acesso
 */
export async function revogarToken(
  integracao: IntegracaoOpenBanking,
  tokenTypeHint?: 'access_token' | 'refresh_token'
): Promise<void> {
  const config = obterConfigBanco(integracao.bancoCodigo);
  const ambiente = OPEN_BANKING_CONFIG.ambiente;

  const tokenToRevoke = tokenTypeHint === 'refresh_token'
    ? integracao.refreshToken
    : integracao.accessToken;

  const revokeParams = new URLSearchParams({
    token: tokenToRevoke,
    client_id: config.clientId[ambiente],
  });

  if (tokenTypeHint) {
    revokeParams.append('token_type_hint', tokenTypeHint);
  }

  try {
    const response = await fetch(
      config.tokenUrl[ambiente].replace('/token', '/revoke'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: revokeParams.toString(),
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao revogar token: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Erro na revogação de token:', error);
    throw error;
  }
}

/**
 * Verifica se o token está expirado
 */
export function isTokenExpirado(integracao: IntegracaoOpenBanking): boolean {
  return new Date() >= integracao.expiresAt;
}

/**
 * Calcula a data de expiração baseada no expires_in
 */
export function calcularExpiracao(expiresIn: number): Date {
  return new Date(Date.now() + expiresIn * 1000);
}

/**
 * Valida se o banco está configurado para o ambiente atual
 */
export function isBancoConfigurado(bancoCodigo: BancoCodigo): boolean {
  const config = BANCOS[bancoCodigo];
  if (!config) return false;

  const ambiente = OPEN_BANKING_CONFIG.ambiente;
  return !!config.clientId[ambiente];
}

/**
 * Obtém a URL de callback configurada
 */
export function getRedirectUri(): string {
  return OPEN_BANKING_CONFIG.redirectUri;
}

/**
 * Limpa dados temporários de autenticação
 */
export function limparDadosAuth(): void {
  localStorage.removeItem(STORAGE_KEY_STATE);
  localStorage.removeItem(STORAGE_KEY_PKCE);
}
