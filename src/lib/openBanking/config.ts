/**
 * Configurações para integração com Open Banking Brasileiro
 * Task #23 - Agente Financeiro & DevOps
 */

export type Ambiente = 'sandbox' | 'producao';
export type BancoCodigo = '341' | '237' | '033' | '001' | '260' | '077';

export interface ConfigBanco {
  codigo: BancoCodigo;
  nome: string;
  nomeExibicao: string;
  authUrl: {
    sandbox: string;
    producao: string;
  };
  tokenUrl: {
    sandbox: string;
    producao: string;
  };
  apiBaseUrl: {
    sandbox: string;
    producao: string;
  };
  clientId: {
    sandbox: string;
    producao: string;
  };
  scopesPadrao: string[];
}

export interface ConfigOpenBanking {
  ambiente: Ambiente;
  redirectUri: string;
  timeoutMs: number;
  maxRetries: number;
  retryDelayMs: number;
}

// Configurações dos principais bancos brasileiros
export const BANCOS: Record<BancoCodigo, ConfigBanco> = {
  // Itaú
  '341': {
    codigo: '341',
    nome: 'Itau Unibanco S.A.',
    nomeExibicao: 'Itaú',
    authUrl: {
      sandbox: 'https://sandbox.oAuthItau.com.br/oauth/authorize',
      producao: 'https://oauth.itau.com.br/oauth/authorize',
    },
    tokenUrl: {
      sandbox: 'https://sandbox.oAuthItau.com.br/oauth/token',
      producao: 'https://oauth.itau.com.br/oauth/token',
    },
    apiBaseUrl: {
      sandbox: 'https://sandbox.openbanking.itau.com.br/open-banking',
      producao: 'https://openbanking.itau.com.br/open-banking',
    },
    clientId: {
      sandbox: import.meta.env.VITE_ITAU_CLIENT_ID_SANDBOX || '',
      producao: import.meta.env.VITE_ITAU_CLIENT_ID_PROD || '',
    },
    scopesPadrao: ['extrato', 'dados-conta', 'dados-carta'],
  },

  // Bradesco
  '237': {
    codigo: '237',
    nome: 'Banco Bradesco S.A.',
    nomeExibicao: 'Bradesco',
    authUrl: {
      sandbox: 'https://oauth.sandbox.bradesco.com.br/auth/server/authorization',
      producao: 'https://oauth.bradesco.com.br/auth/server/authorization',
    },
    tokenUrl: {
      sandbox: 'https://oauth.sandbox.bradesco.com.br/auth/server/token',
      producao: 'https://oauth.bradesco.com.br/auth/server/token',
    },
    apiBaseUrl: {
      sandbox: 'https://api.sandbox.bradesco.com.br/open-banking',
      producao: 'https://api.bradesco.com.br/open-banking',
    },
    clientId: {
      sandbox: import.meta.env.VITE_BRADESCO_CLIENT_ID_SANDBOX || '',
      producao: import.meta.env.VITE_BRADESCO_CLIENT_ID_PROD || '',
    },
    scopesPadrao: ['extrato', 'dados-conta', 'dados-carta'],
  },

  // Santander
  '033': {
    codigo: '033',
    nome: 'Banco Santander (Brasil) S.A.',
    nomeExibicao: 'Santander',
    authUrl: {
      sandbox: 'https://oauth.sandbox.santander.com.br/oauth/authorize',
      producao: 'https://oauth.santander.com.br/oauth/authorize',
    },
    tokenUrl: {
      sandbox: 'https://oauth.sandbox.santander.com.br/oauth/token',
      producao: 'https://oauth.santander.com.br/oauth/token',
    },
    apiBaseUrl: {
      sandbox: 'https://openbanking-api.sandbox.santander.com.br/v1',
      producao: 'https://openbanking-api.santander.com.br/v1',
    },
    clientId: {
      sandbox: import.meta.env.VITE_SANTANDER_CLIENT_ID_SANDBOX || '',
      producao: import.meta.env.VITE_SANTANDER_CLIENT_ID_PROD || '',
    },
    scopesPadrao: ['extrato', 'dados-conta', 'dados-carta'],
  },

  // Banco do Brasil
  '001': {
    codigo: '001',
    nome: 'Banco do Brasil S.A.',
    nomeExibicao: 'Banco do Brasil',
    authUrl: {
      sandbox: 'https://oauth.sandbox.bb.com.br/oauth/authorize',
      producao: 'https://oauth.bb.com.br/oauth/authorize',
    },
    tokenUrl: {
      sandbox: 'https://oauth.sandbox.bb.com.br/oauth/token',
      producao: 'https://oauth.bb.com.br/oauth/token',
    },
    apiBaseUrl: {
      sandbox: 'https://api.sandbox.bb.com.br/open-banking/v1',
      producao: 'https://api.bb.com.br/open-banking/v1',
    },
    clientId: {
      sandbox: import.meta.env.VITE_BB_CLIENT_ID_SANDBOX || '',
      producao: import.meta.env.VITE_BB_CLIENT_ID_PROD || '',
    },
    scopesPadrao: ['extrato', 'dados-conta', 'dados-carta'],
  },

  // Nubank
  '260': {
    codigo: '260',
    nome: 'Nu Pagamentos S.A.',
    nomeExibicao: 'Nubank',
    authUrl: {
      sandbox: 'https://sandbox.nubank.com.br/oauth/authorize',
      producao: 'https://nubank.com.br/oauth/authorize',
    },
    tokenUrl: {
      sandbox: 'https://sandbox.nubank.com.br/oauth/token',
      producao: 'https://nubank.com.br/oauth/token',
    },
    apiBaseUrl: {
      sandbox: 'https://prod-sandbox.openfinance.nubank.com.br/open-banking',
      producao: 'https://prod.openfinance.nubank.com.br/open-banking',
    },
    clientId: {
      sandbox: import.meta.env.VITE_NUBANK_CLIENT_ID_SANDBOX || '',
      producao: import.meta.env.VITE_NUBANK_CLIENT_ID_PROD || '',
    },
    scopesPadrao: ['extrato', 'dados-conta', 'dados-carta'],
  },

  // Inter
  '077': {
    codigo: '077',
    nome: 'Banco Inter S.A.',
    nomeExibicao: 'Inter',
    authUrl: {
      sandbox: 'https://oauth.inter.co/oauth/authorize',
      producao: 'https://oauth.inter.co/oauth/authorize',
    },
    tokenUrl: {
      sandbox: 'https://oauth.inter.co/oauth/token',
      producao: 'https://oauth.inter.co/oauth/token',
    },
    apiBaseUrl: {
      sandbox: 'https://openapi-sandbox.inter.co/open-banking/v1',
      producao: 'https://openapi.inter.co/open-banking/v1',
    },
    clientId: {
      sandbox: import.meta.env.VITE_INTER_CLIENT_ID_SANDBOX || '',
      producao: import.meta.env.VITE_INTER_CLIENT_ID_PROD || '',
    },
    scopesPadrao: ['extrato', 'dados-conta', 'dados-carta'],
  },
};

// Configurações globais do Open Banking
export const OPEN_BANKING_CONFIG: ConfigOpenBanking = {
  ambiente: (import.meta.env.VITE_OPEN_BANKING_AMBIENTE as Ambiente) || 'sandbox',
  redirectUri: import.meta.env.VITE_OPEN_BANKING_REDIRECT_URI || 'http://localhost:5173/open-banking/callback',
  timeoutMs: 30000,
  maxRetries: 3,
  retryDelayMs: 1000,
};

// Scopes obrigatórios do Open Banking Brasil
export const SCOPES_OBRIGATORIOS = [
  'openid',
  'extrato',
  'dados-conta',
  'dados-carta',
] as const;

// Scopes opcionais adicionais
export const SCOPES_OPCIONAIS = [
  'dados-pessoa',
  'pagamentos',
] as const;

// Headers padrão para requisições
export const HEADERS_PADRAO = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-Request-Id': () => crypto.randomUUID(),
};

// Rate limits por banco (requisições por minuto)
export const RATE_LIMITS: Record<BancoCodigo, { default: number; extrato: number }> = {
  '341': { default: 60, extrato: 30 },
  '237': { default: 60, extrato: 30 },
  '033': { default: 60, extrato: 30 },
  '001': { default: 60, extrato: 30 },
  '260': { default: 60, extrato: 30 },
  '077': { default: 60, extrato: 30 },
};

// Códigos de erro do Open Banking
export const ERROS_OPEN_BANKING = {
  INVALID_REQUEST: 'Requisição inválida',
  INVALID_CLIENT: 'Cliente inválido',
  INVALID_GRANT: 'Grant inválido',
  UNAUTHORIZED_CLIENT: 'Cliente não autorizado',
  UNSUPPORTED_GRANT_TYPE: 'Tipo de grant não suportado',
  INVALID_SCOPE: 'Scope inválido',
  ACCESS_DENIED: 'Acesso negado',
  SERVER_ERROR: 'Erro no servidor',
  RATE_LIMIT_EXCEEDED: 'Limite de requisições excedido',
} as const;

// Helper para obter configuração de um banco específico
export function obterConfigBanco(codigo: BancoCodigo): ConfigBanco {
  const config = BANCOS[codigo];
  if (!config) {
    throw new Error(`Banco com código ${codigo} não suportado`);
  }
  return config;
}

// Helper para obter URL base da API conforme ambiente
export function obterApiUrl(codigo: BancoCodigo, ambiente?: Ambiente): string {
  const config = obterConfigBanco(codigo);
  const amb = ambiente || OPEN_BANKING_CONFIG.ambiente;
  return config.apiBaseUrl[amb];
}

// Helper para obter client ID conforme ambiente
export function obterClientId(codigo: BancoCodigo, ambiente?: Ambiente): string {
  const config = obterConfigBanco(codigo);
  const amb = ambiente || OPEN_BANKING_CONFIG.ambiente;
  return config.clientId[amb];
}

// Lista de bancos disponíveis para seleção
export const BANCOS_DISPONIVEIS = Object.values(BANCOS).map(b => ({
  codigo: b.codigo,
  nome: b.nomeExibicao,
  nomeCompleto: b.nome,
}));
