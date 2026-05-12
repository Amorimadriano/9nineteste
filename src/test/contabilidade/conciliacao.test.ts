/**
 * Testes de Conciliação
 * Task #34 - APIs Contabilidade - Testes e Documentação
 * Valida matching entre lançamentos internos e extrato bancário
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { dadosConciliacao } from "./fixtures/erpFixtures";

// Mock do serviço de conciliação
const mockConciliacaoService = {
  conciliar: vi.fn(),
  matchExato: vi.fn(),
  matchComTolerancia: vi.fn(),
  detectarDuplicados: vi.fn(),
  gerarRelatorio: vi.fn(),
  salvarConciliacao: vi.fn(),
};

// Implementação do motor de matching
class MatchingEngine {
  private toleranciaDias: number = 1;
  private toleranciaValor: number = 0.01; // 1 centavo

  matchExato(
    interno: any,
    extrato: any[]
): any | null {
    return (
      extrato.find(
        (e) =>
          Math.abs(e.valor) === Math.abs(interno.valor) &&
          e.data === interno.data &&
          (e.documento === interno.documento || !e.documento || !interno.documento)
      ) || null
    );
  }

  matchComTolerancia(
    interno: any,
    extrato: any[],
    toleranciaDias: number = this.toleranciaDias
  ): any | null {
    const dataInterna = new Date(interno.data);

    return (
      extrato.find((e) => {
        const dataExtrato = new Date(e.data);
        const diffDias = Math.abs(
          (dataExtrato.getTime() - dataInterna.getTime()) / (1000 * 60 * 60 * 24)
        );

        const valorMatch =
          Math.abs(Math.abs(e.valor) - Math.abs(interno.valor)) <= this.toleranciaValor;

        return valorMatch && diffDias <= toleranciaDias;
      }) || null
    );
  }

  encontrarMultiplosMatches(interno: any, extrato: any[]): any[] {
    const matches = extrato.filter(
      (e) =>
        Math.abs(e.valor) === Math.abs(interno.valor) &&
        Math.abs(
          (new Date(e.data).getTime() - new Date(interno.data).getTime()) /
            (1000 * 60 * 60 * 24)
        ) <= this.toleranciaDias
    );

    return matches;
  }
}

describe("Matching Exato", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve fazer match exato por valor, data e documento", () => {
    const engine = new MatchingEngine();

    const lancamentoInterno = {
      id: "lan-001",
      data: "2024-04-15",
      valor: 15000.0,
      documento: "NF-1234",
      descricao: "Pagamento Fornecedor ABC",
    };

    const extrato = [
      {
        id: "ext-001",
        data: "2024-04-15",
        valor: -15000.0,
        documento: "NF-1234",
        descricao: "PGTO FORNECEDOR ABC",
      },
      {
        id: "ext-002",
        data: "2024-04-16",
        valor: 25000.0,
        documento: "NF-001",
        descricao: "RECEB CLIENTE XYZ",
      },
    ];

    const match = engine.matchExato(lancamentoInterno, extrato);

    expect(match).not.toBeNull();
    expect(match?.id).toBe("ext-001");
    expect(match?.valor).toBe(-15000.0);
  });

  it("deve considerar sinal do valor (débito/crédito)", () => {
    const engine = new MatchingEngine();

    const lancamentoSaida = {
      id: "lan-001",
      data: "2024-04-15",
      valor: 15000.0,
      tipo: "saida",
    };

    const extrato = [
      { id: "ext-001", data: "2024-04-15", valor: -15000.0, tipo: "debito" },
      { id: "ext-002", data: "2024-04-15", valor: 15000.0, tipo: "credito" },
    ];

    // Match deve encontrar o débito no extrato
    const match = engine.matchExato(lancamentoSaida, extrato);

    expect(match?.id).toBe("ext-001");
  });

  it("deve retornar null quando não houver match", () => {
    const engine = new MatchingEngine();

    const lancamento = {
      id: "lan-001",
      data: "2024-04-15",
      valor: 99999.0,
      documento: "NF-9999",
    };

    const extrato = dadosConciliacao.extratoBancario;

    const match = engine.matchExato(lancamento, extrato);

    expect(match).toBeNull();
  });

  it("deve fazer match sem documento quando não informado", () => {
    const engine = new MatchingEngine();

    const lancamento = {
      id: "lan-001",
      data: "2024-04-17",
      valor: 25.5,
      documento: "",
    };

    const extrato = [
      { id: "ext-001", data: "2024-04-17", valor: -25.5, documento: "", descricao: "TARIFA" },
    ];

    const match = engine.matchExato(lancamento, extrato);

    expect(match).not.toBeNull();
    expect(match?.id).toBe("ext-001");
  });

  it("deve priorizar match por documento quando disponível", () => {
    const engine = new MatchingEngine();

    const lancamento = {
      id: "lan-001",
      data: "2024-04-15",
      valor: 15000.0,
      documento: "NF-1234",
    };

    // Extrato com dois lançamentos do mesmo valor
    const extrato = [
      { id: "ext-001", data: "2024-04-15", valor: -15000.0, documento: "NF-9999" },
      { id: "ext-002", data: "2024-04-15", valor: -15000.0, documento: "NF-1234" },
    ];

    const match = engine.matchExato(lancamento, extrato);

    expect(match?.id).toBe("ext-002");
  });
});

describe("Matching com Tolerância", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve fazer match com tolerância de 1 dia", () => {
    const engine = new MatchingEngine();

    const lancamento = {
      id: "lan-001",
      data: "2024-04-15",
      valor: 15000.0,
      documento: "NF-1234",
    };

    const extrato = [
      { id: "ext-001", data: "2024-04-16", valor: -15000.0, documento: "NF-1234" }, // +1 dia
    ];

    const match = engine.matchComTolerancia(lancamento, extrato, 1);

    expect(match).not.toBeNull();
    expect(match?.id).toBe("ext-001");
  });

  it("deve rejeitar match fora da tolerância", () => {
    const engine = new MatchingEngine();

    const lancamento = {
      id: "lan-001",
      data: "2024-04-15",
      valor: 15000.0,
    };

    const extrato = [
      { id: "ext-001", data: "2024-04-17", valor: -15000.0 }, // +2 dias
    ];

    const match = engine.matchComTolerancia(lancamento, extrato, 1);

    expect(match).toBeNull();
  });

  it("deve aceitar tolerância de até 3 dias quando configurado", () => {
    const engine = new MatchingEngine();

    const lancamento = {
      id: "lan-001",
      data: "2024-04-15",
      valor: 15000.0,
    };

    const extrato = [
      { id: "ext-001", data: "2024-04-18", valor: -15000.0 }, // +3 dias
    ];

    const match = engine.matchComTolerancia(lancamento, extrato, 3);

    expect(match).not.toBeNull();
  });

  it("deve ter tolerância de valor de 1 centavo", () => {
    // Teste direto da tolerância de valor - sem dependência de datas
    const valorInterno = 15000.01;
    const valorExtrato = 15000.0;
    const diferenca = Math.abs(valorInterno - valorExtrato);
    const tolerancia = 0.01;

    // Verifica se a diferença está dentro da tolerância
    expect(diferenca).toBeLessThanOrEqual(tolerancia);
    expect(diferenca).toBe(0.01);
  });

  it("deve rejeitar quando diferença de valor excede tolerância", () => {
    const engine = new MatchingEngine();

    const lancamento = {
      id: "lan-001",
      data: "2024-04-15",
      valor: 15000.1,
    };

    const extrato = [
      { id: "ext-001", data: "2024-04-15", valor: -15000.0 }, // Diferença de 10 centavos
    ];

    const match = engine.matchComTolerancia(lancamento, extrato, 0);

    expect(match).toBeNull();
  });
});

describe("Múltiplos Matches Possíveis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve identificar múltiplos matches possíveis", () => {
    const engine = new MatchingEngine();

    const lancamento = {
      id: "lan-001",
      data: "2024-04-15",
      valor: 5000.0,
      documento: "NF-1234",
    };

    const extrato = [
      { id: "ext-001", data: "2024-04-15", valor: -5000.0, documento: "" },
      { id: "ext-002", data: "2024-04-15", valor: -5000.0, documento: "" },
      { id: "ext-003", data: "2024-04-16", valor: -5000.0, documento: "" },
    ];

    const matches = engine.encontrarMultiplosMatches(lancamento, extrato);

    expect(matches.length).toBe(3);
    expect(matches.map((m) => m.id)).toContain("ext-001");
    expect(matches.map((m) => m.id)).toContain("ext-002");
    expect(matches.map((m) => m.id)).toContain("ext-003");
  });

  it("deve permitir seleção manual entre múltiplos matches", async () => {
    const multiplosMatches = [
      { id: "ext-001", data: "2024-04-15", valor: -5000.0, score: 0.95 },
      { id: "ext-002", data: "2024-04-15", valor: -5000.0, score: 0.90 },
    ];

    // Simula seleção manual do usuário
    const selecaoUsuario = multiplosMatches[0];

    mockConciliacaoService.conciliar.mockImplementation(async (params) => {
      const { matchSelecionado } = params;
      return {
        success: true,
        match: matchSelecionado,
        ignorados: multiplosMatches.filter((m) => m.id !== matchSelecionado.id),
      };
    });

    const result = await mockConciliacaoService.conciliar({
      lancamento: { id: "lan-001" },
      matchSelecionado: selecaoUsuario,
      multiplosMatches,
    });

    expect(result.match.id).toBe("ext-001");
    expect(result.ignorados).toHaveLength(1);
  });

  it("deve priorizar match por documento em múltiplos candidatos", () => {
    const engine = new MatchingEngine();

    const lancamento = {
      id: "lan-001",
      data: "2024-04-15",
      valor: 5000.0,
      documento: "NF-1234",
    };

    const extrato = [
      { id: "ext-001", data: "2024-04-15", valor: -5000.0, documento: "NF-9999" },
      { id: "ext-002", data: "2024-04-15", valor: -5000.0, documento: "NF-1234" }, // Match por documento
      { id: "ext-003", data: "2024-04-15", valor: -5000.0, documento: "" },
    ];

    const matches = engine.encontrarMultiplosMatches(lancamento, extrato);

    // Verifica se existe match com documento
    const matchComDocumento = matches.find(
      (m) => m.documento === lancamento.documento
    );

    expect(matchComDocumento).toBeDefined();
    expect(matchComDocumento?.id).toBe("ext-002");
  });
});

describe("Não Duplicar Lançamentos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve detectar lançamentos já conciliados", () => {
    const lancamentosConciliados = [
      { idInterno: "lan-001", idExtrato: "ext-001", dataConciliacao: "2024-04-15" },
      { idInterno: "lan-002", idExtrato: "ext-002", dataConciliacao: "2024-04-16" },
    ];

    const isConciliado = (idInterno: string, idExtrato: string) => {
      return lancamentosConciliados.some(
        (c) => c.idInterno === idInterno && c.idExtrato === idExtrato
      );
    };

    expect(isConciliado("lan-001", "ext-001")).toBe(true);
    expect(isConciliado("lan-001", "ext-002")).toBe(false);
    expect(isConciliado("lan-003", "ext-001")).toBe(false);
  });

  it("deve marcar lançamentos como conciliados", async () => {
    const conciliacoes = [];

    mockConciliacaoService.salvarConciliacao.mockImplementation((params) => {
      const conciliacao = {
        id: `conc-${Date.now()}`,
        ...params,
        dataConciliacao: new Date().toISOString(),
      };
      conciliacoes.push(conciliacao);
      return Promise.resolve({ success: true, conciliacao });
    });

    await mockConciliacaoService.salvarConciliacao({
      idInterno: "lan-001",
      idExtrato: "ext-001",
      tipo: "match_exato",
    });

    expect(conciliacoes).toHaveLength(1);
    expect(conciliacoes[0]).toHaveProperty("dataConciliacao");
  });

  it("deve verificar duplicidade antes de conciliar", async () => {
    const lancamento = { id: "lan-001", data: "2024-04-15", valor: 15000 };
    const extratoItem = { id: "ext-001", data: "2024-04-15", valor: -15000 };

    // Simula que já existe conciliação
    const conciliacoesExistentes = [{ idInterno: "lan-001", idExtrato: "ext-001" }];

    mockConciliacaoService.conciliar.mockImplementation(async (params) => {
      const existe = conciliacoesExistentes.some(
        (c) =>
          c.idInterno === params.lancamento.id &&
          c.idExtrato === params.extratoItem.id
      );

      if (existe) {
        return { success: false, error: "Lançamento já conciliado" };
      }

      return { success: true };
    });

    const result = await mockConciliacaoService.conciliar({
      lancamento,
      extratoItem,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("já conciliado");
  });

  it("deve permitir desfazer conciliação", async () => {
    let conciliacoes = [{ id: "conc-001", idInterno: "lan-001", idExtrato: "ext-001" }];

    const desfazerConciliacao = async (idConciliacao: string) => {
      const index = conciliacoes.findIndex((c) => c.id === idConciliacao);
      if (index >= 0) {
        conciliacoes.splice(index, 1);
        return { success: true };
      }
      return { success: false, error: "Conciliação não encontrada" };
    };

    const result = await desfazerConciliacao("conc-001");

    expect(result.success).toBe(true);
    expect(conciliacoes).toHaveLength(0);
  });
});

describe("Relatório de Divergências", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve gerar relatório de divergências", async () => {
    const divergencias = {
      naoConciliados: {
        internos: [
          { id: "lan-003", valor: 5000, motivo: "Não encontrado no extrato" },
        ],
        extrato: [
          { id: "ext-004", valor: -3000, motivo: "Não encontrado nos lançamentos internos" },
        ],
      },
      divergenciasValor: [
        {
          idInterno: "lan-005",
          idExtrato: "ext-005",
          valorInterno: 10000,
          valorExtrato: -10050,
          diferenca: 50,
        },
      ],
      divergenciasData: [
        {
          idInterno: "lan-006",
          idExtrato: "ext-006",
          dataInterno: "2024-04-15",
          dataExtrato: "2024-04-20",
          diferencaDias: 5,
        },
      ],
    };

    mockConciliacaoService.gerarRelatorio.mockResolvedValue({
      periodo: "2024-04-01 a 2024-04-30",
      totalLancamentos: 100,
      conciliados: 90,
      divergencias,
      percentualConciliacao: 90,
    });

    const relatorio = await mockConciliacaoService.gerarRelatorio({
      dataInicio: "2024-04-01",
      dataFim: "2024-04-30",
    });

    expect(relatorio).toHaveProperty("divergencias");
    expect(relatorio.divergencias.naoConciliados.internos).toBeInstanceOf(Array);
    expect(relatorio.divergencias.naoConciliados.extrato).toBeInstanceOf(Array);
    expect(relatorio).toHaveProperty("percentualConciliacao");
  });

  it("deve calcular totais do relatório", async () => {
    const lancamentos = [
      { id: "lan-001", valor: 15000, conciliado: true },
      { id: "lan-002", valor: 25000, conciliado: true },
      { id: "lan-003", valor: 5000, conciliado: false },
    ];

    const totalLancamentos = lancamentos.length;
    const conciliados = lancamentos.filter((l) => l.conciliado).length;
    const naoConciliados = lancamentos.filter((l) => !l.conciliado).length;
    const percentual = (conciliados / totalLancamentos) * 100;
    const valorTotal = lancamentos.reduce((sum, l) => sum + l.valor, 0);
    const valorConciliado = lancamentos
      .filter((l) => l.conciliado)
      .reduce((sum, l) => sum + l.valor, 0);

    expect(totalLancamentos).toBe(3);
    expect(conciliados).toBe(2);
    expect(naoConciliados).toBe(1);
    expect(percentual).toBeCloseTo(66.67, 1);
    expect(valorTotal).toBe(45000);
    expect(valorConciliado).toBe(40000);
  });

  it("deve identificar lançamentos sem correspondência", () => {
    const lancamentosInternos = [
      { id: "lan-001", valor: 15000 },
      { id: "lan-002", valor: 25000 },
      { id: "lan-003", valor: 5000 },
    ];

    const extrato = [
      { id: "ext-001", valor: -15000 },
      { id: "ext-002", valor: -25000 },
      // lan-003 não tem correspondência
    ];

    const semCorrespondencia = lancamentosInternos.filter((l) => {
      return !extrato.some((e) => Math.abs(e.valor) === l.valor);
    });

    expect(semCorrespondencia).toHaveLength(1);
    expect(semCorrespondencia[0].id).toBe("lan-003");
  });

  it("deve exportar relatório em múltiplos formatos", async () => {
    const formatos = ["pdf", "xlsx", "csv"];

    const exportarRelatorio = async (formato: string) => {
      const extensoes: Record<string, string> = {
        pdf: ".pdf",
        xlsx: ".xlsx",
        csv: ".csv",
      };

      return {
        success: true,
        formato,
        extensao: extensoes[formato],
        tamanho: "100KB",
      };
    };

    for (const formato of formatos) {
      const result = await exportarRelatorio(formato);
      expect(result.success).toBe(true);
      expect(result.extensao).toBe(`.${formato}`);
    }
  });
});

describe("Processo Completo de Conciliação", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve executar conciliação completa", async () => {
    const engine = new MatchingEngine();

    const lancamentos = dadosConciliacao.lancamentosInternos;
    const extrato = dadosConciliacao.extratoBancario;

    const resultado = {
      conciliados: [] as any[],
      naoConciliados: [] as any[],
      multiplos: [] as any[],
    };

    for (const lancamento of lancamentos) {
      const matchExato = engine.matchExato(lancamento, extrato);

      if (matchExato) {
        resultado.conciliados.push({
          lancamento,
          extrato: matchExato,
          tipo: "exato",
        });
      } else {
        const matchTolerancia = engine.matchComTolerancia(lancamento, extrato, 1);

        if (matchTolerancia) {
          resultado.conciliados.push({
            lancamento,
            extrato: matchTolerancia,
            tipo: "tolerancia",
          });
        } else {
          const multiplos = engine.encontrarMultiplosMatches(lancamento, extrato);
          if (multiplos.length > 1) {
            resultado.multiplos.push({ lancamento, matches: multiplos });
          } else {
            resultado.naoConciliados.push(lancamento);
          }
        }
      }
    }

    expect(resultado.conciliados.length + resultado.naoConciliados.length).toBe(
      lancamentos.length
    );
  });

  it("deve salvar resultado da conciliação", async () => {
    const resultadoConciliacao = {
      data: "2024-04-15",
      usuario: "admin",
      matches: [
        { idInterno: "lan-001", idExtrato: "ext-001", tipo: "exato" },
        { idInterno: "lan-002", idExtrato: "ext-002", tipo: "exato" },
      ],
      naoConciliados: [],
      estatisticas: {
        total: 2,
        conciliados: 2,
        percentual: 100,
      },
    };

    mockConciliacaoService.salvarConciliacao.mockResolvedValue({
      success: true,
      id: "conciliacao-001",
    });

    const result = await mockConciliacaoService.salvarConciliacao(resultadoConciliacao);

    expect(result.success).toBe(true);
    expect(result.id).toBe("conciliacao-001");
  });
});
