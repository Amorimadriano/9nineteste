import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { statusCores } from "@/types/nfse-ui";
import { formatCurrency, formatDate } from "@/lib/nfse-utils";
import {
  Search,
  Download,
  FileDown,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";

const db: any = supabase;

interface ConsultaResult {
  sucesso: boolean;
  numeroNfse?: string;
  codigoVerificacao?: string;
  dataEmissao?: string;
  dataAutorizacao?: string;
  status?: string;
  valorServicos?: string;
  valorIss?: string;
  baseCalculo?: string;
  aliquotaIss?: string;
  issRetido?: boolean;
  tomador?: { razaoSocial: string; cnpjCpf: string };
  prestador?: { cnpj: string; inscricaoMunicipal: string };
  linkPdf?: string;
  linkXml?: string;
  linkNfse?: string;
  discriminacao?: string;
  itemListaServico?: string;
  mensagens?: Array<{ codigo: string; mensagem: string; tipo: string }>;
}

interface NotaSimples {
  id: string;
  numero_nota: string;
  numero_rps: string;
  status: string;
  cliente_nome: string;
  cliente_cnpj_cpf: string;
  valor_servico: number;
  data_emissao: string;
  certificado_id: string;
}

interface NFSeConsultaFormProps {
  certificado: { id: string; nome: string; ativo: boolean } | null;
}

export function NFSeConsultaForm({ certificado }: NFSeConsultaFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [notas, setNotas] = useState<NotaSimples[]>([]);
  const [selectedNotaId, setSelectedNotaId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingNotas, setLoadingNotas] = useState(false);
  const [resultado, setResultado] = useState<ConsultaResult | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingXml, setDownloadingXml] = useState(false);

  const carregarNotas = useCallback(async () => {
    if (!user) return;
    setLoadingNotas(true);
    try {
      const { data, error } = await db
        .from("notas_fiscais_servico")
        .select("id, numero_nota, numero_rps, status, cliente_nome, cliente_cnpj_cpf, valor_servico, data_emissao, certificado_id")
        .eq("user_id", user.id)
        .in("status", ["autorizada", "enviando", "cancelada"])
        .order("data_emissao", { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotas((data || []) as NotaSimples[]);
    } catch (err: any) {
      toast({ title: "Erro ao carregar notas", description: err.message, variant: "destructive" });
    } finally {
      setLoadingNotas(false);
    }
  }, [user, toast]);

  // Load notas on mount
  useEffect(() => { carregarNotas(); }, [carregarNotas]);

  const consultarNota = async () => {
    if (!selectedNotaId) {
      toast({ title: "Selecione uma nota", description: "Escolha uma nota fiscal para consultar", variant: "destructive" });
      return;
    }

    if (!certificado?.ativo) {
      toast({ title: "Certificado necessario", description: "E necessario ter um certificado digital ativo para consultar notas em producao", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResultado(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessao expirada. Faca login novamente.");

      let lastError: Error | null = null;

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const response = await fetch(`${supabaseUrl}/functions/v1/consultar-nfse`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ notaId: selectedNotaId }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || result.mensagens?.map((m: any) => m.mensagem).join("; ") || `Erro HTTP ${response.status}`);
          }

          setResultado(result);

          if (result.sucesso) {
            toast({ title: "Consulta realizada com sucesso", description: result.numeroNfse ? `NFS-e ${result.numeroNfse}` : "Dados da nota atualizados" });
          } else {
            toast({
              title: "Consulta retornou avisos",
              description: result.mensagens?.map((m: any) => m.mensagem).join("; ") || "Verifique os detalhes",
              variant: "destructive",
            });
          }
          return;
        } catch (err: any) {
          lastError = err;
          if (attempt === 0 && (err.message?.includes("401") || err.message?.includes("403") || err.message?.includes("session") || err.message?.includes("jwt"))) {
            const { error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) throw refreshError;
            continue;
          }
          throw err;
        }
      }
      throw lastError;
    } catch (err: any) {
      const msg = err.message || "Erro ao consultar nota";
      setResultado({ sucesso: false, mensagens: [{ codigo: "ERROR", mensagem: msg, tipo: "Erro" }] });
      toast({ title: "Erro na consulta", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const baixarDocumento = async (tipo: "pdf" | "xml") => {
    const nota = notas.find(n => n.id === selectedNotaId);
    if (!nota) return;

    // Try to get link from consulta result first, then from DB
    let link = tipo === "pdf" ? resultado?.linkPdf : resultado?.linkXml;

    if (!link) {
      // Fetch from DB
      const { data: notaData } = await db
        .from("notas_fiscais_servico")
        .select("link_pdf, link_xml")
        .eq("id", selectedNotaId)
        .single();

      link = tipo === "pdf" ? notaData?.link_pdf : notaData?.link_xml;
    }

    if (!link) {
      toast({
        title: tipo === "pdf" ? "PDF nao disponivel" : "XML nao disponivel",
        description: "A prefeitura nao forneceu link para download. Tente consultar a nota primeiro.",
        variant: "destructive",
      });
      return;
    }

    const setDownloading = tipo === "pdf" ? setDownloadingPdf : setDownloadingXml;
    setDownloading(true);

    try {
      const response = await fetch(link);
      if (!response.ok) throw new Error(`Erro ao baixar ${tipo.toUpperCase()}: HTTP ${response.status}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `NFSe_${nota.numero_nota || nota.numero_rps}_${nota.cliente_nome}.${tipo}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({ title: `${tipo.toUpperCase()} baixado com sucesso` });
    } catch (err: any) {
      toast({ title: `Erro ao baixar ${tipo.toUpperCase()}`, description: err.message, variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const cores = statusCores[status as keyof typeof statusCores];
    if (!cores) return <Badge variant="outline">{status}</Badge>;
    return (
      <Badge variant="outline" className={`${cores.bg} ${cores.text} border ${cores.border}`}>
        {cores.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Seletor de nota */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Consultar NFS-e
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Selecione a nota fiscal para consultar
            </label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={selectedNotaId}
              onChange={(e) => {
                setSelectedNotaId(e.target.value);
                setResultado(null);
              }}
              disabled={loading}
            >
              <option value="">-- Selecione uma nota --</option>
              {notas.map((nota) => (
                <option key={nota.id} value={nota.id}>
                  {nota.numero_nota || nota.numero_rps || "S/N"} - {nota.cliente_nome} - {formatCurrency(nota.valor_servico)} ({nota.status})
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={consultarNota}
            disabled={!selectedNotaId || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Consultando...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Consultar na Prefeitura
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultado da consulta */}
      {resultado && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {resultado.sucesso ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                Resultado da Consulta
              </CardTitle>
              {getStatusBadge(resultado.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {resultado.mensagens && resultado.mensagens.length > 0 && (
              <div className="space-y-1">
                {resultado.mensagens.map((msg, i) => (
                  <div
                    key={i}
                    className={`text-sm p-2 rounded ${
                      msg.tipo === "Erro"
                        ? "bg-red-50 text-red-700"
                        : "bg-green-50 text-green-700"
                    }`}
                  >
                    {msg.mensagem}
                  </div>
                ))}
              </div>
            )}

            {resultado.sucesso && (
              <>
                {/* Dados principais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Numero NFS-e</p>
                    <p className="text-lg font-semibold">{resultado.numeroNfse || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Codigo de Verificacao</p>
                    <p className="text-lg font-semibold">{resultado.codigoVerificacao || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Data de Emissao</p>
                    <p className="font-medium">{resultado.dataEmissao ? formatDate(resultado.dataEmissao) : "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Data de Autorizacao</p>
                    <p className="font-medium">{resultado.dataAutorizacao ? formatDate(resultado.dataAutorizacao) : "-"}</p>
                  </div>
                </div>

                <Separator />

                {/* Valores */}
                {(resultado.valorServicos || resultado.valorIss) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Valor dos Servicos</p>
                      <p className="text-lg font-semibold text-green-600">
                        {resultado.valorServicos ? formatCurrency(parseFloat(resultado.valorServicos)) : "-"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Valor ISS</p>
                      <p className="font-medium">
                        {resultado.valorIss ? formatCurrency(parseFloat(resultado.valorIss)) : "-"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Aliquota ISS</p>
                      <p className="font-medium">
                        {resultado.aliquotaIss ? `${resultado.aliquotaIss}%` : "-"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tomador */}
                {resultado.tomador && (resultado.tomador.razaoSocial || resultado.tomador.cnpjCpf) && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Tomador</p>
                      <div className="bg-muted/50 rounded-md p-3">
                        <p className="font-medium">{resultado.tomador.razaoSocial || "-"}</p>
                        <p className="text-sm text-muted-foreground">
                          {resultado.tomador.cnpjCpf ? `CNPJ/CPF: ${resultado.tomador.cnpjCpf}` : ""}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Descriminacao */}
                {resultado.discriminacao && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Discriminacao</p>
                      <p className="text-sm bg-muted/50 rounded-md p-3 whitespace-pre-wrap">
                        {resultado.discriminacao}
                      </p>
                    </div>
                  </>
                )}

                {/* Botoes de download */}
                <Separator />
                <div className="flex flex-wrap gap-3">
                  {resultado.linkPdf && (
                    <Button
                      variant="outline"
                      onClick={() => baixarDocumento("pdf")}
                      disabled={downloadingPdf}
                    >
                      {downloadingPdf ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Baixar PDF
                    </Button>
                  )}
                  {resultado.linkXml && (
                    <Button
                      variant="outline"
                      onClick={() => baixarDocumento("xml")}
                      disabled={downloadingXml}
                    >
                      {downloadingXml ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileDown className="mr-2 h-4 w-4" />
                      )}
                      Baixar XML
                    </Button>
                  )}
                  {resultado.linkNfse && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(resultado.linkNfse!, "_blank")}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Ver no Portal
                    </Button>
                  )}
                  {!resultado.linkPdf && !resultado.linkXml && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      Links de download nao disponibilizados pela prefeitura
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Botao para recarregar notas */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={carregarNotas} disabled={loadingNotas}>
          {loadingNotas ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Recarregar lista
        </Button>
      </div>
    </div>
  );
}