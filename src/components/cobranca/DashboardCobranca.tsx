/**
 * Dashboard de Régua de Cobrança
 * Analytics e visualização de performance de cobrança
 *
 * @agente-analytics responsável pelos indicadores e gráficos
 * @agente-uiux responsável pela visualização
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Mail,
  MessageSquare,
  Phone,
  AlertTriangle,
  Zap,
  Calendar,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { ReguaStats, ClienteScore, AcaoCobranca } from "@/hooks/useReguaCobrancaAutomatica";

interface DashboardCobrancaProps {
  stats: ReguaStats;
  clientesScore: ClienteScore[];
  acoesPendentes: AcaoCobranca[];
  acoesHoje: AcaoCobranca[];
  onExecutarTodas: () => void;
  onExecutarAcao: (acaoId: string) => void;
  isLoading: boolean;
  progresso: number;
}

const COLORS = {
  baixo: "#22c55e",
  medio: "#eab308",
  alto: "#f97316",
  critico: "#ef4444",
};

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function DashboardCobranca({
  stats,
  clientesScore,
  acoesPendentes,
  acoesHoje,
  onExecutarTodas,
  onExecutarAcao,
  isLoading,
  progresso,
}: DashboardCobrancaProps) {
  // Dados para gráficos
  const distribuicaoRisco = [
    {
      name: "Baixo Risco",
      value: clientesScore.filter((c) => c.risco === "baixo").length,
      color: COLORS.baixo,
    },
    {
      name: "Médio Risco",
      value: clientesScore.filter((c) => c.risco === "medio").length,
      color: COLORS.medio,
    },
    {
      name: "Alto Risco",
      value: clientesScore.filter((c) => c.risco === "alto").length,
      color: COLORS.alto,
    },
    {
      name: "Crítico",
      value: clientesScore.filter((c) => c.risco === "critico").length,
      color: COLORS.critico,
    },
  ];

  const efetividadeCanal = [
    { name: "E-mail", efetividade: stats.efetividade_email, enviados: 85 },
    { name: "WhatsApp", efetividade: 65, enviados: 72 },
    { name: "SMS", efetividade: 45, enviados: 60 },
    { name: "Telefone", efetividade: 90, enviados: 30 },
  ];

  const açõesPorPrioridade = [
    {
      name: "Lembrete",
      quantidade: acoesPendentes.filter((a) => a.tipo_acao === "lembrete").length,
    },
    {
      name: "Cobrança",
      quantidade: acoesPendentes.filter((a) => a.tipo_acao === "cobranca").length,
    },
    {
      name: "Urgente",
      quantidade: acoesPendentes.filter((a) => a.tipo_acao === "urgente").length,
    },
    {
      name: "Bloqueio",
      quantidade: acoesPendentes.filter((a) => a.tipo_acao === "bloqueio").length,
    },
  ];

  const clientesCriticos = clientesScore
    .filter((c) => c.risco === "critico" || c.risco === "alto")
    .sort((a, b) => a.score - b.score)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header com Ações Automáticas */}
      {acoesHoje.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-full">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-900">
                    Ações Automáticas Disponíveis
                  </h3>
                  <p className="text-blue-700">
                    {acoesHoje.length} cobranças programadas para hoje
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isLoading && (
                  <div className="w-48">
                    <Progress value={progresso} className="h-2" />
                    <p className="text-xs text-center text-blue-600 mt-1">
                      {progresso}%
                    </p>
                  </div>
                )}
                <Button
                  onClick={onExecutarTodas}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? "Executando..." : "Executar Todas"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Vencido</p>
                <p className="text-xl font-bold">{fmt(stats.valor_total_vencido)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">A Vencer</p>
                <p className="text-xl font-bold">{fmt(stats.valor_total_a_vencer)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Taxa Recuperação</p>
                <p className="text-xl font-bold">{stats.taxa_recuperacao}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Devedores</p>
                <p className="text-xl font-bold">{stats.total_devedor}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.inadimplentes_criticos > 0 && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="pt-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">
                  {stats.inadimplentes_criticos} cliente(s) crítico(s)
                </p>
                <p className="text-sm text-red-700">
                  Mais de 30 dias de atraso - requer atenção imediata
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {stats.tempo_medio_pagamento > 5 && (
          <Card className="border-amber-300 bg-amber-50">
            <CardContent className="pt-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900">
                  Tempo médio de pagamento: {stats.tempo_medio_pagamento} dias
                </p>
                <p className="text-sm text-amber-700">
                  Acima do ideal (3 dias) - avaliar processo de cobrança
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Risco */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição de Risco</CardTitle>
            <CardDescription>
              Classificação de clientes por score de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribuicaoRisco}
                    cx="40%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {distribuicaoRisco.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} clientes`, name]}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      padding: "8px 12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legenda personalizada abaixo do gráfico */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              {distribuicaoRisco.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-2 p-2 rounded-lg bg-gray-50"
                >
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium block truncate">
                      {item.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.value} {item.value === 1 ? "cliente" : "clientes"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Efetividade por Canal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Efetividade por Canal</CardTitle>
            <CardDescription>
              Taxa de resposta por canal de comunicação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={efetividadeCanal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="efetividade" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-4">
              {efetividadeCanal.map((canal) => (
                <div key={canal.name} className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {canal.efetividade}%
                  </p>
                  <p className="text-xs text-muted-foreground">{canal.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Pendentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Ações Pendentes ({acoesPendentes.length})</span>
            <Badge variant="secondary">{acoesHoje.length} para hoje</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={açõesPorPrioridade}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantidade" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Clientes Críticos */}
      {clientesCriticos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Clientes em Risco ({clientesCriticos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {clientesCriticos.map((cliente) => (
                  <div
                    key={cliente.cliente_id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            cliente.risco === "critico" ? "destructive" : "secondary"
                          }
                        >
                          Score: {cliente.score}
                        </Badge>
                        <span className="font-medium">{cliente.cliente_nome}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {cliente.total_atrasos} atrasos • {" "}
                        {cliente.media_dias_atraso} dias média • {" "}
                        {fmt(cliente.valor_em_aberto)} em aberto
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        {cliente.recomendacao}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default DashboardCobranca;
