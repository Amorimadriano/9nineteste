import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Building2, User, Info, Shield, Mail, Phone, MapPin, FileText, Globe } from "lucide-react";

export default function Configuracoes() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Perfil
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "A senha deve ter pelo menos 8 caracteres", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao alterar senha", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Senha alterada com sucesso!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie as informações do sistema</p>
      </div>

      <Tabs defaultValue="sistema" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sistema" className="gap-2"><Info className="h-4 w-4" /> Sistema</TabsTrigger>
          <TabsTrigger value="perfil" className="gap-2"><User className="h-4 w-4" /> Perfil</TabsTrigger>
          <TabsTrigger value="seguranca" className="gap-2"><Shield className="h-4 w-4" /> Segurança</TabsTrigger>
        </TabsList>

        {/* Sistema */}
        <TabsContent value="sistema" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" /> Informações do Sistema
              </CardTitle>
              <CardDescription>Dados gerais do ERP Financeiro</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Nome do Sistema</Label>
                  <div className="p-3 rounded-lg bg-muted/50 font-medium">ERP Financeiro</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Empresa</Label>
                  <div className="p-3 rounded-lg bg-muted/50 font-medium">9Nine BPO</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Versão</Label>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <Badge variant="outline">v1.0.0</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Ambiente</Label>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <Badge className="bg-accent text-accent-foreground">Produção</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" /> Módulos Ativos
              </CardTitle>
              <CardDescription>Funcionalidades disponíveis no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { nome: "Dashboard", desc: "Visão geral financeira" },
                  { nome: "Contas a Receber", desc: "Gestão de recebíveis" },
                  { nome: "Contas a Pagar", desc: "Gestão de pagamentos" },
                  { nome: "Conciliação Bancária", desc: "Importação OFX e conciliação" },
                  { nome: "Fluxo de Caixa", desc: "Realizado e orçado" },
                  { nome: "DRE Gerencial", desc: "Demonstrativo de resultados" },
                  { nome: "Planejamento Orçamentário", desc: "Metas e orçamentos" },
                  { nome: "Fechamento de Mês", desc: "Consolidação mensal" },
                  { nome: "Relatórios", desc: "Exportação de dados" },
                ].map(mod => (
                  <div key={mod.nome} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <div className="h-2 w-2 rounded-full bg-accent shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{mod.nome}</p>
                      <p className="text-xs text-muted-foreground">{mod.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Perfil */}
        <TabsContent value="perfil" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Dados do Usuário
              </CardTitle>
              <CardDescription>Informações da conta autenticada</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" /> E-mail
                  </Label>
                  <div className="p-3 rounded-lg bg-muted/50 text-sm">{user?.email || "—"}</div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4" /> ID do Usuário
                  </Label>
                  <div className="p-3 rounded-lg bg-muted/50 text-sm font-mono text-xs truncate">{user?.id || "—"}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Criado em</Label>
                  <div className="p-3 rounded-lg bg-muted/50 text-sm">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR") : "—"}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Último acesso</Label>
                  <div className="p-3 rounded-lg bg-muted/50 text-sm">
                    {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString("pt-BR") : "—"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Segurança */}
        <TabsContent value="seguranca" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Alterar Senha
              </CardTitle>
              <CardDescription>Atualize sua senha de acesso ao sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="new-pass">Nova Senha</Label>
                <Input
                  id="new-pass"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-pass">Confirmar Nova Senha</Label>
                <Input
                  id="confirm-pass"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                />
              </div>
              <Button onClick={handleChangePassword} disabled={saving || !newPassword}>
                {saving ? "Salvando..." : "Alterar Senha"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
