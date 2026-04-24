import { useState, useEffect } from "react";
import { exportarPdfSimuladorIbsCbs } from "@/lib/pdfSimuladorIbsCbsExport";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Building2,
  Percent,
  Clock,
  FileText,
  Download,
  Loader2,
} from "lucide-react";

interface SimulacaoDados {
  empresa: string;
  setor: string;
  regimeAtual: "simples" | "presumido" | "real";
  faturamentoMensal: number;
  faturamentoAnual: number;
  cargaAtual: number;
  aliquotaAtual: number;
  cargaNova: number;
  variacao: number;
  impactoSplit: number;
  capitalGiroAnual: number;
  prazoRecebimento: number;
}

interface ParecerExecutivo {
  texto: string;
  carregando: boolean;
  erro?: string;
}

const setores = [
  { value: "servicos", label: "Serviços", aliquotaReferencia: 5.5 },
  { value: "comercio", label: "Comércio", aliquotaReferencia: 7.5 },
  { value: "industria", label: "Indústria", aliquotaReferencia: 8.5 },
];

const regimes = [
  { value: "simples", label: "Simples Nacional" },
  { value: "presumido", label: "Lucro Presumido" },
  { value: "real", label: "Lucro Real" },
];

export default function SimuladorIBSCBS() {
  const { toast } = useToast();
  const [tab, setTab] = useState("simulador");
  const [carregando, setCarregando] = useState(false);
  const [carregandoParecer, setCarregandoParecer] = useState(false);
  const [resultado, setResultado] = useState<SimulacaoDados | null>(null);
  const [parecer, setParecer] = useState<ParecerExecutivo>({ texto: "", carregando: false });

  // Form inputs
  const [empresa, setEmpresa] = useState("");
  const [setor, setSetor] = useState("servicos");
  const [regime, setRegime] = useState<"simples" | "presumido" | "real">("simples");
  const [faturamento, setFaturamento] = useState(50000);
  const [prazoRecebimento, setPrazoRecebimento] = useState(30);

  const calcular = async () => {
    setCarregando(true);

    // Calcular alíquota atual estimada
    const aliquotasRegime: Record<string, number> = {
      simples: setor === "servicos" ? 10 : setor === "comercio" ? 11 : 12,
      presumido: setor === "servicos" ? 16 : setor === "comercio" ? 18 : 20,
      real: setor === "servicos" ? 22 : setor === "comercio" ? 25 : 28,
    };

    const aliquotaAtual = aliquotasRegime[regime];
    const cargaAtual = faturamento * (aliquotaAtual / 100);
    const cargaNova = faturamento * 0.265; // IBS + CBS = 26,5%
    const variacao = ((cargaNova - cargaAtual) / cargaAtual) * 100;

    // Split Payment impact (25% do valor como exemplo)
    const impactoSplit = faturamento * 0.25;
    const capitalGiroAnual = impactoSplit * 12;

    const dados: SimulacaoDados = {
      empresa,
      setor: setores.find((s) => s.value === setor)?.label || "",
      regimeAtual: regime,
      faturamentoMensal: faturamento,
      faturamentoAnual: faturamento * 12,
      cargaAtual,
      aliquotaAtual,
      cargaNova,
      variacao,
      impactoSplit,
      capitalGiroAnual,
      prazoRecebimento,
    };

    setResultado(dados);
    setCarregando(false);

    // Gerar parecer automaticamente
    gerarParecer(dados);
  };

  const gerarParecer = async (dados: SimulacaoDados) => {
    setCarregandoParecer(true);
    setParecer({ texto: "", carregando: true });

    try {
      const { data, error } = await supabase.functions.invoke("parecer-ibs-cbs", {
        body: { dados },
      });

      if (error) throw error;

      setParecer({ texto: data.parecer || "", carregando: false });
    } catch (err: any) {
      setParecer({
        texto: "",
        carregando: false,
        erro: err.message || "Erro ao gerar parecer. Tente novamente.",
      });
      toast({
        title: "Erro",
        description: "Não foi possível gerar o parecer executivo.",
        variant: "destructive",
      });
    } finally {
      setCarregandoParecer(false);
    }
  };

  // Buscar dados da empresa para o cabeçalho do PDF
  const [empresaData, setEmpresaData] = useState<any>(null);
  useEffect(() => {
    const fetchEmpresa = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("empresa")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setEmpresaData(data);
    };
    fetchEmpresa();
  }, []);

  const exportarPDF = () => {
    if (!resultado) return;
    exportarPdfSimuladorIbsCbs(resultado, parecer.texto, empresaData);
    toast({
      title: "PDF exportado",
      description: "O relatório da simulação IBS/CBS foi baixado com sucesso.",
    });
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Simulador IBS/CBS + Split Payment
        </h1>
        <p className="text-muted-foreground">
          Calcule o impacto da Reforma Tributária na sua empresa com análise de IA
        </p>
      </motion.div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="simulador">Simulador</TabsTrigger>
          <TabsTrigger value="sobre">Sobre a Reforma</TabsTrigger>
        </TabsList>

        <TabsContent value="simulador" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulário */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Dados da Empresa
                </CardTitle>
                <CardDescription>
                  Preencha os dados para simular o impacto da Reforma Tributária
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="empresa">Nome da Empresa</Label>
                  <Input
                    id="empresa"
                    placeholder="Sua empresa"
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Setor de Atividade</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {setores.map((s) => (
                      <Button
                        key={s.value}
                        type="button"
                        variant={setor === s.value ? "default" : "outline"}
                        onClick={() => setSetor(s.value)}
                        className="text-xs"
                      >
                        {s.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Regime Tributário Atual</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {regimes.map((r) => (
                      <Button
                        key={r.value}
                        type="button"
                        variant={regime === r.value ? "default" : "outline"}
                        onClick={() => setRegime(r.value as any)}
                        className="text-xs"
                      >
                        {r.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="faturamento">
                    Faturamento Mensal Médio: {formatarMoeda(faturamento)}
                  </Label>
                  <Slider
                    id="faturamento"
                    min={10000}
                    max={500000}
                    step={5000}
                    value={[faturamento]}
                    onValueChange={(v) => setFaturamento(v[0])}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prazo">
                    Prazo Médio de Recebimento: {prazoRecebimento} dias
                  </Label>
                  <Slider
                    id="prazo"
                    min={0}
                    max={120}
                    step={5}
                    value={[prazoRecebimento]}
                    onValueChange={(v) => setPrazoRecebimento(v[0])}
                  />
                </div>

                <Button
                  onClick={calcular}
                  disabled={carregando}
                  className="w-full"
                  size="lg"
                >
                  {carregando ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Calculator className="mr-2 h-4 w-4" />
                  )}
                  Calcular Impacto
                </Button>
              </CardContent>
            </Card>

            {/* Resultados */}
            <AnimatePresence>
              {resultado && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  {/* Resumo */}
                  <Card className={resultado.variacao > 0 ? "border-red-200" : "border-green-200"}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {resultado.variacao > 0 ? (
                          <TrendingUp className="h-5 w-5 text-red-500" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-green-500" />
                        )}
                        Resultado da Simulação
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Carga Atual (mês)</p>
                          <p className="text-2xl font-bold">{formatarMoeda(resultado.cargaAtual)}</p>
                          <p className="text-xs text-muted-foreground">
                            Alíquota estimada: {resultado.aliquotaAtual}%
                          </p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Carga Nova IBS/CBS (mês)</p>
                          <p className="text-2xl font-bold">{formatarMoeda(resultado.cargaNova)}</p>
                          <p className="text-xs text-muted-foreground">Alíquota: 26,5%</p>
                        </div>
                      </div>

                      <div
                        className={`p-4 rounded-lg ${
                          resultado.variacao > 0 ? "bg-red-50" : "bg-green-50"
                        }`}
                      >
                        <p className="text-sm font-medium">Variação da Carga Tributária</p>
                        <p
                          className={`text-3xl font-bold ${
                            resultado.variacao > 0 ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {resultado.variacao > 0 ? "+" : ""}
                          {resultado.variacao.toFixed(2)}%
                        </p>
                        <p className="text-sm mt-1">
                          {resultado.variacao > 0
                            ? "Aumento estimado na carga tributária"
                            : "Redução estimada na carga tributária"}
                        </p>
                      </div>

                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-amber-900">Impacto Split Payment</p>
                            <p className="text-sm text-amber-800">
                              Retenção estimada no caixa: {formatarMoeda(resultado.impactoSplit)}/mês
                            </p>
                            <p className="text-sm text-amber-800">
                              Capital de giro comprometido (12 meses):{" "}
                              {formatarMoeda(resultado.capitalGiroAnual)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Parecer Executivo */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Parecer Executivo (IA)
                      </CardTitle>
                      <CardDescription>
                        Análise gerada por inteligência artificial
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {carregandoParecer ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : parecer.erro ? (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-800">{parecer.erro}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => gerarParecer(resultado)}
                            className="mt-2"
                          >
                            Tentar novamente
                          </Button>
                        </div>
                      ) : (
                        <div className="prose prose-sm max-w-none">
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {parecer.texto || "Aguardando geração do parecer..."}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Ações */}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={exportarPDF} className="flex-1">
                      <FileText className="mr-2 h-4 w-4" />
                      Exportar PDF
                    </Button>
                    <Button variant="outline" onClick={exportarPDF} className="flex-1">
                      <Download className="mr-2 h-4 w-4" />
                      Baixar Excel
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="sobre" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Entenda a Reforma Tributária</CardTitle>
              <CardDescription>
                Principais mudanças introduzidas pela EC 132/2023 e LC 214/2025
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Percent className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">IBS e CBS</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    O Imposto sobre Bens e Serviços (IBS) e a Contribuição sobre Bens e
                    Serviços (CBS) substituirão PIS, COFINS, ICMS e ISS. A alíquota
                    combinada será de 26,5%.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Split Payment</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    O mecanismo de split payment fará a retenção do tributo no momento
                    do pagamento, impactando diretamente o fluxo de caixa da empresa.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Impacto por Setor</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Cada setor será impactado de forma diferente. Serviços tendem a ter
                    aumento de carga, enquanto comércio e indústria podem ter redução.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Capital de Giro</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    O split payment reduzirá o capital de giro disponível, pois parte
                    do dinheiro será retido no momento do recebimento.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Este simulador fornece estimativas baseadas em
                  alíquotas médias. Consulte um contador para análise detalhada do seu
                  caso específico.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
