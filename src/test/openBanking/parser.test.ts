/**
 * Testes de Parser Open Banking
 * Normalização de dados, identificação entrada/saída, parsing de descrições
 */
import { describe, it, expect } from "vitest";
import {
  mockTransactionsItau,
  mockTransactionsBradesco,
} from "../fixtures/openBanking";

interface ParsedTransaction {
  id: string;
  externalId: string;
  bankId: string;
  accountId: string;
  date: string;
  amount: number;
  type: "entrada" | "saida";
  description: string;
  category: string;
  counterparty?: string;
  rawData: unknown;
}

interface BankTransaction {
  transactionId: string;
  completedAuthorisedPaymentType: string;
  creditDebitType: "CREDIT" | "DEBIT";
  transactionName: string;
  type: string;
  amount: {
    amount: string;
    currency: string;
  };
  transactionDate: string;
  transactionDateTime: string;
  partieCnpjCpf?: string;
  partiePersonType?: string;
  payerInformation?: string;
  [key: string]: unknown;
}

class OpenBankingParser {
  private bankId: string;
  private accountId: string;

  constructor(bankId: string, accountId: string) {
    this.bankId = bankId;
    this.accountId = accountId;
  }

  // Normaliza dados de diferentes bancos para formato padrão
  parseTransaction(rawTransaction: BankTransaction): ParsedTransaction {
    return {
      id: rawTransaction.transactionId,
      externalId: rawTransaction.transactionId,
      bankId: this.bankId,
      accountId: this.accountId,
      date: rawTransaction.transactionDate,
      amount: this.parseAmount(rawTransaction.amount.amount),
      type: this.identifyEntryType(rawTransaction.creditDebitType),
      description: this.normalizeDescription(rawTransaction.transactionName),
      category: this.categorizeTransaction(rawTransaction),
      counterparty: rawTransaction.payerInformation,
      rawData: rawTransaction,
    };
  }

  // Converte valor monetário string para número
  parseAmount(amount: string): number {
    return parseFloat(amount);
  }

  // Identifica se é entrada ou saída
  identifyEntryType(creditDebitType: "CREDIT" | "DEBIT"): "entrada" | "saida" {
    return creditDebitType === "CREDIT" ? "entrada" : "saida";
  }

  // Normaliza descrição
  normalizeDescription(description: string): string {
    return description
      .trim()
      .toUpperCase()
      .replace(/\s+/g, " ");
  }

  // Categoriza transação baseado no tipo e descrição
  categorizeTransaction(transaction: BankTransaction): string {
    const typeMap: Record<string, string> = {
      PIX: "transferencia",
      TED: "transferencia",
      DOC: "transferencia",
      BOLETO: "contas",
      CARTAO: "despesa",
      DEPOSITO: "receita",
      RENDIMENTO: "rendimento",
      SALARIO: "receita",
      PAGAMENTO: "contas",
    };

    const category = typeMap[transaction.type];
    if (category) return category;

    // Fallback baseado em palavras-chave na descrição
    const desc = transaction.transactionName.toUpperCase();
    if (desc.includes("PIX")) return "transferencia";
    if (desc.includes("BOLETO")) return "contas";
    if (desc.includes("CARTAO")) return "despesa";
    if (desc.includes("DEPOSITO")) return "receita";
    if (desc.includes("SALARIO")) return "receita";

    return "outros";
  }

  // Parse de múltiplas transações
  parseTransactions(transactions: BankTransaction[]): ParsedTransaction[] {
    return transactions.map((t) => this.parseTransaction(t));
  }

  // Normaliza dados entre diferentes bancos
  normalizeBankData(
    transactions: BankTransaction[],
    bankFormat: "itau" | "bradesco" | "santander"
  ): ParsedTransaction[] {
    // Aplica normalizações específicas por banco se necessário
    const normalized = [...transactions];

    if (bankFormat === "bradesco") {
      // Bradesco pode ter campos ligeiramente diferentes
      normalized.forEach((t) => {
        if (!t.transactionName && t.type) {
          t.transactionName = t.type;
        }
      });
    }

    return this.parseTransactions(normalized);
  }

  // Extrai CPF/CNPJ do counterparty
  extractDocument(transaction: BankTransaction): string | null {
    if (transaction.partieCnpjCpf) {
      return transaction.partieCnpjCpf.replace(/\D/g, "");
    }
    return null;
  }

  // Extrai tipo de pessoa (PF/PJ)
  extractPersonType(transaction: BankTransaction): "PF" | "PJ" | null {
    if (transaction.partiePersonType === "PESSOA_NATURAL") return "PF";
    if (transaction.partiePersonType === "PESSOA_JURIDICA") return "PJ";
    return null;
  }
}

describe("OpenBanking Parser", () => {
  const parser = new OpenBankingParser("itau", "acc-itau-001");

  describe("Normalização de dados de diferentes bancos", () => {
    it("deve normalizar transações do Itaú", () => {
      const raw = mockTransactionsItau.data.transactions[0];
      const parsed = parser.parseTransaction(raw);

      expect(parsed).toHaveProperty("id");
      expect(parsed).toHaveProperty("bankId", "itau");
      expect(parsed).toHaveProperty("accountId", "acc-itau-001");
    });

    it("deve normalizar transações do Bradesco", () => {
      const bradescoParser = new OpenBankingParser("bradesco", "acc-bradesco-001");
      const raw = mockTransactionsBradesco.data.transactions[0];
      const parsed = bradescoParser.parseTransaction(raw);

      expect(parsed).toHaveProperty("id");
      expect(parsed).toHaveProperty("bankId", "bradesco");
    });

    it("deve manter estrutura consistente entre bancos", () => {
      const itauRaw = mockTransactionsItau.data.transactions[0];
      const bradescoRaw = mockTransactionsBradesco.data.transactions[0];

      const itauParsed = parser.parseTransaction(itauRaw);
      const bradescoParsed = new OpenBankingParser(
        "bradesco",
        "acc-bradesco-001"
      ).parseTransaction(bradescoRaw);

      // Mesmas propriedades devem existir
      const itauKeys = Object.keys(itauParsed).sort();
      const bradescoKeys = Object.keys(bradescoParsed).sort();

      expect(itauKeys).toEqual(bradescoKeys);
    });

    it("deve preservar dados brutos em rawData", () => {
      const raw = mockTransactionsItau.data.transactions[0];
      const parsed = parser.parseTransaction(raw);

      expect(parsed.rawData).toEqual(raw);
    });
  });

  describe("Identificação de entrada/saída", () => {
    it("deve identificar CREDIT como entrada", () => {
      const raw: BankTransaction = {
        ...mockTransactionsItau.data.transactions[0],
        creditDebitType: "CREDIT",
      };
      const parsed = parser.parseTransaction(raw);

      expect(parsed.type).toBe("entrada");
    });

    it("deve identificar DEBIT como saída", () => {
      const raw: BankTransaction = {
        ...mockTransactionsItau.data.transactions[0],
        creditDebitType: "DEBIT",
      };
      const parsed = parser.parseTransaction(raw);

      expect(parsed.type).toBe("saida");
    });

    it("deve retornar entrada para tipo CREDIT na função auxiliar", () => {
      expect(parser.identifyEntryType("CREDIT")).toBe("entrada");
    });

    it("deve retornar saída para tipo DEBIT na função auxiliar", () => {
      expect(parser.identifyEntryType("DEBIT")).toBe("saida");
    });
  });

  describe("Parsing de descrições", () => {
    it("deve normalizar descrição para maiúsculas", () => {
      const raw: BankTransaction = {
        ...mockTransactionsItau.data.transactions[0],
        transactionName: "  pix transfer  ",
      };
      const parsed = parser.parseTransaction(raw);

      expect(parsed.description).toBe("PIX TRANSFER");
    });

    it("deve remover espaços extras da descrição", () => {
      const raw: BankTransaction = {
        ...mockTransactionsItau.data.transactions[0],
        transactionName: "PAGAMENTO    BOLETO",
      };
      const parsed = parser.parseTransaction(raw);

      expect(parsed.description).toBe("PAGAMENTO BOLETO");
    });

    it("deve manter descrição já normalizada", () => {
      const raw: BankTransaction = {
        ...mockTransactionsItau.data.transactions[0],
        transactionName: "DEPOSITO",
      };
      const parsed = parser.parseTransaction(raw);

      expect(parsed.description).toBe("DEPOSITO");
    });
  });

  describe("Conversão de valores", () => {
    it("deve converter string para número", () => {
      expect(parser.parseAmount("150.50")).toBe(150.5);
      expect(parser.parseAmount("1000.00")).toBe(1000);
      expect(parser.parseAmount("0.99")).toBe(0.99);
    });

    it("deve converter valor no objeto parsed", () => {
      const raw = mockTransactionsItau.data.transactions[0];
      const parsed = parser.parseTransaction(raw);

      expect(typeof parsed.amount).toBe("number");
      expect(parsed.amount).toBe(250.0);
    });

    it("deve lidar com valores grandes", () => {
      const raw: BankTransaction = {
        ...mockTransactionsItau.data.transactions[0],
        amount: { amount: "1000000.00", currency: "BRL" },
      };
      const parsed = parser.parseTransaction(raw);

      expect(parsed.amount).toBe(1000000.0);
    });

    it("deve lidar com valores pequenos", () => {
      const raw: BankTransaction = {
        ...mockTransactionsItau.data.transactions[0],
        amount: { amount: "0.01", currency: "BRL" },
      };
      const parsed = parser.parseTransaction(raw);

      expect(parsed.amount).toBe(0.01);
    });
  });

  describe("Categorização de transações", () => {
    it("deve categorizar PIX como transferencia", () => {
      const raw: BankTransaction = {
        ...mockTransactionsItau.data.transactions[0],
        type: "PIX",
      };
      const parsed = parser.parseTransaction(raw);

      expect(parsed.category).toBe("transferencia");
    });

    it("deve categorizar TED como transferencia", () => {
      const raw: BankTransaction = {
        ...mockTransactionsItau.data.transactions[0],
        type: "TED",
      };
      const parsed = parser.parseTransaction(raw);

      expect(parsed.category).toBe("transferencia");
    });

    it("deve categorizar BOLETO como contas", () => {
      const raw: BankTransaction = {
        ...mockTransactionsItau.data.transactions[0],
        type: "BOLETO",
      };
      const parsed = parser.parseTransaction(raw);

      expect(parsed.category).toBe("contas");
    });

    it("deve categorizar CARTAO como despesa", () => {
      const raw: BankTransaction = {
        ...mockTransactionsItau.data.transactions[0],
        type: "CARTAO",
      };
      const parsed = parser.parseTransaction(raw);

      expect(parsed.category).toBe("despesa");
    });

    it("deve categorizar DEPOSITO como receita", () => {
      const raw: BankTransaction = {
        ...mockTransactionsItau.data.transactions[0],
        type: "DEPOSITO",
      };
      const parsed = parser.parseTransaction(raw);

      expect(parsed.category).toBe("receita");
    });

    it("deve categorizar RENDIMENTO como rendimento", () => {
      const raw: BankTransaction = {
        ...mockTransactionsItau.data.transactions[0],
        type: "RENDIMENTO",
      };
      const parsed = parser.parseTransaction(raw);

      expect(parsed.category).toBe("rendimento");
    });

    it("deve usar categoria 'outros' para tipo desconhecido", () => {
      const raw: BankTransaction = {
        ...mockTransactionsItau.data.transactions[0],
        type: "TIPO_DESCONHECIDO",
        transactionName: "TRANSACAO QUALQUER",
      };
      const parsed = parser.parseTransaction(raw);

      expect(parsed.category).toBe("outros");
    });

    it("deve inferir categoria da descrição para tipo desconhecido", () => {
      const raw: BankTransaction = {
        ...mockTransactionsItau.data.transactions[0],
        type: "OUTRO",
        transactionName: "PIX RECEBIDO",
      };
      const parsed = parser.parseTransaction(raw);

      expect(parsed.category).toBe("transferencia");
    });
  });

  describe("Parse de múltiplas transações", () => {
    it("deve parsear array de transações", () => {
      const transactions = mockTransactionsItau.data.transactions;
      const parsed = parser.parseTransactions(transactions);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(transactions.length);
    });

    it("deve manter ordem das transações", () => {
      const transactions = mockTransactionsItau.data.transactions;
      const parsed = parser.parseTransactions(transactions);

      parsed.forEach((p, index) => {
        expect(p.id).toBe(transactions[index].transactionId);
      });
    });
  });

  describe("Extração de metadados", () => {
    it("deve extrair CPF/CNPJ do counterparty", () => {
      const raw = mockTransactionsItau.data.transactions[0];
      const document = parser.extractDocument(raw);

      expect(document).toBe("12345678901");
    });

    it("deve retornar null quando não houver CPF/CNPJ", () => {
      const raw: BankTransaction = {
        ...mockTransactionsItau.data.transactions[1],
        partieCnpjCpf: undefined,
      };
      const document = parser.extractDocument(raw);

      expect(document).toBeNull();
    });

    it("deve extrair tipo de pessoa PF", () => {
      const raw = mockTransactionsItau.data.transactions[0];
      const personType = parser.extractPersonType(raw);

      expect(personType).toBe("PF");
    });

    it("deve extrair tipo de pessoa PJ", () => {
      const raw: BankTransaction = {
        ...mockTransactionsItau.data.transactions[0],
        partiePersonType: "PESSOA_JURIDICA",
      };
      const personType = parser.extractPersonType(raw);

      expect(personType).toBe("PJ");
    });

    it("deve incluir informações do counterparty no parsed", () => {
      const raw = mockTransactionsItau.data.transactions[0];
      const parsed = parser.parseTransaction(raw);

      expect(parsed.counterparty).toBe("João Silva");
    });
  });

  describe("Datas", () => {
    it("deve extrair data no formato YYYY-MM-DD", () => {
      const raw = mockTransactionsItau.data.transactions[0];
      const parsed = parser.parseTransaction(raw);

      expect(parsed.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("deve manter data original", () => {
      const raw = mockTransactionsItau.data.transactions[0];
      const parsed = parser.parseTransaction(raw);

      expect(parsed.date).toBe(raw.transactionDate);
    });
  });
});
