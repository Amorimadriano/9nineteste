import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  Eye,
  Calendar,
  Filter,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type {
  LogSincronizacao as LogSincronizacaoType,
  StatusSincronizacao,
  TipoOperacao,
} from "@/types/contabilidade";
import { TIPOS_OPERACAO } from "@/types/contabilidade";

interface LogSincronizacaoProps {
  logs: LogSincronizacaoType[];
  onReexecutar?: (logId: string) => void;
  onDownloadLog?: (logId: string) => void;
  isLoading?: boolean;
}

interface Filtros {
  dataInicio?: Date;
  dataFim?: Date;
  tipo?: TipoOperacao | "todos";
  status?: StatusSincronizacao | "todos";
}

const statusConfig: Record<StatusSincronizacao, { color: string; bgColor: string }> = {
  pendente: { color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
  processando: { color: "text-blue-500", bgColor: "bg-blue-500/10" },
  sucesso: { color: "text-green-500", bgColor: "bg-green-500/10" },
  erro: { color: "text-red-500", bgColor: "bg-red-500/10" },
  aviso: { color: "text-orange-500", bgColor: "bg-orange-500/10" },
};

const statusLabels: Record<StatusSincronizacao, string> = {
  pendente: "Pendente",
  processando: "Processando",
  sucesso: "Sucesso",
  erro: "Erro",
  aviso: "Aviso",
};

export function LogSincronizacao({
  logs,
  onReexecutar,
  onDownloadLog,
  isLoading,
}: LogSincronizacaoProps) {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<LogSincronizacaoType | null>(null);
  const [filtros, setFiltros] = useState<Filtros>({ tipo: "todos", status: "todos" });
  const [showFilters, setShowFilters] = useState(false);

  const toggleExpand = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatarDuracao = (inicio: string, fim?: string) => {
    if (!fim) return "Em andamento";
    const duracao = new Date(fim).getTime() - new Date(inicio).getTime();
    const segundos = Math.floor(duracao / 1000);
    if (segundos < 60) return `${segundos}s`;
    const minutos = Math.floor(segundos / 60);
    const restoSegundos = segundos % 60;
    return `${minutos}m ${restoSegundos}s`;
  };

  const getTipoOperacaoLabel = (tipo: TipoOperacao) => {
    return TIPOS_OPERACAO.find((t) => t.value === tipo)?.label || tipo;
  };

  const logsFiltrados = logs.filter((log) => {
    if (filtros.tipo && filtros.tipo !== "todos" && log.tipo_operacao !== filtros.tipo) {
      return false;
    }
    if (filtros.status && filtros.status !== "todos" && log.status !== filtros.status) {
      return false;
    }
    if (filtros.dataInicio && new Date(log.data_inicio) < filtros.dataInicio) {
      return false;
    }
    if (filtros.dataFim) {
      const dataFim = new Date(filtros.dataFim);
      dataFim.setHours(23, 59, 59);
      if (new Date(log.data_inicio) > dataFim) {
        return false;
      }
    }
    return true;
  });

  const limparFiltros = () => {
    setFiltros({ tipo: "todos", status: "todos" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Histórico de Sincronização</CardTitle>
              <CardDescription>
                Visualize o histórico de todas as sincronizações realizadas
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? "bg-muted" : ""}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filtros */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-muted/50 rounded-lg space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Filtros</span>
                  <Button variant="ghost" size="sm" onClick={limparFiltros}>
                    <X className="h-4 w-4 mr-2" />
                    Limpar
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data Início</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {filtros.dataInicio
                            ? format(filtros.dataInicio, "dd/MM/yyyy")
                            : "Selecionar"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={filtros.dataInicio}
                          onSelect={(date) =>
                            setFiltros({ ...filtros, dataInicio: date })
                          }
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data Fim</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {filtros.dataFim
                            ? format(filtros.dataFim, "dd/MM/yyyy")
                            : "Selecionar"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={filtros.dataFim}
                          onSelect={(date) =>
                            setFiltros({ ...filtros, dataFim: date })
                          }
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo</label>
                    <Select
                      value={filtros.tipo}
                      onValueChange={(value) =>
                        setFiltros({ ...filtros, tipo: value as TipoOperacao | "todos" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {TIPOS_OPERACAO.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={filtros.status}
                      onValueChange={(value) =>
                        setFiltros({
                          ...filtros,
                          status: value as StatusSincronizacao | "todos",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="sucesso">Sucesso</SelectItem>
                        <SelectItem value="erro">Erro</SelectItem>
                        <SelectItem value="aviso">Aviso</SelectItem>
                        <SelectItem value="processando">Processando</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabela */}
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registros</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  logsFiltrados.map((log) => (
                    <>
                      <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell onClick={() => toggleExpand(log.id)}>
                          {formatarData(log.data_inicio)}
                        </TableCell>
                        <TableCell onClick={() => toggleExpand(log.id)}>
                          {getTipoOperacaoLabel(log.tipo_operacao)}
                        </TableCell>
                        <TableCell onClick={() => toggleExpand(log.id)}>
                          <Badge
                            variant="secondary"
                            className={`${statusConfig[log.status].bgColor} ${statusConfig[log.status].color}`}
                          >
                            {statusLabels[log.status]}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={() => toggleExpand(log.id)}>
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">{log.registros_sucesso}</span>
                            {log.registros_erro > 0 && (
                              <>
                                <span className="text-muted-foreground">/</span>
                                <span className="text-red-600">{log.registros_erro}</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell onClick={() => toggleExpand(log.id)}>
                          {formatarDuracao(log.data_inicio, log.data_fim)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => toggleExpand(log.id)}>
                              {expandedLogId === log.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedLogId === log.id && (
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={6} className="p-4">
                            <div className="space-y-2">
                              <p className="font-medium">Detalhes</p>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Processados:</span>{" "}
                                  {log.registros_processados}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Sucesso:</span>{" "}
                                  {log.registros_sucesso}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Erros:</span>{" "}
                                  {log.registros_erro}
                                </div>
                                {log.mensagem && (
                                  <div className="col-span-2">
                                    <span className="text-muted-foreground">Mensagem:</span>{" "}
                                    {log.mensagem}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2 pt-2">
                                {onReexecutar && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onReexecutar(log.id)}
                                    disabled={isLoading}
                                  >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Reexecutar
                                  </Button>
                                )}
                                {onDownloadLog && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onDownloadLog(log.id)}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Log
                                  </Button>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Sincronização</DialogTitle>
            <DialogDescription>
              Visualize todos os detalhes desta execução
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">ID</p>
                  <p className="font-mono text-sm">{selectedLog.id}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p>{getTipoOperacaoLabel(selectedLog.tipo_operacao)}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant="secondary"
                    className={`${statusConfig[selectedLog.status].bgColor} ${statusConfig[selectedLog.status].color}`}
                  >
                    {statusLabels[selectedLog.status]}
                  </Badge>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Duração</p>
                  <p>{formatarDuracao(selectedLog.data_inicio, selectedLog.data_fim)}</p>
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <p className="font-medium">Resultados</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Processados:</span>{" "}
                    <span className="font-medium">{selectedLog.registros_processados}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sucesso:</span>{" "}
                    <span className="font-medium text-green-600">{selectedLog.registros_sucesso}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Erros:</span>{" "}
                    <span className="font-medium text-red-600">{selectedLog.registros_erro}</span>
                  </div>
                </div>
              </div>
              {selectedLog.mensagem && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Mensagem</p>
                  <p>{selectedLog.mensagem}</p>
                </div>
              )}
              {selectedLog.detalhes && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Detalhes Técnicos</p>
                  <pre className="text-xs overflow-auto max-h-40 p-2 bg-background rounded">
                    {JSON.stringify(selectedLog.detalhes, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
