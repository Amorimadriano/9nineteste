/**
 * Formulário de Serviço para NFS-e
 * Inclui cálculos automáticos de base, ISS e valor líquido
 */
import { useEffect, useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ITENS_LISTA_SERVICO, CNAES_PADRAO, ServicoFormData } from "@/types/nfse-ui";
import { formatCurrency } from "@/lib/nfse-utils";
import { useSugerirServico } from "@/hooks/useAiNFSe";
import { Button } from "@/components/ui/button";
import { Wand2, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MoneyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function MoneyInput({ value, onChange, placeholder = "0,00", disabled, className }: MoneyInputProps) {
  const [displayValue, setDisplayValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value > 0 ? formatCurrency(value) : "");
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d,]/g, "");
    setDisplayValue(raw);
    const normalized = raw.replace(",", ".");
    const num = parseFloat(normalized) || 0;
    onChange(num);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (value > 0) {
      setDisplayValue(value.toString().replace(".", ","));
    } else {
      setDisplayValue("");
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (value > 0) {
      setDisplayValue(formatCurrency(value));
    }
  };

  return (
    <Input
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  );
}

interface ServicoFormProps {
  value: ServicoFormData;
  onChange: (value: ServicoFormData) => void;
  errors?: Record<string, string>;
}

export function ServicoForm({ value, onChange, errors = {} }: ServicoFormProps) {
  const { toast } = useToast();
  const { sugerir, sugestao, isLoading: iaLoading, clear } = useSugerirServico();
  const [descricaoNatural, setDescricaoNatural] = useState("");

  const handleAnalisarIA = () => {
    if (!descricaoNatural.trim() || descricaoNatural.length < 10) {
      toast({ title: "Descrição muito curta", description: "Digite pelo menos 10 caracteres descrevendo o serviço.", variant: "destructive" });
      return;
    }
    sugerir(descricaoNatural);
  };

  // Aplica sugestão da IA quando disponível
  useEffect(() => {
    if (sugestao) {
      onChange({
        ...value,
        descricao: sugestao.sugestaoDescricao || value.descricao,
        item_lista_servico: sugestao.itemListaServico || value.item_lista_servico,
        cnae: sugestao.cnae || value.cnae,
        aliquota_iss: sugestao.aliquotaSugerida || value.aliquota_iss,
      });
      toast({
        title: `Sugestão aplicada (${sugestao.confianca === "alta" ? "Alta confiança" : sugestao.confianca === "media" ? "Média confiança" : "Baixa confiança"})`,
        description: `Item: ${sugestao.itemListaServico || "não identificado"} | CNAE: ${sugestao.cnae || "não identificado"}`,
      });
      clear();
    }
  }, [sugestao, onChange, value, toast, clear]);

  // Calcula valores automaticamente
  const calcularValores = useCallback(() => {
    const baseCalculo = Math.max(0, value.valor_bruto - value.deducoes);
    const valorISS = (baseCalculo * value.aliquota_iss) / 100;
    const valorLiquido = baseCalculo - valorISS;

    return {
      base_calculo: baseCalculo,
      valor_iss: valorISS,
      valor_liquido: valorLiquido,
    };
  }, [value.valor_bruto, value.deducoes, value.aliquota_iss]);

  // Atualiza valores calculados quando mudar campos
  useEffect(() => {
    const calculados = calcularValores();
    if (
      calculados.base_calculo !== value.base_calculo ||
      calculados.valor_iss !== value.valor_iss ||
      calculados.valor_liquido !== value.valor_liquido
    ) {
      onChange({
        ...value,
        ...calculados,
      });
    }
  }, [calcularValores, value, onChange]);

  const handleAliquotaChange = (inputValue: string) => {
    const valor = parseFloat(inputValue) || 0;
    onChange({ ...value, aliquota_iss: valor });
  };

  const handleItemListaServicoChange = (codigo: string) => {
    const item = ITENS_LISTA_SERVICO.find((i) => i.codigo === codigo);
    const aliquota = item?.aliquota_padrao || value.aliquota_iss;
    onChange({
      ...value,
      item_lista_servico: codigo,
      aliquota_iss: aliquota,
    });
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {/* Descrição Natural + Análise IA */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="descricao_natural">Descrição do Serviço (linguagem natural)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAnalisarIA}
              disabled={iaLoading || descricaoNatural.length < 10}
              className="gap-1"
            >
              {iaLoading ? (
                <><Loader2 className="h-3 w-3 animate-spin" /> Analisando...</>
              ) : (
                <><Wand2 className="h-3 w-3" /> Analisar com IA</>
              )}
            </Button>
          </div>
          <Textarea
            id="descricao_natural"
            value={descricaoNatural}
            onChange={(e) => setDescricaoNatural(e.target.value)}
            placeholder="Ex: 'Desenvolvi um site de e-commerce para cliente com checkout integrado'"
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            💡 Descreva o serviço em linguagem natural e clique em "Analisar com IA" para sugerir códigos automaticamente.
          </p>
        </div>

        {/* Descrição do Serviço */}
        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição do Serviço *</Label>
          <Textarea
            id="descricao"
            value={value.descricao}
            onChange={(e) => onChange({ ...value, descricao: e.target.value })}
            placeholder="Descreva detalhadamente o serviço prestado..."
            rows={4}
            className={errors.descricao ? "border-red-500" : ""}
          />
          {errors.descricao && (
            <p className="text-sm text-red-500">{errors.descricao}</p>
          )}
        </div>

        {/* Item da Lista de Serviços */}
        <div className="space-y-2">
          <Label htmlFor="item_lista_servico">Item da Lista de Serviços (LC 116) *</Label>
          <Select
            value={value.item_lista_servico}
            onValueChange={handleItemListaServicoChange}
          >
            <SelectTrigger className={errors.item_lista_servico ? "border-red-500" : ""}>
              <SelectValue placeholder="Selecione o item da lista de serviços" />
            </SelectTrigger>
            <SelectContent>
              {ITENS_LISTA_SERVICO.map((item) => (
                <SelectItem key={item.codigo} value={item.codigo}>
                  {item.codigo} - {item.descricao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.item_lista_servico && (
            <p className="text-sm text-red-500">{errors.item_lista_servico}</p>
          )}
        </div>

        {/* CNAE */}
        <div className="space-y-2">
          <Label htmlFor="cnae">CNAE</Label>
          <Select
            value={value.cnae || ""}
            onValueChange={(cnae) => onChange({ ...value, cnae })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o CNAE (opcional)" />
            </SelectTrigger>
            <SelectContent>
              {CNAES_PADRAO.map((cnae) => (
                <SelectItem key={cnae.codigo} value={cnae.codigo}>
                  {cnae.codigo} - {cnae.descricao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Código de Tributação */}
        <div className="space-y-2">
          <Label htmlFor="codigo_tributacao">Código de Tributação Municipal</Label>
          <Input
            id="codigo_tributacao"
            value={value.codigo_tributacao || ""}
            onChange={(e) => onChange({ ...value, codigo_tributacao: e.target.value })}
            placeholder="Código de tributação no município do prestador"
          />
        </div>

        {/* Valores - Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Valor Bruto */}
          <div className="space-y-2">
            <Label htmlFor="valor_bruto">Valor Bruto (R$) *</Label>
            <MoneyInput
              value={value.valor_bruto}
              onChange={(v) => onChange({ ...value, valor_bruto: v })}
              placeholder="0,00"
              className={errors.valor_bruto ? "border-red-500" : ""}
            />
            {errors.valor_bruto && (
              <p className="text-sm text-red-500">{errors.valor_bruto}</p>
            )}
          </div>

          {/* Deduções */}
          <div className="space-y-2">
            <Label htmlFor="deducoes">Deduções (R$)</Label>
            <MoneyInput
              value={value.deducoes}
              onChange={(v) => onChange({ ...value, deducoes: v })}
              placeholder="0,00"
            />
          </div>

          {/* Base de Cálculo (Calculado) */}
          <div className="space-y-2">
            <Label htmlFor="base_calculo">Base de Cálculo (R$)</Label>
            <MoneyInput
              value={value.base_calculo}
              onChange={() => {}}
              placeholder="0,00"
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Calculado automaticamente: Valor Bruto - Deduções
            </p>
          </div>

          {/* Alíquota ISS */}
          <div className="space-y-2">
            <Label htmlFor="aliquota_iss">Alíquota ISS (%)</Label>
            <Input
              id="aliquota_iss"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={value.aliquota_iss}
              onChange={(e) => handleAliquotaChange(e.target.value)}
              placeholder="0,00"
            />
          </div>
        </div>

        {/* ISS Retido */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="iss_retido"
            checked={value.iss_retido}
            onCheckedChange={(checked) => onChange({ ...value, iss_retido: checked as boolean })}
          />
          <Label htmlFor="iss_retido" className="cursor-pointer">
            ISS Retido (tomador é responsável pelo recolhimento)
          </Label>
        </div>

        {/* Valores Calculados - Resumo */}
        <div className="bg-muted rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Resumo dos Valores</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Valor do ISS:</p>
              <p className="text-lg font-semibold">{formatCurrency(value.valor_iss)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Valor Líquido:</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(value.valor_liquido)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
