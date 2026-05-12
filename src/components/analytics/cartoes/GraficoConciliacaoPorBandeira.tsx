/**
 * Gráfico de conciliação por bandeira
 * @agente-analytics
 */

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MetricasPorBandeira } from '@/types/cartoes';

interface Props {
  data: MetricasPorBandeira[];
  tipo?: 'pizza' | 'barra';
  titulo?: string;
}

const NOMES_BANDEIRAS: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  elo: 'Elo',
  amex: 'American Express',
  hipercard: 'Hipercard',
  diners: 'Diners Club',
  discover: 'Discover',
  jcb: 'JCB',
  outros: 'Outros',
};

export function GraficoConciliacaoPorBandeira({
  data,
  tipo = 'pizza',
  titulo = 'Conciliação por Bandeira',
}: Props) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      name: NOMES_BANDEIRAS[item.bandeira] || item.bandeira,
      value: item.total_transacoes,
      valor: item.valor_total,
      taxaConciliacao: item.taxa_conciliacao,
      color: item.cor,
    }));
  }, [data]);

  if (tipo === 'pizza') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{titulo}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string, props: any) => {
                  const item = props.payload;
                  return [
                    `${value} transações (${item.taxaConciliacao.toFixed(1)}% conciliado)`,
                    name,
                  ];
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
