/**
 * Parser de Extrato da Stone
 * @agente-financeiro
 */

import type { ParsedTransacaoCartao, BandeiraCartao, TipoTransacaoCartao } from '@/types/cartoes';
import { getMascaraCartao, calcularDataPagamento, detectarChargeback, normalizarCabecalho, validarTransacaoParseada } from '../utils';

/**
 * Parseia extrato da Stone em formato CSV
 * A Stone tem um layout mais moderno e limpo
 */
export function parseExtratoStone(
  conteudo: string | ArrayBuffer,
  arquivoNome?: string
): { transacoes: ParsedTransacaoCartao[]; erros: string[] } {
  const transacoes: ParsedTransacaoCartao[] = [];
  const erros: string[] = [];

  try {
    let texto: string;
    if (conteudo instanceof ArrayBuffer) {
      const decoder = new TextDecoder('utf-8');
      texto = decoder.decode(conteudo);
    } else {
      texto = conteudo;
    }

    const linhas = texto.split(/\r?\n/);
    if (linhas.length < 2) {
      return { transacoes: [], erros: ['Arquivo vazio ou formato inválido'] };
    }

    // Stone usa ; como separador padrão
    let separador = ';';
    const primeiraLinha = linhas[0];
    if (primeiraLinha.includes('\t')) separador = '\t';
    else if (primeiraLinha.includes(',')) separador = ',';

    const cabecalho = linhas[0].split(separador).map(normalizarCabecalho);
    const colunas = {
      dataHora: cabecalho.findIndex(h => h.includes('data') && (h.includes('hora') || h.includes('transacao'))),
      dataPagamento: cabecalho.findIndex(h => h.includes('data') && h.includes('pagamento')),
      bandeira: cabecalho.findIndex(h => h.includes('bandeira') || h.includes('bandeira')),
      valor: cabecalho.findIndex(h => h.includes('valor') && !h.includes('taxa')),
      valorTaxa: cabecalho.findIndex(h => h.includes('valor') && h.includes('taxa')),
      valorLiquido: cabecalho.findIndex(h => h.includes('valor') && h.includes('liquido')),
      idTransacao: cabecalho.findIndex(h => h.includes('id') && h.includes('transacao')),
      nsu: cabecalho.findIndex(h => h.includes('nsu')),
      cartao: cabecalho.findIndex(h => h.includes('cartao') || h.includes('numero')),
      tipo: cabecalho.findIndex(h => h.includes('tipo') && (h.includes('pagamento') || h.includes('transacao'))),
      parcela: cabecalho.findIndex(h => h.includes('parcela')),
      status: cabecalho.findIndex(h => h.includes('status')),
    };

    // Fallbacks para Stone
    if (colunas.dataHora < 0) {
      colunas.dataHora = cabecalho.findIndex(h => h === 'data');
    }
    if (colunas.valor < 0) {
      colunas.valor = cabecalho.findIndex(h => h.includes('vl') || h.includes('montante'));
    }

    for (let i = 1; i < linhas.length; i++) {
      const linha = linhas[i].trim();
      if (!linha) continue;

      const campos = linha.split(separador);

      // Verificar se é uma linha válida (Stone às vezes tem linhas de total)
      if (colunas.status >= 0) {
        const status = campos[colunas.status]?.toLowerCase() || '';
        if (status.includes('cancelado') || status.includes('falha')) {
          continue;
        }
      }

      try {
        const dataTransacao = parseDataStone(campos[colunas.dataHora]);
        const dataPagamento = colunas.dataPagamento >= 0
          ? parseDataStone(campos[colunas.dataPagamento])
          : null;

        const valorBruto = parseValorStone(campos[colunas.valor]);

        const bandeiraTexto = colunas.bandeira >= 0 ? campos[colunas.bandeira] : '';
        const bandeira = detectarBandeiraStone(bandeiraTexto);

        const nsu = colunas.nsu >= 0 ? campos[colunas.nsu].trim() :
                    colunas.idTransacao >= 0 ? campos[colunas.idTransacao].trim() : '';

        const cartao = colunas.cartao >= 0
          ? campos[colunas.cartao].replace(/\D/g, '').slice(-4)
          : '';

        // Detectar tipo
        let tipo: TipoTransacaoCartao = 'credito';
        let parcelaAtual = 1;
        let totalParcelas = 1;

        if (colunas.tipo >= 0) {
          const tipoTexto = campos[colunas.tipo].toLowerCase();
          if (tipoTexto.includes('debito') || tipoTexto.includes('débito')) {
            tipo = 'debito';
          } else if (tipoTexto.includes('parcelado') || tipoTexto.includes('prazo')) {
            tipo = 'parcelado';
          }
        }

        if (colunas.parcela >= 0 && campos[colunas.parcela]) {
          const parc = campos[colunas.parcela].split('/');
          if (parc.length === 2) {
            parcelaAtual = parseInt(parc[0], 10) || 1;
            totalParcelas = parseInt(parc[1], 10) || 1;
            tipo = 'parcelado';
          }
        }

        const dataPagamentoFinal = dataPagamento || calcularDataPagamento(
          dataTransacao,
          bandeira,
          tipo,
          parcelaAtual
        );

        const isChargeback = detectarChargeback(valorBruto);

        const transacao: ParsedTransacaoCartao = {
          data_transacao: dataTransacao,
          data_pagamento: dataPagamentoFinal,
          bandeira,
          valor_bruto: Math.abs(valorBruto),
          nsu: nsu || undefined,
          numero_cartao_mascara: cartao || undefined,
          tipo_transacao: tipo,
          numero_parcelas: totalParcelas,
          parcela_atual: parcelaAtual,
        };

        const validacao = validarTransacaoParseada(transacao);
        if (validacao.valido && !isChargeback) {
          transacoes.push(transacao);
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

function parseDataStone(valor: string): string {
  if (!valor) return '';
  const limpo = valor.trim();

  // Stone geralmente retorna AAAA-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(limpo)) {
    return limpo.substring(0, 10);
  }

  // Ou DD/MM/AAAA
  const match = limpo.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
  }

  throw new Error(`Data inválida: ${valor}`);
}

function parseValorStone(valor: string): number {
  if (!valor) return 0;
  const limpo = valor.replace(/R\$/g, '').replace(/\s/g, '').trim();

  if (limpo.includes(',') && limpo.indexOf(',') > limpo.lastIndexOf('.')) {
    return parseFloat(limpo.replace(/\./g, '').replace(',', '.'));
  }

  return parseFloat(limpo) || 0;
}

function detectarBandeiraStone(texto: string): BandeiraCartao {
  if (!texto) return 'outros';
  const t = texto.toLowerCase().trim();

  if (t.includes('visa')) return 'visa';
  if (t.includes('master')) return 'mastercard';
  if (t.includes('elo')) return 'elo';
  if (t.includes('amex') || t.includes('american')) return 'amex';
  if (t.includes('hiper')) return 'hipercard';
  if (t.includes('diners')) return 'diners';
  if (t.includes('hiper')) return 'hipercard';

  return 'outros';
}
