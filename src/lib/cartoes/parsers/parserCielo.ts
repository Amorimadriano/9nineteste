/**
 * Parser de Extrato da Cielo
 * @agente-financeiro
 */

import type { ParsedTransacaoCartao, BandeiraCartao, TipoTransacaoCartao } from '@/types/cartoes';
import { getMascaraCartao, calcularDataPagamento, detectarChargeback, normalizarCabecalho, validarTransacaoParseada } from '../utils';

/**
 * Parseia extrato da Cielo em formato CSV
 */
export function parseExtratoCielo(
  conteudo: string | ArrayBuffer,
  arquivoNome?: string
): { transacoes: ParsedTransacaoCartao[]; erros: string[] } {
  const transacoes: ParsedTransacaoCartao[] = [];
  const erros: string[] = [];

  try {
    // Converter ArrayBuffer para string
    let texto: string;
    if (conteudo instanceof ArrayBuffer) {
      const decoder = new TextDecoder('utf-8');
      texto = decoder.decode(conteudo);
    } else {
      texto = conteudo;
    }

    // Cielo geralmente usa ; como separador
    const linhas = texto.split(/\r?\n/);
    if (linhas.length < 2) {
      return { transacoes: [], erros: ['Arquivo vazio ou formato inválido'] };
    }

    // Encontrar cabeçalho (Cielo costuma ter cabeçalho na primeira linha)
    let linhaCabecalho = 0;
    let separador = ';';

    const primeiraLinha = linhas[0].toLowerCase();
    if (!primeiraLinha.includes('data') && !primeiraLinha.includes('data_venda')) {
      // Procurar cabeçalho
      for (let i = 1; i < Math.min(5, linhas.length); i++) {
        if (linhas[i].toLowerCase().includes('data')) {
          linhaCabecalho = i;
          break;
        }
      }
    }

    // Detectar separador
    const linhaCabecalhoStr = linhas[linhaCabecalho];
    if (linhaCabecalhoStr.includes('\t')) separador = '\t';
    else if (linhaCabecalhoStr.includes(',')) separador = ',';

    // Mapear colunas
    const cabecalho = linhaCabecalhoStr.split(separador).map(normalizarCabecalho);
    const colunas = {
      dataVenda: cabecalho.findIndex(h => h.includes('data') && h.includes('venda')),
      dataPagamento: cabecalho.findIndex(h => h.includes('data') && (h.includes('pagamento') || h.includes('previsto'))),
      bandeira: cabecalho.findIndex(h => h.includes('bandeira') || h.includes('produto')),
      valorBruto: cabecalho.findIndex(h => h.includes('valor') && h.includes('bruto')),
      valorLiquido: cabecalho.findIndex(h => h.includes('valor') && h.includes('liquido')),
      tid: cabecalho.findIndex(h => h.includes('tid') || h.includes('transaction')),
      nsu: cabecalho.findIndex(h => h.includes('nsu') || h.includes('numero_sequencial')),
      cartao: cabecalho.findIndex(h => h.includes('cartao') || h.includes('final') || h.includes('pan')),
      numeroParcela: cabecalho.findIndex(h => h.includes('numero') && h.includes('parc')),
      totalParcelas: cabecalho.findIndex(h => h.includes('quantidade') && h.includes('parc')),
    };

    // Se não encontrou data_venda, tentar colunas genéricas
    if (colunas.dataVenda < 0) {
      colunas.dataVenda = cabecalho.findIndex(h => h === 'data' || h.startsWith('data_'));
    }

    // Processar linhas
    for (let i = linhaCabecalho + 1; i < linhas.length; i++) {
      const linha = linhas[i].trim();
      if (!linha) continue;

      const campos = linha.split(separador);

      try {
        const dataVenda = parseDataCielo(campos[colunas.dataVenda]);
        const dataPagamento = colunas.dataPagamento >= 0
          ? parseDataCielo(campos[colunas.dataPagamento])
          : null;

        const valorBruto = parseValorCielo(campos[colunas.valorBruto]);
        const valorLiquido = colunas.valorLiquido >= 0
          ? parseValorCielo(campos[colunas.valorLiquido])
          : null;

        const bandeiraTexto = colunas.bandeira >= 0 ? campos[colunas.bandeira] : '';
        const bandeira = detectarBandeiraCielo(bandeiraTexto);

        const tid = colunas.tid >= 0 ? campos[colunas.tid].trim() : '';
        const nsu = colunas.nsu >= 0 ? campos[colunas.nsu].trim() : tid;

        const cartao = colunas.cartao >= 0
          ? campos[colunas.cartao].replace(/\D/g, '').slice(-4)
          : '';

        // Parcelas
        let parcelaAtual = 1;
        let totalParcelas = 1;
        if (colunas.numeroParcela >= 0 && campos[colunas.numeroParcela]) {
          const partes = campos[colunas.numeroParcela].split('/');
          if (partes.length === 2) {
            parcelaAtual = parseInt(partes[0], 10) || 1;
            totalParcelas = parseInt(partes[1], 10) || 1;
          } else {
            parcelaAtual = parseInt(campos[colunas.numeroParcela], 10) || 1;
            totalParcelas = colunas.totalParcelas >= 0
              ? parseInt(campos[colunas.totalParcelas], 10) || 1
              : 1;
          }
        }

        const tipo = totalParcelas > 1 ? 'parcelado' : 'credito';

        const dataPagamentoFinal = dataPagamento || calcularDataPagamento(
          dataVenda,
          bandeira,
          tipo,
          parcelaAtual
        );

        const isChargeback = detectarChargeback(valorBruto);

        const transacao: ParsedTransacaoCartao = {
          data_transacao: dataVenda,
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

function parseDataCielo(valor: string): string {
  if (!valor) return '';
  const limpo = valor.trim();

  // Formato DD/MM/AAAA
  const match = limpo.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
  }

  // Formato AAAA-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(limpo)) {
    return limpo;
  }

  throw new Error(`Data inválida: ${valor}`);
}

function parseValorCielo(valor: string): number {
  if (!valor) return 0;
  const limpo = valor.replace(/R\$/g, '').replace(/\s/g, '').trim();

  if (limpo.includes(',') && limpo.indexOf(',') > limpo.lastIndexOf('.')) {
    return parseFloat(limpo.replace(/\./g, '').replace(',', '.'));
  }

  return parseFloat(limpo.replace(',', '')) || 0;
}

function detectarBandeiraCielo(texto: string): BandeiraCartao {
  if (!texto) return 'outros';
  const t = texto.toLowerCase().trim();

  if (t.includes('visa')) return 'visa';
  if (t.includes('master')) return 'mastercard';
  if (t.includes('elo')) return 'elo';
  if (t.includes('amex') || t.includes('american')) return 'amex';
  if (t.includes('hiper')) return 'hipercard';
  if (t.includes('diners')) return 'diners';
  if (t.includes('discover')) return 'discover';
  if (t.includes('jcb')) return 'jcb';

  return 'outros';
}
