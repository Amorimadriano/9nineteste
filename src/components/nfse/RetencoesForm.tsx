/**
 * Formulário de Retenções para NFS-e
 * PIS, COFINS, INSS, IR, CSLL
 * Com cálculo automático baseado no valor do serviço
 */
import { useEffect, useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RetencoesFormData, ALIQUOTAS_CUMULATIVAS, ALIQUOTAS_LUCRO_PRESUMIDO } from "@/types/nfse-ui";
import { formatCurrency } from "@/lib/nfse-utils";
import { Calculator, Percent, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface MoneyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
}

function MoneyInput({ value, onChange, placeholder = "0,00", disabled }: MoneyInputProps) {
  const [displayValue, setDisplayValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Sincroniza displayValue quando o value mudar externamente
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value > 0 ? formatCurrency(value) : "");
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d,]/g, "");
    setDisplayValue(raw);

    // Converter para número
    const normalized = raw.replace(",", ".");
    const num = parseFloat(normalized) || 0;
    onChange(num);
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Mostra só o número sem formatação para facilitar edição
    if (value > 0) {
      setDisplayValue(value.toString().replace(".", ","));
    } else {
      setDisplayValue("");
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Formata o valor ao sair
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
    />
  );
}

interface RetencoesFormProps {
  value: RetencoesFormData;
  onChange: (value: RetencoesFormData) => void;
  baseCalculo: number;
}

export function RetencoesForm({ value, onChange, baseCalculo }: RetencoesFormProps) {
  // Estado para controlar se o cálculo automático está ativo
  const calcularValorRetencao = useCallback((aliquota: number, base: number): number => {
    return (base * aliquota) / 100;
  }, []);

  // Cálculo automático quando baseCalculo muda
  useEffect(() => {
    if (baseCalculo <= 0) return;

    // Calcula valores automaticamente com base nas alíquotas configuradas
    const novoPis = calcularValorRetencao(value.aliquota_pis, baseCalculo);
    const novoCofins = calcularValorRetencao(value.aliquota_cofins, baseCalculo);
    const novoInss = calcularValorRetencao(value.aliquota_inss, baseCalculo);
    const novoIr = calcularValorRetencao(value.aliquota_ir, baseCalculo);
    const novoCsll = calcularValorRetencao(value.aliquota_csll, baseCalculo);

    // Só atualiza se houver mudança significativa (evita loop)
    const tolerancia = 0.01;
    const mudouPis = Math.abs(novoPis - value.pis) > tolerancia;
    const mudouCofins = Math.abs(novoCofins - value.cofins) > tolerancia;
    const mudouInss = Math.abs(novoInss - value.inss) > tolerancia;
    const mudouIr = Math.abs(novoIr - value.ir) > tolerancia;
    const mudouCsll = Math.abs(novoCsll - value.csll) > tolerancia;

    if (mudouPis || mudouCofins || mudouInss || mudouIr || mudouCsll) {
      onChange({
        ...value,
        pis: mudouPis ? novoPis : value.pis,
        cofins: mudouCofins ? novoCofins : value.cofins,
        inss: mudouInss ? novoInss : value.inss,
        ir: mudouIr ? novoIr : value.ir,
        csll: mudouCsll ? novoCsll : value.csll,
      });
    }
  }, [baseCalculo, value.aliquota_pis, value.aliquota_cofins, value.aliquota_inss, value.aliquota_ir, value.aliquota_csll]);

  const handleAliquotaChange = (campo: keyof RetencoesFormData, valor: string) => {
    const aliquota = parseFloat(valor) || 0;
    const valorCalculado = calcularValorRetencao(aliquota, baseCalculo);
    const campoValor = campo.replace("aliquota_", "") as keyof RetencoesFormData;

    onChange({
      ...value,
      [campo]: aliquota,
      [campoValor]: valorCalculado,
    });
  };

  const aplicarAliquotasPadrao = () => {
    const novoPis = calcularValorRetencao(ALIQUOTAS_CUMULATIVAS.pis, baseCalculo);
    const novoCofins = calcularValorRetencao(ALIQUOTAS_CUMULATIVAS.cofins, baseCalculo);
    const novoInss = calcularValorRetencao(ALIQUOTAS_CUMULATIVAS.inss, baseCalculo);

    onChange({
      ...value,
      aliquota_pis: ALIQUOTAS_CUMULATIVAS.pis,
      aliquota_cofins: ALIQUOTAS_CUMULATIVAS.cofins,
      aliquota_inss: ALIQUOTAS_CUMULATIVAS.inss,
      pis: novoPis,
      cofins: novoCofins,
      inss: novoInss,
    });
  };

  const aplicarAliquotasNaoCumulativas = () => {
    const novoPis = calcularValorRetencao(1.65, baseCalculo);
    const novoCofins = calcularValorRetencao(7.6, baseCalculo);
    const novoInss = calcularValorRetencao(11, baseCalculo);

    onChange({
      ...value,
      aliquota_pis: 1.65,
      aliquota_cofins: 7.6,
      aliquota_inss: 11,
      pis: novoPis,
      cofins: novoCofins,
      inss: novoInss,
    });
  };

  const aplicarLucroPresumido = () => {
    // Lucro Presumido: IRPJ e CSLL têm base de 8% sobre receita
    // PIS/COFINS: incidem sobre receita total
    const baseIrrfCsll = baseCalculo * 0.08;
    const novoPis = calcularValorRetencao(ALIQUOTAS_LUCRO_PRESUMIDO.pis, baseCalculo);
    const novoCofins = calcularValorRetencao(ALIQUOTAS_LUCRO_PRESUMIDO.cofins, baseCalculo);
    const novoIr = (baseIrrfCsll * 15) / 100; // 8% base * 15% = 1.2% effective
    const novoCsll = (baseIrrfCsll * 13) / 100; // 8% base * 13% = 1.04% effective

    onChange({
      ...value,
      aliquota_pis: ALIQUOTAS_LUCRO_PRESUMIDO.pis,
      aliquota_cofins: ALIQUOTAS_LUCRO_PRESUMIDO.cofins,
      aliquota_inss: 0,
      aliquota_ir: 15, // Mostrar alíquota real (15%) e não a efetiva (1.2%)
      aliquota_csll: 13, // Mostrar alíquota real (13%) e não a efetiva (1.04%)
      pis: novoPis,
      cofins: novoCofins,
      inss: 0,
      ir: novoIr,
      csll: novoCsll,
    });
  };

  const limparRetencoes = () => {
    onChange({
      ...value,
      pis: 0,
      cofins: 0,
      inss: 0,
      ir: 0,
      csll: 0,
    });
  };

  const calcularTotalRetencoes = (): number => {
    return value.pis + value.cofins + value.inss + value.ir + value.csll;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-5 w-5" />
          Retenções de Impostos (Opcional)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start justify-between">
          <p className="text-sm text-muted-foreground">
            Os valores são calculados automaticamente com base no valor do serviço.
            <span className="text-blue-600 font-medium">ISS deve ser informado manualmente conforme alíquota do município.</span>
          </p>
        </div>

        {/* Botões de ação rápida */}
        <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-sm font-medium text-blue-900 flex items-center">
            <Sparkles className="h-4 w-4 mr-1" />
            Cálculo automático:
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={aplicarAliquotasPadrao}
            className="text-xs"
            disabled={baseCalculo <= 0}
          >
            Simples Nacional (0,65% / 3%)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={aplicarAliquotasNaoCumulativas}
            className="text-xs"
            disabled={baseCalculo <= 0}
          >
            Lucro Real (1,65% / 7,6%)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={aplicarLucroPresumido}
            className="text-xs"
            disabled={baseCalculo <= 0}
          >
            Lucro Presumido (1,2% / 1,08%)
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={limparRetencoes}
            className="text-xs text-red-600 hover:text-red-700"
          >
            Limpar
          </Button>
        </div>

        {baseCalculo > 0 && (
          <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
            Base de cálculo: <strong>{formatCurrency(baseCalculo)}</strong>
          </div>
        )}

        {/* PIS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="aliquota_pis" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Alíquota PIS (%)
            </Label>
            <Input
              id="aliquota_pis"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={value.aliquota_pis}
              onChange={(e) => handleAliquotaChange("aliquota_pis", e.target.value)}
              placeholder="0,65"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pis">Valor PIS (R$)</Label>
            <MoneyInput
              value={value.pis}
              onChange={(v) => onChange({ ...value, pis: v })}
              placeholder="0,00"
            />
          </div>
        </div>

        {/* COFINS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="aliquota_cofins" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Alíquota COFINS (%)
            </Label>
            <Input
              id="aliquota_cofins"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={value.aliquota_cofins}
              onChange={(e) => handleAliquotaChange("aliquota_cofins", e.target.value)}
              placeholder="3,00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cofins">Valor COFINS (R$)</Label>
            <MoneyInput
              value={value.cofins}
              onChange={(v) => onChange({ ...value, cofins: v })}
              placeholder="0,00"
            />
          </div>
        </div>

        {/* INSS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="aliquota_inss" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Alíquota INSS (%)
            </Label>
            <Input
              id="aliquota_inss"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={value.aliquota_inss}
              onChange={(e) => handleAliquotaChange("aliquota_inss", e.target.value)}
              placeholder="11,00"
            />
            <p className="text-xs text-muted-foreground">Aplica-se para serviços de cooperativas</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="inss">Valor INSS (R$)</Label>
            <MoneyInput
              value={value.inss}
              onChange={(v) => onChange({ ...value, inss: v })}
              placeholder="0,00"
            />
          </div>
        </div>

        {/* IR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="aliquota_ir" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Alíquota IR (%)
            </Label>
            <Input
              id="aliquota_ir"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={value.aliquota_ir}
              onChange={(e) => handleAliquotaChange("aliquota_ir", e.target.value)}
              placeholder="1,50"
            />
            <p className="text-xs text-muted-foreground">Retenção de IR quando aplicável</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ir">Valor IR (R$)</Label>
            <MoneyInput
              value={value.ir}
              onChange={(v) => onChange({ ...value, ir: v })}
              placeholder="0,00"
            />
          </div>
        </div>

        {/* CSLL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="aliquota_csll" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Alíquota CSLL (%)
            </Label>
            <Input
              id="aliquota_csll"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={value.aliquota_csll}
              onChange={(e) => handleAliquotaChange("aliquota_csll", e.target.value)}
              placeholder="1,00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="csll">Valor CSLL (R$)</Label>
            <MoneyInput
              value={value.csll}
              onChange={(v) => onChange({ ...value, csll: v })}
              placeholder="0,00"
            />
          </div>
        </div>

        {/* Total de Retenções */}
        <div className="bg-primary/10 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total de Retenções:</span>
            <span className="text-xl font-bold text-primary">
              {formatCurrency(calcularTotalRetencoes())}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
