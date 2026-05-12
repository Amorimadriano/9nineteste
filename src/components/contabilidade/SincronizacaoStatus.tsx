import { motion } from "framer-motion";
import { RefreshCw, Clock, Calendar, CheckCircle2, AlertCircle, Loader2, PauseCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { StatusSincronizacao, FrequenciaSincronizacao } from "@/types/contabilidade";

interface SincronizacaoStatusProps {
  status: StatusSincronizacao;
  ultimaSincronizacao?: string;
  proximaSincronizacao?: string;
  frequencia: FrequenciaSincronizacao;
  registrosHoje: number;
  erpsConectados: number;
  progresso?: number;
  onSincronizar?: () => void;
  isLoading?: boolean;
}

const statusConfig: Record<
  StatusSincronizacao,
  { label: string; color: string; icon: React.ReactNode; bgColor: string }
> = {
  pendente: {
    label: "Pendente",
    color: "text-yellow-500",
    icon: <PauseCircle className="h-5 w-5" />,
    bgColor: "bg-yellow-500/10",
  },
  processando: {
    label: "Processando",
    color: "text-blue-500",
    icon: <Loader2 className="h-5 w-5 animate-spin" />,
    bgColor: "bg-blue-500/10",
  },
  sucesso: {
    label: "Sincronizado",
    color: "text-green-500",
    icon: <CheckCircle2 className="h-5 w-5" />,
    bgColor: "bg-green-500/10",
  },
  erro: {
    label: "Erro",
    color: "text-red-500",
    icon: <AlertCircle className="h-5 w-5" />,
    bgColor: "bg-red-500/10",
  },
  aviso: {
    label: "Aviso",
    color: "text-orange-500",
    icon: <AlertCircle className="h-5 w-5" />,
    bgColor: "bg-orange-500/10",
  },
};

const frequenciaLabels: Record<FrequenciaSincronizacao, string> = {
  manual: "Manual",
  diaria: "Diária",
  semanal: "Semanal",
};

export function SincronizacaoStatus({
  status,
  ultimaSincronizacao,
  proximaSincronizacao,
  frequencia,
  registrosHoje,
  erpsConectados,
  progresso,
  onSincronizar,
  isLoading,
}: SincronizacaoStatusProps) {
  const config = statusConfig[status];

  const formatarData = (data?: string) => {
    if (!data) return "Nunca";
    return new Date(data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      {/* Status Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Status da Sincronização
              </CardTitle>
              <CardDescription>
                Última atualização: {formatarData(ultimaSincronizacao)}
              </CardDescription>
            </div>
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full ${config.bgColor}`}
            >
              {config.icon}
              <span className={`font-medium ${config.color}`}>{config.label}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === "processando" && progresso !== undefined && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium">{progresso}%</span>
              </div>
              <Progress value={progresso} className="h-2" />
            </motion.div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Frequência</p>
                <p className="font-medium">{frequenciaLabels[frequencia]}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Próxima execução</p>
                <p className="font-medium">
                  {frequencia === "manual"
                    ? "Manual"
                    : formatarData(proximaSincronizacao)}
                </p>
              </div>
            </div>
          </div>

          {onSincronizar && (
            <Button
              onClick={onSincronizar}
              disabled={isLoading || status === "processando"}
              className="w-full gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Executar Sincronização Manual
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">ERPs Conectados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{erpsConectados}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">1</span>
            </div>
            <Badge
              variant={erpsConectados > 0 ? "default" : "secondary"}
              className="mt-2"
            >
              {erpsConectados > 0 ? "Ativo" : "Não configurado"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Registros Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{registrosHoje}</span>
              <span className="text-sm text-muted-foreground">registros</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {registrosHoje > 0 ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Sincronizado</span>
                </>
              ) : (
                <>
                  <PauseCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Sem registros</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
