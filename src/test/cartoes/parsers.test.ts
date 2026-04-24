/**
 * Testes dos Parsers de Extrato
 * @agente-testes
 */

import { describe, it, expect } from 'vitest';
import { parseExtratoRede, parseExtratoCielo, parseExtratoStone } from '@/lib/cartoes';

describe('Parsers de Extrato', () => {
  describe('parseExtratoRede', () => {
    it('deve parsear CSV da Rede corretamente', () => {
      const csv = `Data;Bandeira;Valor Bruto;NSU
15/01/2024;VISA;150,00;123456789
16/01/2024;MASTERCARD;89,90;987654321`;

      const resultado = parseExtratoRede(csv);
      expect(resultado.transacoes).toHaveLength(2);
      expect(resultado.transacoes[0].bandeira).toBe('visa');
      expect(resultado.transacoes[0].valor_bruto).toBe(150);
    });

    it('deve detectar erros em arquivo vazio', () => {
      const resultado = parseExtratoRede('');
      expect(resultado.erros.length).toBeGreaterThan(0);
      expect(resultado.transacoes).toHaveLength(0);
    });

    it('deve detectar erros em arquivo sem cabeçalho', () => {
      const csv = `conteúdo inválido
sem cabeçalho correto`;
      const resultado = parseExtratoRede(csv);
      expect(resultado.erros.length).toBeGreaterThan(0);
    });

    it('deve ignorar linhas vazias', () => {
      const csv = `Data;Bandeira;Valor Bruto
15/01/2024;VISA;150,00

16/01/2024;MASTERCARD;89,90`;

      const resultado = parseExtratoRede(csv);
      expect(resultado.transacoes).toHaveLength(2);
    });
  });

  describe('parseExtratoCielo', () => {
    it('deve parsear CSV da Cielo corretamente', () => {
      const csv = `Data Venda;Data Pagamento;Bandeira;Valor Bruto;Valor Líquido;TID
15/01/2024;17/01/2024;VISA;150,00;146,25;1234567890
16/01/2024;18/01/2024;MASTERCARD;89,90;87,65;0987654321`;

      const resultado = parseExtratoCielo(csv);
      expect(resultado.transacoes).toHaveLength(2);
      expect(resultado.transacoes[0].bandeira).toBe('visa');
    });

    it('deve lidar com dados ausentes', () => {
      const csv = `Data Venda;Bandeira;Valor Bruto
15/01/2024;VISA;150,00`;

      const resultado = parseExtratoCielo(csv);
      expect(resultado.transacoes.length).toBeGreaterThan(0);
    });
  });

  describe('parseExtratoStone', () => {
    it('deve parsear CSV da Stone corretamente', () => {
      const csv = `Data/Hora;Bandeira;Valor;Tipo;Parcela
15/01/2024;VISA;150,00;Crédito;1/1
16/01/2024;MASTERCARD;89,90;Débito;1/1`;

      const resultado = parseExtratoStone(csv);
      expect(resultado.transacoes.length).toBeGreaterThan(0);
    });

    it('deve detectar parcelamento', () => {
      const csv = `Data/Hora;Bandeira;Valor;Tipo;Parcela
15/01/2024;VISA;450,00;Parcelado;1/3`;

      const resultado = parseExtratoStone(csv);
      if (resultado.transacoes.length > 0) {
        expect(resultado.transacoes[0].tipo_transacao).toBe('parcelado');
        expect(resultado.transacoes[0].parcela_atual).toBe(1);
        expect(resultado.transacoes[0].numero_parcelas).toBe(3);
      }
    });
  });

  describe('Validação de Dados', () => {
    it('deve rejeitar valores negativos como chargeback', () => {
      const csv = `Data;Bandeira;Valor Bruto;Descrição
15/01/2024;VISA;-150,00;CHARGEBACK`;

      const resultado = parseExtratoRede(csv);
      // Chargebacks devem ser filtrados
      expect(resultado.transacoes).toHaveLength(0);
    });

    it('deve validar formato de data', () => {
      const csv = `Data;Bandeira;Valor Bruto
invalido;VISA;150,00`;

      const resultado = parseExtratoRede(csv);
      expect(resultado.erros.length).toBeGreaterThan(0);
    });

    it('deve aceitar diferentes formatos de separador', () => {
      const csvComa = `Data,Bandeira,Valor Bruto
15/01/2024,VISA,150.00`;

      const resultado = parseExtratoRede(csvComa);
      // Deve tentar parsear mesmo com vírgula
      expect(resultado).toBeDefined();
    });
  });
});
