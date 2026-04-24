import { useAuth } from "@/contexts/AuthContext";
import { useTableQuery } from "@/hooks/useSupabaseQuery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, Target, PiggyBank, BarChart3, ArrowUpRight, ArrowDownRight, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { COLORS, addHeader } from "@/lib/pdfContasExport";

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

export default function ROI() {
  const { user } = useAuth();
  const { data: contasReceber = [] } = useTableQuery("contas_receber");
  const { data: contasPagar = [] } = useTableQuery("contas_pagar");
  const { data: lancamentos = [] } = useTableQuery("lancamentos_caixa");
  const { toast } = useToast();
  const { data: fechamentos = [] } = useTableQuery("fechamentos_mensais");

  const [anoSelecionado, setAnoSelecionado] = useState(2026);

  const stats = useMemo(() => {
    // Receitas realizadas (recebidas)
    const receitasRealizadas = (contasReceber as any[])
      .filter((c: any) => c.status === "recebido" || c.status === "pago")
      .reduce((sum: number, c: any) => sum + Number(c.valor || 0), 0);

    // Despesas realizadas (pagas)
    const despesasRealizadas = (contasPagar as any[])
      .filter((c: any) => c.status === "pago")
      .reduce((sum: number, c: any) => sum + Number(c.valor || 0), 0);

    // Total investido = todas despesas pagas (investimento total na operação)
    const investimentoTotal = despesasRealizadas;

    // Lucro líquido
    const lucroLiquido = receitasRealizadas - despesasRealizadas;

    // ROI = (Lucro / Investimento) * 100
    const roi = investimentoTotal > 0 ? (lucroLiquido / investimentoTotal) * 100 : 0;

    // Receitas pendentes
    const receitasPendentes = (contasReceber as any[])
      .filter((c: any) => c.status === "pendente")
      .reduce((sum: number, c: any) => sum + Number(c.valor || 0), 0);

    // Despesas pendentes
    const despesasPendentes = (contasPagar as any[])
      .filter((c: any) => c.status === "pendente")
      .reduce((sum: number, c: any) => sum + Number(c.valor || 0), 0);

    // ROI projetado (incluindo pendentes)
    const receitaProjetada = receitasRealizadas + receitasPendentes;
    const despesaProjetada = despesasRealizadas + despesasPendentes;
    const lucroProjetado = receitaProjetada - despesaProjetada;
    const roiProjetado = despesaProjetada > 0 ? (lucroProjetado / despesaProjetada) * 100 : 0;

    // Margem de lucro
    const margemLucro = receitasRealizadas > 0 ? (lucroLiquido / receitasRealizadas) * 100 : 0;

    // Payback (meses para recuperar investimento) baseado na média mensal de lucro
    const mesesComReceita = new Set(
      (contasReceber as any[])
        .filter((c: any) => (c.status === "recebido" || c.status === "pago") && c.data_recebimento)
        .map((c: any) => c.data_recebimento?.substring(0, 7))
    ).size || 1;
    const lucroMedioMensal = lucroLiquido / mesesComReceita;
    const paybackMeses = lucroMedioMensal > 0 ? investimentoTotal / lucroMedioMensal : 0;

    return {
      receitasRealizadas,
      despesasRealizadas,
      investimentoTotal,
      lucroLiquido,
      roi,
      receitasPendentes,
      despesasPendentes,
      roiProjetado,
      margemLucro,
      paybackMeses,
      lucroProjetado,
      lucroMedioMensal,
    };
  }, [contasReceber, contasPagar]);

  // ROI mensal
  const roiMensal = useMemo(() => {
    return MESES.map((mes, idx) => {
      const mesNum = idx + 1;
      const mesStr = `${anoSelecionado}-${String(mesNum).padStart(2, "0")}`;

      const recMes = (contasReceber as any[])
        .filter((c: any) => (c.status === "recebido" || c.status === "pago") && c.data_recebimento?.startsWith(mesStr))
        .reduce((s: number, c: any) => s + Number(c.valor || 0), 0);

      const despMes = (contasPagar as any[])
        .filter((c: any) => c.status === "pago" && c.data_pagamento?.startsWith(mesStr))
        .reduce((s: number, c: any) => s + Number(c.valor || 0), 0);

      const lucro = recMes - despMes;
      const roi = despMes > 0 ? (lucro / despMes) * 100 : 0;

      return { mes, receita: recMes, despesa: despMes, lucro, roi };
    });
  }, [contasReceber, contasPagar, anoSelecionado]);

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const fmtPct = (v: number) => `${v.toFixed(1)}%`;

  const exportPDF = async () => {
    // Fetch empresa data
    let empresa: any = null;
    if (user) {
      const { data } = await (supabase.from("empresa") as any)
        .select("*").eq("user_id", user.id).maybeSingle();
      empresa = data;
    }

    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    let y = addHeader(doc, "Relatório de ROI — Retorno sobre Investimento", empresa);

    // Title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.primary);
    doc.text("Relatório de ROI — Retorno sobre Investimento", pw / 2, y, { align: "center" });
    y += 4;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.mutedText);
    doc.text(`Ano: ${anoSelecionado} | Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, pw / 2, y, { align: "center" });
    y += 10;

    // KPI Section
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.primary);
    doc.text("Indicadores Principais", 14, y);
    y += 6;

    const kpiRows = [
      ["ROI Realizado", fmtPct(stats.roi)],
      ["ROI Projetado", fmtPct(stats.roiProjetado)],
      ["Lucro Líquido", fmt(stats.lucroLiquido)],
      ["Margem de Lucro", fmtPct(stats.margemLucro)],
      ["Receitas Realizadas", fmt(stats.receitasRealizadas)],
      ["Receitas Pendentes", fmt(stats.receitasPendentes)],
      ["Investimento Total (Despesas)", fmt(stats.investimentoTotal)],
      ["Despesas Pendentes", fmt(stats.despesasPendentes)],
      ["Payback Estimado", stats.paybackMeses > 0 ? `${stats.paybackMeses.toFixed(1)} meses` : "N/A"],
      ["Lucro Médio Mensal", fmt(stats.lucroMedioMensal)],
    ];

    autoTable(doc, {
      startY: y,
      head: [["Indicador", "Valor"]],
      body: kpiRows,
      theme: "grid",
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: COLORS.text },
      alternateRowStyles: { fillColor: COLORS.kpiBg },
      columnStyles: { 0: { cellWidth: 100 }, 1: { halign: "right", fontStyle: "bold" } },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 12;

    // Monthly ROI Table
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.primary);
    doc.text("ROI Mensal", 14, y);
    y += 6;

    const monthRows = roiMensal.map((r) => [
      r.mes,
      fmt(r.receita),
      fmt(r.despesa),
      fmt(r.lucro),
      r.despesa > 0 ? fmtPct(r.roi) : "—",
    ]);
    monthRows.push([
      "TOTAL",
      fmt(roiMensal.reduce((s, r) => s + r.receita, 0)),
      fmt(roiMensal.reduce((s, r) => s + r.despesa, 0)),
      fmt(roiMensal.reduce((s, r) => s + r.lucro, 0)),
      fmtPct(stats.roi),
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Mês", "Receita", "Despesa", "Lucro", "ROI"]],
      body: monthRows,
      theme: "grid",
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 8.5, textColor: COLORS.text },
      alternateRowStyles: { fillColor: COLORS.kpiBg },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right", fontStyle: "bold" },
      },
      margin: { left: 14, right: 14 },
      didParseCell: (data: any) => {
        if (data.section === "body" && data.row.index === monthRows.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = COLORS.primary;
          data.cell.styles.textColor = COLORS.white;
        }
      },
    });

    // Footer
    const ph = doc.internal.pageSize.getHeight();
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, ph - 10, pw, 10, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.white);
    doc.text("9Nine Business Control — Relatório de ROI", pw / 2, ph - 4, { align: "center" });

    doc.save(`ROI_${anoSelecionado}.pdf`);
    toast({ title: "Relatório PDF exportado com sucesso!" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            ROI — Retorno sobre Investimento
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Análise automatizada do retorno financeiro da sua empresa
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportPDF} className="gap-2">
            <FileText className="h-4 w-4" />
            Exportar PDF
          </Button>
          <Select value={String(anoSelecionado)} onValueChange={(v) => setAnoSelecionado(Number(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2027">2027</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ROI Realizado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.roi >= 0 ? "text-emerald-600" : "text-destructive"}`}>
              {fmtPct(stats.roi)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Baseado em receitas e despesas efetivadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ROI Projetado</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.roiProjetado >= 0 ? "text-blue-600" : "text-destructive"}`}>
              {fmtPct(stats.roiProjetado)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Inclui receitas e despesas pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lucro Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.lucroLiquido >= 0 ? "text-emerald-600" : "text-destructive"}`}>
              {fmt(stats.lucroLiquido)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Receitas - Despesas realizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Margem de Lucro</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.margemLucro >= 0 ? "text-emerald-600" : "text-destructive"}`}>
              {fmtPct(stats.margemLucro)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Lucro / Receita total</p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              Receitas Realizadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-emerald-600">{fmt(stats.receitasRealizadas)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Pendentes: {fmt(stats.receitasPendentes)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-destructive" />
              Investimento Total (Despesas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-destructive">{fmt(stats.investimentoTotal)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Pendentes: {fmt(stats.despesasPendentes)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-blue-500" />
              Payback Estimado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-foreground">
              {stats.paybackMeses > 0 ? `${stats.paybackMeses.toFixed(1)} meses` : "N/A"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Lucro médio mensal: {fmt(stats.lucroMedioMensal)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly ROI Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ROI Mensal — {anoSelecionado}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Mês</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Receita</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Despesa</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Lucro</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">ROI</th>
                </tr>
              </thead>
              <tbody>
                {roiMensal.map((row) => (
                  <tr key={row.mes} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-3 font-medium">{row.mes}</td>
                    <td className="py-2 px-3 text-right text-emerald-600">{fmt(row.receita)}</td>
                    <td className="py-2 px-3 text-right text-destructive">{fmt(row.despesa)}</td>
                    <td className={`py-2 px-3 text-right font-medium ${row.lucro >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                      {fmt(row.lucro)}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {row.despesa > 0 ? (
                        <Badge variant={row.roi >= 0 ? "default" : "destructive"} className="text-xs">
                          {fmtPct(row.roi)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border font-bold">
                  <td className="py-2 px-3">Total</td>
                  <td className="py-2 px-3 text-right text-emerald-600">
                    {fmt(roiMensal.reduce((s, r) => s + r.receita, 0))}
                  </td>
                  <td className="py-2 px-3 text-right text-destructive">
                    {fmt(roiMensal.reduce((s, r) => s + r.despesa, 0))}
                  </td>
                  <td className={`py-2 px-3 text-right ${roiMensal.reduce((s, r) => s + r.lucro, 0) >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                    {fmt(roiMensal.reduce((s, r) => s + r.lucro, 0))}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <Badge variant={stats.roi >= 0 ? "default" : "destructive"}>
                      {fmtPct(stats.roi)}
                    </Badge>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold text-sm mb-2">Como o ROI é calculado?</h3>
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>ROI = (Lucro Líquido ÷ Investimento Total) × 100</strong></p>
            <p>• <strong>Receitas Realizadas:</strong> Todas as contas a receber com status "recebido".</p>
            <p>• <strong>Investimento Total:</strong> Todas as contas a pagar com status "pago".</p>
            <p>• <strong>Lucro Líquido:</strong> Receitas realizadas menos o investimento total.</p>
            <p>• <strong>ROI Projetado:</strong> Inclui também receitas e despesas pendentes.</p>
            <p>• <strong>Payback:</strong> Tempo estimado para recuperar o investimento, baseado no lucro médio mensal.</p>
            <p>• <strong>Margem de Lucro:</strong> Percentual do lucro em relação à receita total.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
