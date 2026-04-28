import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extrato: {
    id: string;
    descricao: string;
    valor: number;
    data_transacao: string;
    tipo: "entrada" | "saida";
  } | null;
  categorias: any[];
  onConfirm: (dados: {
    descricao: string;
    valor: number;
    data: string;
    tipo: "entrada" | "saida";
    categoria_id?: string;
  }) => Promise<boolean>;
  isLoading: boolean;
}

export default function CriarLancamentoAjusteModal({
  open,
  onOpenChange,
  extrato,
  categorias,
  onConfirm,
  isLoading,
}: Props) {
  const [categoriaId, setCategoriaId] = useState("");

  if (!extrato) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onConfirm({
      descricao: extrato.descricao,
      valor: extrato.valor,
      data: extrato.data_transacao,
      tipo: extrato.tipo,
      categoria_id: categoriaId || undefined,
    });
    if (ok) {
      setCategoriaId("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Criar Lançamento de Ajuste
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            Esta transação do extrato não possui correspondente no sistema. Crie um
            lançamento de ajuste para efetivar a conciliação.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Descrição</Label>
              <Input value={extrato.descricao} disabled />
            </div>
            <div>
              <Label>Valor</Label>
              <Input
                value={extrato.valor.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
                disabled
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data</Label>
              <Input value={extrato.data_transacao} disabled />
            </div>
            <div>
              <Label>Tipo</Label>
              <Input
                value={extrato.tipo === "entrada" ? "Entrada" : "Saída"}
                disabled
              />
            </div>
          </div>

          <div>
            <Label>Categoria</Label>
            <Select value={categoriaId} onValueChange={setCategoriaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria..." />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !categoriaId}>
              {isLoading ? "Salvando..." : "Criar e Conciliar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
