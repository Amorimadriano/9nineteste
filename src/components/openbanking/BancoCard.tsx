import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SyncStatus } from "./SyncStatus";
import {
  Building2,
  MoreVertical,
  RefreshCw,
  Trash2,
  Unlink,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type BankStatus = "active" | "expired" | "syncing" | "error";

export interface BankData {
  id: string;
  code: string;
  name: string;
  fullName: string;
  logoUrl?: string;
  primaryColor?: string;
  status: BankStatus;
  lastSync?: Date;
  expiresAt?: Date;
  accountCount?: number;
  consentId?: string;
}

interface BancoCardProps {
  bank: BankData;
  onSync?: () => void;
  onDisconnect?: () => void;
  onClick?: () => void;
}

// Cores padrão dos principais bancos brasileiros
const bankColors: Record<string, string> = {
  "001": "#003399", // Banco do Brasil
  "104": "#EC660D", // Caixa
  "341": "#EC3625", // Itaú
  "033": "#FF8C00", // Santander
  "237": "#005A9C", // Bradesco
  "260": "#820AD1", // Nubank
  "290": "#1A9CD9", // PagBank
  "077": "#7B1FA2", // Inter
  "212": "#7CB342", // BOriginal
  "336": "#00897B", // C6 Bank
  "380": "#E65100", // PicPay
};

const getBankInitials = (name: string): string => {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
};

const statusConfig: Record<
  BankStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
> = {
  active: {
    label: "Ativo",
    variant: "default",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  expired: {
    label: "Expirado",
    variant: "destructive",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  syncing: {
    label: "Sincronizando",
    variant: "secondary",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  error: {
    label: "Erro",
    variant: "destructive",
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

export function BancoCard({ bank, onSync, onDisconnect, onClick }: BancoCardProps) {
  const status = statusConfig[bank.status];
  const primaryColor = bank.primaryColor || bankColors[bank.code] || "#64748B";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="relative overflow-hidden cursor-pointer group"
        onClick={onClick}
      >
        {/* Faixa colorida do banco */}
        <div
          className="absolute top-0 left-0 w-full h-1"
          style={{ backgroundColor: primaryColor }}
        />

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Logo ou iniciais do banco */}
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {bank.logoUrl ? (
                  <img
                    src={bank.logoUrl}
                    alt={bank.name}
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  getBankInitials(bank.name)
                )}
              </div>
              <div>
                <h3 className="font-semibold text-foreground leading-tight">
                  {bank.name}
                </h3>
                <p className="text-xs text-muted-foreground">{bank.fullName}</p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSync?.(); }}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sincronizar agora
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onDisconnect?.(); }}
                  className="text-destructive"
                >
                  <Unlink className="mr-2 h-4 w-4" />
                  Desconectar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status e badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={status.variant} className="gap-1">
              {status.icon}
              {status.label}
            </Badge>
            {bank.accountCount && bank.accountCount > 0 && (
              <Badge variant="outline" className="gap-1">
                <Building2 className="h-3 w-3" />
                {bank.accountCount} conta(s)
              </Badge>
            )}
          </div>

          {/* Status de sincronização */}
          {bank.lastSync && (
            <SyncStatus lastSync={bank.lastSync} expiresAt={bank.expiresAt} />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Versão compacta para grids e listas
export function BancoCardCompact({
  bank,
  onClick,
  selected = false,
}: {
  bank: BankData;
  onClick?: () => void;
  selected?: boolean;
}) {
  const primaryColor = bank.primaryColor || bankColors[bank.code] || "#64748B";

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center p-4 rounded-xl border-2
        transition-all duration-200 min-w-[120px] min-h-[120px]
        ${selected
          ? "border-primary bg-primary/5 shadow-lg"
          : "border-border bg-card hover:border-primary/50 hover:shadow-md"
        }
      `}
    >
      {/* Logo ou iniciais */}
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg mb-2 shadow-sm"
        style={{ backgroundColor: primaryColor }}
      >
        {bank.logoUrl ? (
          <img
            src={bank.logoUrl}
            alt={bank.name}
            className="w-9 h-9 object-contain"
          />
        ) : (
          getBankInitials(bank.name)
        )}
      </div>

      <span className="text-sm font-medium text-foreground text-center leading-tight">
        {bank.name}
      </span>
      <span className="text-xs text-muted-foreground mt-1">
        {bank.code}
      </span>

      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2"
        >
          <CheckCircle2 className="h-5 w-5 text-primary" />
        </motion.div>
      )}
    </motion.button>
  );
}

export default BancoCard;
