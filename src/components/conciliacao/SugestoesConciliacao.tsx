/**
 * Componente de Sugestões de Conciliação
 * Interface visual para matches automáticos com indicadores de confiança
 *
 * @agente-uiux responsável pela experiência visual
 * @agente-frontend responsável pela implementação
 */

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { MatchSugestao, ConciliacaoStats } from "@/hooks/useConciliacaoInteligente";
import {
  CheckCircle2,
  XCircle,
  Brain,
  Target,
  Clock,
  AlertTriangle,
  Check,
  X,
  Link2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SugestoesConciliacaoProps {
  sugestoes: MatchSugestao[];
  stats: ConciliacaoStats;
  onConciliarAutomatico: () => Promise<void>;
  onConciliarEmLote: (
    matches: Array<{ extratoId: string; itemId: string; tipo: string }>
  ) => Promise<void>;
  onRecusar: (extratoId: string) => void;
  isLoading: boolean;
  progresso: number;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

export function SugestoesConciliacao({
  sugestoes,
  stats,
  onConciliarAutomatico,
  onConciliarEmLote,
  onRecusar,
  isLoading,
  progresso,
}: SugestoesConciliacaoProps) {
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [modoSelecao, setModoSelecao] = useState(false);

  const sugestoesConfiaveis = sugestoes.filter(
    (s) => s.sugestoes.length > 0 && s.sugestoes[0].score >= 80
  );

  const sugestoesRevisar = sugestoes.filter(
    (s) =>
      s.sugestoes.length > 0 &&
      s.sugestoes[0].score >= 50 &&
      s.sugestoes[0].score < 80
  );

  const handleSelecionar = (extratoId: string, itemId: string, tipo: string) => {
    const key = `${extratoId}::${itemId}`;
    setSelecionados((prev) => {
      const novo = new Set(prev);
      if (novo.has(key)) {
        novo.delete(key);
      } else {
        novo.add(key);
      }
      return novo;
    });
  };

  const handleConciliarSelecionados = async () => {
    const matches = Array.from(selecionados).map((key) => {
      const [extratoId, itemId] = key.split("::");
      const sugestao = sugestoes.find((s) => s.extratoId === extratoId);
      const match = sugestao?.sugestoes.find((m) => m.id === itemId);
      return {
        extratoId,
        itemId,
        tipo: match?.tipo || "lancamento",
      };
    });

    await onConciliarEmLote(matches);
    setSelecionados(new Set());
    setModoSelecao(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-orange-500";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "outline";
  };

  if (sugestoes.length === 0 && stats.pendentes === 0) {
    return (
      <Card className="bg-green-50/50 border-green-200">
        <CardContent className="pt-6 pb-6 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="text-lg font-medium text-green-800">
            Tudo conciliado!
          </p>
          <p className="text-sm text-green-600">
            Não há transações pendentes de conciliação
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-[10px] text-muted-foreground">Taxa Automática</p>
                <p className="text-lg font-bold">{stats.taxaMatchAutomatico}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-[10px] text-muted-foreground">Sugestões IA</p>
                <p className="text-lg font-bold">{stats.sugestoesPendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-[10px] text-muted-foreground">Auto (Score 80+)</p>
                <p className="text-lg font-bold">{sugestoesConfiaveis.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-[10px] text-muted-foreground">Sem Sugestão</p>
                <p className="text-lg font-bold">{stats.semVinculo}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações em Lote */}
      {sugestoesConfiaveis.length > 0 && (
        <Alert className="bg-blue-50 border-blue-200">
          <Brain className="h-4 w-4 text-blue-600" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              <strong>{sugestoesConfiaveis.length}</strong> transações podem ser
              conciliadas automaticamente (score 80+)
            </span>
            <Button
              size="sm"
              onClick={onConciliarAutomatico}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Clock className="h-4 w-4 mr-1 animate-spin" />
                  {progresso}%
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-1" />
                  Conciliar Automático
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Progresso */}
      {isLoading && (
        <Progress value={progresso} className="h-2" />
      )}

      {/* Modo Seleção */}
      {modoSelecao && selecionados.size > 0 && (
        <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
          <span className="text-sm font-medium">
            {selecionados.size} item(ns) selecionado(s)
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSelecionados(new Set())}>
              Limpar
            </Button>
            <Button
              size="sm"
              onClick={handleConciliarSelecionados}
              disabled={isLoading}
            >
              <Check className="h-4 w-4 mr-1" />
              Conciliar Selecionados
            </Button>
          </div>
        </div>
      )}

      {/* Lista de Sugestões */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sugestões Confiáveis */}
        {sugestoesConfiaveis.length > 0 && (
          <Card className="border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Sugestões Confiáveis (80%+)
              </CardTitle>
              <CardDescription>
                {sugestoesConfiaveis.length} transações com alta confiança de match
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {sugestoesConfiaveis.map((sugestao) => (
                    <SugestaoCard
                      key={sugestao.extratoId}
                      sugestao={sugestao}
                      selecionado={selecionados.has(
                        `${sugestao.extratoId}::${sugestao.sugestoes[0].id}`
                      )}
                      onSelecionar={() =>
                        handleSelecionar(
                          sugestao.extratoId,
                          sugestao.sugestoes[0].id,
                          sugestao.sugestoes[0].tipo
                        )
                      }
                      onRecusar={() => onRecusar(sugestao.extratoId)}
                      modoSelecao={modoSelecao}
                      getScoreColor={getScoreColor}
                      getScoreBadgeVariant={getScoreBadgeVariant}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Sugestões para Revisar */}
        {sugestoesRevisar.length > 0 && (
          <Card className="border-yellow-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Para Revisar (50-79%)
              </CardTitle>
              <CardDescription>
                {sugestoesRevisar.length} transações que precisam de verificação
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {sugestoesRevisar.map((sugestao) => (
                    <SugestaoCard
                      key={sugestao.extratoId}
                      sugestao={sugestao}
                      selecionado={selecionados.has(
                        `${sugestao.extratoId}::${sugestao.sugestoes[0].id}`
                      )}
                      onSelecionar={() =>
                        handleSelecionar(
                          sugestao.extratoId,
                          sugestao.sugestoes[0].id,
                          sugestao.sugestoes[0].tipo
                        )
                      }
                      onRecusar={() => onRecusar(sugestao.extratoId)}
                      modoSelecao={modoSelecao}
                      getScoreColor={getScoreColor}
                      getScoreBadgeVariant={getScoreBadgeVariant}
                      expandir
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sem Sugestões */}
      {stats.semVinculo > 0 && (
        <Card className="border-gray-200 bg-gray-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">{stats.semVinculo} transações sem sugestão</p>
                  <p className="text-xs text-muted-foreground">
                    Essas transações precisam ser conciliadas manualmente
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setModoSelecao(!modoSelecao)}>
                {modoSelecao ? "Cancelar Seleção" : "Modo Seleção em Lote"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Sub-componente para cada sugestão
interface SugestaoCardProps {
  sugestao: MatchSugestao;
  selecionado: boolean;
  onSelecionar: () => void;
  onRecusar: () => void;
  modoSelecao: boolean;
  getScoreColor: (score: number) => string;
  getScoreBadgeVariant: (score: number) => string;
  expandir?: boolean;
}

function SugestaoCard({
  sugestao,
  selecionado,
  onSelecionar,
  onRecusar,
  modoSelecao,
  getScoreColor,
  getScoreBadgeVariant,
  expandir,
}: SugestaoCardProps) {
  const [expandido, setExpandido] = useState(expandir || false);
  const melhorMatch = sugestao.sugestoes[0];

  return (
    <div
      className={cn(
        "border rounded-lg p-3 transition-all",
        selecionado
          ? "bg-blue-50 border-blue-400 ring-1 ring-blue-400"
          : "bg-white border-gray-200 hover:border-gray-300"
      )}
    >
      {/* Header da Sugestão */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{sugestao.extratoDescricao}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{fmtDate(sugestao.extratoData)}</span>
            <span>•</span>
            <span
              className={cn(
                "font-medium",
                sugestao.tipo === "entrada" ? "text-green-600" : "text-red-600"
              )}
            >
              {fmt(sugestao.extratoValor)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {modoSelecao ? (
            <Checkbox checked={selecionado} onCheckedChange={onSelecionar} />
          ) : (
            <>
              <Badge
                variant={getScoreBadgeVariant(melhorMatch.score) as any}
                className={cn("text-[10px]", getScoreColor(melhorMatch.score))}
              >
                {melhorMatch.score}%
              </Badge>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onRecusar}>
                <X className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Match Sugerido */}
      <div className="mt-3 p-2 bg-muted/50 rounded-md">
        <div className="flex items-center gap-2">
          <Link2 className="h-3 w-3 text-blue-500" />
          <span className="text-xs font-medium text-blue-600">{melhorMatch.tipo}</span>
          <span className="text-xs text-muted-foreground">{melhorMatch.descricao}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <span>{fmtDate(melhorMatch.data)}</span>
          <span>•</span>
          <span className="font-medium">{fmt(melhorMatch.valor)}</span>
          <span>•</span>
          <span className="text-[10px] italic">{melhorMatch.motivo}</span>
        </div>

        {!modoSelecao && (
          <Button
            size="sm"
            className="w-full mt-2"
            onClick={onSelecionar}
            variant={selecionado ? "secondary" : "default"}
          >
            {selecionado ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Selecionado
              </>
            ) : (
              <>
                <Link2 className="h-3 w-3 mr-1" />
                Vincular
              </>
            )}
          </Button>
        )}
      </div>

      {/* Expandir para ver mais sugestões */}
      {sugestao.sugestoes.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-xs"
            onClick={() => setExpandido(!expandido)}
          >
            {expandido
              ? "Ocultar outras sugestões"
              : `Ver ${sugestao.sugestoes.length - 1} outras sugestões`}
          </Button>

          {expandido && (
            <div className="mt-2 space-y-2">
              {sugestao.sugestoes.slice(1).map((match) => (
                <div
                  key={match.id}
                  className="p-2 border rounded bg-gray-50 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{match.descricao}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {match.score}%
                    </Badge>
                  </div>
                  <div className="text-muted-foreground mt-1">
                    {fmtDate(match.data)} • {fmt(match.valor)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SugestoesConciliacao;
