/**
 * Componente para exibir o próximo número da série
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileDigit, AlertCircle } from "lucide-react";

interface NumeroNotaDisplayProps {
  numero?: string;
  serie?: string;
  loading?: boolean;
  error?: string;
}

export function NumeroNotaDisplay({
  numero = "-",
  serie = "1",
  loading = false,
  error,
}: NumeroNotaDisplayProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileDigit className="h-5 w-5 text-primary" />
          Próximo Número
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="text-sm font-medium">Erro ao carregar</p>
              <p className="text-xs">{error}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">{numero}</span>
              <Badge variant="outline">Série {serie}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Este será o número da nota ao emitir
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
