/**
 * Parser de Extrato da Rede (Itaú)
 * @agente-financeiro
 */

import type { ParsedTransacaoCartao, BandeiraCartao, TipoTransacaoCartao } from '@/types/cartoes';
import { detectarBandeira, getMascaraCartao, calcularDataPagamento, detectarChargeback, normalizarCabecalho, validarTransacaoParseada } from '../utils';

/**
 * Parseia extrato da Rede em formato CSV
 * Formatos suportados: CSV padrão, Excel exportado
 */
export function parseExtratoRede(
  conteudo: string | ArrayBuffer,
  arquivoNome?: string
): { transacoes: ParsedTransacaoCartao[]; erros: string[] } {
  const transacoes: ParsedTransacaoCartao[] = [];
  const erros: string[] = [];

  try {
    // Converter ArrayBuffer para string se necessário
    let texto: string;
    if (conteudo instanceof ArrayBuffer) {
      const decoder = new TextDecoder('utf-8');
      texto = decoder.decode(conteudo);
    } else {
      texto = conteudo;
    }

    // Detectar separador (vírgula, ponto-e-vírgula ou tab)
    const linhas = texto.split(/\r?\n/);
    if (linhas.length < 2) {
      return { transacoes: [], erros: ['Arquivo vazio ou formato inválido'] };
    }

    // Encontrar cabeçalho
    let linhaCabecalho = -1;
    let separador = ';';

    for (let i = 0; i < Math.min(10, linhas.length); i++) {
      const linha = linhas[i];
      if (linha.toLowerCase().includes('data') ||
          linha.toLowerCase().includes('valor') ||
          linha.toLowerCase().includes('nsu')) {
        linhaCabecalho = i;
        // Detectar separador
        if (linha.includes(';')) separador = ';';
        else if (linha.includes('\t')) separador = '\t';
        else if (linha.includes(',')) separador = ',';
        break;
      }
    }

    if (linhaCabecalho === -1) {
      return { transacoes: [], erros: ['Cabeçalho não encontrado no arquivo'] };
    }

    // Mapear colunas
    const cabecalho = linhas[linhaCabecalho].split(separador).map(normalizarCabecalho);
    const colunas = {
      data: cabecalho.findIndex(h => h.includes('data') && !h.includes('pagamento')),
      dataPagamento: cabecalho.findIndex(h => h.includes('data') && h.includes('pagamento')),
      bandeira: cabecalho.findIndex(h => h.includes('bandeira') || h.includes('produto')),
      valor: cabecalho.findIndex(h => h.includes('valor') && !h.includes('liquido') && !h.includes('liq')),
      valorLiquido: cabecalho.findIndex(h => h.includes('valor') && (h.includes('liquido') || h.includes('liq'))),
      nsu: cabecalho.findIndex(h => h.includes('nsu') || h.includes('numero') || h.includes('seq')),
      autorizacao: cabecalho.findIndex(h => h.includes('autoriz') || h.includes('codigo')),
      cartao: cabecalho.findIndex(h => h.includes('cartao') || h.includes('pan') || h.includes('numero_cartao')),
      descricao: cabecalho.findIndex(h => h.includes('descricao') || h.includes('comercio') || h.includes('loja')),
      parcela: cabecalho.findIndex(h => h.includes('parcela') || h.includes('parc')),
      totalParcelas: cabecalho.findIndex(h => h.includes('total') && h.includes('parc')),
    };

    // Processar linhas de dados
    for (let i = linhaCabecalho + 1; i < linhas.length; i++) {
      const linha = linhas[i].trim();
      if (!linha) continue;

      const campos = linha.split(separador);

      try {
        // Extrair valores
        const dataTransacao = parseDataRede(campos[colunas.data]);
        const dataPagamento = colunas.dataPagamento >= 0
          ? parseDataRede(campos[colunas.dataPagamento])
          : null;

        const valorBruto = parseValorRede(campos[colunas.valor]);
        const valorLiquido = colunas.valorLiquido >= 0
          ? parseValorRede(campos[colunas.valorLiquido])
          : null;

        const bandeiraTexto = colunas.bandeira >= 0 ? campos[colunas.bandeira] : '';
        const bandeira = detectarBandeiraRede(bandeiraTexto);

        const nsu = colunas.nsu >= 0 ? campos[colunas.nsu].trim() : '';
        const autorizacao = colunas.autorizacao >= 0 ? campos[colunas.autorizacao].trim() : '';

        const cartao = colunas.cartao >= 0 ? campos[colunas.cartao].replace(/\D/g, '') : '';
        const mascaraCartao = cartao ? getMascaraCartao(cartao) : '';

        const descricao = colunas.descricao >= 0 ? campos[colunas.descricao].trim() : '';

        // Detectar parcelamento
        let parcelaAtual = 1;
        let totalParcelas = 1;
        if (colunas.parcela >= 0 && campos[colunas.parcela]) {
          const parcelaStr = campos[colunas.parcela].trim();
          const match = parcelaStr.match(/(\d+)\/(\d+)/);
          if (match) {
            parcelaAtual = parseInt(match[1], 10);
            totalParcelas = parseInt(match[2], 10);
          } else {
            parcelaAtual = parseInt(parcelaStr, 10) || 1;
            totalParcelas = colunas.totalParcelas >= 0
              ? parseInt(campos[colunas.totalParcelas], 10) || 1
              : 1;
          }
        }

        // Detectar tipo (crédito/débito)
        const tipo = detectarTipoRede(bandeiraTexto, descricao, totalParcelas);

        // Calcular data de pagamento se não informada
        const dataPagamentoFinal = dataPagamento || calcularDataPagamento(
          dataTransacao,
          bandeira,
          tipo,
          parcelaAtual
        );

        // Calcular taxa
        let taxaPercentual = 0;
        if (valorLiquido !== null && valorBruto > 0) {
          taxaPercentual = ((valorBruto - valorLiquido) / valorBruto) * 100;
        }

        // Detectar chargeback
        const isChargeback = detectarChargeback(valorBruto, descricao);

        const transacao: ParsedTransacaoCartao = {
          data_transacao: dataTransacao,
          data_pagamento: dataPagamentoFinal,
          bandeira,
          valor_bruto: Math.abs(valorBruto),
          nsu: nsu || undefined,
          codigo_autorizacao: autorizacao || undefined,
          numero_cartao_mascara: mascaraCartao || undefined,
          descricao: descricao || undefined,
          tipo_transacao: tipo,
          numero_parcelas: totalParcelas,
          parcela_atual: parcelaAtual,
        };

        // Validar transação
        const validacao = validarTransacaoParseada(transacao);
        if (validacao.valido && !isChargeback) {
          transacoes.push(transacao);
        } else if (isChargeback) {
          // Chargebacks são processados separadamente
          console.log('Chargeback detectado:', nsu, valorBruto);
        } else {
          erros.push(`Linha ${i + 1}: ${validacao.erros.join(', ')}`);
        }
      } catch (err: any) {
        erros.push(`Linha ${i + 1}: ${err.message}`);
      }
    }
  } catch (err: any) {
    erros.push(`Erro ao processar arquivo: ${err.message}`);
  }

  return { transacoes, erros };
}

/**
 * Parseia data do formato Rede (DD/MM/AAAA ou AAAA-MM-DD)
 */
function parseDataRede(valor: string): string {
  if (!valor) return '';

  const limpo = valor.trim();

  // Formato ISO AAAA-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(limpo)) {
    return limpo;
  }

  // Formato brasileiro DD/MM/AAAA
  const match = limpo.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    const [, dia, mes, ano] = match;
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }

  // Tentar como data Excel
  const excelDate = parseInt(limpo);
  if (!isNaN(excelDate) && excelDate > 30000 && excelDate < 60000) {
    const d = new Date((excelDate - 25569) * 86400 * 1000);
    return d.toISOString().split('T')[0];
  }

  throw new Error(`Data inválida: ${valor}`);
}

/**
 * Parseia valor monetário do formato Rede
 */
function parseValorRede(valor: string): number {
  if (!valor) return 0;

  const limpo = valor
    .replace(/R\$/, '')
    .replace(/\s/g, '')
    .trim();

  // Formato brasileiro: 1.234,56
  if (limpo.includes(',') && limpo.indexOf(',') > limpo.lastIndexOf('.')) {
    return parseFloat(limpo.replace(/\./g, '').replace(',', '.'));
  }

  return parseFloat(limpo.replace(',', '')) || 0;
}

/**
 * Detecta a bandeira a partir do texto da Rede
 */
function detectarBandeiraRede(texto: string): BandeiraCartao {
  if (!texto) return 'outros';

  const t = texto.toLowerCase().trim();

  if (t.includes('visa')) return 'visa';
  if (t.includes('master') || t.includes('mastercard')) return 'mastercard';
  if (t.includes('elo')) return 'elo';
  if (t.includes('amex') || t.includes('american')) return 'amex';
  if (t.includes('hiper')) return 'hipercard';
  if (t.includes('diners')) return 'diners';
  if (t.includes('discover')) return 'discover';
  if (t.includes('jcb')) return 'jcb';

  return 'outros';
}

/**
 * Detecta o tipo de transação (crédito/débito/parcelado) da Rede
 */
function detectarTipoRede(
  bandeiraTexto: string,
  descricao: string,
  totalParcelas: number
): TipoTransacaoCartao {
  if (totalParcelas > 1) return 'parcelado';

  const t = (bandeiraTexto + ' ' + descricao).toLowerCase();

  if (t.includes('debito') || t.includes('débito') || t.includes('debit')) {
    return 'debito';
  }

  if (t.includes('parcela') || t.includes('installment') || t.includes('prazo')) {
    return 'parcelado';
  }

  return 'credito';
}
