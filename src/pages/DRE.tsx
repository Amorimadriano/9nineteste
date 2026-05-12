import { useMemo, useState } from "react";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { useTableQuery } from "@/hooks/useSupabaseQuery";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, BarChart3, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { exportDREPDF } from "@/lib/pdfContasExport";

const fmt = (v: number) =>
  v === 0 ? "-" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const avPct = (v: number, base: number) =>
  base === 0 ? "0%" : ((v / base) * 100).toFixed(1) + "%";
const MESES_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MESES_FULL = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// DRE group structure matching the spreadsheet template
// Maps category prefixes to DRE groups
type DREGroup = {
  id: string;
  label: string;
  type: "header" | "item" | "subtotal" | "percentual";
  sign?: "+" | "-" | "=";
  indent?: boolean;
  bold?: boolean;
  prefixes?: string[]; // category name prefixes that match this group
  calcFn?: string; // calculation reference
};

const DRE_STRUCTURE: DREGroup[] = [
  { id: "receita_bruta", label: "(+) Receita Bruta", type: "subtotal", sign: "+", bold: true, calcFn: "sum_receita_bruta" },
  { id: "receita_servicos", label: "1 - Receita Com Serviços", type: "item", indent: true, prefixes: ["1.1"] },
  { id: "receitas_nao_op", label: "9 - Receitas não Operacionais", type: "item", indent: true, prefixes: ["1.2", "1.3", "1.4", "1.5"] },

  { id: "deducoes_header", label: "(-) Deduções Sobre Vendas", type: "subtotal", sign: "-", bold: true, calcFn: "sum_deducoes" },
  { id: "impostos_vendas", label: "2 - Impostos Sobre Vendas", type: "item", indent: true, prefixes: ["2.1"] },
  { id: "outras_deducoes", label: "3 - Outras Deduções", type: "item", indent: true, prefixes: ["2.2"] },

  { id: "receita_liquida", label: "(=) Receita Líquida", type: "subtotal", sign: "=", bold: true, calcFn: "receita_liquida" },

  { id: "custos_variaveis_header", label: "(-) Custos Variáveis", type: "subtotal", sign: "-", bold: true, calcFn: "sum_custos_variaveis" },
  { id: "custos_variaveis", label: "4 - Custos Variáveis", type: "item", indent: true, prefixes: ["2.4", "2.5"] },

  { id: "margem_contribuicao", label: "(=) Margem de Contribuição", type: "subtotal", sign: "=", bold: true, calcFn: "margem_contribuicao" },
  { id: "pct_margem_contribuicao", label: "(=) % Margem de Contribuição", type: "percentual", calcFn: "pct_margem_contribuicao" },

  { id: "custos_fixos_header", label: "(-) Custos Fixos", type: "subtotal", sign: "-", bold: true, calcFn: "sum_custos_fixos" },
  { id: "gastos_pessoal", label: "5 - Gastos com Pessoal", type: "item", indent: true, prefixes: ["2.3"] },
  { id: "gastos_ocupacao", label: "6 - Gastos com Ocupação", type: "item", indent: true, prefixes: ["3.3"] },
  { id: "gastos_terceiros", label: "7 - Gastos com Serviços de Terceiros", type: "item", indent: true, prefixes: ["3.30", "3.31", "3.32"] },
  { id: "gastos_marketing", label: "8 - Gastos com Marketing", type: "item", indent: true, prefixes: ["3.1"] },
  { id: "material_escritorio", label: "15 - Material de Escritório", type: "item", indent: true, prefixes: ["3.311"] },

  { id: "resultado_operacional", label: "(=) Resultado Operacional", type: "subtotal", sign: "=", bold: true, calcFn: "resultado_operacional" },

  { id: "resultado_nao_op_header", label: "Resultado Não Operacional", type: "subtotal", bold: true, calcFn: "sum_resultado_nao_op" },
  { id: "gastos_nao_op", label: "10 - Gastos não Operacionais", type: "item", indent: true, prefixes: ["3.4", "3.5", "4.", "5."] },

  { id: "lair", label: "(=) Lucro Antes do Imposto de Renda (LAIR)", type: "subtotal", sign: "=", bold: true, calcFn: "lair" },

  { id: "ir_csll_header", label: "(-) Imposto de Renda e CSLL", type: "subtotal", sign: "-", bold: true, calcFn: "sum_ir_csll" },
  { id: "ir_csll", label: "11 - Imposto de Renda e CSLL", type: "item", indent: true, prefixes: ["2.107", "2.108"] },

  { id: "lucro_liquido", label: "(=) Lucro Líquido", type: "subtotal", sign: "=", bold: true, calcFn: "lucro_liquido" },
  { id: "pct_margem_liquida", label: "(=) % Margem Líquida", type: "percentual", calcFn: "pct_margem_liquida" },
];

function matchCategory(catName: string, prefixes: string[]): boolean {
  const normalized = catName.toLowerCase().trim();
  return prefixes.some((p) => normalized.startsWith(p.toLowerCase()));
}

type MonthlyValues = number[];

function buildDREData(lancamentos: any[], categorias: any[]) {
  // Accumulate values per category per month
  const catMonthly: Record<string, MonthlyValues> = {};

  categorias.forEach((c: any) => {
    catMonthly[c.id] = new Array(12).fill(0);
  });

  lancamentos.forEach((l: any) => {
    if (!l.data_lancamento || !l.categoria_id) return;
    const month = new Date(l.data_lancamento + "T00:00:00").getMonth();
    if (!catMonthly[l.categoria_id]) catMonthly[l.categoria_id] = new Array(12).fill(0);
    catMonthly[l.categoria_id][month] += Number(l.valor);
  });

  // Map categories to DRE items
  const dreValues: Record<string, MonthlyValues> = {};

  // Initialize all items with zeros
  DRE_STRUCTURE.forEach((g) => {
    dreValues[g.id] = new Array(12).fill(0);
  });

  // Assign categories to DRE items based on prefixes
  const itemGroups = DRE_STRUCTURE.filter((g) => g.type === "item" && g.prefixes);

  categorias.forEach((cat: any) => {
    const matched = itemGroups.find((g) => matchCategory(cat.nome, g.prefixes!));
    if (matched) {
      for (let m = 0; m < 12; m++) {
        dreValues[matched.id][m] += catMonthly[cat.id]?.[m] || 0;
      }
    }
  });

  // Special handling for "material_escritorio" — it has a more specific prefix
  // so it needs to be subtracted from "gastos_terceiros" if double-counted
  // Actually, "3.311" starts with "3.31" so it would match gastos_terceiros first
  // Let's fix the matching order: more specific prefixes should match first
  // Re-do matching with priority to more specific prefixes
  dreValues.forEach = undefined as any; // reset
  itemGroups.forEach((g) => {
    dreValues[g.id] = new Array(12).fill(0);
  });

  // Sort items by prefix specificity (longer prefixes first)
  const sortedItems = [...itemGroups].sort((a, b) => {
    const maxA = Math.max(...(a.prefixes?.map((p) => p.length) || [0]));
    const maxB = Math.max(...(b.prefixes?.map((p) => p.length) || [0]));
    return maxB - maxA;
  });

  const assignedCats = new Set<string>();

  sortedItems.forEach((group) => {
    categorias.forEach((cat: any) => {
      if (assignedCats.has(cat.id)) return;
      if (matchCategory(cat.nome, group.prefixes!)) {
        assignedCats.add(cat.id);
        for (let m = 0; m < 12; m++) {
          dreValues[group.id][m] += catMonthly[cat.id]?.[m] || 0;
        }
      }
    });
  });

  // Calculate subtotals
  const sumMonths = (...ids: string[]): MonthlyValues =>
    new Array(12).fill(0).map((_, m) => ids.reduce((s, id) => s + (dreValues[id]?.[m] || 0), 0));

  // Receita Bruta = Receita Serviços + Receitas Não Operacionais
  dreValues["receita_bruta"] = sumMonths("receita_servicos", "receitas_nao_op");

  // Deduções
  dreValues["deducoes_header"] = sumMonths("impostos_vendas", "outras_deducoes");

  // Receita Líquida = Receita Bruta - Deduções
  dreValues["receita_liquida"] = new Array(12).fill(0).map((_, m) =>
    dreValues["receita_bruta"][m] - dreValues["deducoes_header"][m]
  );

  // Custos Variáveis
  dreValues["custos_variaveis_header"] = sumMonths("custos_variaveis");

  // Margem de Contribuição = Receita Líquida - Custos Variáveis
  dreValues["margem_contribuicao"] = new Array(12).fill(0).map((_, m) =>
    dreValues["receita_liquida"][m] - dreValues["custos_variaveis_header"][m]
  );

  // Custos Fixos
  dreValues["custos_fixos_header"] = sumMonths("gastos_pessoal", "gastos_ocupacao", "gastos_terceiros", "gastos_marketing", "material_escritorio");

  // Resultado Operacional = Margem Contribuição - Custos Fixos
  dreValues["resultado_operacional"] = new Array(12).fill(0).map((_, m) =>
    dreValues["margem_contribuicao"][m] - dreValues["custos_fixos_header"][m]
  );

  // Resultado Não Operacional
  dreValues["resultado_nao_op_header"] = sumMonths("gastos_nao_op");

  // LAIR = Resultado Operacional - Gastos Não Operacionais
  dreValues["lair"] = new Array(12).fill(0).map((_, m) =>
    dreValues["resultado_operacional"][m] - dreValues["resultado_nao_op_header"][m]
  );

  // IR e CSLL
  dreValues["ir_csll_header"] = sumMonths("ir_csll");

  // Lucro Líquido = LAIR - IR/CSLL
  dreValues["lucro_liquido"] = new Array(12).fill(0).map((_, m) =>
    dreValues["lair"][m] - dreValues["ir_csll_header"][m]
  );

  return dreValues;
}

function VariationBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return <span className="text-muted-foreground text-xs">—</span>;
  if (previous === 0) return <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/30">Novo</Badge>;
  const variation = ((current - previous) / Math.abs(previous)) * 100;
  const abs = Math.abs(variation);
  if (abs < 0.1) return <Minus className="h-3.5 w-3.5 text-muted-foreground inline" />;
  const isPositive = variation > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${isPositive ? "text-accent" : "text-destructive"}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? "+" : ""}{variation.toFixed(1)}%
    </span>
  );
}

export default function DRE() {
  const { data: lancamentos = [], isLoading } = useTableQuery("lancamentos_caixa");
  const { data: categorias = [] } = useTableQuery("categorias");
  const { user } = useAuth();
  const { data: empresaInfo } = useQuery({
    queryKey: ["empresa", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("empresa").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const [viewMode, setViewMode] = useState<"anual" | "comparativo">("anual");

  // All 12 months of 2026 as period options
  const allMonths = useMemo(() => {
    return MESES_FULL.map((_, i) => {
      const m = String(i + 1).padStart(2, "0");
      return `2026-${m}`;
    });
  }, []);

  const currentMonthIdx = new Date().getMonth();
  const [periodA, setPeriodA] = useState<string>(`2026-${String(currentMonthIdx + 1).padStart(2, "0")}`);
  const [periodB, setPeriodB] = useState<string>(`2026-${String(Math.max(currentMonthIdx, 1)).padStart(2, "0")}`);

  const formatPeriod = (p: string) => {
    if (!p) return "—";
    const [y, m] = p.split("-");
    return `${MESES_FULL[parseInt(m) - 1]}/${y}`;
  };

  // Annual DRE data
  const dreData = useMemo(() => buildDREData(lancamentos as any[], categorias as any[]), [lancamentos, categorias]);

  // Period-specific DRE data for horizontal analysis
  const dreDataA = useMemo(() => {
    if (!periodA) return buildDREData([], []);
    const filtered = (lancamentos as any[]).filter((l: any) => l.data_lancamento?.startsWith(periodA));
    return buildDREData(filtered, categorias as any[]);
  }, [lancamentos, categorias, periodA]);

  const dreDataB = useMemo(() => {
    if (!periodB) return buildDREData([], []);
    const filtered = (lancamentos as any[]).filter((l: any) => l.data_lancamento?.startsWith(periodB));
    return buildDREData(filtered, categorias as any[]);
  }, [lancamentos, categorias, periodB]);

  const showHorizontal = viewMode === "comparativo" && !!periodA && !!periodB && periodA !== periodB;

  if (isLoading) return <div className="text-center text-muted-foreground py-20">Carregando...</div>;

  // Row styling helpers
  const getRowClass = (g: DREGroup) => {
    if (g.id === "lucro_liquido") return "bg-primary/10 border-t-2 border-primary/40";
    if (g.id === "receita_bruta") return "bg-accent/5";
    if (g.id === "receita_liquida" || g.id === "margem_contribuicao" || g.id === "resultado_operacional" || g.id === "lair")
      return "bg-muted/30 border-t";
    if (g.id === "deducoes_header" || g.id === "custos_variaveis_header" || g.id === "custos_fixos_header" || g.id === "ir_csll_header")
      return "bg-destructive/5";
    if (g.type === "percentual") return "bg-muted/20";
    return "";
  };

  const getTextClass = (g: DREGroup) => {
    if (g.id === "lucro_liquido" || g.id === "lair") return "text-primary";
    if (g.id === "receita_bruta" || g.id === "receita_liquida") return "text-accent";
    if (g.sign === "-") return "text-destructive";
    if (g.id === "margem_contribuicao" || g.id === "resultado_operacional") return "text-foreground";
    if (g.type === "percentual") return "text-muted-foreground";
    return "text-foreground";
  };

  const getTotal = (values: MonthlyValues) => values.reduce((s, v) => s + v, 0);

  const renderAnnualTable = () => {
    const receitaBrutaTotal = getTotal(dreData["receita_bruta"]);

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[280px] sticky left-0 bg-background z-10">Descrição</TableHead>
              {MESES_SHORT.map((m) => (
                <TableHead key={m} className="text-right min-w-[90px] text-xs">{m}</TableHead>
              ))}
              <TableHead className="text-right min-w-[100px] font-bold">2026</TableHead>
              <TableHead className="text-right min-w-[60px]">AV%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {DRE_STRUCTURE.map((g) => {
              const values = dreData[g.id] || new Array(12).fill(0);
              const total = getTotal(values);
              const isPercentual = g.type === "percentual";

              let displayValues: (string | number)[];
              let displayTotal: string;
              let displayAV: string;

              if (isPercentual) {
                if (g.calcFn === "pct_margem_contribuicao") {
                  displayValues = new Array(12).fill(0).map((_, m) => {
                    const rl = dreData["receita_liquida"][m];
                    const mc = dreData["margem_contribuicao"][m];
                    return rl === 0 ? "0%" : ((mc / rl) * 100).toFixed(1) + "%";
                  });
                  const rlTotal = getTotal(dreData["receita_liquida"]);
                  const mcTotal = getTotal(dreData["margem_contribuicao"]);
                  displayTotal = rlTotal === 0 ? "0%" : ((mcTotal / rlTotal) * 100).toFixed(1) + "%";
                  displayAV = "-";
                } else {
                  // % Margem Líquida
                  displayValues = new Array(12).fill(0).map((_, m) => {
                    const rb = dreData["receita_bruta"][m];
                    const ll = dreData["lucro_liquido"][m];
                    return rb === 0 ? "0%" : ((ll / rb) * 100).toFixed(1) + "%";
                  });
                  const rbTotal = getTotal(dreData["receita_bruta"]);
                  const llTotal = getTotal(dreData["lucro_liquido"]);
                  displayTotal = rbTotal === 0 ? "0%" : ((llTotal / rbTotal) * 100).toFixed(1) + "%";
                  displayAV = "-";
                }
              } else {
                displayValues = values.map((v) => v);
                displayTotal = fmt(total);
                displayAV = avPct(Math.abs(total), receitaBrutaTotal);
              }

              return (
                <TableRow key={g.id} className={getRowClass(g)}>
                  <TableCell
                    className={`sticky left-0 bg-inherit z-10 ${g.bold ? "font-bold" : ""} ${g.indent ? "pl-8" : ""} ${getTextClass(g)} text-sm`}
                  >
                    {g.label}
                  </TableCell>
                  {displayValues.map((v, i) => (
                    <TableCell key={i} className={`text-right text-xs ${g.bold ? "font-semibold" : ""} ${getTextClass(g)}`}>
                      {isPercentual ? v : fmt(v as number)}
                    </TableCell>
                  ))}
                  <TableCell className={`text-right font-bold text-sm ${getTextClass(g)}`}>
                    {displayTotal}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {displayAV}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderComparativeTable = () => {
    const receitaBrutaA = getTotal(dreDataA["receita_bruta"]);
    const receitaBrutaB = getTotal(dreDataB["receita_bruta"]);

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[280px]">Descrição</TableHead>
              <TableHead className="text-right min-w-[120px]">{formatPeriod(periodA)}</TableHead>
              <TableHead className="text-right min-w-[60px]">AV%</TableHead>
              <TableHead className="text-right min-w-[120px]">{formatPeriod(periodB)}</TableHead>
              <TableHead className="text-right min-w-[60px]">AV%</TableHead>
              <TableHead className="text-right min-w-[100px]">Var. (R$)</TableHead>
              <TableHead className="text-right min-w-[60px]">AH%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {DRE_STRUCTURE.map((g) => {
              const valuesA = dreDataA[g.id] || new Array(12).fill(0);
              const valuesB = dreDataB[g.id] || new Array(12).fill(0);
              const totalA = getTotal(valuesA);
              const totalB = getTotal(valuesB);
              const isPercentual = g.type === "percentual";

              if (isPercentual) {
                let pctA: string, pctB: string;
                if (g.calcFn === "pct_margem_contribuicao") {
                  const rlA = getTotal(dreDataA["receita_liquida"]);
                  const mcA = getTotal(dreDataA["margem_contribuicao"]);
                  const rlB = getTotal(dreDataB["receita_liquida"]);
                  const mcB = getTotal(dreDataB["margem_contribuicao"]);
                  pctA = rlA === 0 ? "0%" : ((mcA / rlA) * 100).toFixed(1) + "%";
                  pctB = rlB === 0 ? "0%" : ((mcB / rlB) * 100).toFixed(1) + "%";
                } else {
                  const rbA = getTotal(dreDataA["receita_bruta"]);
                  const llA = getTotal(dreDataA["lucro_liquido"]);
                  const rbB = getTotal(dreDataB["receita_bruta"]);
                  const llB = getTotal(dreDataB["lucro_liquido"]);
                  pctA = rbA === 0 ? "0%" : ((llA / rbA) * 100).toFixed(1) + "%";
                  pctB = rbB === 0 ? "0%" : ((llB / rbB) * 100).toFixed(1) + "%";
                }
                return (
                  <TableRow key={g.id} className={getRowClass(g)}>
                    <TableCell className={`${g.bold ? "font-bold" : ""} ${g.indent ? "pl-8" : ""} ${getTextClass(g)} text-sm`}>
                      {g.label}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{pctA}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">-</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{pctB}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">-</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">-</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">-</TableCell>
                  </TableRow>
                );
              }

              const variation = totalA - totalB;

              return (
                <TableRow key={g.id} className={getRowClass(g)}>
                  <TableCell className={`${g.bold ? "font-bold" : ""} ${g.indent ? "pl-8" : ""} ${getTextClass(g)} text-sm`}>
                    {g.label}
                  </TableCell>
                  <TableCell className={`text-right ${g.bold ? "font-bold" : "font-medium"} text-sm ${getTextClass(g)}`}>
                    {fmt(totalA)}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {avPct(Math.abs(totalA), receitaBrutaA)}
                  </TableCell>
                  <TableCell className={`text-right ${g.bold ? "font-bold" : "font-medium"} text-sm ${getTextClass(g)}`}>
                    {fmt(totalB)}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {avPct(Math.abs(totalB), receitaBrutaB)}
                  </TableCell>
                  <TableCell className={`text-right font-medium text-sm ${variation >= 0 ? "text-accent" : "text-destructive"}`}>
                    {fmt(variation)}
                  </TableCell>
                  <TableCell className="text-right">
                    <VariationBadge current={totalA} previous={totalB} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  const handleExportPDF = () => {
    const receitaBrutaTotal = getTotal(dreData["receita_bruta"]);
    const pdfRows = DRE_STRUCTURE.map((g) => {
      const values = dreData[g.id] || new Array(12).fill(0);
      const total = getTotal(values);
      const isPercentual = g.type === "percentual";

      let displayValues: (string | number)[];
      let displayTotal: string;
      let displayAV: string;

      if (isPercentual) {
        if (g.calcFn === "pct_margem_contribuicao") {
          displayValues = new Array(12).fill(0).map((_, m) => {
            const rl = dreData["receita_liquida"][m];
            const mc = dreData["margem_contribuicao"][m];
            return rl === 0 ? "0%" : ((mc / rl) * 100).toFixed(1) + "%";
          });
          const rlTotal = getTotal(dreData["receita_liquida"]);
          const mcTotal = getTotal(dreData["margem_contribuicao"]);
          displayTotal = rlTotal === 0 ? "0%" : ((mcTotal / rlTotal) * 100).toFixed(1) + "%";
          displayAV = "-";
        } else {
          displayValues = new Array(12).fill(0).map((_, m) => {
            const rb = dreData["receita_bruta"][m];
            const ll = dreData["lucro_liquido"][m];
            return rb === 0 ? "0%" : ((ll / rb) * 100).toFixed(1) + "%";
          });
          const rbTotal = getTotal(dreData["receita_bruta"]);
          const llTotal = getTotal(dreData["lucro_liquido"]);
          displayTotal = rbTotal === 0 ? "0%" : ((llTotal / rbTotal) * 100).toFixed(1) + "%";
          displayAV = "-";
        }
      } else {
        displayValues = values.map(v => v);
        displayTotal = fmt(total);
        displayAV = avPct(Math.abs(total), receitaBrutaTotal);
      }

      return {
        label: g.label,
        bold: g.bold,
        indent: g.indent,
        type: g.type,
        values: displayValues,
        total: displayTotal,
        av: displayAV,
        sign: g.sign,
      };
    });

    exportDREPDF({ rows: pdfRows, empresa: empresaInfo, ano: 2026 });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">DRE Gerencial</h1>
          <p className="text-sm text-muted-foreground">
            Demonstrativo de Resultado do Exercício — Análise Vertical e Horizontal
          </p>
        </div>
        <Button size="sm" onClick={handleExportPDF} className="gap-2">
          <FileText className="h-4 w-4" /> Exportar PDF
        </Button>
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
        <TabsList>
          <TabsTrigger value="anual">
            <BarChart3 className="h-3.5 w-3.5 mr-1" />
            Visão Anual 2026
          </TabsTrigger>
          <TabsTrigger value="comparativo">
            <TrendingUp className="h-3.5 w-3.5 mr-1" />
            Comparativo (AH%)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="anual">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">
                Demonstrativo de Resultado — 2026
              </CardTitle>
            </CardHeader>
            <CardContent>{renderAnnualTable()}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparativo" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-display flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                Análise Horizontal — Comparação entre Períodos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Período Atual</Label>
                  <Select value={periodA} onValueChange={setPeriodA}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {allMonths.map((p) => (
                        <SelectItem key={p} value={p}>{formatPeriod(p)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Período de Comparação</Label>
                  <Select value={periodB} onValueChange={setPeriodB}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {allMonths.map((p) => (
                        <SelectItem key={p} value={p}>{formatPeriod(p)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {!showHorizontal && (
                <p className="text-xs text-muted-foreground mt-2">
                  Selecione dois períodos diferentes para ativar a análise horizontal.
                </p>
              )}
            </CardContent>
          </Card>

          {showHorizontal && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display">
                  DRE — {formatPeriod(periodA)} vs {formatPeriod(periodB)}
                </CardTitle>
              </CardHeader>
              <CardContent>{renderComparativeTable()}</CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground px-1">
        <span><strong>AV%</strong> = Análise Vertical (% sobre Receita Bruta)</span>
        {showHorizontal && (
          <>
            <span><strong>Var. (R$)</strong> = Variação absoluta entre períodos</span>
            <span><strong>AH%</strong> = Análise Horizontal (variação %)</span>
          </>
        )}
      </div>
    </div>
  );
}
