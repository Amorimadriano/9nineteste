import { useState } from "react";
import { useEmpresa } from "@/contexts/EmpresaContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function SeletorEmpresa() {
  const { empresas, empresaSelecionada, selecionarEmpresa, loading } =
    useEmpresa();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="h-9 w-48 bg-gray-100 animate-pulse rounded-md" />
    );
  }

  if (empresas.length === 0) {
    return (
      <button
        onClick={() => navigate("/nova-empresa")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Plus className="h-4 w-4" />
        Adicionar Empresa
      </button>
    );
  }

  return (
    <Select
      value={empresaSelecionada?.id || ""}
      onValueChange={(id) => {
        if (id === "__nova__") {
          navigate("/nova-empresa");
          return;
        }
        selecionarEmpresa(id);
      }}
      open={open}
      onOpenChange={setOpen}
    >
      <SelectTrigger className={cn("w-[240px] gap-2", open && "ring-2 ring-primary")}>
        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <SelectValue placeholder="Selecione uma empresa">
          {empresaSelecionada?.nome_fantasia ||
            empresaSelecionada?.razao_social ||
            "Selecione uma empresa"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start">
        {empresas.map((emp) => (
          <SelectItem key={emp.id} value={emp.id}>
            <div className="flex items-center gap-2">
              {emp.logo_url ? (
                <img
                  src={emp.logo_url}
                  alt=""
                  className="h-5 w-5 rounded-full object-cover"
                />
              ) : (
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                  {emp.nome_fantasia?.charAt(0) ||
                    emp.razao_social.charAt(0)}
                </div>
              )}
              <span className="truncate">
                {emp.nome_fantasia || emp.razao_social}
              </span>
              {!emp.ativo && (
                <span className="text-[10px] text-muted-foreground">(Inativo)</span>
              )}
            </div>
          </SelectItem>
        ))}
        <div className="border-t my-1" />
        <SelectItem value="__nova__" className="text-primary font-medium">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Nova Empresa
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
