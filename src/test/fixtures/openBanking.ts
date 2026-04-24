/**
 * Fixtures para testes de Open Banking
 * Dados simulados baseados em formatos reais de APIs bancárias brasileiras
 */

// Tokens de autenticação
export const mockTokens = {
  access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  refresh_token: "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4",
  token_type: "Bearer",
  expires_in: 3600,
  scope: "accounts payments",
};

// Consentimento
export const mockConsent = {
  data: {
    consentId: "consent-123-456",
    status: "AWAITING_AUTHORISATION",
    creationDateTime: "2024-01-15T10:00:00Z",
    statusUpdateDateTime: "2024-01-15T10:00:00Z",
    permissions: [
      "ACCOUNTS_READ",
      "ACCOUNTS_BALANCES_READ",
      "RESOURCES_READ",
      "STATEMENTS_READ",
    ],
    expirationDateTime: "2024-07-15T10:00:00Z",
  },
};

// Resposta de consentimento autorizado
export const mockConsentAuthorized = {
  data: {
    ...mockConsent.data,
    status: "AUTHORISED",
    statusUpdateDateTime: "2024-01-15T10:05:00Z",
  },
};

// Resposta de consentimento rejeitado
export const mockConsentRejected = {
  data: {
    ...mockConsent.data,
    status: "REJECTED",
    statusUpdateDateTime: "2024-01-15T10:03:00Z",
    rejectionReason: {
      code: "CUSTOMER_DENIED",
      detail: "Usuário rejeitou o consentimento",
    },
  },
};

// Dados de conta - Formato Itaú
export const mockAccountItau = {
  data: {
    accountId: "acc-itau-001",
    accountType: "CACC",
    brandName: "Itaú Unibanco",
    companyCnpj: "60701190000104",
    name: "Conta Corrente",
    number: "12345-6",
    checkDigit: "7",
    branchCode: "0001",
  },
};

// Dados de conta - Formato Bradesco
export const mockAccountBradesco = {
  data: {
    accountId: "acc-bradesco-001",
    accountType: "CACC",
    brandName: "Bradesco",
    companyCnpj: "60746948000112",
    name: "Conta Corrente PF",
    number: "98765-4",
    checkDigit: "3",
    branchCode: "1234",
  },
};

// Lista de contas
export const mockAccountsList = {
  data: [mockAccountItau.data, mockAccountBradesco.data],
};

// Saldo da conta
export const mockBalance = {
  data: {
    availableAmount: {
      amount: "15000.50",
      currency: "BRL",
    },
    blockedAmount: {
      amount: "500.00",
      currency: "BRL",
    },
    automaticallyInvestedAmount: {
      amount: "2000.00",
      currency: "BRL",
    },
  },
};

// Transações do extrato - Formato Itaú
export const mockTransactionsItau = {
  data: {
    transactions: [
      {
        transactionId: "TXN-ITAU-001",
        completedAuthorisedPaymentType: "TRANSACAO_EFETIVADA",
        creditDebitType: "DEBIT",
        transactionName: "PIX TRANSFER",
        type: "PIX",
        amount: {
          amount: "250.00",
          currency: "BRL",
        },
        transactionDate: "2024-01-15",
        transactionDateTime: "2024-01-15T14:30:00Z",
        partieCnpjCpf: "12345678901",
        partiePersonType: "PESSOA_NATURAL",
        partieCompeCode: "077",
        partieBranchCode: "0001",
        partieNumber: "12345",
        partieCheckDigit: "6",
        payerInformation: "João Silva",
      },
      {
        transactionId: "TXN-ITAU-002",
        completedAuthorisedPaymentType: "TRANSACAO_EFETIVADA",
        creditDebitType: "CREDIT",
        transactionName: "DEPOSITO",
        type: "DEPOSITO",
        amount: {
          amount: "1000.00",
          currency: "BRL",
        },
        transactionDate: "2024-01-14",
        transactionDateTime: "2024-01-14T09:00:00Z",
      },
      {
        transactionId: "TXN-ITAU-003",
        completedAuthorisedPaymentType: "TRANSACAO_EFETIVADA",
        creditDebitType: "DEBIT",
        transactionName: "BOLETO PAGAMENTO",
        type: "BOLETO",
        amount: {
          amount: "150.75",
          currency: "BRL",
        },
        transactionDate: "2024-01-13",
        transactionDateTime: "2024-01-13T16:45:00Z",
      },
      {
        transactionId: "TXN-ITAU-004",
        completedAuthorisedPaymentType: "TRANSACAO_EFETIVADA",
        creditDebitType: "CREDIT",
        transactionName: "TRANSFERENCIA RECEBIDA",
        type: "TED",
        amount: {
          amount: "5000.00",
          currency: "BRL",
        },
        transactionDate: "2024-01-12",
        transactionDateTime: "2024-01-12T11:20:00Z",
      },
      {
        transactionId: "TXN-ITAU-005",
        completedAuthorisedPaymentType: "TRANSACAO_EFETIVADA",
        creditDebitType: "DEBIT",
        transactionName: "COMPRA CARTAO",
        type: "CARTAO",
        amount: {
          amount: "89.90",
          currency: "BRL",
        },
        transactionDate: "2024-01-12",
        transactionDateTime: "2024-01-12T19:30:00Z",
      },
    ],
  },
};

// Transações do extrato - Formato Bradesco
export const mockTransactionsBradesco = {
  data: {
    transactions: [
      {
        transactionId: "TXN-BRAD-001",
        completedAuthorisedPaymentType: "TRANSACAO_EFETIVADA",
        creditDebitType: "DEBIT",
        transactionName: "PAGAMENTO PIX",
        type: "PIX",
        amount: {
          amount: "350.00",
          currency: "BRL",
        },
        transactionDate: "2024-01-15",
        transactionDateTime: "2024-01-15T10:15:00Z",
      },
      {
        transactionId: "TXN-BRAD-002",
        completedAuthorisedPaymentType: "TRANSACAO_EFETIVADA",
        creditDebitType: "CREDIT",
        transactionName: "RENDIMENTO",
        type: "RENDIMENTO",
        amount: {
          amount: "15.50",
          currency: "BRL",
        },
        transactionDate: "2024-01-15",
        transactionDateTime: "2024-01-15T00:00:00Z",
      },
    ],
  },
};

// Configurações de bancos suportados
export const mockBankConfigs = [
  {
    id: "itau",
    name: "Itaú Unibanco",
    code: "341",
    ispbCode: "60701190",
    logoUrl: "/banks/itau.svg",
    authUrl: "https://api.itau/open-banking/authorization",
    tokenUrl: "https://api.itau/open-banking/token",
    apiBaseUrl: "https://api.itau/open-banking",
  },
  {
    id: "bradesco",
    name: "Bradesco",
    code: "237",
    ispbCode: "60746948",
    logoUrl: "/banks/bradesco.svg",
    authUrl: "https://api.bradesco/open-banking/authorization",
    tokenUrl: "https://api.bradesco/open-banking/token",
    apiBaseUrl: "https://api.bradesco/open-banking",
  },
  {
    id: "santander",
    name: "Santander",
    code: "033",
    ispbCode: "90400888",
    logoUrl: "/banks/santander.svg",
    authUrl: "https://api.santander/open-banking/authorization",
    tokenUrl: "https://api.santander/open-banking/token",
    apiBaseUrl: "https://api.santander/open-banking",
  },
];

// Erros de API
export const mockError401 = {
  errors: [
    {
      code: "INVALID_TOKEN",
      title: "Token inválido",
      detail: "O access token fornecido é inválido ou expirou",
    },
  ],
};

export const mockError403 = {
  errors: [
    {
      code: "FORBIDDEN",
      title: "Acesso negado",
      detail: "O consentimento não permite acesso a este recurso",
    },
  ],
};

export const mockError429 = {
  errors: [
    {
      code: "RATE_LIMIT",
      title: "Rate limit excedido",
      detail: "Limite de requisições excedido. Tente novamente em 60 segundos.",
    },
  ],
};

// Estado da conexão Open Banking
export const mockOpenBankingConnection = {
  id: "conn-001",
  bankId: "itau",
  bankName: "Itaú Unibanco",
  accountId: "acc-itau-001",
  accountNumber: "12345-6",
  agency: "0001",
  consentId: "consent-123-456",
  consentStatus: "AUTHORISED",
  consentExpiresAt: "2024-07-15T10:00:00Z",
  lastSyncAt: "2024-01-15T12:00:00Z",
  status: "active",
  createdAt: "2024-01-15T10:00:00Z",
};

// Transações normalizadas esperadas
export const mockNormalizedTransactions = [
  {
    id: "TXN-ITAU-001",
    externalId: "TXN-ITAU-001",
    bankId: "itau",
    accountId: "acc-itau-001",
    date: "2024-01-15",
    amount: 250.0,
    type: "saida",
    description: "PIX TRANSFER",
    category: "transferencia",
    counterparty: "João Silva",
    rawData: mockTransactionsItau.data.transactions[0],
  },
  {
    id: "TXN-ITAU-002",
    externalId: "TXN-ITAU-002",
    bankId: "itau",
    accountId: "acc-itau-001",
    date: "2024-01-14",
    amount: 1000.0,
    type: "entrada",
    description: "DEPOSITO",
    category: "deposito",
    rawData: mockTransactionsItau.data.transactions[1],
  },
  {
    id: "TXN-ITAU-003",
    externalId: "TXN-ITAU-003",
    bankId: "itau",
    accountId: "acc-itau-001",
    date: "2024-01-13",
    amount: 150.75,
    type: "saida",
    description: "BOLETO PAGAMENTO",
    category: "boleto",
    rawData: mockTransactionsItau.data.transactions[2],
  },
];

// Dados para teste de matching
export const mockExistingTransactions = [
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
    bankTransactionId: "TXN-ITAU-002",
  },
  {
    id: "local-003",
    date: "2024-01-10",
    amount: 150.75,
    description: "Pagamento",
    type: "saida",
    bankTransactionId: null,
  },
];

// Dados para teste de UI
export const mockOpenBankingConfig = {
  connections: [mockOpenBankingConnection],
  autoSync: true,
  syncFrequency: "daily",
  defaultCategoryMapping: {
    PIX: "transferencia",
    BOLETO: "contas",
    TED: "transferencia",
    DEPOSITO: "receita",
    CARTAO: "despesa",
  },
};
