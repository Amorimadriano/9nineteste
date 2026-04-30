import { useState, useMemo, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTableQuery } from "@/hooks/useSupabaseQuery";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FileUp, FileDown, Upload, Download, FileText, Building2, Search, X, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  gerarRemessaCobranca,
  gerarRemessaPagamento,
  parseRetornoCobranca,
  BANCOS_CNAB,
  CnabEmpresa,
  CnabBoleto,
  CnabPagamento,
} from "@/lib/cnab240";
import type { RetornoParseResult } from "@/lib/cnab240";

const NOME_PARA_CODIGO: Record<string, string> = {
  "inter": "077", "banco inter": "077",
  "itau": "341", "itaú": "341", "banco itau": "341",
  "bradesco": "237", "banco bradesco": "237",
  "brasil": "001", "banco do brasil": "001", "bb": "001",
  "caixa": "104", "caixa economica": "104", "cef": "104",
  "santander": "033", "banco santander": "033",
  "nubank": "260", "nu": "260",
  "sicoob": "756", "sicredi": "748",
  "safra": "422", "original": "212",
  "c6": "336", "c6 bank": "336",
  "pagseguro": "290", "picpay": "380",
  "cora": "403", "stone": "197",
};

function resolverCodigoBanco(bancoNome: string): string {
  if (!bancoNome) return "077";
  if (/^\d{3}$/.test(bancoNome.trim())) return bancoNome.trim();
  const key = bancoNome.toLowerCase().trim();
  for (const [nome, codigo] of Object.entries(NOME_PARA_CODIGO)) {
    if (key.includes(nome)) return codigo;
  }
  return "077";
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string | Date) => {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("pt-BR");
};

function DateFilter({ dataDe, dataAte, onDateDeChange, onDateAteChange, onClear }: {
  dataDe: string; dataAte: string;
  onDateDeChange: (v: string) => void; onDateAteChange: (v: string) => void;
  onClear: () => void;
}) {
  const hasFilter = dataDe || dataAte;
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Vencimento De</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[150px] justify-start text-left font-normal h-9 text-xs", !dataDe && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dataDe ? format(parse(dataDe, "yyyy-MM-dd", new Date()), "dd/MM/yyyy") : "Data início"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dataDe ? parse(dataDe, "yyyy-MM-dd", new Date()) : undefined} onSelect={(date) => onDateDeChange(date ? format(date, "yyyy-MM-dd") : "")} locale={ptBR} className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Vencimento Até</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[150px] justify-start text-left font-normal h-9 text-xs", !dataAte && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dataAte ? format(parse(dataAte, "yyyy-MM-dd", new Date()), "dd/MM/yyyy") : "Data fim"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dataAte ? parse(dataAte, "yyyy-MM-dd", new Date()) : undefined} onSelect={(date) => onDateAteChange(date ? format(date, "yyyy-MM-dd") : "")} locale={ptBR} className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
      </div>
      {hasFilter && (
        <Button variant="ghost" size="sm" className="h-9 text-xs gap-1" onClick={onClear}>
          <X className="h-3 w-3" /> Limpar
        </Button>
      )}
    </div>
  );
}

export default function Cnab240() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: contasReceber = [] } = useTableQuery("contas_receber");
  const { data: contasPagar = [] } = useTableQuery("contas_pagar");
  const { data: bancos = [] } = useTableQuery("bancos_cartoes");
  const { data: clientes = [] } = useTableQuery("clientes");
  const { data: fornecedores = [] } = useTableQuery("fornecedores");

  const [emp, setEmp] = useState<any>(null);
  useEffect(() => {
    let mounted = true;
    if (!user) return;
    supabase.from("empresa").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (mounted && data) setEmp(data);
    });
    return () => { mounted = false; };
  }, [user]);

  const [selectedReceber, setSelectedReceber] = useState<Set<string>>(new Set());
  const [selectedPagar, setSelectedPagar] = useState<Set<string>>(new Set());
  const [bancoSelecionado, setBancoSelecionado] = useState<string>("");
  const [retornoResult, setRetornoResult] = useState<RetornoParseResult | null>(null);

  // Date filters
  const [receberDateDe, setReceberDateDe] = useState("");
  const [receberDateAte, setReceberDateAte] = useState("");
  const [pagarDateDe, setPagarDateDe] = useState("");
  const [pagarDateAte, setPagarDateAte] = useState("");

  const bancosAtivos = useMemo(() =>
    (bancos as any[]).filter((b: any) => b.ativo && b.tipo === "banco"),
    [bancos]
  );

  const pendentesReceber = useMemo(() => {
    let items = (contasReceber as any[]).filter((c: any) => c.status === "pendente");
    if (receberDateDe) items = items.filter((c: any) => c.data_vencimento >= receberDateDe);
    if (receberDateAte) items = items.filter((c: any) => c.data_vencimento <= receberDateAte);
    return items.sort((a: any, b: any) => a.data_vencimento.localeCompare(b.data_vencimento));
  }, [contasReceber, receberDateDe, receberDateAte]);

  const pendentesPagar = useMemo(() => {
    let items = (contasPagar as any[]).filter((c: any) => c.status === "pendente");
    if (pagarDateDe) items = items.filter((c: any) => c.data_vencimento >= pagarDateDe);
    if (pagarDateAte) items = items.filter((c: any) => c.data_vencimento <= pagarDateAte);
    return items.sort((a: any, b: any) => a.data_vencimento.localeCompare(b.data_vencimento));
  }, [contasPagar, pagarDateDe, pagarDateAte]);

  const bancoObj = useMemo(() =>
    bancosAtivos.find((b: any) => b.id === bancoSelecionado),
    [bancosAtivos, bancoSelecionado]
  );

  function getEmpresaCnab(): CnabEmpresa | null {
    if (!emp || !bancoObj) {
      toast({ title: "Erro", description: "Configure os dados da empresa e selecione um banco.", variant: "destructive" });
      return null;
    }
    return {
      razaoSocial: emp.razao_social || emp.nome_fantasia || "EMPRESA",
      cnpj: emp.cnpj || "",
      agencia: bancoObj.agencia || "",
      conta: bancoObj.conta || "",
      digitoConta: "",
      endereco: emp.endereco || "",
      cidade: emp.cidade || "",
      estado: emp.estado || "",
      cep: emp.cep || "",
      codigoBanco: resolverCodigoBanco(bancoObj.banco || ""),
      nomeBanco: bancoObj.nome || "",
    };
  }

  function getClienteNome(clienteId: string) {
    const c = (clientes as any[]).find((cl: any) => cl.id === clienteId);
    return c?.nome || "Cliente";
  }
  function getClienteDoc(clienteId: string) {
    const c = (clientes as any[]).find((cl: any) => cl.id === clienteId);
    return c?.documento || "";
  }
  function getFornecedorNome(fornecedorId: string) {
    const f = (fornecedores as any[]).find((fn: any) => fn.id === fornecedorId);
    return f?.nome || "Fornecedor";
  }
  function getFornecedorDoc(fornecedorId: string) {
    const f = (fornecedores as any[]).find((fn: any) => fn.id === fornecedorId);
    return f?.documento || "";
  }

  function downloadFile(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleGerarRemessaCobranca() {
    const empresaCnab = getEmpresaCnab();
    if (!empresaCnab) return;
    if (selectedReceber.size === 0) {
      toast({ title: "Atenção", description: "Selecione ao menos uma conta a receber.", variant: "destructive" });
      return;
    }

    const boletos: CnabBoleto[] = pendentesReceber
      .filter((c: any) => selectedReceber.has(c.id))
      .map((c: any, i: number) => ({
        nossoNumero: (i + 1).toString().padStart(8, "0"),
        dataVencimento: new Date(c.data_vencimento),
        valor: Number(c.valor),
        sacadoNome: c.cliente_id ? getClienteNome(c.cliente_id) : "SACADO",
        sacadoDocumento: c.cliente_id ? getClienteDoc(c.cliente_id) : "",
        descricao: c.descricao,
        contaReceberId: c.id,
      }));

    const content = gerarRemessaCobranca(empresaCnab, boletos);
    const now = new Date();
    const filename = `REM_COB_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,"0")}${now.getDate().toString().padStart(2,"0")}.rem`;
    downloadFile(content, filename);
    toast({ title: "Arquivo gerado!", description: `${filename} com ${boletos.length} título(s)` });
    setSelectedReceber(new Set());
  }

  function handleGerarRemessaPagamento() {
    const empresaCnab = getEmpresaCnab();
    if (!empresaCnab) return;
    if (selectedPagar.size === 0) {
      toast({ title: "Atenção", description: "Selecione ao menos uma conta a pagar.", variant: "destructive" });
      return;
    }

    const pagamentos: CnabPagamento[] = pendentesPagar
      .filter((c: any) => selectedPagar.has(c.id))
      .map((c: any) => ({
        favorecidoNome: c.fornecedor_id ? getFornecedorNome(c.fornecedor_id) : "FAVORECIDO",
        favorecidoDocumento: c.fornecedor_id ? getFornecedorDoc(c.fornecedor_id) : "",
        bancoDestino: bancoObj?.banco || "077",
        agenciaDestino: "",
        contaDestino: "",
        valor: Number(c.valor),
        dataVencimento: new Date(c.data_vencimento),
        descricao: c.descricao,
        contaPagarId: c.id,
      }));

    const content = gerarRemessaPagamento(empresaCnab, pagamentos);
    const now = new Date();
    const filename = `REM_PAG_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,"0")}${now.getDate().toString().padStart(2,"0")}.rem`;
    downloadFile(content, filename);
    toast({ title: "Arquivo gerado!", description: `${filename} com ${pagamentos.length} pagamento(s)` });
    setSelectedPagar(new Set());
  }

  async function handleImportRetorno(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      const result = parseRetornoCobranca(text);
      setRetornoResult(result);
      toast({ title: "Retorno processado!", description: `${result.totalRegistros} registro(s) encontrado(s)` });
    } catch {
      toast({ title: "Erro", description: "Não foi possível processar o arquivo de retorno.", variant: "destructive" });
    }
    e.target.value = "";
  }

  function toggleReceber(id: string) {
    setSelectedReceber(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }
  function togglePagar(id: string) {
    setSelectedPagar(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function toggleAllReceber() {
    if (selectedReceber.size === pendentesReceber.length) {
      setSelectedReceber(new Set());
    } else {
      setSelectedReceber(new Set(pendentesReceber.map((c: any) => c.id)));
    }
  }
  function toggleAllPagar() {
    if (selectedPagar.size === pendentesPagar.length) {
      setSelectedPagar(new Set());
    } else {
      setSelectedPagar(new Set(pendentesPagar.map((c: any) => c.id)));
    }
  }

  const totalReceberSelecionado = pendentesReceber
    .filter((c: any) => selectedReceber.has(c.id))
    .reduce((sum: number, c: any) => sum + Number(c.valor), 0);

  const totalPagarSelecionado = pendentesPagar
    .filter((c: any) => selectedPagar.has(c.id))
    .reduce((sum: number, c: any) => sum + Number(c.valor), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">CNAB 240{bancoObj ? ` — ${bancoObj.nome}` : ""}</h1>
        <p className="text-sm text-muted-foreground">Gere arquivos de remessa e processe retornos no padrão CNAB 240</p>
      </div>

      {/* Banco Selector */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1 min-w-[200px]">
              <Select value={bancoSelecionado} onValueChange={setBancoSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o banco para geração" />
                </SelectTrigger>
                <SelectContent>
                  {bancosAtivos.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>{b.nome} — Ag: {b.agencia} / Cc: {b.conta}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {emp && (
              <Badge variant="outline" className="text-xs">
                {emp.razao_social || emp.nome_fantasia} — CNPJ: {emp.cnpj || "Não informado"}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="remessa" className="space-y-4">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="remessa" className="gap-1 text-xs"><FileUp className="h-3.5 w-3.5" /> Gerar Remessa</TabsTrigger>
          <TabsTrigger value="retorno-cobranca" className="gap-1 text-xs"><FileDown className="h-3.5 w-3.5" /> Retorno</TabsTrigger>
        </TabsList>

        {/* REMESSA - RECEBIMENTOS + PAGAMENTOS */}
        <TabsContent value="remessa" className="space-y-6">
          {/* Recebimentos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contas a Receber (Cobrança)</CardTitle>
              <CardDescription>Selecione as contas a receber pendentes para incluir na remessa de cobrança.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DateFilter
                dataDe={receberDateDe} dataAte={receberDateAte}
                onDateDeChange={setReceberDateDe} onDateAteChange={setReceberDateAte}
                onClear={() => { setReceberDateDe(""); setReceberDateAte(""); }}
              />
              {pendentesReceber.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma conta a receber pendente encontrada.</p>
              ) : (
                <>
                  <div className="border rounded-lg overflow-auto max-h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">
                            <Checkbox
                              checked={selectedReceber.size === pendentesReceber.length && pendentesReceber.length > 0}
                              onCheckedChange={toggleAllReceber}
                            />
                          </TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Vencimento</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendentesReceber.map((c: any) => (
                          <TableRow key={c.id} className="cursor-pointer" onClick={() => toggleReceber(c.id)}>
                            <TableCell><Checkbox checked={selectedReceber.has(c.id)} /></TableCell>
                            <TableCell className="font-medium text-sm">{c.descricao}</TableCell>
                            <TableCell className="text-sm">{c.cliente_id ? getClienteNome(c.cliente_id) : "—"}</TableCell>
                            <TableCell className="text-sm">{fmtDate(c.data_vencimento)}</TableCell>
                            <TableCell className="text-right text-sm font-semibold">{fmt(Number(c.valor))}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {selectedReceber.size} selecionado(s)
                      {selectedReceber.size > 0 && ` • Total: ${fmt(totalReceberSelecionado)}`}
                    </p>
                    <Button onClick={handleGerarRemessaCobranca} disabled={selectedReceber.size === 0}>
                      <Download className="h-4 w-4 mr-2" /> Gerar Remessa Cobrança .REM
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Pagamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contas a Pagar (Pagamento)</CardTitle>
              <CardDescription>Selecione as contas a pagar pendentes para incluir na remessa de pagamento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DateFilter
                dataDe={pagarDateDe} dataAte={pagarDateAte}
                onDateDeChange={setPagarDateDe} onDateAteChange={setPagarDateAte}
                onClear={() => { setPagarDateDe(""); setPagarDateAte(""); }}
              />
              {pendentesPagar.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma conta a pagar pendente encontrada.</p>
              ) : (
                <>
                  <div className="border rounded-lg overflow-auto max-h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">
                            <Checkbox
                              checked={selectedPagar.size === pendentesPagar.length && pendentesPagar.length > 0}
                              onCheckedChange={toggleAllPagar}
                            />
                          </TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Fornecedor</TableHead>
                          <TableHead>Vencimento</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendentesPagar.map((c: any) => (
                          <TableRow key={c.id} className="cursor-pointer" onClick={() => togglePagar(c.id)}>
                            <TableCell><Checkbox checked={selectedPagar.has(c.id)} /></TableCell>
                            <TableCell className="font-medium text-sm">{c.descricao}</TableCell>
                            <TableCell className="text-sm">{c.fornecedor_id ? getFornecedorNome(c.fornecedor_id) : "—"}</TableCell>
                            <TableCell className="text-sm">{fmtDate(c.data_vencimento)}</TableCell>
                            <TableCell className="text-right text-sm font-semibold">{fmt(Number(c.valor))}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {selectedPagar.size} selecionado(s)
                      {selectedPagar.size > 0 && ` • Total: ${fmt(totalPagarSelecionado)}`}
                    </p>
                    <Button onClick={handleGerarRemessaPagamento} disabled={selectedPagar.size === 0}>
                      <Download className="h-4 w-4 mr-2" /> Gerar Remessa Pagamento .REM
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>




        {/* RETORNO COBRANÇA */}
        <TabsContent value="retorno-cobranca">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Retorno de Cobrança</CardTitle>
              <CardDescription>Importe o arquivo de retorno (.ret) do banco para processar baixas automáticas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="cursor-pointer">
                  <input type="file" accept=".ret,.txt,.RET" className="hidden" onChange={handleImportRetorno} />
                  <Button asChild variant="outline"><span><FileText className="h-4 w-4 mr-2" /> Importar Arquivo de Retorno</span></Button>
                </label>
              </div>

              {retornoResult && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Card><CardContent className="pt-3 pb-3">
                      <p className="text-[10px] text-muted-foreground">Empresa</p>
                      <p className="text-sm font-bold truncate">{retornoResult.empresa}</p>
                    </CardContent></Card>
                    <Card><CardContent className="pt-3 pb-3">
                      <p className="text-[10px] text-muted-foreground">Registros</p>
                      <p className="text-sm font-bold">{retornoResult.totalRegistros}</p>
                    </CardContent></Card>
                    <Card><CardContent className="pt-3 pb-3">
                      <p className="text-[10px] text-muted-foreground">Valor Total</p>
                      <p className="text-sm font-bold">{fmt(retornoResult.valorTotal)}</p>
                    </CardContent></Card>
                    <Card><CardContent className="pt-3 pb-3">
                      <p className="text-[10px] text-muted-foreground">Banco</p>
                      <p className="text-sm font-bold">{retornoResult.banco}</p>
                    </CardContent></Card>
                  </div>

                  <div className="border rounded-lg overflow-auto max-h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nosso Número</TableHead>
                          <TableHead>Ocorrência</TableHead>
                          <TableHead>Data Pagamento</TableHead>
                          <TableHead>Data Crédito</TableHead>
                          <TableHead className="text-right">Valor Pago</TableHead>
                          <TableHead className="text-right">Tarifa</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {retornoResult.items.map((item, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm font-mono">{item.nossoNumero}</TableCell>
                            <TableCell>
                              <Badge variant={item.codigoOcorrencia === "06" ? "default" : "secondary"} className="text-xs">
                                {item.ocorrencia}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{fmtDate(item.dataPagamento)}</TableCell>
                            <TableCell className="text-sm">{fmtDate(item.dataCredito)}</TableCell>
                            <TableCell className="text-right text-sm font-semibold">{fmt(item.valorPago)}</TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">{fmt(item.valorTarifa)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}