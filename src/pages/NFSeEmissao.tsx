/**
 * Página de Emissão de NFS-e
 * Interface principal para emissão de notas fiscais de serviço
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Bypass typing for tables not present in generated types
const db: any = supabase;
import {
  TomadorForm,
  ServicoForm,
  RetencoesForm,
  NotaPreview,
  NumeroNotaDisplay,
  CertificadoStatus,
  CertificadoConfigModal,
} from "@/components/nfse";
import {
  TomadorFormData,
  ServicoFormData,
  RetencoesFormData,
  NFSeFormData,
  TOMADOR_INICIAL,
  SERVICO_INICIAL,
  RETENCOES_INICIAL,
  statusCores,
} from "@/types/nfse-ui";
import { formatCurrency, formatDate, gerarNumeroNota } from "@/lib/nfse-utils";
import {
  FileText,
  Save,
  Send,
  History,
  DraftingCompass,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Loader2,
  RotateCcw,
} from "lucide-react";

// Interface para rascunho salvo
interface RascunhoNFS {
  id: string;
  data: NFSeFormData;
  created_at: string;
}

// Interface para nota recente
interface NotaRecente {
  id: string;
  numero_nota: string;
  status: string;
  tomador_nome: string;
  valor_total: number;
  data_emissao: string;
}

export default function NFSeEmissao() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Estados do formulário
  const [tomador, setTomador] = useState<TomadorFormData>(TOMADOR_INICIAL);
  const [servico, setServico] = useState<ServicoFormData>(SERVICO_INICIAL);
  const [retencoes, setRetencoes] = useState<RetencoesFormData>(RETENCOES_INICIAL);

  // Estados da UI
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState("nova");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Dados de suporte
  const [rascunhos, setRascunhos] = useState<RascunhoNFS[]>([]);
  const [notasRecentes, setNotasRecentes] = useState<NotaRecente[]>([]);
  const [loadingRascunhos, setLoadingRascunhos] = useState(false);
  const [loadingRecentes, setLoadingRecentes] = useState(false);
  const [certificado, setCertificado] = useState<{
    id: string;
    nome: string;
    valido_ate: string;
    ativo: boolean;
    arquivo_path?: string;
  } | null>(null);
  const [numeroNota, setNumeroNota] = useState(gerarNumeroNota());
  const [modalCertificadoAberto, setModalCertificadoAberto] = useState(false);

  // Carrega rascunhos salvos
  const carregarRascunhos = useCallback(async () => {
    if (!user?.id) return;
    setLoadingRascunhos(true);
    try {
      const { data, error } = await (supabase as any)
        .from("nfse_rascunhos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      const rascunhosFormatados: RascunhoNFS[] =
        data?.map((r: any) => ({
          id: r.id,
          data: r.dados as NFSeFormData,
          created_at: r.created_at,
        })) || [];

      setRascunhos(rascunhosFormatados);
    } catch (error) {
      console.error("Erro ao carregar rascunhos:", error);
    } finally {
      setLoadingRascunhos(false);
    }
  }, [user?.id]);

  // Carrega notas recentes
  const carregarNotasRecentes = useCallback(async () => {
    if (!user?.id) return;
    setLoadingRecentes(true);
    try {
      const { data, error } = await db
        .from("notas_fiscais_servico")
        .select("id, numero_nota, status, cliente_nome, valor_servico, data_emissao")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      const recentes: NotaRecente[] =
        data?.map((n: any) => ({
          id: n.id,
          numero_nota: n.numero_nota || "-",
          status: n.status,
          tomador_nome: n.cliente_nome,
          valor_total: n.valor_servico || 0,
          data_emissao: n.data_emissao,
        })) || [];

      setNotasRecentes(recentes);
    } catch (error) {
      console.error("Erro ao carregar notas recentes:", error);
    } finally {
      setLoadingRecentes(false);
    }
  }, [user?.id]);

  // Carrega certificado ativo
  const carregarCertificado = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from("certificados_nfse")
        .select("id, nome, valido_ate, ativo, arquivo_path")
        .eq("user_id", user.id)
        .eq("ativo", true)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setCertificado(data);
      }
    } catch (error) {
      console.error("Erro ao carregar certificado:", error);
    }
  }, [user?.id]);

  // Carrega dados iniciais
  useEffect(() => {
    carregarRascunhos();
    carregarNotasRecentes();
    carregarCertificado();
  }, [carregarRascunhos, carregarNotasRecentes, carregarCertificado]);

  // Autosave a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === "nova" && (tomador.razao_social || servico.descricao)) {
        salvarRascunhoAutomatico();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [activeTab, tomador, servico, retencoes]);

  // Validação do formulário
  const validarFormulario = (): boolean => {
    const errors: Record<string, string> = {};

    // Validação do Tomador
    if (!tomador.razao_social.trim()) {
      errors.razao_social = "Razão Social é obrigatória";
    }
    if (!tomador.documento.trim()) {
      errors.documento = `${tomador.tipo} é obrigatório`;
    }
    if (!tomador.email.trim()) {
      errors.email = "E-mail é obrigatório";
    }
    if (!tomador.cep.trim()) {
      errors.cep = "CEP é obrigatório";
    }
    if (!tomador.endereco.trim()) {
      errors.endereco = "Endereço é obrigatório";
    }
    if (!tomador.numero.trim()) {
      errors.numero = "Número é obrigatório";
    }
    if (!tomador.cidade.trim()) {
      errors.cidade = "Cidade é obrigatória";
    }
    if (!tomador.estado.trim()) {
      errors.estado = "Estado é obrigatório";
    }

    // Validação do Serviço
    if (!servico.descricao.trim()) {
      errors.descricao = "Descrição do serviço é obrigatória";
    }
    if (!servico.item_lista_servico) {
      errors.item_lista_servico = "Item da lista de serviços é obrigatório";
    }
    if (servico.valor_bruto <= 0) {
      errors.valor_bruto = "Valor bruto deve ser maior que zero";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Salva rascunho automaticamente
  const salvarRascunhoAutomatico = async () => {
    if (!user?.id || isSavingDraft) return;

    try {
      const formData: NFSeFormData = {
        tomador,
        servico,
        retencoes,
      };

      await (supabase as any).from("nfse_rascunhos").upsert({
        user_id: user.id,
        dados: formData,
        updated_at: new Date().toISOString(),
      });

      toast({
        title: "Rascunho salvo",
        description: "Seu progresso foi salvo automaticamente.",
      });
    } catch (error) {
      console.error("Erro ao salvar rascunho:", error);
    }
  };

  // Salva rascunho manualmente
  const salvarRascunho = async () => {
    if (!user?.id) return;

    setIsSavingDraft(true);
    try {
      const formData: NFSeFormData = {
        tomador,
        servico,
        retencoes,
      };

      const { error } = await (supabase as any).from("nfse_rascunhos").insert({
        user_id: user.id,
        dados: formData,
      });

      if (error) throw error;

      toast({
        title: "Rascunho salvo",
        description: "O rascunho foi salvo com sucesso.",
      });

      await carregarRascunhos();
      setActiveTab("rascunhos");
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o rascunho.",
        variant: "destructive",
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Carrega rascunho
  const carregarRascunho = (rascunho: RascunhoNFS) => {
    setTomador(rascunho.data.tomador || TOMADOR_INICIAL);
    setServico(rascunho.data.servico || SERVICO_INICIAL);
    setRetencoes(rascunho.data.retencoes || RETENCOES_INICIAL);
    setActiveTab("nova");
    setCurrentStep(1);

    toast({
      title: "Rascunho carregado",
      description: "Os dados foram carregados com sucesso.",
    });
  };

  // Exclui rascunho
  const excluirRascunho = async (id: string) => {
    try {
      const { error } = await (supabase as any).from("nfse_rascunhos").delete().eq("id", id);
      if (error) throw error;

      setRascunhos(rascunhos.filter((r) => r.id !== id));
      toast({
        title: "Rascunho excluído",
        description: "O rascunho foi removido com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o rascunho.",
        variant: "destructive",
      });
    }
  };

  // Limpa formulário
  const limparFormulario = () => {
    setTomador(TOMADOR_INICIAL);
    setServico(SERVICO_INICIAL);
    setRetencoes(RETENCOES_INICIAL);
    setCurrentStep(1);
    setValidationErrors({});
    setNumeroNota(gerarNumeroNota());
  };

  // Emite nota fiscal
  const emitirNota = async () => {
    if (!user?.id) return;

    if (!certificado?.ativo) {
      toast({
        title: "Certificado não configurado",
        description: "Configure um certificado digital antes de emitir notas.",
        variant: "destructive",
      });
      return;
    }

    if (!validarFormulario()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: nota, error } = await db
        .from("notas_fiscais_servico")
        .insert({
          user_id: user.id,
          status: "rascunho",
          cliente_nome: tomador.razao_social,
          cliente_cnpj_cpf: tomador.documento,
          cliente_endereco: `${tomador.endereco}, ${tomador.numero}${tomador.complemento ? ` - ${tomador.complemento}` : ""}, ${tomador.bairro}, ${tomador.cidade}/${tomador.estado}`,
          cliente_email: tomador.email,
          servico_descricao: servico.descricao,
          servico_codigo: servico.item_lista_servico,
          valor_servico: servico.valor_bruto,
          valor_deducoes: servico.deducoes,
          base_calculo: servico.base_calculo,
          aliquota_iss: servico.aliquota_iss,
          iss_retido: servico.iss_retido,
          valor_iss: servico.valor_iss,
          cnae: servico.cnae,
          codigo_tributacao: servico.codigo_tributacao,
          data_competencia: new Date().toISOString().split("T")[0],
          certificado_id: certificado.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Chama Edge Function para emitir
      const { error: emitError } = await supabase.functions.invoke("emitir-nfse", {
        body: {
          notaId: nota.id,
          certificadoId: certificado.id,
        },
      });

      if (emitError) throw emitError;

      toast({
        title: "Nota emitida",
        description: "A nota fiscal foi emitida com sucesso.",
      });

      limparFormulario();
      await carregarNotasRecentes();
    } catch (error: any) {
      toast({
        title: "Erro ao emitir",
        description: error.message || "Não foi possível emitir a nota fiscal.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navegação entre steps
  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Renderiza conteúdo do step atual
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                1
              </span>
              <span>Dados do Tomador</span>
            </div>
            <TomadorForm
              value={tomador}
              onChange={setTomador}
              errors={validationErrors}
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                2
              </span>
              <span>Dados do Serviço</span>
            </div>
            <ServicoForm
              value={servico}
              onChange={setServico}
              errors={validationErrors}
            />
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                3
              </span>
              <span>Retenções (Opcional)</span>
            </div>
            <RetencoesForm
              value={retencoes}
              onChange={setRetencoes}
              baseCalculo={servico.base_calculo}
            />
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                4
              </span>
              <span>Revisão e Emissão</span>
            </div>
            <NotaPreview
              formData={{ tomador, servico, retencoes }}
              numeroNota={numeroNota}
              status="rascunho"
              certificadoNome={certificado?.nome}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Emissão de Nota Fiscal de Serviço</h1>
          <p className="text-muted-foreground">Emita notas fiscais de serviço eletrônica</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/nfse/historico")}>
            <History className="mr-2 h-4 w-4" />
            Histórico
          </Button>
        </div>
      </div>

      {/* Certificado Status */}
      <CertificadoStatus
        nome={certificado?.nome}
        validoAte={certificado?.valido_ate}
        ativo={certificado?.ativo}
        diasParaExpirar={
          certificado?.valido_ate
            ? Math.ceil(
                (new Date(certificado.valido_ate).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24)
              )
            : undefined
        }
        onConfigurar={() => setModalCertificadoAberto(true)}
      />

      {/* Modal de Configuração de Certificado */}
      <CertificadoConfigModal
        isOpen={modalCertificadoAberto}
        onClose={() => setModalCertificadoAberto(false)}
        onSuccess={() => {
          carregarCertificado();
          toast({
            title: "Certificado atualizado",
            description: "O certificado foi configurado com sucesso.",
          });
        }}
        userId={user?.id || ""}
        certificadoAtual={certificado}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="nova">
            <FileText className="mr-2 h-4 w-4" />
            Nova Nota
          </TabsTrigger>
          <TabsTrigger value="rascunhos">
            <DraftingCompass className="mr-2 h-4 w-4" />
            Rascunhos ({rascunhos.length})
          </TabsTrigger>
          <TabsTrigger value="historico">
            <History className="mr-2 h-4 w-4" />
            Notas Recentes
          </TabsTrigger>
        </TabsList>

        {/* Tab Nova Nota */}
        <TabsContent value="nova" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step indicator */}
              <div className="flex items-center justify-between">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`flex items-center ${step < 4 ? "flex-1" : ""}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        currentStep === step
                          ? "bg-primary text-primary-foreground"
                          : currentStep > step
                          ? "bg-green-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {currentStep > step ? <Check className="h-4 w-4" /> : step}
                    </div>
                    {step < 4 && (
                      <div
                        className={`flex-1 h-1 mx-2 ${
                          currentStep > step ? "bg-green-500" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Step labels */}
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>Tomador</span>
                <span>Serviço</span>
                <span>Retenções</span>
                <span>Revisão</span>
              </div>

              {/* Step content */}
              <div className="mt-6">{renderStepContent()}</div>

              {/* Navigation buttons */}
              <div className="flex justify-between pt-6 border-t">
                <div className="flex gap-2">
                  {currentStep > 1 && (
                    <Button variant="outline" onClick={prevStep}>
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Anterior
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={limparFormulario}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Limpar
                  </Button>

                  {currentStep === 4 && (
                    <Button
                      variant="outline"
                      onClick={salvarRascunho}
                      disabled={isSavingDraft}
                    >
                      {isSavingDraft ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Salvar Rascunho
                    </Button>
                  )}

                  {currentStep < 4 ? (
                    <Button onClick={nextStep}>
                      Próximo
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={emitirNota}
                      disabled={isSubmitting || !certificado?.ativo}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Emitindo...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Emitir Nota
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <NumeroNotaDisplay numero={numeroNota} serie="1" />

              {/* Resumo rápido */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Resumo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Valor Bruto:</span>
                    <span>{formatCurrency(servico.valor_bruto)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Valor ISS:</span>
                    <span>{formatCurrency(servico.valor_iss)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-medium">Valor Líquido:</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(servico.valor_liquido)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab Rascunhos */}
        <TabsContent value="rascunhos">
          <Card>
            <CardHeader>
              <CardTitle>Rascunhos Salvos</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRascunhos ? (
                <div className="text-center py-8">Carregando...</div>
              ) : rascunhos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DraftingCompass className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Nenhum rascunho salvo</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {rascunhos.map((rascunho) => (
                      <Card
                        key={rascunho.id}
                        className="cursor-pointer hover:border-primary transition-colors"
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div onClick={() => carregarRascunho(rascunho)}>
                              <p className="font-medium">
                                {rascunho.data.tomador.razao_social ||
                                  "Sem nome do tomador"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Valor:{" "}
                                {formatCurrency(
                                  rascunho.data.servico.valor_bruto
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Salvo em: {formatDate(rascunho.created_at)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => excluirRascunho(rascunho.id)}
                            >
                              Excluir
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Histórico */}
        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle>Últimas Notas Emitidas</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRecentes ? (
                <div className="text-center py-8">Carregando...</div>
              ) : notasRecentes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Nenhuma nota emitida ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notasRecentes.map((nota) => {
                    const status =
                      statusCores[nota.status as keyof typeof statusCores] ||
                      statusCores.rascunho;
                    return (
                      <Card key={nota.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  Nº {nota.numero_nota}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`${status.bg} ${status.text} border ${status.border}`}
                                >
                                  {status.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {nota.tomador_nome}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(nota.data_emissao)} -{" "}
                                {formatCurrency(nota.valor_total)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
