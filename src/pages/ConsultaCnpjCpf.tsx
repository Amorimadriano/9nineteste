/**
 * Página de Consulta CNPJ/CPF com Score de Crédito Interno
 * Rating bancário interno baseado em regras do sistema
 * Sem vínculo com Serasa, SPC ou outras empresas
 */

import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTableQuery } from "@/hooks/useSupabaseQuery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search,
  Building2,
  User,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Percent,
  Shield,
  FileSearch,
  History,
  Award,
  Star,
  AlertCircle,
  BarChart3,
  ArrowRightLeft,
  Bell,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/nfse-utils";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

/** Interface para resultado da consulta */
interface ConsultaResult {
  tipo: "cliente" | "fornecedor" | "nao_cadastrado";
  id: string;
  nome: string;
  documento: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
}

/** Interface para Score Interno */
interface ScoreInterno {
  score: number; // 0-1000
  risco: "baixo" | "medio" | "alto" | "critico" | "excelente";
  classificacao: string; // A, B, C, D, E
  cor: string;
  recomendacao: string;
  limite_sugerido: number;
}

/** Interface para Rating de Crédito */
interface RatingCredito {
  pagamentos_pontuais: number;
  pagamentos_atrasados: number;
  total_compras: number;
  valor_total_comprado: number;
  valor_total_pago: number;
  valor_em_aberto: number;
  media_dias_atraso: number;
  taxa_pagamento: number; // percentual
  tempo_relacionamento_dias: number;
  ultima_compra?: string;
  ultimo_pagamento?: string;
}

export default function ConsultaCnpjCpf() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [documentoInput, setDocumentoInput] = useState("");
  const [consultaRealizada, setConsultaRealizada] = useState(false);
  const [resultado, setResultado] = useState<ConsultaResult | null>(null);
  const [carregando, setCarregando] = useState(false);

  // Dados do sistema
  const { data: clientes = [] } = useTableQuery("clientes");
  const { data: fornecedores = [] } = useTableQuery("fornecedores");
  const { data: contasReceber = [] } = useTableQuery("contas_receber");
  const { data: contasPagar = [] } = useTableQuery("contas_pagar");
  const { data: historicoCobrancas = [] } = useTableQuery("cobranca_historico");

  /** Formata CNPJ/CPF para exibição */
  const formatarDocumento = (doc: string): string => {
    const cleaned = doc.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  /** Remove formatação do documento */
  const limparDocumento = (doc: string): string => {
    return doc.replace(/\D/g, "");
  };

  /** Busca cliente ou fornecedor pelo documento */
  const buscarPorDocumento = useCallback((): ConsultaResult | null => {
    const docLimpo = limparDocumento(documentoInput);

    // Busca em clientes
    const cliente = (clientes as any[]).find(
      (c) => limparDocumento(c.documento || "") === docLimpo
    );

    if (cliente) {
      return {
        tipo: "cliente",
        id: cliente.id,
        nome: cliente.nome,
        documento: cliente.documento,
        email: cliente.email,
        telefone: cliente.telefone,
        endereco: cliente.endereco,
        cidade: cliente.cidade,
        estado: cliente.estado,
      };
    }

    // Busca em fornecedores
    const fornecedor = (fornecedores as any[]).find(
      (f) => limparDocumento(f.documento || "") === docLimpo
    );

    if (fornecedor) {
      return {
        tipo: "fornecedor",
        id: fornecedor.id,
        nome: fornecedor.nome,
        documento: fornecedor.documento,
        email: fornecedor.email,
        telefone: fornecedor.telefone,
        endereco: fornecedor.endereco,
        cidade: fornecedor.cidade,
        estado: fornecedor.estado,
      };
    }

    return null;
  }, [documentoInput, clientes, fornecedores]);

  /** Calcula o rating de crédito interno */
  const calcularRating = useCallback((resultado: ConsultaResult): RatingCredito => {
    let contasRelacionadas: any[] = [];

    if (resultado.tipo === "cliente") {
      contasRelacionadas = (contasReceber as any[]).filter(
        (c) => c.cliente_id === resultado.id
      );
    } else if (resultado.tipo === "fornecedor") {
      contasRelacionadas = (contasPagar as any[]).filter(
        (c) => c.fornecedor_id === resultado.id
      );
    }

    const pagas = contasRelacionadas.filter((c) => c.status === "recebido" || c.status === "pago");
    const pendentes = contasRelacionadas.filter((c) => c.status === "pendente");
    const vencidas = contasRelacionadas.filter((c) => c.status === "vencido");
    const total = contasRelacionadas.length;

    const valorTotal = contasRelacionadas.reduce((sum, c) => sum + Number(c.valor), 0);
    const valorPago = pagas.reduce((sum, c) => sum + Number(c.valor), 0);
    const valorAberto = [...pendentes, ...vencidas].reduce((sum, c) => sum + Number(c.valor), 0);

    // Calcular dias de atraso
    let diasAtrasoTotal = 0;
    let contasComAtraso = 0;
    let pagamentosPontuais = 0;

    pagas.forEach((conta) => {
      if (conta.data_pagamento && conta.data_vencimento) {
        const venc = new Date(conta.data_vencimento);
        const pag = new Date(conta.data_pagamento);
        const diff = Math.floor((pag.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24));

        if (diff > 0) {
          diasAtrasoTotal += diff;
          contasComAtraso++;
        } else {
          pagamentosPontuais++;
        }
      }
    });

    const mediaDiasAtraso = contasComAtraso > 0 ? diasAtrasoTotal / contasComAtraso : 0;
    const taxaPagamento = total > 0 ? (pagas.length / total) * 100 : 0;

    // Tempo de relacionamento
    const datas = contasRelacionadas
      .map((c) => c.data_emissao || c.created_at)
      .filter(Boolean);

    let tempoRelacionamento = 0;
    if (datas.length > 0) {
      const primeiraData = new Date(Math.min(...datas.map((d) => new Date(d).getTime())));
      tempoRelacionamento = Math.floor(
        (new Date().getTime() - primeiraData.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // Últimas datas
    const contasOrdenadas = [...contasRelacionadas].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return {
      pagamentos_pontuais: pagamentosPontuais,
      pagamentos_atrasados: contasComAtraso,
      total_compras: total,
      valor_total_comprado: valorTotal,
      valor_total_pago: valorPago,
      valor_em_aberto: valorAberto,
      media_dias_atraso: Math.round(mediaDiasAtraso),
      taxa_pagamento: Math.round(taxaPagamento),
      tempo_relacionamento_dias: tempoRelacionamento,
      ultima_compra: contasOrdenadas[0]?.data_emissao,
      ultimo_pagamento: pagas[pagas.length - 1]?.data_pagamento,
    };
  }, [contasReceber, contasPagar]);

  /** Calcula o score interno (0-1000) */
  const calcularScore = useCallback((rating: RatingCredito): ScoreInterno => {
    let score = 500; // Base

    // Taxa de pagamento (até 300 pontos)
    score += (rating.taxa_pagamento / 100) * 300;

    // Dias de atraso médio (reduzir até 200 pontos)
    const penalidadeAtraso = Math.min(rating.media_dias_atraso * 5, 200);
    score -= penalidadeAtraso;

    // Tempo de relacionamento (até 150 pontos)
    const pontosRelacionamento = Math.min(rating.tempo_relacionamento_dias / 10, 150);
    score += pontosRelacionamento;

    // Quantidade de compras (até 100 pontos)
    const pontosCompras = Math.min(rating.total_compras * 10, 100);
    score += pontosCompras;

    // Valor em aberto (reduzir até 150 pontos)
    if (rating.valor_em_aberto > 0) {
      const penalidadeAberto = Math.min(rating.valor_em_aberto / 1000, 150);
      score -= penalidadeAberto;
    }

    // Normalizar
    score = Math.max(0, Math.min(1000, score));

    // Determinar classificação
    let risco: ScoreInterno["risco"];
    let classificacao: string;
    let cor: string;
    let recomendacao: string;
    let limiteSugerido: number;

    if (score >= 800) {
      risco = "excelente";
      classificacao = "AAA";
      cor = "bg-emerald-500";
      recomendacao = "Cliente excepcional. Aprovar crédito liberado e oferecer condições especiais.";
      limiteSugerido = rating.valor_total_pago * 0.5;
    } else if (score >= 700) {
      risco = "baixo";
      classificacao = "AA";
      cor = "bg-green-500";
      recomendacao = "Bom pagador. Aprovar crédito normal e oferecer prazo padrão.";
      limiteSugerido = rating.valor_total_pago * 0.4;
    } else if (score >= 500) {
      risco = "medio";
      classificacao = "B";
      cor = "bg-amber-500";
      recomendacao = "Atenção moderada. Aprovar com garantia ou entrada. Monitorar.";
      limiteSugerido = rating.valor_total_pago * 0.25;
    } else if (score >= 300) {
      risco = "alto";
      classificacao = "C";
      cor = "bg-orange-500";
      recomendacao = "Risco elevado. Exigir garantia real ou adiantamento. Acompanhar de perto.";
      limiteSugerido = rating.valor_total_pago * 0.1;
    } else {
      risco = "critico";
      classificacao = "D";
      cor = "bg-red-500";
      recomendacao = "Risco crítico. Só vender à vista ou com garantia 100%. Não liberar prazo.";
      limiteSugerido = 0;
    }

    return {
      score: Math.round(score),
      risco,
      classificacao,
      cor,
      recomendacao,
      limite_sugerido: Math.round(limiteSugerido),
    };
  }, []);

  /** Realiza a consulta */
  const realizarConsulta = async () => {
    if (!documentoInput || documentoInput.length < 11) {
      toast({
        title: "Documento inválido",
        description: "Digite um CPF ou CNPJ válido.",
        variant: "destructive",
      });
      return;
    }

    setCarregando(true);

    // Simula delay da consulta
    await new Promise((resolve) => setTimeout(resolve, 800));

    const resultadoBusca = buscarPorDocumento();
    setResultado(resultadoBusca);
    setConsultaRealizada(true);
    setCarregando(false);

    if (!resultadoBusca) {
      toast({
        title: "Não cadastrado",
        description: "Este CPF/CNPJ não foi encontrado no sistema.",
      });
    }
  };

  const rating = useMemo(() => {
    if (!resultado) return null;
    return calcularRating(resultado);
  }, [resultado, calcularRating]);

  const score = useMemo(() => {
    if (!rating) return null;
    return calcularScore(rating);
  }, [rating, calcularScore]);

  /** Busca histórico de cobranças do cliente */
  const historicoCliente = useMemo(() => {
    if (!resultado || resultado.tipo !== "cliente") return [];
    return (historicoCobrancas as any[]).filter(
      (h) => h.cliente_nome?.toLowerCase().includes(resultado.nome.toLowerCase())
    );
  }, [resultado, historicoCobrancas]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Consulta CNPJ/CPF - Score Interno
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Consulte o score de crédito interno baseado no histórico do sistema
          </p>
          <p className="text-xs text-muted-foreground">
            Rating bancário interno • Sem consulta a Serasa/SPC
          </p>
        </div>
      </div>

      {/* Banner Consulta Serasa */}
      <Card className="border-blue-500/50 bg-blue-50">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Award className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Precisa de Score Oficial?</h3>
                <p className="text-sm text-blue-700">
                  Consulte o score real na base Serasa Experian para análise de crédito completa.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-blue-500 text-blue-700 hover:bg-blue-100"
              onClick={() => navigate("/consulta-score-serasa")}
            >
              Consultar Score Serasa
              <ArrowRightLeft className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Consulta */}
      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <Label htmlFor="documento" className="text-base font-medium">
                CPF ou CNPJ
              </Label>
              <div className="relative mt-2">
                <FileSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="documento"
                  placeholder="Digite CPF ou CNPJ (somente números)"
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

          <p className="text-xs text-muted-foreground mt-3">
            * Consulta realizada apenas na base interna do sistema. Não consultamos Serasa, SPC ou outros bureaus de crédito.
          </p>
        </CardContent>
      </Card>

      {/* Resultado da Consulta */}
      {consultaRealizada && resultado && score && rating && (
        <Tabs defaultValue="score" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="score" className="gap-2">
              <Award className="h-4 w-4" />
              Score & Rating
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-2">
              <History className="h-4 w-4" />
              Histórico Financeiro
            </TabsTrigger>
            <TabsTrigger value="cobrancas" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Histórico de Cobranças
            </TabsTrigger>
          </TabsList>

          {/* Tab Score & Rating */}
          <TabsContent value="score" className="space-y-6">
            {/* Card Principal do Score */}
            <Card className={`border-2 ${score.risco === "critico" ? "border-red-500" : score.risco === "excelente" ? "border-emerald-500" : "border-primary"}`}>
              <CardContent className="pt-8 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Score Visual */}
                  <div className="flex flex-col items-center justify-center">
                    <div className={`w-40 h-40 rounded-full flex items-center justify-center ${score.cor} text-white shadow-lg`}>
                      <div className="text-center">
                        <div className="text-4xl font-bold">{score.score}</div>
                        <div className="text-sm">pontos</div>
                      </div>
                    </div>
                    <Badge className={`mt-4 text-lg px-4 py-1 ${score.cor} text-white`}>
                      Classificação: {score.classificacao}
                    </Badge>
                    <div className="mt-2 text-sm text-muted-foreground capitalize">
                      Risco: {score.risco}
                    </div>
                  </div>

                  {/* Informações do Consultado */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {resultado.tipo === "cliente" ? (
                        <User className="h-5 w-5 text-primary" />
                      ) : (
                        <Building2 className="h-5 w-5 text-primary" />
                      )}
                      <div>
                        <p className="font-medium">{resultado.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatarDocumento(resultado.documento)} • {resultado.tipo === "cliente" ? "Cliente" : "Fornecedor"}
                        </p>
                      </div>
                    </div>

                    {resultado.cidade && (
                      <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {resultado.cidade}, {resultado.estado}
                        </span>
                      </div>
                    )}

                    {resultado.email && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>Email: {resultado.email}</span>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <span className="font-medium">Limite Sugerido</span>
                      </div>
                      <p className="text-3xl font-bold text-primary">
                        {formatCurrency(score.limite_sugerido)}
                      </p>
                    </div>

                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-sm">{score.recomendacao}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* KPIs do Rating */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm text-muted-foreground">Taxa de Pagamento</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{rating.taxa_pagamento}%</p>
                  <Progress value={rating.taxa_pagamento} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-muted-foreground">Média Atraso</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{rating.media_dias_atraso} dias</p>
                  <p className="text-xs text-muted-foreground">
                    {rating.pagamentos_atrasados} atrasos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-muted-foreground">Relacionamento</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{rating.tempo_relacionamento_dias} dias</p>
                  <p className="text-xs text-muted-foreground">
                    Desde a primeira transação
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Total Movimentado</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{fmt(rating.valor_total_comprado)}</p>
                  <p className="text-xs text-muted-foreground">
                    Em {rating.total_compras} transações
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Valores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-emerald-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    Valor Pago
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-emerald-600">
                    {fmt(rating.valor_total_pago)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {rating.pagamentos_pontuais} pagamentos pontuais
                  </p>
                </CardContent>
              </Card>

              <Card className="border-amber-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Valor em Aberto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-amber-600">
                    {fmt(rating.valor_em_aberto)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Contas pendentes/vencidas
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    Score Calculado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">
                    {score.score}/1000
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Classificação: {score.classificacao}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Histórico Financeiro */}
          <TabsContent value="historico">
            <Card>
              <CardHeader>
                <CardTitle>Histórico Financeiro</CardTitle>
              </CardHeader>
              <CardContent>
                {rating.total_compras === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>Nenhum histórico financeiro encontrado</p>
                    <p className="text-sm">
                      Este {resultado.tipo} ainda não possui transações registradas
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-muted p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold">{rating.total_compras}</p>
                        <p className="text-xs text-muted-foreground">Total de Transações</p>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-emerald-600">{rating.pagamentos_pontuais}</p>
                        <p className="text-xs text-emerald-600">Pagamentos Pontuais</p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-red-600">{rating.pagamentos_atrasados}</p>
                        <p className="text-xs text-red-600">Pagamentos em Atraso</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {rating.ultima_compra ? fmtDate(rating.ultima_compra) : "—"}
                        </p>
                        <p className="text-xs text-blue-600">Última Transação</p>
                      </div>
                    </div>

                    {resultado.tipo === "cliente" && (
                      <div className="mt-6">
                        <h4 className="font-medium mb-3">Contas a Receber</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Descrição</TableHead>
                              <TableHead>Valor</TableHead>
                              <TableHead>Vencimento</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(contasReceber as any[])
                              .filter((c) => c.cliente_id === resultado.id)
                              .slice(0, 10)
                              .map((conta) => (
                                <TableRow key={conta.id}>
                                  <TableCell>{conta.descricao}</TableCell>
                                  <TableCell>{fmt(conta.valor)}</TableCell>
                                  <TableCell>{fmtDate(conta.data_vencimento)}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        conta.status === "recebido"
                                          ? "default"
                                          : conta.status === "vencido"
                                          ? "destructive"
                                          : "secondary"
                                      }
                                    >
                                      {conta.status}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Histórico de Cobranças */}
          <TabsContent value="cobrancas">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Cobranças</CardTitle>
              </CardHeader>
              <CardContent>
                {historicoCliente.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>Nenhuma cobrança enviada</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Canal</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historicoCliente.map((h) => (
                        <TableRow key={h.id}>
                          <TableCell>
                            {new Date(h.created_at).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell>
                            <Badge variant={h.tipo === "apos_vencimento" ? "destructive" : "secondary"}>
                              {h.tipo === "antes_vencimento"
                                ? "Antes Venc."
                                : h.tipo === "no_vencimento"
                                ? "No Venc."
                                : "Após Venc."}
                            </Badge>
                          </TableCell>
                          <TableCell>{h.canal}</TableCell>
                          <TableCell>{h.valor ? fmt(h.valor) : "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{h.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Mensagem quando não encontrado */}
      {consultaRealizada && !resultado && (
        <Card className="border-dashed border-2 border-muted">
          <CardContent className="pt-8 pb-8 text-center">
            <XCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Documento não encontrado</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              O CPF/CNPJ <strong>{formatarDocumento(documentoInput)}</strong> não foi encontrado na base de dados.
              <br />
              Cadastre o cliente ou fornecedor primeiro para ver o score.
            </p>
            <div className="flex justify-center gap-3 mt-6">
              <Button variant="outline" onClick={() => window.location.href = "/clientes"}>
                <User className="mr-2 h-4 w-4" />
                Cadastrar Cliente
              </Button>
              <Button variant="outline" onClick={() => window.location.href = "/fornecedores"}>
                <Building2 className="mr-2 h-4 w-4" />
                Cadastrar Fornecedor
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legendas */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Como o Score Interno é calculado?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span><strong>AAA (800-1000):</strong> Excelente - Crédito liberado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span><strong>AA (700-799):</strong> Bom pagador - Risco baixo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span><strong>B (500-699):</strong> Atenção moderada - Risco médio</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span><strong>C (300-499):</strong> Risco elevado - Exigir garantia</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span><strong>D (0-299):</strong> Risco crítico - Só à vista</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            O score considera: taxa de pagamento (40%), dias de atraso (30%), tempo de relacionamento (15%),
            quantidade de compras (10%) e valor em aberto (5%). Baseado apenas em dados internos do sistema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
