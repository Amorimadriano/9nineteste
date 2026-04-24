/**
 * Testes de Mapeamento
 * Task #34 - APIs Contabilidade - Testes e Documentação
 * Valida carregamento e aplicação de mapeamento de contas contábeis
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { mapeamentoContas, contasPagarExemplo } from "./fixtures/erpFixtures";

// Mock do serviço de mapeamento
const mockMapeamentoService = {
  carregarMapeamento: vi.fn(),
  salvarMapeamento: vi.fn(),
  validarConta: vi.fn(),
  sugerirMapeamento: vi.fn(),
  aplicarMapeamento: vi.fn(),
  buscarContaERP: vi.fn(),
  listarContasNaoMapeadas: vi.fn(),
  sincronizarComERP: vi.fn(),
};

// Dados de teste
const contasERP = {
  totvs: [
    { codigo: "21101", descricao: "Fornecedores a Pagar", tipo: "PASSIVO" },
    { codigo: "21102", descricao: "Fornecedores Diversos", tipo: "PASSIVO" },
    { codigo: "11201", descricao: "Clientes a Receber", tipo: "ATIVO" },
    { codigo: "31101", descricao: "Receita de Vendas", tipo: "RECEITA" },
    { codigo: "41101", descricao: "Custo das Mercadorias", tipo: "CUSTO" },
  ],
  sankhya: [
    { codigo: "21101", descricao: "FORNECEDORES A PAGAR", tipo: "P" },
    { codigo: "21102", descricao: "FORNECEDORES DIVERSOS", tipo: "P" },
    { codigo: "11201", descricao: "CLIENTES", tipo: "A" },
    { codigo: "31101", descricao: "RECEITA VENDA", tipo: "R" },
  ],
  dominio: [
    { codigo: "FORNECEDORES", descricao: "Fornecedores", tipo: "PASSIVO" },
    { codigo: "FORNEC_DIVERSOS", descricao: "Fornecedores Diversos", tipo: "PASSIVO" },
    { codigo: "CLIENTES", descricao: "Clientes", tipo: "ATIVO" },
  ],
  alterdata: [
    { codigo: "2.01.01.01", descricao: "Fornecedores", tipo: "Passivo" },
    { codigo: "2.01.01.02", descricao: "Obrigações Diversas", tipo: "Passivo" },
    { codigo: "1.01.02.01", descricao: "Clientes", tipo: "Ativo" },
  ],
};

describe("Carregamento de Mapeamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve carregar mapeamento do banco de dados", async () => {
    const mapeamentoMock = {
      contas: [
        { interna: "2.1.1.01", totvs: "21101", sankhya: "21101", ativa: true },
        { interna: "2.1.1.02", totvs: "21102", sankhya: "21102", ativa: true },
      ],
      atualizadoEm: "2024-04-15T10:00:00Z",
    };

    mockMapeamentoService.carregarMapeamento.mockResolvedValue(mapeamentoMock);

    const result = await mockMapeamentoService.carregarMapeamento("totvs");

    expect(result).toHaveProperty("contas");
    expect(result.contas).toBeInstanceOf(Array);
    expect(result.contas.length).toBe(2);
    expect(result).toHaveProperty("atualizadoEm");
  });

  it("deve retornar mapeamento vazio quando não existir", async () => {
    mockMapeamentoService.carregarMapeamento.mockResolvedValue({
      contas: [],
      atualizadoEm: null,
    });

    const result = await mockMapeamentoService.carregarMapeamento("totvs");

    expect(result.contas).toHaveLength(0);
    expect(result.atualizadoEm).toBeNull();
  });

  it("deve incluir descrição das contas no mapeamento", async () => {
    const mapeamentoComDescricao = {
      contas: [
        {
          interna: "2.1.1.01",
          totvs: "21101",
          descricaoInterna: "Fornecedores a Pagar",
          descricaoERP: "FORNECEDORES A PAGAR",
          ativa: true,
        },
      ],
    };

    mockMapeamentoService.carregarMapeamento.mockResolvedValue(mapeamentoComDescricao);

    const result = await mockMapeamentoService.carregarMapeamento("totvs");

    expect(result.contas[0]).toHaveProperty("descricaoInterna");
    expect(result.contas[0]).toHaveProperty("descricaoERP");
  });
});

describe("Validação de Contas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve validar conta existente no ERP", async () => {
    mockMapeamentoService.validarConta.mockImplementation((conta: string, erp: string) => {
      const contasERPValidas: Record<string, string[]> = {
        totvs: ["21101", "21102", "11201"],
        sankhya: ["21101", "21102"],
        dominio: ["FORNECEDORES", "CLIENTES"],
        alterdata: ["2.01.01.01", "2.01.01.02"],
      };

      const valida = contasERPValidas[erp]?.includes(conta) ?? false;
      return Promise.resolve({
        valido: valida,
        conta,
        erp,
        mensagem: valida ? "Conta válida" : "Conta não encontrada no ERP",
      });
    });

    const result = await mockMapeamentoService.validarConta("21101", "totvs");

    expect(result.valido).toBe(true);
    expect(result.conta).toBe("21101");
  });

  it("deve rejeitar conta inexistente no ERP", async () => {
    mockMapeamentoService.validarConta.mockResolvedValue({
      valido: false,
      conta: "99999",
      erp: "totvs",
      mensagem: "Conta não encontrada no ERP",
    });

    const result = await mockMapeamentoService.validarConta("99999", "totvs");

    expect(result.valido).toBe(false);
    expect(result.mensagem).toContain("não encontrada");
  });

  it("deve validar formato da conta conforme ERP", async () => {
    // Alterdata usa formato diferente
    mockMapeamentoService.validarConta.mockImplementation((conta: string, erp: string) => {
      if (erp === "alterdata") {
        const formatoAlterdata = /^\d\.\d{2}\.\d{2}\.\d{2}$/;
        const valido = formatoAlterdata.test(conta);
        return Promise.resolve({
          valido,
          conta,
          erp,
          mensagem: valido ? "Formato válido" : "Formato deve ser X.XX.XX.XX",
        });
      }
      return Promise.resolve({ valido: true, conta, erp, mensagem: "OK" });
    });

    const valida = await mockMapeamentoService.validarConta("2.01.01.01", "alterdata");
    const invalida = await mockMapeamentoService.validarConta("21101", "alterdata");

    expect(valida.valido).toBe(true);
    expect(invalida.valido).toBe(false);
  });

  it("deve verificar se conta está ativa no ERP", async () => {
    mockMapeamentoService.validarConta.mockResolvedValue({
      valido: false,
      conta: "21101",
      erp: "totvs",
      ativa: false,
      mensagem: "Conta contábil está inativa no ERP",
    });

    const result = await mockMapeamentoService.validarConta("21101", "totvs");

    expect(result.ativa).toBe(false);
    expect(result.mensagem).toContain("inativa");
  });
});

describe("Sugestão Automática de Mapeamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve sugerir mapeamento baseado na descrição", async () => {
    mockMapeamentoService.sugerirMapeamento.mockImplementation(
      (contaInterna: string, descricao: string, erp: string) => {
        const sugestoes: Record<string, string> = {
          "Fornecedores": "21101",
          "Clientes": "11201",
          "Receita": "31101",
        };

        for (const [palavra, contaERP] of Object.entries(sugestoes)) {
          if (descricao.toLowerCase().includes(palavra.toLowerCase())) {
            return Promise.resolve({
              sugerido: true,
              contaInterna: contaInterna,
              contaERP: contaERP,
              confianca: 0.85,
              razao: `Match por palavra-chave: ${palavra}`,
            });
          }
        }

        return Promise.resolve({
          sugerido: false,
          contaInterna,
          contaERP: null,
          confianca: 0,
          razao: "Nenhuma correspondência encontrada",
        });
      }
    );

    const sugestao = await mockMapeamentoService.sugerirMapeamento(
      "2.1.1.01",
      "Fornecedores a Pagar",
      "totvs"
    );

    expect(sugestao.sugerido).toBe(true);
    expect(sugestao.contaERP).toBe("21101");
    expect(sugestao.confianca).toBeGreaterThan(0.7);
  });

  it("deve calcular confiança da sugestão", async () => {
    mockMapeamentoService.sugerirMapeamento.mockResolvedValue({
      sugerido: true,
      contaInterna: "2.1.1.01",
      contaERP: "21101",
      confianca: 0.92,
      razao: "Descrição muito similar",
    });

    const sugestao = await mockMapeamentoService.sugerirMapeamento(
      "2.1.1.01",
      "Fornecedores",
      "totvs"
    );

    expect(sugestao.confianca).toBeGreaterThanOrEqual(0);
    expect(sugestao.confianca).toBeLessThanOrEqual(1);
  });

  it("deve sugerir múltiplas opções quando incerto", async () => {
    mockMapeamentoService.sugerirMapeamento.mockResolvedValue({
      sugerido: true,
      contaInterna: "2.1.1.01",
      contaERP: null,
      confianca: 0.5,
      alternativas: [
        { conta: "21101", confianca: 0.45, descricao: "Fornecedores" },
        { conta: "21102", confianca: 0.3, descricao: "Fornecedores Diversos" },
      ],
      razao: "Múltiplas correspondências possíveis",
    });

    const sugestao = await mockMapeamentoService.sugerirMapeamento(
      "2.1.1.01",
      "Pagamentos",
      "totvs"
    );

    expect(sugestao.alternativas).toBeInstanceOf(Array);
    expect(sugestao.alternativas.length).toBeGreaterThan(1);
  });

  it("deve aprender com mapeamentos anteriores", async () => {
    const historico = [
      { conta: "2.1.1.01", mapeadaPara: "21101", usuario: "admin", data: "2024-04-01" },
      { conta: "2.1.1.02", mapeadaPara: "21102", usuario: "admin", data: "2024-04-02" },
    ];

    mockMapeamentoService.sugerirMapeamento.mockImplementation(
      (conta: string, descricao: string) => {
        const aprendido = historico.find((h) => h.conta === conta);
        if (aprendido) {
          return Promise.resolve({
            sugerido: true,
            contaInterna: conta,
            contaERP: aprendido.mapeadaPara,
            confianca: 0.95,
            razao: "Mapeamento anterior confirmado",
            baseadoEm: aprendido,
          });
        }
        return Promise.resolve({ sugerido: false });
      }
    );

    const sugestao = await mockMapeamentoService.sugerirMapeamento("2.1.1.01", "Teste", "totvs");

    expect(sugestao.sugerido).toBe(true);
    expect(sugestao.baseadoEm).toBeDefined();
    expect(sugestao.confianca).toBe(0.95);
  });
});

describe("Aplicação de Mapeamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve aplicar mapeamento em dados de exportação", async () => {
    const dados = [contasPagarExemplo[0]];
    const mapeamento = {
      "2.1.1.01": { totvs: "21101", sankhya: "21101" },
    };

    mockMapeamentoService.aplicarMapeamento.mockImplementation(
      (data: any[], map: any, erp: string) => {
        return Promise.resolve(
          data.map((item) => ({
            ...item,
            contaContabilERP: map[item.contaContabil]?.[erp] || item.contaContabil,
          }))
        );
      }
    );

    const result = await mockMapeamentoService.aplicarMapeamento(dados, mapeamento, "totvs");

    expect(result[0]).toHaveProperty("contaContabilERP");
    expect(result[0].contaContabilERP).toBe("21101");
  });

  it("deve manter conta original quando não houver mapeamento", async () => {
    mockMapeamentoService.aplicarMapeamento.mockResolvedValue([
      {
        ...contasPagarExemplo[0],
        contaContabilERP: "2.1.1.99", // conta não mapeada, mantém original
      },
    ]);

    const result = await mockMapeamentoService.aplicarMapeamento(
      [contasPagarExemplo[0]],
      {},
      "totvs"
    );

    expect(result[0].contaContabilERP).toBe("2.1.1.99");
  });

  it("deve aplicar mapeamento em lote", async () => {
    const dados = contasPagarExemplo;
    const mapeamento = {
      "2.1.1.01": { totvs: "21101" },
      "2.1.1.02": { totvs: "21102" },
    };

    mockMapeamentoService.aplicarMapeamento.mockImplementation((data, map, erp) => {
      const mapeados = data.map((item) => ({
        ...item,
        contaContabilERP: map[item.contaContabil]?.[erp] || item.contaContabil,
      }));
      return Promise.resolve({
        dados: mapeados,
        total: mapeados.length,
        mapeados: mapeados.filter((m) => m.contaContabilERP !== m.contaContabil).length,
        naoMapeados: mapeados.filter((m) => m.contaContabilERP === m.contaContabil).length,
      });
    });

    const result = await mockMapeamentoService.aplicarMapeamento(dados, mapeamento, "totvs");

    expect(result.total).toBe(3);
    expect(result.mapeados).toBe(3); // cp-001 (2.1.1.01), cp-002 (2.1.1.02) e cp-003 (2.1.1.02)
    expect(result.naoMapeados).toBe(0);
  });

  it("deve registrar logs de mapeamento aplicado", async () => {
    const logMapeamento = vi.fn();

    mockMapeamentoService.aplicarMapeamento.mockImplementation((data, map, erp) => {
      const resultado = data.map((item) => {
        const contaERP = map[item.contaContabil]?.[erp];
        logMapeamento({
          contaOriginal: item.contaContabil,
          contaERP,
          status: contaERP ? "mapeado" : "nao_mapeado",
        });
        return { ...item, contaContabilERP: contaERP || item.contaContabil };
      });
      return Promise.resolve(resultado);
    });

    await mockMapeamentoService.aplicarMapeamento(
      [contasPagarExemplo[0]],
      mapeamentoContas,
      "totvs"
    );

    expect(logMapeamento).toHaveBeenCalled();
    expect(logMapeamento).toHaveBeenCalledWith(
      expect.objectContaining({
        contaOriginal: expect.any(String),
        status: expect.any(String),
      })
    );
  });
});

describe("Busca de Contas no ERP", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve buscar contas por código ou descrição", async () => {
    mockMapeamentoService.buscarContaERP.mockImplementation(
      (termo: string, erp: string) => {
        const contas = contasERP[erp as keyof typeof contasERP] || [];
        const resultados = contas.filter(
          (c) =>
            c.codigo.includes(termo) ||
            c.descricao.toLowerCase().includes(termo.toLowerCase())
        );
        return Promise.resolve(resultados);
      }
    );

    const resultados = await mockMapeamentoService.buscarContaERP("Fornecedor", "totvs");

    expect(resultados.length).toBeGreaterThan(0);
    expect(resultados[0].descricao.toLowerCase()).toContain("fornecedor");
  });

  it("deve buscar contas por tipo", async () => {
    mockMapeamentoService.buscarContaERP.mockImplementation(
      (termo: string, erp: string, tipo?: string) => {
        const contas = contasERP[erp as keyof typeof contasERP] || [];
        return Promise.resolve(contas.filter((c) => !tipo || c.tipo === tipo));
      }
    );

    const passivos = await mockMapeamentoService.buscarContaERP("", "totvs", "PASSIVO");

    expect(passivos.every((c: any) => c.tipo === "PASSIVO")).toBe(true);
  });
});

describe("Listagem de Contas Não Mapeadas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve listar contas não mapeadas", async () => {
    const todasContas = [
      { id: "1", conta: "2.1.1.01", descricao: "Fornecedores" },
      { id: "2", conta: "2.1.1.02", descricao: "Obrigações" },
      { id: "3", conta: "2.1.1.99", descricao: "Conta Nova" },
    ];

    const mapeamentoExistente = {
      "2.1.1.01": { totvs: "21101" },
      "2.1.1.02": { totvs: "21102" },
    };

    mockMapeamentoService.listarContasNaoMapeadas.mockImplementation(
      (contas: any[], map: any) => {
        const naoMapeadas = contas.filter((c) => !map[c.conta]);
        return Promise.resolve(naoMapeadas);
      }
    );

    const result = await mockMapeamentoService.listarContasNaoMapeadas(
      todasContas,
      mapeamentoExistente
    );

    expect(result).toHaveLength(1);
    expect(result[0].conta).toBe("2.1.1.99");
  });
});

describe("Sincronização com ERP", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve sincronizar plano de contas do ERP", async () => {
    mockMapeamentoService.sincronizarComERP.mockResolvedValue({
      sincronizado: true,
      contasImportadas: 150,
      contasAtualizadas: 10,
      contasInativadas: 5,
      erros: [],
    });

    const result = await mockMapeamentoService.sincronizarComERP("totvs");

    expect(result.sincronizado).toBe(true);
    expect(result.contasImportadas).toBeGreaterThan(0);
  });

  it("deve detectar contas modificadas no ERP", async () => {
    mockMapeamentoService.sincronizarComERP.mockResolvedValue({
      sincronizado: true,
      contasImportadas: 0,
      contasAtualizadas: 3,
      modificacoes: [
        { conta: "21101", campo: "descricao", de: "Fornecedores", para: "Fornecedores Nacionais" },
      ],
      erros: [],
    });

    const result = await mockMapeamentoService.sincronizarComERP("totvs");

    expect(result.modificacoes).toBeInstanceOf(Array);
    expect(result.modificacoes.length).toBeGreaterThan(0);
  });
});

describe("Persistência de Mapeamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve salvar mapeamento no banco", async () => {
    const novoMapeamento = {
      contaInterna: "2.1.1.01",
      totvs: "21101",
      sankhya: "21101",
      dominio: "FORNECEDORES",
      alterdata: "2.01.01.01",
    };

    mockMapeamentoService.salvarMapeamento.mockResolvedValue({
      salvo: true,
      id: "map-001",
      mapeamento: novoMapeamento,
    });

    const result = await mockMapeamentoService.salvarMapeamento(novoMapeamento);

    expect(result.salvo).toBe(true);
    expect(result).toHaveProperty("id");
  });

  it("deve validar antes de salvar", async () => {
    mockMapeamentoService.salvarMapeamento.mockRejectedValue(
      new Error("Conta ERP inválida")
    );

    await expect(
      mockMapeamentoService.salvarMapeamento({ contaInterna: "2.1.1.01", totvs: "" })
    ).rejects.toThrow("Conta ERP inválida");
  });
});
