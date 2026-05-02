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
  NFSeConsultaForm,
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
  Search,
  Brain,
} from "lucide-react";
import { useValidarPreEmissao } from "@/hooks/useAiNFSe";

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
    cnpj?: string;
    inscricao_municipal?: string;
  } | null>(null);
  const [numeroNota, setNumeroNota] = useState(gerarNumeroNota());
  const [modalCertificadoAberto, setModalCertificadoAberto] = useState(false);
  const [notaId, setNotaId] = useState<string | null>(null);

  const { validar: validarPreEmissao, resultado: iaResultado, isLoading: iaValidando, clear: clearValidacao } = useValidarPreEmissao();

  // Limpa validação IA quando dados mudam
  useEffect(() => {
    clearValidacao();
  }, [tomador, servico, retencoes, clearValidacao]);

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
        .select("id, nome, valido_ate, ativo, arquivo_path, cnpj, inscricao_municipal")
        .eq("user_id", user.id)
        .eq("ativo", true)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      setCertificado(data || null);
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

  // Validação do formulário (retorna erros para uso síncrono)
  const validarFormularioComErros = (): Record<string, string> => {
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
    if (!tomador.bairro.trim()) {
      errors.bairro = "Bairro é obrigatório";
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

    return errors;
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
      }, { onConflict: 'user_id' });

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

  const handleValidarPreEmissao = () => {
    const dados = {
      tomador,
      servico,
      retencoes,
      numeroNota,
      certificado: certificado?.nome,
    };
    validarPreEmissao(dados);
  };

  // Limpa formulário
  const limparFormulario = () => {
    setTomador(TOMADOR_INICIAL);
    setServico(SERVICO_INICIAL);
    setRetencoes(RETENCOES_INICIAL);
    setCurrentStep(1);
    setValidationErrors({});
    setNumeroNota(gerarNumeroNota());
    setNotaId(null);
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

    const errors = validarFormularioComErros();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Campos obrigatórios",
        description: Object.values(errors).join(". "),
        variant: "destructive",
      });
      return;
    }
    setValidationErrors({});

    // Verifica validação IA pré-emissão
    if (iaResultado) {
      const errosCriticos = iaResultado.problemas.filter((p) => p.severidade === "erro");
      if (errosCriticos.length > 0) {
        toast({
          title: "Validação IA: erros críticos encontrados",
          description: errosCriticos.map((e) => `${e.campo}: ${e.mensagem}`).join("; "),
          variant: "destructive",
        });
        return;
      }
      const avisos = iaResultado.problemas.filter((p) => p.severidade === "aviso");
      if (avisos.length > 0) {
        toast({
          title: "Validação IA: avisos",
          description: avisos.map((a) => `${a.campo}: ${a.mensagem}`).join("; ") + ". Clique em Emitir novamente para prosseguir.",
          variant: "default",
        });
        clearValidacao();
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const { data: nota, error } = await db
        .from("notas_fiscais_servico")
        .insert({
          user_id: user.id,
          status: "rascunho",
          // Tomador
          cliente_nome: tomador.razao_social,
          cliente_razao_social: tomador.razao_social,
          cliente_cnpj_cpf: tomador.documento,
          cliente_tipo_documento: tomador.tipo,
          cliente_endereco: `${tomador.endereco}, ${tomador.numero}${tomador.complemento ? ` - ${tomador.complemento}` : ""}`,
          cliente_numero: tomador.numero,
          cliente_complemento: tomador.complemento || "",
          cliente_bairro: tomador.bairro,
          cliente_cidade: tomador.cidade,
          cliente_estado: tomador.estado,
          cliente_cep: tomador.cep,
          cliente_email: tomador.email,
          cliente_telefone: tomador.telefone || "",
          cliente_nome_fantasia: tomador.nome_fantasia || "",
          // Serviço
          servico_descricao: servico.descricao,
          servico_codigo: servico.item_lista_servico,
          servico_item_lista_servico: servico.item_lista_servico,
          servico_cnae: servico.cnae || "",
          servico_codigo_tributacao: servico.codigo_tributacao || "",
          servico_discriminacao: servico.descricao,
          valor_servico: servico.valor_bruto,
          valor_deducoes: servico.deducoes,
          base_calculo: servico.base_calculo,
          aliquota_iss: servico.aliquota_iss,
          iss_retido: servico.iss_retido,
          valor_iss: servico.valor_iss,
          valor_liquido: servico.valor_liquido,
          // Retenções
          retencao_pis: retencoes.pis,
          retencao_cofins: retencoes.cofins,
          retencao_inss: retencoes.inss,
          retencao_ir: retencoes.ir,
          retencao_csll: retencoes.csll,
          // CNAE e tributação
          cnae: servico.cnae,
          codigo_tributacao: servico.codigo_tributacao,
          // Dados da emissão
          data_competencia: new Date().toISOString().split("T")[0],
          natureza_operacao: 1,
          regime_tributario: 1,
          tipo_rps: "RPS",
          serie: "1",
          certificado_id: certificado.id,
          cnpj_prestador: certificado.cnpj || "",
          inscricao_municipal: certificado.inscricao_municipal || "",
        })
        .select()
        .single();

      if (error) throw error;

      setNotaId(nota.id);

      // Garante sessão válida antes de chamar Edge Function
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        throw new Error("Sessão expirada. Faça login novamente antes de emitir.");
      }

      // Chama Edge Function via fetch para poder ler o corpo do erro 500
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const maxRetries = 2;
      let emitData: any = null;
      let lastError: string | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/emitir-nfse`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${currentSession.access_token}`,
            },
            body: JSON.stringify({ notaId: nota.id, certificadoId: certificado.id }),
          });

          const responseBody = await response.json();

          if (!response.ok) {
            lastError = responseBody?.mensagens?.map((m: any) => m.mensagem || m).join("; ")
              || responseBody?.error
              || responseBody?.mensagem
              || `Erro HTTP ${response.status}`;
            console.error(`[NFSeEmissao] Edge Function retornou ${response.status}:`, responseBody);

            const isTransient = response.status >= 500 || response.status === 406;
            if (isTransient && attempt < maxRetries) {
              console.warn(`[NFSeEmissao] Tentativa ${attempt + 1} falhou (${lastError}), tentando novamente em 3s...`);
              await supabase.auth.refreshSession();
              await new Promise(resolve => setTimeout(resolve, 3000));
              // Atualiza token para retry
              const { data: { session: refreshedSession } } = await supabase.auth.getSession();
              if (refreshedSession) {
                (currentSession as any).access_token = refreshedSession.access_token;
              }
              continue;
            }
            throw new Error(lastError);
          }

          emitData = responseBody;
          break;
        } catch (fetchErr: any) {
          if (fetchErr.message === lastError) throw fetchErr;
          const isNetworkError = fetchErr.message?.includes("Failed to fetch")
            || fetchErr.message?.includes("NetworkError")
            || fetchErr.message?.includes("timeout");
          if (isNetworkError && attempt < maxRetries) {
            console.warn(`[NFSeEmissao] Tentativa ${attempt + 1} falhou (erro de rede), tentando novamente em 3s...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
          }
          throw fetchErr;
        }
      }

      if (!emitData) {
        throw new Error(lastError || "Nenhuma resposta recebida da função de emissão");
      }

      if (!emitData.sucesso) {
        const msgs = emitData.mensagens?.map((m: any) => m.mensagem).join("; ") || emitData.error || "Erro desconhecido na emissão";
        throw new Error(msgs);
      }

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

            {/* Validação IA Pré-Emissão */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Validação Inteligente</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleValidarPreEmissao}
                  disabled={iaValidando}
                  className="gap-1"
                >
                  {iaValidando ? (
                    <><Loader2 className="h-3 w-3 animate-spin" /> Validando...</>
                  ) : (
                    <><Brain className="h-3 w-3" /> Validar com IA</>
                  )}
                </Button>
              </div>

              {iaResultado && (
                <div className="space-y-2">
                  {!iaResultado.valido && iaResultado.problemas.length > 0 && (
                    <div className="space-y-2">
                      {iaResultado.problemas.map((p, i) => (
                        <div
                          key={i}
                          className={`text-sm px-3 py-2 rounded-md border ${
                            p.severidade === "erro"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          <strong>{p.campo}:</strong> {p.mensagem}
                        </div>
                      ))}
                    </div>
                  )}
                  {iaResultado.sugestoes.length > 0 && (
                    <div className="bg-blue-50 rounded-md p-3 border border-blue-200">
                      <p className="text-sm font-medium text-blue-800 mb-1">Sugestões da IA:</p>
                      <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                        {iaResultado.sugestoes.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {iaResultado.valido && iaResultado.problemas.length === 0 && (
                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded-md border border-green-200">
                      <Check className="h-4 w-4" />
                      Dados validados com sucesso pela IA
                    </div>
                  )}
                </div>
              )}
            </div>
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
          <Button variant="outline" onClick={() => navigate("/nfse-historico")}>
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
        <TabsList className="grid w-full md:w-auto grid-cols-4">
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
          <TabsTrigger value="consulta">
            <Search className="mr-2 h-4 w-4" />
            Consulta
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
                    <div className="flex gap-2">
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
                    </div>
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

        {/* Tab Consulta */}
        <TabsContent value="consulta">
          <NFSeConsultaForm certificado={certificado} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
