import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCode, FileText, CreditCard, Copy, Check, Loader2, Link as LinkIcon, ArrowLeft, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useTrialGuard } from "@/hooks/useTrialGuard";
import { callPaymentFunction } from "@/lib/paymentApi";

function PaymentResult({ result, onBack }: { result: any; onBack: () => void }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copiado!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const checkPaymentStatus = async () => {
    if (!result?.subscription?.pagarme_order_id) return;
    setCheckingStatus(true);
    try {
      const data = await callPaymentFunction<any>("check-payment-status", {
        order_id: result.subscription.pagarme_order_id,
      });

      if (data?.paid) {
        toast({ title: "Pagamento confirmado!", description: "Sua assinatura foi ativada." });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast({ title: "Pagamento ainda não confirmado", description: "Aguarde alguns instantes e tente novamente." });
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setCheckingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>
      <Card className="max-w-md mx-auto text-center">
        <CardHeader>
          <CardTitle className="text-xl">
            {result.method === "pix" ? "Pague via PIX" : "Boleto Gerado"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.method === "pix" && result.pix_qr_code_url && (
            <div className="space-y-4">
              <img src={result.pix_qr_code_url} alt="QR Code PIX" className="mx-auto w-48 h-48" />
              {result.pix_qr_code && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Ou copie o código PIX:</p>
                  <div className="flex gap-2">
                    <Input value={result.pix_qr_code} readOnly className="text-xs" />
                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(result.pix_qr_code)}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          {result.method === "boleto" && (
            <div className="space-y-4">
              {result.boleto_barcode && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Código de barras:</p>
                  <div className="flex gap-2">
                    <Input value={result.boleto_barcode} readOnly className="text-xs" />
                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(result.boleto_barcode)}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
              {result.boleto_url && (
                <Button className="w-full" asChild>
                  <a href={result.boleto_url} target="_blank" rel="noopener noreferrer">
                    <FileText className="mr-2 h-4 w-4" /> Visualizar Boleto
                  </a>
                </Button>
              )}
            </div>
          )}
          <p className="text-sm text-muted-foreground">Valor: <strong>R$ 399,90</strong> / mês</p>
          <Button onClick={checkPaymentStatus} disabled={checkingStatus} variant="outline" className="w-full">
            {checkingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Já paguei - Verificar pagamento
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Planos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const trial = useTrialGuard();
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");

  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpMonth, setCardExpMonth] = useState("");
  const [cardExpYear, setCardExpYear] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const validateCustomer = () => {
    if (!name.trim()) { toast({ title: "Informe seu nome", variant: "destructive" }); return false; }
    const cleanDoc = document.replace(/\D/g, "");
    if (cleanDoc.length !== 11 && cleanDoc.length !== 14) {
      toast({ title: "Informe um CPF ou CNPJ válido", variant: "destructive" }); return false;
    }
    return true;
  };

  const handlePayment = async (method: string, cardData?: any) => {
    if (!validateCustomer()) return;
    setLoading(true);
    try {
      const payload: any = {
        payment_method: method,
        customer: {
          name,
          email: user?.email || "",
          document: document.replace(/\D/g, ""),
          phone: phone.replace(/\D/g, ""),
        },
      };
      if (method === "credit_card" && cardData) {
        payload.card = cardData;
      }

      const data = await callPaymentFunction<any>("create-payment", payload);

      setPaymentResult({ ...data, method });

      if (method === "credit_card" && data?.charge_status === "paid") {
        toast({ title: "Pagamento aprovado!", description: "Sua assinatura foi ativada." });
        setTimeout(() => window.location.reload(), 2000);
      } else if (method === "credit_card") {
        toast({ title: "Pagamento processado", description: "Aguardando confirmação..." });
      } else {
        toast({ title: "Pedido criado!", description: method === "pix" ? "Escaneie o QR Code para pagar" : "Boleto gerado com sucesso" });
      }
    } catch (err: any) {
      toast({ title: "Erro no pagamento", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentLink = async () => {
    setLoading(true);
    try {
      const data = await callPaymentFunction<any>("create-payment-link");

      const url = data.payment_link_url || data.short_url;
      if (url) {
        window.open(url, "_blank");
        toast({ title: "Link de pagamento aberto!" });
      }
    } catch (err: any) {
      toast({ title: "Erro ao gerar link", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (paymentResult && (paymentResult.method === "pix" || paymentResult.method === "boleto")) {
    return <PaymentResult result={paymentResult} onBack={() => setPaymentResult(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Planos e Assinatura</h1>
          <p className="text-sm text-muted-foreground">Escolha sua forma de pagamento</p>
        </div>
      </div>

      {/* Plan card */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent max-w-2xl">
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-xl">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">9Nine Business Control — Profissional</CardTitle>
            <p className="text-sm text-muted-foreground">Acesso completo a todas as funcionalidades</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-primary">R$ 399,90</p>
            <p className="text-xs text-muted-foreground">/mês</p>
          </div>
        </CardHeader>
        <CardContent>
          {!trial.loading && !trial.hasActiveSubscription && trial.daysLeft > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-400">
              Seu período de teste termina em <strong>{trial.daysLeft} dia(s)</strong>. Assine agora para não perder acesso.
            </div>
          )}
          {trial.hasActiveSubscription && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm text-green-700 dark:text-green-400">
              ✅ Assinatura ativa! Você tem acesso completo ao sistema.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment form */}
      {!trial.hasActiveSubscription && (
        <Card className="max-w-2xl">
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Seus dados</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label>Nome completo</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome ou razão social" />
                </div>
                <div>
                  <Label>CPF / CNPJ</Label>
                  <Input value={document} onChange={e => setDocument(e.target.value)} placeholder="000.000.000-00" />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
                </div>
              </div>
            </div>

            <Tabs defaultValue="cartao" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="cartao" className="gap-1 text-xs">
                  <CreditCard className="h-3 w-3" /> Cartão
                </TabsTrigger>
                <TabsTrigger value="pix" className="gap-1 text-xs">
                  <QrCode className="h-3 w-3" /> PIX
                </TabsTrigger>
                <TabsTrigger value="boleto" className="gap-1 text-xs">
                  <FileText className="h-3 w-3" /> Boleto
                </TabsTrigger>
                <TabsTrigger value="link" className="gap-1 text-xs">
                  <LinkIcon className="h-3 w-3" /> Link
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cartao" className="space-y-3 pt-3">
                <div className="grid gap-3">
                  <div>
                    <Label>Número do cartão (crédito ou débito)</Label>
                    <Input value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="0000 0000 0000 0000" />
                  </div>
                  <div>
                    <Label>Nome no cartão</Label>
                    <Input value={cardHolder} onChange={e => setCardHolder(e.target.value)} placeholder="NOME IMPRESSO NO CARTÃO" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><Label>Mês</Label><Input value={cardExpMonth} onChange={e => setCardExpMonth(e.target.value)} placeholder="MM" maxLength={2} /></div>
                    <div><Label>Ano</Label><Input value={cardExpYear} onChange={e => setCardExpYear(e.target.value)} placeholder="AA" maxLength={2} /></div>
                    <div><Label>CVV</Label><Input value={cardCvv} onChange={e => setCardCvv(e.target.value)} placeholder="000" maxLength={4} /></div>
                  </div>
                </div>
                <Button className="w-full" onClick={() => {
                  if (!cardNumber || !cardHolder || !cardExpMonth || !cardExpYear || !cardCvv) {
                    toast({ title: "Preencha todos os dados do cartão", variant: "destructive" });
                    return;
                  }
                  handlePayment("credit_card", {
                    number: cardNumber.replace(/\s/g, ""),
                    holder_name: cardHolder.toUpperCase(),
                    exp_month: cardExpMonth,
                    exp_year: cardExpYear,
                    cvv: cardCvv,
                  });
                }} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                  Pagar R$ 399,90
                </Button>
              </TabsContent>

              <TabsContent value="pix" className="space-y-3 pt-3">
                <p className="text-sm text-muted-foreground">Pague instantaneamente via PIX.</p>
                <Button className="w-full" onClick={() => handlePayment("pix")} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
                  Gerar QR Code PIX — R$ 399,90
                </Button>
              </TabsContent>

              <TabsContent value="boleto" className="space-y-3 pt-3">
                <p className="text-sm text-muted-foreground">Boleto com vencimento em 3 dias úteis.</p>
                <Button className="w-full" onClick={() => handlePayment("boleto")} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                  Gerar Boleto — R$ 399,90
                </Button>
              </TabsContent>

              <TabsContent value="link" className="space-y-3 pt-3">
                <p className="text-sm text-muted-foreground">Link seguro com todas as opções de pagamento.</p>
                <Button className="w-full" onClick={handlePaymentLink} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
                  Abrir Link de Pagamento
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
