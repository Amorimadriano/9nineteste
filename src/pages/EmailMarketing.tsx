import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Mail, Upload, FileSpreadsheet, Send, Trash2, Eye, Users, AlertCircle, Settings, TestTube, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import * as XLSX from "xlsx";

interface EmailContact {
  nome: string;
  email: string;
}

export default function EmailMarketing() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<EmailContact[]>([]);
  const [assunto, setAssunto] = useState("Conheça o 9Nine Business Control — Gestão Financeira Inteligente");
  const [mensagemExtra, setMensagemExtra] = useState("");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  // SMTP Configuration
  const [smtpConfig, setSmtpConfig] = useState({
    host: "",
    porta: "587",
    secure: false,
    email: "",
    senha: "",
  });
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"none" | "success" | "error">("none");
  const [connectionMessage, setConnectionMessage] = useState("");

  // Load SMTP config from settings on mount
  useEffect(() => {
    const loadConfig = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("user_id", user.id)
        .eq("key", "smtp_config")
        .single();
      if (data?.value) {
        try {
          setSmtpConfig(JSON.parse(data.value));
        } catch {}
      }
    };
    loadConfig();
  }, [user]);

  const handleSaveSmtpConfig = async () => {
    if (!user) return;
    if (!smtpConfig.email || !smtpConfig.senha || !smtpConfig.host) {
      toast.error("Preencha todos os campos obrigatórios (host, e-mail e senha).");
      return;
    }
    const { error } = await supabase
      .from("settings")
      .upsert({ user_id: user.id, key: "smtp_config", value: JSON.stringify(smtpConfig) });
    if (error) {
      toast.error("Erro ao salvar configuração: " + error.message);
    } else {
      toast.success("Configuração SMTP salva com sucesso!");
      setConnectionStatus("none");
    }
  };

  const handleTestConnection = async () => {
    if (!smtpConfig.email || !smtpConfig.senha || !smtpConfig.host) {
      toast.error("Preencha host, e-mail e senha antes de testar.");
      return;
    }
    setTestingConnection(true);
    setConnectionStatus("none");
    setConnectionMessage("");
    try {
      const { error } = await supabase.functions.invoke("test-smtp-connection", {
        body: smtpConfig,
      });
      if (error) throw error;
      setConnectionStatus("success");
      setConnectionMessage("Conexão estabelecida com sucesso!");
      toast.success("Conexão SMTP testada com sucesso!");
    } catch (err: any) {
      setConnectionStatus("error");
      setConnectionMessage(err.message || "Falha na conexão");
      toast.error("Falha ao testar conexão SMTP");
    } finally {
      setTestingConnection(false);
    }
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        const parsed: EmailContact[] = [];
        for (const row of rows) {
          const email = (row.email || row.Email || row.EMAIL || row["E-mail"] || row["e-mail"] || "").toString().trim();
          const nome = (row.nome || row.Nome || row.NOME || row.name || row.Name || "").toString().trim();
          if (email && email.includes("@")) {
            parsed.push({ nome: nome || email.split("@")[0], email });
          }
        }

        if (parsed.length === 0) {
          toast.error("Nenhum e-mail válido encontrado. Verifique se a planilha possui uma coluna 'Email'.");
          return;
        }

        setContacts(parsed);
        toast.success(`${parsed.length} contato(s) importado(s) com sucesso!`);
      } catch {
        toast.error("Erro ao ler o arquivo. Verifique se é um Excel válido.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  }, []);

  const removeContact = (index: number) => {
    setContacts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendAll = async () => {
    if (contacts.length === 0) {
      toast.error("Importe uma lista de contatos primeiro.");
      return;
    }

    if (!smtpConfig.host || !smtpConfig.email || !smtpConfig.senha) {
      toast.error("Configure a API do Resend na aba Configurações antes de enviar.");
      return;
    }

    setSending(true);
    setProgress(0);
    setSentCount(0);

    let success = 0;
    let fail = 0;

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      try {
        const { error } = await supabase.functions.invoke("send-email-marketing", {
          body: {
            to: contact.email,
            nome: contact.nome,
            assunto,
            mensagemExtra,
            smtpConfig,
          },
        });
        if (error) throw error;
        success++;
      } catch {
        fail++;
      }

      setProgress(Math.round(((i + 1) / contacts.length) * 100));
      setSentCount(i + 1);

      // Small delay to avoid rate limiting
      if (i < contacts.length - 1) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    setSending(false);
    toast.success(`Envio concluído! ${success} enviado(s), ${fail} falha(s).`);
  };

  const templateHtml = buildTemplate("{{nome}}", mensagemExtra);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Email Marketing
          </h1>
          <p className="text-muted-foreground text-sm">Envie campanhas para atrair novos clientes</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Users className="h-3 w-3" />
          {contacts.length} contato(s)
        </Badge>
      </div>

      <Tabs defaultValue="campanha" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="campanha">
            <Mail className="h-4 w-4 mr-2" />
            Campanha
          </TabsTrigger>
          <TabsTrigger value="configuracoes">
            <Settings className="h-4 w-4 mr-2" />
            Configurações SMTP
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campanha" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload & Contacts */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Importar Lista de Contatos
                  </CardTitle>
                  <CardDescription>
                    Upload de arquivo Excel (.xlsx, .xls) com colunas "Nome" e "Email"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Clique para selecionar arquivo</span>
                    <span className="text-xs text-muted-foreground/70 mt-1">.xlsx ou .xls</span>
                    <Input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </CardContent>
              </Card>

              {contacts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Contatos Importados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {contacts.map((c, i) => (
                        <div key={i} className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted/50">
                          <div className="truncate flex-1">
                            <span className="font-medium">{c.nome}</span>
                            <span className="text-muted-foreground ml-2">{c.email}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeContact(i)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Campaign Settings */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Configurar Campanha</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Assunto do E-mail</label>
                    <Input
                      value={assunto}
                      onChange={(e) => setAssunto(e.target.value)}
                      placeholder="Assunto da campanha"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Mensagem Adicional (opcional)</label>
                    <Textarea
                      value={mensagemExtra}
                      onChange={(e) => setMensagemExtra(e.target.value)}
                      placeholder="Adicione uma mensagem personalizada ao template..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="gap-1"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      <Eye className="h-4 w-4" />
                      {showPreview ? "Ocultar Preview" : "Ver Preview"}
                    </Button>
                    <Button
                      className="gap-1 flex-1"
                      onClick={handleSendAll}
                      disabled={sending || contacts.length === 0}
                    >
                      <Send className="h-4 w-4" />
                      {sending ? `Enviando ${sentCount}/${contacts.length}...` : `Enviar para ${contacts.length} contato(s)`}
                    </Button>
                  </div>

                  {sending && (
                    <div className="space-y-1">
                      <Progress value={progress} />
                      <p className="text-xs text-muted-foreground text-center">{progress}%</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="pt-4">
                  <div className="flex gap-2 text-sm text-amber-700 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>
                      {!smtpConfig.host
                        ? "Configure a API do Resend na aba Configurações antes de enviar e-mails."
                        : "Configuração pronta. Ready to send!"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview do E-mail</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden bg-white">
                  <iframe
                    srcDoc={templateHtml}
                    className="w-full h-[600px] border-0"
                    title="Email Preview"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="configuracoes">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuração de E-mail Marketing
              </CardTitle>
              <CardDescription>
                Configure a API do Resend para enviar suas campanhas de e-mail marketing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Como funciona:</strong> O sistema usa a API do Resend (resend.com) para enviar os e-mails.
                  Crie uma conta gratuita no Resend para obter sua API Key.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Host SMTP</label>
                  <Input
                    value={smtpConfig.host}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                    placeholder="smtp.resend.com"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Servidor SMTP do provedor</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Porta</label>
                  <Input
                    value={smtpConfig.porta}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, porta: e.target.value })}
                    placeholder="587"
                  />
                  <p className="text-xs text-muted-foreground mt-1">通常: 587 (TLS) ou 465 (SSL)</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">E-mail Remetente (From)</label>
                <Input
                  type="email"
                  value={smtpConfig.email}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, email: e.target.value })}
                  placeholder="seu-email@seudominio.com.br"
                />
                <p className="text-xs text-muted-foreground mt-1">O e-mail que aparecerá como remetente (deve estar verificado no Resend)</p>
              </div>
              <div>
                <label className="text-sm font-medium">Resend API Key</label>
                <Input
                  type="password"
                  value={smtpConfig.senha}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, senha: e.target.value })}
                  placeholder="re_xxxxxxxxxxxx"
                />
                <p className="text-xs text-muted-foreground mt-1">Obtenha sua API Key em: resend.com/api-keys</p>
              </div>

              {connectionStatus !== "none" && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${connectionStatus === "success" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                  {connectionStatus === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm">{connectionMessage}</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleTestConnection} disabled={testingConnection}>
                  <TestTube className="h-4 w-4 mr-2" />
                  {testingConnection ? "Testando..." : "Testar Configuração"}
                </Button>
                <Button onClick={handleSaveSmtpConfig}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Salvar Configurações
                </Button>
              </div>

              <div className="bg-muted p-4 rounded-lg text-sm">
                <p className="font-medium mb-2">Instruções:</p>
                <ol className="text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Crie uma conta em <a href="https://resend.com" target="_blank" className="text-primary hover:underline">resend.com</a></li>
                  <li>Adicione e verifique seu domínio ou e-mail</li>
                  <li>Copie sua API Key do dashboard</li>
                  <li>Cole a API Key e o e-mail acima</li>
                  <li>Clique em "Testar Configuração" para verificar</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function buildTemplate(nome: string, mensagemExtra: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#1e40af 0%,#3b82f6 50%,#60a5fa 100%);padding:40px 32px;text-align:center">
  <h1 style="color:#ffffff;font-size:28px;margin:0;font-weight:800;letter-spacing:-0.5px">9Nine Business Control</h1>
  <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:8px 0 0;font-weight:400">Gestão Financeira Inteligente</p>
</td></tr>

<!-- Body -->
<tr><td style="padding:32px">
  <p style="color:#1e293b;font-size:16px;margin:0 0 16px">Olá <strong>${nome}</strong>,</p>
  <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px">
    Você já conhece o <strong>9Nine Business Control</strong>? Nossa plataforma foi desenvolvida para simplificar e automatizar toda a gestão financeira da sua empresa.
  </p>

  ${mensagemExtra ? `<p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px;padding:16px;background:#f0f9ff;border-left:4px solid #3b82f6;border-radius:4px">${mensagemExtra}</p>` : ""}

  <!-- Features -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0">
    <tr>
      <td style="padding:12px 16px;background:#f8fafc;border-radius:8px;margin-bottom:8px">
        <p style="margin:0;color:#1e40af;font-weight:700;font-size:14px">📊 Dashboard Inteligente</p>
        <p style="margin:4px 0 0;color:#64748b;font-size:13px">KPIs financeiros em tempo real</p>
      </td>
    </tr>
    <tr><td style="height:8px"></td></tr>
    <tr>
      <td style="padding:12px 16px;background:#f8fafc;border-radius:8px">
        <p style="margin:0;color:#1e40af;font-weight:700;font-size:14px">💰 Contas a Pagar e Receber</p>
        <p style="margin:4px 0 0;color:#64748b;font-size:13px">Controle completo de fluxo de caixa</p>
      </td>
    </tr>
    <tr><td style="height:8px"></td></tr>
    <tr>
      <td style="padding:12px 16px;background:#f8fafc;border-radius:8px">
        <p style="margin:0;color:#1e40af;font-weight:700;font-size:14px">🏦 Conciliação Bancária Automática</p>
        <p style="margin:4px 0 0;color:#64748b;font-size:13px">Importação OFX e matching inteligente</p>
      </td>
    </tr>
    <tr><td style="height:8px"></td></tr>
    <tr>
      <td style="padding:12px 16px;background:#f8fafc;border-radius:8px">
        <p style="margin:0;color:#1e40af;font-weight:700;font-size:14px">📈 DRE e Relatórios Gerenciais</p>
        <p style="margin:4px 0 0;color:#64748b;font-size:13px">Análises com parecer de IA integrado</p>
      </td>
    </tr>
  </table>

  <!-- CTA -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:16px 0">
      <a href="https://9ninebusinesscontrol.com.br/Site" style="display:inline-block;background:linear-gradient(135deg,#1e40af,#3b82f6);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:8px;letter-spacing:0.3px">
        Teste Grátis por 5 Dias →
      </a>
    </td></tr>
  </table>

  <p style="color:#94a3b8;font-size:12px;text-align:center;margin:24px 0 0">
    Sem compromisso. Cancele quando quiser.
  </p>
</td></tr>

<!-- Footer -->
<tr><td style="background:#f8fafc;padding:24px 32px;text-align:center;border-top:1px solid #e2e8f0">
  <p style="color:#64748b;font-size:12px;margin:0">9Nine Business Control — Gestão Financeira Inteligente</p>
  <p style="color:#94a3b8;font-size:11px;margin:8px 0 0">
    contato@9ninebusinesscontrol.com.br | WhatsApp (11) 96001-2210
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
