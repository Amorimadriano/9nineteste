import { Empresa } from "@/contexts/EmpresaContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, ArrowRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  empresa: Empresa;
  onAcessar: (empresaId: string) => void;
  saldoBancario?: number;
  pendenciasConciliacao?: number;
}

export default function EmpresaCard({
  empresa,
  onAcessar,
  saldoBancario,
  pendenciasConciliacao,
}: Props) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow", !empresa.ativo && "opacity-60")}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            {empresa.logo_url ? (
              <img
                src={empresa.logo_url}
                alt={empresa.nome_fantasia || empresa.razao_social}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">
              {empresa.nome_fantasia || empresa.razao_social}
            </h3>
            <p className="text-sm text-muted-foreground">
              CNPJ: {empresa.cnpj}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {empresa.segmento && (
                <Badge variant="secondary" className="text-[10px]">
                  {empresa.segmento}
                </Badge>
              )}
              <Badge
                variant={empresa.ativo ? "default" : "outline"}
                className="text-[10px]"
              >
                {empresa.ativo ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/50 rounded-md p-2">
            <p className="text-[10px] text-muted-foreground">Saldo Bancário</p>
            <p className="text-sm font-bold">
              {saldoBancario !== undefined
                ? saldoBancario.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })
                : "—"}
            </p>
          </div>
          <div className="bg-muted/50 rounded-md p-2">
            <p className="text-[10px] text-muted-foreground">Pendências</p>
            <div className="flex items-center gap-1">
              <p className="text-sm font-bold">{pendenciasConciliacao ?? "—"}</p>
              {!!pendenciasConciliacao && pendenciasConciliacao > 0 && (
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
              )}
            </div>
          </div>
        </div>

        <Button
          className="w-full"
          onClick={() => onAcessar(empresa.id)}
          disabled={!empresa.ativo}
        >
          Acessar Sistema
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
