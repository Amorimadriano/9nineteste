import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Save,
  RotateCcw,
  Settings,
  Map,
  RefreshCw,
  History,
  Check,
  AlertCircle,
  Play,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ERPSelector } from "@/components/contabilidade/ERPSelector";
import { CredenciaisForm } from "@/components/contabilidade/CredenciaisForm";
import { MapeamentoTable } from "@/components/contabilidade/MapeamentoTable";
import { SincronizacaoStatus } from "@/components/contabilidade/SincronizacaoStatus";
import { LogSincronizacao } from "@/components/contabilidade/LogSincronizacao";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type {
  TipoERP,
  CredenciaisERP,
  MapeamentoConta,
  ConfiguracaoIntegracao,
  LogSincronizacao as LogType,
  StatusSincronizacao,
  FrequenciaSincronizacao,
  TipoOperacao,
} from "@/types/contabilidade";
import { ERPS_SUPORTADOS, TIPOS_OPERACAO, FREQUENCIAS_SINCRONIZACAO } from "@/types/contabilidade";

const steps = [
  { id: 1, title: "Selecionar ERP", icon: BookOpen },
  { id: 2, title: "Credenciais", icon: Settings },
  { id: 3, title: "Mapeamento", icon: Map },
  { id: 4, title: "Revisão", icon: Check },
];

// Mock de categorias financeiras - substituir por dados reais da API
const categoriasFinanceirasMock = [
  { id: "1", nome: "Despesas Operacionais" },
  { id: "2", nome: "Receitas de Vendas" },
  { id: "3", nome: "Despesas Administrativas" },
  { id: "4", nome: "Receitas Financeiras" },
  { id: "5", nome: "Impostos" },
];

// Mock de logs - substituir por dados reais da API
const logsMock: LogType[] = [
  {
    id: "1",
    configuracao_id: "1",
    tipo_operacao: "exportar_contas_pagar",
    status: "sucesso",
    data_inicio: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    data_fim: new Date(Date.now() - 24 * 60 * 60 * 1000 + 5000).toISOString(),
    registros_processados: 15,
    registros_sucesso: 15,
    registros_erro: 0,
    mensagem: "Exportação concluída com sucesso",
  },
  {
    id: "2",
    configuracao_id: "1",
    tipo_operacao: "exportar_contas_receber",
    status: "sucesso",
    data_inicio: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    data_fim: new Date(Date.now() - 48 * 60 * 60 * 1000 + 8000).toISOString(),
    registros_processados: 23,
    registros_sucesso: 23,
    registros_erro: 0,
    mensagem: "Exportação concluída com sucesso",
  },
  {
    id: "3",
    configuracao_id: "1",
    tipo_operacao: "exportar_movimentacao_caixa",
    status: "erro",
    data_inicio: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    data_fim: new Date(Date.now() - 72 * 60 * 60 * 1000 + 3000).toISOString(),
    registros_processados: 45,
    registros_sucesso: 40,
    registros_erro: 5,
    mensagem: "Alguns registros não puderam ser exportados",
    detalhes: { erro: "Timeout na conexão com o ERP" },
  },
];

export default function ContabilidadeIntegracao() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("configuracoes");
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Wizard State
  const [selectedERP, setSelectedERP] = useState<TipoERP | null>(null);
  const [credenciais, setCredenciais] = useState<CredenciaisERP>({
    url_api: "",
    api_key: "",
    api_secret: "",
    usuario: "",
    senha: "",
    codigo_empresa: "",
    codigo_filial: "",
  });
  const [mapeamentos, setMapeamentos] = useState<MapeamentoConta[]>([]);
  const [sincronizacaoAutomatica, setSincronizacaoAutomatica] = useState(false);
  const [frequencia, setFrequencia] = useState<FrequenciaSincronizacao>("manual");

  // Sincronização State
  const [periodoInicio, setPeriodoInicio] = useState<Date | undefined>();
  const [periodoFim, setPeriodoFim] = useState<Date | undefined>();
  const [tiposOperacao, setTiposOperacao] = useState<TipoOperacao[]>([
    "exportar_contas_pagar",
    "exportar_contas_receber",
  ]);
  const [statusSincronizacao, setStatusSincronizacao] = useState<StatusSincronizacao>("pendente");
  const [progressoSincronizacao, setProgressoSincronizacao] = useState(0);

  // Config State
  const [configuracao, setConfiguracao] = useState<ConfiguracaoIntegracao | null>(null);

  // Logs
  const [logs, setLogs] = useState<LogType[]>(logsMock);

  const getProgressoWizard = () => {
    let progresso = 0;
    if (selectedERP) progresso += 25;
    if (credenciais.url_api && credenciais.codigo_empresa) progresso += 25;
    if (mapeamentos.length > 0) progresso += 25;
    if (configuracao) progresso += 25;
    return progresso;
  };

  const handleNextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSalvarConfiguracao = async () => {
    setIsLoading(true);
    // Simulação de salvamento - substituir por chamada real à API
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const novaConfiguracao: ConfiguracaoIntegracao = {
      id: "1",
      erp_id: selectedERP!,
      credenciais,
      mapeamentos,
      sincronizacao_automatica: sincronizacaoAutomatica,
      frequencia,
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setConfiguracao(novaConfiguracao);
    setIsLoading(false);
    toast({
      title: "Configuração salva com sucesso!",
      description: "A integração contábil foi configurada e está pronta para uso.",
    });
    setActiveTab("sincronizacao");
  };

  const handleSincronizar = async () => {
    if (!periodoInicio || !periodoFim) {
      toast({
        title: "Período obrigatório",
        description: "Selecione o período de sincronização",
        variant: "destructive",
      });
      return;
    }

    if (tiposOperacao.length === 0) {
      toast({
        title: "Tipo de operação obrigatório",
        description: "Selecione pelo menos um tipo de operação",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setStatusSincronizacao("processando");
    setProgressoSincronizacao(0);

    // Simulação de sincronização
    const interval = setInterval(() => {
      setProgressoSincronizacao((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 500);

    await new Promise((resolve) => setTimeout(resolve, 6000));
    clearInterval(interval);

    setStatusSincronizacao("sucesso");
    setIsLoading(false);
    toast({
      title: "Sincronização concluída!",
      description: `${tiposOperacao.length} operações sincronizadas com sucesso.`,
    });

    // Adicionar novo log
    const novoLog: LogType = {
      id: `${Date.now()}`,
      configuracao_id: configuracao?.id || "1",
      tipo_operacao: tiposOperacao[0],
      status: "sucesso",
      data_inicio: new Date().toISOString(),
      data_fim: new Date().toISOString(),
      registros_processados: 25,
      registros_sucesso: 25,
      registros_erro: 0,
      mensagem: "Sincronização manual executada com sucesso",
    };
    setLogs([novoLog, ...logs]);
  };

  const toggleTipoOperacao = (tipo: TipoOperacao) => {
    setTiposOperacao((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
  };

  const getPreviewCount = () => {
    // Simulação - substituir por lógica real
    return tiposOperacao.reduce((acc, tipo) => {
      switch (tipo) {
        case "exportar_contas_pagar":
          return acc + 15;
        case "exportar_contas_receber":
          return acc + 23;
        case "exportar_movimentacao_caixa":
          return acc + 45;
        case "importar_lancamentos_contabeis":
          return acc + 8;
        default:
          return acc;
      }
    }, 0);
  };

  const renderWizardStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Alert>
              <AlertDescription>
                Selecione o ERP que deseja integrar. Certifique-se de ter acesso
                às credenciais de API do sistema escolhido.
              </AlertDescription>
            </Alert>
            <ERPSelector
              erps={ERPS_SUPORTADOS}
              selectedERP={selectedERP}
              onSelect={setSelectedERP}
            />
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {selectedERP && (
              <CredenciaisForm
                erpTipo={selectedERP}
                credenciais={credenciais}
                onChange={setCredenciais}
              />
            )}
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <MapeamentoTable
              mapeamentos={mapeamentos}
              onChange={setMapeamentos}
              categoriasFinanceiras={categoriasFinanceirasMock}
            />
          </motion.div>
        );
      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Revisão da Configuração</CardTitle>
                <CardDescription>
                  Revise as configurações antes de salvar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">ERP Selecionado</p>
                    <p className="font-medium">
                      {ERPS_SUPORTADOS.find((e) => e.tipo === selectedERP)?.nome}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">URL da API</p>
                    <p className="font-medium truncate">{credenciais.url_api}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Código da Empresa</p>
                    <p className="font-medium">{credenciais.codigo_empresa}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Mapeamentos</p>
                    <p className="font-medium">{mapeamentos.length} contas</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sync-auto"
                      checked={sincronizacaoAutomatica}
                      onCheckedChange={(checked) =>
                        setSincronizacaoAutomatica(checked as boolean)
                      }
                    />
                    <Label htmlFor="sync-auto">
                      Ativar sincronização automática
                    </Label>
                  </div>

                  {sincronizacaoAutomatica && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="pl-6 space-y-2"
                    >
                      <Label>Frequência</Label>
                      <Select
                        value={frequencia}
                        onValueChange={(value) =>
                          setFrequencia(value as FrequenciaSincronizacao)
                        }
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FREQUENCIAS_SINCRONIZACAO.map((f) => (
                            <SelectItem key={f.value} value={f.value}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Integração Contábil
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure a integração com sistemas ERP para sincronização contábil automática
          </p>
        </div>
        {configuracao && (
          <Badge variant="default" className="bg-green-500/10 text-green-600">
            Configurado
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="configuracoes" className="gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="mapeamento" className="gap-2">
            <Map className="h-4 w-4" />
            Mapeamento
          </TabsTrigger>
          <TabsTrigger value="sincronizacao" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Sincronização
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* Tab: Configurações (Wizard) */}
        <TabsContent value="configuracoes" className="space-y-6">
          {!configuracao ? (
            <>
              {/* Progress Steps */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Progresso da configuração
                      </span>
                      <span className="text-sm font-medium">
                        {getProgressoWizard()}%
                      </span>
                    </div>
                    <Progress value={getProgressoWizard()} className="h-2" />

                    <div className="flex items-center justify-between pt-4">
                      {steps.map((step, index) => {
                        const StepIcon = step.icon;
                        const isActive = step.id === currentStep;
                        const isCompleted = step.id < currentStep;

                        return (
                          <div key={step.id} className="flex items-center"
>
                            <button
                              onClick={() => setCurrentStep(step.id)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : isCompleted
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              <StepIcon className="h-4 w-4" />
                              <span className="hidden sm:inline text-sm font-medium">
                                {step.title}
                              </span>
                            </button>
                            {index < steps.length - 1 && (
                              <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step Content */}
              <AnimatePresence mode="wait">{renderWizardStep()}</AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={currentStep === 1}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                {currentStep === steps.length ? (
                  <Button
                    onClick={handleSalvarConfiguracao}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Salvar Configuração
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNextStep}
                    disabled={
                      (currentStep === 1 && !selectedERP) ||
                      (currentStep === 2 &&
                        (!credenciais.url_api || !credenciais.codigo_empresa))
                    }
                    className="gap-2"
                  >
                    Próximo
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  Configuração Concluída
                </CardTitle>
                <CardDescription>
                  A integração contábil está configurada e ativa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">ERP</p>
                    <p className="font-medium">
                      {ERPS_SUPORTADOS.find((e) => e.tipo === configuracao.erp_id)?.nome}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Sincronização</p>
                    <p className="font-medium">
                      {configuracao.sincronizacao_automatica
                        ? `Automática (${configuracao.frequencia})`
                        : "Manual"}
                    </p>
                  </div>
                </div>

                <Alert className="bg-blue-500/10 border-blue-500/30">
                  <AlertDescription className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-500" />
                    Acesse a aba "Sincronização" para executar manualmente ou
                    acompanhar o status.
                  </AlertDescription>
                </Alert>

                <Button
                  variant="outline"
                  onClick={() => {
                    setConfiguracao(null);
                    setCurrentStep(1);
                  }}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reconfigurar
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Mapeamento */}
        <TabsContent value="mapeamento">
          <MapeamentoTable
            mapeamentos={mapeamentos}
            onChange={setMapeamentos}
            categoriasFinanceiras={categoriasFinanceirasMock}
            disabled={!configuracao}
          />
        </TabsContent>

        {/* Tab: Sincronização */}
        <TabsContent value="sincronizacao" className="space-y-6">
          <SincronizacaoStatus
            status={statusSincronizacao}
            frequencia={configuracao?.frequencia || "manual"}
            registrosHoje={logs.filter(
              (l) =>
                l.status === "sucesso" &&
                new Date(l.data_inicio).toDateString() === new Date().toDateString()
            ).length}
            erpsConectados={configuracao ? 1 : 0}
            progresso={progressoSincronizacao}
            onSincronizar={configuracao ? handleSincronizar : undefined}
            isLoading={isLoading}
          />

          <Card>
            <CardHeader>
              <CardTitle>Executar Sincronização Manual</CardTitle>
              <CardDescription>
                Selecione o período e os tipos de operação para sincronizar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!configuracao ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    Configure a integração contábil primeiro antes de executar
                    sincronizações.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Período de Início</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {periodoInicio
                              ? format(periodoInicio, "dd/MM/yyyy")
                              : "Selecionar data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={periodoInicio}
                            onSelect={setPeriodoInicio}
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Período de Fim</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {periodoFim
                              ? format(periodoFim, "dd/MM/yyyy")
                              : "Selecionar data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={periodoFim}
                            onSelect={setPeriodoFim}
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Tipos de Operação</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {TIPOS_OPERACAO.map((tipo) => (
                        <div key={tipo.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={tipo.value}
                            checked={tiposOperacao.includes(tipo.value)}
                            onCheckedChange={() => toggleTipoOperacao(tipo.value)}
                          />
                          <Label htmlFor={tipo.value}>{tipo.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {tiposOperacao.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-muted/50 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Preview</p>
                          <p className="text-sm text-muted-foreground">
                            {getPreviewCount()} registros serão sincronizados
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleSincronizar}
                        disabled={isLoading || !periodoInicio || !periodoFim}
                        className="gap-2"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            Executar Agora
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Histórico */}
        <TabsContent value="historico">
          <LogSincronizacao
            logs={logs}
            onReexecutar={(logId) => {
              toast({
                title: "Reexecutando sincronização",
                description: `ID: ${logId}`,
              });
            }}
            onDownloadLog={(logId) => {
              toast({
                title: "Download iniciado",
                description: `Log ${logId} será baixado em breve.`,
              });
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
