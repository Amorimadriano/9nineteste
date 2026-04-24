import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, X, CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface ContasFilterValues {
  dataVencimentoDe: string;
  dataVencimentoAte: string;
  documento: string;
  valorMin: string;
  valorMax: string;
  fornecedorOuClienteId: string;
  busca: string;
}

const emptyFilters: ContasFilterValues = {
  dataVencimentoDe: "",
  dataVencimentoAte: "",
  documento: "",
  valorMin: "",
  valorMax: "",
  fornecedorOuClienteId: "",
  busca: "",
};

interface ContasFilterProps {
  filters: ContasFilterValues;
  onFiltersChange: (filters: ContasFilterValues) => void;
  entidades?: { id: string; nome: string }[];
  entidadeLabel?: string;
}

export function useContasFilter() {
  const [filters, setFilters] = useState<ContasFilterValues>(emptyFilters);

  const applyFilters = (items: any[], entidadeKey?: string) => {
    return items.filter((c) => {
      if (filters.dataVencimentoDe && c.data_vencimento < filters.dataVencimentoDe) return false;
      if (filters.dataVencimentoAte && c.data_vencimento > filters.dataVencimentoAte) return false;
      if (filters.documento && !(c.documento || "").toLowerCase().includes(filters.documento.toLowerCase())) return false;
      if (filters.valorMin && Number(c.valor) < parseFloat(filters.valorMin)) return false;
      if (filters.valorMax && Number(c.valor) > parseFloat(filters.valorMax)) return false;
      if (filters.fornecedorOuClienteId && entidadeKey) {
        if (c[entidadeKey] !== filters.fornecedorOuClienteId) return false;
      }
      if (filters.busca) {
        const term = filters.busca.toLowerCase();
        const match = (c.descricao || "").toLowerCase().includes(term) ||
          (c.documento || "").toLowerCase().includes(term) ||
          (c.observacoes || "").toLowerCase().includes(term);
        if (!match) return false;
      }
      return true;
    });
  };

  const activeCount = Object.values(filters).filter(Boolean).length;

  return { filters, setFilters, applyFilters, activeCount, clearFilters: () => setFilters(emptyFilters) };
}

export default function ContasFilter({ filters, onFiltersChange, entidades = [], entidadeLabel = "Fornecedor" }: ContasFilterProps) {
  const [expanded, setExpanded] = useState(false);
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Barra de busca principal com datas sempre visíveis */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição, documento..."
            value={filters.busca}
            onChange={(e) => onFiltersChange({ ...filters, busca: e.target.value })}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Vencimento De</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[150px] justify-start text-left font-normal h-9 text-xs", !filters.dataVencimentoDe && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dataVencimentoDe ? format(parse(filters.dataVencimentoDe, "yyyy-MM-dd", new Date()), "dd/MM/yyyy") : "Data início"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dataVencimentoDe ? parse(filters.dataVencimentoDe, "yyyy-MM-dd", new Date()) : undefined}
                  onSelect={(date) => onFiltersChange({ ...filters, dataVencimentoDe: date ? format(date, "yyyy-MM-dd") : "" })}
                  locale={ptBR}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Vencimento Até</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[150px] justify-start text-left font-normal h-9 text-xs", !filters.dataVencimentoAte && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dataVencimentoAte ? format(parse(filters.dataVencimentoAte, "yyyy-MM-dd", new Date()), "dd/MM/yyyy") : "Data fim"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dataVencimentoAte ? parse(filters.dataVencimentoAte, "yyyy-MM-dd", new Date()) : undefined}
                  onSelect={(date) => onFiltersChange({ ...filters, dataVencimentoAte: date ? format(date, "yyyy-MM-dd") : "" })}
                  locale={ptBR}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button
            size="sm"
            className="h-9 gap-2"
            onClick={() => onFiltersChange({ ...filters })}
          >
            <Search className="h-4 w-4" />
            Buscar
          </Button>
        </div>
        <Button
          variant={expanded ? "secondary" : "outline"}
          size="sm"
          className="h-9 gap-2"
          onClick={() => setExpanded(!expanded)}
        >
          Filtros Avançados
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {activeCount}
            </Badge>
          )}
        </Button>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground gap-1 h-9"
            onClick={() => onFiltersChange(emptyFilters as ContasFilterValues)}
          >
            <X className="h-3 w-3" /> Limpar
          </Button>
        )}
      </div>

      {/* Filtros avançados expansíveis */}
      {expanded && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 rounded-lg border bg-card">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Valor Mínimo</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="R$ 0,00"
              value={filters.valorMin}
              onChange={(e) => onFiltersChange({ ...filters, valorMin: e.target.value })}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Valor Máximo</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="R$ 0,00"
              value={filters.valorMax}
              onChange={(e) => onFiltersChange({ ...filters, valorMax: e.target.value })}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Documento</Label>
            <Input
              placeholder="Nº documento"
              value={filters.documento}
              onChange={(e) => onFiltersChange({ ...filters, documento: e.target.value })}
              className="h-8 text-xs"
            />
          </div>
          {entidades.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{entidadeLabel}</Label>
              <Select
                value={filters.fornecedorOuClienteId}
                onValueChange={(v) => onFiltersChange({ ...filters, fornecedorOuClienteId: v === "all" ? "" : v })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {entidades.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
