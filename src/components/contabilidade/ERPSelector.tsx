import { motion } from "framer-motion";
import { Check, Building2, Database, Server, Cloud, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ERPConfig, TipoERP } from "@/types/contabilidade";

interface ERPSelectorProps {
  erps: ERPConfig[];
  selectedERP: TipoERP | null;
  onSelect: (erp: TipoERP) => void;
  disabled?: boolean;
}

const iconMap: Record<TipoERP, React.ReactNode> = {
  totvs_protheus: <Building2 className="h-8 w-8" />,
  sankhya_omegasoft: <Database className="h-8 w-8" />,
  dominio_sistemas: <Server className="h-8 w-8" />,
  alterdata: <Cloud className="h-8 w-8" />,
  outro: <Settings className="h-8 w-8" />,
};

const colorMap: Record<TipoERP, string> = {
  totvs_protheus: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
  sankhya_omegasoft: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
  dominio_sistemas: "from-green-500/20 to-green-600/10 border-green-500/30",
  alterdata: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
  outro: "from-gray-500/20 to-gray-600/10 border-gray-500/30",
};

export function ERPSelector({ erps, selectedERP, onSelect, disabled }: ERPSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {erps.map((erp, index) => {
        const isSelected = selectedERP === erp.tipo;

        return (
          <motion.div
            key={erp.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card
              className={cn(
                "cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2",
                isSelected
                  ? `bg-gradient-to-br ${colorMap[erp.tipo]} border-primary shadow-md`
                  : "border-transparent hover:border-border/50 bg-card",
                disabled && "opacity-50 cursor-not-allowed hover:transform-none"
              )}
              onClick={() => !disabled && onSelect(erp.tipo)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div
                    className={cn(
                      "p-3 rounded-lg",
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {iconMap[erp.tipo]}
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-primary text-primary-foreground rounded-full p-1"
                    >
                      <Check className="h-4 w-4" />
                    </motion.div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <CardTitle className="text-lg font-display">{erp.nome}</CardTitle>
                <CardDescription className="text-sm line-clamp-2">
                  {erp.descricao}
                </CardDescription>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Badge variant="default" className="mt-2">
                      Selecionado
                    </Badge>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
