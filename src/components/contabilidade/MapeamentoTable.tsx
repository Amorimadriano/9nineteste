import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Sparkles, CheckCircle2, AlertCircle, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import type { MapeamentoConta } from "@/types/contabilidade";
import { TIPOS_LANCAMENTO } from "@/types/contabilidade";
type TipoLancamento = "despesa" | "receita" | "transferencia";

interface MapeamentoTableProps {
  mapeamentos: MapeamentoConta[];
  onChange: (mapeamentos: MapeamentoConta[]) => void;
  categoriasFinanceiras: { id: string; nome: string }[];
  disabled?: boolean;
}

interface SortableRowProps {
  mapeamento: MapeamentoConta;
  index: number;
  onUpdate: (id: string, updates: Partial<MapeamentoConta>) => void;
  onRemove: (id: string) => void;
  categoriasFinanceiras: { id: string; nome: string }[];
  disabled?: boolean;
}

function SortableRow({
  mapeamento,
  index,
  onUpdate,
  onRemove,
  categoriasFinanceiras,
  disabled,
}: SortableRowProps) {
  const [validando, setValidando] = useState(false);
  const [validado, setValidado] = useState<boolean | null>(null);

  const validarConta = async () => {
    setValidando(true);
    // Simulação de validação - substituir por chamada real
    await new Promise((resolve) => setTimeout(resolve, 800));
    setValidado(Math.random() > 0.3);
    setValidando(false);
  };

  return (
    <TableRow>
      <TableCell className="w-10">
        <Button
          variant="ghost"
          size="icon"
          className="cursor-grab"
          disabled={disabled}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </Button>
      </TableCell>
      <TableCell>
        <Select
          value={mapeamento.categoria_financeira_id}
          onValueChange={(value) =>
            onUpdate(mapeamento.id, {
              categoria_financeira_id: value,
              categoria_financeira_nome:
                categoriasFinanceiras.find((c) => c.id === value)?.nome || "",
            })
          }
          disabled={disabled}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {categoriasFinanceiras.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Select
          value={mapeamento.tipo_lancamento}
          onValueChange={(value) =>
            onUpdate(mapeamento.id, { tipo_lancamento: value as TipoLancamento })
          }
          disabled={disabled}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIPOS_LANCAMENTO.map((tipo) => (
              <SelectItem key={tipo.value} value={tipo.value}>
                {tipo.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Input
            value={mapeamento.conta_contabil_erp}
            onChange={(e) =>
              onUpdate(mapeamento.id, { conta_contabil_erp: e.target.value })
            }
            placeholder="Ex: 1.1.01.001"
            disabled={disabled}
            className="w-[150px]"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={validarConta}
            disabled={disabled || !mapeamento.conta_contabil_erp || validando}
          >
            {validando ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <AlertCircle className="h-4 w-4" />
              </motion.div>
            ) : validado === true ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : validado === false ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <Input
          value={mapeamento.historico_padrao}
          onChange={(e) =>
            onUpdate(mapeamento.id, { historico_padrao: e.target.value })
          }
          placeholder="Descrição do histórico"
          disabled={disabled}
          className="w-[200px]"
        />
      </TableCell>
      <TableCell>
        <Input
          value={mapeamento.centro_custo || ""}
          onChange={(e) =>
            onUpdate(mapeamento.id, { centro_custo: e.target.value })
          }
          placeholder="Opcional"
          disabled={disabled}
          className="w-[120px]"
        />
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(mapeamento.id)}
          disabled={disabled}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function MapeamentoTable({
  mapeamentos,
  onChange,
  categoriasFinanceiras,
  disabled,
}: MapeamentoTableProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const adicionarMapeamento = () => {
    const novoMapeamento: MapeamentoConta = {
      id: `temp-${Date.now()}`,
      categoria_financeira_id: "",
      categoria_financeira_nome: "",
      tipo_lancamento: "despesa",
      conta_contabil_erp: "",
      historico_padrao: "",
      centro_custo: "",
      ativo: true,
    };
    onChange([...mapeamentos, novoMapeamento]);
  };

  const atualizarMapeamento = (id: string, updates: Partial<MapeamentoConta>) => {
    onChange(
      mapeamentos.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const removerMapeamento = (id: string) => {
    onChange(mapeamentos.filter((m) => m.id !== id));
  };

  const sugerirMapeamentos = () => {
    // Simulação de sugestões baseadas em histórico
    const sugestoes: MapeamentoConta[] = [
      {
        id: `sugestao-1`,
        categoria_financeira_id: categoriasFinanceiras[0]?.id || "",
        categoria_financeira_nome: categoriasFinanceiras[0]?.nome || "",
        tipo_lancamento: "despesa" as const,
        conta_contabil_erp: "1.1.01.001",
        historico_padrao: "Despesa operacional",
        centro_custo: "01.001",
        ativo: true,
      },
      {
        id: `sugestao-2`,
        categoria_financeira_id: categoriasFinanceiras[1]?.id || "",
        categoria_financeira_nome: categoriasFinanceiras[1]?.nome || "",
        tipo_lancamento: "receita" as const,
        conta_contabil_erp: "2.1.01.001",
        historico_padrao: "Receita de vendas",
        centro_custo: "01.001",
        ativo: true,
      },
    ].filter((s) => s.categoria_financeira_id);

    onChange([...mapeamentos, ...sugestoes]);
    setShowConfirmDialog(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mapeamento de Contas</CardTitle>
              <CardDescription>
                Configure o mapeamento entre categorias financeiras e contas contábeis do ERP
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmDialog(true)}
                disabled={disabled}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Sugestão Automática
              </Button>
              <Button
                size="sm"
                onClick={adicionarMapeamento}
                disabled={disabled}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {mapeamentos.length === 0 ? (
            <Alert className="bg-muted/50">
              <AlertDescription className="text-center py-8">
                Nenhum mapeamento configurado. Clique em "Adicionar" ou use a
                "Sugestão Automática" para começar.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Categoria Financeira</TableHead>
                    <TableHead>Tipo Lançamento</TableHead>
                    <TableHead>Conta Contábil</TableHead>
                    <TableHead>Histórico Padrão</TableHead>
                    <TableHead>Centro de Custo</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mapeamentos.map((mapeamento, index) => (
                    <SortableRow
                      key={mapeamento.id}
                      mapeamento={mapeamento}
                      index={index}
                      onUpdate={atualizarMapeamento}
                      onRemove={removerMapeamento}
                      categoriasFinanceiras={categoriasFinanceiras}
                      disabled={disabled}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Total de mapeamentos:{" "}
              <Badge variant="secondary">{mapeamentos.length}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sugestão Automática</DialogTitle>
            <DialogDescription>
              Deseja adicionar sugestões de mapeamento baseadas no histórico de
              lançamentos?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={sugerirMapeamentos}>
              <Sparkles className="h-4 w-4 mr-2" />
              Adicionar Sugestões
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
