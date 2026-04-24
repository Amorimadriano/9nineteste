/**
 * Validadores de segurança para upload de arquivos de cartões
 * @agente-seguranca
 */

export const ARQUIVO_CONFIG = {
  extensoesPermitidas: ['.csv', '.xlsx', '.xls', '.txt'],
  tamanhoMaximo: 10 * 1024 * 1024, // 10MB
  tiposMimePermitidos: [
    'text/csv',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream',
  ],
};

export interface ValidacaoArquivoResultado {
  valido: boolean;
  erro?: string;
}

/**
 * Valida arquivo de extrato antes do upload
 */
export function validarArquivoExtrato(
  arquivo: File
): ValidacaoArquivoResultado {
  // Validar extensão
  const extensao = '.' + arquivo.name.split('.').pop()?.toLowerCase();
  if (!ARQUIVO_CONFIG.extensoesPermitidas.includes(extensao)) {
    return {
      valido: false,
      erro: `Tipo de arquivo não permitido. Use: ${ARQUIVO_CONFIG.extensoesPermitidas.join(', ')}`,
    };
  }

  // Validar tamanho
  if (arquivo.size > ARQUIVO_CONFIG.tamanhoMaximo) {
    return {
      valido: false,
      erro: `Arquivo muito grande (máx ${(ARQUIVO_CONFIG.tamanhoMaximo / 1024 / 1024).toFixed(0)}MB)`,
    };
  }

  // Validar tipo MIME (opcional, browsers nem sempre reportam corretamente)
  if (arquivo.type && !ARQUIVO_CONFIG.tiposMimePermitidos.includes(arquivo.type)) {
    // Não rejeitar, apenas logar aviso - muitos CSVs vêm como application/octet-stream
    console.warn('Tipo MIME não padrão:', arquivo.type);
  }

  // Verificar nome suspeito
  const nomeLower = arquivo.name.toLowerCase();
  const extensoesPerigosas = ['.exe', '.bat', '.cmd', '.sh', '.php', '.jsp'];
  for (const ext of extensoesPerigosas) {
    if (nomeLower.includes(ext)) {
      return {
        valido: false,
        erro: 'Nome de arquivo suspeito detectado',
      };
    }
  }

  return { valido: true };
}

/**
 * Sanitiza conteúdo de arquivo para prevenir injection
 */
export function sanitizarConteudoArquivo(conteudo: string): string {
  // Remover scripts potenciais
  return conteudo
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
}

/**
 * Valida se o conteúdo parece um arquivo de extrato válido
 */
export function validarConteudoExtrato(conteudo: string): ValidacaoArquivoResultado {
  const linhas = conteudo.split('\n').filter(l => l.trim());

  if (linhas.length < 2) {
    return {
      valido: false,
      erro: 'Arquivo vazio ou sem dados suficientes',
    };
  }

  // Verificar se tem caracteres estranhos (possível arquivo binário)
  const contemCaracteresEstranhos = /[\x00-\x08\x0b-\x0c\x0e-\x1f]/.test(conteudo);
  if (contemCaracteresEstranhos) {
    return {
      valido: false,
      erro: 'Arquivo contém caracteres inválidos',
    };
  }

  return { valido: true };
}

/**
 * Verifica rate limiting simples (em memória)
 * Em produção, usar Redis ou similar
 */
const uploadAttempts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = {
  maxAttempts: 10,
  windowMs: 60 * 60 * 1000, // 1 hora
};

export function verificarRateLimit(userId: string): ValidacaoArquivoResultado {
  const now = Date.now();
  const userAttempts = uploadAttempts.get(userId);

  if (!userAttempts || now > userAttempts.resetTime) {
    uploadAttempts.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs,
    });
    return { valido: true };
  }

  if (userAttempts.count >= RATE_LIMIT.maxAttempts) {
    return {
      valido: false,
      erro: 'Limite de uploads excedido. Tente novamente em 1 hora.',
    };
  }

  userAttempts.count++;
  return { valido: true };
}

/**
 * Limpa tentativas antigas de rate limiting
 */
export function limparRateLimitAntigo(): void {
  const now = Date.now();
  for (const [userId, attempts] of uploadAttempts.entries()) {
    if (now > attempts.resetTime) {
      uploadAttempts.delete(userId);
    }
  }
}

// Limpar a cada 10 minutos
if (typeof window !== 'undefined') {
  setInterval(limparRateLimitAntigo, 10 * 60 * 1000);
}
