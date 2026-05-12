/**
 * Testes do Conciliador de Cartões
 * @agente-testes
 */

import { describe, it, expect } from 'vitest';
import {
  calcularScoreMatch,
  detectarBandeira,
  formatarNumeroCartao,
  getMascaraCartao,
  calcularValorLiquido,
  detectarChargeback,
  validarNSU,
  CONFIG_BANDEIRAS,
} from '@/lib/cartoes';

describe('Conciliador de Cartões', () => {
  describe('calcularScoreMatch', () => {
    it('deve retornar score máximo para match perfeito', () => {
      const transacao = {
        valor_liquido: 100,
        data_pagamento: '2024-01-15',
        bandeira: 'visa' as const,
      };
      const candidato = {
        valor: 100,
        data: '2024-01-15',
        tipo: 'conta_receber',
      };

      const { score } = calcularScoreMatch(transacao, candidato);
      expect(score).toBeGreaterThanOrEqual(80);
    });

    it('deve penalizar diferença de valor', () => {
      const transacao = {
        valor_liquido: 100,
        data_pagamento: '2024-01-15',
        bandeira: 'visa' as const,
      };
      const candidato = {
        valor: 110,
        data: '2024-01-15',
        tipo: 'conta_receber',
      };

      const { score } = calcularScoreMatch(transacao, candidato);
      expect(score).toBeLessThan(80);
    });

    it('deve penalizar diferença de data', () => {
      const transacao = {
        valor_liquido: 100,
        data_pagamento: '2024-01-15',
        bandeira: 'visa' as const,
      };
      const candidato = {
        valor: 100,
        data: '2024-01-20',
        tipo: 'conta_receber',
      };

      const { score } = calcularScoreMatch(transacao, candidato);
      expect(score).toBeLessThan(80);
    });
  });

  describe('detectarBandeira', () => {
    it('deve detectar Visa corretamente', () => {
      expect(detectarBandeira('4111111111111111')).toBe('visa');
      expect(detectarBandeira('4555555555554444')).toBe('visa');
    });

    it('deve detectar Mastercard corretamente', () => {
      expect(detectarBandeira('5555555555554444')).toBe('mastercard');
      expect(detectarBandeira('2223003120003222')).toBe('mastercard');
    });

    it('deve detectar Elo corretamente', () => {
      expect(detectarBandeira('6362970000457013')).toBe('elo');
      expect(detectarBandeira('5041756756756756')).toBe('elo');
    });

    it('deve retornar "outros" para bandeira desconhecida', () => {
      expect(detectarBandeira('9999999999999999')).toBe('outros');
    });
  });

  describe('formatarNumeroCartao', () => {
    it('deve mascarar número do cartão corretamente', () => {
      expect(formatarNumeroCartao('4111111111111111')).toBe('**** 1111');
      expect(formatarNumeroCartao('1234')).toBe('**** 1234');
    });

    it('deve retornar string vazia para entrada vazia', () => {
      expect(formatarNumeroCartao('')).toBe('');
    });
  });

  describe('getMascaraCartao', () => {
    it('deve retornar últimos 4 dígitos', () => {
      expect(getMascaraCartao('4111111111111234')).toBe('1234');
      expect(getMascaraCartao('5555555555559999')).toBe('9999');
    });
  });

  describe('calcularValorLiquido', () => {
    it('deve calcular valor líquido corretamente', () => {
      const resultado = calcularValorLiquido(100, 2.5);
      expect(resultado.valorLiquido).toBe(97.5);
      expect(resultado.valorTaxa).toBe(2.5);
    });

    it('deve retornar valores corretos para taxa zero', () => {
      const resultado = calcularValorLiquido(100, 0);
      expect(resultado.valorLiquido).toBe(100);
      expect(resultado.valorTaxa).toBe(0);
    });
  });

  describe('detectarChargeback', () => {
    it('deve identificar chargeback por valor negativo', () => {
      expect(detectarChargeback(-100)).toBe(true);
      expect(detectarChargeback(-0.01)).toBe(true);
    });

    it('deve identificar chargeback por palavras-chave', () => {
      expect(detectarChargeback(100, 'CHARGEBACK de transação')).toBe(true);
      expect(detectarChargeback(100, 'Estorno solicitado')).toBe(true);
    });

    it('deve não identificar como chargeback transação normal', () => {
      expect(detectarChargeback(100, 'Compra aprovada')).toBe(false);
      expect(detectarChargeback(0)).toBe(false);
    });

    it('deve identificar chargeback por NSU de referência', () => {
      expect(detectarChargeback(100, undefined, '123456')).toBe(true);
    });
  });

  describe('validarNSU', () => {
    it('deve validar NSU correto', () => {
      expect(validarNSU('123456789')).toBe(true);
      expect(validarNSU('123456')).toBe(true);
    });

    it('deve rejeitar NSU inválido', () => {
      expect(validarNSU('123')).toBe(false);
      expect(validarNSU('')).toBe(false);
    });
  });

  describe('CONFIG_BANDEIRAS', () => {
    it('deve ter configuração para todas as bandeiras', () => {
      const bandeiras = ['visa', 'mastercard', 'elo', 'amex', 'hipercard', 'outros'];
      bandeiras.forEach(bandeira => {
        expect(CONFIG_BANDEIRAS[bandeira as keyof typeof CONFIG_BANDEIRAS]).toBeDefined();
      });
    });

    it('deve ter taxas positivas', () => {
      Object.values(CONFIG_BANDEIRAS).forEach(config => {
        expect(config.taxaPadrao).toBeGreaterThan(0);
        expect(config.taxaPadrao).toBeLessThan(1);
      });
    });

    it('deve ter prazos positivos', () => {
      Object.values(CONFIG_BANDEIRAS).forEach(config => {
        expect(config.prazoCredito).toBeGreaterThan(0);
        expect(config.prazoDebito).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
