import { MatchResult } from "@/hooks/useConciliacaoBancariaV2";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  matches: MatchResult[];
  onConfirmarMatch: (ofxId: string, candidatoId: string) => void;
  onSemLancamento: (extrato: MatchResult["extrato"]) => void;
  isLoading: boolean;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ConciliacaoMatchPanel({
  matches,
  onConfirmarMatch,
  onSemLancamento,
  isLoading,
}: Props) {
  return (
    <div className="space-y-3">
      {matches.map((m) => (
        <div
          key={m.extrato.id}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg border transition-colors",
            m.matchType === "green"
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          )}
        >
          {/* Ícone de status */}
          <div className="shrink-0">
            {m.matchType === "green" ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-red-600" />
            )}
          </div>

          {/* Dados do extrato */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {m.extrato.descricao}
            </p>
            <p className="text-xs text-muted-foreground">
              {m.extrato.data_transacao} · {fmt(Number(m.extrato.valor))} ·{" "}
              {m.extrato.tipo === "entrada" ? "Entrada" : "Saída"}
            </p>
          </div>

          {/* Match info */}
          {m.matchType === "green" && m.candidato && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate max-w-[120px]">
                {m.candidato.descricao}
              </span>
              <ArrowRight className="h-3 w-3" />
              <Badge variant="outline" className="text-[10px]">
                {m.diffDias === 0
                  ? "Mesma data"
                  : `${m.diffDias} dia${m.diffDias > 1 ? "s" : ""} dif`}
              </Badge>
            </div>
          )}

          {/* Ação */}
          <div className="shrink-0">
            {m.matchType === "green" && m.candidato ? (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() =>
                  onConfirmarMatch(m.extrato.id, m.candidato!.id)
                }
                disabled={isLoading}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Confirmar Match
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
                onClick={() => onSemLancamento(m.extrato)}
                disabled={isLoading}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Sem Lançamento
              </Button>
            )}
          </div>
        </div>
      ))}

      {matches.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma transação do extrato para processar. Importe um arquivo OFX
          para iniciar a conciliação.
        </div>
      )}
    </div>
  );
}
