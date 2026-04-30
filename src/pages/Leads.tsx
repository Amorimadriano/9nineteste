import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, Building2, TrendingUp, Users, AlertCircle, MessageSquare, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  cnpj?: string;
  faturamento_mensal?: string;
  num_funcionarios?: string;
  principal_dor?: string;
  origem: string;
  status: string;
  observacoes_internas?: string;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: "novo", label: "Novo", color: "bg-blue-500" },
  { value: "contatado", label: "Contatado", color: "bg-yellow-500" },
  { value: "reuniao_agendada", label: "Reunião Agendada", color: "bg-purple-500" },
  { value: "proposta", label: "Proposta Enviada", color: "bg-orange-500" },
  { value: "fechado", label: "Cliente Fechado", color: "bg-green-500" },
  { value: "perdido", label: "Perdido", color: "bg-red-500" },
];

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [filter, setFilter] = useState<string>("todos");
  const { toast } = useToast();

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await (supabase.from("leads_diagnostico") as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Erro ao carregar leads", description: error.message, variant: "destructive" });
    } else {
      setLeads((data as Lead[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    const { error } = await (supabase.from("leads_diagnostico") as any).update(updates).eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lead atualizado!" });
      fetchLeads();
      if (selected?.id === id) setSelected({ ...selected, ...updates });
    }
  };

  const deleteLead = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este lead?")) return;
    const { error } = await (supabase.from("leads_diagnostico") as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lead excluído" });
      fetchLeads();
      setSelected(null);
    }
  };

  const filtered = filter === "todos" ? leads : leads.filter((l) => l.status === filter);

  const stats = {
    total: leads.length,
    novos: leads.filter((l) => l.status === "novo").length,
    emNegociacao: leads.filter((l) => ["contatado", "reuniao_agendada", "proposta"].includes(l.status)).length,
    fechados: leads.filter((l) => l.status === "fechado").length,
  };

  const getStatusBadge = (status: string) => {
    const opt = STATUS_OPTIONS.find((s) => s.value === status);
    return <Badge className={`${opt?.color} text-white`}>{opt?.label || status}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leads Capturados</h1>
        <p className="text-muted-foreground">Gerencie os leads do formulário de Diagnóstico Gratuito do site</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Leads</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Novos</p>
                <p className="text-3xl font-bold text-blue-600">{stats.novos}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Negociação</p>
                <p className="text-3xl font-bold text-orange-600">{stats.emNegociacao}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clientes Fechados</p>
                <p className="text-3xl font-bold text-green-600">{stats.fechados}</p>
              </div>
              <Building2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <Button variant={filter === "todos" ? "default" : "outline"} size="sm" onClick={() => setFilter("todos")}>
          Todos ({leads.length})
        </Button>
        {STATUS_OPTIONS.map((s) => (
          <Button
            key={s.value}
            variant={filter === s.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(s.value)}
          >
            {s.label} ({leads.filter((l) => l.status === s.value).length})
          </Button>
        ))}
      </div>

      {/* Lista */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhum lead encontrado.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((lead) => (
                <div
                  key={lead.id}
                  className="border rounded-lg p-4 hover:bg-muted/30 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-semibold">{lead.nome}</p>
                      {getStatusBadge(lead.status)}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(lead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {lead.empresa}</span>
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {lead.email}</span>
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {lead.telefone}</span>
                      {lead.faturamento_mensal && (
                        <span className="flex items-center gap-1 text-green-600 font-semibold">
                          <TrendingUp className="h-3 w-3" /> {lead.faturamento_mensal}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`https://wa.me/55${lead.telefone.replace(/\D/g, "")}`, "_blank")}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSelected(lead)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteLead(lead.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalhes */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Lead</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Nome</p>
                  <p className="font-semibold">{selected.nome}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Empresa</p>
                  <p className="font-semibold">{selected.empresa}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">E-mail</p>
                  <p>{selected.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p>{selected.telefone}</p>
                </div>
                {selected.cnpj && (
                  <div>
                    <p className="text-xs text-muted-foreground">CNPJ</p>
                    <p>{selected.cnpj}</p>
                  </div>
                )}
                {selected.faturamento_mensal && (
                  <div>
                    <p className="text-xs text-muted-foreground">Faturamento Mensal</p>
                    <p className="font-semibold text-green-600">{selected.faturamento_mensal}</p>
                  </div>
                )}
                {selected.num_funcionarios && (
                  <div>
                    <p className="text-xs text-muted-foreground">Nº Funcionários</p>
                    <p>{selected.num_funcionarios}</p>
                  </div>
                )}
              </div>

              {selected.principal_dor && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Principal Dor / Necessidade</p>
                  <p className="bg-muted/50 p-3 rounded text-sm">{selected.principal_dor}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Select value={selected.status} onValueChange={(v) => updateLead(selected.id, { status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Observações Internas</p>
                <Textarea
                  defaultValue={selected.observacoes_internas || ""}
                  rows={3}
                  onBlur={(e) => {
                    if (e.target.value !== (selected.observacoes_internas || "")) {
                      updateLead(selected.id, { observacoes_internas: e.target.value });
                    }
                  }}
                  placeholder="Anote informações da conversa, próximos passos..."
                />
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => window.open(`https://wa.me/55${selected.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${selected.nome}, sou da 9Nine Business Control. Vi que você solicitou um diagnóstico financeiro gratuito para a ${selected.empresa}.`)}`, "_blank")}
                >
                  <MessageSquare className="h-4 w-4 mr-2" /> WhatsApp
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => window.open(`mailto:${selected.email}`, "_blank")}>
                  <Mail className="h-4 w-4 mr-2" /> E-mail
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
