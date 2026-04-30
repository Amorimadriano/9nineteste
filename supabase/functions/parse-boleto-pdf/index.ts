const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://9ninebusinesscontrol.com.br",
  "https://www.9ninebusinesscontrol.com.br",
  "https://ninebpofinanceiro.lovable.app",
  "https://ninebpofinanceiro.vercel.app",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ============================================
// UTILITÁRIOS DE BOLETO
// ============================================

const BANCOS: Record<string, string> = {
  "001": "Banco do Brasil",
  "033": "Santander",
  "104": "Caixa Econômica Federal",
  "237": "Bradesco",
  "341": "Itaú",
  "399": "HSBC",
  "041": "Banrisul",
  "077": "Banco Inter",
  "260": "Nu Pagamentos (Nubank)",
  "290": "PagBank",
  "380": "PicPay",
  "422": "Safra",
  "623": "Panamericano",
  "633": "Rendimento",
  "652": "Itaú Unibanco",
  "735": "Neon",
  "745": "Citibank",
};

const SEGMENTOS_ARRECADACAO: Record<string, string> = {
  "1": "Prefeituras",
  "2": "Saneamento",
  "3": "Energia Elétrica e Gás",
  "4": "Telecomunicações",
  "5": "Órgãos Governamentais",
  "6": "Carnês e Assemelhados",
  "7": "Multas",
  "9": "Uso Exclusivo da Empresa",
};

function calcularDataVencimento(fatorVencimento: number): string {
  const dataBase = new Date(1997, 9, 7);
  const dataVencimento = new Date(dataBase.getTime() + fatorVencimento * 24 * 60 * 60 * 1000);
  const ano = dataVencimento.getFullYear();
  const mes = String(dataVencimento.getMonth() + 1).padStart(2, "0");
  const dia = String(dataVencimento.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function calcularDvModulo10(numeros: string): number {
  let soma = 0;
  let multiplicador = 2;
  for (let i = numeros.length - 1; i >= 0; i--) {
    let resultado = parseInt(numeros[i], 10) * multiplicador;
    if (resultado > 9) resultado -= 9;
    soma += resultado;
    multiplicador = multiplicador === 2 ? 1 : 2;
  }
  const resto = soma % 10;
  return resto === 0 ? 0 : 10 - resto;
}

function calcularDvModulo11(codigo44: string): string {
  let multiplicador = 2;
  let soma = 0;
  for (let i = codigo44.length - 1; i >= 0; i--) {
    if (i === 3) continue;
    const digito = parseInt(codigo44[i], 10);
    soma += digito * multiplicador;
    multiplicador = multiplicador === 9 ? 2 : multiplicador + 1;
  }
  const resto = soma % 11;
  const dv = 11 - resto;
  if (dv === 0 || dv === 10 || dv === 11) return "1";
  return String(dv);
}

function calcularDvModulo11Arrecadacao(numeros: string): number {
  let multiplicador = 2;
  let soma = 0;
  for (let i = numeros.length - 1; i >= 0; i--) {
    const digito = parseInt(numeros[i], 10);
    soma += digito * multiplicador;
    multiplicador = multiplicador === 9 ? 2 : multiplicador + 1;
  }
  const resto = soma % 11;
  if (resto === 0 || resto === 1) return 0;
  return 11 - resto;
}

// ============================================
// PARSE DE BOLETO DE COBRANÇA
// ============================================

function validarLinhaDigitavelCobranca(linha: string): boolean {
  if (linha.length !== 47) return false;
  const campos = [
    { inicio: 0, fim: 9, dvPos: 9 },
    { inicio: 10, fim: 20, dvPos: 20 },
    { inicio: 21, fim: 31, dvPos: 31 },
  ];
  for (const campo of campos) {
    const numeros = linha.substring(campo.inicio, campo.fim);
    const dvInformado = parseInt(linha[campo.dvPos], 10);
    const dvCalculado = calcularDvModulo10(numeros);
    if (dvInformado !== dvCalculado) return false;
  }
  return true;
}

function linhaDigitavelParaCodigoBarrasCobranca(linha: string): string {
  const produto = linha.substring(0, 3);
  const segmento = linha.substring(3, 4);
  const identCedente = linha.substring(4, 8);
  const livre1 = linha.substring(8, 19);
  const livre2 = linha.substring(20, 23);
  const livre3 = linha.substring(24, 32);
  const fatorVencimento = linha.substring(33, 37);
  const valor = linha.substring(37, 47);
  const codigo44 = produto + segmento + "0" + fatorVencimento + valor + identCedente + livre1 + livre2 + livre3;
  const dvCodigoBarras = calcularDvModulo11(codigo44);
  return produto + segmento + dvCodigoBarras + fatorVencimento + valor + identCedente + livre1 + livre2 + livre3;
}

function parsearLinhaDigitavelCobranca(linha: string, forcar = false) {
  const clean = linha.replace(/\D/g, "");
  if (clean.length !== 47) {
    throw new Error(`Linha digitável de cobrança deve ter 47 dígitos. Fornecido: ${clean.length}`);
  }
  const validado = validarLinhaDigitavelCobranca(clean);
  if (!validado && !forcar) {
    throw new Error("DV incorreto");
  }
  const codigoBanco = clean.substring(0, 3);
  const fatorVencimento = parseInt(clean.substring(33, 37), 10);
  const valorRaw = clean.substring(37, 47);
  const valor = parseFloat(`${valorRaw.substring(0, 8)}.${valorRaw.substring(8)}`);
  const dataVencimento = calcularDataVencimento(fatorVencimento);
  const codigoBarras = linhaDigitavelParaCodigoBarrasCobranca(clean);
  return {
    tipo: "cobranca",
    descricao: `Boleto ${BANCOS[codigoBanco] || `Banco ${codigoBanco}`}`,
    valor: valor > 0 ? valor.toFixed(2) : null,
    data_vencimento: dataVencimento,
    documento: clean.substring(19, 23),
    beneficiario: BANCOS[codigoBanco] || `Banco ${codigoBanco}`,
    codigo_barras: clean,
    banco: BANCOS[codigoBanco] || `Banco ${codigoBanco} — Código ${codigoBanco}`,
    codigo_banco: codigoBanco,
    fator_vencimento: fatorVencimento,
    codigo_barras_44: codigoBarras,
    validado,
  };
}

function parsearCodigoBarrasCobranca(codigo: string) {
  const codigoBanco = codigo.substring(0, 3);
  const fatorVencimento = parseInt(codigo.substring(5, 9), 10);
  const valorRaw = codigo.substring(9, 19);
  const valor = parseFloat(`${valorRaw.substring(0, 8)}.${valorRaw.substring(8)}`);
  const dataVencimento = calcularDataVencimento(fatorVencimento);
  return {
    tipo: "cobranca",
    descricao: `Boleto ${BANCOS[codigoBanco] || `Banco ${codigoBanco}`}`,
    valor: valor > 0 ? valor.toFixed(2) : null,
    data_vencimento: dataVencimento,
    documento: codigo.substring(19, 23),
    beneficiario: BANCOS[codigoBanco] || `Banco ${codigoBanco}`,
    codigo_barras: codigo,
    banco: BANCOS[codigoBanco] || `Banco ${codigoBanco} — Código ${codigoBanco}`,
    codigo_banco: codigoBanco,
    fator_vencimento: fatorVencimento,
    validado: true,
  };
}

// ============================================
// PARSE DE BOLETO DE ARRECADAÇÃO
// ============================================

function validarLinhaDigitavelArrecadacao(linha: string): boolean {
  if (linha.length !== 48) return false;
  const campos = [
    { inicio: 0, fim: 11, dvPos: 11 },
    { inicio: 12, fim: 23, dvPos: 23 },
    { inicio: 24, fim: 35, dvPos: 35 },
    { inicio: 36, fim: 47, dvPos: 47 },
  ];
  const usaModulo10 = linha[0] === "8";
  for (const campo of campos) {
    const numeros = linha.substring(campo.inicio, campo.fim);
    const dvInformado = parseInt(linha[campo.dvPos], 10);
    const dvCalculado = usaModulo10 ? calcularDvModulo10(numeros) : calcularDvModulo11Arrecadacao(numeros);
    if (dvInformado !== dvCalculado) return false;
  }
  return true;
}

function linhaDigitavelParaCodigoBarrasArrecadacao(linha: string): string {
  return linha.substring(0, 11) + linha.substring(12, 23) + linha.substring(24, 35) + linha.substring(36, 47);
}

function extrairValorArrecadacao(codigo: string): number | null {
  const identValor = codigo.substring(2, 3);
  if (["6", "7", "8", "9"].includes(identValor)) {
    const valorRaw = codigo.substring(4, 15);
    const valor = parseFloat(valorRaw) / 100;
    return valor > 0 ? valor : null;
  }
  const valorRaw = codigo.substring(4, 15);
  const valor = parseFloat(valorRaw) / 100;
  return valor > 0 ? valor : null;
}

function parsearLinhaDigitavelArrecadacao(linha: string, forcar = false) {
  const clean = linha.replace(/\D/g, "");
  if (clean.length !== 48) {
    throw new Error(`Linha digitável de arrecadação deve ter 48 dígitos. Fornecido: ${clean.length}`);
  }
  const validado = validarLinhaDigitavelArrecadacao(clean);
  if (!validado && !forcar) {
    throw new Error("DV incorreto");
  }
  const segmento = clean.substring(1, 2);
  const codigoBarras = linhaDigitavelParaCodigoBarrasArrecadacao(clean);
  const valor = extrairValorArrecadacao(codigoBarras);
  return {
    tipo: "arrecadacao",
    descricao: `Boleto ${SEGMENTOS_ARRECADACAO[segmento] || "Arrecadação"}`,
    valor: valor ? valor.toFixed(2) : null,
    data_vencimento: null,
    documento: clean.substring(4, 20),
    beneficiario: SEGMENTOS_ARRECADACAO[segmento] || "Arrecadação",
    codigo_barras: clean,
    banco: SEGMENTOS_ARRECADACAO[segmento] || `Arrecadação — Segmento ${segmento}`,
    codigo_banco: segmento,
    fator_vencimento: null,
    codigo_barras_44: codigoBarras,
    validado,
  };
}

function parsearCodigoBarrasArrecadacao(codigo: string) {
  const segmento = codigo.substring(1, 2);
  const valor = extrairValorArrecadacao(codigo);
  return {
    tipo: "arrecadaacao",
    descricao: `Boleto ${SEGMENTOS_ARRECADACAO[segmento] || "Arrecadação"}`,
    valor: valor ? valor.toFixed(2) : null,
    data_vencimento: null,
    documento: codigo.substring(4, 20),
    beneficiario: SEGMENTOS_ARRECADACAO[segmento] || "Arrecadação",
    codigo_barras: codigo,
    banco: SEGMENTOS_ARRECADACAO[segmento] || `Arrecadação — Segmento ${segmento}`,
    codigo_banco: segmento,
    fator_vencimento: null,
    validado: true,
  };
}

// ============================================
// PARSE GENÉRICO / FALLBACK
// ============================================

/**
 * Tenta parsear QUALQUER sequência de dígitos como boleto.
 * Usado como fallback quando os padrões 44/47/48 falham.
 */
function parsearGenerico(codigoLimpo: string) {
  const len = codigoLimpo.length;

  // Tenta detectar tipo pela estrutura
  const primeiroDigito = codigoLimpo[0];

  // Se começa com 8, provavelmente é arrecadação
  if (primeiroDigito === "8" && len >= 36) {
    // Tenta reconstruir como código de barras de arrecadação
    // Preenche com zeros à direita se necessário para chegar a 44
    const codigo44 = codigoLimpo.padEnd(44, "0").substring(0, 44);
    try {
      return parsearCodigoBarrasArrecadacao(codigo44);
    } catch {
      // Fallback genérico
      const segmento = codigo44.substring(1, 2);
      const valor = extrairValorArrecadacao(codigo44);
      return {
        tipo: "arrecadacao",
        descricao: `Boleto ${SEGMENTOS_ARRECADACAO[segmento] || "Arrecadação"}`,
        valor: valor ? valor.toFixed(2) : null,
        data_vencimento: null,
        documento: codigoLimpo,
        beneficiario: SEGMENTOS_ARRECADACAO[segmento] || "Arrecadação",
        codigo_barras: codigoLimpo,
        banco: SEGMENTOS_ARRECADACAO[segmento] || "Arrecadação",
        codigo_banco: segmento,
        fator_vencimento: null,
        validado: false,
      };
    }
  }

  // Se começa com código de banco conhecido, provavelmente é cobrança
  const codigoBanco = codigoLimpo.substring(0, 3);
  if (BANCOS[codigoBanco] && len >= 36) {
    // Tenta reconstruir como código de barras de cobrança
    const codigo44 = codigoLimpo.padEnd(44, "0").substring(0, 44);
    try {
      return parsearCodigoBarrasCobranca(codigo44);
    } catch {
      // Fallback: tenta extrair valor e vencimento manualmente
      const valorRaw = codigo44.substring(9, 19);
      const valor = parseFloat(`${valorRaw.substring(0, 8)}.${valorRaw.substring(8)}`);
      const fatorVencimento = parseInt(codigo44.substring(5, 9), 10);
      let dataVencimento = null;
      if (!isNaN(fatorVencimento) && fatorVencimento > 0) {
        try {
          dataVencimento = calcularDataVencimento(fatorVencimento);
        } catch {
          dataVencimento = null;
        }
      }
      return {
        tipo: "cobranca",
        descricao: `Boleto ${BANCOS[codigoBanco]}`,
        valor: valor > 0 ? valor.toFixed(2) : null,
        data_vencimento: dataVencimento,
        documento: codigoLimpo,
        beneficiario: BANCOS[codigoBanco],
        codigo_barras: codigoLimpo,
        banco: BANCOS[codigoBanco],
        codigo_banco: codigoBanco,
        fator_vencimento: fatorVencimento,
        validado: false,
      };
    }
  }

  // Último fallback: trata como boleto desconhecido
  return {
    tipo: "desconhecido",
    descricao: "Boleto",
    valor: null,
    data_vencimento: null,
    documento: codigoLimpo,
    beneficiario: null,
    codigo_barras: codigoLimpo,
    banco: null,
    codigo_banco: null,
    fator_vencimento: null,
    validado: false,
  };
}

// ============================================
// DETECÇÃO AUTOMÁTICA
// ============================================

function detectarETentarParse(codigoLimpo: string, forcar = false) {
  if (codigoLimpo.length === 47) {
    return parsearLinhaDigitavelCobranca(codigoLimpo, forcar);
  }
  if (codigoLimpo.length === 48) {
    return parsearLinhaDigitavelArrecadacao(codigoLimpo, forcar);
  }
  if (codigoLimpo.length === 44) {
    if (codigoLimpo[0] === "8") {
      return parsearCodigoBarrasArrecadacao(codigoLimpo);
    }
    return parsearCodigoBarrasCobranca(codigoLimpo);
  }
  // Fallback para códigos incompletos (36-43 ou 45-46 dígitos)
  if (codigoLimpo.length >= 36 && codigoLimpo.length <= 50) {
    return parsearGenerico(codigoLimpo);
  }
  throw new Error(`Código deve ter entre 36 e 48 dígitos. Fornecido: ${codigoLimpo.length}`);
}

// ============================================
// EXTRAÇÃO DE TEXTO DE PDF
// ============================================

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function bytesToLatin1(bytes: Uint8Array): string {
  // Otimização: usar array de chars + join em vez de concatenação de string
  const len = bytes.length;
  const chars = new Array(len);
  for (let i = 0; i < len; i++) {
    chars[i] = String.fromCharCode(bytes[i]);
  }
  return chars.join("");
}

/**
 * Descomprime um stream zlib/deflate (raw, sem header).
 * Retorna null se falhar.
 */
async function decompressZlibRaw(bytes: Uint8Array): Promise<Uint8Array | null> {
  try {
    const stream = new DecompressionStream("deflate-raw");
    const writer = stream.writable.getWriter();
    await writer.write(bytes);
    await writer.close();
    const reader = stream.readable.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  } catch {
    return null;
  }
}

/**
 * Scanner de bytes direto: procura sequências de 44–48 dígitos no Uint8Array
 * SEM converter o PDF inteiro para string.
 * Ignora espaços (32) e pontos (46) entre dígitos.
 * Buffer limitado a 100 dígitos (trunca últimos 50 se estourar).
 * Retorna a primeira string de dígitos que conseguir parsear como boleto,
 * ou null se nada for encontrado.
 */
function buscarDigitosDireto(bytes: Uint8Array): string | null {
  let buf = "";
  const MAX_BUF = 100;
  const MIN_LEN = 44;

  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    const isDigit = b >= 48 && b <= 57;        // 0-9
    const isSep   = b === 32 || b === 46;       // space or dot

    if (isDigit) {
      buf += String.fromCharCode(b);
      if (buf.length >= MIN_LEN) {
        if (tentarExtrairDeTexto(buf)) {
          return buf;
        }
      }
      if (buf.length > MAX_BUF) {
        buf = buf.slice(-50);
      }
    } else if (!isSep) {
      // Caractere quebrador: reseta, mas antes tenta o que tem no buffer
      if (buf.length >= MIN_LEN && tentarExtrairDeTexto(buf)) {
        return buf;
      }
      buf = "";
    }
    // Se isSep, simplesmente ignora (mantém buffer de dígitos acumulados)
  }

  // Tenta no final também
  if (buf.length >= MIN_LEN && tentarExtrairDeTexto(buf)) {
    return buf;
  }
  return null;
}

/**
 * Tenta extrair texto de streams do PDF (limitado a maxStreams e tamanho).
 * Só é chamada como ÚLTIMO recurso para PDFs pequenos.
 */
async function extrairStreamsPdf(raw: string, maxStreams = 3): Promise<string[]> {
  const textos: string[] = [];

  const streamRegex = /stream\r?\n([\s\S]{0,524288}?)\r?\nendstream/g;
  let match: RegExpExecArray | null;
  let count = 0;

  while ((match = streamRegex.exec(raw)) !== null && count < maxStreams) {
    count++;
    const streamContent = match[1];
    const streamBytes = new Uint8Array(streamContent.length);
    for (let i = 0; i < streamContent.length; i++) {
      streamBytes[i] = streamContent.charCodeAt(i);
    }

    const decompressed = await decompressZlibRaw(streamBytes);
    if (decompressed) {
      const texto = bytesToLatin1(decompressed);
      textos.push(texto);
    } else {
      textos.push(streamContent);
    }
  }

  return textos;
}

/**
 * Extrai texto de um PDF usando múltiplas estratégias.
 * Otimizado: scanner de bytes direto como PRIMEIRA fase (early return).
 * Só converte o PDF para string e processa streams como ÚLTIMO recurso.
 */
async function extrairTextoPdf(bytes: Uint8Array): Promise<string | null> {
  const startTime = Date.now();
  try {
    // ═══════════════════════════════════════════════════
    // FASE 0: Scanner de bytes direto (mais rápido possível)
    // ═══════════════════════════════════════════════════
    const digitosDireto = buscarDigitosDireto(bytes);
    if (digitosDireto) {
      console.log("[parse-boleto-pdf] boleto encontrado em", Date.now() - startTime, "ms via scanner de bytes");
      return digitosDireto;
    }

    // ═══════════════════════════════════════════════════
    // FASE 1: Conversão para string + busca simples no raw
    // ═══════════════════════════════════════════════════
    const raw = bytesToLatin1(bytes);

    // 1a. Strings entre parênteses (operador Tj / TJ)
    const textos: string[] = [];
    const regexParenteses = /\(([^()]{2,})\)/g;
    let match: RegExpExecArray | null;
    while ((match = regexParenteses.exec(raw)) !== null) {
      const text = match[1];
      if (/[a-zA-Z0-9]/.test(text)) textos.push(text);
    }

    // 1b. Texto entre parênteses escapados
    const regexEscapados = /\\\(([^\\]*)\\\)/g;
    while ((match = regexEscapados.exec(raw)) !== null) {
      textos.push(match[1]);
    }

    // 1c. Strings hex no formato PDF
    const regexHexStrings = /<([0-9A-Fa-f\s]{10,})>/g;
    let hexMatch: RegExpExecArray | null;
    while ((hexMatch = regexHexStrings.exec(raw)) !== null) {
      const hexStr = hexMatch[1].replace(/\s/g, "");
      if (hexStr.length % 2 === 0) {
        let decoded = "";
        for (let i = 0; i < hexStr.length; i += 2) {
          const byte = parseInt(hexStr.substring(i, i + 2), 16);
          if (byte >= 32 && byte < 127) decoded += String.fromCharCode(byte);
          else if (byte >= 160 && byte < 256) decoded += String.fromCharCode(byte);
        }
        if (decoded.length > 2) textos.push(decoded);
      }
    }

    const textoParcial = textos.join("\n");
    if (tentarExtrairDeTexto(textoParcial)) {
      console.log("[parse-boleto-pdf] boleto encontrado em", Date.now() - startTime, "ms via texto bruto do PDF");
      return textoParcial;
    }

    // ═══════════════════════════════════════════════════
    // FASE 2: Streams do PDF — ÚLTIMO recurso, só para PDFs pequenos
    // ═══════════════════════════════════════════════════
    if (bytes.length < 300_000) {
      const streamsTexto = await extrairStreamsPdf(raw, 3);
      for (const streamTexto of streamsTexto) {
        if (tentarExtrairDeTexto(streamTexto)) {
          console.log("[parse-boleto-pdf] boleto encontrado em", Date.now() - startTime, "ms via stream");
          return streamTexto;
        }
        textos.push(streamTexto);
      }
    }

    const textoFinal = textos.join("\n");
    console.log("[parse-boleto-pdf] extração completa em", Date.now() - startTime, "ms");
    return textoFinal.length > 0 ? textoFinal : null;
  } catch {
    return null;
  }
}

// ============================================
// FUNÇÕES DE BUSCA DE BOLETO EM TEXTO
// ============================================

function tentarExtrairDeTexto(texto: string): any {
  let boleto: any = null;

  // Tenta 47 dígitos (cobrança)
  const linhas47 = texto.match(/\d{47}/g);
  if (linhas47 && linhas47.length > 0) {
    for (const linha of linhas47) {
      try {
        boleto = parsearLinhaDigitavelCobranca(linha);
        break;
      } catch {
        try {
          boleto = parsearLinhaDigitavelCobranca(linha, true);
          break;
        } catch {
          continue;
        }
      }
    }
  }

  // Tenta 48 dígitos (arrecadação)
  if (!boleto) {
    const linhas48 = texto.match(/\d{48}/g);
    if (linhas48 && linhas48.length > 0) {
      for (const linha of linhas48) {
        try {
          boleto = parsearLinhaDigitavelArrecadacao(linha);
          break;
        } catch {
          try {
            boleto = parsearLinhaDigitavelArrecadacao(linha, true);
            break;
          } catch {
            continue;
          }
        }
      }
    }
  }

  // Tenta 44 dígitos (código de barras)
  if (!boleto) {
    const codigos44 = texto.match(/\d{44}/g);
    if (codigos44 && codigos44.length > 0) {
      for (const codigo of codigos44) {
        try {
          boleto = detectarETentarParse(codigo);
          break;
        } catch {
          continue;
        }
      }
    }
  }

  // Tenta qualquer sequência de 36-50 dígitos (fallback)
  if (!boleto) {
    const sequencias = texto.match(/\d{36,50}/g);
    if (sequencias && sequencias.length > 0) {
      for (const seq of sequencias) {
        try {
          boleto = detectarETentarParse(seq, true);
          break;
        } catch {
          continue;
        }
      }
    }
  }

  return boleto;
}

// ============================================
// EDGE FUNCTION
// ============================================

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const contentType = req.headers.get("content-type") || "";
    let text: string | undefined;
    let barcode: string | undefined;
    let pdfBytes: Uint8Array | undefined;

    // Aceita JSON (barcode/text ou pdfBase64 legado) ou FormData com arquivo PDF
    if (contentType.includes("application/json")) {
      const body = await req.json();
      text = body.text;
      barcode = body.barcode;
      if (body.pdfBase64) {
        pdfBytes = base64ToUint8Array(body.pdfBase64);
      }
    } else if (contentType.includes("multipart/form-data")) {
      // PDF enviado via FormData (padrão, confiável, sem overhead de base64)
      const form = await req.formData();
      const file = form.get("pdf");
      if (file instanceof File) {
        pdfBytes = new Uint8Array(await file.arrayBuffer());
      }
    } else {
      // Fallback: tenta ler como bytes diretos
      pdfBytes = new Uint8Array(await req.arrayBuffer());
    }

    if (!text && !barcode && !pdfBytes) {
      return new Response(JSON.stringify({ error: "Envie o texto do PDF, o código de barras ou o PDF em base64" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let boleto: any;

    // Prioridade 1: barcode direto
    if (barcode) {
      const cleanBarcode = barcode.replace(/\D/g, "");
      try {
        boleto = detectarETentarParse(cleanBarcode);
      } catch {
        try {
          boleto = detectarETentarParse(cleanBarcode, true);
        } catch {
          boleto = parsearGenerico(cleanBarcode);
        }
      }
    }
    // Prioridade 2: texto extraído
    else if (text) {
      boleto = tentarExtrairDeTexto(text);
      if (!boleto) {
        throw new Error("Não foi possível encontrar uma linha digitável válida no texto fornecido. Verifique se o código está completo (44, 47 ou 48 dígitos).");
      }
    }
    // Prioridade 3: PDF em bytes
    else if (pdfBytes) {
      // Limite de tamanho para evitar timeouts (2 MB)
      const MAX_PDF_SIZE = 2 * 1024 * 1024;
      if (pdfBytes.length > MAX_PDF_SIZE) {
        return new Response(
          JSON.stringify({
            error: "O PDF excede 2 MB. Boletos em PDF geralmente têm menos de 200 KB. Verifique se enviou o arquivo correto.",
          }),
          { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const textoExtraido = await extrairTextoPdf(pdfBytes);

      if (textoExtraido) {
        boleto = tentarExtrairDeTexto(textoExtraido);
      }

      if (!boleto) {
        return new Response(
          JSON.stringify({
            error: "Não foi possível extrair a linha digitável do PDF automaticamente. " +
                   "Isso pode acontecer se o PDF estiver protegido, for uma imagem escaneada, ou usar compressão avançada. " +
                   "Use o modo 'Código de Barras' e cole a linha digitável (47 dígitos para cobrança, 48 para concessionárias/tributos) ou o código de barras (44 dígitos) manualmente.",
            dica: "Você pode encontrar a linha digitável no topo ou rodapé do boleto. É uma sequência de números geralmente formatada como: 00000.00000 00000.000000 00000.000000 0 00000000000000"
          }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(JSON.stringify({ boleto }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
