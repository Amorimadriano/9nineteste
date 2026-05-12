import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ConsentForm, ConsentData } from "./ConsentForm";
import { BancoCardCompact, BankData } from "./BancoCard";
import { Search, ArrowLeft, ExternalLink, CheckCircle2, Loader2, Building2, Shield } from "lucide-react";

// Lista de bancos suportados pelo Open Banking
const supportedBanks: BankData[] = [
  { id: "bb", code: "001", name: "Banco do Brasil", fullName: "Banco do Brasil S.A.", primaryColor: "#003399", status: "active" },
  { id: "caixa", code: "104", name: "Caixa", fullName: "Caixa Econômica Federal", primaryColor: "#EC660D", status: "active" },
  { id: "itau", code: "341", name: "Itaú", fullName: "Itaú Unibanco S.A.", primaryColor: "#EC3625", status: "active" },
  { id: "santander", code: "033", name: "Santander", fullName: "Banco Santander (Brasil) S.A.", primaryColor: "#FF8C00", status: "active" },
  { id: "bradesco", code: "237", name: "Bradesco", fullName: "Banco Bradesco S.A.", primaryColor: "#005A9C", status: "active" },
  { id: "nubank", code: "260", name: "Nubank", fullName: "Nu Pagamentos S.A.", primaryColor: "#820AD1", status: "active" },
  { id: "inter", code: "077", name: "Inter", fullName: "Banco Inter S.A.", primaryColor: "#7B1FA2", status: "active" },
  { id: "c6", code: "336", name: "C6 Bank", fullName: "C6 Bank S.A.", primaryColor: "#00897B", status: "active" },
  { id: "original", code: "212", name: "Banco Original", fullName: "Banco Original S.A.", primaryColor: "#7CB342", status: "active" },
  { id: "safra", code: "422", name: "Safra", fullName: "Banco Safra S.A.", primaryColor: "#1565C0", status: "active" },
  { id: "btg", code: "208", name: "BTG Pactual", fullName: "Banco BTG Pactual S.A.", primaryColor: "#1A237E", status: "active" },
  { id: "sicoob", code: "756", name: "Sicoob", fullName: "Banco Cooperativo do Brasil S.A.", primaryColor: "#E65100", status: "active" },
  { id: "sicredi", code: "748", name: "Sicredi", fullName: "Banco Cooperativo Sicredi S.A.", primaryColor: "#00695C", status: "active" },
  { id: "banrisul", code: "041", name: "Banrisul", fullName: "Banco do Estado do Rio Grande do Sul S.A.", primaryColor: "#0277BD", status: "active" },
  { id: "pagbank", code: "290", name: "PagBank", fullName: "PagSeguro Internet S.A.", primaryColor: "#1A9CD9", status: "active" },
  { id: "picpay", code: "380", name: "PicPay", fullName: "PicPay Serviços S.A.", primaryColor: "#E65100", status: "active" },
  { id: "neon", code: "735", name: "Neon", fullName: "Banco Neon S.A.", primaryColor: "#00C853", status: "active" },
  { id: "next", code: "237", name: "Next", fullName: "Next Banco S.A.", primaryColor: "#00B0FF", status: "active" },
  { id: "agibank", code: "121", name: "Agibank", fullName: "Banco Agibank S.A.", primaryColor: "#D32F2F", status: "active" },
  { id: "daycoval", code: "707", name: "Daycoval", fullName: "Banco Daycoval S.A.", primaryColor: "#1976D2", status: "active" },
];

type WizardStep = "bank" | "consent" | "redirect" | "callback" | "success";

interface OpenBankingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function OpenBankingWizard({
  open,
  onOpenChange,
  onComplete,
}: OpenBankingWizardProps) {
  const [step, setStep] = useState<WizardStep>("bank");
  const [selectedBank, setSelectedBank] = useState<BankData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const filteredBanks = supportedBanks.filter(
    (bank) =>
      bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bank.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bank.code.includes(searchTerm)
  );

  const handleBankSelect = (bank: BankData) => {
    setSelectedBank(bank);
    setStep("consent");
  };

  const handleConsentSubmit = async (consent: ConsentData) => {
    console.log("Consentimento recebido:", consent);
    setStep("redirect");

    // Simular redirecionamento após 3 segundos
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRedirect = () => {
    // Aqui seria o redirecionamento real para OAuth do banco
    // window.location.href = bankOAuthUrl;

    // Simular callback após "autorização"
    setStep("callback");
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setStep("success");
    }, 2000);
  };

  const handleSuccess = () => {
    onComplete?.();
    handleClose();
  };

  const handleClose = () => {
    setStep("bank");
    setSelectedBank(null);
    setSearchTerm("");
    onOpenChange(false);
  };

  const handleBack = () => {
    if (step === "consent") setStep("bank");
    else if (step === "redirect") setStep("consent");
    else if (step === "callback") setStep("redirect");
  };

  const getProgress = () => {
    switch (step) {
      case "bank":
        return 25;
      case "consent":
        return 50;
      case "redirect":
        return 75;
      case "callback":
        return 90;
      case "success":
        return 100;
      default:
        return 0;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case "bank":
        return "Selecionar Banco";
      case "consent":
        return "Permissões de Acesso";
      case "redirect":
        return "Redirecionamento";
      case "callback":
        return "Processando...";
      case "success":
        return "Conectado!";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-3">
            {step !== "bank" && step !== "callback" && step !== "success" && (
              <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex-1">
              <DialogTitle>{getStepTitle()}</DialogTitle>
              <DialogDescription>
                {step === "bank" && "Selecione sua instituição financeira"}
                {step === "consent" && `Configurar acesso ao ${selectedBank?.name}`}
                {step === "redirect" && "Você será redirecionado para o banco"}
                {step === "callback" && "Finalizando conexão..."}
                {step === "success" && "Banco conectado com sucesso!"}
              </DialogDescription>
            </div>
          </div>

          {/* Progress bar */}
          <>
            <Progress value={getProgress()} className="mt-4" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span className={step === "bank" ? "text-primary font-medium" : ""}>Banco</span>
              <span className={step === "consent" ? "text-primary font-medium" : ""}>Permissões</span>
              <span className={step === "redirect" || step === "callback" ? "text-primary font-medium" : ""}>Autorização</span>
              <span className={step === "success" ? "text-primary font-medium" : ""}>Pronto</span>
            </div>
          </>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <AnimatePresence mode="wait">
            {/* Step 1: Seleção de Banco */}
            {step === "bank" && (
              <motion.div
                key="bank"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar banco por nome ou código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredBanks.map((bank) => (
                    <BancoCardCompact
                      key={bank.id}
                      bank={bank}
                      onClick={() => handleBankSelect(bank)}
                    />
                  ))}
                </div>

                {filteredBanks.length === 0 && (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">
                      Nenhum banco encontrado para "{searchTerm}"
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2: Termos de Consentimento */}
            {step === "consent" && selectedBank && (
              <motion.div
                key="consent"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <ConsentForm
                  bankName={selectedBank.name}
                  onSubmit={handleConsentSubmit}
                  onCancel={() => setStep("bank")}
                />
              </motion.div>
            )}

            {/* Step 3: Redirecionamento */}
            {step === "redirect" && selectedBank && (
              <motion.div
                key="redirect"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center space-y-6 py-8"
              >
                <div
                  className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl font-bold"
                  style={{ backgroundColor: selectedBank.primaryColor }}
                >
                  {selectedBank.name.charAt(0)}
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    Redirecionando para {selectedBank.name}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Você será redirecionado para o site do banco para autorizar
                    o compartilhamento dos seus dados. Sua conexão é segura.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>Conexão criptografada SSL</span>
                </div>

                <Button
                  onClick={handleRedirect}
                  className="gap-2"
                  style={{ backgroundColor: selectedBank.primaryColor }}
                >
                  <span>Continuar para {selectedBank.name}</span>
                  <ExternalLink className="h-4 w-4" />
                </Button>

                <p className="text-xs text-muted-foreground">
                  Redirecionando em {countdown}s...
                </p>
              </motion.div>
            )}

            {/* Step 4: Callback */}
            {step === "callback" && (
              <motion.div
                key="callback"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center space-y-6 py-8"
              >
                <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Processando autorização...</h3>
                  <p className="text-sm text-muted-foreground">
                    Estamos confirmando a conexão com o banco.
                    Isso pode levar alguns segundos.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 5: Sucesso */}
            {step === "success" && selectedBank && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-20 h-20 rounded-full bg-green-100 mx-auto flex items-center justify-center"
                >
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </motion.div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Conexão realizada!</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Sua conta do <strong>{selectedBank.name}</strong> foi conectada
                    com sucesso. Suas transações serão sincronizadas automaticamente.
                  </p>
                </div>

                <div className="space-y-2">
                  <Button onClick={handleSuccess} className="w-full">
                    Concluir
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default OpenBankingWizard;
