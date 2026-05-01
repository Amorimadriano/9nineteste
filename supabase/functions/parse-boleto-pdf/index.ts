const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://9ninebusinesscontrol.com.br",
  "https://www.9ninebusinesscontrol.com.br",
  "https://9nineteste.9ninebusinesscontrol.com.br",
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
// TIPOS
// ============================================

interface BoletoParseado {
  tipo: string;
  descricao: string;
  valor: string | null;
  data_vencimento: string | null;
  documento: string;
  beneficiario: string | null;
  codigo_barras: string;
  banco: string | null;
  codigo_banco: string | null;
  fator_vencimento: number | null;
  codigo_barras_44?: string;
  validado: boolean;
  [key: string]: any;
}

interface ValidacaoResultado {
  valido: boolean;
  erros: ErroValidacao[];
  boletoSanitizado: any;
}

interface ErroValidacao {
  campo: string;
  mensagem: string;
  severidade: "erro" | "aviso";
}

interface ExtracaoResultado {
  boleto: BoletoParseado | null;
  textoBruto: string;
  metadados: MetadadosExtraidos;
}

interface MetadadosExtraidos {
  cnpj_beneficiario?: string;
  cpf_beneficiario?: string;
  cnpj_pagador?: string;
  cpf_pagador?: string;
  desconto?: string;
  multa?: string;
  juros?: string;
  cpfsCnpjs?: any[];
}

// ============================================
// CONSTANTES E CACHE DE REGEX
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

// Regex compiladas uma única vez (cache)
const RE_PARENTHESES = /\(([^()]{2,})\)/g;
const RE_ESCAPED = /\\\(([^\\]*)\\\)/g;
const RE_HEX = /<([0-9A-Fa-f\s]{10,})>/g;
const RE_LINHA47 = /\d{47}/g;
const RE_LINHA48 = /\d{48}/g;
const RE_CODIGO44 = /\d{44}/g;
const RE_SEQ36_50 = /\d{36,50}/g;
const RE_CNPJ_FMT = /\b(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})\b/g;
const RE_CPF_FMT = /\b(\d{3}\.\d{3}\.\d{3}-\d{2})\b/g;
const RE_CNPJ_RAW = /\b(\d{14})\b/g;
const RE_CPF_RAW = /\b(\d{11})\b/g;
const RE_VALOR = /(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2})/g;
const RE_STREAM = /stream\r?\n([\s\S]{0,524288}?)\r?\nendstream/g;

// ============================================
// UTILITÁRIOS DE BOLETO (PUROS, SEM SIDE EFFECTS)
// ============================================

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
// PARSER DE BOLETO (FUNÇÕES PURAS)
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

function parsearLinhaDigitavelCobranca(linha: string, forcar = false): BoletoParseado {
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

function parsearCodigoBarrasCobranca(codigo: string): BoletoParseado {
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
  const valorRaw = codigo.substring(4, 15);
  const valor = parseFloat(valorRaw) / 100;
  return valor > 0 ? valor : null;
}

function parsearLinhaDigitavelArrecadacao(linha: string, forcar = false): BoletoParseado {
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

function parsearCodigoBarrasArrecadacao(codigo: string): BoletoParseado {
  const segmento = codigo.substring(1, 2);
  const valor = extrairValorArrecadacao(codigo);
  return {
    tipo: "arrecadacao",
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

function parsearGenerico(codigoLimpo: string): BoletoParseado {
  const len = codigoLimpo.length;
  const primeiroDigito = codigoLimpo[0];

  if (primeiroDigito === "8" && len >= 36) {
    const codigo44 = codigoLimpo.padEnd(44, "0").substring(0, 44);
    try {
      return parsearCodigoBarrasArrecadacao(codigo44);
    } catch {
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

  const codigoBanco = codigoLimpo.substring(0, 3);
  if (BANCOS[codigoBanco] && len >= 36) {
    const codigo44 = codigoLimpo.padEnd(44, "0").substring(0, 44);
    try {
      return parsearCodigoBarrasCobranca(codigo44);
    } catch {
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

function detectarETentarParse(codigoLimpo: string, forcar = false): BoletoParseado {
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
  if (codigoLimpo.length >= 36 && codigoLimpo.length <= 50) {
    return parsearGenerico(codigoLimpo);
  }
  throw new Error(`Código deve ter entre 36 e 48 dígitos. Fornecido: ${codigoLimpo.length}`);
}

// ============================================
// DETECÇÃO DE BOLETO EM TEXTO (COM EARLY RETURN)
// ============================================

function tentarExtrairDeTexto(texto: string): BoletoParseado | null {
  let boleto: BoletoParseado | null = null;

  // Tenta 47 dígitos (cobrança)
  const linhas47 = texto.match(RE_LINHA47);
  if (linhas47) {
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
    const linhas48 = texto.match(RE_LINHA48);
    if (linhas48) {
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
    const codigos44 = texto.match(RE_CODIGO44);
    if (codigos44) {
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
    const sequencias = texto.match(RE_SEQ36_50);
    if (sequencias) {
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
// EXTRAÇÃO DE TEXTO DE PDF (PIPELINE OTIMIZADA)
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
  const len = bytes.length;
  const chars = new Array(len);
  for (let i = 0; i < len; i++) {
    chars[i] = String.fromCharCode(bytes[i]);
  }
  return chars.join("");
}

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
 * Scanner de bytes otimizado:
 * - Usa um buffer circular Uint8Array em vez de string concatenada
 * - Evita O(n²) de concatenação de strings
 * - Early return no primeiro match válido
 */
function buscarDigitosDireto(bytes: Uint8Array): string | null {
  const MAX_BUF = 100;
  const MIN_LEN = 44;
  const buf = new Uint8Array(MAX_BUF);
  let bufLen = 0;
  let bufStart = 0;

  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    const isDigit = b >= 48 && b <= 57;
    const isSep = b === 32 || b === 46;

    if (isDigit) {
      buf[(bufStart + bufLen) % MAX_BUF] = b;
      bufLen++;
      if (bufLen >= MIN_LEN) {
        // Extrai string do buffer circular
        let str = "";
        for (let j = 0; j < bufLen; j++) {
          str += String.fromCharCode(buf[(bufStart + j) % MAX_BUF]);
        }
        if (tentarExtrairDeTexto(str)) {
          return str;
        }
      }
      if (bufLen > MAX_BUF) {
        bufStart = (bufStart + 1) % MAX_BUF;
        bufLen = MAX_BUF;
      }
    } else if (!isSep) {
      // Caractere quebrador: tenta o que tem no buffer
      if (bufLen >= MIN_LEN) {
        let str = "";
        for (let j = 0; j < bufLen; j++) {
          str += String.fromCharCode(buf[(bufStart + j) % MAX_BUF]);
        }
        if (tentarExtrairDeTexto(str)) {
          return str;
        }
      }
      bufLen = 0;
      bufStart = 0;
    }
  }

  // Tenta no final
  if (bufLen >= MIN_LEN) {
    let str = "";
    for (let j = 0; j < bufLen; j++) {
      str += String.fromCharCode(buf[(bufStart + j) % MAX_BUF]);
    }
    if (tentarExtrairDeTexto(str)) {
      return str;
    }
  }
  return null;
}

/**
 * Extrai texto de streams PDF (limitado).
 * Só processa maxStreams streams, cada um com no máximo 512KB.
 */
async function extrairStreamsPdf(raw: string, maxStreams = 3): Promise<string[]> {
  const textos: string[] = [];
  let match: RegExpExecArray | null;
  let count = 0;

  RE_STREAM.lastIndex = 0;
  while ((match = RE_STREAM.exec(raw)) !== null && count < maxStreams) {
    count++;
    const streamContent = match[1];
    const streamBytes = new Uint8Array(streamContent.length);
    for (let i = 0; i < streamContent.length; i++) {
      streamBytes[i] = streamContent.charCodeAt(i);
    }

    const decompressed = await decompressZlibRaw(streamBytes);
    if (decompressed) {
      textos.push(bytesToLatin1(decompressed));
    } else {
      textos.push(streamContent);
    }
  }

  return textos;
}

interface TextoExtraido {
  texto: string;
  boleto: BoletoParseado | null;
}

/**
 * Extrai texto de PDF usando pipeline otimizada.
 * Retorna APENAS o texto necessário + boleto se encontrado.
 * Early return: se encontrar boleto no scanner de bytes, retorna imediatamente.
 * Senão, faz extração completa para metadados.
 */
async function extrairTextoPdf(bytes: Uint8Array): Promise<TextoExtraido> {
  const startTime = Date.now();

  // FASE 0: Scanner de bytes direto (mais rápido)
  const digitosDireto = buscarDigitosDireto(bytes);
  if (digitosDireto) {
    const boleto = tentarExtrairDeTexto(digitosDireto);
    if (boleto) {
      console.log("[parse-boleto-pdf] boleto encontrado em", Date.now() - startTime, "ms via scanner de bytes");
      return { texto: digitosDireto, boleto };
    }
  }

  // FASE 1: Extração completa de texto para metadados
  const raw = bytesToLatin1(bytes);
  const textos: string[] = [];
  let boleto: BoletoParseado | null = null;

  // 1a. Strings entre parênteses
  let match: RegExpExecArray | null;
  RE_PARENTHESES.lastIndex = 0;
  while ((match = RE_PARENTHESES.exec(raw)) !== null) {
    const text = match[1];
    if (/[a-zA-Z0-9]/.test(text)) textos.push(text);
  }

  // 1b. Texto entre parênteses escapados
  RE_ESCAPED.lastIndex = 0;
  while ((match = RE_ESCAPED.exec(raw)) !== null) {
    textos.push(match[1]);
  }

  // 1c. Strings hex
  RE_HEX.lastIndex = 0;
  let hexMatch: RegExpExecArray | null;
  while ((hexMatch = RE_HEX.exec(raw)) !== null) {
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
  boleto = tentarExtrairDeTexto(textoParcial);
  if (boleto) {
    console.log("[parse-boleto-pdf] boleto encontrado em", Date.now() - startTime, "ms via texto bruto");
    return { texto: textoParcial, boleto };
  }

  // FASE 2: Streams do PDF (último recurso, só para PDFs pequenos)
  if (bytes.length < 300_000) {
    const streamsTexto = await extrairStreamsPdf(raw, 3);
    for (const streamTexto of streamsTexto) {
      boleto = tentarExtrairDeTexto(streamTexto);
      if (boleto) {
        console.log("[parse-boleto-pdf] boleto encontrado em", Date.now() - startTime, "ms via stream");
        return { texto: streamTexto, boleto };
      }
      textos.push(streamTexto);
    }
  }

  const textoFinal = textos.join("\n");
  console.log("[parse-boleto-pdf] extração completa em", Date.now() - startTime, "ms");
  return { texto: textoFinal, boleto: null };
}

// ============================================
// METADADOS (EXTRAÇÃO LAZY)
// ============================================

function limparCpfCnpj(valor: string): string {
  return valor.replace(/\D/g, "");
}

function validarCnpj(cnpj: string): boolean {
  const clean = cnpj.replace(/\D/g, "");
  if (clean.length !== 14) return false;
  if (/(\d)\1{13}/.test(clean)) return false;
  let tamanho = clean.length - 2;
  let numeros = clean.substring(0, tamanho);
  const digitos = clean.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0), 10)) return false;
  tamanho++;
  numeros = clean.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return resultado === parseInt(digitos.charAt(1), 10);
}

function validarCpf(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return false;
  if (/(\d)\1{10}/.test(clean)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(clean.charAt(i), 10) * (10 - i);
  let rev = 11 - (soma % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(9), 10)) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(clean.charAt(i), 10) * (11 - i);
  rev = 11 - (soma % 11);
  if (rev === 10 || rev === 11) rev = 0;
  return rev === parseInt(clean.charAt(10), 10);
}

const PALAVRAS_BENEFICIARIO = new Set([
  "beneficiario", "cedente", "beneficiário", "recebedor",
  "emissor", "favorecido", "origem", "sacador",
]);
const PALAVRAS_PAGADOR = new Set([
  "pagador", "sacado", "debitado", "cliente",
  "devedor", "tomador", "destino",
]);
const PALAVRAS_DESCONTO = new Set(["desconto", "abatimento", "desc.", "abat.", "descontos"]);
const PALAVRAS_MULTA = new Set(["multa", "mora", "punitive", "penalidade"]);
const PALAVRAS_JUROS = new Set(["juros", "juro", "mora diaria", "mora diária"]);

function extrairCpfCnpjDoTexto(texto: string): Array<{ numero: string; tipo: "CPF" | "CNPJ"; valido: boolean; contexto: string }> {
  const encontrados: Array<{ numero: string; tipo: "CPF" | "CNPJ"; valido: boolean; contexto: string }> = [];
  const vistos = new Set<string>();

  function adicionar(m: RegExpExecArray, tipo: "CPF" | "CNPJ") {
    const clean = limparCpfCnpj(m[1]);
    if (vistos.has(clean)) return;
    vistos.add(clean);
    const valido = tipo === "CNPJ" ? validarCnpj(clean) : validarCpf(clean);
    const start = Math.max(0, m.index - 80);
    const end = Math.min(texto.length, (m.index || 0) + m[0].length + 80);
    const contexto = texto.substring(start, end).replace(/\s+/g, " ").trim();
    encontrados.push({ numero: clean, tipo, valido, contexto });
  }

  let m: RegExpExecArray | null;
  RE_CNPJ_FMT.lastIndex = 0;
  while ((m = RE_CNPJ_FMT.exec(texto)) !== null) adicionar(m, "CNPJ");

  RE_CPF_FMT.lastIndex = 0;
  while ((m = RE_CPF_FMT.exec(texto)) !== null) adicionar(m, "CPF");

  RE_CNPJ_RAW.lastIndex = 0;
  while ((m = RE_CNPJ_RAW.exec(texto)) !== null) {
    const clean = m[1];
    if (vistos.has(clean)) continue;
    if (validarCnpj(clean)) {
      const start = Math.max(0, m.index - 80);
      const end = Math.min(texto.length, (m.index || 0) + m[0].length + 80);
      const contexto = texto.substring(start, end).replace(/\s+/g, " ").trim();
      vistos.add(clean);
      encontrados.push({ numero: clean, tipo: "CNPJ", valido: true, contexto });
    }
  }

  RE_CPF_RAW.lastIndex = 0;
  while ((m = RE_CPF_RAW.exec(texto)) !== null) {
    const clean = m[1];
    if (vistos.has(clean)) continue;
    if (validarCpf(clean)) {
      const start = Math.max(0, m.index - 80);
      const end = Math.min(texto.length, (m.index || 0) + m[0].length + 80);
      const contexto = texto.substring(start, end).replace(/\s+/g, " ").trim();
      vistos.add(clean);
      encontrados.push({ numero: clean, tipo: "CPF", valido: true, contexto });
    }
  }

  return encontrados;
}

function classificarCpfCnpjPorContexto(
  lista: Array<{ numero: string; tipo: "CPF" | "CNPJ"; valido: boolean; contexto: string }>
): { beneficiario: string | null; pagador: string | null } {
  let beneficiario: string | null = null;
  let pagador: string | null = null;

  for (const item of lista) {
    if (beneficiario && pagador) break;
    const ctx = item.contexto.toLowerCase();

    let scoreBeneficiario = 0;
    let scorePagador = 0;
    for (const p of PALAVRAS_BENEFICIARIO) if (ctx.includes(p)) scoreBeneficiario++;
    for (const p of PALAVRAS_PAGADOR) if (ctx.includes(p)) scorePagador++;

    if (scoreBeneficiario > scorePagador && !beneficiario) {
      beneficiario = item.numero;
    } else if (scorePagador > scoreBeneficiario && !pagador) {
      pagador = item.numero;
    } else if (!beneficiario && scoreBeneficiario > 0) {
      beneficiario = item.numero;
    } else if (!pagador && scorePagador > 0) {
      pagador = item.numero;
    } else if (!beneficiario) {
      beneficiario = item.numero;
    } else if (!pagador && item.numero !== beneficiario) {
      pagador = item.numero;
    }
  }

  return { beneficiario, pagador };
}

function extrairValoresMonetariosProximos(texto: string, palavrasChave: Set<string>, maxDistancia = 120): number[] {
  const valores: number[] = [];
  const vistos = new Set<number>();
  const textoLower = texto.toLowerCase();

  for (const palavra of palavrasChave) {
    let idx = textoLower.indexOf(palavra);
    while (idx !== -1) {
      const inicio = Math.max(0, idx - maxDistancia);
      const fim = Math.min(texto.length, idx + palavra.length + maxDistancia);
      const trecho = texto.substring(inicio, fim);

      RE_VALOR.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = RE_VALOR.exec(trecho)) !== null) {
        const valorStr = m[1].replace(/\./g, "").replace(",", ".");
        const valor = parseFloat(valorStr);
        if (!isNaN(valor) && valor > 0 && !vistos.has(valor)) {
          vistos.add(valor);
          valores.push(valor);
        }
      }
      idx = textoLower.indexOf(palavra, idx + 1);
    }
  }

  return valores;
}

function extrairDescontoMultaJuros(texto: string): { desconto: number | null; multa: number | null; juros: number | null } {
  const descontos = extrairValoresMonetariosProximos(texto, PALAVRAS_DESCONTO, 100);
  const multas = extrairValoresMonetariosProximos(texto, PALAVRAS_MULTA, 100);
  const jurosLista = extrairValoresMonetariosProximos(texto, PALAVRAS_JUROS, 100);

  return {
    desconto: descontos.length > 0 ? Math.min(...descontos) : null,
    multa: multas.length > 0 ? Math.min(...multas) : null,
    juros: jurosLista.length > 0 ? Math.min(...jurosLista) : null,
  };
}

/**
 * Extrai metadados do texto bruto do PDF.
 * Só é chamado se o boleto foi encontrado (lazy evaluation).
 */
function extrairMetadados(textoBruto: string): MetadadosExtraidos {
  const metadados: MetadadosExtraidos = {};

  if (!textoBruto || textoBruto.length < 50) return metadados;

  // CNPJ/CPF
  const cpfsCnpjs = extrairCpfCnpjDoTexto(textoBruto);
  if (cpfsCnpjs.length > 0) {
    const { beneficiario, pagador } = classificarCpfCnpjPorContexto(cpfsCnpjs);
    if (beneficiario) {
      if (beneficiario.length === 14) metadados.cnpj_beneficiario = beneficiario;
      else metadados.cpf_beneficiario = beneficiario;
    }
    if (pagador) {
      if (pagador.length === 14) metadados.cnpj_pagador = pagador;
      else metadados.cpf_pagador = pagador;
    }
    metadados.cpfsCnpjs = cpfsCnpjs.map(c => ({ numero: c.numero, tipo: c.tipo, valido: c.valido }));
  }

  // Descontos, multas, juros
  const dmf = extrairDescontoMultaJuros(textoBruto);
  if (dmf.desconto != null) metadados.desconto = dmf.desconto.toFixed(2);
  if (dmf.multa != null) metadados.multa = dmf.multa.toFixed(2);
  if (dmf.juros != null) metadados.juros = dmf.juros.toFixed(2);

  return metadados;
}

// ============================================
// VALIDAÇÃO
// ============================================

function validarCamposBoleto(boleto: any, textoOriginal?: string): ValidacaoResultado {
  const erros: ErroValidacao[] = [];
  const sanitizado = { ...boleto };

  if (boleto.valor == null || boleto.valor === "" || boleto.valor === "0.00" || boleto.valor === "0") {
    erros.push({ campo: "valor", mensagem: "Valor do boleto não encontrado ou zerado.", severidade: "erro" });
  } else {
    const v = parseFloat(String(boleto.valor).replace(/\./g, "").replace(",", "."));
    if (isNaN(v) || v <= 0) {
      erros.push({ campo: "valor", mensagem: `Valor inválido: ${boleto.valor}.`, severidade: "erro" });
    } else {
      sanitizado.valor = v.toFixed(2);
    }
  }

  if (!boleto.data_vencimento) {
    erros.push({ campo: "data_vencimento", mensagem: "Data de vencimento não encontrada.", severidade: "aviso" });
  } else {
    const dataRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dataRegex.test(boleto.data_vencimento)) {
      erros.push({ campo: "data_vencimento", mensagem: `Formato inesperado: ${boleto.data_vencimento}.`, severidade: "erro" });
    } else {
      const dataObj = new Date(boleto.data_vencimento + "T00:00:00");
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const dataMaxima = new Date();
      dataMaxima.setFullYear(dataMaxima.getFullYear() + 10);
      if (dataObj < hoje || dataObj > dataMaxima) {
        erros.push({ campo: "data_vencimento", mensagem: `Data suspeita: ${boleto.data_vencimento}.`, severidade: "aviso" });
      }
    }
  }

  if (!boleto.codigo_barras || boleto.codigo_barras.length < 36) {
    erros.push({ campo: "codigo_barras", mensagem: `Código incompleto (${boleto.codigo_barras?.length || 0} dígitos).`, severidade: "erro" });
  }

  if (!boleto.beneficiario) {
    erros.push({ campo: "beneficiario", mensagem: "Beneficiário não identificado.", severidade: "aviso" });
  }

  if (!boleto.cnpj_beneficiario && !boleto.cpf_beneficiario && !boleto.cnpj_pagador && !boleto.cpf_pagador) {
    if (textoOriginal && textoOriginal.length > 50) {
      erros.push({ campo: "cnpj_cpf", mensagem: "CNPJ/CPF não encontrado no texto.", severidade: "aviso" });
    }
  }

  if (boleto.validado === false) {
    erros.push({ campo: "digito_verificador", mensagem: "DV da linha digitável não confere.", severidade: "erro" });
  }

  return { valido: !erros.some(e => e.severidade === "erro"), erros, boletoSanitizado: sanitizado };
}

// ============================================
// ORQUESTRADOR PRINCIPAL
// ============================================

/**
 * Pipeline de processamento de boleto:
 * 1. Parse direto de barcode (mais rápido)
 * 2. Extração de texto do PDF (early return)
 * 3. Metadados (lazy - só se boleto encontrado)
 * 4. Validação
 */
async function processarBoleto(
  barcode?: string,
  text?: string,
  pdfBytes?: Uint8Array
): Promise<ExtracaoResultado> {

  let boleto: BoletoParseado | null = null;
  let textoBruto = "";

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
    textoBruto = text;
    boleto = tentarExtrairDeTexto(text);
    if (!boleto) {
      throw new Error("Não foi possível encontrar uma linha digitável válida no texto fornecido.");
    }
  }
  // Prioridade 3: PDF em bytes
  else if (pdfBytes) {
    const MAX_PDF_SIZE = 2 * 1024 * 1024;
    if (pdfBytes.length > MAX_PDF_SIZE) {
      throw new Error("PDF_EXCEEDS_LIMIT");
    }

    const resultado = await extrairTextoPdf(pdfBytes);
    boleto = resultado.boleto;
    textoBruto = resultado.texto;

    if (!boleto) {
      throw new Error("Não foi possível extrair a linha digitável do PDF.");
    }
  }

  if (!boleto) {
    throw new Error("Nenhum dado de boleto fornecido.");
  }

  // Metadados: lazy - só extrai se temos texto bruto e o boleto foi encontrado
  const metadados = textoBruto.length > 50 ? extrairMetadados(textoBruto) : {};

  // Merge metadados no boleto
  const boletoFinal = { ...boleto, ...metadados };

  return { boleto: boletoFinal, textoBruto, metadados };
}

// ============================================
// EDGE FUNCTION HANDLER
// ============================================

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const contentType = req.headers.get("content-type") || "";
    let text: string | undefined;
    let barcode: string | undefined;
    let pdfBytes: Uint8Array | undefined;

    if (contentType.includes("application/json")) {
      const body = await req.json();
      text = body.text;
      barcode = body.barcode;
      if (body.pdfBase64) {
        pdfBytes = base64ToUint8Array(body.pdfBase64);
      }
    } else if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("pdf");
      if (file instanceof File) {
        pdfBytes = new Uint8Array(await file.arrayBuffer());
      }
    } else {
      pdfBytes = new Uint8Array(await req.arrayBuffer());
    }

    if (!text && !barcode && !pdfBytes) {
      return new Response(JSON.stringify({ error: "Envie o texto do PDF, o código de barras ou o PDF em base64" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resultado = await processarBoleto(barcode, text, pdfBytes);

    if (!resultado.boleto) {
      return new Response(
        JSON.stringify({
          error: "Não foi possível extrair a linha digitável do PDF automaticamente.",
          dica: "Você pode encontrar a linha digitável no topo ou rodapé do boleto. É uma sequência de números geralmente formatada como: 00000.00000 00000.000000 00000.000000 0 00000000000000"
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validacao = validarCamposBoleto(resultado.boleto, resultado.textoBruto);
    const boleto = validacao.boletoSanitizado;
    boleto.erros_validacao = validacao.erros;
    boleto.validacao_passou = validacao.valido;

    return new Response(JSON.stringify({ boleto }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const errMsg = (error as Error).message;
    if (errMsg === "PDF_EXCEEDS_LIMIT") {
      return new Response(
        JSON.stringify({ error: "O PDF excede 2 MB. Boletos em PDF geralmente têm menos de 200 KB." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
