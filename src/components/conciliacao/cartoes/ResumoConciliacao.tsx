/**
 * Componente de Resumo de Conciliação de Cartões
 * @agente-frontend
 */

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react";
import type { ResumoConciliacaoProps } from "./types";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function ResumoConciliacao({ resumo, loading = false }: ResumoConciliacaoProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-4 pb-4">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {/* Cards Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div variants={item}>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-xl font-bold">{resumo.total_transacoes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Conciliados</p>
                  <p className="text-xl font-bold text-green-600">{resumo.total_conciliados}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <XCircle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                  <p className="text-xl font-bold text-yellow-600">{resumo.total_pendentes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <RotateCcw className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Chargebacks</p>
                  <p className="text-xl font-bold text-red-600">{resumo.total_chargebacks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Cards de Valores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <motion.div variants={item}>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-500" />
                <p className="text-sm font-medium">Valor Bruto</p>
              </div>
              <p className="text-2xl font-bold">{fmt(resumo.valor_bruto_total)}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <p className="text-sm font-medium">Taxas</p>
              </div>
              <p className="text-2xl font-bold text-red-600">{fmt(resumo.valor_taxas_total)}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-green-500" />
                <p className="text-sm font-medium">Valor Líquido</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{fmt(resumo.valor_liquido_total)}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Taxa de Sucesso */}
      <motion.div variants={item}>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Taxa de Sucesso</span>
              </div>
              <Badge
                variant={resumo.taxa_sucesso >= 80 ? "default" : resumo.taxa_sucesso >= 50 ? "secondary" : "outline"}
              >
                {resumo.taxa_sucesso.toFixed(1)}%
              </Badge>
            </div>
            <Progress value={resumo.taxa_sucesso} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {resumo.total_conciliados} de {resumo.total_transacoes} conciliadas
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
