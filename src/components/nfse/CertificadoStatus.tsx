/**
 * Componente de status do certificado digital
 * Alerta quando próximo de expirar
 */
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle, ExternalLink } from "lucide-react";

interface CertificadoStatusProps {
  nome?: string;
  validoAte?: string;
  diasParaExpirar?: number;
  ativo?: boolean;
  loading?: boolean;
  onConfigurar?: () => void;
}

export function CertificadoStatus({
  nome,
  validoAte,
  diasParaExpirar = 30,
  ativo = false,
  loading = false,
  onConfigurar,
}: CertificadoStatusProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5" />
            Certificado Digital
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sem certificado configurado
  if (!ativo || !nome) {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Certificado não configurado</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>É necessário configurar um certificado digital A1 para emitir NFS-e.</p>
          {onConfigurar && (
            <Button size="sm" variant="outline" onClick={onConfigurar}>
              Configurar Certificado
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Certificado expirado
  if (diasParaExpirar <= 0) {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Certificado expirado!</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>O certificado "{nome}" expirou em {validoAte}.</p>
          <p className="text-sm">
            Renove o certificado para continuar emitindo notas fiscais.
          </p>
          {onConfigurar && (
            <Button size="sm" variant="outline" onClick={onConfigurar}>
              Renovar Certificado
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Certificado próximo de expirar (<= 30 dias)
  if (diasParaExpirar <= 30) {
    return (
      <Alert variant="default" className="border-amber-500 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">
          Certificado próximo de expirar
        </AlertTitle>
        <AlertDescription className="space-y-2 text-amber-700">
          <p>O certificado "{nome}" expira em {diasParaExpirar} dias ({validoAte}).</p>
          <p className="text-sm">
            Renove o certificado antes da data de expiração para evitar interrupções.
          </p>
          {onConfigurar && (
            <Button
              size="sm"
              variant="outline"
              onClick={onConfigurar}
              className="border-amber-500 text-amber-700 hover:bg-amber-100"
            >
              Gerenciar Certificado
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Certificado OK
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-5 w-5 text-green-600" />
          Certificado Digital
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="font-medium truncate" title={nome}>{nome}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
              Ativo
            </Badge>
          </div>
        </div>

        <div className="text-sm">
          <span className="text-muted-foreground">Válido até:</span>{" "}
          <span>{validoAte}</span>
        </div>

        <div className="text-xs text-muted-foreground">
          {diasParaExpirar > 30 && (
            <span>Expira em {diasParaExpirar} dias</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
