import { motion } from "framer-motion";
import { formatDistanceToNow, format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface SyncStatusProps {
  lastSync?: Date;
  expiresAt?: Date;
  showIcon?: boolean;
  showBadge?: boolean;
  compact?: boolean;
}

type SyncState = "synced" | "pending" | "expired" | "expiring";

export function SyncStatus({
  lastSync,
  expiresAt,
  showIcon = true,
  showBadge = true,
  compact = false,
}: SyncStatusProps) {
  const now = new Date();

  // Determinar estado
  const getState = (): SyncState => {
    if (!expiresAt) return lastSync ? "synced" : "pending";
    if (expiresAt < now) return "expired";
    if (differenceInDays(expiresAt, now) <= 7) return "expiring";
    return lastSync ? "synced" : "pending";
  };

  const state = getState();

  const stateConfig = {
    synced: {
      icon: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
      badgeVariant: "default" as const,
      textColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    pending: {
      icon: <Clock className="h-3.5 w-3.5 text-amber-500" />,
      badgeVariant: "secondary" as const,
      textColor: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    expired: {
      icon: <AlertCircle className="h-3.5 w-3.5 text-destructive" />,
      badgeVariant: "destructive" as const,
      textColor: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    expiring: {
      icon: <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />,
      badgeVariant: "secondary" as const,
      textColor: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  };

  const config = stateConfig[state];

  const getLastSyncText = () => {
    if (!lastSync) return "Nunca sincronizado";
    const distance = formatDistanceToNow(lastSync, { locale: ptBR, addSuffix: true });
    return `Sincronizado ${distance}`;
  };

  const getExpiresText = () => {
    if (!expiresAt) return null;
    const days = differenceInDays(expiresAt, now);
    if (days < 0) return `Expirou há ${Math.abs(days)} dias`;
    if (days === 0) return "Expira hoje";
    if (days === 1) return "Expira amanhã";
    return `Expira em ${days} dias`;
  };

  const tooltipContent = (
    <div className="space-y-1">
      {lastSync && (
        <p className="text-xs">
          <span className="text-muted-foreground">Última sincronização:</span>{" "}
          {format(lastSync, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
      )}
      {expiresAt && (
        <p className="text-xs">
          <span className="text-muted-foreground">Expira em:</span>{" "}
          {format(expiresAt, "dd/MM/yyyy", { locale: ptBR })}
        </p>
      )}
    </div>
  );

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              {showIcon && config.icon}
              <span className={`text-xs ${config.textColor}`}>
                {getLastSyncText()}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>{tooltipContent}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`p-3 rounded-lg ${config.bgColor} space-y-1`}>
            {/* Status de sincronização */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {showIcon && config.icon}
                <span className={`text-sm ${config.textColor}`}>
                  {getLastSyncText()}
                </span>
              </div>
              {showBadge && state !== "synced" && (
                <Badge
                  variant={config.badgeVariant}
                  className="text-[10px] px-1.5 py-0"
                >
                  {state === "expired" ? "Expirado" : state === "expiring" ? "Renovar" : "Pendente"}
                </Badge>
              )}
            </div>

            {/* Data de expiração */}
            {expiresAt && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{getExpiresText()}</span>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>{tooltipContent}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Componente de badge de status para uso em listas
export function SyncStatusBadge({
  lastSync,
  expiresAt,
  showIcon = true,
}: SyncStatusProps) {
  const now = new Date();

  const getState = (): SyncState => {
    if (!expiresAt) return lastSync ? "synced" : "pending";
    if (expiresAt < now) return "expired";
    if (differenceInDays(expiresAt, now) <= 7) return "expiring";
    return lastSync ? "synced" : "pending";
  };

  const state = getState();

  const labels: Record<SyncState, string> = {
    synced: "Sincronizado",
    pending: "Pendente",
    expired: "Expirado",
    expiring: "Expira em breve",
  };

  const variants: Record<SyncState, "default" | "secondary" | "destructive" | "outline"> = {
    synced: "default",
    pending: "secondary",
    expired: "destructive",
    expiring: "secondary",
  };

  return (
    <Badge variant={variants[state]} className="gap-1">
      {showIcon && (
        <>
          {state === "synced" && <CheckCircle2 className="h-3 w-3" />}
          {state === "pending" && <RefreshCw className="h-3 w-3" />}
          {state === "expired" && <AlertCircle className="h-3 w-3" />}
          {state === "expiring" && <AlertTriangle className="h-3 w-3" />}
        </>
      )}
      {labels[state]}
    </Badge>
  );
}

export default SyncStatus;
