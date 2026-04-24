import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { callManageUsers } from "@/lib/manageUsersApi";
import { UserPlus, Trash2, Shield, Loader2, RefreshCw, Ban, ShieldCheck, Crown, Pencil, CreditCard, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UserInfo {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  banned_until: string | null;
  roles: string[];
}

const ADMIN_EMAILS = ["9ninebpo9@gmail.com", "adriano.amorim83@gmail.com", "marketing@9ninebusinesscontrol.com.br"];

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***@***";
  const visibleChars = Math.min(2, local.length);
  return `${local.slice(0, visibleChars)}${"*".repeat(Math.max(0, local.length - visibleChars))}@${domain}`;
}

function isSystemAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export default function Usuarios() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserInfo | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingAdmin, setTogglingAdmin] = useState<string | null>(null);
  const [activatingSubscription, setActivatingSubscription] = useState<string | null>(null);
  const [subscriptionUsers, setSubscriptionUsers] = useState<Set<string>>(new Set());
  const [editTarget, setEditTarget] = useState<UserInfo | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [updatingEmail, setUpdatingEmail] = useState(false);

  const currentUserEmail = user?.email?.toLowerCase() || "";
  const viewerIsSystemAdmin = isSystemAdmin(currentUserEmail);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callManageUsers<{ users?: UserInfo[] }>({ action: "list" });
      setUsers(data.users || []);
    } catch (err: any) {
      toast({ title: "Erro ao carregar usuários", description: err?.message || "Erro desconhecido", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  // Load which users have active subscriptions
  useEffect(() => {
    const loadSubscriptions = async () => {
      const { data } = await supabase
        .from("assinaturas")
        .select("user_id")
        .eq("status", "ativa");
      if (data) {
        setSubscriptionUsers(new Set(data.map((s: any) => s.user_id)));
      }
    };
    loadSubscriptions();
  }, [users]);

  const handleActivateSubscription = async (userId: string) => {
    setActivatingSubscription(userId);
    try {
      const { error } = await supabase.from("assinaturas").insert({
        user_id: userId,
        status: "ativa",
        plano: "mensal",
        valor: 399.90,
        metodo_pagamento: "dinheiro",
        data_inicio: new Date().toISOString(),
      } as any);
      if (error) throw error;
      setSubscriptionUsers(prev => new Set([...prev, userId]));
      toast({ title: "✅ Assinatura ativada com sucesso!", description: "O usuário agora tem acesso completo ao sistema." });
    } catch (err: any) {
      toast({ title: "Erro ao ativar assinatura", description: err?.message || "Erro desconhecido", variant: "destructive" });
    } finally {
      setActivatingSubscription(null);
    }
  };

  const handleCancelSubscription = async (userId: string) => {
    setActivatingSubscription(userId);
    try {
      const { error } = await supabase
        .from("assinaturas")
        .update({ status: "cancelada" } as any)
        .eq("user_id", userId)
        .eq("status", "ativa");
      if (error) throw error;
      setSubscriptionUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });

      // Notify admins about cancellation
      const cancelledUser = users.find(u => u.id === userId);
      const cancelledEmail = cancelledUser?.email || "N/A";
      await supabase.from("notificacoes_admin").insert({
        titulo: "❌ Assinatura cancelada manualmente",
        mensagem: `A assinatura do cliente ${cancelledEmail} foi cancelada manualmente por um administrador.`,
        tipo: "cancelamento",
      } as any);

      toast({ title: "✅ Assinatura cancelada com sucesso!", description: "O acesso do usuário foi revogado." });
    } catch (err: any) {
      toast({ title: "Erro ao cancelar assinatura", description: err?.message || "Erro desconhecido", variant: "destructive" });
    } finally {
      setActivatingSubscription(null);
    }
  };

  const handleCreate = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      toast({ title: "Preencha e-mail e senha", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      await callManageUsers({ action: "create", email: normalizedEmail, password });
      toast({ title: "Usuário criado com sucesso!" });
      setEmail("");
      setPassword("");
      await loadUsers();
    } catch (err: any) {
      toast({ title: "Erro ao criar usuário", description: err?.message || "Erro desconhecido", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await callManageUsers({ action: "delete", userId: deleteTarget.id });
      toast({ title: "Usuário removido." });
      setDeleteTarget(null);
      await loadUsers();
    } catch (err: any) {
      toast({ title: "Erro ao remover usuário", description: err?.message || "Erro desconhecido", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleBan = async (userId: string, ban: boolean) => {
    try {
      await callManageUsers({ action: "ban", userId, banned: ban });
      toast({ title: ban ? "Usuário bloqueado" : "Usuário desbloqueado" });
      await loadUsers();
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message || "Erro desconhecido", variant: "destructive" });
    }
  };

  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    setTogglingAdmin(userId);
    try {
      if (isAdmin) {
        await callManageUsers({ action: "revoke_admin", userId });
        toast({ title: "Privilégio de administrador removido" });
      } else {
        await callManageUsers({ action: "grant_admin", userId });
        toast({ title: "Privilégio de administrador concedido" });
      }
      await loadUsers();
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message || "Erro desconhecido", variant: "destructive" });
    } finally {
      setTogglingAdmin(null);
    }
  };

  const handleUpdateEmail = async () => {
    if (!editTarget || !newEmail.trim()) return;
    setUpdatingEmail(true);
    try {
      await callManageUsers({ action: "update_email", userId: editTarget.id, email: newEmail.trim() });
      toast({ title: "E-mail alterado com sucesso" });
      setEditTarget(null);
      setNewEmail("");
      await loadUsers();
    } catch (err: any) {
      toast({ title: "Erro ao alterar e-mail", description: err?.message || "Erro desconhecido", variant: "destructive" });
    } finally {
      setUpdatingEmail(false);
    }
  };

  const currentUserIsAdmin = users.find(u => u.id === user?.id)?.roles?.includes("admin") ?? false;

  // Admins do sistema veem todos; clientes comuns não veem os e-mails admin
  const visibleUsers = viewerIsSystemAdmin
    ? users
    : users.filter(u => !ADMIN_EMAILS.includes(u.email));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Usuários</h1>
        <p className="text-sm text-muted-foreground">Gerencie os acessos ao sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" /> Convidar Usuário
          </CardTitle>
          <CardDescription>Crie um acesso para que um novo usuário utilize o sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-2 flex-1">
              <Label htmlFor="inv-email">E-mail</Label>
              <Input id="inv-email" type="email" placeholder="usuario@empresa.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="off" />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="inv-pass">Senha inicial</Label>
              <Input id="inv-pass" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
            </div>
            <Button onClick={handleCreate} disabled={creating} className="gap-2 shrink-0">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Criar Acesso
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Usuários Cadastrados
              </CardTitle>
              <CardDescription>{visibleUsers.length} usuário(s) no sistema</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => void loadUsers()} disabled={loading} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : visibleUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Identificação</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último acesso</TableHead>
                    <TableHead className="w-[180px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleUsers.map(u => {
                    const isAdmin = u.roles?.includes("admin");
                    const isBanned = u.banned_until && new Date(u.banned_until) > new Date();
                    const isSelf = u.id === user?.id;
                    // System admins see masked emails of clients; non-admins see their own email normally
                    const displayEmail = isSelf ? u.email : (viewerIsSystemAdmin ? maskEmail(u.email) : u.email);

                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {displayEmail}
                            {isSelf && (
                              <Badge variant="outline" className="text-xs">Você</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {isAdmin ? (
                            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs gap-1">
                              <Crown className="h-3 w-3" /> Admin
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Usuário</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {isBanned ? (
                            <Badge variant="destructive" className="text-xs">Bloqueado</Badge>
                          ) : u.email_confirmed_at ? (
                            <Badge className="bg-accent text-accent-foreground text-xs">Ativo</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Pendente</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString("pt-BR") : "Nunca"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {currentUserIsAdmin && !isSelf && (
                              <Button
                                variant={isAdmin ? "default" : "outline"}
                                size="sm"
                                onClick={() => void handleToggleAdmin(u.id, !!isAdmin)}
                                disabled={togglingAdmin === u.id}
                                title={isAdmin ? "Remover Admin" : "Tornar Admin"}
                                className={isAdmin
                                  ? "gap-1 bg-amber-500 hover:bg-amber-600 text-white text-xs h-8"
                                  : "gap-1 text-xs h-8 border-amber-300 text-amber-600 hover:bg-amber-50"
                                }
                              >
                                {togglingAdmin === u.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Crown className="h-3 w-3" />
                                )}
                                {isAdmin ? "Remover Admin" : "Admin"}
                              </Button>
                            )}

                            {currentUserIsAdmin && !isSelf && !subscriptionUsers.has(u.id) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => void handleActivateSubscription(u.id)}
                                disabled={activatingSubscription === u.id}
                                title="Ativar assinatura (venda à vista)"
                                className="gap-1 text-xs h-8 border-green-400 text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950"
                              >
                                {activatingSubscription === u.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <CreditCard className="h-3 w-3" />
                                )}
                                Ativar
                              </Button>
                            )}
                            {currentUserIsAdmin && !isSelf && subscriptionUsers.has(u.id) && (
                              <div className="flex items-center gap-1">
                                <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs gap-1 h-8 flex items-center">
                                  <CheckCircle className="h-3 w-3" /> Assinante
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => void handleCancelSubscription(u.id)}
                                  disabled={activatingSubscription === u.id}
                                  title="Cancelar assinatura"
                                  className="gap-1 text-xs h-8 border-destructive/40 text-destructive hover:bg-destructive/10"
                                >
                                  {activatingSubscription === u.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <XCircle className="h-3 w-3" />
                                  )}
                                  Cancelar
                                </Button>
                              </div>
                            )}

                            {!isSelf && (
                              isBanned ? (
                                <Button variant="ghost" size="icon" onClick={() => void handleToggleBan(u.id, false)} title="Desbloquear" className="h-8 w-8 text-accent hover:text-accent">
                                  <ShieldCheck className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button variant="ghost" size="icon" onClick={() => void handleToggleBan(u.id, true)} title="Bloquear" className="h-8 w-8 text-amber-600 hover:text-amber-600">
                                  <Ban className="h-4 w-4" />
                                </Button>
                              )
                            )}

                            {!isSelf && (
                              <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(u)} className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete dialog - no email shown */}
      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Usuário</DialogTitle>
            <DialogDescription>
              Deseja remover o acesso deste usuário? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={deleting} className="gap-2">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit email dialog removed for privacy - admins cannot see/edit client emails */}
    </div>
  );
}
