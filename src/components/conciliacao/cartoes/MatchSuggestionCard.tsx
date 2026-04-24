/**
 * Card de Sugestão de Match para Conciliação de Cartões
 * @agente-frontend
 */

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BandeiraBadge } from "@/components/ui/BandeiraBadge";
import {
  CheckCircle2,
  XCircle,
  Link2,
  Target,
  Zap,
  AlertTriangle,
} from "lucide-react";
import type { MatchSuggestionProps } from "./types";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

export default function MatchSuggestionCard({
  transacao,
  sugestao,
  candidato,
  onAceitar,
  onRecusar,
}: MatchSuggestionProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500 bg-green-50 border-green-200";
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-orange-600 bg-orange-50 border-orange-200";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <Zap className="h-4 w-4 text-green-500" />;
    if (score >= 60) return <Target className="h-4 w-4 text-yellow-500" />;
    return <AlertTriangle className="h-4 w-4 text-orange-500" />;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Match Confiável";
    if (score >= 60) return "Match Moderado";
    return "Verificar";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`border-2 ${getScoreColor(sugestao.score)}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              {getScoreIcon(sugestao.score)}
              Sugestão de Conciliação
            </CardTitle>
            <Badge
              variant="outline"
              className={`font-bold ${getScoreColor(sugestao.score)}`}
            >
              {sugestao.score}% Match
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Transação do Extrato */}
          <div className="p-3 bg-gray-50 rounded-lg space-y-2">
            <p className="text-xs text-muted-foreground">Transação do Extrato</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">
                  {transacao.linha_extrato || "Transação"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <BandeiraBadge bandeira={transacao.bandeira} size="sm" />
                  <span className="text-xs text-muted-foreground">
                    {fmtDate(transacao.data_transacao)}
                  </span>
                </div>
              </div>
              <span className="font-bold text-lg">{fmt(transacao.valor_bruto)}</span>
            </div>
          </div>

          {/* Seta de conexão */}
          <div className="flex justify-center">
            <div className="bg-primary/10 p-2 rounded-full">
              <Link2 className="h-5 w-5 text-primary" />
            </div>
          </div>

          {/* Candidato */}
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 space-y-2">
            <p className="text-xs text-muted-foreground">Candidato Sugerido</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{candidato.descricao}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px]">
                    {candidato.tipo === "conta_receber" ? "Contas a Receber" : "Lançamento"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {fmtDate(candidato.data)}
                  </span>
                </div>
              </div>
              <span className="font-bold text-lg text-primary">
                {fmt(candidato.valor)}
              </span>
            </div>
          </div>

          {/* Score e Motivo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{getScoreLabel(sugestao.score)}</span>
              <span className="font-medium">{sugestao.score}%</span>
            </div>
            <Progress value={sugestao.score} className="h-2" />
            <p className="text-xs text-muted-foreground italic">
              Motivo: {sugestao.motivo}
            </p>
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={onAceitar}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Aceitar Match
            </Button>
            <Button onClick={onRecusar} variant="outline" size="sm" className="flex-1">
              <XCircle className="h-4 w-4 mr-2" />
              Recusar
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
