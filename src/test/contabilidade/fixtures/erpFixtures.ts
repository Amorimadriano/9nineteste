/**
 * Fixtures para testes de integração contábil com ERPs
 * Task #34 - APIs Contabilidade - Testes e Documentação
 */

// Dados reais de contas a pagar
export const contasPagarExemplo = [
  {
    id: "cp-001",
    fornecedor: "Fornecedor ABC Ltda",
    cnpjFornecedor: "12.345.678/0001-90",
    numeroDocumento: "NF-1234",
    dataEmissao: "2024-04-01",
    dataVencimento: "2024-04-30",
    valor: 15000.0,
    historico: "Compra de materiais escritório",
    centroCusto: "001",
    contaContabil: "2.1.1.01",
    natureza: "despesa",
  },
  {
    id: "cp-002",
    fornecedor: "Energia Elétrica S.A.",
    cnpjFornecedor: "98.765.432/0001-10",
    numeroDocumento: "NF-5678",
    dataEmissao: "2024-04-05",
    dataVencimento: "2024-05-05",
    valor: 2845.67,
    historico: "Energia elétrica matriz",
    centroCusto: "001",
    contaContabil: "2.1.1.02",
    natureza: "despesa",
  },
  {
    id: "cp-003",
    fornecedor: "Telecomunicações Brasil",
    cnpjFornecedor: "11.222.333/0001-44",
    numeroDocumento: "NF-9999",
    dataEmissao: "2024-04-10",
    dataVencimento: "2024-05-10",
    valor: 1250.5,
    historico: "Serviços de telefonia e internet",
    centroCusto: "002",
    contaContabil: "2.1.1.02",
    natureza: "despesa",
  },
];

// Dados de contas a receber
export const contasReceberExemplo = [
  {
    id: "cr-001",
    cliente: "Cliente XYZ S.A.",
    cnpjCliente: "55.444.333/0001-22",
    numeroDocumento: "NF-001",
    dataEmissao: "2024-04-01",
    dataVencimento: "2024-05-01",
    valor: 25000.0,
    historico: "Prestação de serviços - Projeto A",
    centroCusto: "003",
    contaContabil: "1.1.2.01",
    natureza: "receita",
  },
  {
    id: "cr-002",
    cliente: "Empresa Cliente 2",
    cnpjCliente: "66.777.888/0001-33",
    numeroDocumento: "NF-002",
    dataEmissao: "2024-04-15",
    dataVencimento: "2024-05-15",
    valor: 8750.0,
    historico: "Venda de produtos",
    centroCusto: "003",
    contaContabil: "1.1.2.01",
    natureza: "receita",
  },
];

// Mapeamento de contas contábeis
export const mapeamentoContas = {
  "2.1.1.01": {
    totvs: "21101",
    sankhya: "21101",
    dominio: "FORNECEDORES",
    alterdata: "2.01.01.01",
    descricao: "Fornecedores a Pagar",
  },
  "2.1.1.02": {
    totvs: "21102",
    sankhya: "21102",
    dominio: "FORNEC_DIVERSOS",
    alterdata: "2.01.01.02",
    descricao: "Fornecedores Diversos",
  },
  "1.1.2.01": {
    totvs: "11201",
    sankhya: "11201",
    dominio: "CLIENTES",
    alterdata: "1.01.02.01",
    descricao: "Clientes a Receber",
  },
  "3.1.1.01": {
    totvs: "31101",
    sankhya: "31101",
    dominio: "RECEITA_VENDA",
    alterdata: "3.01.01.01",
    descricao: "Receita de Vendas",
  },
  "4.1.1.01": {
    totvs: "41101",
    sankhya: "41101",
    dominio: "CUSTO_VENDA",
    alterdata: "4.01.01.01",
    descricao: "Custo das Mercadorias",
  },
};

// Respostas mockadas das APIs
export const respostasAPIs = {
  // TOTVS
  totvs: {
    auth: {
      success: {
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock",
        refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh",
        expiresIn: 3600,
        tokenType: "Bearer",
      },
      error: {
        error: "invalid_credentials",
        message: "Credenciais inválidas",
      },
    },
    exportacao: {
      success: {
        id: "EXP-12345",
        status: "success",
        registrosProcessados: 3,
        registrosInseridos: 3,
        erros: [],
      },
      partial: {
        id: "EXP-12346",
        status: "partial",
        registrosProcessados: 3,
        registrosInseridos: 2,
        erros: [
          { linha: 2, erro: "Conta contábil não encontrada" },
        ],
      },
    },
    importacao: {
      success: {
        id: "IMP-12345",
        status: "success",
        lancamentos: [
          {
            id: "LANC-001",
            data: "2024-04-01",
            contaDebito: "2.1.1.01",
            contaCredito: "1.1.1.01",
            valor: 15000.0,
            historico: "Pagamento fornecedor",
          },
        ],
      },
    },
  },

  // Sankhya
  sankhya: {
    auth: {
      success: {
        token: "abc123def456",
        jsessionId: "JSESSIONID=ABC123DEF456",
        expiresIn: 1800,
      },
      error: {
        error: "LOGIN_FAILED",
        message: "Usuário ou senha incorretos",
      },
    },
    exportacao: {
      success: {
        pk: { NOMEPROC: "ExportacaoContas", STATUS: "OK" },
        rows: 3,
      },
    },
    importacao: {
      success: {
        pk: { NOMEPROC: "ImportacaoLancamentos", STATUS: "OK" },
        rows: 1,
      },
    },
  },

  // Domínio
  dominio: {
    auth: {
      success: {
        token: "dominio-token-123",
        sessionId: "SESSION-ABC-123",
      },
      error: {
        code: 401,
        message: "Authentication failed",
      },
    },
    exportacao: {
      success: {
        success: true,
        message: "Dados exportados com sucesso",
        recordsAffected: 3,
      },
    },
  },

  // Alterdata
  alterdata: {
    auth: {
      success: {
        access_token: "alterdata-jwt-token",
        token_type: "Bearer",
        expires_in: 7200,
      },
    },
    exportacao: {
      success: {
        status: "success",
        totalRegistros: 3,
        registrosInseridos: 3,
        mensagens: [],
      },
    },
  },
};

// XML de exemplo - TOTVS
export const xmlTOTVS = `<?xml version="1.0" encoding="UTF-8"?>
<ExportacaoContas>
  <ContaPagar>
    <Codigo>cp-001</Codigo>
    <Fornecedor>Fornecedor ABC Ltda</Fornecedor>
    <CNPJ>12345678000190</CNPJ>
    <Documento>NF-1234</Documento>
    <Emissao>20240401</Emissao>
    <Vencimento>20240430</Vencimento>
    <Valor>15000,00</Valor>
    <Historico>Compra de materiais escritorio</Historico>
    <ContaContabil>21101</ContaContabil>
  </ContaPagar>
</ExportacaoContas>`;

// JSON de exemplo - Sankhya
export const jsonSankhya = {
  serviceName: "CRUDServiceProvider.saveRecord",
  body: {
    dataSet: {
      rootEntity: "Financeiro",
      includePresentationFields: "N",
      dataRow: {
        localFields: {
          CODPARC: { $: "123" },
          DTNEG: { $: "01/04/2024" },
          VLRDESDOB: { $: "15000.00" },
          HISTORICO: { $: "Compra de materiais escritorio" },
          CODNAT: { $: "21101" },
        },
      },
    },
  },
};

// XML - Domínio
export const xmlDominio = `<?xml version="1.0"?>
<Integracao>
  <Lancamento>
    <Tipo>CPAGAR</Tipo>
    <CodigoExterno>cp-001</CodigoExterno>
    <Pessoa>Fornecedor ABC Ltda</Pessoa>
    <Cnpj>12345678000190</Cnpj>
    <Documento>NF-1234</Documento>
    <Data>2024-04-01</Data>
    <Vencimento>2024-04-30</Vencimento>
    <Valor>15000.00</Valor>
    <Historico>Compra de materiais escritorio</Historico>
    <Conta>FORNECEDORES</Conta>
  </Lancamento>
</Integracao>`;

// JSON - Alterdata
export const jsonAlterdata = {
  operacao: "inclusao",
  tipoLancamento: "contasPagar",
  lancamentos: [
    {
      codigoExterno: "cp-001",
      pessoa: {
        nome: "Fornecedor ABC Ltda",
        cnpjCpf: "12.345.678/0001-90",
      },
      documento: {
        numero: "NF-1234",
        dataEmissao: "2024-04-01",
        dataVencimento: "2024-04-30",
      },
      valor: 15000.0,
      historico: "Compra de materiais escritorio",
      contaContabil: "2.01.01.01",
    },
  ],
};

// Erros típicos de cada sistema
export const errosTipicos = {
  totvs: [
    {
      code: "E001",
      message: "Conta contábil não cadastrada",
      solution: "Verificar mapeamento de contas",
    },
    {
      code: "E002",
      message: "CNPJ do fornecedor inválido",
      solution: "Validar CNPJ antes de exportar",
    },
    {
      code: "E003",
      message: "Data de vencimento inferior à data de emissão",
      solution: "Corrigir datas do lançamento",
    },
  ],
  sankhya: [
    {
      code: "SANK-001",
      message: "Registro já existe na base",
      solution: "Verificar duplicidade antes de exportar",
    },
    {
      code: "SANK-002",
      message: "Natureza não encontrada",
      solution: "Atualizar mapeamento de naturezas",
    },
  ],
  dominio: [
    {
      code: "DOM-001",
      message: "Acesso negado ao módulo Financeiro",
      solution: "Verificar permissões do usuário no ERP",
    },
    {
      code: "DOM-002",
      message: "Exercício contábil fechado",
      solution: "Reabrir exercício no ERP ou ajustar datas",
    },
  ],
  alterdata: [
    {
      code: "ALT-001",
      message: "Limite de requisições excedido",
      solution: "Aguardar rate limit reset",
    },
    {
      code: "ALT-002",
      message: "Conta contábil inativa",
      solution: "Ativar conta no plano de contas",
    },
  ],
};

// Dados para testes de conciliação
export const dadosConciliacao = {
  extratoBancario: [
    {
      id: "ext-001",
      data: "2024-04-15",
      descricao: "PGTO FORNECEDOR ABC",
      documento: "NF-1234",
      valor: -15000.0,
      tipo: "debito",
    },
    {
      id: "ext-002",
      data: "2024-04-16",
      descricao: "RECEB CLIENTE XYZ",
      documento: "NF-001",
      valor: 25000.0,
      tipo: "credito",
    },
    {
      id: "ext-003",
      data: "2024-04-17",
      descricao: "TARIFA BANCARIA",
      documento: "",
      valor: -25.5,
      tipo: "debito",
    },
  ],
  lancamentosInternos: [
    {
      id: "lan-001",
      data: "2024-04-15",
      descricao: "Pagamento Fornecedor ABC",
      documento: "NF-1234",
      valor: 15000.0,
      tipo: "saida",
      contaPagarId: "cp-001",
    },
    {
      id: "lan-002",
      data: "2024-04-16",
      descricao: "Recebimento Cliente XYZ",
      documento: "NF-001",
      valor: 25000.0,
      tipo: "entrada",
      contaReceberId: "cr-001",
    },
  ],
};

// Configurações de ERP
export const configuracoesERP = {
  totvs: {
    nome: "TOTVS Protheus",
    versao: "12.1.2210",
    url: "https://api.totvs.com.br",
    endpoints: {
      auth: "/auth/token",
      exportar: "/financeiro/contas-pagar",
      importar: "/financeiro/lancamentos",
    },
    rateLimit: {
      requestsPerSecond: 10,
      requestsPerMinute: 600,
    },
    retryConfig: {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 30000,
    },
  },
  sankhya: {
    nome: "Sankhya OM",
    versao: "4.4",
    url: "https://api.sankhya.com.br",
    endpoints: {
      auth: "/login",
      exportar: "/service.sbr",
      importar: "/service.sbr",
    },
    rateLimit: {
      requestsPerSecond: 5,
      requestsPerMinute: 300,
    },
    retryConfig: {
      maxRetries: 3,
      retryDelay: 2000,
      timeout: 60000,
    },
  },
  dominio: {
    nome: "Domínio Sistemas",
    versao: "2024.1",
    url: "https://api.dominio.com.br",
    endpoints: {
      auth: "/v1/auth",
      exportar: "/v1/financeiro/exportar",
      importar: "/v1/financeiro/importar",
    },
    rateLimit: {
      requestsPerSecond: 8,
      requestsPerMinute: 480,
    },
    retryConfig: {
      maxRetries: 5,
      retryDelay: 1500,
      timeout: 45000,
    },
  },
  alterdata: {
    nome: "Alterdata Bimer",
    versao: "11.5",
    url: "https://api.bimer.com.br",
    endpoints: {
      auth: "/oauth/token",
      exportar: "/api/v1/contas-pagar",
      importar: "/api/v1/lancamentos-contabeis",
    },
    rateLimit: {
      requestsPerSecond: 15,
      requestsPerMinute: 900,
    },
    retryConfig: {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 30000,
    },
  },
};

export const timeoutResponse = {
  code: "TIMEOUT",
  message: "Request timeout after 30000ms",
};

export const connectionError = {
  code: "ECONNREFUSED",
  message: "Connection refused - ERP indisponível",
};
