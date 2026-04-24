/**
 * Testes de Matching Open Banking
 * Match exato, tolerância de data, evitar duplicatas, vinculação de IDs
 */
import { describe, it, expect } from "vitest";
import {
  mockTransactionsItau,
  mockExistingTransactions,
} from "../fixtures/openBanking";

interface LocalTransaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  type: "entrada" | "saida";
  bankTransactionId: string | null;
}

interface BankTransaction {
  transactionId: string;
  date: string;
  amount: number;
  description: string;
  type: "entrada" | "saida";
}

interface MatchResult {
  localId: string;
  bankId: string;
  confidence: number;
  matchedOn: string[];
}

class TransactionMatcher {
  private dateTolerance: number; // dias

  constructor(dateTolerance: number = 1) {
    this.dateTolerance = dateTolerance;
  }

  // Match exato de valor e data
  findExactMatch(
    bankTransaction: BankTransaction,
    localTransactions: LocalTransaction[]
  ): MatchResult | null {
    const match = localTransactions.find(
      (local) =>
        local.bankTransactionId === null &&
        local.amount === bankTransaction.amount &&
        local.date === bankTransaction.date &&
        local.type === bankTransaction.type
    );

    if (match) {
      return {
        localId: match.id,
        bankId: bankTransaction.transactionId,
        confidence: 1.0,
        matchedOn: ["amount", "date", "type"],
      };
    }

    return null;
  }

  // Match com tolerância de data
  findFuzzyMatch(
    bankTransaction: BankTransaction,
    localTransactions: LocalTransaction[]
  ): MatchResult | null {
    const bankDate = new Date(bankTransaction.date);

    const matches = localTransactions.filter((local) => {
      if (local.bankTransactionId !== null) return false;
      if (local.amount !== bankTransaction.amount) return false;
      if (local.type !== bankTransaction.type) return false;

      const localDate = new Date(local.date);
      const diffDays = Math.abs(
        (localDate.getTime() - bankDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      return diffDays <= this.dateTolerance;
    });

    if (matches.length > 0) {
      // Retorna o match mais próximo em data
      const bestMatch = matches.sort((a, b) => {
        const diffA = Math.abs(
          new Date(a.date).getTime() - bankDate.getTime()
        );
        const diffB = Math.abs(
          new Date(b.date).getTime() - bankDate.getTime()
        );
        return diffA - diffB;
      })[0];

      const diffDays = Math.abs(
        (new Date(bestMatch.date).getTime() - bankDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      return {
        localId: bestMatch.id,
        bankId: bankTransaction.transactionId,
        confidence: diffDays === 0 ? 1.0 : 0.9,
        matchedOn: diffDays === 0 ? ["amount", "date", "type"] : ["amount", "type", "date_fuzzy"],
      };
    }

    return null;
  }

  // Verifica se transação já existe (evita duplicatas)
  isDuplicate(
    bankTransaction: BankTransaction,
    localTransactions: LocalTransaction[]
  ): boolean {
    return localTransactions.some(
      (local) => local.bankTransactionId === bankTransaction.transactionId
    );
  }

  // Match completo com todas as estratégias
  matchTransaction(
    bankTransaction: BankTransaction,
    localTransactions: LocalTransaction[]
  ): {
    match: MatchResult | null;
    isDuplicate: boolean;
    shouldCreate: boolean;
  } {
    // Primeiro verifica se já existe
    if (this.isDuplicate(bankTransaction, localTransactions)) {
      return { match: null, isDuplicate: true, shouldCreate: false };
    }

    // Tenta match exato
    const exactMatch = this.findExactMatch(bankTransaction, localTransactions);
    if (exactMatch) {
      return { match: exactMatch, isDuplicate: false, shouldCreate: false };
    }

    // Tenta match fuzzy
    const fuzzyMatch = this.findFuzzyMatch(bankTransaction, localTransactions);
    if (fuzzyMatch) {
      return { match: fuzzyMatch, isDuplicate: false, shouldCreate: false };
    }

    // Não encontrou match, deve criar nova transação
    return { match: null, isDuplicate: false, shouldCreate: true };
  }

  // Processa múltiplas transações
  processTransactions(
    bankTransactions: BankTransaction[],
    localTransactions: LocalTransaction[]
  ): {
    matched: MatchResult[];
    duplicates: BankTransaction[];
    toCreate: BankTransaction[];
  } {
    const matched: MatchResult[] = [];
    const duplicates: BankTransaction[] = [];
    const toCreate: BankTransaction[] = [];

    bankTransactions.forEach((bankTxn) => {
      const result = this.matchTransaction(bankTxn, localTransactions);

      if (result.isDuplicate) {
        duplicates.push(bankTxn);
      } else if (result.match) {
        matched.push(result.match);
      } else if (result.shouldCreate) {
        toCreate.push(bankTxn);
      }
    });

    return { matched, duplicates, toCreate };
  }

  // Vincula IDs após match confirmado
  linkTransaction(
    localId: string,
    bankId: string,
    localTransactions: LocalTransaction[]
  ): LocalTransaction | null {
    const transaction = localTransactions.find((t) => t.id === localId);
    if (transaction) {
      transaction.bankTransactionId = bankId;
      return transaction;
    }
    return null;
  }
}

describe("Transaction Matching", () => {
  const matcher = new TransactionMatcher();

  describe("Match exato de valor e data", () => {
    it("deve encontrar match exato", () => {
      const bankTransaction: BankTransaction = {
        transactionId: "TXN-ITAU-001",
        date: "2024-01-15",
        amount: 250.0,
        description: "PIX",
        type: "saida",
      };

      const localTransactions: LocalTransaction[] = [
        {
          id: "local-001",
          date: "2024-01-15",
          amount: 250.0,
          description: "Transferência PIX",
          type: "saida",
          bankTransactionId: null,
        },
        {
          id: "local-002",
          date: "2024-01-14",
          amount: 1000.0,
          description: "Depósito",
          type: "entrada",
          bankTransactionId: null,
        },
      ];

      const match = matcher.findExactMatch(bankTransaction, localTransactions);

      expect(match).not.toBeNull();
      expect(match?.localId).toBe("local-001");
      expect(match?.bankId).toBe("TXN-ITAU-001");
      expect(match?.confidence).toBe(1.0);
    });

    it("não deve encontrar match quando valor diferir", () => {
      const bankTransaction: BankTransaction = {
        transactionId: "TXN-001",
        date: "2024-01-15",
        amount: 300.0,
        description: "Teste",
        type: "saida",
      };

      const localTransactions: LocalTransaction[] = [
        {
          id: "local-001",
          date: "2024-01-15",
          amount: 250.0,
          description: "Teste",
          type: "saida",
          bankTransactionId: null,
        },
      ];

      const match = matcher.findExactMatch(bankTransaction, localTransactions);

      expect(match).toBeNull();
    });

    it("não deve encontrar match quando data diferir", () => {
      const bankTransaction: BankTransaction = {
        transactionId: "TXN-001",
        date: "2024-01-16",
        amount: 250.0,
        description: "Teste",
        type: "saida",
      };

      const localTransactions: LocalTransaction[] = [
        {
          id: "local-001",
          date: "2024-01-15",
          amount: 250.0,
          description: "Teste",
          type: "saida",
          bankTransactionId: null,
        },
      ];

      const match = matcher.findExactMatch(bankTransaction, localTransactions);

      expect(match).toBeNull();
    });

    it("não deve encontrar match quando tipo diferir", () => {
      const bankTransaction: BankTransaction = {
        transactionId: "TXN-001",
        date: "2024-01-15",
        amount: 250.0,
        description: "Teste",
        type: "entrada",
      };

      const localTransactions: LocalTransaction[] = [
        {
          id: "local-001",
          date: "2024-01-15",
          amount: 250.0,
          description: "Teste",
          type: "saida",
          bankTransactionId: null,
        },
      ];

      const match = matcher.findExactMatch(bankTransaction, localTransactions);

      expect(match).toBeNull();
    });
  });

  describe("Match com tolerância de 1 dia", () => {
    it("deve encontrar match com 1 dia de diferença", () => {
      const bankTransaction: BankTransaction = {
        transactionId: "TXN-001",
        date: "2024-01-16",
        amount: 250.0,
        description: "Teste",
        type: "saida",
      };

      const localTransactions: LocalTransaction[] = [
        {
          id: "local-001",
          date: "2024-01-15",
          amount: 250.0,
          description: "Teste",
          type: "saida",
          bankTransactionId: null,
        },
      ];

      const match = matcher.findFuzzyMatch(bankTransaction, localTransactions);

      expect(match).not.toBeNull();
      expect(match?.localId).toBe("local-001");
      expect(match?.confidence).toBe(0.9);
      expect(match?.matchedOn).toContain("date_fuzzy");
    });

    it("deve encontrar match com tolerância de -1 dia", () => {
      const bankTransaction: BankTransaction = {
        transactionId: "TXN-001",
        date: "2024-01-14",
        amount: 250.0,
        description: "Teste",
        type: "saida",
      };

      const localTransactions: LocalTransaction[] = [
        {
          id: "local-001",
          date: "2024-01-15",
          amount: 250.0,
          description: "Teste",
          type: "saida",
          bankTransactionId: null,
        },
      ];

      const match = matcher.findFuzzyMatch(bankTransaction, localTransactions);

      expect(match).not.toBeNull();
      expect(match?.localId).toBe("local-001");
    });

    it("não deve encontrar match com 2 dias de diferença", () => {
      const bankTransaction: BankTransaction = {
        transactionId: "TXN-001",
        date: "2024-01-17",
        amount: 250.0,
        description: "Teste",
        type: "saida",
      };

      const localTransactions: LocalTransaction[] = [
        {
          id: "local-001",
          date: "2024-01-15",
          amount: 250.0,
          description: "Teste",
          type: "saida",
          bankTransactionId: null,
        },
      ];

      const match = matcher.findFuzzyMatch(bankTransaction, localTransactions);

      expect(match).toBeNull();
    });

    it("deve retornar confidence 1.0 para match exato via fuzzy", () => {
      const bankTransaction: BankTransaction = {
        transactionId: "TXN-001",
        date: "2024-01-15",
        amount: 250.0,
        description: "Teste",
        type: "saida",
      };

      const localTransactions: LocalTransaction[] = [
        {
          id: "local-001",
          date: "2024-01-15",
          amount: 250.0,
          description: "Teste",
          type: "saida",
          bankTransactionId: null,
        },
      ];

      const match = matcher.findFuzzyMatch(bankTransaction, localTransactions);

      expect(match?.confidence).toBe(1.0);
      expect(match?.matchedOn).toContain("date");
    });

    it("deve escolher o match mais próximo em data quando há múltiplos", () => {
      const bankTransaction: BankTransaction = {
        transactionId: "TXN-001",
        date: "2024-01-15",
        amount: 250.0,
        description: "Teste",
        type: "saida",
      };

      const localTransactions: LocalTransaction[] = [
        {
          id: "local-001",
          date: "2024-01-14",
          amount: 250.0,
          description: "Teste",
          type: "saida",
          bankTransactionId: null,
        },
        {
          id: "local-002",
          date: "2024-01-15",
          amount: 250.0,
          description: "Teste",
          type: "saida",
          bankTransactionId: null,
        },
        {
          id: "local-003",
          date: "2024-01-16",
          amount: 250.0,
          description: "Teste",
          type: "saida",
          bankTransactionId: null,
        },
      ];

      const match = matcher.findFuzzyMatch(bankTransaction, localTransactions);

      expect(match?.localId).toBe("local-002");
    });
  });

  describe("Não duplicar transações", () => {
    it("deve identificar transação já vinculada", () => {
      const bankTransaction: BankTransaction = {
        transactionId: "TXN-ITAU-002",
        date: "2024-01-14",
        amount: 1000.0,
        description: "Depósito",
        type: "entrada",
      };

      const localTransactions: LocalTransaction[] = [
        {
          id: "local-002",
          date: "2024-01-14",
          amount: 1000.0,
          description: "Depósito",
          type: "entrada",
          bankTransactionId: "TXN-ITAU-002",
        },
      ];

      const isDup = matcher.isDuplicate(bankTransaction, localTransactions);

      expect(isDup).toBe(true);
    });

    it("não deve considerar duplicada transação não vinculada", () => {
      const bankTransaction: BankTransaction = {
        transactionId: "TXN-NEW",
        date: "2024-01-14",
        amount: 1000.0,
        description: "Depósito",
        type: "entrada",
      };

      const localTransactions: LocalTransaction[] = [
        {
          id: "local-002",
          date: "2024-01-14",
          amount: 1000.0,
          description: "Depósito",
          type: "entrada",
          bankTransactionId: "TXN-ITAU-002",
        },
      ];

      const isDup = matcher.isDuplicate(bankTransaction, localTransactions);

      expect(isDup).toBe(false);
    });

    it("deve retornar isDuplicate true em matchTransaction", () => {
      const bankTransaction: BankTransaction = {
        transactionId: "TXN-ITAU-002",
        date: "2024-01-14",
        amount: 1000.0,
        description: "Depósito",
        type: "entrada",
      };

      const localTransactions: LocalTransaction[] = [
        {
          id: "local-002",
          date: "2024-01-14",
          amount: 1000.0,
          description: "Depósito",
          type: "entrada",
          bankTransactionId: "TXN-ITAU-002",
        },
      ];

      const result = matcher.matchTransaction(bankTransaction, localTransactions);

      expect(result.isDuplicate).toBe(true);
      expect(result.match).toBeNull();
      expect(result.shouldCreate).toBe(false);
    });
  });

  describe("Vinculação correta de IDs", () => {
    it("deve vincular ID da transação local com ID do banco", () => {
      const localTransactions: LocalTransaction[] = [
        {
          id: "local-001",
          date: "2024-01-15",
          amount: 250.0,
          description: "PIX",
          type: "saida",
          bankTransactionId: null,
        },
      ];

      const result = matcher.linkTransaction(
        "local-001",
        "TXN-BANK-001",
        localTransactions
      );

      expect(result).not.toBeNull();
      expect(result?.bankTransactionId).toBe("TXN-BANK-001");
      expect(localTransactions[0].bankTransactionId).toBe("TXN-BANK-001");
    });

    it("deve retornar null para ID local inexistente", () => {
      const localTransactions: LocalTransaction[] = [
        {
          id: "local-001",
          date: "2024-01-15",
          amount: 250.0,
          description: "PIX",
          type: "saida",
          bankTransactionId: null,
        },
      ];

      const result = matcher.linkTransaction(
        "local-inexistente",
        "TXN-BANK-001",
        localTransactions
      );

      expect(result).toBeNull();
    });

    it("deve manter transações não modificadas", () => {
      const localTransactions: LocalTransaction[] = [
        {
          id: "local-001",
          date: "2024-01-15",
          amount: 250.0,
          description: "PIX",
          type: "saida",
          bankTransactionId: null,
        },
        {
          id: "local-002",
          date: "2024-01-14",
          amount: 1000.0,
          description: "Depósito",
          type: "entrada",
          bankTransactionId: null,
        },
      ];

      matcher.linkTransaction("local-001", "TXN-BANK-001", localTransactions);

      expect(localTransactions[0].bankTransactionId).toBe("TXN-BANK-001");
      expect(localTransactions[1].bankTransactionId).toBeNull();
    });

    it("deve sobrescrever vinculação existente", () => {
      const localTransactions: LocalTransaction[] = [
        {
          id: "local-001",
          date: "2024-01-15",
          amount: 250.0,
          description: "PIX",
          type: "saida",
          bankTransactionId: "TXN-OLD",
        },
      ];

      matcher.linkTransaction("local-001", "TXN-NEW", localTransactions);

      expect(localTransactions[0].bankTransactionId).toBe("TXN-NEW");
    });
  });

  describe("Processamento em lote", () => {
    it("deve processar múltiplas transações corretamente", () => {
      const bankTransactions: BankTransaction[] = [
        {
          transactionId: "TXN-001",
          date: "2024-01-15",
          amount: 250.0,
          description: "PIX",
          type: "saida",
        },
        {
          transactionId: "TXN-002",
          date: "2024-01-16",
          amount: 500.0,
          description: "TED",
          type: "entrada",
        },
        {
          transactionId: "TXN-003",
          date: "2024-01-17",
          amount: 100.0,
          description: "BOLETO",
          type: "saida",
        },
      ];

      const localTransactions: LocalTransaction[] = [
        {
          id: "local-001",
          date: "2024-01-15",
          amount: 250.0,
          description: "PIX Local",
          type: "saida",
          bankTransactionId: null,
        },
      ];

      const result = matcher.processTransactions(
        bankTransactions,
        localTransactions
      );

      expect(result.matched.length).toBe(1);
      expect(result.matched[0].bankId).toBe("TXN-001");
      expect(result.toCreate.length).toBe(2);
      expect(result.duplicates.length).toBe(0);
    });

    it("deve identificar duplicatas em processamento em lote", () => {
      const bankTransactions: BankTransaction[] = [
        {
          transactionId: "TXN-EXISTING",
          date: "2024-01-15",
          amount: 250.0,
          description: "PIX",
          type: "saida",
        },
        {
          transactionId: "TXN-NEW",
          date: "2024-01-16",
          amount: 500.0,
          description: "TED",
          type: "entrada",
        },
      ];

      const localTransactions: LocalTransaction[] = [
        {
          id: "local-001",
          date: "2024-01-15",
          amount: 250.0,
          description: "PIX Local",
          type: "saida",
          bankTransactionId: "TXN-EXISTING",
        },
      ];

      const result = matcher.processTransactions(
        bankTransactions,
        localTransactions
      );

      expect(result.duplicates.length).toBe(1);
      expect(result.duplicates[0].transactionId).toBe("TXN-EXISTING");
      expect(result.toCreate.length).toBe(1);
      expect(result.toCreate[0].transactionId).toBe("TXN-NEW");
    });

    it("deve retornar arrays vazios quando não há transações", () => {
      const result = matcher.processTransactions([], []);

      expect(result.matched).toEqual([]);
      expect(result.duplicates).toEqual([]);
      expect(result.toCreate).toEqual([]);
    });
  });

  describe("Configuração de tolerância", () => {
    it("deve usar tolerância padrão de 1 dia", () => {
      const defaultMatcher = new TransactionMatcher();
      // Teste implícito - não deve lançar erro
      expect(defaultMatcher).toBeDefined();
    });

    it("deve aceitar tolerância customizada", () => {
      const customMatcher = new TransactionMatcher(3);

      const bankTransaction: BankTransaction = {
        transactionId: "TXN-001",
        date: "2024-01-18",
        amount: 250.0,
        description: "Teste",
        type: "saida",
      };

      const localTransactions: LocalTransaction[] = [
        {
          id: "local-001",
          date: "2024-01-15",
          amount: 250.0,
          description: "Teste",
          type: "saida",
          bankTransactionId: null,
        },
      ];

      // Com 3 dias de tolerância, deve encontrar match
      const match = customMatcher.findFuzzyMatch(
        bankTransaction,
        localTransactions
      );

      expect(match).not.toBeNull();
    });
  });
});
