/**
 * Utilitários para Plano de Contas
 */

import { PlanoConta, ArvorePlanoConta } from "./types";

/**
 * Converte lista plana de contas em estrutura hierárquica (árvore)
 */
export function construirArvorePlanoContas(contas: PlanoConta[]): ArvorePlanoConta[] {
  const map = new Map<string, ArvorePlanoConta & { children: ArvorePlanoConta[] }>(
    contas.map(c => [c.id, { ...c, children: [] }])
  );

  const raiz: ArvorePlanoConta[] = [];

  contas.forEach(conta => {
    const node = map.get(conta.id)!;
    if (conta.codigo_pai) {
      const pai = contas.find(c => c.codigo_conta === conta.codigo_pai);
      if (pai) {
        const parentNode = map.get(pai.id);
        if (parentNode) {
          parentNode.children.push(node);
        }
      }
    } else {
      raiz.push(node);
    }
  });

  return raiz;
}

/**
 * Busca contas por termo em código ou descrição
 */
export function buscarContas(
  contas: PlanoConta[],
  termo: string,
  opcoes?: {
    natureza?: PlanoConta["natureza"];
    tipo?: PlanoConta["tipo_conta"];
    apenasAtivas?: boolean;
  }
): PlanoConta[] {
  const termoLower = termo.toLowerCase();

  return contas.filter(c => {
    const matchTermo =
      c.codigo_conta.toLowerCase().includes(termoLower) ||
      c.descricao.toLowerCase().includes(termoLower);

    const matchNatureza = !opcoes?.natureza || c.natureza === opcoes.natureza;
    const matchTipo = !opcoes?.tipo || c.tipo_conta === opcoes.tipo;
    const matchAtivo = !opcoes?.apenasAtivas || c.ativo;

    return matchTermo && matchNatureza && matchTipo && matchAtivo;
  });
}

/**
 * Valida estrutura hierárquica do plano de contas
 */
export function validarEstruturaPlanoContas(contas: PlanoConta[]): {
  valido: boolean;
  erros: string[];
} {
  const erros: string[] = [];
  const codigos = new Set(contas.map(c => c.codigo_conta));

  // Verificar duplicidades
  const duplicados = contas.filter((c, i, a) => a.findIndex(x => x.codigo_conta === c.codigo_conta) !== i);
  if (duplicados.length > 0) {
    erros.push(`Códigos duplicados encontrados: ${duplicados.map(d => d.codigo_conta).join(", ")}`);
  }

  // Verificar pai existe
  contas.forEach(c => {
    if (c.codigo_pai && !codigos.has(c.codigo_pai)) {
      erros.push(`Conta ${c.codigo_conta} (${c.descricao}) referencia pai inexistente: ${c.codigo_pai}`);
    }
  });

  // Verificar nível máximo
  const nivelMaximo = Math.max(...contas.map(c => c.nivel));
  if (nivelMaximo > 4) {
    erros.push(`Níveis hierárquicos excedem o limite (máximo 4, encontrado ${nivelMaximo})`);
  }

  // Verificar contas sintéticas não permitem lançamentos
  contas.forEach(c => {
    if (c.tipo_conta === "sintetica" && c.permite_lancamento) {
      erros.push(`Conta sintética ${c.codigo_conta} não deve permitir lançamentos`);
    }
  });

  return {
    valido: erros.length === 0,
    erros,
  };
}

/**
 * Ordena plano de contas por código (ordem natural de árvore)
 */
export function ordenarPlanoContas(contas: PlanoConta[]): PlanoConta[] {
  return [...contas].sort((a, b) => a.codigo_conta.localeCompare(b.codigo_conta));
}

/**
 * Formata valor monetário para exibição
 */
export function formatarValorPlanoContas(valor: number, natureza: PlanoConta["natureza"]): string {
  const sinal = natureza === "despesa" || natureza === "passiva" ? "-" : "";
  return `${sinal}${valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`;
}

/**
 * Calcula saldo de uma conta baseado nos lançamentos
 * Nota: Requer implementação de lógica de lançamentos contábeis
 */
export interface LancamentoContabil {
  conta_id: string;
  valor: number;
  tipo: "debito" | "credito";
  data: string;
}

export function calcularSaldoConta(
  conta: PlanoConta,
  lancamentos: LancamentoContabil[]
): number {
  const lancamentosConta = lancamentos.filter(l => l.conta_id === conta.id);

  const totalDebitos = lancamentosConta
    .filter(l => l.tipo === "debito")
    .reduce((sum, l) => sum + l.valor, 0);

  const totalCreditos = lancamentosConta
    .filter(l => l.tipo === "credito")
    .reduce((sum, l) => sum + l.valor, 0);

  // Natureza define aumento/diminuição
  if (conta.natureza === "ativa" || conta.natureza === "despesa") {
    // Débito aumenta, crédito diminui
    return totalDebitos - totalCreditos;
  } else {
    // Crédito aumenta, débito diminui
    return totalCreditos - totalDebitos;
  }
}

/**
 * Sugere conta contábil baseada em histórico de lançamentos
 */
export function sugerirContaPorHistorico(
  descricaoLancamento: string,
  historicoMapeamentos: { descricao: string; conta_id: string; relevancia: number }[]
): { conta_id: string; confianca: number } | null {
  const palavras = descricaoLancamento.toLowerCase().split(/\s+/);

  const scores = historicoMapeamentos.map(h => {
    const palavrasHistorico = h.descricao.toLowerCase().split(/\s+/);
    const matches = palavras.filter(p => palavrasHistorico.includes(p)).length;
    const score = (matches / Math.max(palavras.length, palavrasHistorico.length)) * h.relevancia;
    return { conta_id: h.conta_id, score };
  });

  const melhor = scores.sort((a, b) => b.score - a.score)[0];

  if (!melhor || melhor.score < 0.3) {
    return null;
  }

  return {
    conta_id: melhor.conta_id,
    confianca: Math.round(melhor.score * 100),
  };
}

/**
 * Exporta plano de contas para formato contábil (CSV/Excel)
 */
export function exportarPlanoContas(contas: PlanoConta[]): {
  codigo: string;
  descricao: string;
  natureza: string;
  tipo: string;
  nivel: number;
  ativo: string;
}[] {
  return contas.map(c => ({
    codigo: c.codigo_conta,
    descricao: c.descricao,
    natureza: c.natureza,
    tipo: c.tipo_conta,
    nivel: c.nivel,
    ativo: c.ativo ? "S" : "N",
  }));
}

/**
 * Gera relatório sintético/analítico do plano de contas
 */
export interface RelatorioPlanoContas {
  titulo: string;
  dataGeracao: string;
  totalContas: number;
  contasPorNatureza: Record<string, number>;
  contasPorTipo: Record<string, number>;
  estrutura: ArvorePlanoConta[];
}

export function gerarRelatorioPlanoContas(
  contas: PlanoConta[],
  titulo: string = "Plano de Contas"
): RelatorioPlanoContas {
  const contasPorNatureza = contas.reduce((acc, c) => {
    acc[c.natureza] = (acc[c.natureza] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const contasPorTipo = contas.reduce((acc, c) => {
    acc[c.tipo_conta] = (acc[c.tipo_conta] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    titulo,
    dataGeracao: new Date().toISOString(),
    totalContas: contas.length,
    contasPorNatureza,
    contasPorTipo,
    estrutura: construirArvorePlanoContas(contas),
  };
}
