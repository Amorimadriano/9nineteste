import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const ADMIN_EMAILS = ["9ninebpo9@gmail.com", "adriano.amorim83@gmail.com", "amorim.adriano83@gmail.com", "marketing@9ninebusinesscontrol.com.br"];
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ShieldCheck, ChevronDown, ChevronUp, Search } from "lucide-react";

const TABLE_LABELS: Record<string, string> = {
  contas_pagar: "Contas a Pagar",
  contas_receber: "Contas a Receber",
  lancamentos_caixa: "Lançamentos de Caixa",
  categorias: "Categorias",
  clientes: "Clientes",
  fornecedores: "Fornecedores",
  bancos_cartoes: "Bancos e Cartões",
  extrato_bancario: "Extrato Bancário",
  empresa: "Empresa",
  fechamentos_mensais: "Fechamentos Mensais",
  metas_orcamentarias: "Metas Orçamentárias",
  anexos: "Anexos",
};

const ACTION_CONFIG: Record<string, { label: string; color: string }> = {
  INSERT: { label: "Criação", color: "bg-green-100 text-green-800 border-green-300" },
  UPDATE: { label: "Edição", color: "bg-blue-100 text-blue-800 border-blue-300" },
  DELETE: { label: "Exclusão", color: "bg-red-100 text-red-800 border-red-300" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function DiffViewer({ oldData, newData, action }: { oldData: any; newData: any; action: string }) {
  if (action === "INSERT" && newData) {
    const entries = Object.entries(newData).filter(([k]) => !["id", "user_id", "created_at", "updated_at"].includes(k));
    return (
      <div className="text-xs space-y-1 max-h-48 overflow-auto">
        <p className="font-semibold text-green-700 mb-1">Dados criados:</p>
        {entries.map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <span className="text-muted-foreground min-w-[120px]">{k}:</span>
            <span className="text-foreground">{v === null ? "—" : String(v)}</span>
          </div>
        ))}
      </div>
    );
  }
  if (action === "DELETE" && oldData) {
    const entries = Object.entries(oldData).filter(([k]) => !["id", "user_id", "created_at", "updated_at"].includes(k));
    return (
      <div className="text-xs space-y-1 max-h-48 overflow-auto">
        <p className="font-semibold text-red-700 mb-1">Dados removidos:</p>
        {entries.map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <span className="text-muted-foreground min-w-[120px]">{k}:</span>
            <span className="text-foreground line-through">{v === null ? "—" : String(v)}</span>
          </div>
        ))}
      </div>
    );
  }
  if (action === "UPDATE" && oldData && newData) {
    const changedKeys = Object.keys(newData).filter(
      (k) => !["id", "user_id", "created_at", "updated_at"].includes(k) && JSON.stringify(oldData[k]) !== JSON.stringify(newData[k])
    );
    if (changedKeys.length === 0) return <p className="text-xs text-muted-foreground">Nenhuma alteração detectada</p>;
    return (
      <div className="text-xs space-y-1.5 max-h-48 overflow-auto">
        <p className="font-semibold text-blue-700 mb-1">Campos alterados:</p>
        {changedKeys.map((k) => (
          <div key={k} className="flex flex-col gap-0.5 pb-1 border-b border-border/50">
            <span className="text-muted-foreground font-medium">{k}</span>
            <div className="flex gap-2 items-center">
              <span className="text-red-600 line-through">{oldData[k] === null ? "—" : String(oldData[k])}</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-green-700">{newData[k] === null ? "—" : String(newData[k])}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return <p className="text-xs text-muted-foreground">Sem dados disponíveis</p>;
}

export default function Auditoria() {
  const { user } = useAuth();
  const [filterTable, setFilterTable] = useState<string>("todas");
  const [filterAction, setFilterAction] = useState<string>("todas");
  const [filterSearch, setFilterSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit_logs", user?.id, page],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Admin guard - after all hooks
  if (!ADMIN_EMAILS.includes(user?.email || "")) return <Navigate to="/" replace />;

  const filtered = useMemo(() => {
    return (logs as any[]).filter((log) => {
      if (filterTable !== "todas" && log.table_name !== filterTable) return false;
      if (filterAction !== "todas" && log.action !== filterAction) return false;
      if (filterSearch) {
        const search = filterSearch.toLowerCase();
        const desc = log.new_data?.descricao || log.old_data?.descricao || log.new_data?.nome || log.old_data?.nome || "";
        if (!desc.toLowerCase().includes(search) && !log.table_name.includes(search)) return false;
      }
      return true;
    });
  }, [logs, filterTable, filterAction, filterSearch]);

  const stats = useMemo(() => {
    const all = logs as any[];
    return {
      total: all.length,
      inserts: all.filter(l => l.action === "INSERT").length,
      updates: all.filter(l => l.action === "UPDATE").length,
      deletes: all.filter(l => l.action === "DELETE").length,
    };
  }, [logs]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" /> Auditoria do Sistema
        </h1>
        <p className="text-sm text-muted-foreground">Histórico completo de todas as alterações realizadas no sistema</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 pb-4">
          <p className="text-[10px] text-muted-foreground">Total de Registros</p>
          <p className="text-lg font-bold text-primary">{stats.total}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <p className="text-[10px] text-muted-foreground">Criações</p>
          <p className="text-lg font-bold text-green-600">{stats.inserts}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <p className="text-[10px] text-muted-foreground">Edições</p>
          <p className="text-lg font-bold text-blue-600">{stats.updates}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <p className="text-[10px] text-muted-foreground">Exclusões</p>
          <p className="text-lg font-bold text-red-600">{stats.deletes}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Filtros</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Tabela</Label>
              <Select value={filterTable} onValueChange={setFilterTable}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {Object.entries(TABLE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ação</Label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="INSERT">Criação</SelectItem>
                  <SelectItem value="UPDATE">Edição</SelectItem>
                  <SelectItem value="DELETE">Exclusão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" placeholder="Descrição ou nome..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Carregando logs...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Nenhum registro de auditoria encontrado</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">Data/Hora</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Tabela</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-[60px]">Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((log: any) => {
                    const config = ACTION_CONFIG[log.action] || { label: log.action, color: "bg-muted text-muted-foreground" };
                    const desc = log.new_data?.descricao || log.old_data?.descricao || log.new_data?.nome || log.old_data?.nome || "—";
                    const isExpanded = expandedRow === log.id;
                    return (
                      <>
                        <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setExpandedRow(isExpanded ? null : log.id)}>
                          <TableCell className="text-xs text-muted-foreground">{formatDate(log.created_at)}</TableCell>
                          <TableCell><Badge variant="outline" className={`text-xs ${config.color}`}>{config.label}</Badge></TableCell>
                          <TableCell className="text-sm">{TABLE_LABELS[log.table_name] || log.table_name}</TableCell>
                          <TableCell className="text-sm truncate max-w-[200px]">{desc}</TableCell>
                          <TableCell>{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow key={`${log.id}-detail`}>
                            <TableCell colSpan={5} className="bg-muted/30 p-4">
                              <DiffViewer oldData={log.old_data} newData={log.new_data} action={log.action} />
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Anterior</Button>
        <span className="text-sm text-muted-foreground">Página {page + 1}</span>
        <Button variant="outline" size="sm" disabled={(logs as any[]).length < pageSize} onClick={() => setPage(p => p + 1)}>Próxima</Button>
      </div>
    </div>
  );
}
