import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import {
  BancoCard,
  BankData,
} from "@/components/openbanking/BancoCard";
import { OpenBankingWizard } from "@/components/openbanking/OpenBankingWizard";
import { ExtratoPreview, Transaction } from "@/components/openbanking/ExtratoPreview";
import { SyncStatus } from "@/components/openbanking/SyncStatus";
import {
  Plus,
  Building2,
  Shield,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Settings,
  FileText,
  CreditCard,
  Wallet,
  TrendingUp,
  Unlink,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// Dados mockados para demonstração
const mockConnectedBanks: BankData[] = [
  {
    id: "1",
    code: "260",
    name: "Nubank",
    fullName: "Nu Pagamentos S.A.",
    primaryColor: "#820AD1",
    status: "active",
    lastSync: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 85), // 85 dias
    accountCount: 2,
  },
  {
    id: "2",
    code: "341",
    name: "Itaú",
    fullName: "Itaú Unibanco S.A.",
    primaryColor: "#EC3625",
    status: "active",
    lastSync: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60), // 60 dias
    accountCount: 1,
  },
];

const mockTransactions: Transaction[] = [
  {
    id: "1",
    date: "2026-04-15",
    description: "Transferência Pix recebida",
    amount: 2500.00,
    type: "credit",
    category: "pix",
    status: "completed",
  },
  {
    id: "2",
    date: "2026-04-15",
    description: "Pagamento conta de luz",
    amount: 189.45,
    type: "debit",
    category: "pagamento",
    status: "completed",
  },
  {
    id: "3",
    date: "2026-04-14",
    description: "Compra no débito - Supermercado",
    amount: 423.78,
    type: "debit",
    category: "compra",
    status: "completed",
  },
  {
    id: "4",
    date: "2026-04-13",
    description: "Depósito em dinheiro",
    amount: 1000.00,
    type: "credit",
    category: "deposito",
    status: "completed",
  },
  {
    id: "5",
    date: "2026-04-12",
    description: "TED enviada - João Silva",
    amount: 1500.00,
    type: "debit",
    category: "transferencia",
    status: "completed",
  },
];

// Estatísticas mockadas
const mockStats = {
  totalConnected: 2,
  totalTransactions: 145,
  last30Days: 23,
  autoSyncEnabled: true,
};

export default function OpenBankingConfig() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<BankData | null>(null);
  const [connectedBanks, setConnectedBanks] = useState<BankData[]>(mockConnectedBanks);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncingBankIds, setSyncingBankIds] = useState<string[]>([]);

  const handleConnect = () => {
    setWizardOpen(true);
  };

  const handleWizardComplete = () => {
    toast.success("Banco conectado com sucesso!");
    setWizardOpen(false);
  };

  const handleDisconnect = (bank: BankData) => {
    setSelectedBank(bank);
    setDisconnectDialogOpen(true);
  };

  const confirmDisconnect = () => {
    if (selectedBank) {
      setConnectedBanks((prev) => prev.filter((b) => b.id !== selectedBank.id));
      toast.success(`${selectedBank.name} desconectado com sucesso`);
      setDisconnectDialogOpen(false);
      setSelectedBank(null);
    }
  };

  const handleSync = async (bankId: string) => {
    setSyncingBankIds((prev) => (prev.includes(bankId) ? prev : [...prev, bankId]));
    setConnectedBanks((prev) =>
      prev.map((bank) => (bank.id === bankId ? { ...bank, status: "syncing" } : bank))
    );

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setConnectedBanks((prev) =>
        prev.map((bank) =>
          bank.id === bankId
            ? { ...bank, status: "active", lastSync: new Date() }
            : bank
        )
      );
      toast.success("Sincronização realizada com sucesso");
    } finally {
      setSyncingBankIds((prev) => prev.filter((id) => id !== bankId));
    }
  };

  const handleSyncAll = async () => {
    if (connectedBanks.length === 0) return;

    setIsSyncing(true);
    const ids = connectedBanks.map((bank) => bank.id);
    setSyncingBankIds(ids);
    setConnectedBanks((prev) => prev.map((bank) => ({ ...bank, status: "syncing" })));

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setConnectedBanks((prev) =>
        prev.map((bank) => ({ ...bank, status: "active", lastSync: new Date() }))
      );
      toast.success("Todas as contas foram sincronizadas");
    } finally {
      setIsSyncing(false);
      setSyncingBankIds([]);
    }
  };

  const activeBanks = connectedBanks.filter((b) => b.status === "active");
  const expiredBanks = connectedBanks.filter((b) => b.status === "expired");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Open Banking</h1>
          <p className="text-sm text-muted-foreground">
            Conecte suas contas bancárias via Open Banking para sincronização automática
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSyncAll}
            disabled={isSyncing || connectedBanks.length === 0}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Sincronizando..." : "Sincronizar Tudo"}
          </Button>
          <Button onClick={handleConnect}>
            <Plus className="mr-2 h-4 w-4" />
            Conectar Banco
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {expiredBanks.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Consentimentos expirando</AlertTitle>
          <AlertDescription>
            {expiredBanks.length} banco(s) precisam de renovação de autorização.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="connected" className="space-y-6">
        <TabsList>
          <TabsTrigger value="connected" className="gap-2">
            <Building2 className="h-4 w-4" />
            Bancos Conectados
            {connectedBanks.length > 0 && (
              <Badge variant="secondary" className="ml-1">{connectedBanks.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2">
            <FileText className="h-4 w-4" />
            Extratos
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Tab: Bancos Conectados */}
        <TabsContent value="connected" className="space-y-6">
          {/* Cards de estatísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Bancos Conectados</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  {connectedBanks.length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Transações Sincronizadas</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  {mockStats.totalTransactions}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Últimos 30 Dias</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-blue-500" />
                  {mockStats.last30Days}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Sincronização</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <RefreshCw className={`h-5 w-5 ${mockStats.autoSyncEnabled ? "text-green-500" : "text-gray-500"}`} />
                  {mockStats.autoSyncEnabled ? "Automática" : "Manual"}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Lista de bancos */}
          {connectedBanks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {connectedBanks.map((bank) => (
                   <BancoCard
                    key={bank.id}
                     bank={{
                       ...bank,
                       status: syncingBankIds.includes(bank.id) ? "syncing" : bank.status,
                     }}
                    onSync={() => handleSync(bank.id)}
                    onDisconnect={() => handleDisconnect(bank)}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Nenhum banco conectado</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Conecte suas contas bancárias para sincronizar extratos e
                    transações automaticamente.
                  </p>
                </div>
                <Button onClick={handleConnect}>
                  <Plus className="mr-2 h-4 w-4" />
                  Conectar Primeiro Banco
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Extratos */}
        <TabsContent value="transactions" className="space-y-6">
          {connectedBanks.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {connectedBanks.map((bank) => (
                <ExtratoPreview
                  key={bank.id}
                  bankName={bank.name}
                  bankColor={bank.primaryColor}
                  transactions={mockTransactions}
                  lastSync={bank.lastSync}
                  onRefresh={() => handleSync(bank.id)}
                  onViewFull={() => console.log("Ver extrato completo de", bank.name)}
                />
              ))}
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center space-y-4">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="text-lg font-semibold">Nenhuma transação disponível</h3>
                <p className="text-sm text-muted-foreground">
                  Conecte um banco para visualizar suas transações.
                </p>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Configurações */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Gerencie as preferências de sincronização e privacidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sincronização automática */}
              <div className="flex items-center justify-between py-4 border-b">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Sincronização Automática
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Sincronize transações automaticamente a cada 6 horas
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  {mockStats.autoSyncEnabled ? "Desativar" : "Ativar"}
                </Button>
              </div>

              {/* Histórico */}
              <div className="flex items-center justify-between py-4 border-b">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Período de Retenção
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Manter histórico de transações por 24 meses
                  </p>
                </div>
                <Badge variant="outline">24 meses</Badge>
              </div>

              {/* Segurança */}
              <div className="flex items-center justify-between py-4 border-b">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Alertas de Segurança
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Receber notificações sobre atividades suspeitas
                  </p>
                </div>
                <Button variant="outline" size="sm">Ativado</Button>
              </div>

              {/* Documentação */}
              <div className="pt-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Sobre o Open Banking</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>
                      O Open Banking é uma iniciativa do Banco Central do Brasil que
                      permite o compartilhamento seguro de dados financeiros entre
                      instituições, com sua autorização explícita.
                    </p>
                    <Button variant="link" className="h-auto p-0 text-xs">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Saiba mais no site do Banco Central
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Wizard de Conexão */}
      <OpenBankingWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onComplete={handleWizardComplete}
      />

      {/* Dialog de confirmação de desconexão */}
      <Dialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlink className="h-5 w-5 text-destructive" />
              Desconectar Banco
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja desconectar{" "}
              <strong>{selectedBank?.name}</strong>? Todas as transações
              sincronizadas serão mantidas, mas não haverá mais atualizações automáticas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDisconnectDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDisconnect}>
              Desconectar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
