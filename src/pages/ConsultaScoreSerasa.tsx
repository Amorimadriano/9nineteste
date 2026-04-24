/**
 * Página de Consulta de Score via Serasa Experian
 * Integração com API oficial da Serasa para consulta de score de crédito
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { consultarScoreSerasa, formatarScoreSerasa } from "@/lib/serasa";
import {
  Search,
  Building2,
  User,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  FileSearch,
  Award,
  AlertCircle,
  Info,
  ExternalLink,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface ResultadoSerasa {
  documento: string;
  tipo: "pf" | "pj";
  score: number;
  classificacao: string;
  risco: string;
  probabilidadeInadimplencia: number;
  dadosCadastrais?: {
    nome?: string;
    nomeFantasia?: string;
    situacao?: string;
  };
  mensagem?: string;
}

export default function ConsultaScoreSerasa() {
  const { toast } = useToast();
  const [documentoInput, setDocumentoInput] = useState("");
  const [tipoConsulta, setTipoConsulta] = useState<"pf" | "pj">("pj");
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoSerasa | null>(null);
  const [mostrarInfo, setMostrarInfo] = useState(false);

  const formatarDocumento = (doc: string): string => {
    const cleaned = doc.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  const realizarConsulta = async () => {
    const docLimpo = documentoInput.replace(/\D/g, "");

    if (tipoConsulta === "pj" && docLimpo.length !== 14) {
      toast({
        title: "CNPJ inválido",
        description: "Digite um CNPJ válido com 14 dígitos.",
        variant: "destructive",
      });
      return;
    }

    if (tipoConsulta === "pf" && docLimpo.length !== 11) {
      toast({
        title: "CPF inválido",
        description: "Digite um CPF válido com 11 dígitos.",
        variant: "destructive",
      });
      return;
    }

    setCarregando(true);

    try {
      const response = await consultarScoreSerasa(docLimpo, tipoConsulta);

      if (response.sucesso && response.dados) {
        setResultado({
          documento: response.dados.documento,
          tipo: response.dados.tipo,
          score: response.dados.score || 0,
          classificacao: response.dados.classificacao || "N/A",
          risco: response.dados.risco || "alto",
          probabilidadeInadimplencia: response.dados.probabilidadeInadimplencia || 0,
          dadosCadastrais: response.dados.dadosCadastrais,
          mensagem: response.dados.mensagem,
        });

        toast({
          title: "Consulta realizada",
          description: "Score consultado com sucesso na base Serasa.",
        });
      } else {
        toast({
          title: "Erro na consulta",
          description: response.erro || "Não foi possível consultar o score.",
          variant: "destructive",
        });
        setResultado(null);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao conectar com a API Serasa.",
        variant: "destructive",
      });
      setResultado(null);
    } finally {
      setCarregando(false);
    }
  };

  const getScoreVisual = (score: number) => {
    return formatarScoreSerasa(score);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Consulta Score Serasa Experian
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Consulta oficial de score de crédito via API Serasa Experian
          </p>
        </div>
        <Button variant="outline" onClick={() => setMostrarInfo(true)}>
          <Info className="mr-2 h-4 w-4" />
          Como funciona?
        </Button>
      </div>

      {/* Alerta de Configuração */}
      <Card className="border-amber-500/50 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800">
                <strong>Modo Simulação Ativo:</strong> Para consultas reais na base Serasa,
                é necessário contratar o serviço e configurar as credenciais da API.
              </p>
              <p className="text-xs text-amber-700 mt-2">
                Entre em contato com a Serasa Experian para contratar o acesso à API.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Consulta */}
      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6 pb-6">
          <Tabs value={tipoConsulta} onValueChange={(v) => setTipoConsulta(v as "pf" | "pj")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="pj" className="gap-2">
                <Building2 className="h-4 w-4" />
                Pessoa Jurídica
              </TabsTrigger>
              <TabsTrigger value="pf" className="gap-2">
                <User className="h-4 w-4" />
                Pessoa Física
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <Label htmlFor="documento" className="text-base font-medium">
                  {tipoConsulta === "pj" ? "CNPJ" : "CPF"}
                </Label>
                <div className="relative mt-2">
                  <FileSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="documento"
                    placeholder={tipoConsulta === "pj" ? "00.000.000/0000-00" : "000.000.000-00"}
                    value={documentoInput}
                    onChange={(e) => setDocumentoInput(e.target.value)}
                    className="pl-10 text-lg h-12"
                    maxLength={18}
                  />
                </div>
              </div>
              <Button
                onClick={realizarConsulta}
                disabled={carregando || documentoInput.length < 11}
                className="h-12 px-8"
                size="lg"
              >
                {carregando ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2" />
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Consultar Score
                  </>
                )}
              </Button>
            </div>
          </Tabs>

          <p className="text-xs text-muted-foreground mt-4">
            * Consulta realizada diretamente na base Serasa Experian.
            Requer contrato comercial vigente.
          </p>
        </CardContent>
      </Card>

      {/* Resultado da Consulta */}
      {resultado && (
        <Card className={`border-2 ${getScoreVisual(resultado.score).cor.replace('bg-', 'border-')} shadow-lg`}>
          <CardContent className="pt-8 pb-8">
            {/* Alerta de simulação */}
            {resultado.mensagem?.includes("SIMULAÇÃO") && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">{resultado.mensagem}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Score Visual */}
              <div className="flex flex-col items-center justify-center">
                <div className={`w-48 h-48 rounded-full flex items-center justify-center ${getScoreVisual(resultado.score).cor} text-white shadow-xl`}>
                  <div className="text-center">
                    <div className="text-6xl font-bold">{resultado.score}</div>
                    <div className="text-sm mt-1">pontos</div>
                  </div>
                </div>
                <Badge className={`mt-6 text-lg px-6 py-2 ${getScoreVisual(resultado.score).cor} text-white`}>
                  Classificação: {resultado.classificacao}
                </Badge>
                <div className="mt-2 text-sm text-muted-foreground capitalize">
                  Risco: {resultado.risco}
                </div>
              </div>

              {/* Informações */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {resultado.tipo === "pj" ? (
                      <Building2 className="h-5 w-5 text-primary" />
                    ) : (
                      <User className="h-5 w-5 text-primary" />
                    )}
                    {resultado.dadosCadastrais?.nome || "Não identificado"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {formatarDocumento(resultado.documento)}
                  </p>
                </div>

                {resultado.dadosCadastrais?.nomeFantasia && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Nome Fantasia:</span>{" "}
                    {resultado.dadosCadastrais.nomeFantasia}
                  </p>
                )}

                {resultado.dadosCadastrais?.situacao && (
                  <div className="flex items-center gap-2">
                    <Badge variant={resultado.dadosCadastrais.situacao === "ATIVA" ? "default" : "destructive"}>
                      {resultado.dadosCadastrais.situacao}
                    </Badge>
                  </div>
                )}

                {/* Probabilidade de Inadimplência */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Probabilidade de Inadimplência</span>
                    <span className="font-semibold">{resultado.probabilidadeInadimplencia}%</span>
                  </div>
                  <Progress value={resultado.probabilidadeInadimplencia} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Chance de atraso nos próximos 12 meses
                  </p>
                </div>

                {/* Recomendação */}
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Award className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm">{getScoreVisual(resultado.score).recomendacao}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Como funciona */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Como funciona o Score Serasa?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span><strong>800-1000:</strong> Excelente - Risco mínimo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span><strong>700-799:</strong> Bom - Risco baixo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-lime-500" />
                <span><strong>600-699:</strong> Risco moderado</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span><strong>500-599:</strong> Risco elevado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span><strong>400-499:</strong> Risco alto</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span><strong>0-399:</strong> Risco crítico</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            O Score Serasa varia de 0 a 1000 e indica a probabilidade de pagamento em dia nos próximos 12 meses.
            Quanto maior o score, menor o risco de inadimplência.
          </p>
        </CardContent>
      </Card>

      {/* Modal de Informação */}
      <Dialog open={mostrarInfo} onOpenChange={setMostrarInfo}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Sobre a Consulta Serasa
            </DialogTitle>
            <DialogDescription>
              Entenda como funciona a integração com a Serasa Experian
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <p className="font-medium text-amber-800 mb-2">⚠️ Requisito Importante</p>
              <p className="text-amber-700">
                Para utilizar consultas reais na base Serasa, você precisa ter um contrato
                comercial vigente com a Serasa Experian e credenciais de API ativas.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Como contratar:</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Acesse o site da Serasa Experian</li>
                <li>Solicite uma proposta comercial para API de Score</li>
                <li>Assine o contrato e obtenha as credenciais (Client ID e Client Secret)</li>
                <li>Configure as variáveis de ambiente no Supabase</li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Dados consultados:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Score de Crédito (0-1000)</li>
                <li>Classificação de Risco</li>
                <li>Probabilidade de Inadimplência</li>
                <li>Dados Cadastrais</li>
              </ul>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <ExternalLink className="h-4 w-4" />
              <a
                href="https://www.serasaexperian.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Site oficial Serasa Experian
              </a>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setMostrarInfo(false)}>Entendido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
