/**
 * Componente de Badge para Bandeiras de Cartão
 * @agente-frontend
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export type BandeiraCartao =
  | "visa"
  | "mastercard"
  | "elo"
  | "amex"
  | "hipercard"
  | "diners"
  | "discover"
  | "jcb"
  | "outros";

interface BandeiraConfig {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

const bandeiraConfigs: Record<BandeiraCartao, BandeiraConfig> = {
  visa: {
    label: "Visa",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
  },
  mastercard: {
    label: "Mastercard",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-200",
  },
  elo: {
    label: "Elo",
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-800",
    borderColor: "border-yellow-200",
  },
  amex: {
    label: "Amex",
    bgColor: "bg-cyan-50",
    textColor: "text-cyan-700",
    borderColor: "border-cyan-200",
  },
  hipercard: {
    label: "Hipercard",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-200",
  },
  diners: {
    label: "Diners",
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-700",
    borderColor: "border-indigo-200",
  },
  discover: {
    label: "Discover",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
  },
  jcb: {
    label: "JCB",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
  },
  outros: {
    label: "Outros",
    bgColor: "bg-gray-50",
    textColor: "text-gray-600",
    borderColor: "border-gray-200",
  },
};

interface BandeiraBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  bandeira: BandeiraCartao | string;
  size?: "default" | "sm" | "lg";
}

export function BandeiraBadge({
  bandeira,
  size = "default",
  className,
  ...props
}: BandeiraBadgeProps) {
  const config = bandeiraConfigs[bandeira as BandeiraCartao] || bandeiraConfigs.outros;

  const sizeClasses = {
    default: "px-2.5 py-0.5 text-xs",
    sm: "px-2 py-0.5 text-[10px]",
    lg: "px-3 py-1 text-sm",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border font-medium transition-colors",
        sizeClasses[size],
        config.bgColor,
        config.textColor,
        config.borderColor,
        className
      )}
      {...props}
    >
      <span>{config.label}</span>
    </div>
  );
}

export { bandeiraConfigs };
export default BandeiraBadge;
