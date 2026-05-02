/**
 * Página de Histórico de NFS-e
 * Lista todas as notas emitidas com filtros e ações
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Bypass typing for tables not present in generated types
const db: any = supabase;
import {
  NFSeHistoricoItem,
  NFSeFiltros,
  NFSeStatus,
  statusCores,
} from "@/types/nfse-ui";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/nfse-utils";
import { useNFSeSync } from "@/hooks/useNFSeSync";
import { useAnalisarLoteNotas } from "@/hooks/useAiNFSe";
import {
  ArrowLeft,
  FileText,
  Download,
  Eye,
  Ban,
  RefreshCw,
  Search,
  Filter,
  FileDown,
  Loader2,
  X,
  Brain,
} from "lucide-react";

export default function NFSeHistorico() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { consultarStatusNota, podeCancelar, cancelarNota, loading: loadingSync } =
    useNFSeSync();
  const { analisar: analisarLote, resumo: iaResumo, isLoading: iaAnalisando, clear: clearAnalise } =
    useAnalisarLoteNotas();

  // Estados
  const [notas, setNotas] = useState<NFSeHistoricoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);

  // Filtros
  const [filtros, setFiltros] = useState<NFSeFiltros>({
    periodo_inicio: "",
    periodo_fim: "",
    status: "todos",
    tomador: "",
    numero_nota: "",
  });
  const [showFiltros, setShowFiltros] = useState(false);

  // Diálogos
  const [notaSelecionada, setNotaSelecionada] = useState<NFSeHistoricoItem | null>(
    null
  );
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [showCancelar, setShowCancelar] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");

  // Carrega notas
  const carregarNotas = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      let query = db
        .from("notas_fiscais_servico")
        .select(
          "id, numero_nota, serie, status, cliente_nome, cliente_cnpj_cpf, data_emissao, data_autorizacao, valor_servico, link_pdf, link_xml",
          { count: "exact" }
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Aplica filtros
      if (filtros.periodo_inicio) {
        query = query.gte("data_emissao", filtros.periodo_inicio);
      }
      if (filtros.periodo_fim) {
        query = query.lte("data_emissao", filtros.periodo_fim);
      }
      if (filtros.status && filtros.status !== "todos") {
        query = query.eq("status", filtros.status);
      }
      if (filtros.tomador) {
        query = query.ilike("cliente_nome", `%${filtros.tomador}%`);
      }
      if (filtros.numero_nota) {
        query = query.ilike("numero_nota", `%${filtros.numero_nota}%`);
      }

      // Paginação
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      const notasFormatadas: NFSeHistoricoItem[] =
        data?.map((n: any) => ({
          id: n.id,
          numero_nota: n.numero_nota || "-",
          serie: n.serie || "1",
          status: n.status as NFSeStatus,
          tomador_nome: n.cliente_nome,
          tomador_documento: n.cliente_cnpj_cpf,
          data_emissao: n.data_emissao || n.data_autorizacao,
          valor_total: n.valor_servico || 0,
          link_pdf: n.link_pdf,
          link_xml: n.link_xml,
        })) || [];

      setNotas(notasFormatadas);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Erro ao carregar notas:", error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar o histórico de notas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, filtros, page, perPage, toast]);

  useEffect(() => {
    carregarNotas();
  }, [carregarNotas]);

  // Sincroniza status
  const sincronizarStatus = async (notaId: string) => {
    const result = await consultarStatusNota(notaId);
    if (result.success) {
      toast({
        title: "Status atualizado",
        description: `Nota está com status: ${result.status}`,
      });
      await carregarNotas();
    } else {
      toast({
        title: "Erro",
        description: result.mensagemErro || "Não foi possível sincronizar.",
        variant: "destructive",
      });
    }
  };

  // Cancela nota
  const handleCancelar = async () => {
    if (!notaSelecionada) return;

    const success = await cancelarNota(notaSelecionada.id, motivoCancelamento);
    if (success) {
      setShowCancelar(false);
      setMotivoCancelamento("");
      await carregarNotas();
    }
  };

  // Baixa PDF
  const baixarPDF = async (nota: NFSeHistoricoItem) => {
    if (!nota.link_pdf) {
      toast({
        title: "PDF não disponível",
        description: "O PDF desta nota ainda não foi gerado.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(nota.link_pdf);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `NFSe_${nota.numero_nota}_${nota.tomador_nome}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Erro ao baixar",
        description: "Não foi possível baixar o PDF.",
        variant: "destructive",
      });
    }
  };

  // Baixa XML
  const baixarXML = async (nota: NFSeHistoricoItem) => {
    if (!nota.link_xml) {
      toast({
        title: "XML não disponível",
        description: "O XML desta nota ainda não foi gerado.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(nota.link_xml);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `NFSe_${nota.numero_nota}_${nota.tomador_nome}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Erro ao baixar",
        description: "Não foi possível baixar o XML.",
        variant: "destructive",
      });
    }
  };

  // Analisa notas visíveis com IA
  const handleAnalisarLote = () => {
    if (notas.length === 0) {
      toast({
        title: "Nenhuma nota para analisar",
        description: "Aplique filtros ou aguarde o carregamento das notas.",
        variant: "destructive",
      });
      return;
    }
    analisarLote(notas.map((n) => ({
      numero_nota: n.numero_nota,
      status: n.status,
      tomador: n.tomador_nome,
      valor: n.valor_total,
      data: n.data_emissao,
    })));
  };

  // Limpa filtros
  const limparFiltros = () => {
    setFiltros({
      periodo_inicio: "",
      periodo_fim: "",
      status: "todos",
      tomador: "",
      numero_nota: "",
    });
    setPage(1);
  };

  // Total de páginas
  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/nfse")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-display">Histórico de Notas Fiscais</h1>
            <p className="text-muted-foreground">Gerencie suas notas emitidas</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFiltros(!showFiltros)}>
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          <Button variant="outline" onClick={handleAnalisarLote} disabled={iaAnalisando || notas.length === 0}>
            {iaAnalisando ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analisando...</>
            ) : (
              <><Brain className="mr-2 h-4 w-4" /> Analisar com IA</>
            )}
          </Button>
        </div>
      </div>

      {/* Filtros */}
      {showFiltros && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Número da Nota</label>
                <Input
                  placeholder="Ex: 12345"
                  value={filtros.numero_nota}
                  onChange={(e) =>
                    setFiltros({ ...filtros, numero_nota: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tomador</label>
                <Input
                  placeholder="Nome do cliente"
                  value={filtros.tomador}
                  onChange={(e) =>
                    setFiltros({ ...filtros, tomador: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filtros.status}
                  onValueChange={(v) => setFiltros({ ...filtros, status: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="enviando">Enviando</SelectItem>
                    <SelectItem value="autorizada">Autorizada</SelectItem>
                    <SelectItem value="rejeitada">Rejeitada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <Button variant="outline" onClick={limparFiltros}>
                  <X className="mr-2 h-4 w-4" />
                  Limpar
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Período Início</label>
                <Input
                  type="date"
                  value={filtros.periodo_inicio}
                  onChange={(e) =>
                    setFiltros({ ...filtros, periodo_inicio: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Período Fim</label>
                <Input
                  type="date"
                  value={filtros.periodo_fim}
                  onChange={(e) =>
                    setFiltros({ ...filtros, periodo_fim: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo da Análise IA */}
      {iaResumo && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              Análise Inteligente do Lote
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {iaResumo}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Tomador</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : notas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>Nenhuma nota encontrada</p>
                  </TableCell>
                </TableRow>
              ) : (
                notas.map((nota) => {
                  const status =
                    statusCores[nota.status] || statusCores.rascunho;
                  return (
                    <TableRow key={nota.id}>
                      <TableCell className="font-medium">
                        {nota.numero_nota}
                      </TableCell>
                      <TableCell>{nota.tomador_nome}</TableCell>
                      <TableCell>{formatDate(nota.data_emissao)}</TableCell>
                      <TableCell>{formatCurrency(nota.valor_total)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${status.bg} ${status.text} border ${status.border}`}
                        >
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setNotaSelecionada(nota);
                              setShowDetalhes(true);
                            }}
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {nota.link_pdf && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => baixarPDF(nota)}
                              title="Baixar PDF"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}

                          {nota.link_xml && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => baixarXML(nota)}
                              title="Baixar XML"
                            >
                              <FileDown className="h-4 w-4" />
                            </Button>
                          )}

                          {nota.status === "autorizada" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setNotaSelecionada(nota);
                                setShowCancelar(true);
                              }}
                              title="Cancelar"
                              className="text-destructive hover:text-destructive"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}

                          {(nota.status === "enviando" ||
                            nota.status === "rascunho") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => sincronizarStatus(nota.id)}
                              disabled={loadingSync}
                              title="Sincronizar status"
                            >
                              <RefreshCw
                                className={`h-4 w-4 ${loadingSync ? "animate-spin" : ""}`}
                              />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Mostrando {(page - 1) * perPage + 1} a{" "}
            {Math.min(page * perPage, totalCount)} de {totalCount} notas
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}

      {/* Dialog de Detalhes */}
      <Dialog open={showDetalhes} onOpenChange={setShowDetalhes}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Nota</DialogTitle>
          </DialogHeader>
          {notaSelecionada && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Número</p>
                  <p className="font-medium">{notaSelecionada.numero_nota}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Série</p>
                  <p className="font-medium">{notaSelecionada.serie}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant="outline"
                    className={`${
                      statusCores[notaSelecionada.status]?.bg
                    } ${statusCores[notaSelecionada.status]?.text}`}
                  >
                    {statusCores[notaSelecionada.status]?.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {formatDate(notaSelecionada.data_emissao)}
                  </p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Tomador</p>
                <p className="font-medium">{notaSelecionada.tomador_nome}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="font-medium">
                  {formatCurrency(notaSelecionada.valor_total)}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Cancelamento */}
      <Dialog open={showCancelar} onOpenChange={setShowCancelar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Nota</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O cancelamento só é permitido no
              mesmo dia da autorização.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo do Cancelamento *</label>
              <Input
                placeholder="Informe o motivo do cancelamento"
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelar(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelar}
              disabled={!motivoCancelamento.trim()}
            >
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
