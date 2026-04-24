/**
 * Página de Conciliação de Cartões
 * @agente-frontend
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ImportarExtratoCartao,
  TabelaTransacoesCartao,
  MatchSuggestionCard,
  ConciliacaoManualModal,
  ResumoConciliacao,
  type TransacaoCartao,
  type BandeiraCartao,
  type StatusTransacaoCartao,
} from "@/components/conciliacao/cartoes";
import { BandeiraBadge } from "@/components/ui/BandeiraBadge";
import { useConciliacaoCartoes } from "@/hooks/useConciliacaoCartoes";
import { useAuth } from "@/contexts/AuthContext";
import {
  CreditCard,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  BarChart3,
  Download,
  Filter,
  Search,
  Sparkles,
} from "lucide-react";

const bandeiras: BandeiraCartao[] = ["visa", "mastercard", "elo", "amex", "hipercard", "outros"];

export default function ConciliacaoCartoesPage() {
  const { user } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState("importar");
  const [filtroBandeira, setFiltroBandeira] = useState<BandeiraCartao | "todos">("todos");
  const [filtroStatus, setFiltroStatus] = useState<StatusTransacaoCartao | "todos">("todos");
  const [filtroBusca, setFiltroBusca] = useState("");
  const [transacaoManual, setTransacaoManual] = useState<TransacaoCartao | null>(null);
  const [selecionados, setSelecionados] = useState<string[]>([]);

  const {
    transacoesFiltradas,
    resumo,
    sugestoes,
    isLoading,
    isProcessing,
    importarTransacoes,
    conciliarManual,
    desconciliar,
    excluirTransacao,
    conciliarAutomatico,
  } = useConciliacaoCartoes({
    empresaId: user?.id || '',
    filtros: {
      bandeira: filtroBandeira,
      status: filtroStatus,
      busca: filtroBusca,
    },
  });

  const handleConciliarAutomatico = async () => {
    await conciliarAutomatico();
  };

  // Mock de candidatos para demonstração
  const candidatosMock = [
    { id: "c1", tipo: "conta_receber" as const, descricao: "Venda #1234", valor: 150.0, data: "2024-01-15" },
    { id: "c2", tipo: "lancamento" as const, descricao: "Serviço Prestado", valor: 145.0, data: "2024-01-15" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Conciliação de Cartões
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie transações de cartão de crédito e débito
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Badge variant="secondary" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            IA Ativa
          </Badge>
        </div>
      </div>

      {/* Resumo */}
      <ResumoConciliacao resumo={resumo} loading={isLoading} />

      {/* Tabs Principais */}
      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="importar" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Importar
          </TabsTrigger>
          <TabsTrigger value="pendentes" className="gap-2">
            <Clock className="h-4 w-4" />
            Pendentes
            {resumo.total_pendentes > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {resumo.total_pendentes}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="conciliados" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Conciliados
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="importar" className="space-y-4">
            <ImportarExtratoCartao onImportar={importarTransacoes} />
          </TabsContent>

          <TabsContent value="pendentes" className="space-y-4">
            {/* Filtros */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filtros:</span>
                  </div>
                  <Select
                    value={filtroBandeira}
                    onValueChange={(v) => setFiltroBandeira(v as BandeiraCartao | "todos")}
                  >
                    <SelectTrigger className="w-[150px] h-9">
                      <SelectValue placeholder="Bandeira" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas Bandeiras</SelectItem>
                      {bandeiras.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b.charAt(0).toUpperCase() + b.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
                      value={filtroBusca}
                      onChange={(e) => setFiltroBusca(e.target.value)}
                      className="pl-9 h-9 w-[200px]"
                    />
                  </div>
                  {selecionados.length > 0 && (
                    <Button
                      size="sm"
                      onClick={handleConciliarAutomatico}
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Processando..." : `Conciliar ${selecionados.length}`}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tabela */}
            <TabelaTransacoesCartao
              transacoes={transacoesFiltradas.filter((t) => t.status === "pendente")}
              onSelecionar={setSelecionados}
              onConciliarManual={(t) => setTransacaoManual(t)}
              onExcluir={excluirTransacao}
              loading={isLoading}
            />

            {/* Sugestões de Match */}
            {selecionados.length > 0 && sugestoes[selecionados[0]] && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <MatchSuggestionCard
                  transacao={transacoesFiltradas.find((t) => t.id === selecionados[0])!}
                  sugestao={sugestoes[selecionados[0]][0]}
                  candidato={candidatosMock[0]}
                  onAceitar={async () => {
                    await conciliarManual(selecionados[0], candidatosMock[0].id, candidatosMock[0].tipo);
                  }}
                  onRecusar={() => {
                    // Implementar recusa
                  }}
                />
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="conciliados" className="space-y-4">
            <TabelaTransacoesCartao
              transacoes={transacoesFiltradas.filter((t) => t.status === "conciliado")}
              onDesconciliar={desconciliar}
              loading={isLoading}
            />
          </TabsContent>

          <TabsContent value="relatorios" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                  {bandeiras.map((b) => {
                    const txs = transacoesFiltradas.filter((t) => t.bandeira === b);
                    const total = txs.reduce((s, t) => s + t.valor_bruto, 0);
                    return (
                      <div key={b} className="flex flex-col items-center p-3 border rounded-lg">
                        <BandeiraBadge bandeira={b} size="sm" />
                        <span className="text-lg font-bold mt-2">
                          {txs.length}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </AnimatePresence>
      </Tabs>

      {/* Modal de Conciliação Manual */}
      <ConciliacaoManualModal
        transacao={transacaoManual}
        candidatos={candidatosMock}
        onClose={() => setTransacaoManual(null)}
        onConciliar={conciliarManual}
        onConciliarDireto={async (id) => {
          // Implementar conciliação direta
        }}
      />
    </div>
  );
}
