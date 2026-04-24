import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldAlert, LogOut, QrCode, FileText, CreditCard, Copy, Check, Loader2, Link as LinkIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import logo9nine from "@/assets/logo-9nine-new.png";
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <img src={logo9nine} alt="9Nine BPO" className="h-16 w-16 mx-auto rounded-xl" />
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

          <p className="text-sm text-muted-foreground">
            Valor: <strong>R$ 199,90</strong> / mês
          </p>

          <Button onClick={checkPaymentStatus} disabled={checkingStatus} variant="outline" className="w-full">
            {checkingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Já paguei - Verificar pagamento
          </Button>

          <Button variant="ghost" className="w-full" onClick={onBack}>
            Voltar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TrialExpired() {
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  // Customer form
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");

  // Card form
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
        toast({ title: "Pagamento processado", description: data?.charge_status === "pending" ? "Aguardando confirmação..." : "Verifique o status." });
      } else {
        toast({ title: "Pedido criado!", description: method === "pix" ? "Escaneie o QR Code para pagar" : "Boleto gerado com sucesso" });
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      toast({ title: "Erro no pagamento", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePixPayment = () => handlePayment("pix");
  const handleBoletoPayment = () => handlePayment("boleto");

  const handleCardPayment = async () => {
    if (!cardNumber || !cardHolder || !cardExpMonth || !cardExpYear || !cardCvv) {
      toast({ title: "Preencha todos os dados do cartão", variant: "destructive" });
      return;
    }
    await handlePayment("credit_card", {
      number: cardNumber.replace(/\s/g, ""),
      holder_name: cardHolder.toUpperCase(),
      exp_month: cardExpMonth,
      exp_year: cardExpYear,
      cvv: cardCvv,
    });
  };

  const handlePaymentLink = () => {
    window.open("https://payment-link-v3.pagar.me/pl_yl3qvW72YMEB6yBhyHqO1jGpxQXOAKnZ", "_blank");
    toast({ title: "Link de pagamento aberto!", description: "Complete o pagamento na página da Pagar.me." });
  };

  if (paymentResult && (paymentResult.method === "pix" || paymentResult.method === "boleto")) {
    return <PaymentResult result={paymentResult} onBack={() => setPaymentResult(null)} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-4">
          <img src={logo9nine} alt="9Nine BPO" className="h-16 w-16 mx-auto rounded-xl" />
          <div className="flex justify-center">
            <ShieldAlert className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-xl">Período de teste encerrado</CardTitle>
          <p className="text-sm text-muted-foreground">
            Assine o <strong>9Nine Business Control</strong> por apenas{" "}
            <strong className="text-primary">R$ 199,90/mês</strong> e continue gerenciando suas finanças.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer info */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Seus dados</h3>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label htmlFor="name">Nome completo</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome ou razão social" />
              </div>
              <div>
                <Label htmlFor="document">CPF / CNPJ</Label>
                <Input id="document" value={document} onChange={e => setDocument(e.target.value)} placeholder="000.000.000-00" />
              </div>
              <div>
                <Label htmlFor="phone">Telefone (opcional)</Label>
                <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
              </div>
            </div>
          </div>

          {/* Payment methods */}
          <Tabs defaultValue="pix" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pix" className="gap-1 text-xs">
                <QrCode className="h-3 w-3" /> PIX
              </TabsTrigger>
              <TabsTrigger value="boleto" className="gap-1 text-xs">
                <FileText className="h-3 w-3" /> Boleto
              </TabsTrigger>
              <TabsTrigger value="cartao" className="gap-1 text-xs">
                <CreditCard className="h-3 w-3" /> Cartão
              </TabsTrigger>
              <TabsTrigger value="link" className="gap-1 text-xs">
                <LinkIcon className="h-3 w-3" /> Link
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pix" className="space-y-3 pt-3">
              <p className="text-sm text-muted-foreground">
                Pague instantaneamente via PIX. O QR Code será gerado após confirmar.
              </p>
              <Button className="w-full" onClick={handlePixPayment} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
                Gerar QR Code PIX
              </Button>
            </TabsContent>

            <TabsContent value="boleto" className="space-y-3 pt-3">
              <p className="text-sm text-muted-foreground">
                O boleto será gerado com vencimento em 3 dias úteis.
              </p>
              <Button className="w-full" onClick={handleBoletoPayment} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Gerar Boleto
              </Button>
            </TabsContent>

            <TabsContent value="cartao" className="space-y-3 pt-3">
              <div className="grid gap-3">
                <div>
                  <Label>Número do cartão</Label>
                  <Input value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="0000 0000 0000 0000" />
                </div>
                <div>
                  <Label>Nome no cartão</Label>
                  <Input value={cardHolder} onChange={e => setCardHolder(e.target.value)} placeholder="NOME IMPRESSO NO CARTÃO" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label>Mês</Label>
                    <Input value={cardExpMonth} onChange={e => setCardExpMonth(e.target.value)} placeholder="MM" maxLength={2} />
                  </div>
                  <div>
                    <Label>Ano</Label>
                    <Input value={cardExpYear} onChange={e => setCardExpYear(e.target.value)} placeholder="AA" maxLength={2} />
                  </div>
                  <div>
                    <Label>CVV</Label>
                    <Input value={cardCvv} onChange={e => setCardCvv(e.target.value)} placeholder="000" maxLength={4} />
                  </div>
                </div>
              </div>
              <Button className="w-full" onClick={handleCardPayment} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                Pagar R$ 199,90
              </Button>
            </TabsContent>

            <TabsContent value="link" className="space-y-3 pt-3">
              <p className="text-sm text-muted-foreground">
                Abra um link seguro de pagamento com todas as opções (PIX, Boleto e Cartão).
              </p>
              <Button className="w-full" onClick={handlePaymentLink} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
                Abrir Link de Pagamento
              </Button>
            </TabsContent>
          </Tabs>

          <Button variant="outline" className="w-full gap-2" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
